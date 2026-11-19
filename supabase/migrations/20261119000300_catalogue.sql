-- The shared medicine catalogue, tags, photos, and each pharmacy's stock and prices.

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  generic_name text not null,
  strength text,
  form public.medicine_form not null,
  pack_size text,
  manufacturer text,
  description text,
  requires_prescription boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_name, strength, form, pack_size)
);
create index medicines_search_idx on public.medicines
  using gin (to_tsvector('simple', brand_name || ' ' || generic_name));

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.medicine_tags (
  medicine_id uuid not null references public.medicines (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (medicine_id, tag_id)
);
create index medicine_tags_tag_idx on public.medicine_tags (tag_id);

create table public.medicine_photos (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references public.medicines (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index medicine_photos_medicine_idx on public.medicine_photos (medicine_id, sort_order);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  medicine_id uuid not null references public.medicines (id) on delete restrict,
  price_kobo bigint not null check (price_kobo > 0),
  quantity_in_stock int not null default 0 check (quantity_in_stock >= 0),
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  expiry_date date,
  is_listed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, medicine_id)
);
create index inventory_medicine_idx on public.inventory (medicine_id) where is_listed;

create trigger medicines_touch before update on public.medicines for each row execute function private.touch_updated_at();
create trigger inventory_touch before update on public.inventory for each row execute function private.touch_updated_at();
