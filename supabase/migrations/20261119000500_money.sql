-- Payments, the customer wallet and pharmacy payouts. Rows here are never edited by apps:
-- only server functions write them.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  method public.payment_method not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  status public.payment_status not null default 'pending',
  paystack_reference text unique,
  paid_at timestamptz,
  refunded_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_reservation_idx on public.payments (reservation_id);
create unique index payments_one_live_per_reservation on public.payments (reservation_id)
  where status in ('pending', 'succeeded');

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  -- Strict order of wallet rows (several can share a timestamp inside one transaction).
  seq bigint generated always as identity unique,
  customer_id uuid not null references public.customers (id) on delete restrict,
  kind public.wallet_tx_kind not null,
  -- Positive for money in (top-up, refund), negative for money out (payment).
  amount_kobo bigint not null check (amount_kobo <> 0),
  balance_after_kobo bigint not null check (balance_after_kobo >= 0),
  reservation_id uuid references public.reservations (id) on delete restrict,
  payment_id uuid references public.payments (id) on delete restrict,
  paystack_reference text unique,
  description text not null,
  created_at timestamptz not null default now(),
  constraint kind_sign check (
    (kind in ('top_up', 'refund') and amount_kobo > 0) or (kind = 'payment' and amount_kobo < 0) or kind = 'adjustment'
  )
);
create index wallet_transactions_customer_idx on public.wallet_transactions (customer_id, created_at desc);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete restrict,
  period_start date not null,
  period_end date not null,
  scheduled_for date not null,
  order_count int not null default 0,
  online_sales_kobo bigint not null default 0,
  counter_sales_kobo bigint not null default 0,
  commission_kobo bigint not null default 0,
  -- What MedFind sends: online sales minus 5% of all sales. Negative = the pharmacy owes MedFind.
  net_kobo bigint not null,
  status public.payout_status not null default 'scheduled',
  paystack_transfer_reference text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, scheduled_for),
  check (period_end >= period_start),
  check (net_kobo = online_sales_kobo - commission_kobo)
);

alter table public.reservations add column payout_id uuid references public.payouts (id) on delete set null;
create index reservations_unpaid_out_idx on public.reservations (pharmacy_id, completed_at)
  where status = 'completed' and payout_id is null;

create trigger payments_touch before update on public.payments for each row execute function private.touch_updated_at();
create trigger payouts_touch before update on public.payouts for each row execute function private.touch_updated_at();

-- Current balance = the latest transaction's balance_after.
create view public.wallet_balances with (security_invoker = true) as
  select c.id as customer_id,
         coalesce((select w.balance_after_kobo from public.wallet_transactions w
                   where w.customer_id = c.id order by w.seq desc limit 1), 0) as balance_kobo
  from public.customers c;
