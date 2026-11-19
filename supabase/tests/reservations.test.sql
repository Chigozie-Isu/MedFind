-- Reservation rules: totals, the 4 checks, decline reasons, expiry, refunds to the wallet, commission.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(19);

create function pg_temp.as_user(p_user uuid, p_session uuid default '00000000-0000-4000-8000-0000000000aa') returns void
language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated', 'session_id', p_session)::text, true);
$$;
create function pg_temp.as_admin() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;
create function pg_temp.inv(p_pharmacy uuid, p_brand text) returns uuid language sql as $$
  select i.id from inventory i join medicines m on m.id = i.medicine_id where i.pharmacy_id = p_pharmacy and m.brand_name = p_brand
$$;
create function pg_temp.balance(p_customer uuid) returns bigint language sql security definer as $$
  select balance_kobo from public.wallet_balances where customer_id = p_customer
$$;

-- Caduces (a1..02) is open 24 hours, so these tests do not depend on the time of day.
create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;

-- ---------- totals ----------
select pg_temp.as_user('c0000000-0000-4000-8000-000000000002'); -- Chinedu
insert into ids select 'delivery', (place_reservation('a1000000-0000-4000-8000-000000000002', 'delivery', 'wallet',
  jsonb_build_array(jsonb_build_object('inventory_id', pg_temp.inv('a1000000-0000-4000-8000-000000000002', 'Coartem'), 'quantity', 1)),
  'ad000000-0000-4000-8000-000000000003')).id;
select is((select total_kobo - subtotal_kobo from reservations where id = (select id from ids where name = 'delivery')), 100000::bigint,
  'delivery adds NGN 1,000 and nothing else');
select is((select approval_deadline - placed_at from reservations where id = (select id from ids where name = 'delivery')), interval '10 minutes',
  'the pharmacy has 10 minutes to reply');
select is((select status::text from payments where reservation_id = (select id from ids where name = 'delivery')), 'succeeded',
  'wallet payments are taken straight away');
select throws_ok($$ select place_reservation('a1000000-0000-4000-8000-000000000002', 'pickup', 'wallet',
  jsonb_build_array(jsonb_build_object('inventory_id', pg_temp.inv('a1000000-0000-4000-8000-000000000002', 'Amoxil'), 'quantity', 1))) $$,
  '22023', 'Attach a photo of your prescription', 'prescription medicines need a prescription photo');
select throws_ok($$ select place_reservation('a1000000-0000-4000-8000-000000000002', 'pickup', 'wallet',
  jsonb_build_array(jsonb_build_object('inventory_id', pg_temp.inv('a1000000-0000-4000-8000-000000000002', 'Coartem'), 'quantity', 1000))) $$,
  'P0001', null, 'cannot reserve more than the pharmacy has');

-- ---------- prescription order: checks ----------
select pg_temp.as_user('c0000000-0000-4000-8000-000000000002'); -- Chinedu
insert into ids select 'rx', (place_reservation('a1000000-0000-4000-8000-000000000002', 'pickup', 'at_pharmacy',
  jsonb_build_array(jsonb_build_object('inventory_id', pg_temp.inv('a1000000-0000-4000-8000-000000000002', 'Amoxil'), 'quantity', 1)),
  null, 'e0000000-0000-4000-8000-000000000002')).id;
select is((select kind::text from reservations where id = (select id from ids where name = 'rx')), 'prescription', 'order with Amoxil is a prescription order');

select pg_temp.as_user('b0000000-0000-4000-8000-000000000023'); -- Caduces assistant
select unlock_staff('a1000000-0000-4000-8000-000000000002', '12003');
select throws_ok($$ select set_prescription_check((select id from ids where name = 'rx'), 'medicine_and_dosage') $$, '42501', null,
  'assistants cannot tick prescription checks');

select pg_temp.as_user('b0000000-0000-4000-8000-000000000022'); -- Caduces pharmacist
select unlock_staff('a1000000-0000-4000-8000-000000000002', '12002');
select set_prescription_check((select id from ids where name = 'rx'), 'medicine_and_dosage');
select set_prescription_check((select id from ids where name = 'rx'), 'patient_name_and_age');
select set_prescription_check((select id from ids where name = 'rx'), 'prescriber_name_and_signature');
select throws_ok($$ select approve_reservation((select id from ids where name = 'rx')) $$, 'P0001', 'Tick all 4 checks before approving',
  'approve stays locked with 3 of 4 checks');
select set_prescription_check((select id from ids where name = 'rx'), 'dose_suits_patient_age');
select is((approve_reservation((select id from ids where name = 'rx'))).status::text, 'approved', 'approve unlocks once all 4 are ticked');
select ok((select pickup_code ~ '^\d{6}$' from reservations where id = (select id from ids where name = 'rx')), 'approval creates a 6-digit pickup code');
select is((mark_ready((select id from ids where name = 'rx'))).pickup_deadline - now(), interval '2 hours', 'pickup window is 2 hours');
select throws_ok($$ select complete_pickup((select id from ids where name = 'rx'), '000000x') $$, 'P0001', 'That pickup code does not match',
  'wrong pickup code is refused');
select is((complete_pickup((select id from ids where name = 'rx'), (select pickup_code from reservations where id = (select id from ids where name = 'rx')))).status::text,
  'completed', 'right pickup code completes the order');
select is((select commission_kobo from reservations where id = (select id from ids where name = 'rx')),
  (select (subtotal_kobo * 500 + 5000) / 10000 from reservations where id = (select id from ids where name = 'rx')), 'MedFind keeps 5% of the subtotal');
select is((select status::text from payments where reservation_id = (select id from ids where name = 'rx')), 'succeeded', 'counter payment is marked paid at handover');

-- ---------- decline: reason required, refund to wallet ----------
select throws_ok($$ select decline_reservation((select id from ids where name = 'delivery'), '  ') $$, '22023', null,
  'declining without a reason is refused');
select pg_temp.as_admin();
create temp table before as select pg_temp.balance('c0000000-0000-4000-8000-000000000002') as b;
select pg_temp.as_user('b0000000-0000-4000-8000-000000000022');
select decline_reservation((select id from ids where name = 'delivery'), 'Sorry, we are out of Coartem');
select pg_temp.as_admin();
select is(pg_temp.balance('c0000000-0000-4000-8000-000000000002') - (select b from before),
  (select total_kobo from reservations where id = (select id from ids where name = 'delivery')),
  'declined order is refunded in full to the customer''s wallet');

-- ---------- expiry after 10 minutes ----------
select pg_temp.as_user('c0000000-0000-4000-8000-000000000001'); -- Grace
insert into ids select 'late', (place_reservation('a1000000-0000-4000-8000-000000000002', 'pickup', 'wallet',
  jsonb_build_array(jsonb_build_object('inventory_id', pg_temp.inv('a1000000-0000-4000-8000-000000000002', 'Panadol Extra'), 'quantity', 1)))).id;
select pg_temp.as_admin();
update reservations set approval_deadline = now() - interval '1 second' where id = (select id from ids where name = 'late');
select expire_overdue_reservations();
select is((select status::text from reservations where id = (select id from ids where name = 'late')), 'expired', 'no reply in 10 minutes expires the order');
select is((select status::text from payments where reservation_id = (select id from ids where name = 'late')), 'refunded', 'and refunds the payment to the wallet');

select * from finish();
rollback;
