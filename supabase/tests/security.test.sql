-- Row-level security: who can see and do what. Runs against the seed data.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(35);

create function pg_temp.as_user(p_user uuid, p_session uuid default '00000000-0000-4000-8000-0000000000aa') returns void
language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated', 'session_id', p_session)::text, true);
$$;
create function pg_temp.as_anon() returns void language sql as $$
  select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
$$;
create function pg_temp.as_admin() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- ---------- signed out ----------
select pg_temp.as_anon();
select ok((select count(*) from pharmacies) = 3, 'anyone can see the 3 live pharmacies');
select ok((select count(*) from medicines) = 15, 'anyone can browse the 15-medicine catalogue');
select ok((select count(*) from inventory) > 0, 'anyone can see prices and stock');
select ok((select count(*) from nearby_pharmacies(4.8210, 7.0105, 5)) >= 1, 'anyone can search pharmacies near GRA, Port Harcourt');
select throws_ok($$ select * from reservations $$, '42501', null, 'signed-out visitors cannot read reservations');
select throws_ok($$ select * from customers $$, '42501', null, 'signed-out visitors cannot read customers');

-- ---------- customer: Grace ----------
select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
select is((select count(*) from reservations), 3::bigint, 'Grace sees only her own 3 reservations');
select is((select count(*) from customers), 1::bigint, 'Grace sees only her own customer profile');
select is((select count(*) from wallet_transactions where customer_id <> 'c0000000-0000-4000-8000-000000000001'), 0::bigint, 'Grace sees no one else''s wallet');
select is((select balance_kobo from wallet_balances),
  2000000::bigint, 'Grace''s wallet: NGN 20,000 top-up, untouched because she pays at the pharmacy');
select is((select count(*) from prescriptions where customer_id <> 'c0000000-0000-4000-8000-000000000001'), 0::bigint,
  'Grace cannot see other customers'' prescriptions');
select is((select count(*) from addresses), 2::bigint, 'Grace sees her own 2 addresses only');
select is((select count(*) from payouts), 0::bigint, 'customers cannot see payouts');
select throws_ok($$ select passcode_hash from pharmacy_staff $$, '42501', null, 'nobody can read staff passcode hashes');
select throws_ok($$ update reservations set status = 'completed' $$, '42501', null, 'customers cannot change a reservation directly');
select throws_ok($$ insert into wallet_transactions (customer_id, kind, amount_kobo, balance_after_kobo, description)
  values ('c0000000-0000-4000-8000-000000000001', 'top_up', 100000000, 100000000, 'free money') $$, '42501', null,
  'customers cannot top up their own wallet');
select throws_ok($$ select record_wallet_top_up('c0000000-0000-4000-8000-000000000001', 100000, 'x') $$, '42501', null,
  'customers cannot call Paystack-only functions');
select throws_ok($$ insert into ratings (reservation_id, customer_id, pharmacy_id, stars)
  select id, customer_id, pharmacy_id, 5 from reservations where status = 'expired' $$, '42501', null,
  'customers can only rate completed orders');

-- ---------- staff: Fuasi assistant (Blessing) ----------
select pg_temp.as_user('b0000000-0000-4000-8000-000000000013');
select is((select count(*) from reservations), 0::bigint, 'staff see no orders before entering their passcode');
select is((select count(*) from pharmacy_staff), 1::bigint, 'before the passcode, staff see only their own staff row');
select is(unlock_staff('a1000000-0000-4000-8000-000000000001', '99999'), null, 'a wrong passcode is refused');
select isnt(unlock_staff('a1000000-0000-4000-8000-000000000001', '11003'), null, 'the right passcode unlocks');
select is((select count(*) from reservations), 3::bigint, 'Fuasi staff see Fuasi''s 3 orders only');
select is((select count(*) from reservations where pharmacy_id <> 'a1000000-0000-4000-8000-000000000001'), 0::bigint,
  'Fuasi staff cannot see another pharmacy''s orders');
select is((select count(*) from prescriptions), 1::bigint, 'staff see only prescriptions attached to their own orders');
select is((select count(*) from customers), 2::bigint, 'staff see only the 2 customers who ordered from them');
select is((select count(*) from payouts), 0::bigint, 'assistants cannot see payouts');
select is((select count(*) from pharmacy_payout_accounts), 0::bigint, 'assistants cannot see bank details');
select throws_ok($$ select unlock_staff('a1000000-0000-4000-8000-000000000002', '11003') $$, '42501', null,
  'staff cannot unlock a pharmacy they do not work at');

-- A different sign-in session for the same person is locked again.
select pg_temp.as_user('b0000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-0000000000bb');
select is((select count(*) from reservations), 0::bigint, 'the passcode is needed again in a new sign-in session');

-- ---------- staff: Fuasi owner (Ifeoma) ----------
select pg_temp.as_user('b0000000-0000-4000-8000-000000000011');
select unlock_staff('a1000000-0000-4000-8000-000000000001', '11001');
select is((select count(*) from payouts), 1::bigint, 'owners see their own payout');
select is((select count(*) from pharmacy_payout_accounts), 1::bigint, 'owners see their own bank details only');
select is((select count(*) from shifts where pharmacy_id <> 'a1000000-0000-4000-8000-000000000001'), 0::bigint,
  'owners see only their own pharmacy''s shifts');
select is(length(create_staff_passcode((select id from pharmacy_staff where user_id = 'b0000000-0000-4000-8000-000000000013'))), 5,
  'owners can create a new 5-digit staff code');

-- ---------- staff: Caduces pharmacist cannot touch Fuasi stock ----------
select pg_temp.as_user('b0000000-0000-4000-8000-000000000022');
select unlock_staff('a1000000-0000-4000-8000-000000000002', '12002');
with u as (update inventory set price_kobo = 1 where pharmacy_id = 'a1000000-0000-4000-8000-000000000001' returning 1)
select is(count(*), 0::bigint, 'staff cannot change another pharmacy''s prices') from u;

select * from finish();
rollback;
