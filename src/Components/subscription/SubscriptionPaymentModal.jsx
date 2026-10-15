import { useEffect, useState } from "react";
import {
  createPaymentOrder,
  verifyPayment,
} from "../../config/api";
import { openRazorpayCheckout } from "../../utils/razorpay";

export default function SubscriptionPaymentModal({
  open,
  amount,
  customer,
  subscriptionId,
  onPrepareSubscription,
  onClose,
  onContinue,
}) {
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const day = today.getDate();
  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  // COD is available during the last three days of the month and first three days.
  const isCODAvailable = day >= lastDayOfMonth - 2 || day <= 3;

  useEffect(() => {
    if (!isCODAvailable && paymentMethod === "COD") {
      setPaymentMethod("ONLINE");
    }
  }, [isCODAvailable, paymentMethod]);

  // Reset transient modal state when it is opened.
  useEffect(() => {
    if (open) {
      setPaymentMethod(isCODAvailable ? "COD" : "ONLINE");
      setLoading(false);
    }
  }, [open, isCODAvailable]);

  if (!open) return null;

  const handleContinue = async () => {
    if (loading) return;

    try {
      if (paymentMethod === "COD") {
        if (!isCODAvailable) {
          setPaymentMethod("ONLINE");
          alert(
            "COD is available only during the last 3 days of the month and the first 3 days. Please choose Online Payment."
          );
          return;
        }

        setLoading(true);
        await onContinue({
          paymentMethod: "COD",
          paymentStatus: "PENDING",
        });
        return;
      }

      if (!customer?.id) {
        throw new Error("Customer information is missing. Please sign in again.");
      }

      setLoading(true);

      // Create the subscription first, if it has not been created yet.
      // The parent stores and returns its ID so retries reuse the same subscription.
      let activeSubscriptionId = subscriptionId;

      if (!activeSubscriptionId) {
        if (typeof onPrepareSubscription !== "function") {
          throw new Error(
            "Subscription setup is incomplete. Please refresh the page and try again."
          );
        }

        activeSubscriptionId = await onPrepareSubscription();
      }

      if (!activeSubscriptionId) {
        throw new Error(
          "Unable to obtain the subscription ID. Please try again."
        );
      }

      // 1. Create a Razorpay order linked to the actual subscription.
      const orderResponse = await createPaymentOrder({
        amount: Number(amount),
        customer_id: customer.id,
        subscription_id: activeSubscriptionId,
      });

      console.log("Razorpay Order:", orderResponse);

      if (!orderResponse?.success || !orderResponse?.order?.id) {
        throw new Error(
          orderResponse?.message || "Unable to create Razorpay order."
        );
      }

      // 2. Open Razorpay checkout.
      const payment = await openRazorpayCheckout({
        order: orderResponse.order,
        customer,
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      });

      if (
        !payment?.razorpay_order_id ||
        !payment?.razorpay_payment_id ||
        !payment?.razorpay_signature
      ) {
        throw new Error(
          "Razorpay did not return all required payment details."
        );
      }

      // 3. Verify payment on the backend and update the existing subscription.
      const verify = await verifyPayment({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
        customer_id: customer.id,
        subscription_id: activeSubscriptionId,
      });

      console.log("Payment Verification:", verify);

      if (!verify?.success) {
        throw new Error(
          verify?.message ||
            "Payment verification failed. Do not make another payment until the status is checked."
        );
      }

      // 4. Notify the parent only after backend verification succeeds.
      await onContinue({
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentId: payment.razorpay_payment_id,
        orderId: payment.razorpay_order_id,
        signature: payment.razorpay_signature,
        subscriptionId: activeSubscriptionId,
        payment: verify.payment || null,
      });
    } catch (error) {
      console.error("Subscription payment error:", error);
      alert(error?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-payment-title"
    >
      <div className="w-full animate-slide-up rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="rounded-t-3xl bg-green-600 p-5 text-white">
          <h2
            id="subscription-payment-title"
            className="text-2xl font-bold sm:text-3xl"
          >
            Choose Payment
          </h2>
          <p className="mt-1 text-sm text-green-100">
            Monthly Subscription
          </p>
          <h1 className="mt-2 text-4xl font-black">
            ₹{Number(amount || 0).toLocaleString("en-IN")}
          </h1>
        </div>

        <div className="space-y-4 p-5">
          <button
            type="button"
            disabled={!isCODAvailable || loading}
            onClick={() => setPaymentMethod("COD")}
            className={`w-full rounded-2xl border-2 p-4 text-left transition ${
              !isCODAvailable
                ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60"
                : paymentMethod === "COD"
                  ? "border-green-600 bg-green-50"
                  : "border-gray-300"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">💵</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Cash on Delivery</h3>
                <p className="text-sm text-gray-500">
                  Pay after your milk is delivered.
                </p>
              </div>
              <input
                type="radio"
                name="subscriptionPayment"
                checked={paymentMethod === "COD"}
                readOnly
                tabIndex={-1}
              />
            </div>
          </button>

          {!isCODAvailable && (
            <p className="text-sm text-orange-600">
              Cash on Delivery is available only during the last 3 days of
              the month and the first 3 days. Please choose Online Payment.
            </p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => setPaymentMethod("ONLINE")}
            className={`w-full rounded-2xl border-2 p-4 text-left transition ${
              paymentMethod === "ONLINE"
                ? "border-green-600 bg-green-50"
                : "border-gray-300"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">💳</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">Online Payment</h3>
                <p className="text-sm text-gray-500">
                  UPI • Cards • Net Banking
                </p>
              </div>
              <input
                type="radio"
                name="subscriptionPayment"
                checked={paymentMethod === "ONLINE"}
                readOnly
                tabIndex={-1}
              />
            </div>
          </button>
        </div>

        <div className="flex gap-3 border-t p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border py-3 font-semibold disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading
              ? "Processing..."
              : paymentMethod === "COD"
                ? "Confirm Subscription →"
                : "Pay Securely →"}
          </button>
        </div>
      </div>
    </div>
  );
}
