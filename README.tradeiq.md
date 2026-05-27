# TradeIQ Mobile

React Native CLI app created in `frontend` with native Android and iOS projects.

## Run

```bash
npm install
npm run android
```

The generated React Native version expects Node `>=22.11.0`. This workspace currently has Node `20.19.5`, so use Node 22 for mobile development.

## Starter Scope

- Full 31-screen catalog from the developer spec
- Dark trading UI based on `StockTrading_ScreenSpec.html`
- Backend health and market index connection through `src/services/api.ts`
- Reusable components in `src/components`
- Screen metadata in `src/data/screenCatalog.ts`
- Redux Toolkit provider installed for app state expansion

## Source Layout

```text
src/
  components/
  data/
  screens/
  services/
  theme/
  types/
```

## Firebase Auth and FCM

Firebase Android config lives at `android/app/google-services.json`.

Google Sign-In needs one extra Firebase Console step before it can return an ID token:

1. Add your Android debug/release SHA-1 and SHA-256 fingerprints in Firebase project settings.
2. Download a fresh `google-services.json` after adding fingerprints.
3. Enable Google provider in Firebase Authentication.
4. Copy the Web client ID from Firebase/Google Cloud OAuth client settings into `src/services/firebase.ts` as `webClientId`.

FCM is wired in `src/services/firebase.ts`. The app requests notification permission, gets the FCM token, and logs it through the backend research event endpoint. For production notifications, add a backend model/table for device tokens and send messages through Firebase Admin SDK.
