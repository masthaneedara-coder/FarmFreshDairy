import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createSubscription, fetchSubscriptionHistory } from "../config/api";
import SubscriptionPaymentModal from "../Components/subscription/SubscriptionPaymentModal";

export default function ReviewSubscription() {
  const { state } = useLocation();
  const navigate = useNavigate();
  //const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const handleActivateClick = () => {
  console.log("Continue to payment clicked");
  setShowPaymentModal(true);
};

const handleClosePaymentModal = () => {
  setShowPaymentModal(false);
};

  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExistingSubscriptionModal, setShowExistingSubscriptionModal] = useState(false);
  const [checkingExistingSubscription, setCheckingExistingSubscription] = useState(false);
  const [existingSubscription, setExistingSubscription] = useState(null);
  const [customer] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("customer") || "null");
  } catch {
    return null;
  }
});
const prepareOnlineSubscription = async () => {
  if (!customer?.id) {
    throw new Error("Please sign in again.");
  }

  if (subscriptionId) return subscriptionId;

  const payload = {
    customer_id: customer.id,
    product_id: state.product.id,
    address_id: state.form.addressId,
    quantity: state.form.quantity,
    size: state.form.size,
    frequency: state.form.frequency,
    delivery_time: state.form.deliveryTime,
    start_date: state.form.startDate,
    total_amount: amount,
    payment_method: "ONLINE",
    payment_status: "Pending",
  };

  const response = await createSubscription(payload);

  const id =
    response?.subscription?.id ??
    response?.data?.subscription?.id ??
    response?.data?.id ??
    response?.id;

  if (!id) {
    throw new Error(
      "Subscription was created, but its ID was not returned. Check the createSubscription API response."
    );
  }

  setSubscriptionId(id);
  return id;
};

