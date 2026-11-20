# Sharing the customer app without a running PC

Two free options (Expo free tier), both run from `apps/customer`:

1. **Expo Go share link (Android and iPhone):** `eas update --branch preview --environment preview`
   publishes the JavaScript to Expo. Open the "EAS Dashboard" link it prints, press **Preview**, and
   share that page. Testers install Expo Go and scan the QR code. Expo Go loads updates because
   `runtimeVersion` uses the `appVersion` policy.
2. **Installable Android app:** `eas build -p android --profile preview` builds an APK in Expo's
   cloud (`eas.json` › `preview`). Share the build page link; testers open it on Android and install.
   The APK listens on the `preview` channel, so later `eas update --branch preview` runs reach it too.

Supabase settings: `--environment preview` uses only EAS environment variables and ignores local
`.env` files. With none set, the shared app runs the full local demo (sign-in as Grace), which is
what we want for demos. Never put secrets in `eas.json` or `app.json`.

The Expo project id (`extra.eas.projectId`) and `updates.url` are committed in `app.json`.

## Automatic updates

`.github/workflows/customer-expo-update.yml` runs the `eas update` above on every merge to `main`
that touches the customer app or shared packages (and on demand from the Actions tab). It needs an
Expo access token saved as the `EXPO_TOKEN` repository secret; without it the job does nothing.
No Supabase variables are needed: the update uses the empty EAS `preview` environment, so the app
runs the local demo.

## Is the phone on the latest version?

The bottom of Profile (Settings) shows which code is running: "Update 20 Nov, 11:44" means an
update was loaded; "Built-in version (no update loaded yet)" means the phone is still on the code
the APK was built with. Updates download when the app opens and load the next time it opens, so
close and reopen the app twice after a merge.

If an installed APK never shows an update, it was built before updates were set up (before
19 Nov, 20:42). Build a new one from the Actions tab: **Customer Android app build** › Run workflow
(`.github/workflows/customer-android-build.yml`, same as `eas build -p android --profile preview`).
Then open the build page on expo.dev on the phone and install it.

## Who can use the Expo Go link?

Anyone with internet, anywhere; it doesn't need the same Wi-Fi. On Android, testers install
Expo Go and scan the QR code on the update's Preview page. On iPhone, Expo Go may only open the
project for people signed in to an Expo account that's a member of the project, so the APK (Android)
or the web link (iPhone) is simpler for outside testers.
