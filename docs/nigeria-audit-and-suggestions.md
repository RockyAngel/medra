# Medra -- Nigeria reality check and 150 suggestions

Nothing in this document has been changed in the app yet. The only change made is the one you asked for: the "Call 112" buttons are gone, and every emergency screen now says to go to the nearest hospital.

Legal and regulatory points are flagged as "check with a Nigerian lawyer" -- they are things to verify, not legal advice.

---

## Part 1 -- What was changed this round

| Where | Before | Now |
|---|---|---|
| Healthcare Home | "Emergency? Call 112" button | Red note: "In an emergency, go to the nearest hospital straight away." |
| Emergency Care screen | "Call 112 now" button, "call your local emergency number" | "Go to the nearest hospital now -- don't wait." No call button. |
| Symptom checker warning | "call emergency services immediately" | "go to the nearest hospital immediately" |
| Symptom checker emergency result | "call your local emergency number", button "Find Emergency Care" | "Please go to the nearest hospital now", button "Find the Nearest Hospital" |

The Call and Directions buttons on each listed hospital stay (those call the hospital itself and open a Google Maps route).

---

## Part 2 -- What I found line by line (not changed)

### A. Units and formats that are not Nigerian

| # | Finding | Where |
|---|---|---|
| A1 | Distances shown in **miles** to customers ("3 mi -- ~32 min") | `medra.jsx` lines 2453, 2472 |
| A2 | Rider trip history and CSV export use **miles** ("Distance (mi)") | `medra-rider.jsx` 956, 966 |
| A3 | Rider vehicle log uses **miles** and US-style jobs ("Oil change", "Tire rotation", "12,400 mi") | `medra-rider.jsx` 1461-1482 |
| A4 | Seller order shows "1.2 mi"; store settings say "Delivery radius 8 miles" | `medra-seller.jsx` 124, 2266 |
| A5 | Super Admin delivery setting is "Default delivery radius (**miles**)" | `medra-superadmin.jsx` 3165 |
| A6 | Cookware listing says "oven safe to **450°F**" | `medra.jsx` 145 |
| A7 | Product "House Blend Beans (**12oz**)" | `medra-seller.jsx` 58 |
| A8 | Your order-size rule is in **lb**, so lb is now used for weight -- most Nigerian sellers weigh in **kg** | order size feature |
| A9 | Fuel cost is a flat ₦55/km -- fuel price has moved a lot, so this will be wrong quickly | `medra-rider.jsx` 19 |
| A10 | Dates are written US-style ("May 16, 2025", "Aug 12 - Aug 19, 2026") | everywhere |

### B. Delivery and logistics assumptions

