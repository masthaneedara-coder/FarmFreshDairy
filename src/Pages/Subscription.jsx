import { useEffect } from "react";

import SubscriptionHeader from "../Components/subscription/SubscriptionHeader";
import ActiveSubscriptionCard from "../Components/subscription/ActiveSubscriptionCard";
import ProgressCard from "../Components/subscription/ProgressCard";
import BillingCard from "../Components/subscription/BillingCard";
import ProductSelector from "../Components/subscription/ProductSelector";
import DeliveryOptions from "../Components/subscription/DeliveryOptions";
import SubscriptionSummary from "../Components/subscription/SubscriptionSummary";
import UpcomingDelivery from "../Components/subscription/UpcomingDelivery";
import SubscriptionHistory from "../Components/subscription/SubscriptionHistory";
import SubscriptionActions from "../Components/subscription/SubscriptionActions";
import SubscriptionStatistics from "../Components/subscription/SubscriptionStatistics";
import NextDeliveryCard from "../Components/subscription/NextDeliveryCard";
import SubscriptionTimeline from "../Components/subscription/SubscriptionTimeline";

import { getCustomerId } from "../config/auth";
import { useSubscription } from "../context/SubscriptionContext";

const cardShell =
  "rounded-3xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.11)]";

function SectionLabel({ icon, title, subtitle, color = "from-cyan-500 to-blue-600" }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${color} text-xl text-white shadow-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-extrabold tracking-tight text-slate-800 sm:text-lg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Subscription() {
  const customerId = getCustomerId();

  const {
    subscription,
    history,
    billing,
    upcomingDelivery,
    deliverySummary,
    selectedProduct,
    setSelectedProduct,
    deliveryOptions,
    setDeliveryOptions,
    loading,
    loadSubscriptionData,
    pause,
    resume,
    cancel,
    renew,
  } = useSubscription();

  useEffect(() => {
    if (!customerId) return;
    loadSubscriptionData(customerId);
  }, [customerId, loadSubscriptionData]);

  if (loading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4">
        <div className="absolute -left-16 -top-16 h-56 w-56 animate-pulse rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-56 w-56 animate-pulse rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="relative rounded-3xl border border-white bg-white/85 px-8 py-9 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-3xl shadow-lg shadow-cyan-200/70">
            🥛
          </div>
          <div className="mx-auto mb-4 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-[subLoading_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400" />
          </div>
          <p className="text-lg font-extrabold text-slate-800">Loading your subscription</p>
          <p className="mt-1 text-sm text-slate-500">Getting your fresh milk plan ready…</p>
          <style>{`@keyframes subLoading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } } @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f9fc] text-slate-800">
      <style>{`
        @keyframes subFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
        @keyframes subShine { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes subFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .subscription-fade-up { animation: subFadeUp .55s ease-out both; }
        .subscription-shine { background-size: 200% 100%; animation: subShine 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .subscription-fade-up, .subscription-shine { animation: none !important; } }
      `}</style>

      {/* Soft ambient background decoration */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-br from-cyan-100/70 via-sky-50 to-emerald-100/50" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-64 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-[34rem] h-80 w-80 rounded-full bg-violet-200/20 blur-3xl" />

      <div className="relative z-10">
        <SubscriptionHeader />

        <div className="mx-auto max-w-[1440px] px-3 pb-10 pt-5 sm:px-5 sm:pt-7 lg:px-8">
          {/* Intro banner */}
          <section className="subscription-fade-up subscription-shine relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-500 p-5 text-white shadow-xl shadow-cyan-900/10 sm:p-7">
            <div className="absolute -right-5 -top-8 select-none text-[8rem] opacity-[0.13]" style={{ animation: "subFloat 5s ease-in-out infinite" }} aria-hidden="true">🥛</div>
            <div className="absolute -bottom-12 right-28 h-40 w-40 rounded-full border border-white/20" aria-hidden="true" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold tracking-wide text-white/95 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-200 shadow-[0_0_0_4px_rgba(167,243,208,0.16)]" />
                  YOUR DAILY FRESHNESS
                </div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">My Milk Subscription</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-cyan-50 sm:text-base">
                  Manage your plan, check deliveries and billing, and keep your daily milk routine running smoothly.
                </p>
              </div>
              <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/25 bg-white/15 px-4 py-3 backdrop-blur-md">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 text-2xl">🚚</span>
                <div>
                  <p className="text-xs font-medium text-white/75">Your routine</p>
                  <p className="text-sm font-extrabold">Fresh. Daily. Delivered.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
            {/* Main plan configuration */}
            <section className="subscription-fade-up min-w-0 space-y-5 xl:col-span-7" style={{ animationDelay: "60ms" }}>
              <div className={`${cardShell} p-4 sm:p-6`}>
                <SectionLabel icon="🧃" title="Choose your milk" subtitle="Select the product that suits your home" color="from-cyan-500 to-blue-600" />
                <ProductSelector selectedProduct={selectedProduct} onSelectProduct={setSelectedProduct} />
              </div>

              <div className={`${cardShell} p-4 sm:p-6`}>
                <SectionLabel icon="🗓️" title="Delivery preferences" subtitle="Set your preferred delivery schedule" color="from-violet-500 to-fuchsia-500" />
                <DeliveryOptions options={deliveryOptions} onChange={setDeliveryOptions} />
              </div>

              <div className={`${cardShell} overflow-hidden p-4 sm:p-6`}>
                <SectionLabel icon="🧾" title="Subscription summary" subtitle="Review your current plan details" color="from-emerald-500 to-teal-500" />
                <SubscriptionSummary
                  subscription={subscription}
                  product={selectedProduct}
                  quantity={subscription?.subscription_items?.[0]?.quantity ?? selectedProduct?.quantity ?? 1}
                  size={subscription?.subscription_items?.[0]?.size ?? selectedProduct?.size ?? "1L"}
                  frequency={subscription?.frequency ?? deliveryOptions.frequency}
                  deliveryTime={subscription?.delivery_time ?? deliveryOptions.deliveryTime}
                  duration={deliveryOptions.duration}
                  amount={subscription?.total_amount ?? 0}
                />
              </div>
            </section>

            {/* Overview and actions */}
            <aside className="subscription-fade-up min-w-0 space-y-5 xl:col-span-5" style={{ animationDelay: "140ms" }}>
              <div className={`${cardShell} overflow-hidden p-4 sm:p-5`}>
                <SectionLabel icon="✨" title="Plan overview" subtitle="Your current subscription at a glance" color="from-amber-400 to-orange-500" />
                <ActiveSubscriptionCard subscription={subscription} />
              </div>

              <div className={`${cardShell} p-4 sm:p-5`}>
                <SectionLabel icon="📈" title="Subscription progress" subtitle="Track your current plan period" color="from-blue-500 to-indigo-500" />
                <ProgressCard remainingDays={21} totalDays={30} />
              </div>

              <div className={`${cardShell} p-4 sm:p-5`}>
                <SectionLabel icon="💳" title="Billing details" subtitle="Keep an eye on your subscription charges" color="from-pink-500 to-rose-500" />
                <BillingCard billing={billing} />
              </div>

              <div className={`${cardShell} p-4 sm:p-5`}>
                <SectionLabel icon="⚙️" title="Manage subscription" subtitle="Pause, resume, cancel or renew your plan" color="from-violet-500 to-purple-600" />
                <SubscriptionActions
                  subscription={subscription}
                  onPause={pause}
                  onResume={resume}
                  onCancel={cancel}
                  onRenew={() => renew(subscription?.id, subscription?.end_date, subscription?.total_amount)}
                />
              </div>

              <div className={`${cardShell} p-4 sm:p-5`}>
                <SectionLabel icon="📊" title="Delivery statistics" subtitle="A quick look at your delivery activity" color="from-teal-500 to-emerald-600" />
                <SubscriptionStatistics subscription={subscription} summary={deliverySummary} />
              </div>

              <div className={`${cardShell} p-4 sm:p-5`}>
                <SectionLabel icon="🛵" title="Next delivery" subtitle="What’s coming up next" color="from-orange-400 to-amber-500" />
                <NextDeliveryCard subscription={subscription} />
              </div>

              <div className={`${cardShell} p-4 sm:p-5`}>
                <SectionLabel icon="🕒" title="Plan timeline" subtitle="Follow your subscription journey" color="from-indigo-500 to-blue-600" />
                <SubscriptionTimeline subscription={subscription} />
              </div>
            </aside>
          </div>

          {/* Delivery and history sections */}
          <section className={`${cardShell} subscription-fade-up mt-6 p-4 sm:p-6`} style={{ animationDelay: "200ms" }}>
            <SectionLabel icon="📦" title="Upcoming deliveries" subtitle="Your planned milk deliveries" color="from-cyan-500 to-sky-600" />
            <UpcomingDelivery delivery={upcomingDelivery} />
          </section>

          <section className={`${cardShell} subscription-fade-up mt-6 p-4 sm:p-6`} style={{ animationDelay: "260ms" }}>
            <SectionLabel icon="📚" title="Subscription history" subtitle="Review your previous plans" color="from-fuchsia-500 to-purple-600" />
            <SubscriptionHistory subscriptions={history} />
          </section>

          <p className="mt-7 text-center text-xs font-medium text-slate-400">
            FarmFreshDairy <span className="mx-1">•</span> Fresh milk, delivered with care 🥛
          </p>
        </div>
      </div>
    </main>
  );
}
