-- Row-level security: customers see only their own data, staff only their own pharmacy's
-- (and only after their passcode has matched in this sign-in session), and the catalogue is public.

-- ---------- helpers ----------
create function private.current_session_id() returns uuid
language sql stable as $$
  select nullif(auth.jwt() ->> 'session_id', '')::uuid
$$;

-- The caller's staff row at a pharmacy, only if active and unlocked with their passcode this session.
create function private.staff_id_in(p_pharmacy uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select s.id
  from public.pharmacy_staff s
  join public.staff_sessions ss on ss.staff_id = s.id and ss.auth_session_id = private.current_session_id()
  where s.pharmacy_id = p_pharmacy and s.user_id = auth.uid() and s.is_active
  limit 1
$$;

create function private.staff_role_in(p_pharmacy uuid) returns public.staff_role
language sql stable security definer set search_path = '' as $$
  select s.role from public.pharmacy_staff s where s.id = private.staff_id_in(p_pharmacy)
$$;

create function private.is_staff_of(p_pharmacy uuid) returns boolean
language sql stable as $$ select private.staff_id_in(p_pharmacy) is not null $$;

create function private.is_manager_of(p_pharmacy uuid) returns boolean
language sql stable as $$ select coalesce(private.staff_role_in(p_pharmacy) in ('owner', 'manager'), false) $$;

-- Pharmacies where the caller is unlocked staff.
create function private.my_pharmacy_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select s.pharmacy_id
  from public.pharmacy_staff s
  join public.staff_sessions ss on ss.staff_id = s.id and ss.auth_session_id = private.current_session_id()
  where s.user_id = auth.uid() and s.is_active
$$;

create function private.my_reservation_ids_as_staff() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select r.id from public.reservations r where r.pharmacy_id in (select private.my_pharmacy_ids())
$$;

-- RLS policies call these helpers for every visitor, signed in or not.
grant usage on schema private to anon;
grant execute on function private.current_session_id, private.staff_id_in, private.staff_role_in,
  private.is_staff_of, private.is_manager_of, private.my_pharmacy_ids, private.my_reservation_ids_as_staff
  to anon, authenticated;

-- ---------- turn RLS on everywhere ----------
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.pharmacies enable row level security;
alter table public.pharmacy_payout_accounts enable row level security;
alter table public.pharmacy_staff enable row level security;
alter table public.staff_sessions enable row level security;
alter table public.shifts enable row level security;
alter table public.medicines enable row level security;
alter table public.tags enable row level security;
alter table public.medicine_tags enable row level security;
alter table public.medicine_photos enable row level security;
alter table public.inventory enable row level security;
alter table public.prescriptions enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_items enable row level security;
alter table public.reservation_status_history enable row level security;
alter table public.prescription_checks enable row level security;
alter table public.payments enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payouts enable row level security;
alter table public.ratings enable row level security;
alter table public.saved_medicines enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Start from nothing, then grant only what each role needs. Server functions do the rest.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.pharmacies, public.medicines, public.tags, public.medicine_tags,
  public.medicine_photos, public.inventory, public.pharmacy_rating_summary to anon, authenticated;
grant select on public.customers, public.addresses, public.pharmacy_payout_accounts, public.shifts,
  public.prescriptions, public.reservations, public.reservation_items, public.reservation_status_history,
  public.prescription_checks, public.payments, public.wallet_transactions, public.wallet_balances,
  public.payouts, public.ratings, public.saved_medicines, public.conversations, public.messages,
  public.notifications to authenticated;
-- The passcode hash and lockout counters are never readable.
grant select (id, pharmacy_id, user_id, full_name, email, role, is_active, created_at, updated_at)
  on public.pharmacy_staff to authenticated;

grant update (full_name, phone, avatar_path, appearance) on public.customers to authenticated;
grant insert, update, delete on public.addresses to authenticated;
grant update (name, street, area, city, state, location, phone, email, pharmacist_in_charge,
  opening_hours, open_24_hours, offers_delivery, services) on public.pharmacies to authenticated;
grant insert, update, delete on public.pharmacy_payout_accounts to authenticated;
grant update (full_name, role, is_active) on public.pharmacy_staff to authenticated;
grant update (clock_in_at, clock_out_at) on public.shifts to authenticated;
grant insert on public.inventory to authenticated;
grant update (price_kobo, quantity_in_stock, low_stock_threshold, expiry_date, is_listed) on public.inventory to authenticated;
grant insert (customer_id, storage_path, patient_name, patient_age_years, prescriber_name) on public.prescriptions to authenticated;
grant insert (reservation_id, customer_id, pharmacy_id, stars, comment) on public.ratings to authenticated;
grant insert, update, delete on public.saved_medicines to authenticated;
grant insert (customer_id, pharmacy_id, reservation_id) on public.conversations to authenticated;
grant insert (conversation_id, sender, sender_staff_id, body, attachment_path) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------- customers and addresses ----------
create policy "customers read self" on public.customers for select to authenticated
  using (id = (select auth.uid()));
create policy "staff read their customers" on public.customers for select to authenticated
  using (exists (select 1 from public.reservations r where r.customer_id = customers.id
                   and r.pharmacy_id in (select private.my_pharmacy_ids()))
      or exists (select 1 from public.conversations c where c.customer_id = customers.id
                   and c.pharmacy_id in (select private.my_pharmacy_ids())));
create policy "customers update self" on public.customers for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "customers manage own addresses" on public.addresses for all to authenticated
  using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));

