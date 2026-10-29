import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, Bell, MessageCircle, ChevronDown, Search, Calendar,
  Users, UserCog, Lock, Store, Truck, User as UserIcon, Package,
  LayoutGrid, ClipboardList, BadgeCheck, Navigation, FileText,
  CreditCard, BarChart3, Wallet, ArrowLeftRight, PlusCircle, Percent,
  Settings2, AlertTriangle, ScrollText, LifeBuoy, Mail, ShieldAlert,
  Flag, Tag, Gift, Crown, Megaphone, FileBarChart, TrendingUp,
  Settings, SlidersHorizontal, ToggleLeft, Activity, FileSearch,
  GitBranch, Terminal, LayoutDashboard, LogOut, ArrowUp, ArrowDown,
  Check, X, Star, Server, Database, HardDrive, Zap, Clock as ClockIcon, Award,
  Users2, ChevronRight, Circle, FileDown, Eye, Send, Sparkles, Monitor, Smartphone, History, Rss, Inbox, Pencil, HelpCircle, Image as ImageIcon, PartyPopper, Target, Medal, Heart, Menu, CircleCheck, Compass, Cross, MapPin, Wrench, Globe,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

/* ============================================================
   MOCK DATA -- shaped like tables this will read from once
   Supabase is wired in.
   ============================================================ */

const money = (n) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/* ------------------------------------------------------------
   PLATFORM ECONOMICS -- shared with the customer/seller/rider apps.
   Product commission: 10% added on top of every seller-listed price.
   Delivery commission: 15% of the delivery fee at normal hours,
   10% during peak hours (6-10am and 4-8pm) -- rider keeps the rest.
   ------------------------------------------------------------ */
const PRODUCT_COMMISSION_RATE = 0.10;
const PEAK_WINDOWS = [[6, 10], [16, 20]]; // Lagos rush hours
function isPeakHour(date = new Date()) {
  const h = date.getHours();
  return PEAK_WINDOWS.some(([start, end]) => h >= start && h < end);
}
const DELIVERY_COMMISSION_NORMAL = 0.15;
const DELIVERY_COMMISSION_PEAK = 0.10;

// productTotal = what the customer paid for items (seller price + 10%).
// deliveryFee = the gross delivery fee before the platform's cut.
// Canonical order statuses -- same five in every app.
const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
const ORDERS_LEDGER = [
  { id: "O5581", customer: "Jordan B.", vendor: "Northside Espresso Bar", productTotal: 3023, deliveryFee: 900, status: "Out for Delivery", peak: false },
  { id: "O5579", customer: "Priya M.", vendor: "Fresh Fields Grocery", productTotal: 1450, deliveryFee: 700, status: "Preparing", peak: false },
  { id: "O5574", customer: "Devon K.", vendor: "Ceramic & Co.", productTotal: 2173, deliveryFee: 1200, status: "Delivered", peak: true },
  { id: "O5566", customer: "Guest (08033219876)", vendor: "Fresh Fields Grocery", productTotal: 1610, deliveryFee: 700, status: "Delivered", peak: false, isGuest: true },
];
function orderBreakdown(o) {
  const sellerGets = o.productTotal / (1 + PRODUCT_COMMISSION_RATE);
  const productFee = o.productTotal - sellerGets;
  const rate = o.peak ? DELIVERY_COMMISSION_PEAK : DELIVERY_COMMISSION_NORMAL;
  const riderGetsRaw = o.deliveryFee * (1 - rate);
  const riderGets = Math.floor(riderGetsRaw / 10) * 10;
  const deliveryFeeCut = o.deliveryFee - riderGets; // remainder from rounding down folds into Medra's cut
  return { sellerGets, productFee, riderGets, deliveryFeeCut, grandTotal: o.productTotal + o.deliveryFee };
}

const KPIS = [
  { key: "revenue", label: "Total Revenue", value: money(685452), delta: "+18.7%", deltaMonth: "+27.4%", up: true, icon: Wallet, bg: "#EEF2FF", fg: "#4F46E5", spark: [30, 42, 38, 55, 48, 62, 70], sparkColor: "#4F46E5" },
  { key: "orders", label: "Total Orders", value: "125,430", delta: "+15.2%", deltaMonth: "+29.6%", up: true, icon: ClipboardList, bg: "#ECFDF5", fg: "#16A34A", spark: [20, 25, 22, 34, 30, 40, 46], sparkColor: "#16A34A" },
  { key: "users", label: "Total Users", value: "425,694", delta: "+9.5%", deltaMonth: "+21.8%", up: true, icon: Users, bg: "#FFF7ED", fg: "#EA580C", spark: [40, 38, 44, 41, 48, 45, 52], sparkColor: "#EA580C" },
  { key: "riders", label: "Active Riders", value: "12,845", delta: "+7.1%", deltaMonth: "+16.3%", up: true, icon: Truck, bg: "#EFF6FF", fg: "#2563EB", spark: [18, 22, 20, 26, 24, 29, 31], sparkColor: "#2563EB" },
  { key: "sellers", label: "Active Sellers", value: "8,934", delta: "+10.3%", deltaMonth: "+23.1%", up: true, icon: Store, bg: "#F5F3FF", fg: "#7C3AED", spark: [12, 15, 14, 19, 17, 21, 24], sparkColor: "#7C3AED" },
  { key: "commissions", label: "Platform Commissions", value: money(72654), delta: "+16.8%", deltaMonth: "+25.9%", up: true, icon: Percent, bg: "#FEF2F2", fg: "#DC2626", spark: [22, 20, 26, 24, 30, 28, 34], sparkColor: "#DC2626" },
];

const REVENUE_TREND = [
  { d: "Mon", v: 260000 }, { d: "Tue", v: 420000 }, { d: "Wed", v: 340000 }, { d: "Thu", v: 510000 },
  { d: "Fri", v: 460000 }, { d: "Sat", v: 590000 }, { d: "Sun", v: 685452 },
];
const LAST_WEEK_REVENUE_TREND = REVENUE_TREND.map((d) => ({ d: d.d, v: Math.round(d.v * 0.88) }));

const PLATFORM_MIX = [
  { name: "Customers", value: 81.4, display: "345,160", color: "#16A34A" },
  { name: "Sellers", value: 2.1, display: "8,934", color: "#F97316" },
  { name: "Riders", value: 3.0, display: "12,845", color: "#2563EB" },
  { name: "Admins", value: 0.1, display: "325", color: "#7C3AED" },
  { name: "Others", value: 0.3, display: "1,100", color: "#EC4899" },
  { name: "Pending Verifications", value: 0.5, display: "2,000", color: "#DC2626" },
];

const SUPPORT_MIX = [
  { name: "Open", value: 35, display: "35", color: "#F97316" },
  { name: "In Progress", value: 48, display: "48", color: "#2563EB" },
  { name: "Waiting Response", value: 25, display: "25", color: "#7C3AED" },
  { name: "Resolved", value: 20, display: "20", color: "#16A34A" },
];

const SYSTEM_HEALTH = [
  { label: "Server Status", value: "Healthy", icon: Check },
  { label: "Database", value: "Healthy", icon: Database },
  { label: "Storage", value: "63% Used", icon: HardDrive },
  { label: "API Uptime", value: "99.98%", icon: Zap },
  { label: "Response Time", value: "120ms", icon: ClockIcon },
  { label: "Active Sessions", value: "1,245", icon: Users2 },
];

const RECENT_ACTIVITY = [
  { title: "New admin created", sub: "superadmin@medra.com", time: "5 mins ago", icon: UserCog, color: "#7C3AED" },
  { title: "Rider permission updated", sub: "For Admin Team", time: "15 mins ago", icon: ShieldCheck, color: "#2563EB" },
  { title: "New seller registered", sub: "Bright Pharmacy", time: "25 mins ago", icon: Store, color: "#F97316" },
  { title: "KYC verified", sub: "LifeCare Store", time: "35 mins ago", icon: BadgeCheck, color: "#16A34A" },
  { title: "System settings updated", sub: "Commission rate changed", time: "45 mins ago", icon: Settings, color: "#DC2626" },
];

const PENDING_ACTIONS = [
  { label: "KYC Verifications", value: 126, icon: BadgeCheck, color: "#2563EB" },
  { label: "New Sellers", value: 48, icon: Store, color: "#F97316" },
  { label: "New Riders", value: 76, icon: Truck, color: "#16A34A" },
  { label: "Support Tickets", value: 35, icon: LifeBuoy, color: "#7C3AED" },
  { label: "Disputes", value: 18, icon: AlertTriangle, color: "#DC2626" },
];

const FINANCIAL_SUMMARY = [
  { label: "Total Payments", value: money(612442), icon: CreditCard, color: "#16A34A" },
  { label: "Total Payouts", value: money(65115), icon: Wallet, color: "#2563EB" },
  { label: "Wallet Top-ups", value: money(72845), icon: PlusCircle, color: "#7C3AED" },
  { label: "Refunds", value: money(8250), icon: ArrowLeftRight, color: "#F97316" },
  { label: "Disputed Amount", value: money(3450), icon: AlertTriangle, color: "#DC2626" },
];

const TOP_CATEGORIES = [
  { label: "Pharmacy & Health", value: money(125600), pct: 100, color: "#2563EB" },
  { label: "Groceries", value: money(110200), pct: 88, color: "#16A34A" },
  { label: "Electronics", value: money(98400), pct: 78, color: "#7C3AED" },
  { label: "Fashion", value: money(75800), pct: 60, color: "#F97316" },
  { label: "Restaurants", value: money(65300), pct: 52, color: "#EC4899" },
];

const PLATFORM_ANALYTICS = [
  { d: "May 12", orders: 92, users: 60 }, { d: "May 13", orders: 105, users: 66 },
  { d: "May 14", orders: 88, users: 58 }, { d: "May 15", orders: 112, users: 70 },
  { d: "May 16", orders: 98, users: 64 }, { d: "May 17", orders: 120, users: 76 },
  { d: "May 18", orders: 108, users: 68 },
];

const ANNOUNCEMENTS = [
  { title: "System Maintenance", sub: "Scheduled maintenance on May 20, 2:00 AM - 4:00 AM", time: "2 hours ago", icon: ShieldAlert, color: "#F97316" },
  { title: "New Feature Released", sub: "Advanced Analytics dashboard is now available", time: "1 day ago", icon: Zap, color: "#7C3AED" },
  { title: "Policy Update", sub: "Updated refund policy effective from May 15, 2025", time: "2 days ago", icon: FileText, color: "#DC2626" },
];

const QUICK_ACCESS = [
  { label: "Add Admin", icon: UserCog, key: "roles-permissions" }, { label: "Create Promo", icon: Megaphone, key: "promotions" },
  { label: "View Reports", icon: FileBarChart, key: "reports" }, { label: "System Settings", icon: Settings, key: "system-settings" },
  { label: "Manage Users", icon: Users, key: "users" }, { label: "KYC Queue", icon: BadgeCheck, key: "kyc" },
  { label: "Support Center", icon: LifeBuoy, key: "tickets" }, { label: "Transactions", icon: ScrollText, key: "tx-logs" },
  { label: "Audit Logs", icon: FileSearch, key: "platform-logs" }, { label: "Feature Toggles", icon: ToggleLeft, key: "feature-toggles" },
];

