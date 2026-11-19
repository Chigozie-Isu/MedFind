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
