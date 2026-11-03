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
- Units: kilometres everywhere; weights default to kilograms, and each customer can switch to pounds in their own settings; cooking temperatures stay in °F
- Riders only see orders their vehicle can carry: bicycle = Small, motorbike = up to Medium, tricycle (keke) and car = up to Large, van/truck = all sizes
- NIN and BVN (11 digits each) are required at sign-up for Riders, Sellers, Admin and Support staff; Customers and Super Admin are exempt. Preview build: format-checked only, only the last 4 digits kept
- Emergency warning also triggers on Pidgin, Yoruba, Hausa and Igbo phrases (native-speaker review needed)
- Peak hours are 6-10am, 12-2pm and 4-9pm (morning rush, lunch, evening rush)
- No USSD, POS-on-delivery or virtual-account payment options
- Anything needing a second check goes to the Super Admin Verification Queue (NIN, BVN, licences, vehicle papers, guarantors, CAC/TIN/NAFDAC, MDCN/PCN, payout names, transfer proofs); Admin and Support see status only
- Rider sign-up asks for licence, plate, vehicle and a guarantor; sellers give CAC, TIN and NAFDAC where relevant
- Per-city delivery settings, rain surcharge and motorbike-restricted zones in Super Admin; Regulatory Register tracks licences and partner agreements
- In the combined preview, a new rider or seller sign-up appears live in the Super Admin Verification Queue; a new rider cannot go online until every check is approved
- Super Admin also has Launch & Rollout (go/no-go, city phases, pilot cap), Daily Reconciliation and a Weekly Digest; flagged verification items need two approvers
- Rider: cash-in-hand limit hides new cash orders until paid in; customer-unreachable flow; take-home summary
- Delivery code: the customer reads a 4-digit code to the rider to complete a delivery (practice and live shared orders)
- **Order statuses** are one set everywhere: Placed, Preparing, Out for Delivery, Delivered, Cancelled.
- **Reverse auction:** a losing bid under 150 points forfeits the whole bid; a losing bid of 150 or more pays a 2% entry fee.
- **Destructive actions** (delete, cancel, reject, suspend, remove) ask for confirmation first.