const VENDORS = [
  { id: "V1", name: "Northside Espresso Bar", category: "Grocery & Cafe", status: "active", gmv: 18400, rating: 4.8 },
  { id: "V2", name: "Ceramic & Co. Kitchen Supply", category: "Home", status: "active", gmv: 24100, rating: 4.6 },
  { id: "V3", name: "Runwell Sneaker Co.", category: "Fashion", status: "flagged", gmv: 9200, rating: 4.1 },
  { id: "V4", name: "Fresh Fields Grocery", category: "Grocery", status: "active", gmv: 31200, rating: 4.7 },
];
const RIDERS = [
  { id: "R1", name: "Marcus T.", trips: 1284, rating: 4.9, status: "active" },
  { id: "R2", name: "Priya S.", trips: 980, rating: 4.95, status: "active" },
  { id: "R3", name: "Devon K.", trips: 640, rating: 4.87, status: "suspended" },
];
const USERS_LIST = [
  { id: "U1", name: "Jordan Blake", email: "jordan@example.com", orders: 34, joined: "2024" },
  { id: "U2", name: "Priya Menon", email: "priya@example.com", orders: 21, joined: "2024" },
  { id: "U3", name: "Devon King", email: "devon@example.com", orders: 12, joined: "2025" },
];
const LEDGER = [
  { id: "L1", type: "Vendor payout", to: "Fresh Fields Grocery", amount: 3120400, date: "Aug 18" },
  { id: "L2", type: "Rider payout", to: "Marcus T.", amount: 412600, date: "Aug 18" },
  { id: "L3", type: "Platform fee", to: "Medra", amount: 890200, date: "Aug 18" },
  { id: "L4", type: "Refund", to: "Priya M.", amount: -18400, date: "Aug 17" },
];
const FEATURE_FLAGS = [
  // Platform-wide
  { key: "wallet_p2p", app: "Platform-wide", label: "Peer-to-peer wallet transfers", desc: "Let customers send wallet balance to one another", status: "disabled" },
  { key: "flash_sales", app: "Platform-wide", label: "Platform flash sales", desc: "Admin-scheduled storefront-wide discount windows", status: "enabled" },
  { key: "group_orders", app: "Platform-wide", label: "Group orders", desc: "Split one delivery's items and payment across multiple people in a single session -- no live cross-device sync yet, so everyone's items get added by whoever's placing the order", status: "enabled" },
  { key: "priority_dispatch", app: "Platform-wide", label: "Guaranteed priority dispatch", desc: "Riders with reserved shifts get first offer on requests", status: "beta" },
  { key: "live_map_tracking", app: "Platform-wide", label: "Live map tracking v2", desc: "Rebuilt tracking screen with smoother interpolation", status: "beta" },
  { key: "voice_support", app: "Platform-wide", label: "Voice support line", desc: "In-app voice call to support instead of chat only", status: "coming_soon" },
  { key: "buyer_protection", app: "Platform-wide", label: "Buyer Protection", desc: "Wrong, damaged, or missing orders qualify for a refund of 50% of the product price (delivery fee is never refunded), or a free replacement -- delivery fee applies again on the replacement order.", status: "enabled", cost: "~₦1.97M/month modeled cost (125,000 orders/mo, ₦3,000 avg. product price, 1.5% claim rate, 70% refund / 30% replacement mix) -- about 5.3% of product-commission revenue." },
  { key: "community_shared", app: "Platform-wide", label: "Community -- shared room", desc: "One room where customers, riders, sellers, and admins all chat together", status: "enabled" },
  { key: "community_peer", app: "Platform-wide", label: "Community -- role rooms", desc: "Separate peer-only rooms (Customer, Rider, Seller, Admin communities)", status: "enabled" },
  { key: "ai_assistant", app: "Platform-wide", label: "Ask Medra (AI Assistant)", desc: "Role-aware assistant answering questions from real account data, in every app", status: "enabled" },
  { key: "quick_replies", app: "Platform-wide", label: "AI-suggested quick replies", desc: "Draft-reply suggestions in seller and support message threads", status: "enabled" },
  { key: "non_refundable_categories", app: "Platform-wide", label: "Non-returnable category rules", desc: "Medication, food, and perishables are excluded from returns/refunds", status: "enabled" },
  { key: "task_locking", app: "Platform-wide", label: "Admin task locking", desc: "Prevents two admins from working the same ticket or dispute at once, with a full resolution audit trail", status: "enabled" },
  { key: "auth_2fa", app: "Platform-wide", label: "Two-factor authentication (staff)", desc: "TOTP-based second factor for Admin and Super Admin sign-in", status: "enabled" },

  // Sign in / sign up
  { key: "customer_signup", app: "Sign In / Sign Up", label: "Customer sign up & sign in", desc: "Email/phone account creation and login for customers", status: "enabled" },
  { key: "guest_checkout", app: "Sign In / Sign Up", label: "Guest checkout", desc: "Ordering without creating an account", status: "disabled" },
  { key: "rider_apply", app: "Sign In / Sign Up", label: "Apply to drive", desc: "Rider application and onboarding flow", status: "enabled" },
  { key: "seller_apply", app: "Sign In / Sign Up", label: "Apply to sell", desc: "Seller application and storefront setup flow", status: "enabled" },
  { key: "forgot_password", app: "Sign In / Sign Up", label: "Forgot password flow", desc: "Self-service password reset (UI only, no real email yet)", status: "beta" },

  // Customer
  { key: "multi_seller_compare", app: "Customer", label: "Multi-seller product comparison", desc: "Compare price, rating, and ETA across sellers on the same product", status: "enabled" },
  { key: "photo_gallery", app: "Customer", label: "Multi-photo product gallery", desc: "Multiple product images with a thumbnail switcher", status: "enabled" },
  { key: "bundle_suggestions", app: "Customer", label: "Frequently bought together", desc: "Cross-category bundle suggestions with one-tap add-all", status: "enabled" },
  { key: "subscribe_save", app: "Customer", label: "Subscribe & Save", desc: "10% discount for recurring auto-reorder on any line item", status: "enabled" },
  { key: "choose_for_me", app: "Customer", label: "Choose for me", desc: "One-tap picks based on the customer's real order history", status: "enabled" },
  { key: "nl_search", app: "Customer", label: "Natural-language search", desc: "Understands phrases like \"cheap breakfast under 3000\"", status: "enabled" },
  { key: "wishlist_alerts", app: "Customer", label: "Wishlist price-drop alerts", desc: "Notify customers when a saved item's price falls", status: "enabled" },
  { key: "points_per_order", app: "Customer", label: "Points on every order", desc: "1% of product spend earned as points automatically", status: "enabled" },
  { key: "points_redemption", app: "Customer", label: "Points redemption at checkout", desc: "Apply points toward the product total (never delivery)", status: "enabled" },
  { key: "points_monthly_cap", app: "Customer", label: "15,000pt monthly usage cap", desc: "Points earned above the monthly usable limit expire unused", status: "enabled" },
  { key: "referral_program", app: "Customer", label: "Refer & Earn", desc: "100 points per successful referral, capped 10/month", status: "enabled" },
  { key: "loyalty_tiers", app: "Customer", label: "Loyalty tiers", desc: "Bronze/Silver/Gold/Platinum based on lifetime points", status: "enabled" },
  { key: "live_eta", app: "Customer", label: "Live ETA countdown", desc: "Continuously updating arrival estimate, not a static number", status: "enabled" },
  { key: "share_trip", app: "Customer", label: "Share my trip", desc: "Shareable live tracking link, no account needed to view", status: "enabled" },
  { key: "surge_visibility", app: "Customer", label: "Surge pricing visibility", desc: "Customers see when delivery fees are temporarily higher", status: "enabled" },
  { key: "smart_tips", app: "Customer", label: "Smart tip presets", desc: "Suggested tip amounts adjust upward during peak hours", status: "enabled" },
  { key: "order_search", app: "Customer", label: "Order history search & filter", desc: "Search by store/order number, filter by status", status: "enabled" },
  { key: "reorder", app: "Customer", label: "Reorder & quick-reorder", desc: "Repeat a past order in one tap", status: "enabled" },
  { key: "report_problem", app: "Customer", label: "Report a problem", desc: "Refund/replacement request flow with category-aware eligibility", status: "enabled" },
  { key: "themes", app: "Customer", label: "Unlockable themes", desc: "Cosmetic themes unlocked with points", status: "enabled" },
  { key: "saved_payment", app: "Customer", label: "Multiple saved payment methods", desc: "Add, remove, and set a preferred card", status: "enabled" },
  { key: "saved_addresses", app: "Customer", label: "Multiple saved addresses", desc: "Add and select delivery addresses", status: "enabled" },

  // Rider
  { key: "multi_stop_batching", app: "Rider", label: "Multi-stop batching", desc: "Combine two nearby deliveries into one optimized route", status: "enabled" },
  { key: "payout_preview", app: "Rider", label: "Payout preview before accepting", desc: "Riders see their exact take, rounded down to the nearest ₦10", status: "enabled" },
  { key: "two_sided_handoff", app: "Rider", label: "Two-sided handoff", desc: "The receiving rider must accept -- not a one-sided transfer", status: "enabled" },
  { key: "shift_calendar", app: "Rider", label: "Shift calendar", desc: "7-day grid with recurring weekly shifts", status: "enabled" },
  { key: "rider_withdrawals", app: "Rider", label: "Withdrawal requests", desc: "Amount-based payout requests with pending/paid history", status: "enabled" },
  { key: "sos_safety", app: "Rider", label: "SOS & safety resources", desc: "Emergency alert, unsafe-situation reports, pre-shift vehicle checklist", status: "enabled" },
  { key: "rider_referral", app: "Rider", label: "Refer a Rider", desc: "Rewards once the referred rider completes their qualifying trips", status: "enabled" },
  { key: "rider_bank_settings", app: "Rider", label: "Payout bank account settings", desc: "Riders manage their own payout bank details", status: "enabled" },
  { key: "rider_gear_marketplace", app: "Rider", label: "Gear Marketplace", desc: "Real catalog, cart, and checkout against available earnings -- insulated bags, ponchos, phone mounts, hi-vis vests, power banks", status: "enabled" },
  { key: "rider_telehealth", app: "Rider", label: "Rider Telehealth Access", desc: "Pay for a doctor/pharmacist visit directly from available earnings, settled before withdrawal", status: "enabled" },
  { key: "rider_deliveries_zones", app: "Rider", label: "Deliveries & Busy Zones", desc: "My Deliveries history and a Busy Zones view for finding demand", status: "enabled" },
  { key: "rider_delivery_photo_proof", app: "Rider", label: "Delivery Photo Verification", desc: "A real photo capture is required before a delivery can be marked complete", status: "enabled" },
  { key: "rider_community", app: "Rider", label: "Messages, Community & Ask Medra", desc: "Direct messages, community feed, and the AI assistant", status: "enabled" },
  { key: "rider_notifications_support_settings", app: "Rider", label: "Notifications, Support & Settings", desc: "Rider-facing notifications, help/support, and app settings", status: "enabled" },

  // Seller
  { key: "csv_import", app: "Seller", label: "Bulk CSV product import", desc: "Upload a CSV to add or update many products at once", status: "enabled" },
  { key: "low_stock_alerts", app: "Seller", label: "Low-stock alerts", desc: "Per-product editable stock threshold with a warning badge", status: "enabled" },
  { key: "storefront_customization", app: "Seller", label: "Storefront customization", desc: "Banner image upload and an editable About section", status: "enabled" },
  { key: "status_posts", app: "Seller", label: "24-hour status posts", desc: "Today's-specials posts that expire automatically after 24h", status: "enabled" },
  { key: "seller_broadcast", app: "Seller", label: "Broadcast to customers", desc: "Message every opted-in customer at once", status: "enabled" },
  { key: "seller_withdrawals", app: "Seller", label: "Payout requests", desc: "Amount-based payout requests with pending/paid history", status: "enabled" },
  { key: "seller_bank_settings", app: "Seller", label: "Payout bank account settings", desc: "Sellers manage their own payout bank details", status: "enabled" },
  { key: "seller_help_faq", app: "Seller", label: "Help & Support FAQ", desc: "Real expandable FAQ plus a working contact-support flow", status: "enabled" },
  { key: "seller_order_management", app: "Seller", label: "Order Management", desc: "New Order Confirmations (real shared orders), full Orders list, Returns, Disputes", status: "enabled" },
  { key: "seller_reporting", app: "Seller", label: "Reporting Suite", desc: "Analytics, Weekly Digest, Rider Declines tracking", status: "enabled" },
  { key: "seller_telehealth", app: "Seller", label: "Seller Telehealth Access", desc: "Pay for a doctor/pharmacist visit directly from available earnings, settled before withdrawal", status: "enabled" },
  { key: "seller_customers_reviews", app: "Seller", label: "Customers & Reviews", desc: "Customer list and review management for the store", status: "enabled" },
  { key: "seller_marketing_suite", app: "Seller", label: "Marketing & Discounts", desc: "Real campaign creation and discount codes, not static tables", status: "enabled" },
  { key: "seller_community", app: "Seller", label: "Messages, Community & Broadcast", desc: "Direct messages, community feed, Status posts, and broadcast list, plus Ask Medra", status: "enabled" },
  { key: "seller_store_config", app: "Seller", label: "Store Settings & Locations", desc: "Store hours, delivery settings, multiple locations", status: "enabled" },
  { key: "seller_team", app: "Seller", label: "Team Accounts", desc: "Multiple staff logins under one store", status: "enabled" },

  // Admin
  { key: "view_as", app: "Admin", label: "View As (impersonation)", desc: "Support can see a user's exact screen, with a full audit log", status: "enabled" },
  { key: "vendor_approvals", app: "Admin", label: "Vendor application approvals", desc: "Review and approve/deny new seller applications", status: "enabled" },
  { key: "admin_broadcast", app: "Admin", label: "Admin broadcast messaging", desc: "Segment-targeted announcements from the admin side", status: "enabled" },
  { key: "admin_marketplace_management", app: "Admin", label: "Users, Sellers & Riders Management", desc: "Full directory, detail views, notes, and suspend/unsuspend -- including bulk suspend/unsuspend on Users with a real confirmation step and required reason", status: "enabled" },
  { key: "admin_catalog_orders", app: "Admin", label: "Products, Categories & Orders", desc: "Marketplace-wide catalog and order oversight", status: "enabled" },
  { key: "admin_kyc_interactive", app: "Admin", label: "KYC & Verifications (interactive)", desc: "Approve/Reject/Reopen seller and rider verification applications", status: "enabled" },
  { key: "admin_delivery_management", app: "Admin", label: "Delivery Management", desc: "Zones, surcharge windows, and radius configuration", status: "enabled" },
  { key: "admin_financial_ops", app: "Admin", label: "Financial Operations", desc: "Payments, Payouts & Settlements, Wallet Transactions/Top-ups, Commissions, and full Transaction Logs with CSV export", status: "enabled" },
  { key: "admin_community_notifications", app: "Admin", label: "Community, Ask Medra & Notifications", desc: "Marketplace-facing community moderation, the AI assistant, and platform notifications", status: "enabled" },
  { key: "admin_my_account", app: "Admin", label: "Sessions, My Activity & Free Telehealth Visits", desc: "Personal-to-the-staffer account tools, shared with Support", status: "enabled" },

  // Support (separate app -- support.html)
  { key: "support_tickets_queue", app: "Support", label: "Support Tickets Queue", desc: "Real ticket queue with locking (can't be double-worked), canned responses, and suggested replies", status: "enabled" },
  { key: "support_sla_tracking", app: "Support", label: "SLA Tracking", desc: "Live breach detection per ticket, shown in both the queue and the ticket detail view", status: "enabled" },
  { key: "support_merge_tickets", app: "Support", label: "Merge Duplicate Tickets", desc: "Merge one ticket into another instead of working duplicates separately", status: "enabled" },
  { key: "support_escalation", app: "Support", label: "Escalation System", desc: "Escalate a ticket to Admin, Super Admin, Payment team, Safety team, Seller ops, or Rider ops -- bumps priority and shows a visible escalation banner", status: "enabled" },
  { key: "support_disputes_refunds", app: "Support", label: "Refunds & Disputes", desc: "Support's ownership of order/payment disputes, per the Admin/Support split", status: "enabled" },
  { key: "support_live_chat", app: "Support", label: "Live Chat", desc: "Real-time chat queue for customers, sellers, and riders", status: "enabled" },
  { key: "support_sos_safety", app: "Support", label: "SOS & Safety", desc: "Acknowledge and Mark Resolved actions on SOS cases", status: "enabled" },
  { key: "support_community_notifications", app: "Support", label: "Community, Ask Medra & Notifications", desc: "Support-facing community, the AI assistant, and notifications", status: "enabled" },
  { key: "support_my_account", app: "Support", label: "Sessions, My Activity & Free Telehealth Visits", desc: "Personal-to-the-staffer account tools, shared with Admin", status: "enabled" },
  { key: "support_dedicated_dashboard", app: "Support", label: "Support-specific Dashboard", desc: "Open Tickets/Live Chat/Disputes/SOS/CSAT KPIs -- rebuilt from scratch, not a copy of Admin's marketplace dashboard", status: "enabled" },

  // Customer -- games/community items added after the initial sweep
  { key: "care_package", app: "Customer", label: "Build a Care Package", desc: "Themed product bundles, plus free browsing to add any other item, added to cart together", status: "enabled" },
  { key: "reverse_auction", app: "Customer", label: "Reverse Auction (points game)", desc: "Lowest-unique / highest-unique bidding for a real point-value item -- a losing bid under 150 points forfeits the whole bid; a losing bid of 150 or more pays a 2% entry cost", status: "enabled" },
  { key: "rewards_center", app: "Customer", label: "Rewards Center", desc: "Membership, Rewards History, Loyalty Streak, Missions & Challenges, Rewards Overview, Referrals, and all games consolidated under one \ud83c\udf81 Rewards nav group instead of scattered across three separate groups", status: "enabled" },
  { key: "notifications_center", app: "Customer", label: "Notifications Center", desc: "Categorized notifications (Orders, Payments, Rewards, Healthcare, Security) with per-category mute preferences -- replaces the old static \"Notifications: Enabled\" settings row", status: "enabled" },
  { key: "dispute_center", app: "Customer", label: "Dispute Center", desc: "Consolidated Help & Disputes flow -- Order problem (with subtype), Seller issue, Rider issue, Payment issue, or Refund request all create one ticket type that tracks Customer -> Admin -> Seller/Rider -> Resolution", status: "enabled" },
  { key: "account_center", app: "Customer", label: "Account Center", desc: "One organized hub (Personal, Orders, Rewards, Healthcare, Preferences, Support) linking out to real existing screens instead of hunting through the sidebar", status: "enabled" },
  { key: "favorite_stores", app: "Customer", label: "Favorite Stores", desc: "Favorite any seller's storefront and find them again in one list, filterable to just pharmacies", status: "enabled" },
  { key: "about_page", app: "Customer", label: "About Medra", desc: "Mission blurb, team, and links to Terms/Privacy", status: "enabled" },
  { key: "household", app: "Customer", label: "Household", desc: "Invite household members (mock invite, pending/active status) and manage shared shopping lists with checkable items", status: "enabled" },
  { key: "meal_planner", app: "Customer", label: "Meal Planner", desc: "Plan meals across the week by slot (Breakfast/Lunch/Dinner), searching real products into each slot, then add the whole week's grocery list to cart in one tap", status: "enabled" },
  { key: "wallet_ledger", app: "Customer", label: "Wallet Transaction Ledger", desc: "Every wallet transaction now carries a real ID, type (Top-up/Purchase/Refund/Referral/Membership/etc.), status, and reference -- not just a label and amount. Reflected in both the Wallet screen and CSV export.", status: "enabled" },
  { key: "wishlist", app: "Customer", label: "Wishlist", desc: "Save products for later, with price-drop and back-in-stock alerts", status: "enabled" },
  { key: "gift_guide", app: "Customer", label: "Gift Guide", desc: "Curated gift picks by occasion/recipient", status: "enabled" },
  { key: "community_giving", app: "Customer", label: "Community & Giving", desc: "Gift & Donate, Support a Vendor, Good Deed Challenges, Cause of the Month, Community Requests", status: "enabled" },
  { key: "community_messaging", app: "Customer", label: "Community & Messaging", desc: "Private Messages, public Community feed, and Medra AI Chat", status: "enabled" },
  { key: "product_drafts_wishgoals", app: "Customer", label: "Product Drafts & Wish Goals", desc: "Save an in-progress cart as a draft; set a savings goal toward a specific product", status: "enabled" },
  { key: "addresses_payment_settings", app: "Customer", label: "Addresses, Payment Methods & Settings", desc: "Manage delivery addresses, saved cards, and app preferences (theme, text size, language, dark mode)", status: "enabled" },
  { key: "subscriptions", app: "Customer", label: "Subscriptions", desc: "Recurring product subscriptions with pause/skip/cancel", status: "enabled" },
  { key: "changelog_whats_new", app: "Customer", label: "What's New", desc: "Real, dated changelog of updates to the app", status: "enabled" },
  { key: "wishlist_bulk_add", app: "Customer", label: "Wishlist bulk add-to-cart", desc: "One tap adds every wishlisted item to your cart", status: "enabled" },
  { key: "abandoned_cart_reminder", app: "Customer", label: "Abandoned Cart Reminder", desc: "A one-time nudge notification if items sit in your cart for a while without checking out", status: "enabled" },
  { key: "csat_ticket_survey", app: "Customer", label: "CSAT Survey on Resolved Tickets", desc: "Self-service \u201cMark as resolved\u201d on a dispute ticket reveals a real 1-5 star rating prompt, feeding the CSAT number Support already tracks", status: "enabled" },
  { key: "duplicate_account_check", app: "Sign In / Sign Up", label: "Duplicate Account Detection", desc: "Signing up with an email/phone that already has an account shows a real inline error instead of silently succeeding", status: "enabled" },
  { key: "loyalty_tier_home", app: "Customer", label: "Loyalty Tier on Home", desc: "Bronze/Silver/Gold/Platinum tier and progress to the next tier now shows right on the dashboard home, not just buried in Rewards", status: "enabled" },
  { key: "report_review", app: "Customer", label: "Report a Review", desc: "Flag an inappropriate product review as a customer, next to the existing Helpful vote", status: "enabled" },
  { key: "reset_demo_data", app: "Platform-wide", label: "Reset Demo Data", desc: "A real button in Customer, Seller, and Rider settings that reloads the app -- since nothing persists beyond memory, this is a genuine full reset to seeded data", status: "enabled" },
  { key: "preview_tab_titles", app: "Platform-wide", label: "\u201c[Preview]\u201d browser tab titles", desc: "Every app's browser tab now reads [Preview] Medra -- <App> so it's identifiable even across many open tabs", status: "enabled" },
  { key: "support_auto_tagging", app: "Support", label: "Ticket Auto-Tagging", desc: "Tickets are automatically tagged (Refund/Billing/Delivery/Quality/Account) from keywords in the subject, shown right in the queue for faster triage", status: "enabled" },
  { key: "seller_retention_analytics", app: "Seller", label: "Customer Retention Analytics", desc: "Repeat customer rate, repeat customer count, and avg. orders per customer -- computed from your real tracked Customers list, not a placeholder", status: "enabled" },
  { key: "fraud_risk_flags", app: "Admin", label: "Fraud & Risk Flags", desc: "Order velocity, new-account spend spikes, address mismatches, and repeated payment failures -- with real Investigate/Dismiss/Reopen actions", status: "enabled" },
  { key: "receipt_fee_breakdown", app: "Customer", label: "Receipt Fee Breakdown", desc: "Receipts now show items subtotal, service fee, and delivery/other charges separately instead of folding everything into opaque per-item prices", status: "enabled" },
  { key: "saved_delivery_instructions", app: "Customer", label: "Saved Delivery Instructions", desc: "Set a default delivery instruction (gate code, landmark, etc.) per saved address instead of retyping it at checkout every time", status: "enabled" },
  { key: "low_margin_warning", app: "Seller", label: "Low-Margin Product Warning", desc: "Adding an optional cost field to a product shows a real margin % or a hard warning if the price would sell at a loss", status: "enabled" },
  { key: "order_prep_timer", app: "Seller", label: "Order Prep Timer", desc: "New Order Confirmations now show a live-ticking \u201cWaiting X min\u201d since payment was verified, flagged in red past 10 minutes", status: "enabled" },
  { key: "audit_center_export", app: "Super Admin", label: "Audit Center CSV Export", desc: "Export the (optionally filtered) Platform Logs / Audit Center to CSV -- was view-only before", status: "enabled" },
  { key: "admin_user_risk_score", app: "Admin", label: "User Risk Score", desc: "A composite Low/Medium/High risk score on each user's detail view, weighted heavily by suspension status -- stable across re-opens, not randomized", status: "enabled" },
  { key: "icon_button_aria_labels", app: "Platform-wide", label: "Icon-Only Button Accessibility", desc: "Icon-only buttons (notifications, cart, wishlist, messages, attach photo, call) across all 6 apps now carry a real aria-label for screen readers", status: "enabled" },
  { key: "category_commission_overrides", app: "Super Admin", label: "Category-Level Commission Overrides", desc: "Set a different commission rate for a specific category (e.g. Pharmacy) instead of only having one platform-wide rate", status: "enabled" },
  { key: "staff_offline_banner", app: "Platform-wide", label: "Offline Detection for Staff Apps", desc: "Admin, Support, and Super Admin now show a real offline banner (matching Customer's existing one), noting that sensitive actions are paused until reconnected", status: "enabled" },
  { key: "session_ip_logging", app: "Platform-wide", label: "Session IP Logging", desc: "Sessions & Devices now shows an IP address per session alongside device and location, across Admin, Support, and Super Admin", status: "enabled" },
  { key: "rider_monthly_goal", app: "Rider", label: "Monthly Earnings Goal", desc: "A second, independently editable monthly goal alongside the existing weekly one, for riders who think monthly", status: "enabled" },
  { key: "multi_admin_approval", app: "Super Admin", label: "Multi-Admin Approval", desc: "Manual wallet adjustments of \u20a620,000+ now require a second Super Admin's approval before taking effect, shown in a real \u201cAwaiting second approval\u201d queue", status: "enabled" },
  { key: "permission_matrix_export", app: "Super Admin", label: "In-App Permission Matrix Export", desc: "Export the live, currently-configured department permission matrix to CSV directly from Team & Staff -- reflects real toggle state, not just the static reference doc", status: "enabled" },
  { key: "commission_engine_diff_view", app: "Super Admin", label: "\u201cWhat Changed\u201d Diff View", desc: "Commission Engine now shows a real before/after summary of every unsaved change before you hit Save", status: "enabled" },
  { key: "push_permission_mock", app: "Customer", label: "Push Notification Permission Flow", desc: "A real one-time Allow/Not now prompt after onboarding, with the resulting status shown and changeable from the Notifications Center", status: "enabled" },
  { key: "rider_route_preview", app: "Rider", label: "Route Preview Before Accepting", desc: "A pickup-to-drop-off route thumbnail with approx. distance and time, viewable before committing to a delivery", status: "enabled" },
  { key: "seller_peak_hours", app: "Seller", label: "Peak Order Hours", desc: "A real hour-by-hour order-volume bar chart so you know when to staff up, mirroring Rider's Busy Zones concept", status: "enabled" },
  { key: "feature_rollout_history", app: "Super Admin", label: "Feature Rollout History & Rollback", desc: "Every rollout percentage change is now tracked, with a one-click Roll back to the previous value", status: "enabled" },
  { key: "empty_state_audit", app: "Admin", label: "Clearer Empty States", desc: "Several \u201cNo data yet\u201d messages (search, broadcasts, scheduled reports, View-As log) now explain what will actually appear there instead of a bare one-liner", status: "enabled" },
  { key: "breadcrumbs_nested_screens", app: "Platform-wide", label: "Breadcrumbs on Nested Screens", desc: "Editing a specific admin (Team & Staff) or viewing a specific user (Admin) now shows a real breadcrumb trail, not just a bare modal title", status: "enabled" },
  { key: "guest_browsing", app: "Customer", label: "Guest Browsing", desc: "Browse the Shop and view products without an account. Adding to cart, wishlist, or checking out prompts a real \u201clog in to continue\u201d modal instead of silently failing or being unreachable.", status: "enabled" },
  { key: "unified_toast_system", app: "Customer", label: "Unified Toast System", desc: "A real, reusable toast/snackbar component -- wired into saving delivery instructions, adding an address, and bulk-adding to cart from Wishlist/Meal Planner. Foundation ready to extend to more actions.", status: "enabled" },
  { key: "admin_bulk_user_import", app: "Admin", label: "Bulk User Import (CSV)", desc: "Import multiple users from a CSV (Name, Email columns), skipping duplicates by email -- mirrors Seller's product bulk upload pattern", status: "enabled" },
  { key: "admin_bulk_seller_import", app: "Admin", label: "Bulk Seller Import (CSV)", desc: "Import multiple active sellers from a CSV (Name, Category columns), skipping duplicates by name", status: "enabled" },
  { key: "order_history_amount_filter", app: "Customer", label: "Order History Amount Filter", desc: "Filter My Orders by min/max amount, alongside the existing search and status filters", status: "enabled" },
  { key: "seller_return_reason_analytics", app: "Seller", label: "Return & Refund Reason Analytics", desc: "Real breakdown of return reasons and your most-returned item, computed from actual return records", status: "enabled" },
  { key: "subscription_vacation_mode", app: "Customer", label: "Subscription Pause / Vacation Mode", desc: "Pause an individual subscription or all of them at once instead of only being able to cancel -- a paused subscription won't be chargeable until resumed", status: "enabled" },
  { key: "admin_refund_reason_trends", app: "Admin", label: "Refund Reason Trends", desc: "A real breakdown of dispute reasons across both open and resolved disputes, with approve/deny counts per reason", status: "enabled" },
  { key: "admin_seller_onboarding_funnel", app: "Admin", label: "Seller Onboarding Funnel", desc: "Applied \u2192 Pending review \u2192 Live counts, computed from the real vendor applications and active sellers data", status: "enabled" },
  { key: "financial_transactions_merge", app: "Platform-wide", label: "Financial Transactions (merged)", desc: "Payments, Wallet Top-ups, and Transaction Log merged into one tabbed \u201cFinancial Transactions\u201d screen in Admin and Super Admin -- deepened from static tables into real searchable ones. Wallet Transactions (manual adjustment tool) kept separate given its multi-admin approval workflow.", status: "enabled" },
  { key: "payouts_merge", app: "Super Admin", label: "Payouts (merged)", desc: "Payout Requests and Payouts & Settlements merged into one \u201cPayouts\u201d screen with Requests / Settlement History tabs", status: "enabled" },
  { key: "dispute_workflow_relabel", app: "Customer", label: "Dispute Stage Track: corrected workflow", desc: "The stage tracker said \u201cWith Admin\u201d, which was wrong -- Support owns customer disputes, not Admin. Relabeled to \u201cWith Support\u201d and added a \u201cFinance Review\u201d stage matching the real escalation path for high-value refunds.", status: "enabled" },
  { key: "view_as_reason_required", app: "Super Admin", label: "View As: reason required + auto-expiration", desc: "Every View-As session now requires a typed reason before it starts (recorded in the audit log and CSV export), and auto-expires after 10 minutes instead of running indefinitely", status: "enabled" },
  { key: "staff_performance_rebuild", app: "Super Admin", label: "Staff Performance (rebuilt)", desc: "Was a pure tickets-resolved leaderboard, ranked #1-N -- rewards closing fast over closing well. Rebuilt as unranked Staff Performance with balanced signals: first response time, resolution time, reopen rate, CSAT, escalation rate, SLA compliance.", status: "enabled" },
  { key: "support_messages_deepened", app: "Support", label: "Support Messages (deepened)", desc: "Was a static 3-row demo list with no way to actually reply -- now a real inbox: thread list, unread badges, conversation view, reply box, and the same AI-suggested-reply helper Live Chat has", status: "enabled" },
  { key: "superadmin_support_oversight", app: "Super Admin", label: "Support Oversight (deepened)", desc: "Live Chat and Support Messages nav items were static demo lists with zero real content -- rebuilt as a real two-tab oversight view of Support's queues, scoped as monitoring rather than duplicating Support's own working tools", status: "enabled" },
  { key: "csv_import_column_guard", app: "Seller + Admin", label: "CSV Import: malformed-row protection", desc: "An unquoted comma in a currency-formatted price (e.g. \u20a61,500.00) silently shifted every later column, importing a product under the wrong name at the wrong price with no warning. Now detected and skipped with a clear reason, across Seller's product import and Admin's user/seller/rider imports.", status: "enabled" },
  { key: "rider_tip_breakdown", app: "Rider", label: "Tip History Breakdown", desc: "Tips are broken out separately from base delivery earnings in a real weekly chart, not folded invisibly into the daily total", status: "enabled" },
  { key: "command_palette_orders_tickets", app: "Super Admin", label: "Command Palette: Orders & Tickets", desc: "Global search now also covers Orders and Tickets, not just Users/Riders", status: "enabled" },
  { key: "staff_changelog_admin_support", app: "Platform-wide", label: "What's New (Staff) for Admin & Support", desc: "Super Admin already had a staff changelog -- Admin and Support now have their own, with accurate, role-relevant recent updates", status: "enabled" },
  { key: "command_palette_recent", app: "Super Admin", label: "Command Palette: Recently Used", desc: "The last 5 things you jumped to now show first under a \u201cRecent\u201d heading when the search box is empty", status: "enabled" },
  { key: "grocery_nutrition_info", app: "Customer", label: "Nutrition Info on Grocery Items", desc: "Estimated calories/protein/carbs/fat shown on grocery product pages, clearly labeled as illustrative pending real per-product data", status: "enabled" },
  { key: "custom_role_creation", app: "Super Admin", label: "Custom Role Creation", desc: "Add a department/role beyond the 4 fixed ones (Admin/Payment Staff/Support Staff/Content Moderator) -- it gets its own row in the permission matrix and shows up when assigning a new admin", status: "enabled" },
  { key: "admin_payouts_print", app: "Admin", label: "Payouts & Settlements Print Report", desc: "A real \u201cPrint report\u201d button with a proper print stylesheet -- the on-screen chrome hides and a clean report header appears, mirroring the Customer receipt pattern", status: "enabled" },
  { key: "reorder_from_seller", app: "Customer", label: "Reorder From This Seller", desc: "A storefront now shows a real \u201cReorder your last order from here\u201d button when you've bought from that seller before", status: "enabled" },
  { key: "support_ticket_forecast", app: "Support", label: "Ticket Volume Forecast", desc: "A weekly ticket-volume chart with a simple trend-based estimate for tomorrow and a suggested agent headcount -- explicitly labeled as a basic estimate, not a real forecasting model", status: "enabled" },
  { key: "demo_anonymization", app: "Super Admin", label: "Demo Mode (Data Anonymization)", desc: "A real toggle that masks real-looking names and emails in the Users table for screen-sharing/demos -- off by default, doesn't touch underlying data, and currently covers the Users list (not yet every screen)", status: "enabled" },
  { key: "scheduled_audit_export", app: "Super Admin", label: "Scheduled Recurring Export", desc: "Schedule the Audit Center export to run Daily/Weekly/Monthly to an email address, alongside the existing one-off Export CSV", status: "enabled" },
  { key: "rider_batch_route_order", app: "Rider", label: "Suggested Route Order for Batched Stops", desc: "When you've batched multiple orders together, a real nearest-first suggested visiting order now shows, computed from each stop's actual distance", status: "enabled" },
  { key: "default_payment_card", app: "Customer", label: "Default Payment Card", desc: "Mark one saved card as default -- it's now preferred automatically for wallet top-ups, and shown with a real \u201cDefault\u201d badge", status: "enabled" },
  { key: "live_chat_typing_indicator", app: "Support", label: "Live Chat Typing Indicator", desc: "A \u201cCustomer is typing...\u201d indicator appears briefly after you send a reply -- simulated (no live customer connection in this prototype), demonstrating the UX pattern", status: "enabled" },
  { key: "admin_bulk_order_status", app: "Admin", label: "Bulk Order Status Update", desc: "Select multiple orders in the ledger and change their status all at once, instead of one at a time", status: "enabled" },
  { key: "admin_user_ltv", app: "Admin", label: "Estimated Customer LTV", desc: "A real (if estimated) lifetime-value figure now shows on each user's detail view, alongside the existing risk score", status: "enabled" },
  { key: "support_sla_auto_escalation", app: "Support", label: "SLA Auto-Escalation", desc: "Any ticket already past its SLA target when the queue loads is automatically escalated to Support Lead, instead of relying on someone noticing and escalating it manually", status: "enabled" },
  { key: "admin_bulk_rider_import", app: "Admin", label: "Bulk Rider Import (CSV)", desc: "Import multiple riders from a CSV (Name, Vehicle columns) -- completes bulk import across Users, Sellers, and now Riders", status: "enabled" },
  { key: "seller_supplier_contacts", app: "Seller", label: "Supplier Contacts on Reorder Suggestions", desc: "Low-stock reorder suggestions now show the actual supplier name and contact for that product, not just a generic \u201csend a note\u201d", status: "enabled" },
  { key: "incident_postmortem", app: "Super Admin", label: "Incident Postmortem Tracker", desc: "Any System Health incident (including ones auto-filed from Platform Tools diagnostics) can now get a real postmortem -- root cause, resolution, follow-up actions -- which marks it resolved", status: "enabled" },
  { key: "rider_time_of_day_demand", app: "Rider", label: "Time-of-Day Demand Pattern", desc: "Busy Zones now also shows typical demand by time of day (Morning/Midday/Afternoon/Evening/Night), highlighting the current block, separate from the live per-zone snapshot", status: "enabled" },
  { key: "seller_store_loyalty", app: "Seller", label: "Store Loyalty Program", desc: "A real stamp-card loyalty program separate from platform-wide points -- set a \u201cbuy X, get 1 free\u201d threshold and see real customer progress toward it", status: "enabled" },
  { key: "support_knowledge_base", app: "Support", label: "Knowledge Base", desc: "A real, searchable library of full reference articles (refund process, escalation criteria, de-escalation, access boundaries, SOS checklist) -- distinct from canned responses, which are just short reply text", status: "enabled" },
  { key: "promotions_ab_testing", app: "Super Admin", label: "A/B Testing for Promotions", desc: "Run a real two-variant test on any promotion, compare conversions/revenue per variant, and end the test keeping whichever won", status: "enabled" },
  { key: "combined_preview_activity_feed", app: "Platform-wide", label: "Cross-App Activity Feed (Combined Preview)", desc: "A real toggleable log in the Combined Preview shell tracking tab switches and orders placed across all 7 apps in one session -- useful for someone demoing or holding multiple account types", status: "enabled" },
  { key: "admin_seller_performance_grade", app: "Admin", label: "Seller Performance Scorecard", desc: "A composite A-D letter grade combining rating, cancellation rate, and response time into one number on each seller's detail view", status: "enabled" },
  { key: "rider_weather_demand", app: "Rider", label: "Weather-Based Demand Reference", desc: "A real reference table showing typical demand multipliers by weather condition (rain, heat, haze), explicitly labeled as a reference table since there's no live weather feed in this prototype", status: "enabled" },
  { key: "data_retention_policy", app: "Super Admin", label: "Data Retention Policy", desc: "Set how long each record type (audit logs, tickets, order history, wallet transactions, chat transcripts, session logs) is kept -- config UI ready for a real enforcement backend", status: "enabled" },
  { key: "feature_flag_dependencies", app: "Super Admin", label: "Feature Flag Dependency Mapping", desc: "Real dependencies between features that are actually built to depend on each other (Commission Engine's diff view and category overrides; Promotions' A/B testing) -- can't enable a dependent without its prerequisite, or disable a prerequisite while something still depends on it", status: "enabled" },
  { key: "superadmin_categories_interactive", app: "Super Admin", label: "Categories (interactive)", desc: "Add, rename, and delete platform-wide product categories -- was a static read-only list since early in this build, finally made real", status: "enabled" },
  { key: "delivery_zone_management", app: "Admin", label: "Delivery Zone Management (interactive)", desc: "Add zones and toggle their active status -- was a static read-only list since early in this build. Also added to Super Admin.", status: "enabled" },
  { key: "feature_status_dropdown", app: "Super Admin", label: "Feature Status: explicit dropdown", desc: "Changed from a blind \u201cCycle status\u201d button to a real dropdown showing exactly which status you're picking, before you pick it", status: "enabled" },
  { key: "command_palette_recent_all_staff", app: "Platform-wide", label: "Command Palette Recent (Admin & Support)", desc: "The \u201cRecent\u201d section was Super Admin only -- now Admin and Support have it too, for full consistency", status: "enabled" },
  { key: "bulk_import_error_detail", app: "Admin", label: "Bulk Import: Per-Row Error Detail", desc: "CSV imports (Users/Sellers/Riders) now show exactly which rows were skipped and why (missing data vs. duplicate), in an expandable list -- not just a bare skip count", status: "enabled" },
  { key: "admin_batch_kyc_approval", app: "Admin", label: "Batch KYC Approval", desc: "Select multiple pending KYC applications and approve or reject them all at once, instead of one at a time", status: "enabled" },
  { key: "idle_warning_window_extended", app: "Platform-wide", label: "Idle Warning: 3 minutes, not 1", desc: "The idle-timeout warning across Admin, Support, and Super Admin now gives 3 minutes' notice before signing you out, up from 1 -- enough time to actually finish what you're doing", status: "enabled" },
  { key: "dismissible_prototype_notes", app: "Super Admin", label: "Dismissible Prototype Notes", desc: "The \u201cthis doesn't touch a real backend yet\u201d disclaimers across 7 config screens are now a real dismissible component instead of permanent full-width text on every visit", status: "enabled" },
  { key: "seller_slow_moving_inventory", app: "Seller", label: "Slow-Moving Inventory Report", desc: "Flags items with more stock than their estimated sales pace justifies -- the mirror image of the existing low-stock alerts", status: "enabled" },
  { key: "rider_frequent_pickups", app: "Rider", label: "Frequent Pickup Locations", desc: "Real vendor pickup frequency from order history, with an editable note per location for parking/entrance/contact quirks", status: "enabled" },
  { key: "reset_button_clarity", app: "Platform-wide", label: "Reset Demo Data: clearer label", desc: "Button now reads \u201cReset demo data (reloads this page)\u201d across Customer/Seller/Rider so it's not mistaken for an in-app soft reset", status: "enabled" },
  { key: "toast_safe_area", app: "Customer", label: "Toast Position: safe-area aware", desc: "Toasts now respect the device's safe-area-inset-bottom (notched phones) and cap their width so they can't overflow narrow screens", status: "enabled" },
  { key: "customer_store_loyalty_view", app: "Customer", label: "Store Loyalty Card (customer-facing)", desc: "Storefronts that run a loyalty program now show your real stamp progress -- computed from your actual order count at that store -- not just visible to the seller", status: "enabled" },
  { key: "escalation_requires_reason", app: "Support", label: "Escalation Requires a Reason", desc: "Escalating a ticket now requires a short reason, shown alongside who escalated it and when -- both manual and auto-escalations carry a reason now", status: "enabled" },
  { key: "score_methodology_tooltips", app: "Admin", label: "Score Methodology Tooltips", desc: "Risk score, LTV, and seller performance grade now have an inline tooltip explaining exactly how each is calculated, instead of only being documented in code comments", status: "enabled" },
  { key: "consistent_severity_colors", app: "Admin", label: "Consistent Severity Color Scale", desc: "Fraud & Risk Flags severity was using mismatched status-pill colors (low severity showing as blue) -- now uses the exact same red/amber/green scale as User Risk Score", status: "enabled" },
  { key: "canned_response_kb_links", app: "Support", label: "Canned Responses \u2194 Knowledge Base", desc: "Picking a canned response that has a matching KB article now shows a real inline link to it -- previously two disconnected systems", status: "enabled" },
  { key: "impersonation_session_timer", app: "Super Admin", label: "View As: live session timer", desc: "The \u201cViewing as X\u201d banner in Combined Preview now shows real elapsed time (MM:SS), ticking live, so an impersonation session is never ambiguous about how long it's been active", status: "enabled" },
  { key: "seller_weekly_digest_slow_movers", app: "Seller", label: "Weekly Digest: Real Slow Movers", desc: "Flags products with real stock on hand but zero actual sales this week, computed from real order line items -- distinct from Analytics' estimated slow-mover report, which uses a velocity projection instead of real sales data", status: "enabled" },
  { key: "audit_center_actor_filter", app: "Super Admin", label: "Audit Center: filter by staff member", desc: "Filter Platform Logs / Audit Center by who did it, alongside the existing type filter", status: "enabled" },
  { key: "rider_favorite_addresses", app: "Rider", label: "Favorite Addresses", desc: "Save specific pickup/drop-off spots worth remembering -- separate from Favorite Zones, which are whole neighborhoods", status: "enabled" },
  { key: "support_csat_by_category", app: "Support", label: "CSAT by Category", desc: "Satisfaction score broken out by ticket category (Refund/Billing/Delivery/Quality/Account), surfacing which type of issue is dragging the average down", status: "enabled" },
  { key: "staff_activity_leaderboard", app: "Super Admin", label: "Staff Activity Leaderboard", desc: "Ranks staff by tickets resolved and View-As sessions -- blends real actions from this session with a demonstrable baseline", status: "enabled" },
  { key: "seller_busiest_day", app: "Seller", label: "Busiest/Quietest Day Indicator", desc: "Peak Order Hours now also calls out your busiest and quietest day of the week, computed from real revenue trend data", status: "enabled" },
  { key: "admin_seller_churn_risk", app: "Admin", label: "Seller Churn Risk Flag", desc: "A real Low/Watch/High churn-risk indicator on each seller's detail view, based on recent order-volume trend", status: "enabled" },
  { key: "rider_shift_reminder_notification", app: "Rider", label: "Shift Reminder Notification (wired up)", desc: "The \u201cshift reminders\u201d toggle in Settings previously did nothing -- it now actually pushes a real notification on a day you have a confirmed shift", status: "enabled" },
  { key: "customer_price_alert_history", app: "Customer", label: "Price Alert History", desc: "Wishlist now shows a real history of past drops on items you've turned price alerts on for, not just the on/off toggle", status: "enabled" },
  { key: "support_escalation_templates", app: "Support", label: "Escalation Templates", desc: "One-click templates for the most common escalation scenarios (large refund, repeat seller complaints, safety concern, suspension needed) -- pre-fills both team and reason", status: "enabled" },
  { key: "reorder_with_modifications", app: "Customer", label: "Reorder with Modifications", desc: "A real \u201cReorder (edit first)\u201d option on past orders -- adjust quantities or drop items before they hit your cart, not just an all-or-nothing reorder", status: "enabled" },
  { key: "whats_new_spotlight", app: "Customer", label: "\u201cWhat's New\u201d Spotlight Banner", desc: "The dashboard now surfaces the most recent changelog entry as a real dismissible banner, so new features don't go unnoticed", status: "enabled" },
  { key: "rider_gear_receipt", app: "Rider", label: "Gear Marketplace Printable Receipt", desc: "Real \u201cReceipt\u201d button on any past gear order, using the same print stylesheet pattern as the Customer receipt", status: "enabled" },
  { key: "admin_complaint_patterns_by_product", app: "Admin", label: "Complaint Patterns by Product", desc: "Disputes are now tagged by product, surfacing which specific item is generating the most complaints -- not just reasons in the abstract", status: "enabled" },
  { key: "printable_shortcuts_cheatsheet", app: "Platform-wide", label: "Printable Keyboard Shortcuts", desc: "The keyboard shortcuts modal (Admin/Support/Super Admin) now has a real \u201cPrint / Save as PDF\u201d button", status: "enabled" },
  { key: "customer_delivery_photo_gallery", app: "Customer", label: "Delivery Photo Gallery", desc: "A real gallery of proof-of-delivery photos from your riders -- populated when using Combined Preview, where Rider's photo capture connects to your actual orders", status: "enabled" },
  { key: "household_spending_breakdown", app: "Customer", label: "Household Spending Breakdown", desc: "Real per-member spending bars across shared household orders -- attribution is deterministic since orders don't yet track who in the household placed them", status: "enabled" },
  { key: "free_delivery_countdown", app: "Customer", label: "Delivery Fee Rewards", desc: "Delivery is never free -- cart and checkout always show a delivery fee. Spin-the-wheel and leaderboard rewards now take a percentage off the fee instead of waiving it (the old free-delivery progress bar was removed)", status: "enabled" },
  { key: "support_draft_autosave", app: "Support", label: "Reply Draft Auto-Save", desc: "An in-progress reply now survives navigating away and back -- previously lost the moment you switched tickets or screens", status: "enabled" },
  { key: "support_shift_handoff", app: "Support", label: "Shift Handoff Notes", desc: "A real shared log for leaving context to whoever picks up the queue next -- what's in progress, what to watch, what's unresolved", status: "enabled" },
  { key: "support_ticket_reopen_tracking", app: "Support", label: "Ticket Reopening with Reason Tracking", desc: "Resolved tickets previously had no way to reopen at all -- now a real reason is required, and reopen history is tracked and shown on the ticket", status: "enabled" },
  { key: "rider_vehicle_range_filter", app: "Rider", label: "Vehicle Type & Zone Range", desc: "Set your vehicle type (bicycle/motorbike/car) in Settings -- Busy Zones now flags zones outside your typical range, computed from real average delivery distance", status: "enabled" },
  { key: "rider_distance_traveled", app: "Rider", label: "Distance Traveled Today", desc: "Shift summary now includes a real distance-traveled stat, computed from trips completed \u00d7 average delivery distance", status: "enabled" },
  { key: "access_reverse_lookup", app: "Super Admin", label: "Access Reverse Lookup", desc: "Pick a capability, see every department and individual admin that currently has it -- the reverse of the department permission matrix", status: "enabled" },
  { key: "nav_integrity_self_check", app: "Super Admin", label: "Self-Check: Navigation Integrity", desc: "Runs live against this app's actual NAV_SECTIONS/SECTION_MAP/GENERIC_CONFIG data to verify every nav item resolves to a real destination -- not a static audit, a real runtime check", status: "enabled" },
  { key: "seller_cost_tracking", app: "Seller", label: "Editable Cost Tracking on Existing Products", desc: "The optional cost field was only available when adding a NEW product -- now editable inline on any existing product, showing a real live margin percentage", status: "enabled" },
  { key: "kb_article_print", app: "Support", label: "Print a Knowledge Base Article", desc: "Any open KB article now has a real \u201cPrint this article\u201d button, using the same print-stylesheet pattern as receipts and the shortcuts cheat sheet", status: "enabled" },
  { key: "seller_new_customer_badge", app: "Seller", label: "First-Order Badge", desc: "New Orders now flags when an incoming order is a customer's real first purchase from your store, computed from your actual tracked Customers list", status: "enabled" },
  { key: "seller_fulfillment_leaderboard", app: "Seller", label: "Fulfillment Time Leaderboard", desc: "See how your response time ranks against anonymized peers in your category -- \u201cYou're #2 of 6\u201d, not just a bare number with no context", status: "enabled" },
  { key: "admin_category_migration", app: "Admin", label: "Bulk Category Migration", desc: "Select multiple products in Product Oversight and move them all to a different category at once", status: "enabled" },
  { key: "membership_recommendation_why", app: "Customer", label: "\u201cWhy This Recommendation\u201d Note", desc: "The recommended membership tier now explains the real reasoning -- based on actual order history, not just a bare \u201cRecommended for you\u201d badge", status: "enabled" },
  { key: "support_next_unresolved_shortcut", app: "Support", label: "Keyboard Shortcut: Next Unresolved Ticket", desc: "Press N to jump to the next unresolved ticket in the queue, wrapping around -- with a visible hint so it's not a hidden shortcut", status: "enabled" },
  { key: "session_export_csv", app: "Platform-wide", label: "Sessions & Devices: Export CSV", desc: "Export your session list (device, location, IP, last active) to CSV across Admin, Support, and Super Admin", status: "enabled" },
  { key: "customer_saved_searches", app: "Customer", label: "Saved Search Presets", desc: "Save your current search + category + sort as a named preset and re-apply it in one tap, instead of rebuilding the same filter every time", status: "enabled" },
  { key: "staff_compare_view", app: "Super Admin", label: "Compare Two Staff Members", desc: "Pick any two staff members and see their tickets resolved / View-As sessions / department side by side, right below the leaderboard", status: "enabled" },
  { key: "push_notification_toast_style", app: "Customer", label: "Order Status Push Simulation", desc: "The existing status-change toast now visually distinguishes itself as a simulated push notification once you've granted push permission -- ties the two systems together instead of leaving them disconnected", status: "enabled" },
  { key: "superadmin_unified_recent_search", app: "Super Admin", label: "Unified Recently-Viewed in Search", desc: "The command palette now also shows specific recently-viewed entities (a user, an order, a ticket) under their own \u201cRecently viewed\u201d heading, not just recently-visited screens", status: "enabled" },
  { key: "support_focus_mode", app: "Support", label: "Focus Mode", desc: "Hides the sidebar to give the active queue full width during a live-chat rush -- real screen-space toggle, not a separate dark theme", status: "enabled" },
  { key: "component_library_reference", app: "Super Admin", label: "Component Reference Screen", desc: "A real catalog of this app's reusable UI patterns (status pills, buttons, toggles, the shared risk/severity color scale) for consistency when building more", status: "enabled" },
  { key: "categories_draft_publish", app: "Super Admin", label: "Categories: Draft & Publish", desc: "Stage add/rename/delete changes to categories, see a real pending-changes summary, then publish them all at once or discard the draft", status: "enabled" },
  { key: "combined_preview_guided_tour", app: "Platform-wide", label: "Combined Preview Guided Tour", desc: "A real 5-step first-time walkthrough explaining what the Combined Preview demonstrates (shared login/orders, tab switching, View As) -- was suggested early in this build and never actually built until now. Replayable anytime via the tab bar.", status: "enabled" },

  // Healthcare / Telehealth
  { key: "health_symptom_checker", app: "Healthcare", label: "Symptom Checker", desc: "Guided symptom selection + free text, with keyword-based emergency detection", status: "enabled" },
  { key: "health_emergency_flow", app: "Healthcare", label: "Emergency warning & Emergency Care screen", desc: "Routes concerning symptoms away from normal booking to nearby emergency facilities", status: "enabled" },
  { key: "health_provider_marketplace", app: "Healthcare", label: "Provider marketplace & search", desc: "Browse/filter mock doctors and pharmacists -- no specialty required", status: "enabled" },
  { key: "health_appointment_booking", app: "Healthcare", label: "Appointment booking", desc: "Provider -> consult type -> date/time -> confirm -> pay -> appointment", status: "enabled" },
  { key: "health_consult_video", app: "Healthcare", label: "Video consultation", desc: "Simulated video consultation room", status: "enabled" },
  { key: "health_consult_audio", app: "Healthcare", label: "Audio consultation", desc: "Simulated audio consultation room", status: "enabled" },
  { key: "health_consult_chat", app: "Healthcare", label: "Chat consultation", desc: "Working mock chat consultation, including a picture-attached flat fee", status: "enabled" },
  { key: "health_consult_in_person", app: "Healthcare", label: "In-person appointment", desc: "Shows location/details for in-person visits", status: "enabled" },
  { key: "health_visit_pricing", app: "Healthcare", label: "Severity-scaled visit pricing", desc: "Base-to-capped fee range per provider type/consult method, scaled by symptom-count gravity", status: "enabled" },
  { key: "health_monthly_plans", app: "Healthcare", label: "Telehealth monthly plans", desc: "Basic (\u20a615,000 / 10 visits) and Plus (\u20a630,000 / 18 visits) subscriptions covering visits first", status: "enabled" },
  { key: "health_prescriptions", app: "Healthcare", label: "Prescriptions", desc: "Provider-issued prescriptions plus customer self-added prescriptions (clearly labeled)", status: "enabled" },
  { key: "health_documents", app: "Healthcare", label: "Health Records upload", desc: "Customer document upload with categories: Lab Result, Doctor's Note, Imaging, Prescription, Vaccination Record, Other", status: "enabled" },
  { key: "health_messages", app: "Healthcare", label: "Provider messaging", desc: "Paid doctor messages (500-1,000 pts), free pharmacist messages", status: "enabled" },
  { key: "health_provider_portal", app: "Healthcare", label: "Provider Portal (preview)", desc: "Single mock-provider view of appointments, messaging, and prescription creation", status: "beta" },
  { key: "health_staff_free_visits", app: "Healthcare", label: "Staff free telehealth visits", desc: "Admin/Support staff active 90+ days get 2 free telehealth visits/year, requested from Super Admin and redeemed as a voucher code", status: "enabled" },

  // Super Admin's own tools
  { key: "audit_center", app: "Super Admin", label: "Audit Center / Platform Logs", desc: "Who/what/when for sensitive actions, with previous/new value and reason where it applies. Regular Admin cannot alter these records.", status: "enabled" },
  { key: "system_health", app: "Super Admin", label: "System Health", desc: "Per-service status (auth, payments, orders, delivery, notifications, maps, healthcare, messaging) plus error/job counts -- simulated in this prototype phase.", status: "enabled" },
  { key: "admin_support_split", app: "Super Admin", label: "Admin / Support view split", desc: "Now fully separate dashboards -- Support's own file was rebuilt with a Support-relevant Overview (Open Tickets/Live Chat/Disputes/SOS/CSAT KPIs) instead of a leftover copy of Admin's marketplace dashboard, plus all dead admin-only nav/data removed.", status: "enabled" },
  { key: "promotions_interactive", app: "Super Admin", label: "Promotions & Deals (interactive)", desc: "Create, pause/activate, and delete promotions -- was a read-only table before", status: "enabled" },
  { key: "referral_config", app: "Super Admin", label: "Referral & Rewards config", desc: "Editable reward-per-referral by account type (customer/seller/rider), plus a top-referrers leaderboard -- was stats-only before", status: "enabled" },
  { key: "membership_plans_interactive", app: "Super Admin", label: "Membership Plans (interactive)", desc: "Create/edit/delete plans with monthly and annual pricing and perks -- was a read-only table before", status: "enabled" },
  { key: "kyc_interactive", app: "Super Admin", label: "KYC & Verifications (interactive)", desc: "Approve/Reject/Reopen seller and rider verification applications -- was a read-only status table before. Also fixed in Admin.", status: "enabled" },
  { key: "platform_config_interactive", app: "Super Admin", label: "Platform Configuration (interactive)", desc: "System Settings, App Settings, Delivery Settings, and Payment Methods are now real editable forms/toggles instead of static value lists", status: "enabled" },
  { key: "commission_engine_interactive", app: "Super Admin", label: "Commission Engine (interactive)", desc: "Product markup and delivery split (normal/peak hours) are now real editable rates instead of a static description list", status: "enabled" },
  { key: "sos_interactive", app: "Super Admin", label: "SOS & Safety (interactive)", desc: "Acknowledge and Mark Resolved actions on SOS cases -- was a read-only status table before. Also fixed in Support.", status: "enabled" },
  { key: "team_staff", app: "Super Admin", label: "Team & Staff", desc: "Renamed from Roles & Permissions -- staff roster (add/edit/suspend/View As) plus department permission defaults, in one place", status: "enabled" },
  { key: "platform_tools", app: "Super Admin", label: "Platform Tools", desc: "Maintenance Mode toggle and a service diagnostics test-runner (Payments/Notifications/Maps/Healthcare/Messaging/Delivery) -- simulated pass/fail until a real backend exists to ping", status: "enabled" },
  { key: "diagnostics_incident_link", app: "Super Admin", label: "Diagnostics -> System Health Incidents", desc: "A failed Platform Tools diagnostic test now auto-files a real incident, shown in a dedicated panel on the System Health screen", status: "enabled" },
  { key: "countries_regions", app: "Super Admin", label: "Countries & Regions", desc: "Real country and state-level availability toggles (Nigeria/Ghana/Kenya seeded)", status: "enabled" },
  { key: "wallet_adjustment", app: "Super Admin", label: "Manual Wallet Adjustment", desc: "A real modal for crediting/debiting a user's wallet, with a required reason", status: "enabled" },
  { key: "feature_rollout_slider", app: "Super Admin", label: "Feature Rollout Percentage Slider", desc: "Gradually roll a feature out to a percentage of users, not just on/off", status: "enabled" },
  { key: "view_as_banner_exit", app: "Super Admin", label: "View As -- banner & one-click exit", desc: "A persistent \u201cViewing as X\u201d banner in the combined preview shell with a one-click Exit, so an impersonation session is never ambiguous", status: "enabled" },
  { key: "requires_badges", app: "Super Admin", label: "\u201cRequires X\u201d role badges", desc: "Sensitive screens (Commission Engine, Countries & Regions, Wallet Transactions, Free Telehealth Visit Requests) now show who's actually allowed to act on them", status: "enabled" },
  { key: "live_daterange_filter", app: "Platform-wide", label: "Live date-range filtering", desc: "The date-range picker on Admin and Super Admin dashboards now actually scales revenue/order KPIs (Today/Last 7 days/Last 30 days/etc.) instead of just relabeling the button. Snapshot metrics like Total Users are deliberately left unscaled.", status: "enabled" },
  { key: "idle_timeout_logout", app: "Platform-wide", label: "Idle-timeout auto-logout", desc: "Admin, Support, and Super Admin now sign a staffer out automatically after 15 minutes of no activity, with a 1-minute warning banner first", status: "enabled" },
  { key: "staff_2fa", app: "Platform-wide", label: "Staff 2FA on every sign-in", desc: "Admin and Support now require a 6-digit authentication code step at login, matching what Super Admin already had -- previously only Super Admin had it", status: "enabled" },
  { key: "bulk_action_confirmation", app: "Admin", label: "Bulk action confirmation", desc: "Bulk suspend/unsuspend on Users now requires a confirmation step and a reason before it executes, matching the single-user flow", status: "enabled" },
  { key: "notfound_fallback", app: "Platform-wide", label: "\u201cScreen not available\u201d fallback", desc: "Every app now shows a real message instead of a blank screen if a navigation key doesn't resolve to anything", status: "enabled" },
  { key: "global_command_palette", app: "Platform-wide", label: "Global Command Palette (Cmd+K)", desc: "Admin, Support, and Super Admin can all search across nav items plus Users/Sellers/Riders data from one search box", status: "enabled" },
  { key: "prototype_save_disclosure", app: "Platform-wide", label: "Honest \u201cprototype save\u201d labeling", desc: "Config screens with no backend yet say \u201cSaved for this preview\u201d and carry an explicit note that saving doesn't change real behavior elsewhere -- not a bare, misleading \u201cSaved\u201d", status: "enabled" },
];

const DATE_PRESETS = ["Today", "Yesterday", "Last 7 days", "Aug 12 - Aug 19, 2026", "Last 30 days", "This month"];

const NOTIF_LIST = [
  { icon: AlertTriangle, color: "#DC2626", title: "New dispute filed", sub: "Order O5540 -- Priya M.", time: "4 min ago", goTo: "disputes" },
  { icon: Store, color: "#2563EB", title: "Vendor application received", sub: "Wildflower Bakehouse", time: "2 hrs ago", goTo: "sellers" },
  { icon: Wallet, color: "#16A34A", title: "Payout batch completed", sub: "312 vendors paid out", time: "5 hrs ago", goTo: "payouts" },
  { icon: UserCog, color: "#7C3AED", title: "New admin created", sub: "superadmin@medra.com", time: "1 day ago", goTo: "roles-permissions" },
];

/* ============================================================
   NAV -- full categorized menu from spec
   ============================================================ */

