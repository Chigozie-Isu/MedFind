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

## Customer Start, Log in and Sign up

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Onboarding 3 | The body repeats its first sentence | Said once | Copy error. |
| Phone placeholders | "+284" | "+234" | Nigeria's code is +234. |
| Verify phone timer | "10:00" | 45-second resend countdown | Codes last 10 minutes, but you can ask for a new one after 45 seconds. The pill shows the resend wait. |
| Verify by email | Not drawn | Same screen, "Check your email" copy | Used when a customer chooses "Send code to my email instead". |
| "Send code to my phone instead" | Not drawn | Link on the email-code screen | Lets people switch back. |
| Google and Apple buttons | Working sign in | Show a "coming soon" toast | Agreed with Emmanuel: wired up in a later PR. |
| Illustrations | @1x, @2x, @3x | @1x exports | The Figma asset export is blocked in our build setup. They need re-exporting at @2x and @3x. |

## Pharmacy Start, Sign in, Forgot password and Sign up

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Passcode field | 6 digits in one frame, 5 in another | 5 digits | Matches the schema and most frames. |
| Wrong code on forgot password | Not drawn | Error under the code field, with tries left | Same pattern as the customer app. |
| Story overlay on sign up | A stray story card overlaps step 1 | Not built | Looks like a leftover layer. |
| Step 2 counter | "4 documents" | "n of 3 required documents" | The shop-front photo is optional, so only 3 count. |
| Shop-front copy | "Add photos of your shop" / "photos" mixed | "Add a photo of your shop front" | Consistent wording. |
| File size separator | " .1.2 MB" | " · 1.2 MB" | Typo. |
| Documents privacy note | "o any 3rd party" | "or any third party" | Typo. |
| Rail, step 2 in progress | "In progress" | "In progress. n of 3 uploaded" | Tells the owner how far they are. |
| Mismatch banner | Fixed name "FUASI PHARMACY LTD" | The pharmacy's own name | Real data. |
| Review phone | "+234 810 987 654" (9 digits) | Full formatted number | Typo in Figma. |
| Submitted | No passcode | A box showing the owner's 5-digit staff passcode once | Agreed with Emmanuel: the passcode is created at submit. |
| Google and Apple buttons | Working sign in | "Coming soon" toast | Agreed: a later PR. |
| Dark: links and outline buttons | #0077B6 | #5EAAD2 | Contrast at least 4.5:1, as elsewhere. |
| Map | Static map picture | Live OpenStreetMap map with a draggable pin (Leaflet) | Needed to place a real pin. |
| Images | @2x | @1x exports | Same export limit as above. |

## Customer demo flow: Home, Search results, Reserve, Pickup code, My reservations

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Data | Grace, Fuasi Pharmacy, Augmentin and the other names in the frames | Same names, kept in the app (`features/demo/data.ts`), not the Supabase seed | Emmanuel asked for the Figma names; runs without a local database. |
| Recent searches | "Gestad" | "Gestid" | Typo; the medicine is Gestid. |
| Home and Search | Camera button | Not built | Scanning is out of scope. |
| Home header | Profile icon | Settings icon, opens Appearance | No profile screen yet; the icon set has no profile icon. |
| Search filters | Distance, Price, Open now, Delivery | Distance, Price, Delivery | Every seeded pharmacy is open in the demo. |
| Search and history images | Product and shop photos | Icon placeholders | Seed has photo paths but no image files. |
| Reserve | Pay online and Pay at pharmacy, "1 OF 2" steps | Pay at pharmacy only, no steps | Demo scope: pay at pharmacy only. |
| Reserve amount | Starts at 0 | Starts at 1 | A reservation needs at least one item. |
| Pickup code header | Map with route | Plain header with the pharmacy pin | No map library approved for the customer app. |
| Pickup code | "AB-145", copy button | 6-digit code ("199 364"), no copy button | The schema uses 6-digit codes; copying needs a new library. |
| Pickup code buttons | Cancel | My reservations | Happy path only; links the screens in order. |
| Waiting → ready | Pharmacy confirms | Changes the moment the pharmacy approves or declines (Supabase Realtime broadcast). Falls back to confirming after 4 seconds when Supabase isn't set up | Live link to the pharmacy demo. |
| Pickup code – declined / expired | Not in the linked frames | Simple card with the pharmacy's reason (or "didn't reply in 10 mins") and Find another pharmacy | Needed for the live link; happy-path copy only. |

