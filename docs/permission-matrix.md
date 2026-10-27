# Medra Permission Matrix (Reference for future Supabase RLS)

This is the source-of-truth blueprint for who can do what, based on everything actually
built in the app today. Use this to design Row Level Security policies when the real
backend goes in — every row below should become a policy.

Legend: ✅ full access · Own = only their own records · View = read-only · Request = can
ask, can't execute · Limited = partial/redacted access · — = no access

| Function | Customer | Seller | Rider | Support | Admin | Super Admin |
|---|---|---|---|---|---|---|
| View own orders | ✅ | Own | Own | View | View | ✅ |
| Place an order | ✅ | — | — | — | — | — |
| Confirm/prepare an order | — | Own | — | — | View | ✅ |
| Accept/deliver an order | — | — | Own | — | View | ✅ |
| Assign order size (weight → Small/Medium/Large/Oversized) | — | Own | View (before accepting) | — | View | ✅ |
| Choose oversized-order option (own pickup or triple delivery) | Own order | — | — | — | — | — |
| Manage own store (products, inventory, pricing) | — | Own | — | — | — | ✅ |
| Review/manage seller account (oversight, not operation) | — | — | — | — | ✅ | ✅ |
| Edit seller products on behalf of seller | — | — | — | — | Limited | ✅ |
| Manage own rider profile (vehicle, availability) | — | — | Own | — | ✅ | ✅ |
| View/manage users | — | — | — | View | ✅ | ✅ |
| Suspend/unsuspend user, seller, rider | — | — | — | — | ✅ | ✅ |
| Approve/reject seller (KYC) | — | Request | — | — | ✅ | ✅ |
| Approve/reject rider (KYC) | — | — | Request | — | ✅ | ✅ |
| File a dispute / support ticket | ✅ | ✅ | ✅ | — | View | ✅ |
| Resolve a dispute / ticket | — | — | — | ✅ | — | ✅ |
| Escalate a ticket | — | — | — | ✅ | — | ✅ |
| Refund a customer | Request | — | — | ✅ | — | ✅ |
| Request a payout | — | Request | Request | — | — | — |
| Approve a payout | — | — | — | — | ✅ | ✅ |
| Manual wallet adjustment | — | — | — | — | — | ✅ |
| View wallet transaction ledger | Own | — | — | — | ✅ | ✅ |
| Manage staff (Admin, Support, Payment, Moderator) | — | — | — | — | — | ✅ |
| View As (impersonate a user) | — | — | — | Own case only | ✅ | ✅ |
| Commission engine (set rates) | — | — | — | — | — | ✅ |
| Membership plans (create/edit) | — | — | — | — | View | ✅ |
| Promotions & discounts (own store) | — | Own | — | — | — | — |
| Promotions (platform-wide) | — | — | — | — | View | ✅ |
| Platform settings (system/app/delivery/payment methods) | — | — | — | — | — | ✅ |
| Feature Marketplace / Feature Rollout | — | — | — | — | View | ✅ |
| Feature Availability by city | — | — | — | — | View | ✅ |
| Countries & Regions | — | — | — | — | — | ✅ |
| Audit Center / Platform Logs | — | — | — | — | — | ✅ (cannot be edited/deleted by Admin) |
| System Health / Platform Tools diagnostics | — | — | — | — | — | ✅ |
| Free telehealth visit (staff benefit) | — | Own request | Own request | Own request | Approve (Super Admin only) | ✅ |
| Book/pay for a telehealth visit | ✅ (wallet) | ✅ (earnings) | ✅ (earnings) | — | — | — |
| Reports & Analytics | — | Own store | Own earnings | — | ✅ | ✅ |
| Fraud & Risk Flags (investigate/dismiss) | — | — | — | — | ✅ | ✅ |
| Seller churn risk / performance grade / LTV (view) | — | — | — | — | ✅ | ✅ |
| Bulk actions (suspend, KYC approve, order status, category migration) | — | — | — | — | ✅ | ✅ |
| Delivery zone management (add/toggle zones) | — | — | — | — | ✅ | ✅ |
| Categories (create/rename/delete, draft & publish) | — | — | — | — | — | ✅ |
| Category-level commission overrides | — | — | — | — | — | ✅ |
| Custom role/department creation | — | — | — | — | — | ✅ |
| Access reverse lookup (who has capability X) | — | — | — | — | — | ✅ |
| Data retention policy | — | — | — | — | — | ✅ |
| Escalate a ticket (requires reason) | — | — | — | ✅ | — | ✅ |
| Reopen a resolved ticket (requires reason) | — | — | — | ✅ | — | ✅ |
| Shift handoff notes (post/read) | — | — | — | ✅ | — | View |
| Knowledge Base (read) | — | — | — | ✅ | View | ✅ |
| Store loyalty program (own store, enable/configure) | View | Own | — | — | — | — |
| Store loyalty program (platform-wide view) | — | — | — | — | View | ✅ |

## Notes for the real backend build

- **Admin vs Support vs Super Admin** is already enforced as two genuinely separate
  compiled apps (`admin.html` / `support.html`), not just a UI toggle — RLS should
  mirror that split rather than gating on a single "staff" role.
- **Super Admin = Admin + Support + platform control.** In RLS terms, Super Admin
  should satisfy every policy an Admin or Support policy would check, plus the
  platform-only rows above.
- Rows marked **Own** need a `user_id = auth.uid()` (or `seller_id` / `rider_id`)
  check, not just a role check.
- **Refund a customer** is the one function two different roles can trigger
  (Support directly, Customer via request) — make sure the policy distinguishes
  "create a refund request" from "execute a refund."
- Anything in the "Platform settings / Commission engine / Feature Marketplace"
  block currently only updates local UI state in the prototype (no backend yet) —
  see the "Prototype note" callouts already in those screens. These are the
  highest-priority rows to wire up first since they're config, not transactional data.
