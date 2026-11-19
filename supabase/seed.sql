-- MedFind local test data. LOCAL DEVELOPMENT ONLY: every account, password and passcode here is fake.
-- Test password for every account: MedFind-test-1
-- Customers:  ada@example.com, tunde@example.com, chiamaka@example.com, ibrahim@example.com, funke@example.com
-- Staff:      see the pharmacy_staff list below; passcodes are 1<pharmacy><00><role>, e.g. 11001 = Admiralty owner.
--
-- Orders are created through the real server functions (acting as each user), then moved back in
-- time, so every total, wallet balance and status history row is exactly what the app would produce.

create schema seed;

create function seed.user(p_id uuid, p_email text, p_name text, p_phone text, p_type text) returns void
language sql as $$
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('MedFind-test-1', extensions.gen_salt('bf')), now(),
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
select seed.user('c0000000-0000-4000-8000-000000000001', 'ada@example.com', 'Adaeze Okafor', '+2348031234501', 'customer');
select seed.user('c0000000-0000-4000-8000-000000000002', 'tunde@example.com', 'Tunde Bakare', '+2348051234502', 'customer');
select seed.user('c0000000-0000-4000-8000-000000000003', 'chiamaka@example.com', 'Chiamaka Eze', '+2347061234503', 'customer');
select seed.user('c0000000-0000-4000-8000-000000000004', 'ibrahim@example.com', 'Ibrahim Musa', '+2348091234504', 'customer');
select seed.user('c0000000-0000-4000-8000-000000000005', 'funke@example.com', 'Funke Adeyemi', '+2348121234505', 'customer');

