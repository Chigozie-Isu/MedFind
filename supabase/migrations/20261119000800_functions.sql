-- Server functions. Every change to an order's status, a payment, the wallet or a payout goes
-- through these, so a tampered app cannot approve its own order or top up its own wallet.

-- ---------- internal helpers ----------
create function private.notify_customer(p_customer uuid, p_type public.notification_type, p_title text,
  p_body text, p_reservation uuid default null, p_conversation uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (customer_id, type, title, body, reservation_id, conversation_id)
  values (p_customer, p_type, p_title, p_body, p_reservation, p_conversation)
$$;

create function private.notify_pharmacy(p_pharmacy uuid, p_type public.notification_type, p_title text,
  p_body text, p_reservation uuid default null, p_conversation uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (pharmacy_id, type, title, body, reservation_id, conversation_id)
  values (p_pharmacy, p_type, p_title, p_body, p_reservation, p_conversation)
$$;

-- Moves a reservation to a new status, stamps the matching time and writes the history row.
create function private.set_status(p_reservation uuid, p_to public.reservation_status,
  p_actor public.actor_kind, p_staff uuid default null, p_note text default null)
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_from public.reservation_status;
begin
  select * into r from public.reservations where id = p_reservation for update;
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;
  v_from := r.status;
  if not private.can_transition(v_from, p_to) then
    raise exception 'A % reservation cannot become %', v_from, p_to using errcode = 'P0001';
  end if;
  update public.reservations set
    status = p_to,
    approved_at = case when p_to = 'approved' then now() else approved_at end,
    declined_at = case when p_to = 'declined' then now() else declined_at end,
    ready_at = case when p_to in ('ready_for_pickup', 'out_for_delivery') then now() else ready_at end,
    completed_at = case when p_to = 'completed' then now() else completed_at end,
    expired_at = case when p_to = 'expired' then now() else expired_at end,
    cancelled_at = case when p_to = 'cancelled' then now() else cancelled_at end
  where id = p_reservation
  returning * into r;
  insert into public.reservation_status_history (reservation_id, from_status, to_status, actor, actor_staff_id, note)
  values (p_reservation, v_from, p_to, p_actor, p_staff, p_note);
  return r;
end $$;

-- Adds a wallet row. Locks the customer so two payments cannot spend the same naira.
create function private.wallet_post(p_customer uuid, p_amount bigint, p_kind public.wallet_tx_kind,
  p_description text, p_reservation uuid default null, p_payment uuid default null, p_reference text default null)
returns public.wallet_transactions
language plpgsql security definer set search_path = '' as $$
declare
  v_balance bigint;
  w public.wallet_transactions;
begin
  perform 1 from public.customers where id = p_customer for update;
  select balance_kobo into v_balance from public.wallet_balances where customer_id = p_customer;
  if coalesce(v_balance, 0) + p_amount < 0 then
    raise exception 'Not enough money in the wallet' using errcode = 'P0001';
  end if;
  insert into public.wallet_transactions (customer_id, kind, amount_kobo, balance_after_kobo, reservation_id,
    payment_id, paystack_reference, description)
  values (p_customer, p_kind, p_amount, coalesce(v_balance, 0) + p_amount, p_reservation, p_payment, p_reference, p_description)
  returning * into w;
  return w;
end $$;

-- Every refund goes to the customer's MedFind wallet, whatever way they paid.
create function private.refund_reservation(p_reservation uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  p public.payments;
  r public.reservations;
begin
  select * into r from public.reservations where id = p_reservation;
  select * into p from public.payments
   where reservation_id = p_reservation and status in ('pending', 'succeeded') for update;
  if not found then return; end if;
  if p.status = 'succeeded' and p.method <> 'at_pharmacy' then
    update public.payments set status = 'refunded', refunded_at = now() where id = p.id;
    perform private.wallet_post(p.customer_id, p.amount_kobo, 'refund', 'Refund for ' || r.ref_code, p_reservation, p.id);
    perform private.notify_customer(p.customer_id, 'refund_issued', 'Refund added to your wallet',
      'We have added your refund for ' || r.ref_code || ' to your MedFind wallet.', p_reservation);
  else
    -- Nothing was collected (pay at the pharmacy, or an online payment that never completed).
    update public.payments set status = 'failed', failure_reason = 'Reservation ended before payment' where id = p.id;
  end if;
end $$;

-- Puts stock back for an approved order that was never collected.
create function private.restock(p_reservation uuid) returns void
language sql security definer set search_path = '' as $$
  update public.inventory i set quantity_in_stock = i.quantity_in_stock + ri.quantity
  from public.reservation_items ri
  where ri.reservation_id = p_reservation and ri.inventory_id = i.id
$$;

create function private.accepts_new_reservations(p public.pharmacies, p_at timestamptz default now())
returns boolean language plpgsql stable set search_path = '' as $$
declare
  v_local timestamp := p_at at time zone 'Africa/Lagos';
  v_day jsonb := p.opening_hours -> lower(to_char(v_local, 'Dy'));
begin
  if p.open_24_hours then return true; end if;
  if v_day is null then return false; end if;
  return v_local::time >= (v_day ->> 'open')::time
     and v_local::time < (v_day ->> 'close')::time - make_interval(mins => private.rule_stop_reservations_before_close_minutes());
end $$;

create function private.require_staff(p_pharmacy uuid) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v_staff uuid := private.staff_id_in(p_pharmacy);
begin
  if v_staff is null then
    raise exception 'Sign in and enter your staff passcode first' using errcode = '42501';
  end if;
  return v_staff;
end $$;

-- ---------- customer actions ----------
-- p_items: [{"inventory_id": "...", "quantity": 1}, ...]
create function public.place_reservation(p_pharmacy_id uuid, p_fulfilment public.fulfilment,
  p_payment_method public.payment_method, p_items jsonb, p_delivery_address_id uuid default null,
  p_prescription_id uuid default null, p_note text default null)
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  v_customer uuid := auth.uid();
  v_pharmacy public.pharmacies;
  v_address public.addresses;
  v_item jsonb;
  v_inv record;
  v_subtotal bigint := 0;
  v_rx boolean := false;
  v_fee bigint;
  r public.reservations;
  v_payment public.payments;
begin
  if v_customer is null or not exists (select 1 from public.customers where id = v_customer) then
    raise exception 'Sign in as a customer to reserve' using errcode = '42501';
  end if;
  select * into v_pharmacy from public.pharmacies where id = p_pharmacy_id and is_live;
  if not found then raise exception 'Pharmacy not found' using errcode = 'P0002'; end if;
  if not private.accepts_new_reservations(v_pharmacy) then
    raise exception 'This pharmacy is not taking reservations right now' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one medicine' using errcode = '22023';
  end if;

  if p_fulfilment = 'delivery' then
    if not v_pharmacy.offers_delivery then
      raise exception 'This pharmacy does not deliver' using errcode = 'P0001';
    end if;
    select * into v_address from public.addresses where id = p_delivery_address_id and customer_id = v_customer;
    if not found then raise exception 'Choose a delivery address' using errcode = '22023'; end if;
  end if;

  -- Price and check every line before writing anything.
  for v_item in select * from jsonb_array_elements(p_items) loop
    select i.id, i.price_kobo, i.quantity_in_stock, m.id as medicine_id, m.requires_prescription,
           trim(m.brand_name || ' ' || coalesce(m.strength, '')) as name
      into v_inv
      from public.inventory i join public.medicines m on m.id = i.medicine_id
     where i.id = (v_item ->> 'inventory_id')::uuid and i.pharmacy_id = p_pharmacy_id and i.is_listed;
    if not found then raise exception 'A medicine is not available at this pharmacy' using errcode = 'P0002'; end if;
    if (v_item ->> 'quantity')::int < 1 then raise exception 'Quantity must be at least 1' using errcode = '22023'; end if;
    if v_inv.quantity_in_stock < (v_item ->> 'quantity')::int then
      raise exception '% is out of stock', v_inv.name using errcode = 'P0001';
    end if;
    v_subtotal := v_subtotal + v_inv.price_kobo * (v_item ->> 'quantity')::int;
    v_rx := v_rx or v_inv.requires_prescription;
  end loop;

  if v_rx and not exists (select 1 from public.prescriptions where id = p_prescription_id and customer_id = v_customer) then
    raise exception 'Attach a photo of your prescription' using errcode = '22023';
  end if;

  v_fee := case when p_fulfilment = 'delivery' then private.rule_delivery_fee_kobo() else 0 end;

  insert into public.reservations (customer_id, pharmacy_id, fulfilment, kind, payment_method, subtotal_kobo,
    delivery_fee_kobo, service_fee_kobo, total_kobo, delivery_address_id, delivery_address, customer_note,
    prescription_id, approval_deadline)
  values (v_customer, p_pharmacy_id, p_fulfilment, case when v_rx then 'prescription' else 'otc' end::public.order_kind,
    p_payment_method, v_subtotal, v_fee, private.rule_service_fee_kobo(),
    v_subtotal + v_fee + private.rule_service_fee_kobo(),
    v_address.id,
    case when p_fulfilment = 'delivery' then jsonb_build_object('label', v_address.label, 'street', v_address.street,
      'area', v_address.area, 'city', v_address.city, 'state', v_address.state, 'landmark', v_address.landmark,
      'contact_phone', v_address.contact_phone) end,
    p_note, case when v_rx then p_prescription_id end,
    now() + make_interval(mins => private.rule_approval_window_minutes()))
  returning * into r;

  insert into public.reservation_items (reservation_id, medicine_id, inventory_id, medicine_name, quantity, unit_price_kobo)
  select r.id, m.id, i.id, trim(m.brand_name || ' ' || coalesce(m.strength, '')), (e ->> 'quantity')::int, i.price_kobo
    from jsonb_array_elements(p_items) e
    join public.inventory i on i.id = (e ->> 'inventory_id')::uuid
    join public.medicines m on m.id = i.medicine_id;

  insert into public.reservation_status_history (reservation_id, from_status, to_status, actor)
  values (r.id, null, 'pending', 'customer');

  insert into public.payments (reservation_id, customer_id, method, amount_kobo, status, paid_at)
  values (r.id, v_customer, p_payment_method, r.total_kobo,
    case when p_payment_method = 'wallet' then 'succeeded' else 'pending' end::public.payment_status,
    case when p_payment_method = 'wallet' then now() end)
  returning * into v_payment;
  if p_payment_method = 'wallet' then
    perform private.wallet_post(v_customer, -r.total_kobo, 'payment', 'Payment for ' || r.ref_code, r.id, v_payment.id);
  end if;

  perform private.notify_pharmacy(p_pharmacy_id, 'new_reservation', 'New reservation ' || r.ref_code,
    'Reply within ' || private.rule_approval_window_minutes() || ' minutes.', r.id);
  return r;
end $$;

create function public.cancel_reservation(p_reservation_id uuid) returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare r public.reservations;
begin
  select * into r from public.reservations where id = p_reservation_id and customer_id = auth.uid();
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;
  r := private.set_status(r.id, 'cancelled', 'customer');
  perform private.refund_reservation(r.id);
  perform private.notify_pharmacy(r.pharmacy_id, 'reservation_cancelled', r.ref_code || ' was cancelled',
    'The customer cancelled before you replied.', r.id);
  return r;
end $$;

-- ---------- staff actions ----------
create function public.unlock_staff(p_pharmacy_id uuid, p_passcode text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  s public.pharmacy_staff;
  v_session uuid := private.current_session_id();
begin
  select * into s from public.pharmacy_staff
   where pharmacy_id = p_pharmacy_id and user_id = auth.uid() and is_active for update;
  if not found or v_session is null then
    raise exception 'You are not staff at this pharmacy' using errcode = '42501';
  end if;
  if s.locked_until is not null and s.locked_until > now() then
    raise exception 'Too many wrong passcodes. Try again in 15 minutes' using errcode = '42501';
  end if;
  if s.passcode_hash is null or s.passcode_hash <> extensions.crypt(p_passcode, s.passcode_hash) then
    update public.pharmacy_staff set
      failed_passcode_attempts = case when failed_passcode_attempts + 1 >= 5 then 0 else failed_passcode_attempts + 1 end,
      locked_until = case when failed_passcode_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end
    where id = s.id;
    return null;
  end if;
  update public.pharmacy_staff set failed_passcode_attempts = 0, locked_until = null where id = s.id;
  insert into public.staff_sessions (staff_id, auth_session_id) values (s.id, v_session)
  on conflict (staff_id, auth_session_id) do update set unlocked_at = now();
  return s.id;
end $$;

create function public.lock_staff(p_pharmacy_id uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.staff_sessions ss using public.pharmacy_staff s
  where ss.staff_id = s.id and s.pharmacy_id = p_pharmacy_id and s.user_id = auth.uid()
    and ss.auth_session_id = private.current_session_id()
$$;

-- Owners and managers create a new 5-digit code for a staff member. Returned once, stored only as a hash.
create function public.create_staff_passcode(p_staff_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  s public.pharmacy_staff;
  v_code text := lpad(floor(random() * 100000)::int::text, private.rule_staff_passcode_length(), '0');
begin
  select * into s from public.pharmacy_staff where id = p_staff_id;
  if not found or not private.is_manager_of(s.pharmacy_id) then
    raise exception 'Only owners and managers can create staff codes' using errcode = '42501';
  end if;
  update public.pharmacy_staff set passcode_hash = extensions.crypt(v_code, extensions.gen_salt('bf')),
    failed_passcode_attempts = 0, locked_until = null where id = p_staff_id;
  -- The old code stops working everywhere, except for the manager who is creating it.
  delete from public.staff_sessions where staff_id = p_staff_id and staff_id <> private.staff_id_in(s.pharmacy_id);
  return v_code;
end $$;

create function public.clock_in(p_pharmacy_id uuid) returns public.shifts
language plpgsql security definer set search_path = '' as $$
declare
  v_staff uuid := private.require_staff(p_pharmacy_id);
  sh public.shifts;
begin
  if exists (select 1 from public.shifts where staff_id = v_staff and clock_out_at is null) then
    raise exception 'You are already clocked in' using errcode = 'P0001';
  end if;
  insert into public.shifts (pharmacy_id, staff_id) values (p_pharmacy_id, v_staff) returning * into sh;
  return sh;
end $$;

create function public.clock_out(p_pharmacy_id uuid) returns public.shifts
language plpgsql security definer set search_path = '' as $$
declare
  v_staff uuid := private.require_staff(p_pharmacy_id);
  sh public.shifts;
begin
  update public.shifts set clock_out_at = now() where staff_id = v_staff and clock_out_at is null returning * into sh;
  if not found then raise exception 'You are not clocked in' using errcode = 'P0001'; end if;
  return sh;
end $$;

create function public.set_prescription_check(p_reservation_id uuid, p_check public.prescription_check,
  p_ticked boolean default true) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_staff uuid;
begin
  select * into r from public.reservations where id = p_reservation_id;
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;
  v_staff := private.require_staff(r.pharmacy_id);
  if private.staff_role_in(r.pharmacy_id) = 'assistant' then
    raise exception 'Only a pharmacist can tick prescription checks' using errcode = '42501';
  end if;
  if r.kind <> 'prescription' or r.status <> 'pending' then
    raise exception 'Checks only apply to waiting prescription orders' using errcode = 'P0001';
  end if;
  if p_ticked then
    insert into public.prescription_checks (reservation_id, "check", checked_by_staff_id)
    values (r.id, p_check, v_staff) on conflict do nothing;
  else
    delete from public.prescription_checks where reservation_id = r.id and "check" = p_check;
  end if;
end $$;

create function public.approve_reservation(p_reservation_id uuid) returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_staff uuid;
  v_short text;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;
  v_staff := private.require_staff(r.pharmacy_id);
  if r.status = 'pending' and now() > r.approval_deadline then
    raise exception 'The 10 minutes to reply have passed' using errcode = 'P0001';
  end if;
  if r.kind = 'prescription' then
    if private.staff_role_in(r.pharmacy_id) = 'assistant' then
      raise exception 'Only a pharmacist can approve prescription orders' using errcode = '42501';
    end if;
    if (select count(*) from public.prescription_checks where reservation_id = r.id) < 4 then
      raise exception 'Tick all 4 checks before approving' using errcode = 'P0001';
    end if;
  end if;
  if r.payment_method in ('card', 'bank_transfer') and not exists (
      select 1 from public.payments where reservation_id = r.id and status = 'succeeded') then
    raise exception 'The customer has not finished paying yet' using errcode = 'P0001';
  end if;

  select string_agg(ri.medicine_name, ', ') into v_short
    from public.reservation_items ri left join public.inventory i on i.id = ri.inventory_id
   where ri.reservation_id = r.id and (i.id is null or i.quantity_in_stock < ri.quantity);
  if v_short is not null then
    raise exception 'Not enough stock: %', v_short using errcode = 'P0001';
  end if;
  update public.inventory i set quantity_in_stock = i.quantity_in_stock - ri.quantity
    from public.reservation_items ri where ri.reservation_id = r.id and ri.inventory_id = i.id;

  update public.reservations set approved_by_staff_id = v_staff,
    pickup_code = lpad(floor(random() * 1000000)::int::text, private.rule_pickup_code_length(), '0')
  where id = r.id;
  r := private.set_status(r.id, 'approved', 'staff', v_staff);
  perform private.notify_customer(r.customer_id, 'reservation_approved', r.ref_code || ' is confirmed',
    'The pharmacy has approved your reservation.', r.id);
  return r;
end $$;

create function public.decline_reservation(p_reservation_id uuid, p_reason text) returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_staff uuid;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;
  v_staff := private.require_staff(r.pharmacy_id);
  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Give the customer a reason for declining' using errcode = '22023';
  end if;
  update public.reservations set decline_reason = trim(p_reason), declined_by_staff_id = v_staff where id = r.id;
  r := private.set_status(r.id, 'declined', 'staff', v_staff, trim(p_reason));
  perform private.refund_reservation(r.id);
  perform private.notify_customer(r.customer_id, 'reservation_declined', r.ref_code || ' was declined',
    trim(p_reason), r.id);
  return r;
end $$;

-- Pickup: ready at the counter (starts the 2-hour pickup window). Delivery: handed to the rider.
create function public.mark_ready(p_reservation_id uuid, p_rider_name text default null, p_rider_phone text default null)
returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_staff uuid;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;
  v_staff := private.require_staff(r.pharmacy_id);
  if r.fulfilment = 'pickup' then
    update public.reservations set pickup_deadline = now() + make_interval(mins => private.rule_pickup_window_minutes())
     where id = r.id;
    r := private.set_status(r.id, 'ready_for_pickup', 'staff', v_staff);
    perform private.notify_customer(r.customer_id, 'reservation_ready', r.ref_code || ' is ready to collect',
      'Show your pickup code at the counter.', r.id);
  else
    update public.reservations set rider_name = p_rider_name, rider_phone = p_rider_phone, handed_to_rider_at = now()
     where id = r.id;
    r := private.set_status(r.id, 'out_for_delivery', 'staff', v_staff);
    perform private.notify_customer(r.customer_id, 'out_for_delivery', r.ref_code || ' is on its way',
      coalesce(p_rider_name, 'Your rider') || ' is bringing your order.', r.id);
  end if;
  return r;
end $$;

create function private.complete(r public.reservations, p_staff uuid) returns public.reservations
language plpgsql security definer set search_path = '' as $$
begin
  update public.payments set status = 'succeeded', paid_at = now()
   where reservation_id = r.id and method = 'at_pharmacy' and status = 'pending';
  update public.reservations set commission_kobo = private.commission_kobo(subtotal_kobo), completed_by_staff_id = p_staff
   where id = r.id;
  r := private.set_status(r.id, 'completed', 'staff', p_staff);
  perform private.notify_customer(r.customer_id, 'reservation_completed', 'How was ' || r.ref_code || '?',
    'Rate the pharmacy and save your medicine for an easy refill.', r.id);
  return r;
end $$;

create function public.complete_pickup(p_reservation_id uuid, p_pickup_code text) returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_staff uuid;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;
  v_staff := private.require_staff(r.pharmacy_id);
  if r.status <> 'ready_for_pickup' then raise exception 'This order is not ready for pickup' using errcode = 'P0001'; end if;
  if r.pickup_code is distinct from trim(p_pickup_code) then
    raise exception 'That pickup code does not match' using errcode = 'P0001';
  end if;
  return private.complete(r, v_staff);
end $$;

create function public.complete_delivery(p_reservation_id uuid) returns public.reservations
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_staff uuid;
begin
  select * into r from public.reservations where id = p_reservation_id for update;
  if not found then raise exception 'Reservation not found' using errcode = 'P0002'; end if;
  v_staff := private.require_staff(r.pharmacy_id);
  if r.status <> 'out_for_delivery' then raise exception 'This order is not out for delivery' using errcode = 'P0001'; end if;
  return private.complete(r, v_staff);
end $$;

-- ---------- search ----------
create function public.nearby_pharmacies(p_lat double precision, p_lng double precision,
  p_radius_km double precision default 10, p_medicine_id uuid default null)
returns table (pharmacy_id uuid, name text, area text, distance_km double precision, open_24_hours boolean,
  offers_delivery boolean, inventory_id uuid, price_kobo bigint, in_stock boolean, average_stars numeric)
language sql stable security invoker set search_path = '' as $$
  select p.id, p.name, p.area,
         round((extensions.st_distance(p.location, extensions.st_makepoint(p_lng, p_lat)::extensions.geography) / 1000)::numeric, 1)::double precision,
         p.open_24_hours, p.offers_delivery, i.id, i.price_kobo, coalesce(i.quantity_in_stock > 0, false), s.average_stars
  from public.pharmacies p
  left join public.inventory i on p_medicine_id is not null and i.pharmacy_id = p.id and i.medicine_id = p_medicine_id and i.is_listed
  left join public.pharmacy_rating_summary s on s.pharmacy_id = p.id
  where p.is_live
    and extensions.st_dwithin(p.location, extensions.st_makepoint(p_lng, p_lat)::extensions.geography, p_radius_km * 1000)
    and (p_medicine_id is null or i.id is not null)
  order by 4
$$;

-- ---------- Paystack and scheduled jobs (service role only) ----------
create function public.record_wallet_top_up(p_customer_id uuid, p_amount_kobo bigint, p_paystack_reference text)
returns public.wallet_transactions
language plpgsql security definer set search_path = '' as $$
declare w public.wallet_transactions;
begin
  select * into w from public.wallet_transactions where paystack_reference = p_paystack_reference;
  if found then return w; end if; -- Paystack may send the same webhook twice.
  return private.wallet_post(p_customer_id, p_amount_kobo, 'top_up', 'Wallet top-up', null, null, p_paystack_reference);
end $$;

create function public.mark_payment_succeeded(p_payment_id uuid, p_paystack_reference text) returns public.payments
language plpgsql security definer set search_path = '' as $$
declare p public.payments;
begin
  update public.payments set status = 'succeeded', paid_at = now(), paystack_reference = p_paystack_reference
   where id = p_payment_id and status = 'pending' and method in ('card', 'bank_transfer')
  returning * into p;
  if not found then select * into p from public.payments where id = p_payment_id; end if;
  -- Paid after the reservation already ended: send the money straight to the wallet.
  if p.status = 'succeeded' and exists (select 1 from public.reservations r where r.id = p.reservation_id
       and r.status in ('expired', 'declined', 'cancelled')) then
    perform private.refund_reservation(p.reservation_id);
    select * into p from public.payments where id = p_payment_id;
  end if;
  return p;
end $$;

create function public.mark_payment_failed(p_payment_id uuid, p_reason text) returns public.payments
language sql security definer set search_path = '' as $$
  update public.payments set status = 'failed', failure_reason = p_reason
  where id = p_payment_id and status = 'pending' returning *
$$;

-- Runs every minute: unanswered orders past 10 minutes, and uncollected pickups past their deadline.
create function public.expire_overdue_reservations() returns int
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_count int := 0;
begin
  for r in select * from public.reservations
           where (status = 'pending' and approval_deadline < now())
              or (status = 'ready_for_pickup' and pickup_deadline < now())
           for update skip locked loop
    if r.status = 'ready_for_pickup' then perform private.restock(r.id); end if;
    perform private.set_status(r.id, 'expired', 'system', null,
      case when r.status = 'pending' then 'No reply within 10 minutes' else 'Not collected in time' end);
    perform private.refund_reservation(r.id);
    perform private.notify_customer(r.customer_id, 'reservation_expired', r.ref_code || ' has expired',
      case when r.status = 'pending' then 'The pharmacy did not reply in time.' else 'It was not collected in time.' end, r.id);
    perform private.notify_pharmacy(r.pharmacy_id, 'reservation_expired', r.ref_code || ' has expired', '', r.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- Runs every minute: warns customers at 30 and 15 minutes left to collect.
create function public.send_pickup_warnings() returns int
language plpgsql security definer set search_path = '' as $$
declare
  r public.reservations;
  v_count int := 0;
begin
  for r in select * from public.reservations
           where status = 'ready_for_pickup' and pickup_deadline > now()
             and ((pickup_warned_30_at is null and pickup_deadline - now() <= interval '30 minutes')
               or (pickup_warned_15_at is null and pickup_deadline - now() <= interval '15 minutes'))
           for update skip locked loop
    if r.pickup_deadline - now() <= interval '15 minutes' and r.pickup_warned_15_at is null then
      update public.reservations set pickup_warned_15_at = now(), pickup_warned_30_at = coalesce(pickup_warned_30_at, now())
       where id = r.id;
      perform private.notify_customer(r.customer_id, 'pickup_15_min_left', '15 minutes left to collect ' || r.ref_code,
        'Collect it soon or it will expire and be refunded.', r.id);
    else
      update public.reservations set pickup_warned_30_at = now() where id = r.id;
      perform private.notify_customer(r.customer_id, 'pickup_30_min_left', '30 minutes left to collect ' || r.ref_code,
        'Your order is waiting at the pharmacy.', r.id);
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

create function private.is_payout_day(p_date date) returns boolean
language sql immutable as $$
  select p_date >= private.rule_payout_anchor_friday()
     and (p_date - private.rule_payout_anchor_friday()) % private.rule_payout_interval_days() = 0
$$;

-- Runs every Friday; only does anything on payout Fridays (every second Friday).
create function public.generate_payouts(p_date date default (now() at time zone 'Africa/Lagos')::date) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_cutoff timestamptz := p_date::timestamp at time zone 'Africa/Lagos';
  v_row record;
  v_payout uuid;
  v_count int := 0;
begin
  if not private.is_payout_day(p_date) then return 0; end if;
  for v_row in
    select r.pharmacy_id,
           count(*)::int as orders,
           coalesce(sum(r.subtotal_kobo) filter (where r.payment_method <> 'at_pharmacy'), 0) as online,
           coalesce(sum(r.subtotal_kobo) filter (where r.payment_method = 'at_pharmacy'), 0) as counter,
           sum(r.commission_kobo) as commission
    from public.reservations r
    where r.status = 'completed' and r.payout_id is null and r.completed_at < v_cutoff
    group by r.pharmacy_id
  loop
    insert into public.payouts (pharmacy_id, period_start, period_end, scheduled_for, order_count,
      online_sales_kobo, counter_sales_kobo, commission_kobo, net_kobo, status)
    values (v_row.pharmacy_id, p_date - private.rule_payout_interval_days(), p_date - 1, p_date, v_row.orders,
      v_row.online, v_row.counter, v_row.commission, v_row.online - v_row.commission,
      case when v_row.online - v_row.commission < 0 then 'pharmacy_owes' else 'scheduled' end::public.payout_status)
    on conflict (pharmacy_id, scheduled_for) do nothing
    returning id into v_payout;
    if v_payout is not null then
      update public.reservations set payout_id = v_payout
       where pharmacy_id = v_row.pharmacy_id and status = 'completed' and payout_id is null and completed_at < v_cutoff;
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end $$;

create function public.mark_payout_paid(p_payout_id uuid, p_transfer_reference text) returns public.payouts
language plpgsql security definer set search_path = '' as $$
declare po public.payouts;
begin
  update public.payouts set status = 'paid', paid_at = now(), paystack_transfer_reference = p_transfer_reference
   where id = p_payout_id and status in ('scheduled', 'processing') returning * into po;
  if found then
    perform private.notify_pharmacy(po.pharmacy_id, 'payout_sent', 'Payout sent',
      'Your payout for ' || to_char(po.period_start, 'DD Mon') || ' to ' || to_char(po.period_end, 'DD Mon') || ' is on its way.');
  end if;
  return po;
end $$;

-- ---------- triggers ----------
create function private.on_message_inserted() returns trigger
language plpgsql security definer set search_path = '' as $$
declare c public.conversations;
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id returning * into c;
  if new.sender = 'customer' then
    perform private.notify_pharmacy(c.pharmacy_id, 'new_message', 'New MedChat message',
      coalesce(left(new.body, 120), 'Photo'), c.reservation_id, c.id);
  else
    perform private.notify_customer(c.customer_id, 'new_message', 'New MedChat message',
      coalesce(left(new.body, 120), 'Photo'), c.reservation_id, c.id);
  end if;
  return new;
end $$;
create trigger messages_after_insert after insert on public.messages
for each row execute function private.on_message_inserted();

create function private.on_inventory_low() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if new.quantity_in_stock <= new.low_stock_threshold and old.quantity_in_stock > old.low_stock_threshold then
    select brand_name || coalesce(' ' || strength, '') into v_name from public.medicines where id = new.medicine_id;
    perform private.notify_pharmacy(new.pharmacy_id, 'low_stock', v_name || ' is running low',
      new.quantity_in_stock || ' left in stock.');
  end if;
  return new;
end $$;
create trigger inventory_low_stock after update of quantity_in_stock on public.inventory
for each row execute function private.on_inventory_low();

-- ---------- who may call what ----------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.place_reservation, public.cancel_reservation, public.unlock_staff,
  public.lock_staff, public.create_staff_passcode, public.clock_in, public.clock_out,
  public.set_prescription_check, public.approve_reservation, public.decline_reservation, public.mark_ready,
  public.complete_pickup, public.complete_delivery to authenticated;
grant execute on function public.nearby_pharmacies to anon, authenticated;
grant execute on function public.record_wallet_top_up, public.mark_payment_succeeded, public.mark_payment_failed,
  public.expire_overdue_reservations, public.send_pickup_warnings, public.generate_payouts,
  public.mark_payout_paid to service_role;
-- Internal helpers stay internal; only the RLS helpers granted in the security migration remain callable.
revoke execute on all functions in schema private from public;
