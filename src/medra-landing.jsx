import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingBag, Truck, Store, ArrowRight, MapPin, Star, ShieldCheck,
  Zap, Package, Clock, Menu, X, ChevronRight, CircleCheck, Award,
  Palette, Users, Gift, Wallet, TrendingUp, BadgeCheck, Clock3, Crown,
} from "lucide-react";

/* ============================================================
   CONTENT
   ============================================================ */

const STATS = [
  { label: "Orders delivered", value: 2400000, suffix: "+", format: "compact", live: true },
  { label: "Active riders", value: 884, suffix: "", live: true },
  { label: "Vendors on Medra", value: 312, suffix: "" },
  { label: "Avg. delivery time", value: 34, suffix: " min" },
];

const AUDIENCES = [
  {
    key: "shop",
    icon: ShoppingBag,
    title: "Shop everything",
    tag: "Customer",
    color: "#6D28D9",
    desc: "Compare prices from multiple sellers on every product, pay in Naira, and earn points on every order you can spend on your next one.",
    bullets: ["Earn points, redeem them toward products", "Live order tracking, start to finish"],
    cta: "Start shopping",
  },
  {
    key: "sell",
    icon: Store,
    title: "Sell on Medra",
    tag: "Seller",
    color: "#EA580C",
    desc: "List your inventory once, reach customers already looking to buy nearby, and keep 100% of the price you set -- Medra's fee is added on top, not taken out.",
    bullets: ["Real-time orders & inventory tools", "Weekly payouts, transparent fees"],
    cta: "Start selling",
  },
  {
    key: "drive",
    icon: Truck,
    title: "Drive & earn",
    tag: "Driver",
    color: "#16A34A",
    desc: "Go online whenever it works for you. See your exact payout before you accept every delivery -- no surprises, no guessing.",
    bullets: ["See your exact payout before accepting", "Flexible hours, no minimums"],
    cta: "Start driving",
  },
];

const FEATURES = [
  { icon: Users, title: "Multiple sellers, one product", desc: "See every seller offering the same item nearby, with live prices and delivery estimates -- pick what works for you." },
  { icon: Award, title: "Points that actually mean something", desc: "Convert your wallet balance to points any time -- 1 point is always worth ₦1 toward your next order's product cost." },
  { icon: Palette, title: "Make it yours", desc: "Unlock themes with points and change how your Medra looks -- no two accounts have to feel the same." },
  { icon: Gift, title: "Rewards that are actually fun", desc: "A daily riddle, a quick quiz, a spin of the wheel -- small games that earn small points, plus a birthday shout-out worth two." },
  { icon: ShieldCheck, title: "Buyer protection, always on", desc: "Every order on Medra is covered -- if something goes wrong, we're already looking into it." },
  { icon: Crown, title: "Membership that pays for itself", desc: "Five real tiers, up to 5x reward points on every order -- see exactly what you'd earn before you subscribe." },
];

const STEPS = [
  { n: "01", title: "Browse & compare", desc: "Search across every category and vendor, compare sellers on the same product, add to cart in one flow." },
  { n: "02", title: "We route it", desc: "The nearest available driver is matched the moment a seller confirms your order -- no waiting around." },
  { n: "03", title: "Track to your door", desc: "Watch the whole trip live -- prep, pickup, and delivery -- while you rack up points for the next one." },
];

const QUOTES = [
  { name: "Amara O.", role: "Customer, Lagos", quote: "I stopped checking three different apps for prices. Now I just see all the sellers in one place and pick the best one." },
  { name: "John Rider", role: "Driver, 1,284 trips", quote: "I like seeing my payout before I accept. No surprises, and I know exactly what I'm keeping." },
];

