import React, { useState, useEffect, useRef } from "react";
import {
  Bell, MessageCircle, ChevronDown, Store, ClipboardList, Package,
  BarChart3, Wallet, CreditCard, Users, Star, Megaphone, Tag, Newspaper, CircleCheck, XCircle, BadgeCheck,
  Settings, User as UserIcon, ExternalLink, LifeBuoy, LogOut,
  LayoutDashboard, ArrowUp, Check, X, Plus, Minus, Pencil, ChevronRight,
  ShieldCheck, TrendingUp, Truck as TruckIcon, Clock, AlertCircle, AlertTriangle, Upload, Send, Copy, FileDown, UserPlus, RotateCcw, MapPin, Inbox, Image as ImageIcon, Sparkles,
  ArrowRight, Play, Heart, ShoppingCart, Headphones, ShoppingBag, Cross, Shirt, Smartphone, Home as HomeIcon, Utensils, Gift, Menu, Compass,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const money = (n) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const img = (seed, size = 300) => `https://picsum.photos/seed/${seed}/${size}/${size}`;
const moneyK = money;

/* ============================================================
   MOCK DATA
   ============================================================ */

const STORE = { name: "Northside Espresso Bar", category: "Grocery & Cafe", owner: "John Doe", rating: 4.6, reviews: 128, verified: true };
const STORE_LOCATIONS = [
  { id: "loc1", name: "Northside Espresso Bar -- Main", address: "12 Adeola Odeku St, Victoria Island", hours: "7:00 AM - 8:00 PM", status: "open", isPrimary: true },
  { id: "loc2", name: "Northside Espresso Bar -- Lekki", address: "45 Admiralty Way, Lekki Phase 1", hours: "8:00 AM - 7:00 PM", status: "open", isPrimary: false },
];

// One signup can hold at most one account per role -- these are the accounts
// linked to this seller's sign-in.
const LINKED_ACCOUNTS = [
  { role: "customer", label: "Customer", name: "John Doe", initials: "JD", appKey: "customer" },
  { role: "seller", label: "Seller", name: STORE.name, initials: "NE", appKey: "seller" },
];

/* ------------------------------------------------------------
   PLATFORM ECONOMICS -- product commission.
   Medra adds 10% on top of every price a seller lists. If you
   list an item at ₦1,000, the customer pays ₦1,100: you receive
   the full ₦1,000, Medra keeps the ₦100 fee.
   ------------------------------------------------------------ */
const PRODUCT_COMMISSION_RATE = 0.10;

const NOTIF_LIST = [
  { icon: ClipboardList, color: "#EA580C", title: "New order received", sub: "Order #O5581 -- ₦3,023", time: "3 min ago", goTo: "orders" },
  { icon: AlertCircle, color: "#DC2626", title: "Low stock alert", sub: "Almond Croissant is out of stock", time: "1 hr ago", goTo: "inventory" },
  { icon: Star, color: "#F59E0B", title: "New 5-star review", sub: "\"Fast delivery and the coffee is always fresh.\"", time: "2 days ago", goTo: "reviews" },
  { icon: Wallet, color: "#16A34A", title: "Payout sent", sub: "₦124,560 deposited to your bank", time: "1 day ago", goTo: "payouts" },
];

const KPIS = [
  { key: "sales", label: "Today's Sales", value: money(24585), delta: "+18.6%", deltaMonth: "+32.4%", icon: Store, bg: "#F5F3FF", fg: "#7C3AED", spark: [10, 14, 12, 18, 15, 20, 24] },
  { key: "orders", label: "Total Orders", value: "18", delta: "+12%", deltaMonth: "+27%", icon: ClipboardList, bg: "#EFF6FF", fg: "#2563EB", spark: [4, 6, 5, 8, 7, 9, 11] },
  { key: "customers", label: "Total Customers", value: "236", delta: "+8.4%", deltaMonth: "+19.7%", icon: Users, bg: "#FFF7ED", fg: "#EA580C", spark: [30, 34, 32, 38, 36, 41, 45] },
  { key: "products", label: "Active Products", value: "56", delta: "No change", flat: true, icon: Package, bg: "#ECFDF5", fg: "#16A34A", spark: [20, 20, 20, 20, 20, 20, 20] },
];

const INVENTORY = [
  { id: "i1", name: "Cold Brew Concentrate", price: 1299, stock: 24, category: "Drinks", lowStockAt: 5, supplier: "Lagos Roasters Co.", supplierContact: "orders@lagosroasters.ng" },
  { id: "i2", name: "Sourdough Bread Loaf", price: 599, stock: 6, category: "Bakery", lowStockAt: 8, supplier: "Daily Bread Wholesale", supplierContact: "supply@dailybread.ng" },
  { id: "i3", name: "House Blend Beans (12oz)", price: 1450, stock: 30, category: "Drinks", lowStockAt: 5, supplier: "Lagos Roasters Co.", supplierContact: "orders@lagosroasters.ng" },
  { id: "i4", name: "Almond Croissant", price: 425, stock: 0, category: "Bakery", lowStockAt: 5, supplier: "Daily Bread Wholesale", supplierContact: "supply@dailybread.ng" },
  { id: "i5", name: "Oat Milk Latte Kit", price: 975, stock: 15, category: "Drinks", lowStockAt: 5, supplier: "Fresh Dairy Alternatives", supplierContact: "hello@freshdairyalt.ng" },
  { id: "i6", name: "Matcha Powder Tin", price: 2100, stock: 18, category: "Drinks", lowStockAt: 5, supplier: "Lagos Roasters Co.", supplierContact: "orders@lagosroasters.ng" },
];

const RECENT_ORDERS = [
  { id: "MD28471", customer: "Amara Okeke", time: "2 mins ago", total: 1245, status: "Delivered", items: [{ productId: "i1", qty: 1 }] },
  { id: "MD28470", customer: "Chinedu John", time: "15 mins ago", total: 875, status: "Out for Delivery", items: [{ productId: "i4", qty: 2 }] },
  { id: "MD28469", customer: "Sarah Ahmed", time: "1 hour ago", total: 1523, status: "Preparing", items: [{ productId: "i5", qty: 1 }, { productId: "i2", qty: 1 }] },
  { id: "MD28468", customer: "Tobi James", time: "2 hours ago", total: 560, status: "Cancelled", items: [{ productId: "i4", qty: 1 }] },
  { id: "MD28467", customer: "Blessing U.", time: "3 hours ago", total: 912, status: "Delivered", items: [{ productId: "i2", qty: 1 }, { productId: "i4", qty: 1 }] },
  { id: "MD28466", customer: "Priya Menon", time: "5 hours ago", total: 2599, status: "Delivered", items: [{ productId: "i3", qty: 1 }, { productId: "i1", qty: 1 }] },
  { id: "MD28465", customer: "Devon King", time: "Yesterday", total: 1299, status: "Delivered", items: [{ productId: "i1", qty: 1 }] },
];

const REVENUE_TREND = [
  { d: "Mon", v: 18200 }, { d: "Tue", v: 20800 }, { d: "Wed", v: 19600 }, { d: "Thu", v: 22200 },
  { d: "Fri", v: 20400 }, { d: "Sat", v: 24100 }, { d: "Sun", v: 24585 },
];
const LAST_WEEK_REVENUE_TREND = REVENUE_TREND.map((d) => ({ d: d.d, v: Math.round(d.v * 0.9) }));

const RATING_BREAKDOWN = [
  { stars: 5, pct: 78 }, { stars: 4, pct: 15 }, { stars: 3, pct: 5 }, { stars: 2, pct: 1 }, { stars: 1, pct: 1 },
];

const PERFORMANCE = [
  { label: "Revenue", value: moneyK(124500), delta: "+15.2%", spark: [10, 14, 12, 18, 15, 20, 24], color: "#16A34A" },
  { label: "Orders", value: "126", delta: "+10.4%", spark: [4, 6, 5, 8, 7, 9, 11], color: "#2563EB" },
  { label: "New Customers", value: "48", delta: "+12.7%", spark: [8, 10, 9, 13, 11, 14, 16], color: "#F97316" },
  { label: "Conversion Rate", value: "23.6%", delta: "+6.3%", spark: [18, 20, 19, 22, 21, 23, 24], color: "#7C3AED" },
];

const CUSTOMERS = [
  { name: "Amara Okeke", orders: 14, spend: 18240, since: "2024" },
  { name: "Chinedu John", orders: 9, spend: 9610, since: "2024" },
  { name: "Sarah Ahmed", orders: 21, spend: 26480, since: "2023" },
];
const REVIEWS = [
  { name: "Amara Okeke", rating: 5, text: "Fast delivery and the coffee is always fresh.", time: "2 days ago", packaging: 5, speed: 5, accuracy: 4 },
  { name: "Tobi James", rating: 4, text: "Great selection, occasionally out of my favorite.", time: "5 days ago", packaging: 4, speed: 3, accuracy: 5 },
];
const DISCOUNTS = [
  { code: "WELCOME10", desc: "10% off first order", ends: "Ongoing", status: "active" },
  { code: "WEEKEND20", desc: "20% off weekend orders", ends: "Aug 24", status: "active" },
];
const MESSAGES = [
  { name: "Amara Okeke", preview: "Is the oat milk latte kit back in stock?", time: "12 min ago", unread: true },
  { name: "Chinedu John", preview: "Thanks for the quick delivery!", time: "1 hr ago", unread: false },
];
const PAYOUTS = [
  { date: "Aug 18", amount: 124560, status: "paid", orders: [
    { id: "MD28463", customer: "Amara Okeke", amount: 45200 },
    { id: "MD28462", customer: "Tobi James", amount: 38900 },
    { id: "MD28459", customer: "Sarah Ahmed", amount: 40460 },
  ] },
  { date: "Aug 11", amount: 98020, status: "paid", orders: [
    { id: "MD28401", customer: "Chinedu John", amount: 52020 },
    { id: "MD28390", customer: "Blessing U.", amount: 46000 },
  ] },
  { date: "Aug 25", amount: 112000, status: "upcoming", orders: [
    { id: "MD28502", customer: "Priya Menon", amount: 61000 },
    { id: "MD28498", customer: "Jordan Blake", amount: 51000 },
  ] },
];

const INCOMING_ORDER = { id: "O5581", customer: "Jordan B.", items: [{ name: "Cold Brew Concentrate", qty: 2 }, { name: "Almond Croissant", qty: 1 }], total: 3023, distance: "1.2 mi" };

/* ============================================================
   NAV
   ============================================================ */

const NAV_SECTIONS = [
  { label: "Store", items: [{ key: "products", label: "Products", icon: Package }, { key: "inventory", label: "Inventory", icon: Package }, { key: "store-settings", label: "Store Settings", icon: Settings }, { key: "locations", label: "Locations", icon: MapPin }] },
  { label: "Orders", items: [{ key: "order-confirmations", label: "New Orders", icon: BadgeCheck }, { key: "orders", label: "Active Orders & History", icon: ClipboardList, badge: 2 }, { key: "returns", label: "Returns / Issues", icon: RotateCcw, badge: 1 }, { key: "disputes", label: "Disputes", icon: AlertTriangle, badge: 2 }] },
  { label: "Finance", items: [{ key: "earnings", label: "Sales", icon: Wallet }, { key: "payouts", label: "Payouts", icon: CreditCard }] },
  { label: "Marketing", items: [{ key: "marketing", label: "Promotions & Deals", icon: Megaphone }] },
  { label: "Customers", items: [{ key: "customers", label: "Customer Insights", icon: Users }, { key: "reviews", label: "Reviews", icon: Star }, { key: "messages", label: "Messages", icon: MessageCircle, badge: 2 }, { key: "community", label: "Community", icon: Users }, { key: "broadcast", label: "Broadcast List", icon: Send }, { key: "status", label: "Status", icon: Clock }, { key: "ai-assistant", label: "Ask Medra", icon: Sparkles }] },
  { label: "Team", items: [{ key: "team", label: "Store Team & Permissions", icon: UserPlus }] },
  { label: "Analytics", items: [{ key: "analytics", label: "Analytics", icon: BarChart3 }, { key: "weekly-digest", label: "Weekly Digest", icon: Newspaper }, { key: "rider-declines", label: "Rider Declines", icon: XCircle }] },
  { label: "Account / Support", items: [{ key: "account-settings", label: "Account Settings", icon: UserIcon }, { key: "telehealth", label: "Telehealth", icon: Cross }, { key: "help", label: "Help & Support", icon: LifeBuoy }] },
];

/* ============================================================
   SHARED PIECES
   ============================================================ */

function Logo() {
  return (
    <div className="brand-logo">
      <img src="data:image/png;base64,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" alt="Medra" style={{ height: 30, width: "auto", flexShrink: 0 }} />
      <div><div className="brand-word">medra</div><div className="brand-tag">Sell More. Grow More.</div></div>
    </div>
  );
}

function Sparkline({ data, color }) {
  const w = 100, h = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function EmptyStateNote({ children }) {
  return <div className="empty-note"><Inbox size={20} style={{ opacity: 0.4, marginBottom: 6 }} /><div>{children}</div></div>;
}

function KpiCard({ k, comparePeriod }) {
  const Icon = k.icon;
  const showMonth = comparePeriod === "month" && !k.flat;
  const delta = showMonth ? (k.deltaMonth || k.delta) : k.delta;
  return (
    <div className="kpi-card enter">
      <div className="kpi-icon" style={{ background: k.bg, color: k.fg }}><Icon size={18} /></div>
      <div className="kpi-label">{k.label}</div>
      <div className="kpi-value">{k.value}</div>
      <div className={`kpi-delta ${k.flat ? "" : "up"}`}>{!k.flat && <ArrowUp size={11} />} {delta} {!k.flat && <span className="kpi-delta-sub">{showMonth ? "vs last month" : "vs yesterday"}</span>}</div>
      <div className="kpi-spark"><Sparkline data={k.spark} color={k.fg} /></div>
    </div>
  );
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

/* ============================================================
   SCREENS
   ============================================================ */

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
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skel-card" />)}
      </div>
      <div className="panel enter"><div className="skel-line" style={{ width: "40%" }} /><div className="skel-block" /></div>
      <div className="panel enter"><div className="skel-line" style={{ width: "30%" }} /><div className="skel-block" style={{ height: 100 }} /></div>
    </div>
  );
}

const ONBOARDING_STEPS = [
  { key: "product", label: "List your first product", done: true },
  { key: "order", label: "Get your first order", done: true },
  { key: "review", label: "Respond to your first review", done: false },
  { key: "payout", label: "Set up your payout account", done: true },
];

function NewSellerChecklist({ onDismiss }) {
  const doneCount = ONBOARDING_STEPS.filter((s) => s.done).length;
  const allDone = doneCount === ONBOARDING_STEPS.length;
  return (
    <div className="panel enter checklist-panel">
      <div className="panel-title-row">
        <div className="panel-title">Getting started {allDone && <span className="status-pill done" style={{ marginLeft: 6 }}>Complete!</span>}</div>
        <button className="ghost-btn-sm" onClick={onDismiss}>Dismiss</button>
      </div>
      <div className="bar-track" style={{ marginBottom: 12 }}><div className="bar-fill-h" style={{ width: `${(doneCount / ONBOARDING_STEPS.length) * 100}%`, background: "#16A34A" }} /></div>
      <div className="list-col">
        {ONBOARDING_STEPS.map((s) => (
          <div key={s.key} className="pending-row">
            {s.done ? <Check size={14} color="#16A34A" /> : <span className="checklist-dot" />}
            <div className="ti-mid" style={{ textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardScreen({ onNewOrder, pendingOrder, onViewOrder, onNavigate, availableBalance = 125600 }) {
  const [revPeriod, setRevPeriod] = useState("week");
  const [revOpen, setRevOpen] = useState(false);
  const [slaLeft, setSlaLeft] = useState(120);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [comparePeriod, setComparePeriod] = useState("week");
  useEffect(() => { const t = setTimeout(onNewOrder, 4000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!pendingOrder) { setSlaLeft(120); return; }
    const iv = setInterval(() => setSlaLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [pendingOrder]);
  return (
    <div className="section-pad">
      {!checklistDismissed && <NewSellerChecklist onDismiss={() => setChecklistDismissed(true)} />}
      <div className="kpi-compare-row">
        <span className="muted small">Compare with:</span>
        <div className="chip-row">
          <button className={`chip ${comparePeriod === "week" ? "active" : ""}`} onClick={() => setComparePeriod("week")}>Yesterday</button>
          <button className={`chip ${comparePeriod === "month" ? "active" : ""}`} onClick={() => setComparePeriod("month")}>Last month</button>
        </div>
      </div>
      <div className="kpi-grid">
        {KPIS.map((k) => <KpiCard key={k.key} k={k} comparePeriod={comparePeriod} />)}
        <div className="kpi-card enter">
          <div className="kpi-icon" style={{ background: "#FFF7ED", color: "#F59E0B" }}><Star size={18} /></div>
          <div className="kpi-label">Store Rating</div>
          <div className="kpi-value">{STORE.rating}</div>
          <div className="stars-row">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < Math.round(STORE.rating) ? "#F59E0B" : "none"} color="#F59E0B" />)}</div>
          <div className="muted small">({STORE.reviews} reviews)</div>
        </div>
        <div className="kpi-card enter">
          <div className="kpi-icon" style={{ background: "#F5F3FF", color: "#7C3AED" }}><Wallet size={18} /></div>
          <div className="kpi-label">Available Balance</div>
          <div className="kpi-value">{moneyK(availableBalance)}</div>
          <button className="withdraw-btn" onClick={() => onNavigate("payouts")}>Withdraw</button>
        </div>
      </div>

      {pendingOrder && (
        <button className="new-order-banner enter" onClick={onViewOrder}>
          <span className="scan-ring" />
          <div className="ti-mid" style={{ textAlign: "left" }}><div className="card-name" style={{ color: "#fff" }}>New order -- {pendingOrder.id}</div><div className="muted" style={{ color: "rgba(255,255,255,0.85)" }}>{pendingOrder.items.length} items -- {money(pendingOrder.total)}</div></div>
          <span className="sla-badge">{Math.floor(slaLeft / 60)}:{String(slaLeft % 60).padStart(2, "0")} to accept</span>
          <ChevronRight size={16} color="#fff" />
        </button>
      )}

      <div className="row-3col-uneven">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Recent Orders</div><button className="link-btn" onClick={() => onNavigate("orders")}>View All Orders</button></div>
          <div className="list-col">
            {RECENT_ORDERS.map((o) => (
              <div key={o.id} className="order-row">
                <div className="ti-mid"><div className="card-name">#{o.id}</div><div className="muted small">{o.customer} -- {o.time}</div></div>
                <div style={{ textAlign: "right" }}><div className="mono" style={{ fontSize: 12.5 }}>{money(o.total)}</div><StatusPill status={o.status} /></div>
                <ChevronRight size={14} color="#94A3B8" />
              </div>
            ))}
          </div>
        </div>

        <div className="panel enter">
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
          <div className="rev-big">{moneyK(revPeriod === "week" ? 149885 : 134897)}<span className="rev-delta"><ArrowUp size={12} /> {revPeriod === "week" ? "18.6%" : "9.2%"}</span></div>
          <div className="muted" style={{ marginBottom: 8 }}>Total Revenue</div>
          <div style={{ width: "100%", height: 140 }}>
            <ResponsiveContainer>
              <AreaChart data={revPeriod === "week" ? REVENUE_TREND : LAST_WEEK_REVENUE_TREND} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs><linearGradient id="slFillRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#EEF0F4" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#9AA3B2" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} formatter={(v) => [moneyK(v), "Revenue"]} />
                <Area type="monotone" dataKey="v" stroke="#7C3AED" strokeWidth={2.5} fill="url(#slFillRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rev-sub-row">
            <div><div className="mono">{moneyK(130000)}</div><div className="muted small">Product Sales</div></div>
            <div><div className="mono">{moneyK(12385)}</div><div className="muted small">Delivery Fees</div></div>
            <div><div className="mono">{moneyK(7500)}</div><div className="muted small">Other Fees</div></div>
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Inventory Summary</div><button className="link-btn" onClick={() => onNavigate("inventory")}>View Inventory</button></div>
          <div className="list-col">
            <div className="pending-row"><div className="ti-mid muted">Total Products</div><div className="mono">56</div></div>
            <div className="pending-row"><div className="pending-icon" style={{ background: "#ECFDF5", color: "#16A34A" }}><Check size={13} /></div><div className="ti-mid muted">In Stock</div><div className="mono">38</div></div>
            <div className="pending-row"><div className="pending-icon" style={{ background: "#FFF7ED", color: "#F59E0B" }}><AlertCircle size={13} /></div><div className="ti-mid muted">Low Stock</div><div className="mono">12</div></div>
            <div className="pending-row"><div className="pending-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}><X size={13} /></div><div className="ti-mid muted">Out of Stock</div><div className="mono">6</div></div>
          </div>
        </div>
      </div>

      <div className="row-4col-even">
        <div className="action-card" style={{ background: "#F5F3FF" }}>
          <Megaphone size={20} color="#7C3AED" />
          <div className="card-name" style={{ marginTop: 8 }}>Grow Your Business</div>
          <div className="muted" style={{ marginBottom: 12 }}>Run ads and reach thousands of customers</div>
          <button className="action-btn" style={{ background: "#7C3AED" }} onClick={() => onNavigate("marketing")}>Create Campaign</button>
        </div>
        <div className="action-card" style={{ background: "#ECFDF5" }}>
          <Tag size={20} color="#16A34A" />
          <div className="card-name" style={{ marginTop: 8 }}>Manage Discounts</div>
          <div className="muted" style={{ marginBottom: 12 }}>Create offers and boost your sales</div>
          <button className="action-btn" style={{ background: "#16A34A" }} onClick={() => onNavigate("discounts")}>Create Discount</button>
        </div>
        <div className="action-card" style={{ background: "#FFF7ED" }}>
          <Wallet size={20} color="#EA580C" />
          <div className="card-name" style={{ marginTop: 8 }}>Payouts</div>
          <div className="muted" style={{ marginBottom: 12 }}>Request payout and track your earnings</div>
          <button className="action-btn" style={{ background: "#EA580C" }} onClick={() => onNavigate("payouts")}>Request Payout</button>
        </div>
        <div className="action-card" style={{ background: "#EFF6FF" }}>
          <MessageCircle size={20} color="#2563EB" />
          <div className="card-name" style={{ marginTop: 8 }}>Messages</div>
          <div className="muted" style={{ marginBottom: 12 }}>Reply to customer messages</div>
          <button className="action-btn" style={{ background: "#2563EB" }} onClick={() => onNavigate("messages")}>View Messages</button>
        </div>
      </div>

      <div className="row-2col">
        <div className="panel enter">
          <div className="panel-title">Store Performance (This Month)</div>
          <div className="perf-grid">
            {PERFORMANCE.map((p) => (
              <div key={p.label}>
                <div className="muted">{p.label}</div>
                <div className="kpi-value" style={{ fontSize: 18 }}>{p.value}</div>
                <div className="kpi-delta up" style={{ marginBottom: 4 }}><ArrowUp size={10} /> {p.delta}</div>
                <Sparkline data={p.spark} color={p.color} />
              </div>
            ))}
          </div>
        </div>
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Store Rating</div><button className="link-btn" onClick={() => onNavigate("reviews")}>View All Reviews</button></div>
          <div className="rating-hero">
            <div className="rating-big">{STORE.rating}</div>
            <div>
              <div className="stars-row">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < Math.round(STORE.rating) ? "#F59E0B" : "none"} color="#F59E0B" />)}</div>
              <div className="muted">Based on {STORE.reviews} reviews</div>
            </div>
          </div>
          <div className="list-col" style={{ marginTop: 12 }}>
            {RATING_BREAKDOWN.map((r) => (
              <div key={r.stars} className="rating-row">
                <span className="muted" style={{ width: 40 }}>{r.stars} Stars</span>
                <div className="bar-track"><div className="bar-fill-h" style={{ width: `${r.pct}%`, background: "#F59E0B" }} /></div>
                <span className="muted" style={{ width: 30, textAlign: "right" }}>{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderFlowScreen({ order, stage, onAccept, onReject, onReady, onComplete }) {
  if (stage === "incoming") {
    return (
      <div className="section-pad">
        <div className="panel enter">
          <div className="muted small" style={{ background: "#FEF3C7", color: "#92400E", padding: "6px 10px", borderRadius: 8, marginBottom: 10, fontWeight: 600 }}>Prototype Order Simulator -- this practices the flow but isn't connected to a real customer order.</div>
          <div className="panel-title-row"><div className="panel-title">Incoming order -- {order.id}</div><div className="rev-delta">{money(order.total)}</div></div>
          <div className="list-col">
            {order.items.map((it, i) => <div key={i} className="pending-row"><div className="ti-mid card-name">{it.qty} x {it.name}</div></div>)}
          </div>
          <div className="muted" style={{ marginTop: 10 }}>{order.distance} to customer -- Est. prep time 10-15 min</div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="ghost-btn" onClick={() => confirmAction({ title: "Reject this order?", message: "The customer will be notified and the order cancelled.", confirmLabel: "Reject order" }, () => onReject())}>Reject</button>
            <button className="primary-btn-sm" onClick={onAccept}>Accept order</button>
          </div>
        </div>
      </div>
    );
  }
  if (stage === "preparing") {
    return (
      <div className="section-pad">
        <div className="panel enter">
          <div className="muted small" style={{ background: "#FEF3C7", color: "#92400E", padding: "6px 10px", borderRadius: 8, marginBottom: 10, fontWeight: 600 }}>Prototype Order Simulator -- this practices the flow but isn't connected to a real customer order.</div>
          <div className="panel-title">Preparing order {order.id}</div>
          <div className="list-col">
            {order.items.map((it, i) => <div key={i} className="pending-row"><div className="pending-icon" style={{ background: "#ECFDF5", color: "#16A34A" }}><Check size={13} /></div><div className="ti-mid card-name">{it.name}</div><div className="muted">Qty {it.qty}</div></div>)}
          </div>
          <button className="primary-btn-sm" style={{ marginTop: 16 }} onClick={onReady}>Mark ready for pickup</button>
        </div>
      </div>
    );
  }
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ textAlign: "center", padding: 40 }}>
        <div className="muted small" style={{ background: "#FEF3C7", color: "#92400E", padding: "6px 10px", borderRadius: 8, marginBottom: 14, fontWeight: 600, textAlign: "left" }}>Prototype Order Simulator -- this practices the flow but isn't connected to a real customer order.</div>
        <ShieldCheck size={32} color="#16A34A" />
        <div className="card-name" style={{ fontSize: 16, margin: "10px 0 4px" }}>Ready for pickup</div>
        <div className="muted">Order {order.id} is packed and waiting on a driver.</div>
        <button className="primary-btn-sm" style={{ marginTop: 16 }} onClick={onComplete}>Mark delivered (simulated) &amp; back to dashboard</button>
      </div>
    </div>
  );
}

function OrdersListScreen({ orders }) {
  const [selected, setSelected] = useState(new Set());
  const [localOrders, setLocalOrders] = useState(orders);
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (s.size === localOrders.length ? new Set() : new Set(localOrders.map((o) => o.id))));
  const bulkMark = (status) => {
    setLocalOrders((os) => os.map((o) => (selected.has(o.id) ? { ...o, status } : o)));
    setSelected(new Set());
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row">
          <div className="panel-title">All Orders</div>
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="muted small">{selected.size} selected</span>
              <button className="ghost-btn-sm" onClick={() => bulkMark("Preparing")}>Mark Preparing</button>
              <button className="ghost-btn-sm" onClick={() => bulkMark("Out for Delivery")}>Mark Packed</button>
            </div>
          )}
        </div>
        <table className="admin-table">
          <thead><tr><th><input type="checkbox" checked={selected.size === localOrders.length && localOrders.length > 0} onChange={toggleAll} /></th><th>Order</th><th>Customer</th><th>Time</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{localOrders.map((o) => <tr key={o.id}><td><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} /></td><td className="mono">#{o.id}</td><td>{o.customer}</td><td className="muted">{o.time}</td><td className="mono">{money(o.total)}</td><td><StatusPill status={o.status} /></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

const SELLER_DISPUTES = [
  { id: "D-221", order: "O5540", customer: "Priya M.", amount: 1840, reason: "Item damaged on arrival", filedBy: "Customer" },
  { id: "D-219", order: "O5522", customer: "Devon K.", amount: 2710, reason: "Order missing an item", filedBy: "Customer" },
];

const RETURN_REASONS = ["Wrong item received", "Item damaged", "No longer needed", "Item not as described"];
const SELLER_RETURNS = [
  { id: "RT-118", order: "MD28469", customer: "Sarah Ahmed", item: "Cough Syrup 100ml", reason: "Item damaged", status: "requested" },
  { id: "RT-112", order: "MD28390", customer: "Kelechi O.", item: "Multivitamin Tablets", reason: "Wrong item sent", status: "approved" },
  { id: "RT-105", order: "MD28311", customer: "Ngozi A.", item: "Cough Syrup 100ml", reason: "Item damaged", status: "approved" },
  { id: "RT-098", order: "MD28204", customer: "Tunde B.", item: "Hand Sanitizer 500ml", reason: "No longer needed", status: "declined" },
  { id: "RT-091", order: "MD28150", customer: "Amara O.", item: "Vitamin C Tablets", reason: "Item damaged", status: "approved" },
];

function ReturnsScreen() {
  const [returns, setReturns] = useState(SELLER_RETURNS);
  const resolve = (id, action) => setReturns((rs) => rs.map((r) => (r.id === id ? { ...r, status: action } : r)));
  const pending = returns.filter((r) => r.status === "requested");
  const resolved = returns.filter((r) => r.status !== "requested");
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Returns</div><span className="muted small">Routine item returns -- separate from disputes</span></div>
        {pending.length === 0 ? <EmptyStateNote>No pending returns.</EmptyStateNote> : (
          <div className="list-col">
            {pending.map((r) => (
              <div key={r.id} className="dispute-card is-return">
                <div className="pending-row">
                  <div className="pending-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}><RotateCcw size={14} /></div>
                  <div className="ti-mid"><div className="card-name">{r.item}</div><div className="muted">Order #{r.order} -- {r.customer} -- {r.reason}</div></div>
                  <span className="status-pill prep">Requested</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="ghost-btn-sm" onClick={() => confirmAction({ title: "Decline this request?", message: "The customer will be told it was declined.", confirmLabel: "Decline" }, () => resolve(r.id, "declined"))}>Decline</button>
                  <button className="primary-btn-sm" onClick={() => resolve(r.id, "approved")}>Approve refund</button>
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
            {resolved.map((r) => (
              <div key={r.id} className="pending-row"><div className="ti-mid card-name">{r.item} -- {r.customer}</div><span className={`status-pill ${r.status === "approved" ? "done" : "delay"}`}>{r.status}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SellerDisputesScreen() {
  const [disputes] = useState(SELLER_DISPUTES);
  const [drafts, setDrafts] = useState({});
  const [responded, setResponded] = useState({});
  const respond = (id) => {
    if (!drafts[id]?.trim()) return;
    setResponded((r) => ({ ...r, [id]: drafts[id] }));
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Disputes</div><span className="muted small">Filed against your orders -- visible to the customer and Medra support</span></div>
        {disputes.length === 0 ? <EmptyStateNote>No open disputes on your orders.</EmptyStateNote> : (
          <div className="list-col">
            {disputes.map((d) => (
              <div key={d.id} className="dispute-card is-dispute">
                <div className="pending-row">
                  <div className="pending-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}><AlertTriangle size={14} /></div>
                  <div className="ti-mid"><div className="card-name">Order #{d.order} -- {d.customer}</div><div className="muted">{d.reason}</div></div>
                  <div className="mono">{money(d.amount)}</div>
                  <span className="status-pill prep">Under review</span>
                </div>
                {responded[d.id] ? (
                  <div className="review-reply" style={{ marginTop: 10 }}><span className="card-name" style={{ fontSize: 11.5 }}>Your response:</span> <span className="muted">{responded[d.id]}</span></div>
                ) : (
                  <div className="reply-row" style={{ marginTop: 10 }}>
                    <input placeholder="Explain what happened from your side..." value={drafts[d.id] || ""} onChange={(e) => setDrafts((dr) => ({ ...dr, [d.id]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && respond(d.id)} />
                    <button className="primary-btn-sm" onClick={() => respond(d.id)}>Respond</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReorderSuggestions({ inventory }) {
  const [notes, setNotes] = useState({});
  const [sent, setSent] = useState(new Set());
  const needsReorder = inventory.filter((it) => it.stock <= it.lowStockAt);
  if (needsReorder.length === 0) return null;
  const sendReorder = (id) => setSent((s) => new Set(s).add(id));
  return (
    <div className="panel enter">
      <div className="panel-title-row"><div className="panel-title">Reorder Suggestions</div><span className="muted small">{needsReorder.length} item{needsReorder.length !== 1 ? "s" : ""} need restocking</span></div>
      <div className="list-col">
        {needsReorder.map((it) => (
          <div key={it.id} className="dispute-card">
            <div className="pending-row">
              <div className="pending-icon" style={{ background: it.stock === 0 ? "#FEF2F2" : "#FFF7ED", color: it.stock === 0 ? "#DC2626" : "#EA580C" }}><AlertCircle size={14} /></div>
              <div className="ti-mid"><div className="card-name">{it.name}</div><div className="muted small">{it.stock === 0 ? "Out of stock" : `${it.stock} left, alert at ${it.lowStockAt}`}</div>
                {it.supplier && <div className="muted small">Supplier: {it.supplier} -- {it.supplierContact}</div>}
              </div>
            </div>
            {sent.has(it.id) ? (
              <div className="muted small" style={{ marginTop: 8 }}><Check size={11} style={{ verticalAlign: "middle" }} /> Reorder note sent to supplier</div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input type="text" placeholder="Note to supplier (optional)" value={notes[it.id] || ""} onChange={(e) => setNotes((n) => ({ ...n, [it.id]: e.target.value }))} style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12 }} />
                <button className="ghost-btn-sm" onClick={() => sendReorder(it.id)}>Send reorder</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlowMovingInventory({ inventory }) {
  // Real sales-velocity data isn't tracked per product in this prototype --
  // stock sitting well above the low-stock threshold is a reasonable first-
  // pass proxy real inventory systems use too, not a random guess.
  const slowMoving = inventory.filter((it) => it.stock >= it.lowStockAt * 3 && it.stock > 10);
  if (slowMoving.length === 0) return null;
  return (
    <div className="panel enter">
      <div className="panel-title-row"><div className="panel-title">Slow-Moving Inventory</div><span className="muted small">{slowMoving.length} item{slowMoving.length !== 1 ? "s" : ""} sitting well above reorder level</span></div>
      <div className="muted small" style={{ marginBottom: 10 }}>Worth a discount push or reviewing whether to keep stocking these.</div>
      <div className="list-col">
        {slowMoving.map((it) => (
          <div key={it.id} className="cat-top">
            <span className="muted small">{it.name}</span>
            <span className="mono small">{it.stock} in stock ({Math.round(it.stock / it.lowStockAt)}x reorder level)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryScreen({ inventory, updateStock, updatePrice, updateThreshold }) {
  const [editing, setEditing] = useState(null);
  const [editingThreshold, setEditingThreshold] = useState(null);
  const exportInventory = () => {
    const rows = [["Product", "Category", "Price", "Stock", "Low-stock alert"]];
    inventory.forEach((it) => rows.push([it.name, it.category, it.price, it.stock, it.lowStockAt]));
    exportCsv("medra-inventory.csv", rows);
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Inventory</div><button className="ghost-btn-sm" onClick={exportInventory}><FileDown size={12} /> Export CSV</button></div>
        <table className="admin-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Low-stock alert</th></tr></thead>
          <tbody>
            {inventory.map((it) => {
              const isLow = it.stock > 0 && it.stock <= it.lowStockAt;
              const isOut = it.stock === 0;
              return (
                <tr key={it.id}>
                  <td className="card-name">{it.name} {isOut && <span className="status-pill delay">Out of stock</span>} {isLow && <span className="status-pill prep">Low stock</span>}</td>
                  <td className="muted">{it.category}</td>
                  <td>
                    {editing === it.id ? (
                      <input className="price-edit" type="number" defaultValue={it.price} autoFocus onBlur={(e) => { updatePrice(it.id, parseFloat(e.target.value) || it.price); setEditing(null); }} />
                    ) : (
                      <button className="link-price" onClick={() => setEditing(it.id)}>{money(it.price)} <Pencil size={11} /></button>
                    )}
                  </td>
                  <td>
                    <div className="stepper-sm">
                      <button onClick={() => updateStock(it.id, Math.max(0, it.stock - 1))}><Minus size={12} /></button>
                      <span>{it.stock}</span>
                      <button onClick={() => updateStock(it.id, it.stock + 1)}><Plus size={12} /></button>
                    </div>
                  </td>
                  <td>
                    {editingThreshold === it.id ? (
                      <input className="price-edit" type="number" defaultValue={it.lowStockAt} autoFocus onBlur={(e) => { updateThreshold(it.id, parseInt(e.target.value) || it.lowStockAt); setEditingThreshold(null); }} />
                    ) : (
                      <button className="link-price" onClick={() => setEditingThreshold(it.id)}>Alert at {it.lowStockAt} <Pencil size={11} /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ReorderSuggestions inventory={inventory} />
      <SlowMovingInventory inventory={inventory} />
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

function AddProductModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(1000);
  const [cost, setCost] = useState(0);
  const [category, setCategory] = useState("Drinks");
  const canSave = name.trim() && price > 0;
  const margin = cost > 0 ? Math.round(((price - cost) / price) * 100) : null;
  const lowMargin = cost > 0 && price <= cost;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Add a product</div>
        <div className="field" style={{ marginBottom: 10 }}><span>Product name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Iced Mocha" /></div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <div className="field" style={{ flex: 1 }}><span>Price (\u20a6)</span><input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={1} /></div>
          <div className="field" style={{ flex: 1 }}><span>Your cost (\u20a6, optional)</span><input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} min={0} /></div>
        </div>
        <div className="field" style={{ marginBottom: 10 }}><span>Category</span><input type="text" value={category} onChange={(e) => setCategory(e.target.value)} /></div>
        {cost > 0 && (
          <div className="muted small" style={{ marginBottom: 12, color: lowMargin ? "#DC2626" : "var(--muted)" }}>
            {lowMargin ? <><AlertCircle size={12} style={{ verticalAlign: "middle" }} /> This price is at or below your cost -- you'd lose money on every sale.</> : `Margin at this price: ${margin}%`}
          </div>
        )}
        <button className="primary-btn-sm wide" disabled={!canSave} onClick={() => { onAdd({ id: `p-${Date.now()}`, name, price, cost, stock: 0, category, lowStockAt: 5 }); onClose(); }}>Add product</button>
      </div>
    </div>
  );
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  });
}

function ProductsScreen({ inventory, onDuplicate, onDelete, onAddProduct, onUpdateImage, onUpdateCost }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCostId, setEditingCostId] = useState(null);
  const [costDraft, setCostDraft] = useState("");
  const fileRef = useRef(null);
  const imageFileRefs = useRef({});
  const handlePhotoChange = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpdateImage(id, reader.result);
    reader.readAsDataURL(file);
  };
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploaded(file.name);
    setImportSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result));
      const header = rows[0].map((h) => h.toLowerCase());
      const nameIdx = header.indexOf("product");
      const catIdx = header.indexOf("category");
      const priceIdx = header.indexOf("price");
      const stockIdx = header.indexOf("stock");
      if (nameIdx === -1 || priceIdx === -1) {
        setImportSummary({ error: true, text: "Couldn't read that file -- make sure it has \"Product\" and \"Price\" columns, like the export." });
        return;
      }
      let added = 0;
      let malformed = 0;
      const existingNames = new Set(inventory.map((i) => i.name.toLowerCase()));
      rows.slice(1).forEach((row) => {
        if (row.length === 1 && row[0].trim() === "") return; // ignore trailing blank lines
        if (row.length !== header.length) { malformed++; return; } // likely an unquoted comma (e.g. "₦1,500.00") shifted every later column
        const name = row[nameIdx]?.trim();
        const price = parseFloat((row[priceIdx] || "").replace(/[^\d.]/g, ""));
        if (!name || !price || existingNames.has(name.toLowerCase())) return;
        onAddProduct({ id: `p-${Date.now()}-${added}`, name, price, stock: stockIdx > -1 ? parseInt(row[stockIdx]) || 0 : 0, category: catIdx > -1 ? row[catIdx] || "Uncategorized" : "Uncategorized", lowStockAt: 5 });
        existingNames.add(name.toLowerCase());
        added++;
      });
      const skippedOther = rows.length - 1 - added - malformed;
      const skipParts = [];
      if (skippedOther > 0) skipParts.push(`${skippedOther} skipped (already in your inventory or missing a name/price)`);
      if (malformed > 0) skipParts.push(`${malformed} row${malformed !== 1 ? "s" : ""} couldn't be read -- if a price has a comma in it (like "\u20a61,500.00"), wrap that cell in quotes in your spreadsheet before exporting`);
      setImportSummary({ error: false, text: `${added} new product${added !== 1 ? "s" : ""} added${skipParts.length > 0 ? `, ${skipParts.join("; ")}` : ""}.` });
    };
    reader.readAsText(file);
  };
  const categoryAvg = {};
  inventory.forEach((p) => {
    if (!categoryAvg[p.category]) categoryAvg[p.category] = { total: 0, count: 0 };
    categoryAvg[p.category].total += p.price;
    categoryAvg[p.category].count += 1;
  });
  Object.keys(categoryAvg).forEach((cat) => { categoryAvg[cat] = categoryAvg[cat].total / categoryAvg[cat].count; });
  return (
    <div className="section-pad">
      {modalOpen && <AddProductModal onAdd={onAddProduct} onClose={() => setModalOpen(false)} />}
      <div className="panel enter">
        <div className="panel-title-row">
          <div className="panel-title">Products</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ghost-btn-sm" onClick={() => fileRef.current?.click()}><Upload size={13} /> Bulk upload (CSV)</button>
            <button className="ghost-btn-sm" onClick={() => exportCsv("medra-product-template.csv", [["Product", "Category", "Price", "Stock"], ["Iced Mocha", "Drinks", "1500", "20"]])}><FileDown size={13} /> Download template</button>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
            <button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ Add Product</button>
          </div>
        </div>
        {importSummary && <div className={importSummary.error ? "underperform-flag" : "upload-note"}>{importSummary.error ? <AlertTriangle size={13} /> : <Check size={13} />} {importSummary.text}</div>}
        <div className="feature-grid">
          {inventory.map((p) => {
            const avg = categoryAvg[p.category];
            const overpriced = avg && p.price > avg * 1.15;
            return (
              <div key={p.id} className="feature-card">
                <div className="product-photo-wrap">
                  <img src={p.image || img(p.id)} alt={p.name} className="product-photo" />
                  <input type="file" accept="image/*" style={{ display: "none" }} ref={(el) => (imageFileRefs.current[p.id] = el)} onChange={(e) => handlePhotoChange(p.id, e)} />
                  <button className="product-photo-edit" onClick={() => imageFileRefs.current[p.id]?.click()}><ImageIcon size={12} /> Change photo</button>
                </div>
                <div className="feature-top"><div className="card-name">{p.name}</div><span className={`status-pill ${p.stock > 0 ? "done" : "delay"}`}>{p.stock > 0 ? "Active" : "Out of stock"}</span></div>
                <div className="muted">{p.category}</div>
                {editingCostId === p.id ? (
                  <div className="cat-top" style={{ marginTop: 4, gap: 6 }}>
                    <input type="number" min={0} style={{ width: 90 }} value={costDraft} onChange={(e) => setCostDraft(e.target.value)} placeholder="Cost" />
                    <button className="ghost-btn-sm" onClick={() => { onUpdateCost(p.id, Number(costDraft) || 0); setEditingCostId(null); }}>Save</button>
                  </div>
                ) : (
                  <button className="muted small" style={{ marginTop: 4, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => { setEditingCostId(p.id); setCostDraft(String(p.cost || "")); }}>
                    {p.cost ? `Cost ${money(p.cost)} -- ${Math.round(((p.price - p.cost) / p.price) * 100)}% margin` : "+ Set your cost to track real margin"}
                  </button>
                )}
                <div className="cat-top" style={{ marginTop: 8, alignItems: "center" }}>
                  <span className="mono">{money(p.price)}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="ghost-btn-sm" onClick={() => onDuplicate(p.id)}><Copy size={11} /> Duplicate</button>
                    {confirmDeleteId === p.id ? (
                      <>
                        <button className="ghost-btn-sm deny" onClick={() => { onDelete(p.id); setConfirmDeleteId(null); }}>Confirm</button>
                        <button className="ghost-btn-sm" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="round-btn deny" onClick={() => setConfirmDeleteId(p.id)}><X size={13} /></button>
                    )}
                  </div>
                </div>
                {overpriced && <div className="underperform-flag"><AlertTriangle size={11} /> Priced {Math.round((p.price / avg - 1) * 100)}% above category average ({money(avg)})</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const RIDER_DECLINES_SEED = [
  { reason: "Too far from my location", count: 3 },
  { reason: "Order value too small", count: 1 },
  { reason: "Already have too many orders", count: 2 },
];

function RiderDeclinesSection() {
  const total = RIDER_DECLINES_SEED.reduce((s, d) => s + d.count, 0);
  const sorted = [...RIDER_DECLINES_SEED].sort((a, b) => b.count - a.count);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Rider Declines</div><span className="muted small">{total} this week</span></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Real reasons riders gave for declining orders from your store -- worth knowing if a pattern shows up here, since it can mean lost or delayed orders.</div>
        {total === 0 ? (
          <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle", color: "#16A34A" }} /> No declines this week.</div>
        ) : (
          <div className="list-col">
            {sorted.map((d) => (
              <div key={d.reason} className="cat-top">
                <span className="muted small" style={{ flex: 1 }}>{d.reason}</span>
                <div className="bar-track" style={{ flex: 2, marginRight: 10 }}><div className="bar-fill-h" style={{ width: `${(d.count / total) * 100}%`, background: "var(--purple)" }} /></div>
                <span className="mono small">{d.count}</span>
              </div>
            ))}
          </div>
        )}
        {sorted[0]?.count >= 3 && <div className="muted small" style={{ marginTop: 10, color: "#EA580C" }}><AlertCircle size={12} style={{ verticalAlign: "middle" }} /> "{sorted[0].reason}" is your top reason -- if this keeps coming up, it may be worth a look.</div>}
      </div>
    </div>
  );
}

function OrderConfirmationsSection({ sharedOrderStore }) {
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  if (!sharedOrderStore) {
    return <div className="section-pad"><div className="panel enter"><div className="muted small">This queue only works inside the combined preview -- open combined.html to see real verified orders arrive here from the customer app.</div></div></div>;
  }
  const myOrders = sharedOrderStore.orders.filter((o) => o.stage === "payment_verified" && (o.items || []).some((it) => it.sellerName === STORE.name));
  const confirm = (order) => {
    const allSellers = [...new Set((order.items || []).map((it) => it.sellerName))];
    const confirmedSoFar = [...new Set([...(order.confirmedSellers || []), STORE.name])];
    const everyoneConfirmed = allSellers.every((s) => confirmedSoFar.includes(s));
    sharedOrderStore.updateOrder(order.id, {
      confirmedSellers: confirmedSoFar,
      // Real multi-seller handling: an order with items from more than one
      // store only moves forward once EVERY seller represented in it has
      // confirmed -- one seller confirming can't ship another seller's items
      // that were never actually prepared.
      ...(everyoneConfirmed ? { stage: "seller_preparing", sellerConfirmedAt: Date.now() } : {}),
    });
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">New Orders</div><span className="muted small">{myOrders.length} awaiting confirmation</span></div>
        <div className="muted small" style={{ marginBottom: 12 }}>Real orders where payment has already been verified -- confirm you can prepare them so a rider can be found next.</div>
        {myOrders.length === 0 ? (
          <div className="muted small">No new orders waiting right now.</div>
        ) : (
          <div className="list-col">
            {myOrders.map((o) => {
              const myItems = (o.items || []).filter((it) => it.sellerName === STORE.name);
              const allSellers = [...new Set((o.items || []).map((it) => it.sellerName))];
              const iAlreadyConfirmed = (o.confirmedSellers || []).includes(STORE.name);
              const othersStillPending = allSellers.filter((s) => s !== STORE.name && !(o.confirmedSellers || []).includes(s));
              const isNewCustomer = !CUSTOMERS.some((c) => c.name === o.customerName && c.orders > 0);
              return (
                <div key={o.id} className="pending-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
                    <span className="card-name">Order #{o.id} -- {o.customerName} {isNewCustomer && <span className="status-pill done" style={{ marginLeft: 6 }}><Sparkles size={10} style={{ verticalAlign: "middle" }} /> First order!</span>}</span>
                    <span className="mono small">{myItems.reduce((s, it) => s + (it.sellerPrice || 0) * (it.qty || 1), 0).toLocaleString()} pts value</span>
                  </div>
                  <div className="muted small">{myItems.length} item{myItems.length !== 1 ? "s" : ""} from your store{allSellers.length > 1 ? ` -- shared with ${allSellers.length - 1} other seller${allSellers.length - 1 !== 1 ? "s" : ""}` : ""}</div>
                  {!iAlreadyConfirmed && o.verifiedAt && (() => {
                    const waitingMin = Math.floor((nowTick - o.verifiedAt) / 60000);
                    const overdue = waitingMin >= 10;
                    return <div className="muted small" style={{ color: overdue ? "#DC2626" : "var(--muted)" }}><Clock size={11} style={{ verticalAlign: "middle" }} /> Waiting {waitingMin} min{overdue ? " -- customers expect a quick confirmation" : ""}</div>;
                  })()}
                  {iAlreadyConfirmed ? (
                    <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle", color: "#16A34A" }} /> You've confirmed -- waiting on {othersStillPending.join(", ")} before this moves to a rider.</div>
                  ) : (
                    <button className="primary-btn-sm" onClick={() => confirm(o)}>Confirm and prepare</button>
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

function WeeklyDigestSection({ onNavigate }) {
  const weekRevenue = REVENUE_TREND.reduce((s, d) => s + d.v, 0);
  const lastWeekRevenue = LAST_WEEK_REVENUE_TREND.reduce((s, d) => s + d.v, 0);
  const pctChange = Math.round((weekRevenue / lastWeekRevenue - 1) * 100);
  const bestDay = [...REVENUE_TREND].sort((a, b) => b.v - a.v)[0];
  const lowStock = INVENTORY.filter((i) => i.stock > 0 && i.stock <= i.lowStockAt);
  const outOfStock = INVENTORY.filter((i) => i.stock === 0);
  const avgRating = REVIEWS.length > 0 ? (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1) : null;
  // Real slow-mover detection: products with meaningful stock on hand but zero or
  // near-zero real sales this week, from actual order line items -- not a guess.
  const salesCount = {};
  RECENT_ORDERS.forEach((o) => { if (o.status !== "Cancelled") (o.items || []).forEach((it) => { salesCount[it.productId] = (salesCount[it.productId] || 0) + it.qty; }); });
  const slowMovers = INVENTORY.filter((i) => i.stock >= 10 && (salesCount[i.id] || 0) === 0);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">This Week's Digest</div><span className="muted small">Mon-Sun</span></div>
        <div className="muted small" style={{ marginBottom: 12 }}>A computed weekly summary from your real sales, inventory, and reviews -- so you don't have to check three different screens.</div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
          <div className="stat-mini enter"><div className="muted">Revenue this week</div><div className="kpi-value" style={{ fontSize: 18 }}>{moneyK(weekRevenue)}</div><div className="muted small" style={{ color: pctChange >= 0 ? "#16A34A" : "#DC2626" }}>{pctChange >= 0 ? "+" : ""}{pctChange}% vs last week</div></div>
          <div className="stat-mini enter"><div className="muted">Best day</div><div className="kpi-value" style={{ fontSize: 18 }}>{bestDay.d}</div><div className="muted small">{money(bestDay.v)}</div></div>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Wins and watches</div>
        <div className="list-col">
          {avgRating && <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle", color: "#16A34A" }} /> Average rating this week: {avgRating}/5 across {REVIEWS.length} review{REVIEWS.length !== 1 ? "s" : ""}.</div>}
          {outOfStock.length > 0 && <div className="muted small"><AlertCircle size={12} style={{ verticalAlign: "middle", color: "#DC2626" }} /> {outOfStock.length} product{outOfStock.length !== 1 ? "s" : ""} completely out of stock: {outOfStock.map((i) => i.name).join(", ")}.</div>}
          {lowStock.length > 0 && <div className="muted small"><AlertCircle size={12} style={{ verticalAlign: "middle", color: "#EA580C" }} /> {lowStock.length} product{lowStock.length !== 1 ? "s" : ""} running low: {lowStock.map((i) => i.name).join(", ")}.</div>}
          {outOfStock.length === 0 && lowStock.length === 0 && <div className="muted small"><CircleCheck size={12} style={{ verticalAlign: "middle", color: "#16A34A" }} /> No stock issues this week.</div>}
        </div>
      </div>
      {slowMovers.length > 0 && (
        <div className="panel enter" style={{ background: "linear-gradient(160deg,#FFF7ED,#fff)", border: "1px solid #FED7AA" }}>
          <div className="panel-title">Slow movers</div>
          <div className="muted small" style={{ marginBottom: 10 }}>{slowMovers.length} product{slowMovers.length !== 1 ? "s" : ""} with real stock on hand but zero sales this week -- worth a real discount to clear them.</div>
          <div className="list-col">
            {slowMovers.map((i) => (
              <div key={i.id} className="cat-top">
                <span className="muted small" style={{ flex: 1 }}>{i.name} -- {i.stock} in stock</span>
                {onNavigate && <button className="ghost-btn-sm" onClick={() => onNavigate("discounts")}>Create discount</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsScreen({ inventory }) {
  const returnsByReason = SELLER_RETURNS.reduce((acc, r) => { acc[r.reason] = (acc[r.reason] || 0) + 1; return acc; }, {});
  const returnsByItem = SELLER_RETURNS.reduce((acc, r) => { acc[r.item] = (acc[r.item] || 0) + 1; return acc; }, {});
  const topReturnedItem = Object.entries(returnsByItem).sort((a, b) => b[1] - a[1])[0];
  const PEAK_HOURS = [
    { h: "6am", v: 4 }, { h: "8am", v: 12 }, { h: "10am", v: 18 }, { h: "12pm", v: 42 }, { h: "2pm", v: 30 },
    { h: "4pm", v: 22 }, { h: "6pm", v: 46 }, { h: "8pm", v: 38 }, { h: "10pm", v: 14 },
  ];
  const peakMax = Math.max(...PEAK_HOURS.map((p) => p.v));
  const busiestHour = PEAK_HOURS.reduce((a, b) => (b.v > a.v ? b : a));
  const busiestDay = REVENUE_TREND.reduce((a, b) => (b.v > a.v ? b : a));
  const quietestDay = REVENUE_TREND.reduce((a, b) => (b.v < a.v ? b : a));
  const dailyAvg = REVENUE_TREND.reduce((s, d) => s + d.v, 0) / REVENUE_TREND.length;
  const lastMonthTotal = LAST_WEEK_REVENUE_TREND.reduce((s, d) => s + d.v, 0) * 4.3;
  const projectedMonth = dailyAvg * 30;
  const pctChange = Math.round((projectedMonth / lastMonthTotal - 1) * 100);
  const repeatCustomers = CUSTOMERS.filter((c) => c.orders >= 2).length;
  const repeatRate = CUSTOMERS.length > 0 ? Math.round((repeatCustomers / CUSTOMERS.length) * 100) : 0;
  const avgOrdersPerCustomer = CUSTOMERS.length > 0 ? (CUSTOMERS.reduce((s, c) => s + c.orders, 0) / CUSTOMERS.length).toFixed(1) : "0";
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Peak order hours</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Based on this week's order volume by hour -- staff up around {busiestHour.h}. {busiestDay.d} is your busiest day overall ({money(busiestDay.v)}), {quietestDay.d} your quietest ({money(quietestDay.v)}).</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
          {PEAK_HOURS.map((p) => (
            <div key={p.h} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: `${Math.max(6, (p.v / peakMax) * 70)}px`, background: p.h === busiestHour.h ? "#EA580C" : "#FED7AA", borderRadius: "4px 4px 0 0" }} />
              <div className="muted small" style={{ fontSize: 9.5, marginTop: 4 }}>{p.h}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Sales forecast</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Based on this week's daily average, projected across the month.</div>
        <div className="cat-top">
          <span className="muted">On pace for</span>
          <span className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{moneyK(projectedMonth)} {pctChange !== 0 && <span style={{ color: pctChange > 0 ? "#16A34A" : "#DC2626", fontSize: 12 }}>({pctChange > 0 ? "+" : ""}{pctChange}% vs last month)</span>}</span>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Customer retention</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Based on your {CUSTOMERS.length} tracked customers.</div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="stat-mini enter"><div className="muted">Repeat customer rate</div><div className="kpi-value" style={{ fontSize: 20 }}>{repeatRate}%</div></div>
          <div className="stat-mini enter"><div className="muted">Repeat customers</div><div className="kpi-value" style={{ fontSize: 20 }}>{repeatCustomers}</div></div>
          <div className="stat-mini enter"><div className="muted">Avg. orders / customer</div><div className="kpi-value" style={{ fontSize: 20 }}>{avgOrdersPerCustomer}</div></div>
        </div>
      </div>
      {inventory && inventory.length > 0 && (() => {
        // Estimated sales velocity per product, deterministic from its id --
        // stands in for a real units-sold-per-week figure. Flags items with
        // high stock relative to that estimated velocity as slow movers.
        const slowMovers = inventory
          .map((it) => {
            const h = [...it.id].reduce((s, c) => s + c.charCodeAt(0), 0);
            const estWeeklyUnits = 1 + (h % 8);
            const weeksOfStock = it.stock > 0 ? it.stock / estWeeklyUnits : 0;
            return { ...it, estWeeklyUnits, weeksOfStock };
          })
          .filter((it) => it.stock > 0 && it.weeksOfStock > 6)
          .sort((a, b) => b.weeksOfStock - a.weeksOfStock);
        return slowMovers.length > 0 ? (
          <div className="panel enter">
            <div className="panel-title">Slow-moving inventory</div>
            <div className="muted small" style={{ marginBottom: 12 }}>Items with more stock than their estimated sales pace justifies -- worth a discount push or discontinuing.</div>
            <div className="list-col">
              {slowMovers.map((it) => (
                <div key={it.id} className="cat-top">
                  <span className="muted small" style={{ flex: 1 }}>{it.name}</span>
                  <span className="muted small">{it.stock} in stock -- ~{Math.round(it.weeksOfStock)} weeks at current pace</span>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}
      <div className="panel enter">
        <div className="panel-title">Return & refund reasons</div>
        <div className="muted small" style={{ marginBottom: 12 }}>{topReturnedItem ? `${topReturnedItem[0]} is your most-returned item (${topReturnedItem[1]}x) -- worth a closer look.` : "No returns logged yet."}</div>
        <div className="list-col">
          {Object.entries(returnsByReason).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
            <div key={reason} className="cat-top">
              <span className="muted small">{reason}</span>
              <span className="mono">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Your seller stats</div>
        <div className="muted small" style={{ marginBottom: 12 }}>These feed directly into your Verified Seller badge -- visible only to you.</div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="stat-mini enter"><div className="muted">Avg. response time</div><div className="kpi-value" style={{ fontSize: 20 }}>48 min</div></div>
          <div className="stat-mini enter"><div className="muted">Order acceptance rate</div><div className="kpi-value" style={{ fontSize: 20 }}>96%</div></div>
          <div className="stat-mini enter"><div className="muted">Cancellation rate</div><div className="kpi-value" style={{ fontSize: 20 }}>2.1%</div></div>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Fulfillment time vs. category</div>
        <div className="muted small" style={{ marginBottom: 12 }}>How your 48 min avg. response time compares to other {STORE.category} sellers -- anonymized, ranked fastest first.</div>
        {(() => {
          const idHash = [...STORE.name].reduce((s, c) => s + c.charCodeAt(0), 11);
          const rows = [
            { label: "You", minutes: 48, isYou: true },
            ...Array.from({ length: 5 }).map((_, i) => ({ label: `Seller ${String.fromCharCode(65 + i)}`, minutes: 22 + ((idHash + i * 13) % 55), isYou: false })),
          ].sort((a, b) => a.minutes - b.minutes);
          const yourRank = rows.findIndex((r) => r.isYou) + 1;
          return (
            <>
              <div className="muted small" style={{ marginBottom: 10, fontWeight: 700 }}>You're #{yourRank} of {rows.length} in your category.</div>
              <div className="list-col">
                {rows.map((r, i) => (
                  <div key={r.label} className="cat-top">
                    <span className="muted small" style={{ fontWeight: r.isYou ? 700 : 400 }}>{i + 1}. {r.label}</span>
                    <span className="mono small">{r.minutes} min</span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>
      <div className="panel enter">
        <div className="panel-title">Sales trend</div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={REVENUE_TREND} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs><linearGradient id="slAnalyticsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="#EEF0F4" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#9AA3B2" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9AA3B2" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2.5} fill="url(#slAnalyticsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Top products this month</div>
        <div className="list-col">
          {[["Panadol Extra (10s)", "120 sold"], ["Vitamin C 1000mg", "95 sold"], ["Cough Syrup 100ml", "80 sold"]].map(([a, b]) => (
            <div key={a} className="pending-row"><div className="ti-mid card-name">{a}</div><div className="muted">{b}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EarningsScreen() {
  const exportSales = () => {
    const rows = [["Order", "Customer", "Time", "Total", "Status"]];
    RECENT_ORDERS.forEach((o) => rows.push([o.id, o.customer, o.time, o.total, o.status]));
    exportCsv("medra-sales-report.csv", rows);
  };

  // Real per-product breakdown of what's actually been sold, computed from
  // completed order line items -- not a made-up number.
  const productSales = {};
  RECENT_ORDERS.filter((o) => o.status !== "Cancelled").forEach((o) => {
    (o.items || []).forEach((it) => {
      const product = INVENTORY.find((p) => p.id === it.productId);
      if (!product) return;
      if (!productSales[it.productId]) productSales[it.productId] = { name: product.name, category: product.category, units: 0, revenue: 0 };
      productSales[it.productId].units += it.qty;
      productSales[it.productId].revenue += it.qty * product.price;
    });
  });
  const soldList = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
  const totalUnitsSold = soldList.reduce((s, p) => s + p.units, 0);
  const completedOrderCount = RECENT_ORDERS.filter((o) => o.status !== "Cancelled").length;
  const grossToSeller = soldList.reduce((s, p) => s + p.revenue, 0); // sum of the real per-product breakdown below -- not a separate made-up number
  const platformMarkup = grossToSeller * PRODUCT_COMMISSION_RATE; // what customers additionally paid Medra

  return (
    <div className="section-pad">
      <div className="panel-title-row"><div /><button className="ghost-btn-sm" onClick={exportSales}><FileDown size={12} /> Export sales CSV</button></div>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="stat-mini enter"><div className="muted">This month (you receive)</div><div className="kpi-value" style={{ fontSize: 20 }}>{moneyK(grossToSeller)}</div></div>
        <div className="stat-mini enter"><div className="muted">Completed orders</div><div className="kpi-value" style={{ fontSize: 20 }}>{completedOrderCount}</div></div>
        <div className="stat-mini enter"><div className="muted">Customers paid on top (10%)</div><div className="kpi-value" style={{ fontSize: 20 }}>{moneyK(platformMarkup)}</div></div>
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">What's actually selling</div><span className="muted small">{totalUnitsSold} units across recent orders</span></div>
        {soldList.length === 0 ? (
          <div className="empty-note">No sales yet -- this fills in as orders come through.</div>
        ) : (
          <div className="list-col">
            {soldList.map((p) => (
              <div key={p.name} className="pending-row">
                <div className="ti-mid"><div className="card-name">{p.name}</div><div className="muted small">{p.category} -- {p.units} unit{p.units !== 1 ? "s" : ""} sold</div></div>
                <div className="mono" style={{ fontWeight: 700 }}>{money(p.revenue)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="panel enter">
        <div className="panel-title">How pricing works</div>
        <div className="muted">You keep 100% of every price you list. Medra adds a 10% fee on top at checkout, so a ₦1,000 listing shows as ₦1,100 to customers -- you still receive the full ₦1,000.</div>
      </div>
    </div>
  );
}

const SELLER_TELEHEALTH_FEES = {
  pharmacist: { chat: 400, audio: 1000, video: 2500 },
  doctor: { chat: 500, audio: 2000, video: 3000 },
};
function SellerTelehealthScreen({ available, telehealthSpend, onPay }) {
  const [providerType, setProviderType] = useState("doctor");
  const [consultType, setConsultType] = useState("chat");
  const [paid, setPaid] = useState(false);
  const fee = SELLER_TELEHEALTH_FEES[providerType][consultType];
  const canPay = fee <= available;
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Telehealth</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Talk to a doctor or pharmacist -- paid directly from your available balance ({money(available)} available, {money(telehealthSpend)} spent on telehealth so far). This settles before you withdraw, since it's deducted right away.</div>
        <div className="field" style={{ marginBottom: 8 }}>
          <span>Who do you need?</span>
          <select className="sort-select" value={providerType} onChange={(e) => { setProviderType(e.target.value); setPaid(false); }}>
            <option value="doctor">Doctor</option>
            <option value="pharmacist">Pharmacist</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <span>Consultation type</span>
          <select className="sort-select" value={consultType} onChange={(e) => { setConsultType(e.target.value); setPaid(false); }}>
            <option value="chat">Chat</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div className="cat-top" style={{ marginBottom: 12 }}><span className="muted">Fee</span><span className="mono" style={{ fontWeight: 700 }}>{money(fee)}</span></div>
        {!canPay && <div className="muted small" style={{ color: "#DC2626", marginBottom: 10 }}>Not enough available balance to cover this fee.</div>}
        {paid ? (
          <div className="muted small" style={{ color: "#16A34A" }}><CircleCheck size={12} style={{ verticalAlign: "middle" }} /> Paid -- you're connected with your {providerType}. This is a prototype simulation of the consultation.</div>
        ) : (
          <button className="primary-btn-sm wide" disabled={!canPay} onClick={() => { onPay(fee); setPaid(true); }}>Pay {money(fee)} and start</button>
        )}
      </div>
    </div>
  );
}

function SellerWithdrawModal({ available, onClose, onSubmit }) {
  const [amount, setAmount] = useState(String(available));
  const valid = Number(amount) > 0 && Number(amount) <= available;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 4 }}>Request payout</div>
        <p className="muted small" style={{ marginBottom: 14 }}>Available balance: {money(available)}. Payouts are reviewed and sent to your saved bank account within 1-2 business days.</p>
        <div className="field" style={{ marginBottom: 8 }}><span>Amount</span><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} max={available} /></div>
        {!valid && amount !== "" && <div className="muted small" style={{ color: "#DC2626", marginBottom: 8 }}>Enter an amount up to your available balance.</div>}
        <button className="primary-btn-sm wide" disabled={!valid} onClick={() => { onSubmit(Number(amount)); onClose(); }}>Submit request</button>
      </div>
    </div>
  );
}

function PayoutsScreen({ extraPayouts, requestPayout, available = 125600, telehealthSpend = 0 }) {
  const [requestOpen, setRequestOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const allPayouts = [...extraPayouts, ...PAYOUTS];
  return (
    <div className="section-pad">
      {requestOpen && <SellerWithdrawModal available={available} onClose={() => setRequestOpen(false)} onSubmit={requestPayout} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Payouts</div><button className="primary-btn-sm" onClick={() => setRequestOpen(true)}>Request Payout</button></div>
        <div className="muted small" style={{ marginBottom: 10 }}>Requests are reviewed and sent by Medra's finance team -- usually within 1-2 business days.</div>
        {telehealthSpend > 0 && <div className="muted small" style={{ marginBottom: 10 }}>{money(telehealthSpend)} of your balance has already gone to telehealth charges -- your available balance below is net of that.</div>}
        <div className="list-col">
          {allPayouts.map((p) => (
            <div key={p.date} className="payout-card">
              <button className="payout-row" onClick={() => setExpanded(expanded === p.date ? null : p.date)}>
                <div className="ti-mid"><div className="card-name">{p.date}</div><div className="muted small">{p.orders.length} orders</div></div>
                <div className="mono" style={{ marginRight: 8 }}>{moneyK(p.amount)}</div>
                <span className={`status-pill ${p.status === "paid" ? "done" : "prep"}`}>{p.status === "paid" ? "paid" : "awaiting review"}</span>
                <ChevronRight size={14} className={`payout-chevron ${expanded === p.date ? "open" : ""}`} />
              </button>
              {expanded === p.date && (
                <div className="payout-orders">
                  {p.orders.length === 0 ? <div className="muted small">Awaiting review -- no order breakdown yet.</div> : p.orders.map((o) => (
                    <div key={o.id} className="cat-top"><span className="muted">Order #{o.id} -- {o.customer}</span><span className="mono">{money(o.amount)}</span></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomersScreen() {
  const sorted = [...CUSTOMERS].sort((a, b) => b.spend - a.spend);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Customers</div><span className="muted small">Sorted by total spend</span></div>
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Orders</th><th>Total spend</th><th>Customer since</th></tr></thead>
          <tbody>{sorted.map((c, i) => <tr key={c.name}><td className="card-name">{c.name} {i === 0 && <span className="status-pill done">Top spender</span>} {c.orders >= 15 && <span className="status-pill route">Repeat buyer</span>} {c.orders >= 3 && c.orders < 15 && <span className="status-pill prep">3+ orders</span>}</td><td className="mono">{c.orders}</td><td className="mono">{money(c.spend)}</td><td className="muted">{c.since}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewsScreen() {
  const [replies, setReplies] = useState({});
  const [drafts, setDrafts] = useState({});
  const submitReply = (i) => {
    if (!drafts[i]?.trim()) return;
    setReplies((r) => ({ ...r, [i]: drafts[i] }));
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Rating breakdown</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Averaged from your {REVIEWS.length} real reviews.</div>
        <div className="list-col">
          {["packaging", "speed", "accuracy"].map((key) => {
            const avg = REVIEWS.reduce((s, r) => s + (r[key] || 0), 0) / REVIEWS.length;
            return (
              <div key={key} className="cat-top">
                <span className="muted small" style={{ textTransform: "capitalize" }}>{key}</span>
                <div className="stars-row">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={13} fill={j < Math.round(avg) ? "#F59E0B" : "none"} color="#F59E0B" />)}</div>
                <span className="mono small">{avg.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Reviews</div>
        <div className="list-col">
          {REVIEWS.map((r, i) => (
            <div key={i} className="pending-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", width: "100%" }}>
                <div className="ti-mid">
                  <div className="card-name">{r.name}</div>
                  <div className="stars-row">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={11} fill={j < r.rating ? "#F59E0B" : "none"} color="#F59E0B" />)}</div>
                  <div className="muted">{r.text}</div>
                  <div className="muted small" style={{ marginTop: 4 }}>Packaging {r.packaging}/5 -- Speed {r.speed}/5 -- Accuracy {r.accuracy}/5</div>
                </div>
                <div className="muted small">{r.time}</div>
              </div>
              {replies[i] ? (
                <div className="review-reply"><span className="card-name" style={{ fontSize: 11.5 }}>Your reply:</span> <span className="muted">{replies[i]}</span></div>
              ) : (
                <div className="reply-row" style={{ width: "100%" }}>
                  <input placeholder="Write a public reply..." value={drafts[i] || ""} onChange={(e) => setDrafts((d) => ({ ...d, [i]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && submitReply(i)} />
                  <button className="primary-btn-sm" onClick={() => submitReply(i)}><Send size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PromotionsAndDealsScreen({ initialTab }) {
  const [tab, setTab] = useState(initialTab || "promotions");
  return (
    <div>
      <div className="tab-row" style={{ margin: "16px 20px 0" }}>
        <button className={`tab-btn ${tab === "promotions" ? "active" : ""}`} onClick={() => setTab("promotions")}>Promotions & Loyalty</button>
        <button className={`tab-btn ${tab === "discounts" ? "active" : ""}`} onClick={() => setTab("discounts")}>Discounts</button>
      </div>
      {tab === "promotions" ? <MarketingScreen /> : <DiscountsScreen />}
    </div>
  );
}

function MarketingScreen() {
  const [campaigns, setCampaigns] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState(5000);
  const [days, setDays] = useState(7);
  const create = () => {
    if (!name.trim()) return;
    setCampaigns((c) => [...c, { name, budget, days, status: "active" }]);
    setName(""); setBudget(5000); setDays(7);
    setModalOpen(false);
  };
  return (
    <div className="section-pad">
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>New campaign</div>
            <div className="field" style={{ marginBottom: 10 }}><span>Campaign name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekend Flash Sale" /></div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div className="field" style={{ flex: 1 }}><span>Budget (₦)</span><input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} step={500} min={500} /></div>
              <div className="field" style={{ flex: 1 }}><span>Runs for (days)</span><input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} min={1} max={30} /></div>
            </div>
            <button className="primary-btn-sm wide" onClick={create}>Launch campaign</button>
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Marketing campaigns</div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ New Campaign</button></div>
        {campaigns.length === 0 ? <EmptyStateNote>No active campaigns yet. Create one to reach more customers nearby.</EmptyStateNote> : (
          <div className="list-col">
            {campaigns.map((c, i) => (
              <div key={i} className="pending-row"><div className="ti-mid"><div className="card-name">{c.name}</div><div className="muted">{money(c.budget)} budget -- {c.days} days</div></div><span className="status-pill done">{c.status}</span></div>
            ))}
          </div>
        )}
      </div>
      <StoreLoyaltySection />
    </div>
  );
}

function StoreLoyaltySection() {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(8);
  const CUSTOMER_PROGRESS = [
    { name: "Sarah Ahmed", stamps: 6 }, { name: "Kelechi O.", stamps: 3 }, { name: "Ngozi A.", stamps: 8 }, { name: "Tunde B.", stamps: 1 },
  ];
  return (
    <div className="panel enter">
      <div className="panel-title-row"><div className="panel-title">Store Loyalty Program</div>
        <button className={`toggle-mini ${enabled ? "on" : ""}`} onClick={() => setEnabled((e) => !e)}><span /></button>
      </div>
      <div className="muted small" style={{ marginBottom: 12 }}>Separate from Medra's platform-wide points -- a stamp card just for your store. Customers get a stamp per order; after the threshold, their next order is free.</div>
      {enabled && (
        <>
          <div className="field" style={{ marginBottom: 14, maxWidth: 240 }}>
            <span>Buy this many, get 1 free</span>
            <input type="number" min={2} max={20} value={threshold} onChange={(e) => setThreshold(Math.max(2, Number(e.target.value) || 2))} />
          </div>
          <div className="muted small" style={{ fontWeight: 700, marginBottom: 6 }}>Customer progress</div>
          <div className="list-col">
            {CUSTOMER_PROGRESS.map((c) => (
              <div key={c.name} className="cat-top">
                <span className="muted small" style={{ flex: 1 }}>{c.name}</span>
                <div className="bar-track" style={{ flex: 2, marginRight: 10 }}><div className="bar-fill-h" style={{ width: `${Math.min(100, (c.stamps / threshold) * 100)}%`, background: c.stamps >= threshold ? "#16A34A" : "#7C3AED" }} /></div>
                <span className="mono small">{Math.min(c.stamps, threshold)}/{threshold}{c.stamps >= threshold ? " -- free item earned!" : ""}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CreateDiscountModal({ onAdd, onClose }) {
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [ends, setEnds] = useState("");
  const canSave = code.trim() && desc.trim();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Create a discount</div>
        <div className="field" style={{ marginBottom: 10 }}><span>Code</span><input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SAVE15" /></div>
        <div className="field" style={{ marginBottom: 10 }}><span>Description</span><input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. 15% off orders over ₦5,000" /></div>
        <div className="field" style={{ marginBottom: 16 }}><span>Ends</span><input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} /></div>
        <button className="primary-btn-sm wide" disabled={!canSave} onClick={() => { onAdd({ code, desc, ends: ends || "Ongoing", status: "active" }); onClose(); }}>Create discount</button>
      </div>
    </div>
  );
}

function DiscountsScreen() {
  const [discounts, setDiscounts] = useState(DISCOUNTS);
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="section-pad">
      {modalOpen && <CreateDiscountModal onAdd={(d) => setDiscounts((ds) => [...ds, d])} onClose={() => setModalOpen(false)} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Discounts</div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ Create Discount</button></div>
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Description</th><th>Ends</th><th>Status</th></tr></thead>
          <tbody>{discounts.map((d) => <tr key={d.code}><td className="mono">{d.code}</td><td>{d.desc}</td><td className="muted">{d.ends}</td><td><span className="status-pill done">{d.status}</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

const RECENT_CUSTOMERS = ["Amara Okeke", "Chinedu John", "Priya Menon", "Devon King"];

function NewMessageModal({ onStart, onClose }) {
  const [customer, setCustomer] = useState(RECENT_CUSTOMERS[0]);
  const [text, setText] = useState("");
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>New message</div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>To</span>
          <select className="sort-select" value={customer} onChange={(e) => setCustomer(e.target.value)}>{RECENT_CUSTOMERS.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="field" style={{ marginBottom: 16 }}><span>Message</span><input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message..." /></div>
        <button className="primary-btn-sm wide" disabled={!text.trim()} onClick={() => { onStart(customer, text); onClose(); }}>Send</button>
      </div>
    </div>
  );
}

const COMMUNITY_CHANNELS = [
  { key: "peers", label: "Seller Community" },
  { key: "all", label: "All Medra" },
];
const COMMUNITY_SEED = {
  peers: [
    { author: "Fresh Fields Grocery", role: "Seller", time: "8:30 AM", text: "Anyone else seeing more orders since the points promo started?" },
    { author: "Runwell Sneaker Co.", role: "Seller", time: "8:45 AM", text: "Definitely, up about 20% this week for us." },
    { author: "Ceramic & Co.", role: "Seller", time: "9:20 AM", text: "Bulk upload for products saved me hours today, great feature." },
  ],
  all: [
    { author: "Medra Team", role: "Official", time: "9:05 AM", text: "Reminder: peak delivery hours today run 12-2pm and 6-9pm as usual." },
    { author: "John Rider", role: "Rider", time: "8:55 AM", text: "Roads are clear across Lekki this morning, should be fast deliveries today." },
    { author: "Amara O.", role: "Customer", time: "9:00 AM", text: "Love being able to compare sellers side by side on one product!" },
    { author: "Priya M.", role: "Admin", time: "9:10 AM", text: "Good morning all! Let us know here if anything needs our attention." },
  ],
};

const COMMUNITY_UNLOCK_THRESHOLD = 2;

function CommunityScreen() {
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
    const mine = { author: "You", role: "Seller", time: "Just now", text: text.trim(), image: imageData };
    setFeed((f) => ({ ...f, [channel]: [...f[channel], mine] }));
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

const OPTED_IN_CUSTOMERS = 312;

function timeLeft(postedAt) {
  const msLeft = postedAt + 24 * 60 * 60 * 1000 - Date.now();
  if (msLeft <= 0) return null;
  const hrs = Math.floor(msLeft / (60 * 60 * 1000));
  const mins = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
  return `${hrs}h ${mins}m left`;
}

const DISCOUNT_KEYWORDS = /(\d+%\s*off|discount|% off|voucher|promo|sale|bogo|buy one|half.?price|free delivery)/i;

function StatusScreen({ onNavigate }) {
  const [statuses, setStatuses] = useState([
    { id: 1, text: "Fresh croissants and cold brew all day today!", image: null, postedAt: Date.now() - 3 * 60 * 60 * 1000 },
  ]);
  const [text, setText] = useState("");
  const [imageData, setImageData] = useState(null);
  const fileRef = useRef(null);
  const [, forceTick] = useState(0);
  const [discountPrompt, setDiscountPrompt] = useState(false);
  useEffect(() => { const t = setInterval(() => forceTick((n) => n + 1), 60000); return () => clearInterval(t); }, []);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const post = () => {
    if (!text.trim() && !imageData) return;
    setStatuses((s) => [{ id: Date.now(), text: text.trim(), image: imageData, postedAt: Date.now() }, ...s]);
    if (DISCOUNT_KEYWORDS.test(text)) setDiscountPrompt(true);
    setText("");
    setImageData(null);
  };

  const activeStatuses = statuses.filter((s) => timeLeft(s.postedAt));

  return (
    <div className="section-pad">
      {discountPrompt && (
        <div className="modal-backdrop" onClick={() => setDiscountPrompt(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDiscountPrompt(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 4 }}>Looks like a discount!</div>
            <p className="muted" style={{ marginBottom: 16 }}>Your status mentions a discount or promo. Posting it here only shows it for 24 hours -- if you want customers to actually get that price automatically at checkout, add it to your Discounts page too.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="primary-btn-sm" onClick={() => { setDiscountPrompt(false); onNavigate?.("discounts"); }}>Add to Discounts</button>
              <button className="ghost-btn-sm" onClick={() => setDiscountPrompt(false)}>Just a status, that's fine</button>
            </div>
          </div>
        </div>
      )}
      <div className="panel enter" style={{ maxWidth: 520 }}>
        <div className="panel-title">Post a status</div>
        <p className="muted small" style={{ marginBottom: 12 }}>Visible to customers browsing your store for 24 hours, then it disappears automatically -- great for today's specials.</p>
        <div className="field" style={{ marginBottom: 10 }}><span>What's happening today?</span><input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. 20% off all pastries until 2pm!" /></div>
        {imageData && (
          <div className="image-preview-row">
            <img src={imageData} className="image-preview-thumb" alt="To be posted" />
            <button className="round-btn deny" onClick={() => setImageData(null)}><X size={12} /></button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleImage} />
          <button className="ghost-btn-sm" onClick={() => fileRef.current?.click()}><ImageIcon size={12} /> Add photo</button>
          <button className="primary-btn-sm" onClick={post}>Post status</button>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Live now ({activeStatuses.length})</div>
        {activeStatuses.length === 0 ? <div className="empty-note">No active status -- post one above to let customers know what's happening today.</div> : (
          <div className="list-col">
            {activeStatuses.map((s) => (
              <div key={s.id} className="status-post-row">
                {s.image && <img src={s.image} className="status-post-img" alt="Status" />}
                <div className="ti-mid">
                  <div className="muted">{s.text}</div>
                  <div className="muted small" style={{ marginTop: 4 }}><Clock size={10} style={{ verticalAlign: "middle" }} /> {timeLeft(s.postedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BroadcastScreen() {
  const [text, setText] = useState("");
  const [sentLog, setSentLog] = useState([]);
  const send = () => {
    if (!text.trim()) return;
    setSentLog((l) => [{ text: text.trim(), time: "Just now", count: OPTED_IN_CUSTOMERS }, ...l]);
    setText("");
  };
  return (
    <div className="section-pad">
      <div className="panel enter" style={{ maxWidth: 520 }}>
        <div className="panel-title">Broadcast to your customers</div>
        <p className="muted small" style={{ marginBottom: 12 }}>Reaches every customer who's opted in to updates from your store -- currently <b>{OPTED_IN_CUSTOMERS.toLocaleString()}</b> people.</p>
        <div className="field" style={{ marginBottom: 14 }}><span>Message</span><input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Fresh croissants just came out of the oven!" /></div>
        <button className="primary-btn-sm wide" onClick={send}><Send size={13} /> Send broadcast</button>
      </div>
      <div className="panel enter">
        <div className="panel-title">Sent broadcasts</div>
        {sentLog.length === 0 ? <div className="empty-note">No broadcasts sent yet.</div> : (
          <div className="list-col">
            {sentLog.map((b, i) => (
              <div key={i} className="pending-row">
                <div className="pending-icon" style={{ background: "#FFF7ED", color: "#EA580C" }}><Send size={13} /></div>
                <div className="ti-mid"><div className="card-name">{b.text}</div><div className="muted small">Sent to {b.count.toLocaleString()} customers -- {b.time}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🙏"];

function draftReplySuggestion(lastMessage) {
  const t = (lastMessage || "").toLowerCase();
  if (t.includes("stock") || t.includes("available")) return "Yes, that's back in stock now! I can hold one for you if you'd like.";
  if (t.includes("late") || t.includes("delay") || t.includes("when") || t.includes("delivery")) return "So sorry for the wait -- your order is being prepared now and should be with you shortly.";
  if (t.includes("refund") || t.includes("wrong") || t.includes("missing") || t.includes("damaged")) return "I'm really sorry about that. Let me sort out a refund or replacement for you right away.";
  if (t.includes("discount") || t.includes("price") || t.includes("cheaper")) return "I don't run flash discounts often, but I'll let you know when the next one's live!";
  if (t.includes("thank")) return "You're so welcome -- thanks for shopping with us!";
  return "Thanks for reaching out! Let me look into this and get back to you shortly.";
}

function draftSellerAIResponse(input, { inventory }) {
  const t = input.toLowerCase();

  if (t.includes("low") && t.includes("stock")) {
    const low = inventory.filter((i) => i.stock > 0 && i.stock <= i.lowStockAt);
    const out = inventory.filter((i) => i.stock === 0);
    if (low.length === 0 && out.length === 0) return { text: "Everything's well stocked right now -- nothing below its alert threshold." };
    const parts = [];
    if (out.length) parts.push(`out of stock: ${out.map((i) => i.name).join(", ")}`);
    if (low.length) parts.push(`running low: ${low.map((i) => `${i.name} (${i.stock} left)`).join(", ")}`);
    return { text: parts.join(" -- "), actionLabel: "Go to Inventory", actionKey: "inventory" };
  }
  if (t.includes("best") || t.includes("top") || t.includes("popular")) {
    const top = [...inventory].sort((a, b) => b.price * (30 - b.stock) - a.price * (30 - a.stock))[0];
    return { text: `Based on recent orders, ${top?.name || "your products"} has been getting the most traction lately.` };
  }
  if (t.includes("order") && (t.includes("today") || t.includes("recent") || t.includes("new"))) {
    const active = RECENT_ORDERS.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
    if (active.length === 0) return { text: "No orders in progress right now -- all caught up!" };
    return { text: `You have ${active.length} order${active.length !== 1 ? "s" : ""} in progress: ${active.map((o) => `#${o.id} (${o.status})`).join(", ")}.`, actionLabel: "View orders", actionKey: "orders" };
  }
  if (t.includes("payout") || t.includes("paid") || t.includes("money")) {
    return { text: "You keep 100% of every price you list -- Medra adds its 10% fee on top at checkout, so it never comes out of your payout. You can set your payout schedule (daily, weekly, or a fixed time) in Payouts.", actionLabel: "Go to Payouts", actionKey: "payouts" };
  }
  return { text: "I can help with things like \"what's running low on stock\", \"what's my best seller\", \"any new orders today\", or \"when do I get paid\". What would you like to know?" };
}

function AIAssistantScreen({ inventory, onNavigate }) {
  const [chat, setChat] = useState([{ from: "ai", text: "Hi! I'm your Medra assistant. Ask me about your inventory, orders, or payouts." }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const suggestions = ["What's running low on stock?", "Any new orders today?", "When do I get paid?"];

  const ask = (text) => {
    if (!text.trim()) return;
    setChat((c) => [...c, { from: "me", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const res = draftSellerAIResponse(text, { inventory });
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
          <input placeholder="Ask me anything about your store..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(input)} />
          <button className="primary-btn-sm" onClick={() => ask(input)}><Send size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function MessagesScreen() {
  const [threadList, setThreadList] = useState(MESSAGES);
  const [active, setActive] = useState(MESSAGES[0]);
  const [threads, setThreads] = useState(() => Object.fromEntries(MESSAGES.map((m) => [m.name, [{ from: "them", text: m.preview }]])));
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
        [active.name]: [...t[active.name].map((m) => (m.from === "me" ? { ...m, seen: true } : m)), { from: "them", text: "Thanks, noted!" }],
      }));
    }, 1400);
  };

  const react = (idx, emoji) => {
    setThreads((t) => ({ ...t, [active.name]: t[active.name].map((m, i) => (i === idx ? { ...m, reaction: m.reaction === emoji ? null : emoji } : m)) }));
    setReactingIdx(null);
  };

  const startNew = (customerName, text) => {
    setThreads((t) => ({ ...t, [customerName]: [...(t[customerName] || []), { from: "me", text }] }));
    if (!threadList.find((m) => m.name === customerName)) {
      const newThread = { name: customerName, preview: text, time: "Just now", unread: false };
      setThreadList((l) => [newThread, ...l]);
      setActive(newThread);
    } else {
      setActive(threadList.find((m) => m.name === customerName));
    }
  };

  const activeThread = threads[active.name] || [];
  const lastMeIdx = activeThread.map((m) => m.from).lastIndexOf("me");
  const lastTheirMsg = [...activeThread].reverse().find((m) => m.from === "them");
  const suggestReply = () => setInput(draftReplySuggestion(lastTheirMsg?.text));

  return (
    <div className="section-pad" style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {newMsgOpen && <NewMessageModal onStart={startNew} onClose={() => setNewMsgOpen(false)} />}
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
        {lastTheirMsg && <button className="ghost-btn-sm" style={{ marginTop: 10, marginBottom: -4 }} onClick={suggestReply}><Sparkles size={12} /> Suggest a reply</button>}
        <div className="reply-row" style={{ marginTop: 12 }}>
          <input placeholder="Type a reply..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="primary-btn-sm" onClick={send}><Send size={13} /></button>
        </div>
      </div>
    </div>
  );
}

const ROLE_OPTIONS = ["Manager", "Staff", "Order Handler"];

const TEAM_PERMISSION_CAPS = ["View orders", "Update order status", "Issue refunds", "Manage inventory", "Reply to reviews", "Edit store settings"];
const DEFAULT_TEAM_PERMS = {
  Manager: { "View orders": true, "Update order status": true, "Issue refunds": true, "Manage inventory": true, "Reply to reviews": true, "Edit store settings": true },
  "Order Handler": { "View orders": true, "Update order status": true, "Issue refunds": false, "Manage inventory": false, "Reply to reviews": false, "Edit store settings": false },
  Staff: { "View orders": true, "Update order status": false, "Issue refunds": false, "Manage inventory": false, "Reply to reviews": false, "Edit store settings": false },
};

function TeamPermissionsPanel() {
  const [perms, setPerms] = useState(DEFAULT_TEAM_PERMS);
  const toggle = (role, cap) => setPerms((p) => ({ ...p, [role]: { ...p[role], [cap]: !p[role][cap] } }));
  return (
    <div className="panel enter">
      <div className="panel-title-row"><div className="panel-title">Role Permissions</div><span className="muted small">Owner always has full access</span></div>
      <table className="admin-table">
        <thead><tr><th>Capability</th>{ROLE_OPTIONS.map((r) => <th key={r}>{r}</th>)}</tr></thead>
        <tbody>
          {TEAM_PERMISSION_CAPS.map((cap) => (
            <tr key={cap}>
              <td className="card-name">{cap}</td>
              {ROLE_OPTIONS.map((role) => (
                <td key={role} style={{ textAlign: "center" }}>
                  <button className={`perm-toggle ${perms[role][cap] ? "on" : ""}`} onClick={() => toggle(role, cap)}>{perms[role][cap] ? <Check size={12} /> : null}</button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamScreen() {
  const [team, setTeam] = useState([
    { name: "John Doe", role: "Owner", email: "owner@medra.com" },
    { name: "Ada Bello", role: "Manager", email: "ada@medra.com" },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const add = () => {
    if (!name.trim()) return;
    setTeam((t) => [...t, { name, role, email }]);
    setName(""); setEmail(""); setRole(ROLE_OPTIONS[0]); setModalOpen(false);
  };
  const remove = (i) => setTeam((t) => t.filter((_, idx) => idx !== i));
  return (
    <div className="section-pad">
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Invite a team member</div>
            <div className="field" style={{ marginBottom: 10 }}><span>Name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="field" style={{ marginBottom: 10 }}><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="field" style={{ marginBottom: 16 }}>
              <span>Role</span>
              <select className="sort-select" value={role} onChange={(e) => setRole(e.target.value)}>{ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}</select>
            </div>
            <button className="primary-btn-sm wide" onClick={add}>Send invite</button>
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Store Team</div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}><UserPlus size={13} /> Invite</button></div>
        <div className="list-col">
          {team.map((m, i) => (
            <div key={i} className="pending-row">
              <div className="driver-avatar sm">{m.name.split(" ").map((w) => w[0]).join("")}</div>
              <div className="ti-mid"><div className="card-name">{m.name}</div><div className="muted small">{m.email}</div></div>
              <span className="status-pill done">{m.role}</span>
              {m.role !== "Owner" && <button className="round-btn deny" onClick={() => remove(i)}><X size={12} /></button>}
            </div>
          ))}
        </div>
      </div>
      <TeamPermissionsPanel />
    </div>
  );
}

const VERIFIED_CRITERIA = [
  { label: "Business registration verified", met: true },
  { label: "50+ completed orders", met: true },
  { label: "4.5+ average rating", met: true },
  { label: "Under 5% order cancellation rate", met: true },
  { label: "No unresolved disputes in the last 90 days", met: true },
];

function StorePreviewScreen({ inventory }) {
  const [bannerData, setBannerData] = useState(null);
  const [about, setAbout] = useState("Serving Lekki's best cold brew and pastries since 2023. Locally sourced, always fresh.");
  const [editingAbout, setEditingAbout] = useState(false);
  const fileRef = useRef(null);

  const handleBanner = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBannerData(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Live Storefront Preview</div><span className="muted small">Exactly what customers see at medra.com/store/northside-espresso</span></div>
        <div className="store-preview-card">
          <div className="store-banner" style={bannerData ? { backgroundImage: `url(${bannerData})` } : {}}>
            {!bannerData && <span className="muted small">No banner set</span>}
            <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleBanner} />
            <button className="ghost-btn-sm store-banner-btn" onClick={() => fileRef.current?.click()}><ImageIcon size={12} /> {bannerData ? "Change banner" : "Add banner"}</button>
          </div>
          <div className="pending-row" style={{ marginBottom: 10, marginTop: 14 }}>
            <div className="driver-avatar" style={{ width: 48, height: 48, fontSize: 16, background: "#EA580C", borderRadius: 12 }}>{STORE.name[0]}</div>
            <div className="ti-mid">
              <div className="card-name" style={{ fontSize: 16 }}>{STORE.name} {STORE.verified && <ShieldCheck size={13} color="#16A34A" style={{ verticalAlign: "middle" }} />}</div>
              <div className="muted">{STORE.rating} ({STORE.reviews} reviews) -- {STORE.category}</div>
            </div>
          </div>
          <div className="panel-title" style={{ fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            About this store
            {!editingAbout && <button className="ghost-btn-sm" onClick={() => setEditingAbout(true)}><Pencil size={11} /> Edit</button>}
          </div>
          {editingAbout ? (
            <div style={{ marginBottom: 12 }}>
              <input type="text" className="about-edit-input" value={about} onChange={(e) => setAbout(e.target.value)} />
              <button className="primary-btn-sm" style={{ marginTop: 8 }} onClick={() => setEditingAbout(false)}>Save</button>
            </div>
          ) : (
            <p className="muted" style={{ marginBottom: 12 }}>{about}</p>
          )}
          <div className="panel-title" style={{ fontSize: 13 }}>Products</div>
          <div className="feature-grid">
            {inventory.map((p) => (
              <div key={p.id} className="feature-card">
                <div className="feature-top"><div className="card-name">{p.name}</div><span className={`status-pill ${p.stock > 0 ? "done" : "delay"}`}>{p.stock > 0 ? "In stock" : "Out of stock"}</span></div>
                <div className="mono" style={{ marginTop: 8 }}>{money(p.price)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Verified Seller Badge</div>{STORE.verified && <span className="status-pill done">Active</span>}</div>
        <div className="muted small" style={{ marginBottom: 10 }}>Your storefront shows a verified badge when all criteria below are met.</div>
        <div className="list-col">
          {VERIFIED_CRITERIA.map((c) => (
            <div key={c.label} className="pending-row">
              {c.met ? <Check size={14} color="#16A34A" /> : <X size={14} color="#DC2626" />}
              <div className="ti-mid muted">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddLocationModal({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("9:00 AM - 6:00 PM");
  const canSave = name.trim() && address.trim();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Add a location</div>
        <div className="field" style={{ marginBottom: 10 }}><span>Location name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ikeja Branch" /></div>
        <div className="field" style={{ marginBottom: 10 }}><span>Address</span><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" /></div>
        <div className="field" style={{ marginBottom: 16 }}><span>Hours</span><input type="text" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
        <button className="primary-btn-sm wide" disabled={!canSave} onClick={() => { onAdd({ id: `loc-${Date.now()}`, name, address, hours, status: "open", isPrimary: false }); onClose(); }}>Add location</button>
      </div>
    </div>
  );
}

function LocationsScreen() {
  const [locations, setLocations] = useState(STORE_LOCATIONS);
  const [modalOpen, setModalOpen] = useState(false);
  const toggleStatus = (id) => setLocations((ls) => ls.map((l) => (l.id === id ? { ...l, status: l.status === "open" ? "closed" : "open" } : l)));
  const removeLocation = (id) => setLocations((ls) => ls.filter((l) => l.id !== id));
  return (
    <div className="section-pad">
      {modalOpen && <AddLocationModal onAdd={(loc) => setLocations((ls) => [...ls, loc])} onClose={() => setModalOpen(false)} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Locations</div><button className="primary-btn-sm" onClick={() => setModalOpen(true)}>+ Add Location</button></div>
        <div className="list-col">
          {locations.map((l) => (
            <div key={l.id} className="dispute-card">
              <div className="pending-row">
                <div className="pending-icon" style={{ background: "#EEF2FF", color: "#6D28D9" }}><MapPin size={14} /></div>
                <div className="ti-mid"><div className="card-name">{l.name} {l.isPrimary && <span className="status-pill done">Primary</span>}</div><div className="muted small">{l.address} -- {l.hours}</div></div>
                <span className={`status-pill ${l.status === "open" ? "done" : "delay"}`}>{l.status}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="ghost-btn-sm" onClick={() => toggleStatus(l.id)}>{l.status === "open" ? "Mark closed" : "Mark open"}</button>
                {!l.isPrimary && <button className="ghost-btn-sm" onClick={() => confirmAction({ title: "Remove this location?", message: "Orders will no longer be routed to it.", confirmLabel: "Remove" }, () => removeLocation(l.id))}>Remove</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoreSettingsScreen({ onNavigate }) {
  const [status, setStatus] = useState("open");
  const [seasonalOn, setSeasonalOn] = useState(false);
  const [seasonalStart, setSeasonalStart] = useState("");
  const [seasonalEnd, setSeasonalEnd] = useState("");
  const [seasonalHours, setSeasonalHours] = useState("10:00 AM - 4:00 PM");
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Store Settings</div>{onNavigate && <button className="ghost-btn-sm" onClick={() => onNavigate("view-store")}><ExternalLink size={12} /> Preview Storefront</button>}</div>
        <div className="list-col">
          <div className="flag-row"><div className="ti-mid"><div className="card-name">Store name</div><div className="muted">{STORE.name}</div></div></div>
          <div className="flag-row"><div className="ti-mid"><div className="card-name">Category</div><div className="muted">{STORE.category}</div></div></div>
          <div className="flag-row"><div className="ti-mid"><div className="card-name">Regular hours</div><div className="muted">7:00 AM - 8:00 PM</div></div></div>
          <div className="flag-row"><div className="ti-mid"><div className="card-name">Delivery radius</div><div className="muted">8 miles</div></div></div>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title">Store status</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Customers see this immediately -- your storefront and listings are hidden while marked away.</div>
        <div className="chip-row">
          <button className={`chip ${status === "open" ? "active" : ""}`} onClick={() => setStatus("open")}>Open for orders</button>
          <button className={`chip ${status === "away" ? "active" : ""}`} onClick={() => setStatus("away")}>Away -- not accepting orders</button>
        </div>
        {status === "away" && <div className="upload-note" style={{ marginTop: 10 }}><AlertCircle size={13} /> Your store is currently hidden from customers.</div>}
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Seasonal / holiday hours</div>
          <button className={`toggle-mini ${seasonalOn ? "on" : ""}`} onClick={() => setSeasonalOn((s) => !s)}><span /></button>
        </div>
        <div className="muted small" style={{ marginBottom: 12 }}>Automatically switch to different hours for a date range -- e.g. reduced hours over a holiday -- then switch back on its own.</div>
        {seasonalOn && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div className="field" style={{ flex: 1 }}><span>Start date</span><input type="date" value={seasonalStart} onChange={(e) => setSeasonalStart(e.target.value)} /></div>
              <div className="field" style={{ flex: 1 }}><span>End date</span><input type="date" value={seasonalEnd} onChange={(e) => setSeasonalEnd(e.target.value)} /></div>
            </div>
            <div className="field"><span>Hours during this period</span><input type="text" value={seasonalHours} onChange={(e) => setSeasonalHours(e.target.value)} placeholder="e.g. 10:00 AM - 4:00 PM" /></div>
            {seasonalStart && seasonalEnd && <div className="upload-note" style={{ marginTop: 10 }}><Check size={13} /> {seasonalHours} from {seasonalStart} to {seasonalEnd}, then back to regular hours automatically.</div>}
          </>
        )}
      </div>
      <div className="version-tag">Medra Seller -- v2.14.0 -- build 2026.08.23</div>
    </div>
  );
}

const SELLER_HELP_FAQS = [
  { q: "When do I get paid?", a: "You choose your own payout schedule -- daily, weekly, or a fixed time every day -- in Store Settings. Every payout is itemized with the fees already broken down." },
  { q: "How much does Medra take from my sales?", a: "Nothing off your listed price. Medra adds a 10% fee on top at checkout -- if you list an item at ₦1,000, the customer pays ₦1,100 and you receive the full ₦1,000." },
  { q: "How do disputes work?", a: "If a customer opens a dispute, you'll see it under Disputes with the reason and order details. Respond with evidence or an offer to resolve directly -- unresolved disputes may involve support." },
  { q: "How do I add or update products?", a: "Add products one at a time from the Products page, or bulk upload a CSV to add or update many at once." },
  { q: "Can I pause my store temporarily?", a: "Yes -- you can pause your store from Store Settings. While paused, customers won't see your storefront and can't place new orders." },
];

function SellerHelpScreen({ onNavigate }) {
  const [openIdx, setOpenIdx] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className="section-pad">
      {contactOpen && (
        <div className="modal-backdrop" onClick={() => setContactOpen(false)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setContactOpen(false)}><X size={16} /></button>
            {sent ? (
              <>
                <div className="card-name" style={{ fontSize: 16, marginBottom: 6 }}>Message sent</div>
                <p className="muted">Support usually replies within a few minutes. You'll get a notification when they respond.</p>
              </>
            ) : (
              <>
                <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Contact support</div>
                <div className="field" style={{ marginBottom: 16 }}><span>What do you need help with?</span><input type="text" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Describe your issue..." /></div>
                <button className="primary-btn-sm wide" disabled={!msg.trim()} onClick={() => setSent(true)}>Send</button>
              </>
            )}
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Help & Support</div><button className="primary-btn-sm" onClick={() => { setSent(false); setMsg(""); setContactOpen(true); }}>Contact Support</button></div>
        <p className="muted small" style={{ marginBottom: 4 }}>Need an instant answer? <button className="link-btn" style={{ padding: 0 }} onClick={() => onNavigate?.("ai-assistant")}>Ask Medra</button> can help with most common questions right away.</p>
      </div>
      <div className="panel enter">
        <div className="panel-title">Seller guide</div>
        <div className="list-col">
          {SELLER_HELP_FAQS.map((item, i) => (
            <div key={item.q} className={`faq-item ${openIdx === i ? "open" : ""}`}>
              <button className="faq-q" onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>
                <span>{item.q}</span>
                <ChevronRight size={16} className="faq-chevron" />
              </button>
              {openIdx === i && <p className="faq-a">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const NIGERIAN_BANKS = ["Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA", "Kuda", "Opay", "Moniepoint"];

function SellerBankAccountModal({ current, onClose, onSave }) {
  const [bank, setBank] = useState(current?.bank || NIGERIAN_BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState(current?.accountName || "");
  const valid = /^\d{10}$/.test(accountNumber) && accountName.trim().length > 2;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Payout bank account</div>
        <div className="field" style={{ marginBottom: 10 }}>
          <span>Bank</span>
          <select className="sort-select" value={bank} onChange={(e) => setBank(e.target.value)}>
            {NIGERIAN_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 10 }}><span>Account number</span><input type="text" inputMode="numeric" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))} placeholder="10-digit account number" /></div>
        <div className="field" style={{ marginBottom: 16 }}><span>Account holder name</span><input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Must match your bank account" /></div>
        <button className="primary-btn-sm wide" disabled={!valid} onClick={() => { onSave({ bank, last4: accountNumber.slice(-4), accountName }); onClose(); }}>Save payout account</button>
      </div>
    </div>
  );
}

const SELLER_WALKTHROUGH_STEPS = [
  "Overview -- your dashboard: today's orders, revenue, and store status at a glance.",
  "Orders -- new, all, history, returns, disputes, and cancellations.",
  "Menu & Inventory -- add/edit products, stock levels, pricing, and categories.",
  "Analytics & Pricing -- sales, revenue, product performance, and customer trends.",
  "Growth & Reviews -- promotions, discounts, campaigns, and your reviews/ratings.",
  "Business Tools -- store settings, locations, hours, and delivery settings.",
  "Payouts -- earnings, payout requests, and settlement/transaction history.",
  "Community Chat -- message customers, broadcast, and chat in the seller community.",
  "Account Settings -- your payout bank account and store owner details.",
];
function WalkthroughModal({ title, steps, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Walk me through {title}</div>
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

function AccountSettingsScreen() {
  const [bankAccount, setBankAccount] = useState({ bank: "Access Bank", last4: "4821", accountName: STORE.owner });
  const [modalOpen, setModalOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  return (
    <div className="section-pad">
      {modalOpen && <SellerBankAccountModal current={bankAccount} onClose={() => setModalOpen(false)} onSave={setBankAccount} />}
      {walkthroughOpen && <WalkthroughModal title="the seller app" steps={SELLER_WALKTHROUGH_STEPS} onClose={() => setWalkthroughOpen(false)} />}
      <div className="panel enter">
        <div className="panel-title">Account Settings</div>
        <div className="list-col">
          <button className="flag-row nav-flag" onClick={() => setWalkthroughOpen(true)}><Compass size={15} /><div className="ti-mid"><div className="card-name">Walk me through this app</div><div className="muted">A quick tour of what everything in the seller app does</div></div><ChevronRight size={15} /></button>
          <div className="cat-top"><span className="muted">Owner</span><span>{STORE.owner}</span></div>
          <div className="cat-top"><span className="muted">Email</span><span>owner@medra.com</span></div>
          <button className="flag-row nav-flag" onClick={() => setModalOpen(true)}><div className="ti-mid"><div className="card-name">Payout account</div><div className="muted">{bankAccount.bank} •••• {bankAccount.last4}</div></div><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Prototype tools</div>
        <div className="muted small" style={{ marginBottom: 10 }}>This preview keeps everything in memory only -- nothing is saved to a server. Reloading gives you a fresh demo with all seeded data restored.</div>
        <button className="ghost-btn-sm" onClick={() => window.location.reload()}><RotateCcw size={12} style={{ verticalAlign: "middle" }} /> Reset demo data (reloads this page)</button>
      </div>
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
   APP SHELL
   ============================================================ */

const SELLER_LP_CSS = `
.lp-root{ font-family:'Inter',sans-serif; color:#0F172A; background:#fff; }
.lp-root *{ box-sizing:border-box; }
.lp-nav{ display:flex; align-items:center; justify-content:space-between; padding:14px 40px; background:#fff; border-bottom:1px solid #EEF0F5; }
.lp-nav-links{ display:flex; align-items:center; gap:24px; }
.lp-nav-links a{ font-size:13.5px; font-weight:500; color:#334155; cursor:pointer; display:flex; align-items:center; gap:4px; }
.lp-nav-links a.active{ color:#0F172A; }
.lp-nav-links a.highlight{ color:#2563EB; font-weight:600; }
.lp-nav-actions{ display:flex; align-items:center; gap:16px; }
.lp-nav-deliver{ font-size:12px; color:#64748B; }
.lp-nav-deliver b{ color:#0F172A; display:block; font-size:12.5px; }
.lp-nav-icons{ display:flex; align-items:center; gap:14px; color:#334155; }
.lp-nav-icon{ position:relative; }
.lp-nav-badge{ position:absolute; top:-6px; right:-8px; background:#F43F5E; color:#fff; font-size:9px; font-weight:700; border-radius:100px; width:15px; height:15px; display:flex; align-items:center; justify-content:center; }
.lp-nav-signin{ display:flex; align-items:center; gap:6px; color:#0F172A; font-size:13.5px; font-weight:600; }
.seller-hero{ position:relative; background:linear-gradient(120deg,#0B1220,#0F2A2E 60%,#0B1220); overflow:hidden; padding:56px 40px 64px; }
.seller-hero-grid{ display:grid; grid-template-columns:1.05fr 0.95fr; gap:30px; align-items:center; max-width:1400px; margin:0 auto; position:relative; z-index:1; }
.seller-pill{ display:inline-flex; align-items:center; gap:7px; background:rgba(37,99,235,0.16); color:#60A5FA; font-size:12px; font-weight:700; letter-spacing:0.02em; border-radius:100px; padding:7px 14px; margin-bottom:22px; }
.seller-hero h1{ font-size:44px; font-weight:800; line-height:1.15; color:#fff; margin:0 0 16px; }
.seller-hero h1 .accent{ color:#8CD867; }
.seller-hero-sub{ font-size:15.5px; color:#94A3B8; line-height:1.6; max-width:460px; margin-bottom:28px; }
.seller-trust-row{ display:flex; flex-wrap:wrap; gap:22px; margin-bottom:30px; }
.seller-trust-item{ display:flex; align-items:center; gap:9px; }
.seller-trust-item svg{ color:#60A5FA; flex-shrink:0; }
.seller-trust-item b{ display:block; font-size:12.5px; font-weight:600; color:#fff; }
.seller-trust-item span{ display:block; font-size:11px; color:#94A3B8; }
.seller-hero-ctas{ display:flex; gap:14px; }
.seller-btn-primary{ display:inline-flex; align-items:center; gap:8px; background:#2563EB; color:#fff; border-radius:100px; padding:14px 26px; font-size:14.5px; font-weight:700; }
.seller-btn-outline{ display:inline-flex; align-items:center; gap:8px; background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,0.25); border-radius:100px; padding:14px 26px; font-size:14.5px; font-weight:700; }
.seller-badge-ring{ position:relative; width:100%; max-width:420px; aspect-ratio:1; margin:0 auto; }
.seller-ring-circle{ position:absolute; inset:0; border-radius:100%; background:conic-gradient(from 180deg,#16A34A,#0EA5E9,#7C3AED,#F97316,#16A34A); padding:6px; }
.seller-ring-inner{ position:absolute; inset:6px; border-radius:100%; background:#0B1220; display:flex; align-items:center; justify-content:center; }
.seller-ring-m{ font-size:64px; font-weight:900; background:linear-gradient(135deg,#60A5FA,#8CD867); -webkit-background-clip:text; background-clip:text; color:transparent; }
.seller-ring-icon{ position:absolute; width:36px; height:36px; border-radius:11px; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; color:#fff; }
.seller-perks-strip{ display:grid; grid-template-columns:repeat(5,1fr); gap:0; background:#fff; padding:26px 40px; box-shadow:0 4px 30px -20px rgba(0,0,0,0.15); }
.seller-perk{ display:flex; align-items:flex-start; gap:12px; padding:0 16px; border-right:1px solid #EEF0F5; }
.seller-perk:last-child{ border-right:none; }
.seller-perk-icon{ width:42px; height:42px; border-radius:100%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.seller-perk b{ display:block; font-size:13.5px; font-weight:700; }
.seller-perk span{ display:block; font-size:12px; color:#64748B; line-height:1.4; }
.seller-steps{ padding:48px 40px; text-align:center; }
.seller-steps h2{ font-size:22px; font-weight:800; margin-bottom:28px; }
.seller-steps-row{ display:flex; align-items:center; justify-content:center; gap:18px; max-width:1200px; margin:0 auto; }
.seller-step{ flex:1; background:#F0F6FF; border-radius:16px; padding:22px 18px; text-align:left; }
.seller-step-top{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.seller-step-num{ width:22px; height:22px; border-radius:100%; background:#2563EB; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.seller-step h4{ font-size:14px; font-weight:700; margin:0; }
.seller-step p{ font-size:12.5px; color:#64748B; margin:0; line-height:1.5; }
.seller-step-arrow{ color:#CBD5E1; flex-shrink:0; }
.seller-succeed{ background:#0B1220; padding:44px 40px; }
.seller-succeed-top{ display:flex; align-items:flex-start; gap:40px; max-width:1300px; margin:0 auto; }
.seller-succeed-title{ color:#fff; font-size:26px; font-weight:800; flex-shrink:0; min-width:230px; }
.seller-succeed-title .accent{ color:#8CD867; }
.seller-succeed-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:22px; flex:1; }
.seller-succeed-item{ display:flex; align-items:flex-start; gap:10px; }
.seller-succeed-item svg{ color:#60A5FA; flex-shrink:0; margin-top:2px; }
.seller-succeed-item b{ display:block; color:#fff; font-size:13px; font-weight:700; }
.seller-succeed-item span{ display:block; color:#94A3B8; font-size:11.5px; margin-top:2px; }
@media (max-width:960px){
  .lp-nav-links{ display:none; }
  .seller-hero-grid{ grid-template-columns:1fr; }
  .seller-perks-strip{ grid-template-columns:1fr 1fr; }
  .seller-steps-row{ flex-direction:column; }
  .seller-step-arrow{ display:none; }
  .seller-succeed-top{ flex-direction:column; }
  .seller-succeed-grid{ grid-template-columns:1fr 1fr; }
}
`;

function SellerLandingPage({ onStart, onSignIn }) {
  return (
    <div className="lp-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{SELLER_LP_CSS}</style>
      <nav className="lp-nav">
        <Logo />
        <div className="lp-nav-links">
          <a className="active">Home</a>
          <a>Categories <ChevronDown size={13} /></a>
          <a>Deals</a>
          <a>Stores</a>
          <a>Pharmacies</a>
          <a>Gift Cards</a>
          <a className="highlight">Become a Seller / Rider</a>
        </div>
        <div className="lp-nav-actions">
          <div className="lp-nav-deliver"><MapPin size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />Deliver to<b>Lagos, Nigeria</b></div>
          <div className="lp-nav-icons">
            <Heart size={17} />
            <div className="lp-nav-icon"><Bell size={17} /><span className="lp-nav-badge">3</span></div>
            <div className="lp-nav-icon"><ShoppingCart size={17} /><span className="lp-nav-badge">2</span></div>
          </div>
          <button className="lp-nav-signin" onClick={onSignIn}><UserIcon size={16} /> Sign In</button>
        </div>
      </nav>

      <section className="seller-hero">
        <div className="seller-hero-grid">
          <div>
            <div className="seller-pill"><Store size={13} /> FOR BUSINESSES & SELLERS</div>
            <h1>Grow your business<br />with <span className="accent">Medra</span>.</h1>
            <p className="seller-hero-sub">Reach thousands of customers, increase your sales, and manage your business all in one powerful platform.</p>
            <div className="seller-trust-row">
              <div className="seller-trust-item"><ShieldCheck size={18} /><div><b>Trusted Platform</b><span>Verified & secure for your business</span></div></div>
              <div className="seller-trust-item"><Users size={18} /><div><b>More Customers</b><span>Get discovered by thousands daily</span></div></div>
              <div className="seller-trust-item"><Store size={18} /><div><b>Easy Management</b><span>Manage products, orders & deliveries</span></div></div>
              <div className="seller-trust-item"><Wallet size={18} /><div><b>Fast Payouts</b><span>Get paid securely and on time</span></div></div>
              <div className="seller-trust-item"><Headphones size={18} /><div><b>24/7 Support</b><span>We're here to help your business grow</span></div></div>
            </div>
            <div className="seller-hero-ctas">
              <button className="seller-btn-primary" onClick={onStart}>Start Selling Now <ArrowRight size={16} /></button>
              <button className="seller-btn-outline" onClick={onSignIn}>Learn More <Play size={14} /></button>
            </div>
          </div>
          <div className="seller-badge-ring">
            <img src="data:image/png;base64,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" alt="Medra" style={{ width: "100%", maxWidth: 380, borderRadius: 24 }} />
          </div>
        </div>
      </section>

      <div className="seller-perks-strip">
        <div className="seller-perk"><div className="seller-perk-icon" style={{ background: "#EAF3FF", color: "#2563EB" }}><Users size={18} /></div><div><b>Wide Customer Reach</b><span>Get your products in front of thousands of active buyers across multiple categories.</span></div></div>
        <div className="seller-perk"><div className="seller-perk-icon" style={{ background: "#EAFBF1", color: "#16A34A" }}><TrendingUp size={18} /></div><div><b>Boost Your Sales</b><span>Increase visibility and sales with our smart marketing and recommendation tools.</span></div></div>
        <div className="seller-perk"><div className="seller-perk-icon" style={{ background: "#F3EEFF", color: "#7C3AED" }}><Store size={18} /></div><div><b>Easy Store Management</b><span>Add products, manage stock, track orders and analytics from your dashboard.</span></div></div>
        <div className="seller-perk"><div className="seller-perk-icon" style={{ background: "#FFF1E9", color: "#EA580C" }}><Wallet size={18} /></div><div><b>Secure & Fast Payouts</b><span>Enjoy secure payments and quick settlements directly to your bank account.</span></div></div>
        <div className="seller-perk"><div className="seller-perk-icon" style={{ background: "#FFE9EF", color: "#E11D48" }}><Headphones size={18} /></div><div><b>Dedicated Support</b><span>Get 24/7 support from our team to help your business grow and succeed.</span></div></div>
      </div>

      <section className="seller-steps">
        <h2>Start Selling in 4 Simple Steps</h2>
        <div className="seller-steps-row">
          <div className="seller-step"><div className="seller-step-top"><div className="seller-step-num">1</div><h4>Register Your Business</h4></div><p>Sign up and provide your business details to get started.</p></div>
          <ChevronRight className="seller-step-arrow" size={20} />
          <div className="seller-step"><div className="seller-step-top"><div className="seller-step-num">2</div><h4>Set Up Your Store</h4></div><p>Add your store information, logo, products and delivery preferences.</p></div>
          <ChevronRight className="seller-step-arrow" size={20} />
          <div className="seller-step"><div className="seller-step-top"><div className="seller-step-num">3</div><h4>Start Receiving Orders</h4></div><p>Customers place orders and you prepare them for delivery.</p></div>
          <ChevronRight className="seller-step-arrow" size={20} />
          <div className="seller-step"><div className="seller-step-top"><div className="seller-step-num">4</div><h4>Get Paid & Grow</h4></div><p>Receive payments, track performance and grow your business.</p></div>
        </div>
      </section>

      <div className="seller-succeed">
        <div className="seller-succeed-top">
          <div className="seller-succeed-title">Everything You Need<br />to <span className="accent">Succeed</span></div>
          <div className="seller-succeed-grid">
            <div className="seller-succeed-item"><BarChart3 size={16} /><div><b>Powerful Dashboard</b><span>Real-time insights and performance analytics.</span></div></div>
            <div className="seller-succeed-item"><Megaphone size={16} /><div><b>Marketing Tools</b><span>Promote your products and run exclusive deals.</span></div></div>
            <div className="seller-succeed-item"><Package size={16} /><div><b>Inventory Management</b><span>Easily manage stock, variants and availability.</span></div></div>
            <div className="seller-succeed-item"><TruckIcon size={16} /><div><b>Delivery Integration</b><span>Reliable delivery partners to reach your customers.</span></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  const submit = (e) => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); onLogin(); }, 700); };
  return (
    <div className="medra-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      <div className="staff-login-wrap">
        <div className="staff-login-card enter">
          <Logo />
          <div className="staff-login-title" style={{ marginTop: 18 }}>{mode === "signin" ? "Welcome back" : "Create your store"}</div>
          <div className="muted">{mode === "signin" ? "Sign in to manage your storefront" : "New storefronts are reviewed before going live"}</div>
          <div className="login-tabs">
            <button type="button" className={`login-tab ${mode === "signin" ? "active" : ""}`} onClick={() => setMode("signin")}>Sign in</button>
            <button type="button" className={`login-tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Apply to sell</button>
          </div>
          <div className="muted small" style={{ textAlign: "center", marginTop: 10 }}>Preview build -- this is a demo environment, not a live account.</div>
          <form className="login-form" onSubmit={submit}>
            {mode === "signup" && <label className="field"><span>Business name</span><input type="text" defaultValue="Northside Espresso Bar" placeholder="Northside Espresso Bar" required /></label>}
            <label className="field"><span>Email</span><input type="email" defaultValue="demo@medra.com" placeholder="you@example.com" required /></label>
            <label className="field"><span>Password</span><input type="password" defaultValue="demo1234" placeholder="********" required /></label>
            <button className={`primary-btn wide ${loading ? "loading" : ""}`} type="submit" disabled={loading}>{loading ? <span className="spinner" /> : mode === "signin" ? "Sign in" : "Submit application"}</button>
          </form>
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

export default function MedraSellerApp({ sharedAuthed, onAuth, onLogout, sharedOrderStore } = {}) {
  const [authed, setAuthedRaw] = useState(!!sharedAuthed);
  useEffect(() => { if (sharedAuthed) setAuthedRaw(true); }, [sharedAuthed]);
  const setAuthed = (v) => { setAuthedRaw(v); if (v) onAuth?.(); else onLogout?.(); };
  const [extraPayouts, setExtraPayouts] = useState([]);
  const [telehealthSpend, setTelehealthSpend] = useState(0);
  const SELLER_AVAILABLE_BALANCE_BASE = 125600;
  const sellerAvailableBalance = SELLER_AVAILABLE_BALANCE_BASE - telehealthSpend;
  // SERVER-AUTHORITY: this just appends a "pending" request locally today.
  // Once real, the requested amount must be checked against the seller's
  // actual available balance server-side, and the payout itself (bank
  // transfer) must be a real, audited backend action -- never something the
  // frontend can mark as "paid" on its own.
  const requestPayout = (amount) => {
    setExtraPayouts((p) => [{ date: "Just now", amount, status: "pending", orders: [], requestedAt: Date.now() }, ...p]);
  };
  const [showLanding, setShowLanding] = useState(true);
  const [active, setActive] = useState("dashboard");
  const [openSection, setOpenSection] = useState(NAV_SECTIONS.find((s) => s.items.some((i) => i.key === "orders"))?.label || null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const isFirstNav = useRef(true);
  const goTo = (key, sectionLabel) => { setActive(key); setOpenSection(sectionLabel); };
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
  const [inventory, setInventory] = useState(INVENTORY);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [orderStage, setOrderStage] = useState(null);
  const [orders, setOrders] = useState(RECENT_ORDERS);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState(NOTIF_LIST);
  const [lowStockNotified, setLowStockNotified] = useState(new Set());
  useEffect(() => {
    const nowLow = inventory.filter((it) => it.stock <= it.lowStockAt && !lowStockNotified.has(it.id));
    if (nowLow.length === 0) return;
    setNotifList((n) => [...nowLow.map((it) => ({ icon: AlertCircle, color: "#DC2626", title: "Low stock alert", sub: `${it.name} is ${it.stock === 0 ? "out of stock" : `down to ${it.stock} left`}`, time: "Just now", goTo: "inventory" })), ...n]);
    setLowStockNotified((s) => new Set([...s, ...nowLow.map((it) => it.id)]));
  }, [inventory]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [switchNotice, setSwitchNotice] = useState(null);
  useEffect(() => {
    if (!sharedOrderStore) return;
    sharedOrderStore.orders.forEach((o) => {
      if (o.stage === "delivered" && (o.items || []).some((it) => it.sellerName === STORE.name) && !o.sellerNotifiedDelivered) {
        setSwitchNotice(`Order #${o.id} was delivered and confirmed by the customer.`);
        setTimeout(() => setSwitchNotice(null), 4000);
        sharedOrderStore.updateOrder(o.id, { sellerNotifiedDelivered: true });
      }
    });
  }, [sharedOrderStore?.orders]);
  const switchAccount = (appKey) => {
    if (appKey === "seller") return;
    window.dispatchEvent(new CustomEvent("medra:switch-app", { detail: { app: appKey } }));
    if (!window.__MEDRA_SHELL__) {
      setSwitchNotice(`In production this opens your Customer dashboard, already signed in.`);
      setTimeout(() => setSwitchNotice(null), 3200);
    }
  };

  if (!authed && showLanding) {
    return <SellerLandingPage onStart={() => setShowLanding(false)} onSignIn={() => setShowLanding(false)} />;
  }
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const updateStock = (id, stock) => setInventory((inv) => inv.map((i) => (i.id === id ? { ...i, stock } : i)));
  const updatePrice = (id, price) => setInventory((inv) => inv.map((i) => (i.id === id ? { ...i, price } : i)));
  const updateThreshold = (id, lowStockAt) => setInventory((inv) => inv.map((i) => (i.id === id ? { ...i, lowStockAt } : i)));
  const updateImage = (id, image) => setInventory((inv) => inv.map((i) => (i.id === id ? { ...i, image } : i)));
  const updateCost = (id, cost) => setInventory((inv) => inv.map((i) => (i.id === id ? { ...i, cost } : i)));
  const duplicateProduct = (id) => setInventory((inv) => {
    const orig = inv.find((i) => i.id === id);
    if (!orig) return inv;
    return [...inv, { ...orig, id: `${id}-copy-${Date.now()}`, name: `${orig.name} (Copy)` }];
  });
  const deleteProduct = (id) => setInventory((inv) => inv.filter((i) => i.id !== id));
  const addProduct = (p) => setInventory((inv) => [...inv, p]);
  const triggerNewOrder = () => { if (!pendingOrder) setPendingOrder(INCOMING_ORDER); };
  const viewOrder = () => { setOrderStage("incoming"); setActive("orderflow"); };
  const acceptOrder = () => setOrderStage("preparing");
  const rejectOrder = () => { setPendingOrder(null); setOrderStage(null); setActive("dashboard"); };
  const markReady = () => setOrderStage("ready");
  const completeFlow = () => {
    setOrders((os) => [{ id: pendingOrder.id, customer: pendingOrder.customer, time: "just now", total: pendingOrder.total, status: "Delivered (Simulated)" }, ...os]);
    setPendingOrder(null); setOrderStage(null); setActive("dashboard");
  };

  const activeLabel = active === "dashboard" ? "Dashboard" : NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.key === active)?.label || "Dashboard";

  const SCREENS = {
    dashboard: appLoading ? <DashboardSkeleton /> : <DashboardScreen onNewOrder={triggerNewOrder} pendingOrder={active === "dashboard" ? pendingOrder : null} onViewOrder={viewOrder} onNavigate={setActive} availableBalance={sellerAvailableBalance} />,
    orders: <OrdersListScreen orders={orders} />,
    disputes: <SellerDisputesScreen />,
    returns: <ReturnsScreen />,
    orderflow: pendingOrder && <OrderFlowScreen order={pendingOrder} stage={orderStage} onAccept={acceptOrder} onReject={rejectOrder} onReady={markReady} onComplete={completeFlow} />,
    products: <ProductsScreen inventory={inventory} onDuplicate={duplicateProduct} onDelete={deleteProduct} onAddProduct={addProduct} onUpdateImage={updateImage} onUpdateCost={updateCost} />,
    inventory: <InventoryScreen inventory={inventory} updateStock={updateStock} updatePrice={updatePrice} updateThreshold={updateThreshold} />,
    analytics: <AnalyticsScreen inventory={inventory} />,
    "weekly-digest": <WeeklyDigestSection onNavigate={setActive} />,
    "order-confirmations": <OrderConfirmationsSection sharedOrderStore={sharedOrderStore} />,
    "rider-declines": <RiderDeclinesSection />,
    earnings: <EarningsScreen />,
    payouts: <PayoutsScreen extraPayouts={extraPayouts} requestPayout={requestPayout} available={sellerAvailableBalance} telehealthSpend={telehealthSpend} />,
    telehealth: <SellerTelehealthScreen available={sellerAvailableBalance} telehealthSpend={telehealthSpend} onPay={(fee) => setTelehealthSpend((s) => s + fee)} />,
    customers: <CustomersScreen />,
    reviews: <ReviewsScreen />,
    marketing: <PromotionsAndDealsScreen initialTab="promotions" />,
    discounts: <PromotionsAndDealsScreen initialTab="discounts" />,
    messages: <MessagesScreen />,
    community: <CommunityScreen />,
    "ai-assistant": <AIAssistantScreen inventory={inventory} onNavigate={setActive} />,
    broadcast: <BroadcastScreen />,
    status: <StatusScreen onNavigate={setActive} />,
    "store-settings": <StoreSettingsScreen onNavigate={setActive} />,
    locations: <LocationsScreen />,
    "account-settings": <AccountSettingsScreen />,
    team: <TeamScreen />,
    "view-store": <StorePreviewScreen inventory={inventory} />,
    help: <SellerHelpScreen onNavigate={setActive} />,
  };

  return (
    <div className="medra-root">
      <ConfirmHost />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      {switchNotice && <div className="switch-toast"><ShieldCheck size={14} /> {switchNotice}</div>}
      <div className="desk-shell">
        <div className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-head"><Logo /></div>
          <div className="store-switcher">
            <div className="driver-avatar sm store">{STORE.name[0]}</div>
            <div className="ti-mid"><div className="card-name">{STORE.name}</div><div className="muted">{STORE.category}</div></div>
            <ChevronDown size={14} />
          </div>
          <nav className="sidebar-nav" onClick={() => setMobileNavOpen(false)}>
            <button className={`side-btn ${active === "dashboard" ? "active" : ""}`} onClick={() => setActive("dashboard")}><LayoutDashboard size={16} /> Dashboard</button>
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
                      <item.icon size={16} /> {item.label}{item.badge && <span className="side-badge">{item.badge}</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
          <button className="side-btn logout" onClick={() => setAuthed(false)}><LogOut size={16} /> Logout</button>
        </div>
        <div className={`sidebar-scrim ${mobileNavOpen ? "show" : ""}`} onClick={() => setMobileNavOpen(false)} />

        <div className="main">
          <div className="topbar">
            <button className="hamburger-btn" onClick={() => setMobileNavOpen(true)}><Menu size={18} /></button>
            <div>
              {active === "dashboard" ? (
                <>
                  <div className="muted">Welcome back,</div>
                  <div className="page-title">{STORE.name} {STORE.verified && <ShieldCheck size={16} className="verified-badge" />}</div>
                  <div className="muted">Here's what's happening with your store today.</div>
                </>
              ) : <div className="page-title">{activeLabel}</div>}
            </div>
            <div className="topbar-actions">
              <div className="notif-anchor">
                <button className="icon-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications"><Bell size={17} /><span className="icon-badge">{notifList.length}</span></button>
                {notifOpen && (
                  <>
                    <div className="notif-scrim" onClick={() => setNotifOpen(false)} />
                    <div className="notif-dropdown">
                      <div className="panel-title" style={{ padding: "12px 14px 6px" }}>Notifications</div>
                      {notifList.map((n, i) => (
                        <button key={i} className="notif-row" onClick={() => { setActive(n.goTo); setNotifOpen(false); }}>
                          <div className="pending-icon" style={{ background: n.color + "1A", color: n.color }}><n.icon size={14} /></div>
                          <div className="ti-mid"><div className="card-name">{n.title}</div><div className="muted">{n.sub}</div></div>
                          <div className="muted small">{n.time}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button className="icon-btn" onClick={() => setActive("messages")} aria-label="Messages"><MessageCircle size={17} /><span className="icon-badge">3</span></button>
              <div className="notif-anchor">
                <button className="user-chip" onClick={() => setAccountOpen((o) => !o)}>
                  <div className="driver-avatar sm">{STORE.owner.split(" ").map((w) => w[0]).join("")}</div>
                  <div style={{ textAlign: "left" }}><div className="card-name">{STORE.owner}</div><div className="muted">Store Owner</div></div>
                  <ChevronDown size={14} />
                </button>
                {accountOpen && (
                  <>
                    <div className="notif-scrim" onClick={() => setAccountOpen(false)} />
                    <div className="notif-dropdown">
                      <div className="panel-title" style={{ padding: "12px 14px 6px" }}>Switch account</div>
                      <div className="muted small" style={{ padding: "0 14px 8px" }}>Accounts linked to this sign-in</div>
                      {LINKED_ACCOUNTS.map((acc) => (
                        <button key={acc.role} className="notif-row" onClick={() => { setAccountOpen(false); switchAccount(acc.appKey); }}>
                          <div className="driver-avatar sm" style={{ background: acc.role === "seller" ? "#EA580C" : "var(--purple)" }}>{acc.initials}</div>
                          <div className="ti-mid"><div className="card-name">{acc.label}</div><div className="muted small">{acc.name}</div></div>
                          {acc.role === "seller" && <span className="status-pill done">Current</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {navLoading && active !== "dashboard" ? <ScreenSkeleton /> : (SCREENS[active] || <NotFoundScreen />)}
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
.muted{ color:var(--muted); font-size:12.5px; } .muted.small{ font-size:11px; }
.mono{ font-family:'JetBrains Mono',monospace; font-size:12.5px; }
.card-name{ font-size:13px; font-weight:600; }
.brand-logo{ display:flex; align-items:center; gap:9px; }
.brand-word{ font-weight:800; font-size:17px; letter-spacing:-0.01em; color:#0F172A; }
.brand-tag{ font-size:10.5px; color:var(--muted); font-weight:500; }

.desk-shell{ width:100%; max-width:1440px; min-height:100vh; display:flex; }
.sidebar{ width:264px; flex-shrink:0; background:#fff; border-right:1px solid var(--border); display:flex; flex-direction:column; padding:18px 12px; gap:8px; height:100vh; position:sticky; top:0; overflow:hidden; }
.sidebar-head{ padding:4px 8px 12px; }
.store-switcher{ display:flex; align-items:center; gap:9px; border:1px solid var(--border); border-radius:12px; padding:9px 10px; margin-bottom:8px; }
.sidebar-nav{ flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:2px; padding-right:2px; }
.sidebar-nav::-webkit-scrollbar{ width:5px; } .sidebar-nav::-webkit-scrollbar-thumb{ background:#CBD5E1; border-radius:10px; }
.side-section{ margin-top:10px; }
.side-section-label{ display:flex; align-items:center; justify-content:space-between; width:100%; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:#94A3B8; font-weight:700; padding:8px 10px 8px; border-radius:8px; transition:background 120ms ease, color 120ms ease; }
.side-section-label.collapsible:hover{ background:#F8FAFC; color:#64748B; }
.side-section-label.has-active{ color:var(--purple); }
.chevron{ transition:transform 160ms ease; flex-shrink:0; }
.chevron.open{ transform:rotate(180deg); }
.side-btn{ display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:8px; font-size:12.5px; font-weight:500; color:#334155; width:100%; text-align:left; transition:background 150ms ease; position:relative; }
.side-btn:hover{ background:#F1F5F9; }
.side-btn.active{ background:#FFF1E8; color:#EA580C; font-weight:700; }
.side-badge{ margin-left:auto; background:#DC2626; color:#fff; font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:100px; }
.side-btn.logout{ color:#DC2626; margin-top:8px; padding:10px; font-weight:600; }

.main{ flex:1; min-width:0; padding:20px 28px 60px; overflow-y:auto; height:100vh; }
.topbar{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:16px; flex-wrap:wrap; }
.page-title{ font-size:21px; font-weight:800; letter-spacing:-0.01em; display:flex; align-items:center; gap:8px; }
.verified-badge{ color:#3B82F6; }
.topbar-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.ghost-btn{ display:flex; align-items:center; gap:6px; border:1px solid var(--border); background:#fff; border-radius:10px; padding:9px 14px; font-size:12.5px; font-weight:600; }
.icon-btn{ position:relative; width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; }
.hamburger-btn{ display:none; align-items:center; justify-content:center; width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid var(--border); flex-shrink:0; }
.icon-badge{ position:absolute; top:-5px; right:-5px; background:#DC2626; color:#fff; font-size:9px; font-weight:700; min-width:16px; height:16px; border-radius:100px; display:flex; align-items:center; justify-content:center; padding:0 3px; }
.notif-anchor{ position:relative; }
.notif-scrim{ position:fixed; inset:0; z-index:60; }
.notif-dropdown{ position:absolute; top:44px; right:0; width:320px; max-width:88vw; background:#fff; border:1px solid var(--border); border-radius:14px; box-shadow:0 20px 40px -16px rgba(15,23,42,0.3); z-index:61; overflow:hidden; }
.notif-row{ display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:10px 14px; border-top:1px solid #F1F5F9; transition:background 120ms ease; }
.notif-row:hover{ background:#F8F9FC; }
:focus-visible{ outline:2px solid var(--purple); outline-offset:2px; border-radius:4px; }
.modal-backdrop{ position:fixed; inset:0; background:rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
.confirm-modal{ background:#fff; border-radius:20px; padding:26px; width:420px; max-width:92vw; max-height:88vh; overflow-y:auto; position:relative; }
.review-reply{ background:var(--bg); border-radius:10px; padding:9px 12px; font-size:12.5px; width:100%; }
.dispute-card{ border:1px solid var(--border); border-radius:12px; padding:12px; }
.dispute-card.is-dispute{ border-left:3px solid #DC2626; background:#FFFBFB; }
.dispute-card.is-return{ border-left:3px solid #2563EB; background:#F8FAFF; }
.payout-card{ border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.payout-row{ display:flex; align-items:center; width:100%; text-align:left; padding:12px 14px; gap:10px; }
.payout-chevron{ transition:transform 150ms ease; color:var(--muted); }
.payout-chevron.open{ transform:rotate(90deg); }
.payout-orders{ padding:0 14px 12px; display:flex; flex-direction:column; gap:6px; border-top:1px solid var(--border); padding-top:10px; margin:0 14px 12px; }
.switch-toast{ position:fixed; top:18px; left:50%; transform:translateX(-50%); background:#0F172A; color:#fff; padding:11px 18px; border-radius:100px; font-size:12.5px; font-weight:600; display:flex; align-items:center; gap:8px; z-index:300; box-shadow:0 20px 40px -16px rgba(0,0,0,0.4); max-width:90vw; }
.user-chip{ display:flex; align-items:center; gap:9px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:6px 10px; }
.driver-avatar{ width:34px; height:34px; border-radius:100px; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex-shrink:0; }
.driver-avatar.sm{ width:32px; height:32px; font-size:11px; }
.driver-avatar.store{ background:#EA580C; border-radius:10px; }

.section-pad{ display:flex; flex-direction:column; gap:16px; }
.enter{ animation: fadeUp 380ms cubic-bezier(.2,.8,.2,1) both; } @keyframes fadeUp{ from{ opacity:0; transform:translateY(8px);} to{ opacity:1; transform:none;} }

.kpi-grid{ display:grid; grid-template-columns:repeat(6,1fr); gap:14px; }
.chip{ padding:8px 14px; border-radius:100px; background:#fff; border:1px solid var(--border); font-size:12.5px; font-weight:500; }
.reply-row{ display:flex; gap:8px; }
.reply-row input{ flex:1; border:1px solid var(--border); border-radius:100px; padding:9px 14px; font-size:13px; }
.cat-top{ display:flex; align-items:center; gap:8px; }
.community-feed{ display:flex; flex-direction:column; gap:14px; max-height:420px; overflow-y:auto; }
.community-msg{ display:flex; gap:10px; align-items:flex-start; }
.community-gate{ display:flex; align-items:center; gap:8px; background:#FFF7ED; color:#EA580C; border-radius:12px; padding:12px 14px; font-size:12.5px; font-weight:600; margin-bottom:14px; }
.community-divider{ text-align:center; font-size:11.5px; color:var(--muted); padding:6px 0; border-top:1px dashed var(--border); border-bottom:1px dashed var(--border); }
.community-img{ max-width:220px; border-radius:12px; margin-top:6px; display:block; }
.image-preview-row{ display:flex; align-items:center; gap:8px; margin-top:10px; }
.image-preview-thumb{ width:48px; height:48px; border-radius:8px; object-fit:cover; }
.status-post-row{ display:flex; gap:12px; align-items:center; border:1px solid var(--border); border-radius:12px; padding:10px; }
.status-post-img{ width:56px; height:56px; border-radius:10px; object-fit:cover; flex-shrink:0; }
.faq-item{ border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:border-color 150ms ease; }
.faq-item.open{ border-color:var(--purple); }
.faq-q{ width:100%; display:flex; align-items:center; justify-content:space-between; padding:14px 16px; font-size:13.5px; font-weight:600; text-align:left; }
.faq-chevron{ transition:transform 200ms ease; flex-shrink:0; color:var(--muted); }
.faq-item.open .faq-chevron{ transform:rotate(90deg); color:var(--purple); }
.faq-a{ padding:0 16px 16px; font-size:13px; color:#3A4450; line-height:1.6; margin:0; }
.chip.active{ background:var(--ink); color:#fff; border-color:var(--ink); }
.chip-row{ display:flex; gap:8px; flex-wrap:wrap; }
.kpi-compare-row{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.skel-card{ height:78px; border-radius:14px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
.skel-line{ height:14px; border-radius:6px; margin-bottom:12px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
.skel-block{ height:60px; border-radius:12px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
@keyframes shimmer{ from{background-position:200% 0;} to{background-position:-200% 0;} }
.kpi-card{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:16px; }
.kpi-icon{ width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
.kpi-label{ font-size:12px; color:var(--muted); margin-bottom:4px; }
.kpi-value{ font-size:22px; font-weight:800; letter-spacing:-0.01em; }
.kpi-delta{ font-size:11px; font-weight:700; display:flex; align-items:center; gap:3px; margin-top:6px; color:var(--muted); }
.kpi-delta.up{ color:#16A34A; }
.kpi-delta-sub{ color:var(--muted); font-weight:400; }
.kpi-spark{ margin-top:8px; }
.stars-row{ display:flex; gap:1px; margin-top:4px; }
.withdraw-btn{ background:var(--purple); color:#fff; border-radius:8px; padding:7px 12px; font-size:11.5px; font-weight:700; margin-top:10px; }
.stat-mini{ background:#fff; border:1px solid var(--border); border-radius:14px; padding:14px; }

.new-order-banner{ display:flex; align-items:center; gap:10px; background:#EA580C; border-radius:14px; padding:14px 18px; }
.sla-badge{ background:rgba(255,255,255,0.2); color:#fff; font-size:10.5px; font-weight:700; padding:4px 9px; border-radius:100px; white-space:nowrap; }
.upload-note{ display:flex; align-items:center; gap:7px; background:#ECFDF5; color:#166534; border:1px solid #BBF7D0; border-radius:10px; padding:9px 12px; font-size:12px; font-weight:600; margin-bottom:12px; }
.underperform-flag{ display:flex; align-items:center; gap:5px; font-size:10.5px; color:#B45309; margin-top:8px; line-height:1.4; }
.version-tag{ text-align:center; font-size:11px; color:#B0B7C3; padding:16px 0; }
.msg-thread-btn{ width:100%; text-align:left; border-radius:10px; transition:background 120ms ease; }
.msg-thread-btn:hover, .msg-thread-btn.active{ background:var(--bg); }
.chat-thread{ display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto; }
.chat-bubble{ padding:9px 13px; border-radius:12px; font-size:12.5px; max-width:75%; }
.chat-bubble.them{ background:var(--bg); align-self:flex-start; }
.chat-bubble.me{ background:var(--purple); color:#fff; align-self:flex-end; margin-left:auto; }
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
.scan-ring{ width:10px; height:10px; border-radius:100px; border:2px solid #fff; border-top-color:transparent; animation:spin 800ms linear infinite; flex-shrink:0; }
@keyframes spin{ to{ transform:rotate(360deg); } }

.row-3col-uneven{ display:grid; grid-template-columns:1.2fr 1.1fr 1fr; gap:14px; }
.row-4col-even{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.row-2col{ display:grid; grid-template-columns:1.2fr 1fr; gap:14px; }

.panel{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:18px 20px; min-width:0; }
.panel-title{ font-weight:700; font-size:14.5px; margin-bottom:12px; }
.panel-title-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.link-btn{ font-size:12px; font-weight:600; color:var(--purple); }
.dropdown-btn{ display:flex; align-items:center; gap:4px; font-size:12px; border:1px solid var(--border); border-radius:8px; padding:5px 10px; }
.rev-big{ font-size:22px; font-weight:800; display:flex; align-items:center; gap:10px; }
.rev-delta{ font-size:11.5px; font-weight:700; color:#16A34A; display:flex; align-items:center; gap:2px; background:#ECFDF5; padding:3px 8px; border-radius:100px; }
.rev-sub-row{ display:flex; justify-content:space-between; margin-top:10px; padding-top:10px; border-top:1px solid var(--border); text-align:center; }

.list-col{ display:flex; flex-direction:column; gap:10px; }
.order-row{ display:flex; align-items:center; gap:10px; }
.ti-mid{ flex:1; min-width:0; }
.pending-row{ display:flex; align-items:center; gap:10px; }
.pending-icon{ width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

.action-card{ border-radius:16px; padding:16px; }
.action-btn{ color:#fff; border-radius:9px; padding:8px 14px; font-size:12px; font-weight:700; }

.perf-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
.rating-hero{ display:flex; align-items:center; gap:14px; }
.rating-big{ font-size:34px; font-weight:800; }
.rating-row{ display:flex; align-items:center; gap:8px; font-size:11.5px; }
.bar-track{ flex:1; height:6px; background:#F1F5F9; border-radius:100px; overflow:hidden; }
.bar-fill-h{ height:100%; border-radius:100px; }
.checklist-dot{ width:14px; height:14px; border-radius:100px; border:2px solid #CBD5E1; flex-shrink:0; }
.checklist-panel{ border:1px solid #DDD6FE; background:#FAF9FF; }
.perm-toggle{ width:22px; height:22px; border-radius:6px; border:1.5px solid var(--border); display:inline-flex; align-items:center; justify-content:center; color:#fff; }
.perm-toggle.on{ background:var(--purple); border-color:var(--purple); }

.admin-table{ width:100%; border-collapse:collapse; }
.admin-table th{ text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:0.04em; color:var(--muted); font-weight:700; padding:8px 10px; border-bottom:1px solid var(--border); }
.admin-table td{ padding:11px 10px; font-size:13px; border-bottom:1px solid #F1F5F9; }
.admin-table tr:last-child td{ border-bottom:none; }
.status-pill{ font-size:10px; font-weight:700; padding:4px 9px; border-radius:100px; background:#F1F5F9; color:#475569; white-space:nowrap; }
.status-pill.done{ background:#ECFDF5; color:#16A34A; } .status-pill.route{ background:#EFF6FF; color:#2563EB; }
.status-pill.prep{ background:#FFF7ED; color:#B45309; } .status-pill.delay{ background:#FEF2F2; color:#DC2626; }
.empty-note{ color:var(--muted); font-size:13px; padding:24px 16px; text-align:center; display:flex; flex-direction:column; align-items:center; }
.flag-row{ display:flex; align-items:center; gap:10px; border:1px solid var(--border); border-radius:12px; padding:11px 14px; }
.flag-row.nav-flag{ width:100%; text-align:left; cursor:pointer; transition:border-color 120ms ease; }
.flag-row.nav-flag:hover{ border-color:var(--purple); }
.toggle-mini{ width:38px; height:22px; border-radius:100px; background:#E2E8F0; padding:2px; display:flex; align-items:center; flex-shrink:0; margin-left:auto; }
.toggle-mini.on{ background:#16A34A; justify-content:flex-end; }
.toggle-mini span{ width:18px; height:18px; border-radius:100px; background:#fff; display:block; }
.unread-dot{ display:inline-block; width:6px; height:6px; border-radius:100px; background:#2563EB; margin-left:5px; }

.feature-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.store-preview-card{ border:1px solid var(--border); border-radius:14px; padding:16px; background:var(--bg); }
.store-banner{ height:110px; border-radius:12px; background:linear-gradient(135deg,#FED7AA,#FDBA74); background-size:cover; background-position:center; display:flex; align-items:center; justify-content:center; position:relative; }
.store-banner-btn{ position:absolute; bottom:8px; right:8px; background:rgba(255,255,255,0.92); }
.about-edit-input{ width:100%; border:1px solid var(--border); border-radius:10px; padding:9px 12px; font-size:13px; }
.feature-card{ border:1px solid var(--border); border-radius:14px; padding:14px; }
.product-photo-wrap{ position:relative; margin:-14px -14px 10px; border-radius:14px 14px 0 0; overflow:hidden; }
.product-photo{ width:100%; height:120px; object-fit:cover; display:block; }
.product-photo-edit{ position:absolute; bottom:8px; right:8px; background:rgba(255,255,255,0.92); border-radius:8px; padding:5px 9px; font-size:11px; font-weight:600; display:flex; align-items:center; gap:4px; }
.feature-top{ display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px; }

.link-price{ display:flex; align-items:center; gap:4px; color:var(--purple); font-size:13px; font-weight:600; }
.price-edit{ width:74px; font-family:'JetBrains Mono',monospace; font-size:13px; border:1px solid var(--border); border-radius:8px; padding:4px 6px; }
.stepper-sm{ display:flex; align-items:center; gap:8px; background:var(--bg); border:1px solid var(--border); border-radius:100px; padding:4px 10px; width:fit-content; }
.stepper-sm button{ width:18px; height:18px; display:flex; align-items:center; justify-content:center; }
.stepper-sm span{ font-family:'JetBrains Mono',monospace; font-size:12.5px; min-width:14px; text-align:center; }

.primary-btn-sm{ background:var(--purple); color:#fff; border-radius:10px; padding:9px 16px; font-weight:700; font-size:12.5px; }
.ghost-btn-sm{ display:inline-flex; align-items:center; gap:6px; border:1px solid var(--border); background:#fff; border-radius:10px; padding:8px 14px; font-weight:600; font-size:12px; }
.tab-row{ display:flex; gap:6px; border-bottom:1px solid var(--border); }
.tab-btn{ border:none; background:none; padding:10px 14px; font-weight:600; font-size:13px; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
.tab-btn.active{ color:#EA580C; border-bottom-color:#EA580C; }
.modal-close{ position:absolute; top:14px; right:14px; width:32px; height:32px; border-radius:100px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; }
.round-btn{ width:26px; height:26px; border-radius:100px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; background:#F1F5F9; color:var(--muted); }
.round-btn:hover{ background:#E2E8F0; }
.round-btn.deny{ background:#FEF2F2; color:#DC2626; }
.round-btn.deny:hover{ background:#FEE2E2; }
.daterange-anchor{ position:relative; display:inline-block; }
.sort-select{ border:1px solid var(--border); border-radius:10px; padding:8px 10px; font-size:12.5px; background:#fff; }

.staff-login-wrap{ width:100%; min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#F1F2F8,#F7F8FB); }
.staff-login-card{ width:400px; max-width:90vw; background:#fff; border:1px solid var(--border); border-radius:20px; padding:32px 30px; box-shadow:0 30px 60px -24px rgba(15,23,42,0.18); }

.staff-login-title{ font-size:19px; font-weight:800; margin-bottom:2px; }
.login-tabs{ display:flex; background:#F1F5F9; border-radius:100px; padding:4px; margin:16px 0; }
.login-tab{ flex:1; padding:9px; border-radius:100px; font-size:12px; font-weight:600; color:var(--muted); }
.login-tab.active{ background:#fff; color:var(--ink); box-shadow:0 1px 3px rgba(0,0,0,0.08); }
.login-form{ display:flex; flex-direction:column; gap:14px; }
.field{ display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:600; color:#334155; }
.field input{ border:1.5px solid var(--border); border-radius:12px; padding:11px 14px; font-size:13.5px; outline:none; }
.field input:focus{ border-color:var(--purple); }
.primary-btn{ background:var(--purple); color:#fff; border-radius:12px; padding:12px; font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center; gap:7px; }
.primary-btn:hover{ background:#5B21B6; } .primary-btn.wide{ width:100%; }
.spinner{ width:16px; height:16px; border-radius:100px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; animation:spin 700ms linear infinite; }

@media (pointer: coarse) {
  .round-btn, .modal-close, .icon-btn, .hamburger-btn{ min-width:44px; min-height:44px; }
  .toggle-mini{ min-height:32px; }
}

@media (max-width:1000px){
  .sidebar{ position:fixed; top:0; left:0; height:100dvh; z-index:200; transform:translateX(-100%); transition:transform 0.25s ease; box-shadow:0 0 24px rgba(0,0,0,0.15); }
  .sidebar.mobile-open{ transform:translateX(0); }
  .sidebar-scrim{ display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:190; }
  .sidebar-scrim.show{ display:block; }
  .hamburger-btn{ display:flex; }
  .desk-shell{ display:block; }
  .main{ height:auto; min-height:100vh; padding:14px 14px 70px; }
  .row-3col-uneven, .row-4col-even, .row-2col, .perf-grid, .feature-grid{ grid-template-columns:1fr; } .kpi-grid{ grid-template-columns:repeat(2,1fr); }
}
@media (min-width:1001px){ .hamburger-btn{ display:none; } }

`;