-- ---------- pharmacies and staff ----------
create policy "anyone reads live pharmacies" on public.pharmacies for select to anon, authenticated
  using (is_live or id in (select private.my_pharmacy_ids()));
create policy "managers update their pharmacy" on public.pharmacies for update to authenticated
  using (private.is_manager_of(id)) with check (private.is_manager_of(id));

create policy "managers manage payout account" on public.pharmacy_payout_accounts for all to authenticated
  using (private.is_manager_of(pharmacy_id)) with check (private.is_manager_of(pharmacy_id));

-- Staff can always see their own row (to show the passcode screen); unlocked staff see colleagues.
create policy "staff read self" on public.pharmacy_staff for select to authenticated
  using (user_id = (select auth.uid()));
create policy "staff read colleagues" on public.pharmacy_staff for select to authenticated
  using (pharmacy_id in (select private.my_pharmacy_ids()));
create policy "managers update staff" on public.pharmacy_staff for update to authenticated
  using (private.is_manager_of(pharmacy_id)) with check (private.is_manager_of(pharmacy_id));

create policy "staff read own pharmacy shifts" on public.shifts for select to authenticated
  using (pharmacy_id in (select private.my_pharmacy_ids()));
create policy "managers correct shifts" on public.shifts for update to authenticated
  using (private.is_manager_of(pharmacy_id)) with check (private.is_manager_of(pharmacy_id));

-- ---------- catalogue and stock ----------
create policy "anyone reads medicines" on public.medicines for select to anon, authenticated using (true);
create policy "anyone reads tags" on public.tags for select to anon, authenticated using (true);
create policy "anyone reads medicine tags" on public.medicine_tags for select to anon, authenticated using (true);
create policy "anyone reads medicine photos" on public.medicine_photos for select to anon, authenticated using (true);

create policy "anyone reads listed stock at live pharmacies" on public.inventory for select to anon, authenticated
  using ((is_listed and exists (select 1 from public.pharmacies p where p.id = inventory.pharmacy_id and p.is_live))
         or pharmacy_id in (select private.my_pharmacy_ids()));
create policy "staff add stock" on public.inventory for insert to authenticated
  with check (pharmacy_id in (select private.my_pharmacy_ids()));
create policy "staff update stock" on public.inventory for update to authenticated
  using (pharmacy_id in (select private.my_pharmacy_ids()))
  with check (pharmacy_id in (select private.my_pharmacy_ids()));

-- ---------- prescriptions and reservations ----------
create policy "customers read own prescriptions" on public.prescriptions for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "customers upload prescriptions" on public.prescriptions for insert to authenticated
  with check (customer_id = (select auth.uid()));
create policy "staff read prescriptions for their orders" on public.prescriptions for select to authenticated
  using (exists (select 1 from public.reservations r where r.prescription_id = prescriptions.id
                   and r.pharmacy_id in (select private.my_pharmacy_ids())));

