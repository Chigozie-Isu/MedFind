-- MedFind demo data (Port Harcourt). LOCAL DEVELOPMENT ONLY: every account, password and passcode here is fake.
-- The same pharmacies, medicines and prices are in the customer app's demo data
-- (apps/customer/src/features/demo/data.ts); change both together.
-- Test password for every account: MedFind-test-1
-- Customers:  grace@example.com (Grace Mary), chinedu@example.com (Chinedu Okoro)
-- Pharmacies: Fuasi Pharmacy, Caduces Pharma, Mediguy (all open 24 hours)
-- Staff:      see the pharmacy_staff list below; passcodes are 1<pharmacy><00><role>,
--             e.g. 11002 = Yusuf Bilal, pharmacist at Fuasi Pharmacy.
--
-- Orders are created through the real server functions (acting as each user), then moved back in
-- time, so every total and status history row is exactly what the app would produce.

create schema seed;

create function seed.user(p_id uuid, p_email text, p_name text, p_phone text, p_type text) returns void
language sql as $$
  -- Customers get a verified phone too, so they can log in with it.
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    phone, phone_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('MedFind-test-1', extensions.gen_salt('bf')), now(),
    case when p_type = 'customer' then ltrim(p_phone, '+') end, case when p_type = 'customer' then now() end,
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_name, 'phone', p_phone, 'account_type', p_type),
    now() - interval '30 days', now(), '', '', '', '');
  insert into auth.identities (user_id, provider_id, identity_data, provider, created_at, updated_at)
  values (p_id, p_id::text, jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true), 'email', now(), now());
$$;

-- Act as a signed-in user (and sign-in session) for the server functions.
create function seed.act_as(p_user uuid, p_session uuid default null) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated',
    'session_id', coalesce(p_session, gen_random_uuid()))::text, false);
$$;

create function seed.staff_session(p_pharmacy uuid, p_role public.staff_role) returns void
language plpgsql as $$
declare s public.pharmacy_staff;
begin
  select * into s from public.pharmacy_staff where pharmacy_id = p_pharmacy and role = p_role limit 1;
  perform seed.act_as(s.user_id, s.id); -- reuse the staff id as a stable fake session id
  insert into public.staff_sessions (staff_id, auth_session_id) values (s.id, s.id) on conflict do nothing;
end $$;

create function seed.inv(p_pharmacy uuid, p_brand text, p_strength text) returns uuid
language sql as $$
  select i.id from public.inventory i join public.medicines m on m.id = i.medicine_id
  where i.pharmacy_id = p_pharmacy and m.brand_name = p_brand and m.strength is not distinct from p_strength
$$;

create function seed.items(p_pharmacy uuid, variadic p text[]) returns jsonb
language sql as $$
  -- p = brand, strength, quantity, brand, strength, quantity, ...
  select jsonb_agg(jsonb_build_object('inventory_id', seed.inv(p_pharmacy, p[i], nullif(p[i + 1], '')), 'quantity', p[i + 2]::int))
  from generate_series(1, array_length(p, 1), 3) i
$$;

-- Moves everything about one reservation back in time.
create function seed.shift(p_reservation uuid, p_ago interval) returns void
language sql as $$
  update public.reservations set placed_at = placed_at - p_ago, approval_deadline = approval_deadline - p_ago,
    approved_at = approved_at - p_ago, declined_at = declined_at - p_ago, ready_at = ready_at - p_ago,
    pickup_deadline = pickup_deadline - p_ago, handed_to_rider_at = handed_to_rider_at - p_ago,
    completed_at = completed_at - p_ago, expired_at = expired_at - p_ago, cancelled_at = cancelled_at - p_ago,
    created_at = created_at - p_ago
  where id = p_reservation;
  update public.reservation_status_history set created_at = created_at - p_ago where reservation_id = p_reservation;
  update public.prescription_checks set checked_at = checked_at - p_ago where reservation_id = p_reservation;
  update public.payments set created_at = created_at - p_ago, paid_at = paid_at - p_ago, refunded_at = refunded_at - p_ago
  where reservation_id = p_reservation;
  update public.wallet_transactions set created_at = created_at - p_ago where reservation_id = p_reservation;
  update public.notifications set created_at = created_at - p_ago where reservation_id = p_reservation;
$$;

