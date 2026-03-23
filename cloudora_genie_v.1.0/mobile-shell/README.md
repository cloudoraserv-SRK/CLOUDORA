# Genie Mobile Shell

This folder is the practical scaffold for turning Genie into an Android APK by wrapping the existing frontend with Capacitor.

## Frontend source

- `/C:/Users/OM/Downloads/CLOUDORA-main/cloudora_genie_v.1.0/frontend`

## Recommended build flow

1. Open terminal in:
   - `/C:/Users/OM/Downloads/CLOUDORA-main/cloudora_genie_v.1.0/mobile-shell`
2. Install dependencies:
   - `npm install`
3. Add Android shell:
   - `npm run android:add`
4. Sync frontend:
   - `npm run sync:web`
5. Open Android Studio project:
   - `npm run android:open`
6. In Android Studio build APK:
   - `Build > Build Bundle(s) / APK(s) > Build APK(s)`

## What is already ready

- PWA manifest
- service worker
- mobile-first Genie assistant
- launch hub for testing
- install prompt support
- access-controlled workspace

## What still needs real device work

- secure device storage instead of localStorage for secrets
- launcher icons and splash screen polish
- mic permission testing
- speech playback testing
- background/app resume behavior testing
- signed release APK / AAB generation