| # | Finding | Why it matters |
|---|---|---|
| B1 | **Peak hours are 12-2pm and 6-9pm** (US lunch/dinner) | Lagos traffic peaks roughly 6-10am and 4-8pm, and rain/flooding matter more than mealtimes |
| B2 | Riders can pick **bicycle / motorbike / car** | Lagos has restricted commercial motorcycles for years (see [Sanwo-Olu rules out reversal of okada ban](https://www.ripplesnigeria.com/sanwo-olu-rules-out-reversal-of-okada-ban-in-lagos/) and [Lagos govt renews crackdown on okadas](https://www.ripplesnigeria.com/lagos-govt-renews-crackdown-on-okadas/)). Whether registered delivery bikes are allowed in a given area needs checking. Other cities differ. |
| B3 | Rider sign-up says "Driver accounts require **license & insurance verification**" | Many Nigerian riders have no vehicle insurance; common requirements are guarantors, FRSC licence, NIN, vehicle papers |
| B4 | Delivery works off a free-text address and a mock "Lekki, Lagos" | Nigerian addresses are informal; there are no reliable postcodes. Landmarks and a dropped pin matter more |
| B5 | Live tracking, ETA countdown and route preview are **simulated** | There is no real GPS, map or routing behind them |
| B6 | ETAs are fixed numbers (~32 min for 3 mi) | Real Lagos trips swing wildly with traffic |
| B7 | Delivery fee range ₦600-₦2,400 | Plausible for short Lagos trips, too low for longer or cross-island trips and for bad weather |
| B8 | One rider is assumed to carry any order up to 100 lb | A bike cannot carry 60-100 lb; Large needs a car/van/tricycle (keke) |
| B9 | Riders go "online" with a checklist (helmet, fuel, phone charge) | Good fit -- but no "power bank / data" item, which matters in Nigeria |
| B10 | Weather multipliers include "Harmattan haze" | Good local touch -- already Nigerian |

### C. Money and payments

| # | Finding | Why it matters |
|---|---|---|
| C1 | Payment options: Card, Wallet, Split, **Bank transfer with proof photo** | Bank transfer fits Nigeria well, but screenshots of transfers are easy to fake. A per-order virtual account is the usual answer |
| C2 | **No USSD, no pay-with-bank-app, no POS-on-delivery, no QR** | These are all common ways Nigerians pay |
| C3 | Card brands: Verve, Mastercard, Visa | Good, local |
| C4 | Bank list has only 8 banks (Access, GTBank, First, Zenith, UBA, Kuda, Opay, Moniepoint) | Missing Wema, Sterling, Fidelity, Stanbic, FCMB, Union, Polaris, Palmpay, Ecobank, Keystone and others |
| C5 | Account number field accepts any 10 digits | There is no name-check against the account (name enquiry) |
| C6 | **No VAT.** Prices carry Medra's 10% markup and nothing else | VAT in Nigeria is 7.5% on most goods and services. Where it applies and who remits it needs a decision |
| C7 | Receipts have no business name, address, RC number, TIN or VAT line | Sellers and businesses expect proper receipts |
| C8 | Currency dropdown offers NGN, USD, GHS, KES | Fine for expansion, but the whole app is hard-wired to ₦ |
| C9 | Wallet holds customers' money and pays out to riders and sellers | Holding balances usually needs a licensed partner (bank, payment service bank, or licensed wallet provider) -- check with a Nigerian lawyer |
| C10 | Points are bought, earned and spent like money | Points that can be bought and cashed out can be treated as e-money |
| C11 | Cash on delivery exists for riders | Very Nigerian and good -- but no cash-handling limit, remittance deadline or float tracking |
| C12 | Payouts are weekly with a "Request payout" button | Fine; Nigerian sellers often want daily or instant payout |

### D. Legal and regulatory exposure (check with a Nigerian lawyer)

| # | Finding | Concern |
|---|---|---|
| D1 | **Weekly Lottery** with a 300-point jackpot, **Reverse Auction**, **Duel**, prize wheel, daily mystery box | Lotteries and prize games are regulated in Nigeria (national and state level). Games where people pay points with real value for a chance at a prize are the sensitive ones |
| D2 | **Loans between customers** with optional interest ("Lend to or borrow from a friend... add interest") | Digital lending is regulated by the consumer protection commission, and registration is required for lenders ([FCCPC digital lending rules](https://blog.lendsqr.com/download-the-fccpc-digital-lending-regulations-2025/)). Peer lending on your platform may count |
| D3 | **"Insurance"** you can buy with points ("2,000 points per 10,000 points covered") | Insurance is a regulated business. Calling a points feature "insurance" is risky even if it is only a game |
| D4 | Telehealth lists doctors with MDCN numbers and pharmacists with PCN numbers | Good direction (the real regulators) -- but the numbers are mock and there is no real licence check |
| D5 | Pharmacy products and prescriptions | Prescription-only drugs need a valid prescription and a licensed pharmacy; NAFDAC-registered products only |
| D6 | **No data-protection language for Nigeria** (privacy text is generic) | The Nigeria Data Protection Act applies: consent, purpose, data-protection officer, breach reporting |
| D7 | Health records, prescriptions and symptom history are stored | This is sensitive data under Nigerian data law |
| D8 | Terms and Privacy text are generic and not tied to Nigerian law | Needs local drafting |
| D9 | Referral and "give-back / donation" features move money | Charitable collections may need approval |
| D10 | Crypto: none found | Good, nothing to worry about |
| D11 | Alcohol, tobacco, age checks: none found | If any seller lists these, there is no age gate |
| D12 | Seller "KYC" asks only for "Business license" | Registered businesses have CAC numbers; small traders may have none; food sellers may need NAFDAC or state health papers |

### E. Healthcare

| # | Finding | Why it matters |
|---|---|---|
| E1 | Emergency list ("City Central Emergency Room", "Marina Road, Lagos Island") is **made up** | Real hospitals need real names, phones and up-to-date info, state by state |
| E2 | **"Video consultation" is simulated** | No real video room exists |
| E3 | **"Voice support line" is "coming soon"** | Most Nigerians would rather call than chat |
| E4 | Telehealth rules for Nigeria (doctor registration, record keeping, consent) are not reflected | Needs local clinical/legal review |
| E5 | Prescriptions are "provider-issued or self-added" | Self-added prescriptions can be abused to buy restricted drugs |
| E6 | Lab tests, health insurance (HMO/NHIA), and home sample collection are absent | These are big in Nigerian healthcare |
| E7 | Symptom checker keywords are English only | Pidgin, Yoruba, Hausa and Igbo phrases ("belle dey pain me", "I no fit breathe") will not trigger the red-flag warning |
| E8 | Telehealth prices are in points | Fine as a prototype; real doctors are paid in naira |

### F. Identity, trust and safety

| # | Finding | Why it matters |
|---|---|---|
| F1 | No NIN, BVN, or CAC anywhere | Standard in Nigerian onboarding for riders, sellers and wallet users |
| F2 | No guarantor flow for riders | Common requirement for logistics in Nigeria |
| F3 | No rider police report / background check | Common for delivery companies |
| F4 | No phone-number verification by SMS code for customers | Phone number is the main ID in Nigeria |
| F5 | Staff sign-in uses an authenticator-app code | Fine for staff; customers and riders need SMS or WhatsApp codes |
| F6 | No fake-account / SIM-swap / promo-abuse controls | Referral and points features invite abuse |
| F7 | SOS button for riders exists | Good -- but who receives it? There is no real recipient |

### G. Connectivity and devices

| # | Finding | Why it matters |
|---|---|---|
| G1 | The apps are 0.2 MB to 2.5 MB single HTML files, loaded in one go | On a weak network this is slow. Combined preview is 2.5 MB |
| G2 | Google Fonts are loaded from the internet on every page | Blocks or slows first paint on poor connections |
| G3 | "Staff offline" banner exists (admin only) | Customers and riders have no offline mode |
| G4 | No data-saver / low-bandwidth mode, no image compression | Data is expensive |
| G5 | No power-cut handling (battery low, resume order) | Frequent outages |
| G6 | Product photos use placeholder seeds | Real photos will need upload compression |

### H. Language, culture and communication

| # | Finding | Why it matters |
|---|---|---|
| H1 | Pidgin exists for product descriptions only | Good start; nothing else is translated |
| H2 | Provider languages list Yoruba, Igbo, Hausa | Good. No UI in those languages |
| H3 | No WhatsApp ordering, support or order updates | WhatsApp is the main channel for Nigerian commerce |
| H4 | Notifications assume app push | Many users will only get SMS or WhatsApp |
| H5 | Marketing copy ("Deliver Smiles. Every Mile.", "24/7 support") | "Every Mile" is a mile pun; "24/7 support" is a promise the team has to keep |
| H6 | Customer names/addresses are Lagos-centric (Lekki, VI, Yaba, Ikeja) | Abuja, Kano and Port Harcourt appear only in feature-availability lists |

### I. Things that look built but do not actually work yet

| # | Finding |
|---|---|
| I1 | All data is mock; nothing is saved |
| I2 | "Prototype saved" messages are fake saves |
| I3 | Tracking, ETAs, GPS, route preview, video calls, push, SMS/email, payments and payouts are all simulated |
| I4 | Role enforcement is interface-only |
| I5 | The only real cross-app flow is transfer orders in Combined Preview |
| I6 | Order IDs, tickets, TXN ids are random numbers (collisions possible) |
| I7 | Super Admin "Feature rollout by city" lists only Lagos, Abuja, Kano, Port Harcourt |

### J. Already good for Nigeria (keep)

Naira everywhere; Lagos/Abuja/Kano/Port Harcourt; MDCN and PCN licence formats; Nigerian bank list and 10-digit account numbers; Verve cards; Nigerian phone formats (+234, 080x); bank transfer with proof; cash on delivery; Pidgin text; Harmattan weather; Yoruba/Igbo/Hausa provider languages; ₦ fuel cost per km.

---

## Part 3 -- 150 suggestions

Each is tagged **Add**, **Change**, **Substitute**, **Merge**, **Remove** or **Fix**.

### Units and formats (1-12)

1. **Change** all customer-facing distances from miles to kilometres.
2. **Change** rider trip history and its CSV header to km.
3. **Change** the rider vehicle log to km, and replace "Oil change / Tire rotation" with "Engine service / Tyre change / Chain and sprocket / Brake pads".
4. **Change** seller "Delivery radius 8 miles" and the Super Admin radius field to km.
5. **Change** the cookware "450°F" to "230°C", and use Celsius everywhere.
6. **Substitute** "12oz" and other ounce sizes for grams/ml.
7. **Change** order weight input to kilograms (with the same four classes converted: under 16 kg, 16-27 kg, 27-45 kg, over 45 kg) -- or let the seller pick the unit.
8. **Change** dates to day-month-year (28 Oct 2026) across the apps.
9. **Add** a 24-hour clock option; keep the 12-hour as default.
10. **Change** "Deliver Smiles. Every Mile." to a kilometre-neutral line.
11. **Fix** thousands separators and currency formatting to one shared helper.
12. **Change** the rider fuel cost to an editable Super Admin setting by city.

### Delivery and logistics (13-38)

13. **Change** peak windows to Lagos rush hours (about 6-10am and 4-8pm) and let Super Admin edit them per city.
14. **Add** a rain/flood surcharge that Super Admin can switch on for a city.
15. **Add** vehicle types: bicycle, motorbike, **tricycle (keke)**, car, van, truck.
16. **Add** a size-to-vehicle rule: Large needs car/van/keke, Oversized needs van/truck; bikes never see them.
17. **Add** a "restricted zones" list per city where motorbikes are not allowed, with routing to car riders only (needs your confirmation of the local rules).
18. **Add** landmark-based addresses: "near ... bus stop", "opposite ...", with a dropped pin.
19. **Add** an area/LGA dropdown (Lekki Phase 1, Ikeja GRA, Wuse 2, etc.) instead of free text only.
20. **Add** a delivery PIN or order code the customer reads to the rider to prove handover.
21. **Add** "call customer" and "WhatsApp customer" buttons for riders, with number masking.
22. **Add** multi-stop and batch deliveries so one rider can carry nearby orders.
23. **Add** scheduled and bulk deliveries for businesses.
24. **Add** inter-city (park/bus) parcel delivery as a later option.
25. **Add** a rider "power bank / data" pre-shift check.
26. **Add** a rider rest/ safety rule after long shifts.
27. **Change** ETAs to ranges ("35-50 min") with an "area is busy" note.
28. **Add** a "wrong address" and "customer unreachable" flow with a waiting-time fee.
29. **Add** failed-delivery and return-to-seller fees.
30. **Add** a delivery-fee calculator per city that Super Admin controls (base, per km, minimum, surge).
31. **Change** the fee floor so very short trips still cover the rider's fuel.
32. **Add** a tip in naira as well as points.
33. **Add** a seller "ready for pickup in X minutes" timer.
34. **Add** pickup points (lockers, partner shops) for customers who are rarely home.
35. **Add** an estimated-weight field on products so Large/Oversized can be flagged before checkout.
36. **Change** order size so the customer sees the likely size and fee at checkout, not only after the seller weighs it.
37. **Add** a dispute path for the seller's weight (customer or rider challenges it).
38. **Add** an extra-heavy loading/offloading fee for stairs or no lift.

### Payments and wallet (39-62)

39. **Add** per-order virtual bank accounts for transfers (via a licensed payment partner) so payment is confirmed automatically.
40. **Add** pay-with-bank-app, USSD, and QR payment options.
41. **Add** pay-on-delivery by POS machine (rider carries a POS) alongside cash.
42. **Add** bank name-check (name enquiry) before saving a payout account.
43. **Add** the full list of Nigerian banks and fintechs (Wema, Sterling, Fidelity, Stanbic, FCMB, Union, Polaris, Ecobank, Palmpay, and more).
44. **Add** VAT handling: show whether VAT is included, and a VAT line on seller invoices and platform fee invoices.
45. **Add** formal receipts and invoices with business name, address, RC and TIN.
46. **Add** seller and rider tax summaries for the year.
47. **Add** instant or same-day payout as a paid option.
48. **Add** a wallet limit and daily limit tiers linked to ID verification level.
49. **Add** a cash-handling limit for riders and a daily cash remittance deadline.
50. **Add** automatic reconciliation of cash on delivery against bank deposits.
51. **Add** chargeback and failed-payment handling.
52. **Add** refund-to-wallet, refund-to-bank and refund-in-points choices with clear timelines.
53. **Add** an automatic refund rule table (for example full refund for a wrong item, partial for late delivery).
54. **Change** "Service fee" wording in Admin and Seller views so the customer-facing price and the seller's net price are clearly separate.
55. **Add** a seller "price you receive vs. price the customer sees" calculator.
56. **Add** installment / "pay small small" options (needs a lending partner).
57. **Add** gift cards and vouchers with expiry.
58. **Add** corporate accounts with invoicing and monthly billing.
59. **Add** a "pay for someone else" option (fits the gift mode you already have).
60. **Add** a fraud-score for transfer proofs (duplicate image, edited image, reused reference).
61. **Add** currency display for diaspora customers (show USD/GBP estimate next to the naira price).
62. **Fix** random order/transaction IDs so they can never repeat (use a proper sequence or UUID).

### Legal and compliance (63-84)

63. **Add** a Nigerian-law privacy policy and terms, drafted by a local lawyer.
64. **Add** a data-protection consent screen at sign-up, with the right to download or delete data.
65. **Add** a data-protection officer contact and a breach-response checklist for staff.
66. **Add** a regulatory register page in Super Admin: licences held, renewals, and owners.
67. **Change** or pause the **Weekly Lottery**, **Reverse Auction**, **Duel** and prize games until their legality is confirmed; if kept, make them free-to-enter promotions only.
68. **Substitute** paid-entry games with free daily rewards (login streaks, spin with no cost).
69. **Remove** the ability to buy extra lottery entries until a lawyer confirms the rules.
70. **Change** "Loans between customers" to a non-money feature (for example "split a bill") or remove it until a lending partner is in place.
71. **Remove** the "Insurance" wording from the points feature; rename it "Points Protection" or remove it.
72. **Add** a terms screen for every points game: odds, who funds the prize, how to complain.
73. **Add** a minimum age check (18+) for games and for any restricted product.
74. **Add** restricted-product rules: no prescription-only drugs without a verified prescription, no alcohol/tobacco to minors, no banned items.
75. **Add** NAFDAC number fields for pharmacy and packaged-food sellers.
76. **Add** seller documents by type: CAC number, TIN, NAFDAC, state food/health permits, shop licence.
77. **Add** a takedown and counterfeit-reporting flow.
78. **Add** consumer-protection language: return window, refund timing, complaint route.
79. **Add** a "report this seller / rider / customer" flow with evidence upload.
80. **Add** record-retention rules by data type (orders, health, KYC) and an automatic purge.
81. **Add** audit trail export for regulators.
82. **Add** a clear "who we are" legal entity block in the footer and on receipts.
83. **Add** an anti-money-laundering review for big wallet movements and many small top-ups.
84. **Add** a sanctions/PEP check placeholder for onboarding.

### Healthcare (85-108)

85. **Substitute** the mock emergency list with real hospitals per city, each with verified phone, address, hours and whether emergency care is available at night.
86. **Add** a "nearest hospital" map using the customer's location, with Directions and Call buttons that work.
87. **Add** an "I'm sending someone else" option on the emergency screen (share location and hospital with a family member).
88. **Add** red-flag phrases in Pidgin, Yoruba, Hausa and Igbo to the symptom checker.
89. **Add** a "what to do while you travel to hospital" tip list (stay calm, bring ID and phone, keep the person still).
90. **Add** a private-ambulance directory as an optional extra line, labelled clearly as "may not be available in your area".
91. **Add** a pharmacy directory with opening hours and "open now" status.
92. **Add** lab tests: book, pay, home sample collection and results upload.
93. **Add** health-insurance support: HMO plan on the profile, and "does my plan cover this" notes.
94. **Add** a verified-licence badge that only appears after a real MDCN/PCN check.
95. **Change** prescriptions so only a provider-issued prescription can unlock prescription-only items; self-added ones are for records only.
96. **Add** a medication reminder and refill reminder.
97. **Add** drug-interaction and allergy checks before pharmacy orders.
98. **Add** a child dosage warning that always points to the label or a pharmacist.
99. **Add** consent for video recording and for sharing records between providers.
100. **Add** a low-bandwidth consult mode (audio only, then text).
101. **Add** a "call me back" consult option for people with poor data.
102. **Add** doctor schedule slots in local time with automatic reminders by SMS.
103. **Merge** "Health Messages" and "Messages" into one inbox with two tabs (Health / Orders & Support), so the naming confusion goes away.
104. **Merge** "Prescriptions" and "Health Records" into one "My Health" screen with tabs.
105. **Add** a mental-health support page with local helplines and a clear "this is not emergency care" note.
106. **Add** maternal and child health content (antenatal reminders, vaccination schedule).
107. **Add** community health tips in Pidgin and local languages.
108. **Add** a sickle-cell, malaria, hypertension and diabetes starter set of care plans, since they are widespread.

### Identity, trust and safety (109-120)

109. **Add** NIN and BVN verification for riders, sellers and high-limit wallet users (through a licensed identity provider).
110. **Add** rider guarantor details with a verification call.
111. **Add** rider licence, vehicle papers and, where required, vehicle insurance as separate documents.
112. **Add** an optional police clearance or background-check step.
113. **Add** phone verification by SMS code for every account.
114. **Add** device and SIM-swap alerts for wallet users.
115. **Add** a "verified" badge system for sellers (CAC, TIN, NAFDAC as relevant).
116. **Add** a trusted-contacts list that the SOS button actually messages.
117. **Add** an incident report flow for riders (accident, theft, harassment).
118. **Add** rider insurance or a rider welfare fund as a real product (replacing the points-based "insurance").
119. **Add** an anti-abuse score for referrals and promos (shared device, same bank account).
120. **Add** a fraud-watch page in Admin with automatic holds on suspicious payouts.

### Connectivity and performance (121-130)

121. **Add** a data-saver mode: no autoplay, smaller images, text-first screens.
122. **Change** fonts to be bundled in the app instead of fetched from Google.
123. **Add** offline support for riders: keep the active order, address and phone number if the network drops, and sync after.
124. **Add** an "order saved, will send when you're back online" queue for customers.
125. **Add** automatic image compression on upload (seller photos, proof of payment, delivery photos).
126. **Change** the build so each app loads only what it needs (code splitting) instead of one large file.
127. **Add** a low-battery mode for riders.
128. **Add** SMS fallback for key order updates.
129. **Add** a status page for known outages (payments, SMS, maps).
130. **Add** error screens that say what to do when the network is slow, in simple words.

### Language, culture and growth (131-142)

131. **Add** a language switcher for English, Pidgin, Yoruba, Hausa and Igbo for the whole interface, not only product text.
132. **Add** WhatsApp ordering and WhatsApp order updates.
133. **Add** WhatsApp and phone support for sellers and riders.
134. **Add** a voice-support line (the "coming soon" feature) as a priority.
135. **Add** a "shop by area" view (Lekki, Yaba, Wuse, Garki) with delivery time per area.
136. **Add** festive-season campaigns (Ramadan, Eid, Christmas, new year, back-to-school).
137. **Add** market and bulk-buying features (food items by the bag, provisions by the carton).
138. **Add** a "buy for family back home" flow (diaspora pays, relative receives).
139. **Add** seller storefront links to share on WhatsApp, Instagram and Facebook.
140. **Add** seller onboarding by agent (field agents visit shops and sign them up).
141. **Add** a cash-top-up agent network for customers without cards.
142. **Add** a simple seller app mode for people who only want to manage orders by phone.

### Merge, remove and simplify (143-150)

143. **Merge** "Rewards Overview", "Rewards History", "Loyalty Streak" and "Missions" into one Rewards area with tabs.
144. **Merge** "Group Orders", "Household" and "Gift & Donate" under one "Together" area.
145. **Merge** the three delivery-fee screens (Super Admin Delivery Settings, Delivery Zones, Admin zone coverage) into one fee-and-zones screen per city.
146. **Merge** Admin and Super Admin "Reports" screens into one with role-based sections.
147. **Remove** or hide features marked "Preview / Coming soon" from the customer navigation until they work.
148. **Remove** duplicate staff-benefit features (free telehealth visit voucher codes) until a real approval flow exists.
149. **Substitute** the 285-flag Feature Marketplace list with a short list of toggles that actually change something; park the rest in a "ideas" document.
150. **Fix** the prototype-versus-real wording: label every simulated feature (tracking, video, GPS, push) with a small "Preview" tag so no one mistakes it for a working service.

---

## Sources

- [Sanwo-Olu rules out reversal of okada ban in Lagos](https://www.ripplesnigeria.com/sanwo-olu-rules-out-reversal-of-okada-ban-in-lagos/)
- [Lagos govt renews crackdown on okadas](https://www.ripplesnigeria.com/lagos-govt-renews-crackdown-on-okadas/)
- [FCCPC Digital Lending Regulations 2025](https://blog.lendsqr.com/download-the-fccpc-digital-lending-regulations-2025/)
