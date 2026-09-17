import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExtraMilkCard from "../Components/ExtraMilkCard";
import {
  Milk,
  PlusCircle
} from "lucide-react";

import {
  getDashboard,
   pauseSubscriptionApi,
    resumeSubscriptionApi,
  getCustomerOrders,
  getSubscriptionDeliverySummary
} from "../config/api";
import { fetchCustomerSubscriptions } from "../config/api";
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
 const summary = dashboard?.summary || {
  totalOrders: 0,
  totalSpent: 0,
  totalSubscriptions: 0,
  activeSubscriptions: 0,
};
const [orders, setOrders] = useState([]);
const [subscriptions, setSubscriptions] = useState([]);
  const [deliverySummaries, setDeliverySummaries] = useState({});
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState(null);
const latestOrders = dashboard?.recentOrders || [];
  const subscriptionScrollRef = useRef(null);

    const scrollSubscriptions = (direction = "right") => {
      if (!subscriptionScrollRef.current) return;

      const container = subscriptionScrollRef.current;
      const scrollAmount = window.innerWidth < 640 ? 320 : 420;

      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    };



  useEffect(() => {
  if (customer) {
    loadDashboard();
  }
}, [customer]);
useEffect(() => {
  if (!subscriptions.length) return;

  async function loadDeliverySummaries() {
    const summaries = {};

    for (const sub of subscriptions) {
      try {
        const response = await getSubscriptionDeliverySummary(sub.id);

        console.log("Subscription:", sub.id);
        console.log("Response:", response);

        summaries[sub.id] = response.summary || {
          delivered: 0,
          outForDelivery: 0,
          skipped: 0,
        };

      } catch (err) {
        console.error(err);

        summaries[sub.id] = {
          delivered: 0,
          outForDelivery: 0,
          skipped: 0,
        };
      }
    }

    setDeliverySummaries(summaries);
  }

  loadDeliverySummaries();

}, [subscriptions]);

   
  const loadDashboard = async () => {
  try {
    setLoading(true);

    if (!customer) return;

    const res = await getDashboard(customer.id);
    console.log("Dashboard Response:", res);
    console.log("Subscriptions:", res.dashboard.subscriptions);
    const historyRes = await fetchCustomerSubscriptions(customer.id);
    setSubscriptionHistory(historyRes.subscriptions || []);
  

    console.log("Dashboard API:", res);

    if (!res.success) {
      throw new Error(res.message);
    }

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
const handlePauseConfirm = async (
  pauseFrom,
  pauseTo
) => {
  try {

    setLoading(true);

    await pauseSubscriptionApi(
    selectedSubscription.id,
    {
        pause_from: pauseFrom,
        pause_to: pauseTo,
    }
);

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
const activeSubscriptions = subscriptions.filter(
  (sub) => !isSubscriptionExpired(sub.expireDate)
);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-green-100 px-8 py-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🥛</div>
          <h2 className="text-2xl font-black text-green-700">
            Loading Dashboard...
          </h2>
          <p className="text-gray-500 mt-2">
            Please wait while we fetch your orders and subscription details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f5fbf8] pb-24 sm:pb-8">
      {/* Ambient animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -right-32 top-[38%] h-80 w-80 rounded-full bg-cyan-200/25 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute left-[35%] bottom-0 h-64 w-64 rounded-full bg-lime-100/35 blur-3xl animate-[float_9s_ease-in-out_infinite]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/50 bg-gradient-to-br from-[#063f32] via-[#08785f] to-[#0aa889] px-5 py-7 text-white shadow-[0_25px_70px_rgba(0,91,69,.22)] sm:rounded-[40px] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl animate-[float_7s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_0%,rgba(255,255,255,.18)_45%,transparent_46%,transparent_100%)] [background-size:240px_240px] animate-[shine_12s_linear_infinite]" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-emerald-100 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.9)] animate-pulse" />
                  Customer Dashboard
                </div>
                <h1 className="mt-4 text-[30px] font-black leading-[1.05] tracking-[-.04em] sm:text-5xl">
                  Welcome back,
                  <span className="ml-2 text-emerald-200">
                    {dashboard?.customer?.full_name || customer?.name || "Customer"}
                  </span>
                  <span className="ml-2 inline-block animate-bounce">👋</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-emerald-50/85 sm:text-base">
                  Your daily milk, subscriptions and orders — beautifully organized in one place.
                </p>
              </div>

              <div className="hidden shrink-0 sm:flex">
                <div className="rounded-3xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-xl">
                  <div className="text-3xl">🥛</div>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-emerald-100">Fresh daily</p>
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
              <button
                onClick={() => navigate("/products")}
                className="group rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[.98]"
              >
                🛍️ Shop
                <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
              </button>
              <button
                onClick={() => navigate("/subscription/create/:productId")}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white backdrop-blur-md transition-all duration-300 hover:bg-white/15 active:scale-[.98]"
              >
                🥛 Subscribe
              </button>
              <button
                onClick={() => navigate("/order-history")}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white backdrop-blur-md transition-all duration-300 hover:bg-white/15 active:scale-[.98]"
              >
                📦 Orders
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-black text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-red-500/80 hover:text-white active:scale-[.98]"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <ModernStat icon="📦" label="Total Orders" value={summary.totalOrders} />
          <ModernStat icon="🥛" label="Subscriptions" value={summary.totalSubscriptions} />
          <ModernStat icon="⚡" label="Active Plans" value={summary.activeSubscriptions} />
          <ModernStat
            icon={summary.activeSubscriptions > 0 ? "🟢" : "⚪"}
            label="Current Status"
            value={
              summary.activeSubscriptions > 0
                ? "Active"
                : summary.totalSubscriptions > 0
                ? "Paused"
                : "None"
            }
          />
        </section>

        {/* EXTRA MILK */}
        <div className="mt-5">
          <ExtraMilkCard navigate={navigate} />
        </div>

        {/* SUBSCRIPTIONS */}
        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Your daily routine
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                My Subscriptions
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Manage your milk delivery plans
              </p>
            </div>

            <button
              onClick={() => navigate("/subscription/create/:productId")}
              className="hidden rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:inline-flex"
            >
              + Add Plan
            </button>
          </div>

          {activeSubscriptions.length === 0 ? (
            <div className="overflow-hidden rounded-[30px] border border-emerald-100 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,.07)] sm:p-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-emerald-50 text-4xl shadow-inner">🥛</div>
              <h3 className="mt-5 text-xl font-black text-slate-900">No active subscription</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Start a fresh daily milk plan and make your morning delivery effortless.
              </p>
              <button
                onClick={() => navigate("/subscription/create/:productId")}
                className="mt-5 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-1 hover:bg-emerald-700"
              >
                Start Subscription →
              </button>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              {activeSubscriptions.map((sub, index) => {
                const deliverySummary =
                  deliverySummaries[sub.id] || { delivered: 0, outForDelivery: 0, skipped: 0 };
                const isPaused = sub.is_paused === true;
                const status = isPaused ? "paused" : (sub.status || "Active").toLowerCase();
                const isActive = !isPaused && status === "active";
                const isStopped = status === "stopped";
                const remainingDays = getRemainingDays(sub.expireDate);
                const isExpanded = expandedSubscriptionId === sub.id;
                const progressPercent =
                  remainingDays === null
                    ? 0
                    : Math.min(100, Math.max(0, ((30 - remainingDays) / 30) * 100));

                return (
                  <article
                    key={sub.id}
                    className="group relative min-w-0 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,.12)]"
                    style={{ animation: `cardIn .55s ease-out ${index * 80}ms both` }}
                  >
                    {/* Card glow */}
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-200/20 blur-3xl transition-all duration-700 group-hover:bg-emerald-300/35" />

                    <div className="relative overflow-hidden bg-gradient-to-br from-[#075e4b] via-[#078a6c] to-[#0bb394] px-5 py-5 text-white">
                      <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/10 bg-white/10 animate-[float_7s_ease-in-out_infinite]" />
                      <div className="absolute -bottom-16 left-1/2 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[.2em] text-emerald-100">Milk subscription</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-2xl">🥛</span>
                            <h3 className="text-2xl font-black tracking-tight">{sub.size || "500 ml"}</h3>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-emerald-50/85">
                            {sub.quantity || 1} bottle{Number(sub.quantity) > 1 ? "s" : ""} daily
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${
                          isPaused
                            ? "border-orange-200/30 bg-orange-100 text-orange-700"
                            : isActive
                            ? "border-white/20 bg-white text-emerald-700"
                            : isStopped
                            ? "border-white/20 bg-slate-100 text-slate-700"
                            : "border-red-200/30 bg-red-100 text-red-700"
                        }`}>
                          {isPaused ? "Paused" : status}
                        </span>
                      </div>

                      <div className="relative mt-5 grid grid-cols-2 gap-2.5">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100">Monthly</p>
                          <p className="mt-1 text-lg font-black">{formatMoney(sub.monthlyAmount)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-md">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100">Delivery</p>
                          <p className="mt-1 text-base font-black">{sub.deliveryType || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Starts</p>
                          <p className="mt-1 text-xs font-black text-slate-800">{formatDate(sub.startDate)}</p>
                        </div>
                        <div className="w-20 sm:w-28">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="mt-1 text-center text-[8px] font-bold text-slate-400">PLAN PROGRESS</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Expires</p>
                          <p className="mt-1 text-xs font-black text-slate-800">{formatDate(sub.expireDate)}</p>
                        </div>
                      </div>

                      {remainingDays !== null && (
                        <div className={`mt-4 flex items-center justify-between rounded-2xl border px-4 py-3 ${
                          remainingDays <= 7
                            ? "border-orange-200 bg-orange-50"
                            : "border-emerald-100 bg-emerald-50"
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{remainingDays <= 7 ? "⚠️" : "📅"}</span>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Validity</p>
                              <p className={`text-sm font-black ${remainingDays <= 7 ? "text-orange-700" : "text-emerald-700"}`}>
                                {remainingDays} {remainingDays === 1 ? "Day" : "Days"} Remaining
                              </p>
                            </div>
                          </div>
                          {remainingDays <= 7 && remainingDays > 0 && (
                            <span className="text-[9px] font-black text-orange-600">RENEW SOON</span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedSubscriptionId(isExpanded ? null : sub.id)}
                        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50 active:scale-[.99]"
                      >
                        <span>
                          <span className="block text-xs font-black text-slate-800">
                            {isExpanded ? "Hide details" : "View subscription details"}
                          </span>
                          <span className="mt-0.5 block text-[9px] font-semibold text-slate-400">Payment • Delivery • Dates</span>
                        </span>
                        <span className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>⌄</span>
                      </button>

                      <div className={`grid transition-all duration-500 ease-out ${
                        isExpanded ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}>
                        <div className="min-h-0 overflow-hidden">
                          <div className="space-y-3">
                            <ModernDetailSection icon="🥛" title="Milk details">
                              <ModernMini label="Size" value={sub.size || "N/A"} />
                              <ModernMini label="Quantity" value={`${sub.quantity || 1} bottle/day`} />
                              <ModernMini label="Delivery" value={sub.deliveryType || "N/A"} />
                              <ModernMini label="Monthly" value={formatMoney(sub.monthlyAmount)} />
                            </ModernDetailSection>

                            <ModernDetailSection icon="💳" title="Payment">
                              <ModernMini label="Status" value={sub.payment_status || "Pending"} />
                              <ModernMini label="Amount" value={formatMoney(sub.payment_amount ?? sub.total_amount ?? sub.monthlyAmount)} />
                              <ModernMini label="Method" value={sub.payment_method || "N/A"} />
                              <ModernMini label="Date" value={sub.payment_date ? formatDate(sub.payment_date) : "Not Paid Yet"} />
                            </ModernDetailSection>

                            <ModernDetailSection icon="🚚" title="Delivery summary">
                              <ModernMini label="Delivered" value={deliverySummary.delivered || 0} />
                              <ModernMini label="Out for delivery" value={deliverySummary.outForDelivery || 0} />
                              <ModernMini label="Skipped" value={deliverySummary.skipped || 0} />
                            </ModernDetailSection>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5">
                        {isActive && (
                          <button
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowPauseModal(true);
                            }}
                            disabled={statusUpdatingId === sub.id}
                            className="rounded-2xl bg-orange-500 px-3 py-3 text-xs font-black text-white shadow-md shadow-orange-100 transition-all hover:-translate-y-0.5 hover:bg-orange-600 active:scale-[.97] disabled:opacity-60"
                          >
                            ⏸ Pause
                          </button>
                        )}
                        {(isPaused || isStopped) && (
                          <button
                            onClick={() => handleResume(sub.id)}
                            disabled={statusUpdatingId === sub.id}
                            className="rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-black text-white shadow-md shadow-emerald-100 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[.97] disabled:opacity-60"
                          >
                            ▶ Activate
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/subscription/manage/${sub.id}`)}
                          className="rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-xs font-black text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-50 active:scale-[.97]"
                        >
                          ⚙ Manage
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">Quick access</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">What do you need?</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ModernQuick icon="📦" title="Order History" desc="View orders and delivery status" onClick={() => navigate("/order-history")} />
            <ModernQuick icon="🥛" title="Subscription" desc="Start or renew your milk plan" onClick={() => navigate("/subscription/create/:productId")} />
            <ModernQuick icon="🛒" title="Shop Products" desc="Milk, curd, ghee and paneer" onClick={() => navigate("/products")} />
          </div>
        </section>

        {/* RECENT ORDERS */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">Latest activity</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Recent Orders</h2>
            </div>
            <button
              onClick={() => navigate("/order-history")}
              className="rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-100"
            >
              View all →
            </button>
          </div>

          {latestOrders.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">📭</div>
              <h3 className="mt-3 text-lg font-black text-slate-800">No orders yet</h3>
              <p className="mt-1 text-sm text-slate-500">Your latest orders will appear here.</p>
              <button onClick={() => navigate("/products")} className="mt-4 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-100">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {latestOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ animation: `cardIn .5s ease-out ${index * 70}ms both` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-emerald-700">Order #{order.orderNumber}</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-400">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-IN") : "N/A"}
                      </p>
                      <p className="mt-2 truncate text-xs font-semibold text-slate-600">
                        {order.items?.map(item => item.products?.name).join(", ") || "Products"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-black text-slate-900">₹{order.totalAmount}</p>
                      <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ${
                        order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : order.status === "Cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-500">
                    <span>💳 {order.paymentMethod || "N/A"}</span>
                    <span>{order.totalItems || 0} item(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

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

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -12px, 0) scale(1.04); }
        }
        @keyframes shine {
          from { background-position: -240px -240px; }
          to { background-position: 240px 240px; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function ModernStat({ icon, label, value }) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white bg-white/90 p-4 shadow-[0_12px_35px_rgba(15,23,42,.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-100/60 blur-2xl transition group-hover:bg-emerald-200/80" />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-xl transition duration-300 group-hover:scale-110 group-hover:rotate-3">
          {icon}
        </span>
      </div>
    </div>
  );
}

function ModernDetailSection({ icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">{icon}</span>
        <h4 className="text-xs font-black text-slate-800">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {children}
      </div>
    </div>
  );
}

function ModernMini({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-2.5">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-[11px] font-black text-slate-700">{value}</p>
    </div>
  );
}

function ModernQuick({ icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl active:scale-[.99]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl transition duration-300 group-hover:scale-110 group-hover:rotate-3">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-900">{title}</span>
        <span className="mt-1 block text-[10px] font-semibold text-slate-400">{desc}</span>
      </span>
      <span className="ml-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600">→</span>
    </button>
  );
}

function StatCard({ title, value, color = "green" }) {
  return <ModernStat icon="•" label={title} value={value} />;
}

function QuickCard({ icon, title, desc, color, onClick }) {
  return <ModernQuick icon={icon} title={title} desc={desc} onClick={onClick} />;
}

function MiniInfoCard({ label, value, color }) {
  return <ModernMini label={label} value={value} />;
}