create policy "customers read own reservations" on public.reservations for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "staff read their pharmacy reservations" on public.reservations for select to authenticated
  using (pharmacy_id in (select private.my_pharmacy_ids()));

create policy "read items of visible reservations" on public.reservation_items for select to authenticated
  using (exists (select 1 from public.reservations r where r.id = reservation_items.reservation_id
                   and (r.customer_id = (select auth.uid()) or r.pharmacy_id in (select private.my_pharmacy_ids()))));
create policy "read history of visible reservations" on public.reservation_status_history for select to authenticated
  using (exists (select 1 from public.reservations r where r.id = reservation_status_history.reservation_id
                   and (r.customer_id = (select auth.uid()) or r.pharmacy_id in (select private.my_pharmacy_ids()))));
create policy "read checks of visible reservations" on public.prescription_checks for select to authenticated
  using (exists (select 1 from public.reservations r where r.id = prescription_checks.reservation_id
                   and (r.customer_id = (select auth.uid()) or r.pharmacy_id in (select private.my_pharmacy_ids()))));

-- ---------- money ----------
create policy "customers read own payments" on public.payments for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "staff read payments for their orders" on public.payments for select to authenticated
  using (reservation_id in (select private.my_reservation_ids_as_staff()));
create policy "customers read own wallet" on public.wallet_transactions for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "managers read payouts" on public.payouts for select to authenticated
  using (private.is_manager_of(pharmacy_id));

-- ---------- ratings, saved medicines ----------
create policy "customers read own ratings" on public.ratings for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "staff read their ratings" on public.ratings for select to authenticated
  using (pharmacy_id in (select private.my_pharmacy_ids()));
create policy "customers rate completed orders" on public.ratings for insert to authenticated
  with check (customer_id = (select auth.uid()) and exists (
    select 1 from public.reservations r where r.id = ratings.reservation_id
      and r.customer_id = (select auth.uid()) and r.pharmacy_id = ratings.pharmacy_id and r.status = 'completed'));

create policy "customers manage saved medicines" on public.saved_medicines for all to authenticated
  using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));

-- ---------- MedChat ----------
create policy "customers read own conversations" on public.conversations for select to authenticated
  using (customer_id = (select auth.uid()));
create policy "staff read their conversations" on public.conversations for select to authenticated
  using (pharmacy_id in (select private.my_pharmacy_ids()));
create policy "customers start conversations" on public.conversations for insert to authenticated
  with check (customer_id = (select auth.uid())
    and (reservation_id is null or exists (select 1 from public.reservations r
         where r.id = conversations.reservation_id and r.customer_id = (select auth.uid())
           and r.pharmacy_id = conversations.pharmacy_id)));

create policy "participants read messages" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = messages.conversation_id
                   and (c.customer_id = (select auth.uid()) or c.pharmacy_id in (select private.my_pharmacy_ids()))));
create policy "customers send messages" on public.messages for insert to authenticated
  with check (sender = 'customer' and sender_staff_id is null and exists (
    select 1 from public.conversations c where c.id = messages.conversation_id and c.customer_id = (select auth.uid())));
create policy "staff send messages" on public.messages for insert to authenticated
  with check (sender = 'staff' and exists (
    select 1 from public.conversations c where c.id = messages.conversation_id
      and sender_staff_id = private.staff_id_in(c.pharmacy_id)));
create policy "participants mark messages read" on public.messages for update to authenticated
  using (exists (select 1 from public.conversations c where c.id = messages.conversation_id
                   and ((messages.sender = 'staff' and c.customer_id = (select auth.uid()))
                     or (messages.sender = 'customer' and c.pharmacy_id in (select private.my_pharmacy_ids())))));

-- ---------- notifications ----------
create policy "read own notifications" on public.notifications for select to authenticated
  using (customer_id = (select auth.uid()) or pharmacy_id in (select private.my_pharmacy_ids()));
create policy "mark own notifications read" on public.notifications for update to authenticated
  using (customer_id = (select auth.uid()) or pharmacy_id in (select private.my_pharmacy_ids()));
