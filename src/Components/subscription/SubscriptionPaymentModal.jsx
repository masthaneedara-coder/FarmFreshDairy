
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
  checkoutPayload,
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

  // COD is available during the last three days of the month
  // and the first three days.
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
      // Keep the existing COD behavior unchanged.
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

      // Validate customer and checkout details for online payment.
     
      if (!customer?.id) {
        throw new Error(
          "Customer information is missing. Please sign in again."
        );
      }

      if (
        !checkoutPayload?.product_id ||
        !checkoutPayload?.address_id ||
        !checkoutPayload?.start_date
      ) {
        throw new Error(
          "Customer ID and checkout details are required."
        );
      }

      setLoading(true);

      // 1. Create an order without creating a subscription.
      const orderResponse = await createPaymentOrder({
        customer_id: customer.id,
        checkout_payload: checkoutPayload,
      });

      const order =
        orderResponse?.order ??
        orderResponse?.data?.order;

      if (!order?.id) {
        throw new Error("Unable to create Razorpay order.");
      }

      // 2. Open Razorpay checkout.
      const payment = await openRazorpayCheckout({
        order,
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

      // 3. Verify using the new order-based flow.
      const verify = await verifyPayment({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
        customer_id: customer.id,
      });

      if (!verify?.success) {
        throw new Error(
          verify?.message ||
            "Payment verification failed. Check payment status before retrying."
        );
      }

      // 4. Continue only after backend verification.
      await onContinue({
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentId: payment.razorpay_payment_id,
        orderId: payment.razorpay_order_id,
        subscriptionId:
          verify?.subscription?.id ??
          verify?.data?.subscription?.id ??
          null,
        payment: verify.payment ?? null,
      });

   } catch (error) {
  console.error("Subscription payment error:", error);

  const message = error?.message || "";

  if (
    message.toLowerCase().includes("cancelled by customer")
  ) {
    // Cancellation is not a successful payment.
    // Do not call onContinue or create a subscription.
    return;
  }

  alert(message || "Payment failed. Please try again.");
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
                <h3 className="text-lg font-bold">
                  Cash on Delivery
                </h3>

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
              Cash on Delivery is available only during the last
              3 days of the month and the first 3 days. Please
              choose Online Payment.
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
                <h3 className="text-lg font-bold">
                  Online Payment
                </h3>

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
