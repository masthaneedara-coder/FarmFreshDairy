import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { addSubscription } from "../config/api";
import { getCustomerName, getCustomerPhone } from "../config/auth";
import {
  getPendingSubscription,
  clearPendingSubscription,
} from "../config/subscription";
import { PAYMENT_METHODS } from "../config/appConfig";
import { useNotifications } from "../context/NotificationContext";
import toast from "react-hot-toast";


export default function SubscriptionCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();

  const [subscriptionData, setSubscriptionData] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.COD);
  const [loading, setLoading] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [offerMessage, setOfferMessage] = useState("");

  useEffect(() => {
    const data = location.state || getPendingSubscription();

    if (!data) {
      navigate("/subscription");
      return;
    }

    setSubscriptionData(data);
    setCustomerName(getCustomerName() || "");
    setPhone(getCustomerPhone() || "");
  }, [location.state, navigate]);

 const subtotal = Number(subscriptionData?.monthlyAmount || 0);
  const discountAmount = Number(discount.toFixed(2));
  const amountAfterDiscount = subtotal - discountAmount;
  const gst = Number((amountAfterDiscount * 0.02).toFixed(2));
  const total = Number((amountAfterDiscount + gst).toFixed(2));
  const applyOffer = () => {
  const code = offerCode.trim().toUpperCase();

    if (code === "WELCOME50") {
      setDiscount(50);
      setOfferMessage("₹50 Discount Applied");
    } else if (code === "MILK10") {
      setDiscount(subtotal * 0.10);
      setOfferMessage("10% Discount Applied");
    } else if (code === "FRESH200") {
      setDiscount(200);
      setOfferMessage("₹200 Discount Applied");
    } else {
      setDiscount(0);
      setOfferMessage("Invalid Offer Code");
    }
  };

  const handleSaveSubscription = async () => {
    if (!subscriptionData) return;

    if (!customerName || !phone || !address) {
      alert("Please fill customer name, phone and address");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerName,
        phone,
        address,
        area,
        paymentMethod,

        product: subscriptionData.product,
        qty: subscriptionData.qty,
        deliveryType: subscriptionData.deliveryType,

        monthlyAmount: total,   // <-- Add this

        subtotal,
        gst,
        totalAmount: total,

        startDate: subscriptionData.startDate,
        expireDate: subscriptionData.expireDate,
      };

     
    if (paymentMethod === PAYMENT_METHODS.ONLINE) {

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,

        amount: Math.round(total * 100),

        currency: "INR",

        name: "Farm Fresh Dairy",

        description: "Milk Subscription",

        prefill: {
          name: customerName,
          contact: phone,
        },

        theme: {
          color: "#16a34a",
        },

        handler: async function (response) {

          payload.paymentStatus = "Paid";
          payload.paymentId = response.razorpay_payment_id;

          const result = await addSubscription(payload);

          if (result.success) {

            addNotification({
              title: "Payment Successful",
              message: "Subscription activated successfully.",
              type: "payment",
            });

            clearPendingSubscription();

            alert("Payment Successful");

            navigate("/dashboard");
          }

        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.open();

      return;
    }

      const result = await addSubscription(payload);

      if (result.success) {
        if (paymentMethod === PAYMENT_METHODS.WHATSAPP) {
          const msg =
            `Hello Farm Fresh Dairy,%0A%0A` +
            `New Subscription Request%0A` +
            `Name: ${customerName}%0A` +
            `Phone: ${phone}%0A` +
            `Address: ${address}%0A` +
            `Area: ${area}%0A%0A` +
            `Product: ${subscriptionData.product}%0A` +
            `Quantity: ${subscriptionData.qty}%0A` +
            `Delivery: ${subscriptionData.deliveryType}%0A` +
            `Monthly Amount: ₹${subscriptionData.subscriptionPrice}%0A` +
            `Start: ${subscriptionData.startDate}%0A` +
            `Expire: ${subscriptionData.expireDate}%0A%0A` +
            `Payment: WhatsApp`;

          const whatsappNumber = "919989663837";
          window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");
          addNotification({
            title: "Subscription Activated",
            message: "Your milk subscription is now active.",
            type: "subscription",
            priority: "high",
            actionUrl: "/dashboard",
          });
        }

        clearPendingSubscription();
        alert("Subscription created successfully");
        navigate("/dashboard");
      } else {
        alert(result.message || "Subscription failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving subscription");
    } finally {
      setLoading(false);
    }
  };
 

  if (!subscriptionData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* TITLE */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-green-700">
            📅 Subscription Checkout
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Complete your milk subscription
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
          {/* LEFT FORM */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-5 sm:p-6">
            <h2 className="text-2xl font-black text-green-700 mb-5">
              Delivery Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-green-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-green-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Area
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full border border-green-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Address
                </label>
                <textarea
                  rows={4}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-green-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>

            {/* PAYMENT */}
            <div className="mt-8">
              <h3 className="text-xl font-black text-green-700 mb-4">
                Payment Method
              </h3>

              <div className="grid sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.COD)}
                  className={`p-4 rounded-2xl border font-bold transition ${
                    paymentMethod === PAYMENT_METHODS.COD
                      ? "bg-green-600 text-white border-green-600 shadow-lg"
                      : "bg-white border-green-200 text-gray-700 hover:bg-green-50"
                  }`}
                >
                  💵 Cash On Delivery
                </button>

                <button
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.ONLINE)}
                  className={`p-4 rounded-2xl border font-bold transition ${
                    paymentMethod === PAYMENT_METHODS.ONLINE
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                      : "bg-white border-green-200 text-gray-700 hover:bg-blue-50"
                  }`}
                >
                  💳 Online
                </button>

                <button
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.WHATSAPP)}
                  className={`p-4 rounded-2xl border font-bold transition ${
                    paymentMethod === PAYMENT_METHODS.WHATSAPP
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg"
                      : "bg-white border-green-200 text-gray-700 hover:bg-emerald-50"
                  }`}
                >
                  💬 WhatsApp
                </button>
              </div>
            </div>
            <div className="mt-8 bg-white rounded-2xl border border-green-200 p-5">

            <h3 className="text-xl font-black text-green-700 mb-4">
              🎁 Offers & Coupons
            </h3>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter Coupon Code"
                value={offerCode}
                onChange={(e) => setOfferCode(e.target.value)}
                className="flex-1 border rounded-xl px-4 py-3"
              />

              <button
                onClick={applyOffer}
                className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl font-bold"
              >
                Apply
              </button>
            </div>

            {offerMessage && (
              <p className="mt-3 text-green-600 font-semibold">
                {offerMessage}
              </p>
            )}

          </div>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="bg-white rounded-3xl shadow-lg p-5 sm:p-6 h-fit sticky top-24">
            <h2 className="text-2xl font-black text-green-700 mb-5">
              Subscription Summary
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-bold mt-1">{subscriptionData.product}</p>
              </div>

              <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-bold mt-1">{subscriptionData.qty}</p>
              </div>

              <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
                <p className="text-sm text-gray-500">Delivery Type</p>
                <p className="font-bold mt-1">{subscriptionData.deliveryType}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-bold mt-1">{subscriptionData.startDate}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Expire Date</p>
                <p className="font-bold mt-1">{subscriptionData.expireDate}</p>
              </div>
            </div>
           <div className="flex justify-between">
              <span>Subscription Amount</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span>- ₹{discountAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>GST (2%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>

            <div className="border-t pt-3 flex justify-between text-2xl font-black text-green-700">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>           

            <button
              onClick={handleSaveSubscription}
              disabled={loading}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-bold disabled:bg-gray-400"
            >
              {loading ? "Saving..." : "Confirm Subscription"}
            </button>

            <button
              onClick={() => navigate("/subscription")}
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold"
            >
              ← Back To Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}