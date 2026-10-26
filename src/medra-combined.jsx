import React, { useState, useEffect } from "react";
import MedraLanding from "./medra-landing.jsx";
import MedraApp from "./medra.jsx";
import MedraRiderApp from "./medra-rider.jsx";
import MedraSellerApp from "./medra-seller.jsx";
import MedraAdminPortal from "./medra-admin.jsx";
import MedraSupportPortal from "./medra-support.jsx";
import MedraSuperAdminPortal from "./medra-superadmin.jsx";

// Marks this as the combined shell so Super Admin's "View As" skips its
// standalone "open this other file" toast and just switches tabs here
// instead (see the medra:switch-app listener below).
if (typeof window !== "undefined") window.__MEDRA_SHELL__ = true;

// Combined multi-app preview shell: lets you flip between all 7 Medra apps
// in one tab, sharing one login (sharedAuthed) and one in-memory order store
// (sharedOrderStore) so an order placed as the customer shows up for the
// seller/rider/admin/support/super-admin apps too. This is a demo/QA
// convenience only -- each app also ships as its own standalone HTML file.
// Super Admin's "View As" action dispatches a "medra:switch-app" event,
// which this shell listens for and uses to flip the active tab -- that's
// how View As jumps straight to the right app here instead of just showing
// a "open this other file" toast (which is what happens when Super Admin
// runs standalone, outside this shell -- see window.__MEDRA_SHELL__ below).
const APPS = [
  { key: "landing", label: "Landing", Comp: MedraLanding, color: "#7C3AED", authed: false },
  { key: "customer", label: "Customer", Comp: MedraApp, color: "#6D28D9", authed: true },
  { key: "rider", label: "Rider", Comp: MedraRiderApp, color: "#16A34A", authed: true },
  { key: "seller", label: "Seller", Comp: MedraSellerApp, color: "#2563EB", authed: true },
  { key: "admin", label: "Admin", Comp: MedraAdminPortal, color: "#EA580C", authed: true },
  { key: "support", label: "Support", Comp: MedraSupportPortal, color: "#DB2777", authed: true },
  { key: "superadmin", label: "Super Admin", Comp: MedraSuperAdminPortal, color: "#0F172A", authed: true },
];

