-- Sign in lockout, sign-up checks and pharmacy applications.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(36);

create function pg_temp.as_user(p_user uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.as_anon() returns void language sql as $$
  select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
$$;
create function pg_temp.as_service() returns void language sql as $$
  select set_config('role', 'service_role', true), set_config('request.jwt.claims', '{"role":"service_role"}', true);
$$;

-- ---------- account-name check (same cases as packages/core/test/pharmacySignup.test.ts) ----------
select ok(private.account_name_matches('FUASI PHARMACY LTD', 'Fuasi Pharmacy'), 'LTD on the account still matches');
select ok(private.account_name_matches('FUASI PHARMACY (NIG) LIMITED', 'Fuasi Pharmacy Ltd'), '(NIG) LIMITED still matches');
select ok(private.account_name_matches('MEDPLUS PHARMACY & STORES', 'MedPlus Pharmacy and Stores'), '& and "and" are the same');
select ok(not private.account_name_matches('GRACE OKAFOR', 'Fuasi Pharmacy'), 'a personal account does not match');
select ok(not private.account_name_matches('FUASI STORES LTD', 'Fuasi Pharmacy'), 'a different business does not match');
select ok(not private.account_name_matches('ANYTHING', 'Ltd'), 'an empty business name matches nothing');

-- ---------- signed-out checks ----------
select pg_temp.as_anon();
select is(sign_in_precheck('ada@example.com') ->> 'account', 'customer', 'Ada''s email is a customer account');
select is(sign_in_precheck('+234 803 123 4501') ->> 'account', 'customer', 'so is her verified phone number');
select is(sign_in_precheck('nobody@example.com') ->> 'account', 'none', 'unknown emails are reported as none');
select is(sign_in_precheck('yusuf@admiraltycare.example.com') ->> 'account', 'staff', 'staff emails are staff accounts');
select is((sign_up_precheck('ADA@example.com', '+2348000000000') ->> 'email_in_use')::boolean, true, 'sign up spots an email in use, any case');
select is((sign_up_precheck('new@example.com', '+2348031234501') ->> 'phone_in_use')::boolean, true, 'and a phone in use');
select throws_ok($$ select private.auth_user_for('ada@example.com') $$, '42501', null, 'internal lookups are not callable');
select throws_ok($$ select * from private.sign_in_attempts $$, '42501', null, 'attempt counts are not readable');

-- ---------- lockout: 5 wrong tries lock for 5 minutes ----------
select is(record_sign_in_failure('ada@example.com'), 0, 'first wrong try does not lock');
select record_sign_in_failure('ada@example.com') from generate_series(1, 3);
select ok(record_sign_in_failure('ADA@example.com') between 299 and 300, 'the fifth wrong try locks for 5 minutes');
select ok((sign_in_precheck('ada@example.com') ->> 'locked_seconds')::int > 0, 'precheck reports the lock');
reset role;
update private.sign_in_attempts set locked_until = now() - interval '1 second' where identifier = 'ada@example.com';
select pg_temp.as_anon();
select is(record_sign_in_failure('ada@example.com'), 0, 'after the lock runs out the count starts again');
select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
select clear_sign_in_failures();
reset role;
select is((select count(*) from private.sign_in_attempts where identifier = 'ada@example.com'), 0::bigint, 'signing in clears the count');

-- ---------- pharmacy sign up ----------
-- A brand-new owner account (created by sign up with account_type pharmacy_owner).
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'yusuf@fuasipharmacy.ng', extensions.crypt('Fuasi2026', extensions.gen_salt('bf')), now(), '{"provider":"email"}',
  '{"account_type":"pharmacy_owner","full_name":"Yusuf Bilal"}', now(), now(), '', '', '', '');
select is((select count(*) from customers where id = 'd0000000-0000-4000-8000-000000000001'), 0::bigint, 'owner accounts are not customers');

select pg_temp.as_user('d0000000-0000-4000-8000-000000000001');
select lives_ok($$ select save_pharmacy_details('{"name":"Fuasi Pharmacy","phone":"+2348109876543","street":"No. 50 EVO Road",
  "area":"GRA Phase 2","city":"Port Harcourt","state":"Rivers State","landmark":"Off Nibble restaurant","lat":4.8156,"lng":7.0498,
  "superintendent_name":"Yusuf Bilal","pcn_number":"PCN 0081 4472","email":"yusuf@fuasipharmacy.ng"}') $$, 'step 1 saves a draft pharmacy');
select is(my_pharmacy_application() -> 'pharmacy' ->> 'application_status', 'draft', 'the new pharmacy is a draft');
select is(my_pharmacy_application() -> 'pharmacy' ->> 'pcn_number', '00814472', 'the PCN number is stored without spaces');
select is(my_staff_state() ->> 'has_passcode', 'false', 'no passcode until the application is submitted');
select lives_ok($$ insert into storage.objects (bucket_id, name, owner_id)
  values ('pharmacy-documents', (my_pharmacy_application() -> 'pharmacy' ->> 'id') || '/premises_licence/scan.pdf', auth.uid()::text) $$,
  'the owner can upload a file into their draft pharmacy''s folder');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('pharmacy-documents', 'a0000000-0000-4000-8000-000000000001/premises_licence/scan.pdf') $$,
  '42501', null, 'the owner cannot upload into another pharmacy''s folder');
create temp table fuasi as select (my_pharmacy_application() -> 'pharmacy' ->> 'id') as id;
grant select on fuasi to authenticated;
select throws_ok($$ select submit_pharmacy_application() $$, '22023', 'Upload all 3 required documents first', 'cannot submit without documents');

select lives_ok($$
  select add_pharmacy_document(k::pharmacy_document_kind,
    (my_pharmacy_application() -> 'pharmacy' ->> 'id') || '/' || k || '/file.pdf', 'file.pdf', 1200000, 'application/pdf')
  from unnest(array['premises_licence', 'superintendent_licence', 'cac_certificate']) as k
$$, 'step 2 records the 3 licences');
select throws_ok($$ select submit_pharmacy_application() $$, '22023', 'Add a verified payout account first', 'cannot submit without a payout account');

select pg_temp.as_service();
select is(save_verified_payout_account('d0000000-0000-4000-8000-000000000001', 'Guaranty Trust Bank', '058', '0123456789', 'GRACE OKAFOR'),
  false, 'a personal account is refused');
select is(save_verified_payout_account('d0000000-0000-4000-8000-000000000001', 'Guaranty Trust Bank', '058', '0123456789', 'FUASI PHARMACY LTD'),
  true, 'the business account is saved');

select pg_temp.as_user('d0000000-0000-4000-8000-000000000001');
select ok(submit_pharmacy_application() ~ '^\d{5}$', 'submitting returns a 5-digit staff passcode once');
select is(my_staff_state() ->> 'application_status', 'submitted', 'the application is waiting for review');

select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('pharmacy-documents', (select id from fuasi) || '/shop_front/late.jpg') $$,
  '42501', null, 'once submitted, the owner cannot add files');
select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
select is((select count(*) from storage.objects where bucket_id = 'pharmacy-documents'), 0::bigint,
  'other people cannot see a pharmacy''s documents');

select pg_temp.as_service();
select is((review_pharmacy_application((select id from pharmacies where pcn_number = '00814472'), true)).is_live, true,
  'approving puts the pharmacy live');

select * from finish();
rollback;
