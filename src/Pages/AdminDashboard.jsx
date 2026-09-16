import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";

import { isAdminLoggedIn, logoutAdmin } from "../config/auth";
import { fetchProducts } from "../config/api";
import AdminNotifications from "../Components/admin/AdminNotifications";
import { playNotification } from "../utils/playNotification";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadAdminData = async () => {
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

        setProducts(list);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
    loadNotifications();
  }, [navigate]);
  useEffect(() => {
    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("Realtime Notification:", payload);
          playNotification();
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalProducts = useMemo(() => products.length, [products]);

  const lowStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const stock = Number(p.stock || 0);
        return stock > 0 && stock < 5;
      }),
    [products]
  );

  const outOfStockProducts = useMemo(
    () =>
      products.filter((p) => Number(p.stock || 0) === 0),
    [products]
  );

  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + Number(p.stock || 0), 0),
    [products]
  );

  const totalInventoryValue = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
        0
      ),
    [products]
  );

  const recentLowStock = useMemo(
    () => lowStockProducts.slice(0, 5),
    [lowStockProducts]
  );

  const handleLogout = () => {
    logoutAdmin();
    navigate("/");
  };

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getStockStatus = (stock) => {
    const qty = Number(stock || 0);

    if (qty === 0) {
      return {
        label: "Out of stock",
        className: "bg-red-50 text-red-600 border-red-100",
      };
    }

    if (qty < 5) {
      return {
        label: "Low stock",
        className: "bg-amber-50 text-amber-700 border-amber-100",
      };
    }

    return {
      label: "In stock",
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  };

  async function loadNotifications() {
    try {
      const res = await fetch(
        "https://farmfreshdairy.onrender.com/api/notifications"
      );

      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setNotificationCount(
          (data.notifications || []).filter((n) => !n.is_read).length
        );
      }
    } catch (err) {
      console.error("Notifications error:", err);
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />
        </div>

        <main className="relative mx-auto max-w-[1500px] px-3 pb-28 pt-3 sm:px-5 sm:pb-8 sm:pt-5 lg:px-8">

          {/* MODERN HEADER */}
          <header className="sticky top-2 z-40 mb-5 rounded-3xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => navigate("/admin")} className="flex items-center gap-3 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl shadow-lg shadow-emerald-200 transition hover:scale-105">
                  🥛
                </div>
                <div>
                  <p className="font-black text-slate-900">Farm Fresh Dairy</p>
                  <p className="text-[11px] font-semibold text-slate-400">Admin Control Center</p>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/admin/notifications")}
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  🔔
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="hidden rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 sm:block"
                >
                  Logout
                </button>
                <button
                  onClick={handleLogout}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white sm:hidden"
                >
                  ↪
                </button>
              </div>
            </div>
          </header>

          {/* HERO */}
          <section className="relative mb-6 overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-2xl sm:p-8 lg:p-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-[-100px] left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100 backdrop-blur">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Dashboard is live
                </span>
                <p className="mt-4 text-sm font-semibold text-white/55">Farm Fresh Dairy Admin</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Good morning, Admin 👋
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                  Monitor inventory and manage your daily dairy operations from one modern control center.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/admin/products")}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:-translate-y-1"
                >
                  + Manage Products
                </button>
                <button
                  onClick={() => navigate("/products")}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/15"
                >
                  View Store →
                </button>
              </div>
            </div>
          </section>

          {/* KPI */}
          <section className="mb-6">
            <div className="mb-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Business overview</p>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">Today at a glance</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Metric icon="🥛" label="Products" value={totalProducts} helper="Listed products" tone="emerald" />
              <Metric icon="⚠️" label="Low stock" value={lowStockProducts.length} helper="Need refill" tone="amber" />
              <Metric icon="📦" label="Out of stock" value={outOfStockProducts.length} helper="Unavailable" tone="red" />
              <Metric icon="📊" label="Stock units" value={totalStockUnits} helper="Current quantity" tone="blue" />
              <Metric icon="💰" label="Inventory value" value={formatMoney(totalInventoryValue)} helper="Price × stock" tone="purple" />
            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">🔔</div>
                <div>
                  <h2 className="font-black">Notifications</h2>
                  <p className="text-xs font-medium text-slate-400">
                    {notificationCount ? `${notificationCount} unread notification${notificationCount === 1 ? "" : "s"}` : "Everything is up to date"}
                  </p>
                </div>
              </div>
              <button onClick={() => navigate("/admin/notifications")} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black">
                View all
              </button>
            </div>
            <div className="px-2 py-2 sm:px-3"><AdminNotifications /></div>
          </section>

          {/* QUICK ACTIONS */}
          <section className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Operations</p>
            <h2 className="mt-1 mb-4 text-xl font-black sm:text-2xl">Quick actions</h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Action icon="🥛" title="Products" desc="Manage products, prices and stock" color="emerald" path="/admin/products" />
              <Action icon="📦" title="Orders" desc="Track orders and payments" color="blue" path="/admin/orders" />
              <Action icon="👥" title="Customers" desc="Customers, addresses and history" color="purple" path="/admin/customers" />
              <Action icon="🔁" title="Subscriptions" desc="Active, paused and expired plans" color="orange" path="/admin/subscriptions" />
              <Action icon="📊" title="Monthly Report" desc="Delivery, billing and reports" color="cyan" path="/admin/monthly-report" />
              <Action icon="🚚" title="Today's Deliveries" desc="Generate and manage deliveries" color="green" path="/admin/subscription-deliveries" />
              <Action icon="🥛" title="Extra Milk" desc="Approve extra milk requests" color="lime" path="/admin/extra-milk" />
              <Action icon="💰" title="Billing" desc="Invoices and payment records" color="pink" path="/admin/billing" />
            </div>
          </section>

          {/* INVENTORY */}
          <section className="grid gap-5 xl:grid-cols-[0.85fr_1.5fr]">

            {/* LOW STOCK */}
            <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-lg">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">⚠️</div>
                    <h2 className="text-xl font-black">Stock attention</h2>
                    <p className="mt-1 text-sm text-slate-400">Products that need your attention</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
                    {lowStockProducts.length} items
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => <div key={n} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
                  </div>
                ) : recentLowStock.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-7 text-center">
                    <div className="text-4xl">✅</div>
                    <h3 className="mt-2 font-black text-emerald-700">Inventory looks healthy</h3>
                    <p className="mt-1 text-sm text-slate-500">No low-stock products right now.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentLowStock.map((product, index) => (
                      <div key={product.id || index} className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">🥛</div>
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-800">{product.name || "Unnamed Product"}</p>
                            <p className="mt-0.5 text-xs text-slate-400">₹{Number(product.price || 0)}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Left</p>
                          <p className="text-2xl font-black text-amber-600">{Number(product.stock || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => navigate("/admin/products")} className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                  Open Inventory →
                </button>
              </div>
            </div>

            {/* PRODUCT TABLE */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Inventory</p>
                  <h2 className="mt-1 text-xl font-black">Products & stock</h2>
                  <p className="mt-1 text-sm text-slate-400">Current inventory overview</p>
                </div>
                <button onClick={() => navigate("/admin/products")} className="self-start rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700">
                  Manage products →
                </button>
              </div>

              <div className="p-3 sm:p-5">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
                  </div>
                ) : products.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-4xl">📭</div>
                    <h3 className="mt-2 font-black text-slate-700">No products found</h3>
                  </div>
                ) : (
                  <>
                    {/* Mobile */}
                    <div className="space-y-2.5 md:hidden">
                      {products.map((product, index) => {
                        const stock = Number(product.stock || 0);
                        const status = getStockStatus(stock);
                        return (
                          <div key={product.id || index} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-black text-slate-800">{product.name || "-"}</p>
                                <p className="mt-1 text-xs text-slate-400">{product.category || "Uncategorized"}</p>
                              </div>
                              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${status.className}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="mt-3 flex justify-between">
                              <div><p className="text-[10px] font-bold uppercase text-slate-400">Price</p><p className="font-black">₹{Number(product.price || 0)}</p></div>
                              <div className="text-right"><p className="text-[10px] font-bold uppercase text-slate-400">Stock</p><p className={`text-xl font-black ${stock === 0 ? "text-red-600" : stock < 5 ? "text-amber-600" : "text-emerald-600"}`}>{stock}</p></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop */}
                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-left">
                            <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Product</th>
                            <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Category</th>
                            <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Price</th>
                            <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Stock</th>
                            <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product, index) => {
                            const stock = Number(product.stock || 0);
                            const status = getStockStatus(stock);
                            return (
                              <tr key={product.id || index} className="border-b border-slate-50 transition hover:bg-slate-50">
                                <td className="px-3 py-3.5">
                                  <p className="font-bold text-slate-800">{product.name || "-"}</p>
                                  <p className="mt-0.5 text-[10px] text-slate-400">ID: {product.id || "-"}</p>
                                </td>
                                <td className="px-3 py-3.5 text-slate-500">{product.category || "-"}</td>
                                <td className="px-3 py-3.5 font-bold">₹{Number(product.price || 0)}</td>
                                <td className="px-3 py-3.5 font-black">{stock}</td>
                                <td className="px-3 py-3.5">
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${status.className}`}>{status.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <section className="mt-6 overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> System ready
                </span>
                <h2 className="mt-3 text-xl font-black sm:text-2xl">Keep your dairy operations moving.</h2>
                <p className="mt-1 text-sm text-white/50">Jump directly into your most-used admin modules.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <DarkAction label="Orders" icon="📦" onClick={() => navigate("/admin/orders")} />
                <DarkAction label="Customers" icon="👥" onClick={() => navigate("/admin/customers")} />
                <DarkAction label="Subscriptions" icon="🔁" onClick={() => navigate("/admin/subscriptions")} />
              </div>
            </div>
          </section>
        </main>

        {/* MOBILE APP NAV */}
        <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-3xl border border-white/80 bg-white/90 p-2 shadow-2xl backdrop-blur-xl sm:hidden">
          <div className="grid grid-cols-4 gap-1">
            <MobileNav icon="⌂" label="Home" active onClick={() => navigate("/admin")} />
            <MobileNav icon="📦" label="Orders" onClick={() => navigate("/admin/orders")} />
            <MobileNav icon="👥" label="Customers" onClick={() => navigate("/admin/customers")} />
            <MobileNav icon="🔁" label="Subs" onClick={() => navigate("/admin/subscriptions")} />
          </div>
        </nav>
      </div>
    </>
  );
}

function Metric({ icon, label, value, helper, tone }) {
  const styles = {
    emerald: "from-emerald-50 to-white border-emerald-100",
    amber: "from-amber-50 to-white border-amber-100",
    red: "from-red-50 to-white border-red-100",
    blue: "from-blue-50 to-white border-blue-100",
    purple: "from-purple-50 to-white border-purple-100",
  };

  return (
    <div className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-4 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl animate-[fadeUp_.55s_ease-out_both] ${styles[tone] || styles.blue}`}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/70 blur-xl transition group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1.5 truncate text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
          <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{helper}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-xl shadow-sm transition group-hover:rotate-6 group-hover:scale-110">{icon}</div>
      </div>
    </div>
  );
}

function Action({ icon, title, desc, color, path }) {
  const colors = {
    emerald: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-indigo-500",
    purple: "from-violet-500 to-purple-500",
    orange: "from-orange-500 to-amber-500",
    cyan: "from-cyan-500 to-blue-500",
    green: "from-green-500 to-emerald-500",
    lime: "from-lime-500 to-green-500",
    pink: "from-pink-500 to-rose-500",
  };

  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 text-left shadow-lg transition duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98] sm:p-5"
    >
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${colors[color]} opacity-[0.08] blur-xl transition group-hover:scale-150`} />
      <div className={`relative mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${colors[color]} text-xl text-white shadow-lg transition group-hover:scale-110 group-hover:rotate-3`}>{icon}</div>
      <h3 className="relative text-base font-black sm:text-lg">{title}</h3>
      <p className="relative mt-1.5 line-clamp-2 text-xs font-medium leading-5 text-slate-400 sm:text-sm">{desc}</p>
      <p className="relative mt-3 text-xs font-black text-slate-500 group-hover:text-slate-900">Open module →</p>
    </button>
  );
}

function DarkAction({ label, icon, onClick }) {
  return <button onClick={onClick} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10">{icon} {label}</button>;
}

function MobileNav({ icon, label, active, onClick }) {
  return <button onClick={onClick} className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition ${active ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"}`}><span className="text-base leading-none">{icon}</span><span className="mt-1 text-[9px] font-black">{label}</span></button>;
}
