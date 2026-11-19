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
