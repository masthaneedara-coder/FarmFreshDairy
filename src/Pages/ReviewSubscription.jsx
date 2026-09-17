import { useLocation, useNavigate } from "react-router-dom";
import { createSubscription } from "../config/api";
import { useState } from "react";
import SubscriptionPaymentModal from "../Components/subscription/SubscriptionPaymentModal";

export default function ReviewSubscription() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePayment = async (payment) => {
    console.log("Razorpay Key:", import.meta.env.VITE_RAZORPAY_KEY_ID);
    console.log("handlePayment received:", payment);

    setShowPaymentModal(false);

    await handleActivate({
      payment_method: payment.paymentMethod,
      payment_status: payment.paymentStatus,
      payment_reference: payment.paymentId || null,
      payment_amount: state.monthlyAmount,
      payment_date:
        payment.paymentStatus === "PAID"
          ? new Date().toISOString()
          : null,
    });
  };

  async function handleActivate(payment = {}) {
    try {
      setLoading(true);

      const customer = JSON.parse(localStorage.getItem("customer"));

      const payload = {
        customer_id: customer.id,
        product_id: state.product.id,
        address_id: state.form.addressId,
        quantity: state.form.quantity,
        size: state.form.size,
        frequency: state.form.frequency,
        delivery_time: state.form.deliveryTime,
        start_date: state.form.startDate,
        total_amount: state.monthlyAmount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        payment_reference: payment.payment_reference || null,
        payment_amount: payment.payment_amount || state.monthlyAmount,
        payment_date: payment.payment_date || null,
      };

      console.log("Subscription Payload:", payload);

      const res = await createSubscription(payload);

      console.log("Subscription Response:", res);

      alert("Subscription Activated Successfully");
      navigate("/dashboard");
    } catch (err) {
      console.error("Subscription Error:", err);

      if (err.stack) {
        console.error(err.stack);
      }

      alert(err.message || "Subscription failed");
    } finally {
      setLoading(false);
    }
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
            🥛
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-800">
            No subscription data found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please go back and create your subscription again.
          </p>
          <button
            type="button"
            onClick={() => navigate("/subscription")}
            className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            Back to Subscription
          </button>
        </div>
      </div>
    );
  }

  const selectedAddress = state.addresses?.find(
    (a) => String(a.id) === String(state.form.addressId)
  );

  const addressText = selectedAddress
    ? [
        selectedAddress.house_no,
        selectedAddress.street,
        selectedAddress.area,
        selectedAddress.city,
        selectedAddress.state,
        selectedAddress.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : "Not Selected";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_8%_8%,rgba(16,185,129,.14),transparent_28%),radial-gradient(circle_at_92%_24%,rgba(132,204,22,.12),transparent_24%),linear-gradient(180deg,#f0fdf4_0%,#ffffff_48%,#ecfdf5_100%)]">
      <style>{`
        @keyframes reviewFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes reviewFloat {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(8px,-10px,0); }
        }

        @keyframes reviewGlow {
          0%, 100% { opacity: .35; transform: scale(1); }
          50% { opacity: .7; transform: scale(1.12); }
        }

        .review-enter {
          animation: reviewFadeUp .6s cubic-bezier(.2,.8,.2,1) both;
        }

        .review-delay-1 { animation-delay: .08s; }
        .review-delay-2 { animation-delay: .16s; }
        .review-delay-3 { animation-delay: .24s; }

        .review-card {
          transition:
            transform .3s cubic-bezier(.2,.8,.2,1),
            box-shadow .3s ease,
            border-color .3s ease;
        }

        .review-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 70px rgba(15,118,110,.12);
          border-color: rgba(16,185,129,.3);
        }

        @media (prefers-reduced-motion: reduce) {
          .review-enter,
          .review-card,
          [class*="animate-"] {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <main className="mx-auto w-full max-w-7xl px-3 pb-28 pt-3 sm:px-5 sm:pb-10 sm:pt-8 lg:px-8">
        {/* Hero */}
        <section className="review-enter relative isolate overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#043b2d] via-[#047857] to-[#16a34a] p-4 text-white shadow-[0_18px_55px_rgba(4,120,87,.20)] sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime-300/15 blur-3xl animate-[reviewFloat_7s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-[reviewFloat_8s_ease-in-out_infinite_reverse]" />
          <div className="pointer-events-none absolute right-[15%] top-8 hidden h-24 w-24 rounded-full border border-white/10 animate-[reviewGlow_4s_ease-in-out_infinite] sm:block" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.16em] backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
                Final Review
              </div>

              <h1 className="mt-3 text-[2rem] font-black leading-[1.02] tracking-tight sm:mt-4 sm:text-5xl lg:text-6xl">
                Review Your
                <span className="block text-lime-200">Milk Subscription</span>
              </h1>

              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-emerald-50 sm:mt-3 sm:text-base sm:leading-relaxed">
                Check your product, delivery plan and address before activating
                your fresh dairy subscription.
              </p>
            </div>

            <div className="shrink-0 self-start rounded-2xl border border-white/15 bg-white/10 p-2.5 text-center backdrop-blur-xl sm:rounded-[1.5rem] sm:p-4">
              <div className="text-3xl">✓</div>
              <p className="mt-1 text-xs font-black uppercase tracking-wider text-emerald-100">
                Ready to Activate
              </p>
            </div>
          </div>
        </section>

        {/* Progress */}
        <div className="review-enter review-delay-1 my-3 grid grid-cols-3 gap-2 sm:my-5 sm:gap-3">
          {[
            ["✓", "Plan Selected"],
            ["✓", "Details Checked"],
            ["₹", "Payment"],
          ].map(([icon, label], index) => (
            <div
              key={label}
              className="flex min-w-0 items-center gap-2 rounded-2xl border border-emerald-100 bg-white/90 px-2.5 py-2.5 shadow-sm backdrop-blur sm:px-4 sm:py-3"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                  index === 2
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {icon}
              </span>
              <span className="truncate text-[9px] font-black uppercase tracking-wide text-slate-600 sm:text-xs">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main */}
          <div className="space-y-5">
            <section className="review-enter review-delay-1 review-card overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white/95 shadow-[0_14px_45px_rgba(15,118,110,.08)] sm:rounded-[2rem]">
              <div className="border-b border-emerald-50 bg-gradient-to-r from-emerald-50/90 via-white to-lime-50/60 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-lg shadow-emerald-600/20">
                    🥛
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.17em] text-emerald-600">
                      Product
                    </p>
                    <h2 className="text-xl font-black text-slate-800 sm:text-2xl">
                      {state.product.name}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-6">
                <div className="grid gap-4 sm:gap-5 lg:grid-cols-[230px_1fr]">
                  <div className="relative mx-auto w-full max-w-[190px] sm:max-w-[230px]">
                    <div className="absolute inset-3 rounded-[2rem] bg-emerald-200/40 blur-2xl" />
                    <div className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-slate-50 p-2 shadow-lg">
                      <img
                        src={state.product.image}
                        alt={state.product.name}
                        className="h-44 w-full rounded-[1.35rem] object-cover transition duration-700 hover:scale-105 sm:h-56"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <Info icon="🥛" label="Product Size" value={state.form.size} />
                    <Info icon="📦" label="Quantity" value={state.form.quantity} />
                    <Info icon="🌅" label="Delivery Time" value={state.form.deliveryTime} />
                    <Info icon="🔄" label="Frequency" value={state.form.frequency} />
                    <Info icon="📅" label="Start Date" value={state.form.startDate} />
                    <Info
                      icon="📍"
                      label="Delivery Address"
                      value={addressText}
                      compact
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Address highlight */}
            <section className="review-enter review-delay-2 rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[0_14px_50px_rgba(15,118,110,.06)] sm:rounded-[2rem] sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-lg text-white shadow-lg shadow-emerald-600/20">
                  ✓
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">
                    Delivery Location
                  </p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-slate-700">
                    {addressText}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <section className="review-enter review-delay-3 overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white/95 shadow-[0_16px_55px_rgba(15,118,110,.12)] backdrop-blur sm:rounded-[2rem]">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-5 text-white sm:p-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-100">
                    Subscription Summary
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Almost Ready!
                  </h2>
                </div>
              </div>

              <div className="space-y-3.5 p-3.5 sm:space-y-4 sm:p-5">
                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        Your Plan
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-800">
                        {state.product.name}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {state.form.quantity} × {state.form.size} · {state.form.frequency}
                      </p>
                    </div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                      🥛
                    </span>
                  </div>
                </div>

                <div className="space-y-3 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 text-sm">
                  <SummaryRow label="Delivery" value={state.form.deliveryTime} icon="🚚" />
                  <SummaryRow label="Start date" value={state.form.startDate} icon="📅" />
                  <SummaryRow label="Frequency" value={state.form.frequency} icon="🔄" />
                </div>

                <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-50 to-white p-5 ring-1 ring-emerald-100">
                  <p className="text-[10px] font-black uppercase tracking-[.17em] text-emerald-600">
                    Monthly Amount
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="text-[2.15rem] font-black tracking-tight text-emerald-800 sm:text-4xl">
                      ₹{Number(state.monthlyAmount || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="pb-1 text-xs font-bold text-slate-400">
                      / month
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 font-black text-slate-600 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[.98]"
                >
                  ← Edit Subscription
                </button>

                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-xl shadow-emerald-600/20 transition hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-2xl active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? "Activating..." : "Activate Subscription"}
                    {!loading && (
                      <span className="text-xl transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </span>
                  {!loading && (
                    <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/20 blur-xl transition-transform duration-700 group-hover:translate-x-[430%]" />
                  )}
                </button>

                <p className="text-center text-[10px] font-semibold leading-relaxed text-slate-400">
                  You will choose your payment method in the secure payment step.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/80 bg-white/90 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2.5 shadow-[0_-12px_35px_rgba(15,118,110,.12)] backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black text-slate-600 shadow-sm transition active:scale-[.98] disabled:opacity-50"
          >
            ← Edit
          </button>
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            disabled={loading}
            className="flex-[1.6] rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition active:scale-[.98] disabled:opacity-60"
          >
            {loading ? "Activating..." : "Activate • ₹" + Number(state.monthlyAmount || 0).toLocaleString("en-IN")}
          </button>
        </div>
      </div>

      <SubscriptionPaymentModal
        open={showPaymentModal}
        amount={state.monthlyAmount}
        customer={JSON.parse(localStorage.getItem("customer"))}
        onClose={() => setShowPaymentModal(false)}
        onContinue={handlePayment}
      />
    </div>
  );
}

function Info({ icon, label, value, compact = false }) {
  return (
    <div className="group min-w-0 rounded-[1.15rem] border border-slate-200 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg sm:rounded-[1.25rem] sm:p-4">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">
          {label}
        </p>
      </div>
      <h3
        className={`mt-2 font-black leading-snug text-slate-800 ${
          compact ? "text-sm" : "text-lg"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-slate-500">
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      <span className="max-w-[55%] truncate text-right font-black text-slate-700">
        {value}
      </span>
    </div>
  );
}