function CombinedPreview() {
  const [active, setActive] = useState("landing");
  const [sharedAuthed, setSharedAuthed] = useState(false);
  const [sharedOrders, setSharedOrders] = useState([]);
  const [viewingAs, setViewingAs] = useState(null); // { app, target } while impersonating via Super Admin's View As
  const [crossAppActivity, setCrossAppActivity] = useState([]);
  const [activityOpen, setActivityOpen] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [tourOpen, setTourOpen] = useState(true);
  const [tourStep, setTourStep] = useState(0);
  useEffect(() => {
    if (!viewingAs) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [viewingAs]);
  const sharedOrderStore = {
    orders: sharedOrders,
    setOrders: setSharedOrders,
    addOrder: (order) => { setSharedOrders((os) => [order, ...os]); setCrossAppActivity((a) => [{ time: new Date().toLocaleTimeString(), text: `Order #${order.id} placed` }, ...a].slice(0, 20)); },
    updateOrder: (id, patch) => {
      setSharedOrders((os) => os.map((o) => (o.id === id ? { ...o, ...(typeof patch === "function" ? patch(o) : patch) } : o)));
    },
  };

  useEffect(() => {
    const onSwitch = (e) => {
      const app = e.detail && e.detail.app;
      const target = e.detail && e.detail.viewAsTarget;
      if (APPS.some((a) => a.key === app)) {
        setActive(app);
        setViewingAs(target ? { app, target, startedAt: Date.now() } : null);
      }
    };
    window.addEventListener("medra:switch-app", onSwitch);
    return () => window.removeEventListener("medra:switch-app", onSwitch);
  }, []);

  const switchTab = (key) => {
    if (key !== active) setCrossAppActivity((a) => [{ time: new Date().toLocaleTimeString(), text: `Switched to ${APPS.find((x) => x.key === key)?.label}` }, ...a].slice(0, 20));
    setActive(key);
    setViewingAs(null);
  };
  const exitViewAs = () => { setActive("superadmin"); setViewingAs(null); };

  const activeApp = APPS.find((a) => a.key === active);
  const Active = activeApp.Comp;
  const appProps = activeApp.authed ? { sharedAuthed, onAuth: () => setSharedAuthed(true), onLogout: () => setSharedAuthed(false), sharedOrderStore } : {};

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {tourOpen && (() => {
        const TOUR_STEPS = [
          { title: "Welcome to the Combined Preview", body: "This is all 7 Medra apps in one tab, sharing one login and one order store. Placing an order as the Customer will actually show up for the Seller, Rider, Admin, Support, and Super Admin apps too -- it's the real flow, not separate demos." },
          { title: "Switch apps with the tab bar", body: "Click any app name at the top to jump straight to it. Your progress in each app is preserved while you're away -- switching tabs doesn't reset anything." },
          { title: "Try a real order end-to-end", body: "Place an order in Customer, confirm it in Seller, accept and deliver it in Rider, then check it shows up in Admin's order ledger and Support's tools. That full loop is the best way to see how the pieces connect." },
          { title: "\"View As\" jumps you around too", body: "Super Admin's View As feature (in Team & Staff) will switch this shell to whichever app the target user would see -- watch for the purple banner at the top when it's active." },
          { title: "Activity log & you're set", body: "The \"Activity\" button in the tab bar tracks every tab switch and order placed this session, in case you lose track of what you tried. That's everything -- enjoy exploring." },
        ];
        const step = TOUR_STEPS[tourStep];
        const isLast = tourStep === TOUR_STEPS.length - 1;
        return (
          <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 420, width: "90%", boxShadow: "0 20px 60px -20px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Step {tourStep + 1} of {TOUR_STEPS.length}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#0F172A" }}>{step.title}</div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 20 }}>{step.body}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => setTourOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Skip tour</button>
                <div style={{ display: "flex", gap: 8 }}>
                  {tourStep > 0 && <button onClick={() => setTourStep((s) => s - 1)} style={{ border: "1px solid #E2E8F0", background: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Back</button>}
                  <button onClick={() => (isLast ? setTourOpen(false) : setTourStep((s) => s + 1))} style={{ border: "none", background: "#7C3AED", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{isLast ? "Start exploring" : "Next"}</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#0F172A", flexShrink: 0, overflowX: "auto" }}>
        <span style={{ color: "#94A3B8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 8, flexShrink: 0 }}>Combined Preview</span>
        {APPS.map((a) => (
          <button
            key={a.key}
            onClick={() => switchTab(a.key)}
            style={{
              flexShrink: 0, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
              color: active === a.key ? "#fff" : "#CBD5E1",
              background: active === a.key ? a.color : "transparent",
              transition: "background 120ms ease, color 120ms ease",
            }}
          >
            {a.label}
          </button>
        ))}
        <button
          onClick={() => { setTourStep(0); setTourOpen(true); }}
          style={{ flexShrink: 0, marginLeft: "auto", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "#CBD5E1", background: "transparent" }}
        >
          Replay tour
        </button>
        <button
          onClick={() => setActivityOpen((o) => !o)}
          style={{ flexShrink: 0, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "#CBD5E1", background: activityOpen ? "#334155" : "transparent" }}
        >
          Activity {crossAppActivity.length > 0 ? `(${crossAppActivity.length})` : ""}
        </button>
      </div>
      {activityOpen && (
        <div style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", padding: "10px 16px", maxHeight: 160, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Cross-app activity this session</div>
          {crossAppActivity.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>Nothing yet -- switch tabs or place an order to see it logged here.</div>
          ) : (
            crossAppActivity.map((a, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "#334155", padding: "3px 0", display: "flex", gap: 10 }}>
                <span style={{ color: "#94A3B8", fontFamily: "monospace", fontSize: 11 }}>{a.time}</span>
                <span>{a.text}</span>
              </div>
            ))
          )}
        </div>
      )}
      {viewingAs && viewingAs.app === active && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 16px", background: "#7C3AED", color: "#fff", flexShrink: 0, fontSize: 13, fontWeight: 600 }}>
          <span>👁️ Viewing as {viewingAs.target} -- everything here is exactly what they'd see. <span style={{ opacity: 0.8, fontWeight: 500 }}>({Math.floor((nowTick - viewingAs.startedAt) / 60000)}:{String(Math.floor(((nowTick - viewingAs.startedAt) % 60000) / 1000)).padStart(2, "0")} elapsed)</span></span>
          <button onClick={exitViewAs} style={{ border: "1px solid rgba(255,255,255,0.5)", background: "transparent", color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>Exit View As</button>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Active {...appProps} />
      </div>
    </div>
  );
}

export default CombinedPreview;
