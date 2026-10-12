
import { useEffect, useState } from "react";

import {
  createPaymentOrder,
  verifyPayment,
} from "../../config/api";

import { openRazorpayCheckout } from "../../utils/razorpay";

console.log("SubscriptionPaymentModal Version 3 Loaded");

export default function SubscriptionPaymentModal({
  open,
  amount,
  customer,
  subscriptionId,
  onClose,
  onContinue,
}) {
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  // Calculate COD availability before using it anywhere
  const today = new Date();
  const day = today.getDate();

  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  const isCODAvailable =
    day >= lastDayOfMonth - 2 || day <= 3;

  // Automatically select Online Payment when COD is unavailable
  useEffect(() => {
    if (!isCODAvailable && paymentMethod === "COD") {
      setPaymentMethod("ONLINE");
    }
  }, [isCODAvailable, paymentMethod]);

  // Keep hooks above this conditional return
  if (!open) return null;

  const handleContinue = async () => {
    try {
      if (loading) return;

      // COD validation
      if (paymentMethod === "COD") {
        if (!isCODAvailable) {
          setPaymentMethod("ONLINE");
          alert(
            "COD is available only from the 29th to the 3rd of each month. Please choose Online Payment."
          );
          return;
        }

        onContinue({
          paymentMethod: "COD",
          paymentStatus: "PENDING",
        });

        return;
      }

      // Validate customer and subscription
      if (!customer?.id) {
        throw new Error("Customer information is missing.");
      }

      // if (!subscriptionId) {
      //   throw new Error("Subscription ID is missing.");
      // }

      setLoading(true);

      // 1. Create Razorpay order
      const orderResponse = await createPaymentOrder({
        amount,
        customer_id: customer.id,
        subscription_id: subscriptionId,
      });

      console.log("Razorpay Order:", orderResponse);

      if (!orderResponse?.success || !orderResponse?.order?.id) {
        throw new Error(
          orderResponse?.message ||
            "Unable to create Razorpay order."
        );
      }
  

      // 2. Open Razorpay checkout
      const payment = await openRazorpayCheckout({
        order: orderResponse.order,
        customer,
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      });

      console.log("Razorpay Payment:", payment);

      // 3. Verify payment on the backend
      const verify = await verifyPayment({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
        customer_id: customer.id,
        //subscription_id: subscriptionId,
      });

      console.log("Payment Verification:", verify);

      if (!verify?.success) {
        throw new Error(
          verify?.message || "Payment verification failed."
        );
      }

      // 4. Continue only after successful verification
      onContinue({
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentId: payment.razorpay_payment_id,
        orderId: payment.razorpay_order_id,
        signature: payment.razorpay_signature,
        wallet: verify.payment?.wallet || null,
        payment: verify.payment?.payment || null,
      });
    } catch (err) {
      console.error("Subscription payment error:", err);

      alert(
        err?.message || "Payment failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="bg-green-600 text-white p-5 rounded-t-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Choose Payment
          </h2>

          <p className="text-green-100 mt-1 text-sm">
            Monthly Subscription
          </p>

          <h1 className="text-4xl font-black mt-2">
            ₹{Number(amount || 0).toLocaleString("en-IN")}
          </h1>
        </div>

        {/* Payment options */}
        <div className="p-5 space-y-4">

          {/* Cash on Delivery */}
          <button
            type="button"
            disabled={!isCODAvailable || loading}
            onClick={() => setPaymentMethod("COD")}
            className={`w-full rounded-2xl border-2 p-4 text-left transition ${
              !isCODAvailable
                ? "border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed"
                : paymentMethod === "COD"
                  ? "border-green-600 bg-green-50"
                  : "border-gray-300"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">💵</div>

              <div className="flex-1">
                <h3 className="font-bold text-lg">
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
              Cash on Delivery is available only from the
              29th to the 3rd of each month. Please choose
              Online Payment.
            </p>
          )}

          {/* Online Payment */}
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
                <h3 className="font-bold text-lg">
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

        {/* Footer */}
        <div className="p-5 border-t flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border font-semibold disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-60"
          >
            {loading ? "Processing..." : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );

}

