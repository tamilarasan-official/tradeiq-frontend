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