//const [subscriptionId, setSubscriptionId] = useState(null);

  const selectedAddress = state?.addresses?.find(
    (address) => String(address.id) === String(state?.form?.addressId)
  );

  const addressText = selectedAddress
    ? [
        selectedAddress.house_no,
        selectedAddress.street,
        selectedAddress.area,
        selectedAddress.city,
        selectedAddress.state,
        selectedAddress.pincode,
      ].filter(Boolean).join(", ")
    : "Address not selected";

  const amount = Number(state?.monthlyAmount || 0);
  const checkoutPayload = {
  product_id: state?.product?.id,
  address_id: state?.form?.addressId,
  quantity: state?.form?.quantity,
  size: state?.form?.size,
  frequency: state?.form?.frequency,
  delivery_time: state?.form?.deliveryTime,
  start_date: state?.form?.startDate,
  total_amount: amount,
};
  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const handlePayment = async (payment) => {
  // Preserve the existing COD behavior.
  if (payment.paymentMethod === "COD") {
    setShowPaymentModal(false);

    await handleActivate({
      payment_method: "COD",
      payment_status: "Pending",
      payment_reference: null,
      payment_amount: amount,
      payment_date: null,
    });

    return;
  }

  // Online subscription is created by the backend after
  // successful payment verification.
  if (
    payment.paymentMethod === "ONLINE" &&
    payment.paymentStatus === "PAID" &&
    payment.subscriptionId
  ) {
    setShowPaymentModal(false);
    alert("Subscription payment successful!");
    navigate("/dashboard");
    return;
  }

  throw new Error(
    "Payment was not confirmed or the subscription was not returned. Please check the payment status."
  );
};
  async function checkExistingSubscription() {
    try {
      setCheckingExistingSubscription(true);
      const customerData = localStorage.getItem("customer");
      if (!customerData) return;

      const customer = JSON.parse(customerData);
      if (!customer?.id) return;

      const response = await fetchSubscriptionHistory(customer.id);
      const subscriptions = Array.isArray(response)
        ? response
        : Array.isArray(response?.subscriptions)
          ? response.subscriptions
          : Array.isArray(response?.history)
            ? response.history
            : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const current = subscriptions.find((subscription) => {
        if (!subscription) return false;
        const status = String(subscription.status || "").trim().toLowerCase();
        if (status !== "active" && status !== "paused") return false;
        if (!subscription.end_date) return true;
        const endDate = new Date(`${String(subscription.end_date).slice(0, 10)}T23:59:59`);
        return !Number.isNaN(endDate.getTime()) && endDate >= today;
      });

      setExistingSubscription(current || null);
      if (current) setShowExistingSubscriptionModal(true);
    } catch (error) {
      console.error("ReviewSubscription: subscription check failed:", error);
    } finally {
      setCheckingExistingSubscription(false);
    }
  }

  useEffect(() => {
    if (state) checkExistingSubscription();
  }, [state]);

  async function handleActivate(payment = {}) {
    try {
      setLoading(true);
      const customer = JSON.parse(localStorage.getItem("customer") || "null");
      if (!customer?.id) throw new Error("Please sign in again before activating your subscription.");
      if (!state?.product?.id || !state?.form) throw new Error("Subscription details are missing. Please create your plan again.");

      const payload = {
        customer_id: customer.id,
        product_id: state.product.id,
        address_id: state.form.addressId,
        quantity: state.form.quantity,
        size: state.form.size,
        frequency: state.form.frequency,
        delivery_time: state.form.deliveryTime,
        start_date: state.form.startDate,
        total_amount: amount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        payment_reference: payment.payment_reference || null,
        payment_amount: payment.payment_amount || amount,
        payment_date: payment.payment_date || null,
      };

      await createSubscription(payload);
      alert("Subscription Activated Successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("Subscription Error:", error);
      alert(error.message || "Subscription failed");
    } finally {
      setLoading(false);
    }
  }

  if (!state) {
    return (
      <main className="min-h-[70vh] bg-[#f4fbf6] px-4 py-12">
        <div className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">🥛</div>
          <h2 className="mt-4 text-2xl font-black text-slate-900">No subscription details</h2>
          <p className="mt-2 text-sm text-slate-500">Please choose your product and plan again.</p>
          <button onClick={() => navigate("/subscription")} className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">
            Back to Subscription
          </button>
        </div>
      </main>
    );
  }

  const productImage = state.product?.image;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f8f5] pb-24 text-slate-800 sm:pb-8">
      <style>{`
        @keyframes reviewRise { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes reviewDrift { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-5px) } }
        .review-rise { animation: reviewRise .5s ease-out both; }
        .review-drift { animation: reviewDrift 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .review-rise,.review-drift { animation:none !important; } }
      `}</style>

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Compact brand banner */}
        <section className="review-rise relative overflow-hidden rounded-[1.5rem] bg-[#063f32] p-5 text-white shadow-[0_18px_50px_rgba(6,95,70,.16)] sm:rounded-[2rem] sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-lime-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-lime-100">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> FarmFreshDairy
              </div>
              <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                One last look<span className="text-lime-300">.</span>
                <span className="block text-emerald-100">Then, fresh starts.</span>
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-5 text-emerald-50/90 sm:text-sm">
                Confirm your delivery details and monthly plan before activation.
              </p>
            </div>
            <div className="review-drift hidden h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] border border-white/20 bg-white/10 text-4xl shadow-lg sm:flex lg:h-24 lg:w-24">
              🥛
            </div>
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-4 sm:mt-6 sm:gap-4 sm:pt-5">
            {[["01", "Product"], ["02", "Delivery"], ["03", "Review"]].map(([num, label], i) => (
              <div key={num} className="flex items-center gap-2 text-xs font-bold text-white/90">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] ${i === 2 ? "bg-lime-300 text-emerald-950" : "bg-white/15 text-white"}`}>{num}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-5">
          {/* Main review card */}
          <section className="review-rise overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,.045)] sm:rounded-[1.75rem]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">🧾</span>
                <div>
                  <h2 className="text-base font-black sm:text-lg">Your subscription details</h2>
                  <p className="text-[11px] text-slate-500 sm:text-xs">Please check everything is correct</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700">REVIEW</span>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex gap-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50/70 p-3 sm:gap-5 sm:p-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white bg-white shadow-sm sm:h-32 sm:w-32">
                  {productImage ? (
                    <img src={productImage} alt={state.product?.name || "Selected dairy product"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🥛</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 self-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-emerald-700">Selected product</p>
                  <h3 className="mt-1 text-lg font-black leading-tight sm:text-2xl">{state.product?.name || "Dairy Product"}</h3>
                  <p className="mt-1 text-xs text-slate-500">{state.form.quantity} × {state.form.size} · {state.form.frequency}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-extrabold text-emerald-800 shadow-sm">
                    <span>✓</span> Plan selected
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <DetailTile icon="📦" label="Quantity" value={`${state.form.quantity} × ${state.form.size}`} />
                <DetailTile icon="🚚" label="Delivery time" value={state.form.deliveryTime} />
                <DetailTile icon="🔁" label="Frequency" value={state.form.frequency} />
                <DetailTile icon="📅" label="Start date" value={state.form.startDate} />
                <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2">
                  <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><span>📍</span> Delivery address</p>
                  <p className="mt-1.5 break-words text-xs font-bold leading-5 text-slate-700 sm:text-sm">{addressText}</p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 p-3">
                <span className="mt-0.5 text-lg">🌱</span>
                <p className="text-xs leading-5 text-teal-900">Your selected delivery schedule and address will be used when creating this subscription.</p>
              </div>
            </div>
          </section>

          {/* Order summary */}
          <aside className="review-rise lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-[0_12px_38px_rgba(6,95,70,.08)] sm:rounded-[1.75rem]">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 text-white">
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-50">Payment overview</p>
                <h2 className="mt-1 text-xl font-black">Your monthly plan</h2>
              </div>
              <div className="p-4 sm:p-5">
                <div className="rounded-2xl bg-[#f1faf4] p-4">
                  <p className="text-xs font-bold text-slate-500">Estimated monthly amount</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <p className="text-3xl font-black tracking-tight text-emerald-800 sm:text-4xl">{money(amount)}</p>
                    <span className="pb-1 text-xs font-bold text-slate-400">/ month</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
                    <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" />
                  </div>
                </div>

                <div className="my-4 space-y-3">
                  <SummaryRow label="Product" value={state.product?.name || "Dairy Product"} icon="🥛" />
                  <SummaryRow label="Delivery" value={state.form.deliveryTime} icon="🚚" />
                  <SummaryRow label="Frequency" value={state.form.frequency} icon="🔁" />
                  <SummaryRow label="Start date" value={state.form.startDate} icon="📅" />
                </div>

                <button type="button" onClick={() => navigate(-1)} disabled={loading} className="hidden w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-extrabold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 sm:block disabled:opacity-50">
                  ← Edit subscription
                </button>
                <button type="button" onClick={() => setShowPaymentModal(true)} disabled={loading || checkingExistingSubscription} className="hidden w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[.98] disabled:opacity-60 sm:flex">
                  {loading ? "Activating..." : checkingExistingSubscription ? "Checking subscription..." : "Continue to payment"} <span>→</span>
                </button>
                <p className="mt-3 text-center text-[10px] leading-4 text-slate-400">Your payment method is selected in the secure payment step.</p>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* Compact mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-8px_28px_rgba(15,23,42,.08)] backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          <button type="button" onClick={() => navigate(-1)} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-extrabold text-slate-600 disabled:opacity-50">← Edit</button>
          <button type="button" onClick={() => setShowPaymentModal(true)} disabled={loading || checkingExistingSubscription} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-60">
            {loading ? "Activating..." : `Continue · ${money(amount)}`}
          </button>
        </div>
      </div>

      {/* Existing subscription confirmation */}
      {showExistingSubscriptionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="existing-subscription-title">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-500 p-5 text-white">
              <div className="flex items-center gap-3">
                <img src="/farmfresh-logo.png" alt="FarmFreshDairy logo" className="h-11 w-11 rounded-full bg-white object-contain p-1" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                <div>
                  <h2 id="existing-subscription-title" className="font-black">You already have a subscription</h2>
                  <p className="mt-1 text-xs text-emerald-50">Would you like to continue with another plan?</p>
                </div>
              </div>
            </div>
            {existingSubscription && (
              <div className="p-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-800">{existingSubscription.subscription_items?.[0]?.products?.name || existingSubscription.subscription_items?.[0]?.product?.name || existingSubscription.product_name || "Current subscription"}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${String(existingSubscription.status).toLowerCase() === "paused" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{String(existingSubscription.status || "").toLowerCase() === "paused" ? "Paused" : "Active"}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">Size / quantity: {(existingSubscription.subscription_items?.[0]?.size || existingSubscription.size || "1L")} × {(existingSubscription.subscription_items?.[0]?.quantity || existingSubscription.quantity || 1)}</p>
                  <p className="mt-1 text-xs text-slate-600">Expiry date: {existingSubscription.end_date || "Not specified"}</p>
                  <p className="mt-2 text-lg font-black text-emerald-800">{money(existingSubscription.total_amount)} <span className="text-xs font-semibold text-slate-500">/ month</span></p>
                </div>
                <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Your existing subscription will remain unchanged.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4">
              <button type="button" onClick={() => setShowExistingSubscriptionModal(false)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-extrabold text-slate-600 hover:bg-slate-50">No, cancel</button>
              <button type="button" onClick={() => { setShowExistingSubscriptionModal(false); setShowPaymentModal(true); }} className="rounded-xl bg-emerald-600 px-3 py-3 text-sm font-extrabold text-white hover:bg-emerald-700">Yes, continue</button>
            </div>
          </div>
        </div>
      )}

 <SubscriptionPaymentModal
  open={showPaymentModal}
  amount={amount}
  customer={customer}
  checkoutPayload={checkoutPayload}
  onClose={handleClosePaymentModal}
  onContinue={handlePayment}
/>
    </div>
  );
}

function DetailTile({ icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-3 transition duration-200 hover:border-emerald-200 hover:bg-emerald-50/40">
      <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><span>{icon}</span>{label}</p>
      <p className="mt-2 break-words text-sm font-black text-slate-800">{value || "—"}</p>
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex min-w-0 items-center gap-2 text-slate-500"><span>{icon}</span><span>{label}</span></span>
      <span className="max-w-[58%] truncate text-right font-extrabold text-slate-700">{value || "—"}</span>
    </div>
  );
}
