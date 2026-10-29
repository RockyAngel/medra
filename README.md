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
  - Small: under 16 kg, normal delivery fee
  - Medium: 16-27 kg, normal delivery fee
  - Large: 27-45 kg, double the delivery fee
  - Oversized: over 45 kg, triple the delivery fee, or the customer arranges their own pickup
- Units: kilometres and kilograms everywhere; cooking temperatures stay in °F
- Riders only see orders their vehicle can carry: bicycle = Small, motorbike = up to Medium, tricycle (keke) and car = up to Large, van/truck = all sizes
- NIN and BVN (11 digits each) are required at sign-up for Riders, Sellers, Admin and Support staff; Customers and Super Admin are exempt. Preview build: format-checked only, only the last 4 digits kept
- Emergency warning also triggers on Pidgin, Yoruba, Hausa and Igbo phrases (native-speaker review needed)
- Peak hours are Lagos rush hours: 6-10am and 4-8pm
- No USSD, POS-on-delivery or virtual-account payment options
- **Order statuses** are one set everywhere: Placed, Preparing, Out for Delivery, Delivered, Cancelled.
- **Reverse auction:** a losing bid under 150 points forfeits the whole bid; a losing bid of 150 or more pays a 2% entry fee.
- **Destructive actions** (delete, cancel, reject, suspend, remove) ask for confirmation first.
