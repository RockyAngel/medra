# Medra

Multi-vendor delivery and healthcare marketplace — frontend prototype (mock data only, no backend yet).

- `src/` — React JSX sources: customer, seller, rider, admin, support, super admin, landing, combined preview
- `dist/` — self-contained bundled HTML for each app (open directly in a browser)
- `docs/` — permission matrix (blueprint for future Supabase RLS) and onboarding checklists

## Build & test

```
npm install
npm run build   # bundles src/*.jsx -> dist/*.html
npm test        # smoke-renders all 8 apps
```

## Business rules built into the prototype

- **Delivery is never free.** Every order carries a delivery fee. Spin-the-wheel and leaderboard rewards discount the fee by a percentage; they never waive it.
- **Customers see one price.** Item prices already include Medra's markup; there is no service-fee or commission line on the cart, checkout or receipt. The breakdown is visible to Admin and Super Admin only.
- **Order size classes** (assigned by the seller from the order weight, shown to the rider before accepting):
  - Small: under 35 lb, normal delivery fee
  - Medium: 35-60 lb, normal delivery fee
  - Large: 60-100 lb, double the delivery fee
  - Oversized: over 100 lb, triple the delivery fee, or the customer arranges their own pickup
- **Order statuses** are one set everywhere: Placed, Preparing, Out for Delivery, Delivered, Cancelled.
- **Reverse auction:** a losing bid under 150 points forfeits the whole bid; a losing bid of 150 or more pays a 2% entry fee.
- **Destructive actions** (delete, cancel, reject, suspend, remove) ask for confirmation first.
