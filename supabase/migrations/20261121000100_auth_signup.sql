-- Sign up, log in and pharmacy applications.
-- * Sign-in lockout (5 wrong tries, then 5 minutes) that works on any device.
-- * Pharmacy applications: draft -> submitted -> approved / rejected. Only approved pharmacies go live.
-- * Licence documents in a private bucket that only the owner (and MedFind, via the service role) can open.
-- * Server functions the sign-up and sign-in screens call.

-- ---------- rules (kept in step with packages/core/src/auth.ts by test/rules-sync.test.ts) ----------
create function private.rule_sign_in_max_attempts() returns int language sql immutable as $$ select 5 $$;
create function private.rule_sign_in_lock_minutes() returns int language sql immutable as $$ select 5 $$;

-- The same words-in-the-business-name check as accountNameMatchesBusiness in packages/core.
create function private.name_tokens(p_name text) returns text[]
language sql immutable as $$
  select coalesce(array_agg(t), '{}')
  from unnest(regexp_split_to_array(
         btrim(regexp_replace(replace(upper(coalesce(p_name, '')), '&', ' AND '), '[^A-Z0-9 ]', ' ', 'g')), '\s+')) as t
  where t <> '' and t <> all (array['LTD', 'LIMITED', 'NIG', 'NIGERIA', 'PLC', 'CO', 'COMPANY', 'ENTERPRISE',
    'ENTERPRISES', 'VENTURE', 'VENTURES', 'AND', 'THE', 'INTL', 'INTERNATIONAL', 'GLOBAL', 'SERVICES', 'RC', 'BN'])
$$;

create function private.account_name_matches(p_account text, p_business text) returns boolean
language sql immutable as $$
  select cardinality(private.name_tokens(p_business)) > 0
     and private.name_tokens(p_business) <@ private.name_tokens(p_account)
$$;

-- ---------- pharmacy applications ----------
create type public.pharmacy_application_status as enum ('draft', 'submitted', 'approved', 'rejected');
create type public.pharmacy_document_kind as enum ('premises_licence', 'superintendent_licence', 'cac_certificate', 'shop_front');

-- Pharmacies that already exist (the seed) are approved; new ones start as drafts.
alter table public.pharmacies
  add column application_status public.pharmacy_application_status not null default 'approved',
  add column landmark text,
  add column pcn_number text,
  add column submitted_at timestamptz,
  add column reviewed_at timestamptz,
  add column rejection_reason text;
alter table public.pharmacies alter column application_status set default 'draft';
alter table public.pharmacies add constraint live_only_when_approved check (not is_live or application_status = 'approved');
create unique index pharmacies_pcn_number_key on public.pharmacies (pcn_number) where pcn_number is not null;
comment on column public.pharmacies.pcn_number is 'Superintendent pharmacist''s PCN registration number, digits and letters only (e.g. 00814472).';

alter table public.pharmacy_payout_accounts
  add column bank_code text,
  add column verified_at timestamptz;

create table public.pharmacy_documents (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  kind public.pharmacy_document_kind not null,
  storage_path text not null unique,
  file_name text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  mime_type text not null,
  uploaded_at timestamptz not null default now()
);
-- One file per licence; any number of shop-front photos.
create unique index pharmacy_documents_one_per_licence on public.pharmacy_documents (pharmacy_id, kind) where kind <> 'shop_front';
comment on table public.pharmacy_documents is 'Licence documents and shop photos from pharmacy sign up. Only the owner and MedFind can open them.';

alter table public.pharmacy_documents enable row level security;
revoke all on public.pharmacy_documents from anon, authenticated;
grant select on public.pharmacy_documents to authenticated;

-- The caller owns this pharmacy (no passcode needed: used during sign up, before a passcode exists).
create function private.is_owner_user(p_pharmacy uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.pharmacy_staff s
                 where s.pharmacy_id = p_pharmacy and s.user_id = auth.uid() and s.role = 'owner' and s.is_active)
$$;
grant execute on function private.is_owner_user to authenticated;

create policy "owners read their documents" on public.pharmacy_documents for select to authenticated
  using (private.is_owner_user(pharmacy_id));

-- Owners can see their own pharmacy while it isn't live yet (to resume sign up).
create policy "owners read their pharmacy" on public.pharmacies for select to authenticated
  using (private.is_owner_user(id));
