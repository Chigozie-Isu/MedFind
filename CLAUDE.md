# MedFind

Design source: Figma file `OpCNyqo5elBMJI3z5XtxVC` (pages: Components, Buttons, Typescale, Icon, Colour Palette).

## Current scope (school project, low usage) — overrides anything below

- Build ONLY the demo path screens Emmanuel names, happy path only. Skip error, loading and empty states unless asked.
- Read only the Figma frames Emmanuel links, never whole sections.
- Use the existing theme for dark mode; don't check screens one by one.
- Pay at pharmacy only. No Paystack, no wallet, no MedChat, no scanning.
- One test file only: pricing (pickup, +NGN 1,000 delivery, no service fee).
- Keep answers short. Plan in 5 bullets max, then build without asking again.
- The demo flow (Home → Search results → Reserve → Pickup code → My reservations) uses a copy of the seed in `apps/customer/src/features/demo/`.

## Rules

- Secrets only in .env files; never commit them.
- Ask before adding any paid service or new library.
- Business rules go in packages/core with unit tests; never duplicate them in screens.
- Money is stored in kobo as integers. Format it with `formatNaira` from `@medfind/core`.
- Run the app and fix errors before calling work done.
- Text contrast at least 4.5:1 (3:1 for 24px+, or 18.66px+ bold). `packages/ui/test/contrast.test.ts` checks every theme pair.
- Brand colour #0077B6. Headings use Poppins; body and buttons use Manrope.
- Icons use a 1.5px stroke. Use chevrons, not arrows, for back and forward.
- Light and dark mode: the customer app switches in Settings > Appearance; the pharmacy app uses a sun/moon toggle.
- Take colours, text styles, spacing and radii from `@medfind/ui`, never hard-code them in screens. Follow the Figma text styles, not the Typescale page labels.
- Where the code differs from Figma, record it in `docs/design-deviations.md`.
- Keep this file updated when new rules are agreed.

## Business rules agreed (19 Nov 2026)

- Staff sign in with their own email and password on any laptop, then their 5-digit staff passcode must match before they can see or do anything for the pharmacy. The passcode also clocks them in and out. Owners and managers generate staff codes.
- Every refund goes to the customer's MedFind wallet, whatever way they paid.
- MedFind keeps 5% of the medicine subtotal of every completed order. Online sales are paid out minus 5%; for pay-at-pharmacy sales the pharmacy owes 5%, taken from the same payout (a negative payout means the pharmacy pays MedFind the difference).
- People can browse medicines and pharmacies signed out; an account is needed to reserve.
- Location access (customer app): after sign-up verification AND after log in, show the Location access screens if location permission is off or the customer has no saved location. Otherwise go straight to Home. A typed address alone doesn't skip the screens while permission is off. After Continue, new customers (from sign-up) go to Home (new user) and returning customers go to Home. The rule is `routeAfterAuth` in `packages/core/src/location.ts`.
- Sign in and sign up (agreed 19 Nov 2026, rules in `packages/core/src/auth.ts` and `pharmacySignup.ts`):
  - Supabase Auth with email and password. Customers verify their phone by a 6-digit SMS code; forgot password sends a 6-digit email code.
  - Codes last 10 minutes, a new one can be asked for after 45 seconds, and 3 wrong tries need a new code.
  - 5 wrong passwords lock sign-in for that email or phone for 5 minutes.
  - Passwords: at least 8 characters with a number (sign up); at least 8 with a number and a symbol (reset).
  - Google and Apple buttons show a "coming soon" toast until a later PR wires them up.
- Pharmacy sign up has 4 steps: details and map pin, licence documents (3 required, shop-front photos optional, PDF/JPG/PNG up to 10 MB), payout account, review.
  - The payout account name must match the pharmacy name, checked through Paystack (`paystack-resolve-account`).
  - Applications go `draft` → `submitted` → `approved` or `rejected`. Only an approved pharmacy can go live.
  - The owner's 5-digit staff passcode is created at submit and shown once on "Application submitted".
  - Before approval the owner can use the dashboard, but patients can't reserve.
- The map pin uses Leaflet with OpenStreetMap tiles (free, fair-use). A tile provider may be needed at scale.
- A ready pickup order must be collected within 2 hours or it expires, is refunded and goes back into stock. Pharmacies stop taking new reservations 2 hours before closing (both from Figma).

## Database (supabase/)

- `pnpm db:start`, `pnpm db:reset` (migrations + seed), `pnpm db:test` (pgTAP security and rule tests), `pnpm db:types` (regenerates `packages/core/src/database.types.ts`). Needs Docker.
- Apps never write orders, payments, the wallet or payouts directly: they call the server functions in `supabase/migrations/*_functions.sql`. Row-level security is in `*_security.sql`.
- Rule numbers live in `packages/core/src/rules.ts` and the `private.rule_*` SQL functions; `packages/core/test/rules-sync.test.ts` fails if they differ.
- A customer's current location lives in `public.customer_locations` (one row per customer, only they can see it).
- Local SMS codes aren't sent: the `send_sms` hook writes them to `private.dev_sms_outbox`. Local emails go to Mailpit at http://127.0.0.1:54324.
- Paystack functions run in test mode without `PAYSTACK_SECRET_KEY`: account 9999999999 resolves to "GRACE OKAFOR" (a mismatch), 0000000000 isn't found, and any other number resolves to the pharmacy's name plus " LTD".
- See `docs/database.md` for tables, test accounts and open assumptions.
