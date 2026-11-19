# MedFind database

The plain-English plan with every table explained is in the "MedFind database plan" doc. This file is the
developer's quick reference.

## Running it

```
pnpm db:start     # starts local Supabase in Docker
pnpm db:reset     # rebuilds the database from migrations and loads the Lagos seed data
pnpm db:test      # 103 pgTAP tests: who can see what, sign up, and the reservation rules
pnpm db:types     # regenerates packages/core/src/database.types.ts after a schema change
```

## Test accounts (local only)

Every account's password is `MedFind-test-1`.

| Who | Email | Passcode |
| --- | --- | --- |
| Customers | ada@, tunde@, chiamaka@, ibrahim@, funke@ `example.com` | n/a |
| Admiralty Care, Lekki Phase 1 | folake@ (owner), yusuf@ (pharmacist), grace@ (assistant) `admiraltycare.example.com` | 11001, 11002, 11003 |
| Adesola 24/7, Victoria Island | ngozi@, segun@, blessing@ `adesola247.example.com` | 12001, 12002, 12003 |
| Isaac John, Ikeja GRA | kola@, amina@, frank@ `isaacjohn.example.com` | 13001 to 13003 |
| Sabo Health, Yaba | halima@, olu@, adanwosu@ `sabohealth.example.com` | 14001 to 14003 |
| Ogunsanya Family, Surulere | bisi@, kemi@, musa@ `ogunsanya.example.com` | 15001 to 15003 |
| Ajah Wellness, Ajah | emeka@, zainab@, ned@ `ajahwellness.example.com` | 16001 to 16003 |

The seed creates 10 orders covering every status, wallet top-ups and refunds, ratings, saved medicines,
two MedChat threads, past shifts and the payouts due on Friday 27 November 2026.

## How staff access works

1. Staff sign in with email and password (Supabase Auth).
2. The app calls `unlock_staff(pharmacy_id, passcode)`. Until it returns their staff id, row-level security
   shows them nothing but their own staff row. Five wrong codes lock them out for 15 minutes.
3. The unlock is tied to that sign-in session, so a new sign-in needs the passcode again. `lock_staff` ends it.

## Server functions the apps call

Customer: `place_reservation`, `cancel_reservation`, `nearby_pharmacies` (also signed out).
Staff: `unlock_staff`, `lock_staff`, `create_staff_passcode`, `clock_in`, `clock_out`, `set_prescription_check`,
`approve_reservation`, `decline_reservation`, `mark_ready`, `complete_pickup`, `complete_delivery`.
Paystack webhooks and jobs (service role only): `record_wallet_top_up`, `mark_payment_succeeded`,
`mark_payment_failed`, `generate_payouts`, `mark_payout_paid`, `expire_overdue_reservations`, `send_pickup_warnings`.

pg_cron runs the expiry and pickup-warning jobs every minute, and payouts every Friday at 06:00 Lagos
(only every second Friday does anything).

## Assumptions to confirm

- Payout cycle starts Friday 27 November 2026 (`PAYOUT_ANCHOR_FRIDAY`).
- MedFind's 5% is on the medicine subtotal; the NGN 1,000 delivery fee stays with MedFind for the rider.
- Card and bank transfer orders must be paid before the pharmacy can approve them.
- Pickup codes are 6 digits.
- New medicines are added to the shared catalogue by MedFind (pharmacies pick from it), not by pharmacies.

## Customer location (Location access)

`customer_locations` keeps one current location per customer, saved from the Location access screens: a label ("GRA Phase 2"), the line under it, lat/lng, GPS accuracy in metres (empty for a typed address), where it came from (`gps` or `address`) and `updated_at`. A map point (`location`) is worked out from lat/lng for nearby-pharmacy searches. Only the customer can read or change their row. Added in its own migration, `20261120000100_customer_locations.sql`; tests are in `supabase/tests/customer_locations.test.sql`. The seed gives Ada a saved location; the other customers have none, so they see the Location access screens.

## Sign in and pharmacy sign up

Migration `20261121000100_auth_signup.sql`, tests in `supabase/tests/auth_signup.test.sql`.

- **Sign-in lockout:** `sign_in_precheck`, `record_sign_in_failure` and `clear_sign_in_failures` count wrong passwords per email or phone in `private.sign_in_attempts`. 5 wrong tries lock it for 5 minutes.
- **Sign-up checks:** `sign_up_precheck(email, phone)` says whether the email or phone is already used, without exposing who owns it.
- **Pharmacy applications:** `pharmacies.application_status` is `draft`, `submitted`, `approved` or `rejected`. Owners call `save_pharmacy_details`, `my_pharmacy_application`, `add_pharmacy_document`, `remove_pharmacy_document` and `submit_pharmacy_application` (returns the owner's 5-digit passcode once). MedFind calls `review_pharmacy_application(pharmacy_id, approve)`; approving puts the pharmacy live.
- **Documents:** `pharmacy_documents` records each file. Files live in the private `pharmacy-documents` storage bucket under `<pharmacy_id>/<kind>/<file>`. Only the owner (and MedFind) can open them, and the owner can add or remove files only while the application is a draft.
- **Payout account:** `pharmacy_payout_accounts`, written only by the `paystack-resolve-account` edge function through `save_verified_payout_account`, which refuses an account whose name doesn't match the pharmacy.
- **Edge functions:** `paystack-banks` (bank list) and `paystack-resolve-account`. Without `PAYSTACK_SECRET_KEY` they run in test mode (see CLAUDE.md). Run them locally with `supabase functions serve`.
