import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { isAdminLoggedIn, logoutAdmin } from "../config/auth";
import { fetchProducts } from "../config/api";
import AdminNotifications from "../Components/admin/AdminNotifications";
import { playNotification } from "../utils/playNotification";

const actions = [
  { icon: "🥛", title: "Products", desc: "Manage products, prices and stock", path: "/admin/products", theme: "mint" },
  { icon: "📦", title: "Orders", desc: "Track orders and payments", path: "/admin/orders", theme: "blue" },
  { icon: "👥", title: "Customers", desc: "Customer details and history", path: "/admin/customers", theme: "violet" },
  { icon: "🔁", title: "Subscriptions", desc: "Active, paused and expired plans", path: "/admin/subscriptions", theme: "orange" },
  { icon: "🚚", title: "Deliveries", desc: "Manage today's deliveries", path: "/admin/subscription-deliveries", theme: "cyan" },
  { icon: "🧾", title: "Monthly report", desc: "Delivery and billing reports", path: "/admin/monthly-report", theme: "pink" },
  { icon: "🥛", title: "Extra milk", desc: "Review extra milk requests", path: "/admin/extra-milk", theme: "lime" },
  { icon: "💳", title: "Billing", desc: "Invoices and payments", path: "/admin/billing", theme: "indigo" },
];

const themeClasses = {
  mint: "from-emerald-400 to-teal-500",
  blue: "from-sky-400 to-blue-600",
  violet: "from-violet-400 to-purple-600",
  orange: "from-orange-400 to-amber-500",
  cyan: "from-cyan-400 to-sky-600",
  pink: "from-pink-400 to-rose-500",
  lime: "from-lime-400 to-green-600",
  indigo: "from-indigo-400 to-blue-700",
};

function money(value) {
  const n = Number(value || 0);
  return `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN")}`;
}