## Pharmacy reservation approval demo (Dashboard 167:2472, Reservations 196:3840, Review Grace 456:15464, Decline reason 2620:124268, Grace confirmed 473:10835)

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Payment badges and details | "Paid online · ₦3,450", "card charged" | "Pay in person · ₦3,450", "₦3,450 to pay at the counter" | Demo scope: pay at pharmacy only. |
| Pickup code (confirmed) | "AB-145" | Grace's 6-digit code (e.g. "482 915"); AB-145 stays as the reference in the breadcrumb | The pharmacy must check the same code Grace's phone shows. |
| Expiry note (confirmed) | "Grace gets her money back and the bottle goes back into stock" | "It expires on its own and the bottle goes back into stock" | Nothing to refund when paying at the pharmacy. |
| Dashboard waiting card | Illustration on the right | Not shown | Illustration asset not exported for this demo. |
| Dashboard and side nav | MedChat button | Not built | MedChat is out of scope. |
| Insight cards | Raised card with shadow | Existing `InsightCard` (muted background) | Reuses the shared component. |
| Trending / Running low images | Product photos | Box icon placeholders | No product photos in the repo. |
| Prescription photo tools | Zoom in, zoom out, full screen icons | Search, minus and grid icons (not wired) | The icon set has no zoom or expand icons; happy path only. |
| Review timer | Under the bell, right of the name | Same place, laid out with a negative margin | Keeps the shared header. |
| Notifications badge | 5 | Waiting reservations + 2 | Sample number that moves with the demo. |
| Sample cards | Bob Mackie, Ned Mackie (Review), Annie Oak, Tunde Yomi ×2 (Ready) | Bob Mackie (Review), Annie Oak and Tunde Yomi (Ready) | Fewer samples; Grace's card is the live one. |
| Prescription photo | Grace uploads a photo | The Figma photo is bundled (`public/demo/grace-prescription.png`) | No scanning or uploads in the demo. |

## Demo data (Port Harcourt)

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Pharmacies | Fuasi, Caduces, Mediguy, Precious Pharmacy | Fuasi Pharmacy, Caduces Pharma and Mediguy only | Demo data is 3 pharmacies, the same in the app and the Supabase seed. |
| My reservations history | Orders at Precious Pharmacy | The same orders at Fuasi, Caduces and Mediguy | Precious Pharmacy isn't in the 3-pharmacy demo data. |

## Buttons

- **Native button labels** use a line box 1.5 times the font size instead of Figma's 100%, with an equal negative margin, so the button height is unchanged. At 100%, phones clip the bottoms of letters like g, y and p in one-line labels. The pharmacy (web) buttons already showed them in full and are unchanged.

## Hosted web demo (no database)

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Log in, Sign up, Sign in, Forgot password | Real accounts and codes | Without Supabase settings, any details and any code are accepted, signing in as Grace or Yusuf | The Vercel links have no database. |
| Customer Location access on web | Shown after log in when location is off | Shown on web too, with a copy of the phone's permission popup and a demo GPS fix in GRA Phase 2 | So the allow and deny paths can be shown in a browser. |
| Customer Google and Apple buttons | Sign in with the provider | Without Supabase (and on web), sign straight in as Grace | No real provider in the demo. |

## Pharmacy app: all screens and flows (delivery, Inventory, Activity, Earnings, Profile, Employees, Shift history)

