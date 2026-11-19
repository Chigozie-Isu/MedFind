# MedFind
MedFind lets customers in Nigeria find a medicine at nearby pharmacies, reserve it, pay online or at the pharmacy, and pick it up or get it delivered. Pharmacies manage stock, approve reservations and get paid.

## Repository layout

```
apps/
  customer/    Expo (React Native) app for customers. Routes live in src/app (Expo Router).
  pharmacy/    Next.js web app for pharmacies.
packages/
  ui/          Shared theme (colours, text styles, spacing, radii, icons) and components.
               `@medfind/ui` holds tokens, `@medfind/ui/native` the React Native components,
               `@medfind/ui/web` the React DOM components. Both take the same props.
  core/        Business rules with unit tests (e.g. money in kobo, naira formatting).
```

## Running

Needs Node 22.18 or newer and pnpm 10.

```bash
pnpm install
pnpm customer      # Expo dev server (press w for web, i for iOS)
pnpm pharmacy      # Next.js on http://localhost:3000
pnpm typecheck
pnpm test
```

## Environment

Copy each app's `.env.example` to `.env.local` and fill it in (never commit these files):

- Customer: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Pharmacy: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Edge functions: `PAYSTACK_SECRET_KEY` (leave it out locally for test mode).

For a local database, `pnpm db:start` prints the URL and anon key. Before going live, Supabase needs an SMS provider (Termii or Twilio) and an email sender (for example Resend) set up in the dashboard.

## Sign in screens

Each app has a hidden gallery of every sign-in and sign-up state from Figma, without calling Supabase:

- Customer: http://localhost:8081/dev/auth
- Pharmacy: http://localhost:3000/dev/auth

## Components screens

Each app has a hidden screen that shows every shared component in light and dark, side by side, to compare with Figma. Nothing links to it.

- Customer: open `/dev/components` (on web, http://localhost:8081/dev/components; on a device, `medfind://dev/components`).
- Pharmacy: http://localhost:3000/dev/components

Light/dark: the customer app follows the system or the choice in Settings > Appearance (`/settings/appearance`). The pharmacy app has a sun/moon toggle and remembers the choice in the browser.
