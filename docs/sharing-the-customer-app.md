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

The first `eas init` writes the Expo project id (`extra.eas.projectId`) and `updates.url` into
`app.json`; commit those so later pulls don't clash.
