-- Customers, addresses, pharmacies, staff, staff passcode sessions and shifts.

create table public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  email text,
  avatar_path text,
  appearance public.appearance not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.customers is 'One row per customer account. id is the Supabase auth user id.';

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  label text not null default 'Home',
  street text not null,
  area text not null,
  city text not null default 'Lagos',
  state text not null default 'Lagos',
  landmark text,
  contact_phone text,
  location extensions.geography(point, 4326),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_customer_idx on public.addresses (customer_id);
create unique index addresses_one_default on public.addresses (customer_id) where is_default;

create table public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  street text not null,
  area text not null,
  city text not null default 'Lagos',
  state text not null default 'Lagos',
  location extensions.geography(point, 4326) not null,
  phone text not null,
  email text,
  licence_number text,
  pharmacist_in_charge text,
  -- Lagos time, e.g. {"mon":{"open":"08:00","close":"21:00"}}. A missing day means closed.
  opening_hours jsonb not null default '{}'::jsonb,
  open_24_hours boolean not null default false,
  offers_delivery boolean not null default true,
  services text[] not null default '{}',
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pharmacies_location_idx on public.pharmacies using gist (location);
comment on table public.pharmacies is 'One row per pharmacy. Public details are readable by anyone once is_live.';

create table public.pharmacy_payout_accounts (
  pharmacy_id uuid primary key references public.pharmacies (id) on delete cascade,
  bank_name text not null,
  account_number text not null check (account_number ~ '^\d{10}$'),
  account_name text not null,
  paystack_recipient_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.pharmacy_payout_accounts is 'Where payouts are sent. Only owners and managers can read it.';

create table public.pharmacy_staff (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.staff_role not null,
  -- bcrypt hash of the 5-digit staff passcode. Never readable through the API.
  passcode_hash text,
  failed_passcode_attempts int not null default 0,
  locked_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, user_id)
);
create index pharmacy_staff_user_idx on public.pharmacy_staff (user_id);
comment on table public.pharmacy_staff is 'Everyone who works at a pharmacy. Each signs in with their own email and password, then their passcode.';

-- A staff member's sign-in session is only trusted once their passcode has matched.
create table public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.pharmacy_staff (id) on delete cascade,
  auth_session_id uuid not null,
  unlocked_at timestamptz not null default now(),
  unique (staff_id, auth_session_id)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  staff_id uuid not null references public.pharmacy_staff (id) on delete cascade,
  clock_in_at timestamptz not null default now(),
  clock_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (clock_out_at is null or clock_out_at > clock_in_at)
);
create unique index shifts_one_open_per_staff on public.shifts (staff_id) where clock_out_at is null;
create index shifts_pharmacy_idx on public.shifts (pharmacy_id, clock_in_at desc);

create trigger customers_touch before update on public.customers for each row execute function private.touch_updated_at();
create trigger addresses_touch before update on public.addresses for each row execute function private.touch_updated_at();
create trigger pharmacies_touch before update on public.pharmacies for each row execute function private.touch_updated_at();
create trigger payout_accounts_touch before update on public.pharmacy_payout_accounts for each row execute function private.touch_updated_at();
create trigger pharmacy_staff_touch before update on public.pharmacy_staff for each row execute function private.touch_updated_at();
create trigger shifts_touch before update on public.shifts for each row execute function private.touch_updated_at();

-- New sign-ups become customers unless they were created as staff accounts.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'account_type', 'customer') = 'customer' then
    insert into public.customers (id, full_name, phone, email)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.raw_user_meta_data ->> 'phone', new.email);
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();
