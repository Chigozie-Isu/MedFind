-- Ratings, saved medicines, MedChat and notifications.

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
create index ratings_pharmacy_idx on public.ratings (pharmacy_id);

create table public.saved_medicines (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  medicine_id uuid not null references public.medicines (id) on delete cascade,
  pharmacy_id uuid references public.pharmacies (id) on delete set null,
  usual_quantity int not null default 1 check (usual_quantity > 0),
  created_at timestamptz not null default now(),
  unique (customer_id, medicine_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
create index conversations_customer_idx on public.conversations (customer_id, last_message_at desc);
create index conversations_pharmacy_idx on public.conversations (pharmacy_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender public.actor_kind not null check (sender in ('customer', 'staff')),
  sender_staff_id uuid references public.pharmacy_staff (id) on delete set null,
  body text,
  -- Path inside the private "medchat" bucket: <conversation_id>/<file>.
  attachment_path text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (body is not null or attachment_path is not null),
  check ((sender = 'staff') = (sender_staff_id is not null))
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete cascade,
  pharmacy_id uuid references public.pharmacies (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  reservation_id uuid references public.reservations (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check ((customer_id is null) <> (pharmacy_id is null))
);
create index notifications_customer_idx on public.notifications (customer_id, created_at desc) where customer_id is not null;
create index notifications_pharmacy_idx on public.notifications (pharmacy_id, created_at desc) where pharmacy_id is not null;

-- Public star average per pharmacy (no customer details).
create view public.pharmacy_rating_summary as
  select pharmacy_id, count(*)::int as rating_count, round(avg(stars)::numeric, 1) as average_stars
  from public.ratings group by pharmacy_id;