function stockStatus(stock) {
  const qty = Number(stock || 0);
  if (qty <= 0) return { label: "Out of stock", cls: "bg-rose-50 text-rose-700 ring-rose-200" };
  if (qty < 5) return { label: "Low stock", cls: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { label: "In stock", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  async function loadNotifications() {
    try {
      const response = await fetch("https://farmfreshdairy.onrender.com/api/notifications");
      if (!response.ok) throw new Error(`Notifications request failed: ${response.status}`);
      const data = await response.json();
      if (data?.success) {
        const list = data.notifications || [];
        setNotificationCount(list.filter((item) => !item.is_read).length);
      }
    } catch (error) {
      console.error("Notifications error:", error);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadAdminData() {
      if (!isAdminLoggedIn()) {
        navigate("/admin-login");
        return;
      }
      try {
        setLoading(true);
        const data = await fetchProducts();
        const list = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : [];
        if (active) setProducts(list);
      } catch (error) {
        console.error("Products loading error:", error);
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAdminData();
    loadNotifications();

    const channel = supabase
      .channel("notifications-channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        playNotification();
        loadNotifications();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const totalProducts = products.length;
  const lowStockProducts = useMemo(
    () => products.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) < 5),
    [products]
  );
  const outOfStockProducts = useMemo(
    () => products.filter((p) => Number(p.stock || 0) <= 0),
    [products]
  );
  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + Number(p.stock || 0), 0),
    [products]
  );
  const inventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0),
    [products]
  );

  const handleLogout = () => {
    logoutAdmin();
    navigate("/");
  };

  const metrics = [
    { label: "Total products", value: totalProducts, note: "Products listed", icon: "🥛", color: "from-emerald-400 to-teal-500", glow: "bg-emerald-200" },
    { label: "Low stock", value: lowStockProducts.length, note: "Refill soon", icon: "⚠️", color: "from-amber-400 to-orange-500", glow: "bg-amber-200" },
    { label: "Out of stock", value: outOfStockProducts.length, note: "Need restock", icon: "📦", color: "from-rose-400 to-pink-600", glow: "bg-rose-200" },
    { label: "Stock units", value: totalStockUnits, note: "Current quantity", icon: "📊", color: "from-sky-400 to-indigo-600", glow: "bg-sky-200" },
    { label: "Inventory value", value: money(inventoryValue), note: "Estimated stock value", icon: "💰", color: "from-violet-400 to-purple-600", glow: "bg-violet-200" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f8fc] text-slate-900">
      <style>{`
        @keyframes riseIn { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes drift { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(10px,-14px,0) scale(1.04); } }
        @keyframes shine { 0% { transform: translateX(-130%) skewX(-18deg); } 100% { transform: translateX(230%) skewX(-18deg); } }
        @keyframes ringPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(244,63,94,.2); } 50% { box-shadow: 0 0 0 7px rgba(244,63,94,0); } }
        .fd-rise { animation: riseIn .65s cubic-bezier(.2,.8,.2,1) both; }
        .fd-drift { animation: drift 8s ease-in-out infinite; }
        .fd-shine { position: relative; overflow: hidden; }
        .fd-shine:after { content: ''; position: absolute; inset: 0 auto 0 0; width: 28%; background: linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent); animation: shine 5s ease-in-out infinite; pointer-events:none; }
        .fd-pulse { animation: ringPulse 2s ease-in-out infinite; }
        .fd-card { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
        .fd-card:hover { transform: translateY(-4px); box-shadow: 0 18px 38px rgba(30,41,59,.10); }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="fd-drift absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-200/45 blur-3xl" />
        <div className="fd-drift absolute -left-24 top-[35%] h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="fd-drift absolute bottom-0 right-[20%] h-64 w-64 rounded-full bg-emerald-200/35 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-[1540px] px-3 pb-28 pt-3 sm:px-5 sm:pb-8 sm:pt-5 lg:px-8">
        <header className="fd-rise sticky top-2 z-40 mb-5 rounded-[24px] border border-white/80 bg-white/85 px-3 py-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => navigate("/admin")} className="flex min-w-0 items-center gap-3 text-left" aria-label="Farm Fresh Dairy admin home">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 ring-1 ring-white shadow-md">
                <img src="/logo.png" alt="Farm Fresh Dairy" className="h-full w-full object-contain p-1" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black tracking-tight sm:text-base">FarmFreshDairy</span>
                <span className="block truncate text-[10px] font-bold uppercase tracking-[.14em] text-emerald-600 sm:text-xs">Admin studio</span>
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => setNotificationsOpen((v) => !v)} aria-label="Toggle notifications" aria-expanded={notificationsOpen} className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl transition hover:border-emerald-300 hover:bg-emerald-50">
                🔔
                {notificationCount > 0 && <span className="fd-pulse absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">{notificationCount > 99 ? "99+" : notificationCount}</span>}
              </button>
              <button onClick={handleLogout} className="hidden rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white transition hover:bg-rose-600 sm:block">Log out ↗</button>
              <button onClick={handleLogout} aria-label="Log out" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lg text-white sm:hidden">↗</button>
            </div>
          </div>
        </header>

        <section className="fd-rise fd-shine relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-700 p-5 text-white shadow-xl shadow-teal-900/15 sm:rounded-[36px] sm:p-8 lg:p-10" style={{ animationDelay: "80ms" }}>
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl" />
          <div className="absolute -bottom-28 left-[38%] h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-extrabold backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,.9)]" /> LIVE CONTROL CENTER
              </span>
              <p className="mt-4 text-sm font-semibold text-white/75">Welcome back, Admin 👋</p>
              <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">Fresh milk. Smooth operations.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">Your dairy business at a glance. Keep products stocked, deliveries moving and customers happy.</p>
            </div>
            <div className="flex flex-col gap-2 min-[430px]:flex-row">
              <button onClick={() => navigate("/admin/products")} className="rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-emerald-800 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">＋ Manage products</button>
              <button onClick={() => navigate("/products")} className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3.5 text-sm font-black text-white backdrop-blur transition hover:bg-white/20">View storefront →</button>
            </div>
          </div>
          <div className="relative mt-7 flex flex-wrap gap-2 text-xs font-bold text-white/85">
            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">🥛 Fresh stock overview</span>
            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">🔔 Realtime alerts</span>
            <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">📱 Mobile ready</span>
          </div>
        </section>

        <section className="fd-rise mb-7" style={{ animationDelay: "140ms" }}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-700 sm:text-xs">Business snapshot</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Today at a glance</h2>
            </div>
            <span className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm sm:text-xs">{loading ? "Updating…" : "Inventory synced"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {metrics.map((metric, index) => (
              <div key={metric.label} className="fd-card relative overflow-hidden rounded-[24px] border border-white bg-white/90 p-4 shadow-md shadow-slate-200/60" style={{ animationDelay: `${index * 70}ms` }}>
                <div className={`absolute -right-5 -top-5 h-20 w-20 rounded-full ${metric.glow} opacity-60 blur-2xl`} />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 sm:text-[11px]">{metric.label}</p>
                    <p className="mt-2 break-words text-2xl font-black tracking-tight sm:text-3xl">{loading ? "—" : metric.value}</p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400 sm:text-xs">{metric.note}</p>
                  </div>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${metric.color} text-lg text-white shadow-md`}>{metric.icon}</span>
                </div>
                <div className={`relative mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100`}><div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${metric.color}`} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="fd-rise mb-7 overflow-hidden rounded-[26px] border border-white bg-white/90 shadow-lg shadow-slate-200/60 backdrop-blur" style={{ animationDelay: "190ms" }}>
          <button type="button" onClick={() => setNotificationsOpen((v) => !v)} aria-expanded={notificationsOpen} className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-emerald-50/60 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-xl">🔔</span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-black">Notifications {notificationCount > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">{notificationCount} new</span>}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{notificationCount ? "You have updates to review" : "Stay on top of store activity"}</span>
              </span>
            </div>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-transform ${notificationsOpen ? "rotate-180" : ""}`}>⌄</span>
          </button>
          {notificationsOpen && <div className="border-t border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 sm:p-5"><AdminNotifications /><button onClick={() => navigate("/admin/notifications")} className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700">View all notifications →</button></div>}
        </section>

        <section className="fd-rise mb-7" style={{ animationDelay: "240ms" }}>
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-700 sm:text-xs">Your workspace</p>
            <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Quick actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {actions.map((action) => (
              <button key={action.title} onClick={() => navigate(action.path)} className="fd-card group relative min-h-[158px] overflow-hidden rounded-[24px] border border-white bg-white/95 p-4 text-left shadow-md shadow-slate-200/50 sm:min-h-[180px] sm:p-5">
                <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${themeClasses[action.theme]} opacity-[.13] blur-xl transition group-hover:scale-150`} />
                <span className={`relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${themeClasses[action.theme]} text-xl text-white shadow-lg transition group-hover:rotate-3 group-hover:scale-110`}>{action.icon}</span>
                <span className="relative mt-4 block text-sm font-black sm:text-base">{action.title}</span>
                <span className="relative mt-1.5 block text-[11px] leading-5 text-slate-500 sm:text-xs">{action.desc}</span>
                <span className="relative mt-3 block text-[10px] font-black text-slate-600 group-hover:text-emerald-700">Open module ↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="fd-rise grid gap-4 xl:grid-cols-[.85fr_1.5fr]" style={{ animationDelay: "290ms" }}>
          <div className="overflow-hidden rounded-[26px] border border-amber-100 bg-white shadow-lg shadow-amber-100/50">
            <button onClick={() => setStockOpen((v) => !v)} aria-expanded={stockOpen} className="flex w-full items-center justify-between gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white p-4 text-left sm:p-5">
              <span className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">⚠️</span><span><span className="block font-black">Stock attention</span><span className="mt-1 block text-xs text-slate-500">Items to refill soon</span></span></span>
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">{lowStockProducts.length}</span>
            </button>
            {stockOpen && <div className="space-y-2 p-3 sm:p-4">
              {loading ? <LoadingRows /> : lowStockProducts.length === 0 ? <EmptyState icon="✨" title="All looking good!" desc="No low-stock products right now." /> : lowStockProducts.slice(0, 6).map((product, i) => (
                <div key={product.id || i} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
                  <div className="min-w-0"><p className="truncate text-sm font-extrabold">{product.name || "Unnamed product"}</p><p className="mt-1 text-xs text-slate-500">{money(product.price)}</p></div>
                  <div className="shrink-0 text-right"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Left</p><p className="text-2xl font-black text-amber-600">{Number(product.stock || 0)}</p></div>
                </div>
              ))}
              <button onClick={() => navigate("/admin/products")} className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-black text-white shadow-md transition hover:brightness-105">Open inventory →</button>
            </div>}
          </div>

          <div className="overflow-hidden rounded-[26px] border border-sky-100 bg-white shadow-lg shadow-sky-100/50">
            <button onClick={() => setInventoryOpen((v) => !v)} aria-expanded={inventoryOpen} className="flex w-full items-center justify-between gap-3 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white p-4 text-left sm:p-5">
              <span className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-xl">📦</span><span><span className="block font-black">Products & inventory</span><span className="mt-1 block text-xs text-slate-500">Live stock overview</span></span></span>
              <span className="flex items-center gap-2"><span className="hidden rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black text-sky-800 sm:inline">{products.length} items</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 transition-transform ${inventoryOpen ? "rotate-180" : ""}`}>⌄</span></span>
            </button>
            {inventoryOpen && <div className="p-3 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs font-bold text-slate-500">Current products</p><button onClick={() => navigate("/admin/products")} className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 hover:bg-sky-100">Manage products ↗</button></div>
              {loading ? <LoadingRows /> : products.length === 0 ? <EmptyState icon="📭" title="No products found" desc="Products will appear here when available." /> : <>
                <div className="space-y-2 md:hidden">
                  {products.map((product, index) => {
                    const stock = Number(product.stock || 0);
                    const status = stockStatus(stock);
                    return <div key={product.id || index} className="rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50 p-3.5">
                      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-black">{product.name || "Unnamed product"}</p><p className="mt-1 truncate text-xs text-slate-500">{product.category || "Uncategorized"}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ring-1 ${status.cls}`}>{status.label}</span></div>
                      <div className="mt-3 flex items-end justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Price</p><p className="font-black">{money(product.price)}</p></div><div className="text-right"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Stock</p><p className={`text-xl font-black ${stock <= 0 ? "text-rose-600" : stock < 5 ? "text-amber-600" : "text-emerald-600"}`}>{stock}</p></div></div>
                    </div>;
                  })}
                </div>
                <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 md:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-[10px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th></tr></thead>
                    <tbody>{products.map((product, index) => { const stock = Number(product.stock || 0); const status = stockStatus(stock); return <tr key={product.id || index} className="border-t border-slate-100 transition hover:bg-sky-50/50"><td className="px-4 py-3 font-bold">{product.name || "Unnamed product"}</td><td className="px-4 py-3 text-slate-500">{product.category || "—"}</td><td className="px-4 py-3 font-bold">{money(product.price)}</td><td className="px-4 py-3 font-black">{stock}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${status.cls}`}>{status.label}</span></td></tr>; })}</tbody>
                  </table>
                </div>
              </>}
            </div>}
          </div>
        </section>

        <footer className="fd-rise mt-6 rounded-[26px] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-xl sm:p-6" style={{ animationDelay: "340ms" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> SYSTEM READY</span><h2 className="mt-3 text-lg font-black sm:text-2xl">A fresher day starts here.</h2><p className="mt-1 text-xs text-white/60 sm:text-sm">Manage your dairy operations from one place.</p></div><button onClick={() => navigate("/admin/orders")} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-emerald-100">Go to orders →</button></div>
        </footer>
      </main>

      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[24px] border border-white/80 bg-white/90 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur-xl sm:hidden">
        <div className="grid grid-cols-4 gap-1">
          <MobileNav icon="⌂" label="Home" active onClick={() => navigate("/admin")} />
          <MobileNav icon="📦" label="Orders" onClick={() => navigate("/admin/orders")} />
          <MobileNav icon="👥" label="Customers" onClick={() => navigate("/admin/customers")} />
          <MobileNav icon="🔁" label="Subs" onClick={() => navigate("/admin/subscriptions")} />
        </div>
      </nav>
    </div>
  );
}

function LoadingRows() {
  return <div className="space-y-2" aria-label="Loading products">{[1, 2, 3].map((n) => <div key={n} className="h-14 animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 via-white to-slate-100" />)}</div>;
}

function EmptyState({ icon, title, desc }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center"><div className="text-3xl">{icon}</div><p className="mt-2 text-sm font-black">{title}</p><p className="mt-1 text-xs text-slate-500">{desc}</p></div>;
}

function MobileNav({ icon, label, active, onClick }) {
  return <button onClick={onClick} className={`flex min-h-[54px] flex-col items-center justify-center rounded-2xl px-1 py-2 transition active:scale-95 ${active ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}><span className="text-base leading-none">{icon}</span><span className="mt-1 text-[9px] font-black">{label}</span></button>;
}