The pharmacy Inventory, Activity, Earnings and Profile screens are now built, so the "coming soon" rows above no longer apply to the pharmacy app. Demo data lives in `apps/pharmacy/src/features/workspace/store.ts` (saved in the browser; Profile › Reset demo puts it back).

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Side nav | MedChat button above "Taking reservations" | Not shown | Demo scope: no MedChat. |
| Prototype data | Each frame shows its own snapshot (e.g. Grace appears again after she's approved) | One live set of reservations that moves between columns as you act | So every click has a lasting result. |
| Kemi's OTC delivery order | Appears from the "new reservation" toast | Arrives on its own about 12 seconds after the app opens, with the same toast | Lets the toast and the OTC delivery flow be shown without a second device. |
| Delivered | Prototype jumps to "Ned delivered" | Delivery completes 30 seconds after hand-over (simulated rider) | No real rider or delivery is triggered. |
| Tracking map | Map image | A drawn street grid with the route | No map tiles or new library needed. |
| Calling Musa | Phone call | Banner only; no call is made | Simulation. |
| Inventory and transactions counts | 550 medicines, 201 transactions | The real count of the demo rows (12 medicines, 8 transactions) | Tabs and pagers stay consistent with what's listed. |
| Inventory "Add" column | Steppers only | Steppers plus a "Save stock" bar | Stock changes need a confirm step. |
| Earnings payout date | Friday 13 November | The next payout Friday from `nextPayoutDate` (27 November) | Business rule lives in packages/core. |
| Earnings fee column | ₦1755 on a ₦3,500 sale | 5% of the sale (`commissionKobo`) | Agreed 5% rule. |
| Earnings mascot illustration, cover photo | Illustration / shop-front photo | Wallet icon / a drawn "Fuasi Pharmacy" sign (a chosen photo replaces it) | Assets not exported; the sign colours are part of the illustration. |
| Staff codes | 6 characters (e.g. AB7890) | 5 digits | Agreed rule: 5-digit staff passcode. |
| Opening hours picker | Scroll wheel | Time dropdowns | Same result, easier on a laptop. |
| Clock out button icon | Log-out icon | Chevron | No log-out icon in the shared set. |
| Bulk upload | Reads real pack photos | Any photo is accepted and the Figma list of 6 medicines is "found" | Simulation; no scanning service. |

## Customer app: all screens and flows (sign up to rating, payments, map, Settings, Wallet)

The customer Saved, Notifications, Profile/Settings, Wallet, online payment, cancellation and map screens are now built, so the customer rows in "Customer demo flow" above about pay at pharmacy only, no map, no copy button, no camera, no profile and Cancel are superseded. Demo data lives in `apps/customer/src/features/demo/` (`account.ts` for Grace's account, `store.ts` for reservations). Settings › Reset demo data puts it back.

| Where | Figma | Code | Why |
| --- | --- | --- | --- |
| Pickup and delivery map | Map image with route | OpenStreetMap tiles drawn as images, with an SVG route, pins and ETA bubble | Uses the approved free OSM tiles; no new library. |
| Card, transfer and wallet payments | Real bank / Paystack screens | Simulated. Bank code 000000 shows "Payment didn't go through"; any other 6 digits succeeds. A transfer "lands" after 3 seconds | Demo only; nothing is charged. |
| Prescription upload | Camera, file picker, gallery | Picking a source attaches a sample photo. The first PDF try shows the "Image problem" error so it can be seen | No camera or file access in the demo. |
| Camera (scan) button on Home | Scans a pack | Shows "Scanned: Paracetamol 500mg pack" and searches for it | Simulation; no scanning service. |
| Reservation done | Pharmacy marks collected / rider delivers | An "I've collected it" / "I've received it" button on the pickup screen (the pharmacy can also mark it collected) | Lets the rating screen be reached on one device. |
| Waiting → ready | Pharmacy confirms | Pharmacy approval over Supabase Realtime, or after 4 seconds without Supabase | Same as before. |
| Appearance | Theme and text size | Theme only | Text size isn't built. |
| Search by active ingredient | Shown in search hints | Not built; search matches medicine names | Not in the data. |
| Icons not in the shared set (user, edit, copy, star, bank, call, palette, refresh, trash, gallery, file, chat, directions, send, mail) | Figma icons | Hand-drawn 1.5px stroke icons in `features/demo/icons.tsx` | The shared icon set doesn't have them. |
| Wallet card buttons (Withdraw, View wallet) | Outline button on the dark card | Outline button on a white chip | Brand-blue text on the dark card failed 4.5:1 contrast. |
| Card CVV field | Eye toggle | No toggle | The toggle didn't fit the half-width field. |
| Medicine photos and mascots | Full resolution | 1x exports (Augmentin, Gestid, Grace, 4 mascots); other medicines keep the icon | Only the images in the linked frames were exported. |
| Refunds | Every refund to the MedFind wallet | Wallet payments refund to the wallet; a card or transfer hold is shown as "released" because it was never charged | The demo only places holds until the pharmacist confirms. |

