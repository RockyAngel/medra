# Medra Onboarding Checklists (by role)

Companion to `permission-matrix.md`. Use these as the actual first-day checklist for
someone starting in each role, or as a script for a live walkthrough.

---

## Customer

- [ ] Sign up (or log in) and complete the welcome tour
- [ ] Add a delivery address, with a saved default delivery instruction (gate code, landmark)
- [ ] Save a payment method (card or wallet top-up)
- [ ] Place a first order and track it in real time
- [ ] Confirm delivery once it arrives (this is what releases the rider's payout)
- [ ] Explore Rewards: check your loyalty tier, claim a mission, try one game
- [ ] Set up Household: invite a member, create a shared list
- [ ] Try the Symptom Checker and book a telehealth visit
- [ ] File a test dispute and rate the resolution (CSAT)

## Seller

- [ ] Log in and complete the seller walkthrough
- [ ] Set store hours and delivery radius in Store Settings
- [ ] Add at least one product manually, then try the CSV bulk upload
- [ ] Preview your storefront exactly as a customer would see it
- [ ] Accept a real order from New Order Confirmations (the shared-order queue)
- [ ] Run the local Order Simulator once to see the full accept -> prepare -> ready flow
- [ ] Create a discount code in Discounts
- [ ] Check Analytics: sales forecast, customer retention, seller stats
- [ ] Add a team member with a limited permission set
- [ ] Try "Away" mode to confirm your store hides from customers

## Rider

- [ ] Log in and complete the rider walkthrough
- [ ] Go online and check Busy Zones for current demand
- [ ] Accept a job from Available Deliveries (Live) -- not the practice queue
- [ ] Complete a delivery, including the required proof-of-delivery photo
- [ ] Check today's earnings and this week's goal progress
- [ ] Add a shift to your weekly Schedule
- [ ] Visit the Gear Marketplace and make a mock purchase against earnings
- [ ] Try Telehealth booking, paid from earnings
- [ ] Refer another rider

## Support

- [ ] Log in with 2FA and complete the support walkthrough
- [ ] Check your dashboard: Open Tickets, Live Chat queue, SOS cases, CSAT
- [ ] Claim and reply to a ticket using a canned response
- [ ] Escalate a ticket to another team, then check the escalation banner
- [ ] Merge two related tickets
- [ ] Acknowledge and resolve an SOS case
- [ ] Resolve a ticket and confirm it moves out of your open queue
- [ ] Review your SLA breach indicators on at least one ticket

## Admin

- [ ] Log in with 2FA and complete the admin walkthrough
- [ ] Review a pending seller application (KYC & Verifications)
- [ ] Bulk-suspend and then bulk-unsuspend a test set of users (confirm the modal fires)
- [ ] Check the Fraud & Risk Flags queue and investigate one flag
- [ ] Review Payouts & Settlements for a pending payout
- [ ] Check the date-range filter on your dashboard actually changes Revenue/Orders
- [ ] Export a table (Users, Orders, or Payouts) to CSV
- [ ] Note what's out of scope for Admin: no platform config, no staff management, no
      commission-rate changes -- those are Super Admin only

## Super Admin

- [ ] Log in with 2FA and complete the super admin walkthrough
- [ ] Review the Permission Matrix (`permission-matrix.md`) before touching anything sensitive
- [ ] Check Team & Staff: add a staff account, assign a role, try View As (and confirm
      the "Viewing as X" banner and Exit button both work)
- [ ] Review the Audit Center -- confirm you (not Admin) are the only one who can act on it
- [ ] Check System Health, then intentionally fail a Platform Tools diagnostic and confirm
      it files a real incident on System Health
- [ ] Adjust a Feature Rollout percentage and confirm the slider actually holds a value
- [ ] Make one Commission Engine change and read the "Prototype note" -- confirm you
      understand it doesn't propagate to real checkout math yet
- [ ] Approve a pending Free Telehealth Visit request
- [ ] Toggle a country/region in Countries & Regions
- [ ] Try a manual Wallet Adjustment and confirm the reason field is required

---

## Notes

- Every staff app (Admin, Support, Super Admin) times out after 15 minutes of
  inactivity with a 1-minute warning banner first -- expect to re-authenticate if you
  step away mid-checklist.
- Nothing in this prototype persists between page loads. If you want a clean slate,
  use "Reset demo data" in Settings (Customer/Seller/Rider) or just reload the tab.
