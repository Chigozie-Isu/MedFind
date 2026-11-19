# Where the code differs from Figma

The theme in `packages/ui` follows the MedFind Figma file (`OpCNyqo5elBMJI3z5XtxVC`). This file lists every place the code deliberately differs, and why. Add to it whenever a new difference is agreed.

Most changes come from the project rule that text contrast must be at least 4.5:1 (3:1 for 24px+, or 18.66px+ bold). `packages/ui/test/contrast.test.ts` checks every text and background pair in both themes, so a colour that breaks the rule fails the tests.

## Colour (contrast)

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Light: input labels | #BFC9D0 (Neutral/400) | #000C18 (Font 1) | #BFC9D0 is about 1.6:1 on light surfaces. Uses the light counterpart of the dark-mode label token. |
| Light: placeholders, search placeholder | #BFC9D0 | #4B5A67 (Text/Secondary) | Same reason. |
| Light: helper text | #BFC9D0 | #5F6B74 (Text/Tertiary) | Same reason. |
| Light: input and search borders | #BFC9D0 | #4B5A67 at 40% | Border follows the placeholder colour, drawn at Figma's 40% opacity. |
| Light: "Not filled" badge text | #BFC9D0 or tone default | Each tone's text colour (e.g. Info/Text #027B8F) | Raises small badge text to 4.5:1. |
| Dark: Inline and Text buttons | #0077B6 | #5EAAD2 (Primary/Dark mode/Text) | #0077B6 is about 3:1 on #11293A. #5EAAD2 is the colour Figma already uses for the dark Secondary button. |
| Required-field asterisk, light | #FF6B5A (Accent) | #C23A2E (Accent/Pressed), 5.1:1 | #FF6B5A is about 2.7:1 on light surfaces. Agreed with Emmanuel, 19 Nov 2026. |
| Required-field asterisk, dark | #FF6B5A | #FE9C8E (Accent/500), 6.1:1 on cards | #FF6B5A is 4.4:1 on dark cards (#213747). Agreed with Emmanuel, 19 Nov 2026. |
| Brand text on muted panels | #0077B6 | Only used at 40px (insight number) | #0077B6 on #EFF4F8 is 4.4:1, so small brand text stays off muted panels. |

## Surfaces

- **Dark surfaces** come from the dark screens, not the "Surface/Default" variables. The page is #11293A, cards and rows are #213747, and borders and pressed states are #3F505D. The #08111B and #0D151E variables aren't used on any screen.

## Text styles, spacing and radii

- **Text styles** follow the real Figma styles (`H1/Mobile`, `Body2/Web` and so on), not the labels on the Typescale page, which disagree with them.
- **Spacing and radii** have no Figma variables, so they were taken from the component frames.
  - Spacing: 4, 8, 12, 16, 24, 32 and 40.
  - Radii: 8, 12, 16 and 24.

## Components

- **Icon-only buttons** are full circles (radius half the size) rather than the 24px button radius.
- **Loading buttons** keep their width and draw the spinner over the hidden label, so the button doesn't shrink while loading.
- **Callout card:** the button variant uses the message icon, because the calendar icon couldn't be exported from Figma.
- **Code input:** empty digit boxes show a tertiary "0" placeholder.

## Location access (customer app, Figma 2677:160663 light, 2679:160877 dark)

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| "System prompt" frame | Drawn iOS alert | Not built | It's the phone's own permission popup; iOS and Android draw it. Its message is set in `app.json` (`locationWhenInUsePermission`). |
| Dark: "Change" and "Enter my address instead" | #0077B6 | #5EAAD2 | Same contrast fix as the other dark Inline/Text buttons (#0077B6 is about 3:1 on #11293A). |
| Buttons on these screens | SF Pro Medium | Manrope SemiBold | Project rule: buttons use Manrope. The shared Button already does this. |
| Dark: dividers between suggestions | #545458 at 65% (iOS default) | #3F505D (surface pressed) | Uses the theme's own divider colour instead of an iOS system grey. |
| Search placeholder | Not shown (frame is filled with "Ada George") | "Search for your street or area" | Needed copy for the empty field. |
| Found screen without a place name | Always "You're near GRA Phase 2" | "We found your location" when the phone can't name the area | Reverse geocoding can fail (no network, or on the web). |
| Address screen on the web | Suggestions list | A note that search works in the app | The free geocoder that comes with expo-location only runs on phones. |
| Illustration and text position | 37px under a 47px status bar | 36px (space.xl + space.xxs) under the safe area | Nearest spacing tokens. |
