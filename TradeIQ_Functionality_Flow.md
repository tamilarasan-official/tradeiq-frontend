# TradeIQ Functionality and Flow

See the workspace-level `TradeIQ_Functionality_Flow.md` for the full mobile and backend flow.

This mobile app currently includes:

- Login-first app flow
- Firebase Google Sign-In wiring
- FCM token request flow
- Safe-area/status-bar app shell
- Bottom tab navigation
- Home, Holdings, Trade, Wallet, Alerts, and Profile navigation
- Backend-driven dashboard, watchlist, holdings, orders, and profile data
- Toast feedback for actions
- Buy/sell/order preview flow

The mobile app uses:

```text
https://tradeiq-backend-v0du.onrender.com
```

The backend currently returns demo trading data until a real broker/market-data provider is connected.
