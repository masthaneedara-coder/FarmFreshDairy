import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { isAdminLoggedIn, logoutAdmin } from "../config/auth";
import { fetchProducts } from "../config/api";
import AdminNotifications from "../Components/admin/AdminNotifications";
import { playNotification } from "../utils/playNotification";

const actions = [
  { icon: "🥛", title: "Products", path: "/admin/products", tone: "mint" },
  { icon: "📦", title: "Orders", path: "/admin/orders", tone: "blue" },
  { icon: "👥", title: "Customers", path: "/admin/customers", tone: "violet" },
  { icon: "🔁", title: "Subscriptions", path: "/admin/subscriptions", tone: "orange" },
  { icon: "🚚", title: "Deliveries", path: "/admin/subscription-deliveries", tone: "cyan" },
  { icon: "🧾", title: "Monthly report", path: "/admin/monthly-report", tone: "pink" },
  { icon: "🥛", title: "Extra milk", path: "/admin/extra-milk", tone: "lime" },
  { icon: "💳", title: "Billing", path: "/admin/billing", tone: "indigo" },
];

const toneClasses = {
  mint: "from-emerald-100 to-teal-50 text-emerald-700",
  blue: "from-sky-100 to-blue-50 text-blue-700",
  violet: "from-violet-100 to-purple-50 text-violet-700",
  orange: "from-orange-100 to-amber-50 text-orange-700",
  cyan: "from-cyan-100 to-sky-50 text-cyan-700",
  pink: "from-pink-100 to-rose-50 text-rose-700",
  lime: "from-lime-100 to-green-50 text-green-700",
  indigo: "from-indigo-100 to-blue-50 text-indigo-700",
};

// Soft, full-card colors that match each module's icon/tag color.
const toneCardClasses = {
  mint: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 hover:border-emerald-300",
  blue: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 hover:border-blue-300",
  violet: "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-purple-50 hover:border-violet-300",
  orange: "border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 hover:border-orange-300",
  cyan: "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 hover:border-cyan-300",
  pink: "border-pink-200 bg-gradient-to-br from-pink-50 via-white to-rose-50 hover:border-pink-300",
  lime: "border-lime-200 bg-gradient-to-br from-lime-50 via-white to-green-50 hover:border-lime-300",
  indigo: "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 hover:border-indigo-300",
};

function money(value) {
  const amount = Number(value || 0);
  return `₹${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-IN")}`;
}

