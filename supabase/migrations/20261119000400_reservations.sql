-- Prescriptions, reservations, their items, status history and the pharmacist's 4 checks.

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  -- Path inside the private "prescriptions" storage bucket: <customer_id>/<file>.
  storage_path text not null,
  patient_name text,
  patient_age_years int check (patient_age_years between 0 and 130),
  prescriber_name text,
  created_at timestamptz not null default now(),
  check (storage_path like customer_id::text || '/%')
);
create index prescriptions_customer_idx on public.prescriptions (customer_id);

create sequence private.reservation_ref_seq start 101;

-- Reference shown on screens, e.g. "AB-145".
create function private.next_ref_code() returns text
language sql volatile security definer set search_path = '' as $$
  select chr(65 + floor(random() * 26)::int) || chr(65 + floor(random() * 26)::int)
         || '-' || nextval('private.reservation_ref_seq')::text
$$;

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  ref_code text not null unique default private.next_ref_code(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  pharmacy_id uuid not null references public.pharmacies (id) on delete restrict,
  fulfilment public.fulfilment not null,
  kind public.order_kind not null,
  status public.reservation_status not null default 'pending',
  payment_method public.payment_method not null,
  subtotal_kobo bigint not null check (subtotal_kobo > 0),
  delivery_fee_kobo bigint not null check (delivery_fee_kobo >= 0),
  service_fee_kobo bigint not null default 0 check (service_fee_kobo >= 0),
  total_kobo bigint not null,
  commission_kobo bigint check (commission_kobo >= 0),
  delivery_address_id uuid references public.addresses (id) on delete set null,
  delivery_address jsonb,
  customer_note text,
  prescription_id uuid references public.prescriptions (id) on delete restrict,
  placed_at timestamptz not null default now(),
  approval_deadline timestamptz not null,
  approved_at timestamptz,
  approved_by_staff_id uuid references public.pharmacy_staff (id) on delete set null,
  declined_at timestamptz,
  declined_by_staff_id uuid references public.pharmacy_staff (id) on delete set null,
  decline_reason text,
  ready_at timestamptz,
  pickup_code text,
  pickup_deadline timestamptz,
  pickup_warned_30_at timestamptz,
  pickup_warned_15_at timestamptz,
  rider_name text,
  rider_phone text,
  handed_to_rider_at timestamptz,
  completed_at timestamptz,
  completed_by_staff_id uuid references public.pharmacy_staff (id) on delete set null,
  expired_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint total_adds_up check (total_kobo = subtotal_kobo + delivery_fee_kobo + service_fee_kobo),
  constraint delivery_fee_matches check (
    (fulfilment = 'pickup' and delivery_fee_kobo = 0) or (fulfilment = 'delivery' and delivery_fee_kobo > 0)
  ),
  constraint delivery_needs_address check (fulfilment = 'pickup' or delivery_address is not null),
  constraint prescription_needs_photo check (kind = 'otc' or prescription_id is not null),
  constraint decline_needs_reason check (status <> 'declined' or length(trim(coalesce(decline_reason, ''))) >= 3),
  constraint pickup_code_shape check (pickup_code is null or pickup_code ~ '^\d{6}$')
);
create index reservations_customer_idx on public.reservations (customer_id, placed_at desc);
create index reservations_pharmacy_idx on public.reservations (pharmacy_id, status, placed_at desc);
create index reservations_pending_deadline_idx on public.reservations (approval_deadline) where status = 'pending';
create index reservations_pickup_deadline_idx on public.reservations (pickup_deadline) where status = 'ready_for_pickup';

create table public.reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  medicine_id uuid not null references public.medicines (id) on delete restrict,
  inventory_id uuid references public.inventory (id) on delete set null,
  medicine_name text not null,
  quantity int not null check (quantity > 0),
  unit_price_kobo bigint not null check (unit_price_kobo > 0),
  line_total_kobo bigint generated always as (unit_price_kobo * quantity) stored
);
create index reservation_items_reservation_idx on public.reservation_items (reservation_id);

create table public.reservation_status_history (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  from_status public.reservation_status,
  to_status public.reservation_status not null,
  actor public.actor_kind not null,
  actor_staff_id uuid references public.pharmacy_staff (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index status_history_reservation_idx on public.reservation_status_history (reservation_id, created_at);

create table public.prescription_checks (
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  "check" public.prescription_check not null,
  checked_by_staff_id uuid not null references public.pharmacy_staff (id) on delete restrict,
  checked_at timestamptz not null default now(),
  primary key (reservation_id, "check")
);

create trigger reservations_touch before update on public.reservations for each row execute function private.touch_updated_at();
