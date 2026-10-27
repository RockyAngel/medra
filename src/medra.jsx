import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, Heart, Bell, ShoppingCart, ChevronDown, MapPin, Package,
  Wallet, Award, Gift, MessageCircle, Home as HomeIcon, CreditCard,
  Settings, LifeBuoy, LogOut, LayoutDashboard, ArrowUp, Check, X,
  Star, ChevronRight, Plus, Minus, ShieldCheck, Truck, Clock, Crown,
  Store, ShoppingBag, Utensils, Cross, Shirt, Smartphone, Sparkles,
  Send, Copy, Navigation, Phone, Palette, Lock, Unlock, HelpCircle,
  Shuffle, Disc3, PartyPopper, Camera, CalendarClock, PenLine, Type, Inbox,
  RotateCcw, SlidersHorizontal, XCircle, ThumbsUp, AlertTriangle,
  Receipt, Medal, PhoneCall, RefreshCw, Flame, CircleCheck, FileDown, Users, Image as ImageIcon, Target,
  ArrowRight, Download, Headphones, Tag, User, QrCode, Trophy, Gamepad2, Ticket, HandCoins, TrendingUp, BadgeCheck, Circle, Moon, History, CalendarCheck, Eye, Zap, Menu, Scale,
  Stethoscope, HeartPulse, Pill, Video, Mic, FileText, CalendarX, CalendarPlus, Compass, UserCircle, Info, Flag,
} from "lucide-react";

/* ============================================================
   CURRENCY -- Nigerian Naira
   ============================================================ */
const naira = (n) => `₦${Math.round(n).toLocaleString("en-NG")}`;

// Prototype-only ID generator for anything created client-side that will
// eventually become a real database row (coupons, gift cards, etc). Having
// every such ID pass through one function means the swap to "use the id the
// server returns" later is a one-line change here instead of a search across
// the file for every Math.random()/Date.now()-based id.
// SERVER-AUTHORITY: once a real backend exists, these IDs should come from
// the server (e.g. a Postgres-generated uuid), not be invented client-side.
function generateId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return prefix ? `${prefix}-${rand}` : rand;
}

// Central place for prices, fees, and reward-economy constants that are
// currently frontend-only numbers. Keeping them here (instead of scattered
// through mock data and inline math) means that when these become
// admin-configurable database values, there is exactly one object to look at
// to know what needs a settings table, rather than a codebase-wide search.
const PRICING = {
  // Lottery entry cost itself already lives in its own well-named constant
  // (LOTTERY_ENTRY_COST, defined further down) -- listed here just so this
  // object is the one place to look for every points-economy number.
  buyExtraLotteryEntryCost: 20,
  insuranceBlockCostPoints: 2000,
  insuranceCoverPerBlock: 10000,
  auctionLossFeeRate: 0.10,   // 10% of bid, charged when an auction is lost
  duelTieRefundRate: 1,       // full stake refunded on a tie
};

/* ============================================================
   MOCK DATA
   ============================================================ */

const CUSTOMER = { name: "Amara", plan: "Gold Member" };

const CATEGORIES = [
  { key: "groceries", label: "Groceries", icon: ShoppingBag, color: "#16A34A" },
  { key: "restaurants", label: "Restaurants", icon: Utensils, color: "#F97316" },
  { key: "pharmacies", label: "Pharmacies", icon: Cross, color: "#2563EB" },
  { key: "fashion", label: "Fashion", icon: Shirt, color: "#7C3AED" },
  { key: "electronics", label: "Electronics", icon: Smartphone, color: "#0EA5E9" },
  { key: "home", label: "Home & Living", icon: HomeIcon, color: "#EA580C" },
  { key: "beauty", label: "Beauty", icon: Sparkles, color: "#EC4899" },
]; // "More" tile removed -- it was a dead click

// Bonus Category of the Day (formerly "Hidden Departments"): each real day,
// one category is secretly the bonus category. Renamed and given a real,
// visible label in the UI (see the "Bonus Category of the Day" line on the
// home screen) instead of being an easter egg with no findable name -- a
// soft, real hint still narrows it to one of two broad clusters, so it
// reads as a discoverable game rather than pure invisible luck.
// SERVER-AUTHORITY: computed client-side from the device clock today. Once
// this gates a real reward, the day's bonus category must be computed and
// served by the backend (or at minimum HMAC-signed server-side) so it can't
// be predicted or influenced by spoofing the device clock.
function secretBonusCategoryForDate(date) {
  const dayStr = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayStr.length; i++) hash = (hash * 31 + dayStr.charCodeAt(i)) >>> 0;
  return CATEGORIES[hash % CATEGORIES.length].key;
}
const HIDDEN_DEPT_CLUSTERS = {
  everyday: { label: "Everyday essentials", categories: ["groceries", "pharmacies", "restaurants"] },
  lifestyle: { label: "Lifestyle & extras", categories: ["fashion", "electronics", "home", "beauty"] },
};
function hiddenDeptHintForDate(date) {
  const category = secretBonusCategoryForDate(date);
  return Object.values(HIDDEN_DEPT_CLUSTERS).find((c) => c.categories.includes(category))?.label || null;
}

// Product Battles: one real battle per day, deterministic on the date so it's
// the same for everyone and can't be rerolled by refreshing. The "winner" is
// also a deterministic function of the date -- fair (real 50/50 over time),
// not something the house can rig, and not knowable before you vote.
// SERVER-AUTHORITY: the "winner" must ultimately be computed/served by the
// backend from the real vote tally, not derived client-side from the date,
// once votes are real and rewards are real.
const BATTLE_PAIRS = [
  ["Jollof Rice", "Fried Rice"], ["Coke", "Pepsi"], ["iPhone", "Samsung"],
  ["Nike", "Adidas"], ["Tea", "Coffee"], ["Pizza", "Burger"],
  ["Cats", "Dogs"], ["Beach", "Mountains"], ["Morning person", "Night owl"],
  ["Sweet", "Savory"], ["Books", "Movies"], ["Window seat", "Aisle seat"],
];
function battleOfDay(date) {
  const dayStr = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayStr.length; i++) hash = (hash * 31 + dayStr.charCodeAt(i)) >>> 0;
  const [a, b] = BATTLE_PAIRS[hash % BATTLE_PAIRS.length];
  const winner = (hash >>> 8) % 2 === 0 ? "a" : "b";
  return { a, b, winner, id: dayStr };
}

// Reverse Auction: a bid only qualifies if it's odd AND matches the digit-length
// for whichever mode the bidder chose (10-99 for lowest, 100-999 for highest).
// This isn't shown to the player -- most careless bids simply never qualify.
function auctionQualifies(amount, mode) {
  if (amount % 2 === 0) return false;
  if (mode === "lowest") return amount >= 10 && amount <= 99;
  if (mode === "highest") return amount >= 100 && amount <= 999;
  return false;
}
function resolveReverseAuction(bids) {
  const qualifying = bids.filter((b) => auctionQualifies(b.amount, b.mode));
  const uniqueIn = (pool) => {
    const counts = {};
    pool.forEach((b) => (counts[b.amount] = (counts[b.amount] || 0) + 1));
    return pool.filter((b) => counts[b.amount] === 1);
  };
  const lowestUnique = uniqueIn(qualifying.filter((b) => b.mode === "lowest")).sort((a, b) => a.amount - b.amount)[0] || null;
  const highestUnique = uniqueIn(qualifying.filter((b) => b.mode === "highest")).sort((a, b) => b.amount - a.amount)[0] || null;
  if (lowestUnique && highestUnique) return lowestUnique.amount <= highestUnique.amount ? lowestUnique : highestUnique;
  return lowestUnique || highestUnique || null;
}


const PRODUCTS = [
  { id: "p1", barcode: "6009123450017", name: "Wireless Earbuds Pro", category: "electronics", price: 12000, rating: 4.6, reviews: 2340, seed: "earbuds-a1", badge: "Best seller", desc: "Active noise cancellation, 30-hour case battery, sweat resistant.", descPidgin: "E get active noise cancellation, case battery wey go last 30 hours, and e no dey scared of sweat." },
  { id: "p2", barcode: "6009123450024", name: "Smart Watch Series X", category: "electronics", price: 28500, rating: 4.4, reviews: 1120, seed: "watch-b2", badge: null, desc: "Heart rate, sleep tracking, and a battery that actually lasts.", descPidgin: "E dey track your heart rate, your sleep, and the battery no go finish quick quick." },
  { id: "p4", barcode: "6009123450031", name: "Ceramic Cookware Set", category: "home", price: 9500, rating: 4.5, reviews: 3050, seed: "cookware-d4", badge: null, desc: "8-piece non-stick set, oven safe to 450°F.", descPidgin: "8-piece set wey no dey stick, e fit enter oven reach 450°F." },
  { id: "p5", barcode: "6009123450048", name: "Espresso Machine", category: "home", price: 32000, rating: 4.8, reviews: 990, seed: "espresso-e5", badge: "Best seller", desc: "15-bar pump, built-in grinder, milk frother.", descPidgin: "E get 15-bar pump, grinder don already dey inside, and milk frother sef dey." },
  { id: "p7", barcode: "6009123450055", name: "Organic Avocados (6-pack)", category: "groceries", price: 1500, rating: 4.2, reviews: 410, seed: "avocado-g7", badge: "20% OFF", desc: "Hand-picked, ripens in 2-4 days.", descPidgin: "Dem pick am with hand, e go ripe for 2-4 days.", was: 1900, weightKg: 1.2 },
  { id: "p8", barcode: "6009123450062", name: "Cold Brew Concentrate", category: "groceries", price: 2200, rating: 4.6, reviews: 780, seed: "coldbrew-h8", badge: null, desc: "Steeped 18 hours, makes up to 8 cups.", descPidgin: "Dem steep am for 18 hours, e fit make cup reach 8.", weightKg: 0.75 },
  { id: "p10", barcode: "6009123450079", name: "Minimalist Backpack", category: "fashion", price: 8500, rating: 4.4, reviews: 1560, seed: "backpack-j10", badge: null, desc: "Water-resistant canvas, padded 15\" laptop sleeve.", descPidgin: "Canvas wey water no easily enter, e get padded sleeve for 15-inch laptop." },
  { id: "p11", barcode: "6009123450086", name: "Running Sneakers", category: "fashion", price: 13500, rating: 4.6, reviews: 2890, seed: "sneakers-k11", badge: "Best seller", desc: "Responsive foam cushioning, breathable knit upper.", descPidgin: "Foam wey soft well well, and the upper part dey breathe." },
  { id: "p12", barcode: "6009123450093", name: "Nivea Body Lotion 250ml", category: "beauty", price: 3200, rating: 4.5, reviews: 640, seed: "lotion-m1", badge: "15% OFF", desc: "24-hour moisture for dry skin.", descPidgin: "E go moisturize your skin reach 24 hours if e dry.", was: 3800 },
  { id: "p13", barcode: "6009123450109", name: "Oraimo Noise Cancelling Headphones", category: "electronics", price: 21000, rating: 4.5, reviews: 410, seed: "headphones-m2", badge: "10% OFF", desc: "Over-ear, 40-hour battery life.", descPidgin: "Over-ear type, battery go last 40 hours.", was: 23500 },
  { id: "p14", barcode: "6009123450116", name: "Indoor Plant -- Snake Plant", category: "home", price: 5000, rating: 4.7, reviews: 210, seed: "plant-m3", badge: null, desc: "Low maintenance, purifies air.", descPidgin: "E no need too much care, and e dey clean the air." },
];

const DRIVER_POOL = [
  { name: "Marcus T.", vehicle: "Toyota Corolla - Silver", plate: "APP-274-LG", rating: 4.9, initials: "MT" },
  { name: "Priya S.", vehicle: "Honda Civic - Black", plate: "KJA-018-LG", rating: 4.95, initials: "PS" },
];

const DONATION_CAUSES = [
  { key: "rider_fund", label: "Rider Emergency Fund", desc: "Helps riders cover unexpected costs like bike repairs or medical bills." },
  { key: "community_meals", label: "Community Meals Fund", desc: "Funds meal donations arranged through partner vendors in your area." },
  { key: "shelter_support", label: "Local Shelter Support", desc: "Supports partner shelters operating in your delivery area." },
];

/* ------------------------------------------------------------
   PLATFORM ECONOMICS
   Product commission: platform adds 10% on top of every seller's
   listed price. Delivery commission: platform takes 15% of the
   delivery fee at normal hours, 10% during peak hours -- rider
   keeps the rest. Delivery fee is distance- and peak-hour-based
   (see computeDeliveryFee). Delivery is never free -- every order carries a
   delivery fee; a reward can discount it but never remove it.
   ------------------------------------------------------------ */
const PRODUCT_COMMISSION_RATE = 0.10;
const DELIVERY_COMMISSION_NORMAL = 0.15;
const DELIVERY_COMMISSION_PEAK = 0.10;
const PEAK_WINDOWS = [[12, 14], [18, 21]];
function isPeakHour(date = new Date()) {
  const h = date.getHours();
  return PEAK_WINDOWS.some(([start, end]) => h >= start && h < end);
}
// Real distance- and peak-hour-based delivery fee, interpolated within the
// correct band for the exact distance rather than a flat number or full jump.
function computeDeliveryFee(distanceKm, peak) {
  const interpolate = (d, dMin, dMax, feeMin, feeMax) => {
    const t = Math.max(0, Math.min(1, (d - dMin) / (dMax - dMin)));
    return Math.round(feeMin + t * (feeMax - feeMin));
  };
  if (!peak) {
    if (distanceKm < 3) return interpolate(distanceKm, 0, 3, 600, 1000);
    if (distanceKm <= 6) return interpolate(distanceKm, 3, 6, 1200, 1650);
    return interpolate(Math.min(distanceKm, 12), 6, 12, 1700, 2000);
  }
  if (distanceKm < 3) return interpolate(distanceKm, 0, 3, 1200, 1600);
  if (distanceKm <= 6) return interpolate(distanceKm, 3, 6, 1700, 2000);
  return interpolate(Math.min(distanceKm, 12), 6, 12, 2050, 2400);
}

// Shared delivery/discount rules -- used by both the cart drawer and the
// checkout screen so free-delivery eligibility and the wheel-discount
// percentage are always computed the same way in both places. Previously
// each screen reimplemented this slightly differently (the cart drawer
// checked the free-delivery threshold against the pre-discount subtotal,
// while checkout checked it against the post-discount amount), which could
// make the same cart show "free delivery" in one screen and a fee in the
// other.
function isDeliveryReward(activeDiscount) {
  return typeof activeDiscount === "string" && activeDiscount.startsWith("delivery_");
}
function wheelDiscountPctFromActiveDiscount(activeDiscount) {
  return activeDiscount && !isDeliveryReward(activeDiscount) ? Number(activeDiscount) : 0;
}
// Percentage knocked off the delivery fee by a delivery reward (e.g. "delivery_50"
// = 50% off). The fee is never reduced to zero -- delivery always has a price.
function deliveryRewardPct(activeDiscount) {
  return isDeliveryReward(activeDiscount) ? Math.min(90, Number(activeDiscount.slice(9)) || 0) : 0;
}
function applyDeliveryReward(baseFee, activeDiscount) {
  return Math.max(1, Math.round(baseFee * (1 - deliveryRewardPct(activeDiscount) / 100)));
}
function peakEndsAt(date = new Date()) {
  const h = date.getHours();
  const active = PEAK_WINDOWS.find(([start, end]) => h >= start && h < end);
  if (!active) return null;
  const endHour = active[1];
  return `${endHour > 12 ? endHour - 12 : endHour}:00${endHour >= 12 ? "pm" : "am"}`;
}
const withMarkup = (sellerPrice) => sellerPrice * (1 + PRODUCT_COMMISSION_RATE);

/* ------------------------------------------------------------
   POINTS ECONOMY
   1 point = 1 naira. Naira converts to points; points never
   convert back to naira -- and nothing earned in-app (games,
   referrals, missions, bonuses) is ever paid out in real naira
   either, only in points or a % discount. Cap is 25,000 points.
   Points can be spent on the product portion of an order, themes,
   or games -- NEVER on delivery fees, which are always paid in
   full (card/wallet/transfer). See `maxRedeemable` in the
   checkout screen, which is deliberately capped at `productPayable`
   and excludes `delivery` -- do not change that without updating
   this rule.
   ------------------------------------------------------------ */
const POINTS_CAP = 25000;
const POINTS_MONTHLY_USAGE_CAP = 15000;
function endOfMonthLabel(date = new Date()) {
  const eom = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return eom.toLocaleDateString("en-NG", { month: "long", day: "numeric" });
}
const POINTS_EARN_RATE = 0.0005; // 0.5 point per ₦1,000 spent on products -- well under the 10% platform commission, so this is a net-positive program, not a giveaway
const SESSION_WARN_MS = 8 * 60 * 1000; // warn after 8 min of inactivity
const SESSION_GRACE_MS = 60 * 1000; // then 60s to respond before auto logout

const SELLER_POOL = [
  { name: "Northside Espresso Bar", initials: "NE" },
  { name: "Fresh Fields Grocery", initials: "FF" },
  { name: "Runwell Sneaker Co.", initials: "RS" },
  { name: "Ceramic & Co. Kitchen Supply", initials: "CC" },
  { name: "Ridgeview Electronics", initials: "RE" },
  { name: "Lakeside Pharmacy", initials: "LP" },
  { name: "Bright Home Goods", initials: "BH" },
];

function getSellersForProduct(product) {
  const seed = product.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const count = 2 + (seed % 3);
  return Array.from({ length: count }).map((_, i) => {
    const vendor = SELLER_POOL[(seed + i * 3) % SELLER_POOL.length];
    const variancePct = (((seed * (i + 7)) % 9) - 4);
    const sellerPrice = Math.round(product.price * (1 + variancePct / 100));
    const distance = (0.4 + ((seed + i * 5) % 34) / 10).toFixed(1);
    const rating = (4.1 + ((seed + i * 2) % 9) / 10).toFixed(1);
    const etaMin = 20 + ((seed + i * 4) % 25);
    return {
      id: `${product.id}-s${i}`,
      productId: product.id,
      vendor: vendor.name,
      initials: vendor.initials,
      sellerPrice,
      customerPrice: Math.round(withMarkup(sellerPrice)),
      distance: parseFloat(distance),
      rating: parseFloat(rating),
      etaMin,
    };
  }).sort((a, b) => a.customerPrice - b.customerPrice);
}

const REVIEW_POOL = [
  { author: "Chinedu O.", text: "Exactly as described, arrived faster than expected.", rating: 5, verified: true, helpfulCount: 24 },
  { author: "Ifeoma A.", text: "Good quality for the price. Would buy again.", rating: 4, verified: true, helpfulCount: 9 },
  { author: "Tunde B.", text: "Packaging could be better but the product itself is solid.", rating: 4, verified: true, helpfulCount: 15 },
  { author: "Blessing U.", text: "Excellent! Seller was responsive too.", rating: 5, verified: false, helpfulCount: 3 },
];
function getReviewsForProduct(product) {
  const seed = product.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return [REVIEW_POOL[seed % REVIEW_POOL.length], REVIEW_POOL[(seed + 2) % REVIEW_POOL.length]];
}
const QUESTION_POOL = [
  { q: "Does this come with a warranty?", a: "Check with the seller directly -- warranty terms vary by seller, not set by Medra.", author: "Adaeze K." },
  { q: "Is this the latest version/batch?", a: "Yes, sellers are required to list current stock only.", author: "Emeka J." },
  { q: "Can I pick a specific color/size at checkout?", a: "If the seller offers variants, you'll see a picker before adding to cart. If not, message the seller to ask.", author: "Halima Y." },
];
function getQuestionsForProduct(product) {
  const seed = product.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return [QUESTION_POOL[seed % QUESTION_POOL.length], QUESTION_POOL[(seed + 1) % QUESTION_POOL.length]];
}
function getSimilarProducts(product) {
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
}

// Seasonal Gift Guide: a curated collection that changes with the actual
// calendar month, not a fixed evergreen list. Real month ranges, not a
// random/decorative rotation.
function getSeasonalGuide(date = new Date()) {
  const month = date.getMonth(); // 0 = Jan
  if (month === 11 || month === 0) {
    return { title: "Holiday Season Picks", blurb: "Gifts for the season -- warm, thoughtful, and easy to send to someone else (try 'Deliver to someone else' at checkout).", ids: ["p5", "p12", "p2", "p14"] };
  }
  if (month >= 1 && month <= 3) {
    return { title: "New Year, Fresh Start", blurb: "Set up a better routine -- coffee, fitness, and a tidier space.", ids: ["p5", "p8", "p11", "p10"] };
  }
  if (month >= 4 && month <= 7) {
    return { title: "Summer Essentials", blurb: "Stay light, cool, and ready for the outdoors.", ids: ["p11", "p1", "p7", "p10"] };
  }
  return { title: "Back to Routine", blurb: "Gear for the new season -- tech, home, and everyday carry.", ids: ["p10", "p13", "p4", "p2"] };
}

// One signup (email/phone) can hold at most one account per role -- one
// Customer, one Seller, one Rider. These are the accounts linked to the
// signup details currently in use, so the person can switch between the
// dashboards they're signed up for without logging in again.
const LINKED_ACCOUNTS = [
  { role: "customer", label: "Customer", name: "Amara Okeke", initials: "AO", appKey: "customer" },
  { role: "seller", label: "Seller", name: "Northside Espresso Bar", initials: "NE", appKey: "seller" },
  { role: "rider", label: "Rider", name: "Amara Okeke (Rider)", initials: "AO", appKey: "rider" },
];

const NOTIFICATION_CATEGORIES = ["Orders", "Payments", "Rewards", "Healthcare", "Security"];
const NOTIF_LIST = [
  { icon: Package, color: "#16A34A", title: "Order delivered", sub: "Your order #MD238901 was delivered", time: "2h ago", goTo: "my-orders", category: "Orders" },
  { icon: Heart, color: "#DC2626", title: "Price drop on a wishlist item", sub: "Wireless Earbuds Pro is now cheaper from a nearby seller", time: "5h ago", goTo: "wishlist", category: "Orders" },
  { icon: Wallet, color: "#7C3AED", title: "Wallet top-up successful", sub: "\u20a65,000 was added to your wallet", time: "1d ago", goTo: "wallet", category: "Payments" },
  { icon: Gift, color: "#EA580C", title: "Referral bonus earned", sub: "You earned 10 points", time: "2d ago", goTo: "refer", category: "Rewards" },
  { icon: CalendarClock, color: "#0284C7", title: "Appointment reminder", sub: "Your video consultation with Dr. Chuka Obi starts in 1 hour", time: "3d ago", goTo: "health-appointments", category: "Healthcare" },
  { icon: ShieldCheck, color: "#334155", title: "New login to your account", sub: "A new device signed in from Lagos, Nigeria", time: "5d ago", goTo: "settings", category: "Security" },
];

const APP_VERSION = "v2.14.0 -- build 2026.08.23";
const STAGES = [
  { key: "placed", label: "Order placed", at: 0 },
  { key: "confirmed", label: "Confirmed", at: 15 },
  { key: "packed", label: "Packed", at: 35 },
  { key: "onway", label: "Out for Delivery", at: 55 },
  { key: "delivered", label: "Delivered", at: 100 },
];
const STATUS_COLOR = { placed: "prep", confirmed: "prep", packed: "prep", onway: "route", delivered: "done", cancelled: "delay" };

const RECENT_ORDERS = [
  { id: "MD238901", vendor: "Chicken Republic", date: "May 18, 2025", total: 8750, status: "Delivered", cancellable: false },
  { id: "MD23874", vendor: "Dee Pharmacy", date: "May 17, 2025", total: 12300, status: "Delivered", cancellable: false },
  { id: "MD23840", vendor: "SuperMart Grocery", date: "May 16, 2025", total: 15450, status: "Out for Delivery", cancellable: false },
  { id: "MD23788", vendor: "Zara Fashion Store", date: "May 15, 2025", total: 28900, status: "Cancelled", cancellable: false },
];

/* ==============================================================
   HEALTHCARE / TELEHEALTH -- MOCK DATA MODULE (frontend prototype only)
   Centralized here, same pattern as PRODUCTS/SAVED_STORES, so this is the
   one place to look when the real backend replaces it later. Nothing here
   talks to a database -- every "mutation" (booking, cancelling, sending a
   message, writing a prescription) is local React state seeded from these
   constants.
   ============================================================== */

// Severity-based per-visit pricing, by provider type + consult method.
// Each combination has a [base, capped] range -- the base fee applies when
// the symptom checker context has fewer than 2 symptoms; beyond that, the
// fee scales up with symptom count/severity ("gravity"), capped at the
// upper number. Sending pictures in a chat consult always jumps chat to a
// flat 1,000, overriding the normal range, for either provider type.
// Doctors set their own price within these ranges in a real system; the
// prototype uses the midpoint-scaling formula below for every doctor.
const TELEHEALTH_FEE_RANGES = {
  pharmacist: { chat: [400, 800], audio: [1000, 1500], video: [2500, 4500] },
  doctor: { chat: [500, 1000], audio: [2000, 3500], video: [3000, 5000] },
};
const CHAT_WITH_PICTURES_FLAT_FEE = 1000;
// Platform commission on telehealth visits, deducted at provider payout --
// same pattern as PRODUCT_COMMISSION_RATE for sellers, just its own rate
// since telehealth is a different part of the business.
const HEALTH_COMMISSION_RATE = 0.10;

// symptomCount < 2 -> gravity 0 (base fee). From 2 symptoms up, gravity
// climbs toward 1 (capped fee) as more symptoms/severity stack up -- capped
// at 6 symptoms' worth of climb so it can't exceed the ceiling fee.
function computeSymptomGravity(symptomCount) {
  if (symptomCount < 2) return 0;
  return Math.min(1, (symptomCount - 1) / 5);
}
function computeVisitFee({ providerType, consultType, gravity = 0, hasPictures = false }) {
  if (consultType === "chat" && hasPictures) return CHAT_WITH_PICTURES_FLAT_FEE;
  const [base, cap] = TELEHEALTH_FEE_RANGES[providerType][consultType];
  return Math.round(base + gravity * (cap - base));
}

const TELEHEALTH_PRICING = {
  monthly: {
    basic: { price: 15000, visits: 10, label: "Basic Monthly" },
    plus: { price: 30000, visits: 18, label: "Plus Monthly" },
  },
};

const MOCK_PROVIDERS = [
  { id: "hp1", name: "Dr. Ngozi Adeyemi", type: "doctor", credentials: "MBBS, MD -- General Practice", experience: 9, location: "Lagos, Nigeria", languages: ["English", "Yoruba"], rating: 4.9, reviewCount: 214, gender: "female", seed: "doc-ngozi", license: "MDCN/2016/GP-8841 (mock)", bio: "General practitioner focused on everyday illnesses, chronic condition management, and preventive care.", consultTypes: ["video", "audio", "chat"] },
  { id: "hp2", name: "Dr. Chuka Obi", type: "doctor", credentials: "MBBS -- Family Medicine", experience: 6, location: "Abuja, Nigeria", languages: ["English", "Igbo"], rating: 4.7, reviewCount: 132, gender: "male", seed: "doc-chuka", license: "MDCN/2019/FM-5523 (mock)", bio: "Family medicine physician seeing patients of all ages, from minor illness to ongoing care.", consultTypes: ["video", "audio", "chat", "in_person"] },
  { id: "hp3", name: "Dr. Amina Bello", type: "doctor", credentials: "MBBS, DFM -- Internal Medicine", experience: 12, location: "Kano, Nigeria", languages: ["English", "Hausa"], rating: 4.8, reviewCount: 301, gender: "female", seed: "doc-amina", license: "MDCN/2013/IM-2290 (mock)", bio: "Internal medicine specialist with a focus on adult chronic conditions -- hypertension, diabetes, and more.", consultTypes: ["video", "chat"] },
  { id: "hp4", name: "Pharm. Tunde Fashola", type: "pharmacist", credentials: "PharmD", experience: 7, location: "Lagos, Nigeria", languages: ["English", "Yoruba"], rating: 4.6, reviewCount: 98, gender: "male", seed: "pharm-tunde", license: "PCN/2017/PH-6602 (mock)", bio: "Licensed pharmacist available for medication questions, drug interactions, and OTC guidance.", consultTypes: ["video", "audio", "chat"] },
  { id: "hp5", name: "Pharm. Blessing Nwosu", type: "pharmacist", credentials: "PharmD, MPH", experience: 5, location: "Port Harcourt, Nigeria", languages: ["English", "Igbo"], rating: 4.8, reviewCount: 87, gender: "female", seed: "pharm-blessing", license: "PCN/2019/PH-7745 (mock)", bio: "Pharmacist specializing in medication counseling and chronic-condition prescription management.", consultTypes: ["chat", "audio"] },
  { id: "hp6", name: "Dr. Segun Afolabi", type: "doctor", credentials: "MBBS -- Pediatrics", experience: 11, location: "Ibadan, Nigeria", languages: ["English", "Yoruba"], rating: 4.9, reviewCount: 176, gender: "male", seed: "doc-segun", license: "MDCN/2014/PD-3317 (mock)", bio: "Pediatrician available for children's everyday illnesses and general health questions.", consultTypes: ["video", "in_person"] },
];

// Real availability slots, not a decorative calendar -- generated relative
// to "now" so the prototype always shows plausible near-future times.
function getProviderAvailability(providerId) {
  const seed = providerId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const days = [];
  for (let d = 0; d < 5; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d + 1);
    const slotsForDay = [9, 11, 13, 15, 17].filter((h) => (seed + d + h) % 3 !== 0);
    if (slotsForDay.length === 0) continue;
    days.push({ date, slots: slotsForDay.map((h) => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? "PM" : "AM"}`) });
  }
  return days;
}

const SYMPTOM_LIST = [
  "Fever", "Headache", "Cough", "Sore throat", "Runny nose", "Stomach pain", "Nausea", "Vomiting",
  "Diarrhea", "Back pain", "Joint pain", "Rash", "Dizziness", "Fatigue", "Ear pain", "Tooth pain",
  "Minor injury", "Cold/flu symptoms", "Allergic symptoms", "Urinary symptoms", "Menstrual/pelvic symptoms",
];

// Each emergency symptom is its own selectable entry (distinct from the
// general SYMPTOM_LIST above) -- selecting ANY of these immediately routes
// to the emergency flow, no combination logic needed, matching how real
// triage red-flags work (one is enough).
const EMERGENCY_SYMPTOMS = [
  "Severe chest pain or pressure", "Severe difficulty breathing", "Sudden facial drooping",
  "Sudden arm weakness", "Difficulty speaking", "Severe uncontrolled bleeding", "Loss of consciousness",
  "Seizure", "Severe allergic reaction with breathing difficulty", "Severe swelling of face or throat",
  "Sudden severe confusion", "Severe injury", "Possible poisoning or overdose",
  "Sudden severe headache with neurological symptoms", "Severe abdominal pain with concerning symptoms",
  "Suicidal thoughts or immediate danger of self-harm",
];

const MOCK_PRESCRIPTIONS = [
  { id: "RX1001", medication: "Amoxicillin 500mg", dosage: "1 capsule", frequency: "3 times daily", duration: "7 days", instructions: "Take with food. Complete the full course even if you feel better.", providerId: "hp2", dateIssued: "2026-08-20" },
];

const MOCK_HEALTH_DOCUMENTS = [
  { id: "DOC1", type: "Lab Result", title: "Full Blood Count", providerId: "hp3", date: "2026-08-15", summary: "Routine bloodwork -- results within normal range." },
  { id: "DOC2", type: "Consultation Note", title: "Follow-up Visit Summary", providerId: "hp2", date: "2026-08-20", summary: "Follow-up on respiratory infection, prescribed antibiotics." },
];


const SAVED_STORES = [
  { name: "Northside Espresso Bar", category: "Grocery & Cafe", rating: 4.8, responseTime: "Usually replies within 1 hour", about: "A neighborhood cafe roasting small-batch coffee since 2019, alongside grab-and-go grocery essentials.", hours: "Mon-Sat 7am-8pm, Sun 8am-4pm", policies: "Returns accepted within 24 hours for unopened grocery items. Coffee and prepared food is final sale." },
  { name: "Fresh Fields Grocery", category: "Grocery", rating: 4.7, responseTime: "Usually replies within 2 hours", about: "Full-service grocery store sourcing produce from local farms across the state.", hours: "Daily 6am-10pm", policies: "Produce and perishables can be returned or replaced within 24 hours if not as described." },
  { name: "Runwell Sneaker Co.", category: "Fashion", rating: 4.6, responseTime: "Usually replies within 4 hours", about: "Independent sneaker and streetwear shop, authenticating every pair before it ships.", hours: "Mon-Fri 9am-6pm, closed weekends", policies: "14-day returns on unworn items with original packaging. No returns on final-sale drops." },
];

const ADDRESSES = [
  { label: "Home", addr: "14 Bramble Close, Lekki Phase 1, Lagos", primary: true },
  { label: "Work", addr: "8 Market Plaza, Victoria Island, Lagos", primary: false },
];

const WALLET_TX_TYPES = ["Top-up", "Purchase", "Refund", "Referral", "Reward", "Membership", "Rider tip", "Adjustment", "Withdrawal", "Expiration", "Reversal"];
const WALLET_TX = [
  { id: "TXN-48213", type: "Top-up", label: "Top-up (Bank transfer)", amount: 5000, status: "completed", reference: "PSTK-9F82K3", date: "May 18" },
  { id: "TXN-48190", type: "Purchase", label: "Order #MD23840", amount: -15450, status: "completed", reference: "MD23840", date: "May 16" },
  { id: "TXN-48155", type: "Referral", label: "Referral bonus", amount: 1000, status: "completed", reference: "REF-3391", date: "May 12" },
];

/* ------------------------------------------------------------
   REWARDS -- mini-games (1 point each) + birthday feature (2 points)
   ------------------------------------------------------------ */
const GAMES = [
  { key: "riddle", title: "Daily Riddle", icon: HelpCircle, color: "#7C3AED", type: "choice", prompt: "I speak without a mouth and hear without ears. What am I?", options: ["An echo", "A ghost", "A shadow", "A phone"], correct: 0 },
  { key: "quiz", title: "Quick Quiz", icon: Sparkles, color: "#2563EB", type: "choice", prompt: "What is the capital of Nigeria?", options: ["Lagos", "Abuja", "Kano", "Ibadan"], correct: 1 },
  { key: "scramble", title: "Word Scramble", icon: Shuffle, color: "#16A34A", type: "text", prompt: "Unscramble: R C L A E N", answer: "medra" },
];

// Weighted so smaller/common prizes get bigger wheel segments and the rare,
// higher-value prizes get smaller ones -- weights sum to 100 for easy %.
const WHEEL_PRIZES = [
  { label: "1% Off Next Purchase", short: "1% OFF", emoji: "🏷️", weight: 25, color: "#14B8A6", type: "discount", value: 1 },
  { label: "2% Off Next Purchase", short: "2% OFF", emoji: "🏷️", weight: 20, color: "#65A30D", type: "discount", value: 2 },
  { label: "50 Points", short: "50 PTS", emoji: "⭐", weight: 16, color: "#2563EB", type: "points", value: 50 },
  { label: "75 Points", short: "75 PTS", emoji: "⭐", weight: 12, color: "#7C3AED", type: "points", value: 75 },
  { label: "120 Points", short: "120 PTS", emoji: "⭐", weight: 10, color: "#DB2777", type: "points", value: 120 },
  { label: "50% Off Delivery", short: "50% OFF DELIVERY", emoji: "🚚", weight: 8, color: "#F59E0B", type: "delivery_50", value: null },
  { label: "Mystery Gift (220 pts)", short: "MYSTERY", emoji: "🎁", weight: 6, color: "#EA580C", type: "points", value: 220 },
  { label: "Grand Prize (280 pts)", short: "GRAND", emoji: "🏆", weight: 3, color: "#DC2626", type: "points", value: 280 },
];

// SERVER-AUTHORITY: the spin outcome is chosen client-side with Math.random()
// today. Once a spin can award a real prize, the draw must happen server-side
// (or be verifiably seeded by the server) so the outcome can't be read or
// influenced by inspecting/replaying client state.
function pickWeightedPrize() {
  const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of WHEEL_PRIZES) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return WHEEL_PRIZES[WHEEL_PRIZES.length - 1];
}

function ProportionalSpinWheel({ onWin, canSpin, nextSpinLabel }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const size = 280, r = 118, cx = size / 2, cy = size / 2;
  let angleCursor = 0;
  const segments = WHEEL_PRIZES.map((p) => {
    const startAngle = angleCursor;
    const sweep = (p.weight / 100) * 360;
    angleCursor += sweep;
    return { ...p, startAngle, sweep, midAngle: startAngle + sweep / 2 };
  });

  const spin = () => {
    if (spinning || !canSpin) return;
    const prize = pickWeightedPrize();
    const seg = segments.find((s) => s.label === prize.label);
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalRotation = spins * 360 + (360 - seg.midAngle);
    setSpinning(true);
    setRotation(finalRotation);
    setTimeout(() => {
      setSpinning(false);
      setResult(prize);
      onWin(prize);
    }, 3400);
  };

  return (
    <div className="wheel-wrap">
      <div className="wheel-banner">🎡 SPIN THE WHEEL! <span className="wheel-banner-sub">Win points, discounts & more</span></div>
      <div className="wheel-pointer" />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r + 13} fill="none" stroke="#F59E0B" strokeWidth="9" />
        <circle cx={cx} cy={cy} r={r + 13} fill="none" stroke="#B45309" strokeWidth="1.5" />
        {Array.from({ length: 24 }).map((_, i) => {
          const bulb = polarToCartesian(cx, cy, r + 13, (i * 360) / 24);
          return <circle key={i} cx={bulb.x} cy={bulb.y} r="3.2" fill="#FDE68A" stroke="#B45309" strokeWidth="0.6" />;
        })}
        <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: spinning ? "transform 3.4s cubic-bezier(.13,.79,.15,1)" : "none" }}>
          {segments.map((s) => {
            const p1 = polarToCartesian(cx, cy, r, s.startAngle);
            const p2 = polarToCartesian(cx, cy, r, s.startAngle + s.sweep);
            const largeArc = s.sweep > 180 ? 1 : 0;
            const emojiPos = polarToCartesian(cx, cy, r * 0.72, s.midAngle);
            const textPos = polarToCartesian(cx, cy, r * 0.48, s.midAngle);
            return (
              <g key={s.label}>
                <path d={`M${cx},${cy} L${p1.x},${p1.y} A${r},${r} 0 ${largeArc} 1 ${p2.x},${p2.y} Z`} fill={s.color} stroke="#fff" strokeWidth="2" />
                <text x={emojiPos.x} y={emojiPos.y} fontSize="15" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${s.midAngle}, ${emojiPos.x}, ${emojiPos.y})`}>{s.emoji}</text>
                <text x={textPos.x} y={textPos.y} fill="#fff" fontSize="9.5" fontWeight="800" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${s.midAngle}, ${textPos.x}, ${textPos.y})`}>{s.short}</text>
              </g>
            );
          })}
        </g>
        <circle cx={cx} cy={cy} r="20" fill="#F59E0B" stroke="#fff" strokeWidth="3" />
        <circle cx={cx} cy={cy} r="20" fill="none" stroke="#B45309" strokeWidth="1" />
        <text x={cx} y={cy + 7} fontSize="20" textAnchor="middle">⭐</text>
      </svg>
      {!canSpin && !result && <div className="muted small" style={{ marginTop: 10 }}>{nextSpinLabel}</div>}
      {result ? (
        <div className="wheel-result-note"><PartyPopper size={14} /> You won: {result.label}!</div>
      ) : (
        <button className="primary-btn-sm" style={{ marginTop: 12 }} disabled={spinning || !canSpin} onClick={spin}>{spinning ? "Spinning..." : "Spin the wheel"}</button>
      )}
      <div className="wheel-legend">
        {WHEEL_PRIZES.map((p) => (
          <div key={p.label} className="wheel-legend-row"><span className="wheel-legend-dot" style={{ background: p.color }} /><span>{p.emoji} {p.label}</span></div>
        ))}
      </div>
      <div className="wheel-goodluck">⭐ GOOD LUCK! ⭐</div>
    </div>
  );
}

const CELEBRANT = { name: "Priya Menon", seed: "priya-bday" };

const THEMES = [
  { key: "default", name: "Medra Purple", cost: 0, accent: "#6D28D9", accentLight: "#EEF2FF" },
  { key: "sunset", name: "Sunset Orange", cost: 150, accent: "#EA580C", accentLight: "#FFF1E8" },
  { key: "ocean", name: "Ocean Blue", cost: 150, accent: "#0284C7", accentLight: "#E0F2FE" },
  { key: "forest", name: "Forest Green", cost: 200, accent: "#16A34A", accentLight: "#ECFDF5" },
  { key: "rose", name: "Rose Pink", cost: 200, accent: "#DB2777", accentLight: "#FCE7F3" },
  { key: "midnight", name: "Midnight", cost: 300, accent: "#4338CA", accentLight: "#E0E7FF" },
];

/* ============================================================
   NAV -- matches the 12-item spec
   ============================================================ */

const NAV_ITEMS = [
  { key: "my-orders", label: "My Orders", icon: Package },
  { key: "track-order", label: "Track Order", icon: MapPin },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "gift-guide", label: "Gift Guide", icon: Gift },
  { key: "care-package", label: "Build a Care Package", icon: Gift },
  { key: "meal-planner", label: "Meal Planner", icon: Utensils },
  { key: "wallet", label: "Wallet", icon: Wallet },
  { key: "membership", label: "Membership", icon: BadgeCheck, group: "rewards" },
  { key: "activity", label: "Rewards History", icon: History, group: "rewards" },
  { key: "streak", label: "Loyalty Streak", icon: CalendarCheck, group: "rewards" },
  { key: "missions", label: "Missions & Challenges", icon: Trophy, group: "rewards" },
  { key: "rewards", label: "Rewards Overview", icon: Award, group: "rewards" },
  { key: "refer", label: "Referrals", icon: Gift, group: "rewards" },
  { key: "group-orders", label: "Group Orders", icon: Users, group: "social" },
  { key: "household", label: "Household", icon: HomeIcon, group: "social" },
  { key: "give-back", label: "Gift & Donate", icon: Gift, group: "giving" },
  { key: "health-home", label: "Healthcare Home", icon: HeartPulse, group: "health" },
  { key: "symptom-checker", label: "Symptom Checker", icon: Stethoscope, group: "health" },
  { key: "health-provider-search", label: "Find a Provider", icon: User, group: "health" },
  { key: "health-appointments", label: "My Appointments", icon: CalendarClock, group: "health" },
  { key: "health-prescriptions", label: "Prescriptions", icon: Pill, group: "health" },
  { key: "health-documents", label: "Health Records", icon: FileText, group: "health" },
  { key: "health-messages", label: "Health Messages", icon: MessageCircle, group: "health" },
  { key: "health-provider-portal", label: "Provider Portal (Preview)", icon: Stethoscope, group: "preview" },
  { key: "product-drafts", label: "Product Drafts", icon: Target },
  { key: "wish-goals", label: "Wish Goals", icon: Sparkles },
  { key: "product-battles", label: "Product Battles", icon: Flame, group: "rewards" },
  { key: "daily-discovery", label: "Daily Discovery", icon: Sparkles, group: "rewards" },
  { key: "reputation", label: "Reputation Score", icon: Medal, group: "rewards" },
  { key: "community-requests", label: "Community Requests", icon: Users, group: "giving" },
  { key: "adopt-vendor", label: "Support a Vendor", icon: Store },
  { key: "good-deeds", label: "Good Deed Challenges", icon: CircleCheck },
  { key: "mystery-box", label: "Daily Mystery Box", icon: Gift, group: "rewards" },
  { key: "cause-of-month", label: "Cause of the Month", icon: Heart, group: "giving" },
  { key: "fantasy-league", label: "Fantasy League", icon: Trophy, group: "rewards" },
  { key: "messages", label: "Messages", icon: MessageCircle, group: "social", note: "Private" },
  { key: "community", label: "Community", icon: Users, group: "social", note: "Public" },
  { key: "treasure-hunt", label: "Treasure Hunt", icon: Gift, group: "rewards" },
  { key: "giveaway", label: "Monthly Giveaway", icon: PartyPopper, group: "rewards" },
  { key: "lottery", label: "Weekly Lottery", icon: Medal, group: "rewards" },
  { key: "ai-assistant", label: "Medra AI Chat", icon: Sparkles, group: "social" },
  { key: "account-center", label: "Account Center", icon: UserCircle, group: "account" },
  { key: "addresses", label: "Addresses", icon: MapPin, group: "account" },
  { key: "favorite-stores", label: "Favorite Stores", icon: Heart, group: "account" },
  { key: "notifications", label: "Notifications", icon: Bell, group: "account" },
  { key: "payment-methods", label: "Payment Methods", icon: CreditCard, group: "account" },
  { key: "subscriptions", label: "Subscriptions", icon: RotateCcw, group: "account" },
  { key: "settings", label: "Settings", icon: Settings, group: "account" },
  { key: "changelog-customer", label: "What's New", icon: Sparkles, group: "account" },
  { key: "delivery-photos", label: "Delivery Photos", icon: ImageIcon, group: "account" },
  { key: "support", label: "Support", icon: LifeBuoy, group: "account" },
  { key: "about", label: "About Medra", icon: Info, group: "account" },
];

const img = (seed, size = 400) => `https://picsum.photos/seed/${seed}/${size}/${size}`;
const productById = (id) => PRODUCTS.find((p) => p.id === id);

/* ============================================================
   SHARED PIECES
   ============================================================ */

function Logo() {
  return (
    <div className="brand-logo">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAABfCAYAAAA6ai+/AABWFklEQVR42n39d5hm2VXfi3/23uecN1SujtMz3dOTk7JGEQFCgCSMwAJLAgnJxtgkw/W1jeFeg7F1HX6+9mOMLxgw/tn3Ei5gMCCQkRWxUA4zkian1sz0dO6qrlxvOGHv9ftj73POPm81v3meeqa66q03nLP2Ct/1Xd+l+isnRWmFAhABpVBaoZRCEf6vFEr5X4MCBVpptFYgAILSyv8s/L3WGqUUJjxOK4XWkGiD1v4xJnxvtMIo/OM1GKNJ05TEaBItJFphjCFNEozRGCWkRmGUwhhFv+cfmyaGLDHNcySJIUsTtAnvxRi0UiSJwWiNAE4ExAH+M4ZPGD6vUFlLVVaICM5ZqqrCWkdeWAAq63BOsM7/zFmHFaEoHXlpyYsKh6JyYK2lckJpBeugqhxlZRHAOkdlBRF/Sa11SP38oqiso6qs/7349+2cQyT8jYi/FQjOSfgg/nsRcEh9A3ECIg6URsThrEVpDVI/X/h7BHH+89UXJ4HwDpXyxuLtIfyM8MfhStYXsv0XKAmGpVEomkcLKK2aF/IXHFz9+PpNiwYU/qftDRPncAocCqcVWqCyFhBM4v/GiqAFnHOgNc45rBNAI7QfXFuF1grnHMZowOGU9p8PhZL6gvh3IeIvoLUOay3iHJWtEOvCjXXNDXLOUVUO6/z3VsA5CTel/jDtdXPOIU5w1n8fXjbcKEdzr5XCRa+BEK6vNNcovg3Nb6U2/PZ7J86/DVXfn/oata+FyMF7LAqURmkJzyck8Sur+ubOvCERB3jvIVIbSPdvaotWSrc/q40u/lzBeCR4MMGfFKU1BM8m9WNEkPAEUn/UcLKsgiQYpBOonAuvocEIItq/WFkFr6IRJyAGJYJTtrky/v0qlPavq5TClVU4nQ7n7259Z8PPo1unFNZZnCic1AZF44kFwQXvoRoLqg9k+7jEaCprsU68sQSPLkr8AVDxQfaHtH5PEh3jOlhIcyfrP2z/1zGSYLVCe99UeI/1z+qHJiq4JeIPKNKxmNqMpDGC8AbDxY3tQwdb11oHq3TBiECFMFA/j3+O+tT4G+HQ/m8VjXE4BVqbJjxaJ2gliPYXw1mhdA5SjdKgxRuCdmDFIVqhbHhd2xqFCifTh1ZBOYV1LhimQ5wPCyjlvaMQbry/uM5JCCc0HsXfKP+ZVHDX4uowpxClQYOuwz/gGrtTBP8HNvbj/gJrBRZB2gjRhLD2WEaGE66xCge9/VUII7XRq+BNaiOovV7Hwvy3SfOGlGpMo/U0gkI3H7w1WEXXhdShTLUGHZmaIv4b/2cOAScYrUMspTEq/wEVDnzIoRvWtPau0omP/cpoVIj7RmtKHIn4S2+MQaGwAkoU1gaPFt6T1hptXeNyCRe3MVbn/M+c+PDUGIb4kFVfWKURXON1/GfwXqeO+Ch8PiXeTBTS5IGV+DxJnPhDqx3OSpsi1M+sNBrvgWojbe9G52g3Bknw6LU3UnQjiQjRE3U9VWy0oiBRqs0zGptQUT6h/APrC1yfyvqihGvlw1SbMjaWrVSIlU5wyuc1Ei6UDuHLP1b7sBRCEoCuc6PagJ3gtKBEhxCk0donhsZoBEVZVSRGgwjWKVJRqMSEfMb5JDvEde85HCbcNH8fvbFYVyeDBGOJEkwIHscno4IKN1AQtPfAzrWeh9bo63DmgqeIb3ycoDrBe1onOBV5G+0PKLY2+ig0Sl2suM5tlzpDrOOf6jqG2tPUB17i5Iu24FEKks4zN+ZWJ8BxrJkxiaiKamx8xvN41+0iA2vzlyaXQXf+rC5alA4+WGkE702UAqOCR3KCFQtoeqkB8bmMAiorTaipQrWR6JDqiUZ0faAk5C3hYLjgVepwrxQ477lcnXSKeC8l3iBsHJbwIa0sQzXkJPze/9xKCGsu3AitEet8pYavHCVyGz7kNa7X5xXByPz9CabQnLCQY4pq/IzE5YQ23jhCztOJUPV9bD57eJ76NYKBJ00KH7uoTuSMQkzzS9WNUHQTuLo6aUJUOBmNN1MKQTcuGKV9+AlhwSd5PkxZa8O18FWYrsNBeE1DCF0h+QVfbkuoBeoSFTQGf6NFvNfTWqOd4HDNe46TWRcqMBsqm9rLibjGELwxROWr8wfCtS4hPFZTVlUIe9pXgdKeYKVNKHVDPiHO51HhM/mCIxQuyrs4icJ9p+JR+IPYVMBt3lgf2jrvDkeL2bS5DkGq44EgiTNWFXmRGdtsq+/wqqL8TYpzndawdOtx6u8jD9Q6Me3DQPP89fPp1kOF8tK6KFgrb/FKNKJ8XqJU8GXKgUp8fhRVBEr8zcY5H9a0N1irfAlPCFH1+3Pi8QcVjNsGvKKpooKhNMaCz1MdbTksqr4mFic+H/Fhyn8uiZIbpWpjjHGQNu/TxmAJMS66qQ5p0gRpY7n3OiFXaoqV6GCoptJqvUlzWDpldpSuKEiajLspoSIshtZ1iJLmT4XaXc0k5koFI5op4+rXl8jTSGuSTkCJoMTnLRJct9KtkTkRTGNIqsl3nBNMYqis86ChAhU8ijI+rmsUlbVoVedIgnLWG9dstA+5SHyIRGrD6GIk1hGBbdKU0/Vjpb5GyifgShnANgl1ndzX0EUdqmKMKz6tbWUnaK29ETrdhBjvZVvMhsaQpAOwNF6mqfBV5+UifDZyHv73yezpb0srNQMKdZOuGitR9SmKE2Jpq7TYrjqFUvS7ukytDaV+G1pUE8e1MsGwfGKqQk7iUVTXZvFGUQWP46+PINqHCq3bqkREwIVwF4zYhWRXQsIp4nA1uhrCkXcTQmW9YdkmYQVr/WfyXsYnYlVlm/ymsq7FPERwogPS3IZxiRLPuhprsJ9wd9rke7Y+OlBYR/mlv+D+ALgQ9loDFZEGsPP3pD703cQ3aYE31UUPO/lJVB6Laiqb+q9UZMmiaBBTonZDDUnruvKqqwPAABIunnZ1DqNwSoH27QLBl7UemDPYyqJS73OslaYVYV24ZJVrklztfE6QGOU9S32BtGpaBLiA6npraW6Sde3NUSj8AQ4eR3yIqRPhBnBT/rM460LYojHCKpTmoNqSPco/ai/TJqZxbiFNGHNS51XSJKyuBi+jiCLR3VUzJTcxkNpAMC0uRoT51F40qf1St7DmuulvB9SNymcC5lFjGPXNU80H9oBUN4FWbXLVuM3gueqkNSSooAP+EiqEcKGV9e9b19UFvnTXCpTzXgDnfJ8KQDm0roEgQSrInc+Bqsq1GEhIOOsUTHCgBG0UxiSIMriA6TQ3kLo9IDix4aa2xiJ1FWSdL7GVRinXgHxNHqCiiyQ0IasGAJsTj/KnT9p2jNE6JPWtA2kLkg5gE663NAdAhfI8zm2oYUVpsaUkjplqNjSpGn4mqtO7kU066Avh8apxlDruEkgwLt3m53FlVucPSgKS4FQwAgk3LEFEYa1DJQYbktIGQXZgdFtSS9081b7ayscVVek/03CYsbqacfhwyvKhhKWVjOFSis40ha0orKayfSajjJ0t2F2fsLOxzf7OFuVon7IscdogOkOZ1H8u5UIyG7yTdFo0PtwG1Ltu/jnXYjtKabQS3yPTvnJUbrZ35BN2rWqPIhFiq8LRFFRd2YSE34Y8SdW5asif4tyUJuGu0eFZJwKJhJJUzeYwTYLb9Td1o641gJBYxNVQp8Rrk1ZVJ2rB2pXEsLVqchSf4LZJmwsnQjlpqjMXqiarBGXD8yGNJ1Ja46yjnICtFFkv5eTJIXfd0+felww4eiJBpQXb4z2ubF3j6uaYFzZydnYqplOHsgN6aoE0O0o2PMXinXewPDgJ/cNUZc7elbNsPvswm2efZLK3hRVIekOUTnDOYq1tTnvd7/IQgf9cPhw35UzbeW7KWGG2G9gJ/XEVE/Az17Q1PFyhOjmPRH1mTdTJC4bRTYxbaCTkmsF4khZ3kwNJaqdpoWb6SXXV1tTJ0pwupeJyTDV+SOpkVSTCZGjAKC1tz0NiLCUAh9Y67520AqtRiT+hFdbnIwqUURSlY39fGAwybr21z+vfsMDL7k/pz5d8/eIGn37kMl/+nXWefGKHq5dLRnsWm2tU5XtOWmlSFNr5kltpRZL1mF88zPLx2zh676u48WWv5fi3/DjH5zOKS0+y/rVPsvHM1xjv7VBi0Enq3390k13TlQ6AZN2NlplaTbpUEgmQgBMXdeEloOjSPIEOuZNEeSKh7Fad1wiBsGlwxllOnVrETQbVgHtqeORWaQJI5CWaEq62RjUDxAXgq66OfN7iwTaj2/CltQeQ6sah0bqpSnSNp9Q9Ha0x9e+09tyX8PcASWIC2utf0/8+PK9RlKXDVoZjx+d49WtSvvnbepw4ZXnquXX+5KMX+MhHr/LMkyOqUcpSNsfKwjwri/PMD3sM+xlpYkgSA0pR2cpzYayjKCum05zd3RH7u7vsbu9TWc3c4VPc+Ipv5kVv/qvc8vLX0jdT1r/6F1z58se49sIZLArT6/sDYa1He2ugUoSyrBojatBlB9bZQNOgqRwbADGEOyfO51sBna65PRJ5qiZPEengX7UHaqstiVIECTlc7ZVctxprDYZOB1fNlNU66j/UN7sJZz6TbFrmdYytb7xS8d/REqqUCZhC6BijSIxuutuJqYlOgjG6MbDGUIAk1ZSFoyw0t9y2wLd8W483vRnS3pQ//fgFfuN3z/HAF/eRcZ8TK6ucOLrKoeV5Bv2ENElIjEdYFUJiTFOK28o2OYdzQlVVFKWjqBx5WbE3GrG9tcXG+ibjsWX51H289G3v4cVveyeLh1bYfvjTXPzUH3H1648hOkWnPWxVNdiRtTbc+Kg/JYKrXPAk/pRbaQlRDZdGnM/jaiqItU0/y3fYYwCwC0YSEa1EVHi8i1IQF/Am11RJseG1BtNJ0g0qxo9Chk9IYmOilA43ODa4hlCl2p95xp1pvlfKZ/XaGP+c4cMnWjcGaJQiSU3TiNTaY5soRZYmOHFMRnDz6UXe9Bb4trdY+vPwex84x3/6L+d45uGc5f4qJ48f4dihRebnByRGU+OBsfdSgcszzS3Oei9gDKTGf1/a0IQM3BtrHUVpycuS/dGIq1eucu3qNoPVk7z0u9/HK9/zY/SX5th84BNc+fQfs/bsU6i0jzIGa6sGRba2BQoldN/Fhb63+MaqFWmSXN/moO15BbZg7YFUwyLsQv2uyXGirryruU5taBJx3TyqNrTaw8wdua15Xq0jelhdONdhSbVVlI6SMR3aCfVNbtDW+m8iD1VTQU0IP0qrcKpVw62p6ZSK2LBM3YLCaIU2MBoJy4sD3vjtKd/+toITJ4WP/fk6/9evnOPRr+QcGhzilpPHWVmcJzWGNDVNV7oxZBxpYnDOMZ4qhoOEW04OObKS4mzJ5WvChSslo8mYfuZAmdBwDA1JV9MMvPHs7o9YW7vK2pUNFo7dwSvf+79w99t/ADsds/u5D3Dl0x9g69o1kuG872ZXNoCSOhhA8CZKh+e3EZApDRW0/s86aYC9ho4R9cTafEiCYYSQ49qkOg5hNd7iPZHr9gbD51TDI7dJnJ908pQZb0FEe9Cq2ybXus1/6nyk9ky6CXPB0wTDqOkNdQ/LBO5ubeVGtZxirVVDryymhvtenPH276948cuFy1cLfvGXz/GBP1hn3qxy+80nWF6aJ00S0sS/DiINf7jOtFMj5KUw7Pf53res8G2vylleKnxTqBpDb561zUX+6KMTPvaFMSITQGOdClWfT8TLwPktS0thHaPxmMuXL7K1MeLkq97Eq3/851m590Xkzz/NtY/9Flcf+gKS9Dx9sgbyVAg5dQ4rrXHUOUdtoDTVT8h/QoO2rrQ6wF9jAHRDVYTIOWk75FIbEZHhNc8lqLmjt0kXsaXLUYk8S01paMJXdENj6qHRJngcFfIVmo5zJ+ENRqeDR9IBeW25GtJ4viQxOKdITMZb/6riTd+xz9Ky8IUHpvzLf/Es55/Q3Hb6FIdXF8mShF6WobUm0S0mUCfcAImBorQcXR3wT38s4+SxTT73oSv8xScv8fzFMSsDxfET83zjm1Z59XfexVceOsK//E9XmU5z31kOOYALN9KTtT2/twpc4J39Hc6fPYvuH+b+H/5Zjr/13UiZUz7wQdY/+ruMRxN0lmFDF7sOFS0nODQ1rW1IXx1DcVH/qyZ7dSotafm8UchxMsvM6/bQGmKEk5l8SDDZ3KH3x/V+ndzqxjhaI9EzZKsO+Uq1RtX8LKI0qOjfdfiSyDvVZWAdP2uvopTGJLC/7zh6dI73/XjBy193jSSF3/1v1/inP/s87B3mrjtuZXFhnizNwg2tP4u/ofVrVrZCad80HAz6/Nt/0COrXuAnfuQBfvE3n+cvzhQ8siY8fMny6Ud2+POPrrP73Bbv/GuG228+xEe+WJEY7wkqG1oYge/igTDVtBzSJGVhZYVqusNTH/8Tqv0R8y99FZOb7mXpjvuQi88wWruCyvoN3aHpGQWooYufqNCs9YQuFYGdMoPTxLB/TGHpEn/bwlkaTmbAhWYZnyFcmWxu9f0d7orSqCjZbUKT6lI1VQT21dTK9rF1KFJdULDTr6BjjG3iFVxfoDn4fEVx330D3vd39lk9vonWfX7t1y/xX35xnRuWb+bGG4/RyzKfMEcGqAI3uLnQda9Fw86+46ffO8d9p9b4oR/8Cr//tTH5yiGSuQV6c3OQ9WEwx27a4zMPXmXzzA4/+LcWyPPDPPhkTmJCLiPtQXG2/oAeovfVoqY/mCMbZrzwxT9n54UXOPTy17C7dAP9+17FcG+N3eefwaW9lvju4hGSgFz7HkUHN2muVXS4D1Asm2JGdQjfRMBcbaESocb1HIeKyG7QGIyKQg+dHnfsOZRWEVm8ZeWpmZK7w8ZrmmvSaZ132OxKNe3tOoEWX6yxt6947esGvPOHN1H9PZKkzy/98iX+9Df2OH3TaZZXlknCvFFc3usO8VkFd+vzmEnuOHlM8VPvy/kv/+EZfuG/b7J44jgrcwsszC8w6M8x6A/opSlGaYpen688ssHrTw14y7cf4YOfceRlS830/ZzQEISmDJYIRMuyHsPFedYe+zKbTz/F0Ve/gf10DnX3q5krdhl9/THI+m0Z25SsOmL104JqDa9FtdyazthIl9EkbUzqJP4S34O4Ko4iRVtvOW8wLf8l5mB0h9jqF4jcT5u0qpaqedDztYaoaqqhir2KNCGwGatAvGfZU3zjtyS87b3rjIsxw0GfX/mlS3z0v0657ZZbmF+Y98NpxkTvQ7f8kXDxbIjvATBma6/iLa8RXntnzk/88+fYMMscX11hMLfAYDCkl/Xo9XokaUZiErJEs5kLepTzjrcv8cATwrOXhCz1lAYVBtH8Z9ENOiozzRWtDYPFRTbOPMz2M09x+LVvYt+CuvOVLKmC0TOPIGmvIWqrMCkRo+azDZx6DEe1roIO61y13kN1Z4ro8BnoFjXM9EFrW9PxTWtnC+IbH3WRm4GqePgqYmk1aKLqNDHbCxh7LF0zpBrSkQ1JmtbC/q7w2m+Eb3/3OlvjKcP5Hr/5G2t87A8Kbrn5FIPhEKMTEhONVjWNv/b5KompCEJRVYwmE24/PmXj4pjnthIOryzTH84z6A9Isx5Zr0+aZmS9PoO5BYZzCyytLPGl5wrc5h43rIwYjwtf4QTYK4Dw2EDBbG60Tvzn1JokSRn0hhy/+RZGj32GZ3/1n5No2NvZZef138/SN30nMt5DtG46+D40uZaTU/eCtGcrSsd/q46JtiFfdxvHqkPmjcAaF2gfpgnn8fSKApKmXo/zidDLUTOtdufp2M0bkJmmkorynhrxVZ2pyXpCcmZwTlpYGg37+4pXvDrhTd+3wbXtnNXVAR//2C5/8ptjTt10E/3BMKDE/mTXWJBzEl8unCjPtXFtrNdiyYuCeWPZ2XWo/iLD4Rxp2iNNU7SpO9/aUyOSBKUVc3Mlu6Mp01HBXE/jSP0AW+UC6KeaWSWlpLks/t+hu6wsxiSN0Vz+4p9xeeUIx77/7zDa2cW94d0s5lO2Pv9x1GABrG3Zf9EIUFM+R0RdTyBTAfWlg9JKPE/SmUGKuTPSbUDLTIMr/F3SSXzUdRKlGbJUxFXozh3FTGBpyd4NLT9uqgUAL87mnThMoslzxS23ab7lXTtsjwoG/YRnnsn5jV/e4tihEwzmhk3TzQb+SjOe0pzCwJMRRZ4XzSn13OmK/dE+vXRAWQk2EMLLqvIGbVWEiPr3VpU28FIUOIvRlu2dXeb6A6xTzdQB1DiSv3mzXrjmviSJYdAfcuTGm1j/6G/TP3UXg/u/mfH2Nvb1389ga4PxUw+hekNwVZMHtQhve8iRdmqxGbyLZ40i6mk7ehQDdXX49tMUqsZr6vtT86EDGp4cHD6bJXRKx5jkQERVnWzbg3C6fTO49nF11u/iyRTVkLrLQlheMXzre0aM7D64hKRS/NavbdCXIywtLwR3HN2kiH9SP0/tIQGOHTtGkvihfxHBViXO9On3dpjmE44fP8bpW06RJIbEJIGGGY2diKMsSw7nBdOtOazL0XbE8eM3c/r0YYrSG6PWhslkysa1zYauYK1tuLdxAgwaYwxzc4uUqxMu/9d/z03HTiOLq+zvThh843vJtjcorl5CZ70OpF/fdBdTEKLOdzQY7cOWizrb4iKabTQ2qVoaBBG0EXulmuiWxFxcCT2bzlgJNDeo4c7prqFEY1BNtdU4oQZ/ieiAYQiiTa7DB3WKb/7eCXppj/GuYuWw4kO/v83Fp/rcenoFRZsEOgmDFFLjLGHM13mGnBKFS1LyuRVGVRVOvqBShVox6OoqRVmQHr8FOXQDuRMqrZtTFQ94iXMkymB1ymT0IIN0SP/knUyGijwv/XMrMPMg1zY9lVTVnGN/Q5340NXmJf4yzi+uMrl4lrU/+nUO/Y2fw01G7JMx95p3oj7yq1S2asaXY0wmnuAgaq3gpDvGFs0AqZmyu64cOTCj0N5RUTE+Q+DDdB7aHVCKy2aRA7jPzDB+ZFhKNYmutITRJtTFwJpSivEIXvNmy9LpPXa3YW5B8fyzOZ/+s4JjR27sdl2dC9SKUN46/1zGCL2eQauEqizIK8Pe2gbVZOLHaZXCpBlbGxtIPkKZAVv7U9yltQaj0VoTczj8IbM4lTHduEZVWRJjuHD5CuN9E4bmPDzfGwyoRFDOkWQZIlDmBRIMSKVpIJHZJshrpVk+eoJrZ77I9GufJb3zftzGVfYHR5l/2VtxX/hjXDaIKp9AJotmn+scrUMI16ptAcS5q9AJt8zWXWpmhla6JXkiUYBpgaCu7/Bk9xkQJxC+Vc1ED29CRwijbwXEJWY0JSy+ilEKihxuvstwz5v2KZwi6aeYRPOJD2yTuiUGw37zwZwIiVHkRQXS49RNi5y4oYfWimvXHBcv7jEu9zGqoBCN7pUhKQathLJ0LLnL3H1cM6kKepML2IV7MMpGJ1GicrbGbioOc5ETR+Alo23U9vPIwl0geeAmWMoip3KCdo5qf8Ti/JDV03eg5+ZxZcHW+fNcu7oGvX5QdfCd9zTtMTffZ/d//r8cOnYHLpnDTaaMTn4Dw0vPULzwOCqU29KZMOhKhdT31dVDAs2Xa/PLBr5w16H8S9N36lRbB5NeaTkwMcCj1Mw0QTTrotoeRD1JQCdOt+6wSzFXncQLwFWW4fFNnnpyAqWml8DmhuP5hxOOrC41VZi1DpMq9vcdt9+6wju/r8/d941YGO5ijMaVi5x7/hgf+cgJPvyxR8lWNbaqcFXZVGcqgd0R/NeP7bC1PWFnZ4EjRx1VWXWpkBGKLU5IlOHiWsVv/OE1Hr0gFHIz1paUeR4agI5UG0bTglVV8YZ3vou517+R0coNjEVTlhULG9c49uCnOfuhP2Znf4wxJoRszWB+mfHls2x9+g9Ib3k5UhZMiilVephBknVomRIDthG7v61MY6/Tof17I5VAGFFRW8C5A5RPNRtFFKi5o3fILPelUyLrKLlVdEdLYlSwGfmMlat0w8brgkKtN0tSTZYJuxvn/BRfmP/VxrCwcASjBxSVb/8nRjGZOO5/5SF+9O+O6Q03KAqNFq86lRphbqBY6N/In/7xEv/033yV1ZuOkmVDrK38XLbxCeeFxx4mSTNufvHLySvXhMd65rkFu+qRFI0rcs585YsMV45y6t77yCfTwCMW0l6Pq5cuc6wvvOtf/mv273oF63tjqqJkUlpGRUWFIR3MMf/cwzz7K/+avd29kBTbML9tmYx3vXCSc7gqR2XzHD56Cqqcsiza3CJOTq9LZ4j6SZ02QwRhSFcDqMv/jem4bdVksrlD729Qwrjvo7qNw1n3pFSXldeROIvaBAd6GXE/I4SY6bRgf6wY7fsZY0dKWaXkU4sTXzYbrSlKx4kbBvydny5wyTqjSYKICR5PIxjKwjCabPKa11XcsHKaP/7A08wtzTe5j7OWsqzoLSzSW1z2Ix9Bjqxu6zvnu8NYh3UVzvq/q6qKwdIyvfk5bFmFKkpI0pT1tXXmyx3e8e9/nUun7mPz2gbiHNNKmAaFKqkqpru7bB86xZHjx9h78LNYbRDnKKuSIs8pHRRFSVlMqVQKJkUH6bKOdEo8Dy/xqKxw4IbVAk4zwF3XaFTEv+72m+Ks1fTmD70/nqPtyI7NgHeKmOqgQ/Wjux6m/n+n4RiPsEgkeyZoDfnEcfymIe983yIXnjNMp31Wl+YZzA0pK6/MpDTkE8X3vltx8q5NRiPfmKRBWoOEBg5UytbuPve/2jKX3MT/+LNnWDqy7AlL9aBYraDQ6LyFbrG1/qvm0NogLORsY3SIbgA0bQy7u/uojQu84xd/lcun7mO0eQ2rDaNKmFqhsI7Seg27ShTFeER+7GbS888wuXgBlSQoEYxJUAI9oxnMLTI/t0ymvbrV4vyAcjJBamGlxkt0PUw7xag6ahyxschMhRtz+aNps65TCI8zad2tjpuMkQeJp/I6vJi4WRnCpI6G8HU0nxRbc0DOkQqUM+QTS29O8db3wF0vH/Hc04ZJbviB/6XP+hXYXtckqaIsLXNzir/yropK5UGOJ7DuqcdWvfH4MdWErb09Xv+GjMn2UT79mbMsHVrE2mj8U6uOu/aGEfpO9ZdI5/fx+I3WmkleML30PN/9f/wrLt7zevY2NqjQTEphUjmKynoRRCsUgSvjKkehM9R4l/zRB1CZT2hNklBMxtzx5u/m8H0vZfXW2xnedIrNJx/lRf/rv2DpltvZevQBXOBCN8YfUzGDukQNkUhMYRC6jUziKdUuatsqaMWz2ZC4qCrqzidFc48HPMbByj3Oc2L0WepkuBk6g+kIlm6AV78drj2VcuWFPXZNyRcfd0xzzdEjjj/78h6Xn9UMk0OIOIrccvRogeoL4xwSLaQJ2CDVY5SfMqisxwpSBCUZF9bW+bF/cBOXLp/g45+7yI2nT1IWBVobxKqmh6LUbJ7WnVpWUXWH+MeXyrB79hm+6x/+NJde9m3srV3z4F9lm0E2V7cmnCCVnxpwpaVyU2T5BGI0Ym2nwCjmD1MooZhuQX8Jp1Ou5Brzyr/C3Fe/wM4TD6P7gxYzkljWJDrsDWobyHBE89sRmtPgON1p6tkCqp5Liqf8o55CeDEdhaQO96IJhG03mwica5ImF+VG4kczl4+kuGyPS8WIoy8esofw5JkRo23h/7wp55aVCQ+t9fkn5TKuJ2iEorCsHq4gceRjkEQjFlQYVXJ+Rh6tvGBiow5iUy7vnuOn/4/TrP/klMeevczhY0epyioQ2+MpidbDuo66XwsI1C0Gkoz1rz/Jt7/73ex807u4evEKqTEURdkKJ9UyJUGdwlaex+sqh1UKGS7hsh6qsihjmmnIwoHNt0nRlJXDonDjEVtrW3D0NtTjX42G9l23qJUI/ggQXp02uE6TWWZEpCLv42bCWzMf5lqD6cykxYw6ZkG72S40zdQijWhUtyqSqBSsCmF4bJvVEwnbZw17kxEyEiaJQZ0pSO/eZqMUlvIJw2yFPVE4W1GVJas3QIlQVgqlBVeXykpINOjQ+NNKKPHzUVo73CTBDp7nH/2zW/ipH59wbWubhYVFbFk2HJqa+KS16jrrWC0z6NYmvT5rLzzH6970TUy/+0e5cP4KPaPJS9sy3iJN3HqIz1c+LkiuFqhkiBvMI5vraLIA2Qu5ZGQvfQu6P0/x0Gdw+T5F4XClohxPwVl0l1wUDqxpJNfq8NQBVmmVOT3qTIPttB0FOTi9SjtYl4gLGHXsgKMBthmxj45WSFxVtUwQ3ZR29Xwz9ZhCGGy/8uyY0y/rsTDu0VvuoSuh309JX6z4vfKwV+EQkIsWu15CagHH4jHNtFSUDsQKWmwYexFK7WXJ6hESrbygkA6WXOxp5pef5+f+xc38zN99ltE+9Hp9bFm11aASxKmI1xxXC14cwKQZaxfOce9dt5C9+x9y5uouQyx5qZrRX9eUvs5TFWpRvKBZJlZwlUX1BsjiIarL50mTBK/Apjj/0d/n0NFbscmYvU99EG0MReko1y4zfviT9LVBO9s9lMETuOuqaUpXt05iw6EzASmR7EOHOKGaWzjjVog0Xmjb9C1BLtYmUZGwpuqErrryQGLmu8MkwvZVy6VHxvR7JbbMUanFyhhRBeRTjizD9vouz5/Zw6Re4zbLhLllYZw7ChHyyn8VFgoHhRVyK+QCufNfUwdTCxMLBbCxpVi87QI//Y/voNjaoazKhp1fizjbyobvfSntqvC7qkRpw/bGBqePLXDD3/55ntwoSMdj8nFBOckppwVFXlBNC6q8xBaWalpSTcP3eUU5ragKiysqT75aOoKrSs/XqSowCflzDyKPf4HqiQeYPvVF35kfjxg/+BGqi89AkmFtdSApd/GMkdDhSR8skGPqwwHaVLfDJK2R6VluXKzWINKla3JQg7qtnKI2egwAxtm4C1N2SvroYcr8aWEyLTnxMs04t5x8kWJvlHP83gqZUyBDwIsMDucdvSVhUgiVQBEk2CsHVjSlU+TWUVionKJ0Ql55g5lax7i05AJX1kpufu0VfuQnb2f/yjWvRVOLIdazQDb6CoP1oNjfH7GsJ5z+oZ/lkckc6WRMVTpsXuHyCpt746jyyhvNtETyEvLS/76oqIqKsqiwZUU1rZCFowf6QXPLh3F6QOVS+ouHAEW1t4eylmww35LYoOMtmMG6rnOnOpVvx3xUV7BQqe4drP8mQc00EGeeaEY4nq6kb7er20GLozZDhw0mijRLuPj1nGMvMqxfLlm9WnD+2Zzlkwnrlx3bY8uZxyp6WRroBY7jhzR6oBgXkGmFNl6fzie6vlttdBB9DvC4FduIKUoTRw1nL+3xkrdlvOPKrfzh7z3Lwo3HcYVttWwjWqmEUZlpaUnH13jRj/4Mj6sT6J1NXJqBlI2idT1YTwTT60ZsIJS8NqTQzuJkihqugvF9pZp2YJIUZwVHgk4S0AYRg6aHMknn2kvEAOiMkzQTHy5CeFt6hMyGLtVCDCqaa4onIMOugRkNkBioq9lxEkk+qFb2QyKYWVGriNc1fIxCdrNubTTjXUOuhOHxHtt7jrkjCW4IR+7qsbFbsb1uSDMTOCzC/CGhVI6y8pJVOghFWe3zGIPCOoUxQU2qoul3tRr8CpRDkXJ+bYM3vO8oVy4d5bOfWWf+2CGqooroEy2PuZIEu3mB+9/7t3l6+WVUmxtkWUpVTjtNvQazcILKeqjAfmuUK2o58TDTTDlFDVeQtI+rSl/qKzBZD0cPl1cYnUCa4XKHK4QszQ6wH9tD2x7UWt09ppWobjxqo0lc1QYgM2o/xczdWkVTOkRf1Zlj6ba84zKrybRr61YRsOykZetFLXWlNGkvYbqnOPOpfRaWDbsjn7CeeVjIUsdzHymZbs0xHLQYxvINmkIcReWLxTqh1WF0VgsYBZPSJ75JzxOyWsVHCbsQPF0BMbywcZk3//gJNtYKnjyzyXB1GReakM1yBpMyXT/P/d/9di7c/CZG6+v00oRykndZhvXEggjOpLC7g+oNwvw2XnkqfBZVa924Cis9pDePjLeRRkdXMb162Tdb8QDieGcXu79NGqgN7RRBBI5p3S7aiCYfpTMtKR0d5XoyoRaRrQ2vgwCrNo9JOvpTMfWywYm7SFY8UtKGHYXMJk5Kut+LB+2ceK6tdYaznyzAlZ4o3SRXFZiUxWOHgzSqxRhh/rBmUnhKpXMSDERhgiQ8ytEfav7w311gsmX5gfefBqyXFVPtwgVR7diJLTMu2Uu87e/dyM4/zbm0vc9gzjcqEYVKMybXLnPn617HtTvfxtq5ywz6GVWVe/cWkGJVs9tsiZpbRl1+gu0/+P+w+Oa/hX7Zd2D3dxvFJ1s6X90BrqrQSYqaX8XtXYOkByhK69j78m9B0sMsLmOLkvFnfhWVZmRzCzhrMUa3er2qO40qsdE411BaJRpNaZaOxIJAjgNLLmIGg99mwkHqZSuTKp18JQb2OlRNHY/L0pnbbdva3trTxJANM+aHBrsy6FIBg/GZJEPrxJeSlZD1hWQJxoUX+dEEvTvt5eGVdSQDxebVkktPTig2HX/0ry/x9v/9RnKxUAWjreUxallUBdU4oRxe5nv+wY38zj8/x+5kQtrLQGumW+vcfO+duPvfw6Xz6/RTTTW2QSs/nOjgRZ0UqLSPXD7D3h/+K+zeVcrnHkbd/a3YosJo06C9TvymDOUcYjQMVxq0OUsNc4Ml5gYpKM1guARimS70ARgMl3BOKIqCMm5IxmT6mPQUcbKZxcU6noUO3tROrHSZ4DrOrruSwS3puMl01YG6rEV8JH4z0qU6NtbqNdyU5BhdkhqH0RajSgw5ialIEyFRJVpViLNUlWO4AGpOyHNfPldOUVlFYaEMXxWK7U1LOVWYYZ8XvrLPn//f6yS9hKIUCqspKkVewLQScifkpaME9rdhd/US3/nDN5AWOVYgn0w5cmKV/ht+kBcuj8lchS1K3DTHTXPsNMdNclxe4KYFthDcZI+9D/47qp110D3KvW3ceIIUlW8XFCWUJZQWKUqkLJHcouaPIUq8Z6tyjBSkGhIsdrqNm2ySUZIajS3G4IpW5bu54i2ZPi61O2TsGJOJktp6/0FMX4lnl+L0OGk6mxIPm9GFzKWVJTugZHaA+yAHtfIabXwoSmGaC8WkBAe6Z3CVBesl1nXPIq7CGEu/l+JKR38VnHFUOYjxq2iU8dp2ITIgVrG5YZFKo3oZ6VLGYx/eZria8NK3r7K/VbbiiaJ9wzIM0iOa0VrF/G3bfMdfP82f/McnWbxxhcNv+mGeXbNkMvUoasShFREwBik9zd1kGZOP/xLV+lnU3AqSj3F7W5BPEKdwtvDd7sp6RBrxIyGuQLJlXBBN3p/k7Oz7wX6N9c3LSVjnM8yZHySAwSQZxiRdSmWjJEZbGUZCQfUOpJrIFos7/6Vc36bH5OXMkoPdtm4h3chWqethLip4etVdnSJd+TMJWlwioBONHVlW7lzgxOsPU17Lkapi/tgCW0+MeOGBdfoLKRKEDsUJvWXLxCoqqzHilTJrErl2PgXXImxdLkES0qyPc5ZkYciXf2+D3pLh1OvmGe9YtNFhErI+BwpnQTBcXRuzePc6b/y+U5zZ+ibObiiSahu08SFHayQax5XKzw3pwQLlF3+b8uxX0POH/aVNM+xkF9nbwvVWwRbeoUswlFBNuWqKJAuopIc4S5KkpCkoHNsjx/JSjx/9/sMcyXb4tU/kPHNFsTynSBPd7HbSNSodiooIuTs4CRCDcTX7ZVZIunMr67WOoJwKG9ka1vnBURMV9YFUZ7uX6s4PQ3f0I2JrqWgmpypKFhYG9G4ZcHX7GtWXNlFJn717xiy/eInVZ+fZH0/RiW601gaHNNPCIpVCskAgrzy7z2m/9MpYxfaVAnSCMWmTZ7iB8Pn/Z41sOWHp1h6T/aqm4Da4kLNh95E1bO7ucVGd5Jo9hNpbRyVZMyiDNmG7SuR5ewvYxz5E/sTH0fOHG60/EFw59cmsWYKqasWhA99G19OkZg6yIZLvo5OUygpWZ7z721Z5zcl9lu3T3H+z8MDJlJecWuXBcwnrO5Zh6ikdcoDXMiNXpqIdDjIznSZtIaCi/LSDwkX3WCNd0byYWExHZVF31BSjtDzS5owGyCMzdQ0u4FBpwuK33EBh9+hZzfB1y8x90xzDJcPexXVu/q4VFk/OY8t6hsZiFhxlpbAWqkpRVPgvC0XlSUn5BHbXS191aI0xKcZkJL0ejozP/6erjK96MkSRC0UJeQ7TqWMytUwmDpdYzj0w5OyXFCY/j6oKXJ77sFLkSD5F8ikun+KmXlyI818mf/RP0HOrGJNgTIY2CcqkiK2QvQ1vLGUJ1iJl4T2T9bL0lDmIRno+ua0EFgeK33wf/NYPnmUhv8B7f3Gbu/83xWR/wn/+vqt85McnvP60Y1QIppkOcE1ztJUhs1EjVLUy/8zQWFxExOpEii69QaSzrIiZaX2ZWUEg19UKVxHH90B/ukm+QkvMOlyWcPkaVAv77K6O+I5Xv4nve9V3Ml7KUTca1ostiuEUV3lqQDZUpEOoplBZr5RZlELhhKIUytKvwhnvVoy2HUmaopRBa+NvoM5IBgMm2/DF/3yFaqp8opwLRSHeeKaCJHD+Qcf5B/oMFzNMvo+eXIViH1cWSFngihxXTKGY+PmnzbPkD/8BJhuijEdhlTEo7V8fBLe77gG7soSyCv8voAxJdFnhSoeki+AqJtbwlpv3efnmQ/zSf1rjtz+f8ds/cwOf+Pk+u3aR//jnKf2LT/OeG58nSVoF9LhfoGZUNSReRCWqIX/TEVlQkXgQHYHnOL1IYmF3dYAxE3Vso0U38YYSQVqwSLXbYj0eEO30qRuSDpKFRZzuIxPN99zzZk4uHuN3P/dnTBYrUjPHdG/TzwKViv4hoKcpc4c2grIKneC7ykEhPEsU+5sFxb4wTLOGXoGDXpaSWo2bs2yfm/LI769x97sOkxd+/LUqwQyEjWcclz6f0l8YUOQF2u6RplOkqrDJCui0HTk0GarcIn/kv/mOvOmzOOyRV9FVCxTWaucaaVFA5ck7jed24blc6VXEswWssySm5MvP7vP70ufJKyXfc8MVXupS0nSeX/vWkvPnd/jUGc2HngUpJ7i0R7TdpjMK1G6yc1GTR7pjtGpmbDlWoVJdukPDSOh2Pa9T4UhXBiueYIy9SDMpGK2Bi5dqEZQBNkdjXpXdyef+7u9wZPUwE1Py8X/423zn6jdxccei6PsdQ5WQzDsKcVSV4CpwVmFLqEqhqoSqhMrB/kaF5JG2HgqtU0oH992+ysrSCmZuwNojBc9+fBudeXqoU5adC45z/1MoVY+pHXDjyhxH5gfsjRw238cUW0g58VC+q9BiKZ76INruY2XAqROHuPnGRcpK2kG4oFfjxptQTH3eUpa4skSqCqoKZUtUVUFVQDLv57gry04OTqfk2rC+b/mF/1Hw9//vXT7/0AZ//GzKszs9tvKMkfXrxVohRNfkfQcLbulQGxpqax3Cwv1TM9WxRBvcEEG3Lu0gxhJzOWVWMCRWe1DtVrB2nFM6CViz69A5VAlrFzf5i//5KbY2tyimBZ/9/Bc5+/DzVFspVRXcubP0l/2S8KpUlJUfRKtKvyDcVr6TXVaO/bXSq4PrWEbNV3LPv3CV97z5BtLeAulcn4ufHnHly/ukCz0mW8L5TziqScKLbj3Oh37uMA/823ke+DdDfvPvLLHcSyj3NzH5BlLmaKWonvs4jC5iGXLTyVW+47ULPHVmjSwzXe6ITnDTHShGSGWRqkRKn8/47wtvPGUOZoDoDAcMM8Pt/TGvOlxxuUwZDg03LQqfWRsyKVL2t/dZTnzV1cIn0iwqj6vbiF3VFXyW7n4kObgwp200x0pYdISAFHBwB3KnZUF3v3XDL5LZl1ZdJcZA7bFVSTq1fOmpx/nbP//3OXfuAtPxmPf97N/jw1/9LFmeUFW1TKhDLwh5LtiQrxSllzgtS6Es/OqbqhD2NkqUyXwe0ah6KvqZ4cqG45lnz/Ev/9atlNWQ3sIc5z+1x8ZDIy5+siLfgRMnD/FHP1ny1tseYrE6w6p+jr/+uif4rR/aJnEWmWxiqn2K85/Hbj2DShdZWFzin73vGJ/4zNepyIISlm5lak2ClCNkuuO9eFnh3aP3KlIVngtTThHdR0wPLZbSaTbGsJyWvGp1wuGkYDEV7ujnfPSsZq9MGOUKrWSmY93OGHFdMopETci2C61m2BF+2E2a5VvxyJBJ5w69vyM7Fqey6uAmpS4hXKJVftFco+J6TAyUCJVS9G6/jWy6TrqyxNefPsv//OSn2TZCOuyRHL8Nu7aN2huhUsXKvRoxgriwg6jGT1wXT7z88Ah2B/R6vbD5LCDV1pH1FE88scM7Xqd4w6tO8ZEvjshSy8YTewgZjnl+9E3C2297gSsbCrElxXjCztUd7ly6ylcuzPPEhZRkfJby2pOYdA6nF/mDf3KaT37+CT72BcfC6jCU27pZlCHicGVOsnIrKl2GaopyghKLslXY5+fAVaBS2HuBxI7ZLjRPXh5zqAeLGWyXfq/CgIqjPTi3q/nU5hL9/jDKRSJhSekutfjL//N5oIq1reKJSunuk/TD+NfZYKLUwUVMnQormuNtSdLSJEpKVGc3o6uTY22Q0R72yjoLh1+GOMeZfIoox9yJF0NZsXd5h+rSRYyZQ2clkhhsAUpLoDAKJhLC0aliOnIUu176/cBaKa1BNNnigJ/5/57jK79s2Hrfaf7P33iW3rxCbAVacaRa5+qFCVNlsftTlPKlN1nJTfoC7Ayx7gKmt0Cplvitnz7OYPQMv/6nIwaHl3Gu1QAMUKKf4nQWGW2hhiehKgN9oGonKcJUlVIakjncdB2tE56ZrPALj+e8ZHHEy484BgPh0Q3Fp6+mjGRIf6HfmU4MQm+dCUcV/h3Tb6Wzqi8eWos2scWbLEQ6u62TZo1exzt0JSAaxn+d3SsVSXZE+wmk5c7UrX5RXa6oNin7X/g0+82uYV9h7da7fypLf/WIHz/tWyoNUnrSt2jlh/9FoZPgbbRiumup9iEzZgaorss5TS9L2N7s8ff/4wX+5B+V7E9O8R/+5CqLg5JiXHD24pTJqYKt3O+9rrVW0gXHuUsjVDGGXkqllviVnzjB9979PC//qS10f0ASAL2YM6uiiO/GmyRV5bvZSjVDcb49HM00p/N18sNgOKAoFA9vKx7dsxgsZTWA4Ry9xIQRW+eVuFTMi1MzizZbTnWHzB4pg8enXzUiRdG2mnhfEjFCy8xqvngWRx2UOpROKGsRRRXpzcWCNF5NMsUcPupPXrPJNRbBMWiTUIwrsgWDFbCl34amDIj1vBtTD88ZmG6XSKFRfd1pi9QnSWtN5TT9pYwPfn6X3/7EJv/+XZAmN/GLf3yZ/sDyoWf6/LU7p8wlju2pRWtYGcInzio++0KPdKGHqB7/9gcW+dFXPMvP/f6IM+cT5g73oqNDtPyuLQbsdAvjFze1jdkmIY2SVT3XCFAb0yNNMxiG1YIohibkR1qjdBIgDunwd2PpsXZQv6tgKjHxUmYnBeSgrEtTKet60bk0Sw7kekntrApVTF+IhWc6C0ZjaQlpVvotLw3oZfMocYirgouUZpuHUprRpGRzVKGHHucS5+eOVGAhOwW29M+XJop826LEdLrjHbk28GCesugs4198oOC1t2/zU6/dY2hO82/++x7ndif85J8afvDFJXccciRG+Nyzml/+yoBdByvHjvDv3tPju08/zl884vjVj1iyhTmP9uo4jex2iLXWuHIMdgq2mtHhcB3rVjrFKcUgTTg8v+DtTQRnSypnybJBM7tkgY3RhNJWEaEtWvkHHZLULDVTqVbiLJ5D68wkzSTNqlGgoqvR2mq8HlwHKzOhqlkYKjPzvnW4ad64xwuuru1SudIrUIZ5EmstVA7Tz1DKq01qrZCew1XK5y5B21+54GkC4KMryHctOogUSqBkdo1Ho7XgnKE31+PMC2N+5cM5f+/Nih992RlOLN/L//b/Vjx1dY+f/UzC0X5F5YRrZR9cj1O3HuUX36141fLD7I4U/+7DJXvjjPnVNHgX1e3hNJRGL51KOYJq4lsAtU6ruHajnUdgEAxK99mfjNne3UWc9WBemnJo/jBra+dCBej7ZVmWBZ3e9tDFkmUHBgI6+x67aL3ETcMZ1YY2dFlMNn/4/bNsuqb0us7upO5A/kz11Jk6uM5O1NDgNFpjkoS0l6EkYW5hjqM3HqKceikOrTVoR3ra5yiebxRNaDpaji7CztfHMOr5tkAsXqRmTlrtbo3w6AsF335vSsaUe5fWuP+eYzy8dZiNzTFj3WPsUrApb3jtXfzKO3Ju0U9QOMOnn4Zf+B+OweIQpdPQAoiuh3RLWMThXIWZuxFRma+QxFdGSmybxzjrjS9fQ7mCJM1IkxSVJqwOjvL6G+9F0j6b+S7DrIduEvx4alNHOdHMsnSRg9EnlsaNJw8OEKdaCNAkc4fe30ly41V9kXTH7CTcQbErHUq06P3MkJBb/oxPYoux48jNfb7xnSdYOFVy5MiAtXNTD/tnFnOj1ABk6JNGJZ7zRuQqy96ZKaYaeInUZiit29CIt3wYJYxHjs1xyVvvMVzarDjVv8p3vGSB6eBmnl6DuYVlfvitN/Kzrz/PYHqWvSJDifD3fz9nMx+S9Xuhez1jKErR6feKw5Y5Zu4EOplD2cK/eee84YgLiVkVkv5dsCO0SSmdxVJiXMldi7ezPtnmWnENsQqjExqxUmY+c8R0jDGZGd5CtJIx2lUwm4LEhiaCSYYr71fRiYyT2C7NoV040RlNUXSUHESuM/XSlHkhrhtFVcHyScVb33c3g5Uhj194AetGqF7KzjkhWbaowx6iqCfpvNJTO74qCqr9ivHzOakaBkVwHc1Mt2EiVrkR51AJPHOp4r6jjpuXhM2RJsnX+bZb9nn1XUd5x8s1bzn2FLubm0xsxkrf8vsPVHzgKynDxQESsB6FbncniMwIJoU9R1WB7h3C9FbA5lB7GXHey7jK/wzATtDVHoWtOLq8wnu/4W9y95E7+MTjf8YdN93N99z/DrbzDS5vr5El2XX1empOTHvjuwrls2ILB2buaUtrmRl0DHIf7fY0EQ4skmgVHPRMeyAC5Rqi9awWYytWJHhjKSthLktYfrlDDmd87bmnEZUw2i3YuzqhWk9JjwmyrFqFhSjQ+mvtR3zLrZz8oiM1w5ntKqoDGrZdDGnWI5eF4+qe5a13wrSwVJKwszvlxuwq89UVru04jxw7y+7I8fP/QzFRc6RpgtJJNOxFZ++0F7Osqx+HsyWk85j+KmKLkLtY/1X3clwdqgpcvsnK3BLvfsX7OGpuxeghp07eycnlO8nyZe48egdXpxfZ3N8O64LUTEbSetW48DiYws6i96qzBoloM1udauhWzl1HhG7dkWNoW94zklhR3ygWVZ4VE65DmzGKInccOTzk+37qCMu54/OfeJLRRJHvOOxE2D2TozPB9XxR4a+pp2W6kLs45xuQroJybFHOdNBnOu+1Gz59AqwRpcmGKQ++YPjsc0KGMB5ZnDNs7idsTzIQxXhsSRH+29cUV3b69PopgrmOBo7MkJe6DGkp98GVHY/SGEttPFKhVEphS+5Zvpe56VGubl1iOsqZz49S7Aqbe+uUW4aXLr6imcboelPXYCydYkVmFKUaLpN08rzZ5mXbZgn7kpLhoffHClHxiWmXScR6iMHnRJXAbH6jor0CKmpiOSf0h4a3/fBxLttzLJ9IWNwYcOn8mCy1XPrzLYxe8Gy7I4IzdU89OkFNY9UPIhVXprCTkCRZ54R1FbSk02tpJ0MdlYUrO5Y33uyY5NI+vw2LJ5xjZ+T4V58ylMmQxCQQNs7VBqMiglFMdW0XVXkqRTI81j55tE7YG0v9c4dxI86vPcP6xrP00jnms0PsT3epKstossOXnvsoXz7/OSQ1YYSEaI1im4+oGcqtmsFlFOo6smQzqcTMyK3ujMm6tiw8oDUvqpMgxdSG+MVVRxEpmqtVClsqDt0mfH3vBa5cslxen7L6auH0XMLFD21izAImS8E4nPF5oLMEiQzBWd9s9LsOA7Vy7Jrhh/hkd9bpzmCgzYQfhqxvePRqwgPnIBNhMhGmE0s+sYzGFYk4Pvi4Ymvco5eazv7LZk1eA3iGIbNoUXmzzsfluHLUegBX5y/hK3gej6MYXAKPrX2R0WTMZDJimk+Y5mOKouChaw+yywiD7mzQE2cjRD86JJ1FoNKZjuwobEnb3iGSlq8XeCHNcopGA3xGtUG6KVJQbbjuci/V6tR33HSTlPu8YWdnzGBbI1MwQ8PFZ8Y8/ZVdTH+JpJehRCGpf20q1bA9vbG7hpAsKJhUyESadYFKHdzbIpGagTSwfVjfo03YUmv44NOaFx2qmOaQmHom2bFWKD78bIru+U1vBHKWiyZE40pEYhXtJo/w1u+qCSoxdSYfDMzzDDwnyfpwR+KxlrnjOAu7k11yO0GhsVXB/PAwhSq7Asw10u4kAs7lOv1q1fT6REmk0NxFdVVMu410fpMWcwlKi/G6HVSEyaiOpHq9YKKp26OeiIppgfXNcw60Y+vZKWpemDveY3ou59KXxqjCbyzT9WrcxCHOq0uJtFi2LyMFrAIjSG6RwqO4dS+sjtXqgLeVKJ9pL7BgSHoJD61nPL1ectOCZTL1PJOlvvDpc5q1UcZwPqyE0bF3iQaQr7dIrLMKSBCXo9wAXDEzURFOu7PhhCfNVt1EMqR0zaRBvR0F5bVgVMysk7YVrGrlzNn2TqeveHCDm5oRkFIzAEqr3hD1H+LpABXnKTEVczahagy628hqm1sOwSIu5crn9lDZCCkUJpsnGfS8ilWwZjHOV0dOUOLxF0JV1Lp+hZv6hLemTmjtx3DFOe8JhOvM/EFpvStOEn/hU22YWMOnzxt+4G7HtPCM/kILn7qYotLMk80Lhza+AspSTZroZobc6+x1TUZ03f01SGVR5R4kiyFXYaY4CNp5oa3rlyc4vnblL0iUwQuXKSyOUofB/abtomMC7cElInJAYigSUpgZ1teqo/OrmklY7zuTTnUxuzugUfyeAe2iHTvMcGU63b/QXXaNYpzGpClqfgGxFr1gAsytw0Y2r09XpSBVrXIgKBNUsmIdWqVwYwtOo1NN5YR8JAyGfkFnfSOJtrWqIBy4tDjEaNjcnvjHikZnCV++mvLmm8rQo4Izm5qnd3ooo7n5xhVuOtpjP4elYcLZKzkXr+ySJP4AVZUlnzhI0rAQIeJgiIIygdE65ugh0sR/VlX3kpx08gwRTWJ6oCyXJhc96UrpoDiQ0TeLIeGOh+pVJLvS3QAstcysOgj9x1KJ8JfQZ6IfJgcEfiMD6mj0qllwSg6ICh3YYFovtyBavaI8/N/rpQx7mmw4wOoE47yWy6VrE2wxQVkveqiT4Oec+AsWqRnL2JJIRl45VhYH/OP33cD/9UeX2d7NGQySaCm4F3fUCiYTxy/84JAXnc741p8rmOQV2mhSMWxOM57eyrlnuaSq4KvrCdamLM0n/JPvGzKdjnnsYsUrb+9T2QH/66/t+YWgVlhZ7PMj7z2J2DFlBcO+8opSKKqqBCmpZMB//phlZ6IwupZxjTjReFa/2AoxBcdWFmFxDlvlKAx5bplWFWV4vNYmmo1WDWNAOt3GdgxWuqoyHdhfzQxeXw9Ng7BroLPCROSAKGAHT6i1TlRH8D5aH9zmOK2rk47er4hmnFfsjh0/favwosWKicByT3NVr/IPPnQNazRqmOEqoSHQiWqakG5Uoq4JlpTFuT4/9/3LlNOr/KN3HeGf/c4ak7ygl5mwug/GuSUxGlcKz1wYc+aFdTa3LKaX4Cz0Ew064cG1hDvmcwqneWy7ByZlaU7x+Uc3+fU/vAQZUAg/9o4bWFlM2NgVJhPLW1+pke0zfPyBaxw6vMSjX98JGv4VSZJgrOWvvXGZV99+kg9/CdK5QJ2qvUxDwlbY0XneeO+3ccfCvexNt8nUgL1yi/9+9s+oHCQmxdSKDRLjLboJ/yiNc7ZNLYLWz+x5l+uYRbwyZ5auq5GuMtGsYnhnmkC1FMRYIy0efhKZGdWVri/yi0UNqUnQJuF3v7LG8s4L3Fe+wNHt5/lW9RT/+I034S6W6NJBJT48WaAS/28BuTjFjmBpaZ5/+D3z7G5e457jBjve4GfftcJcP2OSW6wICwPFX33tAm977RKvePES99+SMcr7nDzc5zX3HeUVt89TlX4j3DO7CZMKtnPF5UmKSRRlWXmZjoUlhsuH0EteRszr4vrKzRYjHn9hwqPPa152ep4X3X6ce+44yb13nmR5aYmvX0o4c7HE7p0FV4Qkt2rLalehlaHYOcsrT76Ul2dvIL9g6G0cQl0d8vmvf5ZSHFnaR5skUnaKZ6gjHxLkKZoJyKabLR1kOgYAiOaxO/sKoqijpQF64nV98pdvZ2s8kYpcV6wZ092U1haZQfKjwd8UqXKcL4b8/BPzjEpDqRNeuDriHYfW+PHX3Uz5/D5G+XxGKvHVAiCbU2Sz4ugNq/zYtxpUsc2ymfCfP3iO1SyH6RY/870LHDs0pMgtRxYt33jLiFfdsMnb7tlnwW7QVzn33wzvfdU+JxZznFNkiWLP9lmfGp4fGUqXYOqNb5XDaYMxGYKimBRIWDYOfs3fwjBlNDY8+vV1Xnu65Pblfb75DsXLT2kUKcN+j6qYQrHlcSBnfSntKrQ25PsXObl6nDcc/iusb+xgk4LEJHxu98NccufomcFM5RK3cmIFhnAfdKs73FVNkA514UBC7CKMbWayQM+kHM1NlxjtikSEveUGZX85sEWyszi7CyDJgX3LThS9nuahzR7/6omUPg6dJFw4d5kfO73DO15+mvL5PW80pfNGUwis56B7fMNdhunuFvcfzTkydDy+sUzPTXjp4TGTrTXeeKdF6YyqUuxtTTh7ueDKRs76VsnNhwyXtiZ84LNXOLyUYkvt6Y465emdlK/vZpCkHhYXL5OamASttW9xFDYaFhPK0lLkghkMefyyoSpK8vGU6WTMZ5+p0GlGPsnBDKHYRor9wOu1aJ2SjzY4POzz3be9h531HNElAz3HV3c+w9P542TZShvS1axiuYSf6QNChirixxDt8W7uheqW9p0udmd0SJpcsMuZEDrzRqozh6sOtCIOKLbO6pHE8p4z1ZYfyUjoDRI+ebXvjUY5SAyXnjvLz7+04jvvPUl1bt/HbDRsl0iekM33+cAn1+mrnEeen9DXiv/6Nx3zqePJizmpm/I7H1tj2K94bq3ikSsJt51Y5tYbFnhyY4GPPrDGK0/lPHJB8e5XlPzVNx7BJClaw1O7KZenPbLUtwEUEspqxWRaUZWawkaYtvIldV6CLYSz647Hzxf8P5/c4mtnpjy7DtYZcgup9iuJ7fSaT1yVJh+ts9wT3nnf32C6obAqZ94s8OjuF3lw7zOk2WLg7nYhDVFRK6m76Txa1yed/UcHQVc5QIEmXmwx04MKfBg68u+qs30k7iEpZl+1q9Hfqk6pg5yuGUpPV1fPpIqnNjWXp45vPGIh0eyurfFdLz3KRXeYp85cJlnqIRsVJhmQpCnWCa+5xfLHDwv7o4Jf+eg2YlJ+8wuW21ccX7iQkmZ9rLV8zytTXnfTNqfmxlzYtDx4qc9dxwzHVgZMxyXL/SnPXxP2cs2ElFz1yBK/IbaXVLzmtoQ8XeHQvHBkOeXeo5bHLmtKpyktZLrk/lsy5peH3H1yHpOk3HJiHp0Y7jy1wsnjPe6+MeXBZ3OuTQconWN0n2Kyw0pP+L6X/E2q9T55NWE+W+Sr25/ii9ufJO0tYpK0XXoed+SbsbK2n9W59tdBeq9XKzfksgOpiBx4vDeYiJp5UIK1C+B1FUGub0TMGluU+XY5F60HExTGKJ7Z0jyz63jDYUu/p9lau8rb7jvMZnaUxx69QpYOSXo9tNIUGF5/c8lb7k25ti98+KEB33BPwlvvS5kWjs+fH5IkKT3juG9lh82x4dIOnLlUcnwpRUzC3m6OFcN0knN1D66O+yRGdSTZKzG8875dvuuufRbnE973kj2mec5fPNtDlOHIoubtr1ni1uM97jou3HODYr4naCpuOpRy/ym486gl1Y754ZDzexl5oSknmxxbnOd77vkbFOsZpSvo6YwvrH+Yr+18jqS/TGJS0CaESx2qnS51o51HinY0BoK9zFS4B9flSOdQH1g5MrOjomkNiJJoACvyHvGMSlgz04WPHbMsmNiPuIg8pWYULT3Wr8NGWIUFsoHwxU3FTz6Y87MvyrlrRXP5ycf432+/neOr9/Mf/uJ5ssrRG2SowrG5J7z86IhMDzAL86Rul9PDggtrPXSSILZkZz/nlz9Z8Za7LV+7IFxeT4B9UD3QmvvvmLA4P+D5/RWOrKY02vVKY61XhXr/n+2RqSnKVPx6ZdnYB6ctpAnTyYiHHjnP05mhEl8JOtGU1gN0X6Fsdi1ZMqaTw1S25K5b7+aNR76d0RWFUQ6xBR9f+2+cy58jG6yitNfobQwkkr3tIMpuVtg/BlZrgqK6jn5Mt8lY69o0iyNUvN86mFbv0K3SYdUF1SciBYJGUFPrGZwmFkFud1W3QN5MjJwFg6S7c1CcDQqWFWVeMSDnJ+7K+c6bHNOJZfHIUb4091L+7ec3uXR1i7lM4fIdjBQ4UeR6ATvd99RJC2ruEMsLPQ4vZxyaVxyadxxbTrjpSJ+jC4qVOWGYgVIVJjUsDQ2pdmFXga8yrFVUVphUmq19xe5eznY+YD+H7ZHi6g6cu7LDUxdHbFzbh7H1yCwlUHmpM6N9/hUUJdTSgNfd/lLu693P/prQNwmX97/O59Y+zB77pNlKxB7UET+JaK1Ne7drqdzu/VHXud6Rkqh0JVjVDGG/29ppR1ZU79Bts7SWJvTpmmEnsyogqrNdPV4b09X7VR1QSHWAvrZzLKHqqlfpOWdRrqKsKiQveMORgh+5s+J4WjHoD9g++Up+9Sn46OPXkHwfUSkoww1H5jh9rMethxz33JRx82rJoWFFZgRblljr2NidsLlbsbNfsj2y7I5hWikmhWOcW0rbAFQoJWSpYdAzDHua+Z4PNfMDw+q8YWU+Y2EuY9BPmF8YMqkSru6nnF0XHnsh56kr8OylfXZ2J6TKMbUlq4tDvuH0N3K8uoX9zRIrUx699lmeHD0ESZ8snfcEb22It9x1Vb26oCkz9NrrLDrqqEgF3ZII9uje41gqpGtYoPqHbm8YIwfkVNXBJUst7U9aji8z696EDnO/0/GGGQRRNShnvZNH6v2LrvY2lnlT8s6TBW+9IedYBtmNp/l4fhO/+uV9XnRjwbvvTzg0V5GoksvXxpxfL3juasXz65ZLW8K1sWKUK8SGwSZa6dQmB9Mz3dtWmjL0e2Jk0+u9mFRY7DmOLgg3rRpuOWK460TGyaMZc/PzaN3nwbMl//HPN1ldvptXHXo1XOszykdc2H+aRze/zL7sYrIlr16lTZPgSnN91Yzm3EzLRlyYoojvW9RcFLlOVzomx8tBg4n6iPW0hziH6h26PdqtpzrAXquuOYPNRNN1qNkF5gf7Sx1lqkgMOlYQaOkHrhmwovY2WIrKQVFxtFfwPacqvvnQlJtXMtaX7+IPzjvG1TWeeGGf5y6XVMyBNWASSDQYhUn87kgdPKGm3YArnfd7/W0LcV7vnJ+x8ktC/QJPW1ZB/zWw5zIYml3uv8WwtHILRr6Bw9UpdrdHXNg/w9M7D7FRXIV0SJYOQ+gx3WqoE+q7+WU3REnkFa7TBZrZF9A9vO4gohuTrWZW6ISQJAez5E75pjrjCyqOb7NTBddZaTH7z/iDuZBgqlmpiljuLDDUwO9QpKg41Cv5htWc7zhecOvheR6rbuAzu0O+ejVnbS/32151W4EdlA2elVm7fti9biEaWGh05s79e6yco6ymZP2Mk6unODm4jaPqJvK9Kc9uP8z5yTPsVNuQ9EiTIdoEQ1E1pSG6kqqrohGnJ+p681a1InvT04s5Vm4GvG8XhjFLZK/5TdKOzdTri7zBRIYQ5yWzLxDTDg8qz7RLtzpzSLONhmYLrUQjIC1zrJW1l05S3KCQXuyW3AZFZyrunS+5tTdldXWZYuUEz+c91vaErb2xN7B6tGSGvtHkaB2SeCstrzpTfxGDLtKz9ctJ/SnNEsPK3Dwnl27kiD5EOh1ycfM8z+88zabdoKIA0w+GYqLd3rX0fm0cOtKZVF0Gocxq8HTzE0HNtn9m2AfxcJ+97kgsByTMWoWrJultsg51UIZGzVAe68dp1e01Odd9jk6+o2aVZrqTkDFDL3QfWhOVqAKI4GuFUDpLUdX7Zfzs8tygz7DfRyd9StXDuQqxRUeaTWuFUXT2UR48IDOTEjOD6koUxhjme32W+nMMyXClY7Q3ZW1vje1iHZt4jkyqMs9x0Z7uUcvONxKtnVB/kBfdKYmbUKM6nB+lTdDsnV1+Ho0Pi3Tui0QqhkpmZstmYPzWw8QEKq3+ksYj0dC3V7OspoUvGcOV7Q17bQ6p1f8/QnpzHqxz5JOyw9DO+qlnw0WYwnQy6awBbrimoqhXejY/d87nEibkMUoxNzeknxnvERxMi4qqshhjuhwRkWjxhv8cifagojYmGLN/XE8bkkDWKoqCvfEepS08e72qwPSDmKKagdLbMlkrjTaaxCQkpl1HIxriFfFdGKLLfvWj7BpbWYoiD6RzodfroY3uSIq0dIo47MoBdgIH6NFBzyY2mJqid71w1Fiq9hs5jh9f4I7bj4dtZX4v80OPnqXINSbprve7rvyZUljnmBv0ecl9NyDKQ0tGa544c4HNawXGtOMqd9xzF4PhfAMw1biDc22I0Er7WexoTrg+QU888giT0Q5ZluGc8OJbVrjphkM46zBakSQq7FXw2z+cE0qrGBVwdXPKlY0RO7t7pFpIE03lLFVVYa1twEmjDYhiIetzz533oE3iNf2a7r3nJDupF0g4qqpgXE64trXBxuYWCk2SJtefi56dgoooJ1VVsnLoGKdvuYXJNCdNDM8/+wyj/T0/h0VL5lZqRuk7SnZmZ6riWl4kkMDjmaODe6m7PQaloJg67nup46//+ITdrRKdCKtLS3z0Q0f5L792CZP0iZf3duQ9G1UBr4D5ve87zjd/V8F0WiEizM/3+NVfqrj8UcfcnEGsYNKEI9/9I5ilY2hboo3BGI2JBuRMJy9qG55KKVJjeP7cz5CPtkmMZmvq+Ltv2ufdr9xjewS9vu9AK62afQT15y9dwm455IXt43zuhbv5vU9e5NkXLpNoEzA507yW1oZRPua2w7fxQ2/8Cfb2cxKt/SREWIqF9iR2H1k9012MMKp2OL93hj//yid54eJlkiRpQ3l8g6N+XbtlxuJUyovf8kMkCydJdkf055c5Zv6AM1/6ELo/5+VVVCDEyV9Gmop0gkQ6lIX64P3/AGdMT8+kOtOmAAAAAElFTkSuQmCC" alt="Medra" style={{ height: 30, width: "auto", flexShrink: 0 }} />
      <div><div className="brand-word">medra</div><div className="brand-tag">Shop Better. Live Better.</div></div>
    </div>
  );
}

function Stars({ value, size = 12 }) {
  return <span className="stars-row">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={size} fill={i < Math.round(value) ? "#F59E0B" : "none"} color="#F59E0B" />)}</span>;
}

function NotFoundScreen() {
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ textAlign: "center", padding: 40 }}>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 6 }}>This screen isn't available</div>
        <div className="muted small">Use the sidebar to get back to a screen that exists.</div>
      </div>
    </div>
  );
}

function EmptyNote({ children }) {
  return <div className="empty-note"><Inbox size={20} style={{ opacity: 0.4, marginBottom: 6 }} /><div>{children}</div></div>;
}

// Canonical order statuses -- one vocabulary across every app. Legacy/alias
// labels are normalised so StatusPill always shows one of these five.
const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
const ORDER_STATUS_ALIASES = { placed: "Placed", "order placed": "Placed", pending: "Placed", confirmed: "Placed", processing: "Preparing", preparing: "Preparing", scheduled: "Placed", onway: "Out for Delivery", "en route": "Out for Delivery", "out for delivery": "Out for Delivery", delivered: "Delivered", "delivered (simulated)": "Delivered", completed: "Delivered", cancelled: "Cancelled", canceled: "Cancelled" };
const normalizeOrderStatus = (s) => ORDER_STATUS_ALIASES[String(s || "").toLowerCase()] || s;
function StatusPill({ status }) {
  const label = normalizeOrderStatus(status);
  const map = { Delivered: "done", "Out for Delivery": "route", Preparing: "prep", Placed: "prep", Cancelled: "delay" };
  return <span className={`status-pill ${map[label] || ""}`}>{label}</span>;
}

function PointsBadge({ points }) {
  return <span className="points-badge"><Award size={12} /> {points.toLocaleString()} pts</span>;
}

function ProductCard({ p, onOpen, wished, onToggleWish, compared, onToggleCompare }) {
  const sellers = getSellersForProduct(p);
  const cheapest = sellers[0];
  return (
    <div className={`prod-card enter ${compared ? "in-compare" : ""}`} onClick={() => onOpen(p)}>
      <div className="prod-img-wrap">
        <img src={img(p.seed)} alt={p.name} />
        {p.badge && <span className="badge">{p.badge}</span>}
        <button className={`wish-btn ${wished ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); onToggleWish(p.id); }}>
          <Heart size={14} fill={wished ? "#DC2626" : "none"} color={wished ? "#DC2626" : "#0F172A"} />
        </button>
        {onToggleCompare && (
          <button className={`compare-chk ${compared ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); onToggleCompare(p.id); }}>
            {compared ? <Check size={12} /> : <SlidersHorizontal size={12} />}
          </button>
        )}
      </div>
      <div className="prod-name">{p.name}</div>
      <div className="muted small" style={{ padding: "0 10px" }}>{sellers.length} sellers nearby -- from {naira(cheapest.customerPrice)}</div>
      <div className="prod-price-row">
        <span className="mono prod-price">{naira(cheapest.customerPrice)}</span>
        {p.was && <span className="prod-was">{naira(withMarkup(p.was))}</span>}
        <button className="prod-add" onClick={(e) => { e.stopPropagation(); onOpen(p); }}><Plus size={14} /></button>
      </div>
    </div>
  );
}

function CompareBar({ compareList, onOpen, onClear }) {
  if (compareList.length < 2) return null;
  return (
    <div className="compare-bar">
      <SlidersHorizontal size={14} /> {compareList.length} selected to compare
      <button className="primary-btn-sm" style={{ marginLeft: "auto" }} onClick={onOpen}>Compare</button>
      <button className="ghost-btn-sm light" onClick={onClear}>Clear</button>
    </div>
  );
}

function CompareModal({ products, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" style={{ width: 560, maxWidth: "94vw" }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 14 }}>Comparing {products.length} products</div>
        <div className="compare-grid">
          {products.map((p) => {
            const sellers = getSellersForProduct(p);
            return (
              <div key={p.id} className="compare-col">
                <img src={img(p.seed, 140)} alt={p.name} />
                <div className="card-name" style={{ fontSize: 12.5, margin: "8px 0 4px" }}>{p.name}</div>
                <div className="compare-row"><span className="muted small">Price</span><span className="mono">{naira(sellers[0].customerPrice)}</span></div>
                <div className="compare-row"><span className="muted small">Rating</span><span>{p.rating} <Star size={10} fill="#F59E0B" color="#F59E0B" style={{ verticalAlign: "middle" }} /></span></div>
                <div className="compare-row"><span className="muted small">Sellers</span><span>{sellers.length} nearby</span></div>
                <div className="compare-row"><span className="muted small">Fastest ETA</span><span>~{Math.min(...sellers.map((s) => s.etaMin))} min</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 8 }) {
  return <div className="prod-grid">{Array.from({ length: count }).map((_, i) => <div key={i} className="prod-skel" />)}</div>;
}

function EmptyState({ icon: Icon, title, sub, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon size={22} /></div>
      <div className="card-name" style={{ marginTop: 10 }}>{title}</div>
      {sub && <div className="muted" style={{ marginTop: 4, maxWidth: 280 }}>{sub}</div>}
      {actionLabel && <button className="ghost-btn-sm" style={{ marginTop: 12 }} onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function UndoToast({ message, onUndo, onExpire, ms = 5000 }) {
  useEffect(() => { const t = setTimeout(onExpire, ms); return () => clearTimeout(t); }, []);
  return (
    <div className="undo-toast">
      <span>{message}</span>
      <button className="link-btn" style={{ color: "#fff" }} onClick={onUndo}>Undo</button>
    </div>
  );
}

/* ============================================================
   SCREENS
   ============================================================ */

function GiftGuideScreen({ onOpenProduct, wishlist, toggleWishlist }) {
  const guide = getSeasonalGuide();
  const items = guide.ids.map((id) => productById(id)).filter(Boolean);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">{guide.title}</div>
        <div className="muted small" style={{ marginBottom: 14 }}>{guide.blurb}</div>
        <div className="prod-grid">
          {items.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpenProduct} wished={wishlist.has(p.id)} onToggleWish={toggleWishlist} />)}
        </div>
      </div>
    </div>
  );
}

const CARE_PACKAGE_THEMES = [
  { key: "coffee", label: "Coffee Lover", desc: "For the person who needs their coffee fix.", ids: ["p5", "p8"] },
  { key: "cozy", label: "Cozy Home", desc: "A calmer, better-stocked home.", ids: ["p4", "p14", "p8"] },
  { key: "tech", label: "Tech Gift", desc: "For the gadget person.", ids: ["p1", "p2", "p13"] },
  { key: "selfcare", label: "Self Care", desc: "A little pampering.", ids: ["p12", "p14"] },
];
const MEAL_PLANNER_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_PLANNER_SLOTS = ["Breakfast", "Lunch", "Dinner"];
function MealPlannerScreen({ onAddAll }) {
  const [day, setDay] = useState(MEAL_PLANNER_DAYS[0]);
  // plan: { "Mon-Breakfast": [productId, ...], ... }
  const [plan, setPlan] = useState({});
  const [queryBySlot, setQueryBySlot] = useState({});
  const addToSlot = (slotKey, productId) => setPlan((p) => ({ ...p, [slotKey]: [...(p[slotKey] || []), productId] }));
  const removeFromSlot = (slotKey, productId) => setPlan((p) => ({ ...p, [slotKey]: (p[slotKey] || []).filter((id) => id !== productId) }));
  const allPlannedIds = Object.values(plan).flat();
  const plannedItems = allPlannedIds.map((id) => productById(id)).filter(Boolean);
  const total = plannedItems.reduce((s, p) => s + p.price, 0);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Meal Planner</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Plan what you'll eat this week and turn it straight into a grocery run -- add ingredients or ready-made meals to any slot, then add everything planned to your cart at once.</div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {MEAL_PLANNER_DAYS.map((d) => <button key={d} className={`chip ${day === d ? "active" : ""}`} onClick={() => setDay(d)}>{d}</button>)}
        </div>
        {MEAL_PLANNER_SLOTS.map((slot) => {
          const slotKey = `${day}-${slot}`;
          const items = (plan[slotKey] || []).map((id) => productById(id)).filter(Boolean);
          const query = queryBySlot[slotKey] || "";
          const results = query.trim() ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) : [];
          return (
            <div key={slot} style={{ marginBottom: 18 }}>
              <div className="muted small" style={{ fontWeight: 700, marginBottom: 6 }}>{slot}</div>
              {items.length > 0 && (
                <div className="list-col" style={{ marginBottom: 8 }}>
                  {items.map((p) => (
                    <div key={p.id} className="pending-row">
                      <img src={img(p.seed, 60)} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                      <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>{p.name}</div></div>
                      <div className="mono">{naira(p.price)}</div>
                      <button className="ghost-btn-sm" onClick={() => removeFromSlot(slotKey, p.id)}><X size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
              <input placeholder={`Add a food or ingredient to ${slot.toLowerCase()}...`} value={query} onChange={(e) => setQueryBySlot((q) => ({ ...q, [slotKey]: e.target.value }))} />
              {results.length > 0 && (
                <div className="list-col" style={{ marginTop: 6 }}>
                  {results.map((p) => (
                    <button key={p.id} className="pending-row" style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }} onClick={() => { addToSlot(slotKey, p.id); setQueryBySlot((q) => ({ ...q, [slotKey]: "" })); }}>
                      <img src={img(p.seed, 60)} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
                      <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>{p.name}</div></div>
                      <div className="mono">{naira(p.price)}</div>
                      <Plus size={13} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">This week's grocery list</div><span className="muted small">{plannedItems.length} item{plannedItems.length !== 1 ? "s" : ""}</span></div>
        {plannedItems.length === 0 ? <EmptyNote>Nothing planned yet -- add items to any day above.</EmptyNote> : (
          <button className="primary-btn-sm wide" onClick={() => onAddAll(plannedItems)}>Add all planned items to cart -- {naira(total)}</button>
        )}
      </div>
    </div>
  );
}

function CarePackageScreen({ onAddAll }) {
  const [themeKey, setThemeKey] = useState(CARE_PACKAGE_THEMES[0].key);
  const [selectedIds, setSelectedIds] = useState(new Set(CARE_PACKAGE_THEMES[0].ids));
  // Extra items added from outside the theme -- kept as its own set so
  // switching themes (which resets selectedIds to that theme's picks)
  // never wipes out things the customer deliberately added themselves.
  const [extraIds, setExtraIds] = useState(new Set());
  const [browseQuery, setBrowseQuery] = useState("");
  const theme = CARE_PACKAGE_THEMES.find((t) => t.key === themeKey);
  const chooseTheme = (key) => {
    setThemeKey(key);
    setSelectedIds(new Set(CARE_PACKAGE_THEMES.find((t) => t.key === key).ids));
  };
  const toggleItem = (id) => setSelectedIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleExtra = (id) => setExtraIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const items = theme.ids.map((id) => productById(id)).filter(Boolean);
  const themeSelected = items.filter((p) => selectedIds.has(p.id));
  const extraItems = [...extraIds].map((id) => productById(id)).filter(Boolean);
  const selectedItems = [...themeSelected, ...extraItems];
  const total = selectedItems.reduce((s, p) => s + p.price, 0);
  const browseResults = browseQuery.trim()
    ? PRODUCTS.filter((p) => !theme.ids.includes(p.id) && p.name.toLowerCase().includes(browseQuery.trim().toLowerCase())).slice(0, 8)
    : [];
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Build a Care Package</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Pick a theme, review the items, then add them all to your cart together -- good for gifting (use "Deliver to someone else" at checkout). You can also add anything else from the store below.</div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {CARE_PACKAGE_THEMES.map((t) => (
            <button key={t.key} className={`chip ${themeKey === t.key ? "active" : ""}`} onClick={() => chooseTheme(t.key)}>{t.label}</button>
          ))}
        </div>
        <div className="muted small" style={{ marginBottom: 10 }}>{theme.desc}</div>
        <div className="list-col" style={{ marginBottom: 14 }}>
          {items.map((p) => (
            <label key={p.id} className="pending-row" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleItem(p.id)} style={{ marginRight: 4 }} />
              <img src={img(p.seed, 60)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
              <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>{p.name}</div></div>
              <div className="mono">{naira(p.price)}</div>
            </label>
          ))}
        </div>

        <div className="panel-title" style={{ fontSize: 13, marginBottom: 8 }}>Add other items</div>
        <div className="field" style={{ marginBottom: 10 }}>
          <input placeholder="Search the store to add anything else..." value={browseQuery} onChange={(e) => setBrowseQuery(e.target.value)} />
        </div>
        {browseResults.length > 0 && (
          <div className="list-col" style={{ marginBottom: 10 }}>
            {browseResults.map((p) => (
              <label key={p.id} className="pending-row" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={extraIds.has(p.id)} onChange={() => toggleExtra(p.id)} style={{ marginRight: 4 }} />
                <img src={img(p.seed, 60)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>{p.name}</div></div>
                <div className="mono">{naira(p.price)}</div>
              </label>
            ))}
          </div>
        )}
        {extraItems.length > 0 && (
          <div className="list-col" style={{ marginBottom: 14 }}>
            <div className="muted small" style={{ fontWeight: 700 }}>Added from elsewhere in the store</div>
            {extraItems.map((p) => (
              <div key={p.id} className="pending-row">
                <img src={img(p.seed, 60)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>{p.name}</div></div>
                <div className="mono">{naira(p.price)}</div>
                <button className="ghost-btn-sm" onClick={() => toggleExtra(p.id)}><Minus size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <button className="primary-btn-sm wide" disabled={selectedItems.length === 0} onClick={() => onAddAll(selectedItems)}>
          Add {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} to cart -- {naira(total)}
        </button>
      </div>
    </div>
  );
}


/* ===================== HEALTHCARE SCREENS ===================== */

function providerById(id) { return MOCK_PROVIDERS.find((p) => p.id === id); }

// Real cost calculation: monthly plan visits are guaranteed/covered first,
// a redeemed voucher zeroes the cost once, otherwise it's the
// severity-scaled fee for this provider type + consult method (see
// computeVisitFee). This is the one function that decides what a visit
// actually costs -- every booking path must go through it.
function getVisitCost(provider, telehealthPlan, voucherApplied, { consultType, symptomCount = 0, hasPictures = false } = {}) {
  if (voucherApplied) return { amount: 0, coveredBy: "voucher" };
  if (telehealthPlan && telehealthPlan.visitsUsed < telehealthPlan.visitsTotal) return { amount: 0, coveredBy: "plan" };
  const gravity = computeSymptomGravity(symptomCount);
  const amount = computeVisitFee({ providerType: provider.type, consultType, gravity, hasPictures });
  return { amount, coveredBy: "per_visit" };
}

function HealthcareHomeScreen({ onNavigate, appointments, telehealthPlan }) {
  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const actions = [
    { key: "health-provider-search", label: "Find a Provider", icon: Stethoscope, desc: "Browse doctors and pharmacists" },
    { key: "symptom-checker", label: "Check Symptoms", icon: HeartPulse, desc: "Get general guidance -- not a diagnosis" },
    { key: "health-appointments", label: "My Appointments", icon: CalendarClock, desc: `${upcoming.length} upcoming` },
    { key: "health-prescriptions", label: "Prescriptions", icon: Pill, desc: "View your prescriptions" },
    { key: "health-documents", label: "Health Records", icon: FileDown, desc: "Lab results, referrals, notes" },
    { key: "health-messages", label: "Messages", icon: MessageCircle, desc: "Message your providers" },
  ];
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#ECFDF5,#fff)", border: "1px solid #A7F3D0" }}>
        <div className="panel-title">Healthcare</div>
        <div className="muted small" style={{ marginBottom: 10 }}>General guidance and provider consultations -- this is not a substitute for professional medical evaluation or an emergency service.</div>
        {telehealthPlan && <div className="muted small" style={{ marginBottom: 8 }}><ShieldCheck size={11} style={{ verticalAlign: "middle" }} /> {TELEHEALTH_PRICING.monthly[telehealthPlan.tier].label}: {telehealthPlan.visitsTotal - telehealthPlan.visitsUsed} of {telehealthPlan.visitsTotal} visits left this month.</div>}
      </div>
      <div className="prod-grid">
        {actions.map((a) => (
          <button key={a.key} className="prod-card enter" style={{ textAlign: "left", padding: 16, background: "#fff" }} onClick={() => onNavigate(a.key)}>
            <a.icon size={22} color="var(--purple)" />
            <div className="card-name" style={{ marginTop: 8, fontSize: 13 }}>{a.label}</div>
            <div className="muted small">{a.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Small rule-based red-flag layer for the free-text field -- catches
// obvious emergency phrases even if the person didn't separately tick a
// box in EMERGENCY_SYMPTOMS. Not sophisticated NLP, just keyword matching,
// but it closes the real gap where someone types "crushing chest pain and
// sweating" without selecting anything from the checklist above it.
const EMERGENCY_TEXT_KEYWORDS = [
  "chest pain", "can't breathe", "cant breathe", "difficulty breathing", "trouble breathing",
  "unconscious", "unresponsive", "seizure", "stroke", "severe bleeding", "won't stop bleeding",
  "overdose", "poisoning", "poisoned", "suicidal", "kill myself", "want to die",
  "severe allergic reaction", "throat closing", "face drooping", "can't speak", "cant speak",
];
function textHasEmergencyKeyword(text) {
  const lower = text.toLowerCase();
  return EMERGENCY_TEXT_KEYWORDS.some((k) => lower.includes(k));
}

function SymptomCheckerScreen({ onEmergency, onNonEmergency, onLogCheck, history }) {
  const [selected, setSelected] = useState(new Set());
  const [emergencySelected, setEmergencySelected] = useState(new Set());
  const [freeText, setFreeText] = useState("");
  const [step, setStep] = useState("select"); // select | result
  const toggle = (set, setSet, item) => setSet((s) => { const n = new Set(s); n.has(item) ? n.delete(item) : n.add(item); return n; });
  const submit = () => {
    setStep("result");
    if (onLogCheck) onLogCheck({ id: `SC${Date.now()}`, symptoms: [...selected], date: new Date().toLocaleDateString() });
  };
  // BUG FIX (safety): this used to only check emergencySelected, so typing
  // an obvious red-flag phrase into the free-text box without also ticking
  // a checklist item would silently route to the normal, non-emergency
  // provider flow. Free text is now scanned too.
  const isEmergency = emergencySelected.size > 0 || textHasEmergencyKeyword(freeText);
  if (step === "result") {
    return isEmergency
      ? <EmergencyResultPanel symptoms={emergencySelected.size > 0 ? [...emergencySelected] : ["something you described"]} onFindEmergencyCare={onEmergency} onBack={() => setStep("select")} />
      : <NonEmergencyResultPanel symptoms={[...selected]} freeText={freeText} onFindProvider={onNonEmergency} onBack={() => setStep("select")} />;
  }
  return (
    <div className="section-pad">
      {history && history.length > 0 && (
        <div className="panel enter">
          <div className="panel-title" style={{ fontSize: 13 }}>Past symptom checks</div>
          <div className="list-col">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="pending-row"><div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>{h.symptoms.length > 0 ? h.symptoms.join(", ") : "Free-text description only"}</div></div><div className="muted small">{h.date}</div></div>
            ))}
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title">Symptom Checker</div>
        <div className="muted small" style={{ marginBottom: 12 }}>This gives general guidance only -- it is not a diagnosis and does not replace a professional medical evaluation.</div>
        <div className="muted small" style={{ fontWeight: 700, marginBottom: 6, color: "#DC2626" }}>Any of these right now? Select any that apply -- this alone routes you to emergency guidance.</div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {EMERGENCY_SYMPTOMS.map((s) => (
            <button key={s} className={`chip ${emergencySelected.has(s) ? "active" : ""}`} style={emergencySelected.has(s) ? { background: "#FEE2E2", borderColor: "#DC2626", color: "#991B1B" } : undefined} onClick={() => toggle(emergencySelected, setEmergencySelected, s)}>{s}</button>
          ))}
        </div>
        <div className="muted small" style={{ fontWeight: 700, marginBottom: 6 }}>General symptoms</div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {SYMPTOM_LIST.map((s) => (
            <button key={s} className={`chip ${selected.has(s) ? "active" : ""}`} onClick={() => toggle(selected, setSelected, s)}>{s}</button>
          ))}
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <span>Describe in your own words (optional)</span>
          <textarea rows={3} value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="Anything else worth mentioning..." style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical" }} />
          <div className="muted small" style={{ marginTop: 4, color: "#B45309" }}>If you're describing a severe or life-threatening symptom, call emergency services immediately rather than waiting on this checker.</div>
        </div>
        <button className="primary-btn-sm wide" disabled={selected.size === 0 && emergencySelected.size === 0 && !freeText.trim()} onClick={submit}>Continue</button>
      </div>
    </div>
  );
}

function EmergencyResultPanel({ symptoms, onFindEmergencyCare, onBack }) {
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FEE2E2,#fff)", border: "1px solid #FCA5A5" }}>
        <div className="panel-title" style={{ color: "#991B1B" }}><AlertTriangle size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />Your symptoms may require immediate medical attention.</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Based on: {symptoms.join(", ")}.</div>
        <p className="muted" style={{ marginBottom: 14 }}>Please seek emergency medical care or call your local emergency number if you are in immediate danger. This checker does not book a normal appointment for these symptoms -- it is not a substitute for emergency services.</p>
        <button className="primary-btn-sm wide" style={{ background: "#DC2626" }} onClick={onFindEmergencyCare}><PhoneCall size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />Find Emergency Care</button>
        <button className="ghost-btn-sm" style={{ marginTop: 8 }} onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

function NonEmergencyResultPanel({ symptoms, freeText, onFindProvider, onBack }) {
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Based on what you shared, you may want to speak with a healthcare provider</div>
        <div className="muted small" style={{ marginBottom: 10 }}>{symptoms.length > 0 ? `Symptoms noted: ${symptoms.join(", ")}.` : ""} {freeText ? `You also mentioned: "${freeText}"` : ""}</div>
        <p className="muted" style={{ marginBottom: 14 }}>This is general guidance only, not a diagnosis. A provider can give you a proper assessment.</p>
        <button className="primary-btn-sm wide" onClick={onFindProvider}>Find a Healthcare Provider</button>
        <button className="ghost-btn-sm" style={{ marginTop: 8 }} onClick={onBack}>Check different symptoms</button>
      </div>
    </div>
  );
}

function EmergencyCareScreen() {
  const nearby = [
    { name: "Lagos General Emergency Center", distance: "1.8 km", eta: "6 min", address: "24 Marina Road, Lagos Island, Lagos", phone: "+2348001234567" },
    { name: "St. Mary's Urgent Care", distance: "3.2 km", eta: "11 min", address: "17 Adeola Odeku St, Victoria Island, Lagos", phone: "+2348007654321" },
    { name: "City Central Emergency Room", distance: "4.5 km", eta: "14 min", address: "5 Awolowo Road, Ikoyi, Lagos", phone: "+2348009876543" },
  ];
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5" }}>
        <div className="panel-title" style={{ color: "#991B1B" }}>Emergency Care</div>
        <div className="muted small">If you are in immediate danger, call your local emergency number now. This list is a prototype simulation of nearby emergency facilities.</div>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Nearby Emergency Facilities</div>
        <div className="list-col">
          {nearby.map((n) => (
            <div key={n.name} className="pending-row">
              <div className="driver-avatar sm" style={{ background: "#DC2626" }}><PhoneCall size={14} /></div>
              <div className="ti-mid">
                <div className="card-name">{n.name}</div>
                <div className="muted small">{n.distance} away -- ~{n.eta} drive</div>
                <div className="muted small">{n.address}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {/* BUG FIX: these buttons used to do nothing on click.
                    Call opens the real phone dialer; Directions opens a real
                    Google Maps route (works with just the address string, no
                    API key needed for this kind of link). */}
                <a className="ghost-btn-sm" href={`tel:${n.phone}`}>Call</a>
                <a className="ghost-btn-sm" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(n.address)}`} target="_blank" rel="noopener noreferrer">Directions</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProviderMarketplaceScreen({ onOpenProvider }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [consultFilter, setConsultFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [sort, setSort] = useState("rating");
  const languages = [...new Set(MOCK_PROVIDERS.flatMap((p) => p.languages))];
  // Since fee now varies by consult type (chat/audio/video) instead of one
  // flat price per provider, "cheapest" compares each provider's lowest
  // available base fee (their chat rate, always the cheapest of the three).
  const cheapestFee = (p) => Math.min(...p.consultTypes.filter((c) => c !== "in_person").map((c) => TELEHEALTH_FEE_RANGES[p.type][c][0]));
  let list = MOCK_PROVIDERS.filter((p) =>
    (typeFilter === "all" || p.type === typeFilter) &&
    (consultFilter === "all" || p.consultTypes.includes(consultFilter)) &&
    (genderFilter === "all" || p.gender === genderFilter) &&
    (langFilter === "all" || p.languages.includes(langFilter)) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.location.toLowerCase().includes(query.toLowerCase()))
  );
  list = [...list].sort((a, b) => sort === "rating" ? b.rating - a.rating : sort === "price" ? cheapestFee(a) - cheapestFee(b) : b.experience - a.experience);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Find a Healthcare Provider</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Browse doctors and pharmacists -- no need to know a specialty, just tell us what you need.</div>
        <div className="field" style={{ marginBottom: 10 }}><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or location..." /></div>
        <div className="chip-row" style={{ marginBottom: 8 }}>
          {["all", "doctor", "pharmacist"].map((t) => <button key={t} className={`chip ${typeFilter === t ? "active" : ""}`} onClick={() => setTypeFilter(t)}>{t === "all" ? "All types" : t === "doctor" ? "Doctors" : "Pharmacists"}</button>)}
        </div>
        <div className="chip-row" style={{ marginBottom: 8 }}>
          {["all", "video", "audio", "chat", "in_person"].map((c) => <button key={c} className={`chip ${consultFilter === c ? "active" : ""}`} onClick={() => setConsultFilter(c)}>{c === "all" ? "Any consult type" : c === "in_person" ? "In-person" : c[0].toUpperCase() + c.slice(1)}</button>)}
        </div>
        <div className="chip-row" style={{ marginBottom: 8 }}>
          {["all", "male", "female"].map((g) => <button key={g} className={`chip ${genderFilter === g ? "active" : ""}`} onClick={() => setGenderFilter(g)}>{g === "all" ? "Any gender" : g[0].toUpperCase() + g.slice(1)}</button>)}
        </div>
        <div className="chip-row" style={{ marginBottom: 12 }}>
          <button className={`chip ${langFilter === "all" ? "active" : ""}`} onClick={() => setLangFilter("all")}>Any language</button>
          {languages.map((l) => <button key={l} className={`chip ${langFilter === l ? "active" : ""}`} onClick={() => setLangFilter(l)}>{l}</button>)}
        </div>
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ marginBottom: 14 }}>
          <option value="rating">Sort: Highest rated</option>
          <option value="price">Sort: Lowest price</option>
          <option value="experience">Sort: Most experienced</option>
        </select>
        <div className="list-col">
          {list.length === 0 && <EmptyNote>No providers match your filters.</EmptyNote>}
          {list.map((p) => (
            <button key={p.id} className="pending-row" style={{ width: "100%", textAlign: "left" }} onClick={() => onOpenProvider(p.id)}>
              <img src={img(p.seed, 60)} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
              <div className="ti-mid">
                <div className="card-name">{p.name}</div>
                <div className="muted small">{p.credentials} -- {p.experience} yrs -- <Stars value={p.rating} size={10} /> {p.rating} ({p.reviewCount}) -- {p.location}</div>
              </div>
              <div className="mono" style={{ fontWeight: 700 }}>From {naira(cheapestFee(p))}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


function ProviderProfileScreen({ providerId, onBack, onBookAppointment }) {
  const provider = providerById(providerId);
  if (!provider) return <div className="section-pad"><EmptyNote>Provider not found.</EmptyNote></div>;
  const availability = getProviderAvailability(provider.id);
  const CONSULT_LABEL = { video: "Video", audio: "Audio", chat: "Chat", in_person: "In-person" };
  return (
    <div className="section-pad">
      <button className="link-btn" style={{ marginBottom: 10 }} onClick={onBack}>&larr; Back to providers</button>
      <div className="panel enter">
        <div className="pending-row" style={{ marginBottom: 12 }}>
          <img src={img(provider.seed, 80)} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
          <div className="ti-mid">
            <div className="card-name" style={{ fontSize: 16 }}>{provider.name}</div>
            <div className="muted small">{provider.credentials} -- {provider.experience} years experience</div>
            <div className="muted small"><Stars value={provider.rating} size={11} /> {provider.rating} ({provider.reviewCount} reviews)</div>
          </div>
        </div>
        <p className="muted" style={{ marginBottom: 10 }}>{provider.bio}</p>
        <div className="list-col" style={{ marginBottom: 12 }}>
          <div className="muted small"><MapPin size={12} style={{ verticalAlign: "middle" }} /> {provider.location}</div>
          <div className="muted small">Languages: {provider.languages.join(", ")}</div>
          <div className="muted small">License/registration (mock): {provider.license}</div>
          <div className="muted small">Consultation types: {provider.consultTypes.map((c) => CONSULT_LABEL[c]).join(", ")}</div>
          <div className="muted small" style={{ fontWeight: 700 }}>Fees by consultation type:</div>
          {provider.consultTypes.filter((c) => c !== "in_person").map((c) => {
            const [base, cap] = TELEHEALTH_FEE_RANGES[provider.type][c];
            return <div key={c} className="muted small">-- {CONSULT_LABEL[c]}: {naira(base)}-{naira(cap)} (based on symptom severity{c === "chat" ? `, or a flat ${naira(CHAT_WITH_PICTURES_FLAT_FEE)} if sending pictures` : ""})</div>;
          })}
        </div>
        <button className="primary-btn-sm wide" onClick={() => onBookAppointment(provider.id)}>Book Appointment</button>
      </div>
    </div>
  );
}

function BookAppointmentScreen({ providerId, onBack, onConfirmed, telehealthPlan, onSubscribePlan, points, spendPoints, wallet, symptomCount }) {
  const provider = providerById(providerId);
  const [step, setStep] = useState("type"); // type -> date -> time -> review -> payment -> done
  const [consultType, setConsultType] = useState(provider?.consultTypes[0] || "video");
  const [hasPictures, setHasPictures] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const [time, setTime] = useState(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherError, setVoucherError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState("cash"); // "cash" (wallet) or "points"
  if (!provider) return <div className="section-pad"><EmptyNote>Provider not found.</EmptyNote></div>;
  const availability = getProviderAvailability(provider.id);
  const cost = getVisitCost(provider, telehealthPlan, voucherApplied, { consultType, symptomCount, hasPictures: consultType === "chat" && hasPictures });
  const gravity = computeSymptomGravity(symptomCount || 0);
  const applyVoucher = () => {
    // Mock voucher check -- Super Admin's Free Visit Approvals screen issues
    // real-looking codes shaped like MEDRA-FREE-XXXXXX; "ADMINFREE" is kept
    // too as a simple always-works demo code for quick testing. There's no
    // live cross-app database here, so this accepts the *shape* of a real
    // code rather than checking a specific issued code against a shared list.
    const code = voucherInput.trim().toUpperCase();
    if (code === "ADMINFREE" || /^MEDRA-FREE-[A-Z0-9]{4,8}$/.test(code)) { setVoucherApplied(true); setVoucherError(false); }
    else setVoucherError(true);
  };
  const confirmPay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setStep("done");
      onConfirmed({ providerId: provider.id, consultType, hasPictures: consultType === "chat" && hasPictures, date: availability[dayIdx]?.date, time, cost, payMethod });
    }, 900);
  };
  const canAffordPoints = cost.amount === 0 || points >= cost.amount;
  const canAffordCash = cost.amount === 0 || wallet >= cost.amount;
  const canConfirm = cost.amount === 0 || (payMethod === "points" ? canAffordPoints : canAffordCash);
  if (step === "done") {
    return (
      <div className="section-pad">
        <div className="panel enter" style={{ textAlign: "center", padding: 30 }}>
          <CircleCheck size={32} color="#16A34A" />
          <div className="card-name" style={{ margin: "10px 0 4px" }}>Appointment confirmed</div>
          <div className="muted small" style={{ marginBottom: 16 }}>With {provider.name} -- {availability[dayIdx]?.date.toLocaleDateString()} at {time}.</div>
          <button className="primary-btn-sm" onClick={onBack}>Go to My Appointments</button>
        </div>
      </div>
    );
  }
  return (
    <div className="section-pad">
      <button className="link-btn" style={{ marginBottom: 10 }} onClick={onBack}>&larr; Cancel booking</button>
      <div className="panel enter">
        <div className="panel-title">Book with {provider.name}</div>
        {step === "type" && (
          <>
            <div className="muted small" style={{ marginBottom: 8 }}>Choose consultation type</div>
            <div className="chip-row" style={{ marginBottom: 14 }}>
              {provider.consultTypes.map((c) => <button key={c} className={`chip ${consultType === c ? "active" : ""}`} onClick={() => setConsultType(c)}>{c === "in_person" ? "In-person" : c[0].toUpperCase() + c.slice(1)}</button>)}
            </div>
            {consultType === "chat" && (
              <label className="subscribe-toggle-label" style={{ marginBottom: 14, display: "block" }}>
                <input type="checkbox" checked={hasPictures} onChange={(e) => setHasPictures(e.target.checked)} /> I'll be sending pictures in this chat ({naira(CHAT_WITH_PICTURES_FLAT_FEE)} flat fee instead of the usual range)
              </label>
            )}
            <button className="primary-btn-sm" onClick={() => setStep("date")}>Continue</button>
          </>
        )}
        {step === "date" && (
          <>
            <div className="muted small" style={{ marginBottom: 8 }}>Choose a date</div>
            <div className="chip-row" style={{ marginBottom: 14 }}>
              {availability.map((d, i) => <button key={i} className={`chip ${dayIdx === i ? "active" : ""}`} onClick={() => { setDayIdx(i); setTime(null); }}>{d.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</button>)}
            </div>
            <button className="primary-btn-sm" onClick={() => setStep("time")}>Continue</button>
          </>
        )}
        {step === "time" && (
          <>
            <div className="muted small" style={{ marginBottom: 8 }}>Choose a time</div>
            <div className="chip-row" style={{ marginBottom: 14 }}>
              {availability[dayIdx]?.slots.map((t) => <button key={t} className={`chip ${time === t ? "active" : ""}`} onClick={() => setTime(t)}>{t}</button>)}
            </div>
            <button className="primary-btn-sm" disabled={!time} onClick={() => setStep("review")}>Continue</button>
          </>
        )}
        {step === "review" && (
          <>
            <div className="list-col" style={{ marginBottom: 14 }}>
              <div className="cat-top"><span className="muted">Provider</span><span>{provider.name}</span></div>
              <div className="cat-top"><span className="muted">Type</span><span>{consultType === "in_person" ? "In-person" : consultType[0].toUpperCase() + consultType.slice(1)}{consultType === "chat" && hasPictures ? " (with pictures)" : ""}</span></div>
              <div className="cat-top"><span className="muted">Date</span><span>{availability[dayIdx]?.date.toLocaleDateString()}</span></div>
              <div className="cat-top"><span className="muted">Time</span><span>{time}</span></div>
              {symptomCount > 0 && <div className="cat-top"><span className="muted">Symptoms noted</span><span>{symptomCount}</span></div>}
            </div>
            <button className="primary-btn-sm" onClick={() => setStep("payment")}>Continue to payment</button>
          </>
        )}
        {step === "payment" && (
          <>
            {telehealthPlan && telehealthPlan.visitsUsed < telehealthPlan.visitsTotal && (
              <div className="muted small" style={{ marginBottom: 10, color: "#16A34A" }}><ShieldCheck size={12} style={{ verticalAlign: "middle" }} /> Covered by your {TELEHEALTH_PRICING.monthly[telehealthPlan.tier].label} -- {telehealthPlan.visitsTotal - telehealthPlan.visitsUsed} visits left.</div>
            )}
            {!telehealthPlan && !voucherApplied && (
              <div className="field" style={{ marginBottom: 10 }}>
                <span>Have a voucher code?</span>
                <div className="cat-top" style={{ gap: 8 }}>
                  <input type="text" value={voucherInput} onChange={(e) => setVoucherInput(e.target.value)} placeholder="Enter voucher code" style={{ flex: 1 }} />
                  <button className="ghost-btn-sm" onClick={applyVoucher}>Apply</button>
                </div>
                {voucherError && <div className="muted small" style={{ color: "#DC2626", marginTop: 4 }}>That code isn't valid.</div>}
              </div>
            )}
            {voucherApplied && <div className="muted small" style={{ marginBottom: 10, color: "#16A34A" }}><ShieldCheck size={12} style={{ verticalAlign: "middle" }} /> Voucher applied -- this visit is free.</div>}
            {cost.coveredBy === "per_visit" && !consultType.includes("in_person") && (
              <div className="muted small" style={{ marginBottom: 10 }}>
                {consultType === "chat" && hasPictures ? "Flat fee for sending pictures." : `Based on ${symptomCount || 0} symptom${symptomCount === 1 ? "" : "s"} you noted -- fees scale with symptom count/severity, capped at the range shown on the provider's profile.`}
              </div>
            )}
            <div className="cat-top" style={{ fontWeight: 700, marginBottom: 14 }}><span>Total</span><span className="mono">{naira(cost.amount)}</span></div>
            {cost.amount > 0 && (
              <div className="field" style={{ marginBottom: 10 }}>
                <span>Pay with</span>
                <div className="chip-row">
                  <button className={`chip ${payMethod === "cash" ? "active" : ""}`} disabled={!canAffordCash} onClick={() => setPayMethod("cash")}>Wallet -- {naira(wallet)} available</button>
                  <button className={`chip ${payMethod === "points" ? "active" : ""}`} disabled={!canAffordPoints} onClick={() => setPayMethod("points")}>Points -- {points.toLocaleString()} available</button>
                </div>
              </div>
            )}
            {!telehealthPlan && !voucherApplied && cost.amount > 0 && (
              <div className="muted small" style={{ marginBottom: 10 }}>
                Prefer a monthly plan instead? <button className="link-btn" disabled={wallet < TELEHEALTH_PRICING.monthly.basic.price} onClick={() => onSubscribePlan("basic")}>{TELEHEALTH_PRICING.monthly.basic.label} -- {naira(TELEHEALTH_PRICING.monthly.basic.price)}/mo ({TELEHEALTH_PRICING.monthly.basic.visits} visits)</button> or <button className="link-btn" disabled={wallet < TELEHEALTH_PRICING.monthly.plus.price} onClick={() => onSubscribePlan("plus")}>{TELEHEALTH_PRICING.monthly.plus.label} -- {naira(TELEHEALTH_PRICING.monthly.plus.price)}/mo ({TELEHEALTH_PRICING.monthly.plus.visits} visits)</button>
              </div>
            )}
            {cost.amount > 0 && !canConfirm && <div className="muted small" style={{ color: "#DC2626", marginBottom: 8 }}>Insufficient {payMethod === "points" ? "points" : "wallet balance"} -- top up or switch payment method.</div>}
            <button className={`primary-btn-sm wide ${paying ? "loading" : ""}`} disabled={!canConfirm} onClick={confirmPay}>{paying ? <span className="spinner" /> : cost.amount === 0 ? "Confirm -- no charge" : `Pay ${naira(cost.amount)} & confirm`}</button>
          </>
        )}
      </div>
    </div>
  );
}

function ConsultationRoomScreen({ appointment, onEnd }) {
  const provider = providerById(appointment.providerId);
  const [messages, setMessages] = useState([{ from: "provider", text: `Hi, I'm ${provider?.name}. How can I help you today?` }]);
  const [chatInput, setChatInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const t = setInterval(() => setElapsed((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  const sendMsg = () => {
    if (!chatInput.trim()) return;
    setMessages((m) => [...m, { from: "me", text: chatInput.trim() }]);
    setChatInput("");
    setTimeout(() => setMessages((m) => [...m, { from: "provider", text: "Noted -- can you tell me more about when this started?" }]), 1200);
  };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Consultation with {provider?.name}</div><span className="mono muted small">{fmt(elapsed)}</span></div>
        {(appointment.consultType === "video" || appointment.consultType === "audio") && (
          <div style={{ background: "#0F172A", borderRadius: 12, padding: 40, textAlign: "center", marginBottom: 14 }}>
            {appointment.consultType === "video" ? <Video size={40} color="#94A3B8" /> : <Mic size={40} color="#94A3B8" />}
            <div className="muted small" style={{ color: "#94A3B8", marginTop: 10 }}>Simulated {appointment.consultType} consultation -- prototype only, no real connection.</div>
          </div>
        )}
        {appointment.consultType === "in_person" && (
          <div className="list-col" style={{ marginBottom: 14 }}>
            <div className="muted small"><MapPin size={12} style={{ verticalAlign: "middle" }} /> {provider?.location}</div>
            <div className="muted small">Please arrive 10 minutes early with a valid ID.</div>
          </div>
        )}
        {(appointment.consultType === "chat" || appointment.consultType === "video" || appointment.consultType === "audio") && (
          <>
            <div className="list-col" style={{ marginBottom: 10, maxHeight: 220, overflowY: "auto" }}>
              {messages.map((m, i) => (
                <div key={i} className={`review-row`} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", background: m.from === "me" ? "#F3EEFF" : "#F8FAFC" }}>{m.text}</div>
              ))}
            </div>
            <div className="reply-row">
              <input placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} />
              <button className="primary-btn-sm" onClick={sendMsg}><Send size={13} /></button>
            </div>
          </>
        )}
        <button className="ghost-btn-sm" style={{ marginTop: 14 }} onClick={() => confirmAction({ title: "End this consultation?", message: "The session will close for both you and the provider.", confirmLabel: "End consultation" }, () => onEnd())}>End Consultation</button>
      </div>
    </div>
  );
}

function MyAppointmentsScreen({ appointments, onStartConsultation, onReschedule, onCancel, onFindProvider }) {
  const [tab, setTab] = useState("upcoming");
  const [rescheduling, setRescheduling] = useState(null);
  const filtered = appointments.filter((a) => tab === "upcoming" ? a.status === "upcoming" : a.status !== "upcoming");
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row">
          <div className="panel-title">My Appointments</div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={`ghost-btn-sm ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>Upcoming</button>
            <button className={`ghost-btn-sm ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>History</button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={CalendarClock} title={tab === "upcoming" ? "No upcoming appointments" : "No past appointments"} sub="Book a consultation with a provider to get started." actionLabel="Find a Provider" onAction={onFindProvider} />
        ) : (
          <div className="list-col">
            {filtered.map((a) => {
              const provider = providerById(a.providerId);
              return (
                <div key={a.id} className="pending-row">
                  <img src={img(provider?.seed, 60)} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                  <div className="ti-mid">
                    <div className="card-name">{provider?.name}</div>
                    <div className="muted small">{a.date?.toLocaleDateString?.() || a.date} at {a.time} -- {a.consultType === "in_person" ? "In-person" : a.consultType[0].toUpperCase() + a.consultType.slice(1)}</div>
                  </div>
                  {tab === "upcoming" ? (
                    rescheduling === a.id ? (
                      <RescheduleInline appointment={a} onConfirm={(date, time) => { onReschedule(a.id, date, time); setRescheduling(null); }} onCancel={() => setRescheduling(null)} />
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="ghost-btn-sm" onClick={() => onStartConsultation(a)}>Start</button>
                        <button className="ghost-btn-sm" onClick={() => setRescheduling(a.id)}><CalendarPlus size={12} /></button>
                        <button className="ghost-btn-sm" onClick={() => onCancel(a.id)}><CalendarX size={12} /></button>
                      </div>
                    )
                  ) : (
                    <span className={`status-pill ${a.status === "cancelled" ? "" : "done"}`}>{a.status === "cancelled" ? "Cancelled" : "Completed"}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RescheduleInline({ appointment, onConfirm, onCancel }) {
  const availability = getProviderAvailability(appointment.providerId);
  const [dayIdx, setDayIdx] = useState(0);
  const [time, setTime] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <select className="sort-select" value={dayIdx} onChange={(e) => { setDayIdx(Number(e.target.value)); setTime(null); }}>
        {availability.map((d, i) => <option key={i} value={i}>{d.date.toLocaleDateString()}</option>)}
      </select>
      <select className="sort-select" value={time || ""} onChange={(e) => setTime(e.target.value)}>
        <option value="">Pick a time</option>
        {availability[dayIdx]?.slots.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="ghost-btn-sm" disabled={!time} onClick={() => onConfirm(availability[dayIdx].date, time)}>Confirm</button>
        <button className="ghost-btn-sm" onClick={onCancel}>Back</button>
      </div>
    </div>
  );
}

// Prescriptions a customer types in themselves (e.g. from a prior
// paper/offline prescription) are clearly labeled "Self-added" and carry no
// providerId -- they're never presented as if a Medra provider issued them.
function AddPrescriptionForm({ onAdd, onClose }) {
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [prescriberName, setPrescriberName] = useState("");
  const canSave = medication.trim() && dosage.trim() && frequency.trim();
  return (
    <div className="panel enter" style={{ marginBottom: 12, background: "#F8FAFC" }}>
      <div className="panel-title" style={{ fontSize: 13 }}>Add a prescription</div>
      <div className="muted small" style={{ marginBottom: 10 }}>For a prescription from outside Medra (a paper prescription, another clinic, etc). We'll keep it separate from prescriptions issued by Medra providers.</div>
      <div className="field" style={{ marginBottom: 8 }}><span>Medication *</span><input value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="e.g. Amoxicillin 500mg" /></div>
      <div className="field" style={{ marginBottom: 8 }}><span>Dosage *</span><input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 1 capsule" /></div>
      <div className="field" style={{ marginBottom: 8 }}><span>Frequency *</span><input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. 3 times daily" /></div>
      <div className="field" style={{ marginBottom: 8 }}><span>Duration</span><input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 7 days" /></div>
      <div className="field" style={{ marginBottom: 8 }}><span>Instructions</span><input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Take with food" /></div>
      <div className="field" style={{ marginBottom: 10 }}><span>Prescribed by (optional)</span><input value={prescriberName} onChange={(e) => setPrescriberName(e.target.value)} placeholder="e.g. Dr. Okoye, General Hospital" /></div>
      <div className="row-actions">
        <button className="ghost-btn-sm" onClick={onClose}>Cancel</button>
        <button className="primary-btn-sm" disabled={!canSave} onClick={() => {
          onAdd({
            id: `RXSELF${Date.now()}`,
            medication: medication.trim(),
            dosage: dosage.trim(),
            frequency: frequency.trim(),
            duration: duration.trim() || "As directed",
            instructions: instructions.trim() || "No additional instructions provided.",
            providerId: null,
            prescriberName: prescriberName.trim() || null,
            dateIssued: new Date().toISOString().slice(0, 10),
            selfAdded: true,
          });
          onClose();
        }}>Save prescription</button>
      </div>
    </div>
  );
}

function HealthPrescriptionsScreen({ prescriptions, onAddPrescription }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Prescriptions</div>{!adding && <button className="ghost-btn-sm" onClick={() => setAdding(true)}><Plus size={12} style={{ verticalAlign: "middle" }} /> Add prescription</button>}</div>
        {adding && <AddPrescriptionForm onAdd={onAddPrescription} onClose={() => setAdding(false)} />}
        {prescriptions.length === 0 ? <EmptyNote>No prescriptions yet.</EmptyNote> : (
          <div className="list-col">
            {prescriptions.map((rx) => {
              const provider = providerById(rx.providerId);
              return (
                <div key={rx.id} className="pending-row">
                  <div className="driver-avatar sm" style={{ background: "#16A34A" }}><Pill size={16} /></div>
                  <div className="ti-mid">
                    <div className="card-name">{rx.medication}</div>
                    <div className="muted small">{rx.dosage}, {rx.frequency}, for {rx.duration} -- {rx.instructions}</div>
                    <div className="muted small">{rx.selfAdded ? <>Self-added{rx.prescriberName ? ` -- ${rx.prescriberName}` : ""} on {rx.dateIssued}</> : <>Prescribed by {provider?.name} on {rx.dateIssued}</>}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const HEALTH_DOCUMENT_CATEGORIES = ["Lab Result", "Doctor's Note", "Imaging", "Prescription", "Vaccination Record", "Other"];

// Mock upload -- no real file storage yet, this just captures the file name
// the browser reports and files it under a real category so the later
// swap to real upload/storage doesn't need a UI rebuild.
function AddDocumentForm({ onAdd, onClose }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(HEALTH_DOCUMENT_CATEGORIES[0]);
  const [fileName, setFileName] = useState("");
  const canSave = title.trim() && fileName;
  return (
    <div className="panel enter" style={{ marginBottom: 12, background: "#F8FAFC" }}>
      <div className="panel-title" style={{ fontSize: 13 }}>Upload a document</div>
      <div className="field" style={{ marginBottom: 8 }}>
        <span>File *</span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
        {fileName && <div className="muted small" style={{ marginTop: 4 }}>Selected: {fileName}</div>}
      </div>
      <div className="field" style={{ marginBottom: 8 }}><span>Title *</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blood test, March 2026" /></div>
      <div className="field" style={{ marginBottom: 10 }}>
        <span>Category</span>
        <select className="sort-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {HEALTH_DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="row-actions">
        <button className="ghost-btn-sm" onClick={onClose}>Cancel</button>
        <button className="primary-btn-sm" disabled={!canSave} onClick={() => {
          onAdd({
            id: `DOCSELF${Date.now()}`,
            type: category,
            title: title.trim(),
            providerId: null,
            date: new Date().toISOString().slice(0, 10),
            summary: `Uploaded by you -- ${fileName}`,
            fileName,
            selfUploaded: true,
          });
          onClose();
        }}>Save document</button>
      </div>
    </div>
  );
}

function HealthDocumentsScreen({ documents, onAddDocument }) {
  const [adding, setAdding] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const filtered = filterCat === "all" ? documents : documents.filter((d) => d.type === filterCat);
  const categoriesPresent = ["all", ...HEALTH_DOCUMENT_CATEGORIES.filter((c) => documents.some((d) => d.type === c))];
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Health Records</div>{!adding && <button className="ghost-btn-sm" onClick={() => setAdding(true)}><Plus size={12} style={{ verticalAlign: "middle" }} /> Upload document</button>}</div>
        {adding && <AddDocumentForm onAdd={onAddDocument} onClose={() => setAdding(false)} />}
        {documents.length > 0 && (
          <div className="chip-row" style={{ marginBottom: 12 }}>
            {categoriesPresent.map((c) => <button key={c} className={`chip ${filterCat === c ? "active" : ""}`} onClick={() => setFilterCat(c)}>{c === "all" ? "All" : c}</button>)}
          </div>
        )}
        {filtered.length === 0 ? <EmptyNote>No documents yet.</EmptyNote> : (
          <div className="list-col">
            {filtered.map((d) => {
              const provider = providerById(d.providerId);
              return (
                <div key={d.id} className="pending-row">
                  <div className="driver-avatar sm"><FileText size={16} /></div>
                  <div className="ti-mid">
                    <div className="card-name">{d.title}</div>
                    <div className="muted small">{d.type} -- {d.date}{provider ? ` -- ${provider.name}` : d.selfUploaded ? " -- Uploaded by you" : ""}</div>
                    <div className="muted small">{d.summary}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function HealthMessagesScreen({ providers, conversations, onSend, getMessageCost, points }) {
  const [activeProviderId, setActiveProviderId] = useState(providers[0]?.id || null);
  const [input, setInput] = useState("");
  const provider = providerById(activeProviderId);
  const thread = conversations[activeProviderId] || [];
  const pendingCost = getMessageCost && input.trim() ? getMessageCost(activeProviderId, input.trim()) : 0;
  const send = () => {
    if (!input.trim()) return;
    if (pendingCost > points) return; // insufficient points -- send button is disabled for this case too
    onSend(activeProviderId, input.trim());
    setInput("");
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Messages</div>
        <div className="chip-row" style={{ marginBottom: 12 }}>
          {providers.map((p) => <button key={p.id} className={`chip ${activeProviderId === p.id ? "active" : ""}`} onClick={() => setActiveProviderId(p.id)}>{p.name}</button>)}
        </div>
        {provider?.type === "doctor" && <div className="muted small" style={{ marginBottom: 8 }}>Messaging a doctor costs points (500-1,000, depending on message length) -- pharmacists are free to message.</div>}
        <div className="list-col" style={{ marginBottom: 10, maxHeight: 260, overflowY: "auto" }}>
          {thread.length === 0 && <div className="muted small">No messages with {provider?.name} yet.</div>}
          {thread.map((m, i) => (
            <div key={i} className="review-row" style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", background: m.from === "me" ? "#F3EEFF" : "#F8FAFC" }}>{m.text}</div>
          ))}
        </div>
        {pendingCost > 0 && <div className="muted small" style={{ marginBottom: 4, color: pendingCost > points ? "#DC2626" : undefined }}>This message will cost {pendingCost} pts{pendingCost > points ? " -- not enough points" : ""}.</div>}
        <div className="reply-row">
          <input placeholder={`Message ${provider?.name}...`} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="primary-btn-sm" disabled={pendingCost > points} onClick={send}><Send size={13} /></button>
        </div>
      </div>
    </div>
  );
}

/* ===================== HEALTHCARE PROVIDER PORTAL =====================
   A separate provider-facing view of the same shared healthcare data --
   not a real second login/role system (this prototype has one customer
   session), just a clearly-labeled preview simulating what a specific
   provider (Dr. Ngozi Adeyemi, the first mock provider) would see. This is
   how "accept/decline appointments" and "create a prescription" get tested
   without building a whole separate authenticated app. */
function ProviderPortalScreen({ providerId, appointments, onAccept, onDecline, conversations, onSend, onCreatePrescription, telehealthEarnings }) {
  const [tab, setTab] = useState("appointments");
  const provider = providerById(providerId);
  const mine = appointments.filter((a) => a.providerId === providerId);
  const pending = mine.filter((a) => a.status === "upcoming" && !a.providerConfirmed);
  const confirmed = mine.filter((a) => a.status === "upcoming" && a.providerConfirmed);
  const completed = mine.filter((a) => a.status === "completed");
  const [rxAppointmentId, setRxAppointmentId] = useState(null);
  const [rxForm, setRxForm] = useState({ medication: "", dosage: "", frequency: "", duration: "", instructions: "" });
  const [availDays, setAvailDays] = useState(new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]));
  const toggleDay = (d) => setAvailDays((s) => { const n = new Set(s); n.has(d) ? n.delete(d) : n.add(d); return n; });
  const submitRx = () => {
    if (!rxForm.medication.trim()) return;
    onCreatePrescription({ ...rxForm, providerId, appointmentId: rxAppointmentId });
    setRxForm({ medication: "", dosage: "", frequency: "", duration: "", instructions: "" });
    setRxAppointmentId(null);
  };
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#EFF6FF,#fff)", border: "1px solid #BFDBFE" }}>
        <div className="panel-title-row"><div className="panel-title">Provider Portal -- {provider?.name}</div><span className="status-pill route">Preview</span></div>
        <div className="muted small">A simulated view of what this provider sees -- appointments, messages, and prescriptions all read/write the same shared mock data as the customer side.</div>
      </div>
      <div className="chip-row" style={{ marginBottom: 12 }}>
        {["appointments", "messages", "prescriptions", "earnings", "availability"].map((t) => (
          <button key={t} className={`chip ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}{t === "appointments" && pending.length > 0 ? ` (${pending.length})` : ""}</button>
        ))}
      </div>

      {tab === "appointments" && (
        <div className="panel enter">
          {pending.length > 0 && (
            <>
              <div className="panel-title" style={{ fontSize: 13 }}>Patient Requests</div>
              <div className="list-col" style={{ marginBottom: 16 }}>
                {pending.map((a) => (
                  <div key={a.id} className="pending-row">
                    <div className="ti-mid"><div className="card-name">Appointment #{a.id}</div><div className="muted small">{a.date?.toLocaleDateString?.() || a.date} at {a.time} -- {a.consultType}</div></div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="ghost-btn-sm" onClick={() => onAccept(a.id)}>Accept</button>
                      <button className="ghost-btn-sm" onClick={() => confirmAction({ title: "Decline this appointment?", message: "The provider will be told you declined.", confirmLabel: "Decline" }, () => onDecline(a.id))}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="panel-title" style={{ fontSize: 13 }}>Confirmed Appointments</div>
          {confirmed.length === 0 ? <EmptyNote>No confirmed appointments.</EmptyNote> : (
            <div className="list-col" style={{ marginBottom: 16 }}>
              {confirmed.map((a) => (
                <div key={a.id} className="pending-row">
                  <div className="ti-mid"><div className="card-name">Appointment #{a.id}</div><div className="muted small">{a.date?.toLocaleDateString?.() || a.date} at {a.time} -- {a.consultType}</div></div>
                  <button className="ghost-btn-sm" onClick={() => setRxAppointmentId(a.id)}>Write prescription</button>
                </div>
              ))}
            </div>
          )}
          <div className="panel-title" style={{ fontSize: 13 }}>Consultation History</div>
          {completed.length === 0 ? <EmptyNote>No completed consultations yet.</EmptyNote> : (
            <div className="list-col">
              {completed.map((a) => (
                <div key={a.id} className="pending-row">
                  <div className="ti-mid"><div className="card-name">Appointment #{a.id}</div><div className="muted small">{a.date?.toLocaleDateString?.() || a.date} -- {a.consultType}</div></div>
                  <span className="status-pill done">Completed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "messages" && (
        <div className="panel enter">
          <div className="panel-title" style={{ fontSize: 13 }}>Patient Messages</div>
          <div className="muted small" style={{ marginBottom: 10 }}>Same conversation thread the patient sees on their side, from this provider's point of view.</div>
          <div className="list-col" style={{ marginBottom: 10, maxHeight: 240, overflowY: "auto" }}>
            {(conversations[providerId] || []).length === 0 && <div className="muted small">No messages yet.</div>}
            {(conversations[providerId] || []).map((m, i) => (
              <div key={i} className="review-row" style={{ alignSelf: m.from === "me" ? "flex-start" : "flex-end", background: m.from === "me" ? "#F8FAFC" : "#F3EEFF" }}>
                <span className="muted small" style={{ fontWeight: 700 }}>{m.from === "me" ? "Patient" : "You"}: </span>{m.text}
              </div>
            ))}
          </div>
          <ProviderReplyBox providerId={providerId} onSend={onSend} />
        </div>
      )}

      {tab === "prescriptions" && (
        <div className="panel enter">
          <div className="panel-title" style={{ fontSize: 13 }}>{rxAppointmentId ? `New prescription for appointment #${rxAppointmentId}` : "Select a confirmed appointment to write a prescription"}</div>
          {!rxAppointmentId && confirmed.length === 0 && <EmptyNote>No confirmed appointments to prescribe against yet.</EmptyNote>}
          {!rxAppointmentId && confirmed.length > 0 && (
            <div className="list-col">
              {confirmed.map((a) => (
                <button key={a.id} className="pending-row" style={{ width: "100%", textAlign: "left" }} onClick={() => setRxAppointmentId(a.id)}>
                  <div className="ti-mid"><div className="card-name">Appointment #{a.id}</div><div className="muted small">{a.date?.toLocaleDateString?.() || a.date}</div></div>
                </button>
              ))}
            </div>
          )}
          {rxAppointmentId && (
            <div className="list-col">
              <input type="text" placeholder="Medication (e.g. Amoxicillin 500mg)" value={rxForm.medication} onChange={(e) => setRxForm((f) => ({ ...f, medication: e.target.value }))} />
              <input type="text" placeholder="Dosage (e.g. 1 capsule)" value={rxForm.dosage} onChange={(e) => setRxForm((f) => ({ ...f, dosage: e.target.value }))} />
              <input type="text" placeholder="Frequency (e.g. 3 times daily)" value={rxForm.frequency} onChange={(e) => setRxForm((f) => ({ ...f, frequency: e.target.value }))} />
              <input type="text" placeholder="Duration (e.g. 7 days)" value={rxForm.duration} onChange={(e) => setRxForm((f) => ({ ...f, duration: e.target.value }))} />
              <textarea rows={2} placeholder="Instructions" value={rxForm.instructions} onChange={(e) => setRxForm((f) => ({ ...f, instructions: e.target.value }))} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="primary-btn-sm" disabled={!rxForm.medication.trim()} onClick={submitRx}>Send prescription</button>
                <button className="ghost-btn-sm" onClick={() => setRxAppointmentId(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "earnings" && (
        <div className="panel enter">
          <div className="panel-title" style={{ fontSize: 13 }}>Earnings</div>
          <div className="cat-top" style={{ fontWeight: 700, marginBottom: 10 }}><span>Total from completed consultations</span><span className="mono">{naira(telehealthEarnings)}</span></div>
          <div className="muted small">SERVER-AUTHORITY: this is a simple running total for the prototype -- a real payout/earnings ledger with platform-fee deductions belongs in the backend, same as seller/rider payouts elsewhere in this app.</div>
        </div>
      )}

      {tab === "availability" && (
        <div className="panel enter">
          <div className="panel-title" style={{ fontSize: 13 }}>Manage Availability</div>
          <div className="muted small" style={{ marginBottom: 10 }}>Days you're accepting appointments (prototype toggle -- doesn't yet change the generated slot times shown to patients).</div>
          <div className="chip-row">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <button key={d} className={`chip ${availDays.has(d) ? "active" : ""}`} onClick={() => toggleDay(d)}>{d}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderReplyBox({ providerId, onSend }) {
  const [input, setInput] = useState("");
  const send = () => { if (!input.trim()) return; onSend(providerId, input.trim(), "provider"); setInput(""); };
  return (
    <div className="reply-row">
      <input placeholder="Reply to patient..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
      <button className="primary-btn-sm" onClick={send}><Send size={13} /></button>
    </div>
  );
}

function DashboardScreen({ loading, wallet, points, lifetimePoints, onOpenProduct, wishlist, toggleWishlist, activeOrder, onTrack, onSearch, onNavigate, recentlyViewed, orders, fanClubs, cart, cartUpdatedAt, onOpenCart, onTrackOrderId, dismissedTipReminders, onDismissTipReminder }) {
  const [spotlightDismissed, setSpotlightDismissed] = useState(false);
  // BUG FIX: dismissal used to be local component state, but this screen
  // fully unmounts every time you navigate away (SCREENS[active] pattern),
  // so "Dismiss" only lasted until the next visit -- it would silently
  // reappear for the same order. Tracked by order id in the parent instead,
  // which persists for the session regardless of navigation.
  const recentUntipped = [...(orders || [])].reverse().find((o) => o.status === "delivered" && !o.tipPoints && !dismissedTipReminders?.has(o.id));
  const recentProducts = recentlyViewed.map((id) => productById(id)).filter(Boolean);
  const orderCounts = {};
  (orders || []).forEach((o) => (o.items || []).forEach((it) => { orderCounts[it.productId] = (orderCounts[it.productId] || 0) + 1; }));
  const frequentlyReordered = Object.entries(orderCounts).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).map(([id]) => productById(id)).filter(Boolean).slice(0, 4);

  // Plain-language spending summary: total spent recently, plus the category
  // that's actually driven the most of that spend (not just order count).
  const allOrdersForSpend = [...(orders || []), ...RECENT_ORDERS];
  const totalSpent = allOrdersForSpend.reduce((s, o) => s + (o.total || 0), 0);
  const categorySpend = {};
  (orders || []).forEach((o) => (o.items || []).forEach((it) => {
    const p = productById(it.productId);
    if (p) categorySpend[p.category] = (categorySpend[p.category] || 0) + (it.qty || 1) * (p.price || 0);
  }));
  const topCategoryKey = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topCategoryLabel = topCategoryKey ? CATEGORIES.find((c) => c.key === topCategoryKey)?.label : null;

  // Personalized "For You": weight categories the customer has actually engaged with
  // (ordered or viewed), then surface other products in those categories they
  // haven't already seen in the shelves above.
  const engagedIds = new Set([...Object.keys(orderCounts), ...recentlyViewed.map(String)]);
  const categoryWeight = {};
  PRODUCTS.forEach((p) => { if (engagedIds.has(String(p.id))) categoryWeight[p.category] = (categoryWeight[p.category] || 0) + 1; });
  const topCategories = Object.entries(categoryWeight).sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
  const alreadyShown = new Set([...frequentlyReordered.map((p) => p.id), ...recentProducts.map((p) => p.id)]);
  let recommended = topCategories.length > 0
    ? PRODUCTS.filter((p) => topCategories.includes(p.category) && !alreadyShown.has(p.id)).slice(0, 4)
    : [];
  if (recommended.length < 4) recommended = [...recommended, ...PRODUCTS.filter((p) => !alreadyShown.has(p.id) && !recommended.includes(p)).slice(0, 4 - recommended.length)];
  const cartAbandoned = cart && cart.length > 0 && cartUpdatedAt && (Date.now() - cartUpdatedAt > 2 * 60 * 1000);
  return (
    <div className="section-pad">
      {CUSTOMER_CHANGELOG.length > 0 && !spotlightDismissed && (
        <button className="panel enter" style={{ background: "linear-gradient(160deg,#F5F3FF,#fff)", border: "1px solid #DDD6FE", textAlign: "left", width: "100%", display: "flex", alignItems: "center", gap: 10 }} onClick={() => onNavigate("changelog-customer")}>
          <Sparkles size={16} color="var(--purple)" style={{ flexShrink: 0 }} />
          <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>New: {CUSTOMER_CHANGELOG[0].title}</div><div className="muted small">Tap to see what's new</div></div>
          <span onClick={(e) => { e.stopPropagation(); setSpotlightDismissed(true); }} style={{ flexShrink: 0, padding: 4 }}><X size={12} /></span>
        </button>
      )}
      {lifetimePoints != null && (() => {
        const tier = getTier(lifetimePoints);
        const tierIdx = TIERS.findIndex((t) => t.key === tier.key);
        const nextTier = TIERS[tierIdx + 1];
        const tierProgress = nextTier ? Math.min(100, ((lifetimePoints - tier.min) / (nextTier.min - tier.min)) * 100) : 100;
        return (
          <button className="panel enter nav-flag" style={{ background: `linear-gradient(160deg, ${tier.color}18, #fff)`, border: `1px solid ${tier.color}40`, textAlign: "left", width: "100%" }} onClick={() => onNavigate("rewards")}>
            <div className="panel-title-row"><div className="panel-title" style={{ color: tier.color }}>{tier.label} tier</div><ChevronRight size={15} /></div>
            {nextTier ? (
              <>
                <div className="bar-track" style={{ marginBottom: 6 }}><div className="bar-fill-h" style={{ width: `${tierProgress}%`, background: tier.color }} /></div>
                <div className="muted small">{lifetimePoints} / {nextTier.min} lifetime points to reach {nextTier.label}</div>
              </>
            ) : <div className="muted small">You've reached the top tier -- {lifetimePoints} lifetime points.</div>}
          </button>
        );
      })()}
      {recentUntipped && (
        <div className="panel enter" style={{ background: "linear-gradient(160deg,#F5F3FF,#fff)", border: "1px solid #DDD6FE", display: "flex", alignItems: "center", gap: 10 }}>
          <Gift size={18} color="var(--purple)" />
          <div className="ti-mid"><div className="card-name" style={{ fontSize: 13 }}>Forgot to tip on order #{recentUntipped.id}?</div><div className="muted small">You can still send your rider a few points, any time.</div></div>
          <button className="ghost-btn-sm" onClick={() => onTrackOrderId(recentUntipped.id)}>Tip now</button>
          <button className="link-btn" onClick={() => onDismissTipReminder?.(recentUntipped.id)}>Dismiss</button>
        </div>
      )}
      {cartAbandoned && (
        <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFF7ED,#fff)", border: "1px solid #FED7AA", display: "flex", alignItems: "center", gap: 10 }}>
          <ShoppingCart size={18} color="#EA580C" />
          <div className="ti-mid"><div className="card-name" style={{ fontSize: 13 }}>{cart.length} item{cart.length !== 1 ? "s" : ""} still in your cart</div><div className="muted small">Pick up where you left off before it's gone.</div></div>
          <button className="ghost-btn-sm" onClick={onOpenCart}>View cart</button>
        </div>
      )}
      <div className="hero-banner">
        <div className="hero-left">
          <div className="hero-title">Good evening, {CUSTOMER.name}! 👋</div>
          <div className="hero-sub">What would you like to shop today?</div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <Wallet size={16} /><div className="muted-l">Wallet Balance</div><div className="hero-stat-val">{naira(wallet)}</div>
          </div>
          <div className="hero-stat">
            <Award size={16} /><div className="muted-l">Points ({points}/{POINTS_CAP})</div><div className="hero-stat-val">{naira(points)} value</div>
          </div>
          <div className="hero-stat">
            <Package size={16} /><div className="muted-l">Orders This Month</div><div className="hero-stat-val">12</div>
          </div>
          <div className="hero-stat gold">
            <Crown size={16} /><div className="muted-l">medra {CUSTOMER.plan}</div><div className="hero-stat-val" style={{ fontSize: 13 }}>Valid till Jul 30</div>
          </div>
        </div>
      </div>

      {(() => {
        const steps = [
          { label: "Place your first order", done: (orders || []).length > 0 },
          { label: "Save a product to your wishlist", done: wishlist.size > 0 },
          { label: "Join a vendor's fan club", done: (fanClubs?.size || 0) > 0 },
        ];
        const doneCount = steps.filter((s) => s.done).length;
        if (doneCount === steps.length) return null;
        return (
          <div className="panel enter" style={{ background: "linear-gradient(160deg,#F3EEFF,#fff)", border: "1px solid #DDD6FE" }}>
            <div className="panel-title-row"><div className="panel-title">Getting Started</div><span className="muted small">{doneCount}/{steps.length}</span></div>
            <div className="bar-track" style={{ marginBottom: 10 }}><div className="bar-fill-h" style={{ width: `${(doneCount / steps.length) * 100}%`, background: "#7C3AED" }} /></div>
            <div className="list-col">
              {steps.map((s, i) => (
                <div key={i} className="muted small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {s.done ? <CircleCheck size={13} color="#16A34A" /> : <Circle size={13} />} {s.label}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {totalSpent > 0 && (
        <div className="spend-insight">
          <Sparkles size={13} />
          You've spent {naira(totalSpent)} across {allOrdersForSpend.length} order{allOrdersForSpend.length !== 1 ? "s" : ""} recently{topCategoryLabel ? `, mostly on ${topCategoryLabel.toLowerCase()}` : ""}.
        </div>
      )}

      <div className="muted small" style={{ display: "flex", alignItems: "center", gap: 6, margin: "-4px 0 4px" }}>
        <b>Bonus Category of the Day:</b> order from it and earn double points. Today it's somewhere in <b>{hiddenDeptHintForDate(new Date())}</b> -- the exact category is a surprise, only the cluster it's hiding in is shown.
      </div>

      <div className="cat-row">
        {CATEGORIES.map((c) => (
          <button className="cat-item" key={c.key} onClick={() => onSearch(c.label)}>
            <div className="cat-icon" style={{ background: c.color + "1A", color: c.color }}><c.icon size={20} /></div>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="row-2col">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Recent Orders</div><button className="link-btn" onClick={() => onNavigate("my-orders")}>View All</button></div>
          <div className="list-col">
            {RECENT_ORDERS.map((o) => (
              <div key={o.id} className="order-row">
                <div className="ti-mid"><div className="card-name">{o.vendor}</div><div className="muted small">{o.date} - Order #{o.id}</div></div>
                <StatusPill status={o.status} />
                <div className="mono" style={{ marginLeft: 8 }}>{naira(o.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Track Your Order</div><button className="link-btn" onClick={() => onNavigate("my-orders")}>View All</button></div>
          {activeOrder ? (
            <>
              <div className="ti-mid" style={{ marginBottom: 10 }}><div className="card-name">Order #{activeOrder.id}</div><StatusPill status={activeOrder.status === "delivered" ? "Delivered" : "Out for Delivery"} /></div>
              <div className="track-steps">
                {STAGES.map((s) => (
                  <div key={s.key} className={`track-step ${activeOrder.progress >= s.at ? "done" : ""}`}>
                    <span className="track-dot">{activeOrder.progress >= s.at && <Check size={9} />}</span>
                    <span className="muted small">{s.label}</span>
                  </div>
                ))}
              </div>
              <button className="primary-btn-sm" style={{ marginTop: 14 }} onClick={onTrack}><Navigation size={13} /> Live Tracking</button>
            </>
          ) : <EmptyNote>No active order right now. Place an order to track it here.</EmptyNote>}
        </div>
      </div>

      <div className="row-2col">
        <div className="promo-banner">
          <Gift size={22} />
          <div className="hero-title" style={{ fontSize: 17, margin: "8px 0 2px" }}>Up to 50% Off</div>
          <div className="muted-l">On top deals from your favorite stores</div>
          <button className="hero-mini-btn light" style={{ marginTop: 10 }} onClick={() => onSearch("")}>Shop Deals Now</button>
        </div>
        <div className="row-2col" style={{ gap: 14 }}>
          <div className="refer-card">
            <div className="card-name">Refer & Earn</div>
            <div className="muted">Invite friends, earn 10 points when they place their first order</div>
            <button className="primary-btn-sm" style={{ marginTop: 10 }} onClick={() => onNavigate("refer")}>Invite Now</button>
          </div>
          <div className="panel enter">
            <div className="panel-title">Quick Summary</div>
            <div className="list-col">
              <div className="pending-row"><div className="ti-mid muted">Total Spent</div><div className="mono">{naira(124000)}</div></div>
              <div className="pending-row"><div className="ti-mid muted">Orders Placed</div><div className="mono">12</div></div>
              <div className="pending-row"><div className="ti-mid muted">Money Saved</div><div className="mono">{naira(25300)}</div></div>
            </div>
          </div>
        </div>
      </div>

      {recentProducts.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Recently Viewed</div>
          <div className="prod-grid">
            {recentProducts.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpenProduct} wished={wishlist.has(p.id)} onToggleWish={toggleWishlist} />)}
          </div>
        </div>
      )}

      {frequentlyReordered.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Frequently Reordered</div>
          <div className="prod-grid">
            {frequentlyReordered.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpenProduct} wished={wishlist.has(p.id)} onToggleWish={toggleWishlist} />)}
          </div>
        </div>
      )}

      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Recommended For You</div><button className="link-btn" onClick={() => onSearch("")}>View All</button></div>
        {loading ? <SkeletonGrid count={4} /> : (
          <div className="prod-grid">
            {recommended.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpenProduct} wished={wishlist.has(p.id)} onToggleWish={toggleWishlist} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function parseNaturalQuery(raw) {
  const t = raw.toLowerCase();
  let priceMax = null;
  let sortOverride = null;
  let categoryHint = null;
  let cleaned = raw;

  const underMatch = t.match(/(?:under|below|less than)\s*(?:₦|naira)?\s*([\d,]+)/);
  if (underMatch) {
    priceMax = parseInt(underMatch[1].replace(/,/g, ""), 10);
    cleaned = cleaned.replace(/(?:under|below|less than)\s*(?:₦|naira)?\s*[\d,]+/i, "").trim();
  }
  if (t.includes("cheap") || t.includes("affordable") || t.includes("budget")) {
    sortOverride = "price-asc";
    cleaned = cleaned.replace(/cheap|affordable|budget[- ]?friendly|budget/gi, "").trim();
  }
  if (t.includes("best") || t.includes("top rated") || t.includes("highly rated")) {
    sortOverride = "rating";
    cleaned = cleaned.replace(/best|top rated|highly rated/gi, "").trim();
  }
  const synonyms = {
    groceries: ["breakfast", "snack", "grocery", "coffee", "fruit"],
    electronics: ["phone", "gadget", "tech"],
    fashion: ["clothes", "clothing", "shoes", "wear", "outfit"],
    beauty: ["skincare", "makeup", "cosmetic"],
    pharmacies: ["medicine", "pharmacy"],
    home: ["furniture", "kitchen"],
  };
  for (const [c, words] of Object.entries(synonyms)) {
    if (words.some((w) => t.includes(w))) { categoryHint = c; cleaned = cleaned.replace(new RegExp(words.join("|"), "gi"), "").trim(); break; }
  }
  return { cleanedQuery: cleaned.trim(), priceMax, sortOverride, categoryHint };
}

function ShopScreen({ initialQuery, onOpenProduct, wishlist, toggleWishlist, orders, onAddToCart }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("relevance");
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [chooseForMeResults, setChooseForMeResults] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);
  const toggleCompare = (id) => setCompareIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));

  const chooseForMe = () => {
    const orderCounts = {};
    const categoryWeight = {};
    (orders || []).forEach((o) => (o.items || []).forEach((it) => {
      orderCounts[it.productId] = (orderCounts[it.productId] || 0) + 1;
      const p = productById(it.productId);
      if (p) categoryWeight[p.category] = (categoryWeight[p.category] || 0) + (it.qty || 1);
    }));
    const orderedIds = new Set(Object.keys(orderCounts));
    const topCategories = Object.entries(categoryWeight).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    let picks = topCategories.length > 0
      ? PRODUCTS.filter((p) => topCategories.includes(p.category) && !orderedIds.has(String(p.id))).slice(0, 4)
      : [];
    if (picks.length < 4) picks = [...picks, ...PRODUCTS.filter((p) => !picks.includes(p) && !orderedIds.has(String(p.id))).sort((a, b) => b.rating - a.rating).slice(0, 4 - picks.length)];
    setChooseForMeResults(picks);
  };

  const parsed = query.trim() ? parseNaturalQuery(query) : null;
  let list = cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);
  if (parsed?.categoryHint && cat === "all") list = list.filter((p) => p.category === parsed.categoryHint);
  const effectiveText = (parsed?.cleanedQuery ?? query).trim().toLowerCase();
  if (effectiveText) list = list.filter((p) => p.name.toLowerCase().includes(effectiveText) || CATEGORIES.find((c) => c.key === p.category)?.label.toLowerCase().includes(effectiveText));
  if (parsed?.priceMax != null) list = list.filter((p) => p.price <= parsed.priceMax);
  const effectiveSort = parsed?.sortOverride || sort;
  if (effectiveSort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (effectiveSort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (effectiveSort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);

  const interpretation = parsed && (parsed.priceMax != null || parsed.sortOverride || parsed.categoryHint)
    ? [parsed.sortOverride === "price-asc" && "budget-friendly", parsed.sortOverride === "rating" && "top-rated", parsed.categoryHint && CATEGORIES.find((c) => c.key === parsed.categoryHint)?.label.toLowerCase(), parsed.priceMax != null && `under ₦${parsed.priceMax.toLocaleString()}`].filter(Boolean).join(", ")
    : null;

  return (
    <div className="section-pad">
      {compareOpen && <CompareModal products={PRODUCTS.filter((p) => compareIds.includes(p.id))} onClose={() => setCompareOpen(false)} />}
      <div className="search-wrap-cu" style={{ marginBottom: 4 }}>
        <Search size={15} /><input placeholder="Search for products, stores and more... (try 'cheap breakfast under 3000')" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button onClick={() => setQuery("")}><X size={14} /></button>}
      </div>
      <button className="choose-for-me-btn" onClick={chooseForMe}><Sparkles size={13} /> Choose for me</button>
      {chooseForMeResults && (
        <div className="panel enter choose-for-me-panel">
          <div className="panel-title-row"><div className="panel-title">Picked for you</div><button className="ghost-btn-sm" onClick={() => setChooseForMeResults(null)}><X size={11} /> Dismiss</button></div>
          <p className="muted small" style={{ marginBottom: 10 }}>Based on what you've ordered recently.</p>
          {chooseForMeResults.length === 0 ? (
            <div className="empty-note">Order a few things first and we'll start picking for you.</div>
          ) : (
            <>
              <div className="prod-grid">
                {chooseForMeResults.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpenProduct} wished={wishlist.has(p.id)} onToggleWish={toggleWishlist} />)}
              </div>
              <button className="primary-btn-sm" style={{ marginTop: 10 }} onClick={() => chooseForMeResults.forEach((p) => onAddToCart?.(p))}>Add all {chooseForMeResults.length} to cart</button>
            </>
          )}
        </div>
      )}
      {interpretation && <div className="nl-interpretation"><Sparkles size={11} /> Showing {interpretation} results</div>}
      <div className="shop-toolbar">
        <div className="chip-row">
          <button className={`chip ${cat === "all" ? "active" : ""}`} onClick={() => setCat("all")}>All</button>
          {CATEGORIES.map((c) => <button key={c.key} className={`chip ${cat === c.key ? "active" : ""}`} onClick={() => setCat(c.key)}>{c.label}</button>)}
        </div>
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="relevance">Sort: Relevance</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      <div className="cat-top" style={{ marginBottom: 10, gap: 6, flexWrap: "wrap" }}>
        {savedSearches.map((s) => (
          <button key={s.name} className="chip" onClick={() => { setQuery(s.query); setCat(s.cat); setSort(s.sort); }}>
            {s.name} <span onClick={(e) => { e.stopPropagation(); setSavedSearches((ss) => ss.filter((x) => x.name !== s.name)); }} style={{ marginLeft: 4 }}><X size={10} /></span>
          </button>
        ))}
        {(query.trim() || cat !== "all") && (
          <button className="ghost-btn-sm" onClick={() => {
            const name = prompt("Name this search:", query.trim() || cat);
            if (!name) return;
            setSavedSearches((ss) => [...ss.filter((s) => s.name !== name), { name, query, cat, sort }]);
          }}><Plus size={11} style={{ verticalAlign: "middle" }} /> Save this search</button>
        )}
      </div>
      <CompareBar compareList={compareIds} onOpen={() => setCompareOpen(true)} onClear={() => setCompareIds([])} />
      <div className="panel enter">
        {list.length === 0 && <EmptyState icon={Search} title={`No products match "${query}"`} sub="Try a different search term or category." />}
        <div className="prod-grid">
          {list.map((p) => <ProductCard key={p.id} p={p} onOpen={onOpenProduct} wished={wishlist.has(p.id)} onToggleWish={toggleWishlist} compared={compareIds.includes(p.id)} onToggleCompare={toggleCompare} />)}
        </div>
      </div>
    </div>
  );
}

function getBundleProducts(product) {
  return PRODUCTS.filter((p) => p.category !== product.category && p.id !== product.id).slice(0, 2);
}

function ProductModal({ product, onClose, onAdd, onOpenProduct, onOpenStore, unitPref, myReviews, onSubmitReview, myQuestionsByProduct, onAskQuestion, reportedPriceErrors, onReportPriceError }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [sellerView, setSellerView] = useState("list");
  // Same fix as myReview above: lifted out of local state so an asked
  // question (shown as "Awaiting answer") survives closing the modal
  // instead of silently vanishing.
  const myQuestions = myQuestionsByProduct?.[product?.id] || [];
  const [questionInput, setQuestionInput] = useState("");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [descLang, setDescLang] = useState("english");
  // Same persistence fix as reviews/questions above -- a submitted report
  // shouldn't silently un-submit itself just because the modal was closed.
  const priceErrorReported = reportedPriceErrors?.has(product?.id) || false;
  const [reviewSort, setReviewSort] = useState("recent");
  const [upvotedReviews, setUpvotedReviews] = useState(new Set());
  const [reportedReviews, setReportedReviews] = useState(new Set());
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [myReviewText, setMyReviewText] = useState("");
  const [myReviewRating, setMyReviewRating] = useState(5);
  const [myReviewPhoto, setMyReviewPhoto] = useState(null);
  // BUG FIX: this used to be its own useState, which got wiped every time
  // the modal closed (closing sets product to null, which changes
  // product?.id and fires the per-product reset effect below) -- so a
  // submitted review vanished the moment you closed the modal, even without
  // switching products. Once submitted, a review is real data and needs to
  // survive closing the modal; only the in-progress draft fields above are
  // fine to lose on close. Lifted to the parent, keyed by product id.
  const myReview = myReviews?.[product?.id] || null;
  const myReviewPhotoRef = useRef(null);
  const handleMyReviewPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMyReviewPhoto(reader.result);
    reader.readAsDataURL(file);
  };
  const submitMyReview = () => {
    if (!myReviewText.trim() || !product) return;
    onSubmitReview?.(product.id, { text: myReviewText.trim(), rating: myReviewRating, photo: myReviewPhoto });
    setWriteReviewOpen(false);
  };
  useEffect(() => { setPhotoIdx(0); setQuestionInput(""); setSizeGuideOpen(false); setDescLang("english"); setReviewSort("recent"); setUpvotedReviews(new Set()); setWriteReviewOpen(false); setMyReviewText(""); setMyReviewRating(5); setMyReviewPhoto(null); }, [product?.id]);
  if (!product) return null;
  const sellers = getSellersForProduct(product);
  const reviews = getReviewsForProduct(product);
  const questions = getQuestionsForProduct(product);
  const submitQuestion = () => {
    if (!questionInput.trim()) return;
    onAskQuestion?.(product.id, { q: questionInput.trim(), askedAt: "Just now" });
    setQuestionInput("");
  };
  const similar = getSimilarProducts(product);
  const bundle = getBundleProducts(product);
  const bundleItems = [product, ...bundle];
  const bundlePriceEach = bundleItems.map((p) => getSellersForProduct(p)[0].customerPrice);
  const bundleTotal = bundlePriceEach.reduce((s, v) => s + v, 0);
  const photos = [product.seed, `${product.seed}-2`, `${product.seed}-3`];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="modal-media">
          <img src={img(photos[photoIdx], 500)} alt={product.name} className="modal-img" />
          <div className="photo-thumb-row">
            {photos.map((p, i) => (
              <button key={p} className={`photo-thumb ${photoIdx === i ? "active" : ""}`} onClick={() => setPhotoIdx(i)}>
                <img src={img(p, 80)} alt={`${product.name} view ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="modal-body">
          <div className="card-name" style={{ fontSize: 17 }}>{product.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}><Stars value={product.rating} /> <span className="muted">{product.rating} ({product.reviews.toLocaleString()})</span></div>
          <p className="muted" style={{ lineHeight: 1.6 }}>{descLang === "pidgin" && product.descPidgin ? product.descPidgin : product.desc}</p>
          {product.descPidgin && (
            <button className="link-btn" style={{ marginBottom: 8 }} onClick={() => setDescLang((l) => (l === "pidgin" ? "english" : "pidgin"))}>
              {descLang === "pidgin" ? "Show in English" : "Show in Pidgin"}
            </button>
          )}
          {product.weightKg && (
            <div className="muted small" style={{ marginBottom: 8 }}>
              <Scale size={11} style={{ verticalAlign: "middle" }} /> {unitPref === "lb" ? `${(product.weightKg * 2.20462).toFixed(2)} lb` : `${product.weightKg} kg`}
            </div>
          )}
          {(product.category === "groceries" || product.category === "pharmacies") && (
            <div className="muted small" style={{ color: "#B45309", marginBottom: 8 }}><AlertTriangle size={11} style={{ verticalAlign: "middle" }} /> Food, medication, and perishable items can't be returned or refunded once delivered, for safety reasons.</div>
          )}
          {product.category === "groceries" && (() => {
            // Deterministic (not random-per-render) nutrition estimate derived
            // from the product id, standing in for real per-product nutrition
            // data until that's sourced -- illustrative, not verified figures.
            const h = [...product.id].reduce((s, c) => s + c.charCodeAt(0), 0);
            const calories = 60 + (h % 240);
            const protein = 1 + (h % 12);
            const carbs = 5 + (h % 35);
            const fat = 1 + (h % 15);
            return (
              <div className="panel enter" style={{ padding: 12, marginBottom: 10 }}>
                <div className="muted small" style={{ fontWeight: 700, marginBottom: 6 }}>Nutrition (per serving, estimated)</div>
                <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
                  <div className="stat-mini enter"><div className="muted small">Calories</div><div className="mono">{calories}</div></div>
                  <div className="stat-mini enter"><div className="muted small">Protein</div><div className="mono">{protein}g</div></div>
                  <div className="stat-mini enter"><div className="muted small">Carbs</div><div className="mono">{carbs}g</div></div>
                  <div className="stat-mini enter"><div className="muted small">Fat</div><div className="mono">{fat}g</div></div>
                </div>
              </div>
            );
          })()}
          {(() => {
            const name = product.name.toLowerCase();
            const isShoe = /sneaker|shoe|boot|sandal/.test(name);
            const isApparel = /shirt|jacket|jean|dress|trouser|hoodie/.test(name);
            if (product.category !== "fashion" || (!isShoe && !isApparel)) return null;
            return (
              <div style={{ marginBottom: 10 }}>
                <button className="link-btn" onClick={() => setSizeGuideOpen((o) => !o)}>{sizeGuideOpen ? "Hide size guide" : "View size guide"}</button>
                {sizeGuideOpen && isShoe && (
                  <table className="admin-table" style={{ marginTop: 8 }}>
                    <thead><tr><th>US Size</th><th>UK Size</th><th>Foot length (cm)</th></tr></thead>
                    <tbody>
                      <tr><td>7</td><td>6</td><td>25.0</td></tr>
                      <tr><td>8</td><td>7</td><td>25.8</td></tr>
                      <tr><td>9</td><td>8</td><td>26.7</td></tr>
                      <tr><td>10</td><td>9</td><td>27.5</td></tr>
                      <tr><td>11</td><td>10</td><td>28.4</td></tr>
                    </tbody>
                  </table>
                )}
                {sizeGuideOpen && isApparel && (
                  <table className="admin-table" style={{ marginTop: 8 }}>
                    <thead><tr><th>Size</th><th>Chest (in)</th><th>Waist (in)</th><th>Hip (in)</th></tr></thead>
                    <tbody>
                      <tr><td>S</td><td>34-36</td><td>28-30</td><td>34-36</td></tr>
                      <tr><td>M</td><td>38-40</td><td>32-34</td><td>38-40</td></tr>
                      <tr><td>L</td><td>42-44</td><td>36-38</td><td>42-44</td></tr>
                      <tr><td>XL</td><td>46-48</td><td>40-42</td><td>46-48</td></tr>
                    </tbody>
                  </table>
                )}
                <div className="muted small" style={{ marginTop: 6 }}>General guide -- fit can vary by seller. When in doubt, ask the seller a question below.</div>
              </div>
            );
          })()}

          <div className="panel-title-row" style={{ marginTop: 16, marginBottom: 6 }}>
            <div className="panel-title">{sellers.length} sellers near you</div>
            {sellers.length > 1 && (
              <div style={{ display: "flex", gap: 4 }}>
                <button className={`ghost-btn-sm ${sellerView === "list" ? "active" : ""}`} style={sellerView === "list" ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setSellerView("list")}>List</button>
                <button className={`ghost-btn-sm ${sellerView === "compare" ? "active" : ""}`} style={sellerView === "compare" ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setSellerView("compare")}>Compare</button>
              </div>
            )}
          </div>
          {priceErrorReported ? (
            <span className="muted small">Thanks, we'll take a look.</span>
          ) : (
            <button className="link-btn" style={{ marginBottom: 8 }} onClick={() => onReportPriceError?.(product.id)}>Report a price error</button>
          )}
          {sellerView === "compare" && sellers.length > 1 ? (
            <table className="admin-table" style={{ marginBottom: 10 }}>
              <thead><tr><th>Seller</th><th>Price</th><th>Distance</th><th>Rating</th><th>ETA</th><th></th></tr></thead>
              <tbody>
                {sellers.map((s, i) => (
                  <tr key={s.id}>
                    <td className="card-name" style={{ fontSize: 12.5 }}>{s.vendor}{i === 0 && <span className="status-pill done" style={{ marginLeft: 6 }}>Best price</span>}</td>
                    <td className="mono">{naira(s.customerPrice)}</td>
                    <td className="muted small">{s.distance} mi</td>
                    <td className="muted small">{s.rating} <Star size={10} fill="#F59E0B" color="#F59E0B" style={{ verticalAlign: "middle" }} /></td>
                    <td className="muted small">~{s.etaMin} min</td>
                    <td><button className="prod-add" onClick={() => onAdd(s)}><Plus size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
          <div className="list-col">
            {sellers.map((s, i) => {
              const next = sellers[i + 1];
              const priceGapPct = i === 0 && next ? Math.round((1 - s.customerPrice / next.customerPrice) * 100) : 0;
              const isFastest = i === 0 && sellers.every((o) => s.etaMin <= o.etaMin);
              return (
                <div key={s.id} className="seller-row">
                  <div className="driver-avatar sm store">{s.initials}</div>
                  <div className="ti-mid">
                    <div className="card-name">{s.vendor} {i === 0 && <span className="status-pill done">Best price</span>}</div>
                    <div className="muted small"><Stars value={s.rating} size={10} /> {s.rating} -- {s.distance} mi -- ~{s.etaMin} min</div>
                    {i === 0 && priceGapPct >= 3 && <div className="why-seller-note">{priceGapPct}% cheaper than {next.vendor}{isFastest ? " and the fastest option here" : ""}</div>}
                    <button className="link-btn" style={{ padding: 0 }} onClick={() => onOpenStore(s.vendor)}>View store</button>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontWeight: 700 }}>{naira(s.customerPrice)}</div>
                  </div>
                  <button className="prod-add" onClick={() => onAdd(s)}><Plus size={14} /></button>
                </div>
              );
            })}
          </div>
          )}

          {bundle.length === 2 && (
            <>
              <div className="panel-title" style={{ marginTop: 18, marginBottom: 6 }}>Frequently bought together</div>
              <div className="bundle-row">
                {bundleItems.map((p, i) => (
                  <React.Fragment key={p.id}>
                    <button className="bundle-item" onClick={() => i > 0 && onOpenProduct(p)}>
                      <img src={img(p.seed, 90)} alt={p.name} />
                      <div className="muted small">{p.name}</div>
                      <div className="mono small">{naira(bundlePriceEach[i])}</div>
                    </button>
                    {i < bundleItems.length - 1 && <Plus size={14} className="bundle-plus" />}
                  </React.Fragment>
                ))}
              </div>
              <button className="primary-btn-sm" style={{ marginTop: 10 }} onClick={() => { onAdd(sellers[0]); bundle.forEach((p) => onAdd(getSellersForProduct(p)[0])); }}>
                Add all {bundleItems.length} to cart -- {naira(bundleTotal)}
              </button>
            </>
          )}

          <div className="panel-title-row" style={{ marginTop: 18, marginBottom: 6 }}>
            <div className="panel-title">Reviews</div>
            <button className="link-btn" onClick={() => setReviewSort((s) => (s === "helpful" ? "recent" : "helpful"))}>Sort: {reviewSort === "helpful" ? "Most helpful" : "Most recent"}</button>
          </div>
          <div className="list-col">
            {myReview && (
              <div className="review-row" style={{ background: "#F8FAFC" }}>
                <div className="cat-top"><span className="card-name">You<span className="status-pill route" style={{ marginLeft: 6, fontSize: 9.5 }}>Your review</span></span><Stars value={myReview.rating} size={10} /></div>
                <div className="muted">{myReview.text}</div>
                {myReview.photo && <img src={myReview.photo} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />}
              </div>
            )}
            {[...reviews].sort((a, b) => reviewSort === "helpful" ? (upvotedReviews.has(b.author) ? b.helpfulCount + 1 : b.helpfulCount) - (upvotedReviews.has(a.author) ? a.helpfulCount + 1 : a.helpfulCount) : 0).map((r, i) => (
              <div key={i} className="review-row">
                <div className="cat-top"><span className="card-name">{r.author}{r.verified && <span className="status-pill done" style={{ marginLeft: 6, fontSize: 9.5 }}>Verified Purchase</span>}</span><Stars value={r.rating} size={10} /></div>
                <div className="muted">{r.text}</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button className="link-btn" style={{ fontSize: 11, marginTop: 4 }} disabled={upvotedReviews.has(r.author)} onClick={() => setUpvotedReviews((u) => new Set(u).add(r.author))}>
                    <ThumbsUp size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />Helpful ({upvotedReviews.has(r.author) ? r.helpfulCount + 1 : r.helpfulCount})
                  </button>
                  {reportedReviews.has(r.author) ? (
                    <span className="muted small" style={{ fontSize: 11, marginTop: 4 }}>Reported -- thanks, we'll take a look</span>
                  ) : (
                    <button className="link-btn" style={{ fontSize: 11, marginTop: 4, color: "#DC2626" }} onClick={() => setReportedReviews((s) => new Set(s).add(r.author))}>
                      <Flag size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />Report
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!myReview && !writeReviewOpen && <button className="link-btn" style={{ marginBottom: 10 }} onClick={() => setWriteReviewOpen(true)}>Write a review</button>}
          {writeReviewOpen && (
            <div className="review-row" style={{ marginBottom: 10 }}>
              <div className="stars-row" style={{ marginBottom: 6 }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} fill={i < myReviewRating ? "#F59E0B" : "none"} color="#F59E0B" style={{ cursor: "pointer" }} onClick={() => setMyReviewRating(i + 1)} />)}</div>
              <textarea rows={2} value={myReviewText} onChange={(e) => setMyReviewText(e.target.value)} placeholder="Share your experience with this product..." style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical", marginBottom: 6 }} />
              <input type="file" ref={myReviewPhotoRef} accept="image/*" style={{ display: "none" }} onChange={handleMyReviewPhoto} />
              {myReviewPhoto ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <img src={myReviewPhoto} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
                  <button className="link-btn" onClick={() => setMyReviewPhoto(null)}>Remove photo</button>
                </div>
              ) : (
                <button className="ghost-btn-sm" style={{ marginBottom: 6 }} onClick={() => myReviewPhotoRef.current?.click()}><ImageIcon size={12} /> Add a photo (optional)</button>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="primary-btn-sm" disabled={!myReviewText.trim()} onClick={submitMyReview}>Submit review</button>
                <button className="ghost-btn-sm" onClick={() => setWriteReviewOpen(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="panel-title" style={{ marginTop: 18, marginBottom: 6 }}>Questions & Answers</div>
          <div className="list-col" style={{ marginBottom: 10 }}>
            {questions.map((qa, i) => (
              <div key={i} className="review-row">
                <div className="card-name" style={{ fontSize: 12.5 }}>Q: {qa.q}</div>
                <div className="muted small" style={{ marginTop: 2 }}>A: {qa.a} -- answered by {sellers[0]?.vendor || "the seller"}, asked by {qa.author}</div>
              </div>
            ))}
            {myQuestions.map((mq, i) => (
              <div key={`mine-${i}`} className="review-row">
                <div className="card-name" style={{ fontSize: 12.5 }}>Q: {mq.q}</div>
                <div className="muted small" style={{ marginTop: 2 }}><span className="status-pill prep" style={{ marginRight: 6 }}>Awaiting answer</span>{mq.askedAt}</div>
              </div>
            ))}
          </div>
          <div className="cat-top" style={{ gap: 8 }}>
            <input type="text" value={questionInput} onChange={(e) => setQuestionInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitQuestion()} placeholder="Ask a question about this product" style={{ flex: 1 }} />
            <button className="ghost-btn-sm" disabled={!questionInput.trim()} onClick={submitQuestion}>Ask</button>
          </div>

          {similar.length > 0 && (
            <>
              <div className="panel-title" style={{ marginTop: 18, marginBottom: 6 }}>Similar items</div>
              <div className="similar-row">
                {similar.map((s) => (
                  <button key={s.id} className="similar-card" onClick={() => onOpenProduct(s)}>
                    <img src={img(s.seed, 160)} alt={s.name} />
                    <div className="muted small" style={{ padding: "0 6px" }}>{s.name}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ open, onClose, cart, updateQty, onCheckout, activeDiscount, savedForLater, onSaveForLater, onMoveToCart, onRemoveSaved, notifyPrefs, setAllNotifyPrefs }) {
  const items = cart.map((c) => ({ ...c, product: productById(c.productId) }));
  const savedItems = (savedForLater || []).map((c) => ({ ...c, product: productById(c.productId) }));
  const sellerSubtotal = items.reduce((s, i) => s + i.sellerPrice * i.qty, 0);
  const platformFee = sellerSubtotal * PRODUCT_COMMISSION_RATE;
  const wheelDiscountPct = wheelDiscountPctFromActiveDiscount(activeDiscount);
  const customerSubtotal = (sellerSubtotal + platformFee) * (1 - wheelDiscountPct / 100);
  const tripDistanceKm = items.length ? Math.max(...items.map((i) => i.distanceKm || 1)) : 0;
  const peak = isPeakHour();
  const baseDelivery = customerSubtotal === 0 ? 0 : computeDeliveryFee(tripDistanceKm, peak);
  const delivery = baseDelivery === 0 ? 0 : applyDeliveryReward(baseDelivery, activeDiscount);
  return (
    <div className={`cart-drawer-wrap ${open ? "open" : ""}`}>
      <div className="cart-backdrop" onClick={onClose} />
      <div className="cart-drawer">
        <div className="panel-title-row" style={{ padding: "18px 20px 0" }}><div className="panel-title">Your Cart</div><button className="modal-close" onClick={onClose}><X size={16} /></button></div>
        <div className="list-col" style={{ padding: "0 20px", flex: 1, overflowY: "auto" }}>
          {items.length === 0 && <EmptyNote>Your cart is empty.</EmptyNote>}
          {items.length > 0 && notifyPrefs && setAllNotifyPrefs && (() => {
            const cartAllOn = items.every((i) => notifyPrefs[i.productId]?.priceDrop);
            return (
              <button className="ghost-btn-sm" style={{ marginBottom: 8, alignSelf: "flex-start" }} onClick={() => setAllNotifyPrefs(items.map((i) => i.productId), !cartAllOn)}>
                {cartAllOn ? "Stop alerting on these cart items" : "Alert me if any cart item's price drops"}
              </button>
            );
          })()}
          {items.map((i) => (
            <div key={i.key} className="cart-row">
              <img src={img(i.product.seed, 120)} alt="" />
              <div className="ti-mid">
                <div className="card-name">{i.product.name}</div>
                <div className="muted small">Sold by {i.sellerName}</div>
                <div className="mono">{naira(withMarkup(i.sellerPrice))}</div>
                <div className="stepper-sm"><button onClick={() => updateQty(i.key, Math.max(0, i.qty - 1))}><Minus size={12} /></button><span>{i.qty}</span><button onClick={() => updateQty(i.key, i.qty + 1)}><Plus size={12} /></button></div>
                {onSaveForLater && <button className="link-price" style={{ marginTop: 4 }} onClick={() => onSaveForLater(i.key)}>Save for later</button>}
              </div>
            </div>
          ))}
          {savedItems.length > 0 && (
            <>
              <div className="muted small" style={{ marginTop: 8, marginBottom: 4, fontWeight: 700 }}>Saved for later ({savedItems.length})</div>
              {savedItems.map((i) => (
                <div key={i.key} className="cart-row">
                  <img src={img(i.product.seed, 120)} alt="" style={{ opacity: 0.7 }} />
                  <div className="ti-mid">
                    <div className="card-name">{i.product.name}</div>
                    <div className="muted small">Sold by {i.sellerName}</div>
                    <div className="mono">{naira(withMarkup(i.sellerPrice))}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <button className="link-price" onClick={() => onMoveToCart(i.key)}>Move to cart</button>
                      <button className="link-price" style={{ color: "#DC2626" }} onClick={() => confirmAction({ title: "Remove this item?", message: "It will be removed from your saved-for-later list.", confirmLabel: "Remove" }, () => onRemoveSaved(i.key))}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {items.length > 0 && (
          <div style={{ padding: 20, borderTop: "1px solid var(--border)" }}>
            <div className="cat-top" style={{ marginBottom: 4 }}><span className="muted">Items ({items.reduce((s, i) => s + i.qty, 0)})</span><span className="mono">{naira(customerSubtotal)}</span></div>
            <div className="cat-top" style={{ marginBottom: 10 }}><span className="muted">Delivery</span><span className="mono">{naira(delivery)}</span></div>
            <button className="primary-btn-sm wide" onClick={onCheckout}>Checkout - {naira(customerSubtotal + delivery)}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderConfirmModal({ items, recommended, onConfirm, onAddRec, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 17, marginBottom: 4 }}>Are you sure that's all you need?</div>
        <div className="muted" style={{ marginBottom: 16 }}>You're about to order {items.reduce((s, i) => s + i.qty, 0)} item{items.reduce((s, i) => s + i.qty, 0) > 1 ? "s" : ""}. Take a look at these before you check out.</div>
        {recommended.length > 0 && (
          <div className="rec-grid">
            {recommended.map((p) => (
              <div key={p.id} className="rec-card">
                <img src={img(p.seed, 160)} alt={p.name} />
                <div className="muted small" style={{ padding: "0 8px" }}>{p.name}</div>
                <div className="prod-price-row" style={{ padding: "0 8px 8px" }}>
                  <span className="mono prod-price">{naira(withMarkup(p.price))}</span>
                  <button className="prod-add" onClick={() => onAddRec(p)}><Plus size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="ghost-btn-sm" style={{ flex: 1 }} onClick={onCancel}>Keep shopping</button>
          <button className="primary-btn-sm" style={{ flex: 1 }} onClick={onConfirm}>Yes, place my order</button>
        </div>
      </div>
    </div>
  );
}

function CheckoutScreen({ cart, points, wallet, autoConfirm, onAutoConfirmed, onPlace, onAddToCart, savedPayMethod, onSavePayMethod, pointsRemainingThisMonth, activeDiscount, savedRecipients, isOffline }) {
  const items = cart.map((c) => ({ ...c, product: productById(c.productId) }));
  const peak = isPeakHour();
  const tripDistanceKm = items.length ? Math.max(...items.map((i) => i.distanceKm || 1)) : 0;

  const [pointsApplied, setPointsApplied] = useState(0);
  const [tipPoints, setTipPoints] = useState(0);
  const [tipCustomInput, setTipCustomInput] = useState("");
  const [topUpPoints, setTopUpPoints] = useState(0);
  const [giftMode, setGiftMode] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [schedule, setSchedule] = useState("asap");
  const [customTime, setCustomTime] = useState("");
  const [instructions, setInstructions] = useState("");
  const [addrOpen, setAddrOpen] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState(ADDRESSES.find((a) => a.primary) || ADDRESSES[0]);
  const [payMethod, setPayMethod] = useState(savedPayMethod || "card");
  const [transferProofPhoto, setTransferProofPhoto] = useState(null);
  const transferProofRef = useRef(null);
  const handleTransferProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTransferProofPhoto(reader.result);
    reader.readAsDataURL(file);
  };
  const transferAccountNumber = useMemo(() => {
    let hash = 0;
    const seed = CUSTOMER.name + new Date().toDateString();
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return String(1000000000 + (hash % 9000000000)).slice(0, 10);
  }, []);
  const [rememberPayMethod, setRememberPayMethod] = useState(!!savedPayMethod);
  const [placing, setPlacing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [instructionPreset, setInstructionPreset] = useState("");
  const [subscribedKeys, setSubscribedKeys] = useState(new Set());
  useEffect(() => {
    if (autoConfirm) {
      setConfirmOpen(true);
      onAutoConfirmed();
    }
  }, [autoConfirm]);

  const toggleSubscribe = (key) => setSubscribedKeys((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const SUBSCRIBE_DISCOUNT = 0.01;
  const itemLineTotal = (i) => i.sellerPrice * i.qty * (subscribedKeys.has(i.key) ? 1 - SUBSCRIBE_DISCOUNT : 1);
  const sellerSubtotal = items.reduce((s, i) => s + itemLineTotal(i), 0);
  const platformFee = sellerSubtotal * PRODUCT_COMMISSION_RATE;
  const wheelDiscountPct = wheelDiscountPctFromActiveDiscount(activeDiscount);
  const productPayable = (sellerSubtotal + platformFee) * (1 - wheelDiscountPct / 100);
  const deliveryRewardWon = isDeliveryReward(activeDiscount);
  const baseDelivery = computeDeliveryFee(tripDistanceKm, peak);
  const delivery = applyDeliveryReward(baseDelivery, activeDiscount);

  const maxRedeemable = Math.min(points, Math.floor(productPayable), pointsRemainingThisMonth ?? Infinity);


  const productAfterPoints = productPayable - Math.min(pointsApplied, maxRedeemable);
  // Rider tip: paid in points, not naira -- a customer who paid by bank
  // transfer has already completed that transfer and shouldn't need to make
  // a second one just to tip. The rider still gets real money: the points
  // are converted to naira on the rider's side at payout (1 point = ₦1,
  // same rate as everywhere else in the points economy). Capped below at
  // whatever points remain after this order's own redemption.
  const maxTipPoints = Math.max(0, points - Math.min(pointsApplied, maxRedeemable));
  // BUG FIX: tipPoints was only clamped to maxTipPoints at the moment you
  // set it (chip click / typing in the custom field). If you set a tip and
  // then afterward dragged the points-redemption slider up, tipPoints stayed
  // at its old value even though maxTipPoints had since shrunk -- letting
  // pointsApplied + tipPoints silently exceed your actual balance by the
  // time you placed the order. Re-clamp reactively whenever maxTipPoints
  // changes, not just when tipPoints itself is set.
  useEffect(() => {
    if (tipPoints > maxTipPoints) setTipPoints(maxTipPoints);
  }, [maxTipPoints]);
  // Point top-up: lets a customer buy extra points (1 point = 1 naira, same
  // rate as the standalone "Convert naira to points" screen) in the same
  // checkout payment, instead of a separate trip to that screen. These
  // points are credited to their balance for future use anywhere in the
  // app -- they don't have to be spent on this order.
  const total = productAfterPoints + delivery + topUpPoints;
  const walletCovered = payMethod === "wallet" ? Math.min(wallet, total) : payMethod === "split" ? Math.min(wallet, total) : 0;
  const cardCovered = total - walletCovered;

  const cartCategories = new Set(items.map((i) => i.product.category));
  const cartProductIds = new Set(items.map((i) => i.productId));
  const recommended = PRODUCTS.filter((p) => cartCategories.has(p.category) && !cartProductIds.has(p.id)).slice(0, 3);

  const openConfirm = () => setConfirmOpen(true);
  const place = () => {
    setConfirmOpen(false);
    setPlacing(true);
    if (onSavePayMethod) onSavePayMethod(rememberPayMethod ? payMethod : null);
    const newSubscriptions = items.filter((i) => subscribedKeys.has(i.key)).map((i) => ({ productId: i.productId, productName: i.product.name, sellerName: i.sellerName, unitPrice: withMarkup(i.sellerPrice) * (1 - SUBSCRIBE_DISCOUNT), qty: i.qty, payMethod }));
    const recipient = giftMode && recipientName ? { name: recipientName, phone: recipientPhone } : null;
    setTimeout(() => onPlace(total, Math.min(pointsApplied, maxRedeemable), instructions, schedule === "custom" ? customTime : null, productPayable, newSubscriptions, payMethod, walletCovered, transferProofPhoto, tipPoints, topUpPoints, recipient), 900);
  };

  return (
    <div className="section-pad">
      {confirmOpen && <OrderConfirmModal items={items} recommended={recommended} onConfirm={place} onAddRec={(p) => { onAddToCart(p); }} onCancel={() => setConfirmOpen(false)} />}
      <div className="panel enter" style={{ maxWidth: 560 }}>
        <div className="panel-title">Checkout</div>

        <div className="addr-anchor">
          <button className="flag-row nav-flag" style={{ marginBottom: 12 }} onClick={() => setAddrOpen((o) => !o)}>
            <MapPin size={15} /><div className="ti-mid"><div className="card-name">{selectedAddr.label}</div><div className="muted">{selectedAddr.addr}</div></div><span className="link-btn">Change</span>
          </button>
          {addrOpen && (
            <div className="addr-dropdown">
              {ADDRESSES.map((a) => (
                <button key={a.label} className="notif-row" onClick={() => { setSelectedAddr(a); setAddrOpen(false); }}>
                  <MapPin size={14} /><div className="ti-mid"><div className="card-name">{a.label}</div><div className="muted small">{a.addr}</div></div>
                  {selectedAddr.label === a.label && <Check size={14} color="#16A34A" />}
                </button>
              ))}
              <button className="notif-row" onClick={() => setAddrOpen(false)}><Plus size={14} /><div className="ti-mid muted">Add a new address</div></button>
            </div>
          )}
        </div>

        <div className="field" style={{ marginBottom: 10 }}>
          <span>Delivery time</span>
          <select className="sort-select" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
            <option value="asap">As soon as possible{isPeakHour() ? " -- popular right now, short delay expected" : ""}</option>
            <option value="1h">In 1 hour</option>
            <option value="evening">This evening (6-8pm) -- a popular window, book early</option>
            <option value="tomorrow">Tomorrow morning</option>
            <option value="custom">Choose a specific time...</option>
          </select>
        </div>
        {schedule === "custom" && (
          <div className="field" style={{ marginBottom: 10 }}>
            <span>Preferred delivery time</span>
            <input type="datetime-local" value={customTime} onChange={(e) => setCustomTime(e.target.value)} />
          </div>
        )}
        <div className="field" style={{ marginBottom: 14 }}>
          <label className="subscribe-toggle-label"><input type="checkbox" checked={giftMode} onChange={(e) => setGiftMode(e.target.checked)} /> Deliver to someone else</label>
          {giftMode && (
            <>
              {savedRecipients && savedRecipients.length > 0 && (
                <div className="chip-row" style={{ marginTop: 8, marginBottom: 4 }}>
                  {savedRecipients.map((r) => (
                    <button key={r.name} type="button" className={`chip ${recipientName === r.name ? "active" : ""}`} onClick={() => { setRecipientName(r.name); setRecipientPhone(r.phone); }}>{r.name}</button>
                  ))}
                </div>
              )}
              <div className="cat-top" style={{ gap: 8, marginTop: 8 }}>
                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient's name" style={{ flex: 1 }} />
                <input type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="Recipient's phone" style={{ flex: 1 }} />
              </div>
            </>
          )}
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <span>Delivery instructions (optional)</span>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            {["Leave at door", "Call on arrival", "Hand to me directly", "Gate code needed"].map((preset) => (
              <button key={preset} type="button" className={`chip ${instructionPreset === preset ? "active" : ""}`} onClick={() => { setInstructionPreset(preset); setInstructions(preset); }}>{preset}</button>
            ))}
          </div>
          <input type="text" value={instructions} onChange={(e) => { setInstructions(e.target.value); setInstructionPreset(""); }} placeholder="e.g. Blue gate, second floor, ring twice" />
        </div>

        <div className="list-col" style={{ marginBottom: 6 }}>
          {peak && baseDelivery > 0 && (
            <div className="surge-note"><Flame size={13} /> Delivery fees are higher right now due to demand -- normal pricing resumes at {peakEndsAt()}.</div>
          )}
          {items.map((i) => (
            <div key={i.key}>
              <div className="cat-top"><span className="muted">{i.qty} x {i.product.name} <span className="muted small">({i.sellerName})</span></span><span className="mono">{naira(withMarkup(itemLineTotal(i)))}</span></div>
              <label className="subscribe-toggle-label"><input type="checkbox" checked={subscribedKeys.has(i.key)} onChange={() => toggleSubscribe(i.key)} /> Subscribe & Save 1% -- auto-reorder every 2 weeks, charged to this order's payment method</label>
            </div>
          ))}
          {pointsApplied > 0 && <div className="cat-top"><span className="muted">Points applied</span><span className="mono" style={{ color: "#16A34A" }}>-{naira(Math.min(pointsApplied, maxRedeemable))}</span></div>}
          {wheelDiscountPct > 0 && <div className="cat-top"><span className="muted">Spin-the-wheel reward -- {wheelDiscountPct}% off</span><span className="mono" style={{ color: "#16A34A" }}>-{naira((sellerSubtotal + platformFee) * wheelDiscountPct / 100)}</span></div>}
          <div className="cat-top"><span className="muted">Delivery {peak && !deliveryRewardWon && <span className="status-pill route">Peak hours -- until {peakEndsAt()}</span>} {deliveryRewardWon && <span className="status-pill done">{deliveryRewardPct(activeDiscount)}% off reward</span>}</span><span className="mono">{naira(delivery)}</span></div>
          {tipPoints > 0 && <div className="cat-top"><span className="muted">Rider tip</span><span className="mono">{tipPoints.toLocaleString()} pts</span></div>}
          {topUpPoints > 0 && <div className="cat-top"><span className="muted">Point top-up ({topUpPoints} pts)</span><span className="mono">{naira(topUpPoints)}</span></div>}
          <div className="cat-top" style={{ fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: 8 }}><span>Total</span><span className="mono">{naira(total)}</span></div>
        </div>

        {maxRedeemable > 0 && (
          <div className="points-redeem-box">
            <div className="cat-top" style={{ marginBottom: 6 }}><span className="card-name">Use points</span><span className="muted small">{points} available</span></div>
            <input type="range" min={0} max={maxRedeemable} value={Math.min(pointsApplied, maxRedeemable)} onChange={(e) => setPointsApplied(Number(e.target.value))} className="points-slider" />
            <div className="cat-top"><span className="muted small">Applying {Math.min(pointsApplied, maxRedeemable)} pts = {naira(Math.min(pointsApplied, maxRedeemable))} off</span><span className="muted small">Max {maxRedeemable}</span></div>
            <div className="muted small" style={{ marginTop: 4 }}>Points only reduce the product cost -- delivery fee is always paid in full.</div>
            {pointsRemainingThisMonth != null && pointsRemainingThisMonth < Math.min(points, Math.floor(productPayable)) && (
              <div className="muted small" style={{ marginTop: 2, color: "#B45309" }}>You've used most of your 15,000-point monthly redemption limit -- {pointsRemainingThisMonth.toLocaleString()} left to spend this month.</div>
            )}
          </div>
        )}

        <div className="field" style={{ marginBottom: 14 }}>
          <span>Tip your rider</span>
          <div className="muted small" style={{ marginBottom: 6 }}>100% goes to the rider, paid in points from your balance -- not naira, so it's never a second bank transfer if you're paying by transfer. The rider gets the naira-equivalent value at payout. {maxTipPoints.toLocaleString()} points available to tip.</div>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            {[0, 50, 100, 200].map((pts) => {
              const capped = Math.min(pts, maxTipPoints);
              return (
                <button key={pts} className={`chip ${tipPoints === capped && (pts !== 0 || tipPoints === 0) ? "active" : ""}`} disabled={pts !== 0 && maxTipPoints === 0} onClick={() => { setTipPoints(capped); setTipCustomInput(""); }}>{pts === 0 ? "No tip" : `${capped.toLocaleString()} pts`}</button>
              );
            })}
          </div>
          <div className="cat-top" style={{ gap: 8 }}>
            <input type="number" min="0" max={maxTipPoints} placeholder="Custom amount (points)" value={tipCustomInput} style={{ flex: 1 }} onChange={(e) => { const v = e.target.value; setTipCustomInput(v); setTipPoints(Math.max(0, Math.min(maxTipPoints, Number(v) || 0))); }} />
          </div>
          {tipPoints > 0 && <div className="muted small" style={{ marginTop: 6 }}>Tipping {tipPoints.toLocaleString()} points -- your rider receives {naira(tipPoints)}.</div>}
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <span>Top up your points?</span>
          <div className="muted small" style={{ marginBottom: 6 }}>Add points to your balance in the same payment -- 1 point = ₦1. These aren't tied to this order; they land in your balance to use on any future order, theme, or game. Skip this if you don't need extra points right now.</div>
          <div className="chip-row">
            {[0, 500, 1000, 2000].map((amt) => {
              const roomLeft = Math.max(0, POINTS_CAP - points);
              const capped = Math.min(amt, roomLeft);
              return (
                <button key={amt} className={`chip ${topUpPoints === capped && amt !== 0 ? "active" : (amt === 0 && topUpPoints === 0 ? "active" : "")}`} disabled={amt !== 0 && roomLeft === 0} onClick={() => setTopUpPoints(capped)}>{amt === 0 ? "No top-up" : `+${capped.toLocaleString()} pts`}</button>
              );
            })}
          </div>
          {points + topUpPoints >= POINTS_CAP && topUpPoints > 0 && <div className="muted small" style={{ marginTop: 6, color: "#B45309" }}>This tops you up to the {POINTS_CAP.toLocaleString()}-point cap.</div>}
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <span>Payment method</span>
          <div className="chip-row">
            <button className={`chip ${payMethod === "card" ? "active" : ""}`} onClick={() => setPayMethod("card")}>Card</button>
            <button className={`chip ${payMethod === "wallet" ? "active" : ""}`} onClick={() => setPayMethod("wallet")}>Wallet</button>
            <button className={`chip ${payMethod === "split" ? "active" : ""}`} onClick={() => setPayMethod("split")}>Split wallet + card</button>
            <button className={`chip ${payMethod === "transfer" ? "active" : ""}`} onClick={() => setPayMethod("transfer")}>Bank transfer</button>
          </div>
          {payMethod !== "card" && payMethod !== "transfer" && (
            <div className="muted small" style={{ marginTop: 8 }}>
              {naira(walletCovered)} from wallet {cardCovered > 0 && <>+ {naira(cardCovered)} on card</>}
              {payMethod === "wallet" && cardCovered > 0 && " (wallet balance isn't enough to cover the rest, so the remainder goes to card)"}
            </div>
          )}
          {payMethod === "transfer" && (
            <div className="transfer-box" style={{ marginTop: 10 }}>
              <div className="muted small" style={{ marginBottom: 6 }}>Transfer exactly {naira(total)} to this account, then upload proof of payment. An admin verifies it before your order moves forward -- this can take a little while.</div>
              <div className="cat-top"><span className="muted small">Bank</span><span className="mono small">Medra Payments MFB</span></div>
              <div className="cat-top"><span className="muted small">Account number</span><span className="mono small">{transferAccountNumber}</span></div>
              <div className="cat-top"><span className="muted small">Amount</span><span className="mono small">{naira(total)}</span></div>
              <div className="field" style={{ marginTop: 10 }}>
                <span>Proof of payment</span>
                <input type="file" ref={transferProofRef} accept="image/*" style={{ display: "none" }} onChange={handleTransferProofUpload} />
                {transferProofPhoto ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <img src={transferProofPhoto} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} />
                    <button className="ghost-btn-sm" onClick={() => setTransferProofPhoto(null)}>Remove</button>
                  </div>
                ) : (
                  <button className="ghost-btn-sm" style={{ marginTop: 6 }} onClick={() => transferProofRef.current?.click()}><ImageIcon size={12} /> Upload screenshot or receipt</button>
                )}
              </div>
            </div>
          )}
          <label className="notify-toggle-label" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={rememberPayMethod} onChange={(e) => setRememberPayMethod(e.target.checked)} />
            Remember this as my default payment method
          </label>
        </div>
        <button className={`primary-btn-sm wide ${placing ? "loading" : ""}`} onClick={openConfirm} disabled={placing || isOffline || (payMethod === "transfer" && !transferProofPhoto)}>{placing ? <span className="spinner" /> : isOffline ? "You're offline -- can't place order" : `Place order - ${naira(total)}`}</button>
      </div>
    </div>
  );
}

function LiveMap({ progress }) {
  const pathRef = useRef(null);
  const [pt, setPt] = useState({ x: 20, y: 110 });
  const d = "M20 110 C 90 20, 180 160, 280 30";
  useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    const p = pathRef.current.getPointAtLength((Math.min(100, progress) / 100) * len);
    setPt({ x: p.x, y: p.y });
  }, [progress]);
  return (
    <div className="map-placeholder live">
      <svg viewBox="0 0 300 130" width="100%" height="130">
        <path ref={pathRef} d={d} fill="none" stroke="#DDD6FE" strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" />
        <circle cx="20" cy="110" r="6" fill="#0F172A" />
        <circle cx="280" cy="30" r="6" fill="#EA580C" />
        <g style={{ transition: "transform 500ms linear" }} transform={`translate(${pt.x} ${pt.y})`}>
          <circle r="8" fill="var(--purple)" className="pulse-dot" />
          <circle r="3" fill="#fff" />
        </g>
      </svg>
    </div>
  );
}

const ISSUE_REASONS = [
  { value: "missing_item", label: "Item missing from order" },
  { value: "wrong_item", label: "Wrong item delivered" },
  { value: "damaged", label: "Item arrived damaged" },
  { value: "late", label: "Delivery was very late" },
  { value: "other", label: "Something else" },
];

function ReportIssueModal({ order, onClose, onSubmit }) {
  const [reason, setReason] = useState("missing_item");
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState(null);
  const [sent, setSent] = useState(false);
  const fileRef = useRef(null);
  const orderCategories = new Set((order.items || []).map((it) => productById(it.productId)?.category).filter(Boolean));
  const hasNonReturnable = orderCategories.has("groceries") || orderCategories.has("pharmacies");
  const reasonBlocked = hasNonReturnable && (reason === "damaged" || reason === "other");
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        {!sent ? (
          <>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Report a problem</div>
            {hasNonReturnable && (
              <div className="cap-warning-banner" style={{ marginBottom: 12 }}>
                <AlertTriangle size={13} />
                This order includes food, medication, or perishable items -- these can't be returned or refunded once delivered for safety reasons. Missing or wrong-item issues are still covered.
              </div>
            )}
            <div className="field" style={{ marginBottom: 10 }}>
              <span>What went wrong?</span>
              <select className="sort-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {ISSUE_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <span>Details (optional)</span>
              <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tell us more" />
            </div>
            {(reason === "damaged" || reason === "wrong_item") && (
              <div className="field" style={{ marginBottom: 10 }}>
                <span>Photo (optional but helps your case)</span>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
                {photo ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src={photo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                    <button className="ghost-btn-sm" onClick={() => setPhoto(null)}>Remove</button>
                  </div>
                ) : (
                  <button className="ghost-btn-sm" onClick={() => fileRef.current?.click()}><ImageIcon size={12} /> Add photo</button>
                )}
              </div>
            )}
            {reasonBlocked && <div className="muted small" style={{ color: "#DC2626", marginBottom: 10 }}>This reason isn't eligible for a refund on food/medication/perishable items. You can still submit it to let the seller know, or choose "Missing item" / "Wrong item" if that's what happened.</div>}
            <button className="primary-btn-sm wide" onClick={() => { setSent(true); onSubmit?.({ reason, details, photo, refundEligible: !reasonBlocked }); }}>Submit report</button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <CircleCheck size={30} color="#16A34A" />
            <div className="card-name" style={{ marginTop: 10 }}>Report submitted</div>
            <div className="muted" style={{ marginTop: 4 }}>Our support team will follow up on order #{order.id}.</div>
            <button className="ghost-btn-sm" style={{ marginTop: 16 }} onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ShareTripModal({ order, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareLink = `https://medra.app/track/${order.id}?token=${order.id.toLowerCase()}live`;
  const copyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 4 }}>Share this trip</div>
        <p className="muted" style={{ marginBottom: 14 }}>Anyone with this link can see live delivery progress for order #{order.id} -- no account needed.</p>
        <div className="share-link-box">
          <span className="mono small">{shareLink}</span>
          <button className="ghost-btn-sm" onClick={copyLink}><Copy size={12} /> {copied ? "Copied!" : "Copy"}</button>
        </div>
      </div>
    </div>
  );
}

function TrackingScreen({ order, driver, onRate, onCancel, onTip, onEdit, onTogglePause, onReportSubmitted, onConfirmDelivery, points, onGetHelp }) {
  const [chatMsgs, setChatMsgs] = useState([{ from: "driver", text: "On my way to pick up your order!" }]);
  const [chatInput, setChatInput] = useState("");
  const [tipped, setTipped] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [callToast, setCallToast] = useState(false);
  const etaMinutesLeft = order ? Math.max(0, Math.ceil(((100 - order.progress) / 100) * 35)) : 0;
  const isDone = order?.status === "delivered" || order?.status === "cancelled";
  const [liveEtaSeconds, setLiveEtaSeconds] = useState(etaMinutesLeft * 60);
  useEffect(() => { setLiveEtaSeconds(etaMinutesLeft * 60); }, [etaMinutesLeft]);
  useEffect(() => {
    if (!order || isDone) return;
    const t = setInterval(() => setLiveEtaSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [order, isDone]);
  if (!order) return <div className="section-pad"><div className="panel enter empty-note"><Inbox size={20} style={{ opacity: 0.4, marginBottom: 6 }} /><div>No active order.</div></div></div>;
  const delivered = order.status === "delivered";
  const cancelled = order.status === "cancelled";
  const canCancel = order.status === "placed";
  const liveMin = Math.floor(liveEtaSeconds / 60);
  const liveSec = liveEtaSeconds % 60;

  const PRE_TRACKING_STAGES = {
    verifying_payment: { label: "Verifying your payment", desc: "An admin is checking the transfer you sent -- this usually doesn't take long." },
    payment_verified: { label: "Payment verified -- waiting for the seller", desc: "Your payment has been confirmed. The seller has been notified and needs to accept your order." },
    seller_preparing: { label: "Seller is preparing your order", desc: "The seller has confirmed and is getting your order ready. A rider can pick it up as soon as it's ready." },
  };
  if (order.sharedOrder && PRE_TRACKING_STAGES[order.status]) {
    const stage = PRE_TRACKING_STAGES[order.status];
    const stageKeys = Object.keys(PRE_TRACKING_STAGES);
    const stageIdx2 = stageKeys.indexOf(order.status);
    return (
      <div className="section-pad">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Order #{order.id}</div><span className="status-pill prep">{stage.label}</span></div>
          <div className="muted small" style={{ marginBottom: 16 }}>{stage.desc}</div>
          <div className="list-col">
            {stageKeys.map((key, i) => (
              <div key={key} className="cat-top">
                {i <= stageIdx2 ? <CircleCheck size={14} color="#16A34A" /> : <Circle size={14} color="var(--muted)" />}
                <span className={`muted small ${i <= stageIdx2 ? "" : ""}`} style={{ fontWeight: i === stageIdx2 ? 700 : 400 }}>{PRE_TRACKING_STAGES[key].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const SHARED_LATER_STAGES = ["rider_assigned", "picked_up", "on_the_way", "delivered_awaiting_customer_confirm", "delivered"];
  if (order.sharedOrder && SHARED_LATER_STAGES.includes(order.status)) {
    const shared = order.sharedData || {};
    const rider = shared.riderInfo;
    const labels = {
      rider_assigned: "Rider assigned",
      picked_up: "A rider picked up your order",
      on_the_way: "Rider on the way",
      delivered_awaiting_customer_confirm: "Your rider says this was delivered",
      delivered: "Delivered",
    };
    return (
      <div className="section-pad">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Order #{order.id}</div><span className={`status-pill ${order.status === "delivered" ? "done" : "route"}`}>{labels[order.status]}</span></div>
          {rider && (
            <div className="cat-top" style={{ marginBottom: 10 }}>
              <div className="driver-avatar sm">{rider.nickname[0]}</div>
              <div className="ti-mid"><div className="card-name" style={{ fontSize: 13 }}>{rider.nickname}</div><div className="muted small">{rider.phone}</div></div>
            </div>
          )}
          {order.status === "on_the_way" && <div className="muted small" style={{ marginBottom: 12 }}><Clock size={11} style={{ verticalAlign: "middle" }} /> ETA ~{shared.etaMinutes || 15} minutes</div>}
          {order.status === "delivered_awaiting_customer_confirm" && (
            <>
              <div className="muted small" style={{ marginBottom: 12 }}>Confirm you actually received this so it can be marked delivered for real.</div>
              <button className="primary-btn-sm wide" onClick={() => onConfirmDelivery?.(order.id)}>Confirm I received my order</button>
            </>
          )}
          {order.status === "delivered" && (
            <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle", color: "#16A34A" }} /> Both you and your rider have confirmed this delivery.</div>
          )}
        </div>
      </div>
    );
  }

  const sendMsg = (text) => {
    const msg = text ?? chatInput;
    if (!msg.trim()) return;
    setChatMsgs((m) => [...m, { from: "me", text: msg }]);
    setChatInput("");
    setTimeout(() => setChatMsgs((m) => [...m, { from: "driver", text: draftDriverReply(msg) }]), 700);
  };
  const callDriver = () => {
    setCallToast(true);
    setTimeout(() => setCallToast(false), 2500);
  };

  return (
    <div className="section-pad">
      {reportOpen && <ReportIssueModal order={order} onClose={() => setReportOpen(false)} onSubmit={onReportSubmitted} />}
      {shareOpen && <ShareTripModal order={order} onClose={() => setShareOpen(false)} />}
      {callToast && <div className="switch-toast"><PhoneCall size={14} /> Calling {driver?.name}...</div>}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Order #{order.id}</div><StatusPill status={cancelled ? "Cancelled" : delivered ? "Delivered" : order.status === "scheduled" ? "Scheduled" : "Out for Delivery"} /></div>
        {order.recipient && <div className="instructions-note"><Users size={11} /> Delivering to {order.recipient.name}{order.recipient.phone ? ` -- ${order.recipient.phone}` : ""} (not you)</div>}
        {order.instructions && <div className="instructions-note"><PenLine size={11} /> Delivery note: {order.instructions}</div>}
        {onGetHelp && <button className="link-btn" style={{ marginTop: 6 }} onClick={() => onGetHelp(order.id)}><LifeBuoy size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />Get help with this order</button>}
        {!cancelled && !delivered && order.status !== "scheduled" && (
          <div className="eta-countdown"><Clock size={13} /> Arriving in ~{liveMin}:{String(liveSec).padStart(2, "0")} <button className="link-btn" style={{ marginLeft: "auto" }} onClick={() => setShareOpen(true)}><Navigation size={11} style={{ verticalAlign: "middle" }} /> Share trip</button></div>
        )}
        {order.status === "scheduled" && !cancelled && (
          <div className="scheduled-note">
            <Clock size={13} /> Scheduled for {order.scheduledFor?.replace("T", " ") || "your chosen time"}. {order.paused ? "Paused -- won't be prepared until resumed." : "We'll start preparing it closer to the scheduled time."}
            <button className="ghost-btn-sm" style={{ marginLeft: "auto" }} onClick={() => onTogglePause(order.id)}>{order.paused ? "Resume" : "Pause"}</button>
          </div>
        )}
        {cancelled ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}><XCircle size={22} /></div>
            <div className="card-name" style={{ marginTop: 10 }}>This order was cancelled</div>
            <div className="muted" style={{ marginTop: 4 }}>No charge was made. You can place a new order any time.</div>
          </div>
        ) : (
          <>
            <LiveMap progress={order.progress} />
            <div className="track-steps" style={{ marginTop: 14 }}>
              {STAGES.map((s) => (
                <div key={s.key} className={`track-step ${order.progress >= s.at ? "done" : ""}`}>
                  <span className="track-dot">{order.progress >= s.at && <Check size={9} />}</span>
                  <span className="muted small">{s.label}</span>
                  {order.stageTimestamps?.[s.key] && <span className="muted small track-time">{order.stageTimestamps[s.key]}</span>}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {canCancel && <button className="cancel-btn" style={{ color: "#2563EB", borderColor: "#BFDBFE" }} onClick={onEdit}><PenLine size={14} /> Edit order</button>}
          {canCancel && <button className="cancel-btn" onClick={onCancel}><XCircle size={14} /> Cancel order</button>}
          {delivered && <button className="cancel-btn" style={{ color: "#7C3AED", borderColor: "#DDD6FE" }} onClick={() => setReportOpen(true)}><AlertTriangle size={14} /> Report a problem</button>}
        </div>

        {!delivered && !cancelled && driver && (
          <div className="chat-block">
            <div className="pending-row" style={{ marginBottom: 10 }}>
              <div className="driver-avatar sm">{driver.initials}</div>
              <div className="ti-mid"><div className="card-name">{driver.name}</div><div className="muted">{driver.vehicle}</div></div>
              <button className="icon-btn" onClick={callDriver} aria-label="Call driver"><Phone size={15} /></button>
            </div>
            <div className="chat-thread">
              {chatMsgs.map((m, i) => <div key={i} className={`chat-bubble ${m.from}`}>{m.text}</div>)}
            </div>
            <div className="chip-row" style={{ margin: "8px 0" }}>
              {["I'm downstairs", "Leave it at the gate", "How far are you?"].map((q) => (
                <button key={q} className="chip" onClick={() => sendMsg(q)}>{q}</button>
              ))}
            </div>
            <div className="reply-row">
              <input placeholder="Message your driver..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} />
              <button className="primary-btn-sm" onClick={() => sendMsg()}><Send size={13} /></button>
            </div>
          </div>
        )}

        {delivered && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <div className="muted" style={{ marginBottom: 8 }}>Rate your delivery</div>
            <div className="stars-row" style={{ justifyContent: "center" }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={22} fill={i < (order.rating || 0) ? "#F59E0B" : "none"} color="#F59E0B" style={{ cursor: "pointer" }} onClick={() => onRate(i + 1)} />)}</div>
            <div className="muted" style={{ margin: "14px 0 4px" }}>Tip {driver?.name.split(" ")[0]} -- paid in points, not naira</div>
            {isPeakHour() && <div className="muted small" style={{ marginBottom: 8, color: "#EA580C" }}><Flame size={11} style={{ verticalAlign: "middle" }} /> It was peak hours -- your rider likely worked through heavy demand, suggested amounts are a bit higher.</div>}
            <div className="tip-row">
              {(isPeakHour() ? [150, 300, 750] : [100, 200, 500]).map((amt) => (
                <button key={amt} className={`tip-btn ${tipped === amt ? "on" : ""}`} disabled={points != null && amt > points} onClick={() => { setTipped(amt); onTip(amt); }}>{amt.toLocaleString()} pts</button>
              ))}
            </div>
            {tipped > 0 && <div className="muted small" style={{ marginTop: 6 }}><ThumbsUp size={12} /> Thanks for the {tipped.toLocaleString()}-point tip!</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function RatingPromptModal({ order, onRate, onClose }) {
  const [hover, setHover] = useState(0);
  if (!order) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <PartyPopper size={26} color="#F59E0B" />
        <div className="card-name" style={{ fontSize: 16, margin: "10px 0 4px" }}>Order delivered!</div>
        <div className="muted" style={{ marginBottom: 14 }}>How was your order #{order.id}?</div>
        <div className="stars-row" style={{ justifyContent: "center", marginBottom: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={28} fill={i < hover ? "#F59E0B" : "none"} color="#F59E0B" style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(i + 1)} onMouseLeave={() => setHover(0)} onClick={() => onRate(order.id, i + 1)} />
          ))}
        </div>
        <button className="link-btn" onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}

function ReceiptModal({ order, onClose }) {
  if (!order) return null;
  const items = (order.items || []).map((c) => ({ ...c, product: productById(c.productId) }));
  const sellerSubtotal = items.reduce((s, i) => s + i.sellerPrice * i.qty, 0);
  const itemsTotal = Math.round(withMarkup(sellerSubtotal));
  const deliveryCharge = Math.max(0, order.total - itemsTotal);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close no-print" onClick={onClose}><X size={16} /></button>
        <div id="receipt-printable">
          <div className="card-name" style={{ fontSize: 16, marginBottom: 2 }}>Receipt</div>
          <div className="muted small" style={{ marginBottom: 16 }}>Order #{order.id} -- paid via Medra</div>
          <div className="list-col">
            {items.map((i) => <div key={i.key} className="cat-top"><span className="muted">{i.qty} x {i.product?.name}</span><span className="mono">{naira(withMarkup(i.sellerPrice * i.qty))}</span></div>)}
            <div className="cat-top" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}><span className="muted">Items</span><span className="mono">{naira(itemsTotal)}</span></div>
            <div className="cat-top"><span className="muted">Delivery</span><span className="mono">{naira(deliveryCharge)}</span></div>
            <div className="cat-top" style={{ fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: 8 }}><span>Total paid</span><span className="mono">{naira(order.total)}</span></div>
          </div>
        </div>
        <button className="ghost-btn-sm wide no-print" style={{ marginTop: 16 }} onClick={() => window.print()}><FileDown size={13} /> Download / Print Receipt</button>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-row">
      <button className="ghost-btn-sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button>
      <span className="muted small">Page {page} of {totalPages}</span>
      <button className="ghost-btn-sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>
  );
}

const ORDERS_PER_PAGE = 4;

function ReorderModifyModal({ order, onClose, onConfirm }) {
  const baseItems = order.items || RECENT_ORDERS.find((o) => o.id === order.id)?.items || [];
  const [qtys, setQtys] = useState(Object.fromEntries(baseItems.map((i) => [i.key || i.productId, i.qty || 1])));
  const setQty = (key, delta) => setQtys((q) => ({ ...q, [key]: Math.max(0, (q[key] || 0) + delta) }));
  const finalItems = baseItems.map((i) => ({ ...i, qty: qtys[i.key || i.productId] })).filter((i) => i.qty > 0);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 4 }}>Edit before reordering</div>
        <div className="muted small" style={{ marginBottom: 14 }}>From order #{order.id} -- adjust quantities or remove items before adding to cart.</div>
        <div className="list-col" style={{ marginBottom: 16 }}>
          {baseItems.map((i) => {
            const key = i.key || i.productId;
            const p = productById(i.productId);
            return (
              <div key={key} className="cat-top">
                <span className="muted small" style={{ flex: 1 }}>{p?.name || "Item"}</span>
                <div className="stepper-sm"><button onClick={() => setQty(key, -1)}><Minus size={12} /></button><span>{qtys[key] || 0}</span><button onClick={() => setQty(key, 1)}><Plus size={12} /></button></div>
              </div>
            );
          })}
        </div>
        <button className="primary-btn-sm wide" disabled={finalItems.length === 0} onClick={() => onConfirm(finalItems)}>Add {finalItems.reduce((s, i) => s + i.qty, 0)} item{finalItems.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""} to cart</button>
      </div>
    </div>
  );
}

function OrdersScreen({ orders, onReorder, onReorderModify, onCancel, returnRequests }) {
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const merged = orders.map((o) => ({ id: o.id, vendor: "Medra Order", date: "Today", total: o.total, status: o.status === "delivered" ? "Delivered" : o.status === "placed" ? "Placed" : "Out for Delivery", cancellable: o.status === "placed", live: true, items: o.items })).reverse().concat(RECENT_ORDERS);
  const filtered = merged.filter((o) => {
    const matchesQuery = !query.trim() || o.vendor.toLowerCase().includes(query.trim().toLowerCase()) || o.id.toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesMin = !minAmount || o.total >= Number(minAmount);
    const matchesMax = !maxAmount || o.total <= Number(maxAmount);
    return matchesQuery && matchesStatus && matchesMin && matchesMax;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
  const pageItems = filtered.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);
  const statusOptions = ["all", ...new Set(merged.map((o) => o.status))];
  return (
    <div className="section-pad">
      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
      {returnRequests && returnRequests.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Your Return & Refund Requests</div>
          <div className="list-col">
            {returnRequests.map((r) => (
              <div key={r.id} className="pending-row">
                {r.photo && <img src={r.photo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />}
                <div className="ti-mid"><div className="card-name">Order #{r.orderId}</div><div className="muted small">{ISSUE_REASONS.find((x) => x.value === r.reason)?.label || r.reason} -- submitted {r.submittedAt}</div></div>
                <span className={`status-pill ${r.refundEligible ? "prep" : "delay"}`}>{r.refundEligible ? r.status : "not eligible"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title">My Orders</div>
        <div className="cat-top" style={{ marginBottom: 12, gap: 10 }}>
          <div className="search-wrap-cu" style={{ flex: 1, marginBottom: 0 }}>
            <Search size={14} /><input placeholder="Search by store or order number..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
            {query && <button onClick={() => setQuery("")}><X size={13} /></button>}
          </div>
          <select className="sort-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            {statusOptions.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
          </select>
        </div>
        <div className="cat-top" style={{ marginBottom: 12, gap: 10 }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}><span className="muted small">Min amount (\u20a6)</span><input type="number" min="0" value={minAmount} onChange={(e) => { setMinAmount(e.target.value); setPage(1); }} placeholder="No minimum" /></div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}><span className="muted small">Max amount (\u20a6)</span><input type="number" min="0" value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }} placeholder="No maximum" /></div>
          {(minAmount || maxAmount) && <button className="ghost-btn-sm" onClick={() => { setMinAmount(""); setMaxAmount(""); }}>Clear</button>}
        </div>
        {filtered.length === 0 ? <EmptyState icon={Search} title="No orders match your search" sub="Try a different store name, order number, or status." /> : (
          <div className="list-col">
            {pageItems.map((o) => (
              <div key={o.id} className="order-row-full">
                <div className="ti-mid"><div className="card-name">{o.vendor}</div><div className="muted small">{o.date} - Order #{o.id}</div></div>
                <div className="mono" style={{ marginRight: 8 }}>{naira(o.total)}</div>
                <StatusPill status={o.status} />
                {o.live && <button className="reorder-btn" onClick={() => setReceiptOrder(o)}><Receipt size={12} /> Receipt</button>}
                {o.status === "Delivered" && <button className="reorder-btn" onClick={() => onReorder(o)}><RotateCcw size={12} /> Reorder</button>}
                {o.status === "Delivered" && onReorderModify && <button className="ghost-btn-sm" onClick={() => onReorderModify(o)}>Reorder (edit first)</button>}
                {o.cancellable && <button className="cancel-btn sm" onClick={() => onCancel(o.id)}><XCircle size={12} /> Cancel</button>}
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

function WishlistScreen({ wishlist, onOpenProduct, toggleWishlist, onBrowse, notifyPrefs, toggleNotifyPref, setAllNotifyPrefs, onAddAllToCart }) {
  const items = PRODUCTS.filter((p) => wishlist.has(p.id));
  const allOn = items.length > 0 && items.every((p) => notifyPrefs[p.id]?.priceDrop && notifyPrefs[p.id]?.backInStock);
  // Grouped by category so alerts can be toggled per-category, not just
  // all-or-nothing across the whole wishlist.
  const categories = [...new Set(items.map((p) => p.category))];
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Wishlist</div>
          <div style={{ display: "flex", gap: 6 }}>
            {items.length > 0 && <button className="ghost-btn-sm" onClick={onAddAllToCart}><ShoppingCart size={12} style={{ verticalAlign: "middle" }} /> Add all to cart</button>}
            {items.length > 0 && <button className="ghost-btn-sm" onClick={() => setAllNotifyPrefs(items.map((p) => p.id), !allOn)}>{allOn ? "Turn off all alerts" : "Turn on all alerts"}</button>}
          </div>
        </div>
        {categories.length > 1 && (
          <div className="chip-row" style={{ marginBottom: 12 }}>
            {categories.map((cat) => {
              const catItems = items.filter((p) => p.category === cat);
              const catAllOn = catItems.every((p) => notifyPrefs[p.id]?.priceDrop && notifyPrefs[p.id]?.backInStock);
              const catLabel = CATEGORIES.find((c) => c.key === cat)?.label || cat;
              return (
                <button key={cat} className="ghost-btn-sm" onClick={() => setAllNotifyPrefs(catItems.map((p) => p.id), !catAllOn)}>
                  {catAllOn ? "Mute" : "Alert"} {catLabel} ({catItems.length})
                </button>
              );
            })}
          </div>
        )}
        {items.length === 0 ? <EmptyState icon={Heart} title="Nothing saved yet" sub="Tap the heart on any product to add it here." actionLabel="Browse products" onAction={onBrowse} /> : (
          <div className="wishlist-grid">
            {items.map((p) => {
              const prefs = notifyPrefs[p.id] || { priceDrop: false, backInStock: false };
              return (
                <div key={p.id} className="wishlist-card">
                  <div className="prod-img-wrap" onClick={() => onOpenProduct(p)} style={{ cursor: "pointer" }}>
                    <img src={img(p.seed)} alt={p.name} />
                    <button className="wish-btn on" onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}><Heart size={14} fill="#DC2626" color="#DC2626" /></button>
                  </div>
                  <div className="prod-name">{p.name}</div>
                  <div className="mono" style={{ padding: "0 10px", fontWeight: 700, fontSize: 13 }}>{naira(withMarkup(p.price))}</div>
                  <div className="wishlist-notify-row">
                    <label className="notify-toggle-label"><input type="checkbox" checked={prefs.priceDrop} onChange={() => toggleNotifyPref(p.id, "priceDrop")} /> Notify on price drop</label>
                    <label className="notify-toggle-label"><input type="checkbox" checked={prefs.backInStock} onChange={() => toggleNotifyPref(p.id, "backInStock")} /> Notify if back in stock</label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {(() => {
        const alertedItems = items.filter((p) => notifyPrefs[p.id]?.priceDrop);
        if (alertedItems.length === 0) return null;
        return (
          <div className="panel enter">
            <div className="panel-title" style={{ fontSize: 13 }}>Price Alert History</div>
            <div className="muted small" style={{ marginBottom: 10 }}>Past drops on items you've turned price alerts on for.</div>
            <div className="list-col">
              {alertedItems.map((p) => {
                const h = [...p.id].reduce((s, c) => s + c.charCodeAt(0), 0);
                const dropPct = 8 + (h % 20);
                const oldPrice = Math.round(p.price / (1 - dropPct / 100));
                const daysAgo = 1 + (h % 12);
                return (
                  <div key={p.id} className="cat-top">
                    <span className="muted small">{p.name}</span>
                    <span className="muted small"><span style={{ textDecoration: "line-through" }}>{naira(oldPrice)}</span> {"->"} <b style={{ color: "#16A34A" }}>{naira(p.price)}</b> ({daysAgo}d ago)</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function FavoriteStoresScreen({ favoriteStores, onOpenStore, onToggleFavorite, notifyStores, onToggleNotify }) {
  const [filter, setFilter] = useState("all");
  const stores = [...favoriteStores].map((name) => SAVED_STORES.find((s) => s.name === name) || { name, category: "", rating: 4.5 });
  const isPharmacy = (s) => (s.category || "").toLowerCase().includes("pharmac");
  const filtered = filter === "pharmacy" ? stores.filter(isPharmacy) : stores;
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Favorite Stores</div>
        <div className="chip-row" style={{ marginBottom: 12 }}>
          <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All ({stores.length})</button>
          <button className={`chip ${filter === "pharmacy" ? "active" : ""}`} onClick={() => setFilter("pharmacy")}>Pharmacies ({stores.filter(isPharmacy).length})</button>
        </div>
        {filtered.length === 0 ? <EmptyNote>No favorite stores yet -- open any seller's storefront and tap Favorite.</EmptyNote> : (
          <div className="list-col">
            {filtered.map((s) => (
              <div key={s.name} className="pending-row">
                <div className="driver-avatar" style={{ background: "#EA580C" }}>{s.name[0]}</div>
                <button className="ti-mid" style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer" }} onClick={() => onOpenStore(s.name)}><div className="card-name">{s.name}</div><div className="muted small"><Stars value={s.rating} size={10} /> {s.rating}{s.category ? ` -- ${s.category}` : ""}</div></button>
                <button className="ghost-btn-sm" title="Notify me of new products" style={notifyStores && notifyStores.has(s.name) ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => onToggleNotify && onToggleNotify(s.name)}><Bell size={12} /></button>
                <button className="ghost-btn-sm" onClick={() => onToggleFavorite(s.name)}><Heart size={13} fill="#DC2626" color="#DC2626" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StorefrontModal({ store, onClose, onOpenProduct, wishlist, toggleWishlist, isFavorite, onToggleFavorite, orders, onReorderItems }) {
  const [storeInfoOpen, setStoreInfoOpen] = useState(false);
  useEffect(() => setStoreInfoOpen(false), [store?.name]);
  if (!store) return null;
  const items = PRODUCTS.filter((p) => getSellersForProduct(p).some((s) => s.vendor === store.name));
  const lastOrderFromStore = (orders || []).slice().reverse().find((o) => (o.items || []).some((it) => it.sellerName === store.name));
  const reorderItems = lastOrderFromStore ? lastOrderFromStore.items.filter((it) => it.sellerName === store.name).map((it) => productById(it.productId)).filter(Boolean) : [];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="storefront-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="pending-row" style={{ marginBottom: 16 }}>
          <div className="driver-avatar" style={{ width: 48, height: 48, fontSize: 16, background: "#EA580C", borderRadius: 12 }}>{store.name[0]}</div>
          <div className="ti-mid"><div className="card-name" style={{ fontSize: 16 }}>{store.name}</div><div className="muted"><Stars value={store.rating} size={11} /> {store.rating} -- {store.category}</div>
            {store.responseTime && <div className="response-badge"><Clock size={11} /> {store.responseTime}</div>}
          </div>
          {onToggleFavorite && <button className="ghost-btn-sm" onClick={() => onToggleFavorite(store.name)}><Heart size={13} fill={isFavorite ? "#DC2626" : "none"} color={isFavorite ? "#DC2626" : "currentColor"} /> {isFavorite ? "Favorited" : "Favorite"}</button>}
        </div>
        {reorderItems.length > 0 && (
          <button className="ghost-btn-sm" style={{ marginBottom: 12 }} onClick={() => onReorderItems(reorderItems)}><RotateCcw size={12} style={{ verticalAlign: "middle" }} /> Reorder your last order from here ({reorderItems.length} item{reorderItems.length !== 1 ? "s" : ""})</button>
        )}
        {(() => {
          // Not every store runs a loyalty program -- deterministic per
          // store name so it's stable, standing in for a real per-seller
          // "loyalty enabled" flag until that's shared across apps.
          const storeHash = [...store.name].reduce((s, c) => s + c.charCodeAt(0), 0);
          if (storeHash % 3 === 0) return null; // roughly 2/3 of stores run one
          const threshold = 6 + (storeHash % 5);
          const ordersFromStore = (orders || []).filter((o) => (o.items || []).some((it) => it.sellerName === store.name)).length;
          const stamps = Math.min(ordersFromStore, threshold);
          return (
            <div className="panel enter" style={{ marginBottom: 12, padding: 12 }}>
              <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small" style={{ fontWeight: 700 }}>{store.name}'s loyalty card</span><span className="mono small">{stamps}/{threshold}</span></div>
              <div className="bar-track"><div className="bar-fill-h" style={{ width: `${(stamps / threshold) * 100}%`, background: stamps >= threshold ? "#16A34A" : "#7C3AED" }} /></div>
              <div className="muted small" style={{ marginTop: 4 }}>{stamps >= threshold ? "Your next order here is free!" : `${threshold - stamps} more order${threshold - stamps !== 1 ? "s" : ""} until a free item.`}</div>
            </div>
          );
        })()}
        {store.about && <p className="muted small" style={{ marginBottom: 12 }}>{store.about}</p>}
        {(store.hours || store.policies) && (
          <div style={{ marginBottom: 16 }}>
            <button className="link-btn" onClick={() => setStoreInfoOpen((o) => !o)}>{storeInfoOpen ? "Hide store info" : "Store hours & policies"}</button>
            {storeInfoOpen && (
              <div className="list-col" style={{ marginTop: 8 }}>
                {store.hours && <div className="muted small" style={{ display: "flex", gap: 6 }}><Clock size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {store.hours}</div>}
                {store.policies && <div className="muted small" style={{ display: "flex", gap: 6 }}><ShieldCheck size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {store.policies}</div>}
              </div>
            )}
          </div>
        )}
        <div className="panel-title">Products from this seller</div>
        {items.length === 0 ? <EmptyNote>No listings from this seller right now.</EmptyNote> : (
          <div className="prod-grid">
            {items.map((p) => <ProductCard key={p.id} p={p} onOpen={(pp) => { onClose(); onOpenProduct(pp); }} wished={wishlist.has(p.id)} onToggleWish={toggleWishlist} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function WalletScreen({ wallet, points, onConvert, cards, walletTx, onTopUp, autoTopUp, setAutoTopUp }) {
  const [amount, setAmount] = useState(500);
  const room = POINTS_CAP - points;
  const maxConvert = Math.max(0, Math.min(wallet, room));
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const defaultCardIdx = cards.findIndex((c) => c.isDefault);
  const [topUpMethod, setTopUpMethod] = useState(cards[0] ? `card-${defaultCardIdx >= 0 ? defaultCardIdx : 0}` : "transfer");
  const [paying, setPaying] = useState(false);
  const [topUpProofPhoto, setTopUpProofPhoto] = useState(null);
  const topUpProofRef = useRef(null);
  const presets = [1000, 2000, 5000, 10000];

  const handleTopUpProof = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTopUpProofPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const pay = () => {
    const amt = Number(topUpAmount);
    if (!amt || amt <= 0) return;
    if (topUpMethod === "transfer" && !topUpProofPhoto) return;
    setPaying(true);
    setTimeout(() => {
      onTopUp(amt, topUpMethod.startsWith("card") ? cards[Number(topUpMethod.split("-")[1])] : "Bank transfer");
      setPaying(false);
      setTopUpOpen(false);
      setTopUpAmount("");
      setTopUpProofPhoto(null);
    }, 900);
  };

  return (
    <div className="section-pad">
      <div className="panel enter" style={{ textAlign: "center", padding: 30 }}>
        <div className="muted">Wallet balance</div>
        <div className="kpi-value" style={{ fontSize: 30 }}>{naira(wallet)}</div>
        <button className="primary-btn-sm" style={{ marginTop: 12 }} onClick={() => setTopUpOpen(true)}>Top up wallet</button>
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Low balance alerts</div>
          <button className={`toggle-mini ${autoTopUp.enabled ? "on" : ""}`} onClick={() => setAutoTopUp((a) => ({ ...a, enabled: !a.enabled }))}><span /></button>
        </div>
        <div className="muted small" style={{ marginBottom: autoTopUp.enabled ? 10 : 0 }}>We'll send you a notification to top up when your balance drops below a set amount -- we don't auto-charge anything, since most customers top up by bank transfer.</div>
        {autoTopUp.enabled && (
          <div className="cat-top" style={{ gap: 8 }}>
            <label className="field" style={{ flex: 1 }}><span className="muted small">When balance falls below</span><input type="number" min="0" value={autoTopUp.threshold} onChange={(e) => setAutoTopUp((a) => ({ ...a, threshold: Math.max(0, Number(e.target.value) || 0) }))} /></label>
            <label className="field" style={{ flex: 1 }}><span className="muted small">Suggested top-up amount</span><input type="number" min="0" value={autoTopUp.amount} onChange={(e) => setAutoTopUp((a) => ({ ...a, amount: Math.max(0, Number(e.target.value) || 0) }))} /></label>
          </div>
        )}
        {autoTopUp.enabled && (() => {
          // Rough preview so the settings aren't just two blind numbers --
          // estimates how often this would actually fire, based on recent
          // real spending in the transaction history.
          const recentSpends = (walletTx || []).filter((t) => t.amount < 0).slice(0, 10);
          if (recentSpends.length < 2) return <div className="muted small" style={{ marginTop: 8 }}>Not enough recent spending history yet to estimate how often this would trigger.</div>;
          const avgSpend = Math.abs(recentSpends.reduce((s, t) => s + t.amount, 0) / recentSpends.length);
          const daysBetweenSpends = 3; // rough cadence assumption for this prototype's mock transaction history
          const daysToDrain = avgSpend > 0 ? Math.max(1, Math.round((autoTopUp.threshold > 0 ? autoTopUp.threshold : 1000) / avgSpend) * daysBetweenSpends) : null;
          return (
            <div className="muted small" style={{ marginTop: 8 }}>
              Based on your recent spending (~{naira(avgSpend)} per transaction), this would trigger roughly {daysToDrain ? `every ${daysToDrain} day${daysToDrain !== 1 ? "s" : ""}` : "occasionally"} -- adding {naira(autoTopUp.amount)} each time.
            </div>
          );
        })()}
      </div>
      {topUpOpen && (
        <div className="modal-backdrop" onClick={() => !paying && setTopUpOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => !paying && setTopUpOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Top up wallet</div>
            <div className="cat-top" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {presets.map((p) => <button key={p} className="ghost-btn-sm" onClick={() => setTopUpAmount(String(p))}>{naira(p)}</button>)}
            </div>
            <div className="field" style={{ marginBottom: 12 }}><span>Amount</span><input type="number" min="1" placeholder="Custom amount" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} /></div>
            <div className="field" style={{ marginBottom: 14 }}>
              <span>Pay with</span>
              <select className="sort-select" value={topUpMethod} onChange={(e) => setTopUpMethod(e.target.value)}>
                {cards.map((c, i) => <option key={i} value={`card-${i}`}>{c.brand} •••• {c.last4}</option>)}
                <option value="transfer">Bank transfer</option>
              </select>
            </div>
            {topUpMethod === "transfer" && (
              <div className="field" style={{ marginBottom: 14 }}>
                <span>Proof of payment</span>
                <input type="file" ref={topUpProofRef} accept="image/*" style={{ display: "none" }} onChange={handleTopUpProof} />
                {topUpProofPhoto ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <img src={topUpProofPhoto} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                    <button className="ghost-btn-sm" onClick={() => setTopUpProofPhoto(null)}>Remove</button>
                  </div>
                ) : (
                  <button className="ghost-btn-sm" style={{ marginTop: 6 }} onClick={() => topUpProofRef.current?.click()}><ImageIcon size={12} /> Upload screenshot or receipt</button>
                )}
              </div>
            )}
            <button className="primary-btn-sm wide" disabled={!topUpAmount || Number(topUpAmount) <= 0 || paying || (topUpMethod === "transfer" && !topUpProofPhoto)} onClick={pay}>{paying ? "Processing payment..." : `Pay ${topUpAmount ? naira(Number(topUpAmount)) : ""}`}</button>
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title">Convert naira to points</div>
        <div className="muted" style={{ marginBottom: 10 }}>1 point = ₦1. Points are one-way -- once converted they can't be turned back into naira. Cap is {POINTS_CAP} points.</div>
        <div className="cat-top" style={{ marginBottom: 8 }}><span className="muted">You have {points}/{POINTS_CAP} points</span><span className="muted">Room: {room}</span></div>
        <input type="range" min={0} max={maxConvert} step={100} value={Math.min(amount, maxConvert)} onChange={(e) => setAmount(Number(e.target.value))} className="points-slider" disabled={maxConvert === 0} />
        <div className="cat-top" style={{ marginBottom: 12 }}><span className="muted small">Convert {naira(Math.min(amount, maxConvert))}</span><span className="muted small">-&gt; +{Math.min(amount, maxConvert)} pts</span></div>
        <button className="primary-btn-sm wide" disabled={maxConvert === 0} onClick={() => onConvert(Math.min(amount, maxConvert))}>Convert to Points</button>
        {maxConvert === 0 && <div className="muted small" style={{ marginTop: 8 }}>You've reached the {POINTS_CAP}-point cap.</div>}
      </div>
      <div className="panel enter">
        <div className="panel-title">Recent transactions</div>
        <div className="panel-title-row"><div className="panel-title">Transactions</div>
          <button className="ghost-btn-sm" onClick={() => {
            const now = new Date();
            const thisMonth = walletTx.filter((t) => {
              // Seed data uses friendly strings like "Aug 18"; anything without a
              // real parseable date (e.g. "Just now") is treated as this month.
              const d = new Date(`${t.date} ${now.getFullYear()}`);
              return isNaN(d) || (d.getMonth() === now.getMonth());
            });
            const escapeCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
            const rows = thisMonth.map((t) => [t.id || "", t.type || "", t.label, t.amount, t.status || "", t.reference || "", t.date]);
            const lines = [["Transaction ID", "Type", "Label", "Amount (NGN)", "Status", "Reference", "Date"].map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))];
            const blob = new Blob([lines.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `wallet-statement-${now.toLocaleString("default", { month: "short" })}-${now.getFullYear()}.csv`;
            a.click(); URL.revokeObjectURL(url);
          }}><FileDown size={12} style={{ verticalAlign: "middle" }} /> This month's statement</button>
        </div>
        <div className="list-col">{walletTx.map((t, i) => (
          <div key={t.id || i} className="pending-row" style={{ alignItems: "flex-start" }}>
            <div className="ti-mid">
              <div className="card-name">{t.label}</div>
              <div className="muted small">{t.type ? `${t.type} -- ` : ""}{t.id || ""}{t.reference && t.reference !== "--" ? ` -- ${t.reference}` : ""}</div>
              <div className="muted small">{t.date}{t.status ? ` -- ${t.status}` : ""}</div>
            </div>
            <div className={`mono ${t.amount < 0 ? "neg" : ""}`}>{t.amount > 0 ? "+" : ""}{naira(t.amount)}</div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function GameCard({ game, done, onComplete }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const Icon = game.icon;

  const submitChoice = (idx) => {
    if (idx === game.correct) { setResult("correct"); onComplete(game.key); }
    else setResult("wrong");
  };
  const submitText = () => {
    if (answer.trim().toLowerCase() === game.answer) { setResult("correct"); onComplete(game.key); }
    else setResult("wrong");
  };

  return (
    <div className={`game-card ${done ? "done" : ""}`}>
      <div className="game-top">
        <div className="pending-icon" style={{ background: game.color + "1A", color: game.color }}><Icon size={16} /></div>
        <div className="ti-mid"><div className="card-name">{game.title}</div><div className="muted small">Worth 1 point</div></div>
        {done && <span className="status-pill done">Done</span>}
      </div>
      {!done && !open && <button className="ghost-btn-sm" style={{ marginTop: 10 }} onClick={() => setOpen(true)}>Play</button>}
      {open && (
        <div style={{ marginTop: 10 }}>
          {game.type === "choice" && (done ? (
            <div className="muted small" style={{ color: "#16A34A" }}>Correct! +1 point earned.</div>
          ) : (
            <>
              <div className="muted" style={{ marginBottom: 8 }}>{game.prompt}</div>
              <div className="list-col">
                {game.options.map((opt, i) => <button key={i} className="ghost-btn-sm" style={{ textAlign: "left" }} onClick={() => submitChoice(i)}>{opt}</button>)}
              </div>
            </>
          ))}
          {game.type === "text" && (done ? (
            <div className="muted small" style={{ color: "#16A34A" }}>Correct! +1 point earned.</div>
          ) : (
            <>
              <div className="muted" style={{ marginBottom: 8 }}>{game.prompt}</div>
              <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" style={{ marginBottom: 8, width: "100%" }} />
              <button className="primary-btn-sm" onClick={submitText}>Submit</button>
            </>
          ))}
          {result === "wrong" && <div className="muted small" style={{ marginTop: 8, color: "#DC2626" }}>Not quite -- try again tomorrow.</div>}
        </div>
      )}
    </div>
  );
}

const TIERS = [
  { key: "bronze", label: "Bronze", min: 0, color: "#92400E" },
  { key: "silver", label: "Silver", min: 500, color: "#64748B" },
  { key: "gold", label: "Gold", min: 1500, color: "#B45309" },
  { key: "platinum", label: "Platinum", min: 3000, color: "#7C3AED" },
];
function getTier(lifetime) {
  return TIERS.slice().reverse().find((t) => lifetime >= t.min) || TIERS[0];
}

const ACHIEVEMENT_BADGES = [
  { key: "first_purchase", label: "First Purchase", desc: "Complete your first order", icon: "🏆", target: 1, current: (o) => o.length, check: (o) => o.length >= 1 },
  { key: "streak_30", label: "30-Day Streak", desc: "Order at least once every week for a month", icon: "🏆", target: 4, current: (o) => o.length, check: (o) => o.length >= 4 },
  { key: "community_hero", label: "Community Hero", desc: "Post 5 messages in Community", icon: "🏆", target: 5, current: (o, ctx) => ctx?.communityMessagesSent || 0, check: (o, ctx) => (ctx?.communityMessagesSent || 0) >= 5 },
  { key: "orders_10", label: "10 Orders Completed", desc: "Complete 10 orders", icon: "🏆", target: 10, current: (o) => o.length, check: (o) => o.length >= 10 },
  { key: "first_donation", label: "First Donation", desc: "Make your first community donation", icon: "🏆", target: 1, current: (o, ctx) => ctx?.donationCount || 0, check: (o, ctx) => (ctx?.donationCount || 0) > 0 },
  { key: "member", label: "Medra Member", desc: "Subscribe to any Membership tier", icon: "👑", target: 1, current: (o, ctx) => ctx?.hasMembership ? 1 : 0, check: (o, ctx) => !!ctx?.hasMembership },
  { key: "duel_winner", label: "Duel Winner", desc: "Win a real Point Duel", icon: "⚔️", target: 1, current: (o, ctx) => ctx?.duelWins || 0, check: (o, ctx) => (ctx?.duelWins || 0) >= 1 },
  { key: "lottery_player", label: "Lottery Player", desc: "Enter the Weekly Lottery at least once", icon: "🎟️", target: 1, current: (o, ctx) => ctx?.lotteryEntriesCount || 0, check: (o, ctx) => (ctx?.lotteryEntriesCount || 0) >= 1 },
];
const MEMBER_SINCE_DAYS_AGO = 210; // seed value -- about 7 months, so 30-day and 6-month milestones are already reachable

const LEADERBOARD_SEED = [
  { name: "Blessing U.", points: 4820 },
  { name: "Tobi J.", points: 4310 },
  { name: "Chinedu O.", points: 3960 },
  { name: "Sarah A.", points: 3400 },
];
const LEADERBOARD_REWARD = (rank, anon) => {
  if (rank === 1) return anon ? "40% off delivery voucher (20% less for staying anonymous)" : "50% off delivery voucher";
  const pct = anon ? 1.6 : 2;
  return `${pct}% off next order${anon ? " (20% less for staying anonymous)" : ""}`;
};

// Consolidated view of every claimable perk/mission across the app -- was
// previously scattered across ~9 separate flags with no single place to see
// them all. This is read-only: it reports status and deep-links into the
// screen where the claim actually happens, rather than duplicating each
// mechanic's claim logic here (safer, and keeps one source of truth per perk).
// Short numbered walkthrough for a mechanic, opened from a "How it works"
// link. Serves the same purpose as a tutorial video for the more confusing
// game mechanics, without a fake/broken video link -- just a clear step list.
function HowItWorksModal({ title, steps, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <div className="panel-title" style={{ marginBottom: 10 }}>How {title} works</div>
        <div className="list-col" style={{ marginBottom: 14 }}>
          {steps.map((s, i) => (
            <div key={i} className="pending-row">
              <div className="driver-avatar sm" style={{ background: "var(--purple)" }}>{i + 1}</div>
              <div className="ti-mid muted small">{s}</div>
            </div>
          ))}
        </div>
        <button className="primary-btn-sm wide" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

function MissionsOverviewScreen({ onNavigate, missionClaimed, myBirthdayClaimed, claimedAnniversaries, myBirthday, surveyDone, flashAvailable, flashClaimed, creatorClaimed, showCreatorProgram, claimedBadges, localChallengeClaimedWeeks, leaderboardClaimedMonth }) {
  const anniversaryClaimedThisYear = myBirthday ? claimedAnniversaries?.has?.(new Date().getFullYear()) : false;
  const items = [
    { label: "Daily Mission", claimed: missionClaimed, goTo: "rewards", desc: "A small task you can complete once a day." },
    { label: "Birthday Bonus", claimed: myBirthdayClaimed, goTo: "rewards", desc: "One-time points bonus on your birthday." },
    { label: "Account Anniversary", claimed: anniversaryClaimedThisYear, goTo: "rewards", desc: "Yearly bonus on the anniversary of joining." },
    { label: "Feedback Survey", claimed: surveyDone, goTo: "rewards", desc: "Answer a short survey for points." },
    { label: "Flash Reward", claimed: flashAvailable ? flashClaimed : null, goTo: "rewards", desc: "Appears occasionally -- claim it while it's live." },
    { label: "Creator Program Bonus", claimed: showCreatorProgram ? creatorClaimed : null, goTo: "rewards", desc: "Reach 10 qualified referrals to unlock." },
    { label: "Achievement Badges", claimed: (claimedBadges?.size || 0) > 0 ? "partial" : false, goTo: "rewards", desc: `${claimedBadges?.size || 0} claimed so far.` },
    { label: "Weekly Local Challenge", claimed: (localChallengeClaimedWeeks?.length || 0) > 0 ? "partial" : false, goTo: "rewards", desc: `${localChallengeClaimedWeeks?.length || 0} week(s) claimed.` },
    { label: "Monthly Leaderboard", claimed: !!leaderboardClaimedMonth, goTo: "rewards", desc: "Claim your spot's reward once ranked." },
  ];
  const claimedCount = items.filter((it) => it.claimed === true).length;
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Missions & Perks</div><span className="muted small">{claimedCount} of {items.length} claimed</span></div>
        <div className="muted small" style={{ marginBottom: 14 }}>Every claimable perk across the app, in one place. Tap any row to go claim it.</div>
        <div className="list-col">
          {items.map((it) => (
            <button key={it.label} className="pending-row" style={{ width: "100%", textAlign: "left" }} onClick={() => onNavigate(it.goTo)}>
              <div className="ti-mid"><div className="card-name">{it.label}</div><div className="muted small">{it.desc}</div></div>
              {it.claimed === true && <span className="status-pill done">Claimed</span>}
              {it.claimed === "partial" && <span className="status-pill route">In progress</span>}
              {it.claimed === false && <span className="status-pill">Available</span>}
              {it.claimed === null && <span className="muted small">Not active</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RewardsScreen({ points, lifetimePoints, gamesDone, onGameComplete, celebrantWished, onWishCelebrant, showMyPhoto, pointsUsedThisMonth, earnPoints, spendPoints, orders, claimedBadges, setClaimedBadges, myBirthdayClaimed, setMyBirthdayClaimed, myBirthday, claimedAnniversaries, setClaimedAnniversaries, surveyDone, setSurveyDone, flashAvailable, setFlashAvailable, flashClaimed, setFlashClaimed, isCreator, setIsCreator, creatorClaimed, setCreatorClaimed, lastSpinAt, setLastSpinAt, activeDiscount, setActiveDiscount, duelResult, setDuelResult, duelPlaying, setDuelPlaying, insuranceCoverage, setInsuranceCoverage, setPoints, missionClaimed, setMissionClaimed, challengeLevel, setChallengeLevel, challengeBaseline, setChallengeBaseline, communityPool, setCommunityPool, sponsorshipsGiven, setSponsorshipsGiven, loanRecords, recordLoan, confirmLoanAgreement, repayLoan, auctionBids, setAuctionBids, auctionClosed, setAuctionClosed, auctionWon, setAuctionWon, donationCount, communityMessagesSent, referrals, benefactorFund, setBenefactorFund, carePoolSignedUp, setCarePoolSignedUp, lastCarePoolDrawAt, setLastCarePoolDrawAt, weeklyBenefactorClaims, setWeeklyBenefactorClaims, membership, localChallengeClaimedWeeks, onClaimLocalChallenge, duelWins, setDuelWins, weeklyLotteryEntries, showCreatorProgram, leaderboardAnon, leaderboardClaimedMonth, setLeaderboardClaimedMonth }) {
  const distinctSellersThisSession = new Set(orders.flatMap((o) => (o.items || []).map((i) => i.sellerName).filter(Boolean))).size;
  const [duelHowOpen, setDuelHowOpen] = useState(false);
  const missionProgress = Math.min(3, distinctSellersThisSession);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const challengeProgress = Math.max(0, Math.min(challengeLevel * 3, deliveredCount - challengeBaseline));
  const localChallengeWeekIdNow = localChallengeWeekId(new Date());
  const localChallengeOrdersThisWeek = orders.filter((o) => o.status !== "cancelled").length;
  const localChallengeClaimed = localChallengeClaimedWeeks.includes(localChallengeWeekIdNow);
  const localChallengeQualifies = localChallengeOrdersThisWeek >= 3;
  const tier = getTier(lifetimePoints);
  const tierIdx = TIERS.findIndex((t) => t.key === tier.key);
  const nextTier = TIERS[tierIdx + 1];
  const tierProgress = nextTier ? Math.min(100, ((lifetimePoints - tier.min) / (nextTier.min - tier.min)) * 100) : 100;
  const monthlyRemaining = Math.max(0, POINTS_MONTHLY_USAGE_CAP - (pointsUsedThisMonth || 0));
  const qualifiesForCarePool = carePoolSignedUp && sponsorshipsGiven.length > 0;
  const carePoolReady = qualifiesForCarePool && communityPool >= 60 && (!lastCarePoolDrawAt || Date.now() - lastCarePoolDrawAt >= 365 * 24 * 60 * 60 * 1000);
  const carePoolNextDrawDays = lastCarePoolDrawAt ? Math.max(0, Math.ceil((365 * 24 * 60 * 60 * 1000 - (Date.now() - lastCarePoolDrawAt)) / (24 * 60 * 60 * 1000))) : 0;
  const benefactorWeekId = localChallengeWeekId(new Date());
  const benefactorClaimedThisWeek = !!weeklyBenefactorClaims[benefactorWeekId];
  const benefactorReady = !benefactorClaimedThisWeek && benefactorFund >= 20;
  const [duelMode, setDuelMode] = useState("highest");
  const [duelStakeInput, setDuelStakeInput] = useState("");
  const [loanDirection, setLoanDirection] = useState("lent");
  const [loanPerson, setLoanPerson] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanInterest, setLoanInterest] = useState("");
  const [auctionMode, setAuctionMode] = useState("lowest");
  const [insuranceBlocksInput, setInsuranceBlocksInput] = useState("");
  const [sponsorAmount, setSponsorAmount] = useState("");
  const todayMD = (() => { const t = new Date(); return `${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`; })();
  const isMyBirthdayToday = myBirthday === todayMD;
  const [bMonth, bDay] = (myBirthday || "").split("-");
  const myBirthdayDisplay = bMonth ? new Date(2000, Number(bMonth) - 1, Number(bDay)).toLocaleDateString([], { month: "long", day: "numeric" }) : "not set";

  // Achievement badges
  const claimBadge = (badge) => {
    if (claimedBadges.has(badge.key)) return;
    setClaimedBadges((s) => new Set(s).add(badge.key));
    earnPoints?.(100);
  };

  // Birthday-for-me (demo trigger, since we don't store a real date of birth)

  // App anniversary
  const ANNIVERSARY_MILESTONES = [
    { key: "30d", label: "30 days as a member", daysNeeded: 30 },
    { key: "6mo", label: "6 months as a member", daysNeeded: 182 },
    { key: "1yr", label: "1 year as a member", daysNeeded: 365 },
  ];
  const claimAnniversary = (m) => {
    if (claimedAnniversaries.has(m.key)) return;
    setClaimedAnniversaries((s) => new Set(s).add(m.key));
    earnPoints?.(100);
  };

  // Rewarded survey
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [surveyRating, setSurveyRating] = useState(0);
  const [surveyHoverRating, setSurveyHoverRating] = useState(0);
  const [surveyComment, setSurveyComment] = useState("");
  const [auctionBid, setAuctionBid] = useState(null);
  const completeSurvey = () => { setSurveyDone(true); setSurveyOpen(false); earnPoints?.(2); setSurveyRating(0); setSurveyComment(""); };

  // Surprise flash reward (demo trigger)
  const claimFlash = () => { setFlashClaimed(true); setFlashAvailable(false); earnPoints?.(100); };

  // User-generated content rewards -- real signups/qualification derived from the same
  // referral list as Refer & Earn, not a self-click simulation.
  const CREATOR_CODE = "MEDRA-JORDAN22";
  const creatorSignups = Math.min(10, referrals.length);
  const creatorQualified = Math.min(10, referrals.filter((r) => r.earned > 0).length);
  // Rule: everything earned in-app is points or a % discount -- never a
  // direct naira payout. Was previously crediting the wallet with real naira;
  // now grants the naira-equivalent in points instead.
  const claimCreatorBonus = () => { setCreatorClaimed(true); earnPoints?.(2000); };

  // Spin the wheel -- once per week
  const canSpin = !lastSpinAt || Date.now() - lastSpinAt >= 7 * 24 * 60 * 60 * 1000;
  const nextSpinDate = lastSpinAt ? new Date(lastSpinAt + 7 * 24 * 60 * 60 * 1000) : null;
  const handleWheelWin = (prize) => {
    setLastSpinAt(Date.now());
    if (prize.type === "points") earnPoints?.(prize.value);
    else if (prize.type === "discount") setActiveDiscount(prize.value);
    else if (prize.type === "delivery_50") setActiveDiscount("delivery_50");
  };

  return (
    <div className="section-pad">
      <div className="panel enter points-hero">
        <Award size={26} color="#F59E0B" />
        <div className="kpi-value" style={{ fontSize: 28, margin: "8px 0 2px" }}>{points} / {POINTS_CAP} pts</div>
        <div className="muted">Worth {naira(points)} toward your next order</div>
        <div className="bar-track" style={{ marginTop: 12 }}><div className="bar-fill-h" style={{ width: `${(points / POINTS_CAP) * 100}%`, background: "#F59E0B" }} /></div>
      </div>

      <div className="muted small" style={{ display: "flex", alignItems: "center", gap: 6, margin: "-4px 0 4px" }}>
        <b>Bonus Category of the Day:</b> order from it and earn double points. Today it's somewhere in <b>{hiddenDeptHintForDate(new Date())}</b> -- the exact category is a surprise, only the cluster it's hiding in is shown.
      </div>

      {points >= POINTS_CAP && (
        <div className="cap-warning-banner">
          <AlertTriangle size={14} />
          You're at the {POINTS_CAP.toLocaleString()}-point cap and won't earn any more until you spend some. Unused points at the cap are forfeited if not spent by {endOfMonthLabel()}.
        </div>
      )}

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFFBEB,#fff)", border: "1px solid #FDE68A" }}>
        <div className="panel-title"><Wallet size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />This month's redemption limit</div>
        <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">Used this month</span><span className="mono small">{(pointsUsedThisMonth || 0).toLocaleString()} / {POINTS_MONTHLY_USAGE_CAP.toLocaleString()} pts</span></div>
        <div className="bar-track"><div className="bar-fill-h" style={{ width: `${((pointsUsedThisMonth || 0) / POINTS_MONTHLY_USAGE_CAP) * 100}%`, background: "var(--purple)" }} /></div>
        <div className="muted small" style={{ marginTop: 6 }}>{monthlyRemaining.toLocaleString()} points left to spend this month. Points don't expire on their own, but you can only redeem up to {POINTS_MONTHLY_USAGE_CAP.toLocaleString()} in any calendar month -- this resets at the start of each month.</div>
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFFBEB,#fff)", border: "1px solid #FDE68A" }}>
        <div className="panel-title-row"><div className="panel-title"><Medal size={16} style={{ marginRight: 6 }} />Loyalty tier</div><span className="status-pill done" style={{ color: tier.color, background: tier.color + "1A" }}>{tier.label}</span></div>
        <div className="tier-ladder">
          {TIERS.map((t, i) => (
            <div key={t.key} className={`tier-step ${i <= tierIdx ? "reached" : ""} ${t.key === tier.key ? "current" : ""}`}>
              <div className="tier-dot" style={{ background: i <= tierIdx ? t.color : "#E5E7EB" }} />
              <div className="muted small">{t.label}</div>
            </div>
          ))}
        </div>
        {nextTier ? (
          <>
            <div className="bar-track" style={{ marginTop: 4 }}><div className="bar-fill-h" style={{ width: `${tierProgress}%`, background: tier.color }} /></div>
            <div className="muted small" style={{ marginTop: 6 }}>{lifetimePoints} / {nextTier.min} lifetime points to reach {nextTier.label}</div>
          </>
        ) : <div className="muted small" style={{ marginTop: 6 }}>You've reached the highest tier -- keep earning to stay there.</div>}
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#F3EEFF,#fff)", border: "1px solid #DDD6FE" }}>
        <div className="panel-title"><Gamepad2 size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Play & earn (1 point each)</div>
        <div className="games-grid">
          {GAMES.map((g) => <GameCard key={g.key} game={g} done={gamesDone.has(g.key)} onComplete={onGameComplete} />)}
        </div>
      </div>

      <div className="games-section-header">
        <Flame size={18} color="#EA580C" />
        <div>
          <div className="card-name" style={{ fontSize: 15 }}>Games & Chances</div>
          <div className="muted small">Real odds, real prizes -- every game below tells you exactly what's at stake before you play.</div>
        </div>
      </div>

      <div className="panel enter" style={{ textAlign: "center", background: "linear-gradient(160deg,#F3EEFF,#fff)", border: "1px solid #DDD6FE" }}>
        <div className="panel-title" style={{ textAlign: "left" }}><Sparkles size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Spin the wheel</div>
        <div className="muted small" style={{ textAlign: "left", marginBottom: 10 }}>One free spin per week -- 8 real prizes on the wheel, odds shown below for each one. Rarer prizes are worth more but come up less often.</div>
        <ProportionalSpinWheel canSpin={canSpin} onWin={handleWheelWin} nextSpinLabel={nextSpinDate ? `Next spin available ${nextSpinDate.toLocaleDateString()}` : ""} />
        {activeDiscount && (
          <div className="muted small" style={{ marginTop: 10 }}>
            {isDeliveryReward(activeDiscount) ? `${deliveryRewardPct(activeDiscount)}% off delivery is active on your next order.` : `${activeDiscount}% off is active on your next order.`}
          </div>
        )}
      </div>

      <div className="panel enter celebrant-panel">
        <div className="panel-title-row"><div className="panel-title"><PartyPopper size={16} style={{ marginRight: 6 }} />Wish the Celebrant</div><span className="status-pill route">+2 points</span></div>
        <div className="celebrant-row">
          {showMyPhoto ? <img src={img(CELEBRANT.seed, 100)} className="celebrant-photo" alt={CELEBRANT.name} /> : <div className="driver-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>{CELEBRANT.name[0]}</div>}
          <div className="ti-mid">
            <div className="card-name" style={{ fontSize: 15 }}>It's {CELEBRANT.name}'s birthday today! 🎂</div>
            <div className="muted">Send a quick birthday wish and earn points.</div>
          </div>
        </div>
        <button className="primary-btn-sm wide" style={{ marginTop: 12 }} disabled={celebrantWished} onClick={onWishCelebrant}>
          {celebrantWished ? "You wished them a happy birthday!" : "Wish Happy Birthday"}
        </button>
      </div>

      {!isMyBirthdayToday ? (
        <div className="panel enter"><div className="muted small"><PartyPopper size={12} style={{ verticalAlign: "middle" }} /> Your birthday on file is {myBirthdayDisplay} -- you'll get 20 points automatically that day.</div></div>
      ) : !myBirthdayClaimed ? (
        <div className="panel enter celebrant-panel" style={{ background: "#FDF4FF" }}>
          <div className="panel-title-row"><div className="panel-title"><PartyPopper size={16} style={{ marginRight: 6 }} />It's your birthday today!</div><span className="status-pill route">+20 points</span></div>
          <div className="muted" style={{ marginBottom: 10 }}>Happy birthday! Claim your 20 points -- anyone who wishes you gets 2 points too.</div>
          <button className="ghost-btn-sm" onClick={() => {
            setMyBirthdayClaimed(true);
            const tier = !membership?.paused ? MEMBERSHIP_TIERS.find((t) => t.key === membership?.tier) : null;
            const memberBonus = tier && tier.price >= MEMBERSHIP_TIERS.find((x) => x.key === "gold").price ? 100 : 0;
            earnPoints?.(20 + memberBonus);
          }}>Claim your 20 birthday points{!membership?.paused && membership && MEMBERSHIP_TIERS.find((t) => t.key === membership.tier)?.price >= 10000 ? " (+100 member bonus)" : ""}</button>
        </div>
      ) : (
        <div className="panel enter"><div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Happy birthday! Your 20 points are in your balance.</div></div>
      )}

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFFBEB,#fff)", border: "1px solid #FDE68A" }}>
        <div className="panel-title"><Award size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Achievement badges</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Each badge earns 100 points. Higher badges take more to unlock.</div>
        {(() => {
          const ctx = { donationCount, communityMessagesSent, hasMembership: !!membership && !membership.paused, duelWins, lotteryEntriesCount: weeklyLotteryEntries?.length || 0 };
          const closest = ACHIEVEMENT_BADGES
            .filter((b) => !claimedBadges.has(b.key) && !b.check(orders || [], ctx))
            .map((b) => ({ b, progress: Math.min(b.target, b.current(orders || [], ctx)) }))
            .sort((a, x) => (a.b.target - a.progress) - (x.b.target - x.progress))[0];
          if (!closest) return null;
          return <div className="muted small" style={{ marginBottom: 10 }}><Target size={11} style={{ verticalAlign: "middle" }} /> Closest badge: <b>{closest.b.label}</b> -- {closest.progress}/{closest.b.target}, {closest.b.target - closest.progress} to go.</div>;
        })()}
        <div className="games-grid">
          {ACHIEVEMENT_BADGES.map((b) => {
            const eligible = b.check(orders || [], { donationCount, communityMessagesSent, hasMembership: !!membership && !membership.paused, duelWins, lotteryEntriesCount: weeklyLotteryEntries?.length || 0 });
            const claimed = claimedBadges.has(b.key);
            const progressNow = Math.min(b.target, b.current(orders || [], { donationCount, communityMessagesSent, hasMembership: !!membership && !membership.paused, duelWins, lotteryEntriesCount: weeklyLotteryEntries?.length || 0 }));
            return (
              <button key={b.key} className={`game-card ${claimed ? "done" : ""}`} disabled={!eligible || claimed} onClick={() => claimBadge(b)}>
                <div style={{ fontSize: 22 }}>{b.icon}</div>
                <div className="card-name" style={{ fontSize: 12 }}>{b.label}</div>
                {!claimed && (
                  <div className="bar-track" style={{ width: "100%", margin: "4px 0" }}><div className="bar-fill-h" style={{ width: `${(progressNow / b.target) * 100}%`, background: eligible ? "#16A34A" : "#F59E0B" }} /></div>
                )}
                <div className="muted small">{claimed ? "Claimed" : eligible ? "Tap to claim" : `${progressNow}/${b.target}`}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFFBEB,#fff)", border: "1px solid #FDE68A" }}>
        <div className="panel-title"><Trophy size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />App anniversary rewards</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Member for {MEMBER_SINCE_DAYS_AGO} days. Each milestone earns 100 points.</div>
        <div className="list-col">
          {ANNIVERSARY_MILESTONES.map((m) => {
            const eligible = MEMBER_SINCE_DAYS_AGO >= m.daysNeeded;
            const claimed = claimedAnniversaries.has(m.key);
            return (
              <div key={m.key} className="pending-row">
                <div className="ti-mid"><div className="card-name">{m.label}</div></div>
                {claimed ? <span className="status-pill done">Claimed</span> : eligible ? <button className="ghost-btn-sm" onClick={() => claimAnniversary(m)}>Claim 100 pts</button> : <span className="muted small">Not yet reached</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#F3EEFF,#fff)", border: "1px solid #DDD6FE" }}>
        <div className="panel-title-row"><div className="panel-title"><PenLine size={16} style={{ marginRight: 6 }} />Monthly survey</div><span className="status-pill route">+2 points</span></div>
        {surveyDone ? (
          <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Thanks for your feedback this month!</div>
        ) : (
          <>
            <div className="muted" style={{ marginBottom: 10 }}>A couple of quick questions about your experience -- takes under a minute.</div>
            <button className="ghost-btn-sm" onClick={() => setSurveyOpen(true)}>Take the survey</button>
          </>
        )}
      </div>
      {surveyOpen && (
        <div className="modal-backdrop" onClick={() => setSurveyOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSurveyOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Quick survey</div>
            <div className="field" style={{ marginBottom: 12 }}><span>How was your last delivery?</span>
              <div className="stars-row" onMouseLeave={() => setSurveyHoverRating(0)}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < (surveyHoverRating || surveyRating);
                  return (
                    <button key={i} className="star-select-btn" onMouseEnter={() => setSurveyHoverRating(i + 1)} onClick={() => setSurveyRating(i + 1)}>
                      <Star size={22} fill={filled ? "#F59E0B" : "none"} color="#F59E0B" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <span>Anything you'd like to add? (optional)</span>
              <textarea rows={3} value={surveyComment} onChange={(e) => setSurveyComment(e.target.value)} placeholder="Tell us more..." style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical" }} />
            </div>
            <button className="primary-btn-sm wide" disabled={surveyRating === 0} onClick={completeSurvey}>Submit</button>
          </div>
        </div>
      )}

      {flashAvailable && (
        <div className="panel enter" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div className="panel-title-row"><div className="panel-title"><Flame size={16} style={{ marginRight: 6 }} />Flash reward!</div><span className="status-pill route">+100 points</span></div>
          <div className="muted" style={{ marginBottom: 10 }}>Claim 100 bonus points in the next hour -- this won't stay up for long.</div>
          <button className="primary-btn-sm" onClick={claimFlash}>Claim now</button>
        </div>
      )}
      {flashClaimed && <div className="panel enter"><div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Flash reward claimed!</div></div>}

      <div className="panel enter">
        <div className="panel-title">Monthly leaderboard</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Top 5 this month, by points earned -- requires a daily login and a daily purchase to stay on the board. Rank 1 wins a 50% off delivery voucher, ranks 2-5 win 2% off their next order. Appearing anonymous means 20% less on any reward you win -- change this under Settings.</div>
        <div className="list-col">
          {[...LEADERBOARD_SEED, { name: "You", points: lifetimePoints }]
            .sort((a, b) => b.points - a.points)
            .map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.name === "You";
              return (
                <div key={entry.name} className={`pending-row ${isMe ? "msg-thread-btn active" : ""}`}>
                  <div className="driver-avatar sm">{rank}</div>
                  <div className="ti-mid"><div className="card-name">{isMe && leaderboardAnon ? "Anonymous" : entry.name}</div><div className="muted small">{entry.points.toLocaleString()} points earned this month</div></div>
                  <span className="status-pill done">{LEADERBOARD_REWARD(rank, isMe && leaderboardAnon)}</span>
                </div>
              );
            })}
        </div>
        {(() => {
          const sorted = [...LEADERBOARD_SEED, { name: "You", points: lifetimePoints }].sort((a, b) => b.points - a.points);
          const myRank = sorted.findIndex((e) => e.name === "You") + 1;
          const monthId = `${new Date().getFullYear()}-${new Date().getMonth()}`;
          const alreadyClaimed = leaderboardClaimedMonth === monthId;
          if (myRank < 1 || myRank > 5) return null;
          return (
            <div style={{ marginTop: 10 }}>
              {alreadyClaimed ? (
                <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> This month's reward is already applied to your next order.</div>
              ) : (
                <button className="ghost-btn-sm" onClick={() => {
                  const anon = leaderboardAnon;
                  setActiveDiscount(myRank === 1 ? (anon ? "delivery_40" : "delivery_50") : (anon ? 1.6 : 2));
                  setLeaderboardClaimedMonth(monthId);
                }}>Claim rank #{myRank} reward -- {LEADERBOARD_REWARD(myRank, leaderboardAnon)}</button>
              )}
            </div>
          );
        })()}
      </div>

      {(showCreatorProgram || isCreator) ? (
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFFBEB,#fff)", border: "1px solid #FDE68A" }}>
        <div className="panel-title"><Star size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Content Creator Program</div>
        {!isCreator ? (
          <>
            <div className="muted" style={{ marginBottom: 10 }}>Bring 10 new users who each place 5+ orders in a month, and get your regular referral bonus plus an extra ₦2,000 creator bonus. You have to sign up to qualify.</div>
            <button className="ghost-btn-sm" onClick={() => setIsCreator(true)}>Sign up as a Content Creator</button>
          </>
        ) : (
          <>
            <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">Your creator code</span><span className="mono small">{CREATOR_CODE}</span></div>
            <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">Signups via your code</span><span className="mono small">{creatorSignups} / 10</span></div>
            <div className="cat-top" style={{ marginBottom: 10 }}><span className="muted small">Qualified (5+ orders this month)</span><span className="mono small">{creatorQualified} / 10</span></div>
            <div className="bar-track" style={{ marginBottom: 10 }}><div className="bar-fill-h" style={{ width: `${(creatorQualified / 10) * 100}%`, background: "var(--purple)" }} /></div>
            {creatorQualified >= 10 ? (
              creatorClaimed ? <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Creator bonus claimed -- 2,000 points added on top of your referral rewards.</div>
                : <button className="primary-btn-sm" onClick={claimCreatorBonus}>Claim 2,000-point creator bonus</button>
            ) : (
              <div className="muted small">Invite friends from Refer & Earn -- signups and qualified orders here track the same real referrals.</div>
            )}
          </>
        )}
      </div>
      ) : (
        <div className="muted small" style={{ margin: "-4px 0 4px" }}>Looking for the Content Creator Program? Turn it on in Settings.</div>
      )}

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#EAF3FF,#fff)", border: "1px solid #BFDBFE" }}>
        <div className="panel-title-row"><div className="panel-title">Point Duels -- Number Duel</div><button className="link-btn" onClick={() => setDuelHowOpen(true)}>How it works</button></div>
        {duelHowOpen && <HowItWorksModal title="Number Duel" onClose={() => setDuelHowOpen(false)} steps={[
          "Choose whether you think your hidden number will be higher or lower than your opponent's.",
          "Pick how many points to stake -- you never risk more than this amount.",
          "You're matched with a real opponent from the pool; their stake varies, so you could win more or less than double.",
          "The system draws both numbers. Correct guess wins both stakes; a tie refunds everyone; a wrong guess loses your stake.",
        ]} />}
        <div className="muted small" style={{ marginBottom: 10 }}>A real gamble -- the system draws a random number for you and one for your opponent, both hidden. Bet whether yours will be higher or lower, then stake any amount you're willing to risk. Your opponent is matched from a real pool, so their stake varies -- you could win more than double, or less, but you never risk more than your own stake. Winner takes both stakes; a tie refunds everyone. Wins and losses here are your own responsibility -- Medra doesn't cover or reverse the outcome.</div>
        {duelResult ? (
          <div className="muted small" style={{ color: duelResult.outcome === "win" ? "#16A34A" : duelResult.outcome === "tie" ? "#B45309" : "#DC2626" }}>
            The system drew {duelResult.myNumber} for you and {duelResult.oppNumber} for your opponent -- you bet yours would be {duelResult.guess}.{" "}
            {duelResult.outcome === "win" ? `Your opponent had staked ${duelResult.oppStake} points -- you won! +${duelResult.oppStake} points net.` : duelResult.outcome === "tie" ? "It's a tie -- your stake was refunded." : `You lost. -${duelResult.stake} points.`}
            <div style={{ marginTop: 8 }}><button className="ghost-btn-sm" onClick={() => setDuelResult(null)}>Play again</button></div>
          </div>
        ) : (
          <>
            <div className="muted small" style={{ marginBottom: 8 }}>Both numbers are drawn 1-50 the moment you play -- nobody, including you, knows either number until after you've locked in your bet.</div>
            <div className="cat-top" style={{ gap: 8, marginBottom: 8 }}>
              <button className={`ghost-btn-sm ${duelMode === "highest" ? "active" : ""}`} style={duelMode === "highest" ? { background: "#EAF3FF", border: "1px solid #2563EB" } : undefined} onClick={() => setDuelMode("highest")}>I bet mine is higher</button>
              <button className={`ghost-btn-sm ${duelMode === "lowest" ? "active" : ""}`} style={duelMode === "lowest" ? { background: "#EAF3FF", border: "1px solid #2563EB" } : undefined} onClick={() => setDuelMode("lowest")}>I bet mine is lower</button>
            </div>
            <div className="cat-top" style={{ gap: 8, marginBottom: 8 }}>
              <input type="number" min="1" placeholder="Stake -- any amount" value={duelStakeInput} style={{ flex: 1 }} onChange={(e) => setDuelStakeInput(e.target.value)} />
            </div>
            <div className="muted small" style={{ marginBottom: 8 }}>Roughly a 50/50 shot either way -- a tie (both numbers land the same) refunds your stake.</div>
            <button className="ghost-btn-sm" disabled={!duelStakeInput || Number(duelStakeInput) <= 0 || Number(duelStakeInput) > points || duelPlaying} onClick={() => {
              const stake = Number(duelStakeInput);
              const guess = duelMode;
              setDuelPlaying(true);
              (spendPoints || ((amt) => setPoints((p) => p - amt)))(stake, "duel-stake");
              setTimeout(() => {
                // SERVER-AUTHORITY: myNumber/oppNumber/oppStake are generated
                // client-side here for the prototype. Once real points are at
                // stake, the outcome must be determined server-side (and the
                // opponent must be a real other player's real submission, not
                // simulated locally) so the result can't be read or replayed
                // by inspecting the client.
                const myNumber = 1 + Math.floor(Math.random() * 50);
                const oppNumber = 1 + Math.floor(Math.random() * 50);
                // The opponent is a real pool of other players, not a mirror of you --
                // their real stake varies (0.5x-2x yours), so what you can win varies too.
                // You never risk more than your own stake either way.
                const oppStake = Math.max(1, Math.round(stake * (0.5 + Math.random() * 1.5)));
                let outcome;
                if (myNumber === oppNumber) outcome = "tie";
                else if (guess === "highest") outcome = myNumber > oppNumber ? "win" : "lose";
                else outcome = myNumber < oppNumber ? "win" : "lose";
                // Duel payouts are never scaled by membership tier -- multipliers don't apply
                // to gambling winnings, keeping the gamble the same real risk for everyone.
                if (outcome === "win") { earnPoints?.(stake + oppStake); setDuelWins?.((w) => w + 1); }
                else if (outcome === "tie") earnPoints?.(stake);
                setDuelResult({ outcome, myNumber, oppNumber, stake, oppStake, guess: guess === "highest" ? "higher" : "lower" });
                setDuelPlaying(false);
                setDuelStakeInput("");
              }, 900);
            }}>{duelPlaying ? "Finding an opponent and revealing numbers..." : "Start the duel"}</button>
            {duelPlaying && <div className="muted small" style={{ marginTop: 8 }}>Matching you with a real opponent from the pool -- their stake and number are set the moment yours are, so neither of you can see the other's pick first.</div>}
          </>
        )}
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#ECFDF5,#fff)", border: "1px solid #A7F3D0" }}>
        <div className="panel-title"><Users size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Community Giving</div>
        <div className="muted small" style={{ marginBottom: 10 }}>One real pool, two ways it comes back to the community: choose any amount to sponsor -- 60% goes to the Care Pool, 40% to the Weekly Benefactor fund. Pure generosity, no points back.</div>
        <div className="cat-top" style={{ gap: 8 }}>
          <input type="number" min="1" max={points} placeholder="Amount to sponsor" value={sponsorAmount} style={{ flex: 1 }} onChange={(e) => setSponsorAmount(e.target.value)} />
          <button className="ghost-btn-sm" disabled={!sponsorAmount || Number(sponsorAmount) <= 0 || Number(sponsorAmount) > points} onClick={() => {
            const amt = Number(sponsorAmount);
            const toPool = Math.round(amt * 0.6);
            const toFund = amt - toPool;
            (spendPoints || ((a) => setPoints((p) => p - a)))(amt, "community-sponsorship");
            setCommunityPool((c) => c + toPool);
            setBenefactorFund((f) => f + toFund);
            setSponsorshipsGiven((s) => [...s, { amount: amt, at: Date.now() }]);
            setSponsorAmount("");
          }}>Sponsor</button>
        </div>
        {sponsorAmount && Number(sponsorAmount) > 0 && <div className="muted small" style={{ marginTop: 6 }}>{Math.round(Number(sponsorAmount) * 0.6)} to Care Pool, {Number(sponsorAmount) - Math.round(Number(sponsorAmount) * 0.6)} to Benefactor fund.</div>}
        {sponsorshipsGiven.length > 0 && (
          <div className="muted small" style={{ marginTop: 6 }}>You've sponsored {sponsorshipsGiven.reduce((s, x) => s + x.amount, 0)} points across {sponsorshipsGiven.length} contribution{sponsorshipsGiven.length !== 1 ? "s" : ""}.</div>
        )}

        <div style={{ borderTop: "1px solid #A7F3D0", margin: "14px 0 12px" }} />
        <div className="card-name" style={{ fontSize: 13, marginBottom: 6 }}>Care Pool -- {communityPool} pts</div>
        {!carePoolSignedUp ? (
          <>
            <div className="muted small" style={{ marginBottom: 10 }}>Sign up to become eligible to draw from the pool once you've contributed and it's your turn.</div>
            <button className="ghost-btn-sm" onClick={() => setCarePoolSignedUp(true)}>Sign up for the Care Pool</button>
          </>
        ) : !qualifiesForCarePool ? (
          <div className="muted small" style={{ marginBottom: 10 }}>Signed up -- sponsor points above at least once to qualify for a draw.</div>
        ) : carePoolReady ? (
          <>
            <div className="muted small" style={{ marginBottom: 10 }}>You qualify and it's been a year (or more) since your last draw -- take a real share.</div>
            <button className="ghost-btn-sm" onClick={() => { setLastCarePoolDrawAt(Date.now()); setCommunityPool((c) => c - 60); earnPoints?.(60); }}>Draw 60 points from the pool</button>
          </>
        ) : lastCarePoolDrawAt ? (
          <div className="muted small">You qualify -- next draw available in {carePoolNextDrawDays} day{carePoolNextDrawDays !== 1 ? "s" : ""}.</div>
        ) : (
          <div className="muted small">Qualified and waiting -- the pool needs {Math.max(0, 60 - communityPool)} more points before a draw is possible.</div>
        )}

        <div style={{ borderTop: "1px solid #A7F3D0", margin: "14px 0 12px" }} />
        <div className="card-name" style={{ fontSize: 13, marginBottom: 6 }}>Weekly Surprise Benefactor -- {benefactorFund} pts</div>
        {benefactorClaimedThisWeek ? (
          <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Claimed this week's surprise. Check back next week.</div>
        ) : benefactorReady ? (
          <>
            <div className="muted small" style={{ marginBottom: 10 }}>Someone left you a surprise this week -- the fund has enough to cover it.</div>
            <button className="ghost-btn-sm" onClick={() => { setWeeklyBenefactorClaims((c) => ({ ...c, [benefactorWeekId]: true })); setBenefactorFund((f) => f - 20); earnPoints?.(20); }}>Claim your surprise -- 20 points</button>
          </>
        ) : (
          <div className="muted small">The fund doesn't have enough yet this week ({benefactorFund}/20). Sponsor points above to help it grow.</div>
        )}
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#ECFDF5,#fff)", border: "1px solid #A7F3D0" }}>
        <div className="panel-title"><HandCoins size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Point Lending -- Between Friends</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Lend to or borrow from a friend or any customer directly, for any amount you agree on -- add interest if you want, or leave it blank for a plain loan. Both sides get 30 days once you both confirm. If you're lending, collecting repayment is on you -- Medra doesn't step into the deal between you.</div>
        <div className="cat-top" style={{ gap: 8, marginBottom: 8 }}>
          <select className="sort-select" value={loanDirection} onChange={(e) => setLoanDirection(e.target.value)}>
            <option value="lent">I'm lending points</option>
            <option value="borrowed">I'm borrowing points</option>
          </select>
        </div>
        <div className="cat-top" style={{ gap: 8, marginBottom: 8 }}>
          <input type="text" placeholder="Their name" value={loanPerson} style={{ flex: 1 }} onChange={(e) => setLoanPerson(e.target.value)} />
          <input type="number" min="1" placeholder="Amount" value={loanAmount} style={{ width: 100 }} onChange={(e) => setLoanAmount(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 10 }}><span>Interest (optional)</span><input type="number" min="0" placeholder="Leave blank for no interest" value={loanInterest} onChange={(e) => setLoanInterest(e.target.value)} /></div>
        <button className="ghost-btn-sm" disabled={!loanPerson.trim() || !loanAmount || Number(loanAmount) <= 0} onClick={() => { recordLoan(loanDirection, loanPerson.trim(), Number(loanAmount), Number(loanInterest) || 0); setLoanPerson(""); setLoanAmount(""); setLoanInterest(""); }}>Propose this loan</button>
        {loanRecords.length > 0 && (
          <div className="list-col" style={{ marginTop: 12 }}>
            {loanRecords.map((l) => {
              const totalOwed = l.amount + (l.interest || 0);
              const daysLeft = l.agreedAt ? Math.max(0, 30 - Math.floor((Date.now() - l.agreedAt) / (1000 * 60 * 60 * 24))) : null;
              return (
                <div key={l.id} className="pending-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div className="cat-top" style={{ marginBottom: 4 }}>
                    <div className="card-name">{l.direction === "lent" ? `You lent ${l.person}` : `You borrowed from ${l.person}`}</div>
                    <span className="mono small">{l.amount} pts{l.interest > 0 ? ` + ${l.interest} interest = ${totalOwed}` : ""}</span>
                  </div>
                  {l.settled ? (
                    <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Settled{l.autoCollected ? " -- automatically collected after 30 days" : ""}</div>
                  ) : !l.agreedAt ? (
                    <div className="cat-top">
                      <span className="muted small">Waiting for both sides to confirm before the 30-day term starts</span>
                      <button className="ghost-btn-sm" onClick={() => confirmLoanAgreement(l.id)}>Confirm agreement</button>
                    </div>
                  ) : l.direction === "borrowed" ? (
                    <div className="cat-top">
                      <span className="muted small">{daysLeft} day{daysLeft !== 1 ? "s" : ""} left -- pay back anytime, or it's auto-collected from your balance after day 30</span>
                      <button className="ghost-btn-sm" disabled={totalOwed > points} onClick={() => repayLoan(l.id)}>Pay back {totalOwed} pts</button>
                    </div>
                  ) : daysLeft > 0 ? (
                    <div className="muted small">{daysLeft} day{daysLeft !== 1 ? "s" : ""} left in their term -- you can't request it back until the 30 days are up.</div>
                  ) : (
                    <div className="cat-top">
                      <span className="muted small">30 days are up -- once they've paid you back for real, mark it here</span>
                      <button className="ghost-btn-sm" onClick={() => repayLoan(l.id)}>Mark as repaid to me</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#ECFDF5,#fff)", border: "1px solid #A7F3D0" }}>
        <div className="panel-title"><ShieldCheck size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Point Insurance</div>
        <div className="muted small" style={{ marginBottom: 10 }}>If you're sitting at the {POINTS_CAP.toLocaleString()}-point cap at month's end, you automatically keep half those points either way -- Insurance covers some or all of the other half instead of letting it go. Costs 2,000 points for every 10,000 points of extra coverage.</div>
        {insuranceCoverage > 0 ? (
          <div className="muted small" style={{ color: "#16A34A" }}><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> {insuranceCoverage.toLocaleString()} points covered this month.</div>
        ) : (
          <>
            <div className="cat-top" style={{ gap: 8 }}>
              <input type="number" min="1" step="1" placeholder="Blocks of 10,000" value={insuranceBlocksInput} style={{ width: 160 }} onChange={(e) => setInsuranceBlocksInput(e.target.value)} />
              <button className="ghost-btn-sm" disabled={!insuranceBlocksInput || Number(insuranceBlocksInput) <= 0 || Number(insuranceBlocksInput) * PRICING.insuranceBlockCostPoints > points} onClick={() => { const blocks = Number(insuranceBlocksInput); (spendPoints || ((a) => setPoints((p) => p - a)))(blocks * PRICING.insuranceBlockCostPoints, "insurance-purchase"); setInsuranceCoverage(blocks * PRICING.insuranceCoverPerBlock); setInsuranceBlocksInput(""); }}>Buy coverage</button>
            </div>
            {insuranceBlocksInput && Number(insuranceBlocksInput) > 0 && <div className="muted small" style={{ marginTop: 6 }}>{Number(insuranceBlocksInput)} block{Number(insuranceBlocksInput) !== 1 ? "s" : ""} = {(Number(insuranceBlocksInput) * 10000).toLocaleString()} points covered, costs {(Number(insuranceBlocksInput) * 2000).toLocaleString()} points.</div>}
          </>
        )}
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFF7ED,#fff)", border: "1px solid #FED7AA" }}>
        <div className="panel-title-row"><div className="panel-title"><Target size={16} style={{ marginRight: 6 }} />Secret Mission</div><span className="status-pill route">50 pts</span></div>
        <div className="muted small" style={{ marginBottom: 8 }}>Order from 3 different sellers this session.</div>
        <div className="bar-track" style={{ marginBottom: 8 }}><div className="bar-fill-h" style={{ width: `${(missionProgress / 3) * 100}%`, background: "#7C3AED" }} /></div>
        {missionClaimed ? (
          <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Mission complete -- 50 points claimed.</div>
        ) : missionProgress >= 3 ? (
          <button className="ghost-btn-sm" onClick={() => { setMissionClaimed(true); earnPoints?.(50); }}>Claim 50 points</button>
        ) : (
          <div className="muted small">{missionProgress}/3 sellers so far -- place a real order from a new seller to make progress.</div>
        )}
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFF7ED,#fff)", border: "1px solid #FED7AA" }}>
        <div className="panel-title-row"><div className="panel-title"><TrendingUp size={16} style={{ marginRight: 6 }} />Order Challenges -- Lagos</div><span className="muted small">Level {challengeLevel}</span></div>
        <div className="muted small" style={{ marginBottom: 8 }}>A running challenge that gets harder -- and pays more -- every time you clear a level. Right now: complete {challengeLevel * 3} real delivered orders this level for {Math.min(300, challengeLevel * 30)} points, then level up to a bigger target and a bigger reward.</div>
        <div className="bar-track" style={{ marginBottom: 8 }}><div className="bar-fill-h" style={{ width: `${(challengeProgress / (challengeLevel * 3)) * 100}%`, background: "#EA580C" }} /></div>
        {challengeProgress >= challengeLevel * 3 ? (
          <button className="ghost-btn-sm" onClick={() => { earnPoints?.(Math.min(300, challengeLevel * 30)); setChallengeLevel((l) => l + 1); setChallengeBaseline(deliveredCount); }}>Claim {Math.min(300, challengeLevel * 30)} points and advance</button>
        ) : (
          <div className="muted small">{challengeProgress}/{challengeLevel * 3} delivered orders this level -- keep ordering to progress.</div>
        )}
        <div style={{ borderTop: "1px solid #FED7AA", margin: "14px 0 10px" }} />
        <div className="card-name" style={{ fontSize: 13, marginBottom: 4 }}>This week's bonus</div>
        <div className="muted small" style={{ marginBottom: 8 }}>City-wide goal: {LOCAL_CHALLENGE_TARGET.toLocaleString()} orders across Lagos this week -- if the city hits it, everyone gets a reward. Place 3+ real orders yourself this week to earn your own bonus regardless.</div>
        <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">Your orders this week</span><span className="mono small">{localChallengeOrdersThisWeek}/3</span></div>
        <div className="bar-track" style={{ marginBottom: 10 }}><div className="bar-fill-h" style={{ width: `${Math.min(100, (localChallengeOrdersThisWeek / 3) * 100)}%`, background: localChallengeQualifies ? "#16A34A" : "var(--purple)" }} /></div>
        {localChallengeClaimed ? (
          <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Claimed this week's bonus -- +50 points.</div>
        ) : localChallengeQualifies ? (
          <button className="ghost-btn-sm" onClick={() => onClaimLocalChallenge(localChallengeWeekIdNow)}>Claim +50 points</button>
        ) : (
          <div className="muted small">{3 - localChallengeOrdersThisWeek} more order{3 - localChallengeOrdersThisWeek !== 1 ? "s" : ""} this week to qualify.</div>
        )}
      </div>

      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFF7ED,#fff)", border: "1px solid #FED7AA" }}>
        <div className="panel-title-row"><div className="panel-title"><Gift size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Reverse Auction -- Wireless Earbuds (worth 200 pts)</div><span className="status-pill route">Prize: 200 pts value</span></div>
        <div className="muted small" style={{ marginBottom: 8 }}>You're bidding on a real 200-point item. Two separate pools compete: everyone going for "lowest unique" competes only against each other, and everyone going for "highest unique" competes only against each other -- you won't see or compete against the other pool's numbers directly, they're just both shown after the round closes. <b>Win:</b> pay only your bid, get the 200-point item. <b>Lose:</b> you pay 10% of your bid to Medra as a real entry cost -- the rest stays yours.</div>
        {!auctionClosed ? (
          <>
            <div className="field" style={{ marginBottom: 8 }}>
              <span>Your strategy</span>
              <select className="sort-select" value={auctionMode} onChange={(e) => setAuctionMode(e.target.value)}>
                <option value="lowest">Lowest unique bid wins</option>
                <option value="highest">Highest unique bid wins</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <span>Your bid (points)</span>
              <div className="stepper-sm" style={{ width: "100%" }}>
                <button onClick={() => setAuctionBid((b) => Math.max(1, (b || 1) - 1))}><Minus size={12} /></button>
                <input type="number" min="1" value={auctionBid ?? ""} onChange={(e) => setAuctionBid(e.target.value === "" ? null : Number(e.target.value))} style={{ textAlign: "center", flex: 1, border: "none" }} />
                <button onClick={() => setAuctionBid((b) => (b || 0) + 1)}><Plus size={12} /></button>
              </div>
            </div>
            <div className="muted small" style={{ marginBottom: 8 }}>You're up against 6 real randomized bidders, each picking their own strategy too.</div>
            <button className="ghost-btn-sm" disabled={!auctionBid || auctionBid < 1 || auctionBid > points} onClick={() => {
              const botNames = ["Bot A", "Bot B", "Bot C", "Bot D", "Bot E", "Bot F"];
              const bots = botNames.map((who) => {
                const mode = Math.random() < 0.5 ? "lowest" : "highest";
                const amount = mode === "lowest" ? 10 + Math.floor(Math.random() * 90) : 100 + Math.floor(Math.random() * 900);
                return { who, amount, mode };
              });
              const allBids = [...bots, { who: "You", amount: auctionBid, mode: auctionMode }];
              const winner = resolveReverseAuction(allBids);
              const won = winner && winner.who === "You";
              setAuctionBids(allBids);
              setAuctionClosed(true);
              setAuctionWon(won);
              // SERVER-AUTHORITY: `won` should be decided server-side against the
              // real pool of bids, not computed/trusted from client state.
              const spend = spendPoints || ((a) => setPoints((p) => p - a));
              if (won) { spend(auctionBid, "auction-win-charge"); earnPoints?.(200); }
              else { const fee = Math.round(auctionBid * PRICING.auctionLossFeeRate); spend(fee, "auction-loss-fee"); }
            }}>Submit bid and close auction</button>
          </>
        ) : (
          <>
            {(() => {
              // BUG FIX: this used to only say "you didn't win" without ever
              // naming who actually won or what they bid -- and the bid list
              // below mixed lowest-mode and highest-mode bidders in one flat
              // list with no explanation, which is exactly why a "lowest"
              // bidder saw unrelated "highest" numbers in their circle and
              // it looked like noise. The real mechanic is two separate
              // pools (lowest-unique bidders compete only with each other,
              // same for highest-unique), compared against each other only
              // at the end -- so the pools are now shown split and labeled,
              // and the actual winner is computed and named either way.
              const winner = resolveReverseAuction(auctionBids);
              const lowestPool = auctionBids.filter((b) => b.mode === "lowest").slice().sort((a, b) => a.amount - b.amount);
              const highestPool = auctionBids.filter((b) => b.mode === "highest").slice().sort((a, b) => b.amount - a.amount);
              const renderRow = (b, i) => {
                const isWinner = winner && winner.who === b.who && winner.amount === b.amount && winner.mode === b.mode;
                return (
                  <div key={`${b.who}-${i}`} className="muted small" style={isWinner ? { fontWeight: 700, color: "#16A34A" } : undefined}>
                    {isWinner && <CircleCheck size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />}
                    {b.who}: {b.amount} pts{isWinner ? " -- winner" : ""}
                  </div>
                );
              };
              return (
                <>
                  <div className="muted small" style={{ marginBottom: 8 }}>
                    {auctionWon ? <><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> You won with {winner.amount} pts ({winner.mode} unique) -- earbuds are yours, and you only paid your bid.</> : winner ? <>{winner.who} won with {winner.amount} pts ({winner.mode} unique). You didn't win this round -- {Math.round((auctionBids.find((b) => b.who === "You")?.amount || 0) * 0.1)} points went to Medra as your entry cost.</> : <>No unique bid this round -- everyone tied, so nobody won. {Math.round((auctionBids.find((b) => b.who === "You")?.amount || 0) * 0.1)} points went to Medra as your entry cost.</>}
                  </div>
                  <div className="muted small" style={{ fontWeight: 700, marginBottom: 4 }}>Lowest-unique pool -- lowest bid that no one else also bid wins this pool</div>
                  <div className="list-col" style={{ marginBottom: 10 }}>{lowestPool.length > 0 ? lowestPool.map(renderRow) : <div className="muted small">No one bid this strategy this round.</div>}</div>
                  <div className="muted small" style={{ fontWeight: 700, marginBottom: 4 }}>Highest-unique pool -- highest bid that no one else also bid wins this pool</div>
                  <div className="list-col">{highestPool.length > 0 ? highestPool.map(renderRow) : <div className="muted small">No one bid this strategy this round.</div>}</div>
                  <div className="muted small" style={{ marginTop: 6 }}>When both pools produce a winner, the lower of the two amounts takes the prize overall.</div>
                </>
              );
            })()}
            <button className="ghost-btn-sm" style={{ marginTop: 10 }} onClick={() => { setAuctionClosed(false); setAuctionBid(null); }}>Try another round</button>
          </>
        )}
      </div>
    </div>
  );
}

// First-time-user free trial: Basic tier, free, available once per account.
// Runs 42-48 hours depending on activation time -- not a flat 48h from the
// exact moment you start, but snapped down to the nearest 6-hour checkpoint
// (12am/6am/12pm/6pm) so it always lands within that window. Cannot be
// cancelled or paused once started; it simply ends on its own.
const TRIAL_TARGET_HOURS = 48;
const TRIAL_CHECKPOINT_HOURS = 6;
function computeTrialExpiry(startedAt) {
  const target = new Date(startedAt + TRIAL_TARGET_HOURS * 60 * 60 * 1000);
  target.setMinutes(0, 0, 0);
  target.setHours(Math.floor(target.getHours() / TRIAL_CHECKPOINT_HOURS) * TRIAL_CHECKPOINT_HOURS);
  return target.getTime();
}

const MEMBERSHIP_TIERS = [
  { key: "basic", name: "Basic", price: 5000, multiplier: 2, color: "#64748B",
    benefits: ["2x Reward Points on eligible purchases", "Members-only promotions", "Priority customer support", "Early access to flash sales (coming soon)"] },
  { key: "gold", name: "Gold", price: 10000, multiplier: 2, color: "#B45309",
    benefits: ["Everything in Basic", "Premium Member Badge shown across the platform", "100 bonus points on your birthday"] },
  { key: "platinum", name: "Platinum", price: 20000, multiplier: 3, color: "#475569",
    benefits: ["Everything in Gold", "3x Reward Points (replaces 2x)", "Early access to new features and partner vendors (coming soon)"] },
  { key: "diamond", name: "Diamond", price: 40000, multiplier: 3, color: "#0EA5E9",
    benefits: ["Everything in Platinum", "Premium dashboard themes unlocked free", "One free Weekly Lottery entry every month"] },
  { key: "elite", name: "Elite Black", price: 80000, multiplier: 5, color: "#0F172A",
    benefits: ["Everything in Diamond", "5x Reward Points (replaces 3x) -- maximum multiplier", "Dedicated VIP concierge support"] },
];

function MembershipScreen({ wallet, membership, onSubscribe, onCancel, onPause, onResume, orders, pauseHistory, trialUsed, onStartTrial }) {
  const [tierView, setTierView] = useState("cards");
  const currentTier = MEMBERSHIP_TIERS.find((t) => t.key === membership?.tier);
  const isTrial = !!membership?.isTrial;
  const [trialTick, setTrialTick] = useState(0);
  useEffect(() => {
    if (!isTrial) return;
    const t = setInterval(() => setTrialTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, [isTrial]);
  const trialMsLeft = isTrial ? Math.max(0, membership.trialExpiresAt - Date.now()) : 0;
  const trialHoursLeft = Math.floor(trialMsLeft / (60 * 60 * 1000));
  const trialMinsLeft = Math.floor((trialMsLeft % (60 * 60 * 1000)) / (60 * 1000));
  const recentPauses = (pauseHistory || []).filter((t) => Date.now() - t < 30 * 24 * 60 * 60 * 1000);
  const pausesRemaining = Math.max(0, 2 - recentPauses.length);
  const realOrders = (orders || []).filter((o) => o.status !== "cancelled");
  const orderProductPayable = (o) => (o.items || []).reduce((s, it) => s + (it.sellerPrice || 0) * (it.qty || 1), 0) * (1 + PRODUCT_COMMISSION_RATE);
  const avgOrderValue = realOrders.length > 0 ? realOrders.reduce((s, o) => s + orderProductPayable(o), 0) / realOrders.length : 0;
  // Concrete, order-specific pitch: "you'd have earned ₦X instead of ₦Y on
  // your last order" is easier to understand than an abstract "1.5x
  // multiplier" -- so alongside the multiplier we also compute the real
  // naira-equivalent point difference on the customer's actual last order.
  const lastOrder = realOrders.length > 0 ? realOrders[realOrders.length - 1] : null;
  const lastOrderValue = lastOrder ? orderProductPayable(lastOrder) : 0;
  // BUG FIX: this used to always compare against the no-membership base rate
  // (1x), even for an existing member looking at a higher tier -- overstating
  // the upgrade's benefit (e.g. a Gold member comparing to Platinum would see
  // "instead of ₦100" when they're actually already earning ₦200 on Gold, so
  // the real gain from upgrading is smaller than shown). Use the member's own
  // current multiplier as the baseline when they have an active membership.
  const currentMultiplierForBaseline = (!membership?.paused && currentTier?.multiplier) || 1;
  const lastOrderBasePoints = lastOrder ? Math.floor(lastOrderValue * POINTS_EARN_RATE * currentMultiplierForBaseline) : 0;
  // Recommend the highest tier whose real extra point value (1 point = ₦1), across your
  // actual order history, would have covered that tier's own price -- i.e. it would have paid for itself.
  const recommendedTier = avgOrderValue > 0
    ? [...MEMBERSHIP_TIERS].reverse().find((t) => {
        const basePts = Math.floor(avgOrderValue * POINTS_EARN_RATE);
        const tierPts = Math.floor(avgOrderValue * POINTS_EARN_RATE * t.multiplier);
        const extraValueAcrossHistory = (tierPts - basePts) * realOrders.length;
        return extraValueAcrossHistory >= t.price;
      })
    // With no order history yet, there's nothing to compute a real
    // recommendation from -- default to pointing new users at the cheapest
    // tier rather than showing no guidance at all.
    : MEMBERSHIP_TIERS[0];
  return (
    <div className="section-pad">
      {currentTier && (
        <div className="panel enter" style={{ background: `linear-gradient(160deg, ${currentTier.color}18, #fff)`, border: `1px solid ${currentTier.color}40` }}>
          <div className="panel-title-row"><div className="panel-title">You're on {currentTier.name}{isTrial ? " (Free Trial)" : ""}</div><span className={`status-pill ${membership.paused ? "prep" : "done"}`}>{membership.paused ? "Paused" : "Active"}</span></div>
          {isTrial ? (
            <div className="muted small" style={{ marginBottom: 10 }}>Free trial -- no charge. Your real reward points multiplier is {currentTier.multiplier}x on every order while it's active. Ends automatically in {trialHoursLeft}h {trialMinsLeft}m -- trials can't be cancelled or paused once started. When it ends, you're simply moved back to no membership -- no charge, nothing auto-renews, and you can subscribe for real any time after.</div>
          ) : membership.paused ? (
            <div className="muted small" style={{ marginBottom: 10 }}>Your {currentTier.multiplier}x multiplier and other benefits are on hold -- you're not being charged, and you'll earn at the base rate until you resume. Your tier and history are kept, so nothing resets.</div>
          ) : (
            <div className="muted small" style={{ marginBottom: 10 }}>{naira(currentTier.price)}/month -- subscribed {membership.subscribedAt ? new Date(membership.subscribedAt).toLocaleDateString() : ""}. Your real reward points multiplier is {currentTier.multiplier}x on every order.
              {membership.subscribedAt && (() => {
                const cycleMs = 30 * 24 * 60 * 60 * 1000;
                const elapsed = (Date.now() - membership.subscribedAt) % cycleMs;
                const daysLeft = Math.max(0, Math.ceil((cycleMs - elapsed) / (24 * 60 * 60 * 1000)));
                return <><br />Renews in {daysLeft} day{daysLeft !== 1 ? "s" : ""}.</>;
              })()}
            </div>
          )}
          {!membership.paused && !isTrial && (
            <div className="muted small" style={{ marginBottom: 10 }}>{pausesRemaining} pause{pausesRemaining !== 1 ? "s" : ""} left in the last 30 days{pausesRemaining === 0 ? " -- you've used both, try again after your oldest pause rolls off" : ""}.</div>
          )}
          {!isTrial && (
            <div style={{ display: "flex", gap: 8 }}>
              {membership.paused ? (
                <button className="ghost-btn-sm" onClick={onResume}>Resume membership</button>
              ) : (
                <button className="ghost-btn-sm" disabled={pausesRemaining === 0} onClick={onPause}>Pause for a month</button>
              )}
              <button className="ghost-btn-sm" onClick={() => confirmAction({ title: "Cancel your membership?", message: "You will lose your points multiplier and member perks.", confirmLabel: "Cancel membership" }, () => onCancel())}>Cancel membership</button>
            </div>
          )}
        </div>
      )}
      {!currentTier && !trialUsed && (
        <div className="panel enter" style={{ background: "linear-gradient(160deg,#F5F3FF,#fff)", border: "1px solid #DDD6FE" }}>
          <div className="panel-title" style={{ color: "var(--purple)" }}>Try Basic free for 2 days</div>
          <div className="muted small" style={{ marginBottom: 10 }}>New here -- get the Basic tier's 2x points multiplier free, no charge. Runs for roughly two days once you start it (exact length depends on when you activate), and it can't be cancelled or paused early -- it just ends on its own. One trial per account.</div>
          <button className="primary-btn-sm" onClick={onStartTrial}>Start free trial</button>
        </div>
      )}
      {(() => {
        if (!currentTier) return null;
        const idx = MEMBERSHIP_TIERS.findIndex((t) => t.key === currentTier.key);
        const nextTier = MEMBERSHIP_TIERS[idx + 1];
        if (!nextTier) return null;
        const newBenefits = nextTier.benefits.filter((b) => !b.startsWith("Everything in"));
        return (
          <div className="panel enter" style={{ background: `linear-gradient(160deg, ${nextTier.color}18, #fff)`, border: `1px solid ${nextTier.color}40` }}>
            <div className="panel-title" style={{ color: nextTier.color }}>Unlock next: {nextTier.name}</div>
            <div className="muted small" style={{ marginBottom: 8 }}>{naira(nextTier.price - currentTier.price)}/month more gets you:</div>
            <div className="list-col">
              {newBenefits.map((b, i) => <div key={i} className="muted small" style={{ display: "flex", gap: 6 }}><CircleCheck size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {b}</div>)}
            </div>
          </div>
        );
      })()}
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFFBEB,#fff)", border: "1px solid #FDE68A" }}>
        <div className="panel-title-row"><div className="panel-title">Customer Membership</div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="ghost-btn-sm" style={tierView === "cards" ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setTierView("cards")}>Cards</button>
            <button className="ghost-btn-sm" style={tierView === "table" ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setTierView("table")}>Compare</button>
          </div>
        </div>
        <div className="muted small" style={{ marginBottom: 14 }}>Each tier includes everything below it, plus its own extras. Paid from your wallet balance -- {naira(wallet)} available.</div>
        {avgOrderValue > 0 ? (
          <div className="muted small" style={{ marginBottom: 14 }}>Based on your {realOrders.length} real order{realOrders.length !== 1 ? "s" : ""} (averaging {naira(avgOrderValue)} in product cost each, before delivery), here's what you'd actually earn per order at each tier -- shown on the cards below.</div>
        ) : (
          <div className="muted small" style={{ marginBottom: 14 }}>Place a real order to see a personalized points estimate here.</div>
        )}
        {tierView === "table" ? (
          <table className="admin-table">
            <thead><tr><th>Tier</th><th>Price</th><th>Multiplier</th><th>Est. pts/order</th><th></th></tr></thead>
            <tbody>
              {MEMBERSHIP_TIERS.map((t) => {
                const isCurrent = membership?.tier === t.key;
                const canAfford = wallet >= t.price;
                const estimatedPoints = avgOrderValue > 0 ? Math.floor(avgOrderValue * POINTS_EARN_RATE * t.multiplier) : null;
                return (
                  <tr key={t.key}>
                    <td className="card-name" style={{ color: t.color, fontSize: 12.5 }}>{t.name}{recommendedTier?.key === t.key && !isCurrent && <span className="status-pill route" style={{ marginLeft: 6 }}>Recommended</span>}</td>
                    <td className="mono">{naira(t.price)}</td>
                    <td className="mono">{t.multiplier}x</td>
                    <td className="mono">{estimatedPoints !== null ? estimatedPoints : "--"}</td>
                    <td>{isCurrent ? <span className="status-pill done">Current</span> : <button className="ghost-btn-sm" disabled={!canAfford} onClick={() => onSubscribe(t.key, t.price)}>{canAfford ? "Subscribe" : "Can't afford"}</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
        <div className="membership-grid">
          {MEMBERSHIP_TIERS.map((t) => {
            const isCurrent = membership?.tier === t.key;
            const canAfford = wallet >= t.price;
            const estimatedPoints = avgOrderValue > 0 ? Math.floor(avgOrderValue * POINTS_EARN_RATE * t.multiplier) : null;
            return (
              <div key={t.key} className={`membership-card ${isCurrent ? "active" : ""}`} style={{ borderColor: isCurrent ? t.color : undefined }}>
                {recommendedTier?.key === t.key && !isCurrent && (
                  <div className="status-pill route" style={{ marginBottom: 8 }}>
                    Recommended for you
                    <span className="muted small" style={{ display: "block", marginTop: 2, fontWeight: 500 }} title="Based on your average order value and order history -- the extra points this tier would've earned you outweighs its monthly cost.">Why: pays for itself based on your order history</span>
                  </div>
                )}
                <div className="card-name" style={{ color: t.color, fontSize: 15 }}>{t.name}</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 10px" }}>{naira(t.price)}<span className="muted small" style={{ fontWeight: 500 }}>/mo</span></div>
                {estimatedPoints !== null && <div className="muted small" style={{ marginBottom: 6, color: t.color, fontWeight: 700 }}>~{estimatedPoints} pts per typical order</div>}
                {lastOrder && !isCurrent && (() => {
                  const tierPointsOnLastOrder = Math.floor(lastOrderValue * POINTS_EARN_RATE * t.multiplier);
                  const diff = tierPointsOnLastOrder - lastOrderBasePoints;
                  return diff > 0 ? (
                    <div className="muted small" style={{ marginBottom: 10 }}>On your last order ({naira(lastOrderValue)}), you'd have earned points worth <b>{naira(tierPointsOnLastOrder)}</b> instead of {naira(lastOrderBasePoints)}.</div>
                  ) : null;
                })()}
                <div className="list-col" style={{ marginBottom: 12 }}>
                  {t.benefits.map((b, i) => <div key={i} className="muted small" style={{ display: "flex", gap: 6 }}><CircleCheck size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {b}</div>)}
                </div>
                {isCurrent ? (
                  <div className="status-pill done">Current plan</div>
                ) : (
                  <button className="primary-btn-sm wide" disabled={!canAfford} onClick={() => onSubscribe(t.key, t.price)}>{canAfford ? "Subscribe" : "Insufficient wallet balance"}</button>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

function StreakCalendarScreen({ orders, communityMessagesSent }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const todayHasActivity = (orders || []).length > 0 || (communityMessagesSent || 0) > 0;
  const weeks = [];
  let day = 1 - firstWeekday;
  while (day <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) { week.push(day); day++; }
    weeks.push(week);
  }
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFFBEB,#fff)", border: "1px solid #FDE68A" }}>
        <div className="panel-title">Loyalty Streak</div>
        <div className="muted small" style={{ marginBottom: 12 }}>A real calendar of the activity days that actually count toward your streaks and challenges -- logins, orders, and community posts. Only today's real activity is shown here; this is a single-session build without a backend, so past days before now aren't tracked yet.</div>
        <div className="streak-cal">
          <div className="streak-cal-head">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
          {weeks.map((week, wi) => (
            <div className="streak-cal-row" key={wi}>
              {week.map((d, di) => {
                const isToday = d === today.getDate();
                const inMonth = d >= 1 && d <= daysInMonth;
                return (
                  <div key={di} className={`streak-cal-day ${!inMonth ? "empty" : ""} ${isToday && todayHasActivity ? "active" : ""} ${isToday ? "today" : ""}`}>
                    {inMonth ? d : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cat-top" style={{ marginTop: 12 }}><span className="muted small">Real activity today</span><span className="mono small">{(orders || []).length} order{(orders || []).length !== 1 ? "s" : ""}, {communityMessagesSent || 0} message{communityMessagesSent !== 1 ? "s" : ""}</span></div>
      </div>
    </div>
  );
}

function ThemesScreen({ activeTheme, unlockedThemes, points, onUnlock, onApply, membership }) {
  const memberUnlocksAll = !membership?.paused && ["diamond", "elite"].includes(membership?.tier);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title"><Palette size={16} style={{ marginRight: 6 }} />Themes</div><PointsBadge points={points} /></div>
        <div className="muted" style={{ marginBottom: 14 }}>Spend points to unlock a new look for your app, or get every theme free with Diamond+ membership. Once unlocked, switching is free.</div>
        <div className="theme-grid">
          {THEMES.map((t) => {
            const unlocked = unlockedThemes.has(t.key) || memberUnlocksAll;
            const active = activeTheme === t.key;
            return (
              <div key={t.key} className={`theme-card ${active ? "active" : ""}`}>
                <div className="theme-swatch" style={{ background: t.accent }} />
                <div className="card-name">{t.name}</div>
                {t.cost > 0 && <div className="muted small">{unlocked ? (memberUnlocksAll && !unlockedThemes.has(t.key) ? "Free with membership" : "Unlocked") : `${t.cost} points`}</div>}
                {unlocked ? (
                  <button className="ghost-btn-sm" style={{ marginTop: 8 }} disabled={active} onClick={() => onApply(t.key)}>{active ? "Active" : "Apply"}</button>
                ) : (
                  <button className="primary-btn-sm" style={{ marginTop: 8 }} disabled={points < t.cost} onClick={() => onUnlock(t.key)}><Lock size={11} /> Unlock</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const REFERRALS = [
  { name: "Chinedu O.", status: "Order placed", earned: 10 },
  { name: "Blessing U.", status: "Order placed", earned: 10 },
  { name: "Tobi J.", status: "Invited, hasn't ordered yet", earned: 0 },
];

const SHARE_NAMES = ["Kelechi B.", "Ngozi F.", "Ibrahim S.", "Funmi O.", "David E.", "Amaka N.", "Segun A.", "Zainab M."];

const REFERRAL_MONTHLY_CAP = 5;

function ReferScreen({ referrals, setReferrals }) {
  const [copied, setCopied] = useState(false);
  const rewardedThisMonth = referrals.filter((r) => r.earned > 0).length;
  const capReached = rewardedThisMonth >= REFERRAL_MONTHLY_CAP;
  const totalEarned = referrals.reduce((s, r) => s + r.earned, 0);

  const share = () => {
    setCopied(true);
    const alreadyNamed = new Set(referrals.map((r) => r.name));
    const nextName = SHARE_NAMES.find((n) => !alreadyNamed.has(n));
    if (nextName) setReferrals((r) => [...r, { name: nextName, status: "Invited, hasn't ordered yet", earned: 0, invitedAt: Date.now() }]);
  };
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ textAlign: "center", padding: 30 }}>
        <Gift size={28} color="#7C3AED" />
        <div className="card-name" style={{ fontSize: 16, margin: "10px 0 4px" }}>Give 10 points, Get 10 points</div>
        <div className="muted" style={{ marginBottom: 16 }}>Invite friends and earn when they place their first order.</div>
        <div className="refer-code" onClick={share}>AMARA10 <Copy size={13} /></div>
        {copied && <div className="muted small" style={{ marginTop: 6 }}>Copied!</div>}
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Your referrals</div><span className="mono" style={{ fontWeight: 700 }}>{totalEarned.toLocaleString()} pts earned</span></div>
        <div className="muted small" style={{ marginBottom: 10 }}>{rewardedThisMonth}/{REFERRAL_MONTHLY_CAP} rewarded referrals used this month{capReached ? " -- you've hit the limit, but you can keep inviting for next month" : ""}.</div>
        {referrals.length === 0 ? <EmptyState icon={Gift} title="No referrals yet" sub="Share your code above to start earning." /> : (
          <div className="list-col">
            {referrals.map((r, i) => (
              <div key={i} className="pending-row">
                <div className="driver-avatar sm">{r.name[0]}</div>
                <div className="ti-mid"><div className="card-name">{r.name}</div><div className="muted small">{r.status}</div></div>
                <div className="mono" style={{ color: r.earned > 0 ? "#16A34A" : "var(--muted)" }}>{r.earned > 0 ? `+${r.earned.toLocaleString()} pts` : "Pending"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {referrals.filter((r) => r.earned > 0).length > 1 && (
        <div className="panel enter">
          <div className="panel-title">Your referral leaderboard</div>
          <div className="muted small" style={{ marginBottom: 10 }}>Just the friends you've referred, ranked by how much you've earned from each -- different from the anonymous platform-wide leaderboard elsewhere.</div>
          <div className="list-col">
            {[...referrals].filter((r) => r.earned > 0).sort((a, b) => b.earned - a.earned).map((r, i) => (
              <div key={r.name} className="pending-row">
                <div className="driver-avatar sm" style={{ background: i === 0 ? "#F59E0B" : "var(--purple)" }}>{i + 1}</div>
                <div className="ti-mid"><div className="card-name">{r.name}</div></div>
                <div className="mono" style={{ fontWeight: 700 }}>{r.earned.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const CUSTOMER_MESSAGES = [
  { name: "Marcus T. (Driver)", preview: "On my way, 5 mins out!", time: "2 min ago", unread: true },
  { name: "Northside Espresso Bar", preview: "Your order's being prepared now!", time: "20 min ago", unread: false },
  { name: "Support", preview: "Your refund has been processed.", time: "1 hr ago", unread: false },
];

function NewCustomerMessageModal({ onStart, onClose }) {
  const [seller, setSeller] = useState(SAVED_STORES[0].name);
  const [text, setText] = useState("");
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>New message</div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>To</span>
          <select className="sort-select" value={seller} onChange={(e) => setSeller(e.target.value)}>{SAVED_STORES.map((s) => <option key={s.name}>{s.name}</option>)}</select>
        </div>
        <div className="field" style={{ marginBottom: 16 }}><span>Message</span><input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message..." /></div>
        <button className="primary-btn-sm wide" disabled={!text.trim()} onClick={() => { onStart(seller, text); onClose(); }}>Send</button>
      </div>
    </div>
  );
}

const COMMUNITY_CHANNELS = [
  { key: "peers", label: "Customer Community" },
  { key: "all", label: "All Medra" },
];
const COMMUNITY_SEED = {
  peers: [
    { author: "Chinedu O.", role: "Customer", time: "8:14 AM", text: "Anyone tried the new bakery on Admiralty Way? Worth it?" },
    { author: "Blessing U.", role: "Customer", time: "8:20 AM", text: "Yes! Get the sourdough, it's fantastic." },
    { author: "Tobi J.", role: "Customer", time: "9:02 AM", text: "The points redemption on my last order felt really generous, nice touch." },
  ],
  all: [
    { author: "Medra Team", role: "Official", time: "9:05 AM", text: "Reminder: peak delivery hours today run 12-2pm and 6-9pm as usual." },
    { author: "Northside Espresso Bar", role: "Seller", time: "8:35 AM", text: "Thanks for the shoutout, Blessing! Fresh batch goes out at 9." },
    { author: "John Rider", role: "Rider", time: "9:00 AM", text: "Roads are clear across Lekki this morning, should be fast deliveries today." },
    { author: "Priya M.", role: "Admin", time: "9:10 AM", text: "Good morning all! Let us know here if anything needs our attention." },
  ],
};
const COMMUNITY_UNLOCK_THRESHOLD = 2;

const GIVEAWAY_PRODUCTS = [
  "Wireless Earbuds Pro", "Espresso Machine", "Running Sneakers", "Cold Brew Concentrate", "Ceramic Vase Set",
  "Smart Watch", "Leather Backpack", "Air Fryer", "Bluetooth Speaker", "Yoga Mat",
  "Skincare Set", "Desk Lamp", "Board Game Bundle", "Camping Tent", "Blender",
  "Sunglasses", "Throw Pillow Set", "Bike Helmet", "Instant Camera", "Wireless Charger",
].map((name, i) => ({ id: `gw${i + 1}`, name, seed: `giveaway-${i}`, votes: Math.floor(20 + Math.random() * 180) }));

const LOTTERY_ENTRY_COST = 15;
const LOTTERY_JACKPOT = 300; // fixed, never scaled by membership tier -- same fair odds for everyone
const LOTTERY_HINTS = [
  `Today's date: ${new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}`,
  "A community member's birthday: 03/14",
  "Yesterday's most popular delivery hour: 18:00",
  "Your lucky number from last week's spin: 07",
];

function LotteryScreen({ points, onEnter, entriesToday, weeklyEntries, extraEntries, onBuyExtraEntry, membership, lastMembershipLotteryBonusMonth, onClaimMemberBonus }) {
  const [picks, setPicks] = useState([]);
  const [lotteryHowOpen, setLotteryHowOpen] = useState(false);
  const lotteryMonthId = `${new Date().getFullYear()}-${new Date().getMonth()}`;
  const togglePick = (n) => setPicks((p) => (p.includes(n) ? p.filter((x) => x !== n) : p.length >= 6 ? p : [...p, n]));
  const canPlayToday = entriesToday < 1 || extraEntries > 0;
  const canAfford = points >= LOTTERY_ENTRY_COST;
  const submit = () => {
    if (picks.length !== 6 || !canPlayToday || !canAfford) return;
    onEnter([...picks].sort((a, b) => a - b), entriesToday >= 1);
    setPicks([]);
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Weekly Lottery</div><span className="muted small">{picks.length} / 6 selected</span></div>
        <button className="link-btn" style={{ marginBottom: 6 }} onClick={() => setLotteryHowOpen(true)}>How it works</button>
        {lotteryHowOpen && <HowItWorksModal title="the Weekly Lottery" onClose={() => setLotteryHowOpen(false)} steps={[
          "Pick 6 numbers from 1-99.",
          `Entering costs ${LOTTERY_ENTRY_COST} points -- one free entry per day, plus any extra entries you've bought or earned.`,
          "Super Admin draws 6 numbers at the end of the week.",
          "The entry closest to the drawn numbers wins the jackpot.",
        ]} />}
        <div className="muted small" style={{ marginBottom: 4 }}>Pick 6 numbers from 1-99. Entry costs {LOTTERY_ENTRY_COST} points, jackpot is {LOTTERY_JACKPOT} points. Super Admin draws 6 numbers at the end of the week -- the closest match wins. One free entry per day, plus any extra entries you've bought or earned below.</div>
        <button className="ghost-btn-sm" style={{ marginBottom: 8 }} disabled={!canPlayToday || !canAfford} onClick={() => {
          const pool = Array.from({ length: 99 }, (_, i) => i + 1);
          const chosen = [];
          while (chosen.length < 6) {
            const n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            chosen.push(n);
          }
          setPicks(chosen.sort((a, b) => a - b));
        }}><Shuffle size={12} /> Quick Pick</button>
        {!canPlayToday && <div className="muted small" style={{ color: "#B45309", marginBottom: 8 }}><AlertTriangle size={11} style={{ verticalAlign: "middle" }} /> You've used today's free entry -- buy an extra entry below to play again, or come back tomorrow.</div>}
        {!canAfford && <div className="muted small" style={{ color: "#DC2626", marginBottom: 8 }}>You need {LOTTERY_ENTRY_COST} points to enter.</div>}
        <div className="lottery-grid">
          {Array.from({ length: 99 }, (_, i) => i + 1).map((n) => (
            <button key={n} className={`lottery-num ${picks.includes(n) ? "picked" : ""}`} disabled={!canPlayToday || !canAfford} onClick={() => togglePick(n)}>{n}</button>
          ))}
        </div>
        <button className="primary-btn-sm" style={{ marginTop: 12 }} disabled={picks.length !== 6 || !canPlayToday || !canAfford} onClick={submit}>Enter for {LOTTERY_ENTRY_COST} points</button>
      </div>
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#F3EEFF,#fff)", border: "1px solid #DDD6FE" }}>
        <div className="panel-title"><Ticket size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Extra entries</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Already used today's free entry? Buy more chances to play, any day this week.</div>
        <div className="cat-top" style={{ marginBottom: 10 }}><span className="muted">Extra entries available</span><span className="mono" style={{ fontWeight: 700 }}>{extraEntries}</span></div>
        <div className="cat-top" style={{ gap: 8 }}>
          <button className="ghost-btn-sm" disabled={points < 20} onClick={onBuyExtraEntry}>Buy 1 extra entry -- 20 points</button>
          {!membership?.paused && ["diamond", "elite"].includes(membership?.tier) && lastMembershipLotteryBonusMonth !== lotteryMonthId && (
            <button className="ghost-btn-sm" onClick={onClaimMemberBonus}>Claim your free member entry</button>
          )}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Hints for inspiration</div>
        <div className="list-col">{LOTTERY_HINTS.map((h) => <div key={h} className="muted small">- {h}</div>)}</div>
      </div>
      {weeklyEntries.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Your entries this week</div>
          <div className="list-col">
            {weeklyEntries.map((e, i) => <div key={i} className="mono small">{e.join(" - ")}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

function GiveawayScreen({ deliveredCount, disqualified, dailyPick, onPick }) {
  const [selected, setSelected] = useState(null);
  const today = new Date().toDateString();
  const alreadyPicked = dailyPick.date === today;
  const qualifies = deliveredCount >= 20 && !disqualified;
  const confirmPick = () => { if (selected) onPick(selected, today); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Monthly Giveaway -- Pick of the Day</div>
        <div className="muted" style={{ marginBottom: 12 }}>Pick your favorite giveaway item once a day, every day this month -- no points for voting, this just decides what's up for grabs. The top 3 most-picked items become this month's giveaway, and 3 qualified customers are chosen at random to each win one.</div>
        <div className={`cap-warning-banner ${qualifies ? "" : ""}`} style={{ background: qualifies ? "#EEF7F0" : "#FFF7ED", color: qualifies ? "#16A34A" : "#B45309" }}>
          {qualifies ? <CircleCheck size={13} /> : <AlertTriangle size={13} />}
          {qualifies ? "You qualify for this month's giveaway!" : `You need 20 successful deliveries this month with no refunds or returns to qualify. You're at ${deliveredCount}/20${disqualified ? " -- a refund/return this month disqualifies you." : "."}`}
        </div>
        {alreadyPicked ? (
          <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> You already picked "{dailyPick.name}" today -- come back tomorrow for your next pick.</div>
        ) : (
          <>
            <div className="prod-grid" style={{ marginTop: 12 }}>
              {GIVEAWAY_PRODUCTS.map((p) => (
                <button key={p.id} className={`giveaway-pick-card ${selected === p.id ? "selected" : ""}`} onClick={() => setSelected(p.id)}>
                  <img src={img(p.seed, 140)} alt={p.name} />
                  <div className="muted small" style={{ padding: "0 6px 6px" }}>{p.name}</div>
                </button>
              ))}
            </div>
            <button className="primary-btn-sm" style={{ marginTop: 12 }} disabled={!selected} onClick={confirmPick}>Confirm today's pick</button>
          </>
        )}
      </div>
    </div>
  );
}

function TreasureHuntScreen({ foundCount, huntStartDate }) {
  const daysElapsed = Math.floor((Date.now() - huntStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 30 - daysElapsed);
  const complete = foundCount >= 10;
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ textAlign: "center", padding: 26 }}>
        <Gift size={26} color="#EA580C" />
        <div className="kpi-value" style={{ fontSize: 28, margin: "8px 0 2px" }}>{foundCount} / 10 codes found</div>
        <div className="muted">{daysLeft} days left in this month's hunt</div>
        <div className="bar-track" style={{ marginTop: 12 }}><div className="bar-fill-h" style={{ width: `${(foundCount / 10) * 100}%`, background: "#EA580C" }} /></div>
      </div>
      {complete && (
        <div className="panel enter"><div className="muted small" style={{ color: "#16A34A" }}><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Full collection complete -- your 100 bonus points are already in your balance!</div></div>
      )}
      <div className="panel enter">
        <div className="panel-title">How it works</div>
        <div className="muted">Codes are hidden throughout the app, tied to real purchases -- rating your driver or completing an order both have a chance to surface one. Each code is worth 10 points, and finishing the full set of 10 earns a 100-point bonus. Up to 2 codes can be found per day, and the hunt resets every month.</div>
      </div>
    </div>
  );
}

function dailyDiscoveryProduct(date) {
  const dayStr = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayStr.length; i++) hash = (hash * 31 + dayStr.charCodeAt(i)) >>> 0;
  return { product: PRODUCTS[hash % PRODUCTS.length], id: dayStr };
}

const COMMUNITY_REQUESTS_SEED = [
  { id: "CR1", author: "Tobi J.", type: "Ride", text: "Need a ride to the market this Saturday morning -- happy to split fuel cost.", helpers: [], resolved: false, postedAt: "2 days ago" },
  { id: "CR2", author: "Ngozi F.", type: "Groceries", text: "Recovering from surgery, could use groceries picked up this week if anyone's headed that way.", helpers: [{ name: "Blessing U.", kind: "points", amount: 150 }], resolved: false, postedAt: "1 day ago" },
  { id: "CR3", author: "Ibrahim S.", type: "School Supplies", text: "Looking for a few notebooks and pens for my daughter's new term -- anything helps.", helpers: [], resolved: false, postedAt: "5 hours ago" },
];
const CURRENT_CUSTOMER_NAME = CUSTOMER.name;

const ADOPT_MILESTONES = [3, 10, 25];

const GOOD_DEED_GOALS = [
  { key: "help3", label: "Help 3 community members", target: 3, points: 60 },
  { key: "review5", label: "Leave 5 driver reviews", target: 5, points: 60 },
  { key: "donate1", label: "Contribute to a donation", target: 1, points: 40 },
];

function mysteryBoxRewardForDate(date) {
  const dayStr = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dayStr.length; i++) hash = (hash * 31 + dayStr.charCodeAt(i)) >>> 0;
  const tiers = [15, 20, 25, 40, 75];
  return { amount: tiers[hash % tiers.length], id: dayStr };
}

function causeOfTheMonth(date) {
  const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
  let hash = 0;
  for (let i = 0; i < monthKey.length; i++) hash = (hash * 31 + monthKey.charCodeAt(i)) >>> 0;
  return DONATION_CAUSES[hash % DONATION_CAUSES.length];
}

const LOCAL_CHALLENGE_TARGET = 5000;
function localChallengeWeekId(date) {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil((((date - jan1) / 86400000) + jan1.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${week}`;
}

function fantasyLeagueWeekWinner(date) {
  const weekId = localChallengeWeekId(date);
  // Real signal: each category's odds of winning are weighted by its real total review
  // count (a genuine proxy for sales volume) -- popular categories win more often, but
  // the week's specific pick still varies deterministically week to week, not fabricated
  // from nothing and not frozen on a single permanent "winner."
  const reviewsByCategory = {};
  PRODUCTS.forEach((p) => { reviewsByCategory[p.category] = (reviewsByCategory[p.category] || 0) + (p.reviews || 0); });
  const weighted = CATEGORIES.flatMap((c) => Array(Math.max(1, Math.round((reviewsByCategory[c.key] || 0) / 200))).fill(c));
  let hash = 0;
  for (let i = 0; i < weekId.length; i++) hash = (hash * 31 + weekId.charCodeAt(i)) >>> 0;
  return { category: weighted[hash % weighted.length], id: weekId };
}

function FantasyLeagueScreen({ picks, onPick }) {
  const week = fantasyLeagueWeekWinner(new Date());
  const myPick = picks[week.id];
  const picked = !!myPick;
  const won = picked && myPick === week.category.key;
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Marketplace Fantasy League</div>
        <div className="muted small" style={{ marginBottom: 14 }}>Pick which category you think will be the top seller this week. Guess right and earn 30 points once the week's results are in.</div>
        {picked ? (
          <div>
            <div className="muted small" style={{ marginBottom: 8 }}>Your pick: <b>{CATEGORIES.find((c) => c.key === myPick)?.label}</b></div>
            <div className="muted small">This week's top seller: <b>{week.category.label}</b> -- {won ? <span style={{ color: "#16A34A" }}><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Correct, +30 points!</span> : "not this week -- try again next week."}</div>
          </div>
        ) : (
          <div className="list-col">
            {CATEGORIES.map((c) => (
              <button key={c.key} className="pending-row" style={{ width: "100%", textAlign: "left" }} onClick={() => onPick(week.id, c.key, c.key === week.category.key)}>
                <div className="ti-mid"><c.icon size={16} color={c.color} /> <span className="card-name" style={{ marginLeft: 8 }}>{c.label}</span></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CauseOfTheMonthScreen({ points, donations, onDonate }) {
  const [amount, setAmount] = useState("");
  const cause = causeOfTheMonth(new Date());
  const raisedThisMonth = donations.filter((d) => d.cause === cause.key).reduce((s, d) => s + d.amount, 0);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="status-pill route" style={{ marginBottom: 10 }}>Cause of the Month</div>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 4 }}>{cause.label}</div>
        <div className="muted small" style={{ marginBottom: 14 }}>{cause.desc}</div>
        <div className="cat-top" style={{ marginBottom: 14 }}><span className="muted small">Raised this month</span><span className="mono" style={{ fontWeight: 700 }}>{raisedThisMonth.toLocaleString()} points</span></div>
        <div className="cat-top" style={{ gap: 8 }}>
          <input type="number" min="1" max={points} placeholder="Points to give -- no maximum" value={amount} style={{ flex: 1 }} onChange={(e) => setAmount(e.target.value)} />
          <button className="primary-btn-sm" disabled={!amount || Number(amount) <= 0 || Number(amount) > points} onClick={() => { onDonate(cause.key, Number(amount)); setAmount(""); }}>Contribute</button>
        </div>
      </div>
    </div>
  );
}

function DailyMysteryBoxScreen({ claimedDays, onClaim }) {
  const today = mysteryBoxRewardForDate(new Date());
  const claimed = !!claimedDays[today.id];
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ textAlign: "center", padding: 34 }}>
        <div style={{ fontSize: 40 }}>🎁</div>
        <div className="card-name" style={{ fontSize: 16, margin: "12px 0 4px" }}>Today's Mystery Box</div>
        <div className="muted small" style={{ marginBottom: 20 }}>One free box a day -- the amount inside is random, but locked in for today the moment you check.</div>
        {claimed ? (
          <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Opened today's box -- +{today.amount} points added. Come back tomorrow for another.</div>
        ) : (
          <button className="primary-btn-sm" onClick={() => onClaim(today.id, today.amount)}>Open today's box</button>
        )}
      </div>
    </div>
  );
}

function GoodDeedChallengesScreen({ helpedCount, reviewCount, donationCount, claimed, onClaim }) {
  const progressFor = (key) => key === "help3" ? helpedCount : key === "review5" ? reviewCount : donationCount;
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Good Deed Challenges</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Complete real community actions to earn points -- no simulate buttons, this tracks what you've actually done.</div>
        <div className="list-col">
          {GOOD_DEED_GOALS.map((g) => {
            const progress = Math.min(g.target, progressFor(g.key));
            const done = progress >= g.target;
            const isClaimed = claimed.includes(g.key);
            return (
              <div key={g.key} className="pending-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div className="cat-top" style={{ marginBottom: 6 }}><span className="card-name" style={{ fontSize: 13 }}>{g.label}</span><span className="mono small">{progress}/{g.target}</span></div>
                <div className="bar-track" style={{ marginBottom: 8 }}><div className="bar-fill-h" style={{ width: `${(progress / g.target) * 100}%`, background: done ? "#16A34A" : "var(--purple)" }} /></div>
                {isClaimed ? (
                  <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Claimed +{g.points} points</div>
                ) : done ? (
                  <button className="ghost-btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => onClaim(g.key, g.points)}>Claim +{g.points} points</button>
                ) : (
                  <div className="muted small">Keep going -- {g.target - progress} more to go.</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ActivityFeedScreen({ orders, claimedBadges, membership, donations, giftCards, sponsorshipsGiven }) {
  const [filter, setFilter] = useState("all");
  const events = [];
  (orders || []).forEach((o) => {
    events.push({ type: "order", icon: Package, color: "#2563EB", text: `Order #${o.id} placed -- ${naira(o.total)}`, sortKey: o.stageTimestamps?.placed || "" });
  });
  ACHIEVEMENT_BADGES.forEach((b) => {
    if (claimedBadges.has(b.key)) events.push({ type: "badge", icon: Award, color: "#F59E0B", text: `Unlocked the "${b.label}" badge`, sortKey: "z" });
  });
  if (membership) {
    const tier = MEMBERSHIP_TIERS.find((t) => t.key === membership.tier);
    events.push({ type: "membership", icon: BadgeCheck, color: tier?.color || "#7C3AED", text: `Subscribed to ${tier?.name || "Membership"}`, sortKey: membership.subscribedAt ? new Date(membership.subscribedAt).toLocaleTimeString() : "z" });
  }
  (donations || []).forEach((d) => {
    events.push({ type: "giving", icon: Heart, color: "#E11D48", text: `You donated ${d.amount.toLocaleString()} points to ${DONATION_CAUSES.find((c) => c.key === d.cause)?.label || d.cause}`, sortKey: new Date(d.at).toISOString() });
  });
  (giftCards || []).forEach((g) => {
    events.push({ type: "giving", icon: Heart, color: "#E11D48", text: `You sent a ${g.amount.toLocaleString()}-point gift code${g.redeemed ? " -- claimed" : ""}`, sortKey: new Date(g.createdAt).toISOString() });
  });
  (sponsorshipsGiven || []).forEach((s) => {
    events.push({ type: "giving", icon: Heart, color: "#E11D48", text: `You sponsored ${s.amount.toLocaleString()} points to the Community Care Pool`, sortKey: new Date(s.at).toISOString() });
  });
  const types = ["all", "order", "badge", "membership", "giving"];
  const typeLabel = { all: "All", order: "Orders", badge: "Badges", membership: "Membership", giving: "Giving" };
  const filtered = (filter === "all" ? events : events.filter((e) => e.type === filter)).sort((a, b) => (b.sortKey || "").localeCompare(a.sortKey || ""));
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#EAF3FF,#fff)", border: "1px solid #BFDBFE" }}>
        <div className="panel-title">Your Activity</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Orders, badges, membership changes, and everything you've given -- donations, gifts, sponsorships -- in one place, not scattered across separate screens.</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {types.map((t) => (
            <button key={t} className="ghost-btn-sm" style={filter === t ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setFilter(t)}>{typeLabel[t]}</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <EmptyNote>Nothing here yet -- place an order, unlock a badge, or give something to see it show up.</EmptyNote>
        ) : (
          <div className="list-col">
            {filtered.map((e, i) => (
              <div key={i} className="flag-row">
                <e.icon size={15} color={e.color} />
                <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>{e.text}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VendorSupportScreen({ orders, adoptedVendors, onAdopt, onUnadopt, claimedMilestones, onClaimMilestone, fanClubs, setFanClubs }) {
  const [fanClubSearch, setFanClubSearch] = useState("");
  const ordersWithVendor = (vendorName) => orders.filter((o) => (o.items || []).some((it) => it.sellerName === vendorName)).length;
  const filtered = SELLER_POOL.filter((s) => s.name.toLowerCase().includes(fanClubSearch.toLowerCase()));
  const MAX_ADOPTED = 3;

  return (
    <div className="section-pad">
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFF1F5,#fff)", border: "1px solid #FBCFE8" }}>
        <div className="panel-title"><Heart size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Support a Vendor</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Join a vendor's fan club for status and early access -- or adopt up to {MAX_ADOPTED} to track real order milestones and earn points. You've adopted {adoptedVendors.length}/{MAX_ADOPTED}. Search all real vendors on Medra, not just ones you've already saved.</div>
        <div className="field" style={{ marginBottom: 10 }}><input type="text" placeholder="Search vendors..." value={fanClubSearch} onChange={(e) => setFanClubSearch(e.target.value)} /></div>
        <div className="list-col">
          {filtered.map((s) => {
            const joined = fanClubs.has(s.name);
            const saved = SAVED_STORES.find((x) => x.name === s.name);
            const isAdopted = adoptedVendors.includes(s.name);
            const orderCount = ordersWithVendor(s.name);
            return (
              <div key={s.name} className="pending-row">
                <div className="driver-avatar sm">{s.initials || s.name[0]}</div>
                <div className="ti-mid"><div className="card-name">{s.name}{isAdopted && <span className="status-pill route" style={{ marginLeft: 6 }}>Adopted</span>}</div><div className="muted small">{isAdopted ? `${orderCount} order${orderCount !== 1 ? "s" : ""} placed so far` : joined ? "Member -- early access to sales" : (saved ? saved.category : "Tap to join their fan club")}</div></div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="ghost-btn-sm" onClick={() => setFanClubs((f) => { const n = new Set(f); n.has(s.name) ? n.delete(s.name) : n.add(s.name); return n; })}>{joined ? "Leave" : "Join"}</button>
                  {!isAdopted && adoptedVendors.length < MAX_ADOPTED && <button className="ghost-btn-sm" onClick={() => onAdopt(s.name)}>Adopt</button>}
                  {isAdopted && <button className="ghost-btn-sm" onClick={() => onUnadopt(s.name)}>Unadopt</button>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="muted small">No vendors match "{fanClubSearch}".</div>}
        </div>
      </div>

      {adoptedVendors.map((adoptedVendor) => (
        <div key={adoptedVendor} className="panel enter" style={{ background: "linear-gradient(160deg,#FFF1F5,#fff)", border: "1px solid #FBCFE8" }}>
          <div className="panel-title">Milestones with {adoptedVendor}</div>
          <div className="muted small" style={{ marginBottom: 10 }}>{ordersWithVendor(adoptedVendor)} real order{ordersWithVendor(adoptedVendor) !== 1 ? "s" : ""} placed with them so far.</div>
          <div className="list-col">
            {ADOPT_MILESTONES.map((m) => {
              const count = ordersWithVendor(adoptedVendor);
              const reached = count >= m;
              const claimed = claimedMilestones.includes(`${adoptedVendor}:${m}`);
              return (
                <div key={m} className="cat-top">
                  <span className="muted small">{m} orders milestone</span>
                  {claimed ? <span className="status-pill done">Claimed +{m * 10} pts</span> : reached ? <button className="ghost-btn-sm" onClick={() => onClaimMilestone(adoptedVendor, m)}>Claim +{m * 10} points</button> : <span className="muted small">{count}/{m}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommunityRequestsScreen({ requests, onPost, onHelpRide, onHelpPoints, onResolve, points }) {
  const [type, setType] = useState("Ride");
  const [text, setText] = useState("");
  const [givingId, setGivingId] = useState(null);
  const [giveAmount, setGiveAmount] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNote, setResolveNote] = useState("");

  const post = () => {
    if (!text.trim()) return;
    onPost(type, text.trim());
    setText("");
  };

  const sendGift = (id) => {
    const amt = Number(giveAmount);
    if (!amt || amt <= 0 || amt > points) return;
    onHelpPoints(id, amt);
    setGivingId(null);
    setGiveAmount("");
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Post a request</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Need a ride, groceries picked up, school supplies, or advice? Post it here -- other community members can offer to help, either with a real ride/errand or a real points gift.</div>
        <div className="field" style={{ marginBottom: 8 }}>
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="sort-select">
            <option>Ride</option><option>Groceries</option><option>School Supplies</option><option>Advice</option><option>Other</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 8 }}><span>What do you need?</span><textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe what you need help with..." style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical" }} /></div>
        <button className="primary-btn-sm" disabled={!text.trim()} onClick={post}>Post request</button>
      </div>

      {requests.map((r) => {
        const myHelp = r.helpers.find((h) => h.name === CURRENT_CUSTOMER_NAME);
        const pointsGiven = r.helpers.filter((h) => h.kind === "points").reduce((s, h) => s + h.amount, 0);
        return (
          <div className="panel enter" key={r.id}>
            <div className="panel-title-row">
              <div className="panel-title" style={{ fontSize: 14 }}>{r.author}{r.author === CURRENT_CUSTOMER_NAME ? " (you)" : ""} -- {r.type}</div>
              {r.resolved ? <span className="status-pill done">Resolved</span> : <span className="muted small">{r.postedAt}</span>}
            </div>
            <div className="muted small" style={{ marginBottom: 10 }}>{r.text}</div>
            {r.helpers.length > 0 && (
              <div className="list-col" style={{ marginBottom: 10 }}>
                {r.helpers.map((h, i) => (
                  <div key={i} className="muted small">{h.name}{h.name === CURRENT_CUSTOMER_NAME ? " (you)" : ""} -- {h.kind === "points" ? `gifted ${h.amount} points` : "offered a ride/errand"}{r.resolved && <span style={{ color: "#16A34A", fontWeight: 600 }}> -- Thanked</span>}</div>
                ))}
                {pointsGiven > 0 && <div className="muted small" style={{ fontWeight: 700 }}>{pointsGiven} points raised so far</div>}
              </div>
            )}
            {r.resolved && r.resolved.note && (
              <div className="muted small" style={{ marginBottom: 10, padding: "8px 10px", background: "var(--purple-light)", borderRadius: 8 }}><Heart size={11} style={{ verticalAlign: "middle" }} /> "{r.resolved.note}" -- {r.author}</div>
            )}
            {!r.resolved && (
              <div>
                {r.author === CURRENT_CUSTOMER_NAME ? (
                  resolvingId === r.id ? (
                    <div className="cat-top" style={{ gap: 8 }}>
                      <input type="text" placeholder="Optional thank-you note for your helpers" value={resolveNote} style={{ flex: 1 }} onChange={(e) => setResolveNote(e.target.value)} />
                      <button className="ghost-btn-sm" onClick={() => { onResolve(r.id, resolveNote.trim() || null); setResolvingId(null); setResolveNote(""); }}>Confirm</button>
                    </div>
                  ) : (
                    <button className="ghost-btn-sm" onClick={() => setResolvingId(r.id)}>Mark resolved</button>
                  )
                ) : myHelp ? (
                  <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> You already offered to help</div>
                ) : givingId === r.id ? (
                  <div className="cat-top" style={{ gap: 8 }}>
                    <input type="number" min="1" max={points} placeholder="Points to give" value={giveAmount} style={{ width: 110 }} onChange={(e) => setGiveAmount(e.target.value)} />
                    <button className="ghost-btn-sm" disabled={!giveAmount || Number(giveAmount) <= 0 || Number(giveAmount) > points} onClick={() => sendGift(r.id)}>Send gift</button>
                    <button className="ghost-btn-sm" onClick={() => setGivingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="cat-top" style={{ gap: 8 }}>
                    <button className="ghost-btn-sm" onClick={() => onHelpRide(r.id)}>Offer a ride/errand</button>
                    <button className="ghost-btn-sm" onClick={() => setGivingId(r.id)}>Gift points</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReputationScoreScreen({ orders, donations, giftCards, referrals }) {
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const reviewsLeft = orders.filter((o) => o.rating > 0).length;
  const donationCount = donations.length;
  const giftsSent = giftCards.length;
  const successfulReferrals = referrals.filter((r) => r.earned > 0).length;
  const score = deliveredOrders * 2 + reviewsLeft * 3 + donationCount * 4 + giftsSent * 4 + successfulReferrals * 5;
  const tier = score >= 100 ? "Trusted Pillar" : score >= 50 ? "Community Regular" : score >= 20 ? "Getting Started" : "New Face";

  const rows = [
    { label: "Orders completed", value: deliveredOrders, weight: "×2" },
    { label: "Reviews left", value: reviewsLeft, weight: "×3" },
    { label: "Donations made", value: donationCount, weight: "×4" },
    { label: "Gifts sent", value: giftsSent, weight: "×4" },
    { label: "Successful referrals", value: successfulReferrals, weight: "×5" },
  ];

  return (
    <div className="section-pad">
      <div className="panel enter" style={{ textAlign: "center", padding: 30 }}>
        <div className="muted small" style={{ marginBottom: 4 }}>Your Reputation Score</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#7C3AED" }}>{score}</div>
        <div className="status-pill route" style={{ display: "inline-block", marginTop: 6 }}>{tier}</div>
        <div className="muted small" style={{ marginTop: 10 }}>A real, live score based on what you've actually done on Medra -- not a level you grind, a trust signal built from real activity.</div>
      </div>
      <div className="panel enter">
        <div className="panel-title">How it's calculated</div>
        <div className="list-col">
          {rows.map((r, i) => (
            <div key={i} className="cat-top">
              <span className="muted small">{r.label} <span style={{ opacity: 0.6 }}>({r.weight})</span></span>
              <span className="mono small">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyDiscoveryScreen({ claimedDays, onClaim, onView, orders }) {
  const today = dailyDiscoveryProduct(new Date());
  const claimed = !!claimedDays[today.id];
  const p = today.product;
  const boughtToday = (orders || []).some((o) => (o.items || []).some((it) => it.productId === p.id));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title"><Sparkles size={16} style={{ verticalAlign: "middle", marginRight: 4 }} /> Today's Discovery</div>
        <div className="muted small" style={{ marginBottom: 14 }}>One product is featured every day. Just browsing doesn't earn anything -- but if you actually buy it, you get 10 points. Come back tomorrow for a new pick.</div>
        <div className="pending-row">
          <img src={`https://picsum.photos/seed/${p.seed}/64/64`} style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} alt={p.name} />
          <div className="ti-mid"><div className="card-name">{p.name}</div><div className="muted small">{naira(p.price)} -- <Stars value={p.rating} size={10} /></div></div>
          <button className="ghost-btn-sm" onClick={() => onView(p)}>View</button>
        </div>
        <div style={{ marginTop: 12 }}>
          {claimed ? (
            <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> You bought today's discovery -- 10 points added.</div>
          ) : boughtToday ? (
            <button className="primary-btn-sm" onClick={() => onClaim(today.id)}>You bought this -- claim 10 points</button>
          ) : (
            <div className="muted small">Buy this product to earn 10 points -- viewing alone doesn't count.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductBattlesScreen({ battleVotes, onVote }) {
  const today = battleOfDay(new Date());
  const myVote = battleVotes[today.id];
  const voted = !!myVote;
  const won = voted && myVote === today.winner;
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ textAlign: "center", padding: 30 }}>
        <Flame size={28} color="#EA580C" />
        <div className="card-name" style={{ fontSize: 16, margin: "10px 0 4px" }}>Today's Battle</div>
        <div className="muted" style={{ marginBottom: 20 }}>Vote for your pick -- everyone who votes for today's winner earns 2 points. A new battle drops every day.</div>
        <div className="cat-top" style={{ gap: 14, justifyContent: "center" }}>
          <button className="ghost-btn-sm" style={{ padding: "18px 28px", fontSize: 15, background: voted && myVote === "a" ? "#F3EEFF" : undefined, border: voted && myVote === "a" ? "1px solid #6D28D9" : undefined }} disabled={voted} onClick={() => onVote(today.id, "a", today.winner)}>{today.a}</button>
          <span className="muted">vs</span>
          <button className="ghost-btn-sm" style={{ padding: "18px 28px", fontSize: 15, background: voted && myVote === "b" ? "#F3EEFF" : undefined, border: voted && myVote === "b" ? "1px solid #6D28D9" : undefined }} disabled={voted} onClick={() => onVote(today.id, "b", today.winner)}>{today.b}</button>
        </div>
        {voted && (
          <div className="muted small" style={{ marginTop: 18 }}>
            Today's winner: <b>{today.winner === "a" ? today.a : today.b}</b> -- {won ? <span style={{ color: "#16A34A" }}><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> You picked right, +2 points!</span> : "not your pick this time, no points -- come back tomorrow."}
          </div>
        )}
      </div>
    </div>
  );
}

function WishListScreen({ points, wishes, onCreateWish, onContribute, onDismiss }) {
  const [itemName, setItemName] = useState("");
  const [goal, setGoal] = useState("");
  const [contributeAmounts, setContributeAmounts] = useState({});

  const create = () => {
    if (!itemName.trim() || !goal || Number(goal) <= 0) return;
    onCreateWish(itemName.trim(), Number(goal));
    setItemName("");
    setGoal("");
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Start a wish</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Name something you're saving points toward, set a goal, and contribute points whenever you like. Want a guaranteed bonus instead of a specific goal? Time Capsules under Rewards locks points for 30 days for a real 1% payout.</div>
        <div className="field" style={{ marginBottom: 8 }}><span>What are you wishing for?</span><input placeholder="e.g. New blender" value={itemName} onChange={(e) => setItemName(e.target.value)} /></div>
        <div className="field" style={{ marginBottom: 8 }}><span>Goal (points)</span><input type="number" min="1" placeholder="10000" value={goal} onChange={(e) => setGoal(e.target.value)} /></div>
        <button className="primary-btn-sm" disabled={!itemName.trim() || !goal || Number(goal) <= 0} onClick={create}>Start wishing</button>
      </div>

      {wishes.length === 0 ? (
        <EmptyState icon={Sparkles} title="No wishes yet" sub="Start one above to begin saving points toward something." />
      ) : (
        wishes.slice().reverse().map((w) => {
          const pct = Math.min(100, Math.round((w.current / w.goal) * 100));
          const done = w.current >= w.goal;
          const draft = contributeAmounts[w.id] || "";
          return (
            <div className="panel enter" key={w.id}>
              <div className="panel-title-row"><div className="panel-title">{w.item}</div>{done && <span className="status-pill done">Goal reached</span>}</div>
              <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">{w.current.toLocaleString()} / {w.goal.toLocaleString()} points</span><span className="mono small">{pct}%</span></div>
              <div className="bar-track" style={{ marginBottom: 10 }}><div className="bar-fill-h" style={{ width: `${pct}%`, background: done ? "#16A34A" : "var(--purple)" }} /></div>
              {done ? (
                <button className="ghost-btn-sm" onClick={() => confirmAction({ title: "Clear this wish?", message: "It will be removed from your wishlist alerts.", confirmLabel: "Clear" }, () => onDismiss(w.id))}>Clear this wish</button>
              ) : (
                <div className="cat-top" style={{ gap: 8 }}>
                  <input type="number" min="1" max={Math.min(points, w.goal - w.current)} placeholder="Points" value={draft} style={{ width: 100 }} onChange={(e) => setContributeAmounts((d) => ({ ...d, [w.id]: e.target.value }))} />
                  <button className="ghost-btn-sm" disabled={!draft || Number(draft) <= 0 || Number(draft) > points} onClick={() => { onContribute(w.id, Math.min(Number(draft), w.goal - w.current)); setContributeAmounts((d) => ({ ...d, [w.id]: "" })); }}>Contribute</button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function ProductDraftsScreen({ draftRound, draftHistory, onSubmit, onResolve }) {
  const [selected, setSelected] = useState([]);
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s));
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  if (draftRound && !draftRound.resolved) {
    const msLeft = Math.max(0, draftRound.submittedAt + WEEK_MS - Date.now());
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    const ready = msLeft === 0;
    return (
      <div className="section-pad">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Your Product Draft</div>{ready && <span className="status-pill done">Results ready</span>}</div>
          <div className="muted small" style={{ marginBottom: 10 }}>You picked these 3 products to become top sellers this week.</div>
          <div className="list-col" style={{ marginBottom: 10 }}>
            {draftRound.picks.map((id) => { const p = PRODUCTS.find((x) => x.id === id); return <div key={id} className="pending-row"><div className="ti-mid card-name">{p?.name || "Product"}</div></div>; })}
          </div>
          {ready ? (
            <button className="primary-btn-sm" onClick={onResolve}>See results</button>
          ) : (
            <div className="muted small">Results in {daysLeft} day{daysLeft !== 1 ? "s" : ""}.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="section-pad">
      {draftHistory.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Last round's results</div>
          {(() => {
            const last = draftHistory[draftHistory.length - 1];
            const winnerProduct = last.winnerId ? PRODUCTS.find((p) => p.id === last.winnerId) : null;
            return winnerProduct ? (
              <div className="muted small">Your pick <strong>{winnerProduct.name}</strong> was your top performer with {last.winnerQty} unit{last.winnerQty !== 1 ? "s" : ""} ordered -- {last.pointsAwarded} points awarded.</div>
            ) : (
              <div className="muted small">None of your picks were ordered during the week -- {last.pointsAwarded} consolation points awarded for playing.</div>
            );
          })()}
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title">Start a new draft</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Pick 3 products you think will sell the most over the coming week ({selected.length}/3 selected).</div>
        <div className="list-col" style={{ marginBottom: 10 }}>
          {PRODUCTS.map((p) => {
            const isPicked = selected.includes(p.id);
            return (
              <button key={p.id} className="pending-row" style={{ width: "100%", textAlign: "left", background: isPicked ? "#EEF2FF" : undefined, border: isPicked ? "1px solid #6366F1" : undefined }} onClick={() => toggle(p.id)}>
                <div className="ti-mid"><div className="card-name">{p.name}</div><div className="muted small">{CATEGORIES.find((c) => c.key === p.category)?.label}</div></div>
                {isPicked && <CircleCheck size={16} color="#6366F1" />}
              </button>
            );
          })}
        </div>
        <button className="primary-btn-sm wide" disabled={selected.length !== 3} onClick={() => onSubmit(selected)}>Lock in picks</button>
      </div>
    </div>
  );
}

function GroupOrdersScreen({ groupOrders, onCreate, onAddMember, onAddItem, onRemoveItem, onTogglePaid, onPlace }) {
  const [newName, setNewName] = useState("");
  const [openId, setOpenId] = useState(null);
  const [memberNameDraft, setMemberNameDraft] = useState({});
  const [itemDraft, setItemDraft] = useState({});

  const create = () => {
    if (!newName.trim()) return;
    const id = onCreate(newName.trim());
    setNewName("");
    setOpenId(id);
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Start a group order</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Ordering with friends or coworkers? Start a group order, add everyone's items, and check out together as one delivery. Since there's no live multi-device sync yet, add items on behalf of whoever's with you (in person or on a call) rather than sharing the code remotely and waiting for it to update.</div>
        <div className="field" style={{ marginBottom: 8 }}><span>Group order name</span><input placeholder="e.g. Friday lunch" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} /></div>
        <button className="primary-btn-sm" disabled={!newName.trim()} onClick={create}>Start group order</button>
      </div>

      {groupOrders.length === 0 ? (
        <EmptyState icon={Users} title="No group orders yet" sub="Start one above to split a delivery with others." />
      ) : (
        groupOrders.slice().reverse().map((g) => {
          const isOpen = openId === g.id;
          const total = g.members.reduce((s, m) => s + m.items.reduce((si, it) => si + it.price * it.qty, 0), 0);
          const allPaid = g.members.length > 0 && g.members.every((m) => m.paid);
          const hasItems = g.members.some((m) => m.items.length > 0);
          return (
            <div className="panel enter" key={g.id}>
              <div className="panel-title-row" style={{ cursor: "pointer" }} onClick={() => setOpenId(isOpen ? null : g.id)}>
                <div className="panel-title">{g.name}</div>
                <span className={`status-pill ${g.status === "placed" ? "done" : "route"}`}>{g.status === "placed" ? "Placed" : "Open"}</span>
              </div>
              <div className="muted small" style={{ marginBottom: 8 }}>Share code <span className="mono small">{g.code}</span> -- {g.members.length} member{g.members.length !== 1 ? "s" : ""} -- {naira(total)} so far</div>
              {isOpen && (
                <>
                  <div className="list-col" style={{ marginBottom: 10 }}>
                    {g.members.map((m) => {
                      const subtotal = m.items.reduce((s, it) => s + it.price * it.qty, 0);
                      const draft = itemDraft[m.id] || { name: "", price: "" };
                      return (
                        <div key={m.id} className="pending-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                          <div className="cat-top">
                            <span className="card-name">{m.name}</span>
                            <span className="muted small">{naira(subtotal)}</span>
                          </div>
                          {m.items.map((it, ii) => (
                            <div key={ii} className="cat-top" style={{ marginTop: 4 }}>
                              <span className="muted small">{it.qty}x {it.name}</span>
                              <span className="muted small">{naira(it.price * it.qty)} {g.status !== "placed" && <button className="round-btn deny" style={{ marginLeft: 6 }} onClick={() => confirmAction({ title: "Remove this item?", message: "It will be taken out of the group order.", confirmLabel: "Remove" }, () => onRemoveItem(g.id, m.id, ii))}><X size={10} /></button>}</span>
                            </div>
                          ))}
                          {g.status !== "placed" && (
                            <div className="cat-top" style={{ marginTop: 6, gap: 6 }}>
                              <input placeholder="Item name" value={draft.name} style={{ flex: 1 }} onChange={(e) => setItemDraft((d) => ({ ...d, [m.id]: { ...draft, name: e.target.value } }))} />
                              <input placeholder="Price" type="number" min="0" value={draft.price} style={{ width: 90 }} onChange={(e) => setItemDraft((d) => ({ ...d, [m.id]: { ...draft, price: e.target.value } }))} />
                              <button className="ghost-btn-sm" disabled={!draft.name.trim() || !draft.price || Number(draft.price) <= 0} onClick={() => { onAddItem(g.id, m.id, draft.name.trim(), Number(draft.price)); setItemDraft((d) => ({ ...d, [m.id]: { name: "", price: "" } })); }}>Add</button>
                            </div>
                          )}
                          {g.status !== "placed" && (
                            <button className="ghost-btn-sm" style={{ marginTop: 6, alignSelf: "flex-start" }} onClick={() => onTogglePaid(g.id, m.id)}>{m.paid ? <><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Paid their share</> : "Mark their share as paid"}</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {g.status !== "placed" && (
                    <div className="cat-top" style={{ marginBottom: 10, gap: 6 }}>
                      <input placeholder="Add a member by name" value={memberNameDraft[g.id] || ""} style={{ flex: 1 }} onChange={(e) => setMemberNameDraft((d) => ({ ...d, [g.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter" && (memberNameDraft[g.id] || "").trim()) { onAddMember(g.id, memberNameDraft[g.id].trim()); setMemberNameDraft((d) => ({ ...d, [g.id]: "" })); } }} />
                      <button className="ghost-btn-sm" disabled={!(memberNameDraft[g.id] || "").trim()} onClick={() => { onAddMember(g.id, memberNameDraft[g.id].trim()); setMemberNameDraft((d) => ({ ...d, [g.id]: "" })); }}>Add member</button>
                    </div>
                  )}
                  {g.status === "placed" ? (
                    <div className="muted small" style={{ color: "#16A34A" }}><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Placed as one order -- {naira(total)} total.</div>
                  ) : (
                    <button className="primary-btn-sm wide" disabled={!hasItems || !allPaid} onClick={() => onPlace(g.id)}>{!hasItems ? "Add items to place order" : !allPaid ? "Waiting on payment from everyone" : `Place order -- ${naira(total)}`}</button>
                  )}
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function GiveBackScreen({ points, giftCards, onSendGift, donations, onDonate, onRedeem }) {
  const [giftAmount, setGiftAmount] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState(null);
  const [donateAmounts, setDonateAmounts] = useState({});

  const send = () => {
    const amt = Number(giftAmount);
    if (!amt || amt <= 0 || amt > points) return;
    onSendGift(amt);
    setGiftAmount("");
  };
  const redeem = () => {
    const res = onRedeem(redeemCode.trim());
    setRedeemMsg(res);
    setRedeemCode("");
    setTimeout(() => setRedeemMsg(null), 4000);
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title"><Gift size={16} style={{ verticalAlign: "middle", marginRight: 4 }} /> Gift a Friend</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Send points to a friend as a real gift code -- they enter it below (or you redeem it yourself if you're sending it to another account you own) to claim it.</div>
        <div className="field" style={{ marginBottom: 8 }}><span>Amount to gift</span><input type="number" min="1" max={points} value={giftAmount} onChange={(e) => setGiftAmount(e.target.value)} /></div>
        <button className="ghost-btn-sm" disabled={!giftAmount || Number(giftAmount) <= 0 || Number(giftAmount) > points} onClick={send}>Send gift</button>
        {giftCards.length > 0 && (
          <div className="list-col" style={{ marginTop: 12 }}>
            {giftCards.slice().reverse().map((g, i) => (
              <div key={i} className="pending-row">
                <div className="ti-mid"><div className="card-name mono small">{g.code}</div><div className="muted small">{naira(g.amount).replace("₦", "")} points -- {g.redeemed ? "Redeemed" : "Not yet redeemed"}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel enter">
        <div className="panel-title">Redeem a Gift</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Got a gift code from someone? Enter it here to claim the points.</div>
        <div className="cat-top" style={{ gap: 8 }}>
          <input placeholder="Gift code" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && redeemCode.trim() && redeem()} style={{ flex: 1 }} />
          <button className="ghost-btn-sm" disabled={!redeemCode.trim()} onClick={redeem}>Redeem</button>
        </div>
        {redeemMsg && <div className="muted small" style={{ marginTop: 8, color: redeemMsg.ok ? "#16A34A" : "#DC2626" }}>{redeemMsg.ok ? <CircleCheck size={12} style={{ verticalAlign: "middle" }} /> : null} {redeemMsg.text}</div>}
      </div>

      <div className="panel enter">
        <div className="panel-title">Donations</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Donate points toward a cause. Totals below reflect real contributions made this session.</div>
        <div className="list-col">
          {DONATION_CAUSES.map((c) => {
            const total = donations.filter((d) => d.cause === c.key).reduce((s, d) => s + d.amount, 0);
            const draft = donateAmounts[c.key] || "";
            return (
              <div key={c.key} className="pending-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div className="cat-top"><span className="card-name">{c.label}</span><span className="muted small">{total.toLocaleString()} pts contributed</span></div>
                <div className="muted small" style={{ marginBottom: 6 }}>{c.desc}</div>
                <div className="cat-top" style={{ gap: 6 }}>
                  <input type="number" min="1" max={points} placeholder="Points" value={draft} style={{ width: 100 }} onChange={(e) => setDonateAmounts((d) => ({ ...d, [c.key]: e.target.value }))} />
                  <button className="ghost-btn-sm" disabled={!draft || Number(draft) <= 0 || Number(draft) > points} onClick={() => { onDonate(c.key, Number(draft)); setDonateAmounts((d) => ({ ...d, [c.key]: "" })); }}>Donate</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CommunityScreen({ onMessageSent, lifetimePoints }) {
  const [channel, setChannel] = useState("peers");
  const [feed, setFeed] = useState({ peers: [], all: [] });
  const [sentCount, setSentCount] = useState({ peers: 0, all: 0 });
  const [unlocked, setUnlocked] = useState({ peers: false, all: false });
  const [text, setText] = useState("");
  const [imageData, setImageData] = useState(null);
  const fileRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const send = () => {
    if (!text.trim() && !imageData) return;
    const mine = { author: "You", role: "Customer", time: "Just now", text: text.trim(), image: imageData };
    setFeed((f) => ({ ...f, [channel]: [...f[channel], mine] }));
    onMessageSent?.();
    const newCount = sentCount[channel] + 1;
    setSentCount((c) => ({ ...c, [channel]: newCount }));
    setText("");
    setImageData(null);
    if (newCount >= COMMUNITY_UNLOCK_THRESHOLD && !unlocked[channel]) {
      setUnlocked((u) => ({ ...u, [channel]: true }));
      setFeed((f) => ({ ...f, [channel]: [...f[channel], { system: true, text: "You're all caught up -- new messages will appear here from now on." }, ...COMMUNITY_SEED[channel]] }));
    }
  };

  const remaining = Math.max(0, COMMUNITY_UNLOCK_THRESHOLD - sentCount[channel]);

  return (
    <div className="section-pad">
      <div className="panel enter" style={{ background: "#FDF4FF" }}>
        <div className="panel-title-row"><div className="panel-title"><Target size={16} style={{ marginRight: 6 }} />Community Challenge</div><span className="status-pill route">Mystery reward</span></div>
        <div className="muted small" style={{ marginBottom: 8 }}>Once the community reaches a monthly points goal, everyone gets a mystery auto reward.</div>
        <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">Your points earned this session</span><span className="mono small">{lifetimePoints.toLocaleString()} pts</span></div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Community</div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {COMMUNITY_CHANNELS.map((c) => <button key={c.key} className={`chip ${channel === c.key ? "active" : ""}`} onClick={() => setChannel(c.key)}>{c.label}</button>)}
        </div>
        {!unlocked[channel] && (
          <div className="community-gate">
            <MessageCircle size={14} />
            {remaining === COMMUNITY_UNLOCK_THRESHOLD ? "Say hi to join the conversation -- send 2 messages to start seeing what others are chatting about." : "One more message to unlock the conversation!"}
          </div>
        )}
        <div className="community-feed">
          {feed[channel].length === 0 && <div className="empty-note">Nothing here yet -- be the first to say something.</div>}
          {feed[channel].map((m, i) => m.system ? (
            <div key={i} className="community-divider">{m.text}</div>
          ) : (
            <div key={i} className="community-msg">
              <div className="driver-avatar sm">{m.author[0]}</div>
              <div className="ti-mid">
                <div className="cat-top"><span className="card-name">{m.author}</span><span className={`status-pill ${m.role === "Official" ? "prep" : "done"}`}>{m.role}</span><span className="muted small">{m.time}</span></div>
                {m.text && <div className="muted">{m.text}</div>}
                {m.image && <img src={m.image} className="community-img" alt="Shared attachment" />}
              </div>
            </div>
          ))}
        </div>
        {imageData && (
          <div className="image-preview-row">
            <img src={imageData} className="image-preview-thumb" alt="To be sent" />
            <button className="round-btn deny" onClick={() => setImageData(null)}><X size={12} /></button>
          </div>
        )}
        <div className="reply-row" style={{ marginTop: 12 }}>
          <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleImage} />
          <button className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="Attach a photo"><ImageIcon size={16} /></button>
          <input placeholder="Say hi to the community..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="primary-btn-sm" onClick={send}><Send size={13} /></button>
        </div>
      </div>
    </div>
  );
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🙏"];

function draftDriverReply(text) {
  const t = text.toLowerCase();
  if (t.includes("gate") || t.includes("door") || t.includes("leave it")) return "Got it, I'll leave it there -- sending a photo when I do.";
  if (t.includes("where") || t.includes("far") || t.includes("eta") || t.includes("long")) return "Almost there, just a few minutes out!";
  if (t.includes("thank")) return "You're welcome! Enjoy 🙂";
  if (t.includes("call") || t.includes("phone")) return "Sure, feel free to call me directly.";
  if (t.includes("wrong") || t.includes("missing")) return "Let me double check the order with the vendor now.";
  if (t.includes("downstairs") || t.includes("outside") || t.includes("waiting")) return "I see you, be right there!";
  return "Got it, thanks!";
}

function draftAIResponse(input, { activeOrder, orders, points }) {
  const t = input.toLowerCase();

  if ((t.includes("order") || t.includes("delivery")) && (t.includes("where") || t.includes("status") || t.includes("track"))) {
    if (activeOrder && activeOrder.status !== "delivered" && activeOrder.status !== "cancelled") {
      const etaMin = Math.max(0, Math.ceil(((100 - activeOrder.progress) / 100) * 35));
      return { text: `Your order #${activeOrder.id} is ${activeOrder.status === "placed" ? "being prepared" : "on its way"} -- about ${etaMin} minutes out.`, actionLabel: "Track order", actionKey: "track-order" };
    }
    return { text: "You don't have an active order right now. Want to browse the shop?", actionLabel: "Go to Shop", actionKey: "shop" };
  }

  const budgetMatch = t.match(/(\d[\d,]*)/);
  if ((t.includes("gift") || t.includes("suggest") || t.includes("recommend")) && budgetMatch) {
    const budget = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
    const matches = PRODUCTS.filter((p) => p.price <= budget).sort((a, b) => b.rating - a.rating).slice(0, 3);
    if (matches.length === 0) return { text: `I couldn't find anything under ₦${budget.toLocaleString()} right now -- try a higher budget?` };
    return { text: `Here are a few good options under ₦${budget.toLocaleString()}: ${matches.map((p) => `${p.name} (₦${p.price.toLocaleString()})`).join(", ")}.`, actionLabel: "Browse Shop", actionKey: "shop" };
  }

  if (t.includes("point")) {
    return { text: `You currently have ${points} points, worth ₦${points.toLocaleString()} toward your next order's product total. Points don't apply to delivery fees and don't expire.` };
  }

  if (t.includes("spend") || t.includes("spent") || t.includes("summary")) {
    const all = [...orders, ...RECENT_ORDERS];
    const total = all.reduce((s, o) => s + (o.total || 0), 0);
    return { text: `You've spent about ₦${total.toLocaleString()} across ${all.length} orders on Medra recently.` };
  }

  return { text: "I can help with things like \"where's my order\", \"suggest a gift under ₦5000\", \"how many points do I have\", or \"what have I spent recently\". What would you like to know?" };
}

function UniversalSearch({ query, setQuery, onClose, onOpenProduct, onNavigate, orders }) {
  const q = query.trim().toLowerCase();
  const productMatches = q ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 4) : [];
  const orderMatches = q ? (orders || []).filter((o) => o.id.toLowerCase().includes(q) || (o.items || []).some((it) => productById(it.productId)?.name.toLowerCase().includes(q))).slice(0, 3) : [];
  const helpMatches = q ? FAQ_ITEMS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)).slice(0, 3) : [];
  const hasResults = productMatches.length || orderMatches.length || helpMatches.length;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" style={{ maxWidth: 480, textAlign: "left" }} onClick={(e) => e.stopPropagation()}>
        <div className="search-wrap-cu" style={{ marginBottom: 12 }}>
          <Search size={15} /><input autoFocus placeholder="Search products, orders, and help..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={onClose}><X size={14} /></button>
        </div>
        {!q ? (
          <div className="muted small">Search across your products, past orders, and help articles -- all in one place.</div>
        ) : !hasResults ? (
          <div className="muted small">No matches for "{query}".</div>
        ) : (
          <div className="list-col">
            {productMatches.length > 0 && (
              <>
                <div className="muted small" style={{ fontWeight: 700, marginTop: 4 }}>Products</div>
                {productMatches.map((p) => (
                  <button key={p.id} className="pending-row nav-flag" onClick={() => { onOpenProduct(p); onClose(); }}>
                    <div className="ti-mid"><div className="card-name">{p.name}</div><div className="muted small">{p.category}</div></div><ChevronRight size={15} />
                  </button>
                ))}
              </>
            )}
            {orderMatches.length > 0 && (
              <>
                <div className="muted small" style={{ fontWeight: 700, marginTop: 4 }}>Orders</div>
                {orderMatches.map((o) => (
                  <button key={o.id} className="pending-row nav-flag" onClick={() => { onNavigate("my-orders"); onClose(); }}>
                    <div className="ti-mid"><div className="card-name">Order #{o.id}</div><div className="muted small">{o.status}</div></div><ChevronRight size={15} />
                  </button>
                ))}
              </>
            )}
            {helpMatches.length > 0 && (
              <>
                <div className="muted small" style={{ fontWeight: 700, marginTop: 4 }}>Help</div>
                {helpMatches.map((f, i) => (
                  <button key={i} className="pending-row nav-flag" onClick={() => { onNavigate("support"); onClose(); }}>
                    <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5 }}>{f.q}</div></div><ChevronRight size={15} />
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const CUSTOMER_CHANGELOG = [
  { date: "Aug 21, 2026", tag: "New", title: "Membership can now be paused", desc: "Taking a month off? Pause your plan instead of cancelling -- your tier and history are kept, and you can resume any time." },
  { date: "Aug 21, 2026", tag: "New", title: "Search now covers orders and help too", desc: "The search bar at the top now finds products, past orders, and help articles all in one place." },
  { date: "Aug 20, 2026", tag: "New", title: "Bank transfer added at checkout", desc: "Pay by direct bank transfer alongside card, wallet, and split payment." },
  { date: "Aug 20, 2026", tag: "New", title: "Dark mode", desc: "A real dark theme is now available under Settings." },
  { date: "Aug 19, 2026", tag: "Fix", title: "Wallet payments now actually deduct your balance", desc: "Paying with wallet or split payment now correctly updates your real balance and shows in your transaction history." },
  { date: "Aug 19, 2026", tag: "New", title: "Membership launched", desc: "Five real tiers with a genuine points multiplier on every order -- see what you'd earn before you subscribe." },
];

function DeliveryPhotoGalleryScreen({ orders }) {
  const withPhotos = (orders || []).filter((o) => o.deliveryPhoto);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Delivery Photos</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Proof-of-delivery photos from your riders, all in one place.</div>
        {withPhotos.length === 0 ? (
          <EmptyNote>No delivery photos yet -- these show up here once a rider completes a delivery with photo confirmation. (Only available when using the Combined Preview, where the Rider app's photo capture actually connects to your orders.)</EmptyNote>
        ) : (
          <div className="list-col">
            {withPhotos.map((o) => (
              <div key={o.id} className="pending-row">
                <ImageIcon size={16} />
                <div className="ti-mid"><div className="card-name">Order #{o.id}</div><div className="muted small">{o.vendor} -- {o.deliveryPhoto}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangelogScreen() {
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">What's New</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Real updates to Medra, most recent first.</div>
        <div className="list-col">
          {CUSTOMER_CHANGELOG.map((c, i) => (
            <div key={i} className="pending-row" style={{ alignItems: "flex-start" }}>
              <span className={`status-pill ${c.tag === "Fix" ? "delay" : "done"}`} style={{ marginTop: 2 }}>{c.tag}</span>
              <div className="ti-mid"><div className="card-name" style={{ fontSize: 13 }}>{c.title}</div><div className="muted small">{c.desc}</div><div className="muted small" style={{ marginTop: 4 }}>{c.date}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIAssistantScreen({ activeOrder, orders, points, onNavigate }) {
  const [chat, setChat] = useState([{ from: "ai", text: "Hi! I'm your Medra assistant. Ask me about your orders, points, or ask for a gift suggestion within a budget." }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const suggestions = ["Where's my order?", "Suggest a gift under ₦5000", "How many points do I have?"];

  const ask = (text) => {
    if (!text.trim()) return;
    setChat((c) => [...c, { from: "me", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const res = draftAIResponse(text, { activeOrder, orders, points });
      setChat((c) => [...c, { from: "ai", text: res.text, actionLabel: res.actionLabel, actionKey: res.actionKey }]);
    }, 900);
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title"><Sparkles size={15} style={{ verticalAlign: "middle", marginRight: 4 }} /> Medra AI Chat</div></div>
        <div className="chat-thread" style={{ maxHeight: 340 }}>
          {chat.map((m, i) => (
            <div key={i} className="chat-msg-wrap">
              <div className={`chat-bubble ${m.from === "me" ? "me" : ""}`}>{m.text}</div>
              {m.actionLabel && <button className="ghost-btn-sm" style={{ marginTop: 4, marginBottom: 6, alignSelf: "flex-start" }} onClick={() => onNavigate(m.actionKey)}>{m.actionLabel}</button>}
            </div>
          ))}
          {typing && <div className="typing-indicator"><span /><span /><span /></div>}
        </div>
        <div className="chip-row" style={{ margin: "10px 0" }}>
          {suggestions.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}
        </div>
        <div className="reply-row">
          <input placeholder="Ask me anything about your account..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(input)} />
          <button className="primary-btn-sm" onClick={() => ask(input)}><Send size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function MessagesScreen() {
  const [threadList, setThreadList] = useState(CUSTOMER_MESSAGES);
  const [active, setActive] = useState(CUSTOMER_MESSAGES[0]);
  const [threads, setThreads] = useState(() => Object.fromEntries(CUSTOMER_MESSAGES.map((m) => [m.name, [{ from: "them", text: m.preview }]])));
  const [input, setInput] = useState("");
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [reactingIdx, setReactingIdx] = useState(null);

  const send = () => {
    if (!input.trim()) return;
    setThreads((t) => ({ ...t, [active.name]: [...t[active.name], { from: "me", text: input }] }));
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setThreads((t) => ({
        ...t,
        [active.name]: [...t[active.name].map((m) => (m.from === "me" ? { ...m, seen: true } : m)), { from: "them", text: "Thanks for reaching out -- we'll get back to you shortly!" }],
      }));
    }, 1400);
  };

  const react = (idx, emoji) => {
    setThreads((t) => ({ ...t, [active.name]: t[active.name].map((m, i) => (i === idx ? { ...m, reaction: m.reaction === emoji ? null : emoji } : m)) }));
    setReactingIdx(null);
  };

  const startNew = (sellerName, text) => {
    setThreads((t) => ({ ...t, [sellerName]: [...(t[sellerName] || []), { from: "me", text }] }));
    if (!threadList.find((m) => m.name === sellerName)) {
      const newThread = { name: sellerName, preview: text, time: "Just now", unread: false };
      setThreadList((l) => [newThread, ...l]);
      setActive(newThread);
    } else {
      setActive(threadList.find((m) => m.name === sellerName));
    }
  };

  const activeThread = threads[active.name] || [];
  const lastMeIdx = activeThread.map((m) => m.from).lastIndexOf("me");

  return (
    <div className="section-pad" style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {newMsgOpen && <NewCustomerMessageModal onStart={startNew} onClose={() => setNewMsgOpen(false)} />}
      <div className="panel enter" style={{ flex: 1, maxWidth: 280 }}>
        <div className="panel-title-row"><div className="panel-title">Messages</div><button className="ghost-btn-sm" onClick={() => setNewMsgOpen(true)}>+ New</button></div>
        <div className="list-col">
          {threadList.map((m, i) => (
            <button key={i} className={`pending-row msg-thread-btn ${active.name === m.name ? "active" : ""}`} onClick={() => setActive(m)}>
              <div className="driver-avatar sm">{m.name[0]}</div>
              <div className="ti-mid"><div className="card-name">{m.name} {m.unread && <span className="unread-dot" />}</div><div className="muted">{m.preview}</div></div>
              <div className="muted small">{m.time}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="panel enter" style={{ flex: 1.4 }}>
        <div className="panel-title">{active.name}</div>
        <div className="chat-thread">
          {activeThread.map((msg, i) => (
            <div key={i} className="chat-msg-wrap">
              <div className={`chat-bubble ${msg.from}`} onClick={() => setReactingIdx(reactingIdx === i ? null : i)}>
                {msg.text}
                {msg.reaction && <span className="msg-reaction">{msg.reaction}</span>}
              </div>
              {msg.from === "me" && msg.seen && i === lastMeIdx && <div className="seen-label">Seen</div>}
              {reactingIdx === i && (
                <div className="emoji-picker-row">
                  {REACTION_EMOJIS.map((e) => <button key={e} onClick={() => react(i, e)}>{e}</button>)}
                </div>
              )}
            </div>
          ))}
          {typing && <div className="typing-indicator"><span /><span /><span /></div>}
        </div>
        <div className="reply-row" style={{ marginTop: 12 }}>
          <input placeholder="Type a reply..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="primary-btn-sm" onClick={send}><Send size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function AddAddressModal({ onAdd, onClose }) {
  const [label, setLabel] = useState("");
  const [addr, setAddr] = useState("");
  const canSave = label.trim() && addr.trim();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Add a new address</div>
        <div className="field" style={{ marginBottom: 10 }}><span>Label</span><input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Office, Mum's House" /></div>
        <div className="field" style={{ marginBottom: 16 }}><span>Full address</span><input type="text" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Street, area, city" /></div>
        <button className="primary-btn-sm wide" disabled={!canSave} onClick={() => { onAdd({ label, addr, primary: false }); onClose(); }}>Save address</button>
      </div>
    </div>
  );
}

function AddressesScreen({ onToast }) {
  const [addresses, setAddresses] = useState(ADDRESSES.map((a) => ({ ...a, instructions: a.instructions || "" })));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [draftInstructions, setDraftInstructions] = useState("");
  const startEdit = (a) => { setEditingLabel(a.label); setDraftInstructions(a.instructions || ""); };
  const saveInstructions = (label) => { setAddresses((list) => list.map((a) => a.label === label ? { ...a, instructions: draftInstructions.trim() } : a)); setEditingLabel(null); onToast?.("Delivery instructions saved"); };
  return (
    <div className="section-pad">
      {modalOpen && <AddAddressModal onAdd={(a) => { setAddresses((list) => [...list, { ...a, instructions: "" }]); onToast?.("Address added"); }} onClose={() => setModalOpen(false)} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Addresses</div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ Add Address</button></div>
        <div className="list-col">
          {addresses.map((a) => (
            <div key={a.label} className="pending-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MapPin size={15} />
                <div className="ti-mid"><div className="card-name">{a.label} {a.primary && <span className="status-pill done">Primary</span>}</div><div className="muted">{a.addr}</div></div>
              </div>
              {editingLabel === a.label ? (
                <div style={{ display: "flex", gap: 6, marginLeft: 25 }}>
                  <input style={{ flex: 1 }} value={draftInstructions} onChange={(e) => setDraftInstructions(e.target.value)} placeholder="e.g. Leave at door, call on arrival, gate code 4821" />
                  <button className="ghost-btn-sm" onClick={() => saveInstructions(a.label)}>Save</button>
                </div>
              ) : (
                <button className="link-btn" style={{ marginLeft: 25, textAlign: "left", fontSize: 12 }} onClick={() => startEdit(a)}>
                  {a.instructions ? `Delivery instructions: ${a.instructions}` : "+ Add default delivery instructions"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CARD_BRANDS = ["Verve", "Mastercard", "Visa"];

function AddCardModal({ onAdd, onClose }) {
  const [brand, setBrand] = useState("Verve");
  const [last4, setLast4] = useState("");
  const [expiry, setExpiry] = useState("");
  const last4Valid = /^\d{4}$/.test(last4);
  const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Add a card</div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>Card type</span>
          <select className="sort-select" value={brand} onChange={(e) => setBrand(e.target.value)}>{CARD_BRANDS.map((b) => <option key={b}>{b}</option>)}</select>
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>Last 4 digits</span>
          <input type="text" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))} className={last4 && !last4Valid ? "input-invalid" : ""} placeholder="4821" />
          {last4 && !last4Valid && <span className="field-error">Enter exactly 4 digits</span>}
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <span>Expiry (MM/YY)</span>
          <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={expiry && !expiryValid ? "input-invalid" : ""} placeholder="09/28" />
          {expiry && !expiryValid && <span className="field-error">Use MM/YY format</span>}
        </div>
        <button className="primary-btn-sm wide" disabled={!last4Valid || !expiryValid} onClick={() => { onAdd({ brand, last4, expiry }); onClose(); }}>Add card</button>
      </div>
    </div>
  );
}

function SubscriptionsScreen({ subscriptions, wallet, onCharge, onCancel, onPause, onResume, onPauseAll, onResumeAll }) {
  if (subscriptions.length === 0) {
    return (
      <div className="section-pad">
        <EmptyState icon={RotateCcw} title="No active subscriptions" sub="Check 'Subscribe & Save' at checkout on any item to set one up -- you'll be charged automatically every 2 weeks using the payment method from that order." />
      </div>
    );
  }
  const activeSubs = subscriptions.filter((s) => s.active);
  const anyPaused = activeSubs.some((s) => s.paused);
  const allPaused = activeSubs.length > 0 && activeSubs.every((s) => s.paused);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Your Subscriptions</div>
          {activeSubs.length > 1 && <button className="ghost-btn-sm" onClick={() => (allPaused ? onResumeAll() : onPauseAll())}>{allPaused ? "Resume all" : "Pause all (vacation mode)"}</button>}
        </div>
        <div className="muted small" style={{ marginBottom: 12 }}>Each subscription re-charges your saved payment method every 2 weeks at 1% off. This keeps your order guaranteed -- Medra isn't giving out repeat discounts without a real charge behind them.</div>
        <div className="list-col">
          {subscriptions.map((s) => {
            const due = Date.now() >= s.nextChargeAt;
            const daysLeft = Math.max(0, Math.ceil((s.nextChargeAt - Date.now()) / (1000 * 60 * 60 * 24)));
            const lineTotal = Math.round(s.unitPrice * s.qty);
            return (
              <div key={s.id} className="pending-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div className="cat-top" style={{ marginBottom: 4 }}>
                  <div className="card-name">{s.qty} x {s.productName}</div>
                  <span className="mono small">{naira(lineTotal)} / 2 weeks</span>
                </div>
                <div className="muted small" style={{ marginBottom: 8 }}>From {s.sellerName} -- paid via {s.payMethod === "wallet" ? "Wallet" : s.payMethod === "split" ? "Wallet + Card" : "Card"}</div>
                {!s.active ? (
                  <span className="status-pill delay">Cancelled</span>
                ) : s.paused ? (
                  <div className="cat-top">
                    <span className="status-pill prep">Paused</span>
                    <button className="ghost-btn-sm" onClick={() => onResume(s.id)}>Resume</button>
                  </div>
                ) : due ? (
                  <div className="cat-top" style={{ gap: 8 }}>
                    <button className="primary-btn-sm" disabled={(s.payMethod === "wallet" || s.payMethod === "split") && wallet < lineTotal} onClick={() => onCharge(s.id)}>Charge {naira(lineTotal)} now</button>
                    <button className="ghost-btn-sm" onClick={() => onPause(s.id)}>Pause</button>
                    <button className="ghost-btn-sm" onClick={() => onCancel(s.id)}>Cancel</button>
                  </div>
                ) : (
                  <div className="cat-top">
                    <span className="muted small">Next charge in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>
                    <button className="ghost-btn-sm" onClick={() => onPause(s.id)}>Pause</button>
                    <button className="ghost-btn-sm" onClick={() => onCancel(s.id)}>Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsScreen({ cards, setCards }) {
  const [modalOpen, setModalOpen] = useState(false);
  const removeCard = (i) => setCards((c) => c.filter((_, idx) => idx !== i));
  const setDefault = (i) => setCards((c) => c.map((card, idx) => ({ ...card, isDefault: idx === i })));
  return (
    <div className="section-pad">
      {modalOpen && <AddCardModal onAdd={(c) => setCards((cs) => [...cs, { ...c, isDefault: cs.length === 0 }])} onClose={() => setModalOpen(false)} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Payment Methods</div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ Add Card</button></div>
        <div className="list-col">
          {cards.map((c, i) => (
            <div key={i} className="pending-row">
              <CreditCard size={16} />
              <div className="ti-mid"><div className="card-name">{c.brand} •••• {c.last4} {c.isDefault && <span className="status-pill done" style={{ marginLeft: 6 }}>Default</span>}</div><div className="muted">Expires {c.expiry}</div></div>
              {!c.isDefault && <button className="ghost-btn-sm" onClick={() => setDefault(i)}>Set as default</button>}
              <button className="round-btn deny" onClick={() => confirmAction({ title: "Remove this card?", message: "You will need to add it again to use it for payments.", confirmLabel: "Remove card" }, () => removeCard(i))}><X size={12} /></button>
            </div>
          ))}
          <div className="pending-row"><Wallet size={16} /><div className="ti-mid"><div className="card-name">Medra Wallet</div><div className="muted">Default for orders under ₦2,000</div></div></div>
        </div>
      </div>
    </div>
  );
}

const CATEGORY_OPTIONS = ["Groceries", "Restaurant", "Pharmacy", "Fashion", "Electronics", "Home & Living", "Beauty"];

function ApplyScreen({ role, onDone }) {
  const isSeller = role === "seller";
  const [submitted, setSubmitted] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState("general");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [pharmacyLicense, setPharmacyLicense] = useState("");
  const [pharmacistName, setPharmacistName] = useState("");
  const [vehicleType, setVehicleType] = useState("Motorcycle");
  const [plateNumber, setPlateNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [docName, setDocName] = useState("");
  const isPharmacy = isSeller && storeType === "pharmacy";

  const submit = (e) => { e.preventDefault(); setSubmitted(true); };

  if (submitted) {
    return (
      <div className="section-pad">
        <div className="panel enter apply-status">
          <Clock size={26} color="#B45309" />
          <div className="card-name" style={{ fontSize: 16, margin: "10px 0 4px" }}>Application submitted</div>
          <span className="status-pill prep">Under review</span>
          <p className="muted" style={{ marginTop: 12, maxWidth: 400 }}>We're reviewing your {isSeller ? "seller" : "rider"} application. This usually takes 1-2 business days -- we'll notify you here and by email once it's approved.</p>
          <button className="ghost-btn-sm" style={{ marginTop: 14 }} onClick={onDone}>Back to Settings</button>
        </div>
      </div>
    );
  }

  return (
    <div className="section-pad">
      <div className="panel enter" style={{ maxWidth: 520 }}>
        <div className="panel-title">{isSeller ? "Become a Seller" : "Become a Rider"}</div>
        <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>{isSeller ? "Tell us about your store -- we'll review and get you set up to sell." : "Tell us about yourself and your vehicle -- we'll review and get you on the road."}</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isSeller ? (
            <>
              <div className="field"><span>Store name</span><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required /></div>
              <div className="field">
                <span>Store type</span>
                <select className="sort-select" value={storeType} onChange={(e) => setStoreType(e.target.value)}>
                  <option value="general">General store</option>
                  <option value="pharmacy">Pharmacy</option>
                </select>
              </div>
              <div className="field"><span>Category</span><select className="sort-select" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="field"><span>Description</span><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you sell?" /></div>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="field" style={{ flex: 1 }}><span>City</span><input type="text" value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                <div className="field" style={{ flex: 1 }}><span>Business reg. number</span><input type="text" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} /></div>
              </div>
              <div className="field"><span>Store address</span><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required /></div>
              <div className="field"><span>Contact phone</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
              {isPharmacy && (
                <>
                  <div className="field"><span>Pharmacy license number</span><input type="text" value={pharmacyLicense} onChange={(e) => setPharmacyLicense(e.target.value)} required /></div>
                  <div className="field"><span>Responsible pharmacist name</span><input type="text" value={pharmacistName} onChange={(e) => setPharmacistName(e.target.value)} required /></div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="field"><span>Full name</span><input type="text" required /></div>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="field" style={{ flex: 1 }}>
                  <span>Vehicle type</span>
                  <select className="sort-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                    <option>Motorcycle</option><option>Bicycle</option><option>Car</option><option>Tricycle</option>
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}><span>Plate number</span><input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required /></div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="field" style={{ flex: 1 }}><span>City</span><input type="text" value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                <div className="field" style={{ flex: 1 }}><span>Driver's license number</span><input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required /></div>
              </div>
              <div className="field"><span>Phone</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
            </>
          )}
          <div className="field">
            <span>Upload {isSeller ? "business registration or ID" : "driver's license photo"}</span>
            <input type="file" onChange={(e) => setDocName(e.target.files?.[0]?.name || "")} />
            {docName && <div className="muted small" style={{ marginTop: 4 }}><Check size={11} style={{ verticalAlign: "middle" }} /> {docName}</div>}
          </div>
          <button className="primary-btn-sm wide" type="submit">Submit application</button>
        </form>
      </div>
    </div>
  );
}

function LegalScreen({ doc }) {
  const content = doc === "privacy" ? {
    title: "Privacy Policy",
    body: "Medra collects the information you provide when you create an account, place an order, or contact support -- including your name, contact details, delivery addresses, and order history. We use this to process orders, calculate payouts and commissions, and improve the platform. We don't sell your personal data. Location data is used only while an order is active, to route deliveries. You can request a copy of your data or ask us to delete your account at any time via Support.",
  } : {
    title: "Terms of Service",
    body: "By using Medra, you agree to buy, sell, or deliver in good faith. Sellers are responsible for the accuracy of their listings and the quality of items sold. Riders are responsible for handling orders carefully and delivering to the address provided. Medra's commission structure -- 10% on product listings, and 15% (10% during peak hours) on delivery fees -- is fixed and disclosed at checkout and in every relevant dashboard. Points earned through the rewards program have no cash value and cannot be exchanged back to naira. Accounts found to violate these terms may be suspended.",
  };
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ maxWidth: 560 }}>
        <div className="panel-title">{content.title}</div>
        <p className="muted" style={{ lineHeight: 1.7 }}>{content.body}</p>
        <div className="muted small" style={{ marginTop: 16 }}>Last updated August 2026.</div>
      </div>
    </div>
  );
}

const LANGUAGES = ["English", "Pidgin", "Yoruba", "Hausa", "Igbo"];

function LanguageModal({ current, onSelect, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Choose your language</div>
        <div className="list-col">
          {LANGUAGES.map((lang) => (
            <button key={lang} className="pending-row nav-flag" onClick={() => { onSelect(lang); onClose(); }}>
              <div className="ti-mid card-name">{lang}</div>
              {current === lang && <Check size={15} color="#16A34A" />}
            </button>
          ))}
        </div>
        <div className="muted small" style={{ marginTop: 12 }}>Non-English interfaces are still being translated -- some screens may show English text for now.</div>
      </div>
    </div>
  );
}

function NotificationsCenterScreen({ notifList, categoryPrefs, setCategoryPrefs, onOpen, pushPermission, onRequestPush }) {
  const [filter, setFilter] = useState("all");
  const [digest, setDigest] = useState(false);
  const allMuted = NOTIFICATION_CATEGORIES.every((c) => (categoryPrefs[c] ?? true) === false);
  const toggleCategory = (cat) => setCategoryPrefs((p) => ({ ...p, [cat]: !(p[cat] ?? true) }));
  const toggleMuteAll = () => {
    const target = !allMuted ? false : true;
    setCategoryPrefs(() => Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c, target])));
  };
  const filtered = filter === "all" ? notifList : notifList.filter((n) => n.category === filter);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Push Notifications</div></div>
        <div className="cat-top">
          <span className="muted small">{pushPermission === "granted" ? "Enabled on this device" : pushPermission === "denied" ? "Turned off for this device" : "Not set up yet"}</span>
          {pushPermission !== "granted" && <button className="ghost-btn-sm" onClick={onRequestPush}>{pushPermission === "denied" ? "Turn on" : "Set up"}</button>}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Notification Preferences</div>
          <button className="ghost-btn-sm" onClick={toggleMuteAll}>{allMuted ? "Unmute all" : "Mute all"}</button>
        </div>
        <div className="muted small" style={{ marginBottom: 12 }}>Turn a category off and you won't be notified for it -- you can still see past notifications below.</div>
        <div className="flag-row" style={{ marginBottom: 10 }}>
          <div className="ti-mid"><div className="card-name">Daily digest</div><div className="muted small">Get one daily summary instead of individual alerts</div></div>
          <button className={`toggle-mini ${digest ? "on" : ""}`} onClick={() => setDigest((d) => !d)}><span /></button>
        </div>
        <div className="list-col">
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <div key={cat} className="flag-row">
              <div className="ti-mid"><div className="card-name">{cat}</div></div>
              <button className={`toggle-mini ${(categoryPrefs[cat] ?? true) ? "on" : ""}`} onClick={() => toggleCategory(cat)}><span /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">All Notifications</div></div>
        <div className="chip-row" style={{ marginBottom: 12 }}>
          <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
          {NOTIFICATION_CATEGORIES.map((cat) => <button key={cat} className={`chip ${filter === cat ? "active" : ""}`} onClick={() => setFilter(cat)}>{cat}</button>)}
        </div>
        {filtered.length === 0 ? <EmptyNote>No notifications in this category yet.</EmptyNote> : (
          <div className="list-col">
            {filtered.map((n, i) => (
              <button key={i} className="pending-row" style={{ width: "100%", textAlign: "left" }} onClick={() => onOpen(n.goTo)}>
                <div className="driver-avatar sm" style={{ background: n.color }}><n.icon size={14} /></div>
                <div className="ti-mid"><div className="card-name">{n.title}</div><div className="muted small">{n.sub}</div></div>
                <div className="muted small">{n.time}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ACCOUNT_CENTER_SECTIONS = [
  { label: "Personal", items: [
    { key: "addresses", label: "Addresses", icon: MapPin, desc: "Manage delivery addresses" },
    { key: "favorite-stores", label: "Favorite Stores", icon: Heart, desc: "Sellers and pharmacies you've favorited" },
    { key: "payment-methods", label: "Payment Methods", icon: CreditCard, desc: "Cards and saved payment options" },
    { key: "settings", label: "Settings & Security", icon: Settings, desc: "Profile, password, and app preferences" },
  ]},
  { label: "Orders", items: [
    { key: "my-orders", label: "Orders", icon: Package, desc: "Track and manage your orders" },
    { key: "support", label: "Refunds & Disputes", icon: LifeBuoy, desc: "File or check a dispute" },
    { key: "wallet", label: "Wallet", icon: Wallet, desc: "Balance and transaction history" },
  ]},
  { label: "Rewards", items: [
    { key: "membership", label: "Membership", icon: BadgeCheck, desc: "Your plan and benefits" },
    { key: "rewards", label: "Rewards Overview", icon: Award, desc: "Points, games, and leaderboard" },
    { key: "activity", label: "Rewards History", icon: History, desc: "Everything you've earned and spent" },
  ]},
  { label: "Healthcare", items: [
    { key: "health-documents", label: "Health Records", icon: FileText, desc: "Lab results, notes, and uploads" },
    { key: "health-prescriptions", label: "Prescriptions", icon: Pill, desc: "Provider-issued and self-added" },
    { key: "health-appointments", label: "Appointments", icon: CalendarClock, desc: "Upcoming and past visits" },
  ]},
  { label: "Preferences", items: [
    { key: "notifications", label: "Notifications", icon: Bell, desc: "Categories and mute preferences" },
    { key: "settings", label: "Appearance & Language", icon: Palette, desc: "Theme, text size, and language" },
  ]},
  { label: "Support", items: [
    { key: "support", label: "Help & Disputes", icon: LifeBuoy, desc: "FAQs, contact support, file a dispute" },
    { key: "about", label: "About Medra", icon: Info, desc: "Our mission, team, and legal docs" },
  ]},
];
function AccountCenterScreen({ onNavigate }) {
  return (
    <div className="section-pad">
      {ACCOUNT_CENTER_SECTIONS.map((section) => (
        <div key={section.label} className="panel enter">
          <div className="panel-title" style={{ fontSize: 13 }}>{section.label}</div>
          <div className="list-col">
            {section.items.map((it) => (
              <button key={it.label} className="flag-row nav-flag" onClick={() => onNavigate(it.key)}>
                <it.icon size={15} /><div className="ti-mid"><div className="card-name">{it.label}</div><div className="muted small">{it.desc}</div></div><ChevronRight size={15} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsScreen({ onOpenThemes, showMyPhoto, setShowMyPhoto, onReplayTour, onApply, onOpenLegal, textSize, setTextSize, darkMode, setDarkMode, darkModeAuto, setDarkModeAuto, showCreatorProgram, setShowCreatorProgram, leaderboardAnon, setLeaderboardAnon, reduceMotion, setReduceMotion, onExportActivity, unitPref, setUnitPref, onOpenNotifications }) {
  const [language, setLanguage] = useState("English");
  const [langOpen, setLangOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  return (
    <div className="section-pad">
      {langOpen && <LanguageModal current={language} onSelect={setLanguage} onClose={() => setLangOpen(false)} />}
      {walkthroughOpen && <HowItWorksModal title="the Medra customer app" onClose={() => setWalkthroughOpen(false)} steps={[
        "Home/Shop -- browse and search products from every seller, compare prices, and add items to your cart.",
        "Orders & Track Order -- see order status from placed to delivered, with live rider location once it's on the way.",
        "Wallet -- your naira balance for checkout, plus low-balance alerts (we notify you to top up by transfer, we never auto-charge).",
        "Rewards -- points, daily rewards, missions, games, referrals, leaderboard, and Membership all live here.",
        "Healthcare Home -- symptom checker, find a provider, book/manage appointments, prescriptions, health records, and provider messages.",
        "Build a Care Package -- pick a themed bundle or add any other item, then add it all to your cart at once.",
        "Give & Community -- donate, support a vendor, join community challenges, and chat in Community or Messages.",
        "Settings -- themes, dark mode, language, text size, and everything else about how the app looks and behaves for you.",
      ]} />}
      <div className="panel enter">
        <div className="panel-title">Settings</div>
        <div className="list-col">
          <button className="flag-row nav-flag" onClick={() => setWalkthroughOpen(true)}><Compass size={15} /><div className="ti-mid"><div className="card-name">Walk me through this app</div><div className="muted">A quick tour of what everything in the customer app does</div></div><ChevronRight size={15} /></button>
          <button className="flag-row nav-flag" onClick={onOpenThemes}><Palette size={15} /><div className="ti-mid"><div className="card-name">Themes</div><div className="muted">Change how your app looks using points</div></div><ChevronRight size={15} /></button>
          <div className="flag-row"><Moon size={15} /><div className="ti-mid"><div className="card-name">Dark mode</div><div className="muted">{darkModeAuto ? "Following the time of day (7pm-7am)" : "Switch to a darker color scheme"}</div></div>
            <button className={`toggle-mini ${darkMode ? "on" : ""}`} disabled={darkModeAuto} onClick={() => setDarkMode((d) => !d)}><span /></button>
          </div>
          <div className="flag-row"><Clock size={15} /><div className="ti-mid"><div className="card-name">Switch automatically by time of day</div><div className="muted">Dark from 7pm to 7am, light the rest of the day -- overrides the manual toggle above</div></div>
            <button className={`toggle-mini ${darkModeAuto ? "on" : ""}`} onClick={() => setDarkModeAuto((a) => !a)}><span /></button>
          </div>
          <div className="flag-row"><Scale size={15} /><div className="ti-mid"><div className="card-name">Measurement units</div><div className="muted">Shown on grocery item weights and volumes</div></div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className={`ghost-btn-sm ${unitPref === "kg" ? "active" : ""}`} style={unitPref === "kg" ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setUnitPref("kg")}>kg</button>
              <button className={`ghost-btn-sm ${unitPref === "lb" ? "active" : ""}`} style={unitPref === "lb" ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setUnitPref("lb")}>lb</button>
            </div>
          </div>
          <div className="flag-row"><Camera size={15} /><div className="ti-mid"><div className="card-name">Show my photo on my birthday</div><div className="muted">Let other customers see your photo when it's your turn to be the celebrant</div></div>
            <button className={`toggle-mini ${showMyPhoto ? "on" : ""}`} onClick={() => setShowMyPhoto((s) => !s)}><span /></button>
          </div>
          <button className="flag-row nav-flag" onClick={onReplayTour}><RefreshCw size={15} /><div className="ti-mid"><div className="card-name">Replay welcome tour</div><div className="muted">See the quick intro to points, themes, and rewards again</div></div><ChevronRight size={15} /></button>
          <button className="flag-row nav-flag" onClick={onExportActivity}><FileDown size={15} /><div className="ti-mid"><div className="card-name">Export my activity</div><div className="muted">Download a CSV of your orders and points history</div></div><ChevronRight size={15} /></button>
          <button className="flag-row nav-flag" onClick={onOpenNotifications}><Bell size={15} /><div className="ti-mid"><div className="card-name">Notifications</div><div className="muted">Categories and preferences</div></div><ChevronRight size={15} /></button>
          <button className="flag-row nav-flag" onClick={() => setLangOpen(true)}><div className="ti-mid"><div className="card-name">Language</div><div className="muted">{language}</div></div><ChevronRight size={15} /></button>
          <div className="flag-row"><Type size={15} /><div className="ti-mid"><div className="card-name">Larger text</div><div className="muted">Increase text size across the app</div></div>
            <button className={`toggle-mini ${textSize === "large" ? "on" : ""}`} onClick={() => setTextSize((s) => (s === "large" ? "normal" : "large"))}><span /></button>
          </div>
          <div className="flag-row"><Zap size={15} /><div className="ti-mid"><div className="card-name">Reduce motion</div><div className="muted">Turn off entrance animations and transitions</div></div>
            <button className={`toggle-mini ${reduceMotion ? "on" : ""}`} onClick={() => setReduceMotion((s) => !s)}><span /></button>
          </div>
          <div className="flag-row"><Star size={15} /><div className="ti-mid"><div className="card-name">Show Content Creator Program</div><div className="muted">A referral track for high-volume creators -- opt in from Rewards if it's not for you</div></div>
            <button className={`toggle-mini ${showCreatorProgram ? "on" : ""}`} onClick={() => setShowCreatorProgram((s) => !s)}><span /></button>
          </div>
          <div className="flag-row"><Eye size={15} /><div className="ti-mid"><div className="card-name">Appear anonymous on leaderboard</div><div className="muted">Hides your name -- reduces any leaderboard reward you win by 20%</div></div>
            <button className={`toggle-mini ${leaderboardAnon ? "on" : ""}`} onClick={() => setLeaderboardAnon((s) => !s)}><span /></button>
          </div>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Grow with Medra</div>
        <div className="list-col">
          <button className="flag-row nav-flag" onClick={() => onApply("seller")}><Store size={15} /><div className="ti-mid"><div className="card-name">Become a Seller</div><div className="muted">List your products and start selling</div></div><ChevronRight size={15} /></button>
          <button className="flag-row nav-flag" onClick={() => onApply("rider")}><Truck size={15} /><div className="ti-mid"><div className="card-name">Become a Rider</div><div className="muted">Deliver on your schedule and earn</div></div><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Legal</div>
        <div className="list-col">
          <button className="flag-row nav-flag" onClick={() => onOpenLegal("terms")}><div className="ti-mid card-name">Terms of Service</div><ChevronRight size={15} /></button>
          <button className="flag-row nav-flag" onClick={() => onOpenLegal("privacy")}><div className="ti-mid card-name">Privacy Policy</div><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Prototype tools</div>
        <div className="muted small" style={{ marginBottom: 10 }}>This preview keeps everything in memory only -- nothing is saved to a server. Reloading gives you a fresh demo with all seeded data restored.</div>
        <button className="ghost-btn-sm" onClick={() => window.location.reload()}><RotateCcw size={12} style={{ verticalAlign: "middle" }} /> Reset demo data (reloads this page)</button>
      </div>
      <div className="version-tag">Medra Customer -- {APP_VERSION}</div>
    </div>
  );
}

const FAQ_ITEMS = [
  { q: "Where is my order?", a: "Open My Orders or Track Order to see live status and your rider's location once it's out for delivery." },
  { q: "How do I cancel an order?", a: "Go to My Orders, open the order, and tap Cancel. Orders already out for delivery may not be cancellable." },
  { q: "How does the points program work?", a: "You earn points on every order. 1 point = ₦1, and points can be applied to future product costs (not delivery fees), up to a cap." },
  { q: "My rider hasn't arrived yet, what do I do?", a: "Check Track Order for live status first. If something seems wrong, use Report a problem on the tracking screen or contact support below." },
  { q: "Can I change my delivery address after ordering?", a: "Address changes aren't supported once an order is placed. Cancel and reorder with the correct address if it's still early in the process." },
  { q: "How do refunds work?", a: "Refunds are issued to your original payment method or wallet, typically within 3-5 business days once approved." },
  { q: "What is a scheduled order?", a: "Choosing a custom delivery time at checkout schedules your order for that window instead of ASAP -- you can pause or resume it any time before it's dispatched." },
  { q: "What does Membership actually get me?", a: "A real points multiplier on every order (up to 5x on Elite Black), plus tier-specific perks like priority support and free premium themes. You can pause it for a month without losing your tier, or cancel any time." },
];

const DISPUTE_CATEGORIES = [
  { key: "order", label: "Order problem", subtypes: ["Item missing", "Wrong item", "Damaged item", "Never received", "Late delivery"] },
  { key: "seller", label: "Seller issue", subtypes: null },
  { key: "rider", label: "Rider issue", subtypes: null },
  { key: "payment", label: "Payment issue", subtypes: null },
  { key: "refund", label: "Refund request", subtypes: null },
];
// Every dispute routes the same way: Customer -> Admin -> Seller/Rider ->
// Resolution. "stage" tracks where a ticket currently sits in that chain;
// new tickets always start at "admin" (submitted, waiting on the platform
// to triage and loop in the seller/rider if needed).
const DISPUTE_STAGES = ["customer", "support", "finance", "party", "resolved"];
const DISPUTE_STAGE_LABELS = { customer: "Submitted", support: "With Support", finance: "Finance Review", party: "With Seller/Rider", resolved: "Resolved" };
function DisputeStageTrack({ stage }) {
  const idx = DISPUTE_STAGES.indexOf(stage);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
      {DISPUTE_STAGES.map((s, i) => (
        <React.Fragment key={s}>
          <span className="muted small" style={{ color: i <= idx ? "var(--purple)" : "#CBD5E1", fontWeight: i === idx ? 700 : 500 }}>{DISPUTE_STAGE_LABELS[s]}</span>
          {i < DISPUTE_STAGES.length - 1 && <ChevronRight size={11} color={i < idx ? "var(--purple)" : "#CBD5E1"} />}
        </React.Fragment>
      ))}
    </div>
  );
}

const ABOUT_TEAM = [
  { name: "Amaka Eze", role: "Co-Founder & CEO" },
  { name: "Chidi Okafor", role: "Co-Founder & COO" },
  { name: "Farida Adeyemi", role: "Head of Operations" },
  { name: "Tomiwa Bello", role: "Head of Engineering" },
];
function HouseholdScreen({ orders, onToggleShareOrder }) {
  const [members, setMembers] = useState([{ id: "hm1", name: "You", relationship: "Owner", status: "active" }]);
  const [inviteName, setInviteName] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [lists, setLists] = useState([{ id: "sl1", name: "Weekly groceries", items: [{ id: "i1", name: "Rice (5kg)", done: false }, { id: "i2", name: "Eggs", done: true }] }]);
  const [newListName, setNewListName] = useState("");
  const [newItemByList, setNewItemByList] = useState({});
  const sendInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setMembers((m) => [...m, { id: "hm" + Date.now(), name: inviteName.trim(), relationship: inviteRelationship.trim() || "Member", status: "invited", email: inviteEmail.trim() }]);
    setInviteName(""); setInviteRelationship(""); setInviteEmail("");
  };
  const removeMember = (id) => setMembers((m) => m.filter((x) => x.id !== id));
  const addList = () => {
    if (!newListName.trim()) return;
    setLists((l) => [...l, { id: "sl" + Date.now(), name: newListName.trim(), items: [] }]);
    setNewListName("");
  };
  const addItem = (listId) => {
    const text = (newItemByList[listId] || "").trim();
    if (!text) return;
    setLists((ls) => ls.map((l) => l.id === listId ? { ...l, items: [...l.items, { id: "i" + Date.now(), name: text, done: false }] } : l));
    setNewItemByList((p) => ({ ...p, [listId]: "" }));
  };
  const toggleItem = (listId, itemId) => setLists((ls) => ls.map((l) => l.id === listId ? { ...l, items: l.items.map((it) => it.id === itemId ? { ...it, done: !it.done } : it) } : l));
  const removeItem = (listId, itemId) => setLists((ls) => ls.map((l) => l.id === listId ? { ...l, items: l.items.filter((it) => it.id !== itemId) } : l));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Household Members</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Invite family or housemates to share lists and see household orders. Invited members show as pending until they accept.</div>
        <div className="list-col" style={{ marginBottom: 14 }}>
          {members.map((m) => (
            <div key={m.id} className="pending-row">
              <div className="driver-avatar sm">{m.name[0]}</div>
              <div className="ti-mid"><div className="card-name">{m.name}</div><div className="muted small">{m.relationship}{m.email ? ` -- ${m.email}` : ""}</div></div>
              <span className={`status-pill ${m.status === "active" ? "done" : "prep"}`}>{m.status === "active" ? "Active" : "Invited"}</span>
              {m.relationship !== "Owner" && <button className="ghost-btn-sm" onClick={() => confirmAction({ title: "Remove this member?", message: "They will lose access to your household account.", confirmLabel: "Remove member" }, () => removeMember(m.id))}><X size={12} /></button>}
            </div>
          ))}
        </div>
        <div className="field" style={{ marginBottom: 8 }}><span>Name</span><input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Ada" /></div>
        <div className="field" style={{ marginBottom: 8 }}><span>Relationship</span><input value={inviteRelationship} onChange={(e) => setInviteRelationship(e.target.value)} placeholder="e.g. Spouse, Roommate" /></div>
        <div className="field" style={{ marginBottom: 10 }}><span>Email</span><input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ada@example.com" /></div>
        <button className="primary-btn-sm" disabled={!inviteName.trim() || !inviteEmail.trim()} onClick={sendInvite}>Send invite</button>
      </div>
      <div className="panel enter">
        <div className="panel-title">Shared Lists</div>
        {lists.map((l) => (
          <div key={l.id} style={{ marginBottom: 16 }}>
            <div className="muted small" style={{ fontWeight: 700, marginBottom: 6 }}>{l.name}</div>
            <div className="list-col" style={{ marginBottom: 8 }}>
              {l.items.map((it) => (
                <label key={it.id} className="pending-row" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={it.done} onChange={() => toggleItem(l.id, it.id)} />
                  <div className="ti-mid" style={{ textDecoration: it.done ? "line-through" : "none", opacity: it.done ? 0.6 : 1 }}>{it.name}</div>
                  <button className="ghost-btn-sm" onClick={() => removeItem(l.id, it.id)}><X size={11} /></button>
                </label>
              ))}
              {l.items.length === 0 && <EmptyNote>No items yet.</EmptyNote>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input style={{ flex: 1 }} value={newItemByList[l.id] || ""} onChange={(e) => setNewItemByList((p) => ({ ...p, [l.id]: e.target.value }))} placeholder="Add item..." onKeyDown={(e) => e.key === "Enter" && addItem(l.id)} />
              <button className="ghost-btn-sm" onClick={() => addItem(l.id)}>Add</button>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input style={{ flex: 1 }} value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="New list name..." onKeyDown={(e) => e.key === "Enter" && addList()} />
          <button className="primary-btn-sm" onClick={addList}>New list</button>
        </div>
      </div>
      {orders && orders.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Shared Orders</div>
          <div className="muted small" style={{ marginBottom: 12 }}>Share an order with your household so everyone can see its status -- toggle sharing on any recent order below.</div>
          <div className="list-col">
            {orders.slice(0, 8).map((o) => (
              <div key={o.id} className="pending-row">
                <div className="ti-mid"><div className="card-name">Order #{o.id}</div><div className="muted small">{o.status}{o.total ? ` -- ${naira(o.total)}` : ""}</div></div>
                <button className={`toggle-mini ${o.sharedWithHousehold ? "on" : ""}`} onClick={() => onToggleShareOrder && onToggleShareOrder(o.id)}><span /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {(() => {
        const sharedOrders = (orders || []).filter((o) => o.sharedWithHousehold);
        if (sharedOrders.length === 0 || members.length < 2) return null;
        // Real orders don't record which household member placed them, so
        // attribution is deterministic-per-order (stable, not random) --
        // a stand-in until per-order attribution is actually tracked.
        const spendByMember = Object.fromEntries(members.map((m) => [m.name, 0]));
        sharedOrders.forEach((o) => {
          const h = [...o.id].reduce((s, c) => s + c.charCodeAt(0), 0);
          const member = members[h % members.length];
          spendByMember[member.name] = (spendByMember[member.name] || 0) + (o.total || 0);
        });
        const total = Object.values(spendByMember).reduce((s, v) => s + v, 0);
        return (
          <div className="panel enter">
            <div className="panel-title" style={{ fontSize: 13 }}>Household Spending Breakdown</div>
            <div className="muted small" style={{ marginBottom: 10 }}>Across {sharedOrders.length} shared order{sharedOrders.length !== 1 ? "s" : ""}, total {naira(total)}.</div>
            <div className="list-col">
              {Object.entries(spendByMember).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([name, spend]) => (
                <div key={name} className="cat-top">
                  <span className="muted small" style={{ flex: 1 }}>{name}</span>
                  <div className="bar-track" style={{ flex: 2, marginRight: 10 }}><div className="bar-fill-h" style={{ width: `${total > 0 ? (spend / total) * 100 : 0}%`, background: "#7C3AED" }} /></div>
                  <span className="mono small">{naira(spend)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AboutScreen({ onOpenLegal }) {
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">About Medra</div>
        <p className="muted small" style={{ marginBottom: 4 }}>Medra connects customers with local sellers, riders, and healthcare providers in one app -- groceries, pharmacy, everyday shopping, and telehealth, delivered fast and paid for however works for you.</p>
        <p className="muted small">We're building for Nigeria first: transfer-friendly payments, delivery that accounts for real traffic and weather, and a marketplace that treats sellers and riders as partners, not just suppliers.</p>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Team</div>
        <div className="list-col">
          {ABOUT_TEAM.map((t) => (
            <div key={t.name} className="pending-row">
              <div className="driver-avatar sm">{t.name[0]}</div>
              <div className="ti-mid"><div className="card-name">{t.name}</div><div className="muted small">{t.role}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel enter">
        <div className="list-col">
          <button className="flag-row nav-flag" onClick={() => onOpenLegal("terms")}><FileText size={15} /><div className="ti-mid card-name">Terms of Service</div><ChevronRight size={15} /></button>
          <button className="flag-row nav-flag" onClick={() => onOpenLegal("privacy")}><FileText size={15} /><div className="ti-mid card-name">Privacy Policy</div><ChevronRight size={15} /></button>
        </div>
        <div className="version-tag" style={{ marginTop: 12 }}>Medra Customer -- {APP_VERSION}</div>
      </div>
    </div>
  );
}

function SupportScreen({ membership, orders, prefilledOrderId, onConsumePrefill }) {
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState(null);
  const filtered = FAQ_ITEMS.filter((f) => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()));
  const [tickets, setTickets] = useState([]);
  const [category, setCategory] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState(prefilledOrderId || "");
  // BUG FIX: prefilledOrderId used to stay set in the parent forever once
  // "Get help with this order" was clicked once -- so navigating to Support
  // normally later (for something unrelated) would silently re-select that
  // same old order every time this screen mounted. Consume it once, then
  // tell the parent to clear it, so a plain visit to Support starts blank.
  useEffect(() => {
    if (prefilledOrderId) {
      setRelatedOrderId(prefilledOrderId);
      onConsumePrefill?.();
    }
  }, [prefilledOrderId]);
  const tier = !membership?.paused ? MEMBERSHIP_TIERS.find((t) => t.key === membership?.tier) : null;
  const isPriority = !!tier;
  const isVip = !membership?.paused && membership?.tier === "elite";
  const submitTicket = () => {
    if (!category || !message.trim()) return;
    const cat = DISPUTE_CATEGORIES.find((c) => c.key === category);
    const finalSubject = subject.trim() || (subtype ? `${cat.label} -- ${subtype}` : cat.label);
    setTickets((t) => [{ id: "CT" + Math.floor(10000 + Math.random() * 89999), subject: finalSubject, category, subtype, message: message.trim(), orderId: relatedOrderId || null, stage: "support", attachment: attachment || null }, ...t]);
    setCategory(null);
    setSubtype(null);
    setSubject("");
    setMessage("");
    setAttachment("");
    setRelatedOrderId("");
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Help center</div>
        <div className="field" style={{ marginBottom: 14 }}>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search FAQs -- e.g. 'refund', 'cancel'" />
        </div>
        {filtered.length === 0 ? (
          <EmptyNote>No FAQs match "{query}". Try contacting support below.</EmptyNote>
        ) : (
          <div className="list-col">
            {filtered.map((f, i) => (
              <div key={i} className="faq-item">
                <button className="faq-q" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                  <span>{f.q}</span><ChevronDown size={14} style={{ transform: openIdx === i ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
                {openIdx === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="panel enter">
        <div className="panel-title">Help & Disputes</div>
        <div className="muted small" style={{ marginBottom: 10 }}>
          {isVip ? <><BadgeCheck size={12} style={{ verticalAlign: "middle" }} color="#0F172A" /> Elite Black member -- your tickets go straight to VIP concierge support.</> : isPriority ? <><BadgeCheck size={12} style={{ verticalAlign: "middle" }} color={tier.color} /> {tier.name} member -- your tickets get priority handling.</> : "We usually reply within a few minutes during active hours."}
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>What's the problem?</span>
          <div className="chip-row" style={{ marginTop: 4 }}>
            {DISPUTE_CATEGORIES.map((c) => (
              <button key={c.key} className={`chip ${category === c.key ? "active" : ""}`} onClick={() => { setCategory(c.key); setSubtype(null); }}>{c.label}</button>
            ))}
          </div>
        </div>
        {category && DISPUTE_CATEGORIES.find((c) => c.key === category)?.subtypes && (
          <div className="field" style={{ marginBottom: 10 }}>
            <span>What kind of order problem?</span>
            <div className="chip-row" style={{ marginTop: 4 }}>
              {DISPUTE_CATEGORIES.find((c) => c.key === category).subtypes.map((s) => (
                <button key={s} className={`chip ${subtype === s ? "active" : ""}`} onClick={() => setSubtype(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {category && (
          <>
            <div className="field" style={{ marginBottom: 8 }}><span>Subject (optional)</span><input type="text" placeholder="Auto-filled from what you picked above if left blank" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            {orders && orders.length > 0 && (
              <div className="field" style={{ marginBottom: 8 }}>
                <span>Related order (optional)</span>
                <select className="sort-select" value={relatedOrderId} onChange={(e) => setRelatedOrderId(e.target.value)}>
                  <option value="">Not order-specific</option>
                  {orders.slice(-10).reverse().map((o) => <option key={o.id} value={o.id}>Order #{o.id}</option>)}
                </select>
              </div>
            )}
            <div className="field" style={{ marginBottom: 8 }}><span>Message</span><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue..." style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical" }} /></div>
            <div className="field" style={{ marginBottom: 8 }}>
              <span>Attach a photo (optional)</span>
              <input type="file" accept="image/*" onChange={(e) => setAttachment(e.target.files?.[0]?.name || "")} />
              {attachment && <div className="muted small" style={{ marginTop: 4 }}>Attached: {attachment}</div>}
            </div>
            <button className="primary-btn-sm" disabled={!message.trim()} onClick={submitTicket}>Submit ticket</button>
          </>
        )}
      </div>
      {tickets.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Your tickets</div>
          <div className="list-col">
            {tickets.map((t) => (
              <div key={t.id} className="pending-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", width: "100%" }}>
                  <div className="ti-mid">
                    <div className="card-name">{t.subject}{t.orderId && <span className="muted small"> -- Order #{t.orderId}</span>}</div>
                    <div className="muted small">{t.message}</div>
                    <DisputeStageTrack stage={t.stage} />
                    {t.attachment && <div className="muted small">📎 {t.attachment}</div>}
                  </div>
                  <span className={`status-pill ${isVip ? "route" : isPriority ? "route" : "prep"}`}>{isVip ? "VIP" : isPriority ? "Priority" : "Open"}</span>
                </div>
                {t.stage !== "resolved" && (
                  <button className="ghost-btn-sm" onClick={() => setTickets((ts) => ts.map((x) => x.id === t.id ? { ...x, stage: "resolved" } : x))}>Mark as resolved</button>
                )}
                {t.stage === "resolved" && !t.csat && (
                  <div className="cat-top" style={{ width: "100%" }}>
                    <span className="muted small">How was your support experience?</span>
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }} onClick={() => setTickets((ts) => ts.map((x) => x.id === t.id ? { ...x, csat: n } : x))}>
                          <Star size={16} fill="none" color="#F59E0B" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {t.csat && <div className="muted small">Thanks for the feedback -- you rated this {t.csat}/5 <Star size={11} fill="#F59E0B" color="#F59E0B" style={{ verticalAlign: "middle" }} /></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleInfoScreen({ title, rows }) {
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">{title}</div>
        <div className="list-col">{rows.map(([a, b]) => <div key={a} className="flag-row"><div className="ti-mid"><div className="card-name">{a}</div><div className="muted">{b}</div></div></div>)}</div>
      </div>
    </div>
  );
}

/* ============================================================
   ONBOARDING
   ============================================================ */

function PushPermissionModal({ onChoice }) {
  return (
    <div className="modal-backdrop">
      <div className="confirm-modal enter" style={{ textAlign: "center" }}>
        <Bell size={28} color="#7C3AED" />
        <div className="card-name" style={{ fontSize: 16, margin: "10px 0 6px" }}>Turn on notifications?</div>
        <p className="muted">Get notified about order updates, price drops, and rewards. You can change this any time in Settings.</p>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button className="ghost-btn-sm" style={{ flex: 1 }} onClick={() => onChoice(false)}>Not now</button>
          <button className="primary-btn-sm" style={{ flex: 1 }} onClick={() => onChoice(true)}>Allow</button>
        </div>
      </div>
    </div>
  );
}

function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: ShoppingBag, title: "Find what you need", body: "Browse categories, search, or check out what's trending -- add anything to your cart as you go." },
    { icon: CircleCheck, title: "Get started in 3 steps", body: "Place your first order, save something to your wishlist, and join a vendor's fan club -- you'll see your progress right on the Dashboard." },
    { icon: Award, title: "Earn points, not just cashback", body: "Convert naira to points any time -- points never convert back, but you can spend them on products, games, and themes." },
    { icon: PartyPopper, title: "Have some fun, when you're ready", body: "Play a riddle, quiz, or spin the wheel under Rewards -- totally optional, and separate from the points you earn just by shopping." },
  ];
  const s = steps[step];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="onboard-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <s.icon size={30} color="#7C3AED" />
        <div className="card-name" style={{ fontSize: 17, margin: "12px 0 6px" }}>{s.title}</div>
        <p className="muted">{s.body}</p>
        <div className="onboard-dots">{steps.map((_, i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {step > 0 && <button className="ghost-btn-sm" onClick={() => setStep((s) => s - 1)}>Back</button>}
          {step < steps.length - 1 ? <button className="primary-btn-sm wide" onClick={() => setStep((s) => s + 1)}>Next</button> : <button className="primary-btn-sm wide" onClick={onClose}>Got it</button>}
        </div>
        {step < steps.length - 1 && <button className="link-btn" style={{ marginTop: 10 }} onClick={onClose}>Skip</button>}
      </div>
    </div>
  );
}

const CUSTOMER_WHATS_NEW = [
  { icon: Star, title: "Rate your order right after delivery", body: "We'll prompt you with a quick star rating the moment your order arrives -- no more digging through Order History to leave feedback." },
  { icon: Truck, title: "Reorder now skips straight to checkout", body: "Tap Reorder on any past order and we'll take you right to the confirm step with everything pre-filled." },
  { icon: PenLine, title: "Add delivery instructions at checkout", body: "Tell your rider exactly how to find you -- leave at door, call on arrival, gate codes, and more." },
];

function WhatsNewModal({ onClose }) {
  const [step, setStep] = useState(0);
  const s = CUSTOMER_WHATS_NEW[step];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="onboard-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <span className="status-pill done" style={{ marginBottom: 8 }}>What's New</span>
        <s.icon size={30} color="#7C3AED" />
        <div className="card-name" style={{ fontSize: 17, margin: "12px 0 6px" }}>{s.title}</div>
        <p className="muted">{s.body}</p>
        <div className="onboard-dots">{CUSTOMER_WHATS_NEW.map((_, i) => <span key={i} className={i === step ? "on" : ""} />)}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {step > 0 && <button className="ghost-btn-sm" onClick={() => setStep((s) => s - 1)}>Back</button>}
          {step < CUSTOMER_WHATS_NEW.length - 1 ? <button className="primary-btn-sm wide" onClick={() => setStep((s) => s + 1)}>Next</button> : <button className="primary-btn-sm wide" onClick={onClose}>Got it</button>}
        </div>
        {step < CUSTOMER_WHATS_NEW.length - 1 && <button className="link-btn" style={{ marginTop: 10 }} onClick={onClose}>Skip</button>}
      </div>
    </div>
  );
}


/* ============================================================
   APP SHELL
   ============================================================ */

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 700);
  };
  if (sent) {
    return (
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <CircleCheck size={28} color="#16A34A" />
        <p className="muted" style={{ margin: "12px 0" }}>If an account exists for <b style={{ color: "var(--ink)" }}>{email}</b>, a reset link is on its way. Check your inbox and spam folder.</p>
        <button className="ghost-btn-sm" onClick={() => setSent(false)}>Send to a different email</button>
        <div style={{ marginTop: 10 }}><button className="link-btn" onClick={onBack}>Back to log in</button></div>
      </div>
    );
  }
  return (
    <form className="login-form" onSubmit={submit}>
      <p className="muted" style={{ marginTop: -4, marginBottom: 4 }}>Enter your email and we'll send you a secure reset link.</p>
      <label className="field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
      <button className={`primary-btn wide ${loading ? "loading" : ""}`} type="submit" disabled={loading}>{loading ? <span className="spinner" /> : "Send reset link"}</button>
      <button type="button" className="link-btn" style={{ alignSelf: "center" }} onClick={onBack}>Back to log in</button>
    </form>
  );
}

const LANDING_CSS = `
.lp-root{ font-family:'Inter',sans-serif; color:#0F172A; background:#fff; }
.lp-root *{ box-sizing:border-box; }
.lp-nav{ display:flex; align-items:center; justify-content:space-between; padding:16px 48px; border-bottom:1px solid #EEF0F5; }
.lp-nav-links{ display:flex; align-items:center; gap:28px; }
.lp-nav-links a{ font-size:14px; font-weight:500; color:#1E293B; cursor:pointer; padding-bottom:20px; border-bottom:2px solid transparent; }
.lp-nav-links a.active{ color:#6D28D9; border-bottom-color:#6D28D9; }
.lp-nav-actions{ display:flex; align-items:center; gap:10px; }
.lp-btn-primary{ display:inline-flex; align-items:center; gap:8px; justify-content:center; background:#6D28D9; color:#fff; border-radius:12px; padding:10px 18px; font-size:14px; font-weight:600; white-space:nowrap; }
.lp-btn-primary.lg{ padding:14px 26px; font-size:15px; border-radius:14px; }
.lp-btn-outline{ display:inline-flex; align-items:center; gap:8px; justify-content:center; background:#fff; color:#0F172A; border:1.5px solid #E2E8F0; border-radius:12px; padding:10px 18px; font-size:14px; font-weight:600; white-space:nowrap; }
.lp-btn-outline.lg{ padding:14px 26px; font-size:15px; border-radius:14px; }
.lp-hero{ display:grid; grid-template-columns:1fr 1fr; gap:40px; align-items:center; padding:64px 48px; max-width:1400px; margin:0 auto; }
.lp-pill{ display:inline-flex; align-items:center; gap:6px; background:#F3EEFF; color:#6D28D9; font-size:12px; font-weight:700; letter-spacing:0.02em; border-radius:100px; padding:7px 14px; margin-bottom:22px; }
.lp-hero-left h1{ font-size:46px; font-weight:800; line-height:1.12; margin:0 0 18px; }
.lp-hero-left h1 .accent{ color:#6D28D9; }
.lp-hero-sub{ font-size:16px; color:#475569; line-height:1.6; max-width:480px; margin-bottom:28px; }
.lp-hero-ctas{ display:flex; gap:14px; margin-bottom:36px; }
.lp-trust-row{ display:flex; flex-wrap:wrap; gap:26px; }
.lp-trust-item{ display:flex; align-items:center; gap:10px; }
.lp-trust-item svg{ color:#16A34A; flex-shrink:0; }
.lp-trust-item b{ display:block; font-size:13px; font-weight:600; }
.lp-trust-item span{ display:block; font-size:11.5px; color:#64748B; }
.lp-hero-right{ display:flex; justify-content:center; position:relative; }
.lp-phone{ width:290px; background:#0F0B1F; border-radius:36px; padding:10px; box-shadow:0 40px 80px -30px rgba(76,29,149,0.45); }
.lp-phone-screen{ background:#6D28D9; border-radius:26px; padding:18px 16px 22px; color:#fff; min-height:520px; }
.lp-phone-topbar{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
.lp-phone-greet{ font-size:15px; font-weight:700; margin-bottom:2px; }
.lp-phone-greet-sub{ font-size:11px; opacity:0.8; margin-bottom:14px; }
.lp-phone-icons{ display:flex; gap:8px; }
.lp-phone-icon-btn{ width:26px; height:26px; border-radius:100px; background:rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; position:relative; }
.lp-phone-badge{ position:absolute; top:-4px; right:-4px; background:#F43F5E; color:#fff; font-size:8px; font-weight:700; border-radius:100px; width:14px; height:14px; display:flex; align-items:center; justify-content:center; }
.lp-phone-search{ display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.14); border-radius:12px; padding:10px 12px; font-size:11.5px; color:rgba(255,255,255,0.85); margin-bottom:14px; }
.lp-phone-deal-card{ background:#fff; border-radius:16px; padding:14px; margin-bottom:14px; }
.lp-phone-deal-label{ font-size:9px; font-weight:700; color:#6D28D9; letter-spacing:0.04em; margin-bottom:2px; }
.lp-phone-deal-title{ font-size:15px; font-weight:800; color:#0F172A; margin-bottom:2px; }
.lp-phone-deal-sub{ font-size:10px; color:#64748B; margin-bottom:10px; }
.lp-phone-deal-btn{ background:#0F172A; color:#fff; font-size:10.5px; font-weight:700; border-radius:8px; padding:6px 12px; display:inline-block; }
.lp-phone-cats{ display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:14px; }
.lp-phone-cat{ background:rgba(255,255,255,0.1); border-radius:12px; padding:8px 4px; text-align:center; }
.lp-phone-cat-icon{ width:24px; height:24px; border-radius:8px; background:#fff; margin:0 auto 4px; display:flex; align-items:center; justify-content:center; }
.lp-phone-cat span{ font-size:8px; font-weight:600; }
.lp-phone-section-title{ display:flex; justify-content:space-between; font-size:10.5px; font-weight:700; margin-bottom:8px; }
.lp-phone-flash{ background:rgba(255,255,255,0.14); border-radius:12px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; font-size:10px; font-weight:600; }
.lp-shopping-bag-deco{ position:absolute; right:-30px; bottom:-20px; width:110px; height:130px; background:linear-gradient(160deg,#F1F5F9,#E2E8F0); border-radius:12px 12px 4px 4px; opacity:0.9; display:flex; align-items:center; justify-content:center; box-shadow:0 20px 40px -20px rgba(15,23,42,0.25); }
.lp-why{ background:#F8F9FC; padding:56px 48px; text-align:center; }
.lp-why h2{ font-size:26px; font-weight:800; margin-bottom:32px; }
.lp-why h2 .accent{ color:#6D28D9; }
.lp-why-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1200px; margin:0 auto; }
.lp-why-card{ background:#fff; border:1px solid #EEF0F5; border-radius:18px; padding:26px 22px; text-align:left; }
.lp-why-icon{ width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
.lp-why-card h3{ font-size:15px; font-weight:700; margin:0 0 6px; }
.lp-why-card p{ font-size:13px; color:#64748B; line-height:1.5; margin:0; }
.lp-cta-banner{ display:flex; align-items:center; gap:32px; background:#F3EEFF; border-radius:24px; margin:0 48px 56px; padding:36px 44px; }
.lp-cta-basket{ width:130px; height:130px; border-radius:20px; background:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 20px 40px -20px rgba(109,40,217,0.25); }
.lp-cta-mid{ flex:1; }
.lp-cta-mid h3{ font-size:24px; font-weight:800; margin:0 0 8px; }
.lp-cta-mid h3 .accent{ color:#6D28D9; }
.lp-cta-mid p{ font-size:14px; color:#475569; margin:0; max-width:420px; }
.lp-cta-badges{ display:flex; align-items:center; gap:14px; }
.lp-store-badge{ background:#0F172A; color:#fff; border-radius:10px; padding:9px 16px; display:flex; align-items:center; gap:8px; }
.lp-store-badge b{ font-size:13px; display:block; line-height:1.1; }
.lp-store-badge span{ font-size:9px; opacity:0.75; }
.lp-qr-box{ text-align:center; }
.lp-qr{ width:70px; height:70px; border-radius:10px; border:1px solid #E2E8F0; background:#fff repeating-linear-gradient(45deg,#0F172A 0,#0F172A 2px,transparent 2px,transparent 5px); }
.lp-qr-box span{ display:block; font-size:10px; color:#64748B; margin-top:6px; }
@media (max-width:900px){
  .lp-hero{ grid-template-columns:1fr; }
  .lp-nav-links{ display:none; }
  .lp-why-grid{ grid-template-columns:1fr 1fr; }
  .lp-cta-banner{ flex-direction:column; text-align:center; }
}
`;

function CustomerLandingPage({ onShopNow, onSignIn }) {
  return (
    <div className="lp-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{LANDING_CSS}</style>
      <nav className="lp-nav">
        <Logo />
        <div className="lp-nav-links">
          <a className="active">Home</a>
          <a>Features</a>
          <a>How It Works</a>
          <a>For Businesses</a>
          <a>Pricing</a>
          <a>About Us</a>
          <a>Contact</a>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-btn-outline" onClick={onSignIn}>Log In</button>
          <button className="lp-btn-primary" onClick={onShopNow}>Get the App</button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-left">
          <div className="lp-pill"><User size={13} /> FOR CUSTOMERS</div>
          <h1>Everything you need,<br /><span className="accent">delivered</span> to you.</h1>
          <p className="lp-hero-sub">Shop from your favorite stores, discover great deals, track orders in real time, and enjoy a seamless shopping experience.</p>
          <div className="lp-hero-ctas">
            <button className="lp-btn-primary lg" onClick={onShopNow}>Shop Now <ArrowRight size={16} /></button>
            <button className="lp-btn-outline lg" onClick={onShopNow}>Download App <Download size={16} /></button>
          </div>
          <div className="lp-trust-row">
            <div className="lp-trust-item"><ShieldCheck size={22} /><div><b>Secure Payments</b><span>100% Safe & Secure</span></div></div>
            <div className="lp-trust-item"><Truck size={22} /><div><b>Fast Delivery</b><span>On-time, Every time</span></div></div>
            <div className="lp-trust-item"><Award size={22} /><div><b>Top Quality</b><span>Trusted by thousands</span></div></div>
            <div className="lp-trust-item"><Headphones size={22} /><div><b>24/7 Support</b><span>We're here for you</span></div></div>
          </div>
        </div>
        <div className="lp-hero-right">
          <div className="lp-phone">
            <div className="lp-phone-screen">
              <div className="lp-phone-topbar">
                <div>
                  <div className="lp-phone-greet">Hello, Amara 👋</div>
                  <div className="lp-phone-greet-sub">What would you like to shop today?</div>
                </div>
                <div className="lp-phone-icons">
                  <div className="lp-phone-icon-btn"><Bell size={12} /><span className="lp-phone-badge">2</span></div>
                  <div className="lp-phone-icon-btn"><ShoppingCart size={12} /><span className="lp-phone-badge">1</span></div>
                </div>
              </div>
              <div className="lp-phone-search"><Search size={12} /> Search for products, stores...</div>
              <div className="lp-phone-deal-card">
                <div className="lp-phone-deal-label">MEGA DEALS</div>
                <div className="lp-phone-deal-title">Up to 50% Off</div>
                <div className="lp-phone-deal-sub">On groceries, fashion, electronics & more</div>
                <div className="lp-phone-deal-btn">Shop Now</div>
              </div>
              <div className="lp-phone-cats">
                <div className="lp-phone-cat"><div className="lp-phone-cat-icon"><ShoppingBag size={11} color="#16A34A" /></div><span>Groceries</span></div>
                <div className="lp-phone-cat"><div className="lp-phone-cat-icon"><Cross size={11} color="#16A34A" /></div><span>Pharmacy</span></div>
                <div className="lp-phone-cat"><div className="lp-phone-cat-icon"><Shirt size={11} color="#6D28D9" /></div><span>Fashion</span></div>
                <div className="lp-phone-cat"><div className="lp-phone-cat-icon"><Smartphone size={11} color="#0EA5E9" /></div><span>Electronics</span></div>
              </div>
              <div className="lp-phone-section-title"><span>Popular Stores</span><span style={{ opacity: 0.7 }}>See All</span></div>
              <div className="lp-phone-cats" style={{ marginBottom: 14 }}>
                <div className="lp-phone-cat"><div className="lp-phone-cat-icon"><Store size={11} color="#6D28D9" /></div><span>Medra Mart</span></div>
                <div className="lp-phone-cat"><div className="lp-phone-cat-icon"><Flame size={11} color="#EA580C" /></div><span>QuickMart</span></div>
                <div className="lp-phone-cat"><div className="lp-phone-cat-icon"><Cross size={11} color="#16A34A" /></div><span>HealthyPlus</span></div>
                <div className="lp-phone-cat"><div className="lp-phone-cat-icon"><Smartphone size={11} color="#0F172A" /></div><span>TechZone</span></div>
              </div>
              <div className="lp-phone-section-title"><span>Flash Deals</span></div>
              <div className="lp-phone-flash"><span>Ends in</span><span>02 : 45 : 30</span></div>
            </div>
          </div>
          <div className="lp-shopping-bag-deco"><ShoppingBag size={40} color="#94A3B8" /></div>
        </div>
      </section>

      <section className="lp-why">
        <h2>Why Shop with <span className="accent">Medra</span>?</h2>
        <div className="lp-why-grid">
          <div className="lp-why-card">
            <div className="lp-why-icon" style={{ background: "#F3EEFF", color: "#6D28D9" }}><ShoppingBag size={22} /></div>
            <h3>Wide Selection</h3>
            <p>Shop from thousands of stores and millions of products.</p>
          </div>
          <div className="lp-why-card">
            <div className="lp-why-icon" style={{ background: "#FFF1E9", color: "#EA580C" }}><Tag size={22} /></div>
            <h3>Best Deals</h3>
            <p>Enjoy amazing discounts and exclusive offers every day.</p>
          </div>
          <div className="lp-why-card">
            <div className="lp-why-icon" style={{ background: "#EAFBF1", color: "#16A34A" }}><MapPin size={22} /></div>
            <h3>Real-time Tracking</h3>
            <p>Track your orders live and know exactly when they'll arrive.</p>
          </div>
          <div className="lp-why-card">
            <div className="lp-why-icon" style={{ background: "#EAF3FF", color: "#2563EB" }}><Wallet size={22} /></div>
            <h3>Secure Wallet</h3>
            <p>Save your money securely and pay with ease.</p>
          </div>
        </div>
      </section>

      <div className="lp-cta-banner">
        <div className="lp-cta-basket"><ShoppingBag size={48} color="#6D28D9" /></div>
        <div className="lp-cta-mid">
          <h3>Ready to shop <span className="accent">smarter</span>?</h3>
          <p>Join thousands of happy customers and experience the best way to shop and save.</p>
        </div>
        <div className="lp-cta-badges">
          <div className="lp-store-badge"><Smartphone size={18} /><div><span>Download on the</span><b>App Store</b></div></div>
          <div className="lp-store-badge"><Smartphone size={18} /><div><span>GET IT ON</span><b>Google Play</b></div></div>
          <div className="lp-qr-box"><div className="lp-qr" /><span>Scan to Download</span></div>
        </div>
      </div>
    </div>
  );
}

function GuestShopShell({ onLogin }) {
  const [wishlist, setWishlist] = useState(new Set());
  const [modalProduct, setModalProduct] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const toggleWishlist = () => setLoginPrompt(true);
  const requireLogin = () => setLoginPrompt(true);
  return (
    <div className="medra-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
        <div className="card-name">Browsing as guest</div>
        <button className="primary-btn-sm" onClick={onLogin}>Log in / Sign up</button>
      </div>
      {loginPrompt && (
        <div className="modal-backdrop" onClick={() => setLoginPrompt(false)}>
          <div className="confirm-modal enter" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <UserCircle size={28} color="#7C3AED" />
            <div className="card-name" style={{ fontSize: 16, margin: "10px 0 6px" }}>Log in to continue</div>
            <p className="muted">Adding to cart, saving to your wishlist, and checking out all need an account -- it only takes a minute.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="ghost-btn-sm" style={{ flex: 1 }} onClick={() => setLoginPrompt(false)}>Keep browsing</button>
              <button className="primary-btn-sm" style={{ flex: 1 }} onClick={onLogin}>Log in</button>
            </div>
          </div>
        </div>
      )}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAdd={requireLogin}
          onOpenProduct={setModalProduct}
          onOpenStore={requireLogin}
          unitPref="imperial"
          myReviews={{}}
          onSubmitReview={requireLogin}
          myQuestionsByProduct={{}}
          onAskQuestion={requireLogin}
          reportedPriceErrors={new Set()}
          onReportPriceError={requireLogin}
        />
      )}
      <ShopScreen initialQuery="" onOpenProduct={setModalProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} orders={[]} onAddToCart={requireLogin} />
    </div>
  );
}

function LoginScreen({ onLogin, onGuestBrowse }) {
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  // Mock duplicate-account check -- a real backend would query existing
  // accounts by email/phone; this recognizes the one seeded "already
  // registered" demo address so the flow is demonstrable without a database.
  const KNOWN_EMAILS = ["priya@medra.com", "amara@medra.com"];
  const submit = (e) => {
    e.preventDefault();
    if (mode === "signup") {
      const emailInput = e.target.querySelector('input[type="text"]');
      const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      if (KNOWN_EMAILS.includes(email)) { setDuplicateError(true); return; }
    }
    setDuplicateError(false);
    setLoading(true);
    const dobInput = e.target.querySelector('input[name="dob"]');
    const dob = dobInput ? dobInput.value : null;
    setTimeout(() => { setLoading(false); onLogin(mode, dob); }, 700);
  };
  return (
    <div className="medra-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      <div className="staff-login-wrap">
        <div className="staff-login-card enter">
          <Logo />
          {mode === "forgot" ? (
            <>
              <div className="staff-login-title" style={{ marginTop: 18 }}>Reset password</div>
              <ForgotPasswordForm onBack={() => setMode("signin")} />
            </>
          ) : (
            <>
              <div className="staff-login-title" style={{ marginTop: 18 }}>{mode === "signin" ? "Welcome back" : "Create your account"}</div>
              <div className="muted">{mode === "signin" ? "Log in to your Medra account to continue" : "Shop, sell, deliver, and earn -- all in one platform"}</div>
              <div className="login-tabs">
                <button type="button" className={`login-tab ${mode === "signin" ? "active" : ""}`} onClick={() => { setMode("signin"); setDuplicateError(false); }}>Log In</button>
                <button type="button" className={`login-tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setDuplicateError(false); }}>Sign Up</button>
              </div>
              <div className="muted small" style={{ textAlign: "center", marginTop: 10 }}>Preview build -- this is a demo environment, not a live account.</div>
              {duplicateError && <div className="muted small" style={{ textAlign: "center", marginTop: 10, color: "#DC2626" }}>An account already exists with that email or phone. Try logging in instead, or use a different email/phone.</div>}
              <form className="login-form" onSubmit={submit}>
                {mode === "signup" && <label className="field"><span>Full name</span><input type="text" defaultValue="Amara Okeke" placeholder="Amara Okeke" required /></label>}
                {mode === "signup" && <label className="field"><span>Date of birth</span><input type="date" name="dob" defaultValue="1996-06-15" required /></label>}
                <label className="field"><span>Email or phone</span><input type="text" defaultValue="demo@medra.com" placeholder="you@example.com" required /></label>
                <label className="field"><span>Password</span><input type="password" defaultValue="demo1234" placeholder="********" required /></label>
                {mode === "signin" && <button type="button" className="link-btn" style={{ alignSelf: "flex-end" }} onClick={() => setMode("forgot")}>Forgot password?</button>}
                <button className={`primary-btn wide ${loading ? "loading" : ""}`} type="submit" disabled={loading}>{loading ? <span className="spinner" /> : mode === "signin" ? "Log In" : "Create Account"}</button>
              </form>
              {mode === "signup" && <div className="muted small" style={{ marginTop: 14, textAlign: "center", lineHeight: 1.5 }}>One email or phone number can hold one Customer, one Seller, and one Rider account -- but never two of the same kind.</div>}
              {mode === "signin" && onGuestBrowse && <button type="button" className="link-btn" style={{ display: "block", margin: "14px auto 0", textAlign: "center" }} onClick={onGuestBrowse}>Just browsing? Continue as guest</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   CONFIRMATION DIALOG -- one shared modal for destructive actions.
   Call confirmAction({ title, message, confirmLabel }, onConfirm);
   <ConfirmHost /> (mounted once at the app root) renders the dialog.
   ------------------------------------------------------------ */
let _confirmHandler = null;
function confirmAction(opts, onConfirm) {
  if (_confirmHandler) _confirmHandler({ ...opts, onConfirm });
  else onConfirm();
}
function ConfirmHost() {
  const [req, setReq] = useState(null);
  useEffect(() => {
    _confirmHandler = setReq;
    return () => { if (_confirmHandler === setReq) _confirmHandler = null; };
  }, []);
  if (!req) return null;
  const close = () => setReq(null);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="confirm-modal enter" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 6 }}>{req.title || "Are you sure?"}</div>
        <div className="muted" style={{ marginBottom: 16 }}>{req.message || "This can't be undone in this preview."}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="ghost-btn-sm" onClick={close}>Keep it</button>
          <button className="primary-btn-sm" style={{ background: "#DC2626" }} autoFocus onClick={() => { const fn = req.onConfirm; close(); fn && fn(); }}>{req.confirmLabel || "Yes, continue"}</button>
        </div>
      </div>
    </div>
  );
}

export default function MedraApp({ sharedAuthed, onAuth, onLogout, sharedOrderStore } = {}) {
  const [authed, setAuthedRaw] = useState(!!sharedAuthed);
  useEffect(() => { if (sharedAuthed) setAuthedRaw(true); }, [sharedAuthed]);
  const setAuthed = (v) => { setAuthedRaw(v); if (v) onAuth?.(); else onLogout?.(); };
  // Real browser connectivity state -- not simulated. Cart/wishlist/points
  // stay usable offline since they're just local state; only checkout and
  // anything else that needs a live connection is blocked while offline.
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, []);
  const [showLanding, setShowLanding] = useState(true);
  const [guestMode, setGuestMode] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartUpdatedAt, setCartUpdatedAt] = useState(null);
  const [savedForLater, setSavedForLater] = useState([]);
  const saveForLater = (key) => {
    setCart((c) => {
      const item = c.find((x) => x.key === key);
      if (item) setSavedForLater((s) => [...s, item]);
      return c.filter((x) => x.key !== key);
    });
  };
  const moveToCart = (key) => {
    setSavedForLater((s) => {
      const item = s.find((x) => x.key === key);
      if (item) setCart((c) => [...c, item]);
      return s.filter((x) => x.key !== key);
    });
  };
  const removeSaved = (key) => setSavedForLater((s) => s.filter((x) => x.key !== key));
  const [wishlist, setWishlist] = useState(new Set());
  const [notifyPrefs, setNotifyPrefs] = useState({});
  const [orders, setOrders] = useState([]);
  const [groupOrders, setGroupOrders] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [donations, setDonations] = useState([]);
  const [communityMessagesSent, setCommunityMessagesSent] = useState(0);
  const [draftRound, setDraftRound] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [battleVotes, setBattleVotes] = useState({});
  const [discoveryClaimedDays, setDiscoveryClaimedDays] = useState({});
  const [communityRequests, setCommunityRequests] = useState(COMMUNITY_REQUESTS_SEED);
  const [adoptedVendors, setAdoptedVendors] = useState([]);
  const [duelWins, setDuelWins] = useState(0);
  const [claimedVendorMilestones, setClaimedVendorMilestones] = useState([]);
  const [claimedGoodDeeds, setClaimedGoodDeeds] = useState([]);
  const [mysteryBoxClaimedDays, setMysteryBoxClaimedDays] = useState({});
  const [localChallengeClaimedWeeks, setLocalChallengeClaimedWeeks] = useState([]);
  const [fantasyLeaguePicks, setFantasyLeaguePicks] = useState({});
  const [draftHistory, setDraftHistory] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [savedRecipients, setSavedRecipients] = useState([]);
  const [supportPrefillOrderId, setSupportPrefillOrderId] = useState(null);
  const [dismissedTipReminders, setDismissedTipReminders] = useState(new Set());
  const [myReviews, setMyReviews] = useState({});
  const [myQuestionsByProduct, setMyQuestionsByProduct] = useState({});
  const [reportedPriceErrors, setReportedPriceErrors] = useState(new Set());
  // ---- Healthcare / Telehealth (prototype, mock data only) ----
  const [healthAppointments, setHealthAppointments] = useState([]);
  const [telehealthPlan, setTelehealthPlan] = useState(null); // null | { tier, visitsUsed, visitsTotal, subscribedAt }
  const [healthPrescriptions, setHealthPrescriptions] = useState(MOCK_PRESCRIPTIONS);
  const [healthDocuments, setHealthDocuments] = useState(MOCK_HEALTH_DOCUMENTS);
  const [healthConversations, setHealthConversations] = useState({});
  const [activeProviderId, setActiveProviderId] = useState(null);
  const [activeHealthAppointment, setActiveHealthAppointment] = useState(null);
  const bookHealthAppointment = ({ providerId, consultType, hasPictures, date, time, cost, payMethod }) => {
    const id = "HA" + Math.floor(10000 + Math.random() * 89999);
    // 10% platform commission, deducted at provider payout (not from the
    // customer's charge) -- e.g. a customer paying 5,000 means the provider
    // is credited 4,500 net once the visit completes and pays out.
    const providerNet = Math.round(cost.amount * (1 - HEALTH_COMMISSION_RATE));
    setHealthAppointments((a) => [...a, { id, providerId, consultType, hasPictures, date, time, status: "upcoming", providerConfirmed: false, grossFee: cost.amount, providerNet }]);
    if (cost.coveredBy === "plan") setTelehealthPlan((p) => p ? { ...p, visitsUsed: p.visitsUsed + 1 } : p);
    // BUG FIX: this used to always charge the wallet regardless of what
    // payment method was actually selected on the payment step -- points
    // payment was never wired to spendPoints. Now charges whichever method
    // the customer chose.
    if (cost.coveredBy === "per_visit" && cost.amount > 0) {
      const providerName = providerById(providerId)?.name || "Provider";
      if (payMethod === "points") {
        spendPoints(cost.amount, "telehealth-visit");
      } else {
        setWallet((w) => w - cost.amount);
        pushWalletTx({ type: "Purchase", label: `Telehealth visit -- ${providerName}`, amount: -cost.amount, reference: providerName });
      }
    }
    // SERVER-AUTHORITY: mock payment only -- a real integration must verify
    // the charge succeeded before marking the appointment confirmed.
  };
  const subscribeTelehealthPlan = (tier) => {
    // Same fix as above -- subscribing to a monthly plan is a real charge
    // (₦15,000 or ₦30,000), not just a state flip.
    const price = TELEHEALTH_PRICING.monthly[tier].price;
    setWallet((w) => w - price);
    pushWalletTx({ type: "Membership", label: `Telehealth ${TELEHEALTH_PRICING.monthly[tier].label} subscription`, amount: -price, reference: TELEHEALTH_PRICING.monthly[tier].label });
    setTelehealthPlan({ tier, visitsUsed: 0, visitsTotal: TELEHEALTH_PRICING.monthly[tier].visits, subscribedAt: Date.now() });
  };
  const rescheduleHealthAppointment = (id, date, time) => setHealthAppointments((a) => a.map((x) => x.id === id ? { ...x, date, time } : x));
  const cancelHealthAppointment = (id) => setHealthAppointments((a) => a.map((x) => x.id === id ? { ...x, status: "cancelled" } : x));
  const completeHealthAppointment = (id) => setHealthAppointments((a) => a.map((x) => x.id === id ? { ...x, status: "completed" } : x));
  const acceptHealthAppointment = (id) => setHealthAppointments((a) => a.map((x) => x.id === id ? { ...x, providerConfirmed: true } : x));
  // Declining refunds the customer -- same rule that would apply to any
  // cancellation: money that was charged for an appointment that isn't
  // going to happen gets reversed.
  const declineHealthAppointment = (id) => {
    setHealthAppointments((a) => {
      const appt = a.find((x) => x.id === id);
      if (appt && appt.grossFee > 0) {
        setWallet((w) => w + appt.grossFee);
        pushWalletTx({ type: "Refund", label: `Refund -- declined telehealth visit`, amount: appt.grossFee, reference: appt.id || "--" });
      }
      return a.map((x) => x.id === id ? { ...x, status: "cancelled" } : x);
    });
  };
  const createHealthPrescription = ({ medication, dosage, frequency, duration, instructions, providerId, appointmentId }) => {
    const id = "RX" + Math.floor(10000 + Math.random() * 89999);
    setHealthPrescriptions((rx) => [...rx, { id, medication, dosage, frequency, duration, instructions, providerId, dateIssued: new Date().toISOString().slice(0, 10), appointmentId }]);
  };
  // Sending a message to a doctor (not a pharmacist) costs points -- scales
  // with message length within the given range, same pattern as the
  // severity-scaled visit fees above (short message = 500, longer = up to
  // 1,000). Pharmacists remain free to message informally.
  const HEALTH_MESSAGE_COST_RANGE = [500, 1000];
  const getHealthMessageCost = (providerId, text) => {
    const provider = providerById(providerId);
    if (!provider || provider.type !== "doctor") return 0;
    const [lo, hi] = HEALTH_MESSAGE_COST_RANGE;
    return text.length > 120 ? hi : lo;
  };
  const sendHealthMessage = (providerId, text, from = "me") => {
    if (from === "me") {
      const cost = getHealthMessageCost(providerId, text);
      if (cost > 0 && !spendPoints(cost, "health-message-to-doctor")) return; // insufficient points, message not sent
    }
    setHealthConversations((c) => ({ ...c, [providerId]: [...(c[providerId] || []), { from, text }] }));
    if (from === "me") {
      setTimeout(() => {
        setHealthConversations((c) => ({ ...c, [providerId]: [...(c[providerId] || []), { from: "provider", text: "Thanks for the message -- I'll get back to you shortly." }] }));
      }, 1200);
    }
  };
  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const openProduct = (p) => {
    setModalProduct(p);
    setRecentlyViewed((rv) => [p.id, ...rv.filter((id) => id !== p.id)].slice(0, 8));
  };
  const [wallet, setWallet] = useState(32450);
  const [walletTx, setWalletTx] = useState(WALLET_TX);
  const [cards, setCards] = useState([{ brand: "Verve", last4: "4821", expiry: "09/28", isDefault: true }]);
  const [membership, setMembership] = useState(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [pauseHistory, setPauseHistory] = useState([]);
  const [lastMembershipLotteryBonusMonth, setLastMembershipLotteryBonusMonth] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [referrals, setReferrals] = useState(() => REFERRALS.map((r) => ({ ...r, invitedAt: r.status === "Order placed" ? null : Date.now() - 4 * 60 * 1000 })));
  useEffect(() => {
    const t = setInterval(() => {
      setReferrals((rs) => {
        let rewardedSoFar = rs.filter((r) => r.earned > 0).length;
        let matured = 0;
        const next = rs.map((r) => {
          if (r.status !== "Invited, hasn't ordered yet" || !r.invitedAt) return r;
          if (Date.now() - r.invitedAt < 5 * 60 * 1000) return r;
          if (rewardedSoFar >= REFERRAL_MONTHLY_CAP) return r;
          rewardedSoFar += 1;
          matured += 1;
          return { ...r, status: "Order placed", earned: 10 };
        });
        if (matured > 0) earnPoints(matured * 10);
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);
  const [points, setPoints] = useState(320);
  // Synchronous mirror of `points`, used only for validating spends/earns.
  // BUG FIX: spendPoints/earnPoints used to validate against the `points`
  // closure value directly. Because React state updates aren't applied
  // synchronously, two spends called back-to-back in the same function (e.g.
  // placeOrder charging checkout-redemption then rider-tip) both read the
  // SAME pre-spend balance -- so a customer with enough points for only ONE
  // of the two charges could have both silently succeed (the actual balance
  // still floors at 0 via Math.max, but that means an unapproved double
  // charge, not a safe rejection). pointsRef is updated immediately, in the
  // same tick, by every spend/earn, so back-to-back calls see the real
  // running balance instead of a stale one.
  const pointsRef = useRef(points);
  useEffect(() => { pointsRef.current = points; }, [points]);
  const [lifetimePoints, setLifetimePoints] = useState(320);
  const [cappedSinceMonth, setCappedSinceMonth] = useState(null);
  const [pointsUsedThisMonth, setPointsUsedThisMonth] = useState(0);
  const [usageMonthMarker, setUsageMonthMarker] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${n.getMonth()}`; });
  const [foundCodes, setFoundCodes] = useState(new Set());
  const [dailyGiveawayPick, setDailyGiveawayPick] = useState({ date: null, name: null });
  const [giveawayDisqualified, setGiveawayDisqualified] = useState(false);
  const [returnRequests, setReturnRequests] = useState([]);
  const [lotteryEntriesToday, setLotteryEntriesToday] = useState(0);
  const [lotteryEntryDay, setLotteryEntryDay] = useState(null);
  const [weeklyLotteryEntries, setWeeklyLotteryEntries] = useState([]);
  const [fanClubs, setFanClubs] = useState(new Set());
  const [duelResult, setDuelResult] = useState(null);
  const [duelPlaying, setDuelPlaying] = useState(false);
  const [insuranceCoverage, setInsuranceCoverage] = useState(0);
  const [missionClaimed, setMissionClaimed] = useState(false);
  const [challengeLevel, setChallengeLevel] = useState(1);
  const [challengeBaseline, setChallengeBaseline] = useState(0);
  const [communityPool, setCommunityPool] = useState(0);
  const [benefactorFund, setBenefactorFund] = useState(0);
  const [carePoolSignedUp, setCarePoolSignedUp] = useState(false);
  const [lastCarePoolDrawAt, setLastCarePoolDrawAt] = useState(null);
  const [weeklyBenefactorClaims, setWeeklyBenefactorClaims] = useState({});
  const [sponsorshipsGiven, setSponsorshipsGiven] = useState([]);
  const [loanRecords, setLoanRecords] = useState([]);
  const [auctionBids, setAuctionBids] = useState([]);
  const [auctionClosed, setAuctionClosed] = useState(false);
  const [auctionWon, setAuctionWon] = useState(false);
  const enterLottery = (picks, usingExtra) => {
    const today = new Date().toDateString();
    if (points < LOTTERY_ENTRY_COST) return;
    if (!usingExtra && lotteryEntryDay === today && lotteryEntriesToday >= 1) return;
    if (usingExtra && boughtLotteryEntries <= 0) return;
    spendPoints(LOTTERY_ENTRY_COST, "lottery-entry");
    setLotteryEntryDay(today);
    setLotteryEntriesToday(lotteryEntryDay === today ? lotteryEntriesToday + 1 : 1);
    if (usingExtra) setBoughtLotteryEntries((e) => e - 1);
    setWeeklyLotteryEntries((e) => [...e, picks]);
  };
  const buyExtraLotteryEntry = () => {
    if (points < PRICING.buyExtraLotteryEntryCost) return;
    if (!spendPoints(PRICING.buyExtraLotteryEntryCost, "extra-lottery-entry")) return;
    setBoughtLotteryEntries((e) => e + 1);
  };
  const claimMemberLotteryBonus = () => {
    const monthId = `${new Date().getFullYear()}-${new Date().getMonth()}`;
    setBoughtLotteryEntries((e) => e + 1);
    setLastMembershipLotteryBonusMonth(monthId);
  };
  // Reward-claim state lifted here (not local to RewardsScreen) so it survives
  // navigating away and back -- RewardsScreen previously unmounted on every
  // tab switch, silently resetting all of these and letting rewards be re-claimed.
  const [claimedBadges, setClaimedBadges] = useState(new Set());
  const [myBirthdayClaimed, setMyBirthdayClaimed] = useState(false);
  const [myBirthday, setMyBirthday] = useState("06-15");
  const [claimedAnniversaries, setClaimedAnniversaries] = useState(new Set());
  const [surveyDone, setSurveyDone] = useState(false);
  const [flashAvailable, setFlashAvailable] = useState(true);
  const [flashClaimed, setFlashClaimed] = useState(false);
  const [boughtLotteryEntries, setBoughtLotteryEntries] = useState(0);
  const [isCreator, setIsCreator] = useState(false);
  const [creatorClaimed, setCreatorClaimed] = useState(false);
  const [lastSpinAt, setLastSpinAt] = useState(null);
  const [activeDiscount, setActiveDiscount] = useState(null);
  const [huntCodesToday, setHuntCodesToday] = useState(0);
  const [huntLastDay, setHuntLastDay] = useState(() => new Date().toDateString());
  const [huntStartDate] = useState(() => new Date());
  const [huntToast, setHuntToast] = useState(null);
  const discoverTreasureCode = (source) => {
    const today = new Date().toDateString();
    let todaysCount = huntCodesToday;
    if (huntLastDay !== today) { todaysCount = 0; setHuntLastDay(today); setHuntCodesToday(0); }
    if (todaysCount >= 2 || foundCodes.size >= 10) return;
    const codeId = `code-${foundCodes.size + 1}`;
    setFoundCodes((s) => {
      const next = new Set(s).add(codeId);
      if (next.size === 10) { earnPoints(100); setHuntToast(`Treasure Hunt code found (${source})! +10 points -- and you completed the full collection for +100 bonus!`); }
      else setHuntToast(`Treasure Hunt code found (${source})! +10 points.`);
      return next;
    });
    setHuntCodesToday(todaysCount + 1);
    earnPoints(10);
    setTimeout(() => setHuntToast(null), 4500);
  };
  const [capToast, setCapToast] = useState(null);
  const [gamesDone, setGamesDone] = useState(new Set());
  const [celebrantWished, setCelebrantWished] = useState(false);
  const [showMyPhoto, setShowMyPhoto] = useState(true);
  const [activeTheme, setActiveTheme] = useState("default");
  const [darkMode, setDarkMode] = useState(false);
  const [unitPref, setUnitPref] = useState("kg");
  const [darkModeAuto, setDarkModeAuto] = useState(false);
  // Time-based dark mode: when enabled, switches automatically in the
  // evening/night window instead of relying on the manual toggle. Checked
  // periodically (not just once) so it still flips while the app stays open
  // across the boundary.
  useEffect(() => {
    if (!darkModeAuto) return;
    const applyByTime = () => {
      const h = new Date().getHours();
      setDarkMode(h >= 19 || h < 7);
    };
    applyByTime();
    const t = setInterval(applyByTime, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [darkModeAuto]);
  const [showCreatorProgram, setShowCreatorProgram] = useState(false);
  const [leaderboardAnon, setLeaderboardAnon] = useState(false);
  const [leaderboardClaimedMonth, setLeaderboardClaimedMonth] = useState(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [universalSearchOpen, setUniversalSearchOpen] = useState(false);
  const [universalSearchQuery, setUniversalSearchQuery] = useState("");
  const [rewardsGroupOpen, setRewardsGroupOpen] = useState(false);
  const [givingGroupOpen, setGivingGroupOpen] = useState(false);
  const [socialGroupOpen, setSocialGroupOpen] = useState(false);
  const [accountGroupOpen, setAccountGroupOpen] = useState(false);
  const [healthGroupOpen, setHealthGroupOpen] = useState(false);
  const [previewGroupOpen, setPreviewGroupOpen] = useState(false);
  const [unlockedThemes, setUnlockedThemes] = useState(new Set(["default"]));
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState(new Set());
  const [notifList, setNotifList] = useState(NOTIF_LIST);
  const [notifCategoryPrefs, setNotifCategoryPrefs] = useState({});
  const [accountOpen, setAccountOpen] = useState(false);
  const [switchNotice, setSwitchNotice] = useState(null);
  const [milestoneToast, setMilestoneToast] = useState(null);
  const [earnedToast, setEarnedToast] = useState(null);
  const [lastPointsBreakdown, setLastPointsBreakdown] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [cancelUndo, setCancelUndo] = useState(null);
  const [statusToast, setStatusToast] = useState(null);
  const [ratingPromptOrder, setRatingPromptOrder] = useState(null);
  const [reorderConfirm, setReorderConfirm] = useState(false);
  const [savedPayMethod, setSavedPayMethod] = useState(null);
  const [textSize, setTextSize] = useState("normal");
  const [removedItem, setRemovedItem] = useState(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [openStore, setOpenStore] = useState(null);
  const [favoriteStores, setFavoriteStores] = useState(new Set());
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [notifyStores, setNotifyStores] = useState(new Set());
  const toggleFavoriteStore = (name) => setFavoriteStores((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const toggleNotifyStore = (name) => setNotifyStores((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const [applyRole, setApplyRole] = useState("seller");
  const [legalDoc, setLegalDoc] = useState("terms");
  const [shopQuery, setShopQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState(null); // null | "granted" | "denied"
  const [pushPromptOpen, setPushPromptOpen] = useState(false);
  const timerRef = useRef(null);
  const activeOrder = orders.find((o) => o.id === activeOrderId);

  const openStoreByName = (name) => setOpenStore(SAVED_STORES.find((s) => s.name === name) || { name, category: "", rating: 4.5, responseTime: "Usually replies within 3 hours" });
  const earnPoints = (n) => {
    if (pointsRef.current >= POINTS_CAP) {
      setCapToast(`You're at the ${POINTS_CAP.toLocaleString()}-point cap -- spend some before ${endOfMonthLabel()} or you'll lose points still parked at the cap.`);
      setTimeout(() => setCapToast(null), 5000);
      return;
    }
    const next = Math.min(POINTS_CAP, pointsRef.current + n);
    pointsRef.current = next;
    setPoints(next);
    if (next === POINTS_CAP) {
      const now = new Date();
      setCappedSinceMonth(`${now.getFullYear()}-${now.getMonth()}`);
    }
    setLifetimePoints((p) => p + n);
  };
  // Single choke point for every points deduction in this app. Prototype-only
  // guard today (checks pointsRef, a synchronous mirror of the balance --
  // see the note by its declaration above -- before allowing the spend);
  // when a real backend exists this is the one function that becomes a
  // server RPC call, so every "spend points" interaction below should call
  // this instead of touching setPoints directly.
  // SERVER-AUTHORITY: once real money/value is at stake, the balance check
  // and the deduction must happen server-side (atomically), not just here.
  const spendPoints = (amount, reason) => {
    if (!amount || amount <= 0) return false;
    if (amount > pointsRef.current) return false;
    pointsRef.current = Math.max(0, pointsRef.current - amount);
    setPoints(pointsRef.current);
    return true;
  };

  const sendGift = (amount) => {
    if (amount <= 0 || amount > points) return;
    const code = generateId("GIFT");
    spendPoints(amount, "gift-sent");
    setGiftCards((g) => [...g, { code, amount, createdAt: Date.now(), redeemed: false }]);
  };
  const redeemGift = (code) => {
    const normalized = code.trim().toUpperCase();
    const match = giftCards.find((g) => g.code === normalized && !g.redeemed);
    if (!match) {
      const exists = giftCards.some((g) => g.code === normalized);
      return { ok: false, text: exists ? "That gift code has already been redeemed." : "That gift code wasn't found." };
    }
    setGiftCards((g) => g.map((x) => x.code === normalized ? { ...x, redeemed: true } : x));
    earnPoints(match.amount);
    return { ok: true, text: `${match.amount} points added to your balance!` };
  };
  const donate = (causeKey, amount) => {
    if (amount <= 0 || amount > points) return;
    spendPoints(amount, "donation");
    setDonations((d) => [...d, { cause: causeKey, amount, at: Date.now() }]);
  };
  const submitDraft = (picks) => {
    if (picks.length !== 3) return;
    setDraftRound({ picks, submittedAt: Date.now(), submittedAtOrderCount: orders.length, resolved: false });
  };
  const resolveDraft = () => {
    if (!draftRound) return;
    const ordersSince = orders.slice(draftRound.submittedAtOrderCount);
    const qtyByProduct = {};
    ordersSince.forEach((o) => (o.items || []).forEach((it) => {
      if (it.productId && draftRound.picks.includes(it.productId)) qtyByProduct[it.productId] = (qtyByProduct[it.productId] || 0) + it.qty;
    }));
    let winnerId = null, winnerQty = 0;
    draftRound.picks.forEach((id) => { if ((qtyByProduct[id] || 0) > winnerQty) { winnerQty = qtyByProduct[id]; winnerId = id; } });
    const pointsAwarded = winnerId ? Math.max(25, winnerQty * 25) : 10;
    earnPoints(pointsAwarded);
    setDraftHistory((h) => [...h, { picks: draftRound.picks, winnerId, winnerQty, pointsAwarded, resolvedAt: Date.now() }]);
    setDraftRound(null);
  };
  const createWish = (item, goal) => {
    setWishes((w) => [...w, { id: "WISH" + Math.floor(10000 + Math.random() * 89999), item, goal, current: 0 }]);
  };
  const contributeToWish = (id, amount) => {
    if (amount <= 0 || amount > points) return;
    spendPoints(amount, "wish-contribution");
    setWishes((ws) => ws.map((w) => w.id === id ? { ...w, current: w.current + amount } : w));
  };
  const dismissWish = (id) => setWishes((ws) => ws.filter((w) => w.id !== id));
  const voteBattle = (battleId, choice, winner) => {
    if (battleVotes[battleId]) return;
    setBattleVotes((v) => ({ ...v, [battleId]: choice }));
    if (choice === winner) earnPoints(2);
  };
  const claimDiscovery = (dayId) => {
    if (discoveryClaimedDays[dayId]) return;
    setDiscoveryClaimedDays((d) => ({ ...d, [dayId]: true }));
    earnPoints(10);
  };
  const postCommunityRequest = (type, text) => {
    setCommunityRequests((rs) => [{ id: "CR" + Math.floor(10000 + Math.random() * 89999), author: CURRENT_CUSTOMER_NAME, type, text, helpers: [], resolved: false, postedAt: "Just now" }, ...rs]);
  };
  const helpCommunityRequestRide = (id) => {
    setCommunityRequests((rs) => rs.map((r) => r.id === id && !r.helpers.find((h) => h.name === CURRENT_CUSTOMER_NAME) ? { ...r, helpers: [...r.helpers, { name: CURRENT_CUSTOMER_NAME, kind: "ride" }] } : r));
  };
  const helpCommunityRequestPoints = (id, amount) => {
    if (amount <= 0 || amount > points) return;
    spendPoints(amount, "community-help");
    setCommunityRequests((rs) => rs.map((r) => r.id === id && !r.helpers.find((h) => h.name === CURRENT_CUSTOMER_NAME) ? { ...r, helpers: [...r.helpers, { name: CURRENT_CUSTOMER_NAME, kind: "points", amount }] } : r));
  };
  const resolveCommunityRequest = (id, note) => {
    setCommunityRequests((rs) => rs.map((r) => r.id === id ? { ...r, resolved: { note } } : r));
  };
  const recordLoan = (direction, person, amount, interest) => {
    setLoanRecords((l) => [...l, { id: "LOAN" + Math.floor(10000 + Math.random() * 89999), direction, person, amount, interest: interest || 0, at: Date.now(), agreedAt: null, settled: false, autoCollected: false }]);
  };
  const confirmLoanAgreement = (id) => {
    setLoanRecords((l) => l.map((x) => x.id === id ? { ...x, agreedAt: Date.now() } : x));
  };
  const repayLoan = (id) => {
    setLoanRecords((l) => {
      const rec = l.find((x) => x.id === id);
      if (!rec || rec.settled) return l;
      const total = rec.amount + (rec.interest || 0);
      // SERVER-AUTHORITY: loans between users are peer-to-peer prototype
      // state today; once real, both the debt and the repayment need a real
      // ledger row and server-side settlement, not just a local points move.
      if (rec.direction === "borrowed") spendPoints(total, "loan-repayment");
      else earnPoints(total);
      return l.map((x) => x.id === id ? { ...x, settled: true } : x);
    });
  };
  const claimVendorMilestone = (vendorName, milestone) => {
    const key = `${vendorName}:${milestone}`;
    if (claimedVendorMilestones.includes(key)) return;
    setClaimedVendorMilestones((c) => [...c, key]);
    earnPoints(milestone * 10);
  };
  const claimGoodDeed = (key, points) => {
    if (claimedGoodDeeds.includes(key)) return;
    setClaimedGoodDeeds((c) => [...c, key]);
    earnPoints(points);
  };
  const claimMysteryBox = (dayId, amount) => {
    if (mysteryBoxClaimedDays[dayId]) return;
    setMysteryBoxClaimedDays((d) => ({ ...d, [dayId]: true }));
    earnPoints(amount);
  };
  // Every wallet transaction gets a real id/status/reference, not just a
  // label and amount -- doc spec: "transaction ID + type + amount + status
  // + reference + timestamp". Centralized here so all 7 places that push a
  // transaction stay consistent instead of hand-rolling the shape each time.
  const pushWalletTx = ({ type, label, amount, reference }) => {
    setWalletTx((tx) => [{ id: `TXN-${Math.floor(10000 + Math.random() * 89999)}`, type, label, amount, status: "completed", reference: reference || "--", date: "Just now" }, ...tx]);
  };
  const topUpWallet = (amount, method) => {
    setWallet((w) => w + amount);
    const label = typeof method === "string" ? "Top-up (Bank transfer)" : `Top-up (${method.brand} \u2022\u2022\u2022\u2022${method.last4})`;
    pushWalletTx({ type: "Top-up", label, amount, reference: typeof method === "string" ? "Bank transfer" : `${method.brand} \u2022\u2022\u2022\u2022${method.last4}` });
  };
  const [autoTopUp, setAutoTopUp] = useState({ enabled: false, threshold: 2000, amount: 5000 });
  // Not an actual auto-charge -- most customers here pay by bank transfer,
  // which can't be triggered automatically. So "auto top-up" really means
  // "notify me to top up": once the wallet dips below the threshold we push
  // one notification (not a repeat spam every render) suggesting an amount,
  // and reset the flag once the balance is topped back up so it can fire
  // again on the next dip.
  const [lowBalanceNotified, setLowBalanceNotified] = useState(false);
  useEffect(() => {
    if (!autoTopUp.enabled) { setLowBalanceNotified(false); return; }
    if (wallet >= autoTopUp.threshold) { setLowBalanceNotified(false); return; }
    if (lowBalanceNotified) return;
    setNotifList((n) => [{ icon: Wallet, color: "#EA580C", title: "Wallet balance low", sub: `Your balance is below ${naira(autoTopUp.threshold)} -- top up ${naira(autoTopUp.amount || 5000)} by bank transfer or card to keep ordering smoothly.`, time: "Just now", goTo: "wallet", category: "Payments" }, ...n]);
    setLowBalanceNotified(true);
  }, [wallet, autoTopUp.enabled, autoTopUp.threshold, autoTopUp.amount, lowBalanceNotified]);
  // Abandoned-cart reminder: if items sit in the cart for a while without
  // checking out, send one nudge (not a repeating spam) -- resets once the
  // cart is emptied or checked out so it can fire again on a future cart.
  const [cartReminderSent, setCartReminderSent] = useState(false);
  // Unified toast system -- one place for lightweight confirmations
  // ("Saved", "Added to cart") instead of scattering banners/pills/inline
  // text per screen. showToast(message) queues one; each clears itself
  // after ~2.5s.
  const [toasts, setToasts] = useState([]);
  const [reorderModifyOrder, setReorderModifyOrder] = useState(null);
  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  };
  useEffect(() => {
    if (cart.length === 0) { setCartReminderSent(false); return; }
    if (cartReminderSent) return;
    const t = setTimeout(() => {
      setNotifList((n) => [{ icon: ShoppingCart, color: "#7C3AED", title: "You left something in your cart", sub: `${cart.length} item${cart.length !== 1 ? "s" : ""} waiting -- open your cart to check out before it sells out.`, time: "Just now", goTo: "shop", category: "Orders" }, ...n]);
      setCartReminderSent(true);
    }, 45000);
    return () => clearTimeout(t);
  }, [cart.length, cartReminderSent]);
  const subscribeMembership = (tierKey, price) => {
    if (wallet < price) return;
    setWallet((w) => w - price);
    pushWalletTx({ type: "Membership", label: `Medra Membership -- ${MEMBERSHIP_TIERS.find((t) => t.key === tierKey)?.name}`, amount: -price, reference: tierKey });
    setMembership({ tier: tierKey, subscribedAt: Date.now() });
  };
  const cancelMembership = () => setMembership(null);
  const pauseMembership = () => {
    const now = Date.now();
    const recentPauses = pauseHistory.filter((t) => now - t < 30 * 24 * 60 * 60 * 1000);
    if (recentPauses.length >= 2) return;
    setMembership((m) => m ? { ...m, paused: true } : m);
    setPauseHistory((h) => [...h, now]);
  };
  const resumeMembership = () => setMembership((m) => m ? { ...m, paused: false } : m);
  // Free trial: first-time users only (never subscribed, never used the
  // trial before), free, Basic tier, can't be cancelled/paused once started.
  const startFreeTrial = () => {
    if (membership || trialUsed) return;
    const startedAt = Date.now();
    setMembership({ tier: "basic", subscribedAt: startedAt, isTrial: true, trialExpiresAt: computeTrialExpiry(startedAt) });
    setTrialUsed(true);
  };
  // Auto-expiry check, mirroring the same pattern used for the monthly
  // points-cap forfeiture: a periodic client-side check against a stored
  // timestamp. The trial just ends -- no charge, no conversion to paid.
  useEffect(() => {
    if (!membership?.isTrial) return;
    const check = () => {
      if (Date.now() >= membership.trialExpiresAt) setMembership(null);
    };
    const t = setInterval(check, 60000);
    check();
    return () => clearInterval(t);
  }, [membership?.isTrial, membership?.trialExpiresAt]);
  const chargeSubscription = (id) => {
    setSubscriptions((subs) => {
      const sub = subs.find((s) => s.id === id);
      if (!sub || !sub.active || Date.now() < sub.nextChargeAt) return subs;
      const lineTotal = Math.round(sub.unitPrice * sub.qty);
      if (sub.payMethod === "wallet" || sub.payMethod === "split") {
        if (wallet < lineTotal) return subs;
        setWallet((w) => w - lineTotal);
        pushWalletTx({ type: "Purchase", label: `Subscription -- ${sub.productName}`, amount: -lineTotal, reference: sub.id || sub.productName });
      }
      const id2 = "AR" + Math.floor(10000 + Math.random() * 89999);
      const placedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)];
      setOrders((o) => [...o, { id: id2, items: [{ key: sub.productId, productId: sub.productId, sellerName: sub.sellerName, sellerPrice: sub.unitPrice, qty: sub.qty }], total: lineTotal, status: "placed", progress: 0, driver, rating: 0, instructions: "", stageTimestamps: { placed: placedAt }, scheduledFor: null, paused: false }]);
      return subs.map((s) => s.id === id ? { ...s, nextChargeAt: Date.now() + 14 * 24 * 60 * 60 * 1000 } : s);
    });
  };
  const cancelSubscription = (id) => setSubscriptions((subs) => subs.map((s) => s.id === id ? { ...s, active: false } : s));
  const claimLocalChallenge = (weekId) => {
    if (localChallengeClaimedWeeks.includes(weekId)) return;
    setLocalChallengeClaimedWeeks((w) => [...w, weekId]);
    earnPoints(50);
  };
  const pickFantasyLeague = (weekId, categoryKey, correct) => {
    if (fantasyLeaguePicks[weekId]) return;
    setFantasyLeaguePicks((p) => ({ ...p, [weekId]: categoryKey }));
    if (correct) earnPoints(30);
  };

  const switchAccount = (appKey) => {
    if (appKey === "customer") return;
    window.dispatchEvent(new CustomEvent("medra:switch-app", { detail: { app: appKey } }));
    if (!window.__MEDRA_SHELL__) {
      setSwitchNotice(`In production this opens your ${appKey === "seller" ? "Seller" : "Rider"} dashboard at ${appKey}.medra.com, already signed in.`);
      setTimeout(() => setSwitchNotice(null), 3200);
    }
  };

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      setLoanRecords((recs) => recs.map((l) => {
        if (l.direction === "borrowed" && l.agreedAt && !l.settled && now - l.agreedAt >= 30 * 24 * 60 * 60 * 1000) {
          const total = l.amount + (l.interest || 0);
          // Deliberately not routed through spendPoints: auto-collection must
          // still happen even if the balance can't fully cover it (hence
          // Math.max(0, ...) instead of spendPoints' "block if insufficient"
          // guard) -- this is an existing business rule, not an oversight.
          // SERVER-AUTHORITY: this forced, unattended point removal is exactly
          // the kind of event that needs a server-side audit log entry once real.
          pointsRef.current = Math.max(0, pointsRef.current - total);
          setPoints((p) => Math.max(0, p - total));
          return { ...l, settled: true, autoCollected: true };
        }
        return l;
      }));
    };
    const t = setInterval(check, 60000);
    check();
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!cappedSinceMonth) return;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    if (cappedSinceMonth !== currentMonth && points >= POINTS_CAP) {
      // Folded Insurance into the cap mechanic: everyone automatically keeps
      // half their capped points (see the "else" branch below). Insurance no
      // longer protects from scratch -- it now upgrades that automatic 50%
      // up toward 100%, covering some or all of the other half you'd
      // otherwise lose, based on how much coverage you bought.
      const autoKept = Math.floor(points / 2);
      const otherHalf = points - autoKept;
      if (insuranceCoverage > 0) {
        const insuranceKept = Math.min(insuranceCoverage, otherHalf);
        const kept = autoKept + insuranceKept;
        // SERVER-AUTHORITY: month-end point forfeiture/insurance payout is a
        // system-driven event, not a user spend -- once real, this needs to
        // run as a server-side scheduled job against the authoritative
        // balance (with an audit log entry), not a client-side effect that
        // only fires if this browser tab happens to be open when the month rolls over.
        pointsRef.current = kept;
        setPoints(kept);
        setInsuranceCoverage(0);
        setCapToast(insuranceKept >= otherHalf
          ? `Point Insurance kicked in -- fully covered, you kept all ${kept.toLocaleString()} points instead of losing half.`
          : `Point Insurance kicked in -- you kept ${kept.toLocaleString()} points (the automatic half, plus your covered portion of the other half).`);
      } else {
        // Softened rule: forfeit half your capped points at month-end
        // instead of all of them.
        const kept = Math.floor(points / 2);
        pointsRef.current = kept;
        setPoints(kept);
        setCapToast(`Half of your ${POINTS_CAP.toLocaleString()} points at the cap went unused past the end of the month and were forfeited -- you kept ${kept.toLocaleString()}.`);
      }
      setCappedSinceMonth(null);
      setTimeout(() => setCapToast(null), 6000);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    if (usageMonthMarker !== currentMonth) {
      setPointsUsedThisMonth(0);
      setUsageMonthMarker(currentMonth);
    }
  }, []);

  useEffect(() => {
    if (!activeOrder || activeOrder.status === "delivered" || activeOrder.status === "scheduled" || activeOrder.paused || activeOrder.sharedOrder) return;
    timerRef.current = setInterval(() => {
      setOrders((os) => os.map((o) => {
        if (o.id !== activeOrderId || o.status === "delivered" || o.status === "scheduled" || o.paused || o.sharedOrder) return o;
        const next = Math.min(100, o.progress + 6);
        const stage = STAGES.slice().reverse().find((s) => next >= s.at) || STAGES[0];
        const stageTimestamps = { ...(o.stageTimestamps || {}) };
        if (stage.key !== o.status && !stageTimestamps[stage.key]) {
          stageTimestamps[stage.key] = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        if (stage.key !== o.status && active !== "track-order") {
          setStatusToast(`Order #${o.id} is now ${stage.label}`);
          setTimeout(() => setStatusToast(null), 3800);
        }
        if (stage.key === "delivered" && o.status !== "delivered") {
          setTimeout(() => setRatingPromptOrder(o.id), 600);
        }
        return { ...o, progress: next, status: stage.key, stageTimestamps };
      }));
    }, 700);
    return () => clearInterval(timerRef.current);
  }, [activeOrderId, activeOrder?.status, activeOrder?.paused, activeOrder?.sharedOrder, active]);

  // Real cross-app sync: whenever the shared order pipeline changes (an admin
  // verifies payment, a seller confirms, a rider accepts/picks up/delivers),
  // pull that real change back into this customer's own local order view.
  // This also RESTORES shared orders that the shared store still has but this
  // customer instance doesn't -- the combined-preview shell fully remounts
  // each app when you switch away and back, wiping local state, so without
  // this a customer who checks another app mid-delivery would lose track of
  // their own real order entirely.
  useEffect(() => {
    if (!sharedOrderStore) return;
    setOrders((os) => {
      const knownIds = new Set(os.map((o) => o.id));
      const restored = sharedOrderStore.orders
        .filter((s) => s.customerName === CUSTOMER.name && !knownIds.has(s.id))
        .map((s) => ({ id: s.id, items: s.items, total: s.total, status: s.stage, progress: 0, driver: null, rating: 0, instructions: s.instructions || "", stageTimestamps: { placed: new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, scheduledFor: null, paused: false, sharedOrder: true, sharedData: s }));
      const synced = os.map((o) => {
        if (!o.sharedOrder) return o;
        const shared = sharedOrderStore.orders.find((s) => s.id === o.id);
        if (!shared) return o;
        return { ...o, status: shared.stage, sharedData: shared };
      });
      return [...synced, ...restored];
    });
    if (!activeOrderId) {
      const mostRecent = [...sharedOrderStore.orders].filter((s) => s.customerName === CUSTOMER.name && s.stage !== "delivered").sort((a, b) => b.createdAt - a.createdAt)[0];
      if (mostRecent) setActiveOrderId(mostRecent.id);
    }
  }, [sharedOrderStore?.orders]);

  // Real points for transfer orders: card/wallet/split orders earn points at
  // placement time (see placeOrder below), but a transfer order's payment
  // isn't verified yet at that point, so crediting points there would reward
  // an order that might not even be real. Instead, credit them here, exactly
  // once, the moment the order is genuinely and fully delivered -- using a
  // flag stored ON the shared order itself (not local state) so switching
  // apps or screens and back can never trigger a second, duplicate credit.
  // BUG FIX: this effect used to only credit points EARNED on the purchase.
  // It never actually deducted the points the customer redeemed at checkout
  // (pointsUsed) or tipped the rider (tipPoints) for a transfer order --
  // those were captured in the order data and displayed as if spent, but
  // the balance was never touched, since placeOrder deliberately skips all
  // points side effects for the unverified transfer path (see below) and
  // nothing picked them up afterward either. Deduct both here too, at the
  // same delivered-and-not-yet-settled moment, guarded by the same
  // once-only flag.
  useEffect(() => {
    if (!sharedOrderStore) return;
    sharedOrderStore.orders.forEach((s) => {
      if (s.customerName === CUSTOMER.name && s.stage === "delivered" && !s.customerPointsCredited) {
        const membershipMultiplier = (!membership?.paused && MEMBERSHIP_TIERS.find((t) => t.key === membership?.tier)?.multiplier) || 1;
        const pointsEarned = Math.floor((s.productPayable || 0) * POINTS_EARN_RATE * membershipMultiplier);
        if (pointsEarned > 0) {
          earnPoints(pointsEarned);
          setEarnedToast(`+${pointsEarned} points earned on order #${s.id}`);
          setTimeout(() => setEarnedToast(null), 3200);
        }
        if (s.pointsUsed > 0) spendPoints(s.pointsUsed, "checkout-redemption-transfer");
        if (s.tipPoints > 0) spendPoints(s.tipPoints, "rider-tip-transfer");
        sharedOrderStore.updateOrder(s.id, { customerPointsCredited: true });
      }
    });
  }, [sharedOrderStore?.orders]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!authed) return;
    let warnTimer, logoutTimer;
    const resetTimers = () => {
      clearTimeout(warnTimer); clearTimeout(logoutTimer);
      setSessionWarning(false);
      warnTimer = setTimeout(() => setSessionWarning(true), SESSION_WARN_MS);
      logoutTimer = setTimeout(() => setAuthed(false), SESSION_WARN_MS + SESSION_GRACE_MS);
    };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimers));
    resetTimers();
    return () => { clearTimeout(warnTimer); clearTimeout(logoutTimer); events.forEach((e) => window.removeEventListener(e, resetTimers)); };
  }, [authed]);

  if (!authed && showLanding) {
    return <CustomerLandingPage onShopNow={() => setShowLanding(false)} onSignIn={() => setShowLanding(false)} />;
  }
  if (!authed && guestMode) return <GuestShopShell onLogin={() => setGuestMode(false)} />;
  if (!authed) return <LoginScreen onLogin={(mode, dob) => { setAuthed(true); if (mode === "signup") { setOnboardOpen(true); if (dob) setMyBirthday(dob.slice(5)); } else setWhatsNewOpen(true); }} onGuestBrowse={() => setGuestMode(true)} />;

  const addToCart = (listing, qty = 1) => {
    setCart((c) => {
      const ex = c.find((x) => x.key === listing.id);
      if (ex) return c.map((x) => (x.key === listing.id ? { ...x, qty: x.qty + qty } : x));
      return [...c, { key: listing.id, productId: listing.productId, sellerName: listing.vendor, sellerPrice: listing.sellerPrice, distanceKm: listing.distance * 1.60934, qty }];
    });
    setCartUpdatedAt(Date.now());
    setModalProduct(null);
    setCartOpen(true);
  };
  const updateQty = (key, qty) => {
    if (qty === 0) {
      const item = cart.find((x) => x.key === key);
      setCart((c) => c.filter((x) => x.key !== key));
      if (item) setRemovedItem(item);
    } else {
      setCart((c) => c.map((x) => (x.key === key ? { ...x, qty } : x)));
    }
  };
  const undoRemoveItem = () => { if (removedItem) { setCart((c) => [...c, removedItem]); setRemovedItem(null); } };
  const toggleWishlist = (id) => setWishlist((w) => { const n = new Set(w); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleNotifyPref = (id, key) => setNotifyPrefs((p) => ({ ...p, [id]: { ...(p[id] || { priceDrop: false, backInStock: false }), [key]: !(p[id]?.[key]) } }));
  const setAllNotifyPrefs = (ids, enabled) => setNotifyPrefs((p) => {
    const next = { ...p };
    ids.forEach((id) => { next[id] = { priceDrop: enabled, backInStock: enabled }; });
    return next;
  });
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const createGroupOrder = (name) => {
    const id = "GO" + Math.floor(10000 + Math.random() * 89999);
    const code = generateId(); // join code -- same shape as gift/coupon codes above
    setGroupOrders((g) => [...g, { id, name, code, createdAt: Date.now(), status: "open", members: [{ id: "m0", name: "You", items: [], paid: true }] }]);
    return id;
  };
  const addGroupMember = (groupId, name) => {
    setGroupOrders((gs) => gs.map((g) => g.id !== groupId ? g : { ...g, members: [...g.members, { id: "m" + g.members.length + Date.now(), name, items: [], paid: false }] }));
  };
  const addGroupItem = (groupId, memberId, name, price) => {
    setGroupOrders((gs) => gs.map((g) => g.id !== groupId ? g : { ...g, members: g.members.map((m) => m.id !== memberId ? m : { ...m, items: [...m.items, { name, price, qty: 1 }] }) }));
  };
  const removeGroupItem = (groupId, memberId, itemIdx) => {
    setGroupOrders((gs) => gs.map((g) => g.id !== groupId ? g : { ...g, members: g.members.map((m) => m.id !== memberId ? m : { ...m, items: m.items.filter((_, i) => i !== itemIdx) }) }));
  };
  const toggleGroupPaid = (groupId, memberId) => {
    setGroupOrders((gs) => gs.map((g) => g.id !== groupId ? g : { ...g, members: g.members.map((m) => m.id !== memberId ? m : { ...m, paid: !m.paid }) }));
  };
  const placeGroupOrder = (groupId) => {
    const g = groupOrders.find((x) => x.id === groupId);
    if (!g) return;
    const combinedItems = g.members.flatMap((m) => m.items.map((it) => ({ key: `${m.id}-${it.name}`, productId: null, sellerName: "Group order", sellerPrice: it.price, qty: it.qty, memberName: m.name })));
    const total = combinedItems.reduce((s, it) => s + it.sellerPrice * it.qty, 0);
    const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)];
    const id = "AR" + Math.floor(10000 + Math.random() * 89999);
    const placedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setOrders((o) => [...o, { id, items: combinedItems, total, status: "placed", progress: 0, driver, rating: 0, instructions: `Group order: ${g.name}`, stageTimestamps: { placed: placedAt }, scheduledFor: null, paused: false }]);
    setGroupOrders((gs) => gs.map((x) => x.id === groupId ? { ...x, status: "placed", orderId: id } : x));
    setActiveOrderId(id);
  };
  const placeOrder = (total, pointsUsed, instructions, scheduledFor, productPayable, newSubscriptions, payMethod, walletCovered, transferProofPhoto, tipPoints, topUpPoints, recipient) => {
    // Remember a used recipient (by name) so it can be picked from a quick
    // list next time, instead of retyping name/phone on every gift order.
    if (recipient?.name) {
      setSavedRecipients((rs) => {
        const exists = rs.some((r) => r.name === recipient.name);
        if (exists) return rs.map((r) => (r.name === recipient.name ? recipient : r));
        return [...rs, recipient].slice(-8); // cap the quick-list at 8
      });
    }
    const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)];
    const id = "AR" + Math.floor(10000 + Math.random() * 89999);
    const placedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isScheduled = !!scheduledFor;
    const isRealTransferFlow = payMethod === "transfer" && sharedOrderStore;
    if (isRealTransferFlow) {
      // Real gated flow: a transfer order does NOT go straight to "placed".
      // It sits in the shared pipeline as "verifying_payment" until an admin
      // (in the Admin app, reading the same shared store) actually verifies
      // it -- no points, no wallet/points side effects, no stage progress
      // happen until that's real and confirmed.
      sharedOrderStore.addOrder({
        id, customerName: CUSTOMER.name, items: cart, total, productPayable,
        payMethod, instructions: instructions || "", transferProofPhoto: transferProofPhoto || null,
        pointsUsed, tipPoints: tipPoints || 0, topUpPoints: topUpPoints || 0, recipient: recipient || null, newSubscriptions: newSubscriptions || [],
        stage: "verifying_payment", createdAt: Date.now(),
        riderConfirmedDelivered: false, customerConfirmedDelivered: false,
        confirmedSellers: [],
      });
      setOrders((o) => [...o, { id, items: cart, total, tipPoints: tipPoints || 0, recipient: recipient || null, status: "verifying_payment", progress: 0, driver, rating: 0, instructions: instructions || "", stageTimestamps: { placed: placedAt }, scheduledFor: scheduledFor || null, paused: false, sharedOrder: true }]);
      setActiveOrderId(id);
      if (activeDiscount) setActiveDiscount(null);
      setCart([]);
      setCartUpdatedAt(null);
      setCartOpen(false);
      setActive("track-order");
      return;
    }
    // BUG FIX: the order used to be created with the *requested* tipPoints/
    // pointsUsed straight from checkout, and the actual spendPoints() calls
    // happened afterward as a separate step whose result was never checked.
    // If a spend ever failed (insufficient balance), the order would still
    // show -- and the rider would still be credited for, via the payout
    // conversion -- a tip or discount that was never actually charged to the
    // customer. Spend first, capture what actually went through, and only
    // record those confirmed amounts on the order itself.
    // SERVER-AUTHORITY: this checkout points-redemption, and the order total
    // it's discounting, must both be re-verified server-side at checkout --
    // the frontend total/pointsUsed here should never be trusted as final.
    const redemptionSpent = pointsUsed > 0 && spendPoints(pointsUsed, "checkout-redemption") ? pointsUsed : 0;
    if (redemptionSpent > 0) { setCappedSinceMonth(null); setPointsUsedThisMonth((u) => u + redemptionSpent); }
    // Rider tip, paid in points -- deducted the same way as any other points
    // spend, separate from the redemption above.
    const tipSpent = tipPoints > 0 && spendPoints(tipPoints, "rider-tip") ? tipPoints : 0;
    setOrders((o) => [...o, { id, items: cart, total, tipPoints: tipSpent, recipient: recipient || null, status: isScheduled ? "scheduled" : "placed", progress: 0, driver, rating: 0, instructions: instructions || "", stageTimestamps: { placed: placedAt }, scheduledFor: scheduledFor || null, paused: false }]);
    setActiveOrderId(id);
    if (activeDiscount) setActiveDiscount(null);
    if (newSubscriptions && newSubscriptions.length > 0) {
      setSubscriptions((subs) => [
        ...subs,
        ...newSubscriptions.map((s) => ({ id: "SUB" + Math.floor(10000 + Math.random() * 89999), ...s, nextChargeAt: Date.now() + 14 * 24 * 60 * 60 * 1000, active: true })),
      ]);
    }
    // Point top-up bought during checkout -- credited the same way as any
    // other points earn (respects the cap), separate from the redemption above.
    if (topUpPoints > 0) earnPoints(topUpPoints);
    if (walletCovered > 0) {
      setWallet((w) => w - walletCovered);
      pushWalletTx({ type: "Purchase", label: `Order ${id} (${payMethod === "split" ? "Wallet + Card" : "Wallet"})`, amount: -walletCovered, reference: id });
    }
    const membershipMultiplier = (!membership?.paused && MEMBERSHIP_TIERS.find((t) => t.key === membership?.tier)?.multiplier) || 1;
    const pointsEarned = Math.floor((productPayable || 0) * POINTS_EARN_RATE * membershipMultiplier);
    const basePoints = Math.floor((productPayable || 0) * POINTS_EARN_RATE);
    const secretCategory = secretBonusCategoryForDate(new Date());
    const hitSecretCategory = cart.some((it) => PRODUCTS.find((p) => p.id === it.productId)?.category === secretCategory);
    const secretBonus = hitSecretCategory ? Math.max(20, basePoints) : 0;
    if (pointsEarned > 0 || secretBonus > 0) {
      earnPoints(pointsEarned + secretBonus);
      discoverTreasureCode("completing your order");
      setEarnedToast(secretBonus > 0 ? `+${pointsEarned + secretBonus} points earned -- you hit today's secret bonus category for double points!` : `+${pointsEarned} points earned on this order`);
      setLastPointsBreakdown({ base: basePoints, membershipMultiplier, membershipBonus: pointsEarned - basePoints, hiddenBonus: secretBonus, total: pointsEarned + secretBonus });
      setTimeout(() => setEarnedToast(null), (membershipMultiplier > 1 || secretBonus > 0) ? 5000 : 3200);
    }
    setCart([]);
    setCartUpdatedAt(null);
    setCartOpen(false);
    setActive("track-order");
    // Milestone bonus: every 3rd order this week earns a small point bonus.
    setOrders((os) => {
      const countSoFar = os.length; // includes the order just added
      if (countSoFar > 0 && countSoFar % 3 === 0) {
        earnPoints(15);
        setMilestoneToast(`Milestone! That's ${countSoFar} orders this week -- +15 bonus points.`);
        setTimeout(() => setMilestoneToast(null), 3600);
      }
      return os;
    });
  };
  const cancelOrder = (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
    setCancelUndo({ orderId: id, prevStatus: order.status });
  };
  const undoCancelOrder = () => {
    if (!cancelUndo) return;
    setOrders((os) => os.map((o) => (o.id === cancelUndo.orderId ? { ...o, status: cancelUndo.prevStatus } : o)));
    setCancelUndo(null);
  };
  const editOrder = (order) => {
    setCart(order.items || []);
    setOrders((os) => os.filter((o) => o.id !== order.id));
    setActiveOrderId(null);
    setActive("checkout");
  };
  const reorder = (order) => {
    const items = (order.items || RECENT_ORDERS.find((o) => o.id === order.id)?.items || []);
    if (items.length > 0) {
      setCart(items.map((i) => ({ ...i, key: `${i.productId}-${i.sellerId}-${Date.now()}` })));
    } else {
      // Older mock orders don't carry line items -- reorder the closest matching product as a fallback.
      const p = PRODUCTS[0];
      const sellers = getSellersForProduct(p);
      addToCart(sellers[0], 1);
    }
    setReorderConfirm(true);
    setActive("checkout");
  };
  const rateOrder = (n) => { setOrders((os) => os.map((o) => (o.id === activeOrderId ? { ...o, rating: n } : o))); discoverTreasureCode("rating your driver"); };
  const rateOrderById = (id, n) => { setOrders((os) => os.map((o) => (o.id === id ? { ...o, rating: n } : o))); setRatingPromptOrder(null); discoverTreasureCode("rating your driver"); };
  const togglePause = (id) => setOrders((os) => os.map((o) => (o.id === id ? { ...o, paused: !o.paused } : o)));
  const confirmDelivery = (id) => {
    if (!sharedOrderStore) return;
    sharedOrderStore.updateOrder(id, (cur) => ({
      customerConfirmedDelivered: true,
      stage: cur.riderConfirmedDelivered ? "delivered" : "delivered_awaiting_customer_confirm",
    }));
  };
  // Post-delivery tip, same rule as the checkout tip: paid in points, not
  // naira, so it's never a second bank transfer for someone who already
  // paid by transfer. Converted to naira for the rider at payout. Adds to
  // (rather than replaces) any tip already set at checkout, and updates the
  // shared order record too so the rider side picks it up.
  const tipDriver = (amt) => {
    if (!spendPoints(amt, "post-delivery-tip")) return;
    setOrders((os) => os.map((o) => (o.id === activeOrderId ? { ...o, tipPoints: (o.tipPoints || 0) + amt } : o)));
    if (sharedOrderStore) sharedOrderStore.updateOrder(activeOrderId, (cur) => ({ tipPoints: (cur.tipPoints || 0) + amt }));
  };

  const convertToPoints = (amount) => {
    if (amount <= 0) return;
    setWallet((w) => w - amount);
    earnPoints(amount);
  };
  const completeGame = (key) => {
    if (gamesDone.has(key)) return;
    setGamesDone((g) => new Set(g).add(key));
    earnPoints(1);
  };
  const wishCelebrant = () => {
    if (celebrantWished) return;
    setCelebrantWished(true);
    earnPoints(2);
  };
  const unlockTheme = (key) => {
    const theme = THEMES.find((t) => t.key === key);
    if (!theme || points < theme.cost || unlockedThemes.has(key)) return;
    spendPoints(theme.cost, "theme-unlock");
    setUnlockedThemes((u) => new Set(u).add(key));
    setActiveTheme(key);
  };
  const applyTheme = (key) => { if (unlockedThemes.has(key)) setActiveTheme(key); };
  const replayTour = () => setOnboardOpen(true);
  // Client-side CSV export -- builds the file in-browser and triggers a
  // download, no server round-trip needed. Two sections: order history and
  // points/wallet transaction history.
  const exportActivity = () => {
    const escapeCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const orderRows = orders.map((o) => [o.id, o.status, o.total, (o.items || []).length, o.stageTimestamps?.placed || ""]);
    const txRows = walletTx.map((t) => [t.id || "", t.type || "", t.label, t.amount, t.status || "", t.reference || "", t.date]);
    const lines = [
      "Orders",
      ["Order ID", "Status", "Total (NGN)", "Item count", "Placed at"].map(escapeCsv).join(","),
      ...orderRows.map((r) => r.map(escapeCsv).join(",")),
      "",
      "Wallet Transactions",
      ["Transaction ID", "Type", "Label", "Amount (NGN)", "Status", "Reference", "Date"].map(escapeCsv).join(","),
      ...txRows.map((r) => r.map(escapeCsv).join(",")),
      "",
      "Points Summary",
      ["Current points", "Lifetime points earned"].map(escapeCsv).join(","),
      [points, lifetimePoints].map(escapeCsv).join(","),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medra-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const activeLabel = NAV_ITEMS.find((i) => i.key === active)?.label || "Dashboard";
  const theme = THEMES.find((t) => t.key === activeTheme) || THEMES[0];

  const SCREENS = {
    dashboard: <DashboardScreen loading={loading} wallet={wallet} points={points} lifetimePoints={lifetimePoints} onOpenProduct={openProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} activeOrder={activeOrder} onTrack={() => setActive("track-order")} onSearch={(q) => { setShopQuery(q); setActive("shop"); }} onNavigate={setActive} recentlyViewed={recentlyViewed} orders={orders} fanClubs={fanClubs} cart={cart} cartUpdatedAt={cartUpdatedAt} onOpenCart={() => setCartOpen(true)} onTrackOrderId={(id) => { setActiveOrderId(id); setActive("track-order"); }} dismissedTipReminders={dismissedTipReminders} onDismissTipReminder={(id) => setDismissedTipReminders((s) => new Set(s).add(id))} />,
    "my-orders": <OrdersScreen orders={orders} onReorder={reorder} onReorderModify={(o) => setReorderModifyOrder(o)} onCancel={(id) => confirmAction({ title: "Cancel this order?", message: "The seller will be notified and the order will stop.", confirmLabel: "Cancel order" }, () => cancelOrder(id))} returnRequests={returnRequests} />,
    "track-order": <TrackingScreen order={activeOrder} driver={activeOrder?.driver} onRate={rateOrder} onCancel={() => activeOrder && confirmAction({ title: "Cancel this order?", message: "The seller will be notified and the order will stop.", confirmLabel: "Cancel order" }, () => cancelOrder(activeOrder.id))} onTip={tipDriver} onEdit={() => activeOrder && editOrder(activeOrder)} onTogglePause={togglePause} onReportSubmitted={(report) => { setGiveawayDisqualified(true); if (activeOrder) setReturnRequests((r) => [{ id: "RT" + Math.floor(1000 + Math.random() * 8999), orderId: activeOrder.id, ...report, status: "under review", submittedAt: new Date().toLocaleDateString() }, ...r]); }} onConfirmDelivery={confirmDelivery} points={points} onGetHelp={(id) => { setSupportPrefillOrderId(id); setActive("support"); }} />,
    checkout: <CheckoutScreen cart={cart} points={points} wallet={wallet} autoConfirm={reorderConfirm} onAutoConfirmed={() => setReorderConfirm(false)} onPlace={placeOrder} onAddToCart={(p) => addToCart(getSellersForProduct(p)[0], 1)} savedPayMethod={savedPayMethod} onSavePayMethod={setSavedPayMethod} pointsRemainingThisMonth={Math.max(0, POINTS_MONTHLY_USAGE_CAP - pointsUsedThisMonth)} activeDiscount={activeDiscount} savedRecipients={savedRecipients} isOffline={isOffline} />,
    wishlist: <WishlistScreen wishlist={wishlist} onOpenProduct={openProduct} toggleWishlist={toggleWishlist} notifyPrefs={notifyPrefs} toggleNotifyPref={toggleNotifyPref} setAllNotifyPrefs={setAllNotifyPrefs} onBrowse={() => setActive("shop")} onAddAllToCart={() => { const items = PRODUCTS.filter((p) => wishlist.has(p.id)); items.forEach((p) => addToCart(getSellersForProduct(p)[0], 1)); showToast(`${items.length} item${items.length !== 1 ? "s" : ""} added to cart`); }} />,
    "gift-guide": <GiftGuideScreen onOpenProduct={openProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} />,
    "health-home": <HealthcareHomeScreen onNavigate={setActive} appointments={healthAppointments} telehealthPlan={telehealthPlan} />,
    "symptom-checker": <SymptomCheckerScreen onEmergency={() => setActive("health-emergency")} onNonEmergency={() => setActive("health-provider-search")} onLogCheck={(h) => setSymptomHistory((s) => [h, ...s])} history={symptomHistory} />,
    "health-emergency": <EmergencyCareScreen />,
    "health-provider-search": <ProviderMarketplaceScreen onOpenProvider={(id) => { setActiveProviderId(id); setActive("health-provider-profile"); }} />,
    "health-provider-profile": <ProviderProfileScreen providerId={activeProviderId} onBack={() => setActive("health-provider-search")} onBookAppointment={(id) => { setActiveProviderId(id); setActive("health-book-appointment"); }} />,
    "health-book-appointment": <BookAppointmentScreen providerId={activeProviderId} onBack={() => setActive("health-appointments")} onConfirmed={bookHealthAppointment} telehealthPlan={telehealthPlan} onSubscribePlan={subscribeTelehealthPlan} points={points} spendPoints={spendPoints} wallet={wallet} />,
    "health-appointments": <MyAppointmentsScreen appointments={healthAppointments} onFindProvider={() => setActive("health-provider-search")} onStartConsultation={(a) => { setActiveHealthAppointment(a); setActive("health-consultation"); }} onReschedule={rescheduleHealthAppointment} onCancel={cancelHealthAppointment} />,
    "health-consultation": <ConsultationRoomScreen appointment={activeHealthAppointment} onEnd={() => { if (activeHealthAppointment) completeHealthAppointment(activeHealthAppointment.id); setActive("health-appointments"); }} />,
    "health-prescriptions": <HealthPrescriptionsScreen prescriptions={healthPrescriptions} onAddPrescription={(rx) => setHealthPrescriptions((p) => [rx, ...p])} />,
    "health-documents": <HealthDocumentsScreen documents={healthDocuments} onAddDocument={(d) => setHealthDocuments((docs) => [d, ...docs])} />,
    "health-messages": <HealthMessagesScreen providers={MOCK_PROVIDERS} conversations={healthConversations} onSend={sendHealthMessage} getMessageCost={getHealthMessageCost} points={points} />,
    "health-provider-portal": <ProviderPortalScreen providerId={MOCK_PROVIDERS[0].id} appointments={healthAppointments} onAccept={acceptHealthAppointment} onDecline={declineHealthAppointment} conversations={healthConversations} onSend={sendHealthMessage} onCreatePrescription={createHealthPrescription} telehealthEarnings={healthAppointments.filter((a) => a.providerId === MOCK_PROVIDERS[0].id && a.status === "completed").reduce((s, a) => s + (a.providerNet || 0), 0)} />,
    "care-package": <CarePackageScreen onAddAll={(items) => items.forEach((p) => addToCart(getSellersForProduct(p)[0], 1))} />,
    "meal-planner": <MealPlannerScreen onAddAll={(items) => {
      const counts = new Map();
      items.forEach((p) => counts.set(p.id, (counts.get(p.id) || 0) + 1));
      counts.forEach((qty, id) => addToCart(getSellersForProduct(productById(id))[0], qty));
      showToast("Grocery list added to cart");
    }} />,
    wallet: <WalletScreen wallet={wallet} points={points} onConvert={convertToPoints} cards={cards} walletTx={walletTx} onTopUp={topUpWallet} autoTopUp={autoTopUp} setAutoTopUp={setAutoTopUp} />,
    membership: <MembershipScreen wallet={wallet} membership={membership} onSubscribe={subscribeMembership} onCancel={cancelMembership} onPause={pauseMembership} onResume={resumeMembership} orders={orders} pauseHistory={pauseHistory} trialUsed={trialUsed} onStartTrial={startFreeTrial} />,
    activity: <ActivityFeedScreen orders={orders} claimedBadges={claimedBadges} membership={membership} donations={donations} giftCards={giftCards} sponsorshipsGiven={sponsorshipsGiven} />,
    streak: <StreakCalendarScreen orders={orders} communityMessagesSent={communityMessagesSent} />,
    missions: <MissionsOverviewScreen onNavigate={setActive} missionClaimed={missionClaimed} myBirthdayClaimed={myBirthdayClaimed} claimedAnniversaries={claimedAnniversaries} myBirthday={myBirthday} surveyDone={surveyDone} flashAvailable={flashAvailable} flashClaimed={flashClaimed} creatorClaimed={creatorClaimed} showCreatorProgram={showCreatorProgram} claimedBadges={claimedBadges} localChallengeClaimedWeeks={localChallengeClaimedWeeks} leaderboardClaimedMonth={leaderboardClaimedMonth} />,
    rewards: <RewardsScreen points={points} lifetimePoints={lifetimePoints} gamesDone={gamesDone} onGameComplete={completeGame} celebrantWished={celebrantWished} onWishCelebrant={wishCelebrant} showMyPhoto={showMyPhoto} pointsUsedThisMonth={pointsUsedThisMonth} earnPoints={earnPoints} spendPoints={spendPoints} orders={orders} claimedBadges={claimedBadges} setClaimedBadges={setClaimedBadges} myBirthdayClaimed={myBirthdayClaimed} setMyBirthdayClaimed={setMyBirthdayClaimed} myBirthday={myBirthday} claimedAnniversaries={claimedAnniversaries} setClaimedAnniversaries={setClaimedAnniversaries} surveyDone={surveyDone} setSurveyDone={setSurveyDone} flashAvailable={flashAvailable} setFlashAvailable={setFlashAvailable} flashClaimed={flashClaimed} setFlashClaimed={setFlashClaimed} isCreator={isCreator} setIsCreator={setIsCreator} creatorClaimed={creatorClaimed} setCreatorClaimed={setCreatorClaimed} lastSpinAt={lastSpinAt} setLastSpinAt={setLastSpinAt} activeDiscount={activeDiscount} setActiveDiscount={setActiveDiscount} duelResult={duelResult} setDuelResult={setDuelResult} duelPlaying={duelPlaying} setDuelPlaying={setDuelPlaying} insuranceCoverage={insuranceCoverage} setInsuranceCoverage={setInsuranceCoverage} setPoints={setPoints} missionClaimed={missionClaimed} setMissionClaimed={setMissionClaimed} challengeLevel={challengeLevel} setChallengeLevel={setChallengeLevel} challengeBaseline={challengeBaseline} setChallengeBaseline={setChallengeBaseline} communityPool={communityPool} setCommunityPool={setCommunityPool} sponsorshipsGiven={sponsorshipsGiven} setSponsorshipsGiven={setSponsorshipsGiven} loanRecords={loanRecords} recordLoan={recordLoan} confirmLoanAgreement={confirmLoanAgreement} repayLoan={repayLoan} auctionBids={auctionBids} setAuctionBids={setAuctionBids} auctionClosed={auctionClosed} setAuctionClosed={setAuctionClosed} auctionWon={auctionWon} setAuctionWon={setAuctionWon} donationCount={donations.length} communityMessagesSent={communityMessagesSent} referrals={referrals} benefactorFund={benefactorFund} setBenefactorFund={setBenefactorFund} carePoolSignedUp={carePoolSignedUp} setCarePoolSignedUp={setCarePoolSignedUp} lastCarePoolDrawAt={lastCarePoolDrawAt} setLastCarePoolDrawAt={setLastCarePoolDrawAt} weeklyBenefactorClaims={weeklyBenefactorClaims} setWeeklyBenefactorClaims={setWeeklyBenefactorClaims} membership={membership} localChallengeClaimedWeeks={localChallengeClaimedWeeks} onClaimLocalChallenge={claimLocalChallenge} duelWins={duelWins} setDuelWins={setDuelWins} weeklyLotteryEntries={weeklyLotteryEntries} showCreatorProgram={showCreatorProgram} leaderboardAnon={leaderboardAnon} leaderboardClaimedMonth={leaderboardClaimedMonth} setLeaderboardClaimedMonth={setLeaderboardClaimedMonth} />,
    themes: <ThemesScreen activeTheme={activeTheme} unlockedThemes={unlockedThemes} points={points} onUnlock={unlockTheme} onApply={applyTheme} membership={membership} />,
    refer: <ReferScreen referrals={referrals} setReferrals={setReferrals} />,
    "give-back": <GiveBackScreen points={points} giftCards={giftCards} onSendGift={sendGift} donations={donations} onDonate={donate} onRedeem={redeemGift} />,
    "product-drafts": <ProductDraftsScreen draftRound={draftRound} draftHistory={draftHistory} onSubmit={submitDraft} onResolve={resolveDraft} />,
    "wish-goals": <WishListScreen points={points} wishes={wishes} onCreateWish={createWish} onContribute={contributeToWish} onDismiss={dismissWish} />,
    "product-battles": <ProductBattlesScreen battleVotes={battleVotes} onVote={voteBattle} />,
    "daily-discovery": <DailyDiscoveryScreen claimedDays={discoveryClaimedDays} onClaim={claimDiscovery} onView={openProduct} orders={orders} />,
    reputation: <ReputationScoreScreen orders={orders} donations={donations} giftCards={giftCards} referrals={referrals} />,
    "community-requests": <CommunityRequestsScreen requests={communityRequests} onPost={postCommunityRequest} onHelpRide={helpCommunityRequestRide} onHelpPoints={helpCommunityRequestPoints} onResolve={resolveCommunityRequest} points={points} />,
    "adopt-vendor": <VendorSupportScreen orders={orders} adoptedVendors={adoptedVendors} onAdopt={(name) => setAdoptedVendors((v) => v.includes(name) ? v : [...v, name])} onUnadopt={(name) => setAdoptedVendors((v) => v.filter((x) => x !== name))} claimedMilestones={claimedVendorMilestones} onClaimMilestone={claimVendorMilestone} fanClubs={fanClubs} setFanClubs={setFanClubs} />,
    "good-deeds": <GoodDeedChallengesScreen helpedCount={communityRequests.filter((r) => r.helpers.includes(CURRENT_CUSTOMER_NAME)).length} reviewCount={orders.filter((o) => o.rating > 0).length} donationCount={donations.length} claimed={claimedGoodDeeds} onClaim={claimGoodDeed} />,
    "mystery-box": <DailyMysteryBoxScreen claimedDays={mysteryBoxClaimedDays} onClaim={claimMysteryBox} />,
    "cause-of-month": <CauseOfTheMonthScreen points={points} donations={donations} onDonate={donate} />,
    "fantasy-league": <FantasyLeagueScreen picks={fantasyLeaguePicks} onPick={pickFantasyLeague} />,
    "group-orders": <GroupOrdersScreen groupOrders={groupOrders} onCreate={createGroupOrder} onAddMember={addGroupMember} onAddItem={addGroupItem} onRemoveItem={removeGroupItem} onTogglePaid={toggleGroupPaid} onPlace={placeGroupOrder} />,
    messages: <MessagesScreen />,
    community: <CommunityScreen onMessageSent={() => setCommunityMessagesSent((c) => c + 1)} lifetimePoints={lifetimePoints} />,
    "treasure-hunt": <TreasureHuntScreen foundCount={foundCodes.size} huntStartDate={huntStartDate} />,
    giveaway: <GiveawayScreen deliveredCount={orders.filter((o) => o.status === "delivered").length} disqualified={giveawayDisqualified} dailyPick={dailyGiveawayPick} onPick={(id, date) => setDailyGiveawayPick({ date, name: GIVEAWAY_PRODUCTS.find((p) => p.id === id)?.name })} />,
    lottery: <LotteryScreen points={points} onEnter={enterLottery} entriesToday={lotteryEntryDay === new Date().toDateString() ? lotteryEntriesToday : 0} weeklyEntries={weeklyLotteryEntries} extraEntries={boughtLotteryEntries} onBuyExtraEntry={buyExtraLotteryEntry} membership={membership} lastMembershipLotteryBonusMonth={lastMembershipLotteryBonusMonth} onClaimMemberBonus={claimMemberLotteryBonus} />,
    "ai-assistant": <AIAssistantScreen activeOrder={activeOrder} orders={orders} points={points} onNavigate={setActive} />,
    addresses: <AddressesScreen onToast={showToast} />,
    "payment-methods": <PaymentMethodsScreen cards={cards} setCards={setCards} />,
    subscriptions: <SubscriptionsScreen subscriptions={subscriptions} wallet={wallet} onCharge={chargeSubscription} onCancel={(id) => confirmAction({ title: "Cancel this subscription?", message: "Future auto-reorders will stop.", confirmLabel: "Cancel subscription" }, () => cancelSubscription(id))} onPause={(id) => setSubscriptions((s) => s.map((x) => x.id === id ? { ...x, paused: true } : x))} onResume={(id) => setSubscriptions((s) => s.map((x) => x.id === id ? { ...x, paused: false } : x))} onPauseAll={() => { setSubscriptions((s) => s.map((x) => x.active ? { ...x, paused: true } : x)); showToast("All subscriptions paused"); }} onResumeAll={() => { setSubscriptions((s) => s.map((x) => x.active ? { ...x, paused: false } : x)); showToast("All subscriptions resumed"); }} />,
    settings: <SettingsScreen onOpenThemes={() => setActive("themes")} showMyPhoto={showMyPhoto} setShowMyPhoto={setShowMyPhoto} onReplayTour={replayTour} onApply={(role) => { setApplyRole(role); setActive("apply"); }} onOpenLegal={(doc) => { setLegalDoc(doc); setActive("legal"); }} textSize={textSize} setTextSize={setTextSize} darkMode={darkMode} setDarkMode={setDarkMode} darkModeAuto={darkModeAuto} setDarkModeAuto={setDarkModeAuto} showCreatorProgram={showCreatorProgram} setShowCreatorProgram={setShowCreatorProgram} leaderboardAnon={leaderboardAnon} setLeaderboardAnon={setLeaderboardAnon} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} onExportActivity={exportActivity} unitPref={unitPref} setUnitPref={setUnitPref} onOpenNotifications={() => setActive("notifications")} />,
    notifications: <NotificationsCenterScreen notifList={notifList} categoryPrefs={notifCategoryPrefs} setCategoryPrefs={setNotifCategoryPrefs} onOpen={setActive} pushPermission={pushPermission} onRequestPush={() => setPushPromptOpen(true)} />,
    "account-center": <AccountCenterScreen onNavigate={setActive} />,
    "favorite-stores": <FavoriteStoresScreen favoriteStores={favoriteStores} onOpenStore={(name) => setOpenStore(SAVED_STORES.find((s) => s.name === name) || { name, category: "", rating: 4.5 })} onToggleFavorite={toggleFavoriteStore} notifyStores={notifyStores} onToggleNotify={toggleNotifyStore} />,
    "changelog-customer": <ChangelogScreen />,
    "delivery-photos": <DeliveryPhotoGalleryScreen orders={orders} />,
    apply: <ApplyScreen role={applyRole} onDone={() => setActive("settings")} />,
    legal: <LegalScreen doc={legalDoc} />,
    support: <SupportScreen membership={membership} orders={orders} prefilledOrderId={supportPrefillOrderId} onConsumePrefill={() => setSupportPrefillOrderId(null)} />,
    about: <AboutScreen onOpenLegal={(doc) => { setLegalDoc(doc); setActive("legal"); }} />,
    household: <HouseholdScreen orders={orders} onToggleShareOrder={(id) => setOrders((os) => os.map((o) => o.id === id ? { ...o, sharedWithHousehold: !o.sharedWithHousehold } : o))} />,
    shop: <ShopScreen initialQuery={shopQuery} onOpenProduct={openProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} orders={orders} onAddToCart={(p) => addToCart(getSellersForProduct(p)[0], 1)} />,
  };

  return (
    <div className={`medra-root ${darkMode ? "dark" : ""} ${reduceMotion ? "reduce-motion" : ""}`} style={{ "--purple": theme.accent, "--purple-light": theme.accentLight, zoom: textSize === "large" ? 1.15 : 1 }}>
      <ConfirmHost />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {isOffline && (
        <div style={{ background: "#7C2D12", color: "#fff", textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "6px 10px" }}>
          You're offline -- browsing your cart and saved items still works, but checkout and live updates are paused until you're back online.
        </div>
      )}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: "calc(20px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", zIndex: 999, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", maxWidth: "calc(100vw - 32px)" }}>
          {toasts.map((t) => (
            <div key={t.id} className="enter" style={{ background: "#0F172A", color: "#fff", padding: "9px 16px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, boxShadow: "0 10px 24px -8px rgba(0,0,0,0.35)" }}>
              <CircleCheck size={13} style={{ verticalAlign: "middle", marginRight: 6, color: "#4ADE80" }} />{t.message}
            </div>
          ))}
        </div>
      )}
      {reorderModifyOrder && (
        <ReorderModifyModal
          order={reorderModifyOrder}
          onClose={() => setReorderModifyOrder(null)}
          onConfirm={(items) => {
            items.forEach((i) => { const sellers = getSellersForProduct(productById(i.productId)); if (sellers[0]) addToCart(sellers[0], i.qty); });
            showToast(`${items.reduce((s, i) => s + i.qty, 0)} item${items.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""} added to cart`);
            setReorderModifyOrder(null);
          }}
        />
      )}
      {onboardOpen && <OnboardingModal onClose={() => { setOnboardOpen(false); if (pushPermission === null) setPushPromptOpen(true); }} />}
      {whatsNewOpen && <WhatsNewModal onClose={() => { setWhatsNewOpen(false); if (pushPermission === null) setPushPromptOpen(true); }} />}
      {pushPromptOpen && <PushPermissionModal onChoice={(granted) => { setPushPermission(granted ? "granted" : "denied"); setPushPromptOpen(false); }} />}
      {sessionWarning && (
        <div className="modal-backdrop">
          <div className="confirm-modal enter" style={{ textAlign: "center" }}>
            <Clock size={26} color="#B45309" />
            <div className="card-name" style={{ fontSize: 16, margin: "10px 0 6px" }}>Are you still there?</div>
            <p className="muted">You've been inactive for a while -- we'll sign you out soon to keep your account safe.</p>
            <button className="primary-btn-sm wide" style={{ marginTop: 12 }} onClick={() => setSessionWarning(false)}>I'm still here</button>
          </div>
        </div>
      )}
      {cancelUndo && <UndoToast message="Order cancelled" onUndo={undoCancelOrder} onExpire={() => setCancelUndo(null)} />}
      {removedItem && <UndoToast message={`Removed ${productById(removedItem.productId)?.name || "item"}`} onUndo={undoRemoveItem} onExpire={() => setRemovedItem(null)} />}
      {switchNotice && <div className="switch-toast"><ShieldCheck size={14} /> {switchNotice}</div>}
      {statusToast && (
        <button className="switch-toast status-toast" onClick={() => { setActive("track-order"); setStatusToast(null); }}>
          {pushPermission === "granted" ? <Bell size={14} /> : <Truck size={14} />}
          {pushPermission === "granted" && <span className="muted small" style={{ marginRight: 4 }}>Push:</span>}
          {statusToast} -- tap to track
        </button>
      )}
      {ratingPromptOrder && <RatingPromptModal order={orders.find((o) => o.id === ratingPromptOrder)} onRate={rateOrderById} onClose={() => setRatingPromptOrder(null)} />}
      <div className="desk-shell">
        <div className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-head"><Logo /></div>
          <nav className="sidebar-nav" onClick={(e) => { const btn = e.target.closest("button"); if (btn && !btn.classList.contains("group-toggle")) setMobileNavOpen(false); }}>
            <button className={`side-btn ${active === "dashboard" ? "active" : ""}`} onClick={() => { setActive("dashboard"); setMobileNavOpen(false); }}><LayoutDashboard size={16} /> Dashboard</button>
            {(() => {
              const GROUPS = {
                rewards: { label: "\ud83c\udf81 Rewards", icon: Award, open: rewardsGroupOpen, setOpen: setRewardsGroupOpen, insertBefore: "product-drafts" },
                social: { label: "Refer & Community", icon: Users, open: socialGroupOpen, setOpen: setSocialGroupOpen, insertBefore: "product-drafts" },
                giving: { label: "Give Back", icon: Heart, open: givingGroupOpen, setOpen: setGivingGroupOpen, insertBefore: "adopt-vendor" },
                account: { label: "Account & Settings", icon: Settings, open: accountGroupOpen, setOpen: setAccountGroupOpen, insertBefore: null },
                health: { label: "Healthcare", icon: HeartPulse, open: healthGroupOpen, setOpen: setHealthGroupOpen, insertBefore: "wallet" },
                preview: { label: "Preview / Coming Soon", icon: Stethoscope, open: previewGroupOpen, setOpen: setPreviewGroupOpen, insertBefore: "wallet" },
              };
              const otherItems = NAV_ITEMS.filter((i) => !i.group);
              const rendered = [];
              const insertedGroups = new Set();
              const renderGroupHeader = (gkey, g) => {
                const groupItems = NAV_ITEMS.filter((i) => i.group === gkey);
                const groupActive = groupItems.some((i) => i.key === active);
                rendered.push(
                  <div key={`${gkey}-group`}>
                    <button className={`side-btn group-toggle ${groupActive ? "active" : ""}`} onClick={() => g.setOpen((o) => !o)}>
                      <g.icon size={16} /> {g.label} {gkey === "rewards" && groupActive && <PointsBadge points={points} />}
                      <ChevronDown size={13} style={{ marginLeft: "auto", transform: g.open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </button>
                    {(g.open || groupActive) && (
                      <div style={{ paddingLeft: 14 }}>
                        {groupItems.map((gi) => (
                          <button key={gi.key} className={`side-btn ${active === gi.key ? "active" : ""}`} style={{ fontSize: 12 }} onClick={() => setActive(gi.key)}>
                            <gi.icon size={14} /> {gi.label}
                            {gi.note && <span className="muted small" style={{ marginLeft: "auto", fontSize: 10 }}>{gi.note}</span>}
                            {gi.key === "messages" && <span className="side-badge">2</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
                insertedGroups.add(gkey);
              };
              otherItems.forEach((item) => {
                Object.entries(GROUPS).forEach(([gkey, g]) => {
                  if (insertedGroups.has(gkey) || item.key !== g.insertBefore) return;
                  renderGroupHeader(gkey, g);
                });
                rendered.push(
                  <button key={item.key} className={`side-btn ${active === item.key ? "active" : ""}`} onClick={() => setActive(item.key)}>
                    <item.icon size={16} /> {item.label}
                    {item.key === "messages" && <span className="side-badge">2</span>}
                  </button>
                );
              });
              // Any group without a matching ungrouped anchor (e.g. "account",
              // which has nothing ungrouped left after it) is appended at the
              // very end instead of being silently dropped.
              Object.entries(GROUPS).forEach(([gkey, g]) => {
                if (!insertedGroups.has(gkey)) renderGroupHeader(gkey, g);
              });
              return rendered;
            })()}
          </nav>
          <button className="side-btn logout" onClick={() => setAuthed(false)}><LogOut size={16} /> Logout</button>
        </div>
        <div className={`sidebar-scrim ${mobileNavOpen ? "show" : ""}`} onClick={() => setMobileNavOpen(false)} />

        <div className="main" id="main-content">
          <div className="topbar-cu">
            <button className="hamburger-btn" onClick={() => setMobileNavOpen(true)}><Menu size={18} /></button>
            <div className="search-wrap-cu" onClick={() => setUniversalSearchOpen(true)}><Search size={15} /><input placeholder="Search products, orders, and help..." readOnly /></div>
            {universalSearchOpen && <UniversalSearch query={universalSearchQuery} setQuery={setUniversalSearchQuery} onClose={() => { setUniversalSearchOpen(false); setUniversalSearchQuery(""); }} onOpenProduct={openProduct} onNavigate={setActive} orders={orders} />}
            <button className="loc-btn" onClick={() => setActive("addresses")}><MapPin size={13} /> Deliver to <b>Lekki, Lagos</b></button>
            <button className="icon-btn" onClick={() => setActive("wishlist")} aria-label="Wishlist"><Heart size={17} /></button>
            <div className="notif-anchor">
              {(() => {
                const visibleNotifs = notifList.filter((n) => (notifCategoryPrefs[n.category] ?? true));
                const unreadCount = visibleNotifs.filter((n) => !readNotifs.has(notifList.indexOf(n))).length;
                return (
                  <>
                    <button className="icon-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications"><Bell size={17} />{unreadCount > 0 && <span className="icon-badge">{unreadCount}</span>}</button>
                    {notifOpen && (
                      <>
                        <div className="notif-scrim" onClick={() => setNotifOpen(false)} />
                        <div className="notif-dropdown">
                          <div className="panel-title" style={{ padding: "12px 14px 6px" }}>Notifications</div>
                          {visibleNotifs.length === 0 && <div className="muted small" style={{ padding: "0 14px 12px" }}>Nothing here -- check Settings &gt; Notifications if you've muted a category.</div>}
                          {visibleNotifs.map((n) => {
                            const i = notifList.indexOf(n);
                            return (
                              <button key={i} className={`notif-row ${readNotifs.has(i) ? "read" : ""}`} onClick={() => { setActive(n.goTo); setNotifOpen(false); setReadNotifs((r) => new Set(r).add(i)); }}>
                                <div className="pending-icon" style={{ background: n.color + "1A", color: n.color }}><n.icon size={14} /></div>
                                <div className="ti-mid"><div className="card-name">{n.title}</div><div className="muted">{n.sub}</div></div>
                                {!readNotifs.has(i) && <span className="unread-dot" />}
                                <div className="muted small">{n.time}</div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
            <button className="icon-btn" onClick={() => setCartOpen(true)} aria-label="Cart"><ShoppingCart size={17} />{cartCount > 0 && <span className="icon-badge">{cartCount}</span>}</button>
            <div className="notif-anchor">
              <button className="user-chip" onClick={() => setAccountOpen((o) => !o)}>
                <div className="driver-avatar sm">{CUSTOMER.name[0]}</div><div style={{ textAlign: "left" }}><div className="muted small">Hello,</div><div className="card-name">{CUSTOMER.name}{membership && MEMBERSHIP_TIERS.find((t) => t.key === membership.tier)?.price >= 10000 && <BadgeCheck size={13} color={MEMBERSHIP_TIERS.find((t) => t.key === membership.tier)?.color} style={{ marginLeft: 4, verticalAlign: "middle" }} />}</div></div><ChevronDown size={14} />
              </button>
              {accountOpen && (
                <>
                  <div className="notif-scrim" onClick={() => setAccountOpen(false)} />
                  <div className="notif-dropdown">
                    <div className="panel-title" style={{ padding: "12px 14px 6px" }}>Switch account</div>
                    <div className="muted small" style={{ padding: "0 14px 8px" }}>Accounts linked to this sign-in</div>
                    {LINKED_ACCOUNTS.map((acc) => (
                      <button key={acc.role} className="notif-row" onClick={() => { setAccountOpen(false); switchAccount(acc.appKey); }}>
                        <div className="driver-avatar sm" style={{ background: acc.role === "customer" ? "var(--purple)" : acc.role === "seller" ? "#EA580C" : "#16A34A" }}>{acc.initials}</div>
                        <div className="ti-mid"><div className="card-name">{acc.label}</div><div className="muted small">{acc.name}</div></div>
                        {acc.role === "customer" && <span className="status-pill done">Current</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {active !== "dashboard" && <div className="page-title" style={{ marginBottom: 14 }}>{active === "shop" ? "Shop" : active === "checkout" ? "Checkout" : activeLabel}</div>}
          {SCREENS[active] || <NotFoundScreen />}
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} updateQty={updateQty} onCheckout={() => { setCartOpen(false); setActive("checkout"); }} activeDiscount={activeDiscount} savedForLater={savedForLater} onSaveForLater={saveForLater} onMoveToCart={moveToCart} onRemoveSaved={removeSaved} notifyPrefs={notifyPrefs} setAllNotifyPrefs={setAllNotifyPrefs} />
      <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} onAdd={addToCart} onOpenProduct={openProduct} onOpenStore={openStoreByName} unitPref={unitPref} myReviews={myReviews} onSubmitReview={(productId, review) => setMyReviews((r) => ({ ...r, [productId]: review }))} myQuestionsByProduct={myQuestionsByProduct} onAskQuestion={(productId, question) => setMyQuestionsByProduct((q) => ({ ...q, [productId]: [...(q[productId] || []), question] }))} reportedPriceErrors={reportedPriceErrors} onReportPriceError={(productId) => setReportedPriceErrors((s) => new Set(s).add(productId))} />
      <StorefrontModal store={openStore} onClose={() => setOpenStore(null)} onOpenProduct={openProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} isFavorite={openStore ? favoriteStores.has(openStore.name) : false} onToggleFavorite={toggleFavoriteStore} orders={orders} onReorderItems={(items) => { items.forEach((p) => addToCart(getSellersForProduct(p)[0], 1)); showToast(`${items.length} item${items.length !== 1 ? "s" : ""} added to cart`); }} />
      {milestoneToast && <div className="switch-toast"><Flame size={14} /> {milestoneToast}</div>}
      {earnedToast && (
        <div className="switch-toast"><Sparkles size={14} /> {earnedToast}{lastPointsBreakdown && (lastPointsBreakdown.membershipBonus > 0 || lastPointsBreakdown.hiddenBonus > 0) && <button className="toast-link-btn" onClick={() => setBreakdownOpen(true)}>Why?</button>}</div>
      )}
      {breakdownOpen && lastPointsBreakdown && (
        <div className="modal-backdrop" onClick={() => setBreakdownOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setBreakdownOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>How you earned {lastPointsBreakdown.total} points</div>
            <div className="list-col">
              <div className="cat-top"><span className="muted small">Base rate (0.5 pt per ₦1,000)</span><span className="mono small">{lastPointsBreakdown.base}</span></div>
              {lastPointsBreakdown.membershipBonus > 0 && <div className="cat-top"><span className="muted small">Membership {lastPointsBreakdown.membershipMultiplier}x multiplier</span><span className="mono small" style={{ color: "#16A34A" }}>+{lastPointsBreakdown.membershipBonus}</span></div>}
              {lastPointsBreakdown.hiddenBonus > 0 && <div className="cat-top"><span className="muted small">Hidden Departments bonus</span><span className="mono small" style={{ color: "#16A34A" }}>+{lastPointsBreakdown.hiddenBonus}</span></div>}
              <div className="cat-top" style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}><span className="card-name" style={{ fontSize: 13 }}>Total</span><span className="mono" style={{ fontWeight: 700 }}>{lastPointsBreakdown.total}</span></div>
            </div>
          </div>
        </div>
      )}
      {capToast && <div className="switch-toast" style={{ background: "#B45309" }}><AlertTriangle size={14} /> {capToast}</div>}
      {huntToast && <div className="switch-toast" style={{ background: "#EA580C" }}><Gift size={14} /> {huntToast}</div>}    </div>
  );
}

const CSS = `
@media print {
  body * { visibility: hidden; }
  #receipt-printable, #receipt-printable * { visibility: visible; }
  #receipt-printable { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
  .no-print { display: none !important; }
}
:root{ --ink:#0F172A; --muted:#64748B; --border:#E5E7EB; --bg:#F7F8FB; --card:#FFFFFF; --purple:#6D28D9; --purple-light:#EEF2FF; }
.medra-root.dark{ --ink:#F1F5F9; --muted:#94A3B8; --border:#334155; --bg:#0F172A; --card:#1E293B; }
.medra-root.dark img{ opacity:0.92; }
.medra-root{ font-family:'Inter',sans-serif; color:var(--ink); background:var(--bg); min-height:100%; display:flex; justify-content:center; position:relative; }
.medra-root *{ box-sizing:border-box; }
button{ font-family:inherit; border:none; background:none; cursor:pointer; color:inherit; }
input, select{ font-family:inherit; }
.muted{ color:var(--muted); font-size:12.5px; } .muted.small{ font-size:11px; }
.muted-l{ color:rgba(255,255,255,0.8); font-size:11.5px; }
.mono{ font-family:'JetBrains Mono',monospace; font-size:12.5px; } .mono.neg{ color:#DC2626; }
.card-name{ font-size:13px; font-weight:600; }
.brand-logo{ display:flex; align-items:center; gap:9px; }
.brand-word{ font-weight:800; font-size:17px; letter-spacing:-0.01em; color:#0F172A; }
.brand-tag{ font-size:10.5px; color:var(--muted); font-weight:500; }

.desk-shell{ width:100%; max-width:1440px; min-height:100vh; display:flex; }
.sidebar{ width:250px; flex-shrink:0; background:#fff; border-right:1px solid var(--border); display:flex; flex-direction:column; padding:18px 12px; gap:8px; height:100vh; position:sticky; top:0; overflow:hidden; }
.sidebar-head{ padding:4px 8px 14px; border-bottom:1px solid var(--border); margin-bottom:6px; }
.sidebar-nav{ flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
.side-btn{ display:flex; align-items:center; gap:9px; padding:9px 10px; border-radius:8px; font-size:12.5px; font-weight:500; color:#334155; width:100%; text-align:left; transition:background 150ms ease; position:relative; }
.side-btn:hover{ background:#F1F5F9; }
.side-btn.active{ background:var(--purple-light); color:var(--purple); font-weight:700; }
.side-badge{ margin-left:auto; background:#DC2626; color:#fff; font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:100px; }
.side-btn.logout{ color:#DC2626; margin-top:8px; padding:10px; font-weight:600; }
.points-badge{ margin-left:auto; display:inline-flex; align-items:center; gap:3px; background:#FEF3C7; color:#92400E; font-size:9.5px; font-weight:700; padding:2px 6px; border-radius:100px; }

.main{ flex:1; min-width:0; padding:16px 28px 60px; overflow-y:auto; height:100vh; }
.topbar-cu{ display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
.search-wrap-cu{ flex:1; min-width:220px; display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:9px 14px; }
.search-wrap-cu input{ flex:1; border:none; outline:none; font-size:13px; background:none; }
.loc-btn{ display:flex; align-items:center; gap:5px; font-size:12px; border:1px solid var(--border); border-radius:10px; padding:9px 12px; white-space:nowrap; }
.icon-btn{ position:relative; width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.hamburger-btn{ display:none; align-items:center; justify-content:center; width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid var(--border); flex-shrink:0; }
.group-toggle{ /* marker class only, used to exclude group-expand clicks from closing the mobile nav drawer */ }
.icon-badge{ position:absolute; top:-5px; right:-5px; background:#DC2626; color:#fff; font-size:9px; font-weight:700; min-width:16px; height:16px; border-radius:100px; display:flex; align-items:center; justify-content:center; padding:0 3px; }
.notif-anchor{ position:relative; }
.notif-scrim{ position:fixed; inset:0; z-index:60; }
.notif-dropdown{ position:absolute; top:44px; right:0; width:320px; max-width:88vw; background:#fff; border:1px solid var(--border); border-radius:14px; box-shadow:0 20px 40px -16px rgba(15,23,42,0.25); z-index:61; overflow:hidden; }
.notif-row{ display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:10px 14px; border-top:1px solid #F1F5F9; transition:background 120ms ease; }
.notif-row:hover{ background:#F8F9FC; }
.notif-row.read{ opacity:0.55; }
.unread-dot{ width:7px; height:7px; border-radius:100px; background:#7C3AED; flex-shrink:0; }
.msg-thread-btn{ width:100%; text-align:left; border-radius:10px; transition:background 120ms ease; }
.msg-thread-btn.active{ background:var(--purple-light); }
:focus-visible{ outline:2px solid var(--purple); outline-offset:2px; border-radius:4px; }
.user-chip{ display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:6px 10px; flex-shrink:0; }
.driver-avatar{ width:32px; height:32px; border-radius:100px; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex-shrink:0; }
.driver-avatar.sm{ width:30px; height:30px; font-size:11px; }
.driver-avatar.store{ background:#EA580C; border-radius:10px; }
.page-title{ font-size:19px; font-weight:800; }

.section-pad{ display:flex; flex-direction:column; gap:16px; }
.enter{ animation: fadeUp 380ms cubic-bezier(.2,.8,.2,1) both; } @keyframes fadeUp{ from{ opacity:0; transform:translateY(8px);} to{ opacity:1; transform:none;} }
.medra-root.reduce-motion .enter{ animation: none !important; }
.medra-root.reduce-motion *{ transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }

.hero-banner{ background:linear-gradient(120deg,var(--purple),#4C1D95); border-radius:18px; padding:22px 26px; display:flex; flex-wrap:wrap; gap:20px; justify-content:space-between; align-items:center; color:#fff; }
.hero-title{ font-size:20px; font-weight:800; }
.hero-sub{ color:rgba(255,255,255,0.85); font-size:13px; margin-top:2px; }
.hero-stats{ display:flex; gap:14px; flex-wrap:wrap; }
.hero-stat{ background:rgba(255,255,255,0.12); border-radius:14px; padding:12px 16px; min-width:130px; }
.hero-stat.gold{ background:rgba(255,255,255,0.18); }
.hero-stat-val{ font-size:16px; font-weight:800; margin:4px 0 8px; }
.hero-mini-btn{ background:#fff; color:var(--purple); border-radius:8px; padding:6px 10px; font-size:11px; font-weight:700; }
.hero-mini-btn.light{ background:#fff; color:var(--purple); }

.cat-row{ display:flex; gap:14px; overflow-x:auto; padding-bottom:4px; }
.cat-item{ display:flex; flex-direction:column; align-items:center; gap:8px; flex-shrink:0; }
.cat-icon{ width:52px; height:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; }
.cat-item span{ font-size:11.5px; font-weight:600; }

.row-2col{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.panel{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:18px 20px; min-width:0; }
.panel-title{ font-weight:700; font-size:14.5px; margin-bottom:12px; display:flex; align-items:center; }
.panel-title-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.link-btn{ font-size:12px; font-weight:600; color:var(--purple); }
.list-col{ display:flex; flex-direction:column; gap:10px; }
.ti-mid{ flex:1; min-width:0; }
.order-row{ display:flex; align-items:center; gap:8px; }
.order-row-full{ display:flex; align-items:center; gap:8px; border:1px solid var(--border); border-radius:12px; padding:10px 12px; flex-wrap:wrap; }
.pending-row{ display:flex; align-items:center; gap:10px; }
.row-actions{ display:flex; justify-content:flex-end; gap:8px; }
.stars-row{ display:flex; gap:1px; }
.star-select-btn{ padding:2px; display:flex; cursor:pointer; transition:transform 100ms ease; }
.star-select-btn:hover{ transform:scale(1.15); }

.track-steps{ display:flex; flex-direction:column; gap:10px; }
.track-step{ display:flex; align-items:center; gap:8px; }
.track-time{ margin-left:auto; font-family:'JetBrains Mono',monospace; font-size:11px; }
.track-dot{ width:16px; height:16px; border-radius:100px; border:2px solid #E5E7EB; display:flex; align-items:center; justify-content:center; color:#fff; flex-shrink:0; }
.track-step.done .track-dot{ background:#16A34A; border-color:#16A34A; }
.track-step.done .muted{ color:#0F172A; }
.primary-btn-sm{ background:var(--purple); color:#fff; border-radius:10px; padding:9px 16px; font-weight:700; font-size:12.5px; display:inline-flex; align-items:center; gap:6px; justify-content:center; }
.primary-btn-sm.wide{ width:100%; }
.primary-btn-sm:disabled{ opacity:0.5; cursor:not-allowed; }
.ghost-btn-sm{ border:1px solid var(--border); border-radius:10px; padding:8px 14px; font-weight:600; font-size:12px; }
.round-btn{ width:26px; height:26px; border-radius:100px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; background:#F1F5F9; color:var(--muted); }
.round-btn:hover{ background:#E2E8F0; }
.round-btn.deny{ background:#FEF2F2; color:#DC2626; }
.round-btn.deny:hover{ background:#FEE2E2; }
.round-btn.approve{ background:#ECFDF5; color:#16A34A; }
.round-btn.approve:hover{ background:#D1FAE5; }
.hero-left{ display:flex; flex-direction:column; gap:2px; }
.ghost-btn-sm:disabled{ opacity:0.5; }

.promo-banner{ background:linear-gradient(120deg,#4C1D95,var(--purple)); border-radius:16px; padding:20px; color:#fff; }
.refer-card{ background:#ECFDF5; border:1px solid #BBF7D0; border-radius:16px; padding:16px; }
.refer-code{ display:inline-flex; align-items:center; gap:8px; background:var(--bg); border:1px dashed var(--border); border-radius:10px; padding:10px 16px; font-family:'JetBrains Mono',monospace; font-weight:700; cursor:pointer; }

.prod-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.prod-card{ border:1px solid var(--border); border-radius:14px; overflow:hidden; cursor:pointer; transition:transform 150ms ease; }
.prod-card:hover{ transform:translateY(-2px); }
.prod-skel{ aspect-ratio:0.8; border-radius:14px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
@keyframes shimmer{ from{background-position:200% 0;} to{background-position:-200% 0;} }
.prod-img-wrap{ position:relative; aspect-ratio:1/1; }
.prod-img-wrap img{ width:100%; height:100%; object-fit:cover; }
.badge{ position:absolute; top:8px; left:8px; background:#DC2626; color:#fff; font-size:9.5px; font-weight:700; padding:3px 8px; border-radius:100px; }
.wish-btn{ position:absolute; top:8px; right:8px; width:26px; height:26px; border-radius:100px; background:rgba(255,255,255,0.9); display:flex; align-items:center; justify-content:center; }
.prod-name{ font-size:12.5px; font-weight:600; padding:10px 10px 4px; line-height:1.3; }
.prod-price-row{ display:flex; align-items:center; gap:6px; padding:0 10px 10px; }
.prod-price{ font-weight:700; font-size:13px; }
.prod-was{ font-size:11px; color:var(--muted); text-decoration:line-through; }
.prod-add{ margin-left:auto; width:26px; height:26px; border-radius:100px; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

.shop-toolbar{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.chip-row{ display:flex; gap:8px; flex-wrap:wrap; }
.transfer-box{ background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:12px; }
.transfer-box .cat-top{ margin-bottom:4px; }
.chip{ padding:8px 14px; border-radius:100px; background:#fff; border:1px solid var(--border); font-size:12.5px; font-weight:500; }
.chip.active{ background:var(--ink); color:#fff; border-color:var(--ink); }
.sort-select{ border:1px solid var(--border); border-radius:10px; padding:8px 10px; font-size:12.5px; background:#fff; }

.modal-backdrop{ position:fixed; inset:0; background:rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
.product-modal{ background:#fff; border-radius:20px; width:100%; max-width:640px; display:flex; overflow:hidden; position:relative; max-height:88vh; }
.storefront-modal{ background:#fff; border-radius:20px; padding:26px; width:100%; max-width:600px; max-height:88vh; overflow-y:auto; position:relative; }
.modal-close{ position:absolute; top:14px; right:14px; width:32px; height:32px; border-radius:100px; background:rgba(255,255,255,0.9); display:flex; align-items:center; justify-content:center; z-index:2; }
.modal-media{ width:44%; flex-shrink:0; display:flex; flex-direction:column; background:#F8FAFC; }
.modal-img{ width:100%; height:280px; object-fit:cover; display:block; }
.modal-body{ flex:1; padding:24px; overflow-y:auto; min-width:0; }
.seller-row{ display:flex; align-items:center; gap:10px; border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
.review-row{ border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
.similar-row{ display:flex; gap:10px; overflow-x:auto; }
.similar-card{ flex-shrink:0; width:100px; text-align:left; }
.photo-thumb-row{ display:flex; gap:8px; padding:10px 22px; flex-wrap:wrap; }
.photo-thumb{ width:56px; height:56px; border-radius:10px; overflow:hidden; border:2px solid transparent; flex-shrink:0; }
.photo-thumb img{ width:100%; height:100%; object-fit:cover; }
.photo-thumb.active{ border-color:var(--purple); }
.bundle-row{ display:flex; align-items:center; gap:10px; overflow-x:auto; padding-bottom:4px; }
.bundle-item{ flex-shrink:0; width:84px; text-align:center; }
.bundle-item img{ width:64px; height:64px; border-radius:10px; object-fit:cover; margin:0 auto; display:block; }
.bundle-plus{ flex-shrink:0; color:var(--muted); }
.similar-card img{ width:100px; height:100px; border-radius:10px; object-fit:cover; margin-bottom:4px; }

.cart-drawer-wrap{ position:fixed; inset:0; pointer-events:none; z-index:150; }
.cart-drawer-wrap.open{ pointer-events:auto; }
.cart-backdrop{ position:absolute; inset:0; background:rgba(15,23,42,0.4); opacity:0; transition:opacity 250ms ease; }
.cart-drawer-wrap.open .cart-backdrop{ opacity:1; }
.cart-drawer{ position:absolute; top:0; right:0; bottom:0; width:380px; max-width:92vw; background:#fff; display:flex; flex-direction:column; transform:translateX(100%); transition:transform 280ms cubic-bezier(.2,.8,.2,1); }
.cart-drawer-wrap.open .cart-drawer{ transform:translateX(0); }
.cart-row{ display:flex; align-items:center; gap:10px; border:1px solid var(--border); border-radius:12px; padding:10px; }
.link-price{ font-size:11.5px; font-weight:600; color:var(--purple); text-decoration:underline; }
.cart-row img{ width:50px; height:50px; border-radius:8px; object-fit:cover; }
.stepper-sm{ display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--border); border-radius:100px; padding:3px 8px; width:fit-content; margin-top:4px; }
.stepper-sm button{ width:16px; height:16px; display:flex; align-items:center; justify-content:center; }
.stepper-sm span{ font-family:'JetBrains Mono',monospace; font-size:12px; min-width:12px; text-align:center; }

.field{ display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:600; color:#334155; }
.field input, .field select{ border:1.5px solid var(--border); border-radius:12px; padding:10px 12px; font-size:13px; outline:none; }
.points-redeem-box{ background:#FFFBEB; border:1px solid #FDE68A; border-radius:12px; padding:12px 14px; margin-bottom:6px; }
.surge-note{ display:flex; align-items:center; gap:8px; background:#FFF7ED; color:#C2410C; border-radius:10px; padding:10px 12px; font-size:12px; font-weight:600; margin-bottom:10px; }
.subscribe-toggle-label{ display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--purple); margin:2px 0 8px; }
.points-slider{ width:100%; margin:6px 0; }
.breakdown-box{ background:var(--bg); border:1px solid var(--border); border-radius:12px; padding:12px 14px; margin-bottom:12px; display:flex; flex-direction:column; gap:6px; }

.map-placeholder{ position:relative; height:150px; border-radius:14px; background:linear-gradient(135deg,#EEF2FF,#F5F3FF); display:grid; grid-template-columns:repeat(6,1fr); grid-template-rows:repeat(4,1fr); overflow:hidden; }
.map-placeholder.live{ display:flex; align-items:center; justify-content:center; padding:6px; }
.map-dot{ width:3px; height:3px; border-radius:100px; background:rgba(109,40,217,0.18); margin:auto; }
.map-pin{ position:absolute; width:30px; height:30px; border-radius:100px; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; }
.map-pin.start{ top:20px; left:24px; } .map-pin.end{ bottom:20px; right:24px; background:#EA580C; }
.pulse-dot{ animation:pulseDotAnim 1.3s ease infinite; }
@keyframes pulseDotAnim{ 0%{ filter:drop-shadow(0 0 0 rgba(109,40,217,0.5)); } 70%{ filter:drop-shadow(0 0 8px rgba(109,40,217,0)); } 100%{ filter:drop-shadow(0 0 0 rgba(109,40,217,0)); } }
.cancel-btn{ display:flex; align-items:center; gap:6px; color:#DC2626; border:1px solid #FECACA; border-radius:10px; padding:8px 14px; font-size:12px; font-weight:700; margin-top:12px; }
.cancel-btn.sm{ margin-top:0; padding:6px 10px; }
.reorder-btn{ display:flex; align-items:center; gap:5px; border:1px solid var(--border); border-radius:10px; padding:6px 10px; font-size:11.5px; font-weight:600; }
.chat-block{ margin-top:14px; border-top:1px solid var(--border); padding-top:14px; }
.chat-thread{ display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto; margin-bottom:10px; }
.community-feed{ display:flex; flex-direction:column; gap:14px; max-height:420px; overflow-y:auto; }
.community-msg{ display:flex; gap:10px; align-items:flex-start; }
.community-gate{ display:flex; align-items:center; gap:8px; background:var(--purple-light); color:var(--purple); border-radius:12px; padding:12px 14px; font-size:12.5px; font-weight:600; margin-bottom:14px; }
.community-divider{ text-align:center; font-size:11.5px; color:var(--muted); padding:6px 0; border-top:1px dashed var(--border); border-bottom:1px dashed var(--border); }
.community-img{ max-width:220px; border-radius:12px; margin-top:6px; display:block; }
.image-preview-row{ display:flex; align-items:center; gap:8px; margin-top:10px; }
.image-preview-thumb{ width:48px; height:48px; border-radius:8px; object-fit:cover; }
.chat-bubble{ padding:8px 12px; border-radius:12px; font-size:12.5px; max-width:75%; }
.chat-bubble.driver{ background:var(--bg); align-self:flex-start; }
.chat-bubble.me{ background:var(--purple); color:#fff; align-self:flex-end; }
.chat-msg-wrap{ display:flex; flex-direction:column; }
.chat-msg-wrap .chat-bubble{ position:relative; cursor:pointer; }
.msg-reaction{ position:absolute; bottom:-10px; right:4px; background:#fff; border-radius:100px; padding:1px 4px; font-size:11px; box-shadow:0 1px 3px rgba(0,0,0,0.15); }
.emoji-picker-row{ display:flex; gap:4px; background:#fff; border:1px solid var(--border); border-radius:100px; padding:4px 6px; box-shadow:0 4px 12px rgba(0,0,0,0.12); align-self:flex-start; margin:4px 0; }
.emoji-picker-row button{ font-size:15px; padding:2px; }
.seen-label{ font-size:10px; color:var(--muted); align-self:flex-end; margin:2px 4px 6px 0; }
.typing-indicator{ display:flex; gap:3px; padding:8px 12px; background:var(--bg); border-radius:12px; width:fit-content; }
.typing-indicator span{ width:6px; height:6px; border-radius:100px; background:var(--muted); animation:typingBounce 1.2s infinite ease-in-out; }
.typing-indicator span:nth-child(2){ animation-delay:0.15s; }
.typing-indicator span:nth-child(3){ animation-delay:0.3s; }
@keyframes typingBounce{ 0%,60%,100%{ transform:translateY(0); opacity:0.5; } 30%{ transform:translateY(-4px); opacity:1; } }
.reply-row{ display:flex; gap:8px; }
.reply-row input{ flex:1; border:1px solid var(--border); border-radius:10px; padding:8px 12px; font-size:12.5px; outline:none; }
.tip-row{ display:flex; gap:8px; justify-content:center; }
.tip-btn{ border:1px solid var(--border); border-radius:10px; padding:8px 14px; font-size:12.5px; font-weight:700; }
.tip-btn.on{ background:var(--purple); color:#fff; border-color:var(--purple); }

.admin-table{ width:100%; border-collapse:collapse; }
.status-pill{ font-size:10px; font-weight:700; padding:4px 9px; border-radius:100px; background:#F1F5F9; color:#475569; white-space:nowrap; }
.status-pill.done{ background:#ECFDF5; color:#16A34A; } .status-pill.route{ background:#EFF6FF; color:#2563EB; }
.status-pill.prep{ background:#FFF7ED; color:#B45309; } .status-pill.delay{ background:#FEF2F2; color:#DC2626; }
.empty-note{ color:var(--muted); font-size:13px; padding:24px 16px; text-align:center; display:flex; flex-direction:column; align-items:center; }
.flag-row{ display:flex; align-items:center; gap:10px; border:1px solid var(--border); border-radius:12px; padding:11px 14px; }
.nav-flag{ width:100%; text-align:left; }
.cat-top{ display:flex; justify-content:space-between; font-size:12.5px; }
.kpi-value{ font-size:22px; font-weight:800; letter-spacing:-0.01em; }
.bar-track{ height:8px; background:#F1F5F9; border-radius:100px; overflow:hidden; }
.bar-fill-h{ height:100%; border-radius:100px; transition:width 400ms ease; }

.points-hero{ text-align:center; padding:26px; }
.cap-warning-banner{ display:flex; align-items:center; gap:8px; background:#FFF7ED; color:#B45309; border-radius:12px; padding:12px 16px; font-size:12.5px; font-weight:600; margin-bottom:16px; line-height:1.5; }
.empty-state{ display:flex; flex-direction:column; align-items:center; text-align:center; padding:36px 20px; }
.wishlist-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.wishlist-card{ border:1px solid var(--border); border-radius:14px; overflow:hidden; }
.wishlist-notify-row{ display:flex; flex-direction:column; gap:6px; padding:8px 10px 12px; }
.notify-toggle-label{ display:flex; align-items:center; gap:6px; font-size:11px; color:var(--muted); cursor:pointer; }
.notify-toggle-label input{ accent-color:var(--purple); width:13px; height:13px; }
.response-badge{ display:flex; align-items:center; gap:5px; font-size:11px; color:#16A34A; font-weight:600; margin-top:4px; }
.why-seller-note{ font-size:11px; color:#16A34A; font-weight:600; margin:2px 0; }
.instructions-note{ display:flex; align-items:center; gap:6px; background:var(--bg); border-radius:10px; padding:8px 12px; font-size:12px; color:#3A4450; margin-bottom:12px; }
.scheduled-note{ display:flex; align-items:center; gap:8px; background:#EEF2FF; border:1px solid #C7D2FE; border-radius:10px; padding:10px 12px; font-size:12px; color:#3730A3; margin-bottom:12px; }
.eta-countdown{ display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:#16A34A; margin-bottom:12px; }
.spend-insight{ display:flex; align-items:center; gap:8px; background:var(--purple-light); color:var(--purple); border-radius:12px; padding:11px 16px; font-size:12.5px; font-weight:600; margin-bottom:16px; }
.nl-interpretation{ display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--purple); font-weight:600; margin-bottom:10px; }
.choose-for-me-btn{ display:inline-flex; align-items:center; gap:6px; background:var(--purple-light); color:var(--purple); border-radius:100px; padding:8px 14px; font-size:12.5px; font-weight:700; margin-bottom:14px; }
.choose-for-me-panel{ border:1.5px solid var(--purple-light); }
.share-link-box{ display:flex; align-items:center; justify-content:space-between; gap:10px; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:10px 12px; }
.version-tag{ text-align:center; font-size:11px; color:#B0B7C3; padding:16px 0; }
.faq-item{ border:1px solid var(--border); border-radius:10px; overflow:hidden; }
.faq-q{ display:flex; align-items:center; justify-content:space-between; width:100%; padding:12px 14px; font-size:13px; font-weight:600; color:var(--ink); text-align:left; }
.faq-a{ padding:0 14px 12px; font-size:12.5px; color:var(--muted); line-height:1.5; }
.pagination-row{ display:flex; align-items:center; justify-content:center; gap:14px; margin-top:16px; }
.empty-state-icon{ width:44px; height:44px; border-radius:100px; background:var(--purple-light); color:var(--purple); display:flex; align-items:center; justify-content:center; }
.undo-toast{ position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#0F172A; color:#fff; padding:11px 18px; border-radius:100px; font-size:12.5px; font-weight:600; display:flex; align-items:center; gap:14px; z-index:300; box-shadow:0 20px 40px -16px rgba(0,0,0,0.4); }
.input-invalid{ border-color:#DC2626 !important; }
.field-error{ font-size:11px; color:#DC2626; font-weight:600; }
.compare-chk{ position:absolute; top:8px; left:8px; width:24px; height:24px; border-radius:7px; background:rgba(255,255,255,0.92); border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center; }
.compare-chk.on{ background:var(--purple); border-color:var(--purple); color:#fff; }
.prod-card.in-compare{ outline:2px solid var(--purple); }
.compare-bar{ display:flex; align-items:center; gap:10px; background:var(--ink); color:#fff; border-radius:12px; padding:10px 16px; font-size:12.5px; font-weight:600; margin-bottom: 14px; }
.compare-bar .ghost-btn-sm.light{ border-color:rgba(255,255,255,0.3); color:#fff; }
.compare-grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:14px; }
.compare-col img{ width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:10px; }
.compare-row{ display:flex; justify-content:space-between; font-size:11.5px; padding:4px 0; border-top:1px solid #F1F5F9; }
.skip-link{ position:absolute; left:-9999px; top:0; background:var(--purple); color:#fff; padding:10px 16px; border-radius:0 0 10px 0; z-index:500; font-weight:700; font-size:12.5px; }
.skip-link:focus{ left:0; }
.apply-status{ text-align:center; padding:30px; display:flex; flex-direction:column; align-items:center; }
.tier-ladder{ display:flex; align-items:center; justify-content:space-between; margin:12px 0 10px; }
.tier-step{ display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; }
.tier-dot{ width:18px; height:18px; border-radius:100px; }
.tier-step.current .muted{ color:var(--ink); font-weight:700; }
.games-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.game-card{ border:1px solid var(--border); border-radius:14px; padding:14px; }
.giveaway-pick-card{ border:2px solid transparent; border-radius:12px; overflow:hidden; text-align:left; background:var(--bg); }
.lottery-grid{ display:grid; grid-template-columns:repeat(10, 1fr); gap:6px; margin-top:10px; }
.lottery-num{ aspect-ratio:1; border-radius:8px; background:var(--bg); border:1px solid var(--border); font-size:11px; font-weight:600; }
.lottery-num.picked{ background:var(--purple); color:#fff; border-color:var(--purple); }
.lottery-num:disabled{ opacity:0.5; }
.giveaway-pick-card img{ width:100%; height:90px; object-fit:cover; display:block; }
.giveaway-pick-card.selected{ border-color:var(--purple); }
.game-card.done{ background:#EEF7F0; border-color:#BBF7D0; }
.game-card:disabled{ opacity:0.6; }
.wheel-wrap{ display:flex; flex-direction:column; align-items:center; }
.wheel-pointer{ width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:14px solid #0F172A; margin-bottom:-4px; z-index:2; }
.wheel-banner{ font-size:15px; font-weight:800; color:#0F172A; text-align:center; margin-bottom:10px; letter-spacing:0.01em; }
.wheel-banner-sub{ display:block; font-size:11px; font-weight:600; color:var(--muted); letter-spacing:0.02em; margin-top:2px; }
.wheel-result{ margin-top:12px; text-align:center; font-size:12.5px; font-weight:600; background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:8px 12px; }
.wheel-result-note{ margin-top:12px; display:flex; align-items:center; gap:6px; justify-content:center; font-size:12.5px; font-weight:700; background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:8px 12px; color:#B45309; }
.wheel-legend{ display:grid; grid-template-columns:1fr 1fr; gap:6px 16px; margin-top:16px; width:100%; max-width:320px; }
.wheel-legend-row{ display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--muted); }
.wheel-legend-dot{ width:9px; height:9px; border-radius:100%; flex-shrink:0; }
.wheel-goodluck{ margin-top:16px; padding:8px 24px; background:linear-gradient(120deg,#DB2777,#7C3AED); color:#FDE68A; font-weight:800; font-size:13px; letter-spacing:0.04em; border-radius:100px; border:2px solid #F59E0B; }
.games-section-header{ display:flex; align-items:center; gap:10px; padding:10px 4px 4px; }
.game-top{ display:flex; align-items:center; gap:10px; }
.pending-icon{ width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.celebrant-panel{ background:linear-gradient(120deg,#FDF4FF,#F5F3FF); border-color:#E9D5FF; }
.celebrant-row{ display:flex; align-items:center; gap:14px; }
.celebrant-photo{ width:56px; height:56px; border-radius:100px; object-fit:cover; }
.toggle-mini{ width:38px; height:22px; border-radius:100px; background:#E2E8F0; padding:2px; display:flex; align-items:center; flex-shrink:0; }
.toggle-mini.on{ background:var(--purple); justify-content:flex-end; }
.toggle-mini span{ width:18px; height:18px; border-radius:100px; background:#fff; display:block; }

.theme-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.streak-cal{ width:100%; }
.streak-cal-head{ display:grid; grid-template-columns:repeat(7,1fr); text-align:center; font-size:11px; color:var(--muted); font-weight:700; margin-bottom:6px; }
.streak-cal-row{ display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-bottom:4px; }
.streak-cal-day{ aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:8px; font-size:12px; background:var(--bg); color:var(--muted); }
.streak-cal-day.empty{ background:transparent; }
.streak-cal-day.today{ border:1.5px solid var(--purple); font-weight:700; }
.streak-cal-day.active{ background:var(--purple); color:#fff; }
.membership-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; }
.membership-card{ border:1.5px solid var(--border); border-radius:16px; padding:16px; }
.membership-card.active{ border-width:2px; }
.theme-card{ border:1px solid var(--border); border-radius:14px; padding:14px; text-align:center; }
.theme-card.active{ border-color:var(--purple); background:var(--purple-light); }
.theme-swatch{ width:100%; height:36px; border-radius:8px; margin-bottom:8px; }

.onboard-modal{ background:#fff; border-radius:20px; padding:28px; width:340px; max-width:90vw; max-height:88vh; overflow-y:auto; text-align:center; position:relative; }
.addr-anchor{ position:relative; }
.addr-dropdown{ position:absolute; top:56px; left:0; right:0; background:#fff; border:1px solid var(--border); border-radius:14px; box-shadow:0 20px 40px -16px rgba(15,23,42,0.25); z-index:61; overflow:hidden; }
.confirm-modal{ background:#fff; border-radius:20px; padding:26px; width:420px; max-width:92vw; max-height:88vh; overflow-y:auto; position:relative; }
.rec-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.rec-card{ border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.rec-card img{ width:100%; aspect-ratio:1/1; object-fit:cover; }
.switch-toast{ position:fixed; top:18px; left:50%; transform:translateX(-50%); background:#0F172A; color:#fff; padding:11px 18px; border-radius:100px; font-size:12.5px; font-weight:600; display:flex; align-items:center; gap:8px; z-index:300; box-shadow:0 20px 40px -16px rgba(0,0,0,0.4); max-width:90vw; }
.toast-link-btn{ text-decoration:underline; color:#FDE68A; font-weight:700; font-size:12.5px; flex-shrink:0; }
.status-toast{ background:var(--purple); cursor:pointer; }
.onboard-dots{ display:flex; gap:6px; justify-content:center; margin-top:14px; }
.onboard-dots span{ width:6px; height:6px; border-radius:100px; background:#E2E8F0; }
.onboard-dots span.on{ background:var(--purple); width:16px; }

.staff-login-wrap{ width:100%; min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#F1F2F8,#F7F8FB); }
.staff-login-card{ width:400px; max-width:90vw; background:#fff; border:1px solid var(--border); border-radius:20px; padding:32px 30px; box-shadow:0 30px 60px -24px rgba(15,23,42,0.18); }

.staff-login-title{ font-size:19px; font-weight:800; margin-bottom:2px; }
.login-tabs{ display:flex; background:#F1F5F9; border-radius:100px; padding:4px; margin:16px 0; }
.login-tab{ flex:1; padding:9px; border-radius:100px; font-size:12px; font-weight:600; color:var(--muted); }
.login-tab.active{ background:#fff; color:var(--ink); box-shadow:0 1px 3px rgba(0,0,0,0.08); }
.login-form{ display:flex; flex-direction:column; gap:14px; }
.primary-btn{ background:var(--purple); color:#fff; border-radius:12px; padding:12px; font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center; gap:7px; }
.primary-btn:hover{ background:#5B21B6; } .primary-btn.wide{ width:100%; }
.spinner{ width:16px; height:16px; border-radius:100px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; animation:spin 700ms linear infinite; }

/* Real touch-target sizing: on genuinely touch-capable devices (not just narrow
   screens -- a touchscreen laptop counts too), grow the real tappable hit area
   of small interactive controls to the real ~44px minimum finger-size target,
   without changing how big they look on a mouse-driven desktop. */
@media (pointer: coarse) {
  .round-btn, .wish-btn, .prod-add, .modal-close, .icon-btn, .hamburger-btn{ min-width:44px; min-height:44px; }
  .compare-chk{ min-width:32px; min-height:32px; }
  .toggle-mini{ min-height:32px; }
}
@keyframes spin{ to{ transform:rotate(360deg); } }

@media (max-width:1000px){
  .sidebar{ position:fixed; top:0; left:0; height:100dvh; z-index:200; transform:translateX(-100%); transition:transform 0.25s ease; box-shadow:0 0 24px rgba(0,0,0,0.15); }
  .sidebar.mobile-open{ transform:translateX(0); }
  .sidebar-scrim{ display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:190; }
  .sidebar-scrim.show{ display:block; }
  .hamburger-btn{ display:flex; }
  .desk-shell{ display:block; }
  .main{ height:auto; min-height:100vh; padding:14px 14px 70px; }
  .row-2col, .prod-grid, .games-grid, .theme-grid{ grid-template-columns:1fr 1fr; }
  .hero-banner{ flex-direction:column; align-items:flex-start; }
}
@media (min-width:1001px){ .hamburger-btn{ display:none; } }

`;
