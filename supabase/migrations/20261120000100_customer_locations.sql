-- Location access: the customer's current location, saved from GPS or a typed address.
-- One row per customer. Only the customer can see or change it.

create table public.customer_locations (
  customer_id uuid primary key references public.customers (id) on delete cascade,
  label text not null check (length(btrim(label)) > 0),
  address_line text,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  accuracy_m real check (accuracy_m is null or accuracy_m >= 0),
  source text not null default 'gps' check (source in ('gps', 'address')),
  location extensions.geography(point, 4326)
    generated always as (extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography) stored,
  updated_at timestamptz not null default now(),
  constraint typed_address_has_no_accuracy check (source = 'gps' or accuracy_m is null)
);
comment on table public.customer_locations is
  'The customer''s current location from Location access. label is what the app shows (e.g. "GRA Phase 2"), address_line the line under it, accuracy_m the GPS radius in metres (null for a typed address).';

create trigger customer_locations_touch before update on public.customer_locations
  for each row execute function private.touch_updated_at();

alter table public.customer_locations enable row level security;

revoke all on public.customer_locations from anon, authenticated;
grant select, delete on public.customer_locations to authenticated;
grant insert (customer_id, label, address_line, lat, lng, accuracy_m, source) on public.customer_locations to authenticated;
-- customer_id is included because upserts (insert ... on conflict do update) set every column sent;
-- the policy below still stops anyone moving a row to another customer.
grant update (customer_id, label, address_line, lat, lng, accuracy_m, source) on public.customer_locations to authenticated;

create policy "customers manage own location" on public.customer_locations for all to authenticated
  using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));