-- ---------- customers ----------
select seed.user('c0000000-0000-4000-8000-000000000001', 'grace@example.com', 'Grace Mary', '+2348031234501', 'customer');
select seed.user('c0000000-0000-4000-8000-000000000002', 'chinedu@example.com', 'Chinedu Okoro', '+2348051234502', 'customer');

insert into public.addresses (id, customer_id, label, street, area, landmark, contact_phone, location, is_default) values
  ('ad000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Home', '7 Ikwerre Road', 'Rumuola', 'Opposite the filling station', '+2348031234501', 'SRID=4326;POINT(7.0090 4.8370)', true),
  ('ad000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Work', '15 Trans Amadi Road', 'Trans Amadi', 'Second floor, glass building', '+2348031234501', 'SRID=4326;POINT(7.0330 4.8130)', false),
  ('ad000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'Home', '22 Peter Odili Road', 'Woji', 'Blue gate', '+2348051234502', 'SRID=4326;POINT(7.0470 4.8250)', true);

-- ---------- pharmacies (names from the Figma screens, Port Harcourt streets) ----------
-- The seed pharmacies are already approved (new sign-ups start as drafts).
alter table public.pharmacies alter column application_status set default 'approved';
insert into public.pharmacies (id, name, street, area, location, phone, email, licence_number, pharmacist_in_charge,
  opening_hours, open_24_hours, offers_delivery, services, is_live) values
  ('a1000000-0000-4000-8000-000000000001', 'Fuasi Pharmacy', '50 Evo Road', 'GRA Phase 2',
   'SRID=4326;POINT(7.0105 4.8210)', '+2349012345601', 'hello@fuasi.example.com', 'PCN/RV/2019/0412', 'Pharm. Yusuf Bilal',
   '{}', true, true, array['Prescriptions', 'Delivery', 'Open 24 hours', 'Malaria test'], true),
  ('a1000000-0000-4000-8000-000000000002', 'Caduces Pharma', '12 Aba Road', 'Rumuogba',
   'SRID=4326;POINT(7.0190 4.8300)', '+2349012345602', 'care@caduces.example.com', 'PCN/RV/2016/0188', 'Pharm. Ngozi Umeh',
   '{}', true, true, array['Prescriptions', 'Delivery', 'Open 24 hours', 'Vaccinations'], true),
  ('a1000000-0000-4000-8000-000000000003', 'Mediguy', '8 Olu Obasanjo Road', 'D-Line',
   'SRID=4326;POINT(6.9990 4.7990)', '+2349012345603', 'mediguy@example.com', 'PCN/RV/2020/0731', 'Pharm. Amina Bello',
   '{}', true, true, array['Prescriptions', 'Delivery', 'Open 24 hours'], true);
alter table public.pharmacies alter column application_status set default 'draft';

insert into public.pharmacy_payout_accounts (pharmacy_id, bank_name, account_number, account_name) values
  ('a1000000-0000-4000-8000-000000000001', 'GTBank', '0123456781', 'Fuasi Pharmacy Ltd'),
  ('a1000000-0000-4000-8000-000000000002', 'Access Bank', '0123456782', 'Caduces Pharma'),
  ('a1000000-0000-4000-8000-000000000003', 'Zenith Bank', '0123456783', 'Mediguy Ltd');

-- ---------- staff: owner, pharmacist, assistant at each pharmacy ----------
with staff(n, role_n, name, email) as (values
  (1, 1, 'Ifeoma Wike', 'ifeoma@fuasi.example.com'), (1, 2, 'Yusuf Bilal', 'yusuf@fuasi.example.com'), (1, 3, 'Blessing Amadi', 'blessing@fuasi.example.com'),
  (2, 1, 'Tamuno Briggs', 'tamuno@caduces.example.com'), (2, 2, 'Ngozi Umeh', 'ngozi@caduces.example.com'), (2, 3, 'Ibim Jack', 'ibim@caduces.example.com'),
  (3, 1, 'Kelechi Nwankwo', 'kelechi@mediguy.example.com'), (3, 2, 'Amina Bello', 'amina@mediguy.example.com'), (3, 3, 'Frank Great', 'frank@mediguy.example.com')
), made as (
  select s.*, ('b0000000-0000-4000-8000-0000000000' || n || role_n)::uuid as user_id,
         seed.user(('b0000000-0000-4000-8000-0000000000' || n || role_n)::uuid, email, name, null, 'staff') as _
  from staff s
)
insert into public.pharmacy_staff (pharmacy_id, user_id, full_name, email, role, passcode_hash)
select ('a1000000-0000-4000-8000-00000000000' || n)::uuid, user_id, name, email,
       (array['owner', 'pharmacist', 'assistant']::public.staff_role[])[role_n],
       extensions.crypt('1' || n || '00' || role_n, extensions.gen_salt('bf'))
from made;

-- Past shifts for the last week, and Yusuf Bilal (Fuasi pharmacist) on shift now.
insert into public.shifts (pharmacy_id, staff_id, clock_in_at, clock_out_at)
select s.pharmacy_id, s.id,
       date_trunc('day', now() - make_interval(days => d)) + interval '7 hours' + make_interval(mins => (hashtext(s.id::text || d) & 31)),
       date_trunc('day', now() - make_interval(days => d)) + interval '15 hours' + make_interval(mins => (hashtext(d || s.id::text) & 31))
from public.pharmacy_staff s, generate_series(1, 6) d
where s.role <> 'owner';
insert into public.shifts (pharmacy_id, staff_id, clock_in_at)
select pharmacy_id, id, now() - interval '3 hours' from public.pharmacy_staff where user_id = 'b0000000-0000-4000-8000-000000000012';

-- ---------- tags and the 15 demo medicines ----------
insert into public.tags (name) values ('Pain relief'), ('Fever'), ('Malaria'), ('Antibiotic'), ('Allergy'),
  ('Cough and cold'), ('Stomach'), ('Vitamins'), ('Children'), ('Asthma');

create table seed.catalogue (brand text, generic text, strength text, form public.medicine_form, pack text,
  maker text, rx boolean, tags text[], descr text,
  -- Price in naira at Fuasi, Caduces and Mediguy (null = not stocked), and stock at each.
  fuasi int, caduces int, mediguy int, qty int[]);
insert into seed.catalogue values
  ('Augmentin suspension', 'Amoxicillin and clavulanic acid', '228mg/5ml', 'suspension', '70ml bottle', 'GSK', true, '{Antibiotic,Children}', 'Antibiotic syrup for children.', 3450, 4000, 3400, '{20,20,3}'),
  ('Diclofenac', 'Diclofenac sodium', '25mg', 'tablet', '20 tablets', 'Emzor', true, '{Pain relief}', 'Relief from joint pain and swelling.', 1300, 1200, null, '{20,20,0}'),
  ('Gestid', 'Antacid and simeticone', null, 'suspension', '100ml bottle', 'Fidson', false, '{Stomach}', 'Relief from heartburn, indigestion and gas.', 1800, 1900, null, '{20,20,0}'),
  ('Amoxil', 'Amoxicillin', '125mg/5ml', 'suspension', '100ml bottle', 'GSK', true, '{Antibiotic,Children}', 'Antibiotic syrup for chest, ear and urinary infections.', 2600, 2500, 2450, '{20,20,20}'),
  ('Paracetamol', 'Paracetamol', '500mg', 'tablet', '12 tablets', 'Emzor', false, '{Pain relief,Fever}', 'For headaches, body pain and fever.', 650, 600, 550, '{40,40,40}'),
  ('Actifed', 'Triprolidine and pseudoephedrine', null, 'syrup', '100ml bottle', 'Kenvue', false, '{Cough and cold,Allergy}', 'Relief from a blocked or runny nose.', 2200, null, 2100, '{20,0,4}'),
  ('Coartem', 'Artemether and lumefantrine', '80/480mg', 'tablet', '6 tablets', 'Novartis', false, '{Malaria}', 'Three-day treatment for uncomplicated malaria.', 3600, 3450, 3500, '{25,25,25}'),
  ('Lonart DS', 'Artemether and lumefantrine', '80/480mg', 'tablet', '6 tablets', 'Bliss GVS', false, '{Malaria}', 'Three-day treatment for uncomplicated malaria.', 2900, 2800, null, '{20,20,0}'),
  ('Panadol Extra', 'Paracetamol and caffeine', '500mg/65mg', 'tablet', '12 tablets', 'Haleon', false, '{Pain relief,Fever}', 'Fast relief from headaches and period pain.', 1300, 1250, 1200, '{30,30,30}'),
  ('Loratadine', 'Loratadine', '10mg', 'tablet', '10 tablets', 'Emzor', false, '{Allergy}', 'Non-drowsy relief from hay fever and itching.', 1200, null, 1150, '{20,0,20}'),
  ('Emzor Vitamin C', 'Ascorbic acid', '100mg', 'tablet', '100 tablets', 'Emzor', false, '{Vitamins}', 'Daily vitamin C.', 650, 600, 700, '{30,30,30}'),
  ('Buscopan', 'Hyoscine butylbromide', '10mg', 'tablet', '20 tablets', 'Sanofi', false, '{Stomach,Pain relief}', 'Relief from stomach cramps.', 3300, 3200, null, '{15,15,0}'),
  ('Emzor ORS', 'Oral rehydration salts', null, 'sachet', '10 sachets', 'Emzor', false, '{Stomach,Children}', 'Replaces fluids lost through diarrhoea.', 1000, 1050, 1000, '{30,30,30}'),
  ('Ventolin Inhaler', 'Salbutamol', '100mcg', 'inhaler', '200 doses', 'GSK', true, '{Asthma}', 'Quick relief from asthma attacks.', 5000, 4800, null, '{10,10,0}'),
  ('Flagyl', 'Metronidazole', '400mg', 'tablet', '20 tablets', 'Sanofi', true, '{Antibiotic,Stomach}', 'For gut and dental infections.', null, 1800, 1850, '{0,20,20}');

insert into public.medicines (brand_name, generic_name, strength, form, pack_size, manufacturer, description, requires_prescription)
select brand, generic, strength, form, pack, maker, descr, rx from seed.catalogue;

insert into public.medicine_tags (medicine_id, tag_id)
select m.id, t.id from seed.catalogue c
join public.medicines m on m.brand_name = c.brand and m.strength is not distinct from c.strength
join public.tags t on t.name = any (c.tags);

insert into public.medicine_photos (medicine_id, storage_path, sort_order)
select id, 'catalogue/' || regexp_replace(lower(brand_name), '[^a-z0-9]+', '-', 'g') || '.jpg', 0 from public.medicines;

insert into public.inventory (pharmacy_id, medicine_id, price_kobo, quantity_in_stock, low_stock_threshold, expiry_date)
select ('a1000000-0000-4000-8000-00000000000' || s.n)::uuid, m.id, s.naira * 100, c.qty[s.n], 5,
       (current_date + make_interval(months => 6 + abs(hashtext(m.brand_name || s.n)) % 24))::date
from seed.catalogue c
join public.medicines m on m.brand_name = c.brand and m.strength is not distinct from c.strength
cross join lateral (values (1, c.fuasi), (2, c.caduces), (3, c.mediguy)) s(n, naira)
where s.naira is not null;

-- ---------- wallets: a top-up for each customer two weeks ago (the app demo pays at the pharmacy) ----------
select public.record_wallet_top_up(c, amt, 'seed-topup-' || n)
from (values (1, 'c0000000-0000-4000-8000-000000000001'::uuid, 2000000),
             (2, 'c0000000-0000-4000-8000-000000000002'::uuid, 1500000)) t(n, c, amt);
update public.wallet_transactions set created_at = now() - interval '14 days' where kind = 'top_up';

-- ---------- prescriptions ----------
insert into public.prescriptions (id, customer_id, storage_path, patient_name, patient_age_years, prescriber_name) values
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001/augmentin-script.jpg', 'Prince Grace', 6, 'Dr. Feyi Wyles'),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002/amoxil-script.jpg', 'Chinedu Okoro', 34, 'Dr. Tobi Coker');

