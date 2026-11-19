# MedFind

Design source: Figma file `OpCNyqo5elBMJI3z5XtxVC` (pages: Components, Buttons, Typescale, Icon, Colour Palette).

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
- A ready pickup order must be collected within 2 hours or it expires, is refunded and goes back into stock. Pharmacies stop taking new reservations 2 hours before closing (both from Figma).

## Database (supabase/)

- `pnpm db:start`, `pnpm db:reset` (migrations + seed), `pnpm db:test` (pgTAP security and rule tests), `pnpm db:types` (regenerates `packages/core/src/database.types.ts`). Needs Docker.
- Apps never write orders, payments, the wallet or payouts directly: they call the server functions in `supabase/migrations/*_functions.sql`. Row-level security is in `*_security.sql`.
- Rule numbers live in `packages/core/src/rules.ts` and the `private.rule_*` SQL functions; `packages/core/test/rules-sync.test.ts` fails if they differ.
- See `docs/database.md` for tables, test accounts and open assumptions.