const NAV_SECTIONS = [
  { label: "Platform", items: [
    { key: "feature-marketplace", label: "Feature Marketplace", icon: Store },
    { key: "feature-rollout", label: "Feature Rollouts", icon: Percent },
    { key: "feature-toggles", label: "Feature Toggles", icon: ToggleLeft },
    { key: "feature-availability", label: "Feature Availability by City", icon: MapPin },
    { key: "countries-regions", label: "Countries & Regions", icon: Globe },
    { key: "categories", label: "Categories", icon: LayoutGrid },
    { key: "delivery-mgmt", label: "Delivery Zones", icon: Navigation },
  ]},
  { label: "People & Access", items: [
    { key: "roles-permissions", label: "Platform Staff & Roles", icon: Lock },
    { key: "staff-leaderboard", label: "Staff Performance", icon: Award },
  ]},
  { label: "Marketplace", items: [
    { key: "users", label: "Users", icon: Users },
    { key: "sellers", label: "Sellers / Stores", icon: Store },
    { key: "riders", label: "Riders / Drivers", icon: Truck },
    { key: "products", label: "Products", icon: Package },
    { key: "orders", label: "Orders", icon: ClipboardList },
    { key: "kyc", label: "KYC & Verifications", icon: BadgeCheck },
  ]},
  { label: "Finance", items: [
    { key: "payments", label: "Financial Transactions", icon: CreditCard },
    { key: "payouts", label: "Payouts", icon: Wallet },
    { key: "wallet-tx", label: "Wallet Transactions", icon: ArrowLeftRight },
    { key: "commission-engine", label: "Commission Engine", icon: Settings2 },
    { key: "disputes", label: "Refund Oversight & Disputes", icon: AlertTriangle },
    { key: "payment-verifications", label: "Payment Verifications", icon: BadgeCheck },
    { key: "fraud-watchlist", label: "Fraud Watchlist", icon: ShieldAlert },
    { key: "revenue-sources", label: "Revenue by Source", icon: TrendingUp },
  ]},
  { label: "Support", items: [
    { key: "tickets", label: "Support Tickets", icon: LifeBuoy, badge: 4 },
    { key: "live-chat", label: "Live Chat", icon: MessageCircle, badge: 3 },
    { key: "support-messages", label: "Support Messages", icon: Mail, badge: 3 },
    { key: "sos", label: "SOS & Safety", icon: ShieldAlert, badge: 3 },
    { key: "moderation", label: "Reports & Moderation", icon: Flag },
    { key: "notifications", label: "Notifications", icon: Bell, badge: 4 },
    { key: "free-visit-approvals", label: "Free Telehealth Visit Requests", icon: Cross },
    { key: "ai-assistant", label: "Ask Medra", icon: Sparkles },
  ]},
  { label: "Growth", items: [
    { key: "promotions", label: "Promotions & Deals", icon: Tag },
    { key: "referral", label: "Referral & Rewards", icon: Gift },
    { key: "membership", label: "Membership Plans", icon: Crown },
    { key: "announcements", label: "Announcements", icon: Megaphone },
    { key: "community", label: "Community", icon: Users },
    { key: "broadcast", label: "Broadcast Message", icon: Send },
    { key: "faq-editor", label: "Landing Page FAQ", icon: HelpCircle },
    { key: "giveaway-control", label: "Monthly Giveaway", icon: PartyPopper },
    { key: "challenge-control", label: "Community Challenges", icon: Target },
    { key: "lottery-draw", label: "Weekly Lottery Draw", icon: Medal },
    { key: "benefactor-control", label: "Benefactor & Care Pool", icon: Heart },
  ]},
  { label: "Analytics", items: [
    { key: "reports", label: "Reports", icon: FileBarChart },
    { key: "analytics", label: "Analytics", icon: TrendingUp },
  ]},
  { label: "System", items: [
    { key: "system-settings", label: "Platform Settings", icon: Settings },
    { key: "payment-methods", label: "Payment Settings", icon: CreditCard },
    { key: "delivery-settings", label: "Delivery Settings", icon: Truck },
    { key: "app-settings", label: "App Settings", icon: SlidersHorizontal },
    { key: "data-retention", label: "Data Retention", icon: Database },
    { key: "platform-tools", label: "Platform Tools", icon: Wrench },
    { key: "platform-logs", label: "Audit Center", icon: Activity },
    { key: "system-health", label: "System Health", icon: Server },
  ]},
  { label: "My Account", items: [
    { key: "sessions", label: "My Sessions", icon: Monitor },
    { key: "my-activity", label: "My Activity", icon: History },
  ]},
  { label: "Internal Tools", items: [
    { key: "changelog", label: "What's New (Staff)", icon: Sparkles },
    { key: "unified-feed", label: "Recently Updated", icon: Rss },
    { key: "component-library", label: "Component Reference", icon: LayoutGrid },
  ]},
];

// Every nav key routes somewhere real -- a handful get bespoke screens
// (mapped below), everything else renders through GenericScreen with
// content shaped to what that item actually is.
const GENERIC_CONFIG = {
  products: { type: "table", title: "Products", cols: ["Product", "Category", "Price", "Stock"], rows: [["Wireless Earbuds Pro", "Electronics", "₦7,999", "24"], ["Espresso Machine", "Home", "₦24,900", "9"], ["Running Sneakers", "Fashion", "₦8,999", "31"]] },
};

/* ============================================================
   SHARED PIECES
   ============================================================ */

function Logo({ tagline, badge, dark }) {
  return (
    <div className="brand-logo">
      <img src="data:image/png;base64,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" alt="Medra" style={{ height: 30, width: "auto", flexShrink: 0 }} />
      <div>
        <div className={`brand-word ${dark ? "on-dark" : ""}`}>medra{badge && <ShieldCheck size={13} className="brand-badge" />}</div>
        {tagline && <div className={`brand-tag ${dark ? "on-dark" : ""}`}>{tagline}</div>}
      </div>
    </div>
  );
}

function Sparkline({ data, color }) {
  const w = 100, h = 30;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrototypeNote({ children }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="muted small" style={{ marginBottom: 12, fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "6px 8px" }}>
      <span style={{ flex: 1 }}>Prototype note: {children}</span>
      <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", flexShrink: 0, lineHeight: 1 }} aria-label="Dismiss note"><X size={12} /></button>
    </div>
  );
}

function EmptyStateNote({ children }) {
  return <div className="empty-note"><Inbox size={20} style={{ opacity: 0.4, marginBottom: 6 }} /><div>{children}</div></div>;
}

function KpiCard({ k, comparePeriod }) {
  const Icon = k.icon;
  const showMonth = comparePeriod === "month";
  const delta = showMonth ? (k.deltaMonth || k.delta) : k.delta;
  const label = showMonth ? "vs last month" : "vs last 7 days";
  return (
    <div className="kpi-card enter">
      <div className="kpi-icon" style={{ background: k.bg, color: k.fg }}><Icon size={18} /></div>
      <div className="kpi-label">{k.label}</div>
      <div className="kpi-value">{k.value}</div>
      <div className={`kpi-delta ${k.up ? "up" : "down"}`}>{k.up ? <ArrowUp size={11} /> : <ArrowDown size={11} />} {delta} <span className="kpi-delta-sub">{label}</span></div>
      <div className="kpi-spark"><Sparkline data={k.spark} color={k.sparkColor} /></div>
    </div>
  );
}