insert into public.addresses (id, customer_id, label, street, area, landmark, contact_phone, location, is_default) values
  ('ad000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Home', '14 Fola Osibo Road', 'Lekki Phase 1', 'Opposite the filling station', '+2348031234501', 'SRID=4326;POINT(3.4705 6.4441)', true),
  ('ad000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Work', '5 Adeola Odeku Street', 'Victoria Island', 'Third floor, glass building', '+2348031234501', 'SRID=4326;POINT(3.4185 6.4302)', false),
  ('ad000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'Home', '22 Herbert Macaulay Way', 'Yaba', 'Near the bus stop', '+2348051234502', 'SRID=4326;POINT(3.3787 6.5067)', true),
  ('ad000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000003', 'Home', '9 Ogunlana Drive', 'Surulere', 'Blue gate', '+2347061234503', 'SRID=4326;POINT(3.3540 6.4920)', true),
  ('ad000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000004', 'Home', '3 Oduduwa Crescent', 'Ikeja GRA', null, '+2348091234504', 'SRID=4326;POINT(3.3560 6.5800)', true),
  ('ad000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000005', 'Home', '17 Addo Road', 'Ajah', 'Behind the market', '+2348121234505', 'SRID=4326;POINT(3.5800 6.4680)', true);

-- ---------- pharmacies (invented names, real Lagos areas) ----------
insert into public.pharmacies (id, name, street, area, location, phone, email, licence_number, pharmacist_in_charge,
  opening_hours, open_24_hours, offers_delivery, services, is_live) values
  ('a1000000-0000-4000-8000-000000000001', 'Admiralty Care Pharmacy', '12 Admiralty Way', 'Lekki Phase 1',
   'SRID=4326;POINT(3.4723 6.4474)', '+2349012345601', 'hello@admiraltycare.example.com', 'PCN/LA/2019/0412', 'Pharm. Yusuf Bilal',
   '{"mon":{"open":"08:00","close":"22:00"},"tue":{"open":"08:00","close":"22:00"},"wed":{"open":"08:00","close":"22:00"},"thu":{"open":"08:00","close":"22:00"},"fri":{"open":"08:00","close":"22:00"},"sat":{"open":"09:00","close":"21:00"},"sun":{"open":"12:00","close":"20:00"}}',
   false, true, array['Prescriptions', 'Delivery', 'Blood pressure check', 'Malaria test'], true),
  ('a1000000-0000-4000-8000-000000000002', 'Adesola 24/7 Pharmacy', '45 Akin Adesola Street', 'Victoria Island',
   'SRID=4326;POINT(3.4211 6.4317)', '+2349012345602', 'care@adesola247.example.com', 'PCN/LA/2016/0188', 'Pharm. Ngozi Umeh',
   '{}', true, true, array['Prescriptions', 'Delivery', 'Open 24 hours', 'Vaccinations'], true),
  ('a1000000-0000-4000-8000-000000000003', 'Isaac John Pharmacy', '8 Isaac John Street', 'Ikeja GRA',
   'SRID=4326;POINT(3.3530 6.5790)', '+2349012345603', null, 'PCN/LA/2020/0731', 'Pharm. Kola Ajayi',
   '{"mon":{"open":"08:00","close":"21:00"},"tue":{"open":"08:00","close":"21:00"},"wed":{"open":"08:00","close":"21:00"},"thu":{"open":"08:00","close":"21:00"},"fri":{"open":"08:00","close":"21:00"},"sat":{"open":"09:00","close":"20:00"}}',
   false, true, array['Prescriptions', 'Delivery', 'Diabetes care'], true),
  ('a1000000-0000-4000-8000-000000000004', 'Sabo Health Pharmacy', '210 Herbert Macaulay Way', 'Yaba',
   'SRID=4326;POINT(3.3790 6.5095)', '+2349012345604', 'sabohealth@example.com', 'PCN/LA/2018/0559', 'Pharm. Halima Sani',
   '{}', true, true, array['Prescriptions', 'Delivery', 'Open 24 hours', 'Malaria test'], true),
  ('a1000000-0000-4000-8000-000000000005', 'Ogunsanya Family Pharmacy', '31 Adeniran Ogunsanya Street', 'Surulere',
   'SRID=4326;POINT(3.3540 6.4960)', '+2349012345605', null, 'PCN/LA/2015/0097', 'Pharm. Bisi Adebayo',
   '{"mon":{"open":"07:30","close":"21:30"},"tue":{"open":"07:30","close":"21:30"},"wed":{"open":"07:30","close":"21:30"},"thu":{"open":"07:30","close":"21:30"},"fri":{"open":"07:30","close":"21:30"},"sat":{"open":"08:00","close":"21:00"},"sun":{"open":"13:00","close":"19:00"}}',
   false, false, array['Prescriptions', 'Children''s medicines', 'Blood pressure check'], true),
  ('a1000000-0000-4000-8000-000000000006', 'Ajah Wellness Pharmacy', '4 Abraham Adesanya Road', 'Ajah',
   'SRID=4326;POINT(3.5850 6.4680)', '+2349012345606', 'ajahwellness@example.com', 'PCN/LA/2021/0864', 'Pharm. Emeka Obi',
   '{"mon":{"open":"08:00","close":"22:00"},"tue":{"open":"08:00","close":"22:00"},"wed":{"open":"08:00","close":"22:00"},"thu":{"open":"08:00","close":"22:00"},"fri":{"open":"08:00","close":"22:00"},"sat":{"open":"08:00","close":"22:00"},"sun":{"open":"10:00","close":"20:00"}}',
   false, true, array['Prescriptions', 'Delivery'], true);

insert into public.pharmacy_payout_accounts (pharmacy_id, bank_name, account_number, account_name) values
  ('a1000000-0000-4000-8000-000000000001', 'GTBank', '0123456781', 'Admiralty Care Pharmacy Ltd'),
  ('a1000000-0000-4000-8000-000000000002', 'Access Bank', '0123456782', 'Adesola 24/7 Pharmacy'),
  ('a1000000-0000-4000-8000-000000000003', 'Zenith Bank', '0123456783', 'Isaac John Pharmacy'),
  ('a1000000-0000-4000-8000-000000000004', 'First Bank', '0123456784', 'Sabo Health Pharmacy Ltd'),
  ('a1000000-0000-4000-8000-000000000005', 'UBA', '0123456785', 'Ogunsanya Family Pharmacy'),
  ('a1000000-0000-4000-8000-000000000006', 'Moniepoint MFB', '0123456786', 'Ajah Wellness Pharmacy');

-- ---------- staff: owner, pharmacist, assistant at each pharmacy ----------
with staff(n, role_n, name, email) as (values
  (1, 1, 'Folake Martins', 'folake@admiraltycare.example.com'), (1, 2, 'Yusuf Bilal', 'yusuf@admiraltycare.example.com'), (1, 3, 'Grace Akpan', 'grace@admiraltycare.example.com'),
  (2, 1, 'Ngozi Umeh', 'ngozi@adesola247.example.com'), (2, 2, 'Segun Oladipo', 'segun@adesola247.example.com'), (2, 3, 'Blessing Udo', 'blessing@adesola247.example.com'),
  (3, 1, 'Kola Ajayi', 'kola@isaacjohn.example.com'), (3, 2, 'Amina Bello', 'amina@isaacjohn.example.com'), (3, 3, 'Frank Great', 'frank@isaacjohn.example.com'),
  (4, 1, 'Halima Sani', 'halima@sabohealth.example.com'), (4, 2, 'Olu Bankole', 'olu@sabohealth.example.com'), (4, 3, 'Ada Nwosu', 'adanwosu@sabohealth.example.com'),
  (5, 1, 'Bisi Adebayo', 'bisi@ogunsanya.example.com'), (5, 2, 'Kemi Lawal', 'kemi@ogunsanya.example.com'), (5, 3, 'Musa Garba', 'musa@ogunsanya.example.com'),
  (6, 1, 'Emeka Obi', 'emeka@ajahwellness.example.com'), (6, 2, 'Zainab Yusuf', 'zainab@ajahwellness.example.com'), (6, 3, 'Ned Okon', 'ned@ajahwellness.example.com')
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

-- Past shifts for the last week, and the Admiralty pharmacist on shift now.
insert into public.shifts (pharmacy_id, staff_id, clock_in_at, clock_out_at)
select s.pharmacy_id, s.id,
       date_trunc('day', now() - make_interval(days => d)) + interval '7 hours' + make_interval(mins => (hashtext(s.id::text || d) & 31)),
       date_trunc('day', now() - make_interval(days => d)) + interval '15 hours' + make_interval(mins => (hashtext(d || s.id::text) & 31))
from public.pharmacy_staff s, generate_series(1, 6) d
where s.role <> 'owner';
insert into public.shifts (pharmacy_id, staff_id, clock_in_at)
select pharmacy_id, id, now() - interval '3 hours' from public.pharmacy_staff where user_id = 'b0000000-0000-4000-8000-000000000012';

-- ---------- tags and medicines ----------
insert into public.tags (name) values ('Pain relief'), ('Fever'), ('Malaria'), ('Antibiotic'), ('Allergy'),
  ('Cough and cold'), ('Diabetes'), ('Blood pressure'), ('Cholesterol'), ('Stomach'), ('Vitamins'), ('Children'),
  ('Asthma'), ('Skin'), ('First aid');

create table seed.catalogue (brand text, generic text, strength text, form public.medicine_form, pack text,
  maker text, rx boolean, base_naira int, tags text[], descr text);
insert into seed.catalogue values
  ('Emzor Paracetamol', 'Paracetamol', '500mg', 'tablet', '12 tablets', 'Emzor', false, 500, '{Pain relief,Fever}', 'For headaches, body pain and fever.'),
  ('Panadol Extra', 'Paracetamol and caffeine', '500mg/65mg', 'tablet', '12 tablets', 'Haleon', false, 1200, '{Pain relief,Fever}', 'Fast relief from headaches and period pain.'),
  ('Panadol Baby and Infant', 'Paracetamol', '120mg/5ml', 'suspension', '100ml bottle', 'Haleon', false, 2300, '{Fever,Children}', 'Fever and pain relief for babies from 3 months.'),
  ('Nurofen', 'Ibuprofen', '200mg', 'tablet', '16 tablets', 'Reckitt', false, 3000, '{Pain relief,Fever}', 'Relief from pain, swelling and fever.'),
  ('Coartem', 'Artemether and lumefantrine', '80/480mg', 'tablet', '6 tablets', 'Novartis', false, 3450, '{Malaria}', 'Three-day treatment for uncomplicated malaria.'),
  ('Lonart DS', 'Artemether and lumefantrine', '80/480mg', 'tablet', '6 tablets', 'Bliss GVS', false, 2800, '{Malaria}', 'Three-day treatment for uncomplicated malaria.'),
  ('Amatem Forte', 'Artemether and lumefantrine', '80/480mg', 'tablet', '6 tablets', 'Elbe Pharma', false, 2500, '{Malaria}', 'Three-day treatment for uncomplicated malaria.'),
  ('P-Alaxin', 'Dihydroartemisinin and piperaquine', '40/320mg', 'tablet', '9 tablets', 'Bliss GVS', false, 3200, '{Malaria}', 'Malaria treatment taken once a day for three days.'),
  ('Amoxil', 'Amoxicillin', '500mg', 'capsule', '21 capsules', 'GSK', true, 3800, '{Antibiotic}', 'Antibiotic for chest, ear and urinary infections.'),
  ('Amoxicillin suspension', 'Amoxicillin', '125mg/5ml', 'suspension', '100ml bottle', 'Emzor', true, 1800, '{Antibiotic,Children}', 'Antibiotic syrup for children.'),
  ('Augmentin', 'Amoxicillin and clavulanic acid', '625mg', 'tablet', '14 tablets', 'GSK', true, 9500, '{Antibiotic}', 'Antibiotic for infections that need extra strength.'),
  ('Augmentin suspension', 'Amoxicillin and clavulanic acid', '228mg/5ml', 'suspension', '70ml bottle', 'GSK', true, 7500, '{Antibiotic,Children}', 'Antibiotic syrup for children.'),
  ('Ciprotab', 'Ciprofloxacin', '500mg', 'tablet', '10 tablets', 'Fidson', true, 2500, '{Antibiotic}', 'Antibiotic for urinary and gut infections.'),
  ('Flagyl', 'Metronidazole', '400mg', 'tablet', '20 tablets', 'Sanofi', true, 1800, '{Antibiotic,Stomach}', 'For gut and dental infections.'),
  ('Septrin', 'Co-trimoxazole', '480mg', 'tablet', '20 tablets', 'GSK', true, 1500, '{Antibiotic}', 'Antibiotic for chest and urinary infections.'),
  ('Loratadine', 'Loratadine', '10mg', 'tablet', '10 tablets', 'Emzor', false, 1200, '{Allergy}', 'Non-drowsy relief from hay fever and itching.'),
  ('Piriton', 'Chlorphenamine', '4mg', 'tablet', '30 tablets', 'Haleon', false, 900, '{Allergy}', 'Allergy relief. May cause drowsiness.'),
  ('Zyrtec', 'Cetirizine', '10mg', 'tablet', '7 tablets', 'UCB', false, 2000, '{Allergy}', 'Once-a-day allergy relief.'),
  ('Benylin Original', 'Diphenhydramine', null, 'syrup', '100ml bottle', 'Kenvue', false, 2700, '{Cough and cold}', 'Relief from chesty and dry coughs.'),
  ('Emzor Vitamin C', 'Ascorbic acid', '100mg', 'tablet', '100 tablets', 'Emzor', false, 600, '{Vitamins}', 'Daily vitamin C.'),
  ('Seven Seas Cod Liver Oil', 'Cod liver oil', null, 'capsule', '60 capsules', 'Seven Seas', false, 6500, '{Vitamins}', 'Omega-3 and vitamins A and D.'),
  ('Vitamin B Complex', 'Vitamin B complex', null, 'tablet', '30 tablets', 'Emzor', false, 500, '{Vitamins}', 'Daily B vitamins.'),
  ('Glucophage', 'Metformin', '500mg', 'tablet', '30 tablets', 'Merck', true, 3500, '{Diabetes}', 'Controls blood sugar in type 2 diabetes.'),
  ('Amlodipine', 'Amlodipine', '5mg', 'tablet', '28 tablets', 'Emzor', true, 1500, '{Blood pressure}', 'Lowers high blood pressure.'),
  ('Lisinopril', 'Lisinopril', '10mg', 'tablet', '28 tablets', 'Teva', true, 2800, '{Blood pressure}', 'Lowers high blood pressure.'),
  ('Losartan', 'Losartan', '50mg', 'tablet', '28 tablets', 'Teva', true, 4500, '{Blood pressure}', 'Lowers high blood pressure.'),
  ('Atorvastatin', 'Atorvastatin', '20mg', 'tablet', '28 tablets', 'Teva', true, 3800, '{Cholesterol}', 'Lowers cholesterol.'),
  ('Ventolin Inhaler', 'Salbutamol', '100mcg', 'inhaler', '200 doses', 'GSK', true, 4800, '{Asthma}', 'Quick relief from asthma attacks.'),
  ('Gestid', 'Antacid and simeticone', null, 'suspension', '100ml bottle', 'Fidson', false, 1500, '{Stomach}', 'Relief from heartburn, indigestion and gas.'),
  ('Buscopan', 'Hyoscine butylbromide', '10mg', 'tablet', '20 tablets', 'Sanofi', false, 3200, '{Stomach,Pain relief}', 'Relief from stomach cramps.'),
  ('Omeprazole', 'Omeprazole', '20mg', 'capsule', '14 capsules', 'Emzor', false, 1500, '{Stomach}', 'Reduces stomach acid.'),
  ('Emzor ORS', 'Oral rehydration salts', null, 'sachet', '10 sachets', 'Emzor', false, 1000, '{Stomach,Children}', 'Replaces fluids lost through diarrhoea.'),
  ('Zinkid', 'Zinc sulphate', '20mg', 'tablet', '10 tablets', 'Emzor', false, 800, '{Children,Stomach}', 'Zinc for children with diarrhoea.'),
  ('Diclofenac', 'Diclofenac sodium', '50mg', 'tablet', '20 tablets', 'Emzor', true, 1000, '{Pain relief}', 'Relief from joint pain and swelling.'),
  ('Robb', 'Menthol and camphor', null, 'cream', '25g tin', 'Robb Nigeria', false, 700, '{Cough and cold,Pain relief}', 'Rub for blocked noses and aches.'),
  ('Funbact-A', 'Triple action cream', null, 'cream', '30g tube', 'Fidson', false, 1200, '{Skin}', 'For fungal and bacterial skin infections.'),
  ('Dettol Antiseptic', 'Chloroxylenol', null, 'other', '250ml bottle', 'Reckitt', false, 2000, '{First aid}', 'Cleans cuts and grazes.');

insert into public.medicines (brand_name, generic_name, strength, form, pack_size, manufacturer, description, requires_prescription)
select brand, generic, strength, form, pack, maker, descr, rx from seed.catalogue;

insert into public.medicine_tags (medicine_id, tag_id)
select m.id, t.id from seed.catalogue c
join public.medicines m on m.brand_name = c.brand and m.strength is not distinct from c.strength
join public.tags t on t.name = any (c.tags);

insert into public.medicine_photos (medicine_id, storage_path, sort_order)
select id, 'catalogue/' || regexp_replace(lower(brand_name), '[^a-z0-9]+', '-', 'g') || '.jpg', 0 from public.medicines;

-- Each pharmacy stocks about 9 in 10 medicines, at prices up to 20% above the base, rounded to NGN 50.
insert into public.inventory (pharmacy_id, medicine_id, price_kobo, quantity_in_stock, low_stock_threshold, expiry_date)
select p.id, m.id,
       case when p.id = 'a1000000-0000-4000-8000-000000000001' and m.brand_name = 'Coartem' then 345000
            else round(c.base_naira * (1 + (abs(hashtext(p.name || '|' || m.brand_name)) % 21) / 100.0) / 50) * 50 * 100 end,
       case when abs(hashtext(m.brand_name || '#' || p.name)) % 17 = 0 then 0
            when abs(hashtext(m.brand_name || '#' || p.name)) % 11 = 0 then 3
            else 8 + abs(hashtext(p.name || m.brand_name)) % 40 end,
       5,
       (current_date + make_interval(months => 6 + abs(hashtext(m.brand_name || p.name)) % 24))::date
from public.pharmacies p
cross join public.medicines m
join seed.catalogue c on c.brand = m.brand_name and c.strength is not distinct from m.strength
where abs(hashtext(p.name || '~' || m.brand_name)) % 10 <> 0
   or (p.id = 'a1000000-0000-4000-8000-000000000001' and m.brand_name in ('Coartem', 'Panadol Extra', 'Augmentin suspension', 'Loratadine'))
   or (p.id = 'a1000000-0000-4000-8000-000000000002' and m.brand_name in ('Panadol Extra', 'Emzor ORS', 'Amoxil', 'Coartem'))
   or (p.id = 'a1000000-0000-4000-8000-000000000003' and m.brand_name in ('Loratadine'))
   or (p.id = 'a1000000-0000-4000-8000-000000000004' and m.brand_name in ('Gestid', 'Lonart DS'))
   or (p.id = 'a1000000-0000-4000-8000-000000000005' and m.brand_name in ('Glucophage'));
-- Make sure the medicines used in the orders below are in stock.
update public.inventory i set quantity_in_stock = 25 from public.medicines m
where m.id = i.medicine_id and m.brand_name in ('Coartem', 'Panadol Extra', 'Augmentin suspension', 'Loratadine',
  'Emzor ORS', 'Amoxil', 'Gestid', 'Lonart DS', 'Glucophage');

-- ---------- wallets: a top-up for each customer two weeks ago ----------
select public.record_wallet_top_up(c, amt, 'seed-topup-' || n)
from (values (1, 'c0000000-0000-4000-8000-000000000001'::uuid, 2000000), (2, 'c0000000-0000-4000-8000-000000000002'::uuid, 1500000),
             (3, 'c0000000-0000-4000-8000-000000000003'::uuid, 500000), (4, 'c0000000-0000-4000-8000-000000000004'::uuid, 300000),
             (5, 'c0000000-0000-4000-8000-000000000005'::uuid, 2500000)) t(n, c, amt);
update public.wallet_transactions set created_at = now() - interval '14 days' where kind = 'top_up';

-- ---------- prescriptions ----------
insert into public.prescriptions (id, customer_id, storage_path, patient_name, patient_age_years, prescriber_name) values
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003/augmentin-script.jpg', 'Prince Grace', 6, 'Dr. Feyi Wyles'),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000005/amoxil-script.jpg', 'Funke Adeyemi', 34, 'Dr. Tobi Coker'),
  ('e0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004/glucophage-script.jpg', 'Ibrahim Musa', 58, 'Dr. Aisha Lawal');

-- ---------- orders, in date order, through the real server functions ----------
do $$
declare
  p1 uuid := 'a1000000-0000-4000-8000-000000000001'; p2 uuid := 'a1000000-0000-4000-8000-000000000002';
  p3 uuid := 'a1000000-0000-4000-8000-000000000003'; p4 uuid := 'a1000000-0000-4000-8000-000000000004';
  p5 uuid := 'a1000000-0000-4000-8000-000000000005';
  ada uuid := 'c0000000-0000-4000-8000-000000000001'; tunde uuid := 'c0000000-0000-4000-8000-000000000002';
  chiamaka uuid := 'c0000000-0000-4000-8000-000000000003'; ibrahim uuid := 'c0000000-0000-4000-8000-000000000004';
  funke uuid := 'c0000000-0000-4000-8000-000000000005';
  r public.reservations;
  v_pay uuid;
begin
  -- Seed every pharmacy as open so orders can be placed whatever time the seed runs; hours are restored after.
  create temp table saved_hours as select id, open_24_hours from public.pharmacies;
  update public.pharmacies set open_24_hours = true;

  -- 9 days ago: Ada collects Coartem from Admiralty, paid from her wallet (the NGN 3,450 example).
  perform seed.act_as(ada);
  r := public.place_reservation(p1, 'pickup', 'wallet', seed.items(p1, 'Coartem', '80/480mg', '1'));
  perform seed.staff_session(p1, 'assistant');
  perform public.approve_reservation(r.id);
  perform public.mark_ready(r.id);
  select pickup_code into r.pickup_code from public.reservations where id = r.id;
  perform public.complete_pickup(r.id, r.pickup_code);
  perform seed.shift(r.id, interval '9 days');
  insert into public.ratings (reservation_id, customer_id, pharmacy_id, stars, comment)
  values (r.id, ada, p1, 5, 'Ready in five minutes and the pharmacist explained the doses.');
  insert into public.saved_medicines (customer_id, medicine_id, pharmacy_id)
  select ada, medicine_id, p1 from public.reservation_items where reservation_id = r.id;

  -- 5 days ago: Tunde has Panadol Extra and ORS delivered from Adesola, paid by card (NGN 1,000 delivery).
  perform seed.act_as(tunde);
  r := public.place_reservation(p2, 'delivery', 'card', seed.items(p2, 'Panadol Extra', '500mg/65mg', '2', 'Emzor ORS', '', '1'),
    'ad000000-0000-4000-8000-000000000003');
  select id into v_pay from public.payments where reservation_id = r.id;
  perform public.mark_payment_succeeded(v_pay, 'seed-card-' || r.ref_code);
  perform seed.staff_session(p2, 'assistant');
  perform public.approve_reservation(r.id);
  perform public.mark_ready(r.id, 'Musa Ibrahim', '+2348020000001');
  perform public.complete_delivery(r.id);
  perform seed.shift(r.id, interval '5 days');
  insert into public.ratings (reservation_id, customer_id, pharmacy_id, stars, comment)
  values (r.id, tunde, p2, 4, 'Arrived in 40 minutes. Rider called ahead.');

  -- 3 days ago: Ibrahim buys 3 Gestid at Sabo Health and pays at the counter.
  perform seed.act_as(ibrahim);
  r := public.place_reservation(p4, 'pickup', 'at_pharmacy', seed.items(p4, 'Gestid', '', '3'));
  perform seed.staff_session(p4, 'assistant');
  perform public.approve_reservation(r.id);
  perform public.mark_ready(r.id);
  select pickup_code into r.pickup_code from public.reservations where id = r.id;
  perform public.complete_pickup(r.id, r.pickup_code);
  perform seed.shift(r.id, interval '3 days');
  insert into public.saved_medicines (customer_id, medicine_id, pharmacy_id, usual_quantity)
  select ibrahim, medicine_id, p4, 3 from public.reservation_items where reservation_id = r.id;

  -- 2 days ago: Funke's Amoxil prescription is declined at Adesola; her wallet is refunded.
  perform seed.act_as(funke);
  r := public.place_reservation(p2, 'pickup', 'wallet', seed.items(p2, 'Amoxil', '500mg', '1'), null,
    'e0000000-0000-4000-8000-000000000002');
  perform seed.staff_session(p2, 'pharmacist');
  perform public.decline_reservation(r.id, 'Your prescription is more than 6 months old. Please ask your doctor for a new one.');
  perform seed.shift(r.id, interval '2 days');

  -- Yesterday: Ada's Loratadine at Isaac John got no reply within 10 minutes; card payment refunded to wallet.
  perform seed.act_as(ada);
  r := public.place_reservation(p3, 'pickup', 'card', seed.items(p3, 'Loratadine', '10mg', '1'));
  select id into v_pay from public.payments where reservation_id = r.id;
  perform public.mark_payment_succeeded(v_pay, 'seed-card-' || r.ref_code);
  update public.reservations set approval_deadline = now() - interval '1 second' where id = r.id;
  perform public.expire_overdue_reservations();
  perform seed.shift(r.id, interval '1 day');

  -- 6 hours ago: Ibrahim cancelled a Glucophage order at Ogunsanya before paying by bank transfer.
  perform seed.act_as(ibrahim);
  r := public.place_reservation(p5, 'pickup', 'bank_transfer', seed.items(p5, 'Glucophage', '500mg', '1'), null,
    'e0000000-0000-4000-8000-000000000003');
  perform public.cancel_reservation(r.id);
  perform seed.shift(r.id, interval '6 hours');

  -- 50 minutes ago: Tunde's Lonart DS from Sabo Health is out for delivery.
  perform seed.act_as(tunde);
  r := public.place_reservation(p4, 'delivery', 'wallet', seed.items(p4, 'Lonart DS', '80/480mg', '1'),
    'ad000000-0000-4000-8000-000000000003');
  perform seed.staff_session(p4, 'assistant');
  perform public.approve_reservation(r.id);
  perform public.mark_ready(r.id, 'Musa Danjuma', '+2348020000002');
  perform seed.shift(r.id, interval '50 minutes');

  -- 5 minutes ago: Chiamaka's Coartem at Adesola is approved and being packed (pay at the counter).
  perform seed.act_as(chiamaka);
  r := public.place_reservation(p2, 'pickup', 'at_pharmacy', seed.items(p2, 'Coartem', '80/480mg', '1'));
  perform seed.staff_session(p2, 'assistant');
  perform public.approve_reservation(r.id);
  perform seed.shift(r.id, interval '5 minutes');

  -- Just now: Chiamaka's Augmentin prescription at Admiralty: 4 checks ticked, approved, ready to collect.
  perform seed.act_as(chiamaka);
  r := public.place_reservation(p1, 'pickup', 'at_pharmacy', seed.items(p1, 'Augmentin suspension', '228mg/5ml', '1'), null,
    'e0000000-0000-4000-8000-000000000001');
  perform seed.staff_session(p1, 'pharmacist');
  perform public.set_prescription_check(r.id, 'medicine_and_dosage');
  perform public.set_prescription_check(r.id, 'patient_name_and_age');
  perform public.set_prescription_check(r.id, 'prescriber_name_and_signature');
  perform public.set_prescription_check(r.id, 'dose_suits_patient_age');
  perform public.approve_reservation(r.id);
  perform public.mark_ready(r.id);
  insert into public.conversations (id, customer_id, pharmacy_id, reservation_id)
  values ('d0000000-0000-4000-8000-000000000001', chiamaka, p1, r.id);
  insert into public.messages (conversation_id, sender, body, created_at)
  values ('d0000000-0000-4000-8000-000000000001', 'customer', 'Good afternoon. Should the suspension be kept in the fridge?', now() - interval '4 minutes');
  insert into public.messages (conversation_id, sender, sender_staff_id, body, created_at)
  select 'd0000000-0000-4000-8000-000000000001', 'staff', id, 'Yes, once mixed keep it in the fridge and finish it within 7 days. It is ready at the counter.', now() - interval '2 minutes'
  from public.pharmacy_staff where user_id = 'b0000000-0000-4000-8000-000000000012';

  -- Waiting now: Funke's Panadol Extra at Admiralty, paid from her wallet (expires 10 minutes after the seed runs).
  perform seed.act_as(funke);
  r := public.place_reservation(p1, 'pickup', 'wallet', seed.items(p1, 'Panadol Extra', '500mg/65mg', '2'));

  update public.pharmacies p set open_24_hours = s.open_24_hours from saved_hours s where s.id = p.id;
  drop table saved_hours;
end $$;

-- A general MedChat thread with no order attached.
insert into public.conversations (id, customer_id, pharmacy_id) values
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000004');
insert into public.messages (conversation_id, sender, body, created_at, read_at) values
  ('d0000000-0000-4000-8000-000000000002', 'customer', 'Do you have Glucophage 500mg in stock this week?', now() - interval '1 day', now() - interval '23 hours');
insert into public.messages (conversation_id, sender, sender_staff_id, body, created_at)
select 'd0000000-0000-4000-8000-000000000002', 'staff', id, 'Not at the moment, sorry. We expect a delivery on Monday.', now() - interval '23 hours'
from public.pharmacy_staff where user_id = 'b0000000-0000-4000-8000-000000000042';

-- The payout due on Friday 27 November 2026 for the completed orders above.
select public.generate_payouts(date '2026-11-27');

-- Clean up: no seeded staff stays unlocked, and the helpers go away.
delete from public.staff_sessions;
select set_config('request.jwt.claims', '', false);
drop schema seed cascade;
