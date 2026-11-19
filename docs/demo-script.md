# MedFind demo script (about 5 minutes)

**Before you start**
- Phone: open the customer link in Safari or Chrome (or run the app in Expo Go). On a laptop, make the browser narrow or use phone view (F12, then the phone icon).
- Laptop: open the pharmacy link.
- The hosted links have no database, so Log in, Sign up and Sign in accept any details and any code. Use the demo accounts below so the names match.
- The web version of the customer app can't use GPS, so the location popup doesn't appear there. After log in it goes straight to Grace's Home.
- Screens outside the demo (Saved, notifications, Inventory, Activity, Earnings, Profile) show a "coming soon" message.
- The two hosted links run on sample data and don't talk to each other. The pharmacy already shows Grace's Augmentin reservation waiting, so the story still lines up. (Live syncing works when both apps have the same Supabase URL and anon key.)

**Demo accounts:** customer grace@example.com, pharmacist yusuf@fuasi.example.com with passcode 11002. The password for both is MedFind-test-1. Both are at Fuasi Pharmacy, Port Harcourt.

## 1. Log in and find the medicine (phone)
The app opens on the Splash. Tap **Sign In**, swipe or Skip through the 3 intro screens (first time only), then log in as Grace. You can also show **Create account**: any 6-digit code verifies the phone. Home says "Good afternoon, Grace". Type **Augmentin** in the search box. Show the 3 Port Harcourt results: Fuasi Pharmacy ₦3,450 (1.8 km), Caduces Pharma ₦4,000, Mediguy ₦3,400 with low stock. Point out sorting by distance and price.

## 2. Reserve and see the price (phone)
Tap **Fuasi Pharmacy**. On Reserve, choose **Pickup**: the total is ₦3,450, paid at the pharmacy, no service fee. Switch to **Delivery** to show it becomes ₦4,450 (₦1,000 delivery), then switch back to Pickup and tap **Reserve**.

## 3. Pickup code and My reservations (phone)
The Pickup code screen shows Grace's 6-digit code and that Fuasi has 10 minutes to reply. Open the **Reservation** tab to show it in My reservations, alongside her past orders.

## 4. Approve as the pharmacy (laptop)
On the Splash click **Sign in** and enter Yusuf's email, passcode and password. On the Dashboard (Yusuf Bilal, Fuasi Pharmacy) open **Reservations**. Click **Review** on Grace Mary's Augmentin card. Tick all 4 prescription checks: **Approve** only unlocks after the fourth. Click Approve to reach the Confirmed screen with the pickup code Grace will show at the counter. (Optional: on another card, click **Decline** to show that a reason is required.)

## 5. Wrap up
Show dark mode: Settings > Appearance on the phone, and the sun/moon toggle in the pharmacy app. Close with the rules: pharmacies have 10 minutes to answer or the reservation expires, the customer pays at the pharmacy, and MedFind keeps 5% of each completed order.
