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
} from "lucide-react";

import {
  getRenewalLinkDetails,
  renewSubscriptionUsingLink,
} from "../config/api";

export default function RenewSubscription() {
  const { token } = useParams();

  const [subscription, setSubscription] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [renewing, setRenewing] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadSubscription();
  }, [token]);

  async function loadSubscription() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getRenewalLinkDetails(token);

      setSubscription(
        data?.subscription || null
      );

    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "This renewal link is invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRenew() {
    try {
      setRenewing(true);
      setError("");

      const result =
        await renewSubscriptionUsingLink(
          token
        );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Renewal failed."
        );
      }

      setSuccess(true);

    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to renew subscription."
      );
    } finally {
      setRenewing(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <div className="text-center animate-pulse">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
            <RefreshCw
              className="animate-spin text-green-600"
              size={30}
            />
          </div>

          <p className="font-black text-green-800">
            Loading your subscription...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl border border-red-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle
              size={34}
              className="text-red-600"
            />
          </div>

          <h1 className="text-xl font-black text-slate-900">
            Renewal Link Unavailable
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-xl border border-green-100 animate-[fadeIn_.4s_ease-out]">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-bounce">
            <CheckCircle2
              size={42}
              className="text-green-600"
            />
          </div>

          <h1 className="text-2xl font-black text-green-800">
            Subscription Renewed!
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Your FarmFreshDairy subscription
            has been successfully renewed.
          </p>

          <div className="mt-6 rounded-2xl bg-green-50 p-4">
            <p className="text-xs font-black uppercase text-green-600">
              Milk Delivery
            </p>

            <p className="mt-1 text-lg font-black text-green-800">
              Your delivery will continue.
            </p>
          </div>

          <p className="mt-5 text-xs font-semibold text-slate-400">
            Thank you for choosing
            FarmFreshDairy 🥛
          </p>
        </div>
      </div>
    );
  }

  const product =
  subscription?.product || "Milk";

const size =
  subscription?.size || "";

const quantity =
  subscription?.quantity || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-lg">

        {/* HEADER */}

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
            <Milk
              size={32}
              className="text-green-600"
            />
          </div>

          <h1 className="text-2xl font-black text-green-800">
            FarmFreshDairy
          </h1>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Subscription Renewal
          </p>
        </div>

        {/* CUSTOMER */}

        <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-lg animate-[slideUp_.4s_ease-out]">

          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Welcome back
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            {subscription.customerName}
            {subscription.startDate}
            {subscription.endDate}
            {subscription.deliveryTime}
            {subscription.amount}
          </h2>

          {/* PRODUCT */}

          <div className="mt-5 rounded-2xl bg-green-50 p-4">
            <div className="flex items-center justify-between gap-3">

              <div>
                <p className="text-xs font-black uppercase text-green-600">
                  Subscription
                </p>

                <p className="mt-1 text-lg font-black text-green-900">
                  {product}
                </p>

                <p className="mt-1 text-sm font-bold text-slate-600">
                  {size}
                {size && " • "}
                Qty {quantity}
                </p>
              </div>

              <Milk
                size={34}
                className="text-green-600"
              />
            </div>
          </div>

          {/* DATES */}

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <CalendarDays
                size={18}
                className="text-slate-500"
              />

              <p className="mt-2 text-[10px] font-black uppercase text-slate-400">
                Previous Start
              </p>

              <p className="mt-1 text-sm font-black text-slate-800">
                {formatDate(
                  subscription.startDate
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <CalendarDays
                size={18}
                className="text-slate-500"
              />

              <p className="mt-2 text-[10px] font-black uppercase text-slate-400">
                Previous Expiry
              </p>

              <p className="mt-1 text-sm font-black text-slate-800">
                {formatDate(
                  subscription.endDate
                )}
              </p>
            </div>

          </div>

          {/* DELIVERY */}

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <Clock3
              size={19}
              className="text-green-600"
            />

            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">
                Delivery
              </p>

              <p className="text-sm font-black text-slate-800">
                {subscription.deliveryTime}
              </p>
            </div>
          </div>

          {/* AMOUNT */}

          <div className="mt-5 rounded-2xl bg-green-700 p-5 text-white shadow-lg">
            <p className="text-xs font-black uppercase text-green-100">
              Renewal Amount
            </p>

            <p className="mt-1 text-3xl font-black">
              {formatMoney(
                subscription.amount
              )}
            </p>
          </div>

          {/* RENEW */}

          <button
            type="button"
            onClick={handleRenew}
            disabled={renewing}
            className="
              mt-5
              w-full
              rounded-2xl
              bg-green-600
              px-5
              py-4
              text-base
              font-black
              text-white
              shadow-lg
              transition
              hover:bg-green-700
              active:scale-[0.98]
              disabled:opacity-60
            "
          >
            {renewing ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw
                  size={20}
                  className="animate-spin"
                />
                Renewing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 size={20} />
                Renew Subscription
              </span>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
            <ShieldCheck
              size={16}
              className="text-green-600"
            />
            Secure FarmFreshDairy renewal
          </div>

        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}