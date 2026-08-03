import { useLocation } from "react-router-dom";
import { createSubscription } from "../config/api";
import { useNavigate } from "react-router-dom";
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
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold">
          No subscription data found.
        </h2>
      </div>
    );
  }

  return (
   <div className="min-h-screen bg-slate-50">

  <div className="max-w-5xl mx-auto p-8">

    <h1 className="text-4xl font-black text-green-700 mb-8">
      Review Subscription
    </h1>

    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

      <div className="p-8">

        <div className="flex flex-col lg:flex-row gap-8">

          <img
            src={state.product.image}
            alt={state.product.name}
            className="w-56 h-56 rounded-2xl object-cover"
          />

          <div className="flex-1">

            <h2 className="text-3xl font-bold">
              {state.product.name}
            </h2>

            <div className="grid md:grid-cols-2 gap-5 mt-8">

              <Info
                label="Product Size"
                value={state.form.size}
              />

              <Info
                label="Quantity"
                value={state.form.quantity}
              />

              <Info
                label="Delivery Time"
                value={state.form.deliveryTime}
              />

              <Info
                label="Frequency"
                value={state.form.frequency}
              />

              <Info
                label="Start Date"
                value={state.form.startDate}
              />
              <Info
                    label="Delivery Address"
                    value={
                        state.addresses
                        ?.find(a => a.id === state.form.addressId)
                        ? [
                            state.addresses.find(a => a.id === state.form.addressId).house_no,
                            state.addresses.find(a => a.id === state.form.addressId).street,
                            state.addresses.find(a => a.id === state.form.addressId).area,
                            state.addresses.find(a => a.id === state.form.addressId).city,
                            ]
                            .filter(Boolean)
                            .join(", ")
                        : "Not Selected"
                    }
                    />

            </div>
            <div className="flex gap-4 mt-10">

                <button
                    onClick={() => navigate(-1)}
                    className="flex-1 rounded-xl border-2 border-gray-300 py-4 font-bold hover:bg-gray-100"
                >
                    ← Back
                </button>

                <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white py-4 font-bold disabled:bg-gray-400"
                >
                    {loading ? "Activating..." : "Activate Subscription"}
                </button>

                </div>

          </div>

        </div>

        <div className="mt-8 rounded-2xl bg-green-50 border border-green-200 p-6">

          <h3 className="text-lg font-bold text-green-700">
            Monthly Amount
          </h3>

          <h2 className="text-5xl font-black mt-3">
           ₹{state.monthlyAmount}
          </h2>

        </div>

      </div>

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

function Info({ label, value }) {
  return (
    <div className="rounded-xl border p-4">

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <h3 className="text-xl font-bold mt-2">
        {value}
      </h3>

    </div>
  );
}
