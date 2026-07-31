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

      setLoading(true);

      const orderResponse = await createPaymentOrder(amount);

      console.log("Order:", orderResponse);

      const payment = await openRazorpayCheckout({
        order: orderResponse.order,
        customer,
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      });

      console.log("Payment:", payment);

      const verify = await verifyPayment(payment);

      if (!verify.success) {
        throw new Error("Payment verification failed");
      }

      onContinue({
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentId: payment.razorpay_payment_id,
        orderId: payment.razorpay_order_id,
        signature: payment.razorpay_signature,
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
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