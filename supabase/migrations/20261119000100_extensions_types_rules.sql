-- MedFind: extensions, enums and the business-rule constants.
-- The constants below must match packages/core/src/rules.ts (checked by packages/core/test/rules-sync.test.ts).

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron;

-- Helper functions that RLS policies and server functions use. Not exposed through the API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create type public.appearance as enum ('system', 'light', 'dark');
create type public.staff_role as enum ('owner', 'manager', 'pharmacist', 'assistant');
create type public.medicine_form as enum ('tablet', 'capsule', 'syrup', 'suspension', 'injection', 'inhaler', 'cream', 'drops', 'sachet', 'other');
create type public.fulfilment as enum ('pickup', 'delivery');
create type public.order_kind as enum ('otc', 'prescription');
create type public.reservation_status as enum (
  'pending', 'approved', 'ready_for_pickup', 'out_for_delivery', 'completed', 'declined', 'expired', 'cancelled'
);
create type public.prescription_check as enum (
  'medicine_and_dosage', 'patient_name_and_age', 'prescriber_name_and_signature', 'dose_suits_patient_age'
);
create type public.payment_method as enum ('wallet', 'card', 'bank_transfer', 'at_pharmacy');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type public.wallet_tx_kind as enum ('top_up', 'payment', 'refund', 'adjustment');
create type public.payout_status as enum ('scheduled', 'processing', 'paid', 'failed', 'pharmacy_owes');
create type public.actor_kind as enum ('customer', 'staff', 'system');
create type public.notification_type as enum (
  'new_reservation', 'reservation_approved', 'reservation_declined', 'reservation_ready',
  'out_for_delivery', 'reservation_completed', 'reservation_expired', 'reservation_cancelled',
  'pickup_30_min_left', 'pickup_15_min_left', 'refund_issued', 'new_message', 'payout_sent', 'low_stock'
);

-- Business-rule constants (keep in sync with packages/core/src/rules.ts).
create function private.rule_approval_window_minutes() returns int language sql immutable as $$ select 10 $$;
create function private.rule_delivery_fee_kobo() returns bigint language sql immutable as $$ select 100000::bigint $$;
create function private.rule_service_fee_kobo() returns bigint language sql immutable as $$ select 0::bigint $$;
create function private.rule_commission_basis_points() returns int language sql immutable as $$ select 500 $$;
create function private.rule_pickup_window_minutes() returns int language sql immutable as $$ select 120 $$;
create function private.rule_stop_reservations_before_close_minutes() returns int language sql immutable as $$ select 120 $$;
create function private.rule_staff_passcode_length() returns int language sql immutable as $$ select 5 $$;
create function private.rule_pickup_code_length() returns int language sql immutable as $$ select 6 $$;
create function private.rule_payout_anchor_friday() returns date language sql immutable as $$ select date '2026-11-27' $$;
create function private.rule_payout_interval_days() returns int language sql immutable as $$ select 14 $$;

create function private.commission_kobo(subtotal bigint) returns bigint
language sql immutable as $$
  select (subtotal * private.rule_commission_basis_points() + 5000) / 10000
$$;

create function private.can_transition(from_status public.reservation_status, to_status public.reservation_status)
returns boolean language sql immutable as $$
  select case from_status
    when 'pending' then to_status in ('approved', 'declined', 'expired', 'cancelled')
    when 'approved' then to_status in ('ready_for_pickup', 'out_for_delivery')
    when 'ready_for_pickup' then to_status in ('completed', 'expired')
    when 'out_for_delivery' then to_status in ('completed')
    else false
  end
$$;

-- Keeps updated_at current on every table that has it.
create function private.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
