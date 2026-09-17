import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExtraMilkCard from "../Components/ExtraMilkCard";
import { getDashboard, pauseSubscriptionApi, resumeSubscriptionApi, getSubscriptionDeliverySummary, fetchCustomerSubscriptions } from "../config/api";
import PauseSubscriptionModal from "../Components/subscription/PauseSubscriptionModal";
import { useAuthSession } from "../context/AuthSessionContext";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { customer, logout } = useAuthSession();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliverySummaries, setDeliverySummaries] = useState({});
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const subscriptionScrollRef = useRef(null);

  const summary = dashboard?.summary || {
    totalOrders: 0,
    totalSpent: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
  };

  const latestOrders = dashboard?.recentOrders || [];

  useEffect(() => {
    if (customer) loadDashboard();
  }, [customer]);

  useEffect(() => {
    if (!subscriptions.length) {
      setDeliverySummaries({});
      return;
    }

    async function loadDeliverySummaries() {
      const summaries = {};

      // Keep the existing behavior, but load visible subscription summaries
      // concurrently so the dashboard feels much faster.
      const results = await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            const response = await getSubscriptionDeliverySummary(sub.id);
            return [
              sub.id,
              response.summary || {
                delivered: 0,
                outForDelivery: 0,
                skipped: 0,
              },
            ];
          } catch (err) {
            console.error("Delivery summary error:", err);
            return [
              sub.id,
              { delivered: 0, outForDelivery: 0, skipped: 0 },
            ];
          }
        })
      );

      results.forEach(([id, data]) => {
        summaries[id] = data;
      });

      setDeliverySummaries(summaries);
    }

    loadDeliverySummaries();
  }, [subscriptions]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      if (!customer) return;

      const res = await getDashboard(customer.id);

      if (!res.success) {
        throw new Error(res.message);
      }

      const historyRes = await fetchCustomerSubscriptions(customer.id);

      setSubscriptionHistory(historyRes.subscriptions || []);
      setDashboard(res.dashboard);
      setOrders(res.dashboard.recentOrders || []);
      setSubscriptions(res.dashboard.subscriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;

    const today = new Date();
    const expiry = new Date(expireDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const difference = expiry.getTime() - today.getTime();

    return Math.max(
      0,
      Math.ceil(difference / (1000 * 60 * 60 * 24))
    );
  };

  const isSubscriptionExpired = (expireDate) => {
    if (!expireDate) return false;

    const today = new Date();
    const expiry = new Date(expireDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return today > expiry;
  };

  const scrollSubscriptions = (direction = "right") => {
    if (!subscriptionScrollRef.current) return;

    const container = subscriptionScrollRef.current;
    const scrollAmount = window.innerWidth < 640 ? 300 : 400;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleResume = async (subscriptionId) => {
    try {
      setStatusUpdatingId(subscriptionId);
      await resumeSubscriptionApi(subscriptionId);
      await loadDashboard();
      alert("Subscription resumed successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to resume subscription.");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handlePauseConfirm = async (pauseFrom, pauseTo) => {
    try {
      setLoading(true);

      await pauseSubscriptionApi(selectedSubscription.id, {
        pause_from: pauseFrom,
        pause_to: pauseTo,
      });

      setShowPauseModal(false);
      setSelectedSubscription(null);

      await loadDashboard();
      alert("Subscription paused successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to pause subscription.");
    } finally {
      setLoading(false);
    }
  };

  const activeSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (sub) => !isSubscriptionExpired(sub.expireDate)
      ),
    [subscriptions]
  );

  const activeCount = activeSubscriptions.filter(
    (sub) => String(sub.status || "").toLowerCase() === "active" && !sub.is_paused
  ).length;

  const pausedCount = activeSubscriptions.filter(
    (sub) => sub.is_paused || String(sub.status || "").toLowerCase() === "paused"
  ).length;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5faf7] px-3 pb-24 pt-24 sm:px-5 sm:pb-10 sm:pt-32 lg:px-8">
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes dashPulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50% { opacity: .9; transform: scale(1.08); }
        }
        .dash-fade { animation: dashFadeUp .6s cubic-bezier(.22,1,.36,1) both; }
        .dash-float { animation: dashFloat 4s ease-in-out infinite; }
        .dash-pulse { animation: dashPulse 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .dash-fade, .dash-float, .dash-pulse { animation: none !important; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="dash-pulse absolute -left-32 top-24 h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="dash-pulse absolute -right-32 top-[38%] h-96 w-96 rounded-full bg-teal-200/25 blur-3xl" />
        <div className="absolute left-[8%] top-44 text-3xl opacity-10 dash-float">🥛</div>
        <div className="absolute right-[9%] top-[28%] text-3xl opacity-10 dash-float" style={{ animationDelay: "1s" }}>🌿</div>
      </div>

      <main className="relative mx-auto max-w-7xl">
        {/* HERO */}
        <section className="dash-fade relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-4 text-white shadow-[0_20px_50px_rgba(4,120,87,.18)] sm:rounded-[30px] sm:p-7 lg:p-9">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-emerald-200 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Customer dashboard
              </div>

              <h1 className="mt-3 text-[28px] leading-[1.05] font-black tracking-tight sm:text-4xl lg:text-5xl">
                Welcome back,{" "}
                <span className="text-emerald-200">
                  {dashboard?.customer?.full_name || customer?.name || "Customer"}
                </span>{" "}
                👋
              </h1>

              <p className="mt-2 text-sm font-medium text-white/65 sm:text-base">
                Your fresh daily delivery, subscriptions and orders — all in one place.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-white/75 sm:text-xs">
                <span className="rounded-full bg-white/10 px-3 py-2">
                  📱 {dashboard?.customer?.phone || customer?.phone || "—"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-2">
                  🥛 {activeCount} active
                </span>
                {pausedCount > 0 && (
                  <span className="rounded-full bg-amber-300/15 px-3 py-2 text-amber-100">
                    ⏸️ {pausedCount} paused
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-[300px] lg:justify-end">
              <DashboardAction
                icon="🛍️"
                label="Shop"
                onClick={() => navigate("/products")}
              />
              <DashboardAction
                icon="🥛"
                label="Subscribe"
                onClick={() => navigate("/subscription/create/:productId")}
              />
              <DashboardAction
                icon="📦"
                label="Orders"
                onClick={() => navigate("/order-history")}
              />
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-rose-300/20 bg-rose-500/15 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-rose-500/25"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          <div className="min-w-[150px] snap-start sm:min-w-0"><StatCard icon="📦" title="Total Orders" value={summary.totalOrders} tone="emerald" /></div>
          <div className="min-w-[150px] snap-start sm:min-w-0"><StatCard icon="🔄" title="Subscriptions" value={summary.totalSubscriptions} tone="amber" /></div>
          <div className="min-w-[150px] snap-start sm:min-w-0"><StatCard icon="🥛" title="Active Subs" value={summary.activeSubscriptions} tone="teal" /></div>
          <StatCard
            icon={activeCount ? "●" : "○"}
            title="Current Status"
            value={activeCount ? "Active" : summary.totalSubscriptions ? "Paused" : "New"}
            tone={activeCount ? "green" : "rose"}
          />
        </section>

        {/* EXTRA MILK */}
        <section className="dash-fade mt-4">
          <div className="group relative overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-100/60 blur-3xl transition group-hover:scale-125" />
            <div className="relative flex items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
              <div>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">
                  ✨ Extra milk
                </span>
                <h2 className="mt-2 text-lg font-black text-slate-900 sm:text-2xl">
                  Need extra milk?
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  Request temporary extra milk whenever you need it.
                </p>
                <button
                  onClick={() => navigate("/extra-milk")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Request now →
                </button>
              </div>

              <div className="dash-float hidden h-20 w-20 shrink-0 items-center justify-center rounded-[28px] bg-emerald-50 text-4xl shadow-inner sm:flex">
                🥛
              </div>
            </div>
          </div>
        </section>

        {/* SUBSCRIPTIONS */}
        <section className="dash-fade mt-6 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-800 to-teal-600 px-4 py-4 text-white sm:px-7 sm:py-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-200">
                Your daily routine
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-3xl">
                My Subscriptions
              </h2>
              <p className="mt-1 text-[11px] font-medium text-white/60 sm:text-xs">
                {activeSubscriptions.length
                  ? "Manage your active milk plans"
                  : "Start a milk subscription for hassle-free delivery"}
              </p>
            </div>

            {activeSubscriptions.length > 1 && (
              <div className="hidden gap-2 sm:flex">
                <RoundButton label="←" onClick={() => scrollSubscriptions("left")} />
                <RoundButton label="→" onClick={() => scrollSubscriptions("right")} />
              </div>
            )}
          </div>

          {activeSubscriptions.length === 0 ? (
            <EmptySubscriptions onClick={() => navigate("/subscription/create/:productId")} />
          ) : (
            <div className="p-4 sm:p-6">
              <div
                ref={subscriptionScrollRef}
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {activeSubscriptions.map((sub, index) => {
                  const deliverySummary = deliverySummaries[sub.id] || {
                    delivered: 0,
                    outForDelivery: 0,
                    skipped: 0,
                  };

                  const isPaused = sub.is_paused === true;
                  const status = isPaused
                    ? "paused"
                    : String(sub.status || "Active").toLowerCase();

                  const isActive = !isPaused && status === "active";
                  const isStopped = status === "stopped";
                  const remainingDays = getRemainingDays(sub.expireDate);

                  return (
                    <SubscriptionCard
                      key={sub.id}
                      sub={sub}
                      index={index}
                      isActive={isActive}
                      isPaused={isPaused}
                      isStopped={isStopped}
                      remainingDays={remainingDays}
                      deliverySummary={deliverySummary}
                      formatMoney={formatMoney}
                      formatDate={formatDate}
                      statusUpdatingId={statusUpdatingId}
                      onPause={() => {
                        setSelectedSubscription(sub);
                        setShowPauseModal(true);
                      }}
                      onResume={() => handleResume(sub.id)}
                      onManage={() => navigate(`/subscription/manage/${sub.id}`)}
                    />
                  );
                })}
              </div>

              {activeSubscriptions.length > 1 && (
                <div className="mt-2 text-center text-[10px] font-bold text-slate-400 sm:hidden">
                  ← Swipe to view more →
                </div>
              )}
            </div>
          )}
        </section>

        {/* NEXT DELIVERY */}
        {activeSubscriptions.length > 0 && (
          <section className="dash-fade mt-5 sm:mt-6">
            <div className="relative overflow-hidden rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/60 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">🚚</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-600">Next delivery</p>
                  <p className="mt-0.5 text-base font-black text-slate-900">
                    {activeSubscriptions[0].size || "Milk"} • {activeSubscriptions[0].quantity || 1} bottle
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {activeSubscriptions[0].deliveryType || activeSubscriptions[0].deliveryTime || "Scheduled delivery"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[9px] font-black text-emerald-700">✓ Scheduled</span>
              </div>
            </div>
          </section>
        )}

        {/* QUICK ACTIONS */}
        <section className="mt-6 flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible">
          <QuickCard icon="📦" title="Order History" desc="View your orders and status" onClick={() => navigate("/order-history")} />
          <QuickCard icon="🥛" title="Milk Subscription" desc="Start or manage daily delivery" onClick={() => navigate("/subscription/create/:productId")} />
          <QuickCard icon="🛍️" title="Shop Products" desc="Milk, curd and dairy products" onClick={() => navigate("/products")} />
        </section>

        {/* RECENT ORDERS */}
        <section className="dash-fade mt-6 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-600">
                Activity
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                Recent Orders
              </h2>
            </div>
            <button
              onClick={() => navigate("/order-history")}
              className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-100 sm:text-xs"
            >
              View all →
            </button>
          </div>

          {latestOrders.length === 0 ? (
            <div className="p-10 text-center sm:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-3xl">
                📭
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-800">
                No orders yet
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Your recent orders will appear here.
              </p>
              <button
                onClick={() => navigate("/products")}
                className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Start shopping →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {latestOrders.map((order) => (
                <OrderRow key={order.id} order={order} formatMoney={formatMoney} formatDate={formatDate} />
              ))}
            </div>
          )}
        </section>

        {/* SMALL TRUST FOOTER */}
        <section className="mt-5 grid grid-cols-3 gap-2 pb-4">
          {[
            ["🥛", "Fresh"],
            ["🚚", "Daily delivery"],
            ["💚", "Farm quality"],
          ].map(([icon, label]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white/75 px-2 py-3 text-center shadow-sm backdrop-blur">
              <div className="text-lg">{icon}</div>
              <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
                {label}
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[22px] border border-white/70 bg-white/90 px-2 py-2 shadow-[0_16px_45px_rgba(15,23,42,.16)] backdrop-blur-xl sm:hidden">
        <MobileNavItem icon="⌂" label="Home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} active />
        <MobileNavItem icon="🛍️" label="Shop" onClick={() => navigate("/products")} />
        <MobileNavItem icon="🥛" label="Subs" onClick={() => navigate("/subscription/create/:productId")} />
        <MobileNavItem icon="📦" label="Orders" onClick={() => navigate("/order-history")} />
        <MobileNavItem icon="☰" label="Menu" onClick={() => document.querySelector("button[aria-label='Menu']")?.click()} />
      </nav>

      <PauseSubscriptionModal
        open={showPauseModal}
        subscription={selectedSubscription}
        loading={loading}
        onClose={() => {
          setShowPauseModal(false);
          setSelectedSubscription(null);
        }}
        onConfirm={handlePauseConfirm}
      />
    </div>
  );
}

function MobileNavItem({ icon, label, onClick, active = false }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex min-w-[52px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition active:scale-95 ${
        active ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
      }`}>
      <span className="text-base leading-none">{icon}</span>
      <span className="text-[8px] font-black uppercase tracking-wide">{label}</span>
    </button>
  );
}

function DashboardAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ icon, title, value, tone }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/70 text-amber-700",
    teal: "border-teal-100 bg-teal-50/70 text-teal-700",
    green: "border-green-100 bg-green-50/70 text-green-700",
    rose: "border-rose-100 bg-rose-50/70 text-rose-700",
  };

  return (
    <div className={`dash-fade rounded-[24px] border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-5 ${tones[tone] || tones.emerald}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider opacity-60 sm:text-xs">
          {title}
        </p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function SubscriptionCard({
  sub,
  index,
  isActive,
  isPaused,
  isStopped,
  remainingDays,
  deliverySummary,
  formatMoney,
  formatDate,
  statusUpdatingId,
  onPause,
  onResume,
  onManage,
}) {
  const statusLabel = isPaused ? "Paused" : isStopped ? "Stopped" : "Active";

  return (
    <article
      style={{ animationDelay: `${index * 70}ms` }}
      className="dash-fade w-[calc(100vw-1.5rem)] max-w-[390px] shrink-0 snap-start overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[390px]"
    >
      <div className={`relative overflow-hidden p-4 text-white sm:p-5 ${
        isPaused
          ? "bg-gradient-to-br from-amber-600 to-orange-500"
          : "bg-gradient-to-br from-emerald-800 to-teal-600"
      }`}>
        <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-white/60">
              Milk subscription
            </p>
            <h3 className="mt-1 text-2xl font-black">
              🥛 {sub.size || "500 ml"}
            </h3>
            <p className="mt-1 text-xs font-bold text-white/70">
              {sub.quantity || 1} bottle{Number(sub.quantity) > 1 ? "s" : ""} daily
            </p>
          </div>

          <span className="rounded-full border border-white/15 bg-white/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-wide backdrop-blur">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <MiniInfoCard label="Delivery" value={sub.deliveryType || "N/A"} />
          <MiniInfoCard label="Monthly" value={formatMoney(sub.monthlyAmount)} />
          <MiniInfoCard label="Start" value={formatDate(sub.startDate)} />
          <MiniInfoCard label="Expires" value={formatDate(sub.expireDate)} />
        </div>

        {remainingDays > 0 && remainingDays <= 7 && (
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-3.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-orange-600">
              Subscription renewal
            </p>
            <p className="mt-1 text-lg font-black text-orange-700">
              🟠 {remainingDays} {remainingDays === 1 ? "Day" : "Days"} Remaining
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-orange-600">
              Please renew your subscription soon.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-blue-700">💳 Payment</p>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
              String(sub.payment_status || "").toLowerCase() === "paid"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-orange-100 text-orange-700"
            }`}>
              {String(sub.payment_status || "PENDING").toUpperCase()}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <MiniInfoCard label="Method" value={sub.payment_method || "N/A"} />
            <MiniInfoCard label="Amount" value={formatMoney(sub.payment_amount ?? sub.total_amount)} />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
          <p className="text-xs font-black text-emerald-700">🚚 Delivery summary</p>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <SummaryNumber label="Delivered" value={deliverySummary.delivered || 0} />
            <SummaryNumber label="Out" value={deliverySummary.outForDelivery || 0} />
            <SummaryNumber label="Skipped" value={deliverySummary.skipped || 0} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {isActive && (
            <button
              onClick={onPause}
              disabled={statusUpdatingId === sub.id}
              className="rounded-xl bg-orange-500 py-3 text-xs font-black text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
            >
              {statusUpdatingId === sub.id ? "Updating..." : "⏸ Pause"}
            </button>
          )}

          {(isPaused || isStopped) && (
            <button
              onClick={onResume}
              disabled={statusUpdatingId === sub.id}
              className="rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {statusUpdatingId === sub.id
                ? "Updating..."
                : isStopped
                ? "↻ Reactivate"
                : "▶ Activate"}
            </button>
          )}

          <button
            onClick={onManage}
            className={`rounded-xl border border-emerald-200 bg-white py-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-50 ${
              isActive ? "" : "col-span-2"
            }`}
          >
            ⚙ Manage
          </button>
        </div>
      </div>
    </article>
  );
}

function MiniInfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-slate-700 sm:text-sm">
        {value}
      </p>
    </div>
  );
}

function SummaryNumber({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-2.5 text-center">
      <p className="text-[9px] font-bold text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-black text-slate-800">{value}</p>
    </div>
  );
}

function QuickCard({ icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group min-w-[240px] snap-start rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl sm:min-w-0"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl transition group-hover:scale-110">
          {icon}
        </span>
        <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600">→</span>
      </div>
      <h3 className="mt-4 text-base font-black text-slate-900">{title}</h3>
      <p className="mt-1.5 text-xs font-medium leading-5 text-slate-500">{desc}</p>
    </button>
  );
}

function OrderRow({ order, formatMoney, formatDate }) {
  const paymentLabel = order.paymentMethod || "N/A";
  const status = order.status || "Pending";

  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-black text-slate-900">
            Order #{order.orderNumber || "—"}
          </h3>
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
            status === "Delivered"
              ? "bg-emerald-100 text-emerald-700"
              : status === "Cancelled"
              ? "bg-rose-100 text-rose-700"
              : "bg-blue-100 text-blue-700"
          }`}>
            {status}
          </span>
        </div>

        <p className="mt-1 text-[10px] font-semibold text-slate-400">
          {formatDate(order.orderDate)}
        </p>

        <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
          {order.items?.map((item) => item.products?.name).filter(Boolean).join(", ") || "Product order"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Payment
          </p>
          <p className="mt-1 text-xs font-black text-slate-700">
            {paymentLabel}
          </p>
        </div>

        <div className="text-right">
          <p className="text-base font-black text-emerald-700">
            {formatMoney(order.totalAmount)}
          </p>
          <p className="text-[9px] font-bold text-slate-400">
            {order.totalItems || 0} item{Number(order.totalItems) === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );
}

function RoundButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-black text-white transition hover:bg-white/20"
    >
      {label}
    </button>
  );
}

function EmptySubscriptions({ onClick }) {
  return (
    <div className="p-10 text-center sm:p-14">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl">
        🥛
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-800">
        No active subscription
      </h3>
      <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-5 text-slate-400 sm:text-sm">
        Start a fresh milk subscription and make your morning delivery effortless.
      </p>
      <button
        onClick={onClick}
        className="mt-5 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700"
      >
        Start Subscription →
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5faf7] px-3 pb-10 pt-28 sm:px-5 sm:pt-32 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-56 rounded-[30px] bg-slate-200" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 rounded-[24px] bg-white shadow-sm" />
          ))}
        </div>
        <div className="mt-4 h-36 rounded-[28px] bg-white shadow-sm" />
        <div className="mt-6 h-[500px] rounded-[30px] bg-white shadow-sm" />
      </div>
    </div>
  );
}