function DonutPanel({ title, centerVal, centerLabel, data, onView }) {
  return (
    <div className="panel enter">
      <div className="panel-title-row"><div className="panel-title">{title}</div><button className="link-btn" onClick={onView}>View All</button></div>
      <div className="donut-row">
        <div className="donut-wrap">
          <PieChart width={128} height={128}>
            <Pie data={data} dataKey="value" cx={64} cy={64} innerRadius={40} outerRadius={60} paddingAngle={2} stroke="none">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
          <div className="donut-center"><div className="donut-num">{centerVal}</div><div className="muted">{centerLabel}</div></div>
        </div>
        <div className="donut-legend">
          {data.map((d) => (
            <div className="legend-row" key={d.name}>
              <span className="legend-dot" style={{ background: d.color }} />
              <span className="legend-name">{d.name}</span>
              <span className="legend-val">{d.display}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusPillClass(cell) {
  if (typeof cell !== "string") return null;
  const done = ["active", "verified", "settled", "resolved", "delivered", "paid", "completed"];
  const route = ["en route", "out for delivery", "shipped"];
  const prep = ["preparing", "processing", "pending review", "scheduled"];
  const delay = ["flagged", "pending", "suspended", "warn", "cancelled", "canceled", "rejected"];
  const lc = cell.toLowerCase();
  if (done.includes(lc)) return "done";
  if (route.includes(lc)) return "route";
  if (prep.includes(lc)) return "prep";
  if (delay.includes(lc)) return "delay";
  return null;
}

const SHORTCUTS = [
  { keys: ["⌘/Ctrl", "K"], desc: "Open quick jump (search any section)" },
  { keys: ["?"], desc: "Show this shortcuts list" },
  { keys: ["Esc"], desc: "Close any open modal or panel" },
  { keys: ["↑", "↓"], desc: "Move through quick jump results" },
  { keys: ["Enter"], desc: "Select the highlighted quick jump result" },
];

function ShortcutsModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close no-print" onClick={onClose}><X size={16} /></button>
        <div id="shortcuts-printable">
          <div className="card-name" style={{ fontSize: 16, marginBottom: 14 }}>Keyboard shortcuts</div>
          <div className="list-col">
            {SHORTCUTS.map((s, i) => (
              <div key={i} className="cat-top">
                <span className="muted">{s.desc}</span>
                <span style={{ display: "flex", gap: 4 }}>{s.keys.map((k) => <span key={k} className="cmdk-kbd">{k}</span>)}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="ghost-btn-sm wide no-print" style={{ marginTop: 16 }} onClick={() => window.print()}><FileDown size={13} /> Print / Save as PDF</button>
      </div>
    </div>
  );
}

function CommandPalette({ items, dataItems, recentKeys, recentEntities, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const q = query.trim().toLowerCase();
  const recentEntityItems = !q && recentEntities ? recentEntities.map((r) => ({ key: r.sectionKey, dataType: r.type, label: r.label, sub: "Recently viewed" })) : [];
  const recentItems = !q && recentKeys && recentKeys.length > 0 ? recentKeys.map((k) => items.find((i) => i.key === k)).filter(Boolean) : [];
  const sectionResults = q ? items.filter((i) => i.label.toLowerCase().includes(q) || i.sectionLabel.toLowerCase().includes(q)) : items.filter((i) => !recentKeys?.includes(i.key));
  const dataResults = q ? (dataItems || []).filter((d) => d.label.toLowerCase().includes(q) || d.sub.toLowerCase().includes(q)) : [];
  const results = [...dataResults, ...recentEntityItems, ...recentItems, ...sectionResults];
  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" && results[activeIdx]) { onSelect(results[activeIdx].key); onClose(); }
    else if (e.key === "Escape") onClose();
  };
  return (
    <div className="modal-backdrop cmdk-backdrop" onClick={onClose}>
      <div className="cmdk-panel enter" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Search size={16} />
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }} onKeyDown={handleKey} placeholder="Search sections, orders, users..." />
          <span className="cmdk-hint">Esc</span>
        </div>
        <div className="cmdk-results">
          {results.length === 0 && <EmptyStateNote>No matches.</EmptyStateNote>}
          {results.map((item, i) => (
            <React.Fragment key={`${item.key}-${item.dataType || ""}-${item.label}`}>
              {i === dataResults.length && recentEntityItems.length > 0 && <div className="muted small" style={{ padding: "6px 14px 2px" }}>Recently viewed</div>}
              {i === dataResults.length + recentEntityItems.length && recentItems.length > 0 && <div className="muted small" style={{ padding: "6px 14px 2px" }}>Recent screens</div>}
              {i === dataResults.length + recentEntityItems.length + recentItems.length && sectionResults.length > 0 && (recentItems.length > 0 || dataResults.length > 0 || recentEntityItems.length > 0) && <div className="muted small" style={{ padding: "6px 14px 2px" }}>All sections</div>}
              <button className={`cmdk-item ${i === activeIdx ? "active" : ""}`} onMouseEnter={() => setActiveIdx(i)} onClick={() => { onSelect(item.key); onClose(); }}>
                {item.icon ? <item.icon size={14} /> : <span className="cmdk-type-tag">{item.dataType}</span>}
                <span className="ti-mid">{item.label}</span>
                <span className="muted small">{item.sectionLabel || item.sub}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
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

function GenericScreen({ config }) {
  const [items, setItems] = useState(config ? config.items : []);
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft, setDraft] = useState("");
  const [tableRows, setTableRows] = useState(config && config.type === "table" ? config.rows : []);
  const [expandedRow, setExpandedRow] = useState(null);
  if (!config) return <NotFoundScreen />;
  const toggleWords = ["Enabled", "Disabled", "On", "Off"];
  const isToggle = (val) => toggleWords.includes(val);
  const toggle = (i) => setItems((its) => its.map((it, idx) => idx === i ? [it[0], it[1] === "Enabled" ? "Disabled" : it[1] === "Disabled" ? "Enabled" : it[1] === "On" ? "Off" : "On"] : it));
  const startEdit = (i) => { setEditingIdx(i); setDraft(items[i][1]); };
  const saveEdit = (i) => { setItems((its) => its.map((it, idx) => idx === i ? [it[0], draft] : it)); setEditingIdx(null); };
  const setRowStatus = (i, status) => setTableRows((rs) => rs.map((r, idx) => idx === i ? r.map((c, j) => j === r.length - 1 ? status : c) : r));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">{config.title}</div>
        {config.type === "table" && (
          <table className="admin-table">
            <thead><tr>{config.cols.map((c) => <th key={c}>{c}</th>)}<th></th></tr></thead>
            <tbody>
              {tableRows.map((r, i) => {
                const lastCell = r[r.length - 1];
                const isPending = lastCell === "pending";
                return (
                  <React.Fragment key={i}>
                    <tr className="row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                      {r.map((cell, j) => (
                        <td key={j}>{(() => { const cls = statusPillClass(cell); return cls ? <span className={`status-pill ${cls}`}>{cell}</span> : cell; })()}</td>
                      ))}
                      <td className="row-actions">
                        {isPending ? (
                          <>
                            <button className="round-btn approve" onClick={() => setRowStatus(i, "verified")}><Check size={13} /></button>
                            <button className="round-btn deny" onClick={() => setRowStatus(i, "rejected")}><X size={13} /></button>
                          </>
                        ) : (
                          <button className="ghost-btn-sm" onClick={() => setExpandedRow(expandedRow === i ? null : i)}><Eye size={12} /> View</button>
                        )}
                      </td>
                    </tr>
                    {expandedRow === i && (
                      <tr><td colSpan={r.length + 1} style={{ background: "#F8FAFC" }}>
                        <div className="muted small" style={{ padding: "8px 4px" }}>{config.cols.map((c, j) => `${c}: ${r[j]}`).join(" -- ")}</div>
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {config.type === "list" && (
          <div className="list-col">
            {items.map(([a, b], i) => (
              <div className="flag-row row-enter" key={i} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="ti-mid"><div className="card-name">{a}</div>{editingIdx !== i && <div className="muted">{b}</div>}</div>
                {isToggle(b) ? (
                  <button className={`status-pill ${b === "Enabled" || b === "On" ? "done" : "delay"}`} onClick={() => toggle(i)}>{b}</button>
                ) : editingIdx === i ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} style={{ width: 140 }} />
                    <button className="ghost-btn-sm" onClick={() => saveEdit(i)}>Save</button>
                    <button className="ghost-btn-sm" onClick={() => setEditingIdx(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="ghost-btn-sm" onClick={() => startEdit(i)}><Pencil size={11} /> Edit</button>
                )}
              </div>
            ))}
          </div>
        )}
        {config.type === "stats" && (
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {config.stats.map(([label, value], i) => (
              <div className="stat-mini enter" key={i} style={{ animationDelay: `${i * 60}ms` }}>
                <div className="muted">{label}</div>
                <div className="kpi-value" style={{ fontSize: 20 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SECTIONS
   ============================================================ */

function DetailModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="activity-icon" style={{ background: item.color + "1A", color: item.color, width: 40, height: 40, marginBottom: 12 }}><item.icon size={18} /></div>
        <div className="card-name" style={{ fontSize: 16 }}>{item.title}</div>
        <div className="muted" style={{ marginBottom: 16 }}>{item.sub}</div>
        <div className="list-col">
          <div className="cat-top"><span className="muted">Timestamp</span><span>{item.time}</span></div>
          <div className="cat-top"><span className="muted">Actor</span><span>{item.actor || "System"}</span></div>
          <div className="cat-top"><span className="muted">Event ID</span><span className="mono">{item.eventId || "EVT-" + Math.floor(10000 + Math.random() * 89999)}</span></div>
          {item.notes && <div className="cat-top"><span className="muted">Notes</span><span>{item.notes}</span></div>}
        </div>
      </div>
    </div>
  );
}

function ScreenSkeleton() {
  return (
    <div className="section-pad">
      <div className="panel enter"><div className="skel-line" style={{ width: "30%" }} /><div className="skel-block" style={{ height: 220 }} /></div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="section-pad">
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skel-card" />)}
      </div>
      <div className="panel enter"><div className="skel-line" style={{ width: "35%" }} /><div className="skel-block" style={{ height: 190 }} /></div>
      <div className="panel enter"><div className="skel-line" style={{ width: "30%" }} /><div className="skel-block" /></div>
    </div>
  );
}

const DATE_RANGE_SCALE = { "Today": 1 / 7, "Yesterday": 1 / 7, "Last 7 days": 1, "Aug 12 - Aug 19, 2026": 1, "Last 30 days": 30 / 7, "This month": 30 / 7 };
const KPI_SCALABLE_KEYS = new Set(["revenue", "orders"]);
function scaledKpis(kpis, dateRange) {
  const scale = DATE_RANGE_SCALE[dateRange] ?? 1;
  if (scale === 1) return kpis;
  return kpis.map((k) => {
    if (!KPI_SCALABLE_KEYS.has(k.key)) return k;
    const raw = Number(String(k.value).replace(/[^0-9.]/g, ""));
    if (!raw) return k;
    const scaledRaw = Math.round(raw * scale);
    const display = k.key === "revenue" ? money(scaledRaw) : scaledRaw.toLocaleString();
    return { ...k, value: display };
  });
}

function OverviewSection({ onNavigate, recentlyViewed, dateRange }) {
  const [detailItem, setDetailItem] = useState(null);
  const [revPeriod, setRevPeriod] = useState("week");
  const [revOpen, setRevOpen] = useState(false);
  const [comparePeriod, setComparePeriod] = useState("week");
  return (
    <div className="section-pad">
      {detailItem && <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
      <div className="kpi-compare-row">
        <span className="muted small">Compare with:</span>
        <div className="chip-row">
          <button className={`chip ${comparePeriod === "week" ? "active" : ""}`} onClick={() => setComparePeriod("week")}>Last week</button>
          <button className={`chip ${comparePeriod === "month" ? "active" : ""}`} onClick={() => setComparePeriod("month")}>Last month</button>
        </div>
      </div>
      <div className="kpi-grid">{scaledKpis(KPIS, dateRange).map((k) => <KpiCard key={k.key} k={k} comparePeriod={comparePeriod} />)}</div>

      {recentlyViewed && recentlyViewed.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Recently Viewed</div>
          <div className="list-col">
            {recentlyViewed.map((r, i) => (
              <button key={i} className="pending-row" style={{ width: "100%", textAlign: "left" }} onClick={() => onNavigate(r.sectionKey)}>
                {r.type === "User" ? <UserIcon size={14} color="#64748B" /> : <LifeBuoy size={14} color="#64748B" />}
                <div className="ti-mid card-name" style={{ fontSize: 13 }}>{r.label}</div>
                <span className="muted small">{r.time}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="row-4col">
        <div className="panel enter" style={{ gridColumn: "span 2" }}>
          <div className="panel-title-row">
            <div className="panel-title">Revenue Overview</div>
            <div className="daterange-anchor">
              <button className="dropdown-btn" onClick={() => setRevOpen((o) => !o)}>{revPeriod === "week" ? "This Week" : "Last Week"} <ChevronDown size={13} /></button>
              {revOpen && (
                <>
                  <div className="notif-scrim" onClick={() => setRevOpen(false)} />
                  <div className="notif-dropdown" style={{ width: 150 }}>
                    <button className="notif-row" onClick={() => { setRevPeriod("week"); setRevOpen(false); }}>This Week</button>
                    <button className="notif-row" onClick={() => { setRevPeriod("lastweek"); setRevOpen(false); }}>Last Week</button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="rev-big">{money(revPeriod === "week" ? 685452 : 603198)}<span className="rev-delta"><ArrowUp size={12} /> {revPeriod === "week" ? "18.7%" : "7.4%"}</span></div>
          <div className="muted" style={{ marginBottom: 8 }}>Total Revenue vs last week</div>
          <div style={{ width: "100%", height: 190 }}>
            <ResponsiveContainer>
              <AreaChart data={revPeriod === "week" ? REVENUE_TREND : LAST_WEEK_REVENUE_TREND} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="saFillRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEF0F4" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#9AA3B2" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9AA3B2" }} axisLine={false} tickLine={false} width={30} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} formatter={(v) => [money(v), "Revenue"]} />
                <Area type="monotone" dataKey="v" stroke="#7C3AED" strokeWidth={2.5} fill="url(#saFillRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DonutPanel title="Platform Overview" centerVal="425,694" centerLabel="Total Users" data={PLATFORM_MIX} onView={() => onNavigate("users")} />

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">System Health</div><button className="link-btn" onClick={() => onNavigate("reports")}>View Details</button></div>
          <div className="health-grid">
            {SYSTEM_HEALTH.map((s) => (
              <div className="health-tile" key={s.label}>
                <div className="health-icon"><s.icon size={14} /></div>
                <div className="health-val">{s.value}</div>
                <div className="muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row-3col">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Recent System Activities</div><button className="link-btn" onClick={() => onNavigate("notifications")}>View All</button></div>
          <div className="activity-list">
            {RECENT_ACTIVITY.map((a, i) => (
              <button className="activity-row row-enter activity-clickable" key={i} style={{ animationDelay: `${i * 40}ms` }} onClick={() => setDetailItem(a)}>
                <div className="activity-icon" style={{ background: a.color + "1A", color: a.color }}><a.icon size={14} /></div>
                <div className="ti-mid"><div className="card-name">{a.title}</div><div className="muted">{a.sub}</div></div>
                <div className="muted small">{a.time}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Pending Actions</div><button className="link-btn" onClick={() => onNavigate("disputes")}>View All</button></div>
          <div className="list-col">
            {PENDING_ACTIONS.map((p) => (
              <div className="pending-row" key={p.label}>
                <div className="pending-icon" style={{ background: p.color + "1A", color: p.color }}><p.icon size={14} /></div>
                <div className="ti-mid card-name">{p.label}</div>
                <div className="mono">{p.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Financial Summary (This Week)</div><button className="link-btn" onClick={() => onNavigate("payouts")}>View Report</button></div>
          <div className="list-col">
            {FINANCIAL_SUMMARY.map((f) => (
              <div className="pending-row" key={f.label}>
                <div className="pending-icon" style={{ background: f.color + "1A", color: f.color }}><f.icon size={14} /></div>
                <div className="ti-mid card-name">{f.label}</div>
                <div className="mono">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row-2col">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Top Performing Categories</div><button className="link-btn" onClick={() => onNavigate("categories")}>View All</button></div>
          <div className="list-col">
            {TOP_CATEGORIES.map((c) => (
              <div key={c.label} className="cat-row">
                <div className="cat-top"><span className="card-name">{c.label}</span><span className="mono">{c.value}</span></div>
                <div className="bar-track"><div className="bar-fill-h" style={{ width: `${c.pct}%`, background: c.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        <DonutPanel title="Support Overview" centerVal="128" centerLabel="Total Tickets" data={SUPPORT_MIX} onView={() => onNavigate("live-chat")} />
      </div>

      <div className="row-3col">
        <div className="panel enter" style={{ gridColumn: "span 1" }}>
          <div className="panel-title-row"><div className="panel-title">Platform Analytics</div><button className="link-btn" onClick={() => onNavigate("analytics")}>View Analytics</button></div>
          <div style={{ width: "100%", height: 190 }}>
            <ResponsiveContainer>
              <BarChart data={PLATFORM_ANALYTICS} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#EEF0F4" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#9AA3B2" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9AA3B2" }} axisLine={false} tickLine={false} width={26} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
                <Bar dataKey="orders" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" fill="#C4B5FD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">System Announcements</div><button className="link-btn" onClick={() => onNavigate("announcements")}>View All</button></div>
          <div className="activity-list">
            {ANNOUNCEMENTS.map((a, i) => (
              <div className="activity-row row-enter" key={i} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="activity-icon" style={{ background: a.color + "1A", color: a.color }}><a.icon size={14} /></div>
                <div className="ti-mid"><div className="card-name">{a.title}</div><div className="muted">{a.sub}</div></div>
                <div className="muted small">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title">Quick Access</div>
          <div className="quick-grid">
            {QUICK_ACCESS.map((q) => (
              <button className="quick-btn" key={q.label} onClick={() => onNavigate(q.key)}><q.icon size={16} /><span>{q.label}</span></button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkBar({ count, onApprove, onFlag, onClear, approveLabel = "Approve", flagLabel = "Flag" }) {
  if (count === 0) return null;
  return (
    <div className="bulk-bar">
      <span className="card-name">{count} selected</span>
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button className="ghost-btn-sm" onClick={onFlag}>{flagLabel}</button>
        <button className="primary-btn-sm" onClick={onApprove}>{approveLabel}</button>
        <button className="ghost-btn-sm" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}

const KYC_APPLICATIONS_SEED = [
  { id: "KYC1", applicant: "Bright Pharmacy", type: "Seller", document: "Business license", submitted: "2 days ago", status: "pending" },
  { id: "KYC2", applicant: "LifeCare Store", type: "Seller", document: "Business license", submitted: "3 days ago", status: "verified" },
  { id: "KYC3", applicant: "Devon K.", type: "Rider", document: "Driver's license", submitted: "1 day ago", status: "pending" },
];
function KycVerificationsSection() {
  const [apps, setApps] = useState(KYC_APPLICATIONS_SEED);
  const decide = (id, status) => setApps((a) => a.map((x) => x.id === id ? { ...x, status } : x));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">KYC & Verifications</div>
        <table className="admin-table">
          <thead><tr><th>Applicant</th><th>Type</th><th>Document</th><th>Submitted</th><th>Status</th><th /></tr></thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td className="card-name">{a.applicant}</td><td>{a.type}</td><td className="muted small">{a.document}</td><td className="muted small">{a.submitted}</td>
                <td><span className={`status-pill ${a.status === "verified" ? "done" : a.status === "rejected" ? "delay" : "prep"}`}>{a.status}</span></td>
                <td style={{ display: "flex", gap: 6 }}>
                  {a.status === "pending" ? (
                    <>
                      <button className="ghost-btn-sm" onClick={() => decide(a.id, "verified")}>Approve</button>
                      <button className="ghost-btn-sm deny" onClick={() => confirmAction({ title: "Reject this application?", message: "The applicant will be notified.", confirmLabel: "Reject" }, () => decide(a.id, "rejected"))}>Reject</button>
                    </>
                  ) : (
                    <button className="ghost-btn-sm" onClick={() => decide(a.id, "pending")}>Reopen</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendorsSection({ onViewAs }) {
  const [items, setItems] = useState(VENDORS);
  const [selected, setSelected] = useState(new Set());
  const setStatus = (id, status) => setItems((it) => it.map((v) => (v.id === id ? { ...v, status } : v)));
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (s.size === items.length ? new Set() : new Set(items.map((v) => v.id))));
  const bulkSet = (status) => { setItems((it) => it.map((v) => (selected.has(v.id) ? { ...v, status } : v))); setSelected(new Set()); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Sellers / Stores</div>
        <BulkBar count={selected.size} onApprove={() => bulkSet("active")} onFlag={() => bulkSet("flagged")} onClear={() => setSelected(new Set())} />
        <table className="admin-table">
          <thead><tr><th><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} /></th><th>Vendor</th><th>Category</th><th>GMV</th><th>Rating</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((v, i) => (
              <tr key={v.id} className="row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                <td><input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSel(v.id)} /></td>
                <td>{v.name}</td><td>{v.category}</td><td className="mono">{money(v.gmv)}</td>
                <td><Star size={11} fill="#F59E0B" color="#F59E0B" /> {v.rating}</td>
                <td><span className={`status-pill ${v.status === "active" ? "done" : "delay"}`}>{v.status}</span></td>
                <td className="row-actions">
                  <button className="round-btn" onClick={() => onViewAs?.(v.name, "seller")}><Eye size={13} /></button>
                  {v.status !== "active" && <button className="round-btn approve" onClick={() => setStatus(v.id, "active")}><Check size={13} /></button>}
                  {v.status === "active" && <button className="round-btn deny" onClick={() => setStatus(v.id, "flagged")}><X size={13} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RidersSection({ onViewAs }) {
  const [items, setItems] = useState(RIDERS);
  const [selected, setSelected] = useState(new Set());
  const toggle = (id) => setItems((it) => it.map((r) => (r.id === id ? { ...r, status: r.status === "active" ? "suspended" : "active" } : r)));
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (s.size === items.length ? new Set() : new Set(items.map((r) => r.id))));
  const bulkSet = (status) => { setItems((it) => it.map((r) => (selected.has(r.id) ? { ...r, status } : r))); setSelected(new Set()); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Riders / Drivers</div>
        <BulkBar count={selected.size} onApprove={() => bulkSet("active")} onFlag={() => bulkSet("suspended")} onClear={() => setSelected(new Set())} approveLabel="Activate" flagLabel="Suspend" />
        <table className="admin-table">
          <thead><tr><th><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} /></th><th>Rider</th><th>Trips</th><th>Rating</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={r.id} className="row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSel(r.id)} /></td>
                <td>{r.name}</td><td className="mono">{r.trips.toLocaleString()}</td>
                <td><Star size={11} fill="#F59E0B" color="#F59E0B" /> {r.rating}</td>
                <td><span className={`status-pill ${r.status === "active" ? "done" : "delay"}`}>{r.status}</span></td>
                <td className="row-actions">
                  <button className="round-btn" onClick={() => onViewAs?.(r.name, "rider")}><Eye size={13} /></button>
                  <button className={`round-btn ${r.status === "active" ? "deny" : "approve"}`} onClick={() => toggle(r.id)}>
                    {r.status === "active" ? <X size={13} /> : <Check size={13} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserDetailModal({ user, viewAsLog, onViewAs, onClose }) {
  const impersonations = (viewAsLog || []).filter((l) => l.target === user.name);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="driver-avatar" style={{ width: 44, height: 44, fontSize: 15, marginBottom: 10 }}>{user.name.split(" ").map((w) => w[0]).join("")}</div>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 2 }}>{user.name}</div>
        <div className="muted" style={{ marginBottom: 16 }}>{user.email}</div>
        <div className="list-col">
          <div className="cat-top"><span className="muted">User ID</span><span className="mono">{user.id}</span></div>
          <div className="cat-top"><span className="muted">Total orders</span><span>{user.orders}</span></div>
          <div className="cat-top"><span className="muted">Joined</span><span>{user.joined}</span></div>
        </div>
        <button className="ghost-btn-sm" style={{ marginTop: 10 }} onClick={() => { onViewAs?.(user.name); onClose(); }}><Eye size={12} /> View as this user</button>
        <div className="field" style={{ marginTop: 16 }}>
          <span>Impersonation history -- read-only, from the staff audit log</span>
          {impersonations.length === 0 ? (
            <div className="muted small" style={{ marginTop: 4 }}>No staff member has viewed as this user.</div>
          ) : (
            <div className="list-col" style={{ marginTop: 4 }}>
              {impersonations.map((l, i) => (
                <div key={i} className="cat-top"><span className="muted small">{l.actor}</span><span className="muted small">{l.time}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersSection({ logView, viewAsLog, onViewAs, anonName, anonEmail }) {
  const [viewUser, setViewUser] = useState(null);
  return (
    <div className="section-pad">
      {viewUser && <UserDetailModal user={viewUser} viewAsLog={viewAsLog} onViewAs={onViewAs} onClose={() => setViewUser(null)} />}
      <div className="panel enter">
        <div className="panel-title">Users</div>
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {USERS_LIST.map((u, i) => (
              <tr key={u.id} className="row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                <td>{anonName ? anonName(u.name, u.id) : u.name}</td><td className="muted">{anonEmail ? anonEmail(u.email) : u.email}</td><td className="mono">{u.orders}</td><td>{u.joined}</td>
                <td><button className="row-link" onClick={() => { setViewUser(u); logView?.("User", u.name, "users"); }}>View <ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayoutsSection({ initialTab }) {
  const [tab, setTab] = useState(initialTab || "requests");
  return (
    <div>
      <div className="tab-row" style={{ margin: "16px 20px 0" }}>
        <button className={`tab-btn ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>Requests</button>
        <button className={`tab-btn ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>Settlement History</button>
      </div>
      {tab === "requests" ? <PayoutReviewSection /> : <PayoutsSettlementsSection />}
    </div>
  );
}

function PayoutsSettlementsSection() {
  return (
    <div className="section-pad">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="stat-mini enter"><div className="muted">Payouts this week</div><div className="kpi-value" style={{ fontSize: 20 }}>{money(41208)}</div></div>
        <div className="stat-mini enter"><div className="muted">Platform fees collected</div><div className="kpi-value" style={{ fontSize: 20 }}>{money(9980)}</div></div>
        <div className="stat-mini enter"><div className="muted">Refunds issued</div><div className="kpi-value" style={{ fontSize: 20 }}>{money(1204)}</div></div>
        <div className="stat-mini enter"><div className="muted">Pending payouts</div><div className="kpi-value" style={{ fontSize: 20 }}>{money(6340)}</div></div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Ledger</div>
        <table className="admin-table">
          <thead><tr><th>Type</th><th>To</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>
            {LEDGER.map((l, i) => (
              <tr key={l.id} className="row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                <td>{l.type}</td><td>{l.to}</td>
                <td className={`mono ${l.amount < 0 ? "neg" : ""}`}>{money(l.amount)}</td>
                <td className="muted">{l.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TICKETS_SA = [
  { id: "T-901", customer: "Jordan B.", subject: "Order arrived missing an item", priority: "high", time: "4 min ago", minutesOpen: 4 },
  { id: "T-899", customer: "Casey W.", subject: "Driver took a long detour", priority: "medium", time: "22 min ago", minutesOpen: 22 },
  { id: "T-895", customer: "Sam T.", subject: "Refund not yet received", priority: "high", time: "1 hr ago", minutesOpen: 60 },
  { id: "T-891", customer: "Riley N.", subject: "Question about delivery fee", priority: "low", time: "2 hr ago", minutesOpen: 120 },
];
const SLA_MINUTES = { high: 30, medium: 60, low: 240 };

const MODERATION_QUEUE = [
  { id: "M-401", item: "Review on Runwell Sneaker Co.", reason: "Suspected fake review", reporter: "System", detail: "\"Best store ever!!! 5 stars!!!\" -- posted 40 times across different accounts in one hour.", status: "pending" },
  { id: "M-398", item: "Product listing -- \"Original Nike Sneakers\"", reason: "Suspected counterfeit claim", reporter: "Priya M.", detail: "Listing uses brand imagery without a verified reseller badge.", status: "pending" },
  { id: "M-390", item: "Review on Fresh Fields Grocery", reason: "Off-topic / spam", reporter: "Jordan B.", detail: "Review contains a link to an unrelated external site.", status: "pending" },
];

const STAFF_CHANGELOG = [
  { date: "Aug 21, 2026", tag: "Feature", title: "Command palette added", desc: "Press Cmd/Ctrl+K anywhere in Admin or Super Admin to jump to any section instantly." },
  { date: "Aug 21, 2026", tag: "Feature", title: "Reports & Moderation is now a working queue", desc: "Flagged reviews and listings can now be dismissed or removed directly, instead of just viewed." },
  { date: "Aug 20, 2026", tag: "Fix", title: "Fixed inconsistent sidebar badge counts", desc: "Support Tickets, Live Chat, and Notifications badges now match the number of items actually in each queue." },
  { date: "Aug 20, 2026", tag: "Feature", title: "View-As now has an audit trail", desc: "Every use of View-As is logged with actor, target, and timestamp -- visible from the View-As banner." },
  { date: "Aug 19, 2026", tag: "Policy", title: "Delivery commission during peak hours confirmed at 10%", desc: "Down from the standard 15% during 6-10am and 4-8pm, to keep riders incentivized during high-demand windows." },
];

const FEED_FILTERS = ["All", "Product Updates", "Announcements", "Broadcasts"];

function UnifiedFeedScreen({ sentLog }) {
  const [filter, setFilter] = useState("All");
  const changelogItems = STAFF_CHANGELOG.map((c) => ({ kind: "Product Updates", tag: c.tag, title: c.title, sub: c.desc, time: c.date }));
  const announcementItems = ANNOUNCEMENTS.map((a) => ({ kind: "Announcements", tag: "Announcement", title: a.title, sub: a.sub, time: a.time }));
  const broadcastItems = (sentLog || []).map((b) => ({ kind: "Broadcasts", tag: "Broadcast", title: `Sent to ${b.segment}`, sub: b.message, time: `${b.time} -- ${b.count.toLocaleString()} recipients` }));
  const all = [...broadcastItems, ...changelogItems, ...announcementItems];
  const visible = filter === "All" ? all : all.filter((i) => i.kind === filter);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Recently Updated</div><span className="muted small">Product changes, announcements, and broadcasts in one place</span></div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {FEED_FILTERS.map((f) => <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
        {visible.length === 0 ? <EmptyStateNote>Nothing here yet.</EmptyStateNote> : (
          <div className="list-col">
            {visible.map((item, i) => (
              <div key={i} className="pending-row">
                <span className={`status-pill ${item.tag === "Fix" ? "delay" : item.tag === "Broadcast" ? "route" : "done"}`}>{item.tag}</span>
                <div className="ti-mid"><div className="card-name">{item.title}</div><div className="muted small">{item.sub}</div></div>
                <div className="muted small" style={{ flexShrink: 0 }}>{item.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const SUPPORT_OVERSIGHT_LIVECHATS = [
  { customer: "Jordan B.", status: "waiting", waitTime: "2 min", assignedTo: null },
  { customer: "Casey W.", status: "active", waitTime: null, assignedTo: "Sasha" },
  { customer: "Riley N.", status: "waiting", waitTime: "6 min", assignedTo: null },
];
const SUPPORT_OVERSIGHT_MESSAGES = [
  { customer: "Jordan B.", preview: "Order arrived missing an item", unread: true },
  { customer: "Casey W.", preview: "Driver took a long detour", unread: true },
  { customer: "Sam T.", preview: "Refund not yet received", unread: false },
];
function SupportOversightSection({ initialTab }) {
  const [tab, setTab] = useState(initialTab || "livechat");
  return (
    <div className="section-pad">
      <div className="muted small" style={{ marginBottom: 10 }}>Platform-wide oversight of Support's queues -- for the actual working tools (reply, claim, resolve), see the Support app.</div>
      <div className="tab-row" style={{ marginBottom: 14 }}>
        <button className={`tab-btn ${tab === "livechat" ? "active" : ""}`} onClick={() => setTab("livechat")}>Live Chat</button>
        <button className={`tab-btn ${tab === "messages" ? "active" : ""}`} onClick={() => setTab("messages")}>Support Messages</button>
      </div>
      <div className="panel enter">
        {tab === "livechat" ? (
          <div className="list-col">
            {SUPPORT_OVERSIGHT_LIVECHATS.map((c, i) => (
              <div key={i} className="pending-row">
                <MessageCircle size={14} />
                <div className="ti-mid"><div className="card-name">{c.customer}</div><div className="muted small">{c.status === "waiting" ? `Waiting -- ${c.waitTime}` : `In progress with ${c.assignedTo}`}</div></div>
                <span className={`status-pill ${c.status === "waiting" ? "delay" : "done"}`}>{c.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="list-col">
            {SUPPORT_OVERSIGHT_MESSAGES.map((m, i) => (
              <div key={i} className="pending-row">
                <Mail size={14} />
                <div className="ti-mid"><div className="card-name">{m.customer}</div><div className="muted small">{m.preview}</div></div>
                {m.unread && <span className="status-pill delay">unread</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StaffLeaderboardSection({ activityLog, viewAsLog }) {
  // Real session activity blended with a deterministic per-staffer baseline
  // -- a fresh session has near-zero real activity, so the baseline keeps
  // this demonstrable while your own actions still visibly add to the count.
  // Deliberately NOT sorted/ranked by raw tickets-resolved count -- a pure
  // "who closed the most" leaderboard rewards speed over actually solving
  // the customer's problem. This shows balanced quality signals instead.
  const rows = ADMIN_ROSTER.map((a) => {
    const h = [...a.id].reduce((s, c) => s + c.charCodeAt(0), 5);
    const realActions = (activityLog || []).filter((l) => l.actor === a.name).length;
    const realViewAs = (viewAsLog || []).filter((l) => l.by === a.name).length;
    return {
      name: a.name,
      role: a.role,
      ticketsResolved: 12 + (h % 40) + realActions,
      viewAsSessions: (h % 6) + realViewAs,
      firstResponseMin: 4 + (h % 20),
      resolutionHrs: (2 + (h % 18) / 10).toFixed(1),
      reopenRate: (h % 12) / 2,
      csat: (4.1 + (h % 9) / 10).toFixed(1),
      escalationRate: (h % 15) / 2,
      slaCompliance: 82 + (h % 17),
    };
  });
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Staff Performance</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Balanced quality signals, not a ranked leaderboard -- ticket count alone rewards closing fast over closing well. Includes your own actions from this session, blended with a baseline for the rest.</div>
        <table className="admin-table">
          <thead><tr><th>Staff</th><th>Role</th><th>Tickets Resolved</th><th>First Response</th><th>Resolution Time</th><th>Reopen Rate</th><th>CSAT</th><th>Escalation Rate</th><th>SLA Compliance</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="card-name">{r.name}</td><td className="muted small">{r.role}</td>
                <td className="mono">{r.ticketsResolved}</td><td className="mono">{r.firstResponseMin} min</td><td className="mono">{r.resolutionHrs}h</td>
                <td className="mono">{r.reopenRate}%</td><td className="mono">{r.csat}</td><td className="mono">{r.escalationRate}%</td>
                <td className="mono" style={{ color: r.slaCompliance >= 90 ? "#16A34A" : r.slaCompliance >= 80 ? "#F59E0B" : "#DC2626" }}>{r.slaCompliance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StaffCompareSection rows={rows} />
    </div>
  );
}

function StaffCompareSection({ rows }) {
  const [aName, setAName] = useState(rows[0]?.name || "");
  const [bName, setBName] = useState(rows[1]?.name || "");
  const a = rows.find((r) => r.name === aName);
  const b = rows.find((r) => r.name === bName);
  return (
    <div className="panel enter">
      <div className="panel-title">Compare Two Staff Members</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <select className="sort-select" style={{ flex: 1 }} value={aName} onChange={(e) => setAName(e.target.value)}>
          {rows.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
        <select className="sort-select" style={{ flex: 1 }} value={bName} onChange={(e) => setBName(e.target.value)}>
          {rows.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
      </div>
      {a && b && (
        <div className="list-col">
          <div className="cat-top"><span className="muted small" style={{ flex: 1 }}>Tickets resolved</span><span className="mono small" style={{ fontWeight: a.ticketsResolved >= b.ticketsResolved ? 700 : 400 }}>{a.ticketsResolved}</span><span className="muted small" style={{ margin: "0 8px" }}>vs</span><span className="mono small" style={{ fontWeight: b.ticketsResolved >= a.ticketsResolved ? 700 : 400 }}>{b.ticketsResolved}</span></div>
          <div className="cat-top"><span className="muted small" style={{ flex: 1 }}>CSAT</span><span className="mono small" style={{ fontWeight: a.csat >= b.csat ? 700 : 400 }}>{a.csat}</span><span className="muted small" style={{ margin: "0 8px" }}>vs</span><span className="mono small" style={{ fontWeight: b.csat >= a.csat ? 700 : 400 }}>{b.csat}</span></div>
          <div className="cat-top"><span className="muted small" style={{ flex: 1 }}>SLA compliance</span><span className="mono small" style={{ fontWeight: a.slaCompliance >= b.slaCompliance ? 700 : 400 }}>{a.slaCompliance}%</span><span className="muted small" style={{ margin: "0 8px" }}>vs</span><span className="mono small" style={{ fontWeight: b.slaCompliance >= a.slaCompliance ? 700 : 400 }}>{b.slaCompliance}%</span></div>
          <div className="cat-top"><span className="muted small" style={{ flex: 1 }}>Reopen rate (lower is better)</span><span className="mono small" style={{ fontWeight: a.reopenRate <= b.reopenRate ? 700 : 400 }}>{a.reopenRate}%</span><span className="muted small" style={{ margin: "0 8px" }}>vs</span><span className="mono small" style={{ fontWeight: b.reopenRate <= a.reopenRate ? 700 : 400 }}>{b.reopenRate}%</span></div>
          <div className="cat-top"><span className="muted small" style={{ flex: 1 }}>View-As sessions</span><span className="mono small" style={{ fontWeight: a.viewAsSessions >= b.viewAsSessions ? 700 : 400 }}>{a.viewAsSessions}</span><span className="muted small" style={{ margin: "0 8px" }}>vs</span><span className="mono small" style={{ fontWeight: b.viewAsSessions >= a.viewAsSessions ? 700 : 400 }}>{b.viewAsSessions}</span></div>
          <div className="cat-top"><span className="muted small" style={{ flex: 1 }}>Department</span><span className="muted small">{a.role}</span><span className="muted small" style={{ margin: "0 8px" }}>vs</span><span className="muted small">{b.role}</span></div>
        </div>
      )}
    </div>
  );
}

function ComponentLibrarySection() {
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Component Reference</div>
        <div className="muted small" style={{ marginBottom: 16 }}>Reusable UI patterns used across the app -- for consistency when building more.</div>
        <div className="muted small" style={{ fontWeight: 700, marginBottom: 8 }}>Status pills</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span className="status-pill done">done</span>
          <span className="status-pill delay">delay / high severity</span>
          <span className="status-pill prep">prep / medium</span>
          <span className="status-pill route">route / info</span>
        </div>
        <div className="muted small" style={{ fontWeight: 700, marginBottom: 8 }}>Buttons</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button className="primary-btn-sm">Primary</button>
          <button className="ghost-btn-sm">Ghost</button>
          <button className="ghost-btn-sm deny">Ghost (destructive)</button>
          <button className="round-btn approve"><Check size={13} /></button>
          <button className="round-btn deny"><X size={13} /></button>
        </div>
        <div className="muted small" style={{ fontWeight: 700, marginBottom: 8 }}>Toggle</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <button className="toggle-mini on"><span /></button>
          <span className="muted small">on</span>
          <button className="toggle-mini"><span /></button>
          <span className="muted small">off</span>
        </div>
        <div className="muted small" style={{ fontWeight: 700, marginBottom: 8 }}>Empty state</div>
        <div style={{ marginBottom: 16 }}><EmptyStateNote>Example empty-state message explaining what would appear here.</EmptyStateNote></div>
        <div className="muted small" style={{ fontWeight: 700, marginBottom: 8 }}>Color scale (risk/severity)</div>
        <div className="muted small">Consistent across Risk Score, Fraud Flags, Performance Grade, CSAT: <span style={{ color: "#16A34A", fontWeight: 700 }}>#16A34A green</span> = good/low, <span style={{ color: "#F59E0B", fontWeight: 700 }}>#F59E0B amber</span> = medium, <span style={{ color: "#DC2626", fontWeight: 700 }}>#DC2626 red</span> = high/bad.</div>
      </div>
    </div>
  );
}

function ChangelogSection() {
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">What's New for Staff</div><span className="muted small">Internal only -- not shown to customers</span></div>
        <div className="list-col">
          {STAFF_CHANGELOG.map((c, i) => (
            <div key={i} className="pending-row" style={{ alignItems: "flex-start" }}>
              <span className={`status-pill ${c.tag === "Fix" ? "delay" : c.tag === "Policy" ? "prep" : "done"}`} style={{ marginTop: 2 }}>{c.tag}</span>
              <div className="ti-mid"><div className="card-name">{c.title}</div><div className="muted">{c.desc}</div></div>
              <div className="muted small" style={{ whiteSpace: "nowrap" }}>{c.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModerationSection() {
  const [queue, setQueue] = useState(MODERATION_QUEUE);
  const resolve = (id, action) => setQueue((q) => q.map((m) => (m.id === id ? { ...m, status: action } : m)));
  const pending = queue.filter((m) => m.status === "pending");
  const resolved = queue.filter((m) => m.status !== "pending");
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Reports & Moderation</div><span className="muted small">{pending.length} awaiting review</span></div>
        {pending.length === 0 ? <EmptyStateNote>Nothing pending -- queue is clear.</EmptyStateNote> : (
          <div className="list-col">
            {pending.map((m) => (
              <div key={m.id} className="dispute-card">
                <div className="pending-row">
                  <div className="pending-icon" style={{ background: "#FFF7ED", color: "#EA580C" }}><Flag size={14} /></div>
                  <div className="ti-mid"><div className="card-name">{m.item}</div><div className="muted">{m.reason} -- reported by {m.reporter}</div></div>
                </div>
                <div className="muted small" style={{ margin: "8px 0" }}>{m.detail}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="ghost-btn-sm" onClick={() => resolve(m.id, "dismissed")}>Dismiss</button>
                  <button className="primary-btn-sm" style={{ background: "#DC2626" }} onClick={() => confirmAction({ title: "Remove this content?", message: "It will be taken down from the platform.", confirmLabel: "Remove content" }, () => resolve(m.id, "removed"))}>Remove content</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {resolved.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Resolved</div>
          <div className="list-col">
            {resolved.map((m) => (
              <div key={m.id} className="pending-row"><div className="ti-mid card-name">{m.item}</div><span className={`status-pill ${m.status === "removed" ? "delay" : "done"}`}>{m.status}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TicketsSectionSA({ onViewAs, logView }) {
  const [selected, setSelected] = useState(TICKETS_SA[0]);
  const [reply, setReply] = useState("");
  const [threads, setThreads] = useState({});
  const selectTicket = (t) => { setSelected(t); logView?.("Ticket", `${t.id} -- ${t.customer}`, "tickets"); };
  const sendReply = () => {
    if (!reply.trim()) return;
    setThreads((t) => ({ ...t, [selected.id]: [...(t[selected.id] || []), reply] }));
    setReply("");
  };
  return (
    <div className="section-pad" style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <div className="panel enter" style={{ flex: 1, maxWidth: 340 }}>
        <div className="panel-title">Support queue</div>
        <div className="list-col">
          {TICKETS_SA.map((t) => {
            const overSla = t.minutesOpen > SLA_MINUTES[t.priority];
            return (
              <button key={t.id} className={`ticket-item ${selected.id === t.id ? "active" : ""}`} onClick={() => selectTicket(t)}>
                <span className={`priority-dot ${t.priority}`} />
                <div className="ti-mid"><div className="card-name">{t.customer}</div><div className="muted">{t.subject}</div></div>
                <div style={{ textAlign: "right" }}>
                  <div className="muted small">{t.time}</div>
                  {overSla && <div className="sla-breach">SLA breached</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="panel enter" style={{ flex: 1.4 }}>
        <div className="panel-title-row"><div className="panel-title">{selected.id} -- {selected.customer}</div><button className="ghost-btn-sm" onClick={() => onViewAs(selected.customer)}><Eye size={12} /> View as customer</button></div>
        <div className={`sla-readout ${selected.minutesOpen > SLA_MINUTES[selected.priority] ? "breached" : ""}`}>
          <ClockIcon size={13} /> Open {selected.minutesOpen} min -- SLA target {SLA_MINUTES[selected.priority]} min for {selected.priority} priority
          {selected.minutesOpen > SLA_MINUTES[selected.priority] ? <span className="status-pill delay">Breached by {selected.minutesOpen - SLA_MINUTES[selected.priority]} min</span> : <span className="status-pill done">On track</span>}
        </div>
        <div className="msg-bubble">{selected.subject}</div>
        {(threads[selected.id] || []).map((msg, i) => <div key={i} className="msg-bubble reply">{msg}</div>)}
        <div className="reply-row">
          <input placeholder="Type a reply..." value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} />
          <button className="primary-btn-sm" onClick={sendReply}>Reply</button>
        </div>
      </div>
    </div>
  );
}

function DisputesSectionSA({ onViewAs }) {
  const [items, setItems] = useState([
    { id: "D-221", order: "O5540", customer: "Priya M.", amount: 18400, reason: "Item damaged on arrival" },
    { id: "D-219", order: "O5522", customer: "Devon K.", amount: 27100, reason: "Order never delivered" },
  ]);
  const resolve = (id) => setItems((it) => it.filter((d) => d.id !== id));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Refunds & Disputes</div>
        {items.length === 0 && <EmptyStateNote>All disputes resolved.</EmptyStateNote>}
        <div className="list-col">
          {items.map((d, i) => (
            <div className="pending-row" key={d.id} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="pending-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}><AlertTriangle size={14} /></div>
              <div className="ti-mid"><div className="card-name">{d.customer} -- Order {d.order}</div><div className="muted">{d.reason}</div></div>
              <div className="mono">{money(d.amount)}</div>
              <button className="ghost-btn-sm" onClick={() => onViewAs(d.customer)}><Eye size={12} /> View as</button>
              <button className="round-btn deny" onClick={() => resolve(d.id)}><X size={13} /></button>
              <button className="round-btn approve" onClick={() => resolve(d.id)}><Check size={13} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SYSTEM_TOGGLES = [
  { key: "guest_checkout", label: "Guest checkout", desc: "Allow customers to order without creating an account", on: false },
  { key: "peak_pricing", label: "Peak-hour delivery pricing", desc: "Reduce Medra's delivery cut to 10% during peak hours", on: true },
  { key: "auto_payouts", label: "Automatic weekly payouts", desc: "Send seller and rider payouts automatically every Monday", on: true },
  { key: "new_signups", label: "New seller/rider signups", desc: "Allow new applications to come in through the app", on: true },
  { key: "maintenance_mode", label: "Maintenance mode", desc: "Take the platform offline for scheduled maintenance", on: false },
];

function FeatureTogglesSection() {
  const [toggles, setToggles] = useState(SYSTEM_TOGGLES);
  const [scheduledMaintenance, setScheduledMaintenance] = useState(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedStart, setSchedStart] = useState("02:00");
  const [schedEnd, setSchedEnd] = useState("04:00");
  const flip = (key) => setToggles((t) => t.map((tg) => (tg.key === key ? { ...tg, on: !tg.on } : tg)));
  const scheduleMaintenance = () => {
    if (!schedDate) return;
    setScheduledMaintenance({ date: schedDate, start: schedStart, end: schedEnd });
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Feature Toggles</div>
        <div className="list-col">
          {toggles.map((t) => (
            <div key={t.key} className="flag-row">
              <div className="ti-mid"><div className="card-name">{t.label}</div><div className="muted">{t.desc}</div></div>
              <button className={`toggle-mini ${t.on ? "on" : ""}`} onClick={() => flip(t.key)}><span /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFF7ED,#fff)", border: "1px solid #FED7AA" }}>
        <div className="panel-title">Schedule Maintenance Mode</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Set a maintenance window ahead of time instead of flipping the toggle above live -- keeps a real record of what's planned and when, so it's not just an on/off switch with no context.</div>
        {scheduledMaintenance ? (
          <>
            <div className="cat-top"><span className="muted small">Scheduled for</span><span className="mono small">{scheduledMaintenance.date}, {scheduledMaintenance.start} - {scheduledMaintenance.end}</span></div>
            <button className="ghost-btn-sm" style={{ marginTop: 10 }} onClick={() => setScheduledMaintenance(null)}>Cancel scheduled window</button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div className="field" style={{ flex: 1 }}><span>Date</span><input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} /></div>
              <div className="field" style={{ flex: 1 }}><span>Start</span><input type="time" value={schedStart} onChange={(e) => setSchedStart(e.target.value)} /></div>
              <div className="field" style={{ flex: 1 }}><span>End</span><input type="time" value={schedEnd} onChange={(e) => setSchedEnd(e.target.value)} /></div>
            </div>
            <button className="ghost-btn-sm" disabled={!schedDate} onClick={scheduleMaintenance}>Schedule window</button>
          </>
        )}
      </div>
    </div>
  );
}

function FeatureMarketplaceSection() {
  const [flags, setFlags] = useState(FEATURE_FLAGS);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("manage");
  const [blockedMsg, setBlockedMsg] = useState(null);
  // Real dependencies between features actually built this way -- e.g. the
  // diff view and category overrides are both part of the Commission Engine
  // screen, so they can't meaningfully exist without it being enabled.
  const FEATURE_DEPENDENCIES = {
    commission_engine_diff_view: ["commission_engine_interactive"],
    category_commission_overrides: ["commission_engine_interactive"],
    promotions_ab_testing: ["promotions_interactive"],
  };
  const dependents = (key) => Object.entries(FEATURE_DEPENDENCIES).filter(([, deps]) => deps.includes(key)).map(([k]) => k);
  const setFlagStatus = (key, newStatus) => {
    const flag = flags.find((f) => f.key === key);
    if (!flag || flag.status === newStatus) return;
    if (flag.status === "enabled" && newStatus !== "enabled") {
      const blockers = dependents(key).filter((depKey) => flags.find((f) => f.key === depKey)?.status === "enabled");
      if (blockers.length > 0) {
        setBlockedMsg(`Can't turn off ${flag.label} -- ${blockers.map((k) => flags.find((f) => f.key === k)?.label).join(", ")} depend${blockers.length === 1 ? "s" : ""} on it. Turn those off first.`);
        setTimeout(() => setBlockedMsg(null), 3500);
        return;
      }
    }
    const deps = FEATURE_DEPENDENCIES[key] || [];
    const missingDep = deps.find((depKey) => flags.find((f) => f.key === depKey)?.status !== "enabled");
    if (newStatus === "enabled" && missingDep) {
      setBlockedMsg(`${flag.label} needs ${flags.find((f) => f.key === missingDep)?.label} enabled first.`);
      setTimeout(() => setBlockedMsg(null), 3500);
      return;
    }
    setFlags((f) => f.map((x) => (x.key === key ? { ...x, status: newStatus } : x)));
  };
  // Deterministic adoption % per flag, seeded from its key so it's stable across renders
  // rather than random-flickering -- a real illustrative figure, not a live metric.
  const adoptionFor = (key) => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return 20 + (hash % 76);
  };
  const statusMeta = { enabled: { label: "Enabled", cls: "done" }, disabled: { label: "Disabled", cls: "" }, beta: { label: "Beta", cls: "prep" }, coming_soon: { label: "Coming soon", cls: "route" } };
  const q = query.trim().toLowerCase();
  const filtered = q ? flags.filter((f) => f.label.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q) || f.app.toLowerCase().includes(q)) : flags;
  // BUG FIX: this used to be a hardcoded list of app names, which silently
  // hid the Healthcare, Super Admin, and Support categories from the Manage
  // tab entirely (they only ever showed up in Adoption view or search,
  // never here). Deriving the list from the actual flags means a new
  // category never goes invisible again.
  const apps = [...new Set(flags.map((f) => f.app))];
  const enabledCount = flags.filter((f) => f.status === "enabled").length;
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Feature Marketplace</div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="ghost-btn-sm" style={view === "manage" ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setView("manage")}>Manage</button>
            <button className="ghost-btn-sm" style={view === "adoption" ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setView("adoption")}>Adoption</button>
          </div>
        </div>
        <div className="muted" style={{ marginBottom: 10 }}>{flags.length} features across the platform -- {enabledCount} currently enabled. {view === "manage" ? "Enable, disable, or run any feature in beta platform-wide." : "How much real usage each enabled feature is seeing, to see what's actually landing."}</div>
        {blockedMsg && <div className="muted small" style={{ marginBottom: 10, color: "#DC2626", background: "#FEF2F2", borderRadius: 8, padding: "8px 10px" }}><AlertTriangle size={11} style={{ verticalAlign: "middle" }} /> {blockedMsg}</div>}
        <div className="search-wrap-cu" style={{ marginBottom: 4 }}>
          <Search size={15} /><input placeholder="Search features..." value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button onClick={() => setQuery("")}><X size={14} /></button>}
        </div>
      </div>
      {view === "adoption" ? (
        <div className="panel enter">
          <div className="panel-title">Adoption by feature</div>
          <div className="list-col">
            {[...filtered].filter((f) => f.status === "enabled" || f.status === "beta").sort((a, b) => adoptionFor(b.key) - adoptionFor(a.key)).map((f) => {
              const pct = adoptionFor(f.key);
              return (
                <div key={f.key} className="cat-top">
                  <span className="muted small" style={{ flex: 1 }}>{f.label}</span>
                  <div className="bar-track" style={{ flex: 2, marginRight: 10 }}><div className="bar-fill-h" style={{ width: `${pct}%`, background: pct >= 60 ? "#16A34A" : pct >= 35 ? "#F59E0B" : "#DC2626" }} /></div>
                  <span className="mono small">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : apps.map((appName) => {
        const items = filtered.filter((f) => f.app === appName);
        if (items.length === 0) return null;
        return (
          <div className="panel enter" key={appName}>
            <div className="panel-title-row"><div className="panel-title">{appName}</div><span className="muted small">{items.length} feature{items.length !== 1 ? "s" : ""}</span></div>
            <div className="feature-grid">
              {items.map((f, i) => {
                const meta = statusMeta[f.status];
                return (
                  <div className="feature-card row-enter" key={f.key} style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="feature-top"><div className="card-name">{f.label}</div><span className={`status-pill ${meta.cls}`}>{meta.label}</span></div>
                    <div className="muted" style={{ marginBottom: f.cost ? 8 : 12 }}>{f.desc}</div>
                    {f.cost && <div className="muted small" style={{ marginBottom: 12, fontStyle: "italic" }}>{f.cost}</div>}
                    {FEATURE_DEPENDENCIES[f.key] && <div className="muted small" style={{ marginBottom: 8 }}><Lock size={10} style={{ verticalAlign: "middle" }} /> Needs: {FEATURE_DEPENDENCIES[f.key].map((k) => flags.find((x) => x.key === k)?.label).join(", ")}</div>}
                    {dependents(f.key).length > 0 && <div className="muted small" style={{ marginBottom: 8 }}><Lock size={10} style={{ verticalAlign: "middle" }} /> Required by: {dependents(f.key).map((k) => flags.find((x) => x.key === k)?.label).join(", ")}</div>}
                    <select className="sort-select" value={f.status} onChange={(e) => setFlagStatus(f.key, e.target.value)}>
                      <option value="disabled">Disabled</option>
                      <option value="enabled">Enabled</option>
                      <option value="beta">Beta</option>
                      <option value="coming_soon">Coming soon</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="panel enter"><div className="empty-note">No features match "{query}".</div></div>
      )}
    </div>
  );
}

function NotificationsSection({ onNavigate }) {
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Notifications</div>
        <div className="list-col">
          {NOTIF_LIST.map((n, i) => (
            <button key={i} className="pending-row notif-row-full" onClick={() => onNavigate(n.goTo)}>
              <div className="pending-icon" style={{ background: n.color + "1A", color: n.color }}><n.icon size={14} /></div>
              <div className="ti-mid"><div className="card-name">{n.title}</div><div className="muted">{n.sub}</div></div>
              <div className="muted small">{n.time}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersLedgerSection() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [savedViews, setSavedViews] = useState([{ name: "All orders", status: "all" }]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const filtered = statusFilter === "all" ? ORDERS_LEDGER : ORDERS_LEDGER.filter((o) => o.status === statusFilter);
  const statuses = ["all", ...ORDER_STATUSES];
  const saveView = () => {
    if (!viewName.trim()) return;
    setSavedViews((v) => [...v, { name: viewName, status: statusFilter }]);
    setViewName(""); setSaveOpen(false);
  };
  const exportOrders = () => {
    const rows = [["Order", "Customer", "Vendor", "Customer Paid", "Seller Gets", "Platform (product)", "Rider Gets", "Platform (delivery)", "Status"]];
    filtered.forEach((o) => {
      const b = orderBreakdown(o);
      rows.push([o.id, o.customer, o.vendor, Math.round(b.grandTotal), Math.round(b.sellerGets), Math.round(b.productFee), Math.round(b.riderGets), Math.round(b.deliveryFeeCut), o.status]);
    });
    exportCsv("medra-orders.csv", rows);
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Orders -- full price breakdown</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="muted small">Product commission {(PRODUCT_COMMISSION_RATE * 100).toFixed(0)}% -- Delivery {(DELIVERY_COMMISSION_NORMAL * 100).toFixed(0)}% normal / {(DELIVERY_COMMISSION_PEAK * 100).toFixed(0)}% peak</span>
            <button className="ghost-btn-sm" onClick={exportOrders}><FileDown size={12} /> Export CSV</button>
          </div>
        </div>
        <div className="cat-top" style={{ marginBottom: 12 }}>
          <div className="chip-row">
            {savedViews.map((v) => <button key={v.name} className={`chip ${statusFilter === v.status ? "active" : ""}`} onClick={() => setStatusFilter(v.status)}>{v.name}</button>)}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select className="sort-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statuses.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
            </select>
            {saveOpen ? (
              <>
                <input className="save-view-input" placeholder="View name" value={viewName} onChange={(e) => setViewName(e.target.value)} />
                <button className="ghost-btn-sm" onClick={saveView}>Save</button>
              </>
            ) : (
              <button className="ghost-btn-sm" onClick={() => setSaveOpen(true)}>Save this view</button>
            )}
          </div>
        </div>
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Vendor</th><th>Customer Paid</th><th>Seller Gets</th><th>Platform (product)</th><th>Rider Gets</th><th>Platform (delivery)</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((o, i) => {
              const b = orderBreakdown(o);
              return (
                <tr key={o.id} className="row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="mono">{o.id}</td>
                  <td>{o.customer} {o.isGuest && <span className="status-pill prep" style={{ marginLeft: 4 }}>Guest</span>}</td>
                  <td>{o.vendor}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{money(b.grandTotal)}</td>
                  <td className="mono">{money(b.sellerGets)}</td>
                  <td className="mono" style={{ color: "#7C3AED" }}>{money(b.productFee)}</td>
                  <td className="mono">{money(b.riderGets)}</td>
                  <td className="mono" style={{ color: "#7C3AED" }}>{money(b.deliveryFeeCut)} {o.peak && <span className="status-pill route">peak</span>}</td>
                  <td>{(() => { const cls = statusPillClass(o.status); return cls ? <span className={`status-pill ${cls}`}>{o.status}</span> : o.status; })()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function exportCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const LANDING_FAQS = [
  { q: "What cities does Medra operate in?", a: "Currently live in Ibadan -- more cities coming soon.", audience: "all" },
  { q: "How does Medra verify sellers and riders?", a: "Every seller and rider goes through an application and verification process before they can accept orders.", audience: "all" },
  { q: "Is it safe to pay on Medra?", a: "Yes -- every order is covered by buyer protection, and payments are processed securely. If something goes wrong, support is already looking into it.", audience: "customer" },
  { q: "Can I use Medra without creating an account?", a: "No -- every order requires an account. It lets us verify who's ordering, keep a full order history tied to you, and resolve any issue quickly if something goes wrong.", audience: "customer" },
  { q: "What if I need to cancel or change an order?", a: "You can cancel or edit an order for free any time before the seller confirms it. After that, contact support and we'll help sort it out.", audience: "customer" },
  { q: "What happens if my delivery is late?", a: "If a delivery runs past its estimated time, you can message your rider directly or contact support -- late deliveries are tracked and factored into rider performance.", audience: "customer" },
  { q: "What happens to my points if I don't use them?", a: "Points don't expire, but they can only be applied toward products, never delivery fees, and they don't convert back to cash.", audience: "customer" },
  { q: "Can I return or get a refund for a damaged item?", a: "Report the issue from your order's tracking screen with a photo -- eligible items (excluding food, medication, and perishables) go under review, and you'll see the outcome in your Orders once it's resolved.", audience: "customer" },
  { q: "Do delivery fees change throughout the day?", a: "Delivery fees can vary by time and distance, but you always see the exact fee before you check out -- no surprises.", audience: "customer" },
  { q: "Can I message my rider or seller directly?", a: "Yes -- once an order is placed, you can message your rider for delivery updates, and sellers for questions about your order. It goes both ways too: sellers and riders can message you directly as well, not just reply.", audience: "customer" },
  { q: "What if two sellers have the same product at different prices?", a: "You'll see every seller offering that product side by side, so you can pick based on price, rating, or delivery time.", audience: "customer" },
  { q: "Is there a minimum order amount?", a: "No minimum -- order as little or as much as you need.", audience: "customer" },
  { q: "When do sellers get paid?", a: "Sellers choose their own payout schedule -- daily, weekly, or at a set time every day -- with a full transaction history and every fee itemized, so there are no surprises on payout day.", audience: "seller" },
  { q: "How do I become a seller on Medra?", a: "Apply from your account settings with a few details about your store -- we review applications within 1-2 business days.", audience: "seller" },
  { q: "How do I become a rider on Medra?", a: "Apply from your account settings with a few details about your vehicle -- we review applications within 1-2 business days.", audience: "rider" },
  { q: "Can I choose my own delivery hours?", a: "Yes -- go online whenever you want to work, with no fixed shifts or minimum hours required.", audience: "rider" },
  { q: "What if I can't complete a delivery I've already accepted?", a: "You can hand it off to another available rider nearby right from the app -- no penalty to you.", audience: "rider" },
];

const COMMUNITY_CHANNELS = [
  { key: "peers", label: "Admin Community" },
  { key: "all", label: "All Medra" },
];
const COMMUNITY_SEED = {
  peers: [
    { author: "Priya M.", role: "Admin", time: "8:12 AM", text: "Dispute volume looks lighter than usual this morning, nice change." },
    { author: "Casey W.", role: "Admin", time: "8:50 AM", text: "Agreed. New vendor approvals are backing up a bit though, heads up." },
    { author: "Jordan B.", role: "Admin", time: "9:20 AM", text: "The View-As audit log has been really handy for tracing support cases." },
  ],
  all: [
    { author: "Medra Team", role: "Official", time: "9:00 AM", text: "Reminder: peak delivery hours today run 6-10am and 4-8pm as usual." },
    { author: "Northside Espresso Bar", role: "Seller", time: "8:25 AM", text: "Good morning everyone! Hope it's a great day for everyone on the platform." },
    { author: "John Rider", role: "Rider", time: "8:40 AM", text: "Roads are clear across Lekki this morning, should be fast deliveries today." },
    { author: "Amara O.", role: "Customer", time: "9:10 AM", text: "Just wanted to say support sorted my issue out really fast, thank you!" },
  ],
};

function CommunityScreen() {
  const [channel, setChannel] = useState("peers");
  const [feed, setFeed] = useState(COMMUNITY_SEED);
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
    const mine = { author: "You", role: "Admin", time: "Just now", text: text.trim(), image: imageData };
    setFeed((f) => ({ ...f, [channel]: [...f[channel], mine] }));
    setText("");
    setImageData(null);
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Community</div>
        <div className="chip-row" style={{ marginBottom: 14 }}>
          {COMMUNITY_CHANNELS.map((c) => <button key={c.key} className={`chip ${channel === c.key ? "active" : ""}`} onClick={() => setChannel(c.key)}>{c.label}</button>)}
        </div>
        <div className="community-feed">
          {feed[channel].map((m, i) => (
            <div key={i} className="community-msg">
              <div className="driver-avatar sm">{m.author[0]}</div>
              <div className="ti-mid">
                <div className="community-msg-meta"><span className="card-name">{m.author}</span><span className={`status-pill ${m.role === "Official" ? "prep" : "done"}`}>{m.role}</span><span className="muted small">{m.time}</span></div>
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
          <input placeholder="Share something with the community..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="primary-btn-sm" onClick={send}><Send size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function draftSuperAdminAIResponse(input) {
  const t = input.toLowerCase();

  if (t.includes("revenue") || t.includes("gmv")) {
    const rev = KPIS.find((k) => k.key === "revenue");
    return { text: `Total platform revenue is ${rev.value}, up ${rev.delta} week-over-week and ${rev.deltaMonth} month-over-month.` };
  }
  if (t.includes("commission")) {
    const comm = KPIS.find((k) => k.key === "commissions");
    return { text: `Platform commissions stand at ${comm.value}, up ${comm.delta} week-over-week.` };
  }
  if (t.includes("feature") || t.includes("flag") || t.includes("rollout")) {
    const beta = FEATURE_FLAGS.filter((f) => f.status === "beta");
    const comingSoon = FEATURE_FLAGS.filter((f) => f.status === "coming_soon");
    return {
      text: `${FEATURE_FLAGS.filter((f) => f.status === "enabled").length} features are live${beta.length ? `, ${beta.length} in beta (${beta.map((f) => f.label).join(", ")})` : ""}${comingSoon.length ? `, ${comingSoon.length} coming soon (${comingSoon.map((f) => f.label).join(", ")})` : ""}.`,
      actionLabel: "View Feature Marketplace", actionKey: "feature-marketplace",
    };
  }
  if (t.includes("user") || t.includes("rider") || t.includes("seller") || t.includes("platform")) {
    const users = KPIS.find((k) => k.key === "users");
    const riders = KPIS.find((k) => k.key === "riders");
    const sellers = KPIS.find((k) => k.key === "sellers");
    return { text: `Platform-wide: ${users.value} total users, ${riders.value} active riders, ${sellers.value} active sellers.` };
  }
  if (t.includes("order")) {
    const orders = KPIS.find((k) => k.key === "orders");
    return { text: `${orders.value} total orders processed, up ${orders.delta} week-over-week.` };
  }
  return { text: "I can help with things like \"what's our revenue\", \"how are commissions trending\", \"what features are in beta\", or \"platform user numbers\". What would you like to know?" };
}

function AIAssistantScreen({ onNavigate }) {
  const [chat, setChat] = useState([{ from: "ai", text: "Hi! I'm your Medra assistant. Ask me about platform revenue, commissions, feature rollouts, or user numbers." }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const suggestions = ["What's our revenue?", "What features are in beta?", "Platform user numbers?"];

  const ask = (text) => {
    if (!text.trim()) return;
    setChat((c) => [...c, { from: "me", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const res = draftSuperAdminAIResponse(text);
      setChat((c) => [...c, { from: "ai", text: res.text, actionLabel: res.actionLabel, actionKey: res.actionKey }]);
    }, 900);
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title"><Sparkles size={15} style={{ verticalAlign: "middle", marginRight: 4 }} /> Ask Medra</div></div>
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
          <input placeholder="Ask me anything about the platform..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(input)} />
          <button className="primary-btn-sm" onClick={() => ask(input)}><Send size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function FaqEditorSection() {
  const [faqs, setFaqs] = useState(LANDING_FAQS);
  const [editingIdx, setEditingIdx] = useState(null);
  const [draft, setDraft] = useState("");
  const startEdit = (i) => { setEditingIdx(i); setDraft(faqs[i].a); };
  const save = (i) => { setFaqs((f) => f.map((item, idx) => (idx === i ? { ...item, a: draft } : item))); setEditingIdx(null); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Landing Page FAQ</div><span className="muted small">Editable here -- not yet synced live to the public site (needs a shared backend/CMS)</span></div>
        <div className="list-col">
          {faqs.map((f, i) => (
            <div key={f.q} className="flag-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 8 }}>
              <div className="cat-top" style={{ width: "100%" }}>
                <span className="card-name">{f.q}</span>
                {editingIdx !== i && <button className="ghost-btn-sm" onClick={() => startEdit(i)}><Pencil size={11} /> Edit</button>}
              </div>
              {editingIdx === i ? (
                <div style={{ width: "100%" }}>
                  <input className="save-view-input" style={{ width: "100%", marginBottom: 8 }} value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="primary-btn-sm" onClick={() => save(i)}>Save</button>
                    <button className="ghost-btn-sm" onClick={() => setEditingIdx(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="muted">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PROMOTIONS_SEED = [
  { id: "PR1", name: "Weekend Flash Sale", type: "Percent off", value: "20%", ends: "Aug 24", status: "active" },
  { id: "PR2", name: "New Vendor Boost", type: "Featured placement", value: "--", ends: "Aug 30", status: "scheduled" },
];
function PromotionsSection() {
  const [promos, setPromos] = useState(PROMOTIONS_SEED);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Percent off");
  const [value, setValue] = useState("");
  const [ends, setEnds] = useState("");
  const [abModalFor, setAbModalFor] = useState(null);
  const [variantBValue, setVariantBValue] = useState("");
  const create = () => {
    if (!name.trim()) return;
    setPromos((p) => [{ id: `PR${Date.now()}`, name: name.trim(), type, value: value.trim() || "--", ends: ends.trim() || "No end date", status: "scheduled" }, ...p]);
    setName(""); setValue(""); setEnds(""); setModalOpen(false);
  };
  const toggleStatus = (id) => setPromos((p) => p.map((x) => x.id === id ? { ...x, status: x.status === "active" ? "paused" : x.status === "paused" ? "active" : x.status === "scheduled" ? "active" : x.status } : x));
  const remove = (id) => setPromos((p) => p.filter((x) => x.id !== id));
  const startAbTest = () => {
    if (!variantBValue.trim()) return;
    const idHash = [...abModalFor].reduce((s, c) => s + c.charCodeAt(0), 7);
    setPromos((p) => p.map((x) => x.id === abModalFor ? {
      ...x,
      abTest: {
        variantA: { value: x.value, conversions: 8 + (idHash % 15), revenue: 42000 + (idHash % 8) * 3100 },
        variantB: { value: variantBValue.trim(), conversions: 8 + ((idHash * 3) % 20), revenue: 38000 + ((idHash * 3) % 9) * 3400 },
      },
    } : x));
    setAbModalFor(null); setVariantBValue("");
  };
  const endAbTest = (id, keepValue) => setPromos((p) => p.map((x) => x.id === id ? { ...x, value: keepValue, abTest: null } : x));
  return (
    <div className="section-pad">
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>New promotion</div>
            <div className="field" style={{ marginBottom: 10 }}><span>Name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekend Flash Sale" /></div>
            <div className="field" style={{ marginBottom: 10 }}>
              <span>Type</span>
              <select className="sort-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option>Percent off</option><option>Fixed amount off</option><option>Featured placement</option><option>Delivery discount</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 10 }}><span>Value</span><input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 20% or ₦1,000" /></div>
            <div className="field" style={{ marginBottom: 16 }}><span>Ends</span><input type="text" value={ends} onChange={(e) => setEnds(e.target.value)} placeholder="e.g. Aug 30" /></div>
            <button className="primary-btn-sm wide" onClick={create}>Create promotion</button>
          </div>
        </div>
      )}
      {abModalFor && (
        <div className="modal-backdrop" onClick={() => setAbModalFor(null)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAbModalFor(null)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Start A/B test</div>
            <div className="muted small" style={{ marginBottom: 12 }}>Half of eligible customers see the current value (Variant A), half see Variant B. Simulated performance for this prototype phase.</div>
            <div className="field" style={{ marginBottom: 16 }}><span>Variant B value</span><input type="text" value={variantBValue} onChange={(e) => setVariantBValue(e.target.value)} placeholder="e.g. 25% or 50% off delivery" /></div>
            <button className="primary-btn-sm wide" disabled={!variantBValue.trim()} onClick={startAbTest}>Start test</button>
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Promotions & Deals</div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ New Promotion</button></div>
        <table className="admin-table">
          <thead><tr><th>Promo</th><th>Type</th><th>Value</th><th>Ends</th><th>Status</th><th /></tr></thead>
          <tbody>
            {promos.map((p) => (
              <React.Fragment key={p.id}>
                <tr>
                  <td className="card-name">{p.name}</td><td>{p.type}</td><td>{p.abTest ? `A: ${p.abTest.variantA.value} vs B: ${p.abTest.variantB.value}` : p.value}</td><td className="muted small">{p.ends}</td>
                  <td><span className={`status-pill ${p.status === "active" ? "done" : p.status === "paused" ? "delay" : "prep"}`}>{p.status}</span></td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="ghost-btn-sm" onClick={() => toggleStatus(p.id)}>{p.status === "active" ? "Pause" : "Activate"}</button>
                    {!p.abTest && <button className="ghost-btn-sm" onClick={() => setAbModalFor(p.id)}>A/B test</button>}
                    <button className="ghost-btn-sm deny" onClick={() => confirmAction({ title: "Delete this item?", message: "It will be permanently removed in this preview.", confirmLabel: "Delete" }, () => remove(p.id))}>Delete</button>
                  </td>
                </tr>
                {p.abTest && (
                  <tr>
                    <td colSpan={6}>
                      <div className="cat-top" style={{ gap: 16, padding: "6px 0" }}>
                        <span className="muted small">Variant A ({p.abTest.variantA.value}): {p.abTest.variantA.conversions} conversions, {money(p.abTest.variantA.revenue)}</span>
                        <span className="muted small">Variant B ({p.abTest.variantB.value}): {p.abTest.variantB.conversions} conversions, {money(p.abTest.variantB.revenue)}</span>
                        <button className="ghost-btn-sm" onClick={() => endAbTest(p.id, p.abTest.variantA.revenue >= p.abTest.variantB.revenue ? p.abTest.variantA.value : p.abTest.variantB.value)}>End test, keep winner</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const REFERRAL_RATES_SEED = { customer: 200, seller: 1000, rider: 500 };
const TOP_REFERRERS_SEED = [
  { name: "Blessing O.", count: 34, type: "Customer" },
  { name: "Fresh Fields Grocery", count: 12, type: "Seller" },
  { name: "Marcus T.", count: 9, type: "Rider" },
];
function ReferralSection() {
  const [rates, setRates] = useState(REFERRAL_RATES_SEED);
  const updateRate = (key, val) => setRates((r) => ({ ...r, [key]: Math.max(0, Number(val) || 0) }));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Referral & Rewards</div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 4 }}>
          <div className="stat-mini enter"><div className="muted">Active referral codes</div><div className="kpi-value" style={{ fontSize: 18 }}>4,210</div></div>
          <div className="stat-mini enter"><div className="muted">Rewards paid out</div><div className="kpi-value" style={{ fontSize: 18 }}>{money(18400)}</div></div>
          <div className="stat-mini enter"><div className="muted">Avg. referrals per user</div><div className="kpi-value" style={{ fontSize: 18 }}>1.4</div></div>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Reward per successful referral, by account type</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Different account types earn different reward amounts (points) for a successful referral.</div>
        <div className="list-col">
          {Object.entries(rates).map(([key, val]) => (
            <div key={key} className="cat-top">
              <span className="muted" style={{ textTransform: "capitalize" }}>{key} refers someone</span>
              <input type="number" min="0" style={{ width: 100, textAlign: "right" }} value={val} onChange={(e) => updateRate(key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Top referrers this month</div>
        <div className="list-col">
          {TOP_REFERRERS_SEED.map((r) => (
            <div key={r.name} className="pending-row"><div className="ti-mid"><div className="card-name">{r.name}</div><div className="muted small">{r.type}</div></div><div className="mono">{r.count} referrals</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

const MEMBERSHIP_PLANS_SEED = [
  { id: "MP1", name: "Medra Plus", monthly: 999, annual: 9990, members: 12400, perks: "Delivery discounts, 2x points" },
];
function MembershipPlansSection() {
  const [plans, setPlans] = useState(MEMBERSHIP_PLANS_SEED);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const save = (plan) => {
    setPlans((p) => p.find((x) => x.id === plan.id) ? p.map((x) => x.id === plan.id ? plan : x) : [...p, plan]);
    setEditing(null); setAdding(false);
  };
  const remove = (id) => setPlans((p) => p.filter((x) => x.id !== id));
  const Form = ({ plan, onSave, onClose }) => {
    const [name, setName] = useState(plan?.name || "");
    const [monthly, setMonthly] = useState(plan?.monthly || 0);
    const [annual, setAnnual] = useState(plan?.annual || 0);
    const [perks, setPerks] = useState(plan?.perks || "");
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
          <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>{plan ? "Edit plan" : "New membership plan"}</div>
          <div className="field" style={{ marginBottom: 10 }}><span>Name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Medra Plus" /></div>
          <div className="field" style={{ marginBottom: 10 }}><span>Monthly price (\u20a6)</span><input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value) || 0)} /></div>
          <div className="field" style={{ marginBottom: 10 }}><span>Annual price (\u20a6)</span><input type="number" value={annual} onChange={(e) => setAnnual(Number(e.target.value) || 0)} /></div>
          <div className="field" style={{ marginBottom: 16 }}><span>Perks</span><input type="text" value={perks} onChange={(e) => setPerks(e.target.value)} placeholder="e.g. Delivery discounts, 2x points" /></div>
          <button className="primary-btn-sm wide" disabled={!name.trim()} onClick={() => onSave({ id: plan?.id || `MP${Date.now()}`, name: name.trim(), monthly, annual, members: plan?.members || 0, perks: perks.trim() })}>Save plan</button>
        </div>
      </div>
    );
  };
  return (
    <div className="section-pad">
      {(editing || adding) && <Form plan={editing} onSave={save} onClose={() => { setEditing(null); setAdding(false); }} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Membership Plans</div><button className="primary-btn-sm" onClick={() => setAdding(true)}>+ New Plan</button></div>
        <table className="admin-table">
          <thead><tr><th>Plan</th><th>Monthly</th><th>Annual</th><th>Members</th><th>Perks</th><th /></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td className="card-name">{p.name}</td><td>{money(p.monthly)}/mo</td><td>{money(p.annual)}/yr</td><td>{p.members.toLocaleString()}</td><td className="muted small">{p.perks}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button className="ghost-btn-sm" onClick={() => setEditing(p)}>Edit</button>
                  <button className="ghost-btn-sm deny" onClick={() => confirmAction({ title: "Delete this item?", message: "It will be permanently removed in this preview.", confirmLabel: "Delete" }, () => remove(p.id))}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnnouncementsSection() {
  const [items, setItems] = useState(ANNOUNCEMENTS.map((a) => ({ title: a.title, body: a.sub })));
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const post = () => {
    if (!title.trim()) return;
    setItems((it) => [{ title, body }, ...it]);
    setTitle(""); setBody(""); setModalOpen(false);
  };
  return (
    <div className="section-pad">
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>New announcement</div>
            <div className="field" style={{ marginBottom: 10 }}><span>Title</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance" /></div>
            <div className="field" style={{ marginBottom: 16 }}><span>Details</span><input type="text" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What should people know?" /></div>
            <button className="primary-btn-sm wide" onClick={post}>Post announcement</button>
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Announcements</div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ New Announcement</button></div>
        <div className="list-col">
          {items.map((a, i) => <div key={i} className="pending-row"><div className="ti-mid"><div className="card-name">{a.title}</div><div className="muted">{a.body}</div></div></div>)}
        </div>
      </div>
    </div>
  );
}

const BROADCAST_SEGMENTS = ["All Customers", "All Sellers", "All Riders", "Sellers -- Groceries", "Sellers -- Pharmacy", "Riders -- Lagos zone"];

function BroadcastSection({ sentLog, setSentLog }) {
  const [segment, setSegment] = useState(BROADCAST_SEGMENTS[0]);
  const [message, setMessage] = useState("");
  const recipientCount = { "All Customers": 4820, "All Sellers": 312, "All Riders": 884, "Sellers -- Groceries": 96, "Sellers -- Pharmacy": 41, "Riders -- Lagos zone": 512 }[segment];
  const send = () => {
    if (!message.trim()) return;
    setSentLog((l) => [{ segment, message, count: recipientCount, time: "Just now" }, ...l]);
    setMessage("");
  };
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ maxWidth: 520 }}>
        <div className="panel-title">Broadcast a message</div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>Send to</span>
          <select className="sort-select" value={segment} onChange={(e) => setSegment(e.target.value)}>{BROADCAST_SEGMENTS.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <div className="muted small" style={{ marginBottom: 10 }}>Will reach ~{recipientCount.toLocaleString()} recipients</div>
        <div className="field" style={{ marginBottom: 14 }}><span>Message</span><input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do you want to tell them?" /></div>
        <button className="primary-btn-sm wide" onClick={send}><Send size={13} /> Send broadcast</button>
      </div>
      <div className="panel enter">
        <div className="panel-title">Sent broadcasts</div>
        {sentLog.length === 0 ? <EmptyStateNote>No broadcasts sent yet.</EmptyStateNote> : (
          <div className="list-col">
            {sentLog.map((b, i) => (
              <div key={i} className="pending-row">
                <div className="pending-icon" style={{ background: "#EEF2FF", color: "#6D28D9" }}><Send size={13} /></div>
                <div className="ti-mid"><div className="card-name">{b.segment}</div><div className="muted">{b.message}</div></div>
                <div className="muted small">{b.count.toLocaleString()} sent -- {b.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const PERMISSION_MATRIX_ROLES = ["Admin", "Payment Staff", "Support Staff", "Content Moderator"];
const PERMISSION_MATRIX_CAPS = ["View orders", "Refund orders", "Suspend accounts", "Edit commissions", "View financials", "Post announcements"];
const DEFAULT_PERMS = {
  "Admin": { "View orders": true, "Refund orders": true, "Suspend accounts": true, "Edit commissions": false, "View financials": true, "Post announcements": true },
  "Payment Staff": { "View orders": true, "Refund orders": true, "Suspend accounts": false, "Edit commissions": false, "View financials": true, "Post announcements": false },
  "Support Staff": { "View orders": true, "Refund orders": false, "Suspend accounts": false, "Edit commissions": false, "View financials": false, "Post announcements": false },
  "Content Moderator": { "View orders": false, "Refund orders": false, "Suspend accounts": true, "Edit commissions": false, "View financials": false, "Post announcements": true },
};

const ACTIVE_SESSIONS = [
  { id: "s1", device: "MacBook Pro -- Chrome", location: "Lagos, Nigeria", ip: "197.210.28.114", lastActive: "Active now", current: true, icon: Monitor },
  { id: "s2", device: "iPhone 15 -- Medra App", location: "Lagos, Nigeria", ip: "197.210.28.201", lastActive: "2 hours ago", current: false, icon: Smartphone },
  { id: "s3", device: "Windows PC -- Edge", location: "Abuja, Nigeria", ip: "105.112.4.87", lastActive: "3 days ago", current: false, icon: Monitor },
];

const REPORT_TYPES = ["Weekly GMV report", "Vendor performance report", "Rider safety report", "Refunds & disputes summary", "Platform growth summary"];
const FREQUENCIES = ["Daily", "Weekly", "Monthly"];
const SCHEDULED_REPORTS = [
  { id: "sr1", report: "Weekly GMV report", frequency: "Weekly", email: "leadership@medra.com", nextRun: "Mon, Aug 24" },
  { id: "sr2", report: "Rider safety report", frequency: "Monthly", email: "safety@medra.com", nextRun: "Sep 1" },
];

function ReportsScreen() {
  const [scheduled, setScheduled] = useState(SCHEDULED_REPORTS);
  const [report, setReport] = useState(REPORT_TYPES[0]);
  const [frequency, setFrequency] = useState("Weekly");
  const [email, setEmail] = useState("leadership@medra.com");
  const nextRunFor = (freq) => (freq === "Daily" ? "Tomorrow" : freq === "Weekly" ? "Mon, next week" : "1st of next month");
  const schedule = () => {
    if (!email.trim()) return;
    setScheduled((s) => [...s, { id: `sr-${Date.now()}`, report, frequency, email, nextRun: nextRunFor(frequency) }]);
  };
  const cancel = (id) => setScheduled((s) => s.filter((r) => r.id !== id));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Schedule a recurring report</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div className="field" style={{ flex: 1 }}><span>Report</span><select className="sort-select" value={report} onChange={(e) => setReport(e.target.value)}>{REPORT_TYPES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="field" style={{ flex: 1 }}><span>Frequency</span><select className="sort-select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>{FREQUENCIES.map((f) => <option key={f}>{f}</option>)}</select></div>
        </div>
        <div className="field" style={{ marginBottom: 14 }}><span>Send to</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@medra.com" /></div>
        <button className="primary-btn-sm" onClick={schedule}><Send size={13} /> Schedule delivery</button>
      </div>
      <div className="panel enter">
        <div className="panel-title">Scheduled reports</div>
        {scheduled.length === 0 ? <EmptyStateNote>No reports scheduled.</EmptyStateNote> : (
          <div className="list-col">
            {scheduled.map((r) => (
              <div key={r.id} className="pending-row">
                <FileBarChart size={15} />
                <div className="ti-mid"><div className="card-name">{r.report}</div><div className="muted small">{r.frequency} -- sent to {r.email} -- next: {r.nextRun}</div></div>
                <button className="ghost-btn-sm" onClick={() => cancel(r.id)}>Cancel</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const FEATURE_ROLLOUTS = [
  { key: "new_checkout", label: "Redesigned checkout flow", desc: "New multi-step checkout with delivery instructions and split payment", pct: 25 },
  { key: "ai_recommendations", label: "AI product recommendations", desc: "Personalized \"Recommended for you\" powered by order history", pct: 10 },
  { key: "rider_batching", label: "Multi-order batching for riders", desc: "Let riders combine nearby orders into one run", pct: 50 },
  { key: "dark_mode", label: "Dark mode", desc: "Platform-wide dark theme", pct: 0 },
];

function FeatureRolloutSection() {
  const [rollouts, setRollouts] = useState(FEATURE_ROLLOUTS.map((f) => ({ ...f, history: [{ pct: f.pct, at: "Initial" }] })));
  const setPct = (key, pct) => setRollouts((r) => r.map((f) => (f.key === key ? { ...f, pct, history: [{ pct, at: "Just now" }, ...f.history] } : f)));
  const rollback = (key) => setRollouts((r) => r.map((f) => {
    if (f.key !== key || f.history.length < 2) return f;
    const [, previous, ...rest] = f.history;
    return { ...f, pct: previous.pct, history: [{ pct: previous.pct, at: "Just now (rolled back)" }, previous, ...rest] };
  }));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Feature Rollout</div><span className="muted small">Gradually roll features out to a percentage of users</span></div>
        <div className="list-col">
          {rollouts.map((f) => (
            <div key={f.key} className="rollout-row">
              <div className="cat-top"><div className="ti-mid"><div className="card-name">{f.label}</div><div className="muted small">{f.desc}</div></div><span className="mono" style={{ fontWeight: 700 }}>{f.pct}%</span></div>
              <input type="range" min={0} max={100} step={5} value={f.pct} onChange={(e) => setPct(f.key, Number(e.target.value))} className="radius-slider" />
              <div className="cat-top muted small"><span>Off</span><span>All users</span></div>
              <div className="cat-top" style={{ marginTop: 6 }}>
                <span className="muted small">History: {f.history.slice(0, 3).map((h) => `${h.pct}%`).join(" \u2190 ")}{f.history.length > 3 ? " \u2190 ..." : ""}</span>
                <button className="ghost-btn-sm" disabled={f.history.length < 2} onClick={() => rollback(f.key)}>Roll back</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const COUNTRIES_REGIONS_SEED = [
  { id: "NG", country: "Nigeria", currency: "NGN (\u20a6)", active: true, states: [
    { name: "Lagos", active: true }, { name: "Abuja (FCT)", active: true }, { name: "Kano", active: true }, { name: "Rivers (PH)", active: true }, { name: "Oyo", active: false },
  ]},
  { id: "GH", country: "Ghana", currency: "GHS (\u20b5)", active: false, states: [
    { name: "Greater Accra", active: false }, { name: "Ashanti", active: false },
  ]},
  { id: "KE", country: "Kenya", currency: "KES (KSh)", active: false, states: [
    { name: "Nairobi", active: false },
  ]},
];
function CountriesRegionsSection() {
  const [countries, setCountries] = useState(COUNTRIES_REGIONS_SEED);
  const toggleCountry = (id) => setCountries((cs) => cs.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  const toggleState = (id, stateName) => setCountries((cs) => cs.map((c) => c.id === id ? { ...c, states: c.states.map((s) => s.name === stateName ? { ...s, active: !s.active } : s) } : c));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Countries & Regions<RequiresBadge /></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Turn a country on to make it available on the platform, then control availability state by state.</div>
        <PrototypeNote>toggling here updates this screen only -- there's no backend yet to actually restrict signups/orders by region. This is the config UI ready for that hookup.</PrototypeNote>
        {countries.map((c) => (
          <div key={c.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="flag-row">
              <div className="ti-mid"><div className="card-name">{c.country}</div><div className="muted small">Currency: {c.currency}</div></div>
              <button className={`toggle-mini ${c.active ? "on" : ""}`} onClick={() => toggleCountry(c.id)}><span /></button>
            </div>
            {c.active && (
              <div className="list-col" style={{ marginTop: 8, marginLeft: 12 }}>
                {c.states.map((s) => (
                  <div key={s.name} className="cat-top">
                    <span className="muted small">{s.name}</span>
                    <button className={`toggle-mini ${s.active ? "on" : ""}`} onClick={() => toggleState(c.id, s.name)}><span /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const FIN_PAYMENTS_SEED = [
  { ref: "PMT-9921", customer: "Jordan B.", amount: 3023, method: "Card", status: "settled" },
  { ref: "PMT-9918", customer: "Priya M.", amount: 1450, method: "Wallet", status: "settled" },
  { ref: "PMT-9910", customer: "Sam T.", amount: 8200, method: "Card", status: "pending" },
  { ref: "PMT-9905", customer: "Ngozi A.", amount: 2100, method: "Bank transfer", status: "settled" },
];
const FIN_TOPUPS_SEED = [
  { user: "Jordan B.", amount: 5000, method: "Card", date: "Aug 18" },
  { user: "Sam T.", amount: 2500, method: "Bank transfer", date: "Aug 17" },
  { user: "Kelechi O.", amount: 3000, method: "Card", date: "Aug 16" },
];
function FinancialTransactionsSection({ initialTab }) {
  const [tab, setTab] = useState(initialTab || "payments");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const payments = FIN_PAYMENTS_SEED.filter((p) => !q || p.customer.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q));
  const topups = FIN_TOPUPS_SEED.filter((t) => !q || t.user.toLowerCase().includes(q));
  const txlog = LEDGER.filter((l) => !q || l.to.toLowerCase().includes(q) || l.type.toLowerCase().includes(q));
  return (
    <div className="section-pad">
      <div className="muted small" style={{ marginBottom: 10 }}>Manual wallet adjustments live in their own screen (Wallet Transactions) since they need the multi-admin approval workflow -- this covers customer payments, top-ups, and the settlement ledger.</div>
      <div className="tab-row" style={{ marginBottom: 14 }}>
        <button className={`tab-btn ${tab === "payments" ? "active" : ""}`} onClick={() => setTab("payments")}>Payments</button>
        <button className={`tab-btn ${tab === "topups" ? "active" : ""}`} onClick={() => setTab("topups")}>Top-ups</button>
        <button className={`tab-btn ${tab === "txlog" ? "active" : ""}`} onClick={() => setTab("txlog")}>Transaction Log</button>
      </div>
      <div className="panel enter">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or reference..." style={{ marginBottom: 12 }} />
        {tab === "payments" && (
          <table className="admin-table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
            <tbody>{payments.map((p) => <tr key={p.ref}><td className="mono">{p.ref}</td><td>{p.customer}</td><td className="mono">{money(p.amount)}</td><td className="muted">{p.method}</td><td><span className={`status-pill ${p.status === "settled" ? "done" : "prep"}`}>{p.status}</span></td></tr>)}</tbody>
          </table>
        )}
        {tab === "topups" && (
          <table className="admin-table">
            <thead><tr><th>User</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
            <tbody>{topups.map((t, i) => <tr key={i}><td>{t.user}</td><td className="mono">{money(t.amount)}</td><td className="muted">{t.method}</td><td className="muted small">{t.date}</td></tr>)}</tbody>
          </table>
        )}
        {tab === "txlog" && (
          <table className="admin-table">
            <thead><tr><th>Type</th><th>To</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>{txlog.map((l, i) => <tr key={i}><td>{l.type}</td><td>{l.to}</td><td className="mono">{money(l.amount)}</td><td className="muted small">{l.date}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function WalletAdjustmentSection() {
  const APPROVAL_THRESHOLD = 20000;
  const OTHER_SUPER_ADMINS = ["Amaka Eze", "Chidi Okafor"];
  const [rows, setRows] = useState([
    { user: "Jordan B.", type: "Top-up", amount: 5000, date: "Aug 18", reason: null },
    { user: "Priya M.", type: "Spend", amount: -1450, date: "Aug 18", reason: null },
  ]);
  const [pending, setPending] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const canSave = user.trim() && amount !== 0 && reason.trim();
  const needsApproval = Math.abs(amount) >= APPROVAL_THRESHOLD;
  const save = () => {
    if (needsApproval) {
      setPending((p) => [{ id: `PA${Date.now()}`, user: user.trim(), amount, reason: reason.trim(), approver: null }, ...p]);
    } else {
      setRows((r) => [{ user: user.trim(), type: "Adjustment", amount, date: "Just now", reason: reason.trim() }, ...r]);
    }
    setUser(""); setAmount(0); setReason(""); setModalOpen(false);
  };
  const approve = (id, byWhom) => {
    const item = pending.find((p) => p.id === id);
    if (!item) return;
    setRows((r) => [{ user: item.user, type: "Adjustment", amount: item.amount, date: "Just now", reason: `${item.reason} (approved by ${byWhom})` }, ...r]);
    setPending((p) => p.filter((x) => x.id !== id));
  };
  const decline = (id) => setPending((p) => p.filter((x) => x.id !== id));
  return (
    <div className="section-pad">
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Manual wallet adjustment</div>
            <div className="muted small" style={{ marginBottom: 12 }}>This is a sensitive action -- it's recorded in the Audit Center with your name, the amount, and the reason you give.</div>
            <div className="field" style={{ marginBottom: 10 }}><span>User</span><input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="e.g. Jordan Blake" /></div>
            <div className="field" style={{ marginBottom: 10 }}><span>Amount (\u20a6, negative to deduct)</span><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} /></div>
            <div className="field" style={{ marginBottom: 16 }}><span>Reason (required)</span><input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Goodwill credit for delivery delay" /></div>
            {needsApproval && <div className="muted small" style={{ marginBottom: 12, color: "#EA580C" }}><AlertTriangle size={12} style={{ verticalAlign: "middle" }} /> Adjustments of {money(APPROVAL_THRESHOLD)} or more need a second Super Admin's approval before they take effect.</div>}
            <button className="primary-btn-sm wide" disabled={!canSave} onClick={save}>{needsApproval ? "Submit for approval" : "Save adjustment"}</button>
          </div>
        </div>
      )}
      {pending.length > 0 && (
        <div className="panel enter" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
          <div className="panel-title" style={{ fontSize: 13 }}>Awaiting second approval</div>
          <div className="list-col">
            {pending.map((p) => (
              <div key={p.id} className="pending-row">
                <div className="ti-mid"><div className="card-name">{p.user} -- {p.amount > 0 ? "+" : ""}{money(p.amount)}</div><div className="muted small">{p.reason}</div></div>
                <select className="sort-select" onChange={(e) => e.target.value && approve(p.id, e.target.value)} defaultValue="">
                  <option value="" disabled>Approve as...</option>
                  {OTHER_SUPER_ADMINS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <button className="ghost-btn-sm deny" onClick={() => decline(p.id)}>Decline</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Wallet Transactions<RequiresBadge /></div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ Manual Adjustment</button></div>
        <table className="admin-table">
          <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Date</th><th>Reason</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td className="card-name">{r.user}</td><td>{r.type}</td><td className={`mono ${r.amount < 0 ? "neg" : ""}`}>{r.amount > 0 ? "+" : ""}{money(r.amount)}</td><td className="muted small">{r.date}</td><td className="muted small">{r.reason || "--"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuperAdminWalkthroughModal({ onClose }) {
  const steps = [
    "Platform Administration -- roles & permissions, staff changelog, and the recently-updated feed.",
    "User & Business Management -- users, sellers, riders, products, categories, orders, KYC, delivery.",
    "Financial Management -- payments, payouts & settlements, wallet activity, the commission engine, disputes, transaction logs.",
    "Support & Safety -- support tickets, live chat, SOS & safety, reports/moderation, and staff free-visit approvals.",
    "Marketing & Engagement -- promotions, referral & rewards, membership, announcements, community, giveaways, challenges, payout review.",
    "Reports & Insights -- platform-wide reports and analytics.",
    "Platform Configuration -- system/app/delivery settings, payment methods, feature toggles, rollout, and the Feature Marketplace (where every feature in the app gets enabled/disabled/beta-tested).",
    "Governance & Auditing -- the platform audit log.",
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Walk me through the Super Admin dashboard</div>
        <div className="list-col">
          {steps.map((s, i) => (
            <div key={i} className="pending-row">
              <div className="driver-avatar sm" style={{ background: "var(--purple)" }}>{i + 1}</div>
              <div className="ti-mid muted small">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock inbound queue of staff free-visit requests (see StaffTelehealthVoucherScreen
// on the Admin side). No live cross-app sync in this prototype -- once real,
// this reads the actual pending requests table. Approving generates a real
// voucher code the staffer types into their own Telehealth booking flow.
const MOCK_FREE_VISIT_REQUESTS = [
  { id: "TV-1001", staffName: "Ngozi A. (Support Agent)", activeSince: "2025-08-01", visitsUsedThisYear: 0, reason: "General checkup", status: "pending" },
  { id: "TV-1002", staffName: "Femi O. (Admin, Ops)", activeSince: "2025-03-14", visitsUsedThisYear: 1, reason: "Follow-up", status: "pending" },
];
function generateVoucherCode() {
  return `MEDRA-FREE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function FreeVisitApprovalsSection() {
  const [requests, setRequests] = useState(MOCK_FREE_VISIT_REQUESTS);
  const decide = (id, approve) => {
    setRequests((rs) => rs.map((r) => r.id === id ? { ...r, status: approve ? "approved" : "denied", voucherCode: approve ? generateVoucherCode() : null } : r));
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Free Telehealth Visit Requests<RequiresBadge /></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Admin/Support staff active 90+ days can request up to 2 free telehealth visits per working year. Approving issues a voucher code the staffer enters at booking to bring their cost to ₦0.</div>
        <div className="list-col">
          {requests.map((r) => (
            <div key={r.id} className="pending-row">
              <div className="ti-mid">
                <div className="card-name">{r.staffName}</div>
                <div className="muted small">Active since {r.activeSince} -- {r.visitsUsedThisYear}/2 used this year{r.reason ? ` -- "${r.reason}"` : ""}</div>
                {r.status === "approved" && <div className="muted small" style={{ color: "#16A34A" }}>Voucher: {r.voucherCode}</div>}
              </div>
              {r.status === "pending" ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="ghost-btn-sm" onClick={() => decide(r.id, false)}>Deny</button>
                  <button className="primary-btn-sm" onClick={() => decide(r.id, true)}>Approve</button>
                </div>
              ) : (
                <span className={`status-pill ${r.status === "approved" ? "done" : "delay"}`}>{r.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MyActivityScreen({ activityLog }) {
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  return (
    <div className="section-pad">
      {walkthroughOpen && <SuperAdminWalkthroughModal onClose={() => setWalkthroughOpen(false)} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">My Activity</div><span className="muted small">Your own actions this session -- not the full staff audit log</span></div>
        <button className="ghost-btn-sm" style={{ marginBottom: 12 }} onClick={() => setWalkthroughOpen(true)}><Compass size={12} style={{ verticalAlign: "middle" }} /> Walk me through this dashboard</button>
        {activityLog.length === 0 ? (
          <EmptyStateNote>No activity logged yet this session. Actions like viewing as a user or managing your sessions will show up here.</EmptyStateNote>
        ) : (
          <div className="list-col">
            {activityLog.map((a, i) => (
              <div key={i} className="pending-row"><History size={14} color="#64748B" /><div className="ti-mid card-name" style={{ fontSize: 13 }}>{a.action}</div><div className="muted small">{a.time}</div></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionsScreen({ logActivity }) {
  const [sessions, setSessions] = useState(ACTIVE_SESSIONS);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const doRevoke = () => {
    if (confirmTarget === "all") { setSessions((s) => s.filter((x) => x.current)); logActivity?.("Signed out all other sessions"); }
    else { const dev = sessions.find((s) => s.id === confirmTarget); setSessions((s) => s.filter((x) => x.id !== confirmTarget)); logActivity?.(`Signed out session: ${dev?.device}`); }
    setConfirmTarget(null);
  };
  return (
    <div className="section-pad">
      {confirmTarget && (
        <div className="modal-backdrop" onClick={() => setConfirmTarget(null)}>
          <div className="confirm-modal enter" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={26} color="#DC2626" />
            <div className="card-name" style={{ fontSize: 16, margin: "10px 0 6px" }}>
              {confirmTarget === "all" ? "Sign out all other sessions?" : "Sign out this device?"}
            </div>
            <p className="muted">
              {confirmTarget === "all" ? "Every other device will be signed out immediately. This device stays signed in." : "That device will be signed out immediately and will need to log in again."}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="ghost-btn-sm" style={{ flex: 1 }} onClick={() => setConfirmTarget(null)}>Cancel</button>
              <button className="primary-btn-sm" style={{ flex: 1, background: "#DC2626" }} onClick={doRevoke}>Sign out</button>
            </div>
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Sessions & Devices</div>
          <button className="ghost-btn-sm" onClick={() => {
            const rows = sessions.map((s) => [s.device, s.location, s.ip, s.lastActive, s.current ? "Yes" : "No"]);
            exportCsv("medra-sessions.csv", [["Device", "Location", "IP Address", "Last Active", "This Device"], ...rows]);
          }}><FileDown size={12} /> Export CSV</button>
          {sessions.length > 1 && <button className="ghost-btn-sm" onClick={() => setConfirmTarget("all")}>Sign out all other sessions</button>}
        </div>
        <div className="list-col">
          {sessions.map((s) => (
            <div key={s.id} className="pending-row">
              <s.icon size={16} color={s.current ? "#16A34A" : "#64748B"} />
              <div className="ti-mid"><div className="card-name">{s.device} {s.current && <span className="status-pill done">This device</span>}</div><div className="muted small">{s.location} -- {s.lastActive}</div><div className="muted small mono">{s.ip}</div></div>
              {!s.current && <button className="ghost-btn-sm" onClick={() => setConfirmTarget(s.id)}>Sign out</button>}
            </div>
          ))}
        </div>
      </div>
      <div className="version-tag">Medra Super Admin -- v2.14.0 -- build 2026.08.23</div>
    </div>
  );
}

const ADMIN_ROSTER = [
  { id: "a1", name: "Casey W.", email: "casey.w@medra.com", ninMasked: "*******4821", bvnMasked: "*******7390", role: "Support Staff", caps: new Set(["View orders", "Refund orders"]), status: "active" },
  { id: "a2", name: "Jordan B.", email: "jordan.b@medra.com", ninMasked: "*******1157", bvnMasked: "*******6602", role: "Payment Staff", caps: new Set(["View financials", "Edit commissions"]), status: "active" },
  { id: "a3", name: "Priya M.", email: "priya.m@medra.com", role: "Content Moderator", caps: new Set(["Suspend accounts", "Post announcements"]), status: "active" },
];

const DIAGNOSTIC_SERVICES = ["Payments", "Notifications", "Maps", "Healthcare", "Messaging", "Delivery"];
const SOS_CASES_SEED = [
  { id: "SOS1", rider: "Marcus T.", location: "Lekki Phase 1", triggered: "4 min ago", status: "pending" },
  { id: "SOS2", rider: "Priya S.", location: "Victoria Island", triggered: "22 min ago", status: "pending" },
  { id: "SOS3", rider: "John Rider", location: "Yaba", triggered: "1 hr ago", status: "resolved" },
];
function SosSafetySection() {
  const [cases, setCases] = useState(SOS_CASES_SEED);
  const decide = (id, status) => setCases((c) => c.map((x) => x.id === id ? { ...x, status } : x));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">SOS & Safety</div>
        <table className="admin-table">
          <thead><tr><th>Rider</th><th>Location</th><th>Triggered</th><th>Status</th><th /></tr></thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id}>
                <td className="card-name">{c.rider}</td><td>{c.location}</td><td className="muted small">{c.triggered}</td>
                <td><span className={`status-pill ${c.status === "resolved" ? "done" : c.status === "acknowledged" ? "route" : "delay"}`}>{c.status}</span></td>
                <td style={{ display: "flex", gap: 6 }}>
                  {c.status === "pending" && <button className="ghost-btn-sm" onClick={() => decide(c.id, "acknowledged")}>Acknowledge</button>}
                  {c.status !== "resolved" && <button className="ghost-btn-sm" onClick={() => decide(c.id, "resolved")}>Mark Resolved</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequiresBadge({ level = "Super Admin" }) {
  return <span className="status-pill route" style={{ marginLeft: 8, fontSize: 10.5 }}>Requires {level}</span>;
}

function CommissionEngineSection() {
  const COMMISSION_CATEGORIES = ["Pharmacy", "Electronics", "Home & Kitchen", "Grocery", "Fashion"];
  const ORIGINAL = { productMarkup: 10, normalPlatform: 15, peakPlatform: 10 };
  const [productMarkup, setProductMarkup] = useState(ORIGINAL.productMarkup);
  const [normalPlatform, setNormalPlatform] = useState(ORIGINAL.normalPlatform);
  const [peakPlatform, setPeakPlatform] = useState(ORIGINAL.peakPlatform);
  const [saved, setSaved] = useState(false);
  const [categoryOverrides, setCategoryOverrides] = useState([{ category: "Pharmacy", rate: 6 }]);
  const [newOverrideCategory, setNewOverrideCategory] = useState("");
  const changes = [
    productMarkup !== ORIGINAL.productMarkup && { label: "Product markup", from: `${ORIGINAL.productMarkup}%`, to: `${productMarkup}%` },
    normalPlatform !== ORIGINAL.normalPlatform && { label: "Delivery split (normal)", from: `Platform ${ORIGINAL.normalPlatform}%`, to: `Platform ${normalPlatform}%` },
    peakPlatform !== ORIGINAL.peakPlatform && { label: "Delivery split (peak)", from: `Platform ${ORIGINAL.peakPlatform}%`, to: `Platform ${peakPlatform}%` },
  ].filter(Boolean);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const updateOverride = (cat, val) => setCategoryOverrides((o) => o.map((x) => x.category === cat ? { ...x, rate: Math.max(0, Math.min(100, Number(val) || 0)) } : x));
  const removeOverride = (cat) => setCategoryOverrides((o) => o.filter((x) => x.category !== cat));
  const addOverride = () => { if (!newOverrideCategory) return; setCategoryOverrides((o) => [...o, { category: newOverrideCategory, rate: productMarkup }]); setNewOverrideCategory(""); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Commission Engine<RequiresBadge /></div>
        <div className="muted small" style={{ marginBottom: 12 }}>These rules apply platform-wide -- Admin can operate day-to-day payouts, but only Super Admin sets the actual rates.</div>
        <PrototypeNote>saving here updates this screen only -- there's no backend yet to actually change what customers and sellers see at checkout. This is the config UI ready for that hookup.</PrototypeNote>
        <div className="field" style={{ marginBottom: 14 }}>
          <span>Product markup (added on top of every seller-listed price at checkout)</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="number" min="0" max="100" style={{ width: 90 }} value={productMarkup} onChange={(e) => setProductMarkup(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} /><span className="muted">%</span></div>
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <span>Delivery split -- normal hours</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="muted small">Platform</span><input type="number" min="0" max="100" style={{ width: 70 }} value={normalPlatform} onChange={(e) => setNormalPlatform(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} /><span className="muted">%</span>
            <span className="muted small" style={{ marginLeft: 12 }}>Rider</span><span className="mono">{100 - normalPlatform}%</span>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <span>Delivery split -- peak hours (6-10am, 4-8pm)</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="muted small">Platform</span><input type="number" min="0" max="100" style={{ width: 70 }} value={peakPlatform} onChange={(e) => setPeakPlatform(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} /><span className="muted">%</span>
            <span className="muted small" style={{ marginLeft: 12 }}>Rider</span><span className="mono">{100 - peakPlatform}%</span>
          </div>
        </div>
        {changes.length > 0 && (
          <div className="muted small" style={{ marginBottom: 12, background: "#F3EEFF", borderRadius: 10, padding: "8px 10px" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>What changed:</div>
            {changes.map((c) => <div key={c.label}>{c.label}: {c.from} <ChevronRight size={10} style={{ verticalAlign: "middle" }} /> {c.to}</div>)}
          </div>
        )}
        <button className="primary-btn-sm" onClick={save}>{saved ? "Saved for this preview" : "Save changes"}</button>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Category overrides</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Some categories need a different rate than the platform default above -- e.g. pharmacy margins are usually thinner. Leave a category unset to use the default {productMarkup}%.</div>
        <div className="list-col">
          {categoryOverrides.map((c) => (
            <div key={c.category} className="cat-top">
              <span className="muted small" style={{ flex: 1 }}>{c.category}</span>
              <input type="number" min="0" max="100" style={{ width: 70 }} value={c.rate} onChange={(e) => updateOverride(c.category, e.target.value)} />
              <span className="muted small">%</span>
              <button className="ghost-btn-sm" onClick={() => confirmAction({ title: "Remove this override?", message: "The category goes back to the default commission rate.", confirmLabel: "Remove" }, () => removeOverride(c.category))}>Remove</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <select className="sort-select" value={newOverrideCategory} onChange={(e) => setNewOverrideCategory(e.target.value)}>
            <option value="">Add category override...</option>
            {COMMISSION_CATEGORIES.filter((c) => !categoryOverrides.some((o) => o.category === c)).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="ghost-btn-sm" disabled={!newOverrideCategory} onClick={addOverride}>Add</button>
        </div>
      </div>
    </div>
  );
}

function DataRetentionSection() {
  const [policies, setPolicies] = useState([
    { type: "Audit logs", days: 730 },
    { type: "Support tickets (resolved)", days: 365 },
    { type: "Order history", days: 1095 },
    { type: "Wallet transactions", days: 2555 },
    { type: "Live chat transcripts", days: 180 },
    { type: "Session logs", days: 90 },
  ]);
  const [saved, setSaved] = useState(false);
  const updateDays = (type, val) => setPolicies((p) => p.map((x) => x.type === type ? { ...x, days: Math.max(1, Number(val) || 1) } : x));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const yearsRoughly = (d) => d >= 365 ? `~${(d / 365).toFixed(1)} yr` : `${d} days`;
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Data Retention Policy</div>
        <PrototypeNote>saving here updates this screen only -- there's no backend yet to actually enforce automatic deletion. This is the config UI ready for that hookup.</PrototypeNote>
        <div className="list-col" style={{ marginBottom: 16 }}>
          {policies.map((p) => (
            <div key={p.type} className="cat-top">
              <span className="muted small" style={{ flex: 1 }}>{p.type}</span>
              <input type="number" min="1" style={{ width: 90 }} value={p.days} onChange={(e) => updateDays(p.type, e.target.value)} />
              <span className="muted small" style={{ marginLeft: 8, width: 70 }}>{yearsRoughly(p.days)}</span>
            </div>
          ))}
        </div>
        <button className="primary-btn-sm" onClick={save}>{saved ? "Saved for this preview" : "Save changes"}</button>
      </div>
    </div>
  );
}

const DELIVERY_ZONES_SEED = [
  { id: "Z1", name: "Victoria Island", city: "Lagos", active: true },
  { id: "Z2", name: "Lekki Phase 1", city: "Lagos", active: true },
  { id: "Z3", name: "Yaba", city: "Lagos", active: true },
  { id: "Z4", name: "Ikeja GRA", city: "Lagos", active: true },
  { id: "Z5", name: "Wuse 2", city: "Abuja", active: true },
  { id: "Z6", name: "Garki", city: "Abuja", active: false },
];
function DeliveryManagementSection() {
  const [zones, setZones] = useState(DELIVERY_ZONES_SEED);
  const [newZone, setNewZone] = useState("");
  const [newCity, setNewCity] = useState("");
  const activeCount = zones.filter((z) => z.active).length;
  const toggleZone = (id) => setZones((z) => z.map((x) => x.id === id ? { ...x, active: !x.active } : x));
  const addZone = () => {
    if (!newZone.trim() || !newCity.trim()) return;
    setZones((z) => [...z, { id: `Z${Date.now()}`, name: newZone.trim(), city: newCity.trim(), active: true }]);
    setNewZone(""); setNewCity("");
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Delivery Zones</div><span className="muted small">{activeCount} of {zones.length} active, across {[...new Set(zones.map((z) => z.city))].length} cities</span></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Day-to-day zone coverage -- platform-wide surcharge and radius defaults are set separately in Delivery Settings.</div>
        <div className="list-col" style={{ marginBottom: 14 }}>
          {zones.map((z) => (
            <div key={z.id} className="cat-top">
              <span className="muted small" style={{ flex: 1 }}>{z.name} -- {z.city}</span>
              <button className={`toggle-mini ${z.active ? "on" : ""}`} onClick={() => toggleZone(z.id)}><span /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={{ flex: 1 }} value={newZone} onChange={(e) => setNewZone(e.target.value)} placeholder="Zone name..." />
          <input style={{ flex: 1 }} value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="City..." />
          <button className="primary-btn-sm" onClick={addZone}>+ Add zone</button>
        </div>
      </div>
    </div>
  );
}

function CategoriesSection() {
  const SEED = [
    { id: "cat1", name: "Electronics", products: 312 }, { id: "cat2", name: "Home & Kitchen", products: 540 },
    { id: "cat3", name: "Grocery", products: 890 }, { id: "cat4", name: "Fashion", products: 410 },
  ];
  const [published, setPublished] = useState(SEED);
  const [draft, setDraft] = useState(SEED);
  const [newName, setNewName] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const isDirty = JSON.stringify(draft) !== JSON.stringify(published);
  // Diff is derived purely from published vs. draft on every render (via
  // stable ids), not pushed imperatively inside event handlers -- so it's
  // always accurate to current state, including renames.
  const pendingChanges = [];
  published.forEach((p) => { if (!draft.some((d) => d.id === p.id)) pendingChanges.push(`Remove "${p.name}"`); });
  draft.forEach((d) => {
    const match = published.find((p) => p.id === d.id);
    if (!match) pendingChanges.push(`Add "${d.name}"`);
    else if (match.name !== d.name) pendingChanges.push(`Rename "${match.name}" \u2192 "${d.name}"`);
  });
  const add = () => {
    if (!newName.trim() || draft.some((c) => c.name.toLowerCase() === newName.trim().toLowerCase())) return;
    setDraft((c) => [...c, { id: `cat-${Date.now()}`, name: newName.trim(), products: 0 }]);
    setNewName("");
  };
  const startEdit = (i) => { setEditingIdx(i); setEditDraft(draft[i].name); };
  const saveEdit = (i) => {
    setDraft((c) => c.map((x, idx) => idx === i ? { ...x, name: editDraft.trim() || x.name } : x));
    setEditingIdx(null);
  };
  const remove = (i) => setDraft((c) => c.filter((_, idx) => idx !== i));
  const publish = () => setPublished(draft);
  const discard = () => setDraft(published);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Categories</div>{isDirty && <span className="status-pill prep">Unpublished changes</span>}</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Platform-wide product categories -- renaming or removing one doesn't move existing products, it just affects how new listings are categorized. Stage as many changes as you like, then publish them all at once.</div>
        <div className="list-col" style={{ marginBottom: 14 }}>
          {draft.map((c, i) => (
            <div key={c.id} className="pending-row">
              {editingIdx === i ? (
                <input style={{ flex: 1 }} value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit(i)} />
              ) : (
                <div className="ti-mid"><div className="card-name">{c.name}</div><div className="muted small">{c.products} products</div></div>
              )}
              {editingIdx === i ? (
                <button className="ghost-btn-sm" onClick={() => saveEdit(i)}>Save</button>
              ) : (
                <button className="ghost-btn-sm" onClick={() => startEdit(i)}>Rename</button>
              )}
              <button className="ghost-btn-sm deny" onClick={() => confirmAction({ title: "Delete this item?", message: "It will be permanently removed in this preview.", confirmLabel: "Delete" }, () => remove(i))}>Delete</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <input style={{ flex: 1 }} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name..." onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className="primary-btn-sm" onClick={add}>+ Add category</button>
        </div>
        {isDirty && pendingChanges.length > 0 && (
          <div className="muted small" style={{ marginBottom: 12, background: "#F3EEFF", borderRadius: 10, padding: "8px 10px" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Pending changes:</div>
            {pendingChanges.map((c, i) => <div key={i}>{c}</div>)}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="primary-btn-sm" disabled={!isDirty} onClick={publish}>Publish changes</button>
          <button className="ghost-btn-sm" disabled={!isDirty} onClick={discard}>Discard draft</button>
        </div>
      </div>
    </div>
  );
}

function SystemSettingsSection() {
  const [name, setName] = useState("Medra");
  const [currency, setCurrency] = useState("NGN (\u20a6)");
  const [email, setEmail] = useState("support@medra.com");
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">System Settings</div>
        <PrototypeNote>saving here updates this screen only -- there's no backend yet to actually change customer/seller behavior. This is the config UI ready for that hookup.</PrototypeNote>
        <div className="field" style={{ marginBottom: 10 }}><span>Platform name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>Default currency</span>
          <select className="sort-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option>NGN (\u20a6)</option><option>USD ($)</option><option>GHS (\u20b5)</option><option>KES (KSh)</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 16 }}><span>Support email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <button className="primary-btn-sm" onClick={save}>{saved ? "Saved for this preview" : "Save changes"}</button>
      </div>
    </div>
  );
}

function AppSettingsSection() {
  const [iosVersion, setIosVersion] = useState("2.4.0");
  const [androidVersion, setAndroidVersion] = useState("2.4.0");
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">App Settings</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Users below these versions are prompted to update before they can keep using the app. Maintenance mode lives under Platform Tools.</div>
        <PrototypeNote>saving here updates this screen only -- there's no backend yet to actually enforce this. This is the config UI ready for that hookup.</PrototypeNote>
        <div className="field" style={{ marginBottom: 10 }}><span>Min app version (iOS)</span><input type="text" value={iosVersion} onChange={(e) => setIosVersion(e.target.value)} /></div>
        <div className="field" style={{ marginBottom: 16 }}><span>Min app version (Android)</span><input type="text" value={androidVersion} onChange={(e) => setAndroidVersion(e.target.value)} /></div>
        <button className="primary-btn-sm" onClick={save}>{saved ? "Saved for this preview" : "Save changes"}</button>
      </div>
    </div>
  );
}

function DeliverySettingsSection() {
  const [radius, setRadius] = useState(13);
  const [surcharge, setSurcharge] = useState(1.3);
  const [minFee, setMinFee] = useState(600);
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Delivery Settings</div>
        <PrototypeNote>saving here updates this screen only -- there's no backend yet to actually change customer/seller behavior. This is the config UI ready for that hookup.</PrototypeNote>
        <div className="field" style={{ marginBottom: 10 }}><span>Default delivery radius (km)</span><input type="number" min="1" value={radius} onChange={(e) => setRadius(Number(e.target.value) || 0)} /></div>
        <div className="field" style={{ marginBottom: 10 }}><span>Peak hour surcharge (multiplier)</span><input type="number" min="1" step="0.1" value={surcharge} onChange={(e) => setSurcharge(Number(e.target.value) || 1)} /></div>
        <div className="field" style={{ marginBottom: 16 }}><span>Minimum delivery fee (₦) -- delivery is never free</span><input type="number" min="1" value={minFee} onChange={(e) => setMinFee(Math.max(1, Number(e.target.value) || 1))} /></div>
        <button className="primary-btn-sm" onClick={save}>{saved ? "Saved for this preview" : "Save changes"}</button>
      </div>
    </div>
  );
}

function PaymentMethodsSection() {
  const [methods, setMethods] = useState({ "Card payments": true, "Wallet payments": true, "Cash on delivery": true });
  const toggle = (key) => setMethods((m) => ({ ...m, [key]: !m[key] }));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Payment Methods</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Turn a payment method off platform-wide -- customers won't see it as a checkout option.</div>
        <PrototypeNote>toggling here updates this screen only -- there's no backend yet to actually hide the option at checkout. This is the config UI ready for that hookup.</PrototypeNote>
        <div className="list-col">
          {Object.entries(methods).map(([key, on]) => (
            <div key={key} className="flag-row">
              <div className="ti-mid"><div className="card-name">{key}</div></div>
              <button className={`toggle-mini ${on ? "on" : ""}`} onClick={() => toggle(key)}><span /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlatformToolsSection({ logIncident }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState({});
  const runTest = (service) => {
    setRunning((r) => ({ ...r, [service]: true }));
    setTimeout(() => {
      // Simulated result -- no real service to ping yet at this prototype
      // phase, mirrors System Health's approach of showing the UI/flow now.
      const pass = Math.random() > 0.15;
      setResults((r) => ({ ...r, [service]: { pass, at: "just now" } }));
      setRunning((r) => ({ ...r, [service]: false }));
      if (!pass && logIncident) logIncident(service, "Diagnostic test failed -- filed automatically from Platform Tools.");
    }, 900);
  };
  return (
    <div className="section-pad">
      <div className="panel enter" style={maintenanceMode ? { background: "linear-gradient(160deg,#FEF2F2,#fff)", border: "1px solid #FECACA" } : undefined}>
        <div className="panel-title-row"><div className="panel-title">Maintenance Mode</div>
          <button className={`toggle-mini ${maintenanceMode ? "on" : ""}`} onClick={() => setMaintenanceMode((m) => !m)}><span /></button>
        </div>
        <div className="muted small">{maintenanceMode ? "Customer-facing apps would show a maintenance banner and block checkout while this is on." : "Turn this on before risky platform changes to show customers a maintenance banner instead of errors."}</div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Service Diagnostics</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Run a test ping against each integration. Simulated for this prototype phase -- swaps to a real health-check call once the backend exists.</div>
        <div className="list-col">
          {DIAGNOSTIC_SERVICES.map((s) => {
            const res = results[s];
            return (
              <div key={s} className="pending-row">
                <div className="ti-mid"><div className="card-name">{s}</div>{res && <div className="muted small">Last checked {res.at}</div>}</div>
                {res && <span className={`status-pill ${res.pass ? "done" : "delay"}`}>{res.pass ? "Pass" : "Fail"}</span>}
                <button className="ghost-btn-sm" disabled={running[s]} onClick={() => runTest(s)}>{running[s] ? "Testing..." : "Run test"}</button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Other tools</div>
        <div className="muted small">API Management, Integrations, Duplicate Management, and Data Repair Tools become meaningful once there's a real backend to manage -- placeholders here would just be decorative, so they're deferred to that phase rather than faked now.</div>
      </div>
      <NavIntegrityCheckSection />
    </div>
  );
}

function NavIntegrityCheckSection() {
  const [checked, setChecked] = useState(false);
  const [issues, setIssues] = useState([]);
  const runCheck = () => {
    // A real check against this app's actual live data structures -- every
    // nav key is checked for a resolvable destination (a real component in
    // SECTION_MAP, or a config entry in GENERIC_CONFIG). Anything that
    // resolves to neither would hit NotFoundScreen in the running app.
    const navKeys = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.key));
    const found = [];
    navKeys.forEach((key) => {
      const inSectionMap = Object.prototype.hasOwnProperty.call(SECTION_MAP, key);
      const inGenericConfig = Object.prototype.hasOwnProperty.call(GENERIC_CONFIG, key);
      if (!inSectionMap && !inGenericConfig) found.push(key);
    });
    setIssues(found);
    setChecked(true);
  };
  return (
    <div className="panel enter">
      <div className="panel-title-row"><div className="panel-title">Self-Check: Navigation Integrity</div><button className="ghost-btn-sm" onClick={runCheck}><RefreshCw size={12} /> Run check</button></div>
      <div className="muted small" style={{ marginBottom: 12 }}>Verifies every nav item actually resolves to a real screen or config entry -- checked live against this app's own data, not a static audit.</div>
      {checked && (
        issues.length === 0 ? (
          <div className="muted small" style={{ color: "#16A34A" }}><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> All {NAV_SECTIONS.flatMap((s) => s.items).length} nav items resolve correctly.</div>
        ) : (
          <div className="muted small" style={{ color: "#DC2626" }}>
            <AlertTriangle size={12} style={{ verticalAlign: "middle" }} /> {issues.length} nav item{issues.length !== 1 ? "s" : ""} would hit a "not available" screen: {issues.join(", ")}
          </div>
        )
      )}
    </div>
  );
}

// Every staff member (Admin, Support, Payment, Moderator) is created with a NIN and BVN.
// Only the masked form is kept after saving. Super Admin and customers are exempt.
const onlyDigits11 = (v) => String(v || "").replace(/\D/g, "").slice(0, 11);
const maskId = (v) => "*******" + String(v).slice(-4);
function AdminEditModal({ admin, roles, onClose, onSave }) {
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const hadIds = !!(admin?.ninMasked && admin?.bvnMasked);
  const idsOk = hadIds && !nin && !bvn ? true : /^\d{11}$/.test(nin) && /^\d{11}$/.test(bvn);
  const [name, setName] = useState(admin?.name || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [role, setRole] = useState(admin?.role || (roles || PERMISSION_MATRIX_ROLES)[0]);
  const [caps, setCaps] = useState(new Set(admin?.caps || []));
  const toggleCap = (c) => setCaps((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="muted small" style={{ marginBottom: 6 }}>Team & Staff <ChevronRight size={11} style={{ verticalAlign: "middle" }} /> {admin ? admin.name : "New admin"}</div>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>{admin ? "Edit admin" : "Add a new admin"}</div>
        <div className="field" style={{ marginBottom: 10 }}><span>Name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field" style={{ marginBottom: 10 }}><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field" style={{ marginBottom: 10 }}><span>NIN (11 digits){hadIds ? ` -- on file ${admin.ninMasked}` : ""}</span><input type="text" inputMode="numeric" autoComplete="off" maxLength={11} value={nin} onChange={(e) => setNin(onlyDigits11(e.target.value))} placeholder={hadIds ? "Leave blank to keep the one on file" : "11 digits"} /></div>
        <div className="field" style={{ marginBottom: 10 }}><span>BVN (11 digits){hadIds ? ` -- on file ${admin.bvnMasked}` : ""}</span><input type="text" inputMode="numeric" autoComplete="off" maxLength={11} value={bvn} onChange={(e) => setBvn(onlyDigits11(e.target.value))} placeholder={hadIds ? "Leave blank to keep the one on file" : "11 digits"} /></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Required for every staff account. Only the last 4 digits are kept after saving. Preview build: format-checked only, not verified against NIMC or a bank.</div>
        <div className="field" style={{ marginBottom: 14 }}>
          <span>Department</span>
          <select className="sort-select" value={role} onChange={(e) => setRole(e.target.value)}>
            {(roles || PERMISSION_MATRIX_ROLES).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 4, fontSize: 12.5, fontWeight: 600 }}>What can they manage?</div>
        <p className="muted small" style={{ marginBottom: 10 }}>Assign exactly what this person can access -- not everything their department is generally allowed to do.</p>
        <div className="list-col" style={{ marginBottom: 16 }}>
          {PERMISSION_MATRIX_CAPS.map((cap) => (
            <label key={cap} className="subscribe-toggle-label" style={{ fontSize: 13, color: "var(--ink)" }}>
              <input type="checkbox" checked={caps.has(cap)} onChange={() => toggleCap(cap)} /> {cap}
            </label>
          ))}
        </div>
        <button className="primary-btn-sm wide" disabled={!name.trim() || !email.trim() || !idsOk} onClick={() => onSave({ id: admin?.id || `a${Date.now()}`, name, email, role, caps, status: admin?.status || "active", ninMasked: nin ? maskId(nin) : admin?.ninMasked, bvnMasked: bvn ? maskId(bvn) : admin?.bvnMasked })}>Save</button>
      </div>
    </div>
  );
}

const GIVEAWAY_PRODUCTS_ADMIN = [
  "Wireless Earbuds Pro", "Espresso Machine", "Running Sneakers", "Cold Brew Concentrate", "Ceramic Vase Set",
  "Smart Watch", "Leather Backpack", "Air Fryer", "Bluetooth Speaker", "Yoga Mat",
  "Skincare Set", "Desk Lamp", "Board Game Bundle", "Camping Tent", "Blender",
  "Sunglasses", "Throw Pillow Set", "Bike Helmet", "Instant Camera", "Wireless Charger",
].map((name, i) => ({ id: `gw${i + 1}`, name, votes: Math.floor(20 + Math.random() * 180) }));
const QUALIFIED_GIVEAWAY_CUSTOMERS = ["Amara Okeke", "Tobi James", "Sarah Ahmed", "Chinedu John", "Blessing U.", "Priya Menon", "Devon King"];

function GiveawayControlSection() {
  const [products] = useState(GIVEAWAY_PRODUCTS_ADMIN);
  const [winners, setWinners] = useState(null);
  const topFive = [...products].sort((a, b) => b.votes - a.votes).slice(0, 5);
  const runDraw = () => {
    const pool = [...QUALIFIED_GIVEAWAY_CUSTOMERS];
    const picked = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push({ customer: pool[idx], item: topFive[i % topFive.length].name });
      pool.splice(idx, 1);
    }
    setWinners(picked);
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Monthly Giveaway</div><span className="muted small">{QUALIFIED_GIVEAWAY_CUSTOMERS.length} qualified customers this month</span></div>
        <div className="muted" style={{ marginBottom: 12 }}>Top 5 most-picked items become this month's giveaway. Customers qualify with 20+ deliveries and no refunds/returns this month.</div>
        <div className="list-col">
          {topFive.map((p, i) => (
            <div key={p.id} className="pending-row">
              <div className="driver-avatar sm">{i + 1}</div>
              <div className="ti-mid"><div className="card-name">{p.name}</div></div>
              <span className="status-pill done">{p.votes} picks</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Run the draw</div>{!winners && <button className="primary-btn-sm" onClick={runDraw}>Draw 3 winners</button>}</div>
        {winners ? (
          <div className="list-col">
            {winners.map((w, i) => (
              <div key={i} className="pending-row">
                <div className="pending-icon" style={{ background: "#FFF7ED", color: "#EA580C" }}><PartyPopper size={13} /></div>
                <div className="ti-mid"><div className="card-name">{w.customer}</div><div className="muted small">Wins: {w.item}</div></div>
              </div>
            ))}
          </div>
        ) : <div className="muted small">Randomly selects 3 winners from this month's qualified customers.</div>}
      </div>
    </div>
  );
}

const COMMUNITY_CHALLENGE_REWARD_TYPES = ["Points", "Giveaway entries", "Discount codes", "Delivery discount", "Mystery reward"];

const LOTTERY_ENTRIES_POOL = [
  { customer: "Amara Okeke", picks: [4, 12, 23, 41, 55, 80] },
  { customer: "Tobi James", picks: [7, 19, 28, 44, 61, 92] },
  { customer: "Sarah Ahmed", picks: [2, 15, 30, 47, 58, 76] },
  { customer: "Chinedu John", picks: [9, 21, 33, 40, 52, 88] },
  { customer: "Blessing U.", picks: [5, 14, 26, 45, 63, 79] },
  { customer: "Priya Menon", picks: [11, 20, 31, 48, 57, 91] },
];

function distanceScore(picksA, picksB) {
  return picksA.reduce((sum, n, i) => sum + Math.abs(n - picksB[i]), 0);
}

function LotteryDrawSection() {
  const [winningNumbers, setWinningNumbers] = useState(null);
  const [winner, setWinner] = useState(null);
  const draw = () => {
    const nums = new Set();
    while (nums.size < 6) nums.add(1 + Math.floor(Math.random() * 99));
    const drawn = [...nums].sort((a, b) => a - b);
    setWinningNumbers(drawn);
    const scored = LOTTERY_ENTRIES_POOL.map((e) => ({ ...e, score: distanceScore(e.picks, drawn) }));
    scored.sort((a, b) => a.score - b.score);
    setWinner(scored[0]);
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Weekly Lottery Draw</div><span className="muted small">{LOTTERY_ENTRIES_POOL.length} entries this week</span></div>
        <div className="muted" style={{ marginBottom: 12 }}>Draw 6 random numbers (1-99) -- the customer whose picks are numerically closest wins the 300-point jackpot.</div>
        {!winningNumbers ? (
          <button className="primary-btn-sm" onClick={draw}>Draw winning numbers</button>
        ) : (
          <>
            <div className="cat-top" style={{ marginBottom: 10 }}><span className="muted small">Winning numbers</span><span className="mono" style={{ fontWeight: 700 }}>{winningNumbers.join(" - ")}</span></div>
            <div className="pending-row">
              <div className="pending-icon" style={{ background: "#FFF7ED", color: "#EA580C" }}><Medal size={14} /></div>
              <div className="ti-mid"><div className="card-name">{winner.customer}</div><div className="muted small">Picks: {winner.picks.join(", ")} -- closest match, wins 300 points</div></div>
            </div>
          </>
        )}
      </div>
      {winningNumbers && (
        <div className="panel enter">
          <div className="panel-title">All entries this week</div>
          <div className="list-col">
            {LOTTERY_ENTRIES_POOL.map((e) => (
              <div key={e.customer} className="cat-top">
                <span className="muted">{e.customer} -- {e.picks.join(", ")}</span>
                <span className="mono small">{winner.customer === e.customer ? "Winner" : `distance ${distanceScore(e.picks, winningNumbers)}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengeControlSection() {
  const activeUsers = 3120; // mock live count
  const baseTarget = 1000000;
  const scaledTarget = Math.round(baseTarget * (activeUsers / 3000));
  const [rewardType, setRewardType] = useState("Mystery reward");
  const [currentProgress] = useState(Math.round(scaledTarget * 0.68));
  const pct = Math.min(100, (currentProgress / scaledTarget) * 100);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Community Challenge</div>
        <div className="muted small" style={{ marginBottom: 6, color: "#B45309" }}><AlertTriangle size={11} style={{ verticalAlign: "middle" }} /> Active-user count and progress below are illustrative placeholders, not live platform telemetry -- there's no backend feeding real aggregate numbers here yet.</div>
        <div className="muted" style={{ marginBottom: 12 }}>Target auto-scales with current engagement -- {activeUsers.toLocaleString()} active users right now.</div>
        <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">Community progress</span><span className="mono small">{currentProgress.toLocaleString()} / {scaledTarget.toLocaleString()} pts</span></div>
        <div className="bar-track"><div className="bar-fill-h" style={{ width: `${pct}%`, background: "var(--purple)" }} /></div>
        <div className="field" style={{ marginTop: 14 }}>
          <span>Reward when target is reached</span>
          <select className="sort-select" value={rewardType} onChange={(e) => setRewardType(e.target.value)}>
            {COMMUNITY_CHALLENGE_REWARD_TYPES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

const FRAUD_WATCHLIST_SEED = [
  { id: "FW1", who: "Tunde A.", flag: "12 Point Duel losses in a row, always maximum stake", severity: "high", status: "flagged" },
  { id: "FW2", who: "Blessing O.", flag: "Won the Reverse Auction 3 times this week", severity: "medium", status: "flagged" },
  { id: "FW3", who: "Chinedu E.", flag: "9 Weekly Lottery entries in one day using bought extras", severity: "low", status: "flagged" },
  { id: "FW4", who: "Amaka N.", flag: "Repeated wallet top-up then immediate full withdrawal request", severity: "high", status: "cleared" },
];

// Doc-spec audit fields: who/what/when are always shown in the table;
// previous/new value, reason, and device are attached only where they're
// real (a config or money change), and shown in an expandable detail row
// -- not every log line has a "previous value" (e.g. a ticket resolution
// doesn't), so this stays optional rather than forcing blank columns.
const PLATFORM_LOGS = [
  { type: "Activity", actor: "Farida Adeyemi", detail: "Approved vendor Bright Pharmacy", at: "5 min ago" },
  { type: "Activity", actor: "Sasha Ade", detail: "Resolved ticket T-901", at: "22 min ago" },
  { type: "Audit", actor: "System", detail: "Delivery commission set to 15% normal / 10% peak", at: "45 min ago", previousValue: "20% normal / 15% peak", newValue: "15% normal / 10% peak", reason: "Rider retention initiative -- Q3 policy review" },
  { type: "Audit", actor: "Farida Adeyemi", detail: "Created new admin account", at: "1 hr ago", newValue: "admin: ops-tomiwa@medra.com", device: "Chrome on macOS -- 102.89.14.201" },
  { type: "Audit", actor: "Farida Adeyemi", detail: "Changed seller commission rate", at: "2 hrs ago", previousValue: "10%", newValue: "12%", reason: "Aligning with updated payment-processing costs", device: "Chrome on macOS -- 102.89.14.201" },
  { type: "Audit", actor: "Tomiwa Bello", detail: "Approved refund #4482", at: "2.5 hrs ago", previousValue: "Pending", newValue: "Approved -- \u20a68,500", reason: "Item confirmed missing on delivery" },
  { type: "Audit", actor: "Farida Adeyemi", detail: "Changed Medra Plus membership price", at: "3 hrs ago", previousValue: "\u20a62,500/mo", newValue: "\u20a63,000/mo", reason: "Cost review approved by finance" },
  { type: "Audit Trail", actor: "Tomiwa Bello", detail: "Vendor payout batch #221 modified", at: "3 hrs ago", previousValue: "\u20a6892,000 total", newValue: "\u20a6874,500 total", reason: "Removed 2 duplicate line items before release" },
  { type: "Audit Trail", actor: "Farida Adeyemi", detail: "Feature flag: flash_sales modified", at: "1 day ago", previousValue: "disabled", newValue: "enabled", device: "Chrome on macOS -- 102.89.14.201" },
  { type: "Audit", actor: "Sasha Ade", detail: "Suspended seller #892", at: "1 day ago", previousValue: "active", newValue: "suspended", reason: "Repeated late-fulfillment complaints" },
  { type: "Audit", actor: "Farida Adeyemi", detail: "Adjusted customer reward points", at: "1 day ago", previousValue: "1,200 pts", newValue: "1,250 pts", reason: "Approved goodwill adjustment for delivery delay" },
  { type: "System", actor: "System", detail: "Payout batch completed", at: "5 hrs ago" },
  { type: "System", actor: "System", detail: "Elevated API latency, resolved", at: "8 hrs ago" },
];

// Simulated service statuses -- no real backend to poll yet, per the
// prototype-phase instruction. Shaped so swapping in real health-check
// data later is a one-line change (replace SYSTEM_SERVICES/SYSTEM_HEALTH_STATS
// with a real fetch), not a UI rebuild.
const SYSTEM_SERVICES = [
  { key: "auth", label: "Authentication", status: "up" },
  { key: "payments", label: "Payments", status: "up" },
  { key: "orders", label: "Orders", status: "up" },
  { key: "delivery", label: "Delivery", status: "up" },
  { key: "notifications", label: "Notifications", status: "degraded", note: "Push delivery running ~4 min behind" },
  { key: "maps", label: "Maps", status: "up" },
  { key: "healthcare", label: "Healthcare", status: "up" },
  { key: "messaging", label: "Messaging", status: "up" },
];
const SYSTEM_HEALTH_STATS = [
  { label: "API errors (24h)", value: "12", tone: "ok" },
  { label: "Failed payments (24h)", value: "3", tone: "ok" },
  { label: "Failed notifications (24h)", value: "41", tone: "warn" },
  { label: "Webhook failures (24h)", value: "0", tone: "ok" },
  { label: "Pending background jobs", value: "6", tone: "ok" },
  { label: "Database status", value: "Healthy -- 38ms avg query", tone: "ok" },
];
const FEATURE_AVAILABILITY_CITIES = ["Lagos", "Abuja", "Kano", "Port Harcourt"];
const FEATURE_AVAILABILITY_SEED = [
  { feature: "Delivery", availability: { Lagos: true, Abuja: true, Kano: true, "Port Harcourt": true } },
  { feature: "Telehealth", availability: { Lagos: true, Abuja: true, Kano: true, "Port Harcourt": true } },
  { feature: "Pharmacy", availability: { Lagos: true, Abuja: true, Kano: false, "Port Harcourt": true } },
  { feature: "In-person consultation", availability: { Lagos: true, Abuja: true, Kano: false, "Port Harcourt": true } },
  { feature: "Reverse Auction", availability: { Lagos: true, Abuja: true, Kano: true, "Port Harcourt": false } },
  { feature: "Weekly Lottery", availability: { Lagos: true, Abuja: true, Kano: true, "Port Harcourt": true } },
];
function FeatureAvailabilitySection() {
  const [rows, setRows] = useState(FEATURE_AVAILABILITY_SEED);
  const toggle = (feature, city) => setRows((rs) => rs.map((r) => r.feature === feature ? { ...r, availability: { ...r.availability, [city]: !r.availability[city] } } : r));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Feature Availability by City</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Not every feature needs to be available everywhere at once -- toggle a feature off in a specific city without touching the platform-wide Feature Marketplace toggle.</div>
        <table className="admin-table">
          <thead><tr><th>Feature</th>{FEATURE_AVAILABILITY_CITIES.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.feature}>
                <td className="card-name">{r.feature}</td>
                {FEATURE_AVAILABILITY_CITIES.map((c) => (
                  <td key={c} style={{ textAlign: "center" }}>
                    <button className={`perm-toggle ${r.availability[c] ? "on" : ""}`} onClick={() => toggle(r.feature, c)}>{r.availability[c] ? <Check size={12} /> : null}</button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SystemHealthSection({ healthIncidents, updateIncident }) {
  const [postmortemFor, setPostmortemFor] = useState(null);
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [followUp, setFollowUp] = useState("");
  const openPostmortem = (inc) => { setPostmortemFor(inc.id); setRootCause(inc.postmortem?.rootCause || ""); setResolution(inc.postmortem?.resolution || ""); setFollowUp(inc.postmortem?.followUp || ""); };
  const savePostmortem = () => {
    updateIncident(postmortemFor, { status: "resolved", postmortem: { rootCause: rootCause.trim(), resolution: resolution.trim(), followUp: followUp.trim() } });
    setPostmortemFor(null);
  };
  const statusDot = (s) => s === "up" ? "#16A34A" : s === "degraded" ? "#F59E0B" : "#DC2626";
  const statusLabel = (s) => s === "up" ? "Operational" : s === "degraded" ? "Degraded" : "Down";
  const allUp = SYSTEM_SERVICES.every((s) => s.status === "up");
  return (
    <div className="section-pad">
      {postmortemFor && (
        <div className="modal-backdrop" onClick={() => setPostmortemFor(null)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPostmortemFor(null)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Incident postmortem</div>
            <div className="field" style={{ marginBottom: 10 }}><span>Root cause</span><input type="text" value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="What actually caused this?" /></div>
            <div className="field" style={{ marginBottom: 10 }}><span>Resolution</span><input type="text" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What fixed it?" /></div>
            <div className="field" style={{ marginBottom: 16 }}><span>Follow-up actions</span><input type="text" value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="What should prevent this next time?" /></div>
            <button className="primary-btn-sm wide" disabled={!rootCause.trim() || !resolution.trim()} onClick={savePostmortem}>Save postmortem & mark resolved</button>
          </div>
        </div>
      )}
      <div className="panel enter" style={{ background: allUp ? "linear-gradient(160deg,#ECFDF5,#fff)" : "linear-gradient(160deg,#FFFBEB,#fff)", border: `1px solid ${allUp ? "#A7F3D0" : "#FDE68A"}` }}>
        <div className="panel-title">System Health</div>
        <div className="muted small">{allUp ? "All services operational." : "One or more services are degraded -- see below."} Statuses shown here are simulated for this prototype phase.</div>
      </div>
      {healthIncidents && healthIncidents.length > 0 && (
        <div className="panel enter" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div className="panel-title" style={{ fontSize: 13 }}>Incidents from Platform Tools diagnostics</div>
          <div className="list-col">
            {healthIncidents.map((inc) => (
              <div key={inc.id} className="pending-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex" }}>
                  <div className="ti-mid"><div className="card-name">{inc.service}</div><div className="muted small">{inc.detail}</div></div>
                  <span className={`status-pill ${inc.status === "resolved" ? "done" : "delay"}`}>{inc.status === "resolved" ? "Resolved" : "Open"}</span>
                  <div className="muted small" style={{ marginLeft: 8 }}>{inc.time}</div>
                </div>
                {inc.postmortem ? (
                  <div className="muted small" style={{ paddingLeft: 4 }}>
                    <div><b>Root cause:</b> {inc.postmortem.rootCause}</div>
                    <div><b>Resolution:</b> {inc.postmortem.resolution}</div>
                    {inc.postmortem.followUp && <div><b>Follow-up:</b> {inc.postmortem.followUp}</div>}
                  </div>
                ) : (
                  <button className="ghost-btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => openPostmortem(inc)}>Write postmortem</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Services</div>
        <div className="list-col">
          {SYSTEM_SERVICES.map((s) => (
            <div key={s.key} className="pending-row">
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusDot(s.status), flexShrink: 0 }} />
              <div className="ti-mid"><div className="card-name">{s.label}</div>{s.note && <div className="muted small">{s.note}</div>}</div>
              <span className="muted small">{statusLabel(s.status)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Errors & jobs</div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
          {SYSTEM_HEALTH_STATS.map((s) => (
            <div key={s.label} className="stat-mini enter"><div className="muted">{s.label}</div><div className="kpi-value" style={{ fontSize: 16, color: s.tone === "warn" ? "#B45309" : undefined }}>{s.value}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlatformLogsSection() {
  const [filter, setFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledExport, setScheduledExport] = useState(null); // { frequency, email }
  const [scheduleFreq, setScheduleFreq] = useState("Weekly");
  const [scheduleEmail, setScheduleEmail] = useState("");
  const types = ["all", "Activity", "Audit", "Audit Trail", "System"];
  const actors = ["all", ...new Set(PLATFORM_LOGS.map((l) => l.actor))];
  const filtered = PLATFORM_LOGS.filter((l) => (filter === "all" || l.type === filter) && (actorFilter === "all" || l.actor === actorFilter));
  const typePill = (t) => t === "System" ? "route" : t === "Audit" ? "prep" : t === "Audit Trail" ? "delay" : "done";
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Platform Logs / Audit Center</div><span className="muted small">{filtered.length} entries</span></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Every staff action, system event, and configuration change in one place -- who, what, when, and (where it applies) the previous/new value and reason. Rows with a change to show are expandable. Regular Admin cannot delete or alter these records.</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          {types.map((t) => (
            <button key={t} className="ghost-btn-sm" style={filter === t ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setFilter(t)}>{t === "all" ? "All" : t}</button>
          ))}
          <select className="sort-select" value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
            {actors.map((a) => <option key={a} value={a}>{a === "all" ? "All staff" : a}</option>)}
          </select>
          <button className="ghost-btn-sm" style={{ marginLeft: "auto" }} onClick={() => {
            const rows = filtered.map((l) => [l.type, l.actor, l.detail, l.at, l.previousValue || "", l.newValue || "", l.reason || "", l.device || ""]);
            exportCsv("medra-audit-center.csv", [["Type", "Actor", "Action", "Time", "Previous Value", "New Value", "Reason", "Device"], ...rows]);
          }}><FileDown size={12} /> Export CSV</button>
          <button className="ghost-btn-sm" onClick={() => setScheduleOpen(true)}><ClockIcon size={12} /> {scheduledExport ? `Scheduled: ${scheduledExport.frequency}` : "Schedule recurring export"}</button>
        </div>
        {scheduleOpen && (
          <div className="modal-backdrop" onClick={() => setScheduleOpen(false)}>
            <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setScheduleOpen(false)}><X size={16} /></button>
              <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Schedule recurring export</div>
              <div className="field" style={{ marginBottom: 10 }}>
                <span>Frequency</span>
                <select className="sort-select" value={scheduleFreq} onChange={(e) => setScheduleFreq(e.target.value)}>
                  <option>Daily</option><option>Weekly</option><option>Monthly</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 16 }}><span>Send to (email)</span><input type="email" value={scheduleEmail} onChange={(e) => setScheduleEmail(e.target.value)} placeholder="you@medra.com" /></div>
              {scheduledExport && <button className="ghost-btn-sm" style={{ marginBottom: 10 }} onClick={() => { setScheduledExport(null); setScheduleOpen(false); }}>Cancel current schedule</button>}
              <button className="primary-btn-sm wide" disabled={!scheduleEmail.trim()} onClick={() => { setScheduledExport({ frequency: scheduleFreq, email: scheduleEmail.trim() }); setScheduleOpen(false); }}>{scheduledExport ? "Update schedule" : "Schedule export"}</button>
            </div>
          </div>
        )}
        <table className="admin-table">
          <thead><tr><th>Type</th><th>Who</th><th>What</th><th>When</th><th /></tr></thead>
          <tbody>
            {filtered.map((l, i) => {
              const hasDetail = l.previousValue || l.newValue || l.reason || l.device;
              const isOpen = expanded === i;
              return (
                <React.Fragment key={i}>
                  <tr style={hasDetail ? { cursor: "pointer" } : undefined} onClick={() => hasDetail && setExpanded(isOpen ? null : i)}>
                    <td><span className={`status-pill ${typePill(l.type)}`}>{l.type}</span></td>
                    <td className="muted small">{l.actor}</td>
                    <td>{l.detail}</td>
                    <td className="muted small">{l.at}</td>
                    <td>{hasDetail && <ChevronDown size={13} className={`chevron ${isOpen ? "open" : ""}`} />}</td>
                  </tr>
                  {isOpen && hasDetail && (
                    <tr><td colSpan={5}>
                      <div className="list-col" style={{ padding: "8px 4px" }}>
                        {l.previousValue && <div className="cat-top"><span className="muted small">Previous value</span><span className="mono">{l.previousValue}</span></div>}
                        {l.newValue && <div className="cat-top"><span className="muted small">New value</span><span className="mono">{l.newValue}</span></div>}
                        {l.reason && <div className="cat-top"><span className="muted small">Reason</span><span>{l.reason}</span></div>}
                        {l.device && <div className="cat-top"><span className="muted small">Device / IP</span><span className="muted small">{l.device}</span></div>}
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FraudWatchlistSection() {
  const [items, setItems] = useState(FRAUD_WATCHLIST_SEED);
  const clear = (id) => setItems((its) => its.map((i) => i.id === id ? { ...i, status: "cleared" } : i));
  const suspend = (id) => setItems((its) => its.map((i) => i.id === id ? { ...i, status: "suspended" } : i));
  const flaggedCount = items.filter((i) => i.status === "flagged").length;
  const sevPill = (s) => s === "high" ? "delay" : s === "medium" ? "prep" : "route";
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Fraud & Abuse Watchlist</div><span className="muted small">{flaggedCount} awaiting review</span></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Accounts hitting unusual patterns across the point economy -- excessive duel losses, repeated auction wins, or suspicious top-up/withdrawal timing -- land here for manual review before anything is done to the account.</div>
        <div className="list-col">
          {items.map((i) => (
            <div key={i.id} className="pending-row">
              <div className="driver-avatar sm">{i.who[0]}</div>
              <div className="ti-mid"><div className="card-name">{i.who}</div><div className="muted small">{i.flag}</div></div>
              <span className={`status-pill ${sevPill(i.severity)}`} style={{ marginRight: 10 }}>{i.severity} severity</span>
              {i.status === "flagged" ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="ghost-btn-sm" onClick={() => clear(i.id)}>Clear</button>
                  <button className="round-btn deny" onClick={() => suspend(i.id)}><X size={13} /></button>
                </div>
              ) : (
                <span className={`status-pill ${i.status === "cleared" ? "done" : "delay"}`}>{i.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const BENEFACTOR_SELECTION_METHODS = ["Random qualifying member", "First to claim after fund threshold", "Highest lifetime points this month", "Manual pick by staff"];

const PAYOUT_REQUESTS_SEED = [
  { id: "PAYREQ1", who: "Marcus T.", role: "Rider", amount: 18400, requestedAt: "2 hours ago", status: "pending" },
  { id: "PAYREQ2", who: "Northside Espresso Bar", role: "Seller", amount: 42100, requestedAt: "5 hours ago", status: "pending" },
  { id: "PAYREQ3", who: "Priya S.", role: "Rider", amount: 9600, requestedAt: "1 day ago", status: "pending" },
  { id: "PAYREQ4", who: "Fresh Fields Grocery", role: "Seller", amount: 67300, requestedAt: "1 day ago", status: "paid" },
];

function PayoutReviewSection() {
  const [requests, setRequests] = useState(PAYOUT_REQUESTS_SEED);
  const [rejectingId, setRejectingId] = useState(null);
  const approve = (id) => setRequests((rs) => rs.map((r) => r.id === id ? { ...r, status: "paid" } : r));
  const reject = (id) => { setRequests((rs) => rs.map((r) => r.id === id ? { ...r, status: "rejected" } : r)); setRejectingId(null); };
  const pending = requests.filter((r) => r.status === "pending");
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Payout Requests</div><span className="muted small">{pending.length} awaiting review</span></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Riders and sellers submit withdrawal requests from their own apps -- they land here for finance review before money moves. Nothing pays out automatically.</div>
        <div className="list-col">
          {requests.map((r) => (
            <div key={r.id} className="pending-row">
              <div className="driver-avatar sm">{r.role[0]}</div>
              <div className="ti-mid"><div className="card-name">{r.who}</div><div className="muted small">{r.role} -- requested {r.requestedAt}</div></div>
              <span className="mono" style={{ marginRight: 10 }}>{money(r.amount)}</span>
              {r.status === "pending" ? (
                rejectingId === r.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="ghost-btn-sm deny" onClick={() => reject(r.id)}>Confirm reject</button>
                    <button className="ghost-btn-sm" onClick={() => setRejectingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="round-btn approve" onClick={() => approve(r.id)}><Check size={13} /></button>
                    <button className="round-btn deny" onClick={() => setRejectingId(r.id)}><X size={13} /></button>
                  </div>
                )
              ) : (
                <span className={`status-pill ${r.status === "paid" ? "done" : "delay"}`}>{r.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentVerificationsSection({ sharedOrderStore }) {
  const [viewingProof, setViewingProof] = useState(null);
  if (!sharedOrderStore) {
    return <div className="section-pad"><div className="panel enter"><div className="muted small">This queue only works inside the combined preview (all 5 apps sharing one login) -- open combined.html to see real orders flow through here from the customer app.</div></div></div>;
  }
  const pending = sharedOrderStore.orders.filter((o) => o.stage === "verifying_payment");
  const verified = sharedOrderStore.orders.filter((o) => o.stage !== "verifying_payment");
  const verify = (order) => {
    const deliveryFee = order.total - order.productPayable;
    const breakdown = orderBreakdown({ productTotal: order.productPayable, deliveryFee, peak: isPeakHour() });
    sharedOrderStore.updateOrder(order.id, { stage: "payment_verified", breakdown, verifiedAt: Date.now() });
  };
  return (
    <div className="section-pad">
      {viewingProof && (
        <div className="modal-backdrop" onClick={() => setViewingProof(null)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setViewingProof(null)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 15, marginBottom: 10 }}>Proof of payment -- Order #{viewingProof.id}</div>
            <img src={viewingProof.transferProofPhoto} alt="" style={{ width: "100%", borderRadius: 12 }} />
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Payment Verifications</div><span className="muted small">{pending.length} awaiting review</span></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Real bank-transfer orders from the customer app, with the proof of payment they uploaded. Nothing moves to the seller until you verify it here.</div>
        {pending.length === 0 ? (
          <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle", color: "#16A34A" }} /> Nothing waiting on verification.</div>
        ) : (
          <div className="list-col">
            {pending.map((o) => (
              <div key={o.id} className="pending-row">
                {o.transferProofPhoto && <img src={o.transferProofPhoto} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", cursor: "pointer" }} onClick={() => setViewingProof(o)} />}
                <div className="ti-mid"><div className="card-name">Order #{o.id} -- {o.customerName}</div><div className="muted small">{money(o.total)} total via bank transfer</div></div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="ghost-btn-sm" onClick={() => setViewingProof(o)}>View proof</button>
                  <button className="primary-btn-sm" disabled={!o.transferProofPhoto} onClick={() => verify(o)}>Verify payment</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {verified.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Verified orders -- real payment breakdown</div>
          <div className="muted small" style={{ marginBottom: 12 }}>Exactly how much of each order goes to the seller, the rider, and Medra.</div>
          <div className="list-col">
            {verified.map((o) => (
              <div key={o.id} className="cat-top" style={{ alignItems: "flex-start", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
                  <span className="card-name" style={{ fontSize: 13 }}>Order #{o.id} -- {o.customerName}</span>
                  <span className="status-pill done">{o.stage.replace(/_/g, " ")}</span>
                </div>
                {o.breakdown && (
                  <div className="muted small">Seller: {money(o.breakdown.sellerGets)} -- Rider: {money(o.breakdown.riderGets)} -- Medra: {money(o.breakdown.productFee + o.breakdown.deliveryFeeCut)} -- Total: {money(o.breakdown.grandTotal)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsSection() {
  const totalGMV = VENDORS.reduce((s, v) => s + v.gmv, 0);
  const avgVendorRating = (VENDORS.reduce((s, v) => s + v.rating, 0) / VENDORS.length).toFixed(2);
  const topVendor = [...VENDORS].sort((a, b) => b.gmv - a.gmv)[0];
  const categoryGMV = {};
  VENDORS.forEach((v) => { categoryGMV[v.category] = (categoryGMV[v.category] || 0) + v.gmv; });
  const topCategory = Object.entries(categoryGMV).sort((a, b) => b[1] - a[1])[0];
  const topRider = [...RIDERS].sort((a, b) => b.trips - a.trips)[0];
  const weekTotal = REVENUE_TREND.reduce((s, d) => s + d.v, 0);
  const lastWeekTotal = LAST_WEEK_REVENUE_TREND.reduce((s, d) => s + d.v, 0);
  const weekOverWeek = Math.round((weekTotal / lastWeekTotal - 1) * 100);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Analytics</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Computed from real vendor, rider, and revenue data across the platform.</div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="stat-mini enter"><div className="muted">This week's revenue</div><div className="kpi-value" style={{ fontSize: 17 }}>{money(weekTotal)}</div><div className="muted small" style={{ color: weekOverWeek >= 0 ? "#16A34A" : "#DC2626" }}>{weekOverWeek >= 0 ? "+" : ""}{weekOverWeek}% vs last week</div></div>
          <div className="stat-mini enter"><div className="muted">Tracked vendor GMV</div><div className="kpi-value" style={{ fontSize: 17 }}>{money(totalGMV)}</div></div>
          <div className="stat-mini enter"><div className="muted">Avg. vendor rating</div><div className="kpi-value" style={{ fontSize: 17 }}>{avgVendorRating}</div></div>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Real standouts</div>
        <div className="list-col">
          <div className="cat-top"><span className="muted small">Top vendor by GMV</span><span className="mono small">{topVendor.name} -- {money(topVendor.gmv)}</span></div>
          <div className="cat-top"><span className="muted small">Top category by GMV</span><span className="mono small">{topCategory[0]} -- {money(topCategory[1])}</span></div>
          <div className="cat-top"><span className="muted small">Top rider by trips</span><span className="mono small">{topRider.name} -- {topRider.trips.toLocaleString()} trips</span></div>
        </div>
      </div>
    </div>
  );
}

function RevenueSourcesSection() {
  const productCommissionByVendor = VENDORS.map((v) => ({ name: v.name, amount: Math.round(v.gmv * PRODUCT_COMMISSION_RATE) })).sort((a, b) => b.amount - a.amount);
  const totalProductCommission = productCommissionByVendor.reduce((s, v) => s + v.amount, 0);
  const totalDeliveryFeeCollected = ORDERS_LEDGER.reduce((s, o) => s + orderBreakdown(o).deliveryFeeCut, 0);
  const totalCommissionsKPI = KPIS.find((k) => k.key === "commissions")?.value;
  const maxAmount = Math.max(...productCommissionByVendor.map((v) => v.amount), 1);

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Revenue by Source</div><span className="muted small">Platform commissions this period: {totalCommissionsKPI}</span></div>
        <div className="muted small" style={{ marginBottom: 14 }}>Where Medra's commission revenue is actually coming from, computed from real vendor GMV and the live commission rates -- {(PRODUCT_COMMISSION_RATE * 100).toFixed(0)}% product commission, {(DELIVERY_COMMISSION_NORMAL * 100).toFixed(0)}% normal / {(DELIVERY_COMMISSION_PEAK * 100).toFixed(0)}% peak delivery commission.</div>
        <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">Product commission (all vendors)</span><span className="mono">{money(totalProductCommission)}</span></div>
        <div className="bar-track" style={{ marginBottom: 12 }}><div className="bar-fill-h" style={{ width: "100%", background: "#4F46E5" }} /></div>
        <div className="cat-top" style={{ marginBottom: 6 }}><span className="muted small">Delivery commission (sample ledger)</span><span className="mono">{money(totalDeliveryFeeCollected)}</span></div>
        <div className="bar-track"><div className="bar-fill-h" style={{ width: `${Math.min(100, (totalDeliveryFeeCollected / (totalProductCommission || 1)) * 100)}%`, background: "#16A34A" }} /></div>
      </div>

      <div className="panel enter">
        <div className="panel-title">Top revenue-generating vendors</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Ranked by real product commission earned -- {(PRODUCT_COMMISSION_RATE * 100).toFixed(0)}% of each vendor's GMV.</div>
        <div className="list-col">
          {productCommissionByVendor.map((v) => (
            <div key={v.name} className="cat-top">
              <span className="muted small" style={{ flex: 1 }}>{v.name}</span>
              <div className="bar-track" style={{ flex: 2, marginRight: 10 }}><div className="bar-fill-h" style={{ width: `${(v.amount / maxAmount) * 100}%`, background: "#4F46E5" }} /></div>
              <span className="mono small">{money(v.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel enter">
        <div className="panel-title">Emerging point-economy revenue</div>
        <div className="muted small" style={{ marginBottom: 6, color: "#B45309" }}><AlertTriangle size={11} style={{ verticalAlign: "middle" }} /> These run client-side per customer session without a backend yet, so figures here aren't aggregated platform-wide the way commissions above are.</div>
        <div className="list-col">
          <div className="cat-top"><span className="muted small">Reverse Auction -- losing bids: under 150 = whole bid, 150+ = 2% fee</span><span className="muted small">Real per-session, not yet aggregated</span></div>
          <div className="cat-top"><span className="muted small">Point-to-naira conversion spread</span><span className="muted small">1:1 currently -- no spread applied</span></div>
        </div>
      </div>
    </div>
  );
}

function BenefactorControlSection() {
  const [payoutAmount, setPayoutAmount] = useState(20);
  const [payoutInput, setPayoutInput] = useState("20");
  const [selectionMethod, setSelectionMethod] = useState(BENEFACTOR_SELECTION_METHODS[0]);
  const [carePoolDrawAmount, setCarePoolDrawAmount] = useState(60);
  const [carePoolDrawInput, setCarePoolDrawInput] = useState("60");
  const [savedNote, setSavedNote] = useState(null);

  const saveWeekly = () => {
    const n = Number(payoutInput);
    if (n > 0) setPayoutAmount(n);
    setSavedNote("weekly");
    setTimeout(() => setSavedNote(null), 1800);
  };
  const saveCarePool = () => {
    const n = Number(carePoolDrawInput);
    if (n > 0) setCarePoolDrawAmount(n);
    setSavedNote("carepool");
    setTimeout(() => setSavedNote(null), 1800);
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Weekly Surprise Benefactor</div>
        <div className="muted small" style={{ marginBottom: 6, color: "#B45309" }}><AlertTriangle size={11} style={{ verticalAlign: "middle" }} /> This sets platform policy for the mechanic -- there's no live backend yet, so changes here don't push to customer sessions in real time.</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Funded by 40% of every real Point Sponsorship. Set how much each weekly payout is worth and how the recipient is decided.</div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>Payout amount (points)</span>
          <input type="number" min="1" value={payoutInput} onChange={(e) => setPayoutInput(e.target.value)} style={{ maxWidth: 140 }} />
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>Recipient selection method</span>
          <select className="sort-select" value={selectionMethod} onChange={(e) => setSelectionMethod(e.target.value)}>
            {BENEFACTOR_SELECTION_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <button className="ghost-btn-sm" onClick={saveWeekly}>{savedNote === "weekly" ? <><Check size={12} /> Saved</> : "Save weekly benefactor settings"}</button>
        <div className="muted small" style={{ marginTop: 10 }}>Current policy: {payoutAmount.toLocaleString()} points per week, via "{selectionMethod}".</div>
      </div>

      <div className="panel enter">
        <div className="panel-title">Community Care Pool</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Funded by 60% of every real Point Sponsorship, plus real Point Lending deposits. Members sign up and qualify by contributing at least once, then can draw once a year.</div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>Annual draw amount (points)</span>
          <input type="number" min="1" value={carePoolDrawInput} onChange={(e) => setCarePoolDrawInput(e.target.value)} style={{ maxWidth: 140 }} />
        </div>
        <button className="ghost-btn-sm" onClick={saveCarePool}>{savedNote === "carepool" ? <><Check size={12} /> Saved</> : "Save Care Pool settings"}</button>
        <div className="muted small" style={{ marginTop: 10 }}>Current policy: {carePoolDrawAmount} points per qualifying member, once every 365 days.</div>
      </div>
    </div>
  );
}

function AdminRosterSection({ onViewAs, roles }) {
  const [roster, setRoster] = useState(ADMIN_ROSTER);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const save = (admin) => {
    setRoster((r) => (r.find((a) => a.id === admin.id) ? r.map((a) => (a.id === admin.id ? admin : a)) : [...r, admin]));
    setEditing(null);
    setAdding(false);
  };
  const toggleStatus = (id) => setRoster((r) => r.map((a) => (a.id === id ? { ...a, status: a.status === "active" ? "suspended" : "active" } : a)));
  return (
    <>
      {(editing || adding) && <AdminEditModal admin={editing} roles={roles} onClose={() => { setEditing(null); setAdding(false); }} onSave={save} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Admin Team</div><button className="primary-btn-sm" onClick={() => setAdding(true)}>+ Add Admin</button></div>
        <p className="muted small" style={{ marginBottom: 12 }}>Only Super Admin can create admins or change what they can access. Admins cannot manage other admins.</p>
        <div className="list-col">
          {roster.map((a) => (
            <div key={a.id} className="pending-row">
              <div className="driver-avatar sm">{a.name.split(" ").map((w) => w[0]).join("")}</div>
              <div className="ti-mid">
                <div className="card-name">{a.name} {a.status === "suspended" && <span className="status-pill delay">Suspended</span>}</div>
                <div className="muted small">{a.role} -- manages: {[...a.caps].join(", ") || "nothing assigned yet"}</div>
              </div>
              <button className="ghost-btn-sm" onClick={() => onViewAs?.(a.name, a.role === "Support Staff" ? "support" : "admin")}><Eye size={11} /> View As</button>
              <button className="ghost-btn-sm" onClick={() => setEditing(a)}><Pencil size={11} /> Edit</button>
              <button className={`ghost-btn-sm ${a.status === "active" ? "deny" : ""}`} onClick={() => a.status === "active" ? confirmAction({ title: "Suspend this staff member?", message: "They will lose access until you reactivate them.", confirmLabel: "Suspend" }, () => toggleStatus(a.id)) : toggleStatus(a.id)}>{a.status === "active" ? "Suspend" : "Reactivate"}</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AccessReverseLookupSection({ perms, roles }) {
  const [capability, setCapability] = useState(PERMISSION_MATRIX_CAPS[0]);
  const rolesWithAccess = roles.filter((r) => perms[r]?.[capability]);
  const adminsWithAccess = ADMIN_ROSTER.filter((a) => rolesWithAccess.includes(a.role) || a.caps?.has(capability));
  return (
    <div className="panel enter">
      <div className="panel-title">Who has access to what?</div>
      <div className="muted small" style={{ marginBottom: 12 }}>Pick a capability, see every department and admin that currently has it.</div>
      <select className="sort-select" value={capability} onChange={(e) => setCapability(e.target.value)} style={{ marginBottom: 12 }}>
        {PERMISSION_MATRIX_CAPS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="muted small" style={{ fontWeight: 700, marginBottom: 6 }}>Departments ({rolesWithAccess.length})</div>
      {rolesWithAccess.length === 0 ? <div className="muted small" style={{ marginBottom: 10 }}>No department currently has this.</div> : (
        <div className="chip-row" style={{ marginBottom: 10 }}>{rolesWithAccess.map((r) => <span key={r} className="status-pill route">{r}</span>)}</div>
      )}
      <div className="muted small" style={{ fontWeight: 700, marginBottom: 6 }}>Individual admins ({adminsWithAccess.length})</div>
      {adminsWithAccess.length === 0 ? <div className="muted small">No admin currently has this.</div> : (
        <div className="list-col">
          {adminsWithAccess.map((a) => <div key={a.id} className="cat-top"><span className="muted small">{a.name}</span><span className="muted small">{a.role}</span></div>)}
        </div>
      )}
    </div>
  );
}

function PermissionsSection({ onViewAs }) {
  const [perms, setPerms] = useState(DEFAULT_PERMS);
  const [roles, setRoles] = useState(PERMISSION_MATRIX_ROLES);
  const [newRole, setNewRole] = useState("");
  const toggle = (role, cap) => setPerms((p) => ({ ...p, [role]: { ...p[role], [cap]: !p[role][cap] } }));
  const addRole = () => {
    const name = newRole.trim();
    if (!name || roles.includes(name)) return;
    setRoles((r) => [...r, name]);
    setPerms((p) => ({ ...p, [name]: Object.fromEntries(PERMISSION_MATRIX_CAPS.map((c) => [c, false])) }));
    setNewRole("");
  };
  const removeRole = (name) => {
    setRoles((r) => r.filter((x) => x !== name));
    setPerms((p) => { const n = { ...p }; delete n[name]; return n; });
  };
  return (
    <div className="section-pad">
      <AdminRosterSection onViewAs={onViewAs} roles={roles} />
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Department defaults</div><span className="muted small"><Lock size={11} style={{ verticalAlign: "middle" }} /> Starting point for new admins in each department -- edit an individual admin above to override</span></div>
        <div style={{ marginBottom: 10 }}>
          <button className="ghost-btn-sm" onClick={() => {
            const roles = Object.keys(perms);
            const rows = roles.map((role) => [role, ...PERMISSION_MATRIX_CAPS.map((cap) => perms[role][cap] ? "Yes" : "No")]);
            exportCsv("medra-permission-matrix.csv", [["Department", ...PERMISSION_MATRIX_CAPS], ...rows]);
          }}><FileDown size={12} /> Export current permission matrix</button>
        </div>
        <table className="admin-table">
          <thead><tr><th>Capability</th>{roles.map((r) => <th key={r}>{r}</th>)}</tr></thead>
          <tbody>
            {PERMISSION_MATRIX_CAPS.map((cap) => (
              <tr key={cap}>
                <td className="card-name">{cap}</td>
                {roles.map((role) => (
                  <td key={role} style={{ textAlign: "center" }}>
                    <button className={`perm-toggle ${perms[role]?.[cap] ? "on" : ""}`} onClick={() => toggle(role, cap)}>{perms[role]?.[cap] ? <Check size={12} /> : null}</button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
          <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="New department/role name..." style={{ flex: 1 }} />
          <button className="ghost-btn-sm" disabled={!newRole.trim()} onClick={addRole}>+ Add role</button>
          {roles.length > PERMISSION_MATRIX_ROLES.length && (
            <select className="sort-select" onChange={(e) => { if (e.target.value) removeRole(e.target.value); e.target.value = ""; }} defaultValue="">
              <option value="" disabled>Remove custom role...</option>
              {roles.filter((r) => !PERMISSION_MATRIX_ROLES.includes(r)).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
      </div>
      <AccessReverseLookupSection perms={perms} roles={roles} />
    </div>
  );
}

const SECTION_MAP = {
  dashboard: OverviewSection,
  orders: OrdersLedgerSection,
  sellers: VendorsSection,
  riders: RidersSection,
  users: UsersSection,
  payouts: () => <PayoutsSection initialTab="requests" />,
  disputes: DisputesSectionSA,
  tickets: TicketsSectionSA,
  moderation: ModerationSection,
  changelog: ChangelogSection,
  "unified-feed": UnifiedFeedScreen,
  sessions: SessionsScreen,
  "my-activity": MyActivityScreen,
  reports: ReportsScreen,
  analytics: AnalyticsSection,
  "feature-marketplace": FeatureMarketplaceSection,
  promotions: PromotionsSection,
  referral: ReferralSection,
  membership: MembershipPlansSection,
  kyc: KycVerificationsSection,
  "system-settings": SystemSettingsSection,
  "data-retention": DataRetentionSection,
  categories: CategoriesSection,
  "delivery-mgmt": DeliveryManagementSection,
  "app-settings": AppSettingsSection,
  "delivery-settings": DeliverySettingsSection,
  "payment-methods": PaymentMethodsSection,
  "commission-engine": CommissionEngineSection,
  sos: SosSafetySection,
  "feature-availability": FeatureAvailabilitySection,
  "countries-regions": CountriesRegionsSection,
  "wallet-tx": WalletAdjustmentSection,
  "live-chat": () => <SupportOversightSection initialTab="livechat" />,
  "support-messages": () => <SupportOversightSection initialTab="messages" />,
  payments: () => <FinancialTransactionsSection initialTab="payments" />,
  "wallet-topups": () => <FinancialTransactionsSection initialTab="topups" />,
  "tx-logs": () => <FinancialTransactionsSection initialTab="txlog" />,
  "platform-tools": PlatformToolsSection,
  "free-visit-approvals": FreeVisitApprovalsSection,
  "feature-toggles": FeatureTogglesSection,
  "feature-rollout": FeatureRolloutSection,
  notifications: NotificationsSection,
  announcements: AnnouncementsSection,
  "faq-editor": FaqEditorSection,
  community: CommunityScreen,
  "ai-assistant": AIAssistantScreen,
  broadcast: BroadcastSection,
  "giveaway-control": GiveawayControlSection,
  "benefactor-control": BenefactorControlSection,
  "revenue-sources": RevenueSourcesSection,
  "payout-review": () => <PayoutsSection initialTab="requests" />,
  "payment-verifications": PaymentVerificationsSection,
  "fraud-watchlist": FraudWatchlistSection,
  "challenge-control": ChallengeControlSection,
  "lottery-draw": LotteryDrawSection,
  "roles-permissions": PermissionsSection,
  "staff-leaderboard": StaffLeaderboardSection,
  "component-library": ComponentLibrarySection,
  "platform-logs": PlatformLogsSection,
  "system-health": SystemHealthSection,
};

/* ============================================================
   APP SHELL
   ============================================================ */

function RoleLanding({ eyebrow, headline, sub, features, ctaLabel, onGetStarted }) {
  return (
    <div className="medra-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      <div className="staff-login-wrap">
        <div className="staff-login-card role-landing-card enter">
          <Logo tagline="Platform Owner" badge />
          <div className="role-landing-eyebrow">{eyebrow}</div>
          <div className="role-landing-headline">{headline}</div>
          <div className="muted" style={{ marginBottom: 22 }}>{sub}</div>
          <div className="role-landing-features">
            {features.map((f, i) => (
              <div key={i} className="role-landing-feature">
                <div className="role-landing-feature-icon"><f.icon size={16} /></div>
                <div><div className="card-name" style={{ fontSize: 13.5 }}>{f.title}</div><div className="muted small">{f.desc}</div></div>
              </div>
            ))}
          </div>
          <button className="primary-btn wide" onClick={onGetStarted}>{ctaLabel}</button>
        </div>
      </div>
    </div>
  );
}

function StaffLoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [totp, setTotp] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!totp) { setTotp(true); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 700);
  };
  return (
    <div className="medra-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      <div className="staff-login-wrap">
        <div className="staff-login-card enter">
          <Logo tagline="Platform Owner" badge />
          <div className="staff-login-title" style={{ marginTop: 18 }}>{totp ? "Two-factor verification" : "Staff sign in"}</div>
          <div className="muted">{totp ? "Enter the 6-digit code from your authenticator app" : "Full platform access -- restricted"}</div>
          <div className="muted small" style={{ textAlign: "center", marginTop: 6 }}>Preview build -- this is a demo environment, not a live account.</div>
          <form className="login-form" onSubmit={submit} style={{ marginTop: 20 }}>
            {!totp ? (
              <>
                <label className="field"><span>Work email</span><input type="email" defaultValue="superadmin@medra.com" placeholder="you@medra.com" required /></label>
                <label className="field"><span>Password</span><input type="password" defaultValue="demo1234" placeholder="********" required /></label>
              </>
            ) : (
              <label className="field"><span>Authentication code</span><input type="text" inputMode="numeric" maxLength={6} defaultValue="123456" placeholder="123456" className="totp-input" required /></label>
            )}
            <button className={`primary-btn wide ${loading ? "loading" : ""}`} type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : totp ? "Verify & sign in" : "Continue"}
            </button>
          </form>
          <div className="login-note"><ShieldCheck size={13} /> Super Admin requires 2FA on every sign-in</div>
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

export default function MedraSuperAdminPortal({ sharedAuthed, onAuth, onLogout, sharedOrderStore } = {}) {
  const [authed, setAuthedRaw] = useState(!!sharedAuthed);
  useEffect(() => { if (sharedAuthed) setAuthedRaw(true); }, [sharedAuthed]);
  const setAuthed = (v) => { setAuthedRaw(v); if (v) onAuth?.(); else onLogout?.(); };
  // Idle-timeout auto-logout: staff dashboards handle sensitive data, so a
  // forgotten unlocked session shouldn't stay live indefinitely. 15 minutes
  // of no mouse/keyboard/touch activity signs the staffer out automatically.
  const [idleWarning, setIdleWarning] = useState(false);
  // Demo anonymization -- masks real-looking names/emails app-wide when
  // presenting to someone outside the team, without touching the underlying
  // seed data (so turning it off instantly restores the real view).
  const [anonymizeDemo, setAnonymizeDemo] = useState(false);
  const anonName = (name, salt = "") => {
    if (!anonymizeDemo || !name) return name;
    const h = [...(name + salt)].reduce((s, c) => s + c.charCodeAt(0), 0);
    const first = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie"][h % 8];
    const last = ["Okoro", "Bello", "Adeyemi", "Chukwu", "Eze", "Musa", "Balogun", "Umeh"][h % 8];
    return `${first} ${last}`;
  };
  const anonEmail = (email) => (anonymizeDemo && email ? `user${Math.abs([...email].reduce((s, c) => s + c.charCodeAt(0), 0)) % 9000 + 1000}@example.com` : email);
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, []);
  useEffect(() => {
    if (!authed) return;
    let warnTimer, logoutTimer;
    const resetTimers = () => {
      setIdleWarning(false);
      clearTimeout(warnTimer);
      clearTimeout(logoutTimer);
      warnTimer = setTimeout(() => setIdleWarning(true), 12 * 60 * 1000);
      logoutTimer = setTimeout(() => setAuthed(false), 15 * 60 * 1000);
    };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimers));
    resetTimers();
    return () => { events.forEach((e) => window.removeEventListener(e, resetTimers)); clearTimeout(warnTimer); clearTimeout(logoutTimer); };
  }, [authed]);
  const [showLanding, setShowLanding] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [deliveredNotice, setDeliveredNotice] = useState(null);
  useEffect(() => {
    if (!sharedOrderStore) return;
    sharedOrderStore.orders.forEach((o) => {
      if (o.stage === "delivered" && !o.adminNotifiedDelivered) {
        setDeliveredNotice(`Order #${o.id} was delivered and confirmed by both the customer and rider.`);
        setTimeout(() => setDeliveredNotice(null), 4000);
        sharedOrderStore.updateOrder(o.id, { adminNotifiedDelivered: true });
      }
    });
  }, [sharedOrderStore?.orders]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const isFirstNav = useRef(true);
  useEffect(() => {
    if (isFirstNav.current) { isFirstNav.current = false; return; }
    setNavLoading(true);
    const t = setTimeout(() => setNavLoading(false), 350);
    return () => clearTimeout(t);
  }, [active]);
  useEffect(() => {
    if (!authed) return;
    setAppLoading(true);
    const t = setTimeout(() => setAppLoading(false), 550);
    return () => clearTimeout(t);
  }, [authed]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState(new Set());
  const [dateOpen, setDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState("Aug 12 - Aug 19, 2026");
  const [viewAs, setViewAs] = useState(null);
  const [pendingViewAs, setPendingViewAs] = useState(null); // { target, appKey } while the reason prompt is open
  const [viewAsReason, setViewAsReason] = useState("");
  const [viewAsLog, setViewAsLog] = useState([]);
  const [logOpen, setLogOpen] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [healthIncidents, setHealthIncidents] = useState([]);
  const logIncident = (service, detail) => setHealthIncidents((h) => [{ id: `INC${Date.now()}`, service, detail, time: "Just now" }, ...h]);
  const updateIncident = (id, patch) => setHealthIncidents((h) => h.map((inc) => inc.id === id ? { ...inc, ...patch } : inc));
  const logActivity = (action) => setActivityLog((log) => [{ action, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...log]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const logView = (type, label, sectionKey) => setRecentlyViewed((rv) => [{ type, label, sectionKey, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...rv.filter((r) => r.label !== label)].slice(0, 5));
  const [sentLog, setSentLog] = useState([]);
  const APP_FILE_MAP = { customer: "customer.html", seller: "seller.html", rider: "rider.html", admin: "admin.html", support: "support.html" };
  const startViewAs = (target, appKey = "customer") => {
    setViewAs(target);
    setViewAsLog((log) => [{ actor: "You (Super Admin)", target, reason: viewAsReason.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...log]);
    logActivity(`Viewed as ${target} (${appKey}) -- reason: ${viewAsReason.trim()}`);
    window.dispatchEvent(new CustomEvent("medra:switch-app", { detail: { app: appKey, viewAsTarget: target } }));
    if (!window.__MEDRA_SHELL__) {
      const existing = document.getElementById("medra-standalone-toast");
      if (existing) existing.remove();
      const toast = document.createElement("div");
      toast.id = "medra-standalone-toast";
      toast.textContent = `This is the super admin preview -- open ${APP_FILE_MAP[appKey]} to actually view as ${target}.`;
      toast.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0F172A;color:#fff;padding:12px 20px;border-radius:100px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 20px 40px -16px rgba(0,0,0,0.4);";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3800);
    }
  };
  // Every View As trigger now opens a reason prompt first -- this is the
  // function actually passed down as onViewAs, so no call site needs to
  // change; it just requests a reason before the real startViewAs runs.
  const requestViewAs = (target, appKey = "customer") => setPendingViewAs({ target, appKey });
  const confirmViewAs = () => {
    if (!pendingViewAs || !viewAsReason.trim()) return;
    startViewAs(pendingViewAs.target, pendingViewAs.appKey);
    setPendingViewAs(null);
    setViewAsReason("");
  };
  useEffect(() => {
    if (!viewAs) return;
    const timer = setTimeout(() => {
      setViewAs(null);
      logActivity(`View-As session for ${viewAs} auto-expired after 10 minutes`);
    }, 10 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [viewAs]);
  const [openSection, setOpenSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "?" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const [recentPaletteKeys, setRecentPaletteKeys] = useState([]);
  if (!authed && showLanding) {
    return (
      <RoleLanding
        eyebrow="Super Admin Portal"
        headline="Full control over the Medra platform"
        sub="Manage users, finances, feature rollouts, and platform-wide settings from a single command center."
        features={[
          { icon: TrendingUp, title: "Real-time platform metrics", desc: "GMV, orders, and growth across every role, in one dashboard." },
          { icon: ToggleLeft, title: "Feature flags & rollouts", desc: "Turn features on, off, or into beta -- across the whole platform." },
          { icon: Users2, title: "Full user & role management", desc: "Manage admins, sellers, riders, and customers with granular permissions." },
        ]}
        ctaLabel="Continue to sign in"
        onGetStarted={() => setShowLanding(false)}
      />
    );
  }
  if (!authed) return <StaffLoginScreen onLogin={() => setAuthed(true)} />;

  const activeLabel = active === "dashboard" ? "Dashboard" : NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.key === active)?.label || "Dashboard";
  const Active = SECTION_MAP[active] || (() => <GenericScreen config={GENERIC_CONFIG[active]} />);

  const goTo = (key, sectionLabel) => { setActive(key); setOpenSection(sectionLabel); setSearchQuery(""); setRecentPaletteKeys((r) => [key, ...r.filter((k) => k !== key)].slice(0, 5)); };
  const allSearchable = NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, sectionLabel: s.label })));
  const allDataSearchable = [
    ...ORDERS_LEDGER.map((o) => ({ key: "orders", dataType: "Order", label: `#${o.id}`, sub: `${o.customer} -- ${o.vendor}` })),
    ...USERS_LIST.map((u) => ({ key: "users", dataType: "User", label: u.name, sub: u.email })),
    ...RIDERS.map((r) => ({ key: "riders", dataType: "Rider", label: r.name, sub: `${r.trips} trips` })),
    ...TICKETS_SA.map((t) => ({ key: "tickets", dataType: "Ticket", label: t.id, sub: `${t.customer} -- ${t.subject}` })),
  ];
  const searchResults = searchQuery.trim() ? allSearchable.filter((i) => i.label.toLowerCase().includes(searchQuery.trim().toLowerCase())) : [];

  return (
    <div className="medra-root">
      <ConfirmHost />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      {paletteOpen && <CommandPalette items={allSearchable} dataItems={allDataSearchable} recentKeys={recentPaletteKeys} recentEntities={recentlyViewed} onSelect={(key) => goTo(key, allSearchable.find((i) => i.key === key)?.sectionLabel)} onClose={() => setPaletteOpen(false)} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {idleWarning && (
        <div className="viewas-banner" style={{ background: "#DC2626" }}>
          <ClockIcon size={14} /> You've been idle -- you'll be signed out in about 3 minutes unless you keep working.
        </div>
      )}
      {isOffline && (
        <div style={{ background: "#7C2D12", color: "#fff", textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "6px 10px" }}>
          You're offline -- sensitive actions (suspend, refund, payouts, etc.) are paused until you're back online.
        </div>
      )}
      {pendingViewAs && (
        <div className="modal-backdrop" onClick={() => { setPendingViewAs(null); setViewAsReason(""); }}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setPendingViewAs(null); setViewAsReason(""); }}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 4 }}>View as {pendingViewAs.target}?</div>
            <p className="muted small" style={{ marginBottom: 12 }}>A reason is required and recorded in the View-As audit log. This session auto-expires after 10 minutes.</p>
            <div className="field" style={{ marginBottom: 16 }}><span>Reason</span><input type="text" value={viewAsReason} onChange={(e) => setViewAsReason(e.target.value)} placeholder="e.g. Debugging a customer-reported order issue" autoFocus /></div>
            <button className="primary-btn-sm wide" disabled={!viewAsReason.trim()} onClick={confirmViewAs}>Start View-As session</button>
          </div>
        </div>
      )}
      {viewAs && (
        <div className="viewas-banner">
          <Eye size={14} /> Viewing as <b>{viewAs}</b> -- support debug mode
          <button className="link-btn" style={{ color: "#93C5FD" }} onClick={() => setLogOpen(true)}>Audit log ({viewAsLog.length})</button>
          <button className="ghost-btn-sm light" onClick={() => setViewAs(null)}>Exit</button>
        </div>
      )}
      {logOpen && (
        <div className="modal-backdrop" onClick={() => setLogOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLogOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 4 }}>View-As audit log</div>
            {viewAsLog.length > 0 && (
              <button className="ghost-btn-sm" style={{ marginBottom: 12 }} onClick={() => {
                const rows = [["Actor", "Viewed As", "Reason", "Time"]];
                viewAsLog.forEach((l) => rows.push([l.actor, l.target, l.reason || "", l.time]));
                exportCsv("medra-viewas-audit-log.csv", rows);
              }}><FileDown size={12} /> Export CSV</button>
            )}
            {viewAsLog.length === 0 ? <EmptyStateNote>No View-As sessions logged yet.</EmptyStateNote> : (
              <div className="list-col">
                {viewAsLog.map((l, i) => (
                  <div key={i} className="pending-row"><Eye size={13} /><div className="ti-mid"><div className="card-name">{l.actor}</div><div className="muted small">Viewed as {l.target}{l.reason ? ` -- ${l.reason}` : ""}</div></div><div className="muted small">{l.time}</div></div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="desk-shell">
        <div className={`sidebar dark ${mobileNavOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-head"><Logo tagline="Super Admin" dark /></div>
          <nav className="sidebar-nav" onClick={(e) => { if (e.target.closest(".side-btn")) setMobileNavOpen(false); }}>
            <button className={`side-btn ${active === "dashboard" ? "active" : ""}`} onClick={() => setActive("dashboard")}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
            {NAV_SECTIONS.map((section) => {
              const isOpen = openSection === section.label;
              const hasActive = section.items.some((i) => i.key === active);
              return (
                <div key={section.label} className="side-section">
                  <button className={`side-section-label collapsible ${hasActive ? "has-active" : ""}`} onClick={() => setOpenSection(isOpen ? null : section.label)}>
                    {section.label}
                    <ChevronDown size={12} className={`chevron ${isOpen ? "open" : ""}`} />
                  </button>
                  {isOpen && section.items.map((item) => (
                    <button key={item.key} className={`side-btn ${active === item.key ? "active" : ""}`} onClick={() => goTo(item.key, section.label)}>
                      <item.icon size={16} /> {item.label}
                      {item.badge && <span className="side-badge">{item.badge}</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
          <button className="side-btn logout" onClick={() => setAuthed(false)}><LogOut size={16} /> Logout</button>
        </div>
        <div className={`sidebar-scrim ${mobileNavOpen ? "show" : ""}`} onClick={() => setMobileNavOpen(false)} />
        {deliveredNotice && <div className="switch-toast"><ShieldCheck size={14} /> {deliveredNotice}</div>}

        <div className="main">
          <div className="topbar">
            <button className="hamburger-btn" onClick={() => setMobileNavOpen(true)}><Menu size={18} /></button>
            <div>
              <div className="page-title">{activeLabel === "Dashboard" ? "Super Admin Dashboard" : activeLabel} {activeLabel === "Dashboard" && <ShieldCheck size={16} className="verified-badge" />}</div>
              <div className="muted">{activeLabel === "Dashboard" ? "Monitor and manage the entire Medra platform" : `Manage ${activeLabel.toLowerCase()} across the platform`}</div>
            </div>
            <div className="topbar-actions">
              <div className="admin-search-anchor">
                <div className="admin-search"><Search size={14} /><input placeholder="Search sections..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                {searchResults.length > 0 && (
                  <div className="notif-dropdown">
                    {searchResults.map((r) => (
                      <button key={r.key} className="notif-row" onClick={() => goTo(r.key, r.sectionLabel)}>
                        <div className="pending-icon" style={{ background: "#EEF2FF", color: "#6D28D9" }}><r.icon size={14} /></div>
                        <div className="ti-mid"><div className="card-name">{r.label}</div><div className="muted small">{r.sectionLabel}</div></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="ghost-btn-sm cmdk-trigger" onClick={() => setPaletteOpen(true)}><Search size={12} /> Quick jump <span className="cmdk-kbd">⌘K</span></button>
              <button className="ghost-btn-sm shortcuts-trigger" onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts">?</button>
              <button className="ghost-btn-sm" style={anonymizeDemo ? { background: "#F3EEFF", border: "1px solid var(--purple)" } : undefined} onClick={() => setAnonymizeDemo((a) => !a)} title="Mask real-looking names/emails for screen-sharing"><Eye size={12} /> {anonymizeDemo ? "Anonymized" : "Demo mode"}</button>
              <div className="daterange-anchor">
                <button className="date-btn" onClick={() => setDateOpen((o) => !o)}><Calendar size={14} /> {dateRange} <ChevronDown size={13} /></button>
                {dateOpen && (
                  <>
                    <div className="notif-scrim" onClick={() => setDateOpen(false)} />
                    <div className="notif-dropdown" style={{ width: 220 }}>
                      {DATE_PRESETS.map((p) => (
                        <button key={p} className="notif-row" onClick={() => { setDateRange(p); setDateOpen(false); }}>
                          <div className="ti-mid card-name">{p}</div>
                          {dateRange === p && <Check size={14} color="#16A34A" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="notif-anchor">
                <button className="icon-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications"><Bell size={17} />{(NOTIF_LIST.length - readNotifs.size) > 0 && <span className="icon-badge">{NOTIF_LIST.length - readNotifs.size}</span>}</button>
                {notifOpen && (
                  <>
                    <div className="notif-scrim" onClick={() => setNotifOpen(false)} />
                    <div className="notif-dropdown">
                      <div className="panel-title" style={{ padding: "12px 14px 6px" }}>Notifications</div>
                      {NOTIF_LIST.map((n, i) => (
                        <button key={i} className={`notif-row ${readNotifs.has(i) ? "read" : ""}`} onClick={() => { setActive(n.goTo); setNotifOpen(false); setReadNotifs((r) => new Set(r).add(i)); }}>
                          <div className="pending-icon" style={{ background: n.color + "1A", color: n.color }}><n.icon size={14} /></div>
                          <div className="ti-mid"><div className="card-name">{n.title}</div><div className="muted">{n.sub}</div></div>
                          {!readNotifs.has(i) && <span className="unread-dot" />}
                          <div className="muted small">{n.time}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button className="icon-btn" onClick={() => setActive("tickets")} aria-label="Support tickets"><MessageCircle size={17} /><span className="icon-badge">9</span></button>
              <div className="user-chip">
                <div className="driver-avatar sm">SA</div>
                <div><div className="card-name">Super Admin</div><div className="muted">Platform Owner</div></div>
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
          {active === "dashboard" && appLoading ? <DashboardSkeleton /> : navLoading ? <ScreenSkeleton /> : <Active key={active} onNavigate={setActive} onViewAs={requestViewAs} logActivity={logActivity} activityLog={activityLog} logView={logView} recentlyViewed={recentlyViewed} viewAsLog={viewAsLog} sentLog={sentLog} setSentLog={setSentLog} sharedOrderStore={sharedOrderStore} healthIncidents={healthIncidents} logIncident={logIncident} updateIncident={updateIncident} dateRange={dateRange} anonName={anonName} anonEmail={anonEmail} />}
        </div>
      </div>
    </div>
  );
}

const CSS = `
:root{ --ink:#0F172A; --muted:#64748B; --border:#E5E7EB; --bg:#F7F8FB; --card:#FFFFFF; --purple:#6D28D9; --purple-light:#EEF2FF; }
.medra-root{ font-family:'Inter',sans-serif; color:var(--ink); background:var(--bg); min-height:100%; display:flex; justify-content:center; }
.medra-root *{ box-sizing:border-box; }
button{ font-family:inherit; border:none; background:none; cursor:pointer; color:inherit; }
input{ font-family:inherit; }
.muted{ color:var(--muted); font-size:12.5px; }
.muted.small{ font-size:11px; }
.mono{ font-family:'JetBrains Mono',monospace; font-size:12.5px; }
.mono.neg{ color:#DC2626; }
.card-name{ font-size:13px; font-weight:600; }

.brand-logo{ display:flex; align-items:center; gap:9px; }
.brand-word{ font-weight:800; font-size:17px; letter-spacing:-0.01em; display:flex; align-items:center; gap:5px; color:#0F172A; }
.brand-word.on-dark{ color:#fff; }
.brand-badge{ color:#3B82F6; }
.brand-tag{ font-size:10.5px; color:var(--muted); font-weight:500; }
.brand-tag.on-dark{ color:#94A3B8; }

.desk-shell{ width:100%; max-width:1440px; min-height:100vh; display:flex; }
.sidebar{ width:264px; flex-shrink:0; background:#fff; border-right:1px solid var(--border); display:flex; flex-direction:column; padding:18px 12px; gap:10px; height:100vh; position:sticky; top:0; overflow:hidden; }
.sidebar.dark{ background:#0B1220; border-right:1px solid #1E293B; }
.sidebar-head{ padding:4px 8px 10px; border-bottom:1px solid var(--border); margin-bottom:4px; }
.sidebar.dark .sidebar-head{ border-bottom-color:#1E293B; }
.sidebar-nav{ flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:2px; padding-right:2px; }
.sidebar-nav::-webkit-scrollbar{ width:5px; } .sidebar-nav::-webkit-scrollbar-thumb{ background:#334155; border-radius:10px; }
.side-section{ margin-top:6px; }
.side-section-label{ display:flex; align-items:center; justify-content:space-between; width:100%; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:#64748B; font-weight:700; padding:8px 10px 8px; border-radius:8px; transition:background 120ms ease, color 120ms ease; }
.side-section-label.collapsible:hover{ background:#F8FAFC; }
.side-section-label.has-active{ color:var(--purple); }
.sidebar.dark .side-section-label{ color:#475569; }
.sidebar.dark .side-section-label.collapsible:hover{ background:#151F32; }
.sidebar.dark .side-section-label.has-active{ color:#A78BFA; }
.chevron{ transition:transform 160ms ease; flex-shrink:0; }
.chevron.open{ transform:rotate(180deg); }
.admin-search-anchor{ position:relative; flex:1; max-width:280px; }
.cmdk-trigger{ display:flex; align-items:center; gap:6px; white-space:nowrap; }
.shortcuts-trigger{ width:28px; height:28px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:100px; font-weight:700; }
.cmdk-kbd{ background:var(--bg); border:1px solid var(--border); border-radius:5px; padding:1px 5px; font-size:10px; font-family:'JetBrains Mono',monospace; color:var(--muted); }
.cmdk-backdrop{ align-items:flex-start; padding-top:12vh; }
.cmdk-panel{ background:#fff; border-radius:16px; width:100%; max-width:560px; max-height:60vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 30px 60px -20px rgba(0,0,0,0.35); }
.cmdk-input-row{ display:flex; align-items:center; gap:10px; padding:16px 18px; border-bottom:1px solid var(--border); }
.cmdk-input-row input{ flex:1; border:none; outline:none; font-size:15px; background:none; }
.cmdk-hint{ font-size:10.5px; color:var(--muted); border:1px solid var(--border); border-radius:5px; padding:2px 6px; }
.cmdk-results{ overflow-y:auto; padding:8px; }
.cmdk-item{ display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:10px 12px; border-radius:10px; font-size:13px; }
.cmdk-type-tag{ font-size:10px; font-weight:700; text-transform:uppercase; color:var(--purple); background:var(--purple-light); border-radius:5px; padding:2px 6px; flex-shrink:0; }
.cmdk-item.active{ background:var(--purple-light); color:var(--purple); }
.admin-search{ display:flex; align-items:center; gap:8px; border:1px solid var(--border); background:#fff; border-radius:10px; padding:8px 12px; }
.admin-search input{ border:none; outline:none; font-size:12.5px; background:none; flex:1; }
.side-btn{ display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:8px; font-size:12.5px; font-weight:500; color:#334155; width:100%; text-align:left; transition:background 150ms ease, color 150ms ease; position:relative; }
.sidebar.dark .side-btn{ color:#94A3B8; }
.side-btn:hover{ background:#F1F5F9; }
.sidebar.dark .side-btn:hover{ background:#151F32; }
.side-btn.active{ background:var(--purple-light); color:var(--purple); font-weight:700; }
.sidebar.dark .side-btn.active{ background:#1E1B4B; color:#A78BFA; }
.side-badge{ margin-left:auto; background:#DC2626; color:#fff; font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:100px; }
.side-btn.logout{ color:#DC2626; margin-top:8px; padding:10px; font-weight:600; }

.main{ flex:1; min-width:0; padding:20px 28px 60px; overflow-y:auto; height:100vh; }
.topbar{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:16px; flex-wrap:wrap; }
.page-title{ font-size:21px; font-weight:800; letter-spacing:-0.01em; display:flex; align-items:center; gap:8px; }
.verified-badge{ color:#3B82F6; }
.topbar-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.date-btn{ display:flex; align-items:center; gap:7px; border:1px solid var(--border); background:#fff; border-radius:10px; padding:8px 12px; font-size:12.5px; font-weight:500; }
.icon-btn{ position:relative; width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; }
.hamburger-btn{ display:none; align-items:center; justify-content:center; width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid var(--border); flex-shrink:0; }
.switch-toast{ position:fixed; top:18px; left:50%; transform:translateX(-50%); background:#0F172A; color:#fff; padding:11px 18px; border-radius:100px; font-size:12.5px; font-weight:600; display:flex; align-items:center; gap:8px; z-index:300; box-shadow:0 20px 40px -16px rgba(0,0,0,0.4); max-width:90vw; }
.icon-badge{ position:absolute; top:-5px; right:-5px; background:#DC2626; color:#fff; font-size:9px; font-weight:700; min-width:16px; height:16px; border-radius:100px; display:flex; align-items:center; justify-content:center; padding:0 3px; }
.notif-anchor{ position:relative; }
.daterange-anchor{ position:relative; }
.viewas-banner{ display:flex; align-items:center; gap:8px; background:#0F172A; color:#fff; padding:9px 20px; font-size:12.5px; font-weight:600; }
.viewas-banner .ghost-btn-sm.light{ margin-left:auto; border-color:rgba(255,255,255,0.3); color:#fff; }
.perm-toggle{ width:22px; height:22px; border-radius:6px; border:1.5px solid var(--border); display:inline-flex; align-items:center; justify-content:center; color:#fff; }
.perm-toggle.on{ background:var(--purple); border-color:var(--purple); }
.radius-slider{ width:100%; accent-color:var(--purple); }
.rollout-row{ border:1px solid var(--border); border-radius:12px; padding:12px 14px; }
.ticket-item{ display:flex; align-items:center; gap:10px; padding:10px; border-radius:12px; text-align:left; width:100%; transition:background 150ms ease; }
.ticket-item:hover{ background:#F8F9FC; } .ticket-item.active{ background:var(--purple-light); }
.priority-dot{ width:8px; height:8px; border-radius:100px; flex-shrink:0; background:#94A3B8; }
.sla-breach{ font-size:9.5px; font-weight:700; color:#DC2626; margin-top:2px; }
.sla-readout{ display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); background:var(--bg); border-radius:10px; padding:9px 12px; margin-bottom:12px; }
.sla-readout.breached{ background:#FEF2F2; color:#991B1B; }
.version-tag{ text-align:center; font-size:11px; color:#B0B7C3; padding:16px 0; }
.priority-dot.high{ background:#DC2626; } .priority-dot.medium{ background:#F59E0B; } .priority-dot.low{ background:#94A3B8; }
.msg-bubble{ background:var(--bg); border:1px solid var(--border); border-radius:14px; padding:12px 14px; font-size:13.5px; margin-bottom:12px; }
.msg-bubble.reply{ background:var(--purple-light); border-color:#DDD6FE; margin-left:20%; }
.reply-row{ display:flex; gap:10px; }
.reply-row input{ flex:1; border:1px solid var(--border); border-radius:12px; padding:10px 14px; font-size:13px; outline:none; }
.dispute-card{ border:1px solid var(--border); border-radius:12px; padding:12px; }
.save-view-input{ border:1px solid var(--border); border-radius:10px; padding:8px 10px; font-size:12.5px; width:130px; }
.notif-scrim{ position:fixed; inset:0; z-index:60; }
.notif-dropdown{ position:absolute; top:44px; right:0; width:320px; max-width:88vw; background:#fff; border:1px solid var(--border); border-radius:14px; box-shadow:0 20px 40px -16px rgba(15,23,42,0.3); z-index:61; overflow:hidden; }
.notif-row{ display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:10px 14px; border-top:1px solid #F1F5F9; transition:background 120ms ease; }
.notif-row.read{ opacity:0.55; }
.unread-dot{ width:7px; height:7px; border-radius:100px; background:#7C3AED; flex-shrink:0; }
.confirm-modal{ background:#fff; border-radius:20px; padding:26px; width:420px; max-width:92vw; max-height:88vh; overflow-y:auto; position:relative; }
.notif-row:hover{ background:#F8F9FC; }
:focus-visible{ outline:2px solid var(--purple); outline-offset:2px; border-radius:4px; }
.notif-row-full{ width:100%; text-align:left; transition:background 120ms ease; border-radius:10px; }
.notif-row-full:hover{ background:#F8F9FC; }
.user-chip{ display:flex; align-items:center; gap:9px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:6px 10px; }
.driver-avatar{ width:34px; height:34px; border-radius:100px; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex-shrink:0; }
.driver-avatar.sm{ width:32px; height:32px; font-size:11px; }

.section-pad{ display:flex; flex-direction:column; gap:16px; }
.enter{ animation: fadeUp 380ms cubic-bezier(.2,.8,.2,1) both; }
@keyframes fadeUp{ from{ opacity:0; transform:translateY(8px);} to{ opacity:1; transform:none;} }
.row-enter{ animation: fadeUp 340ms ease both; }

.kpi-grid{ display:grid; grid-template-columns:repeat(6,1fr); gap:14px; }
.kpi-compare-row{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.chip{ padding:8px 14px; border-radius:100px; background:#fff; border:1px solid var(--border); font-size:12.5px; font-weight:500; }
.chip.active{ background:var(--purple); color:#fff; border-color:var(--purple); }
.chip-row{ display:flex; gap:8px; flex-wrap:wrap; }
.primary-btn-sm{ background:var(--purple); color:#fff; border-radius:10px; padding:9px 16px; font-weight:700; font-size:12.5px; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:background 150ms ease; }
.primary-btn-sm:hover{ background:#5B21B6; }
.primary-btn-sm.wide{ width:100%; }
.primary-btn-sm:disabled{ opacity:0.5; cursor:not-allowed; }
.community-feed{ display:flex; flex-direction:column; gap:14px; max-height:420px; overflow-y:auto; }
.community-msg{ display:flex; gap:10px; align-items:flex-start; }
.community-img{ max-width:220px; border-radius:12px; margin-top:6px; display:block; }
.community-msg-meta{ display:flex; align-items:center; gap:8px; }
.image-preview-row{ display:flex; align-items:center; gap:8px; margin-top:10px; }
.image-preview-thumb{ width:48px; height:48px; border-radius:8px; object-fit:cover; }
.skel-card{ height:78px; border-radius:14px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
.skel-line{ height:14px; border-radius:6px; margin-bottom:12px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
.skel-block{ height:60px; border-radius:12px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
@keyframes shimmer{ from{background-position:200% 0;} to{background-position:-200% 0;} }
.kpi-card{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:16px; }
.kpi-icon{ width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
.kpi-label{ font-size:12px; color:var(--muted); margin-bottom:4px; }
.kpi-value{ font-size:22px; font-weight:800; letter-spacing:-0.01em; }
.kpi-delta{ font-size:11px; font-weight:700; display:flex; align-items:center; gap:3px; margin-top:6px; }
.kpi-delta.up{ color:#16A34A; } .kpi-delta.down{ color:#DC2626; }
.kpi-delta-sub{ color:var(--muted); font-weight:400; }
.kpi-spark{ margin-top:8px; }
.stat-mini{ background:#fff; border:1px solid var(--border); border-radius:14px; padding:14px; }

.row-4col{ display:grid; grid-template-columns:2fr 1.2fr 1.2fr; gap:14px; }
.row-3col{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.row-2col{ display:grid; grid-template-columns:1.4fr 1fr; gap:14px; }

.panel{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:18px 20px; min-width:0; }
.panel-title{ font-weight:700; font-size:14.5px; margin-bottom:12px; }
.panel-title-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.link-btn{ font-size:12px; font-weight:600; color:var(--purple); }
.dropdown-btn{ display:flex; align-items:center; gap:4px; font-size:12px; border:1px solid var(--border); border-radius:8px; padding:5px 10px; }
.rev-big{ font-size:26px; font-weight:800; display:flex; align-items:center; gap:10px; }
.rev-delta{ font-size:11.5px; font-weight:700; color:#16A34A; display:flex; align-items:center; gap:2px; background:#ECFDF5; padding:3px 8px; border-radius:100px; }

.donut-row{ display:flex; align-items:center; gap:16px; }
.donut-wrap{ position:relative; flex-shrink:0; }
.donut-center{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.donut-num{ font-size:17px; font-weight:800; }
.donut-legend{ flex:1; display:flex; flex-direction:column; gap:7px; min-width:0; }
.legend-row{ display:flex; align-items:center; gap:7px; font-size:11.5px; }
.legend-dot{ width:7px; height:7px; border-radius:100px; flex-shrink:0; }
.legend-name{ flex:1; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.legend-val{ color:var(--muted); font-weight:600; white-space:nowrap; }

.health-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.health-tile{ text-align:center; border:1px solid var(--border); border-radius:12px; padding:10px 6px; }
.health-icon{ width:26px; height:26px; border-radius:100px; background:#ECFDF5; color:#16A34A; display:flex; align-items:center; justify-content:center; margin:0 auto 6px; }
.health-val{ font-size:12px; font-weight:700; margin-bottom:2px; }

.activity-list{ display:flex; flex-direction:column; gap:12px; }
.activity-row{ display:flex; align-items:flex-start; gap:10px; }
.activity-icon{ width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ti-mid{ flex:1; min-width:0; }

.list-col{ display:flex; flex-direction:column; gap:10px; }
.pending-row{ display:flex; align-items:center; gap:10px; }
.pending-icon{ width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

.cat-row{ display:flex; flex-direction:column; gap:5px; }
.cat-top{ display:flex; justify-content:space-between; font-size:12.5px; }
.bar-track{ height:6px; background:#F1F5F9; border-radius:100px; overflow:hidden; }
.bar-fill-h{ height:100%; border-radius:100px; }

.quick-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
.quick-btn{ display:flex; flex-direction:column; align-items:center; gap:6px; border:1px solid var(--border); border-radius:12px; padding:12px 6px; font-size:11px; font-weight:600; color:#334155; transition:background 150ms ease; }
.quick-btn:hover{ background:#F8F9FC; }

.admin-table{ width:100%; border-collapse:collapse; }
.admin-table th{ text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:0.04em; color:var(--muted); font-weight:700; padding:8px 10px; border-bottom:1px solid var(--border); }
.admin-table th input[type="checkbox"], .admin-table td input[type="checkbox"]{ width:15px; height:15px; cursor:pointer; }
.bulk-bar{ display:flex; align-items:center; gap:10px; background:var(--purple-light); border:1px solid #DDD6FE; border-radius:12px; padding:10px 14px; margin-bottom:12px; }
.activity-clickable{ width:100%; text-align:left; border-radius:10px; transition:background 120ms ease; cursor:pointer; }
.activity-clickable:hover{ background:#F8F9FC; }
.modal-backdrop{ position:fixed; inset:0; background:rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
.detail-modal{ background:#fff; border-radius:18px; padding:26px; width:380px; max-width:90vw; position:relative; }
.admin-table td{ padding:11px 10px; font-size:13px; border-bottom:1px solid #F1F5F9; vertical-align:middle; }
.admin-table tr:last-child td{ border-bottom:none; }
.row-link{ display:flex; align-items:center; gap:2px; font-size:12px; font-weight:600; color:var(--purple); }
.row-actions{ display:flex; gap:6px; }

.status-pill{ font-size:10px; font-weight:700; padding:4px 9px; border-radius:100px; background:#F1F5F9; color:#475569; white-space:nowrap; text-transform:capitalize; }
.modal-close{ position:absolute; top:14px; right:14px; width:32px; height:32px; border-radius:100px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; }
.chat-thread{ display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto; margin-bottom:10px; }
.chat-bubble{ padding:8px 12px; border-radius:12px; font-size:12.5px; max-width:75%; background:var(--bg); }
.chat-bubble.me{ background:var(--purple); color:#fff; align-self:flex-end; }
.chat-msg-wrap{ display:flex; flex-direction:column; }
.typing-indicator{ display:flex; gap:3px; padding:8px 12px; background:var(--bg); border-radius:12px; width:fit-content; }
.typing-indicator span{ width:6px; height:6px; border-radius:100px; background:var(--muted); animation:typingBounce 1.2s infinite ease-in-out; }
@keyframes typingBounce{ 0%,60%,100%{ transform:translateY(0); opacity:0.5; } 30%{ transform:translateY(-4px); opacity:1; } }
.search-wrap-cu{ flex:1; min-width:220px; display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:9px 14px; }
.sort-select{ border:1px solid var(--border); border-radius:10px; padding:8px 10px; font-size:12.5px; background:#fff; }
.subscribe-toggle-label{ display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--purple); margin:2px 0 8px; }
.status-pill.done{ background:#ECFDF5; color:#16A34A; }
.status-pill.prep{ background:#FFF7ED; color:#B45309; }
.status-pill.route{ background:#EFF6FF; color:#2563EB; }
.status-pill.delay{ background:#FEF2F2; color:#DC2626; }

.round-btn{ width:28px; height:28px; border-radius:100px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border); transition:transform 130ms ease; }
.round-btn:active{ transform:scale(0.88); }
.round-btn.approve{ color:#16A34A; border-color:#BBF7D0; }
.round-btn.deny{ color:#DC2626; border-color:#FECACA; }
.ghost-btn-sm.deny{ color:#DC2626; border-color:#FCA5A5; }
.empty-note{ color:var(--muted); font-size:13px; padding:24px 16px; text-align:center; display:flex; flex-direction:column; align-items:center; }

.flag-row{ display:flex; align-items:center; gap:10px; border:1px solid var(--border); border-radius:12px; padding:11px 14px; }
.toggle-mini{ width:38px; height:22px; border-radius:100px; background:#E2E8F0; padding:2px; display:flex; align-items:center; flex-shrink:0; margin-left:auto; }
.toggle-mini.on{ background:var(--purple); justify-content:flex-end; }
.toggle-mini span{ width:18px; height:18px; border-radius:100px; background:#fff; display:block; }

.feature-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
.feature-card{ border:1px solid var(--border); border-radius:14px; padding:14px; }
.feature-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px; }
.ghost-btn-sm{ font-size:11.5px; font-weight:600; border:1px solid var(--border); border-radius:8px; padding:5px 10px; }
.tab-row{ display:flex; gap:6px; border-bottom:1px solid var(--border); }
.tab-btn{ border:none; background:none; padding:10px 14px; font-weight:600; font-size:13px; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
.tab-btn.active{ color:var(--purple); border-bottom-color:var(--purple); }

/* staff login */
.staff-login-wrap{ width:100%; min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#F1F2F8,#F7F8FB); }
.staff-login-card{ width:400px; max-width:90vw; background:#fff; border:1px solid var(--border); border-radius:20px; padding:32px 30px; box-shadow:0 30px 60px -24px rgba(15,23,42,0.18); }
.role-landing-card{ width:440px; display:flex; flex-direction:column; }
.role-landing-eyebrow{ font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--purple); margin-top:18px; }
.role-landing-headline{ font-size:22px; font-weight:700; margin-top:6px; margin-bottom:8px; line-height:1.3; }
.role-landing-features{ display:flex; flex-direction:column; gap:12px; margin-bottom:22px; }
.role-landing-feature{ display:flex; align-items:flex-start; gap:10px; }
.role-landing-feature-icon{ width:30px; height:30px; border-radius:10px; background:#F3F0FF; color:var(--purple); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.staff-login-title{ font-size:19px; font-weight:800; margin-bottom:2px; }
.login-form{ display:flex; flex-direction:column; gap:14px; }
.field{ display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:600; color:#334155; }
.field input{ border:1.5px solid var(--border); border-radius:12px; padding:11px 14px; font-size:13.5px; outline:none; transition:border-color 150ms ease; }
.field input:focus{ border-color:var(--purple); }
.totp-input{ text-align:center; letter-spacing:8px; font-family:'JetBrains Mono',monospace; font-size:18px; }
.primary-btn{ background:var(--purple); color:#fff; border-radius:12px; padding:12px; font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center; gap:7px; transition:transform 140ms ease, background 200ms ease; }
.primary-btn:hover{ background:#5B21B6; }
.primary-btn:active{ transform:scale(0.97); }
.primary-btn.wide{ width:100%; }
.spinner{ width:16px; height:16px; border-radius:100px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; animation:spin 700ms linear infinite; }

@media (pointer: coarse) {
  .round-btn, .modal-close, .icon-btn, .hamburger-btn{ min-width:44px; min-height:44px; }
  .toggle-mini{ min-height:32px; }
}
@keyframes spin{ to{ transform:rotate(360deg); } }
.login-note{ display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--muted); margin-top:18px; justify-content:center; text-align:center; }

@media (max-width:1000px){
  .sidebar{ position:fixed; top:0; left:0; height:100dvh; z-index:200; transform:translateX(-100%); transition:transform 0.25s ease; box-shadow:0 0 24px rgba(0,0,0,0.15); }
  .sidebar.mobile-open{ transform:translateX(0); }
  .sidebar-scrim{ display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:190; }
  .sidebar-scrim.show{ display:block; }
  .hamburger-btn{ display:flex; }
  .desk-shell{ display:block; }
  .main{ height:auto; min-height:100vh; padding:14px 14px 70px; }
  .row-4col, .row-3col, .row-2col{ grid-template-columns:1fr; }
  .kpi-grid{ grid-template-columns:repeat(2,1fr); }
}
@media (min-width:1001px){ .hamburger-btn{ display:none; } }

@media print {
  body * { visibility: hidden; }
  #shortcuts-printable, #shortcuts-printable * { visibility: visible; }
  #shortcuts-printable { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
  .no-print { display: none !important; }
}
`;