-- ---------- orders, in date order, through the real server functions (all paid at the pharmacy) ----------
do $$
declare
  fuasi uuid := 'a1000000-0000-4000-8000-000000000001';
  caduces uuid := 'a1000000-0000-4000-8000-000000000002';
  mediguy uuid := 'a1000000-0000-4000-8000-000000000003';
  grace uuid := 'c0000000-0000-4000-8000-000000000001';
  chinedu uuid := 'c0000000-0000-4000-8000-000000000002';
  r public.reservations;
begin
  -- 9 days ago: Grace collects Coartem from Fuasi.
  perform seed.act_as(grace);
  r := public.place_reservation(fuasi, 'pickup', 'at_pharmacy', seed.items(fuasi, 'Coartem', '80/480mg', '1'));
  perform seed.staff_session(fuasi, 'assistant');
  perform public.approve_reservation(r.id);
  perform public.mark_ready(r.id);
  select pickup_code into r.pickup_code from public.reservations where id = r.id;
  perform public.complete_pickup(r.id, r.pickup_code);
  perform seed.shift(r.id, interval '9 days');
  insert into public.ratings (reservation_id, customer_id, pharmacy_id, stars, comment)
  values (r.id, grace, fuasi, 5, 'Ready in five minutes and the pharmacist explained the doses.');
  insert into public.saved_medicines (customer_id, medicine_id, pharmacy_id)
  select grace, medicine_id, fuasi from public.reservation_items where reservation_id = r.id;

  -- 3 days ago: Chinedu buys 2 Gestid and an ORS pack at Caduces.
  perform seed.act_as(chinedu);
  r := public.place_reservation(caduces, 'pickup', 'at_pharmacy', seed.items(caduces, 'Gestid', '', '2', 'Emzor ORS', '', '1'));
  perform seed.staff_session(caduces, 'assistant');
  perform public.approve_reservation(r.id);
  perform public.mark_ready(r.id);
  select pickup_code into r.pickup_code from public.reservations where id = r.id;
  perform public.complete_pickup(r.id, r.pickup_code);
  perform seed.shift(r.id, interval '3 days');
  insert into public.ratings (reservation_id, customer_id, pharmacy_id, stars, comment)
  values (r.id, chinedu, caduces, 4, 'Quick and friendly.');

  -- 2 days ago: Chinedu's Amoxil prescription is declined at Mediguy.
  perform seed.act_as(chinedu);
  r := public.place_reservation(mediguy, 'pickup', 'at_pharmacy', seed.items(mediguy, 'Amoxil', '125mg/5ml', '1'), null,
    'e0000000-0000-4000-8000-000000000002');
  perform seed.staff_session(mediguy, 'pharmacist');
  perform public.decline_reservation(r.id, 'Your prescription is more than 6 months old. Please ask your doctor for a new one.');
  perform seed.shift(r.id, interval '2 days');

  -- Yesterday: Grace's Loratadine at Mediguy got no reply within 10 minutes and expired.
  perform seed.act_as(grace);
  r := public.place_reservation(mediguy, 'pickup', 'at_pharmacy', seed.items(mediguy, 'Loratadine', '10mg', '1'));
  update public.reservations set approval_deadline = now() - interval '1 second' where id = r.id;
  perform public.expire_overdue_reservations();
  perform seed.shift(r.id, interval '1 day');

  -- Just now: Grace's Augmentin suspension at Fuasi: 4 checks ticked by Yusuf, approved, ready to collect.
  perform seed.act_as(grace);
  r := public.place_reservation(fuasi, 'pickup', 'at_pharmacy', seed.items(fuasi, 'Augmentin suspension', '228mg/5ml', '1'), null,
    'e0000000-0000-4000-8000-000000000001');
  perform seed.staff_session(fuasi, 'pharmacist');
  perform public.set_prescription_check(r.id, 'medicine_and_dosage');
  perform public.set_prescription_check(r.id, 'patient_name_and_age');
  perform public.set_prescription_check(r.id, 'prescriber_name_and_signature');
  perform public.set_prescription_check(r.id, 'dose_suits_patient_age');
  perform public.approve_reservation(r.id);
  perform public.mark_ready(r.id);

  -- Waiting now: Chinedu's Panadol Extra at Fuasi (expires 10 minutes after the seed runs).
  perform seed.act_as(chinedu);
  r := public.place_reservation(fuasi, 'pickup', 'at_pharmacy', seed.items(fuasi, 'Panadol Extra', '500mg/65mg', '2'));
end $$;

-- The payout due on Friday 27 November 2026 for the completed orders above.
select public.generate_payouts(date '2026-11-27');

-- Clean up: no seeded staff stays unlocked, and the helpers go away.
delete from public.staff_sessions;
select set_config('request.jwt.claims', '', false);
drop schema seed cascade;

-- Location access: Grace has a saved GPS location; Chinedu has none yet.
insert into public.customer_locations (customer_id, label, address_line, lat, lng, accuracy_m, source) values
  ('c0000000-0000-4000-8000-000000000001', 'Rumuola', 'Port Harcourt · within 20 m', 4.8370, 7.0090, 20, 'gps');
