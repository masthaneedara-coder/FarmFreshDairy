import { useState } from "react";

import {
  createPaymentOrder,
  verifyPayment,
} from "../../config/api";

import { openRazorpayCheckout } from "../../utils/razorpay";
console.log("SubscriptionPaymentModal Version 2 Loaded");

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
  

  if (!open) return null;
 const handleContinue = async () => { 

  console.log("paymentMethod =", paymentMethod);

  return;
};


  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">

      {/* Modal */}
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
            ₹{amount.toLocaleString()}
          </h1>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* COD */}
          <button
            onClick={() => {console.log("COD Clicked"); setPaymentMethod("COD")}}
            className={`w-full rounded-2xl border-2 p-4 text-left transition ${
              paymentMethod === "COD"
                ? "border-green-600 bg-green-50"
                : "border-gray-300"
            }`}
          >
            <div className="flex items-center gap-4">

              <div className="text-4xl">
                💵
              </div>

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
                checked={paymentMethod === "COD"}
                readOnly
              />

            </div>

          </button>
          

          {/* ONLINE */}
          

          <button
            onClick={() =>{console.log("ONLINE Clicked"); setPaymentMethod("ONLINE")}}
            className={`w-full rounded-2xl border-2 p-4 text-left transition ${
              paymentMethod === "ONLINE"
                ? "border-green-600 bg-green-50"
                : "border-gray-300"
            }`}
          >
            <div className="flex items-center gap-4">

              <div className="text-4xl">
                💳
              </div>

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
                checked={paymentMethod === "ONLINE"}
                readOnly
              />

            </div>

          </button>
          


        </div>
        

        {/* Footer */}
        <div className="p-5 border-t flex gap-3">

          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border font-semibold"
          >
            Cancel
          </button>

        <button
  type="button"
  className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
  disabled={loading}
  onClick={async () => {
  try {
    if (paymentMethod === "COD") {
      onContinue({
        paymentMethod: "COD",
        paymentStatus: "PENDING",
      });
      return;
    }

    if (!customer?.id) {
      throw new Error("Customer information is missing.");
    }

    if (!subscriptionId) {
      throw new Error("Subscription ID is missing.");
    }

    setLoading(true);

    /* ======================================================
       1. Create Razorpay Order
    ====================================================== */

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

    /* ======================================================
       2. Open Razorpay Checkout
    ====================================================== */

    const payment = await openRazorpayCheckout({
      order: orderResponse.order,
      customer,
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    });

    console.log("Razorpay Payment:", payment);

    /* ======================================================
       3. Verify Payment on Backend
    ====================================================== */

    const verify = await verifyPayment({
      razorpay_order_id:
        payment.razorpay_order_id,

      razorpay_payment_id:
        payment.razorpay_payment_id,

      razorpay_signature:
        payment.razorpay_signature,

      customer_id: customer.id,

      subscription_id: subscriptionId,
    });

    console.log("Payment Verification:", verify);

    if (!verify?.success) {
      throw new Error(
        verify?.message ||
        "Payment verification failed."
      );
    }

    /* ======================================================
       4. Payment Successful
    ====================================================== */

    onContinue({
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",

      paymentId:
        payment.razorpay_payment_id,

      orderId:
        payment.razorpay_order_id,

      signature:
        payment.razorpay_signature,

      wallet:
        verify.payment?.wallet || null,

      payment:
        verify.payment?.payment || null,
    });

  } catch (err) {
    console.error(
      "Subscription payment error:",
      err
    );

    alert(
      err?.message ||
      "Payment failed. Please try again."
    );
  } finally {
    setLoading(false);
  }
}}
>
  {loading ? "Processing..." : "Continue →"}
</button>

        </div>

      </div>

    </div>
  );
}