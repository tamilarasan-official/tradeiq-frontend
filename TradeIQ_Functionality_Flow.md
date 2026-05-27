# TradeIQ Functionality and Flow

See the workspace-level `TradeIQ_Functionality_Flow.md` for the full mobile and backend flow.

This mobile app currently includes:

- Login-first app flow
- Firebase Google Sign-In wiring
- Backend Google auth sync through `/api/auth/google`
- Email/mobile backend login through `/api/auth/login`
- FCM token request flow
- Safe-area/status-bar app shell
- Bottom tab navigation
- Home, Holdings, Trade, Wallet, Alerts, and Profile navigation
- Backend-driven dashboard, watchlist, holdings, orders, and profile data
- Toast feedback for actions
- Buy/sell/order preview flow
- Authenticated backend JWT attached to dashboard, profile, and order API calls

The mobile app uses:

```text
https://tradeiq-backend-v0du.onrender.com
```

The backend now reads app data from MongoDB. If MongoDB collections are empty, the app will show empty lists until users, stocks, holdings, and watchlist rows are created.