const FAQS = [
  { q: "What cities does Medra operate in?", a: "Currently live in Ibadan -- more cities coming soon.", audience: "all" },
  { q: "How does Medra verify sellers and riders?", a: "Every seller and rider goes through an application and verification process before they can accept orders.", audience: "all" },

  { q: "Is it safe to pay on Medra?", a: "Yes -- every order is covered by buyer protection, and payments are processed securely. If something goes wrong, support is already looking into it.", audience: "customer" },
  { q: "Can I use Medra without creating an account?", a: "No -- every order requires an account. It lets us verify who's ordering, keep a full order history tied to you, and resolve any issue quickly if something goes wrong.", audience: "customer" },
  { q: "What if I need to cancel or change an order?", a: "You can cancel or edit an order for free any time before the seller confirms it. After that, contact support and we'll help sort it out.", audience: "customer" },
  { q: "What happens if my delivery is late?", a: "If a delivery runs past its estimated time, you can message your rider directly or contact support -- late deliveries are tracked and factored into rider performance.", audience: "customer" },
  { q: "What happens to my points if I don't use them?", a: "Points don't expire, but they can only be applied toward products, never delivery fees, and they don't convert back to cash.", audience: "customer" },
  { q: "Can I return or get a refund for a damaged item?", a: "If you return the item yourself, the seller decides whether to refund you. If you go through buyer protection instead, you can choose a refund of half the product's price or a free replacement -- either way, the delivery fee isn't refunded (and applies again if you choose a replacement).", audience: "customer" },
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

const FAQ_FILTERS = [
  { key: "all", label: "All" },
  { key: "customer", label: "Customers" },
  { key: "seller", label: "Sellers" },
  { key: "rider", label: "Riders" },
];

/* ============================================================
   HELPERS
   ============================================================ */

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`${className} reveal ${visible ? "in" : ""}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const APP_KEY_MAP = { shop: "customer", sell: "seller", drive: "rider" };
const APP_FILE_MAP = { customer: "customer.html", seller: "seller.html", rider: "rider.html" };
function goToApp(audienceKey) {
  const app = APP_KEY_MAP[audienceKey] || "customer";
  window.dispatchEvent(new CustomEvent("medra:switch-app", { detail: { app } }));
  if (!window.__MEDRA_SHELL__) {
    const existing = document.getElementById("medra-standalone-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "medra-standalone-toast";
    toast.textContent = `This is the landing page preview -- open ${APP_FILE_MAP[app]} to use the real ${app} app.`;
    toast.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0F172A;color:#fff;padding:12px 20px;border-radius:100px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 20px 40px -16px rgba(0,0,0,0.4);";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3800);
    scrollToId("audiences");
  }
}

function formatStat(v, format) {
  if (format === "compact") {
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1000) return (v / 1000).toFixed(0) + "K";
  }
  return v.toLocaleString();
}

function StatCounter({ stat }) {
  const [ref, visible] = useReveal();
  const [n, setN] = useState(0);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let raf, start;
    const dur = 1200;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(stat.value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  // After the initial count-up, tick the number up slightly every few
  // seconds to signal the platform is live, not a one-time snapshot.
  useEffect(() => {
    if (!visible || !stat.live) return;
    const iv = setInterval(() => {
      setN((v) => v + Math.max(1, Math.round(stat.value * 0.0004)));
      setBump(true);
      setTimeout(() => setBump(false), 500);
    }, 3500 + Math.random() * 2500);
    return () => clearInterval(iv);
  }, [visible]);

  return (
    <div ref={ref} className="stat-block">
      <div className={`stat-num ${bump ? "bump" : ""}`}>{formatStat(n, stat.format)}{stat.suffix}</div>
      <div className="stat-label">{stat.label} {stat.live && <span className="live-dot" />}</div>
    </div>
  );
}

function Logo({ dark }) {
  return (
    <div className="brand-logo">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAABfCAYAAAA6ai+/AABWFklEQVR42n39d5hm2VXfi3/23uecN1SujtMz3dOTk7JGEQFCgCSMwAJLAgnJxtgkw/W1jeFeg7F1HX6+9mOMLxgw/tn3Ei5gMCCQkRWxUA4zkian1sz0dO6qrlxvOGHv9ftj73POPm81v3meeqa66q03nLP2Ct/1Xd+l+isnRWmFAhABpVBaoZRCEf6vFEr5X4MCBVpptFYgAILSyv8s/L3WGqUUJjxOK4XWkGiD1v4xJnxvtMIo/OM1GKNJ05TEaBItJFphjCFNEozRGCWkRmGUwhhFv+cfmyaGLDHNcySJIUsTtAnvxRi0UiSJwWiNAE4ExAH+M4ZPGD6vUFlLVVaICM5ZqqrCWkdeWAAq63BOsM7/zFmHFaEoHXlpyYsKh6JyYK2lckJpBeugqhxlZRHAOkdlBRF/Sa11SP38oqiso6qs/7349+2cQyT8jYi/FQjOSfgg/nsRcEh9A3ECIg6URsThrEVpDVI/X/h7BHH+89UXJ4HwDpXyxuLtIfyM8MfhStYXsv0XKAmGpVEomkcLKK2aF/IXHFz9+PpNiwYU/qftDRPncAocCqcVWqCyFhBM4v/GiqAFnHOgNc45rBNAI7QfXFuF1grnHMZowOGU9p8PhZL6gvh3IeIvoLUOay3iHJWtEOvCjXXNDXLOUVUO6/z3VsA5CTel/jDtdXPOIU5w1n8fXjbcKEdzr5XCRa+BEK6vNNcovg3Nb6U2/PZ7J86/DVXfn/oata+FyMF7LAqURmkJzyck8Sur+ubOvCERB3jvIVIbSPdvaotWSrc/q40u/lzBeCR4MMGfFKU1BM8m9WNEkPAEUn/UcLKsgiQYpBOonAuvocEIItq/WFkFr6IRJyAGJYJTtrky/v0qlPavq5TClVU4nQ7n7259Z8PPo1unFNZZnCic1AZF44kFwQXvoRoLqg9k+7jEaCprsU68sQSPLkr8AVDxQfaHtH5PEh3jOlhIcyfrP2z/1zGSYLVCe99UeI/1z+qHJiq4JeIPKNKxmNqMpDGC8AbDxY3tQwdb11oHq3TBiECFMFA/j3+O+tT4G+HQ/m8VjXE4BVqbJjxaJ2gliPYXw1mhdA5SjdKgxRuCdmDFIVqhbHhd2xqFCifTh1ZBOYV1LhimQ5wPCyjlvaMQbry/uM5JCCc0HsXfKP+ZVHDX4uowpxClQYOuwz/gGrtTBP8HNvbj/gJrBRZB2gjRhLD2WEaGE66xCge9/VUII7XRq+BNaiOovV7Hwvy3SfOGlGpMo/U0gkI3H7w1WEXXhdShTLUGHZmaIv4b/2cOAScYrUMspTEq/wEVDnzIoRvWtPau0omP/cpoVIj7RmtKHIn4S2+MQaGwAkoU1gaPFt6T1hptXeNyCRe3MVbn/M+c+PDUGIb4kFVfWKURXON1/GfwXqeO+Ch8PiXeTBTS5IGV+DxJnPhDqx3OSpsi1M+sNBrvgWojbe9G52g3Bknw6LU3UnQjiQjRE3U9VWy0oiBRqs0zGptQUT6h/APrC1yfyvqihGvlw1SbMjaWrVSIlU5wyuc1Ei6UDuHLP1b7sBRCEoCuc6PagJ3gtKBEhxCk0donhsZoBEVZVSRGgwjWKVJRqMSEfMb5JDvEde85HCbcNH8fvbFYVyeDBGOJEkwIHscno4IKN1AQtPfAzrWeh9bo63DmgqeIb3ycoDrBe1onOBV5G+0PKLY2+ig0Sl2suM5tlzpDrOOf6jqG2tPUB17i5Iu24FEKks4zN+ZWJ8BxrJkxiaiKamx8xvN41+0iA2vzlyaXQXf+rC5alA4+WGkE702UAqOCR3KCFQtoeqkB8bmMAiorTaipQrWR6JDqiUZ0faAk5C3hYLjgVepwrxQ477lcnXSKeC8l3iBsHJbwIa0sQzXkJPze/9xKCGsu3AitEet8pYavHCVyGz7kNa7X5xXByPz9CabQnLCQY4pq/IzE5YQ23jhCztOJUPV9bD57eJ76NYKBJ00KH7uoTuSMQkzzS9WNUHQTuLo6aUJUOBmNN1MKQTcuGKV9+AlhwSd5PkxZa8O18FWYrsNBeE1DCF0h+QVfbkuoBeoSFTQGf6NFvNfTWqOd4HDNe46TWRcqMBsqm9rLibjGELwxROWr8wfCtS4hPFZTVlUIe9pXgdKeYKVNKHVDPiHO51HhM/mCIxQuyrs4icJ9p+JR+IPYVMBt3lgf2jrvDkeL2bS5DkGq44EgiTNWFXmRGdtsq+/wqqL8TYpzndawdOtx6u8jD9Q6Me3DQPP89fPp1kOF8tK6KFgrb/FKNKJ8XqJU8GXKgUp8fhRVBEr8zcY5H9a0N1irfAlPCFH1+3Pi8QcVjNsGvKKpooKhNMaCz1MdbTksqr4mFic+H/Fhyn8uiZIbpWpjjHGQNu/TxmAJMS66qQ5p0gRpY7n3OiFXaoqV6GCoptJqvUlzWDpldpSuKEiajLspoSIshtZ1iJLmT4XaXc0k5koFI5op4+rXl8jTSGuSTkCJoMTnLRJct9KtkTkRTGNIqsl3nBNMYqis86ChAhU8ijI+rmsUlbVoVedIgnLWG9dstA+5SHyIRGrD6GIk1hGBbdKU0/Vjpb5GyifgShnANgl1ndzX0EUdqmKMKz6tbWUnaK29ETrdhBjvZVvMhsaQpAOwNF6mqfBV5+UifDZyHv73yezpb0srNQMKdZOuGitR9SmKE2Jpq7TYrjqFUvS7ukytDaV+G1pUE8e1MsGwfGKqQk7iUVTXZvFGUQWP46+PINqHCq3bqkREwIVwF4zYhWRXQsIp4nA1uhrCkXcTQmW9YdkmYQVr/WfyXsYnYlVlm/ymsq7FPERwogPS3IZxiRLPuhprsJ9wd9rke7Y+OlBYR/mlv+D+ALgQ9loDFZEGsPP3pD703cQ3aYE31UUPO/lJVB6Laiqb+q9UZMmiaBBTonZDDUnruvKqqwPAABIunnZ1DqNwSoH27QLBl7UemDPYyqJS73OslaYVYV24ZJVrklztfE6QGOU9S32BtGpaBLiA6npraW6Sde3NUSj8AQ4eR3yIqRPhBnBT/rM460LYojHCKpTmoNqSPco/ai/TJqZxbiFNGHNS51XSJKyuBi+jiCLR3VUzJTcxkNpAMC0uRoT51F40qf1St7DmuulvB9SNymcC5lFjGPXNU80H9oBUN4FWbXLVuM3gueqkNSSooAP+EiqEcKGV9e9b19UFvnTXCpTzXgDnfJ8KQDm0roEgQSrInc+Bqsq1GEhIOOsUTHCgBG0UxiSIMriA6TQ3kLo9IDix4aa2xiJ1FWSdL7GVRinXgHxNHqCiiyQ0IasGAJsTj/KnT9p2jNE6JPWtA2kLkg5gE663NAdAhfI8zm2oYUVpsaUkjplqNjSpGn4mqtO7kU066Avh8apxlDruEkgwLt3m53FlVucPSgKS4FQwAgk3LEFEYa1DJQYbktIGQXZgdFtSS9081b7ayscVVek/03CYsbqacfhwyvKhhKWVjOFSis40ha0orKayfSajjJ0t2F2fsLOxzf7OFuVon7IscdogOkOZ1H8u5UIyG7yTdFo0PtwG1Ltu/jnXYjtKabQS3yPTvnJUbrZ35BN2rWqPIhFiq8LRFFRd2YSE34Y8SdW5asif4tyUJuGu0eFZJwKJhJJUzeYwTYLb9Td1o641gJBYxNVQp8Rrk1ZVJ2rB2pXEsLVqchSf4LZJmwsnQjlpqjMXqiarBGXD8yGNJ1Ja46yjnICtFFkv5eTJIXfd0+felww4eiJBpQXb4z2ubF3j6uaYFzZydnYqplOHsgN6aoE0O0o2PMXinXewPDgJ/cNUZc7elbNsPvswm2efZLK3hRVIekOUTnDOYq1tTnvd7/IQgf9cPhw35UzbeW7KWGG2G9gJ/XEVE/Az17Q1PFyhOjmPRH1mTdTJC4bRTYxbaCTkmsF4khZ3kwNJaqdpoWb6SXXV1tTJ0pwupeJyTDV+SOpkVSTCZGjAKC1tz0NiLCUAh9Y67520AqtRiT+hFdbnIwqUURSlY39fGAwybr21z+vfsMDL7k/pz5d8/eIGn37kMl/+nXWefGKHq5dLRnsWm2tU5XtOWmlSFNr5kltpRZL1mF88zPLx2zh676u48WWv5fi3/DjH5zOKS0+y/rVPsvHM1xjv7VBi0Enq3390k13TlQ6AZN2NlplaTbpUEgmQgBMXdeEloOjSPIEOuZNEeSKh7Fad1wiBsGlwxllOnVrETQbVgHtqeORWaQJI5CWaEq62RjUDxAXgq66OfN7iwTaj2/CltQeQ6sah0bqpSnSNp9Q9Ha0x9e+09tyX8PcASWIC2utf0/8+PK9RlKXDVoZjx+d49WtSvvnbepw4ZXnquXX+5KMX+MhHr/LMkyOqUcpSNsfKwjwri/PMD3sM+xlpYkgSA0pR2cpzYayjKCum05zd3RH7u7vsbu9TWc3c4VPc+Ipv5kVv/qvc8vLX0jdT1r/6F1z58se49sIZLArT6/sDYa1He2ugUoSyrBojatBlB9bZQNOgqRwbADGEOyfO51sBna65PRJ5qiZPEengX7UHaqstiVIECTlc7ZVctxprDYZOB1fNlNU66j/UN7sJZz6TbFrmdYytb7xS8d/REqqUCZhC6BijSIxuutuJqYlOgjG6MbDGUIAk1ZSFoyw0t9y2wLd8W483vRnS3pQ//fgFfuN3z/HAF/eRcZ8TK6ucOLrKoeV5Bv2ENElIjEdYFUJiTFOK28o2OYdzQlVVFKWjqBx5WbE3GrG9tcXG+ibjsWX51H289G3v4cVveyeLh1bYfvjTXPzUH3H1648hOkWnPWxVNdiRtTbc+Kg/JYKrXPAk/pRbaQlRDZdGnM/jaiqItU0/y3fYYwCwC0YSEa1EVHi8i1IQF/Am11RJseG1BtNJ0g0qxo9Chk9IYmOilA43ODa4hlCl2p95xp1pvlfKZ/XaGP+c4cMnWjcGaJQiSU3TiNTaY5soRZYmOHFMRnDz6UXe9Bb4trdY+vPwex84x3/6L+d45uGc5f4qJ48f4dihRebnByRGU+OBsfdSgcszzS3Oei9gDKTGf1/a0IQM3BtrHUVpycuS/dGIq1eucu3qNoPVk7z0u9/HK9/zY/SX5th84BNc+fQfs/bsU6i0jzIGa6sGRba2BQoldN/Fhb63+MaqFWmSXN/moO15BbZg7YFUwyLsQv2uyXGirryruU5taBJx3TyqNrTaw8wdua15Xq0jelhdONdhSbVVlI6SMR3aCfVNbtDW+m8iD1VTQU0IP0qrcKpVw62p6ZSK2LBM3YLCaIU2MBoJy4sD3vjtKd/+toITJ4WP/fk6/9evnOPRr+QcGhzilpPHWVmcJzWGNDVNV7oxZBxpYnDOMZ4qhoOEW04OObKS4mzJ5WvChSslo8mYfuZAmdBwDA1JV9MMvPHs7o9YW7vK2pUNFo7dwSvf+79w99t/ADsds/u5D3Dl0x9g69o1kuG872ZXNoCSOhhA8CZKh+e3EZApDRW0/s86aYC9ho4R9cTafEiCYYSQ49qkOg5hNd7iPZHr9gbD51TDI7dJnJ908pQZb0FEe9Cq2ybXus1/6nyk9ky6CXPB0wTDqOkNdQ/LBO5ubeVGtZxirVVDryymhvtenPH276948cuFy1cLfvGXz/GBP1hn3qxy+80nWF6aJ00S0sS/DiINf7jOtFMj5KUw7Pf53res8G2vylleKnxTqBpDb561zUX+6KMTPvaFMSITQGOdClWfT8TLwPktS0thHaPxmMuXL7K1MeLkq97Eq3/851m590Xkzz/NtY/9Flcf+gKS9Dx9sgbyVAg5dQ4rrXHUOUdtoDTVT8h/QoO2rrQ6wF9jAHRDVYTIOWk75FIbEZHhNc8lqLmjt0kXsaXLUYk8S01paMJXdENj6qHRJngcFfIVmo5zJ+ENRqeDR9IBeW25GtJ4viQxOKdITMZb/6riTd+xz9Ky8IUHpvzLf/Es55/Q3Hb6FIdXF8mShF6WobUm0S0mUCfcAImBorQcXR3wT38s4+SxTT73oSv8xScv8fzFMSsDxfET83zjm1Z59XfexVceOsK//E9XmU5z31kOOYALN9KTtT2/twpc4J39Hc6fPYvuH+b+H/5Zjr/13UiZUz7wQdY/+ruMRxN0lmFDF7sOFS0nODQ1rW1IXx1DcVH/qyZ7dSotafm8UchxMsvM6/bQGmKEk5l8SDDZ3KH3x/V+ndzqxjhaI9EzZKsO+Uq1RtX8LKI0qOjfdfiSyDvVZWAdP2uvopTGJLC/7zh6dI73/XjBy193jSSF3/1v1/inP/s87B3mrjtuZXFhnizNwg2tP4u/ofVrVrZCad80HAz6/Nt/0COrXuAnfuQBfvE3n+cvzhQ8siY8fMny6Ud2+POPrrP73Bbv/GuG228+xEe+WJEY7wkqG1oYge/igTDVtBzSJGVhZYVqusNTH/8Tqv0R8y99FZOb7mXpjvuQi88wWruCyvoN3aHpGQWooYufqNCs9YQuFYGdMoPTxLB/TGHpEn/bwlkaTmbAhWYZnyFcmWxu9f0d7orSqCjZbUKT6lI1VQT21dTK9rF1KFJdULDTr6BjjG3iFVxfoDn4fEVx330D3vd39lk9vonWfX7t1y/xX35xnRuWb+bGG4/RyzKfMEcGqAI3uLnQda9Fw86+46ffO8d9p9b4oR/8Cr//tTH5yiGSuQV6c3OQ9WEwx27a4zMPXmXzzA4/+LcWyPPDPPhkTmJCLiPtQXG2/oAeovfVoqY/mCMbZrzwxT9n54UXOPTy17C7dAP9+17FcG+N3eefwaW9lvju4hGSgFz7HkUHN2muVXS4D1Asm2JGdQjfRMBcbaESocb1HIeKyG7QGIyKQg+dHnfsOZRWEVm8ZeWpmZK7w8ZrmmvSaZ132OxKNe3tOoEWX6yxt6947esGvPOHN1H9PZKkzy/98iX+9Df2OH3TaZZXlknCvFFc3usO8VkFd+vzmEnuOHlM8VPvy/kv/+EZfuG/b7J44jgrcwsszC8w6M8x6A/opSlGaYpen688ssHrTw14y7cf4YOfceRlS830/ZzQEISmDJYIRMuyHsPFedYe+zKbTz/F0Ve/gf10DnX3q5krdhl9/THI+m0Z25SsOmL104JqDa9FtdyazthIl9EkbUzqJP4S34O4Ko4iRVtvOW8wLf8l5mB0h9jqF4jcT5u0qpaqedDztYaoaqqhir2KNCGwGatAvGfZU3zjtyS87b3rjIsxw0GfX/mlS3z0v0657ZZbmF+Y98NpxkTvQ7f8kXDxbIjvATBma6/iLa8RXntnzk/88+fYMMscX11hMLfAYDCkl/Xo9XokaUZiErJEs5kLepTzjrcv8cATwrOXhCz1lAYVBtH8Z9ENOiozzRWtDYPFRTbOPMz2M09x+LVvYt+CuvOVLKmC0TOPIGmvIWqrMCkRo+azDZx6DEe1roIO61y13kN1Z4ro8BnoFjXM9EFrW9PxTWtnC+IbH3WRm4GqePgqYmk1aKLqNDHbCxh7LF0zpBrSkQ1JmtbC/q7w2m+Eb3/3OlvjKcP5Hr/5G2t87A8Kbrn5FIPhEKMTEhONVjWNv/b5KompCEJRVYwmE24/PmXj4pjnthIOryzTH84z6A9Isx5Zr0+aZmS9PoO5BYZzCyytLPGl5wrc5h43rIwYjwtf4QTYK4Dw2EDBbG60Tvzn1JokSRn0hhy/+RZGj32GZ3/1n5No2NvZZef138/SN30nMt5DtG46+D40uZaTU/eCtGcrSsd/q46JtiFfdxvHqkPmjcAaF2gfpgnn8fSKApKmXo/zidDLUTOtdufp2M0bkJmmkorynhrxVZ2pyXpCcmZwTlpYGg37+4pXvDrhTd+3wbXtnNXVAR//2C5/8ptjTt10E/3BMKDE/mTXWJBzEl8unCjPtXFtrNdiyYuCeWPZ2XWo/iLD4Rxp2iNNU7SpO9/aUyOSBKUVc3Mlu6Mp01HBXE/jSP0AW+UC6KeaWSWlpLks/t+hu6wsxiSN0Vz+4p9xeeUIx77/7zDa2cW94d0s5lO2Pv9x1GABrG3Zf9EIUFM+R0RdTyBTAfWlg9JKPE/SmUGKuTPSbUDLTIMr/F3SSXzUdRKlGbJUxFXozh3FTGBpyd4NLT9uqgUAL87mnThMoslzxS23ab7lXTtsjwoG/YRnnsn5jV/e4tihEwzmhk3TzQb+SjOe0pzCwJMRRZ4XzSn13OmK/dE+vXRAWQk2EMLLqvIGbVWEiPr3VpU28FIUOIvRlu2dXeb6A6xTzdQB1DiSv3mzXrjmviSJYdAfcuTGm1j/6G/TP3UXg/u/mfH2Nvb1389ga4PxUw+hekNwVZMHtQhve8iRdmqxGbyLZ40i6mk7ehQDdXX49tMUqsZr6vtT86EDGp4cHD6bJXRKx5jkQERVnWzbg3C6fTO49nF11u/iyRTVkLrLQlheMXzre0aM7D64hKRS/NavbdCXIywtLwR3HN2kiH9SP0/tIQGOHTtGkvihfxHBViXO9On3dpjmE44fP8bpW06RJIbEJIGGGY2diKMsSw7nBdOtOazL0XbE8eM3c/r0YYrSG6PWhslkysa1zYauYK1tuLdxAgwaYwxzc4uUqxMu/9d/z03HTiOLq+zvThh843vJtjcorl5CZ70OpF/fdBdTEKLOdzQY7cOWizrb4iKabTQ2qVoaBBG0EXulmuiWxFxcCT2bzlgJNDeo4c7prqFEY1BNtdU4oQZ/ieiAYQiiTa7DB3WKb/7eCXppj/GuYuWw4kO/v83Fp/rcenoFRZsEOgmDFFLjLGHM13mGnBKFS1LyuRVGVRVOvqBShVox6OoqRVmQHr8FOXQDuRMqrZtTFQ94iXMkymB1ymT0IIN0SP/knUyGijwv/XMrMPMg1zY9lVTVnGN/Q5340NXmJf4yzi+uMrl4lrU/+nUO/Y2fw01G7JMx95p3oj7yq1S2asaXY0wmnuAgaq3gpDvGFs0AqZmyu64cOTCj0N5RUTE+Q+DDdB7aHVCKy2aRA7jPzDB+ZFhKNYmutITRJtTFwJpSivEIXvNmy9LpPXa3YW5B8fyzOZ/+s4JjR27sdl2dC9SKUN46/1zGCL2eQauEqizIK8Pe2gbVZOLHaZXCpBlbGxtIPkKZAVv7U9yltQaj0VoTczj8IbM4lTHduEZVWRJjuHD5CuN9E4bmPDzfGwyoRFDOkWQZIlDmBRIMSKVpIJHZJshrpVk+eoJrZ77I9GufJb3zftzGVfYHR5l/2VtxX/hjXDaIKp9AJotmn+scrUMI16ptAcS5q9AJt8zWXWpmhla6JXkiUYBpgaCu7/Bk9xkQJxC+Vc1ED29CRwijbwXEJWY0JSy+ilEKihxuvstwz5v2KZwi6aeYRPOJD2yTuiUGw37zwZwIiVHkRQXS49RNi5y4oYfWimvXHBcv7jEu9zGqoBCN7pUhKQathLJ0LLnL3H1cM6kKepML2IV7MMpGJ1GicrbGbioOc5ETR+Alo23U9vPIwl0geeAmWMoip3KCdo5qf8Ti/JDV03eg5+ZxZcHW+fNcu7oGvX5QdfCd9zTtMTffZ/d//r8cOnYHLpnDTaaMTn4Dw0vPULzwOCqU29KZMOhKhdT31dVDAs2Xa/PLBr5w16H8S9N36lRbB5NeaTkwMcCj1Mw0QTTrotoeRD1JQCdOt+6wSzFXncQLwFWW4fFNnnpyAqWml8DmhuP5hxOOrC41VZi1DpMq9vcdt9+6wju/r8/d941YGO5ijMaVi5x7/hgf+cgJPvyxR8lWNbaqcFXZVGcqgd0R/NeP7bC1PWFnZ4EjRx1VWXWpkBGKLU5IlOHiWsVv/OE1Hr0gFHIz1paUeR4agI5UG0bTglVV8YZ3vou517+R0coNjEVTlhULG9c49uCnOfuhP2Znf4wxJoRszWB+mfHls2x9+g9Ib3k5UhZMiilVephBknVomRIDthG7v61MY6/Tof17I5VAGFFRW8C5A5RPNRtFFKi5o3fILPelUyLrKLlVdEdLYlSwGfmMlat0w8brgkKtN0tSTZYJuxvn/BRfmP/VxrCwcASjBxSVb/8nRjGZOO5/5SF+9O+O6Q03KAqNFq86lRphbqBY6N/In/7xEv/033yV1ZuOkmVDrK38XLbxCeeFxx4mSTNufvHLySvXhMd65rkFu+qRFI0rcs585YsMV45y6t77yCfTwCMW0l6Pq5cuc6wvvOtf/mv273oF63tjqqJkUlpGRUWFIR3MMf/cwzz7K/+avd29kBTbML9tmYx3vXCSc7gqR2XzHD56Cqqcsiza3CJOTq9LZ4j6SZ02QwRhSFcDqMv/jem4bdVksrlD729Qwrjvo7qNw1n3pFSXldeROIvaBAd6GXE/I4SY6bRgf6wY7fsZY0dKWaXkU4sTXzYbrSlKx4kbBvydny5wyTqjSYKICR5PIxjKwjCabPKa11XcsHKaP/7A08wtzTe5j7OWsqzoLSzSW1z2Ix9Bjqxu6zvnu8NYh3UVzvq/q6qKwdIyvfk5bFmFKkpI0pT1tXXmyx3e8e9/nUun7mPz2gbiHNNKmAaFKqkqpru7bB86xZHjx9h78LNYbRDnKKuSIs8pHRRFSVlMqVQKJkUH6bKOdEo8Dy/xqKxw4IbVAk4zwF3XaFTEv+72m+Ks1fTmD70/nqPtyI7NgHeKmOqgQ/Wjux6m/n+n4RiPsEgkeyZoDfnEcfymIe983yIXnjNMp31Wl+YZzA0pK6/MpDTkE8X3vltx8q5NRiPfmKRBWoOEBg5UytbuPve/2jKX3MT/+LNnWDqy7AlL9aBYraDQ6LyFbrG1/qvm0NogLORsY3SIbgA0bQy7u/uojQu84xd/lcun7mO0eQ2rDaNKmFqhsI7Seg27ShTFeER+7GbS888wuXgBlSQoEYxJUAI9oxnMLTI/t0ymvbrV4vyAcjJBamGlxkt0PUw7xag6ahyxschMhRtz+aNps65TCI8zad2tjpuMkQeJp/I6vJi4WRnCpI6G8HU0nxRbc0DOkQqUM+QTS29O8db3wF0vH/Hc04ZJbviB/6XP+hXYXtckqaIsLXNzir/yropK5UGOJ7DuqcdWvfH4MdWErb09Xv+GjMn2UT79mbMsHVrE2mj8U6uOu/aGEfpO9ZdI5/fx+I3WmkleML30PN/9f/wrLt7zevY2NqjQTEphUjmKynoRRCsUgSvjKkehM9R4l/zRB1CZT2hNklBMxtzx5u/m8H0vZfXW2xnedIrNJx/lRf/rv2DpltvZevQBXOBCN8YfUzGDukQNkUhMYRC6jUziKdUuatsqaMWz2ZC4qCrqzidFc48HPMbByj3Oc2L0WepkuBk6g+kIlm6AV78drj2VcuWFPXZNyRcfd0xzzdEjjj/78h6Xn9UMk0OIOIrccvRogeoL4xwSLaQJ2CDVY5SfMqisxwpSBCUZF9bW+bF/cBOXLp/g45+7yI2nT1IWBVobxKqmh6LUbJ7WnVpWUXWH+MeXyrB79hm+6x/+NJde9m3srV3z4F9lm0E2V7cmnCCVnxpwpaVyU2T5BGI0Ym2nwCjmD1MooZhuQX8Jp1Ou5Brzyr/C3Fe/wM4TD6P7gxYzkljWJDrsDWobyHBE89sRmtPgON1p6tkCqp5Liqf8o55CeDEdhaQO96IJhG03mwica5ImF+VG4kczl4+kuGyPS8WIoy8esofw5JkRo23h/7wp55aVCQ+t9fkn5TKuJ2iEorCsHq4gceRjkEQjFlQYVXJ+Rh6tvGBiow5iUy7vnuOn/4/TrP/klMeevczhY0epyioQ2+MpidbDuo66XwsI1C0Gkoz1rz/Jt7/73ex807u4evEKqTEURdkKJ9UyJUGdwlaex+sqh1UKGS7hsh6qsihjmmnIwoHNt0nRlJXDonDjEVtrW3D0NtTjX42G9l23qJUI/ggQXp02uE6TWWZEpCLv42bCWzMf5lqD6cykxYw6ZkG72S40zdQijWhUtyqSqBSsCmF4bJvVEwnbZw17kxEyEiaJQZ0pSO/eZqMUlvIJw2yFPVE4W1GVJas3QIlQVgqlBVeXykpINOjQ+NNKKPHzUVo73CTBDp7nH/2zW/ipH59wbWubhYVFbFk2HJqa+KS16jrrWC0z6NYmvT5rLzzH6970TUy/+0e5cP4KPaPJS9sy3iJN3HqIz1c+LkiuFqhkiBvMI5vraLIA2Qu5ZGQvfQu6P0/x0Gdw+T5F4XClohxPwVl0l1wUDqxpJNfq8NQBVmmVOT3qTIPttB0FOTi9SjtYl4gLGHXsgKMBthmxj45WSFxVtUwQ3ZR29Xwz9ZhCGGy/8uyY0y/rsTDu0VvuoSuh309JX6z4vfKwV+EQkIsWu15CagHH4jHNtFSUDsQKWmwYexFK7WXJ6hESrbygkA6WXOxp5pef5+f+xc38zN99ltE+9Hp9bFm11aASxKmI1xxXC14cwKQZaxfOce9dt5C9+x9y5uouQyx5qZrRX9eUvs5TFWpRvKBZJlZwlUX1BsjiIarL50mTBK/Apjj/0d/n0NFbscmYvU99EG0MReko1y4zfviT9LVBO9s9lMETuOuqaUpXt05iw6EzASmR7EOHOKGaWzjjVog0Xmjb9C1BLtYmUZGwpuqErrryQGLmu8MkwvZVy6VHxvR7JbbMUanFyhhRBeRTjizD9vouz5/Zw6Re4zbLhLllYZw7ChHyyn8VFgoHhRVyK+QCufNfUwdTCxMLBbCxpVi87QI//Y/voNjaoazKhp1fizjbyobvfSntqvC7qkRpw/bGBqePLXDD3/55ntwoSMdj8nFBOckppwVFXlBNC6q8xBaWalpSTcP3eUU5ragKiysqT75aOoKrSs/XqSowCflzDyKPf4HqiQeYPvVF35kfjxg/+BGqi89AkmFtdSApd/GMkdDhSR8skGPqwwHaVLfDJK2R6VluXKzWINKla3JQg7qtnKI2egwAxtm4C1N2SvroYcr8aWEyLTnxMs04t5x8kWJvlHP83gqZUyBDwIsMDucdvSVhUgiVQBEk2CsHVjSlU+TWUVionKJ0Ql55g5lax7i05AJX1kpufu0VfuQnb2f/yjWvRVOLIdazQDb6CoP1oNjfH7GsJ5z+oZ/lkckc6WRMVTpsXuHyCpt746jyyhvNtETyEvLS/76oqIqKsqiwZUU1rZCFowf6QXPLh3F6QOVS+ouHAEW1t4eylmww35LYoOMtmMG6rnOnOpVvx3xUV7BQqe4drP8mQc00EGeeaEY4nq6kb7er20GLozZDhw0mijRLuPj1nGMvMqxfLlm9WnD+2Zzlkwnrlx3bY8uZxyp6WRroBY7jhzR6oBgXkGmFNl6fzie6vlttdBB9DvC4FduIKUoTRw1nL+3xkrdlvOPKrfzh7z3Lwo3HcYVttWwjWqmEUZlpaUnH13jRj/4Mj6sT6J1NXJqBlI2idT1YTwTT60ZsIJS8NqTQzuJkihqugvF9pZp2YJIUZwVHgk4S0AYRg6aHMknn2kvEAOiMkzQTHy5CeFt6hMyGLtVCDCqaa4onIMOugRkNkBioq9lxEkk+qFb2QyKYWVGriNc1fIxCdrNubTTjXUOuhOHxHtt7jrkjCW4IR+7qsbFbsb1uSDMTOCzC/CGhVI6y8pJVOghFWe3zGIPCOoUxQU2qoul3tRr8CpRDkXJ+bYM3vO8oVy4d5bOfWWf+2CGqooroEy2PuZIEu3mB+9/7t3l6+WVUmxtkWUpVTjtNvQazcILKeqjAfmuUK2o58TDTTDlFDVeQtI+rSl/qKzBZD0cPl1cYnUCa4XKHK4QszQ6wH9tD2x7UWt09ppWobjxqo0lc1QYgM2o/xczdWkVTOkRf1Zlj6ba84zKrybRr61YRsOykZetFLXWlNGkvYbqnOPOpfRaWDbsjn7CeeVjIUsdzHymZbs0xHLQYxvINmkIcReWLxTqh1WF0VgsYBZPSJ75JzxOyWsVHCbsQPF0BMbywcZk3//gJNtYKnjyzyXB1GReakM1yBpMyXT/P/d/9di7c/CZG6+v00oRykndZhvXEggjOpLC7g+oNwvw2XnkqfBZVa924Cis9pDePjLeRRkdXMb162Tdb8QDieGcXu79NGqgN7RRBBI5p3S7aiCYfpTMtKR0d5XoyoRaRrQ2vgwCrNo9JOvpTMfWywYm7SFY8UtKGHYXMJk5Kut+LB+2ceK6tdYaznyzAlZ4o3SRXFZiUxWOHgzSqxRhh/rBmUnhKpXMSDERhgiQ8ytEfav7w311gsmX5gfefBqyXFVPtwgVR7diJLTMu2Uu87e/dyM4/zbm0vc9gzjcqEYVKMybXLnPn617HtTvfxtq5ywz6GVWVe/cWkGJVs9tsiZpbRl1+gu0/+P+w+Oa/hX7Zd2D3dxvFJ1s6X90BrqrQSYqaX8XtXYOkByhK69j78m9B0sMsLmOLkvFnfhWVZmRzCzhrMUa3er2qO40qsdE411BaJRpNaZaOxIJAjgNLLmIGg99mwkHqZSuTKp18JQb2OlRNHY/L0pnbbdva3trTxJANM+aHBrsy6FIBg/GZJEPrxJeSlZD1hWQJxoUX+dEEvTvt5eGVdSQDxebVkktPTig2HX/0ry/x9v/9RnKxUAWjreUxallUBdU4oRxe5nv+wY38zj8/x+5kQtrLQGumW+vcfO+duPvfw6Xz6/RTTTW2QSs/nOjgRZ0UqLSPXD7D3h/+K+zeVcrnHkbd/a3YosJo06C9TvymDOUcYjQMVxq0OUsNc4Ml5gYpKM1guARimS70ARgMl3BOKIqCMm5IxmT6mPQUcbKZxcU6noUO3tROrHSZ4DrOrruSwS3puMl01YG6rEV8JH4z0qU6NtbqNdyU5BhdkhqH0RajSgw5ialIEyFRJVpViLNUlWO4AGpOyHNfPldOUVlFYaEMXxWK7U1LOVWYYZ8XvrLPn//f6yS9hKIUCqspKkVewLQScifkpaME9rdhd/US3/nDN5AWOVYgn0w5cmKV/ht+kBcuj8lchS1K3DTHTXPsNMdNclxe4KYFthDcZI+9D/47qp110D3KvW3ceIIUlW8XFCWUJZQWKUqkLJHcouaPIUq8Z6tyjBSkGhIsdrqNm2ySUZIajS3G4IpW5bu54i2ZPi61O2TsGJOJktp6/0FMX4lnl+L0OGk6mxIPm9GFzKWVJTugZHaA+yAHtfIabXwoSmGaC8WkBAe6Z3CVBesl1nXPIq7CGEu/l+JKR38VnHFUOYjxq2iU8dp2ITIgVrG5YZFKo3oZ6VLGYx/eZria8NK3r7K/VbbiiaJ9wzIM0iOa0VrF/G3bfMdfP82f/McnWbxxhcNv+mGeXbNkMvUoasShFREwBik9zd1kGZOP/xLV+lnU3AqSj3F7W5BPEKdwtvDd7sp6RBrxIyGuQLJlXBBN3p/k7Oz7wX6N9c3LSVjnM8yZHySAwSQZxiRdSmWjJEZbGUZCQfUOpJrIFos7/6Vc36bH5OXMkoPdtm4h3chWqethLip4etVdnSJd+TMJWlwioBONHVlW7lzgxOsPU17Lkapi/tgCW0+MeOGBdfoLKRKEDsUJvWXLxCoqqzHilTJrErl2PgXXImxdLkES0qyPc5ZkYciXf2+D3pLh1OvmGe9YtNFhErI+BwpnQTBcXRuzePc6b/y+U5zZ+ibObiiSahu08SFHayQax5XKzw3pwQLlF3+b8uxX0POH/aVNM+xkF9nbwvVWwRbeoUswlFBNuWqKJAuopIc4S5KkpCkoHNsjx/JSjx/9/sMcyXb4tU/kPHNFsTynSBPd7HbSNSodiooIuTs4CRCDcTX7ZVZIunMr67WOoJwKG9ka1vnBURMV9YFUZ7uX6s4PQ3f0I2JrqWgmpypKFhYG9G4ZcHX7GtWXNlFJn717xiy/eInVZ+fZH0/RiW601gaHNNPCIpVCskAgrzy7z2m/9MpYxfaVAnSCMWmTZ7iB8Pn/Z41sOWHp1h6T/aqm4Da4kLNh95E1bO7ucVGd5Jo9hNpbRyVZMyiDNmG7SuR5ewvYxz5E/sTH0fOHG60/EFw59cmsWYKqasWhA99G19OkZg6yIZLvo5OUygpWZ7z721Z5zcl9lu3T3H+z8MDJlJecWuXBcwnrO5Zh6ikdcoDXMiNXpqIdDjIznSZtIaCi/LSDwkX3WCNd0byYWExHZVF31BSjtDzS5owGyCMzdQ0u4FBpwuK33EBh9+hZzfB1y8x90xzDJcPexXVu/q4VFk/OY8t6hsZiFhxlpbAWqkpRVPgvC0XlSUn5BHbXS191aI0xKcZkJL0ejozP/6erjK96MkSRC0UJeQ7TqWMytUwmDpdYzj0w5OyXFCY/j6oKXJ77sFLkSD5F8ikun+KmXlyI818mf/RP0HOrGJNgTIY2CcqkiK2QvQ1vLGUJ1iJl4T2T9bL0lDmIRno+ua0EFgeK33wf/NYPnmUhv8B7f3Gbu/83xWR/wn/+vqt85McnvP60Y1QIppkOcE1ztJUhs1EjVLUy/8zQWFxExOpEii69QaSzrIiZaX2ZWUEg19UKVxHH90B/ukm+QkvMOlyWcPkaVAv77K6O+I5Xv4nve9V3Ml7KUTca1ostiuEUV3lqQDZUpEOoplBZr5RZlELhhKIUytKvwhnvVoy2HUmaopRBa+NvoM5IBgMm2/DF/3yFaqp8opwLRSHeeKaCJHD+Qcf5B/oMFzNMvo+eXIViH1cWSFngihxXTKGY+PmnzbPkD/8BJhuijEdhlTEo7V8fBLe77gG7soSyCv8voAxJdFnhSoeki+AqJtbwlpv3efnmQ/zSf1rjtz+f8ds/cwOf+Pk+u3aR//jnKf2LT/OeG58nSVoF9LhfoGZUNSReRCWqIX/TEVlQkXgQHYHnOL1IYmF3dYAxE3Vso0U38YYSQVqwSLXbYj0eEO30qRuSDpKFRZzuIxPN99zzZk4uHuN3P/dnTBYrUjPHdG/TzwKViv4hoKcpc4c2grIKneC7ykEhPEsU+5sFxb4wTLOGXoGDXpaSWo2bs2yfm/LI769x97sOkxd+/LUqwQyEjWcclz6f0l8YUOQF2u6RplOkqrDJCui0HTk0GarcIn/kv/mOvOmzOOyRV9FVCxTWaucaaVFA5ck7jed24blc6VXEswWssySm5MvP7vP70ufJKyXfc8MVXupS0nSeX/vWkvPnd/jUGc2HngUpJ7i0R7TdpjMK1G6yc1GTR7pjtGpmbDlWoVJdukPDSOh2Pa9T4UhXBiueYIy9SDMpGK2Bi5dqEZQBNkdjXpXdyef+7u9wZPUwE1Py8X/423zn6jdxccei6PsdQ5WQzDsKcVSV4CpwVmFLqEqhqoSqhMrB/kaF5JG2HgqtU0oH992+ysrSCmZuwNojBc9+fBudeXqoU5adC45z/1MoVY+pHXDjyhxH5gfsjRw238cUW0g58VC+q9BiKZ76INruY2XAqROHuPnGRcpK2kG4oFfjxptQTH3eUpa4skSqCqoKZUtUVUFVQDLv57gry04OTqfk2rC+b/mF/1Hw9//vXT7/0AZ//GzKszs9tvKMkfXrxVohRNfkfQcLbulQGxpqax3Cwv1TM9WxRBvcEEG3Lu0gxhJzOWVWMCRWe1DtVrB2nFM6CViz69A5VAlrFzf5i//5KbY2tyimBZ/9/Bc5+/DzVFspVRXcubP0l/2S8KpUlJUfRKtKvyDcVr6TXVaO/bXSq4PrWEbNV3LPv3CV97z5BtLeAulcn4ufHnHly/ukCz0mW8L5TziqScKLbj3Oh37uMA/823ke+DdDfvPvLLHcSyj3NzH5BlLmaKWonvs4jC5iGXLTyVW+47ULPHVmjSwzXe6ITnDTHShGSGWRqkRKn8/47wtvPGUOZoDoDAcMM8Pt/TGvOlxxuUwZDg03LQqfWRsyKVL2t/dZTnzV1cIn0iwqj6vbiF3VFXyW7n4kObgwp200x0pYdISAFHBwB3KnZUF3v3XDL5LZl1ZdJcZA7bFVSTq1fOmpx/nbP//3OXfuAtPxmPf97N/jw1/9LFmeUFW1TKhDLwh5LtiQrxSllzgtS6Es/OqbqhD2NkqUyXwe0ah6KvqZ4cqG45lnz/Ev/9atlNWQ3sIc5z+1x8ZDIy5+siLfgRMnD/FHP1ny1tseYrE6w6p+jr/+uif4rR/aJnEWmWxiqn2K85/Hbj2DShdZWFzin73vGJ/4zNepyIISlm5lak2ClCNkuuO9eFnh3aP3KlIVngtTThHdR0wPLZbSaTbGsJyWvGp1wuGkYDEV7ujnfPSsZq9MGOUKrWSmY93OGHFdMopETci2C61m2BF+2E2a5VvxyJBJ5w69vyM7Fqey6uAmpS4hXKJVftFco+J6TAyUCJVS9G6/jWy6TrqyxNefPsv//OSn2TZCOuyRHL8Nu7aN2huhUsXKvRoxgriwg6jGT1wXT7z88Ah2B/R6vbD5LCDV1pH1FE88scM7Xqd4w6tO8ZEvjshSy8YTewgZjnl+9E3C2297gSsbCrElxXjCztUd7ly6ylcuzPPEhZRkfJby2pOYdA6nF/mDf3KaT37+CT72BcfC6jCU27pZlCHicGVOsnIrKl2GaopyghKLslXY5+fAVaBS2HuBxI7ZLjRPXh5zqAeLGWyXfq/CgIqjPTi3q/nU5hL9/jDKRSJhSekutfjL//N5oIq1reKJSunuk/TD+NfZYKLUwUVMnQormuNtSdLSJEpKVGc3o6uTY22Q0R72yjoLh1+GOMeZfIoox9yJF0NZsXd5h+rSRYyZQ2clkhhsAUpLoDAKJhLC0aliOnIUu176/cBaKa1BNNnigJ/5/57jK79s2Hrfaf7P33iW3rxCbAVacaRa5+qFCVNlsftTlPKlN1nJTfoC7Ayx7gKmt0Cplvitnz7OYPQMv/6nIwaHl3Gu1QAMUKKf4nQWGW2hhiehKgN9oGonKcJUlVIakjncdB2tE56ZrPALj+e8ZHHEy484BgPh0Q3Fp6+mjGRIf6HfmU4MQm+dCUcV/h3Tb6Wzqi8eWos2scWbLEQ6u62TZo1exzt0JSAaxn+d3SsVSXZE+wmk5c7UrX5RXa6oNin7X/g0+82uYV9h7da7fypLf/WIHz/tWyoNUnrSt2jlh/9FoZPgbbRiumup9iEzZgaorss5TS9L2N7s8ff/4wX+5B+V7E9O8R/+5CqLg5JiXHD24pTJqYKt3O+9rrVW0gXHuUsjVDGGXkqllviVnzjB9979PC//qS10f0ASAL2YM6uiiO/GmyRV5bvZSjVDcb49HM00p/N18sNgOKAoFA9vKx7dsxgsZTWA4Ry9xIQRW+eVuFTMi1MzizZbTnWHzB4pg8enXzUiRdG2mnhfEjFCy8xqvngWRx2UOpROKGsRRRXpzcWCNF5NMsUcPupPXrPJNRbBMWiTUIwrsgWDFbCl34amDIj1vBtTD88ZmG6XSKFRfd1pi9QnSWtN5TT9pYwPfn6X3/7EJv/+XZAmN/GLf3yZ/sDyoWf6/LU7p8wlju2pRWtYGcInzio++0KPdKGHqB7/9gcW+dFXPMvP/f6IM+cT5g73oqNDtPyuLQbsdAvjFze1jdkmIY2SVT3XCFAb0yNNMxiG1YIohibkR1qjdBIgDunwd2PpsXZQv6tgKjHxUmYnBeSgrEtTKet60bk0Sw7kekntrApVTF+IhWc6C0ZjaQlpVvotLw3oZfMocYirgouUZpuHUprRpGRzVKGHHucS5+eOVGAhOwW29M+XJop826LEdLrjHbk28GCesugs4198oOC1t2/zU6/dY2hO82/++x7ndif85J8afvDFJXccciRG+Nyzml/+yoBdByvHjvDv3tPju08/zl884vjVj1iyhTmP9uo4jex2iLXWuHIMdgq2mtHhcB3rVjrFKcUgTTg8v+DtTQRnSypnybJBM7tkgY3RhNJWEaEtWvkHHZLULDVTqVbiLJ5D68wkzSTNqlGgoqvR2mq8HlwHKzOhqlkYKjPzvnW4ad64xwuuru1SudIrUIZ5EmstVA7Tz1DKq01qrZCew1XK5y5B21+54GkC4KMryHctOogUSqBkdo1Ho7XgnKE31+PMC2N+5cM5f+/Nih992RlOLN/L//b/Vjx1dY+f/UzC0X5F5YRrZR9cj1O3HuUX36141fLD7I4U/+7DJXvjjPnVNHgX1e3hNJRGL51KOYJq4lsAtU6ruHajnUdgEAxK99mfjNne3UWc9WBemnJo/jBra+dCBej7ZVmWBZ3e9tDFkmUHBgI6+x67aL3ETcMZ1YY2dFlMNn/4/bNsuqb0us7upO5A/kz11Jk6uM5O1NDgNFpjkoS0l6EkYW5hjqM3HqKceikOrTVoR3ra5yiebxRNaDpaji7CztfHMOr5tkAsXqRmTlrtbo3w6AsF335vSsaUe5fWuP+eYzy8dZiNzTFj3WPsUrApb3jtXfzKO3Ju0U9QOMOnn4Zf+B+OweIQpdPQAoiuh3RLWMThXIWZuxFRma+QxFdGSmybxzjrjS9fQ7mCJM1IkxSVJqwOjvL6G+9F0j6b+S7DrIduEvx4alNHOdHMsnSRg9EnlsaNJw8OEKdaCNAkc4fe30ly41V9kXTH7CTcQbErHUq06P3MkJBb/oxPYoux48jNfb7xnSdYOFVy5MiAtXNTD/tnFnOj1ABk6JNGJZ7zRuQqy96ZKaYaeInUZiit29CIt3wYJYxHjs1xyVvvMVzarDjVv8p3vGSB6eBmnl6DuYVlfvitN/Kzrz/PYHqWvSJDifD3fz9nMx+S9Xuhez1jKErR6feKw5Y5Zu4EOplD2cK/eee84YgLiVkVkv5dsCO0SSmdxVJiXMldi7ezPtnmWnENsQqjExqxUmY+c8R0jDGZGd5CtJIx2lUwm4LEhiaCSYYr71fRiYyT2C7NoV040RlNUXSUHESuM/XSlHkhrhtFVcHyScVb33c3g5Uhj194AetGqF7KzjkhWbaowx6iqCfpvNJTO74qCqr9ivHzOakaBkVwHc1Mt2EiVrkR51AJPHOp4r6jjpuXhM2RJsnX+bZb9nn1XUd5x8s1bzn2FLubm0xsxkrf8vsPVHzgKynDxQESsB6FbncniMwIJoU9R1WB7h3C9FbA5lB7GXHey7jK/wzATtDVHoWtOLq8wnu/4W9y95E7+MTjf8YdN93N99z/DrbzDS5vr5El2XX1empOTHvjuwrls2ILB2buaUtrmRl0DHIf7fY0EQ4skmgVHPRMeyAC5Rqi9awWYytWJHhjKSthLktYfrlDDmd87bmnEZUw2i3YuzqhWk9JjwmyrFqFhSjQ+mvtR3zLrZz8oiM1w5ntKqoDGrZdDGnWI5eF4+qe5a13wrSwVJKwszvlxuwq89UVru04jxw7y+7I8fP/QzFRc6RpgtJJNOxFZ++0F7Osqx+HsyWk85j+KmKLkLtY/1X3clwdqgpcvsnK3BLvfsX7OGpuxeghp07eycnlO8nyZe48egdXpxfZ3N8O64LUTEbSetW48DiYws6i96qzBoloM1udauhWzl1HhG7dkWNoW94zklhR3ygWVZ4VE65DmzGKInccOTzk+37qCMu54/OfeJLRRJHvOOxE2D2TozPB9XxR4a+pp2W6kLs45xuQroJybFHOdNBnOu+1Gz59AqwRpcmGKQ++YPjsc0KGMB5ZnDNs7idsTzIQxXhsSRH+29cUV3b69PopgrmOBo7MkJe6DGkp98GVHY/SGEttPFKhVEphS+5Zvpe56VGubl1iOsqZz49S7Aqbe+uUW4aXLr6imcboelPXYCydYkVmFKUaLpN08rzZ5mXbZgn7kpLhoffHClHxiWmXScR6iMHnRJXAbH6jor0CKmpiOSf0h4a3/fBxLttzLJ9IWNwYcOn8mCy1XPrzLYxe8Gy7I4IzdU89OkFNY9UPIhVXprCTkCRZ54R1FbSk02tpJ0MdlYUrO5Y33uyY5NI+vw2LJ5xjZ+T4V58ylMmQxCQQNs7VBqMiglFMdW0XVXkqRTI81j55tE7YG0v9c4dxI86vPcP6xrP00jnms0PsT3epKstossOXnvsoXz7/OSQ1YYSEaI1im4+oGcqtmsFlFOo6smQzqcTMyK3ujMm6tiw8oDUvqpMgxdSG+MVVRxEpmqtVClsqDt0mfH3vBa5cslxen7L6auH0XMLFD21izAImS8E4nPF5oLMEiQzBWd9s9LsOA7Vy7Jrhh/hkd9bpzmCgzYQfhqxvePRqwgPnIBNhMhGmE0s+sYzGFYk4Pvi4Ymvco5eazv7LZk1eA3iGIbNoUXmzzsfluHLUegBX5y/hK3gej6MYXAKPrX2R0WTMZDJimk+Y5mOKouChaw+yywiD7mzQE2cjRD86JJ1FoNKZjuwobEnb3iGSlq8XeCHNcopGA3xGtUG6KVJQbbjuci/V6tR33HSTlPu8YWdnzGBbI1MwQ8PFZ8Y8/ZVdTH+JpJehRCGpf20q1bA9vbG7hpAsKJhUyESadYFKHdzbIpGagTSwfVjfo03YUmv44NOaFx2qmOaQmHom2bFWKD78bIru+U1vBHKWiyZE40pEYhXtJo/w1u+qCSoxdSYfDMzzDDwnyfpwR+KxlrnjOAu7k11yO0GhsVXB/PAwhSq7Asw10u4kAs7lOv1q1fT6REmk0NxFdVVMu410fpMWcwlKi/G6HVSEyaiOpHq9YKKp26OeiIppgfXNcw60Y+vZKWpemDveY3ou59KXxqjCbyzT9WrcxCHOq0uJtFi2LyMFrAIjSG6RwqO4dS+sjtXqgLeVKJ9pL7BgSHoJD61nPL1ectOCZTL1PJOlvvDpc5q1UcZwPqyE0bF3iQaQr7dIrLMKSBCXo9wAXDEzURFOu7PhhCfNVt1EMqR0zaRBvR0F5bVgVMysk7YVrGrlzNn2TqeveHCDm5oRkFIzAEqr3hD1H+LpABXnKTEVczahagy628hqm1sOwSIu5crn9lDZCCkUJpsnGfS8ilWwZjHOV0dOUOLxF0JV1Lp+hZv6hLemTmjtx3DFOe8JhOvM/EFpvStOEn/hU22YWMOnzxt+4G7HtPCM/kILn7qYotLMk80Lhza+AspSTZroZobc6+x1TUZ03f01SGVR5R4kiyFXYaY4CNp5oa3rlyc4vnblL0iUwQuXKSyOUofB/abtomMC7cElInJAYigSUpgZ1teqo/OrmklY7zuTTnUxuzugUfyeAe2iHTvMcGU63b/QXXaNYpzGpClqfgGxFr1gAsytw0Y2r09XpSBVrXIgKBNUsmIdWqVwYwtOo1NN5YR8JAyGfkFnfSOJtrWqIBy4tDjEaNjcnvjHikZnCV++mvLmm8rQo4Izm5qnd3ooo7n5xhVuOtpjP4elYcLZKzkXr+ySJP4AVZUlnzhI0rAQIeJgiIIygdE65ugh0sR/VlX3kpx08gwRTWJ6oCyXJhc96UrpoDiQ0TeLIeGOh+pVJLvS3QAstcysOgj9x1KJ8JfQZ6IfJgcEfiMD6mj0qllwSg6ICh3YYFovtyBavaI8/N/rpQx7mmw4wOoE47yWy6VrE2wxQVkveqiT4Oec+AsWqRnL2JJIRl45VhYH/OP33cD/9UeX2d7NGQySaCm4F3fUCiYTxy/84JAXnc741p8rmOQV2mhSMWxOM57eyrlnuaSq4KvrCdamLM0n/JPvGzKdjnnsYsUrb+9T2QH/66/t+YWgVlhZ7PMj7z2J2DFlBcO+8opSKKqqBCmpZMB//phlZ6IwupZxjTjReFa/2AoxBcdWFmFxDlvlKAx5bplWFWV4vNYmmo1WDWNAOt3GdgxWuqoyHdhfzQxeXw9Ng7BroLPCROSAKGAHT6i1TlRH8D5aH9zmOK2rk47er4hmnFfsjh0/favwosWKicByT3NVr/IPPnQNazRqmOEqoSHQiWqakG5Uoq4JlpTFuT4/9/3LlNOr/KN3HeGf/c4ak7ygl5mwug/GuSUxGlcKz1wYc+aFdTa3LKaX4Cz0Ew064cG1hDvmcwqneWy7ByZlaU7x+Uc3+fU/vAQZUAg/9o4bWFlM2NgVJhPLW1+pke0zfPyBaxw6vMSjX98JGv4VSZJgrOWvvXGZV99+kg9/CdK5QJ2qvUxDwlbY0XneeO+3ccfCvexNt8nUgL1yi/9+9s+oHCQmxdSKDRLjLboJ/yiNc7ZNLYLWz+x5l+uYRbwyZ5auq5GuMtGsYnhnmkC1FMRYIy0efhKZGdWVri/yi0UNqUnQJuF3v7LG8s4L3Fe+wNHt5/lW9RT/+I034S6W6NJBJT48WaAS/28BuTjFjmBpaZ5/+D3z7G5e457jBjve4GfftcJcP2OSW6wICwPFX33tAm977RKvePES99+SMcr7nDzc5zX3HeUVt89TlX4j3DO7CZMKtnPF5UmKSRRlWXmZjoUlhsuH0EteRszr4vrKzRYjHn9hwqPPa152ep4X3X6ce+44yb13nmR5aYmvX0o4c7HE7p0FV4Qkt2rLalehlaHYOcsrT76Ul2dvIL9g6G0cQl0d8vmvf5ZSHFnaR5skUnaKZ6gjHxLkKZoJyKabLR1kOgYAiOaxO/sKoqijpQF64nV98pdvZ2s8kYpcV6wZ092U1haZQfKjwd8UqXKcL4b8/BPzjEpDqRNeuDriHYfW+PHX3Uz5/D5G+XxGKvHVAiCbU2Sz4ugNq/zYtxpUsc2ymfCfP3iO1SyH6RY/870LHDs0pMgtRxYt33jLiFfdsMnb7tlnwW7QVzn33wzvfdU+JxZznFNkiWLP9lmfGp4fGUqXYOqNb5XDaYMxGYKimBRIWDYOfs3fwjBlNDY8+vV1Xnu65Pblfb75DsXLT2kUKcN+j6qYQrHlcSBnfSntKrQ25PsXObl6nDcc/iusb+xgk4LEJHxu98NccufomcFM5RK3cmIFhnAfdKs73FVNkA514UBC7CKMbWayQM+kHM1NlxjtikSEveUGZX85sEWyszi7CyDJgX3LThS9nuahzR7/6omUPg6dJFw4d5kfO73DO15+mvL5PW80pfNGUwis56B7fMNdhunuFvcfzTkydDy+sUzPTXjp4TGTrTXeeKdF6YyqUuxtTTh7ueDKRs76VsnNhwyXtiZ84LNXOLyUYkvt6Y465emdlK/vZpCkHhYXL5OamASttW9xFDYaFhPK0lLkghkMefyyoSpK8vGU6WTMZ5+p0GlGPsnBDKHYRor9wOu1aJ2SjzY4POzz3be9h531HNElAz3HV3c+w9P542TZShvS1axiuYSf6QNChirixxDt8W7uheqW9p0udmd0SJpcsMuZEDrzRqozh6sOtCIOKLbO6pHE8p4z1ZYfyUjoDRI+ebXvjUY5SAyXnjvLz7+04jvvPUl1bt/HbDRsl0iekM33+cAn1+mrnEeen9DXiv/6Nx3zqePJizmpm/I7H1tj2K94bq3ikSsJt51Y5tYbFnhyY4GPPrDGK0/lPHJB8e5XlPzVNx7BJClaw1O7KZenPbLUtwEUEspqxWRaUZWawkaYtvIldV6CLYSz647Hzxf8P5/c4mtnpjy7DtYZcgup9iuJ7fSaT1yVJh+ts9wT3nnf32C6obAqZ94s8OjuF3lw7zOk2WLg7nYhDVFRK6m76Txa1yed/UcHQVc5QIEmXmwx04MKfBg68u+qs30k7iEpZl+1q9Hfqk6pg5yuGUpPV1fPpIqnNjWXp45vPGIh0eyurfFdLz3KRXeYp85cJlnqIRsVJhmQpCnWCa+5xfLHDwv7o4Jf+eg2YlJ+8wuW21ccX7iQkmZ9rLV8zytTXnfTNqfmxlzYtDx4qc9dxwzHVgZMxyXL/SnPXxP2cs2ElFz1yBK/IbaXVLzmtoQ8XeHQvHBkOeXeo5bHLmtKpyktZLrk/lsy5peH3H1yHpOk3HJiHp0Y7jy1wsnjPe6+MeXBZ3OuTQconWN0n2Kyw0pP+L6X/E2q9T55NWE+W+Sr25/ii9ufJO0tYpK0XXoed+SbsbK2n9W59tdBeq9XKzfksgOpiBx4vDeYiJp5UIK1C+B1FUGub0TMGluU+XY5F60HExTGKJ7Z0jyz63jDYUu/p9lau8rb7jvMZnaUxx69QpYOSXo9tNIUGF5/c8lb7k25ti98+KEB33BPwlvvS5kWjs+fH5IkKT3juG9lh82x4dIOnLlUcnwpRUzC3m6OFcN0knN1D66O+yRGdSTZKzG8875dvuuufRbnE973kj2mec5fPNtDlOHIoubtr1ni1uM97jou3HODYr4naCpuOpRy/ym486gl1Y754ZDzexl5oSknmxxbnOd77vkbFOsZpSvo6YwvrH+Yr+18jqS/TGJS0CaESx2qnS51o51HinY0BoK9zFS4B9flSOdQH1g5MrOjomkNiJJoACvyHvGMSlgz04WPHbMsmNiPuIg8pWYULT3Wr8NGWIUFsoHwxU3FTz6Y87MvyrlrRXP5ycf432+/neOr9/Mf/uJ5ssrRG2SowrG5J7z86IhMDzAL86Rul9PDggtrPXSSILZkZz/nlz9Z8Za7LV+7IFxeT4B9UD3QmvvvmLA4P+D5/RWOrKY02vVKY61XhXr/n+2RqSnKVPx6ZdnYB6ctpAnTyYiHHjnP05mhEl8JOtGU1gN0X6Fsdi1ZMqaTw1S25K5b7+aNR76d0RWFUQ6xBR9f+2+cy58jG6yitNfobQwkkr3tIMpuVtg/BlZrgqK6jn5Mt8lY69o0iyNUvN86mFbv0K3SYdUF1SciBYJGUFPrGZwmFkFud1W3QN5MjJwFg6S7c1CcDQqWFWVeMSDnJ+7K+c6bHNOJZfHIUb4091L+7ec3uXR1i7lM4fIdjBQ4UeR6ATvd99RJC2ruEMsLPQ4vZxyaVxyadxxbTrjpSJ+jC4qVOWGYgVIVJjUsDQ2pdmFXga8yrFVUVphUmq19xe5eznY+YD+H7ZHi6g6cu7LDUxdHbFzbh7H1yCwlUHmpM6N9/hUUJdTSgNfd/lLu693P/prQNwmX97/O59Y+zB77pNlKxB7UET+JaK1Ne7drqdzu/VHXud6Rkqh0JVjVDGG/29ppR1ZU79Bts7SWJvTpmmEnsyogqrNdPV4b09X7VR1QSHWAvrZzLKHqqlfpOWdRrqKsKiQveMORgh+5s+J4WjHoD9g++Up+9Sn46OPXkHwfUSkoww1H5jh9rMethxz33JRx82rJoWFFZgRblljr2NidsLlbsbNfsj2y7I5hWikmhWOcW0rbAFQoJWSpYdAzDHua+Z4PNfMDw+q8YWU+Y2EuY9BPmF8YMqkSru6nnF0XHnsh56kr8OylfXZ2J6TKMbUlq4tDvuH0N3K8uoX9zRIrUx699lmeHD0ESZ8snfcEb22It9x1Vb26oCkz9NrrLDrqqEgF3ZII9uje41gqpGtYoPqHbm8YIwfkVNXBJUst7U9aji8z696EDnO/0/GGGQRRNShnvZNH6v2LrvY2lnlT8s6TBW+9IedYBtmNp/l4fhO/+uV9XnRjwbvvTzg0V5GoksvXxpxfL3juasXz65ZLW8K1sWKUK8SGwSZa6dQmB9Mz3dtWmjL0e2Jk0+u9mFRY7DmOLgg3rRpuOWK460TGyaMZc/PzaN3nwbMl//HPN1ldvptXHXo1XOszykdc2H+aRze/zL7sYrIlr16lTZPgSnN91Yzm3EzLRlyYoojvW9RcFLlOVzomx8tBg4n6iPW0hziH6h26PdqtpzrAXquuOYPNRNN1qNkF5gf7Sx1lqkgMOlYQaOkHrhmwovY2WIrKQVFxtFfwPacqvvnQlJtXMtaX7+IPzjvG1TWeeGGf5y6XVMyBNWASSDQYhUn87kgdPKGm3YArnfd7/W0LcV7vnJ+x8ktC/QJPW1ZB/zWw5zIYml3uv8WwtHILRr6Bw9UpdrdHXNg/w9M7D7FRXIV0SJYOQ+gx3WqoE+q7+WU3REnkFa7TBZrZF9A9vO4gohuTrWZW6ISQJAez5E75pjrjCyqOb7NTBddZaTH7z/iDuZBgqlmpiljuLDDUwO9QpKg41Cv5htWc7zhecOvheR6rbuAzu0O+ejVnbS/32151W4EdlA2elVm7fti9biEaWGh05s79e6yco6ymZP2Mk6unODm4jaPqJvK9Kc9uP8z5yTPsVNuQ9EiTIdoEQ1E1pSG6kqqrohGnJ+p681a1InvT04s5Vm4GvG8XhjFLZK/5TdKOzdTri7zBRIYQ5yWzLxDTDg8qz7RLtzpzSLONhmYLrUQjIC1zrJW1l05S3KCQXuyW3AZFZyrunS+5tTdldXWZYuUEz+c91vaErb2xN7B6tGSGvtHkaB2SeCstrzpTfxGDLtKz9ctJ/SnNEsPK3Dwnl27kiD5EOh1ycfM8z+88zabdoKIA0w+GYqLd3rX0fm0cOtKZVF0Gocxq8HTzE0HNtn9m2AfxcJ+97kgsByTMWoWrJultsg51UIZGzVAe68dp1e01Odd9jk6+o2aVZrqTkDFDL3QfWhOVqAKI4GuFUDpLUdX7Zfzs8tygz7DfRyd9StXDuQqxRUeaTWuFUXT2UR48IDOTEjOD6koUxhjme32W+nMMyXClY7Q3ZW1vje1iHZt4jkyqMs9x0Z7uUcvONxKtnVB/kBfdKYmbUKM6nB+lTdDsnV1+Ho0Pi3Tui0QqhkpmZstmYPzWw8QEKq3+ksYj0dC3V7OspoUvGcOV7Q17bQ6p1f8/QnpzHqxz5JOyw9DO+qlnw0WYwnQy6awBbrimoqhXejY/d87nEibkMUoxNzeknxnvERxMi4qqshhjuhwRkWjxhv8cifagojYmGLN/XE8bkkDWKoqCvfEepS08e72qwPSDmKKagdLbMlkrjTaaxCQkpl1HIxriFfFdGKLLfvWj7BpbWYoiD6RzodfroY3uSIq0dIo47MoBdgIH6NFBzyY2mJqid71w1Fiq9hs5jh9f4I7bj4dtZX4v80OPnqXINSbprve7rvyZUljnmBv0ecl9NyDKQ0tGa544c4HNawXGtOMqd9xzF4PhfAMw1biDc22I0Er7WexoTrg+QU888giT0Q5ZluGc8OJbVrjphkM46zBakSQq7FXw2z+cE0qrGBVwdXPKlY0RO7t7pFpIE03lLFVVYa1twEmjDYhiIetzz533oE3iNf2a7r3nJDupF0g4qqpgXE64trXBxuYWCk2SJtefi56dgoooJ1VVsnLoGKdvuYXJNCdNDM8/+wyj/T0/h0VL5lZqRuk7SnZmZ6riWl4kkMDjmaODe6m7PQaloJg67nup46//+ITdrRKdCKtLS3z0Q0f5L792CZP0iZf3duQ9G1UBr4D5ve87zjd/V8F0WiEizM/3+NVfqrj8UcfcnEGsYNKEI9/9I5ilY2hboo3BGI2JBuRMJy9qG55KKVJjeP7cz5CPtkmMZmvq+Ltv2ufdr9xjewS9vu9AK62afQT15y9dwm455IXt43zuhbv5vU9e5NkXLpNoEzA507yW1oZRPua2w7fxQ2/8Cfb2cxKt/SREWIqF9iR2H1k9012MMKp2OL93hj//yid54eJlkiRpQ3l8g6N+XbtlxuJUyovf8kMkCydJdkf055c5Zv6AM1/6ELo/5+VVVCDEyV9Gmop0gkQ6lIX64P3/AGdMT8+kOtOmAAAAAElFTkSuQmCC" alt="Medra" style={{ height: 30, width: "auto", flexShrink: 0 }} />
      <div className={`brand-word ${dark ? "on-dark" : ""}`}>medra</div>
    </div>
  );
}

/** Ambient preview cards echoing the three real dashboards -- purple (customer),
    orange (seller), green (rider) -- without pretending to be literal screenshots. */
function RolePreviewStack() {
  return (
    <div className="role-stack">
      <div className="role-mini seller">
        <div className="role-mini-top"><Store size={13} /> Seller Dashboard</div>
        <div className="role-mini-line" style={{ width: "70%" }} />
        <div className="role-mini-kpis"><span /><span /><span /></div>
      </div>
      <div className="role-mini customer">
        <div className="role-mini-top"><ShoppingBag size={13} /> Customer</div>
        <div className="role-mini-line" style={{ width: "55%" }} />
        <div className="role-mini-badge"><Award size={11} /> 320 pts</div>
      </div>
      <div className="role-mini rider">
        <div className="role-mini-top"><Truck size={13} /> Rider Dashboard</div>
        <div className="role-mini-line" style={{ width: "62%" }} />
        <div className="role-mini-fee">₦7,500 today</div>
      </div>
    </div>
  );
}

/* ============================================================
   SECTIONS
   ============================================================ */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-inner">
        <Logo />
        <div className="nav-links">
          <a href="#audiences">Shop</a>
          <a href="#audiences">Sell</a>
          <a href="#audiences">Drive</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-actions">
          <button className="ghost-btn sm" onClick={() => scrollToId("audiences")}>Log In</button>
          <button className="primary-btn sm" onClick={() => scrollToId("audiences")}>Get started</button>
        </div>
        <button className="menu-btn" onClick={() => setOpen((o) => !o)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {open && (
        <div className="nav-mobile">
          <a href="#audiences" onClick={() => setOpen(false)}>Shop</a>
          <a href="#audiences" onClick={() => setOpen(false)}>Sell</a>
          <a href="#audiences" onClick={() => setOpen(false)}>Drive</a>
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#how" onClick={() => setOpen(false)}>How it works</a>
          <a href="#about" onClick={() => setOpen(false)}>About</a>
          <button className="primary-btn wide" onClick={() => { setOpen(false); scrollToId("audiences"); }}>Get started</button>
        </div>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-left">
        <Reveal><div className="eyebrow"><span className="dot-pulse" /> Live in Ibadan -- other cities coming soon</div></Reveal>
        <Reveal delay={80}><h1 className="hero-title">One platform.<br />Endless <span className="accent">possibilities.</span></h1></Reveal>
        <Reveal delay={160}><p className="hero-sub">Shop from multiple sellers, sell without losing a Naira of your price, or drive and see your payout before you accept. All in one platform, priced in Naira, built around points that are actually worth something.</p></Reveal>
        <Reveal delay={240}>
          <div className="hero-ctas">
            <button className="primary-btn lg" onClick={() => scrollToId("audiences")}>Get started <ArrowRight size={16} /></button>
            <button className="ghost-btn lg" onClick={() => scrollToId("how")}>See how it works</button>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <div className="trust-row">
            <span><ShieldCheck size={14} /> Secure payments</span>
            <span><Zap size={14} /> Fast delivery</span>
            <span><Star size={14} /> Trusted by thousands</span>
          </div>
        </Reveal>
      </div>
      <Reveal delay={200} className="hero-right">
        <RolePreviewStack />
      </Reveal>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="stats-bar">
      {STATS.map((s) => <StatCounter key={s.label} stat={s} />)}
    </section>
  );
}

const TRUST_SIGNALS = [
  { icon: ShieldCheck, title: "Buyer protection", desc: "Refund or replacement if an order arrives wrong, damaged, or doesn't show up." },
  { icon: BadgeCheck, title: "Verified sellers", desc: "Every seller meets response-time and reliability standards before earning the badge." },
  { icon: Clock3, title: "On-time guarantee", desc: "Late orders are flagged automatically and made right -- no need to ask." },
];

function TrustSignals() {
  return (
    <section className="trust-signals">
      <div className="trust-grid">
        {TRUST_SIGNALS.map((t) => (
          <div key={t.title} className="trust-item">
            <t.icon size={20} color="#16A34A" />
            <div className="trust-title">{t.title}</div>
            <div className="trust-desc">{t.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Audiences() {
  return (
    <section className="audiences" id="audiences">
      <Reveal className="section-head">
        <div className="eyebrow">Three sides, one platform</div>
        <h2>Built for everyone in the loop</h2>
      </Reveal>
      <div className="audience-grid">
        {AUDIENCES.map((a, i) => {
          const Icon = a.icon;
          return (
            <Reveal key={a.key} delay={i * 90} className="audience-card">
              <div className="audience-icon" style={{ background: a.color + "1A", color: a.color }}><Icon size={22} /></div>
              <div className="audience-tag">{a.tag}</div>
              <div className="audience-title">{a.title}</div>
              <p className="audience-desc">{a.desc}</p>
              <ul className="audience-bullets">
                {a.bullets.map((b) => <li key={b}><CircleCheck size={14} color={a.color} /> {b}</li>)}
              </ul>
              <button className="audience-cta" style={{ borderColor: a.color }} onClick={() => goToApp(a.key)}>{a.cta} <ChevronRight size={15} /></button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="features" id="features">
      <Reveal className="section-head">
        <div className="eyebrow">What makes it different</div>
        <h2>Not just another delivery app</h2>
      </Reveal>
      <div className="feature-grid">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 70} className="feature-card">
            <div className="feature-icon"><f.icon size={20} /></div>
            <div className="feature-title">{f.title}</div>
            <p className="feature-desc">{f.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="how" id="how">
      <Reveal className="section-head">
        <div className="eyebrow">The short version</div>
        <h2>From cart to doorstep, tracked the whole way</h2>
      </Reveal>
      <div className="steps">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 100} className="step-card">
            <div className="step-num">{s.n}</div>
            <div className="step-title">{s.title}</div>
            <p className="step-desc">{s.desc}</p>
            {i < STEPS.length - 1 && <span className="step-connector" />}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Quotes() {
  return (
    <section className="quotes">
      <Reveal className="section-head">
        <div className="eyebrow">From the platform</div>
        <h2>What people are saying</h2>
      </Reveal>
      <div className="quote-grid">
        {QUOTES.map((q, i) => (
          <Reveal key={q.name} delay={i * 100} className="quote-card">
            <div className="quote-stars">{Array.from({ length: 5 }).map((_, s) => <Star key={s} size={13} fill="#F59E0B" color="#F59E0B" />)}</div>
            <p className="quote-text">"{q.quote}"</p>
            <div className="quote-attrib"><div className="quote-name">{q.name}</div><div className="muted">{q.role}</div></div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const TEAM = [
  { name: "Amaka Eze", role: "Co-Founder & CEO" },
  { name: "Chidi Okafor", role: "Co-Founder & COO" },
  { name: "Farida Adeyemi", role: "Head of Operations" },
  { name: "Tomiwa Bello", role: "Head of Engineering" },
];

function About() {
  return (
    <section className="about-section" id="about">
      <Reveal className="section-head">
        <div className="eyebrow">Our story</div>
        <h2>About Medra</h2>
        <p className="section-sub">Connecting customers with local sellers, riders, and healthcare providers in one app -- groceries, pharmacy, everyday shopping, and telehealth, delivered fast and paid for however works for you.</p>
      </Reveal>
      <Reveal delay={80} className="about-body">
        <p>We're building for Nigeria first: transfer-friendly payments, delivery that accounts for real traffic and weather, and a marketplace that treats sellers and riders as partners, not just suppliers.</p>
      </Reveal>
      <div className="team-grid">
        {TEAM.map((t, i) => (
          <Reveal key={t.name} delay={i * 80} className="team-card">
            <div className="team-avatar">{t.name[0]}</div>
            <div className="team-name">{t.name}</div>
            <div className="muted">{t.role}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FAQItem({ item, open, onToggle }) {
  return (
    <div className={`faq-item ${open ? "open" : ""}`}>
      <button className="faq-q" onClick={onToggle}>
        <span>{item.q}</span>
        <ChevronRight size={16} className="faq-chevron" />
      </button>
      {open && <p className="faq-a">{item.a}</p>}
    </div>
  );
}

function FAQ() {
  const [filter, setFilter] = useState("all");
  const [openIdx, setOpenIdx] = useState(0);
  const visible = FAQS.filter((f) => filter === "all" || f.audience === "all" || f.audience === filter);
  const setFilterAndReset = (key) => { setFilter(key); setOpenIdx(0); };
  return (
    <section className="faq-section" id="faq">
      <Reveal className="section-head">
        <div className="eyebrow">Common questions</div>
        <h2>Before you get started</h2>
      </Reveal>
      <div className="faq-filters">
        {FAQ_FILTERS.map((f) => (
          <button key={f.key} className={`chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilterAndReset(f.key)}>{f.label}</button>
        ))}
      </div>
      <div className="faq-list">
        {visible.map((item, i) => (
          <FAQItem key={item.q} item={item} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="cta-band">
      <Reveal className="cta-inner">
        <h2>Ready to get moving?</h2>
        <p>Shop, sell, or drive -- pick your side of Medra and get set up in minutes.</p>
        <div className="hero-ctas center">
          <button className="primary-btn lg light" onClick={() => scrollToId("audiences")}>Get started <ArrowRight size={16} /></button>
          <a className="ghost-btn lg light" href="mailto:sales@medra.com" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Contact Medra</a>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Logo dark />
        <div className="footer-cols">
          <div><div className="footer-h">Platform</div><a href="#audiences">Shop</a><a href="#audiences">Sell</a><a href="#audiences">Drive</a></div>
          <div><div className="footer-h">Company</div><a href="#about">About</a><a href="mailto:careers@medra.com">Careers</a><a href="mailto:press@medra.com">Press</a></div>
          <div><div className="footer-h">Support</div><a href="#faq">Help center</a><a href="#features">Safety</a><a href="mailto:hello@medra.com">Contact</a></div>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="muted">© 2026 Medra. All rights reserved.</span>
        <span className="muted"><ShieldCheck size={13} /> Buyer & driver protection built in</span>
      </div>
    </footer>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function MedraLanding() {
  return (
    <div className="medra-landing">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" />
      <style>{CSS}</style>
      <Nav />
      <Hero />
      <StatsBar />
      <TrustSignals />
      <Audiences />
      <Features />
      <HowItWorks />
      <Quotes />
      <About />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

const CSS = `
:root{ --ink:#0F172A; --muted:#64748B; --border:#E5E7EB; --bg:#F7F8FB; --card:#FFFFFF; --purple:#6D28D9; --purple-light:#EEF2FF; }
.medra-landing{ font-family:'Inter',sans-serif; color:var(--ink); background:var(--bg); overflow-x:hidden; }
.medra-landing *{ box-sizing:border-box; }
.medra-landing :where(button){ font-family:inherit; border:none; background:none; cursor:pointer; }
.medra-landing a{ color:inherit; text-decoration:none; }
.muted{ color:var(--muted); font-size:12.5px; display:inline-flex; align-items:center; gap:5px; }
.eyebrow{ display:flex; align-items:center; gap:7px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--purple); margin-bottom:10px; }
.dot-pulse{ width:7px; height:7px; border-radius:100px; background:#16A34A; animation:pulseDot 1.4s ease infinite; }
@keyframes pulseDot{ 0%{ box-shadow:0 0 0 0 rgba(22,163,74,0.4);} 70%{ box-shadow:0 0 0 8px rgba(22,163,74,0);} 100%{ box-shadow:0 0 0 0 rgba(22,163,74,0);} }

.reveal{ opacity:0; transform:translateY(22px); transition:opacity 600ms cubic-bezier(.2,.8,.2,1), transform 600ms cubic-bezier(.2,.8,.2,1); }
.reveal.in{ opacity:1; transform:none; }

/* brand */
.brand-logo{ display:flex; align-items:center; gap:9px; }
.brand-word{ font-family:'Inter',sans-serif; font-weight:800; font-size:19px; letter-spacing:-0.01em; color:#0F172A; }
.brand-word.on-dark{ color:#fff; }

/* nav */
.nav{ position:sticky; top:0; z-index:40; transition:background 200ms ease, box-shadow 200ms ease; }
.nav.scrolled{ background:rgba(247,248,251,0.85); backdrop-filter:blur(10px); box-shadow:0 1px 0 var(--border); }
.nav-inner{ max-width:1180px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding:16px 24px; }
.nav-links{ display:flex; gap:28px; font-size:13.5px; font-weight:500; }
.nav-links a{ transition:color 150ms ease; }
.nav-links a:hover{ color:var(--purple); }
.nav-actions{ display:flex; gap:10px; align-items:center; }
.menu-btn{ display:none; }
.nav-mobile{ display:flex; flex-direction:column; gap:14px; padding:16px 24px 22px; font-size:14px; font-weight:500; background:var(--bg); border-top:1px solid var(--border); }

.ghost-btn{ border:1.5px solid var(--border); border-radius:100px; padding:9px 18px; font-weight:600; font-size:13px; transition:border-color 150ms ease, background 150ms ease; }
.ghost-btn:hover{ border-color:var(--ink); }
.ghost-btn.lg{ padding:13px 24px; font-size:14px; }
.ghost-btn.sm{ padding:7px 14px; font-size:12px; }
.ghost-btn.light{ border-color:rgba(255,255,255,0.4); color:#fff; }
.ghost-btn.light:hover{ border-color:#fff; }
.primary-btn{ background:var(--purple); color:#fff; border-radius:100px; padding:9px 18px; font-weight:600; font-size:13px; display:inline-flex; align-items:center; gap:7px; transition:transform 140ms ease, background 200ms ease; }
.primary-btn:hover{ background:#5B21B6; }
.primary-btn:active{ transform:scale(0.96); }
.primary-btn.lg{ padding:13px 26px; font-size:14.5px; }
.primary-btn.sm{ padding:7px 14px; font-size:12px; }
.primary-btn.light{ background:#fff; color:var(--purple); }
.primary-btn.light:hover{ background:#F5F3FF; }
.primary-btn.wide{ width:100%; justify-content:center; }

/* hero */
.hero{ max-width:1180px; margin:0 auto; padding:56px 24px 20px; display:grid; grid-template-columns:1.1fr 0.9fr; gap:40px; align-items:center; }
.hero-left{ display:flex; flex-direction:column; gap:6px; }
.hero-title{ font-family:'Inter',sans-serif; font-size:clamp(34px,5vw,56px); font-weight:800; line-height:1.08; letter-spacing:-0.02em; margin:0 0 16px; }
.accent{ color:var(--purple); }
.hero-sub{ font-size:15.5px; color:#3A4450; max-width:480px; line-height:1.65; margin-bottom:22px; }
.hero-ctas{ display:flex; gap:12px; }
.hero-ctas.center{ justify-content:center; }
.trust-row{ display:flex; gap:18px; margin-top:22px; flex-wrap:wrap; }
.trust-row span{ display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted); font-weight:600; }
.hero-right{ display:flex; justify-content:center; }

/* role preview stack */
.role-stack{ position:relative; width:100%; max-width:340px; display:flex; flex-direction:column; gap:16px; }
.role-mini{ border-radius:16px; padding:16px; box-shadow:0 20px 40px -16px rgba(15,23,42,0.15); }
.role-mini.seller{ background:linear-gradient(120deg,#FFF1E8,#FFE4CC); transform:translateX(-10px); }
.role-mini.customer{ background:linear-gradient(120deg,#F5F3FF,#EDE9FE); }
.role-mini.rider{ background:linear-gradient(120deg,#ECFDF5,#D1FAE5); transform:translateX(10px); }
.role-mini-top{ display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; margin-bottom:10px; }
.role-mini-line{ height:8px; border-radius:100px; background:rgba(15,23,42,0.12); margin-bottom:10px; }
.role-mini-kpis{ display:flex; gap:6px; }
.role-mini-kpis span{ width:26px; height:26px; border-radius:8px; background:rgba(15,23,42,0.08); }
.role-mini-badge{ display:inline-flex; align-items:center; gap:5px; background:#fff; border-radius:100px; padding:4px 10px; font-size:11px; font-weight:700; color:#7C3AED; }
.role-mini-fee{ font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:#166534; }

/* stats */
.stats-bar{ max-width:1180px; margin:0 auto; padding:20px 24px 70px; display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.trust-signals{ max-width:1180px; margin:0 auto; padding:0 24px 70px; }
.trust-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; border-top:1px solid #E5E7EB; border-bottom:1px solid #E5E7EB; padding:28px 0; }
.trust-item{ display:flex; flex-direction:column; gap:6px; }
.trust-title{ font-weight:700; font-size:14px; margin-top:4px; }
.trust-desc{ font-size:13px; color:#64748B; line-height:1.5; }
.stat-block{ text-align:center; }
.stat-num{ font-family:'JetBrains Mono',monospace; font-size:clamp(22px,3vw,32px); font-weight:700; transition:color 300ms ease; }
.stat-num.bump{ color:#16A34A; }
.stat-label{ font-size:12px; color:var(--muted); margin-top:4px; display:flex; align-items:center; justify-content:center; gap:5px; }
.live-dot{ width:6px; height:6px; border-radius:100px; background:#16A34A; animation:pulseDot 1.4s ease infinite; }

/* audiences */
.audiences{ background:var(--ink); color:#fff; padding:80px 24px; }
.audiences .eyebrow{ color:#C4B5FD; }
.section-head{ max-width:1180px; margin:0 auto 40px; text-align:center; }
.section-head h2{ font-size:clamp(24px,3.4vw,34px); font-weight:800; margin:0; letter-spacing:-0.01em; }
.audience-grid{ max-width:1180px; margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.audience-card{ background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:26px; display:flex; flex-direction:column; transition:transform 200ms ease, background 200ms ease; }
.audience-card:hover{ transform:translateY(-4px); background:rgba(255,255,255,0.08); }
.audience-icon{ width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.audience-tag{ font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#94A3B8; font-weight:700; margin-bottom:4px; }
.audience-title{ font-size:19px; font-weight:700; margin-bottom:8px; }
.audience-desc{ font-size:13.5px; color:#C9D3DE; line-height:1.55; margin-bottom:16px; }
.audience-bullets{ list-style:none; margin:0 0 20px; padding:0; display:flex; flex-direction:column; gap:8px; flex:1; }
.audience-bullets li{ display:flex; align-items:flex-start; gap:8px; font-size:12.5px; color:#DCE3E0; }
.audience-bullets svg{ flex-shrink:0; margin-top:1px; }
.audience-cta{ display:flex; align-items:center; gap:5px; font-size:13px; font-weight:700; color:#fff; align-self:flex-start; padding:8px 0; border-bottom:2px solid; transition:gap 150ms ease; }
.audience-cta:hover{ gap:9px; }

/* features */
.features{ padding:80px 24px; }
.feature-grid{ max-width:1180px; margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.feature-card{ background:#fff; border:1px solid var(--border); border-radius:18px; padding:24px; transition:transform 200ms ease; }
.feature-card:hover{ transform:translateY(-3px); }
.feature-icon{ width:42px; height:42px; border-radius:12px; background:var(--purple-light); color:var(--purple); display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.feature-title{ font-size:15.5px; font-weight:700; margin-bottom:6px; }
.feature-desc{ font-size:13px; color:#3A4450; line-height:1.6; }

/* how it works */
.how{ padding:80px 24px; background:#fff; border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
.steps{ max-width:1180px; margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); gap:0; position:relative; }
.step-card{ padding:0 20px; position:relative; }
.step-num{ font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--purple); font-weight:700; margin-bottom:10px; }
.step-title{ font-size:18px; font-weight:700; margin-bottom:8px; }
.step-desc{ font-size:13.5px; color:#3A4450; line-height:1.6; }
.step-connector{ position:absolute; top:8px; right:-10%; width:20%; height:1px; background:var(--border); }
.step-connector::after{ content:""; position:absolute; right:0; top:-3px; width:6px; height:6px; border-radius:100px; background:var(--purple); }

/* quotes */
.quotes{ background:var(--bg); padding:80px 24px; }
.quote-grid{ max-width:1180px; margin:0 auto; display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.quote-card{ background:#fff; border:1px solid var(--border); border-radius:18px; padding:22px; }
.section-sub{ max-width:640px; margin:12px auto 0; color:var(--muted); font-size:15px; line-height:1.6; }
.about-section{ max-width:1180px; margin:0 auto; padding:80px 24px; }
.about-body{ max-width:720px; margin:0 auto 40px; text-align:center; color:var(--muted); font-size:15px; line-height:1.7; }
.team-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.team-card{ background:#fff; border:1px solid var(--border); border-radius:18px; padding:22px; text-align:center; }
.team-avatar{ width:48px; height:48px; border-radius:50%; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:17px; margin:0 auto 12px; }
.team-name{ font-weight:700; font-size:14.5px; }
.quote-stars{ display:flex; gap:2px; margin-bottom:12px; }
.quote-text{ font-size:14px; line-height:1.6; color:#28323E; margin-bottom:16px; min-height:80px; }
.quote-name{ font-size:13px; font-weight:700; }
.quote-attrib{ margin-top:14px; padding-top:14px; border-top:1px solid var(--border); }

/* faq */
.faq-section{ background:#fff; padding:80px 24px; border-top:1px solid var(--border); }
.faq-filters{ display:flex; justify-content:center; gap:8px; margin-bottom:24px; flex-wrap:wrap; }
.chip{ border:1px solid var(--border); border-radius:100px; padding:8px 16px; font-size:13px; font-weight:600; color:#3A4450; background:#fff; }
.chip.active{ background:var(--ink); border-color:var(--ink); color:#fff; }
.faq-list{ max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:10px; }
.faq-item{ border:1px solid var(--border); border-radius:14px; overflow:hidden; transition:border-color 150ms ease; }
.faq-item.open{ border-color:var(--purple); }
.faq-q{ width:100%; display:flex; align-items:center; justify-content:space-between; padding:16px 20px; font-size:14.5px; font-weight:600; text-align:left; }
.faq-chevron{ transition:transform 200ms ease; flex-shrink:0; color:var(--muted); }
.faq-item.open .faq-chevron{ transform:rotate(90deg); color:var(--purple); }
.faq-a{ padding:0 20px 18px; font-size:13.5px; color:#3A4450; line-height:1.6; margin:0; }

/* cta band */
.cta-band{ background:linear-gradient(120deg,var(--purple),#4C1D95); color:#fff; padding:80px 24px; text-align:center; }
.cta-inner{ max-width:600px; margin:0 auto; }
.cta-inner h2{ font-size:clamp(24px,3.4vw,32px); font-weight:800; margin:0 0 12px; }
.cta-inner p{ color:rgba(255,255,255,0.85); font-size:14.5px; margin-bottom:26px; }

/* footer */
.footer{ background:var(--ink); color:#fff; padding:50px 24px 26px; }
.footer-top{ max-width:1180px; margin:0 auto; display:flex; justify-content:space-between; flex-wrap:wrap; gap:40px; padding-bottom:36px; border-bottom:1px solid rgba(255,255,255,0.12); }
.footer-cols{ display:flex; gap:56px; flex-wrap:wrap; }
.footer-h{ font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#94A3B8; font-weight:700; margin-bottom:12px; }
.footer-cols a{ display:block; font-size:13.5px; color:#DCE3E0; margin-bottom:9px; transition:color 150ms ease; }
.footer-cols a:hover{ color:var(--purple); }
.footer-bottom{ max-width:1180px; margin:0 auto; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; padding-top:20px; font-size:12px; }
.footer-bottom .muted{ color:#94A3B8; }
:focus-visible{ outline:2px solid var(--purple); outline-offset:2px; border-radius:4px; }

@media (max-width:900px){
  .hero{ grid-template-columns:1fr; }
  .hero-right{ order:-1; }
  .nav-links, .nav-actions{ display:none; }
  .menu-btn{ display:flex; align-items:center; justify-content:center; }
  .stats-bar{ grid-template-columns:repeat(2,1fr); }
  .trust-grid{ grid-template-columns:1fr; }
  .audience-grid, .quote-grid, .feature-grid, .team-grid{ grid-template-columns:1fr; }
  .steps{ grid-template-columns:1fr; gap:32px; }
  .step-connector{ display:none; }
  .footer-top{ flex-direction:column; }
}
`;