create policy "owners read their payout account" on public.pharmacy_payout_accounts for select to authenticated
  using (private.is_owner_user(pharmacy_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('pharmacy-documents', 'pharmacy-documents', false, 10485760,
   array['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

-- Files live under <pharmacy_id>/<kind>/<file>. Owners add and remove them while the application is a draft.
create policy "owners upload pharmacy documents" on storage.objects for insert to authenticated
  with check (bucket_id = 'pharmacy-documents' and exists (
    select 1 from public.pharmacies p where p.id::text = (storage.foldername(name))[1]
      and p.application_status = 'draft' and private.is_owner_user(p.id)));
create policy "owners read pharmacy documents" on storage.objects for select to authenticated
  using (bucket_id = 'pharmacy-documents' and exists (
    select 1 from public.pharmacies p where p.id::text = (storage.foldername(name))[1] and private.is_owner_user(p.id)));
create policy "owners remove draft pharmacy documents" on storage.objects for delete to authenticated
  using (bucket_id = 'pharmacy-documents' and exists (
    select 1 from public.pharmacies p where p.id::text = (storage.foldername(name))[1]
      and p.application_status = 'draft' and private.is_owner_user(p.id)));

-- ---------- sign-in lockout ----------
create table private.sign_in_attempts (
  identifier text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
comment on table private.sign_in_attempts is 'Wrong-password counts per email or phone. 5 wrong tries lock sign-in for 5 minutes.';

create function private.normalise_identifier(p_identifier text) returns text
language sql immutable as $$
  select case when position('@' in p_identifier) > 0 then lower(btrim(p_identifier))
              else regexp_replace(p_identifier, '[^0-9]', '', 'g') end
$$;

create function private.auth_user_for(p_identifier text) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from auth.users u
  where (position('@' in p_identifier) > 0 and lower(u.email) = lower(btrim(p_identifier)))
     or (position('@' in p_identifier) = 0 and u.phone = regexp_replace(p_identifier, '[^0-9]', '', 'g')
         and u.phone_confirmed_at is not null)
  limit 1
$$;

create function private.lock_seconds(p_identifier text) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(greatest(0, ceil(extract(epoch from (a.locked_until - now()))))::int, 0)
  from private.sign_in_attempts a where a.identifier = private.normalise_identifier(p_identifier)
$$;

-- Before checking a password: does the account exist, which app is it for, and is sign-in locked?
-- account is 'customer', 'staff' or 'none'.
create function public.sign_in_precheck(p_identifier text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := private.auth_user_for(p_identifier);
  v_account text := 'none';
begin
  if v_user is not null then
    if exists (select 1 from public.pharmacy_staff s where s.user_id = v_user and s.is_active) then v_account := 'staff';
    elsif exists (select 1 from public.customers c where c.id = v_user) then v_account := 'customer';
    end if;
  end if;
  return jsonb_build_object('account', v_account, 'locked_seconds', coalesce(private.lock_seconds(p_identifier), 0));
end $$;

-- After a wrong password. Returns how long sign-in is now locked for (0 if not locked).
create function public.record_sign_in_failure(p_identifier text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_id text := private.normalise_identifier(p_identifier);
  a private.sign_in_attempts;
begin
  if v_id = '' then return 0; end if;
  insert into private.sign_in_attempts as s (identifier, failed_count, updated_at) values (v_id, 1, now())
  on conflict (identifier) do update set
    -- A lock that has run out starts the count again.
    failed_count = case when s.locked_until is not null and s.locked_until <= now() then 1 else s.failed_count + 1 end,
    locked_until = case when s.locked_until is not null and s.locked_until <= now() then null else s.locked_until end,
    updated_at = now()
  returning * into a;
  if a.locked_until is null and a.failed_count >= private.rule_sign_in_max_attempts() then
    update private.sign_in_attempts
       set locked_until = now() + make_interval(mins => private.rule_sign_in_lock_minutes()), failed_count = 0
     where identifier = v_id returning * into a;
  end if;
  return coalesce(private.lock_seconds(v_id), 0);
end $$;

-- After a successful sign in: forget the caller's wrong tries.
create function public.clear_sign_in_failures() returns void
language sql security definer set search_path = '' as $$
  delete from private.sign_in_attempts a using auth.users u
  where u.id = auth.uid()
    and (a.identifier = lower(u.email) or (u.phone is not null and a.identifier = u.phone))
$$;

-- Before sign up: is the email or phone already used?
create function public.sign_up_precheck(p_email text, p_phone text default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email_in_use', exists (select 1 from auth.users u where lower(u.email) = lower(btrim(p_email))),
    'phone_in_use', p_phone is not null and exists (
      select 1 from auth.users u where u.phone = regexp_replace(p_phone, '[^0-9]', '', 'g') and u.phone_confirmed_at is not null)
      or exists (select 1 from public.customers c where c.phone = p_phone))
$$;

-- ---------- staff sign in ----------
-- The signed-in user's staff membership, for the sign-in screen: which pharmacy, whether a passcode
-- is set, whether passcode entry is locked, and where the application is.
create function public.my_staff_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'staff_id', s.id, 'pharmacy_id', p.id, 'pharmacy_name', p.name, 'role', s.role,
    'application_status', p.application_status, 'has_passcode', s.passcode_hash is not null,
    'passcode_locked_seconds', coalesce(greatest(0, ceil(extract(epoch from (s.locked_until - now()))))::int, 0))
  from public.pharmacy_staff s join public.pharmacies p on p.id = s.pharmacy_id
  where s.user_id = auth.uid() and s.is_active
  order by (s.role = 'owner') desc, s.created_at
  limit 1
$$;

-- ---------- pharmacy sign up ----------
-- Step 1. The first call creates the pharmacy (a draft) and makes the caller its owner; later calls
-- update the draft. p_details keys: name, phone, street, area, city, state, landmark, lat, lng,
-- superintendent_name, pcn_number, email.
create function public.save_pharmacy_details(p_details jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_pharmacy uuid;
  v_status public.pharmacy_application_status;
  v_pcn text := nullif(regexp_replace(upper(regexp_replace(coalesce(p_details ->> 'pcn_number', ''), '^\s*PCN', '', 'i')), '[^0-9A-Z]', '', 'g'), '');
  v_point extensions.geography;
begin
  if v_user is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if v_pcn is null or coalesce(btrim(p_details ->> 'name'), '') = '' or coalesce(btrim(p_details ->> 'street'), '') = ''
     or coalesce(btrim(p_details ->> 'area'), '') = '' or (p_details ->> 'lat') is null or (p_details ->> 'lng') is null then
    raise exception 'Some pharmacy details are missing' using errcode = '22023';
  end if;
  v_point := extensions.st_setsrid(extensions.st_makepoint((p_details ->> 'lng')::float8, (p_details ->> 'lat')::float8), 4326)::extensions.geography;

  select p.id, p.application_status into v_pharmacy, v_status
  from public.pharmacy_staff s join public.pharmacies p on p.id = s.pharmacy_id
  where s.user_id = v_user and s.role = 'owner' limit 1;

  if exists (select 1 from public.pharmacies p where p.pcn_number = v_pcn and p.id is distinct from v_pharmacy) then
    raise exception 'pcn_in_use' using errcode = '23505';
  end if;

  if v_pharmacy is null then
    if exists (select 1 from public.pharmacy_staff s where s.user_id = v_user) or exists (select 1 from public.customers c where c.id = v_user) then
      raise exception 'This account can''t create a pharmacy' using errcode = '42501';
    end if;
    insert into public.pharmacies (name, street, area, city, state, location, phone, email, landmark,
      pharmacist_in_charge, pcn_number, application_status, is_live)
    values (btrim(p_details ->> 'name'), btrim(p_details ->> 'street'), btrim(p_details ->> 'area'),
      p_details ->> 'city', p_details ->> 'state', v_point, p_details ->> 'phone', lower(p_details ->> 'email'),
      nullif(btrim(p_details ->> 'landmark'), ''), btrim(p_details ->> 'superintendent_name'), v_pcn, 'draft', false)
    returning id into v_pharmacy;
    insert into public.pharmacy_staff (pharmacy_id, user_id, full_name, email, role)
    values (v_pharmacy, v_user, btrim(p_details ->> 'superintendent_name'),
      coalesce(lower(p_details ->> 'email'), (select lower(email) from auth.users where id = v_user)), 'owner');
  else
    if v_status <> 'draft' then raise exception 'This application has already been submitted' using errcode = '42501'; end if;
    update public.pharmacies set name = btrim(p_details ->> 'name'), street = btrim(p_details ->> 'street'),
      area = btrim(p_details ->> 'area'), city = p_details ->> 'city', state = p_details ->> 'state', location = v_point,
      phone = p_details ->> 'phone', landmark = nullif(btrim(p_details ->> 'landmark'), ''),
      pharmacist_in_charge = btrim(p_details ->> 'superintendent_name'), pcn_number = v_pcn
    where id = v_pharmacy;
    update public.pharmacy_staff set full_name = btrim(p_details ->> 'superintendent_name')
    where pharmacy_id = v_pharmacy and user_id = v_user;
  end if;
  return v_pharmacy;
end $$;

-- Everything sign up needs to resume where the owner left off.
create function public.my_pharmacy_application() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'pharmacy', jsonb_build_object('id', p.id, 'name', p.name, 'phone', p.phone, 'street', p.street, 'area', p.area,
      'city', p.city, 'state', p.state, 'landmark', p.landmark, 'superintendent_name', p.pharmacist_in_charge,
      'pcn_number', p.pcn_number, 'email', p.email, 'lat', extensions.st_y(p.location::extensions.geometry),
      'lng', extensions.st_x(p.location::extensions.geometry), 'application_status', p.application_status,
      'submitted_at', p.submitted_at, 'rejection_reason', p.rejection_reason),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'kind', d.kind, 'file_name', d.file_name,
      'size_bytes', d.size_bytes, 'storage_path', d.storage_path) order by d.uploaded_at)
      from public.pharmacy_documents d where d.pharmacy_id = p.id), '[]'::jsonb),
    'payout', (select jsonb_build_object('bank_name', a.bank_name, 'bank_code', a.bank_code, 'account_number', a.account_number,
      'account_name', a.account_name, 'verified', a.verified_at is not null)
      from public.pharmacy_payout_accounts a where a.pharmacy_id = p.id))
  from public.pharmacy_staff s join public.pharmacies p on p.id = s.pharmacy_id
  where s.user_id = auth.uid() and s.role = 'owner'
  limit 1
$$;

-- Step 2: record a file the owner has uploaded to storage. A new licence replaces the old one.
create function public.add_pharmacy_document(p_kind public.pharmacy_document_kind, p_storage_path text,
  p_file_name text, p_size_bytes bigint, p_mime_type text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_pharmacy uuid := (storage.foldername(p_storage_path))[1]::uuid;
  v_id uuid;
begin
  if not private.is_owner_user(v_pharmacy) then raise exception 'Not your pharmacy' using errcode = '42501'; end if;
  if (select application_status from public.pharmacies where id = v_pharmacy) <> 'draft' then
    raise exception 'This application has already been submitted' using errcode = '42501';
  end if;
  if p_kind <> 'shop_front' then
    delete from public.pharmacy_documents where pharmacy_id = v_pharmacy and kind = p_kind;
  end if;
  insert into public.pharmacy_documents (pharmacy_id, kind, storage_path, file_name, size_bytes, mime_type)
  values (v_pharmacy, p_kind, p_storage_path, p_file_name, p_size_bytes, p_mime_type)
  returning id into v_id;
  return v_id;
end $$;

create function public.remove_pharmacy_document(p_document_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d public.pharmacy_documents;
begin
  select * into d from public.pharmacy_documents where id = p_document_id;
  if not found or not private.is_owner_user(d.pharmacy_id) then raise exception 'Not your document' using errcode = '42501'; end if;
  if (select application_status from public.pharmacies where id = d.pharmacy_id) <> 'draft' then
    raise exception 'This application has already been submitted' using errcode = '42501';
  end if;
  delete from public.pharmacy_documents where id = p_document_id;
end $$;

-- Step 3 is saved by the paystack-resolve-account edge function (service role), which asks Paystack
-- for the account name first. It calls this so the name check happens in the database too.
create function public.save_verified_payout_account(p_user uuid, p_bank_name text, p_bank_code text,
  p_account_number text, p_account_name text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_pharmacy uuid; v_name text;
begin
  select p.id, p.name into v_pharmacy, v_name from public.pharmacy_staff s join public.pharmacies p on p.id = s.pharmacy_id
  where s.user_id = p_user and s.role = 'owner' and p.application_status = 'draft' limit 1;
  if v_pharmacy is null then raise exception 'No draft pharmacy for this account' using errcode = '42501'; end if;
  if not private.account_name_matches(p_account_name, v_name) then return false; end if;
  insert into public.pharmacy_payout_accounts (pharmacy_id, bank_name, bank_code, account_number, account_name, verified_at)
  values (v_pharmacy, p_bank_name, p_bank_code, p_account_number, p_account_name, now())
  on conflict (pharmacy_id) do update set bank_name = excluded.bank_name, bank_code = excluded.bank_code,
    account_number = excluded.account_number, account_name = excluded.account_name, verified_at = now(),
    paystack_recipient_code = null;
  return true;
end $$;

-- Step 4: submit. Checks every step, then creates the owner's 5-digit staff passcode and returns it
-- once (it's stored only as a hash). The pharmacy stays off the map until MedFind approves it.
create function public.submit_pharmacy_application() returns text
language plpgsql security definer set search_path = '' as $$
declare
  s public.pharmacy_staff;
  p public.pharmacies;
  v_code text := lpad(floor(random() * 100000)::int::text, private.rule_staff_passcode_length(), '0');
begin
  select * into s from public.pharmacy_staff where user_id = auth.uid() and role = 'owner' limit 1;
  if not found then raise exception 'No pharmacy for this account' using errcode = '42501'; end if;
  select * into p from public.pharmacies where id = s.pharmacy_id for update;
  if p.application_status <> 'draft' then raise exception 'This application has already been submitted' using errcode = '42501'; end if;
  if (select count(distinct kind) from public.pharmacy_documents
      where pharmacy_id = p.id and kind in ('premises_licence', 'superintendent_licence', 'cac_certificate')) < 3 then
    raise exception 'Upload all 3 required documents first' using errcode = '22023';
  end if;
  if not exists (select 1 from public.pharmacy_payout_accounts where pharmacy_id = p.id and verified_at is not null) then
    raise exception 'Add a verified payout account first' using errcode = '22023';
  end if;
  update public.pharmacies set application_status = 'submitted', submitted_at = now() where id = p.id;
  update public.pharmacy_staff set passcode_hash = extensions.crypt(v_code, extensions.gen_salt('bf')),
    failed_passcode_attempts = 0, locked_until = null where id = s.id;
  return v_code;
end $$;

-- MedFind's team approves or rejects an application (service role only, e.g. from Supabase Studio).
-- Approving puts the pharmacy live so patients can find and reserve its stock.
create function public.review_pharmacy_application(p_pharmacy_id uuid, p_approve boolean, p_reason text default null)
returns public.pharmacies
language plpgsql security definer set search_path = '' as $$
declare p public.pharmacies;
begin
  select * into p from public.pharmacies where id = p_pharmacy_id for update;
  if not found or p.application_status <> 'submitted' then
    raise exception 'Only submitted applications can be reviewed' using errcode = '22023';
  end if;
  if not p_approve and coalesce(btrim(p_reason), '') = '' then
    raise exception 'Give a reason when rejecting' using errcode = '22023';
  end if;
  update public.pharmacies set application_status = case when p_approve then 'approved' else 'rejected' end::public.pharmacy_application_status,
    is_live = p_approve, reviewed_at = now(), rejection_reason = case when p_approve then null else btrim(p_reason) end
  where id = p_pharmacy_id returning * into p;
  return p;
end $$;

-- ---------- local SMS (development only) ----------
-- supabase/config.toml points the Send SMS hook here for local development, so phone codes
-- work without an SMS provider. Codes land in private.dev_sms_outbox. Production uses a real
-- provider set in the Supabase dashboard, never this hook.
create table private.dev_sms_outbox (
  id bigint generated always as identity primary key,
  phone text not null,
  otp text not null,
  created_at timestamptz not null default now()
);

create function private.dev_send_sms_hook(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  insert into private.dev_sms_outbox (phone, otp) values (coalesce(nullif(event -> 'user' ->> 'phone', ''), event -> 'user' ->> 'phone_change'), event -> 'sms' ->> 'otp');
  return '{}'::jsonb;
end $$;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.dev_send_sms_hook to supabase_auth_admin;
grant insert on private.dev_sms_outbox to supabase_auth_admin;
revoke execute on function private.dev_send_sms_hook from public, anon, authenticated;

-- ---------- who may call what ----------
revoke execute on function public.sign_in_precheck, public.record_sign_in_failure, public.clear_sign_in_failures,
  public.sign_up_precheck, public.my_staff_state, public.save_pharmacy_details, public.my_pharmacy_application,
  public.add_pharmacy_document, public.remove_pharmacy_document, public.save_verified_payout_account,
  public.submit_pharmacy_application, public.review_pharmacy_application from public, anon, authenticated;
-- Internal helpers stay internal (anon can use the private schema for the RLS helpers).
revoke execute on function private.rule_sign_in_max_attempts, private.rule_sign_in_lock_minutes, private.name_tokens,
  private.account_name_matches, private.normalise_identifier, private.auth_user_for, private.lock_seconds
  from public, anon, authenticated;
revoke all on private.sign_in_attempts, private.dev_sms_outbox from public, anon, authenticated;
revoke execute on function private.is_owner_user from public, anon;
grant execute on function public.sign_in_precheck, public.record_sign_in_failure, public.sign_up_precheck to anon, authenticated;
grant execute on function public.clear_sign_in_failures, public.my_staff_state, public.save_pharmacy_details,
  public.my_pharmacy_application, public.add_pharmacy_document, public.remove_pharmacy_document,
  public.submit_pharmacy_application to authenticated;
grant execute on function public.save_verified_payout_account, public.review_pharmacy_application to service_role;
