import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  CalendarDays,
  Clock3,
  Milk,
  RefreshCw,
  ShieldCheck,
  XCircle,
  User,
  MapPin,
  Sparkles,
} from "lucide-react";

import {
  getRenewalLinkDetails,
  renewSubscriptionUsingLink,
  createRenewalPaymentOrder,
  verifyPayment,
} from "../config/api";

export default function RenewSubscription() {
  const { token } = useParams();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    loadSubscription();
  }, [token]);

  async function loadSubscription() {
    try {
      setLoading(true);
      setError("");

      const data = await getRenewalLinkDetails(token);

      setSubscription(data?.subscription || null);
    } catch (err) {
      console.error("Renewal details error:", err);

      setError(
        err?.message ||
          "This renewal link is invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  }

 function handleRenew() {
  setError("");
  setShowPaymentOptions(true);
}

  function formatDate(value) {
    if (!value) return "-";

    const date =
      new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatMoney(value) {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  }

 

async function handleConfirmRenewal() {
  try {
    setRenewing(true);
    setError("");

    // COD renewal
    if (paymentMethod === "COD") {
      const result = await renewSubscriptionUsingLink(token, "COD");

      if (!result?.success) {
        throw new Error(result?.message || "Renewal failed.");
      }

      setSuccess(true);
      return;
    }

    // Online payment requires Razorpay Checkout.
    const result = await createRenewalPaymentOrder(token);

    if (!result?.success || !result?.order?.id || !result?.intent_id) {
      throw new Error(
        result?.message || "Unable to create the payment order."
      );
    }

    if (!result?.key) {
      throw new Error("Razorpay Key ID is missing from the server response.");
    }

    if (!window.Razorpay) {
      throw new Error(
        "Razorpay Checkout is not loaded. Please refresh and try again."
      );
    }

    const customer = subscription || {};

    const options = {
      key: result.key,
      amount: result.order.amount,
      currency: result.order.currency || "INR",
      name: "FarmFreshDairy",
      description: "Subscription Renewal",
      order_id: result.order.id,
      prefill: {
        name: customer.customerName || "",
        contact: customer.phone || "",
      },
      theme: {
        color: "#16a34a",
      },
      modal: {
        ondismiss: () => {
          setError("Payment was cancelled or left incomplete. You can retry.");
          setRenewing(false);
        },
      },
      handler: async (response) => {
        try {
          const verification = await verifyRenewalPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            customer_id: customer.customer_id || customer.customerId,
            intent_id: result.intent_id,
          });

          if (!verification?.success || !verification?.payment?.verified) {
            throw new Error(
              verification?.message || "Payment verification failed."
            );
          }

          setSuccess(true);
        } catch (verifyError) {
          console.error("Renewal payment verification failed:", verifyError);
          setError(
            verifyError?.message ||
              "Payment may have been received, but renewal confirmation needs checking. Do not pay again."
          );
        } finally {
          setRenewing(false);
        }
      },
    };

    const checkout = new window.Razorpay(options);

    checkout.on("payment.failed", (event) => {
      console.error("Razorpay payment failed:", event.error);
      setError(
        event.error?.description ||
          "Payment failed. Please retry or choose COD."
      );
      setRenewing(false);
    });

    checkout.open();
  } catch (err) {
    console.error("Confirm Renewal Error:", err);
    setError(err?.message || "Unable to renew subscription.");
    setRenewing(false);
  }
}



  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 px-4 flex items-center justify-center">

        <div className="w-full max-w-sm text-center">

          {/* Animated Logo */}
          <div className="relative mx-auto mb-6 h-28 w-28">

            <div className="absolute inset-0 rounded-full bg-green-300/30 blur-xl animate-pulse" />

            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-xl border border-green-100 animate-logoFloat">

              <img
                src="/logo.png"
                alt="FarmFreshDairy"
                className="h-20 w-20 object-contain animate-logoPulse"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <Milk
                size={36}
                className="absolute text-green-600"
                style={{
                  display: "none",
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">

            <RefreshCw
              size={18}
              className="animate-spin text-green-600"
            />

            <p className="text-sm font-black text-green-800">
              Loading your subscription...
            </p>

          </div>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            Please wait a moment
          </p>

        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 px-4 flex items-center justify-center">

        <div className="w-full max-w-md">

          <div className="rounded-[2rem] bg-white p-6 sm:p-8 text-center shadow-2xl border border-red-100">

            {/* Logo */}
            <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-white shadow-lg border border-red-100 flex items-center justify-center overflow-hidden">

              <img
                src="/logo.png"
                alt="FarmFreshDairy"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <XCircle
                size={36}
                className="text-red-500"
              />

            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Renewal Link Unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 font-semibold text-slate-500">
              {error}
            </p>

            <div className="mt-6 rounded-2xl bg-red-50 p-4">

              <p className="text-xs font-black text-red-700">
                Please contact FarmFreshDairy
              </p>

              <p className="mt-1 text-xs font-semibold text-red-500">
                We can send you a new renewal link.
              </p>

            </div>

          </div>

          <p className="mt-5 text-center text-xs font-bold text-slate-400">
            FarmFreshDairy • Fresh milk delivered daily 🥛
          </p>

        </div>
      </div>
    );
  }

  /* ==========================================================
     SUCCESS
  ========================================================== */

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 flex items-center justify-center">

        <div className="w-full max-w-md">

          <div className="rounded-[2rem] bg-white p-6 sm:p-8 text-center shadow-2xl border border-green-100">

            {/* Animated Logo */}
            <div className="relative mx-auto mb-6 h-28 w-28">

              <div className="absolute inset-0 rounded-full bg-green-300/30 blur-xl animate-pulse" />

              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white border border-green-100 shadow-xl animate-logoFloat">

                <img
                  src="/logo.png"
                  alt="FarmFreshDairy"
                  className="h-20 w-20 object-contain"
                />

              </div>

            </div>

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">

              <CheckCircle2
                size={34}
                className="text-green-600"
              />

            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-green-800">
              Subscription Renewed!
            </h1>

            <p className="mt-3 text-sm leading-6 font-semibold text-slate-500">
              Your FarmFreshDairy subscription
              has been successfully renewed.
            </p>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-5 border border-green-100">

              <p className="text-xs font-black uppercase tracking-wide text-green-600">
                Milk Delivery
              </p>

              <p className="mt-2 text-lg font-black text-green-800">
                Your delivery will continue 🥛
              </p>

            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">

              <ShieldCheck
                size={16}
                className="text-green-600"
              />

              Secure FarmFreshDairy renewal

            </div>

          </div>

          <p className="mt-5 text-center text-xs font-bold text-slate-400">
            Thank you for choosing FarmFreshDairy ❤️
          </p>

        </div>
      </div>
    );
  }

  /* ==========================================================
     SUBSCRIPTION DATA
  ========================================================== */

  const product =
    subscription?.product || "Milk";

  const size =
    subscription?.size || "";

  const quantity =
    subscription?.quantity || 1;

  /* ==========================================================
     MAIN PAGE
  ========================================================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 px-3 py-5 sm:px-5 sm:py-8">

      <div className="mx-auto w-full max-w-lg">

        {/* ==================================================
            LOGO HEADER
        ================================================== */}

        <div className="mb-5 text-center">

          <div className="relative mx-auto mb-3 h-24 w-24">

            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-green-300/30 blur-xl animate-pulse" />

            {/* Logo */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl border border-green-100 animate-logoFloat">

              <img
                src="/logo.png"
                alt="FarmFreshDairy Logo"
                className="h-[72px] w-[72px] object-contain animate-logoPulse"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <Milk
                size={30}
                className="absolute text-green-600"
                style={{
                  display: "none",
                }}
              />

            </div>

          </div>

          <div className="flex items-center justify-center gap-1.5">

            <Sparkles
              size={16}
              className="text-green-500"
            />

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-green-800">
              FarmFresh<span className="text-emerald-500">Dairy</span>
            </h1>

            <Sparkles
              size={16}
              className="text-green-500"
            />

          </div>

          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-500">
            Fresh milk • Daily delivery • Farm quality
          </p>

          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />

        </div>


        {/* ==================================================
            MAIN CARD
        ================================================== */}

        <div className="overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-2xl animate-slideUp">

          {/* TOP GREEN BAR */}

          <div className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 px-5 py-4 text-white">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">

                <User size={21} />

              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-black uppercase tracking-widest text-green-100">
                  Welcome back
                </p>

                <h2 className="truncate text-lg sm:text-xl font-black">
                  {subscription.customerName || "Customer"}
                </h2>

              </div>

            </div>

          </div>


          {/* CONTENT */}

          <div className="p-4 sm:p-6">

            {/* PRODUCT */}

            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-100">

              <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">

                  <p className="text-[10px] font-black uppercase tracking-wider text-green-600">
                    Subscription
                  </p>

                  <p className="mt-1 text-lg sm:text-xl font-black text-green-900">
                    {product}
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-600">
                    {size}
                    {size && " • "}
                    Qty {quantity}
                  </p>

                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">

                  <Milk
                    size={30}
                    className="text-green-600"
                  />

                </div>

              </div>

            </div>


            {/* DATES */}

            <div className="mt-3 grid grid-cols-2 gap-3">

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 sm:p-4">

                <CalendarDays
                  size={18}
                  className="text-slate-500"
                />

                <p className="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Previous Start
                </p>

                <p className="mt-1 text-xs sm:text-sm font-black text-slate-800">
                  {formatDate(
                    subscription.startDate
                  )}
                </p>

              </div>


              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 sm:p-4">

                <CalendarDays
                  size={18}
                  className="text-slate-500"
                />

                <p className="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Previous Expiry
                </p>

                <p className="mt-1 text-xs sm:text-sm font-black text-slate-800">
                  {formatDate(
                    subscription.endDate
                  )}
                </p>

              </div>

            </div>


            {/* DELIVERY */}

            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">

                <Clock3
                  size={19}
                  className="text-green-600"
                />

              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Delivery Time
                </p>

                <p className="mt-1 text-sm font-black text-slate-800">
                  {subscription.deliveryTime || "Morning"}
                </p>

              </div>

            </div>


            {/* ADDRESS */}

            {subscription.address && (
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">

                  <MapPin
                    size={18}
                    className="text-green-600"
                  />

                </div>

                <div className="min-w-0">

                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                    Delivery Address
                  </p>

                  <p className="mt-1 text-sm font-bold leading-5 text-slate-700 break-words">

                    {[
                      subscription.address.house_no,
                      subscription.address.street,
                      subscription.address.area,
                      subscription.address.city,
                      subscription.address.state,
                      subscription.address.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}

                  </p>

                </div>

              </div>
            )}


            {/* AMOUNT */}

            <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 to-emerald-600 p-5 text-white shadow-lg">

              <div className="flex items-end justify-between gap-3">

                <div>

                  <p className="text-[10px] font-black uppercase tracking-widest text-green-100">
                    Renewal Amount
                  </p>

                  <p className="mt-1 text-3xl sm:text-4xl font-black">
                    {formatMoney(
                      subscription.amount
                    )}
                  </p>

                </div>

                <Milk
                  size={32}
                  className="mb-1 opacity-80"
                />

              </div>

            </div>


            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">

                <div className="flex items-start gap-3">

                  <XCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <p className="text-sm font-bold leading-5 text-red-700">
                    {error}
                  </p>

                </div>

              </div>
            )}
            {showPaymentOptions && (
  <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
    <h3 className="text-lg font-black text-green-900">
      Choose Payment Method
    </h3>

    <p className="mt-1 text-sm text-slate-600">
      Renewal Amount: {formatMoney(subscription.amount)}
    </p>

    <div className="mt-4 space-y-3">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-4">
        <input
          type="radio"
          name="paymentMethod"
          value="ONLINE"
          checked={paymentMethod === "ONLINE"}
          onChange={() => setPaymentMethod("ONLINE")}
        />
        <div>
          <p className="font-bold text-slate-800">
            UPI / Online Payment
          </p>
          <p className="text-xs text-slate-500">
            Pay securely through Razorpay
          </p>
        </div>
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-4">
        <input
          type="radio"
          name="paymentMethod"
          value="COD"
          checked={paymentMethod === "COD"}
          onChange={() => setPaymentMethod("COD")}
        />
        <div>
          <p className="font-bold text-slate-800">
            Cash on Delivery
          </p>
          <p className="text-xs text-slate-500">
            Pay according to the COD collection process
          </p>
        </div>
      </label>
    </div>

    <button
      type="button"
      onClick={handleConfirmRenewal}
      className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 font-black text-white"
    >
      Continue with {paymentMethod === "ONLINE" ? "Online Payment" : "COD"}
    </button>
  </div>
)}


            {/* RENEW BUTTON */}

            <button
              type="button"
              onClick={handleRenew}
              disabled={renewing}
              className="
                mt-5
                flex
                min-h-[56px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-gradient-to-r
                from-green-600
                to-emerald-500
                px-5
                py-4
                text-base
                font-black
                text-white
                shadow-lg
                shadow-green-200
                transition-all
                duration-200
                active:scale-[0.97]
                hover:from-green-700
                hover:to-emerald-600
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {renewing ? (
                <>
                  <RefreshCw
                    size={21}
                    className="animate-spin"
                  />

                  <span>
                    Renewing...
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={21} />

                  <span>
                    Renew Subscription
                  </span>
                </>
              )}

            </button>


            {/* SECURITY */}

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">

              <ShieldCheck
                size={16}
                className="text-green-600"
              />

              Secure FarmFreshDairy renewal

            </div>

          </div>

        </div>


        {/* FOOTER */}

        <div className="px-4 pb-5 pt-5 text-center">

          <p className="text-xs font-bold text-slate-400">
            Fresh daily milk delivered to your doorstep 🥛
          </p>

          <p className="mt-1 text-[10px] font-semibold text-slate-300">
            FarmFreshDairy
          </p>

        </div>

      </div>


      {/* ====================================================
          ANIMATIONS
      ==================================================== */}

      <style>{`

        @keyframes logoFloat {

          0%, 100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-6px);
          }

        }

        @keyframes logoPulse {

          0%, 100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.05);
          }

        }

        @keyframes slideUp {

          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }

        .animate-logoFloat {
          animation: logoFloat 3s ease-in-out infinite;
        }

        .animate-logoPulse {
          animation: logoPulse 2.5s ease-in-out infinite;
        }

        .animate-slideUp {
          animation: slideUp .45s ease-out;
        }

      `}</style>

    </div>
  );
}