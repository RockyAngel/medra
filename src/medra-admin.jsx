import React, { useState, useEffect, useRef } from "react";
import {
  Bell, MessageCircle, ChevronDown, Calendar, Users, Store, Truck, Sparkles,
  User as UserIcon, Package, LayoutGrid, ClipboardList, BadgeCheck,
  Navigation, CreditCard, Wallet, ArrowLeftRight, PlusCircle, Percent,
  AlertTriangle, ScrollText, LifeBuoy, Mail, ShieldAlert, Tag, Gift,
  Crown, Megaphone, FileBarChart, TrendingUp, Settings, LayoutDashboard,
  LogOut, ArrowUp, Check, X, Star, ChevronRight, ShoppingBag, UserPlus,
  ShieldCheck, Server, Database, Cpu, HardDrive, Users2, FileText, Flag,
  Search, FileDown, Eye, Send, Lock, Monitor, Smartphone, History, Clock, PenLine, Inbox, Image as ImageIcon, CheckCircle2, Pencil,
  ArrowRight, Play, Heart, ShoppingCart, Headphones, BarChart3, RefreshCw, MapPin, Circle, CircleCheck, Menu, Compass, Cross, Upload, Info,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

const money = (n) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/* ------------------------------------------------------------
   PLATFORM ECONOMICS -- shared with the customer/seller/rider apps.
   Product commission: 10% added on top of every seller-listed price.
   Delivery commission: 15% of the delivery fee at normal hours,
   10% during peak hours (12-2pm and 6-9pm) -- rider keeps the rest.
   ------------------------------------------------------------ */
const PRODUCT_COMMISSION_RATE = 0.10;
const DELIVERY_COMMISSION_NORMAL = 0.15;
const DELIVERY_COMMISSION_PEAK = 0.10;

// productTotal = what the customer paid for items (seller price + 10%).
// deliveryFee = the gross delivery fee before the platform's cut.
const ORDERS_LEDGER = [
  { id: "O5581", customer: "Jordan B.", vendor: "Northside Espresso Bar", productTotal: 3023, deliveryFee: 900, status: "En route", peak: false },
  { id: "O5579", customer: "Priya M.", vendor: "Fresh Fields Grocery", productTotal: 1450, deliveryFee: 700, status: "Preparing", peak: false },
  { id: "O5574", customer: "Devon K.", vendor: "Ceramic & Co.", productTotal: 2173, deliveryFee: 1200, status: "Delivered", peak: true },
  { id: "O5568", customer: "Amara O.", vendor: "Runwell Sneaker Co.", productTotal: 8900, deliveryFee: 950, status: "Delivered", peak: false },
  { id: "O5560", customer: "Guest (08012345678)", vendor: "Northside Espresso Bar", productTotal: 1980, deliveryFee: 700, status: "Delivered", peak: true, isGuest: true },
  { id: "O5552", customer: "Blessing U.", vendor: "Fresh Fields Grocery", productTotal: 4210, deliveryFee: 850, status: "Cancelled", peak: false },
];
function orderBreakdown(o) {
  const sellerGets = o.productTotal / (1 + PRODUCT_COMMISSION_RATE);
  const productFee = o.productTotal - sellerGets;
  const rate = o.peak ? DELIVERY_COMMISSION_PEAK : DELIVERY_COMMISSION_NORMAL;
  const riderGets = o.deliveryFee * (1 - rate);
  const deliveryFeeCut = o.deliveryFee * rate;
  return { sellerGets, productFee, riderGets, deliveryFeeCut, grandTotal: o.productTotal + o.deliveryFee };
}

/* ============================================================
   MOCK DATA
   ============================================================ */

const KPIS = [
  { key: "revenue", label: "Total Revenue", value: money(15680250), delta: "+18.6%", deltaMonth: "+24.1%", icon: Wallet, bg: "#EEF2FF", fg: "#4F46E5", spark: [30, 42, 38, 55, 48, 62, 70] },
  { key: "orders", label: "Total Orders", value: "24,850", delta: "+12.4%", deltaMonth: "+31.8%", icon: ClipboardList, bg: "#ECFDF5", fg: "#16A34A", spark: [20, 25, 22, 34, 30, 40, 46] },
  { key: "users", label: "Total Users", value: "48,932", delta: "+9.7%", deltaMonth: "+22.3%", icon: Users, bg: "#F5F3FF", fg: "#7C3AED", spark: [40, 38, 44, 41, 48, 45, 52] },
  { key: "riders", label: "Active Riders", value: "2,350", delta: "+6.1%", deltaMonth: "+14.9%", icon: Truck, bg: "#FFF7ED", fg: "#EA580C", spark: [18, 22, 20, 26, 24, 29, 31] },
  { key: "sellers", label: "Active Sellers", value: "3,650", delta: "+8.3%", deltaMonth: "+19.2%", icon: Store, bg: "#EFF6FF", fg: "#2563EB", spark: [12, 15, 14, 19, 17, 21, 24] },
  { key: "verifications", label: "Pending Verifications", value: "126", delta: "+5.3%", deltaMonth: "+11.6%", icon: BadgeCheck, bg: "#FEF2F2", fg: "#DC2626", spark: [8, 10, 9, 13, 11, 14, 16] },
];

const REVENUE_TREND = [
  { d: "Mon", v: 9200000 }, { d: "Tue", v: 10800000 }, { d: "Wed", v: 9800000 }, { d: "Thu", v: 12200000 },
  { d: "Fri", v: 11400000 }, { d: "Sat", v: 14100000 }, { d: "Sun", v: 15680250 },
];
const LAST_WEEK_REVENUE_TREND = REVENUE_TREND.map((d) => ({ d: d.d, v: Math.round(d.v * 0.91) }));

const ORDER_MIX = [
  { name: "Delivered", value: 15230, display: "15,230 (61.3%)", color: "#16A34A" },
  { name: "Processing", value: 5240, display: "5,240 (21.1%)", color: "#2563EB" },
  { name: "Out for Delivery", value: 2450, display: "2,450 (9.9%)", color: "#F97316" },
  { name: "Pending", value: 1930, display: "1,930 (7.8%)", color: "#7C3AED" },
  { name: "Canceled", value: 0, display: "0 (0.0%)", color: "#94A3B8" },
];

const RECENT_ACTIVITY = [
  { title: "New order #ORD128735", sub: "Customer placed a new order", amount: "₦28,450", time: "2 mins ago", icon: ShoppingBag, color: "#16A34A" },
  { title: "Payout processed", sub: "Payout to Doe Pharmacy", amount: "-₦75,000", time: "15 mins ago", icon: Wallet, color: "#F97316" },
  { title: "New user registered", sub: "John Paul joined as customer", time: "25 mins ago", icon: UserPlus, color: "#7C3AED" },
  { title: "Store verification approved", sub: "Healthy Life Store", time: "40 mins ago", icon: BadgeCheck, color: "#16A34A" },
  { title: "SOS alert resolved", sub: "Alert #SOS98761 resolved", time: "1 hour ago", icon: ShieldAlert, color: "#DC2626" },
];

const TOP_CATEGORIES = [
  { label: "Pharmacy & Health", value: money(6250), pct: 100, share: "39.9%", color: "#2563EB" },
  { label: "Groceries", value: money(4120), pct: 66, share: "26.3%", color: "#16A34A" },
  { label: "Electronics", value: money(2350), pct: 38, share: "15.0%", color: "#7C3AED" },
  { label: "Fashion", value: money(1860), pct: 30, share: "11.9%", color: "#F97316" },
  { label: "Home & Living", value: money(1100), pct: 18, share: "7.0%", color: "#EC4899" },
];

const PENDING_VERIFICATIONS = [
  { label: "New Store", value: 24, icon: Store, color: "#16A34A" },
  { label: "New Riders", value: 45, icon: Truck, color: "#2563EB" },
  { label: "New Documents", value: 38, icon: FileText, color: "#7C3AED" },
];

const SUPPORT_OVERVIEW = [
  { label: "Open Tickets", value: 128, icon: LifeBuoy, color: "#DC2626" },
  { label: "In Progress", value: 56, icon: MessageCircle, color: "#2563EB" },
  { label: "Waiting for Reply", value: 34, icon: Mail, color: "#7C3AED" },
  { label: "Resolved Today", value: 72, icon: Check, color: "#16A34A" },
];

const PAYMENT_METHODS = [
  { label: "Card Payments", value: money(8248000), pct: 52.6, color: "#2563EB" },
  { label: "Wallet Payments", value: money(4124000), pct: 26.3, color: "#16A34A" },
  { label: "Bank Transfer", value: money(2446000), pct: 15.6, color: "#F97316" },
  { label: "Other Methods", value: money(862250), pct: 5.5, color: "#7C3AED" },
];

const SYSTEM_OVERVIEW = [
  { label: "System Uptime", value: "99.9%", sub: "All systems operational", icon: Server, color: "#16A34A" },
  { label: "Database Status", value: "Healthy", sub: "All good", icon: Database, color: "#2563EB" },
  { label: "Server Load", value: "23%", sub: "Normal", icon: Cpu, color: "#F97316" },
  { label: "Storage Used", value: "45%", sub: "of 500 GB", icon: HardDrive, color: "#7C3AED" },
  { label: "Daily Active Users", value: "12,450", sub: "+11.2%", icon: Users2, color: "#16A34A" },
];

const TICKETS = [
  { id: "T-901", customer: "Jordan B.", subject: "Order arrived missing an item", priority: "high", time: "4 min ago", minutesOpen: 4, lockedBy: null, resolved: null },
  { id: "T-899", customer: "Casey W.", subject: "Driver took a long detour", priority: "medium", time: "22 min ago", minutesOpen: 22, lockedBy: { name: "Sasha Ade", since: "8:41 AM" }, resolved: null },
  { id: "T-895", customer: "Sam T.", subject: "Refund not yet received", priority: "high", time: "1 hr ago", minutesOpen: 60, lockedBy: null, resolved: null },
  { id: "T-891", customer: "Riley N.", subject: "Question about delivery fee", priority: "low", time: "2 hr ago", minutesOpen: 120, lockedBy: null, resolved: { by: "Tomiwa Bello", at: "Yesterday, 4:12 PM", note: "Explained peak-hour pricing to customer." } },
];
const SLA_MINUTES = { high: 30, medium: 60, low: 240 };
const DISPUTES = [
  { id: "D-221", order: "O5540", customer: "Priya M.", amount: 18400, reason: "Item damaged on arrival", product: "Espresso Machine", lockedBy: null },
  { id: "D-219", order: "O5522", customer: "Devon K.", amount: 27100, reason: "Order never delivered", product: "Wireless Earbuds Pro", lockedBy: { name: "Tomiwa Bello", since: "9:05 AM" } },
  { id: "D-215", order: "O5498", customer: "Sam T.", amount: 9200, reason: "Refund not yet received", product: "Running Sneakers", lockedBy: null },
  { id: "D-208", order: "O5461", customer: "Ngozi A.", amount: 14700, reason: "Item damaged on arrival", product: "Espresso Machine", lockedBy: null },
  { id: "D-201", order: "O5420", customer: "Kelechi O.", amount: 5300, reason: "Wrong item delivered", product: "Espresso Machine", lockedBy: null },
];
const VENDOR_APPS = [
  { id: "V-77", name: "Wildflower Bakehouse", category: "Bakery", city: "Chicago, IL", applied: "2 days ago" },
  { id: "V-76", name: "Iron Gate Hardware", category: "Home", applied: "3 days ago", city: "Evanston, IL" },
];
const EXISTING_SELLER_NAMES = ["Wildflower Bakery", "Northside Espresso Bar", "Fresh Fields Grocery", "Runwell Sneaker Co.", "Ceramic & Co."];
function findSimilarSeller(name) {
  const words = name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  return EXISTING_SELLER_NAMES.find((existing) => {
    const existingWords = existing.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    return words.some((w) => existingWords.includes(w));
  });
}

const DATE_PRESETS = ["Today", "Yesterday", "Last 7 days", "Aug 12 - Aug 19, 2026", "Last 30 days", "This month"];

const NOTIF_LIST = [
  { icon: AlertTriangle, color: "#DC2626", title: "New dispute filed", sub: "Order O5540 -- Priya M.", time: "4 min ago", goTo: "disputes" },
  { icon: Store, color: "#2563EB", title: "Vendor application received", sub: "Wildflower Bakehouse", time: "2 hrs ago", goTo: "sellers" },
  { icon: Wallet, color: "#16A34A", title: "Payout batch completed", sub: "312 vendors paid out", time: "5 hrs ago", goTo: "payouts" },
  { icon: LifeBuoy, color: "#7C3AED", title: "New support ticket", sub: "T-901 -- Jordan B.", time: "6 hrs ago", goTo: "tickets" },
];

/* ============================================================
   NAV -- matches the numbered spec (27 items + logout = 28)
   ============================================================ */

// Per-item role tags for the Admin/Support split: "admin" items are
// marketplace operations (customers/sellers/riders/orders/payments/
// marketing/reports), "support" items are people-facing problems
// (tickets, live chat, disputes/refunds, safety). Items tagged with both
// are shared (e.g. My Account, order lookup, community, notifications).
// This mirrors the "Support handles people problems, Admin handles
// marketplace operations" split -- both roles still live in one compiled
// app since that's how this dashboard is built (support-admin.html), but
// the nav now genuinely narrows per role instead of showing everything
// to everyone.
const NAV_SECTIONS = [
  { label: "Operations", items: [
    { key: "users", label: "Users", icon: Users, roles: ["admin"] },
    { key: "sellers", label: "Sellers / Stores", icon: Store, roles: ["admin"] },
    { key: "riders", label: "Riders / Drivers", icon: Truck, roles: ["admin"] },
    { key: "products", label: "Products", icon: Package, roles: ["admin"] },
    { key: "orders", label: "Orders", icon: ClipboardList, roles: ["admin", "support"] },
    { key: "kyc", label: "KYC & Verifications", icon: BadgeCheck, roles: ["admin"] },
    { key: "delivery-mgmt", label: "Delivery Management", icon: Navigation, roles: ["admin"] },
  ]},
  { label: "Financial Operations", items: [
    { key: "payments", label: "Financial Transactions", icon: CreditCard, roles: ["admin"] },
    { key: "payouts", label: "Payouts & Settlements", icon: Wallet, roles: ["admin"] },
  ]},
  { label: "Risk", items: [
    { key: "fraud-flags", label: "Fraud & Risk Flags", icon: ShieldAlert, roles: ["admin"] },
  ]},
  { label: "Community & Notifications", items: [
    { key: "community", label: "Community", icon: Users, roles: ["admin", "support"] },
    { key: "ai-assistant", label: "Ask Medra", icon: Sparkles, roles: ["admin", "support"] },
    { key: "notifications", label: "Notifications", icon: Bell, badge: 4, roles: ["admin", "support"] },
  ]},
  { label: "My Account", items: [
    { key: "sessions", label: "Sessions & Devices", icon: Monitor, roles: ["admin", "support"] },
    { key: "my-activity", label: "My Activity", icon: History, roles: ["admin", "support"] },
    { key: "telehealth-voucher", label: "Free Telehealth Visits", icon: Cross, roles: ["admin", "support"] },
    { key: "changelog", label: "What's New (Staff)", icon: Sparkles, roles: ["admin", "support"] },
  ]},
];

const GENERIC_CONFIG = {
  customers: { type: "table", title: "Customers", cols: ["Name", "Email", "Orders", "Joined"], rows: [["Jordan Blake", "jordan@example.com", 34, "2024"], ["Priya Menon", "priya@example.com", 21, "2024"], ["Devon King", "devon@example.com", 12, "2025"]] },
  categories: { type: "list", title: "Categories", items: [["Electronics", "312 products"], ["Home & Kitchen", "540 products"], ["Grocery", "890 products"], ["Fashion", "410 products"]] },
  sos: { type: "table", title: "SOS & Safety", cols: ["Rider", "Location", "Triggered", "Status"], rows: [["Marcus T.", "Lekki Phase 1", "4 min ago", "pending"], ["Priya S.", "Victoria Island", "22 min ago", "pending"], ["John Rider", "Yaba", "1 hr ago", "resolved"]] },
  commissions: { type: "stats", title: "Commissions", stats: [["Product commission", "10% added to every seller-listed price"], ["Delivery commission (normal hours)", "15% of delivery fee"], ["Delivery commission (peak hours)", "10% of delivery fee -- 12-2pm & 6-9pm"]] },
};

/* ============================================================
   SHARED PIECES
   ============================================================ */

function Logo({ tagline }) {
  return (
    <div className="brand-logo">
      <img src="data:image/png;base64,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" alt="Medra" style={{ height: 30, width: "auto", flexShrink: 0 }} />
      <div><div className="brand-word">medra</div>{tagline && <div className="brand-tag">{tagline}</div>}</div>
    </div>
  );
}

function Sparkline({ data, color }) {
  const w = 100, h = 30;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
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
      <div className="kpi-delta up"><ArrowUp size={11} /> {delta} <span className="kpi-delta-sub">{label}</span></div>
      <div className="kpi-spark"><Sparkline data={k.spark} color={k.fg} /></div>
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

function CommandPalette({ items, dataItems, recentKeys, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const q = query.trim().toLowerCase();
  const recentItems = !q && recentKeys && recentKeys.length > 0 ? recentKeys.map((k) => items.find((i) => i.key === k)).filter(Boolean) : [];
  const sectionResults = q ? items.filter((i) => i.label.toLowerCase().includes(q) || i.sectionLabel.toLowerCase().includes(q)) : items.filter((i) => !recentKeys?.includes(i.key));
  const dataResults = q ? (dataItems || []).filter((d) => d.label.toLowerCase().includes(q) || d.sub.toLowerCase().includes(q)) : [];
  const results = [...dataResults, ...recentItems, ...sectionResults];
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
          {results.length === 0 && <EmptyStateNote>No matches for that search -- try a different name, ID, or keyword.</EmptyStateNote>}
          {results.map((item, i) => (
            <React.Fragment key={item.key + (item.dataType || "")}>
              {i === dataResults.length && recentItems.length > 0 && <div className="muted small" style={{ padding: "6px 14px 2px" }}>Recent</div>}
              {i === dataResults.length + recentItems.length && sectionResults.length > 0 && (recentItems.length > 0 || dataResults.length > 0) && <div className="muted small" style={{ padding: "6px 14px 2px" }}>All sections</div>}
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
            <tbody>{tableRows.map((r, i) => {
              const lastCell = r[r.length - 1];
              const isPending = lastCell === "pending";
              return (
                <React.Fragment key={i}>
                  <tr className="row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                    {r.map((cell, j) => { const cls = statusPillClass(cell); return <td key={j}>{cls ? <span className={`status-pill ${cls}`}>{cell}</span> : cell}</td>; })}
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
            })}</tbody>
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
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>{config.stats.map(([label, value], i) => (
            <div className="stat-mini enter" key={i} style={{ animationDelay: `${i * 60}ms` }}><div className="muted">{label}</div><div className="kpi-value" style={{ fontSize: 20 }}>{value}</div></div>
          ))}</div>
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
          {item.amount && <div className="cat-top"><span className="muted">Amount</span><span className="mono">{item.amount}</span></div>}
          <div className="cat-top"><span className="muted">Event ID</span><span className="mono">{item.eventId || "EVT-" + Math.floor(10000 + Math.random() * 89999)}</span></div>
        </div>
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

const ADMIN_USERS_LIST = [
  { id: "U1", name: "Jordan Blake", email: "jordan@example.com", orders: 34, joined: "2024" },
  { id: "U2", name: "Priya Menon", email: "priya@example.com", orders: 21, joined: "2024" },
  { id: "U3", name: "Devon King", email: "devon@example.com", orders: 12, joined: "2025" },
];

function AccountSuspendControl({ suspension, onSuspend, onUnsuspend }) {
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="field" style={{ marginTop: 16 }}>
      <span>Account status</span>
      {suspension ? (
        <div className="pending-row" style={{ marginTop: 4 }}>
          <div className="ti-mid"><div className="muted small">Suspended by {suspension.by}, {suspension.at}</div><div className="muted small">Reason: {suspension.reason}</div></div>
          <button className="ghost-btn-sm" onClick={onUnsuspend}>Restore access</button>
        </div>
      ) : confirming ? (
        <div style={{ marginTop: 6 }}>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for suspension (required)" style={{ width: "100%", marginBottom: 8 }} />
          <div className="cat-top" style={{ gap: 8 }}>
            <button className="ghost-btn-sm" onClick={() => { setConfirming(false); setReason(""); }}>Cancel</button>
            <button className="primary-btn-sm" style={{ background: "#DC2626" }} disabled={!reason.trim()} onClick={() => { onSuspend(reason.trim()); setConfirming(false); setReason(""); }}>Confirm suspension</button>
          </div>
        </div>
      ) : (
        <button className="primary-btn-sm" style={{ marginTop: 6, background: "#DC2626" }} onClick={() => setConfirming(true)}>Suspend this account</button>
      )}
    </div>
  );
}

function AdminUserDetailModal({ user, note, onSaveNote, viewAsLog, onViewAs, onClose, suspension, onSuspend, onUnsuspend }) {
  const [draft, setDraft] = useState(note || "");
  const [saved, setSaved] = useState(false);
  const save = () => { onSaveNote(user.id, draft); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  const impersonations = (viewAsLog || []).filter((l) => l.target === user.name);
  // A composite risk score -- suspension status weighs heaviest, with a
  // deterministic (not random-on-every-render) component derived from the
  // user id so it stays stable across re-opens, standing in for what would
  // be real signals (chargebacks, cancellation rate, etc.) on a real backend.
  const idHash = [...user.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100, 7);
  const riskScore = suspension ? 82 + (idHash % 15) : Math.min(35, idHash % 40);
  const riskLevel = riskScore >= 70 ? "High" : riskScore >= 35 ? "Medium" : "Low";
  const riskColor = riskScore >= 70 ? "#DC2626" : riskScore >= 35 ? "#F59E0B" : "#16A34A";
  // Estimated LTV -- avg order value derived deterministically from the
  // user id (stand-in for a real per-order revenue join), times their
  // actual order count. Labeled as estimated since it's not summed from
  // real order records.
  const avgOrderValue = 2200 + ([...user.id].reduce((s, c) => s + c.charCodeAt(0), 0) % 3800);
  const ltv = avgOrderValue * user.orders;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="muted small" style={{ marginBottom: 6 }}>Users <ChevronRight size={11} style={{ verticalAlign: "middle" }} /> {user.name}</div>
        <div className="driver-avatar" style={{ width: 44, height: 44, fontSize: 15, marginBottom: 10 }}>{user.name.split(" ").map((w) => w[0]).join("")}</div>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 2 }}>{user.name} {suspension && <span className="status-pill delay" style={{ marginLeft: 6 }}>Suspended</span>}</div>
        <div className="muted" style={{ marginBottom: 16 }}>{user.email}</div>
        <div className="cat-top" style={{ marginBottom: 12 }}>
          <span className="muted" title="Suspension status weighs heaviest, blended with a stable per-user factor standing in for real signals like chargebacks and cancellation rate.">Risk score <Info size={10} style={{ verticalAlign: "middle" }} /></span>
          <span className="status-pill" style={{ background: riskColor + "1A", color: riskColor, fontWeight: 700 }}>{riskLevel} ({riskScore})</span>
        </div>
        <div className="cat-top" style={{ marginBottom: 12 }}>
          <span className="muted" title="Average order value (estimated per user) multiplied by their real total order count. Not summed from actual per-order revenue records.">Estimated lifetime value <Info size={10} style={{ verticalAlign: "middle" }} /></span>
          <span className="mono" style={{ fontWeight: 700 }}>{money(ltv)}</span>
        </div>
        <div className="list-col">
          <div className="cat-top"><span className="muted">User ID</span><span className="mono">{user.id}</span></div>
          <div className="cat-top"><span className="muted">Total orders</span><span>{user.orders}</span></div>
          <div className="cat-top"><span className="muted">Joined</span><span>{user.joined}</span></div>
        </div>
        <button className="ghost-btn-sm" style={{ marginTop: 10 }} onClick={() => { onViewAs?.(user.name); onClose(); }}><Eye size={12} /> View as this user</button>
        <div className="field" style={{ marginTop: 16 }}>
          <span>Internal note -- staff only, not visible to the customer</span>
          <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. Flagged for repeat late-cancellation, be extra clear on ETAs" style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical" }} />
        </div>
        <button className="ghost-btn-sm" style={{ marginTop: 8 }} onClick={save}>{saved ? <><Check size={12} /> Saved</> : "Save note"}</button>
        <AccountSuspendControl suspension={suspension} onSuspend={(reason) => onSuspend(user.id, user.name, reason)} onUnsuspend={() => onUnsuspend(user.id, user.name)} />
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

function UsersSection({ logView, viewAsLog, onViewAs, suspensions, onSuspend, onUnsuspend }) {
  const [users, setUsers] = useState(ADMIN_USERS_LIST);
  const [viewUser, setViewUser] = useState(null);
  const [notes, setNotes] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [confirmBulk, setConfirmBulk] = useState(null); // "suspend" | "unsuspend" | null
  const [bulkReason, setBulkReason] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const fileRef = useRef(null);
  const saveNote = (id, text) => setNotes((n) => ({ ...n, [id]: text }));
  const toggleSelect = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const runBulkSuspend = () => { selected.forEach((id) => { const u = users.find((x) => x.id === id); if (u && !suspensions?.[`user:${id}`]) onSuspend("user", id, u.name, bulkReason.trim()); }); setSelected(new Set()); setConfirmBulk(null); setBulkReason(""); };
  const runBulkUnsuspend = () => { selected.forEach((id) => { const u = users.find((x) => x.id === id); if (u && suspensions?.[`user:${id}`]) onUnsuspend("user", id, u.name); }); setSelected(new Set()); setConfirmBulk(null); };
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result));
      const header = rows[0].map((h) => h.toLowerCase());
      const nameIdx = header.indexOf("name");
      const emailIdx = header.indexOf("email");
      if (nameIdx === -1 || emailIdx === -1) {
        setImportSummary({ error: true, text: "Couldn't read that file -- make sure it has \"Name\" and \"Email\" columns." });
        return;
      }
      let added = 0;
      let malformed = 0;
      const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));
      const newUsers = [];
      const skipped = [];
      rows.slice(1).forEach((row, i) => {
        if (row.length === 1 && row[0].trim() === "") return;
        if (row.length !== header.length) { malformed++; skipped.push(`Row ${i + 2}: column count didn't match the header -- check for an unquoted comma in a field`); return; }
        const name = row[nameIdx]?.trim();
        const email = row[emailIdx]?.trim();
        if (!name || !email) { skipped.push(`Row ${i + 2}: missing name or email`); return; }
        if (existingEmails.has(email.toLowerCase())) { skipped.push(`Row ${i + 2} (${name}): email already exists`); return; }
        newUsers.push({ id: `U${Date.now()}-${added}`, name, email, orders: 0, joined: new Date().getFullYear().toString() });
        existingEmails.add(email.toLowerCase());
        added++;
      });
      setUsers((u) => [...newUsers, ...u]);
      setImportSummary({ error: false, text: `Imported ${added} new user${added !== 1 ? "s" : ""}.`, skipped });
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  return (
    <div className="section-pad">
      {viewUser && <AdminUserDetailModal user={viewUser} note={notes[viewUser.id]} onSaveNote={saveNote} viewAsLog={viewAsLog} onViewAs={onViewAs} onClose={() => setViewUser(null)} suspension={suspensions?.[`user:${viewUser.id}`]} onSuspend={(id, name, reason) => onSuspend("user", id, name, reason)} onUnsuspend={(id, name) => onUnsuspend("user", id, name)} />}
      {confirmBulk && (
        <div className="modal-backdrop" onClick={() => setConfirmBulk(null)}>
          <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setConfirmBulk(null)}><X size={16} /></button>
            <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>{confirmBulk === "suspend" ? `Suspend ${selected.size} account(s)?` : `Unsuspend ${selected.size} account(s)?`}</div>
            <div className="muted small" style={{ marginBottom: 12 }}>This can't be undone in bulk -- you'd need to restore each one individually.</div>
            {confirmBulk === "suspend" && <input type="text" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} placeholder="Reason for suspension (required)" style={{ width: "100%", marginBottom: 12 }} />}
            <div className="cat-top" style={{ gap: 8 }}>
              <button className="ghost-btn-sm" onClick={() => setConfirmBulk(null)}>Cancel</button>
              <button className="primary-btn-sm" style={{ background: "#DC2626" }} disabled={confirmBulk === "suspend" && !bulkReason.trim()} onClick={confirmBulk === "suspend" ? runBulkSuspend : runBulkUnsuspend}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Users</div>
          <button className="ghost-btn-sm" onClick={() => fileRef.current?.click()}><Upload size={12} /> Bulk import (CSV)</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        </div>
        {importSummary && (
          <div className="muted small" style={{ marginBottom: 10 }}>
            <div style={{ color: importSummary.error ? "#DC2626" : "#16A34A" }}>{importSummary.text}</div>
            {importSummary.skipped && importSummary.skipped.length > 0 && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ cursor: "pointer" }}>{importSummary.skipped.length} row{importSummary.skipped.length !== 1 ? "s" : ""} skipped -- see why</summary>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  {importSummary.skipped.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
        {selected.size > 0 && <BulkBar count={selected.size} onApprove={() => setConfirmBulk("unsuspend")} onDeny={() => setConfirmBulk("suspend")} onClear={() => setSelected(new Set())} approveLabel="Unsuspend" denyLabel="Suspend" />}
        <table className="admin-table">
          <thead><tr><th></th><th>Name</th><th>Email</th><th>Orders</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                <td>{u.name} {notes[u.id] && <span title="Has an internal note" style={{ marginLeft: 4 }}><PenLine size={11} color="#7C3AED" style={{ verticalAlign: "middle" }} /></span>} {suspensions?.[`user:${u.id}`] && <span className="status-pill delay" style={{ marginLeft: 4 }}>Suspended</span>}</td><td className="muted">{u.email}</td><td className="mono">{u.orders}</td><td>{u.joined}</td>
                <td><button className="row-link" onClick={() => { setViewUser(u); logView?.("User", u.name, "users"); }}>View <ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ADMIN_RIDERS_LIST = [
  { id: "R1", name: "John Rider", vehicle: "Motorcycle", trips: 1284, rating: 4.92, status: "online" },
  { id: "R2", name: "Marcus T.", vehicle: "Bicycle", trips: 640, rating: 4.7, status: "offline" },
  { id: "R3", name: "Priya S.", vehicle: "Car", trips: 2103, rating: 4.95, status: "online" },
];

function AdminRiderDetailModal({ rider, onClose, suspension, onSuspend, onUnsuspend }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="driver-avatar" style={{ width: 44, height: 44, fontSize: 15, marginBottom: 10 }}>{rider.name.split(" ").map((w) => w[0]).join("")}</div>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 2 }}>{rider.name} {suspension && <span className="status-pill delay" style={{ marginLeft: 6 }}>Suspended</span>}</div>
        <div className="muted" style={{ marginBottom: 16 }}>{rider.vehicle}</div>
        <div className="list-col">
          <div className="cat-top"><span className="muted">Rider ID</span><span className="mono">{rider.id}</span></div>
          <div className="cat-top"><span className="muted">Total trips</span><span>{rider.trips}</span></div>
          <div className="cat-top"><span className="muted">Rating</span><span>{rider.rating}</span></div>
          <div className="cat-top"><span className="muted">Status</span><span className={`status-pill ${rider.status === "online" ? "done" : "prep"}`}>{rider.status}</span></div>
        </div>
        <AccountSuspendControl suspension={suspension} onSuspend={(reason) => onSuspend(rider.id, rider.name, reason)} onUnsuspend={() => onUnsuspend(rider.id, rider.name)} />
      </div>
    </div>
  );
}

function RidersSection({ suspensions, onSuspend, onUnsuspend, logView }) {
  const [riders, setRiders] = useState(ADMIN_RIDERS_LIST);
  const [viewRider, setViewRider] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const fileRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result));
      const header = rows[0].map((h) => h.toLowerCase());
      const nameIdx = header.indexOf("name");
      const vehicleIdx = header.indexOf("vehicle");
      if (nameIdx === -1) {
        setImportSummary({ error: true, text: "Couldn't read that file -- make sure it has a \"Name\" column." });
        return;
      }
      let added = 0;
      let malformed = 0;
      const existingNames = new Set(riders.map((r) => r.name.toLowerCase()));
      const newRiders = [];
      const skipped = [];
      rows.slice(1).forEach((row, i) => {
        if (row.length === 1 && row[0].trim() === "") return;
        if (row.length !== header.length) { malformed++; skipped.push(`Row ${i + 2}: column count didn't match the header -- check for an unquoted comma in a field`); return; }
        const name = row[nameIdx]?.trim();
        if (!name) { skipped.push(`Row ${i + 2}: missing name`); return; }
        if (existingNames.has(name.toLowerCase())) { skipped.push(`Row ${i + 2} (${name}): already exists`); return; }
        newRiders.push({ id: `R${Date.now()}-${added}`, name, vehicle: vehicleIdx > -1 ? row[vehicleIdx] || "Unspecified" : "Unspecified", trips: 0, rating: "--", status: "offline" });
        existingNames.add(name.toLowerCase());
        added++;
      });
      setRiders((r) => [...newRiders, ...r]);
      setImportSummary({ error: false, text: `Imported ${added} new rider${added !== 1 ? "s" : ""}.`, skipped });
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  return (
    <div className="section-pad">
      {viewRider && <AdminRiderDetailModal rider={viewRider} onClose={() => setViewRider(null)} suspension={suspensions?.[`rider:${viewRider.id}`]} onSuspend={(id, name, reason) => onSuspend("rider", id, name, reason)} onUnsuspend={(id, name) => onUnsuspend("rider", id, name)} />}
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Riders / Drivers</div>
          <button className="ghost-btn-sm" onClick={() => fileRef.current?.click()}><Upload size={12} /> Bulk import (CSV)</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        </div>
        {importSummary && (
          <div className="muted small" style={{ marginBottom: 10 }}>
            <div style={{ color: importSummary.error ? "#DC2626" : "#16A34A" }}>{importSummary.text}</div>
            {importSummary.skipped && importSummary.skipped.length > 0 && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ cursor: "pointer" }}>{importSummary.skipped.length} row{importSummary.skipped.length !== 1 ? "s" : ""} skipped -- see why</summary>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  {importSummary.skipped.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Vehicle</th><th>Trips</th><th>Rating</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {riders.map((r) => (
              <tr key={r.id}>
                <td>{r.name} {suspensions?.[`rider:${r.id}`] && <span className="status-pill delay" style={{ marginLeft: 4 }}>Suspended</span>}</td><td className="muted">{r.vehicle}</td><td className="mono">{r.trips}</td><td>{r.rating}</td>
                <td><span className={`status-pill ${r.status === "online" ? "done" : "prep"}`}>{r.status}</span></td>
                <td><button className="row-link" onClick={() => { setViewRider(r); logView?.("Rider", r.name, "riders"); }}>View <ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ADMIN_PAYOUTS_LIST = [
  { id: "P1", recipient: "Northside Espresso Bar", type: "Seller", amount: 128400, status: "paid", date: "Aug 18" },
  { id: "P2", recipient: "John Rider", type: "Rider", amount: 24600, status: "paid", date: "Aug 18" },
  { id: "P3", recipient: "Fresh Fields Grocery", type: "Seller", amount: 96200, status: "pending", date: "Aug 21" },
];

function PayoutsSettlementsSection() {
  const total = ADMIN_PAYOUTS_LIST.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row no-print"><div className="panel-title">Payouts & Settlements</div>
          <button className="ghost-btn-sm" onClick={() => window.print()}><FileDown size={12} /> Print report</button>
        </div>
        <div id="payouts-printable">
          <div className="print-only" style={{ display: "none", marginBottom: 14 }}>
            <div className="card-name" style={{ fontSize: 16 }}>Payouts & Settlements Report</div>
            <div className="muted small">Generated {new Date().toLocaleDateString()} -- {ADMIN_PAYOUTS_LIST.length} entries -- total {money(total)}</div>
          </div>
          <table className="admin-table">
            <thead><tr><th>Recipient</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {ADMIN_PAYOUTS_LIST.map((p) => (
                <tr key={p.id}>
                  <td>{p.recipient}</td><td className="muted">{p.type}</td><td className="mono">{money(p.amount)}</td><td className="muted">{p.date}</td>
                  <td><span className={`status-pill ${p.status === "paid" ? "done" : "prep"}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div className="panel enter"><div className="skel-line" style={{ width: "35%" }} /><div className="skel-block" style={{ height: 170 }} /></div>
      <div className="panel enter"><div className="skel-line" style={{ width: "30%" }} /><div className="skel-block" /></div>
    </div>
  );
}

// Rough scale factor per date-range preset, applied to the flow metrics
// (revenue/orders) so picking a range actually changes the numbers instead
// of just relabeling the button. Snapshot metrics (Total Users, Active
// Riders/Sellers, Pending Verifications) are deliberately left unscaled --
// those describe a point in time, not a period, so they shouldn't move
// just because you changed the date filter.
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

function OverviewSection({ onNavigate, recentlyViewed, onboardingSteps, dateRange }) {
  const [detailItem, setDetailItem] = useState(null);
  const [revPeriod, setRevPeriod] = useState("week");
  const [revOpen, setRevOpen] = useState(false);
  const [comparePeriod, setComparePeriod] = useState("week");
  const ONBOARDING_STEPS = [
    { key: "sellers", label: "Review a pending seller application", nav: "sellers" },
    { key: "kyc", label: "Review a pending KYC verification", nav: "kyc" },
    { key: "payouts", label: "Check the Payouts & Settlements section", nav: "payouts" },
  ];
  const onboardingDone = onboardingSteps ? ONBOARDING_STEPS.filter((s) => onboardingSteps.has(s.key)).length : 0;
  return (
    <div className="section-pad">
      {onboardingSteps && onboardingDone < ONBOARDING_STEPS.length && (
        <div className="panel enter" style={{ background: "linear-gradient(160deg,#F3EEFF,#fff)", border: "1px solid #DDD6FE" }}>
          <div className="panel-title-row"><div className="panel-title">Getting started</div><span className="muted small">{onboardingDone}/{ONBOARDING_STEPS.length}</span></div>
          <div className="bar-track" style={{ marginBottom: 10 }}><div className="bar-fill-h" style={{ width: `${(onboardingDone / ONBOARDING_STEPS.length) * 100}%`, background: "var(--purple)" }} /></div>
          <div className="list-col">
            {ONBOARDING_STEPS.map((s) => {
              const done = onboardingSteps.has(s.key);
              return (
                <button key={s.key} className="flag-row" onClick={() => onNavigate(s.nav)} disabled={done}>
                  {done ? <CircleCheck size={14} color="#16A34A" /> : <Circle size={14} />}
                  <div className="ti-mid"><div className="card-name" style={{ fontSize: 12.5, textDecoration: done ? "line-through" : "none" }}>{s.label}</div></div>
                  {!done && <ChevronRight size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
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
      <div className="row-3col-uneven">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Order Overview</div><button className="link-btn" onClick={() => onNavigate("orders")}>View All Orders</button></div>
          <div className="donut-row">
            <div className="donut-wrap">
              <PieChart width={120} height={120}>
                <Pie data={ORDER_MIX} dataKey="value" cx={60} cy={60} innerRadius={38} outerRadius={56} paddingAngle={2} stroke="none">
                  {ORDER_MIX.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
              <div className="donut-center"><div className="donut-num">24,850</div><div className="muted">Total Orders</div></div>
            </div>
            <div className="donut-legend">
              {ORDER_MIX.map((d) => <div className="legend-row" key={d.name}><span className="legend-dot" style={{ background: d.color }} /><span className="legend-name">{d.name}</span><span className="legend-val">{d.display}</span></div>)}
            </div>
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
          <div className="rev-big">{money(revPeriod === "week" ? 15680250 : 14269028)}<span className="rev-delta"><ArrowUp size={12} /> {revPeriod === "week" ? "18.6%" : "10.1%"}</span></div>
          <div className="muted" style={{ marginBottom: 8 }}>Total Revenue</div>
          <div style={{ width: "100%", height: 170 }}>
            <ResponsiveContainer>
              <AreaChart data={revPeriod === "week" ? REVENUE_TREND : LAST_WEEK_REVENUE_TREND} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs><linearGradient id="adFillRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity={0.35} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#EEF0F4" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#9AA3B2" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9AA3B2" }} axisLine={false} tickLine={false} width={30} tickFormatter={(v) => `₦${(v / 1000000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} formatter={(v) => [money(v), "Revenue"]} />
                <Area type="monotone" dataKey="v" stroke="#4F46E5" strokeWidth={2.5} fill="url(#adFillRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Recent Activities</div><button className="link-btn" onClick={() => onNavigate("notifications")}>View All</button></div>
          <div className="activity-list">
            {RECENT_ACTIVITY.map((a, i) => (
              <button className="activity-row row-enter activity-clickable" key={i} style={{ animationDelay: `${i * 40}ms` }} onClick={() => setDetailItem(a)}>
                <div className="activity-icon" style={{ background: a.color + "1A", color: a.color }}><a.icon size={14} /></div>
                <div className="ti-mid"><div className="card-name">{a.title}</div><div className="muted">{a.sub}</div></div>
                <div style={{ textAlign: "right" }}>{a.amount && <div className="mono" style={{ fontSize: 11.5 }}>{a.amount}</div>}<div className="muted small">{a.time}</div></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="row-4col-even">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Top Selling Categories</div><button className="link-btn" onClick={() => onNavigate("categories")}>View All</button></div>
          <div className="list-col">
            {TOP_CATEGORIES.map((c) => (
              <div key={c.label} className="cat-row">
                <div className="cat-top"><span className="card-name">{c.label}</span><span className="mono">{c.value}</span></div>
                <div className="bar-track"><div className="bar-fill-h" style={{ width: `${c.pct}%`, background: c.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Pending Verifications</div><button className="link-btn" onClick={() => onNavigate("kyc")}>View All</button></div>
          <div className="list-col">
            {PENDING_VERIFICATIONS.map((p) => (
              <div className="pending-row" key={p.label}>
                <div className="pending-icon" style={{ background: p.color + "1A", color: p.color }}><p.icon size={14} /></div>
                <div className="ti-mid card-name">{p.label}</div><div className="mono">{p.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Support Overview</div><button className="link-btn" onClick={() => onNavigate("tickets")}>View All</button></div>
          <div className="list-col">
            {SUPPORT_OVERVIEW.map((p) => (
              <div className="pending-row" key={p.label}>
                <div className="pending-icon" style={{ background: p.color + "1A", color: p.color }}><p.icon size={14} /></div>
                <div className="ti-mid card-name">{p.label}</div><div className="mono">{p.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel enter sos-panel">
          <div className="panel-title-row"><div className="panel-title">SOS & Safety</div><button className="link-btn" onClick={() => onNavigate("sos")}>View All</button></div>
          <div className="sos-alert"><ShieldAlert size={18} /><div><div className="sos-num">7</div><div className="muted">Require immediate attention</div></div></div>
          <div className="list-col" style={{ marginTop: 12 }}>
            <div className="pending-row"><div className="ti-mid muted">Resolved Today</div><div className="mono">12</div></div>
            <div className="pending-row"><div className="ti-mid muted">Total This Week</div><div className="mono">19</div></div>
          </div>
        </div>
      </div>

      <div className="row-2col">
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Revenue by Payment Method</div><button className="link-btn" onClick={() => onNavigate("payments")}>View Report</button></div>
          <div className="list-col">
            {PAYMENT_METHODS.map((m) => (
              <div key={m.label} className="pm-row">
                <div className="pm-icon" style={{ background: m.color + "1A", color: m.color }}><CreditCard size={13} /></div>
                <div className="pm-mid">
                  <div className="cat-top"><span className="card-name">{m.label}</span><span className="mono">{m.value} <span className="muted">{m.pct}%</span></span></div>
                  <div className="bar-track"><div className="bar-fill-h" style={{ width: `${m.pct}%`, background: m.color }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel enter">
          <div className="panel-title">System Overview</div>
          <div className="health-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {SYSTEM_OVERVIEW.map((s) => (
              <div className="health-tile" key={s.label}>
                <div className="health-icon" style={{ background: s.color + "1A", color: s.color }}><s.icon size={14} /></div>
                <div className="health-val">{s.value}</div>
                <div className="muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CURRENT_ADMIN_NAME = "Admin User";

function draftTicketReplySuggestion(subject, priority) {
  const t = (subject || "").toLowerCase();
  if (t.includes("missing") || t.includes("wrong item")) return "I'm sorry about that -- I can see the order details here. Let me arrange a refund or replacement for the missing item right away.";
  if (t.includes("late") || t.includes("delay") || t.includes("detour") || t.includes("where")) return "Sorry for the trouble -- I'm pulling up the live tracking now and will follow up with an update shortly.";
  if (t.includes("refund")) return "Thanks for flagging this -- I can see the refund request. Let me check the status and get it moving for you.";
  if (t.includes("damaged") || t.includes("broken")) return "So sorry to hear that arrived damaged. I'll get a replacement or refund started for you right now.";
  if (t.includes("driver") || t.includes("rider")) return "Thanks for the report -- I'm looking into this with the rider now and will make sure it's addressed.";
  if (t.includes("cancel")) return "I can help with that -- let me pull up the order and walk you through the cancellation options.";
  if (priority === "high") return "Thanks for your patience -- I've prioritized this and I'm looking into it right now.";
  return "Thanks for reaching out -- I'm looking into this now and will get back to you shortly.";
}

const LIVE_CHATS_SEED = [
  { id: "LC1", customer: "Jordan B.", status: "waiting", assignedTo: null, messages: [{ from: "customer", text: "Hi, my order hasn't updated in 20 minutes", time: "2 min ago" }] },
  { id: "LC2", customer: "Casey W.", status: "active", assignedTo: "Sasha Ade", messages: [{ from: "customer", text: "Can I change my delivery address?", time: "5 min ago" }, { from: "agent", text: "Let me check that for you.", time: "4 min ago" }] },
  { id: "LC3", customer: "Riley N.", status: "waiting", assignedTo: null, messages: [{ from: "customer", text: "My payment failed twice trying to check out", time: "6 min ago" }] },
];

function LiveChatSection({ logView }) {
  const [chats, setChats] = useState(LIVE_CHATS_SEED);
  const [selectedId, setSelectedId] = useState(LIVE_CHATS_SEED[0].id);
  const [input, setInput] = useState("");
  const selected = chats.find((c) => c.id === selectedId);
  const lockedByOther = selected.assignedTo && selected.assignedTo !== CURRENT_ADMIN_NAME;
  const selectChat = (c) => { setSelectedId(c.id); logView?.("Live chat", c.customer, "live-chat"); };
  const pickUp = () => setChats((cs) => cs.map((c) => c.id === selectedId ? { ...c, status: "active", assignedTo: CURRENT_ADMIN_NAME } : c));
  const send = () => {
    if (!input.trim() || lockedByOther) return;
    setChats((cs) => cs.map((c) => c.id === selectedId ? { ...c, status: "active", assignedTo: c.assignedTo || CURRENT_ADMIN_NAME, messages: [...c.messages, { from: "agent", text: input.trim(), time: "Just now" }] } : c));
    setInput("");
  };
  const endChat = () => setChats((cs) => cs.map((c) => c.id === selectedId ? { ...c, status: "closed" } : c));
  const suggest = () => {
    const lastCustomerMsg = [...selected.messages].reverse().find((m) => m.from === "customer");
    setInput(draftTicketReplySuggestion(lastCustomerMsg?.text, "normal"));
  };
  return (
    <div className="section-pad" style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <div className="panel enter" style={{ flex: 1, maxWidth: 320 }}>
        <div className="panel-title">Live conversations</div>
        <div className="list-col">
          {chats.map((c) => (
            <button key={c.id} className={`ticket-item ${selectedId === c.id ? "active" : ""}`} onClick={() => selectChat(c)}>
              <div className="ti-mid"><div className="card-name">{c.customer}</div><div className="muted small">{c.status === "waiting" ? "Waiting" : c.status === "active" ? `With ${c.assignedTo === CURRENT_ADMIN_NAME ? "you" : c.assignedTo}` : "Closed"}</div></div>
              <span className={`status-pill ${c.status === "waiting" ? "delay" : c.status === "active" ? "done" : ""}`}>{c.status}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel enter" style={{ flex: 1.4 }}>
        <div className="panel-title-row">
          <div className="panel-title">{selected.customer}</div>
          {selected.status === "waiting" && <button className="ghost-btn-sm" onClick={pickUp}>Pick up chat</button>}
          {selected.status === "active" && selected.assignedTo === CURRENT_ADMIN_NAME && <button className="ghost-btn-sm" onClick={endChat}>End chat</button>}
        </div>
        {lockedByOther && <div className="muted small" style={{ color: "#DC2626", marginBottom: 8 }}>Being handled by {selected.assignedTo} -- you can watch, but can't reply here.</div>}
        <div className="list-col" style={{ marginBottom: 10 }}>
          {selected.messages.map((m, i) => (
            <div key={i} className="pending-row" style={{ justifyContent: m.from === "agent" ? "flex-end" : "flex-start" }}>
              <div className="ti-mid"><div className="muted small">{m.from === "agent" ? "You" : selected.customer} -- {m.time}</div><div>{m.text}</div></div>
            </div>
          ))}
        </div>
        {selected.status !== "closed" ? (
          <>
            {!lockedByOther && <button className="ghost-btn-sm" style={{ marginBottom: 8 }} onClick={suggest}><Sparkles size={12} /> Suggest a reply</button>}
            <div className="reply-row">
              <input placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} disabled={lockedByOther} />
              <button className="primary-btn-sm" onClick={send} disabled={lockedByOther}>Send</button>
            </div>
          </>
        ) : (
          <div className="muted small">This conversation is closed.</div>
        )}
      </div>
    </div>
  );
}

const CANNED_RESPONSES = [
  { label: "Refund processed", text: "Thanks for your patience -- your refund has been processed and should reflect in your original payment method within 3-5 business days." },
  { label: "Escalated to fulfillment", text: "I've escalated this to our fulfillment team for a closer look. I'll follow up here as soon as I hear back." },
  { label: "Apology + discount", text: "I'm really sorry for the inconvenience this caused. As an apology, I've applied a discount to your account for your next order." },
  { label: "Order delayed", text: "Your order is running a bit behind schedule due to high demand right now -- it's still on its way, and I'll keep an eye on it for you." },
  { label: "Need more info", text: "Thanks for reaching out! Could you share a bit more detail (order number, and what you're seeing on your end) so I can look into this properly?" },
  { label: "Resolved, closing", text: "Glad we could sort this out! I'm marking this ticket resolved -- feel free to reach back out if anything else comes up." },
];

function TicketsSection({ onViewAs, logView, onReplySent }) {
  const [tickets, setTickets] = useState(TICKETS);
  const [selected, setSelected] = useState(TICKETS[0]);
  const [reply, setReply] = useState(""); 
  const [threads, setThreads] = useState({});
  const [resolveNote, setResolveNote] = useState("");
  const selectTicket = (t) => { setSelected(t); logView?.("Ticket", `${t.id} -- ${t.customer}`, "tickets"); };
  const lockedByOther = selected.lockedBy && selected.lockedBy.name !== CURRENT_ADMIN_NAME;
  const claim = () => {
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setTickets((ts) => ts.map((t) => (t.id === selected.id ? { ...t, lockedBy: { name: CURRENT_ADMIN_NAME, since: now } } : t)));
    setSelected((s) => ({ ...s, lockedBy: { name: CURRENT_ADMIN_NAME, since: now } }));
  };
  const sendReply = () => {
    if (!reply.trim() || lockedByOther) return;
    if (!selected.lockedBy) claim();
    setThreads((t) => ({ ...t, [selected.id]: [...(t[selected.id] || []), reply] }));
    setReply("");
    onReplySent?.();
  };
  const resolve = () => {
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const resolvedInfo = { by: CURRENT_ADMIN_NAME, at: `Today, ${now}`, note: resolveNote.trim() || "No notes added." };
    setTickets((ts) => ts.map((t) => (t.id === selected.id ? { ...t, resolved: resolvedInfo, lockedBy: null } : t)));
    setSelected((s) => ({ ...s, resolved: resolvedInfo, lockedBy: null }));
    setResolveNote("");
  };
  const suggestTicketReply = () => setReply(draftTicketReplySuggestion(selected.subject, selected.priority));
  return (
    <div className="section-pad" style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <div className="panel enter" style={{ flex: 1, maxWidth: 340 }}>
        <div className="panel-title">Support queue</div>
        <div className="list-col">
          {tickets.map((t) => {
            const slaLimit = SLA_MINUTES[t.priority];
            const overSla = t.minutesOpen > slaLimit;
            return (
              <button key={t.id} className={`ticket-item ${selected.id === t.id ? "active" : ""}`} onClick={() => selectTicket(t)}>
                <span className={`priority-dot ${t.priority}`} />
                <div className="ti-mid">
                  <div className="card-name">{t.customer} {t.resolved && <span className="status-pill done">Resolved</span>} {t.lockedBy && !t.resolved && <span className="status-pill prep">{t.lockedBy.name === CURRENT_ADMIN_NAME ? "You" : t.lockedBy.name}</span>}</div>
                  <div className="muted">{t.subject}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="muted small">{t.time}</div>
                  {overSla && !t.resolved && <div className="sla-breach">SLA breached</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="panel enter" style={{ flex: 1.4 }}>
        <div className="panel-title-row"><div className="panel-title">{selected.id} -- {selected.customer}</div><button className="ghost-btn-sm" onClick={() => onViewAs(selected.customer)}><Eye size={12} /> View as customer</button></div>
        <div className={`sla-readout ${selected.minutesOpen > SLA_MINUTES[selected.priority] ? "breached" : ""}`}>
          <Clock size={13} /> Open {selected.minutesOpen} min -- SLA target {SLA_MINUTES[selected.priority]} min for {selected.priority} priority
          {selected.minutesOpen > SLA_MINUTES[selected.priority] ? <span className="status-pill delay">Breached by {selected.minutesOpen - SLA_MINUTES[selected.priority]} min</span> : <span className="status-pill done">On track</span>}
        </div>
        {selected.resolved && (
          <div className="cap-warning-banner" style={{ background: "#EEF7F0", color: "#16A34A" }}>
            <CheckCircle2 size={13} /> Resolved by {selected.resolved.by} -- {selected.resolved.at}. {selected.resolved.note}
          </div>
        )}
        {lockedByOther && !selected.resolved && (
          <div className="cap-warning-banner">
            <Lock size={13} /> Currently being handled by {selected.lockedBy.name} -- opened {selected.lockedBy.since}. You can view this ticket but can't reply or resolve it while it's locked.
          </div>
        )}
        {!selected.resolved && !lockedByOther && selected.lockedBy && selected.lockedBy.name === CURRENT_ADMIN_NAME && (
          <div className="muted small" style={{ marginBottom: 10 }}><Lock size={11} style={{ verticalAlign: "middle" }} /> Locked to you since {selected.lockedBy.since}.</div>
        )}
        <div className="msg-bubble">{selected.subject}</div>
        {(threads[selected.id] || []).map((msg, i) => <div key={i} className="msg-bubble reply">{msg}</div>)}
        {!selected.resolved && (
          <>
            {!lockedByOther && <button className="ghost-btn-sm" style={{ marginTop: 10, marginBottom: -4 }} onClick={suggestTicketReply}><Sparkles size={12} /> Suggest a reply</button>}
            {!lockedByOther && (
              <select className="sort-select" style={{ marginTop: 8, marginBottom: -4 }} value="" onChange={(e) => { if (e.target.value) setReply(e.target.value); }}>
                <option value="">Insert a canned response...</option>
                {CANNED_RESPONSES.map((r) => <option key={r.label} value={r.text}>{r.label}</option>)}
              </select>
            )}
            <div className="reply-row">
              <input placeholder="Type a reply..." value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} disabled={lockedByOther} />
              <button className="primary-btn-sm" onClick={sendReply} disabled={lockedByOther}>Reply</button>
            </div>
            {!lockedByOther && (
              <div style={{ marginTop: 12 }}>
                <input className="resolve-note-input" type="text" placeholder="Resolution notes (what did you do?)" value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} />
                <button className="ghost-btn-sm" style={{ marginTop: 8 }} onClick={resolve}><CheckCircle2 size={12} /> Mark resolved</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BulkBar({ count, onApprove, onDeny, onClear, approveLabel = "Approve", denyLabel = "Reject" }) {
  if (count === 0) return null;
  return (
    <div className="bulk-bar">
      <span className="card-name">{count} selected</span>
      <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
        <button className="ghost-btn-sm" onClick={onDeny}>{denyLabel}</button>
        <button className="primary-btn-sm" onClick={onApprove}>{approveLabel}</button>
        <button className="ghost-btn-sm" onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}

function DisputesSection() {
  const [items, setItems] = useState(DISPUTES);
  const [resolvedLog, setResolvedLog] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const unlockedItems = items.filter((d) => !d.lockedBy || d.lockedBy.name === CURRENT_ADMIN_NAME);
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (s.size === unlockedItems.length ? new Set() : new Set(unlockedItems.map((d) => d.id))));

  const resolveOne = (d, decision) => {
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setItems((it) => it.filter((x) => x.id !== d.id));
    setResolvedLog((log) => [{ ...d, decision, resolvedBy: CURRENT_ADMIN_NAME, resolvedAt: `Today, ${now}` }, ...log]);
    setSelected((s) => { const n = new Set(s); n.delete(d.id); return n; });
  };
  const bulkResolve = (decision) => {
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const toResolve = items.filter((d) => selected.has(d.id));
    setResolvedLog((log) => [...toResolve.map((d) => ({ ...d, decision, resolvedBy: CURRENT_ADMIN_NAME, resolvedAt: `Today, ${now}` })), ...log]);
    setItems((it) => it.filter((d) => !selected.has(d.id)));
    setSelected(new Set());
  };

  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Refund disputes</div>
        {items.length === 0 && <EmptyStateNote>All disputes resolved.</EmptyStateNote>}
        {unlockedItems.length > 0 && (
          <div className="cat-top" style={{ marginBottom: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={selected.size === unlockedItems.length && unlockedItems.length > 0} onChange={toggleAll} /> <span className="muted">Select all</span></label>
          </div>
        )}
        <BulkBar count={selected.size} onApprove={() => bulkResolve("approved")} onDeny={() => bulkResolve("denied")} onClear={() => setSelected(new Set())} approveLabel="Approve refunds" denyLabel="Reject" />
        <div className="list-col">
          {items.map((d) => {
            const lockedByOther = d.lockedBy && d.lockedBy.name !== CURRENT_ADMIN_NAME;
            return (
              <div className="pending-row" key={d.id}>
                <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleSel(d.id)} disabled={lockedByOther} />
                <div className="pending-icon" style={{ background: "#FEF2F2", color: "#DC2626" }}><AlertTriangle size={14} /></div>
                <div className="ti-mid">
                  <div className="card-name">{d.customer} -- Order {d.order} {lockedByOther && <span className="status-pill prep">{d.lockedBy.name}</span>}</div>
                  <div className="muted">{d.reason}{lockedByOther && ` -- being handled since ${d.lockedBy.since}`}</div>
                </div>
                <div className="mono">{money(d.amount)}</div>
                <button className="round-btn deny" disabled={lockedByOther} onClick={() => resolveOne(d, "denied")}><X size={13} /></button>
                <button className="round-btn approve" disabled={lockedByOther} onClick={() => resolveOne(d, "approved")}><Check size={13} /></button>
              </div>
            );
          })}
        </div>
      </div>
      {(items.length > 0 || resolvedLog.length > 0) && (() => {
        const all = [...items.map((d) => ({ reason: d.reason, decision: null })), ...resolvedLog.map((d) => ({ reason: d.reason, decision: d.decision }))];
        const byReason = {};
        all.forEach((d) => {
          if (!byReason[d.reason]) byReason[d.reason] = { total: 0, approved: 0, denied: 0 };
          byReason[d.reason].total++;
          if (d.decision === "approved") byReason[d.reason].approved++;
          if (d.decision === "denied") byReason[d.reason].denied++;
        });
        return (
          <div className="panel enter">
            <div className="panel-title" style={{ fontSize: 13 }}>Refund reason trends</div>
            <div className="list-col">
              {Object.entries(byReason).sort((a, b) => b[1].total - a[1].total).map(([reason, s]) => (
                <div key={reason} className="cat-top">
                  <span className="muted small">{reason}</span>
                  <span className="muted small">{s.total} total{(s.approved + s.denied) > 0 ? ` -- ${s.approved} approved, ${s.denied} denied` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {(items.length > 0 || resolvedLog.length > 0) && (() => {
        const all = [...items, ...resolvedLog];
        const byProduct = {};
        all.forEach((d) => {
          if (!d.product) return;
          byProduct[d.product] = (byProduct[d.product] || 0) + 1;
        });
        const sorted = Object.entries(byProduct).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return null;
        return (
          <div className="panel enter">
            <div className="panel-title" style={{ fontSize: 13 }}>Complaint patterns by product</div>
            <div className="muted small" style={{ marginBottom: 10 }}>{sorted[0][0]} is generating the most complaints -- worth a closer look with the seller.</div>
            <div className="list-col">
              {sorted.map(([product, count]) => (
                <div key={product} className="cat-top">
                  <span className="muted small">{product}</span>
                  <span className="mono small">{count} complaint{count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      {resolvedLog.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Recently resolved</div>
          <div className="list-col">
            {resolvedLog.map((d, i) => (
              <div className="pending-row" key={i}>
                <div className="pending-icon" style={{ background: d.decision === "approved" ? "#EEF7F0" : "#FEF2F2", color: d.decision === "approved" ? "#16A34A" : "#DC2626" }}>{d.decision === "approved" ? <Check size={14} /> : <X size={14} />}</div>
                <div className="ti-mid"><div className="card-name">{d.customer} -- Order {d.order}</div><div className="muted small">{d.decision === "approved" ? "Refund approved" : "Refund rejected"} by {d.resolvedBy} -- {d.resolvedAt}</div></div>
                <div className="mono">{money(d.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const img = (seed, size = 300) => `https://picsum.photos/seed/${seed}/${size}/${size}`;
const ADMIN_PRODUCT_OVERSIGHT = [
  { id: "ap1", name: "Wireless Earbuds Pro", seller: "Ridgeview Electronics", category: "Electronics", price: 7999, stock: 24, image: null },
  { id: "ap2", name: "Espresso Machine", seller: "Ridgeview Electronics", category: "Home", price: 24900, stock: 9, image: null },
  { id: "ap3", name: "Running Sneakers", seller: "Runwell Sneaker Co.", category: "Fashion", price: 8999, stock: 31, image: null },
  { id: "ap4", name: "Cold Brew Concentrate", seller: "Northside Espresso Bar", category: "Groceries", price: 1299, stock: 24, image: null },
  { id: "ap5", name: "Ceramic Vase Set", seller: "Ceramic & Co.", category: "Home", price: 5400, stock: 12, image: null },
];

function ProductOversightSection() {
  const [products, setProducts] = useState(ADMIN_PRODUCT_OVERSIGHT);
  const [selected, setSelected] = useState(new Set());
  const [migrateTo, setMigrateTo] = useState("");
  const fileRefs = useRef({});
  const categories = [...new Set(products.map((p) => p.category))];
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const migrateCategory = () => {
    if (!migrateTo.trim()) return;
    setProducts((ps) => ps.map((p) => selected.has(p.id) ? { ...p, category: migrateTo.trim() } : p));
    setSelected(new Set());
    setMigrateTo("");
  };
  const handlePhoto = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, image: reader.result } : p)));
    reader.readAsDataURL(file);
  };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Products</div><span className="muted small">Moderate listing photos across every seller</span></div>
        {selected.size > 0 && (
          <div className="cat-top" style={{ marginBottom: 10, gap: 8 }}>
            <span className="muted small">{selected.size} selected</span>
            <select className="sort-select" value={migrateTo} onChange={(e) => setMigrateTo(e.target.value)}>
              <option value="">Move to category...</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="primary-btn-sm" disabled={!migrateTo} onClick={migrateCategory}>Migrate</button>
            <button className="ghost-btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}
        <div className="feature-grid">
          {products.map((p) => (
            <div key={p.id} className="feature-card">
              <div className="cat-top" style={{ marginBottom: 6 }}><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSel(p.id)} /></div>
              <div className="product-photo-wrap">
                <img src={p.image || img(p.id)} alt={p.name} className="product-photo" />
                <input type="file" accept="image/*" style={{ display: "none" }} ref={(el) => (fileRefs.current[p.id] = el)} onChange={(e) => handlePhoto(p.id, e)} />
                <button className="product-photo-edit" onClick={() => fileRefs.current[p.id]?.click()}><ImageIcon size={12} /> Change photo</button>
              </div>
              <div className="feature-top"><div className="card-name">{p.name}</div><span className="status-pill done">{p.stock} in stock</span></div>
              <div className="muted">{p.seller} -- {p.category}</div>
              <div className="cat-top" style={{ marginTop: 8 }}><span className="mono">{money(p.price)}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ADMIN_ACTIVE_SELLERS = [
  { id: "S1", name: "Northside Espresso Bar", category: "Grocery & Cafe", orders: 812, rating: 4.8, status: "active" },
  { id: "S2", name: "Fresh Fields Grocery", category: "Groceries", orders: 1204, rating: 4.6, status: "active" },
  { id: "S3", name: "Bright Pharmacy", category: "Pharmacy", orders: 640, rating: 4.9, status: "active" },
];

function AdminSellerDetailModal({ seller, onClose, suspension, onSuspend, onUnsuspend }) {
  // Performance scorecard -- deterministic per-seller (not random-per-render)
  // cancellation rate and response time standing in for real operational
  // data, combined with the actual rating into one letter grade.
  const idHash = [...seller.id].reduce((s, c) => s + c.charCodeAt(0), 7);
  const cancellationRate = (idHash % 12) / 2; // 0-5.5%
  const avgResponseMin = 15 + (idHash % 90); // 15-104 min
  const ratingScore = (parseFloat(seller.rating) || 4) / 5 * 100;
  const cancellationScore = Math.max(0, 100 - cancellationRate * 12);
  const responseScore = Math.max(0, 100 - avgResponseMin / 2);
  const composite = Math.round((ratingScore * 0.5 + cancellationScore * 0.25 + responseScore * 0.25));
  const grade = composite >= 90 ? "A" : composite >= 75 ? "B" : composite >= 60 ? "C" : "D";
  const gradeColor = grade === "A" ? "#16A34A" : grade === "B" ? "#2563EB" : grade === "C" ? "#F59E0B" : "#DC2626";
  // Churn risk -- a real (if simplified) trend signal: compare recent vs.
  // prior order pace using a deterministic-per-seller trend factor, since
  // this prototype doesn't track real week-over-week order history per seller.
  const trendFactor = ((idHash * 7) % 40) - 20; // -20% to +19% swing
  const churnRisk = trendFactor <= -12 ? "High" : trendFactor <= -5 ? "Watch" : "Low";
  const churnColor = churnRisk === "High" ? "#DC2626" : churnRisk === "Watch" ? "#F59E0B" : "#16A34A";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="driver-avatar" style={{ width: 44, height: 44, fontSize: 15, marginBottom: 10 }}><Store size={18} /></div>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 2 }}>{seller.name} {suspension && <span className="status-pill delay" style={{ marginLeft: 6 }}>Suspended</span>}</div>
        <div className="muted" style={{ marginBottom: 16 }}>{seller.category}</div>
        <div className="cat-top" style={{ marginBottom: 12 }}>
          <span className="muted" title="Rating (50%), cancellation rate (25%), and response time (25%) combined into one letter grade.">Performance grade <Info size={10} style={{ verticalAlign: "middle" }} /></span>
          <span className="status-pill" style={{ background: gradeColor + "1A", color: gradeColor, fontWeight: 700, fontSize: 14 }}>{grade} ({composite})</span>
        </div>
        <div className="cat-top" style={{ marginBottom: 12 }}>
          <span className="muted" title="Based on recent order-volume trend vs. prior period. A stand-in for real week-over-week order history until that's tracked per seller.">Churn risk <Info size={10} style={{ verticalAlign: "middle" }} /></span>
          <span className="status-pill" style={{ background: churnColor + "1A", color: churnColor, fontWeight: 700 }}>{churnRisk} ({trendFactor > 0 ? "+" : ""}{trendFactor}% orders)</span>
        </div>
        <div className="list-col">
          <div className="cat-top"><span className="muted">Seller ID</span><span className="mono">{seller.id}</span></div>
          <div className="cat-top"><span className="muted">Total orders</span><span>{seller.orders}</span></div>
          <div className="cat-top"><span className="muted">Rating</span><span>{seller.rating}</span></div>
          <div className="cat-top"><span className="muted">Cancellation rate</span><span>{cancellationRate.toFixed(1)}%</span></div>
          <div className="cat-top"><span className="muted">Avg. response time</span><span>{avgResponseMin} min</span></div>
        </div>
        <AccountSuspendControl suspension={suspension} onSuspend={(reason) => onSuspend(seller.id, seller.name, reason)} onUnsuspend={() => onUnsuspend(seller.id, seller.name)} />
      </div>
    </div>
  );
}

const KYC_APPLICATIONS_SEED = [
  { id: "KYC1", applicant: "Bright Pharmacy", type: "Seller", document: "Business license", submitted: "2 days ago", status: "pending" },
  { id: "KYC2", applicant: "LifeCare Store", type: "Seller", document: "Business license", submitted: "3 days ago", status: "verified" },
  { id: "KYC3", applicant: "Devon K.", type: "Rider", document: "Driver's license", submitted: "1 day ago", status: "pending" },
];
const FRAUD_FLAGS_SEED = [
  { id: "FR1", account: "Devon King", type: "Order velocity", detail: "6 orders placed within 20 minutes -- unusual for this account's history", severity: "high", status: "open" },
  { id: "FR2", account: "New signup -- kelechi88@example.com", type: "New account, high spend", detail: "\u20a685,000 spent within 2 hours of account creation", severity: "high", status: "open" },
  { id: "FR3", account: "Priya Menon", type: "Address mismatch", detail: "Delivery address differs from saved address and payment billing region", severity: "medium", status: "open" },
  { id: "FR4", account: "Jordan Blake", type: "Repeated failed payment", detail: "3 declined card attempts before a successful charge", severity: "low", status: "dismissed" },
];
function FraudFlagsSection() {
  const [flags, setFlags] = useState(FRAUD_FLAGS_SEED);
  const decide = (id, status) => setFlags((f) => f.map((x) => x.id === id ? { ...x, status } : x));
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Fraud & Risk Flags</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Simulated heuristics for this prototype phase -- order velocity, new-account spend spikes, address mismatches, and repeated payment failures. A real backend would compute these from live order/payment events.</div>
        <table className="admin-table">
          <thead><tr><th>Account</th><th>Flag type</th><th>Detail</th><th>Severity</th><th>Status</th><th /></tr></thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.id}>
                <td className="card-name">{f.account}</td><td>{f.type}</td><td className="muted small">{f.detail}</td>
                <td>{(() => { const c = f.severity === "high" ? "#DC2626" : f.severity === "medium" ? "#F59E0B" : "#16A34A"; return <span className="status-pill" style={{ background: c + "1A", color: c }}>{f.severity}</span>; })()}</td>
                <td><span className={`status-pill ${f.status === "dismissed" ? "done" : "delay"}`}>{f.status}</span></td>
                <td style={{ display: "flex", gap: 6 }}>
                  {f.status === "open" ? (
                    <>
                      <button className="ghost-btn-sm" onClick={() => decide(f.id, "investigating")}>Investigate</button>
                      <button className="ghost-btn-sm" onClick={() => decide(f.id, "dismissed")}>Dismiss</button>
                    </>
                  ) : (
                    <button className="ghost-btn-sm" onClick={() => decide(f.id, "open")}>Reopen</button>
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

const STAFF_CHANGELOG_ADMIN = [
  { date: "Sep 8, 2026", tag: "Feature", title: "Bulk import for Users and Sellers", desc: "Import multiple users or sellers from a CSV instead of adding them one at a time." },
  { date: "Sep 8, 2026", tag: "Feature", title: "Fraud & Risk Flags", desc: "New screen for order velocity, new-account spend spikes, address mismatches, and repeated payment failures." },
  { date: "Sep 8, 2026", tag: "Feature", title: "Refund reason trends & seller onboarding funnel", desc: "Real analytics on why disputes happen and how sellers move from applied to live." },
  { date: "Sep 8, 2026", tag: "Fix", title: "Bulk suspend/unsuspend now requires confirmation", desc: "A reason is required and a confirm step added before it executes -- previously fired immediately." },
  { date: "Sep 8, 2026", tag: "Feature", title: "Live date-range filtering, idle-timeout auto-logout, and 2FA", desc: "Dashboard date range now actually changes the numbers; 15-minute inactivity signs you out; sign-in now requires a 6-digit code." },
];
function ChangelogSection() {
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">What's New for Staff</div><span className="muted small">Internal only -- not shown to customers</span></div>
        <div className="list-col">
          {STAFF_CHANGELOG_ADMIN.map((c, i) => (
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
        <div className="muted small" style={{ marginBottom: 12 }}>Day-to-day zone coverage -- the platform-wide surcharge and radius defaults live in Super Admin's Delivery Settings.</div>
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

const FIN_PAYMENTS_SEED = [
  { ref: "PMT-9921", customer: "Jordan B.", amount: 3023, method: "Card", status: "settled" },
  { ref: "PMT-9918", customer: "Priya M.", amount: 1450, method: "Wallet", status: "settled" },
  { ref: "PMT-9910", customer: "Sam T.", amount: 8200, method: "Card", status: "pending" },
  { ref: "PMT-9905", customer: "Ngozi A.", amount: 2100, method: "Bank transfer", status: "settled" },
];
const FIN_WALLET_SEED = [
  { user: "Jordan B.", type: "Top-up", amount: 5000, date: "Aug 18" },
  { user: "Priya M.", type: "Spend", amount: -1450, date: "Aug 18" },
  { user: "Sam T.", type: "Spend", amount: -820, date: "Aug 17" },
  { user: "Kelechi O.", type: "Top-up", amount: 3000, date: "Aug 16" },
];
const FIN_TOPUPS_SEED = [
  { user: "Jordan B.", amount: 5000, method: "Card", date: "Aug 18" },
  { user: "Sam T.", amount: 2500, method: "Bank transfer", date: "Aug 17" },
  { user: "Kelechi O.", amount: 3000, method: "Card", date: "Aug 16" },
];
const FIN_TXLOG_SEED = [
  { type: "Vendor payout", to: "Fresh Fields Grocery", amount: 312040, date: "Aug 18" },
  { type: "Rider payout", to: "Marcus T.", amount: 41260, date: "Aug 18" },
  { type: "Commission collected", to: "Platform", amount: 18400, date: "Aug 17" },
];
function FinancialTransactionsSection({ initialTab }) {
  const [tab, setTab] = useState(initialTab || "payments");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const payments = FIN_PAYMENTS_SEED.filter((p) => !q || p.customer.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q));
  const wallet = FIN_WALLET_SEED.filter((w) => !q || w.user.toLowerCase().includes(q));
  const topups = FIN_TOPUPS_SEED.filter((t) => !q || t.user.toLowerCase().includes(q));
  const txlog = FIN_TXLOG_SEED.filter((t) => !q || t.to.toLowerCase().includes(q) || t.type.toLowerCase().includes(q));
  return (
    <div className="section-pad">
      <div className="tab-row" style={{ marginBottom: 14 }}>
        <button className={`tab-btn ${tab === "payments" ? "active" : ""}`} onClick={() => setTab("payments")}>Payments</button>
        <button className={`tab-btn ${tab === "wallet" ? "active" : ""}`} onClick={() => setTab("wallet")}>Wallet</button>
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
        {tab === "wallet" && (
          <table className="admin-table">
            <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>{wallet.map((w, i) => <tr key={i}><td>{w.user}</td><td className="muted">{w.type}</td><td className={`mono ${w.amount < 0 ? "neg" : ""}`}>{w.amount > 0 ? "+" : ""}{money(w.amount)}</td><td className="muted small">{w.date}</td></tr>)}</tbody>
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
            <tbody>{txlog.map((t, i) => <tr key={i}><td>{t.type}</td><td>{t.to}</td><td className="mono">{money(t.amount)}</td><td className="muted small">{t.date}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KycVerificationsSection() {
  const [apps, setApps] = useState(KYC_APPLICATIONS_SEED);
  const [selected, setSelected] = useState(new Set());
  const decide = (id, status) => setApps((a) => a.map((x) => x.id === id ? { ...x, status } : x));
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const pendingIds = apps.filter((a) => a.status === "pending").map((a) => a.id);
  const toggleAll = () => setSelected((s) => (s.size === pendingIds.length ? new Set() : new Set(pendingIds)));
  const batchDecide = (status) => { setApps((a) => a.map((x) => selected.has(x.id) ? { ...x, status } : x)); setSelected(new Set()); };
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">KYC & Verifications</div>
        {selected.size > 0 && (
          <div className="cat-top" style={{ marginBottom: 10, gap: 8 }}>
            <span className="muted small">{selected.size} selected</span>
            <button className="primary-btn-sm" onClick={() => batchDecide("verified")}>Approve all</button>
            <button className="ghost-btn-sm deny" onClick={() => batchDecide("rejected")}>Reject all</button>
            <button className="ghost-btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}
        <table className="admin-table">
          <thead><tr><th><input type="checkbox" checked={pendingIds.length > 0 && selected.size === pendingIds.length} onChange={toggleAll} disabled={pendingIds.length === 0} /></th><th>Applicant</th><th>Type</th><th>Document</th><th>Submitted</th><th>Status</th><th /></tr></thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{a.status === "pending" && <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSel(a.id)} />}</td>
                <td className="card-name">{a.applicant}</td><td>{a.type}</td><td className="muted small">{a.document}</td><td className="muted small">{a.submitted}</td>
                <td><span className={`status-pill ${a.status === "verified" ? "done" : a.status === "rejected" ? "delay" : "prep"}`}>{a.status}</span></td>
                <td style={{ display: "flex", gap: 6 }}>
                  {a.status === "pending" ? (
                    <>
                      <button className="ghost-btn-sm" onClick={() => decide(a.id, "verified")}>Approve</button>
                      <button className="ghost-btn-sm deny" onClick={() => decide(a.id, "rejected")}>Reject</button>
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

function VendorAppsSection({ suspensions, onSuspend, onUnsuspend, logView }) {
  const [items, setItems] = useState(VENDOR_APPS);
  const [activeSellers, setActiveSellers] = useState(ADMIN_ACTIVE_SELLERS);
  const [selected, setSelected] = useState(new Set());
  const [viewSeller, setViewSeller] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const fileRef = useRef(null);
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => (s.size === items.length ? new Set() : new Set(items.map((v) => v.id))));
  const bulkClear = () => { setItems((it) => it.filter((v) => !selected.has(v.id))); setSelected(new Set()); };
  const funnelApplied = VENDOR_APPS.length;
  const funnelPending = items.length;
  const funnelLive = activeSellers.length;
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result));
      const header = rows[0].map((h) => h.toLowerCase());
      const nameIdx = header.indexOf("name");
      const catIdx = header.indexOf("category");
      if (nameIdx === -1) {
        setImportSummary({ error: true, text: "Couldn't read that file -- make sure it has a \"Name\" column." });
        return;
      }
      let added = 0;
      let malformed = 0;
      const existingNames = new Set(activeSellers.map((s) => s.name.toLowerCase()));
      const newSellers = [];
      const skipped = [];
      rows.slice(1).forEach((row, i) => {
        if (row.length === 1 && row[0].trim() === "") return;
        if (row.length !== header.length) { malformed++; skipped.push(`Row ${i + 2}: column count didn't match the header -- check for an unquoted comma in a field`); return; }
        const name = row[nameIdx]?.trim();
        if (!name) { skipped.push(`Row ${i + 2}: missing name`); return; }
        if (existingNames.has(name.toLowerCase())) { skipped.push(`Row ${i + 2} (${name}): already exists`); return; }
        newSellers.push({ id: `S${Date.now()}-${added}`, name, category: catIdx > -1 ? row[catIdx] || "Uncategorized" : "Uncategorized", orders: 0, rating: "--" });
        existingNames.add(name.toLowerCase());
        added++;
      });
      setActiveSellers((s) => [...newSellers, ...s]);
      setImportSummary({ error: false, text: `Imported ${added} new seller${added !== 1 ? "s" : ""}.`, skipped });
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  return (
    <div className="section-pad">
      {viewSeller && <AdminSellerDetailModal seller={viewSeller} onClose={() => setViewSeller(null)} suspension={suspensions?.[`seller:${viewSeller.id}`]} onSuspend={(id, name, reason) => onSuspend("seller", id, name, reason)} onUnsuspend={(id, name) => onUnsuspend("seller", id, name)} />}
      <div className="panel enter">
        <div className="panel-title" style={{ fontSize: 13 }}>Seller onboarding funnel</div>
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="stat-mini enter"><div className="muted">Applied</div><div className="kpi-value" style={{ fontSize: 20 }}>{funnelApplied}</div></div>
          <div className="stat-mini enter"><div className="muted">Pending review</div><div className="kpi-value" style={{ fontSize: 20 }}>{funnelPending}</div></div>
          <div className="stat-mini enter"><div className="muted">Live</div><div className="kpi-value" style={{ fontSize: 20 }}>{funnelLive}</div></div>
        </div>
      </div>
      <div className="panel enter">
        <div className="panel-title-row"><div className="panel-title">Active Sellers</div>
          <button className="ghost-btn-sm" onClick={() => fileRef.current?.click()}><Upload size={12} /> Bulk import (CSV)</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
        </div>
        {importSummary && (
          <div className="muted small" style={{ marginBottom: 10 }}>
            <div style={{ color: importSummary.error ? "#DC2626" : "#16A34A" }}>{importSummary.text}</div>
            {importSummary.skipped && importSummary.skipped.length > 0 && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ cursor: "pointer" }}>{importSummary.skipped.length} row{importSummary.skipped.length !== 1 ? "s" : ""} skipped -- see why</summary>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  {importSummary.skipped.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Orders</th><th>Rating</th><th></th></tr></thead>
          <tbody>
            {activeSellers.map((s) => (
              <tr key={s.id}>
                <td>{s.name} {suspensions?.[`seller:${s.id}`] && <span className="status-pill delay" style={{ marginLeft: 4 }}>Suspended</span>}</td><td className="muted">{s.category}</td><td className="mono">{s.orders}</td><td>{s.rating}</td>
                <td><button className="row-link" onClick={() => { setViewSeller(s); logView?.("Seller", s.name, "sellers"); }}>View <ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel enter">
        <div className="panel-title">Vendor applications</div>
        {items.length === 0 && <EmptyStateNote>No pending vendor applications.</EmptyStateNote>}
        {items.length > 0 && (
          <div className="cat-top" style={{ marginBottom: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={selected.size === items.length} onChange={toggleAll} /> <span className="muted">Select all</span></label>
          </div>
        )}
        <BulkBar count={selected.size} onApprove={bulkClear} onDeny={bulkClear} onClear={() => setSelected(new Set())} />
        <div className="list-col">
          {items.map((v) => {
            const similar = findSimilarSeller(v.name);
            return (
              <div className="pending-row-wrap" key={v.id}>
                <div className="pending-row">
                  <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggleSel(v.id)} />
                  <div className="pending-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}><Store size={14} /></div>
                  <div className="ti-mid"><div className="card-name">{v.name}</div><div className="muted">{v.category} -- {v.city} -- Applied {v.applied}</div></div>
                  <button className="round-btn deny" onClick={() => setItems((it) => it.filter((x) => x.id !== v.id))}><X size={13} /></button>
                  <button className="round-btn approve" onClick={() => setItems((it) => it.filter((x) => x.id !== v.id))}><Check size={13} /></button>
                </div>
                {similar && <div className="dup-warning"><AlertTriangle size={12} /> Possible duplicate -- resembles existing seller "{similar}". Review before approving.</div>}
              </div>
            );
          })}
        </div>
      </div>
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
  const [orders, setOrders] = useState(ORDERS_LEDGER);
  const [statusFilter, setStatusFilter] = useState("all");
  const [savedViews, setSavedViews] = useState([{ name: "All orders", status: "all" }]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const ORDERS_PER_PAGE = 3;
  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PER_PAGE));
  const pageItems = filtered.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);
  const statuses = [...new Set(orders.map((o) => o.status))];
  const statusOptions = ["all", ...statuses];
  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const applyBulkStatus = () => {
    if (!bulkStatus) return;
    setOrders((os) => os.map((o) => selected.has(o.id) ? { ...o, status: bulkStatus } : o));
    setSelected(new Set());
    setBulkStatus("");
  };
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
            <select className="sort-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {statusOptions.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
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
        {selected.size > 0 && (
          <div className="cat-top" style={{ marginBottom: 10, gap: 8 }}>
            <span className="muted small">{selected.size} selected</span>
            <select className="sort-select" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
              <option value="">Change status to...</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="primary-btn-sm" disabled={!bulkStatus} onClick={applyBulkStatus}>Apply</button>
            <button className="ghost-btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}
        <table className="admin-table">
          <thead><tr><th></th><th>Order</th><th>Customer</th><th>Vendor</th><th>Customer Paid</th><th>Seller Gets</th><th>Platform (product)</th><th>Rider Gets</th><th>Platform (delivery)</th><th>Status</th></tr></thead>
          <tbody>
            {pageItems.map((o, i) => {
              const b = orderBreakdown(o);
              return (
                <tr key={o.id} className="row-enter" style={{ animationDelay: `${i * 40}ms` }}>
                  <td><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSel(o.id)} /></td>
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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

function exportCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function AnnouncementsSection() {
  const [items, setItems] = useState([
    { title: "System Maintenance", body: "Scheduled May 20, 2:00-4:00 AM" },
    { title: "New Feature Released", body: "Advanced Analytics now available" },
  ]);
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

const AUTOMATED_BROADCASTS = [
  { key: "welcome", label: "Welcome message", trigger: "New account created", template: "Welcome to Medra! Here's 50 points to get you started.", enabled: true },
  { key: "milestone", label: "Milestone alert", trigger: "Order count milestones (10th, 50th, 100th order)", template: "You've placed {n} orders with us -- thank you for being a loyal customer!", enabled: true },
  { key: "order_reminder", label: "Order reminder", trigger: "Item left in cart for 24+ hours", template: "You left something in your cart -- still want it?", enabled: true },
  { key: "engagement", label: "Engagement reminder", trigger: "No app activity for 14 days", template: "We miss you! Come see what's new on Medra.", enabled: false },
  { key: "delivered", label: "Order delivered", trigger: "Order marked delivered", template: "Your order has arrived! Rate your experience and earn points.", enabled: true },
  { key: "birthday", label: "Birthday message", trigger: "Customer's birthday", template: "Happy birthday! Here's 20 points on us.", enabled: true },
  { key: "anniversary", label: "Anniversary message", trigger: "30-day / 6-month / 1-year membership", template: "Thanks for {duration} with Medra -- here's 100 points.", enabled: true },
  { key: "referral_reward", label: "Referral reward notification", trigger: "Referred friend places first order", template: "Your referral just placed their first order -- 100 points are on the way!", enabled: true },
  { key: "challenge_complete", label: "Challenge completion", trigger: "Community Challenge target reached", template: "The community hit its goal! Your mystery reward has been added.", enabled: true },
  { key: "giveaway_winner", label: "Giveaway winner notification", trigger: "Monthly giveaway draw completes", template: "Congratulations -- you won this month's giveaway!", enabled: true },
];

function BroadcastSection() {
  const [tab, setTab] = useState("manual");
  const [segment, setSegment] = useState(BROADCAST_SEGMENTS[0]);
  const [message, setMessage] = useState("");
  const [sentLog, setSentLog] = useState([]);
  const [autoBroadcasts, setAutoBroadcasts] = useState(AUTOMATED_BROADCASTS);
  const toggleAuto = (key) => setAutoBroadcasts((list) => list.map((a) => (a.key === key ? { ...a, enabled: !a.enabled } : a)));
  const recipientCount = { "All Customers": 4820, "All Sellers": 312, "All Riders": 884, "Sellers -- Groceries": 96, "Sellers -- Pharmacy": 41, "Riders -- Lagos zone": 512 }[segment];
  const send = () => {
    if (!message.trim()) return;
    setSentLog((l) => [{ segment, message, count: recipientCount, time: "Just now" }, ...l]);
    setMessage("");
  };
  return (
    <div className="section-pad">
      <div className="chip-row" style={{ marginBottom: 4 }}>
        <button className={`chip ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>Manual</button>
        <button className={`chip ${tab === "auto" ? "active" : ""}`} onClick={() => setTab("auto")}>Automatic</button>
      </div>
      {tab === "manual" ? (
        <>
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
            {sentLog.length === 0 ? <EmptyStateNote>No broadcasts sent yet -- messages you send to a customer segment will show up here.</EmptyStateNote> : (
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
        </>
      ) : (
        <div className="panel enter">
          <div className="panel-title-row"><div className="panel-title">Automated messages</div><span className="muted small">Fire automatically when the trigger event happens -- no manual sending needed</span></div>
          <div className="list-col">
            {autoBroadcasts.map((a) => (
              <div key={a.key} className="pending-row">
                <div className="ti-mid">
                  <div className="card-name">{a.label} <span className={`status-pill ${a.enabled ? "done" : ""}`}>{a.enabled ? "Enabled" : "Disabled"}</span></div>
                  <div className="muted small">Trigger: {a.trigger}</div>
                  <div className="muted small" style={{ fontStyle: "italic" }}>"{a.template}"</div>
                </div>
                <button className="ghost-btn-sm" onClick={() => toggleAuto(a.key)}>{a.enabled ? "Disable" : "Enable"}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_PERMS = {
  "Support Agent": { "View orders": true, "Refund orders": false, "Suspend accounts": false, "Edit commissions": false, "View financials": false, "Post announcements": false },
  "Finance Reviewer": { "View orders": true, "Refund orders": true, "Suspend accounts": false, "Edit commissions": false, "View financials": true, "Post announcements": false },
  "Content Moderator": { "View orders": false, "Refund orders": false, "Suspend accounts": true, "Edit commissions": false, "View financials": false, "Post announcements": true },
  "Ops Manager": { "View orders": true, "Refund orders": true, "Suspend accounts": true, "Edit commissions": false, "View financials": true, "Post announcements": true },
};

const ACTIVE_SESSIONS = [
  { id: "s1", device: "MacBook Pro -- Chrome", location: "Lagos, Nigeria", ip: "197.210.28.114", lastActive: "Active now", current: true, icon: Monitor },
  { id: "s2", device: "iPhone 15 -- Medra App", location: "Lagos, Nigeria", ip: "197.210.28.201", lastActive: "2 hours ago", current: false, icon: Smartphone },
  { id: "s3", device: "Windows PC -- Edge", location: "Abuja, Nigeria", ip: "105.112.4.87", lastActive: "3 days ago", current: false, icon: Monitor },
];

const REPORT_TYPES = ["Weekly GMV report", "Vendor performance report", "Rider safety report", "Refunds & disputes summary"];
const FREQUENCIES = ["Daily", "Weekly", "Monthly"];
const SCHEDULED_REPORTS = [
  { id: "sr1", report: "Weekly GMV report", frequency: "Weekly", email: "admin@medra.com", nextRun: "Mon, Aug 24" },
  { id: "sr2", report: "Vendor performance report", frequency: "Monthly", email: "admin@medra.com", nextRun: "Sep 1" },
];

function ReportsScreen() {
  const [scheduled, setScheduled] = useState(SCHEDULED_REPORTS);
  const [report, setReport] = useState(REPORT_TYPES[0]);
  const [frequency, setFrequency] = useState("Weekly");
  const [email, setEmail] = useState("admin@medra.com");
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
        {scheduled.length === 0 ? <EmptyStateNote>No reports scheduled -- set one up above and it'll appear here with its frequency and next send date.</EmptyStateNote> : (
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

function AdminWalkthroughModal({ onClose }) {
  const steps = [
    "User & Business Management -- users, sellers, riders, products, categories, orders, KYC, and delivery management.",
    "Financial Operations -- payments, payouts & settlements, wallet transactions/top-ups, commissions, disputes, transaction logs.",
    "Support & Safety -- support tickets, live chat, community, Ask Medra, support messages, notifications, SOS & safety.",
    "Marketing & Engagement -- promotions, referral & rewards, membership plans, announcements, broadcast messages.",
    "Reports -- reports and analytics for the marketplace.",
    "My Account -- sessions & devices, your own activity log, and free telehealth visits (once you've been active 90+ days).",
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="confirm-modal enter" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={16} /></button>
        <div className="card-name" style={{ fontSize: 16, marginBottom: 12 }}>Walk me through the Admin dashboard</div>
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

// Staff free-telehealth-visit benefit: Admin/Support staff active 90+ days
// get 2 free visits/year. This side only handles the *request* -- approval
// and voucher issuance is a Super Admin action (see FreeVisitApprovalsSection
// there). SERVER-AUTHORITY: eligibility (hire date, active status, visits
// already used this year) must be verified server-side; this prototype
// mocks the staffer's own record locally.
const STAFF_RECORD = { name: "You", activeSince: "2025-11-02", visitsUsedThisYear: 0, visitsAllowed: 2 };
function StaffTelehealthVoucherScreen() {
  const [requests, setRequests] = useState([]);
  const [reason, setReason] = useState("");
  const daysActive = Math.floor((Date.now() - new Date(STAFF_RECORD.activeSince).getTime()) / (24 * 60 * 60 * 1000));
  const eligible = daysActive >= 90 && STAFF_RECORD.visitsUsedThisYear < STAFF_RECORD.visitsAllowed;
  const pending = requests.some((r) => r.status === "pending");
  return (
    <div className="section-pad">
      <div className="panel enter">
        <div className="panel-title">Free Telehealth Visits</div>
        <div className="muted small" style={{ marginBottom: 12 }}>Active staff (90+ days) get {STAFF_RECORD.visitsAllowed} free telehealth visits per working year. Submit a request here -- once Super Admin approves it, you'll receive a voucher code to redeem in Telehealth booking. Beyond your {STAFF_RECORD.visitsAllowed}, you'd pay through your own customer account like anyone else.</div>
        <div className="list-col" style={{ marginBottom: 14 }}>
          <div className="cat-top"><span className="muted">Active since</span><span>{STAFF_RECORD.activeSince} ({daysActive} days)</span></div>
          <div className="cat-top"><span className="muted">Eligible</span><span className={eligible ? "" : "muted"}>{eligible ? "Yes" : daysActive < 90 ? "Not yet -- 90 days required" : "No -- used both visits this year"}</span></div>
          <div className="cat-top"><span className="muted">Visits used this year</span><span>{STAFF_RECORD.visitsUsedThisYear} / {STAFF_RECORD.visitsAllowed}</span></div>
        </div>
        {eligible && !pending && (
          <>
            <div className="field" style={{ marginBottom: 10 }}><span>Reason (optional)</span><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. General checkup" /></div>
            <button className="primary-btn-sm wide" onClick={() => setRequests((r) => [{ id: `TV-${Date.now()}`, reason: reason.trim(), status: "pending", requestedAt: "Just now" }, ...r])}>Submit request to Super Admin</button>
          </>
        )}
        {pending && <div className="muted small" style={{ color: "#EA580C" }}>Your request is pending Super Admin approval.</div>}
      </div>
      {requests.length > 0 && (
        <div className="panel enter">
          <div className="panel-title">Your requests</div>
          <div className="list-col">
            {requests.map((r) => (
              <div key={r.id} className="pending-row">
                <div className="ti-mid"><div className="card-name">{r.reason || "Free telehealth visit"}</div><div className="muted small">{r.requestedAt}</div></div>
                <span className={`status-pill ${r.status === "approved" ? "done" : "prep"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MyActivityScreen({ activityLog }) {
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  return (
    <div className="section-pad">
      {walkthroughOpen && <AdminWalkthroughModal onClose={() => setWalkthroughOpen(false)} />}
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
      <div className="version-tag">Medra Admin -- v2.14.0 -- build 2026.08.23</div>
    </div>
  );
}

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
    { author: "Medra Team", role: "Official", time: "9:00 AM", text: "Reminder: peak delivery hours today run 12-2pm and 6-9pm as usual." },
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

function draftAdminAIResponse(input) {
  const t = input.toLowerCase();

  if (t.includes("ticket") || (t.includes("open") && t.includes("support"))) {
    const breached = TICKETS.filter((tk) => tk.minutesOpen > SLA_MINUTES[tk.priority]);
    return {
      text: `There are ${TICKETS.length} open tickets right now${breached.length ? `, ${breached.length} past SLA: ${breached.map((b) => `${b.id} (${b.subject})`).join(", ")}` : ", all within SLA"}.`,
      actionLabel: "View tickets", actionKey: "tickets",
    };
  }
  if (t.includes("dispute") || t.includes("refund")) {
    if (DISPUTES.length === 0) return { text: "No open disputes right now." };
    const total = DISPUTES.reduce((s, d) => s + d.amount, 0);
    return { text: `There ${DISPUTES.length === 1 ? "is" : "are"} ${DISPUTES.length} open dispute${DISPUTES.length !== 1 ? "s" : ""} totaling ${money(total)}: ${DISPUTES.map((d) => `${d.id} -- ${d.reason}`).join(", ")}.`, actionLabel: "View disputes", actionKey: "disputes" };
  }
  if (t.includes("revenue") || t.includes("gmv") || t.includes("earning")) {
    const rev = KPIS.find((k) => k.key === "revenue");
    return { text: `Total revenue is ${rev.value}, up ${rev.delta} week-over-week and ${rev.deltaMonth} month-over-month.` };
  }
  if (t.includes("vendor") || (t.includes("seller") && t.includes("app"))) {
    return { text: `There ${VENDOR_APPS.length === 1 ? "is" : "are"} ${VENDOR_APPS.length} pending vendor application${VENDOR_APPS.length !== 1 ? "s" : ""}: ${VENDOR_APPS.map((v) => v.name).join(", ")}.`, actionLabel: "Review applications", actionKey: "sellers" };
  }
  if (t.includes("user") || t.includes("rider") || t.includes("platform")) {
    const users = KPIS.find((k) => k.key === "users");
    const riders = KPIS.find((k) => k.key === "riders");
    const sellers = KPIS.find((k) => k.key === "sellers");
    return { text: `Platform snapshot: ${users.value} total users, ${riders.value} active riders, ${sellers.value} active sellers.` };
  }
  return { text: "I can help with things like \"any open tickets\", \"how many disputes are open\", \"what's our revenue\", or \"any pending vendor applications\". What would you like to know?" };
}

function AIAssistantScreen({ onNavigate }) {
  const [chat, setChat] = useState([{ from: "ai", text: "Hi! I'm your Medra assistant. Ask me about tickets, disputes, revenue, or pending applications." }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const suggestions = ["Any open tickets?", "How many disputes are open?", "What's our revenue?"];

  const ask = (text) => {
    if (!text.trim()) return;
    setChat((c) => [...c, { from: "me", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const res = draftAdminAIResponse(text);
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

const SECTION_MAP = { dashboard: OverviewSection, orders: OrdersLedgerSection, tickets: TicketsSection, "live-chat": LiveChatSection, disputes: DisputesSection, sellers: VendorAppsSection, products: ProductOversightSection, notifications: NotificationsSection, users: UsersSection, riders: RidersSection, payouts: PayoutsSettlementsSection, kyc: KycVerificationsSection, "fraud-flags": FraudFlagsSection, "delivery-mgmt": DeliveryManagementSection, payments: () => <FinancialTransactionsSection initialTab="payments" />, "wallet-tx": () => <FinancialTransactionsSection initialTab="wallet" />, "wallet-topups": () => <FinancialTransactionsSection initialTab="topups" />, "tx-logs": () => <FinancialTransactionsSection initialTab="txlog" />, sessions: SessionsScreen, "my-activity": MyActivityScreen, "telehealth-voucher": StaffTelehealthVoucherScreen, changelog: ChangelogSection, community: CommunityScreen, "ai-assistant": AIAssistantScreen };

/* ============================================================
   APP SHELL
   ============================================================ */

const ADMIN_LP_CSS = `
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
.admin-hero{ position:relative; background:linear-gradient(120deg,#0B1220,#111827 55%,#0B1220); overflow:hidden; padding:56px 40px 64px; }
.admin-hero-grid{ display:grid; grid-template-columns:0.95fr 1.15fr; gap:40px; align-items:center; max-width:1420px; margin:0 auto; position:relative; z-index:1; }
.admin-pill{ display:inline-flex; align-items:center; gap:7px; background:rgba(37,99,235,0.16); color:#60A5FA; font-size:12px; font-weight:700; letter-spacing:0.02em; border-radius:100px; padding:7px 14px; margin-bottom:22px; }
.admin-hero h1{ font-size:38px; font-weight:800; line-height:1.2; color:#fff; margin:0 0 16px; }
.admin-hero h1 .accent{ color:#8CD867; }
.admin-hero-sub{ font-size:15px; color:#94A3B8; line-height:1.6; max-width:420px; margin-bottom:28px; }
.admin-trust-grid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.admin-trust-item{ display:flex; align-items:flex-start; gap:10px; }
.admin-trust-icon{ width:36px; height:36px; border-radius:11px; background:rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#60A5FA; }
.admin-trust-item b{ display:block; font-size:12.5px; font-weight:600; color:#fff; }
.admin-trust-item span{ display:block; font-size:11px; color:#94A3B8; margin-top:1px; }
.admin-mock{ background:#111827; border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:16px; box-shadow:0 40px 80px -30px rgba(0,0,0,0.6); display:flex; gap:12px; }
.admin-mock-side{ width:110px; flex-shrink:0; display:flex; flex-direction:column; gap:5px; }
.admin-mock-brand{ display:flex; align-items:center; gap:6px; color:#fff; font-size:11px; font-weight:700; margin-bottom:8px; }
.admin-mock-nav-item{ font-size:9.5px; color:#94A3B8; padding:6px 8px; border-radius:7px; }
.admin-mock-nav-item.active{ background:#2563EB; color:#fff; }
.admin-mock-main{ flex:1; min-width:0; }
.admin-mock-welcome{ font-size:9.5px; color:#94A3B8; margin-bottom:2px; }
.admin-mock-welcome b{ color:#fff; font-size:13px; }
.admin-mock-kpis{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:10px 0; }
.admin-mock-kpi{ background:#1A2233; border-radius:10px; padding:8px; }
.admin-mock-kpi .l{ font-size:8px; color:#94A3B8; }
.admin-mock-kpi .v{ font-size:12px; font-weight:700; color:#fff; margin:2px 0; }
.admin-mock-kpi .d{ font-size:8px; color:#4ADE80; }
.admin-mock-charts{ display:grid; grid-template-columns:1.4fr 1fr; gap:8px; }
.admin-mock-chart-card{ background:#1A2233; border-radius:10px; padding:10px; }
.admin-mock-chart-title{ font-size:9px; color:#CBD5E1; margin-bottom:8px; font-weight:600; }
.admin-mock-sparkline{ height:44px; display:flex; align-items:flex-end; gap:3px; }
.admin-mock-sparkline div{ flex:1; background:linear-gradient(180deg,#60A5FA,#2563EB); border-radius:2px 2px 0 0; }
.admin-mock-donut{ width:60px; height:60px; border-radius:100%; margin:0 auto 8px; background:conic-gradient(#16A34A 0% 70%, #2563EB 70% 87%, #F59E0B 87% 95%, #EF4444 95% 100%); }
.admin-mock-legend{ font-size:8px; color:#CBD5E1; display:flex; flex-direction:column; gap:2px; }
.admin-perks-strip{ display:grid; grid-template-columns:repeat(5,1fr); gap:0; background:#fff; padding:26px 40px; box-shadow:0 4px 30px -20px rgba(0,0,0,0.15); }
.admin-perk{ display:flex; align-items:flex-start; gap:12px; padding:0 16px; border-right:1px solid #EEF0F5; }
.admin-perk:last-child{ border-right:none; }
.admin-perk-icon{ width:42px; height:42px; border-radius:100%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.admin-perk b{ display:block; font-size:13px; font-weight:700; }
.admin-perk span{ display:block; font-size:11.5px; color:#64748B; line-height:1.4; }
.admin-stats-bar{ background:#0B1220; display:grid; grid-template-columns:repeat(6,1fr); padding:26px 40px; }
.admin-stat{ display:flex; align-items:center; gap:10px; justify-content:center; }
.admin-stat svg{ color:#60A5FA; }
.admin-stat b{ display:block; color:#fff; font-size:17px; font-weight:800; }
.admin-stat span{ display:block; color:#94A3B8; font-size:11px; }
.admin-resp{ padding:48px 40px; text-align:center; }
.admin-resp h2{ font-size:24px; font-weight:800; margin-bottom:8px; }
.admin-resp > p{ font-size:14px; color:#64748B; margin:0 0 32px; }
.admin-resp-grid{ display:grid; grid-template-columns:repeat(5,1fr); gap:20px; max-width:1300px; margin:0 auto; text-align:left; }
.admin-resp-item{ display:flex; flex-direction:column; gap:10px; }
.admin-resp-icon{ width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
.admin-resp-item h4{ font-size:14px; font-weight:700; margin:0; }
.admin-resp-item p{ font-size:12.5px; color:#64748B; margin:0; line-height:1.5; }
@media (max-width:960px){
  .lp-nav-links{ display:none; }
  .admin-hero-grid{ grid-template-columns:1fr; }
  .admin-mock{ display:none; }
  .admin-trust-grid{ grid-template-columns:1fr; }
  .admin-perks-strip{ grid-template-columns:1fr 1fr; }
  .admin-stats-bar{ grid-template-columns:1fr 1fr; gap:16px; }
  .admin-resp-grid{ grid-template-columns:1fr 1fr; }
}
`;

function AdminLandingPage({ onContinue }) {
  return (
    <div className="lp-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{ADMIN_LP_CSS}</style>
      <nav className="lp-nav">
        <Logo tagline="Admin" />
        <div className="lp-nav-links">
          <a className="active">Home</a>
          <a>About Medra</a>
          <a>Support Policies</a>
          <a>Staff Resources</a>
        </div>
        <div className="lp-nav-actions">
          <button className="lp-nav-signin" onClick={onContinue}><UserIcon size={16} /> Staff Sign In</button>
        </div>
      </nav>

      <section className="admin-hero">
        <div className="admin-hero-grid">
          <div>
            <div className="admin-pill"><ShieldCheck size={13} /> MEDRA TEAM</div>
            <h1>Behind every great experience is a <span className="accent">great team</span>.</h1>
            <p className="admin-hero-sub">The Medra Team works 24/7 to ensure a safe, secure and seamless experience for every user on the platform.</p>
            <div className="admin-trust-grid">
              <div className="admin-trust-item"><div className="admin-trust-icon"><ShieldCheck size={16} /></div><div><b>Secure Platform</b><span>We protect your data and payments.</span></div></div>
              <div className="admin-trust-item"><div className="admin-trust-icon"><BarChart3 size={16} /></div><div><b>Accurate Monitoring</b><span>We track every transaction and activity in real-time.</span></div></div>
              <div className="admin-trust-item"><div className="admin-trust-icon"><Users size={16} /></div><div><b>Fair & Transparent</b><span>Ensuring fairness for buyers, sellers & riders.</span></div></div>
              <div className="admin-trust-item"><div className="admin-trust-icon"><Headphones size={16} /></div><div><b>Always Here</b><span>24/7 support to keep Medra running smoothly.</span></div></div>
            </div>
          </div>
          <div className="admin-mock">
            <div className="admin-mock-side">
              <div className="admin-mock-brand">🅼 medra</div>
              <div className="admin-mock-nav-item active">Dashboard</div>
              <div className="admin-mock-nav-item">Orders</div>
              <div className="admin-mock-nav-item">Transactions</div>
              <div className="admin-mock-nav-item">Users</div>
              <div className="admin-mock-nav-item">Sellers</div>
              <div className="admin-mock-nav-item">Riders</div>
              <div className="admin-mock-nav-item">Disputes</div>
              <div className="admin-mock-nav-item">Payouts</div>
              <div className="admin-mock-nav-item">Reports</div>
              <div className="admin-mock-nav-item">Support Tickets</div>
              <div className="admin-mock-nav-item">Settings</div>
            </div>
            <div className="admin-mock-main">
              <div className="admin-mock-welcome">Welcome back,<br /><b>Medra Team 👋</b></div>
              <div className="admin-mock-kpis">
                <div className="admin-mock-kpi"><div className="l">Total Orders</div><div className="v">12,458</div><div className="d">↑ 18.6%</div></div>
                <div className="admin-mock-kpi"><div className="l">Transactions</div><div className="v">{money(48650300)}</div><div className="d">↑ 22.4%</div></div>
                <div className="admin-mock-kpi"><div className="l">Total Users</div><div className="v">98,532</div><div className="d">↑ 15.3%</div></div>
                <div className="admin-mock-kpi"><div className="l">Total Riders</div><div className="v">4,782</div><div className="d">↑ 11.2%</div></div>
              </div>
              <div className="admin-mock-charts">
                <div className="admin-mock-chart-card">
                  <div className="admin-mock-chart-title">Sales Overview</div>
                  <div className="admin-mock-sparkline">
                    {[40, 55, 48, 62, 58, 70, 66].map((h, i) => <div key={i} style={{ height: `${h}%` }} />)}
                  </div>
                </div>
                <div className="admin-mock-chart-card">
                  <div className="admin-mock-chart-title">Order Status</div>
                  <div className="admin-mock-donut" />
                  <div className="admin-mock-legend">
                    <span>● Completed 70%</span>
                    <span>● Processing 17%</span>
                    <span>● Pending 8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-perks-strip">
        <div className="admin-perk"><div className="admin-perk-icon" style={{ background: "#EAFBF1", color: "#16A34A" }}><Wallet size={18} /></div><div><b>Payment Monitoring</b><span>We verify and monitor all payments to ensure accuracy and security.</span></div></div>
        <div className="admin-perk"><div className="admin-perk-icon" style={{ background: "#F3EEFF", color: "#7C3AED" }}><RefreshCw size={18} /></div><div><b>Fraud Prevention</b><span>Advanced systems and real people working together to prevent fraud.</span></div></div>
        <div className="admin-perk"><div className="admin-perk-icon" style={{ background: "#FFF1E9", color: "#EA580C" }}><AlertTriangle size={18} /></div><div><b>Dispute Resolution</b><span>We handle disputes quickly and fairly for all parties involved.</span></div></div>
        <div className="admin-perk"><div className="admin-perk-icon" style={{ background: "#EAF3FF", color: "#2563EB" }}><BadgeCheck size={18} /></div><div><b>Seller & Rider Verification</b><span>We review and verify all sellers and riders to maintain trust.</span></div></div>
        <div className="admin-perk"><div className="admin-perk-icon" style={{ background: "#FFE9EF", color: "#E11D48" }}><TrendingUp size={18} /></div><div><b>Platform Optimization</b><span>We constantly improve the platform to deliver the best experience.</span></div></div>
      </div>

      <div className="admin-stats-bar">
        <div className="admin-stat"><Users size={20} /><div><b>98,532+</b><span>Total Users</span></div></div>
        <div className="admin-stat"><Store size={20} /><div><b>12,458+</b><span>Orders Today</span></div></div>
        <div className="admin-stat"><Wallet size={20} /><div><b>{money(48650000)}+</b><span>Transactions Today</span></div></div>
        <div className="admin-stat"><Truck size={20} /><div><b>4,782+</b><span>Active Riders</span></div></div>
        <div className="admin-stat"><Store size={20} /><div><b>2,354+</b><span>Active Sellers</span></div></div>
        <div className="admin-stat"><ShieldCheck size={20} /><div><b>99.9%</b><span>Uptime</span></div></div>
      </div>

      <section className="admin-resp">
        <h2>Our Responsibilities</h2>
        <p>We work behind the scenes so you can shop, sell and earn with peace of mind.</p>
        <div className="admin-resp-grid">
          <div className="admin-resp-item"><div className="admin-resp-icon" style={{ background: "#EAFBF1", color: "#16A34A" }}><ShieldCheck size={18} /></div><h4>Monitor Everything</h4><p>We monitor every order, payment and action on the platform in real-time.</p></div>
          <div className="admin-resp-item"><div className="admin-resp-icon" style={{ background: "#EAF3FF", color: "#2563EB" }}><FileText size={18} /></div><h4>Generate Reports</h4><p>Detailed reports and analytics help us make smart decisions every day.</p></div>
          <div className="admin-resp-item"><div className="admin-resp-icon" style={{ background: "#FFF1E9", color: "#EA580C" }}><Headphones size={18} /></div><h4>Support Users</h4><p>Our support team is always ready to assist users with any issues.</p></div>
          <div className="admin-resp-item"><div className="admin-resp-icon" style={{ background: "#F3EEFF", color: "#7C3AED" }}><Lock size={18} /></div><h4>Protect Data</h4><p>We use top security measures to keep user data and funds safe.</p></div>
          <div className="admin-resp-item"><div className="admin-resp-icon" style={{ background: "#EAFBF1", color: "#16A34A" }}><CheckCircle2 size={18} /></div><h4>Ensure Compliance</h4><p>We ensure that all activities follow our policies and industry standards.</p></div>
        </div>
      </section>
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
          <Logo tagline="Admin" />
          <div className="staff-login-title" style={{ marginTop: 18 }}>{totp ? "Two-factor verification" : "Staff sign in"}</div>
          <div className="muted">{totp ? "Enter the 6-digit code from your authenticator app" : "Marketplace operations access"}</div>
          <div className="muted small" style={{ textAlign: "center", marginTop: 6 }}>Preview build -- this is a demo environment, not a live account.</div>
          <form className="login-form" onSubmit={submit} style={{ marginTop: 20 }}>
            {!totp ? (
              <>
                <label className="field"><span>Work email</span><input type="email" defaultValue="admin@medra.com" placeholder="you@medra.com" required /></label>
                <label className="field"><span>Password</span><input type="password" defaultValue="demo1234" placeholder="********" required /></label>
              </>
            ) : (
              <label className="field"><span>Authentication code</span><input type="text" inputMode="numeric" maxLength={6} defaultValue="123456" placeholder="123456" className="totp-input" required /></label>
            )}
            <button className={`primary-btn wide ${loading ? "loading" : ""}`} type="submit" disabled={loading}>{loading ? <span className="spinner" /> : totp ? "Verify & sign in" : "Continue"}</button>
          </form>
          <div className="login-note"><ShieldCheck size={13} /> Restricted to authorized Medra staff -- 2FA required on every sign-in</div>
        </div>
      </div>
    </div>
  );
}

export default function MedraAdminPortal({ sharedAuthed, onAuth, onLogout } = {}) {
  const [authed, setAuthedRaw] = useState(!!sharedAuthed);
  useEffect(() => { if (sharedAuthed) setAuthedRaw(true); }, [sharedAuthed]);
  const setAuthed = (v) => { setAuthedRaw(v); if (v) onAuth?.(); else onLogout?.(); };
  // Idle-timeout auto-logout: staff dashboards handle sensitive data, so a
  // forgotten unlocked session shouldn't stay live indefinitely. 15 minutes
  // of no mouse/keyboard/touch activity signs the staffer out automatically.
  const [idleWarning, setIdleWarning] = useState(false);
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
  // This is the dedicated Admin dashboard -- marketplace operations only.
  // Complaints & Resolution, Live Chat, and Support Tickets live in the
  // separate Support dashboard (arclane-support.jsx) instead.
  const staffRole = "admin";
  const visibleNavSections = NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(staffRole)) })).filter((s) => s.items.length > 0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState(new Set());
  useEffect(() => {
    if (active === "sellers" || active === "kyc" || active === "payouts") setOnboardingSteps((s) => new Set(s).add(active));
  }, [active]);
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
  const [openSection, setOpenSection] = useState(NAV_SECTIONS.find((s) => s.items.some((i) => i.key === "dashboard"))?.label || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [viewAs, setViewAs] = useState(null);
  const [viewAsLog, setViewAsLog] = useState([]);
  const [logOpen, setLogOpen] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const logActivity = (action) => setActivityLog((log) => [{ action, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...log]);
  const [suspensions, setSuspensions] = useState({});
  const suspendTarget = (kind, id, name, reason) => {
    setSuspensions((s) => ({ ...s, [`${kind}:${id}`]: { name, reason, by: CURRENT_ADMIN_NAME, at: `Today, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` } }));
    logActivity(`Suspended ${kind} ${name} -- ${reason}`);
  };
  const unsuspendTarget = (kind, id, name) => {
    setSuspensions((s) => { const n = { ...s }; delete n[`${kind}:${id}`]; return n; });
    logActivity(`Restored ${kind} ${name}`);
  };
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const logView = (type, label, sectionKey) => setRecentlyViewed((rv) => [{ type, label, sectionKey, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...rv.filter((r) => r.label !== label)].slice(0, 5));
  const startViewAs = (target) => {
    setViewAs(target);
    setViewAsLog((log) => [{ actor: "You (Support Admin)", target, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...log]);
    logActivity(`Viewed as ${target}`);
  };
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
    return <AdminLandingPage onContinue={() => setShowLanding(false)} />;
  }
  if (!authed) return <StaffLoginScreen onLogin={() => setAuthed(true)} />;

  const activeLabel = active === "dashboard" ? "Dashboard" : NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.key === active)?.label || "Dashboard";
  const Active = SECTION_MAP[active] || (() => <GenericScreen config={GENERIC_CONFIG[active]} />);

  const goTo = (key, sectionLabel) => { setActive(key); setOpenSection(sectionLabel); setSearchQuery(""); setRecentPaletteKeys((r) => [key, ...r.filter((k) => k !== key)].slice(0, 5)); };
  const allSearchable = visibleNavSections.flatMap((s) => s.items.map((i) => ({ ...i, sectionLabel: s.label })));
  const allDataSearchable = [
    ...ORDERS_LEDGER.map((o) => ({ key: "orders", dataType: "Order", label: `#${o.id}`, sub: `${o.customer} -- ${o.vendor}` })),
    ...ADMIN_USERS_LIST.map((u) => ({ key: "users", dataType: "User", label: u.name, sub: u.email })),
    ...ADMIN_RIDERS_LIST.map((r) => ({ key: "riders", dataType: "Rider", label: r.name, sub: r.vehicle })),
  ];
  const searchResults = searchQuery.trim() ? allSearchable.filter((i) => i.label.toLowerCase().includes(searchQuery.trim().toLowerCase())) : [];

  return (
    <div className="medra-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      {paletteOpen && <CommandPalette items={allSearchable} dataItems={allDataSearchable} recentKeys={recentPaletteKeys} onSelect={(key) => goTo(key, allSearchable.find((i) => i.key === key)?.sectionLabel)} onClose={() => setPaletteOpen(false)} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {idleWarning && (
        <div className="viewas-banner" style={{ background: "#DC2626" }}>
          <Clock size={14} /> You've been idle -- you'll be signed out in about 3 minutes unless you keep working.
        </div>
      )}
      {isOffline && (
        <div style={{ background: "#7C2D12", color: "#fff", textAlign: "center", fontSize: 12.5, fontWeight: 600, padding: "6px 10px" }}>
          You're offline -- sensitive actions (suspend, refund, payouts, etc.) are paused until you're back online.
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
                const rows = [["Actor", "Viewed As", "Time"]];
                viewAsLog.forEach((l) => rows.push([l.actor, l.target, l.time]));
                exportCsv("medra-viewas-audit-log.csv", rows);
              }}><FileDown size={12} /> Export CSV</button>
            )}
            {viewAsLog.length === 0 ? <EmptyStateNote>No View-As sessions logged yet -- every time you view a user's screen as them, it'll be recorded here for audit purposes.</EmptyStateNote> : (
              <div className="list-col">
                {viewAsLog.map((l, i) => (
                  <div key={i} className="pending-row"><Eye size={13} /><div className="ti-mid"><div className="card-name">{l.actor}</div><div className="muted small">Viewed as {l.target}</div></div><div className="muted small">{l.time}</div></div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="desk-shell">
        <div className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-head"><Logo tagline="Admin" /></div>
          <nav className="sidebar-nav" onClick={(e) => { if (e.target.closest(".side-btn")) setMobileNavOpen(false); }}>
            <button className={`side-btn ${active === "dashboard" ? "active" : ""}`} onClick={() => setActive("dashboard")}><LayoutDashboard size={16} /> Dashboard</button>
            {visibleNavSections.map((section) => {
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
              <div className="page-title">{activeLabel}</div>
              <div className="muted">{activeLabel === "Dashboard" ? "Welcome back, Admin! Here's what's happening on Medra today." : `Manage ${activeLabel.toLowerCase()} across the platform`}</div>
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
              <div className="user-chip">
                <div className="driver-avatar sm">AU</div>
                <div><div className="card-name">Admin User</div><div className="muted">Marketplace Operations</div></div>
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
          {active === "dashboard" && appLoading ? <DashboardSkeleton /> : navLoading ? <ScreenSkeleton /> : <Active key={active} onNavigate={setActive} onViewAs={startViewAs} logActivity={logActivity} activityLog={activityLog} logView={logView} recentlyViewed={recentlyViewed} viewAsLog={viewAsLog} suspensions={suspensions} onSuspend={suspendTarget} onUnsuspend={unsuspendTarget} onReplySent={() => setOnboardingSteps((s) => new Set(s).add("tickets"))} onboardingSteps={onboardingSteps} dateRange={dateRange} />}
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
.sidebar{ width:264px; flex-shrink:0; background:#fff; border-right:1px solid var(--border); display:flex; flex-direction:column; padding:18px 12px; gap:10px; height:100vh; position:sticky; top:0; overflow:hidden; }
.sidebar-head{ padding:4px 8px 10px; border-bottom:1px solid var(--border); margin-bottom:4px; }
.sidebar-nav{ flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:2px; padding-right:2px; }
.sidebar-nav::-webkit-scrollbar{ width:5px; } .sidebar-nav::-webkit-scrollbar-thumb{ background:#CBD5E1; border-radius:10px; }
.side-section{ margin-top:6px; }
.side-section-label{ display:flex; align-items:center; justify-content:space-between; width:100%; font-size:10px; text-transform:uppercase; letter-spacing:0.06em; color:#94A3B8; font-weight:700; padding:8px 10px 8px; border-radius:8px; transition:background 120ms ease, color 120ms ease; }
.side-section-label.collapsible:hover{ background:#F8FAFC; color:#64748B; }
.side-section-label.has-active{ color:var(--purple); }
.chevron{ transition:transform 160ms ease; flex-shrink:0; }
.chevron.open{ transform:rotate(180deg); }
.side-btn{ display:flex; align-items:center; gap:9px; padding:8px 10px; border-radius:8px; font-size:12.5px; font-weight:500; color:#334155; width:100%; text-align:left; transition:background 150ms ease; position:relative; }
.side-btn:hover{ background:#F1F5F9; }
.side-btn.active{ background:var(--purple-light); color:var(--purple); font-weight:700; }
.side-badge{ margin-left:auto; background:#DC2626; color:#fff; font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:100px; }
.side-btn.logout{ color:#DC2626; margin-top:8px; padding:10px; font-weight:600; }
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

.main{ flex:1; min-width:0; padding:20px 28px 60px; overflow-y:auto; height:100vh; }
.topbar{ display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:16px; flex-wrap:wrap; }
.page-title{ font-size:21px; font-weight:800; letter-spacing:-0.01em; }
.topbar-actions{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.date-btn{ display:flex; align-items:center; gap:7px; border:1px solid var(--border); background:#fff; border-radius:10px; padding:8px 12px; font-size:12.5px; font-weight:500; }
.icon-btn{ position:relative; width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; }
.hamburger-btn{ display:none; align-items:center; justify-content:center; width:38px; height:38px; border-radius:10px; background:#fff; border:1px solid var(--border); flex-shrink:0; }
.icon-badge{ position:absolute; top:-5px; right:-5px; background:#DC2626; color:#fff; font-size:9px; font-weight:700; min-width:16px; height:16px; border-radius:100px; display:flex; align-items:center; justify-content:center; padding:0 3px; }
.notif-anchor{ position:relative; }
.daterange-anchor{ position:relative; }
.viewas-banner{ display:flex; align-items:center; gap:8px; background:#0F172A; color:#fff; padding:9px 20px; font-size:12.5px; font-weight:600; }
.viewas-banner .ghost-btn-sm.light{ margin-left:auto; border-color:rgba(255,255,255,0.3); color:#fff; }
.perm-toggle{ width:22px; height:22px; border-radius:6px; border:1.5px solid var(--border); display:inline-flex; align-items:center; justify-content:center; color:#fff; }
.perm-toggle.on{ background:var(--purple); border-color:var(--purple); }
.save-view-input{ border:1px solid var(--border); border-radius:10px; padding:8px 10px; font-size:12.5px; width:130px; }
.pagination-row{ display:flex; align-items:center; justify-content:center; gap:14px; margin-top:16px; }
.row-link{ display:flex; align-items:center; gap:2px; font-size:12px; font-weight:600; color:var(--purple); }
.notif-scrim{ position:fixed; inset:0; z-index:60; }
.notif-dropdown{ position:absolute; top:44px; right:0; width:320px; max-width:88vw; background:#fff; border:1px solid var(--border); border-radius:14px; box-shadow:0 20px 40px -16px rgba(15,23,42,0.3); z-index:61; overflow:hidden; }
.notif-row{ display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:10px 14px; border-top:1px solid #F1F5F9; transition:background 120ms ease; }
.notif-row:hover{ background:#F8F9FC; }
:focus-visible{ outline:2px solid var(--purple); outline-offset:2px; border-radius:4px; }
.notif-row-full{ width:100%; text-align:left; transition:background 120ms ease; border-radius:10px; }
.notif-row-full:hover{ background:#F8F9FC; }
.user-chip{ display:flex; align-items:center; gap:9px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:6px 10px; }
.driver-avatar{ width:34px; height:34px; border-radius:100px; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; }
.driver-avatar.sm{ width:32px; height:32px; font-size:11px; }

.section-pad{ display:flex; flex-direction:column; gap:16px; }
.enter{ animation: fadeUp 380ms cubic-bezier(.2,.8,.2,1) both; } @keyframes fadeUp{ from{ opacity:0; transform:translateY(8px);} to{ opacity:1; transform:none;} }
.row-enter{ animation: fadeUp 340ms ease both; }

.kpi-grid{ display:grid; grid-template-columns:repeat(6,1fr); gap:14px; }
.kpi-compare-row{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.chip{ padding:8px 14px; border-radius:100px; background:#fff; border:1px solid var(--border); font-size:12.5px; font-weight:500; }
.community-feed{ display:flex; flex-direction:column; gap:14px; max-height:420px; overflow-y:auto; }
.community-msg{ display:flex; gap:10px; align-items:flex-start; }
.community-img{ max-width:220px; border-radius:12px; margin-top:6px; display:block; }
.community-msg-meta{ display:flex; align-items:center; gap:8px; }
.image-preview-row{ display:flex; align-items:center; gap:8px; margin-top:10px; }
.image-preview-thumb{ width:48px; height:48px; border-radius:8px; object-fit:cover; }
.chip.active{ background:var(--purple); color:#fff; border-color:var(--purple); }
.chip-row{ display:flex; gap:8px; flex-wrap:wrap; }
.skel-card{ height:78px; border-radius:14px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
.skel-line{ height:14px; border-radius:6px; margin-bottom:12px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
.skel-block{ height:60px; border-radius:12px; background:linear-gradient(100deg,#EDEFEE 30%,#F7F8F7 50%,#EDEFEE 70%); background-size:200% 100%; animation:shimmer 1.3s ease infinite; }
@keyframes shimmer{ from{background-position:200% 0;} to{background-position:-200% 0;} }
.kpi-card{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:16px; }
.kpi-icon{ width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
.kpi-label{ font-size:12px; color:var(--muted); margin-bottom:4px; }
.kpi-value{ font-size:22px; font-weight:800; letter-spacing:-0.01em; }
.kpi-delta{ font-size:11px; font-weight:700; display:flex; align-items:center; gap:3px; margin-top:6px; }
.kpi-delta.up{ color:#16A34A; }
.kpi-delta-sub{ color:var(--muted); font-weight:400; }
.kpi-spark{ margin-top:8px; }
.stat-mini{ background:#fff; border:1px solid var(--border); border-radius:14px; padding:14px; }

.row-3col-uneven{ display:grid; grid-template-columns:1.1fr 1.3fr 1.1fr; gap:14px; }
.row-4col-even{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.row-2col{ display:grid; grid-template-columns:1.4fr 1fr; gap:14px; }

.panel{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:18px 20px; min-width:0; }
.panel-title{ font-weight:700; font-size:14.5px; margin-bottom:12px; }
.panel-title-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.link-btn{ font-size:12px; font-weight:600; color:var(--purple); }
.dropdown-btn{ display:flex; align-items:center; gap:4px; font-size:12px; border:1px solid var(--border); border-radius:8px; padding:5px 10px; }
.rev-big{ font-size:24px; font-weight:800; display:flex; align-items:center; gap:10px; }
.rev-delta{ font-size:11.5px; font-weight:700; color:#16A34A; display:flex; align-items:center; gap:2px; background:#ECFDF5; padding:3px 8px; border-radius:100px; }

.donut-row{ display:flex; align-items:center; gap:14px; }
.donut-wrap{ position:relative; flex-shrink:0; }
.donut-center{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.donut-num{ font-size:15px; font-weight:800; }
.donut-legend{ flex:1; display:flex; flex-direction:column; gap:6px; min-width:0; }
.legend-row{ display:flex; align-items:center; gap:7px; font-size:11px; }
.legend-dot{ width:7px; height:7px; border-radius:100px; flex-shrink:0; }
.legend-name{ flex:1; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.legend-val{ color:var(--muted); font-weight:600; white-space:nowrap; }

.health-grid{ display:grid; gap:10px; }
.health-tile{ text-align:center; border:1px solid var(--border); border-radius:12px; padding:10px 6px; }
.health-icon{ width:26px; height:26px; border-radius:100px; display:flex; align-items:center; justify-content:center; margin:0 auto 6px; }
.health-val{ font-size:12px; font-weight:700; margin-bottom:2px; }

.activity-list{ display:flex; flex-direction:column; gap:12px; }
.activity-row{ display:flex; align-items:flex-start; gap:10px; }
.activity-icon{ width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ti-mid{ flex:1; min-width:0; }

.list-col{ display:flex; flex-direction:column; gap:10px; }
.pending-row{ display:flex; align-items:center; gap:10px; }
.pending-icon{ width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.feature-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:14px; }
.feature-card{ border:1px solid var(--border); border-radius:14px; padding:14px; }
.feature-top{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.product-photo-wrap{ position:relative; margin:-14px -14px 10px; border-radius:14px 14px 0 0; overflow:hidden; }
.product-photo{ width:100%; height:120px; object-fit:cover; display:block; }
.product-photo-edit{ position:absolute; bottom:8px; right:8px; background:rgba(255,255,255,0.92); border-radius:8px; padding:5px 9px; font-size:11px; font-weight:600; display:flex; align-items:center; gap:4px; }

.cat-row{ display:flex; flex-direction:column; gap:5px; }
.cat-top{ display:flex; justify-content:space-between; font-size:12.5px; }
.bar-track{ height:6px; background:#F1F5F9; border-radius:100px; overflow:hidden; }
.bar-fill-h{ height:100%; border-radius:100px; }
.pm-row{ display:flex; align-items:center; gap:10px; }
.pm-icon{ width:26px; height:26px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.pm-mid{ flex:1; display:flex; flex-direction:column; gap:5px; }

.sos-panel{ background:#FFF7F7; border-color:#FECACA; }
.sos-alert{ display:flex; align-items:center; gap:10px; color:#DC2626; }
.sos-num{ font-size:22px; font-weight:800; }

.admin-table{ width:100%; border-collapse:collapse; }
.row-actions{ display:flex; gap:6px; }
.admin-table th{ text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:0.04em; color:var(--muted); font-weight:700; padding:8px 10px; border-bottom:1px solid var(--border); }
.bulk-bar{ display:flex; align-items:center; gap:10px; background:var(--purple-light); border:1px solid #DDD6FE; border-radius:12px; padding:10px 14px; margin-bottom:12px; }
.activity-clickable{ width:100%; text-align:left; border-radius:10px; transition:background 120ms ease; cursor:pointer; }
.activity-clickable:hover{ background:#F8F9FC; }
.modal-backdrop{ position:fixed; inset:0; background:rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
.detail-modal{ background:#fff; border-radius:18px; padding:26px; width:380px; max-width:90vw; position:relative; }
.modal-close{ position:absolute; top:14px; right:14px; width:32px; height:32px; border-radius:100px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; }
.admin-table td{ padding:11px 10px; font-size:13px; border-bottom:1px solid #F1F5F9; }
.admin-table tr:last-child td{ border-bottom:none; }
.status-pill{ font-size:10px; font-weight:700; padding:4px 9px; border-radius:100px; background:#F1F5F9; color:#475569; text-transform:capitalize; }
.tab-row{ display:flex; gap:6px; border-bottom:1px solid var(--border); }
.tab-btn{ border:none; background:none; padding:10px 14px; font-weight:600; font-size:13px; color:var(--muted); cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
.tab-btn.active{ color:var(--purple); border-bottom-color:var(--purple); }
.status-pill.done{ background:#ECFDF5; color:#16A34A; } .status-pill.delay{ background:#FEF2F2; color:#DC2626; }
.status-pill.prep{ background:#FFF7ED; color:#B45309; } .status-pill.route{ background:#EFF6FF; color:#2563EB; }
.confirm-modal{ background:#fff; border-radius:20px; padding:26px; width:420px; max-width:92vw; max-height:88vh; overflow-y:auto; position:relative; }
.pending-row-wrap{ display:flex; flex-direction:column; gap:4px; }
.chat-thread{ display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto; margin-bottom:10px; }
.chat-bubble{ padding:8px 12px; border-radius:12px; font-size:12.5px; max-width:75%; background:var(--bg); }
.chat-bubble.me{ background:var(--purple); color:#fff; align-self:flex-end; }
.chat-msg-wrap{ display:flex; flex-direction:column; }
.typing-indicator{ display:flex; gap:3px; padding:8px 12px; background:var(--bg); border-radius:12px; width:fit-content; }
.typing-indicator span{ width:6px; height:6px; border-radius:100px; background:var(--muted); animation:typingBounce 1.2s infinite ease-in-out; }
@keyframes typingBounce{ 0%,60%,100%{ transform:translateY(0); opacity:0.5; } 30%{ transform:translateY(-4px); opacity:1; } }
.unread-dot{ display:inline-block; width:7px; height:7px; border-radius:100%; background:#2563EB; margin-left:5px; vertical-align:middle; }
.sort-select{ border:1px solid var(--border); border-radius:10px; padding:8px 10px; font-size:12.5px; background:#fff; }

.round-btn{ width:28px; height:28px; border-radius:100px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border); }
.round-btn.approve{ color:#16A34A; border-color:#BBF7D0; } .round-btn.deny{ color:#DC2626; border-color:#FECACA; }
.empty-note{ color:var(--muted); font-size:13px; padding:24px 16px; text-align:center; display:flex; flex-direction:column; align-items:center; }
.flag-row{ display:flex; align-items:center; gap:10px; border:1px solid var(--border); border-radius:12px; padding:11px 14px; }

.ticket-item{ display:flex; align-items:center; gap:10px; padding:10px; border-radius:12px; text-align:left; width:100%; transition:background 150ms ease; }
.ticket-item:hover{ background:#F8F9FC; } .ticket-item.active{ background:var(--purple-light); }
.priority-dot{ width:8px; height:8px; border-radius:100px; flex-shrink:0; background:#94A3B8; }
.sla-breach{ font-size:9.5px; font-weight:700; color:#DC2626; margin-top:2px; }
.dup-warning{ display:flex; align-items:center; gap:6px; font-size:11.5px; color:#B45309; background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:6px 10px; margin:-4px 0 8px 42px; }
.sla-readout{ display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); background:var(--bg); border-radius:10px; padding:9px 12px; margin-bottom:12px; }
.sla-readout.breached{ background:#FEF2F2; color:#991B1B; }
.version-tag{ text-align:center; font-size:11px; color:#B0B7C3; padding:16px 0; }
.priority-dot.high{ background:#DC2626; } .priority-dot.medium{ background:#F59E0B; } .priority-dot.low{ background:#94A3B8; }
.msg-bubble{ background:var(--bg); border:1px solid var(--border); border-radius:14px; padding:12px 14px; font-size:13.5px; margin-bottom:12px; }
.msg-bubble.reply{ background:var(--purple-light); border-color:#DDD6FE; margin-left:20%; }
.reply-row{ display:flex; gap:10px; }
.reply-row input{ flex:1; border:1px solid var(--border); border-radius:12px; padding:10px 14px; font-size:13px; outline:none; }
.cap-warning-banner{ display:flex; align-items:center; gap:8px; background:#FFF7ED; color:#B45309; border-radius:12px; padding:11px 14px; font-size:12.5px; font-weight:600; margin-bottom:12px; line-height:1.5; }
.resolve-note-input{ width:100%; border:1px solid var(--border); border-radius:10px; padding:9px 12px; font-size:13px; }
.primary-btn-sm{ background:var(--purple); color:#fff; border-radius:10px; padding:10px 16px; font-weight:700; font-size:12.5px; }

.staff-login-wrap{ width:100%; min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#F1F2F8,#F7F8FB); }
.staff-login-card{ width:400px; max-width:90vw; background:#fff; border:1px solid var(--border); border-radius:20px; padding:32px 30px; box-shadow:0 30px 60px -24px rgba(15,23,42,0.18); }

.staff-login-title{ font-size:19px; font-weight:800; margin-bottom:2px; }
.login-form{ display:flex; flex-direction:column; gap:14px; }
.field{ display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:600; color:#334155; }
.field input{ border:1.5px solid var(--border); border-radius:12px; padding:11px 14px; font-size:13.5px; outline:none; }
.field input:focus{ border-color:var(--purple); }
.primary-btn{ background:var(--purple); color:#fff; border-radius:12px; padding:12px; font-weight:700; font-size:14px; display:flex; align-items:center; justify-content:center; gap:7px; }
.primary-btn:hover{ background:#5B21B6; } .primary-btn.wide{ width:100%; }
.spinner{ width:16px; height:16px; border-radius:100px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; animation:spin 700ms linear infinite; }

@media (pointer: coarse) {
  .round-btn, .modal-close, .icon-btn, .hamburger-btn{ min-width:44px; min-height:44px; }
}
@keyframes spin{ to{ transform:rotate(360deg); } }
.login-note{ display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--muted); margin-top:18px; justify-content:center; text-align:center; }
.totp-input{ text-align:center; letter-spacing:8px; font-family:'JetBrains Mono',monospace; font-size:18px; }

@media (max-width:1000px){
  .sidebar{ position:fixed; top:0; left:0; height:100dvh; z-index:200; transform:translateX(-100%); transition:transform 0.25s ease; box-shadow:0 0 24px rgba(0,0,0,0.15); }
  .sidebar.mobile-open{ transform:translateX(0); }
  .sidebar-scrim{ display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:190; }
  .sidebar-scrim.show{ display:block; }
  .hamburger-btn{ display:flex; }
  .desk-shell{ display:block; }
  .main{ height:auto; min-height:100vh; padding:14px 14px 70px; }
  .row-3col-uneven, .row-4col-even, .row-2col{ grid-template-columns:1fr; } .kpi-grid{ grid-template-columns:repeat(2,1fr); }
}
@media (min-width:1001px){ .hamburger-btn{ display:none; } }

@media print {
  body * { visibility: hidden; }
  #payouts-printable, #payouts-printable * { visibility: visible; }
  #payouts-printable { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
  #payouts-printable .print-only { display: block !important; }
  #shortcuts-printable, #shortcuts-printable * { visibility: visible; }
  #shortcuts-printable { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
  .no-print { display: none !important; }
}
`;