function stockStatus(stock) {
  const quantity = Number(stock || 0);
  if (quantity <= 0) return { label: "Out of stock", classes: "bg-rose-100 text-rose-800 ring-1 ring-rose-200" };
  if (quantity < 5) return { label: "Low stock", classes: "bg-amber-100 text-amber-800 ring-1 ring-amber-200" };
  return { label: "In stock", classes: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  async function loadNotifications() {
    try {
      const response = await fetch("https://farmfreshdairy.onrender.com/api/notifications");
      if (!response.ok) throw new Error(`Notifications request failed: ${response.status}`);
      const data = await response.json();
      if (data?.success) {
        const list = Array.isArray(data.notifications) ? data.notifications : [];
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
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : [];
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          playNotification();
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) < 5),
    [products]
  );
  const outOfStockProducts = useMemo(
    () => products.filter((product) => Number(product.stock || 0) <= 0),
    [products]
  );
  const totalStockUnits = useMemo(
    () => products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0),
    [products]
  );
  const inventoryValue = useMemo(
    () => products.reduce((sum, product) => sum + (Number(product.price) || 0) * (Number(product.stock) || 0), 0),
    [products]
  );

  const handleLogout = () => {
    logoutAdmin();
    navigate("/");
  };

  const refreshDashboard = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
          ? data.products
          : [];
      setProducts(list);
    } catch (error) {
      console.error("Products refresh error:", error);
    } finally {
      setLoading(false);
    }
    loadNotifications();
  };

  const metrics = [
    { label: "Products", value: products.length, icon: "🥛", tone: "emerald" },
    { label: "Low stock", value: lowStockProducts.length, icon: "⚠️", tone: "amber" },
    { label: "Out of stock", value: outOfStockProducts.length, icon: "📦", tone: "rose" },
    { label: "Stock units", value: totalStockUnits, icon: "📊", tone: "sky" },
    { label: "Stock value", value: money(inventoryValue), icon: "₹", tone: "violet" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <style>{`
        @keyframes adminEnter { from { opacity: 0; transform: translateY(12px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes adminSoftPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(244,63,94,.16); } 50% { box-shadow: 0 0 0 5px rgba(244,63,94,0); } }
        @keyframes adminLivePulse { 0%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,.35); } 50% { opacity: .72; transform: scale(.82); box-shadow: 0 0 0 5px rgba(16,185,129,0); } }
        @keyframes adminGradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes adminOrbFloat { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-12px,10px,0) scale(1.08); } }
        @keyframes adminSweep { 0% { transform: translateX(-180%) rotate(22deg); opacity: 0; } 25% { opacity: .55; } 100% { transform: translateX(390%) rotate(22deg); opacity: 0; } }
        @keyframes adminIconNudge { 0%,100% { transform: translateY(0) rotate(0); } 35% { transform: translateY(-3px) rotate(-7deg); } 70% { transform: translateY(0) rotate(5deg); } }
        @keyframes adminValueIn { from { opacity: 0; transform: translateY(5px) scale(.94); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .admin-enter { animation: adminEnter .5s cubic-bezier(.2,.75,.25,1) both; }
        .admin-tile { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .admin-tile:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15,23,42,.09); }
        .admin-hero { background-size: 220% 220%; animation: adminGradientShift 14s ease-in-out infinite; }
        .admin-hero-orb { animation: adminOrbFloat 8s ease-in-out infinite; }
        .admin-live-dot { animation: adminLivePulse 2.1s ease-in-out infinite; }
        .admin-badge-pulse { animation: adminSoftPulse 2s ease-in-out infinite; }
        .admin-metric-value { animation: adminValueIn .55s ease-out both; }
        .admin-metric-card:hover .admin-metric-icon, .admin-action-card:hover .admin-action-icon { animation: adminIconNudge .55s ease-in-out; }
        .admin-action-card { position: relative; isolation: isolate; overflow: hidden; }
        .admin-action-card::after { content: ""; position: absolute; z-index: 0; pointer-events: none; top: -35%; left: -65%; width: 42%; height: 170%; transform: translateX(-180%) rotate(22deg); background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent); }
        .admin-action-card:hover::after { animation: adminSweep .85s ease-out; }
        .admin-reveal { animation: adminEnter .28s ease-out both; transform-origin: top center; }
        .admin-attention-count { animation: adminSoftPulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
      `}</style>

      <main className="mx-auto max-w-7xl px-3 pb-24 pt-3 sm:px-5 sm:pb-8 sm:pt-5 lg:px-8">
        {/* Compact top bar */}
        <header className="admin-enter sticky top-2 z-40 mb-4 flex items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="flex min-w-0 items-center gap-2.5 text-left"
            aria-label="Admin home"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50">
              <img src="/logo.png" alt="Farm Fresh Dairy" className="h-full w-full object-contain p-1" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black tracking-tight">FarmFreshDairy</span>
              <span className="block text-[10px] font-semibold text-emerald-700">Admin dashboard</span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label="Toggle notifications"
              aria-expanded={notificationsOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg transition hover:bg-emerald-50 active:scale-95"
            >
              🔔
              {notificationCount > 0 && (
                <span className="admin-badge-pulse absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={refreshDashboard}
              disabled={loading}
              className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:block"
            >
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-rose-600 active:scale-95"
            >
              <span className="hidden sm:inline">Log out</span>
              <span className="sm:hidden" aria-hidden="true">↗</span>
            </button>
          </div>
        </header>

        {/* Small welcome panel */}
        <section className="admin-enter admin-hero relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 px-4 py-4 text-white shadow-md sm:px-6 sm:py-5">
          <div className="admin-hero-orb pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="admin-hero-orb pointer-events-none absolute -bottom-16 right-1/3 h-28 w-28 rounded-full bg-cyan-200/10 blur-2xl" style={{ animationDelay: "-3s" }} />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/70">Welcome back, Admin</p>
              <h1 className="mt-1 text-xl font-black leading-tight sm:text-2xl">Your dairy at a glance</h1>
              <p className="mt-1 text-xs text-white/80">Manage stock, orders and daily deliveries.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="shrink-0 rounded-xl bg-white px-3 py-2.5 text-[11px] font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 active:scale-95 sm:px-4 sm:text-xs"
            >
              + Product
            </button>
          </div>
        </section>

        {/* Business snapshot */}
        <section className="admin-enter mb-5" style={{ animationDelay: "60ms" }}>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">Overview</p>
              <h2 className="text-base font-black sm:text-lg">Stock summary</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
              <span className={`h-1.5 w-1.5 rounded-full ${loading ? "bg-amber-400" : "admin-live-dot bg-emerald-500"}`} />
              {loading ? "Updating…" : "Live inventory"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
            {metrics.map((metric, index) => {
              const colors = {
                emerald: { icon: "bg-emerald-100 text-emerald-800", card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white" },
                amber: { icon: "bg-amber-100 text-amber-800", card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white" },
                rose: { icon: "bg-rose-100 text-rose-800", card: "border-rose-200 bg-gradient-to-br from-rose-50 to-white" },
                sky: { icon: "bg-sky-100 text-sky-800", card: "border-sky-200 bg-gradient-to-br from-sky-50 to-white" },
                violet: { icon: "bg-violet-100 text-violet-800", card: "border-violet-200 bg-gradient-to-br from-violet-50 to-white" },
              };
              return (
                <div
                  key={metric.label}
                  className={`admin-tile admin-metric-card admin-enter flex min-h-[76px] items-center justify-between gap-2 rounded-2xl border p-3 shadow-sm sm:min-h-[88px] sm:p-3.5 ${colors[metric.tone].card}`}
                  style={{ animationDelay: `${90 + index * 45}ms` }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold text-slate-500 sm:text-xs">{metric.label}</p>
                    <p className="admin-metric-value mt-1 truncate text-lg font-black leading-none sm:text-xl">
                      {loading ? "—" : metric.value}
                    </p>
                  </div>
                  <span className={`admin-metric-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm sm:h-9 sm:w-9 ${colors[metric.tone].icon}`}>
                    {metric.icon}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Notifications, collapsed by default */}
        {notificationsOpen && (
          <section className="admin-enter mb-5 overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/70 px-3 py-2.5">
              <div>
                <h2 className="text-sm font-black">Notifications</h2>
                <p className="text-[10px] text-slate-500">
                  {notificationCount > 0 ? `${notificationCount} unread updates` : "You're all caught up"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/notifications")}
                className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200"
              >
                View all ↗
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2.5">
              <AdminNotifications />
            </div>
          </section>
        )}

        {/* Compact navigation tiles */}
        <section className="admin-enter mb-5" style={{ animationDelay: "130ms" }}>
          <div className="mb-2.5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">Workspace</p>
              <h2 className="text-base font-black sm:text-lg">Quick actions</h2>
            </div>
            <span className="text-[10px] font-medium text-slate-400">8 modules</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {actions.map((action, index) => (
              <button
                key={action.title}
                type="button"
                onClick={() => navigate(action.path)}
                className={`admin-tile admin-action-card admin-enter group flex min-h-[72px] items-center gap-2.5 rounded-2xl border p-3 text-left shadow-sm active:scale-[.98] sm:min-h-[82px] sm:gap-3 sm:p-3.5 ${toneCardClasses[action.tone]}`}
                style={{ animationDelay: `${150 + index * 35}ms` }}
              >
                <span className={`admin-action-icon relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg ${toneClasses[action.tone]} transition group-hover:scale-105`}>
                  {action.icon}
                </span>
                <span className="relative z-10 min-w-0 flex-1">
                  <span className="block truncate text-xs font-black text-slate-800 sm:text-sm">{action.title}</span>
                  <span className="mt-0.5 block text-[9px] font-semibold text-slate-400 sm:text-[10px]">Open module ↗</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Stock attention and product inventory, both expandable */}
        <section className="grid gap-3 lg:grid-cols-2">
          <div className="admin-enter overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm" style={{ animationDelay: "200ms" }}>
            <button
              type="button"
              onClick={() => setStockOpen((open) => !open)}
              aria-expanded={stockOpen}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-amber-50/50"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-base">⚠️</span>
                <span className="min-w-0">
                  <span className="block text-xs font-black sm:text-sm">Stock attention</span>
                  <span className="block text-[10px] text-slate-500">Products that need a refill</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className={`rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800 ${lowStockProducts.length + outOfStockProducts.length > 0 ? "admin-attention-count" : ""}`}>{lowStockProducts.length + outOfStockProducts.length}</span>
                <span className={`text-sm text-slate-400 transition-transform ${stockOpen ? "rotate-180" : ""}`}>⌄</span>
              </span>
            </button>
            {stockOpen && (
              <div className="admin-reveal space-y-2 border-t border-amber-100 p-3">
                {loading ? <LoadingRows /> : lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
                  <EmptyState icon="✨" title="All looking good" desc="No products need a refill." />
                ) : (
                  [...outOfStockProducts, ...lowStockProducts].slice(0, 6).map((product, index) => (
                    <div key={product.id || index} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50/60 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{product.name || "Unnamed product"}</p>
                        <p className="text-[10px] text-slate-500">{money(product.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase text-slate-400">Left</p>
                        <p className="text-base font-black text-amber-700">{Number(product.stock || 0)}</p>
                      </div>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
                  className="w-full rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-black text-white transition hover:bg-amber-600 active:scale-[.99]"
                >
                  Manage stock ↗
                </button>
              </div>
            )}
          </div>

          <div className="admin-enter overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-sm" style={{ animationDelay: "240ms" }}>
            <button
              type="button"
              onClick={() => setInventoryOpen((open) => !open)}
              aria-expanded={inventoryOpen}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-sky-50/50"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-base">📦</span>
                <span className="min-w-0">
                  <span className="block text-xs font-black sm:text-sm">Products & inventory</span>
                  <span className="block text-[10px] text-slate-500">View price and stock details</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-800">{products.length} items</span>
                <span className={`text-sm text-slate-400 transition-transform ${inventoryOpen ? "rotate-180" : ""}`}>⌄</span>
              </span>
            </button>
            {inventoryOpen && (
              <div className="admin-reveal border-t border-sky-100 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-slate-500">Current products</p>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/products")}
                    className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-[10px] font-black text-sky-700"
                  >
                    Manage ↗
                  </button>
                </div>
                {loading ? <LoadingRows /> : products.length === 0 ? (
                  <EmptyState icon="📭" title="No products found" desc="Products will appear here when available." />
                ) : (
                  <>
                    <div className="max-h-80 space-y-2 overflow-y-auto md:hidden">
                      {products.map((product, index) => {
                        const stock = Number(product.stock || 0);
                        const status = stockStatus(stock);
                        return (
                          <div key={product.id || index} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold">{product.name || "Unnamed product"}</p>
                              <p className="truncate text-[10px] text-slate-400">{product.category || "Uncategorized"}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs font-black">{money(product.price)}</p>
                              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold ${status.classes}`}>{status.label} · {stock}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="hidden max-h-80 overflow-auto rounded-xl border border-slate-100 md:block">
                      <table className="min-w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-50 text-[9px] font-black uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Product</th>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">Price</th>
                            <th className="px-3 py-2">Stock</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product, index) => {
                            const stock = Number(product.stock || 0);
                            const status = stockStatus(stock);
                            return (
                              <tr key={product.id || index} className="border-t border-slate-100 hover:bg-sky-50/40">
                                <td className="px-3 py-2 font-bold">{product.name || "Unnamed product"}</td>
                                <td className="px-3 py-2 text-slate-500">{product.category || "—"}</td>
                                <td className="px-3 py-2 font-semibold">{money(product.price)}</td>
                                <td className="px-3 py-2 font-black">{stock}</td>
                                <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold ${status.classes}`}>{status.label}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Compact mobile navigation */}
      <nav className="admin-enter fixed bottom-2 left-2 right-2 z-50 rounded-2xl border border-white bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur sm:hidden" aria-label="Admin quick navigation">
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
  return (
    <div className="space-y-2" aria-label="Loading products">
      {[1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center">
      <div className="text-2xl">{icon}</div>
      <p className="mt-1 text-xs font-black">{title}</p>
      <p className="mt-1 text-[10px] text-slate-500">{desc}</p>
    </div>
  );
}

function MobileNav({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl px-1 py-1.5 transition active:scale-95 ${active ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm" : "text-slate-500 hover:bg-sky-50 hover:text-sky-700"}`}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="mt-1 text-[9px] font-black">{label}</span>
    </button>
  );
}
