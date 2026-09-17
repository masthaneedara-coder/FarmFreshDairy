 import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCart,
  placeOrder,
  createPaymentOrder,
  verifyPayment,
} from "../config/api";
import {
  getCustomerName,
  getCustomerPhone,
} from "../config/auth";

import { useAuthSession } from "../context/AuthSessionContext";
import { PAYMENT_METHODS } from "../config/appConfig";
import { useNotifications } from "../context/NotificationContext";
import { createOrder } from "../services/orderService";
import {
  fetchCustomerAddresses,createAddress,
} from "../config/api";
import AddressForm from "../Components/AddressForm";
import { clearCart } from "../config/cart";


export default function Checkout() {
  const navigate = useNavigate();
  const { customer } = useAuthSession();

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.COD);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

const [selectedAddress, setSelectedAddress] =
  useState(null);
  

  useEffect(() => {
  if (!customer) {
    navigate("/auth");
    return;
  }

 const loadCart = async () => {
  try {
    console.log("1. Customer:", customer);

    const customerId = customer.id;
    console.log("2. Customer ID:", customerId);

    const res = await fetchCart(customerId);
    console.log("Checkout API Response:", res);
console.log("Cart Length:", res?.cart?.length);
    console.log("3. API Response:", res);

    const cartItems = res.cart || [];
    console.log("4. Cart Items:", cartItems);

    setCart(cartItems);

    if (cartItems.length === 0) {
      console.log("5. Cart is empty");
      navigate("/cart");
    }
  } catch (err) {
    console.error("Checkout Error:", err);
  }
};
  loadCart();
  loadAddresses();

  setCustomerName(getCustomerName());
  setPhone(getCustomerPhone());

}, [navigate, customer]);

  const subtotal = useMemo(() => {
  return cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || item.products?.price || 0) *
        Number(item.quantity || 0),
      0
    );
  }, [cart]);

    const gst = useMemo(() => {
      return paymentMethod === PAYMENT_METHODS.ONLINE
        ? +(subtotal * 0.02).toFixed(2)
        : 0;
    }, [subtotal, paymentMethod]);

    const total = useMemo(() => {
      return +(subtotal + gst).toFixed(2);
    }, [subtotal, gst]);
    const totalItems = useMemo(() => {
  return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}, [cart]);

    const openRazorpay = async () => {
      try {
        if (!window.Razorpay) {
          throw new Error(
            "Razorpay Checkout is not loaded. Please refresh the page and try again."
          );
        }

        const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

        if (!key) {
          throw new Error(
            "Razorpay Key ID is missing. Please check VITE_RAZORPAY_KEY_ID."
          );
        }

        setLoading(true);

        // Razorpay requires a server-created order_id for Standard Checkout.
        const orderResponse = await createPaymentOrder(total);
        const razorpayOrder = orderResponse?.order;

        if (!razorpayOrder?.id) {
          throw new Error(
            "Unable to create Razorpay order. Please try again."
          );
        }

        const options = {
          key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || "INR",
          name: "Farm Fresh Dairy",
          description: "Milk & Grocery Order",
          image: "/logo.png",
          order_id: razorpayOrder.id,
          prefill: {
            name: customerName,
            contact: phone,
            email: customer?.email || "",
          },
          theme: {
            color: "#16a34a",
          },
          handler: async function (response) {
            try {
              console.log("Razorpay success:", response);

              const verification = await verifyPayment(response);

              if (!verification?.success) {
                throw new Error("Payment verification failed.");
              }

              await handlePlaceOrder(response.razorpay_payment_id);
            } catch (error) {
              console.error("Razorpay verification error:", error);
              setLoading(false);
              alert(error.message || "Payment verification failed.");
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const razor = new window.Razorpay(options);

        razor.on("payment.failed", function (response) {
          console.error("Razorpay payment failed:", response.error);
          setLoading(false);
          alert(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        });

        razor.open();
      } catch (error) {
        console.error("Razorpay checkout error:", error);
        setLoading(false);
        alert(error.message || "Unable to open Razorpay.");
      }
    };
async function loadAddresses() {
  try {
    const customer = JSON.parse(
      localStorage.getItem("customer")
    );

    if (!customer?.id) return;

    const res = await fetchCustomerAddresses(customer.id);

    const list = res.addresses || [];

    setAddresses(list);

    // Auto-select the default address
    setSelectedAddress((current) => {
      if (current) {
        const updated = list.find(a => a.id === current.id);
        if (updated) return updated;
      }

      return (
        list.find(a => a.is_default) ||
        list[0] ||
        null
      );
    });

    

  } catch (err) {
    console.error("Failed to load addresses:", err);
  }
}
async function handleSaveAddress(addressData) {
  try {
    const res = await createAddress(addressData);

    await loadAddresses();

    // Automatically select the newly created address
    if (res?.address) {
      setSelectedAddress(res.address);
    }

    setShowAddressForm(false);

  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to save address.");
  }
}
  const handlePlaceOrder = async (paymentId = "") => {
    if (!customerName || !phone) {
  alert("Please fill customer name and phone.");
  return;
}

if (!selectedAddress) {
  alert("Please select a delivery address.");
  return;
}
    if (typeof paymentId !== "string") {
    paymentId = "";
    }

    if (!cart.length) {
      alert("Cart is empty");
      return;
    }
    if (paymentMethod === PAYMENT_METHODS.ONLINE && !paymentId) {
        setLoading(false);
        openRazorpay();
        return;
      }

    try {
      setLoading(true);
     
      const customerId = customer.id;

        const payload = {
         order: {
            customer_id: customerId,

            address_id: selectedAddress.id,

            customer_name: customerName,
            phone,

            payment_method: paymentMethod,
            payment_status:
              paymentMethod === PAYMENT_METHODS.ONLINE
                ? "Paid"
                : "Pending",

            status: "Pending",

            subtotal,
            delivery_charge: 0,
            discount: 0,
            total_amount: total,
            notes: "",
        },
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price:
              item.price * item.quantity,
            size: item.size,
          })),
        };

      const result = await createOrder(payload);

      if (result.success) {
        if (paymentMethod === PAYMENT_METHODS.WHATSAPP) {
          const itemsText = cart
            .map(
              (item) =>
                `${item.products?.name} (${item.size}) x ${item.quantity}`
            )
            .join("%0A");

          const msg =
            `Hello Farm Fresh Dairy,%0A%0A` +
            `New Order Request%0A` +
            `Name: ${customerName}%0A` +
            `Phone: ${phone}%0A` +
            `Address: ${address}%0A` +
            `Area: ${area}%0A%0A` +
            `Items:%0A${itemsText}%0A%0A` +
            `Total: ₹${total}%0A` +
            `Payment: WhatsApp`;

          // Replace with your business number
          const whatsappNumber = "91XXXXXXXXXX";
          window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");          
        }
        await addNotification({
          title: "Order Confirmed",
          message: "Your order has been placed successfully.",
          type: "order",
          priority: "high",
        });
         clearCart();

    // Clear local state
         setCart([]);


       
        alert("Order placed successfully");
        navigate("/order-history");
      } else {
        alert(result.message || "Order failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while placing order");
    } finally {
      setLoading(false);
    }
  };
  
console.log("Checkout Cart:", cart);
  return (
    <div className="checkout-page min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_8%_4%,rgba(16,185,129,.16),transparent_24%),radial-gradient(circle_at_92%_18%,rgba(132,204,22,.13),transparent_22%),linear-gradient(180deg,#effdf6_0%,#ffffff_46%,#ecfdf5_100%)] px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-7 sm:pb-10 lg:px-8 lg:pb-8">
          <style>{`
            @keyframes checkoutFadeUp {
              from { opacity: 0; transform: translateY(18px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes checkoutFloat {
              0%, 100% { transform: translate3d(0,0,0); }
              50% { transform: translate3d(8px,-8px,0); }
            }
            @keyframes checkoutShine {
              from { transform: translateX(-130%); }
              to { transform: translateX(260%); }
            }
            .checkout-enter {
              animation: checkoutFadeUp .55s cubic-bezier(.2,.8,.2,1) both;
            }
            .checkout-delay-1 { animation-delay: .08s; }
            .checkout-delay-2 { animation-delay: .16s; }
            .checkout-delay-3 { animation-delay: .24s; }
            .checkout-card {
              transition: transform .28s ease, box-shadow .28s ease, border-color .28s ease;
            }
            .checkout-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 22px 55px rgba(5,150,105,.10);
              border-color: rgba(16,185,129,.28);
            }
            @media (prefers-reduced-motion: reduce) {
              .checkout-enter,
              .checkout-card,
              .checkout-page [class*="animate-"] {
                animation: none !important;
                transition: none !important;
              }
            }
          `}</style>
      <div className="mx-auto w-full max-w-7xl">

        {/* ================================
            HERO / PROGRESS
        ================================= */}
        <div className="checkout-enter relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#10b981] text-white shadow-[0_18px_55px_rgba(4,120,87,.20)] mb-4 sm:mb-7 sm:rounded-[2rem]">
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-lime-200/15 blur-3xl animate-[checkoutFloat_7s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -bottom-24 left-0 h-60 w-60 rounded-full bg-white/10 blur-3xl animate-[checkoutFloat_8s_ease-in-out_infinite_reverse]" />

          <div className="relative p-4 sm:p-7 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-green-100">
                  Farm Fresh Dairy
                </p>
                <h1 className="mt-1 text-[2rem] leading-none font-black tracking-tight sm:text-4xl md:text-5xl">
                  Checkout
                </h1>
                <p className="mt-2 max-w-md text-[13px] leading-5 text-green-50 sm:text-base">
                  Almost there — complete your order.
                </p>
              </div>

              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-3xl shadow-inner">
                🥛
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1.5 sm:gap-3">
              {[
                ["1", "Cart"],
                ["2", "Address"],
                ["3", "Payment"],
                ["4", "Confirm"],
              ].map(([number, label], index) => (
                <div key={label} className="flex items-center flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black shadow-lg sm:h-9 sm:w-9 sm:text-xs ${
                        index < 2
                          ? "bg-white text-green-700"
                          : "bg-white/20 text-white ring-1 ring-white/30"
                      }`}
                    >
                      {index < 2 ? "✓" : number}
                    </span>
                    <span className="hidden sm:block text-xs font-bold truncate">
                      {label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className="mx-2 sm:mx-3 h-px flex-1 bg-white/25" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-7">

          {/* ================================
              LEFT: DETAILS
          ================================= */}
          <div className="space-y-4 sm:space-y-5">

            {/* Customer details */}
            <section className="checkout-enter checkout-delay-1 checkout-card rounded-[1.5rem] bg-white/95 backdrop-blur border border-green-100 shadow-[0_12px_40px_rgba(16,185,129,0.10)] p-4 sm:rounded-[1.75rem] sm:p-7">
              <div className="flex items-start gap-3 mb-4 sm:mb-5">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-emerald-100 flex items-center justify-center text-lg sm:h-11 sm:w-11 sm:text-xl">
                  👤
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 sm:text-2xl">
                    Customer Details
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Confirm your contact information.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">
                    Customer Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">👤</span>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-[15px] font-semibold text-slate-800 outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100 sm:text-base"
                      placeholder="Enter customer name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">📱</span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-[15px] font-semibold text-slate-800 outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100 sm:text-base"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">
                    Area
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">📍</span>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-[15px] font-semibold text-slate-800 outline-none transition focus:border-green-400 focus:bg-white focus:ring-4 focus:ring-green-100 sm:text-base"
                      placeholder="Enter area"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="checkout-enter checkout-delay-1 checkout-card rounded-[1.5rem] bg-white/95 backdrop-blur border border-green-100 shadow-[0_12px_40px_rgba(16,185,129,0.10)] p-4 sm:rounded-[1.75rem] sm:p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-2xl bg-emerald-100 flex items-center justify-center text-xl">
                    📍
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 sm:text-2xl">
                      Delivery Address
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Select where your order should arrive.
                    </p>
                  </div>
                </div>

                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="shrink-0 rounded-xl bg-green-50 px-3 py-2 text-xs sm:text-sm font-black text-green-700 transition hover:bg-green-100 active:scale-95"
                  >
                    + Add
                  </button>
                )}
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-green-200 bg-green-50/60 text-center px-5 py-10">
                  <div className="text-4xl mb-3">🏠</div>
                  <p className="font-bold text-slate-700">
                    No saved addresses found
                  </p>
                  <p className="text-sm text-slate-500 mt-1 mb-5">
                    Add an address to continue your order.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-700 active:scale-95"
                  >
                    + Add New Address
                  </button>
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {addresses.map((address) => {
                    const selected = selectedAddress?.id === address.id;

                    return (
                      <button
                        type="button"
                        key={address.id}
                        onClick={() => setSelectedAddress(address)}
                        className={`group relative text-left rounded-2xl border-2 p-4 transition-all duration-200 active:scale-[0.98] ${
                          selected
                            ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100"
                            : "border-slate-200 bg-white hover:border-green-300 hover:shadow-md"
                        }`}
                      >
                        {selected && (
                          <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white text-sm font-black shadow-md">
                            ✓
                          </span>
                        )}

                        <div className="flex items-center gap-2 pr-8">
                          <span className="text-lg">🏠</span>
                          <h4 className="font-black text-slate-800">
                            {address.house_no}
                          </h4>
                          {address.is_default && (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-green-700">
                              Default
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 mt-3">
                          {address.street}
                        </p>
                        <p className="text-sm text-slate-600">
                          {address.area}, {address.city}
                        </p>
                        <p className="text-sm font-semibold text-slate-500 mt-1">
                          {address.state} — {address.pincode}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Payment */}
            <section className="checkout-enter checkout-delay-1 checkout-card rounded-[1.5rem] bg-white/95 backdrop-blur border border-green-100 shadow-[0_12px_40px_rgba(16,185,129,0.10)] p-4 sm:rounded-[1.75rem] sm:p-7">
              <div className="flex items-start gap-3 mb-4 sm:mb-5">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-blue-100 flex items-center justify-center text-xl">
                  💳
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 sm:text-2xl">
                    Payment Method
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Choose how you want to pay.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    id: PAYMENT_METHODS.COD,
                    icon: "💵",
                    title: "Cash on Delivery",
                    subtitle: "Pay when delivered",
                  },
                  {
                    id: PAYMENT_METHODS.ONLINE,
                    icon: "💳",
                    title: "Online Payment",
                    subtitle: "Secure Razorpay",
                  },
                  {
                    id: PAYMENT_METHODS.WHATSAPP,
                    icon: "💬",
                    title: "WhatsApp Order",
                    subtitle: "Confirm on WhatsApp",
                  },
                ].map((method) => {
                  const selected = paymentMethod === method.id;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`relative text-left rounded-2xl border-2 p-4 transition-all duration-200 active:scale-[0.98] ${
                        selected
                          ? "border-green-500 bg-green-50 shadow-lg shadow-green-100"
                          : "border-slate-200 bg-white hover:border-green-300 hover:shadow-md"
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-3 right-3 h-6 w-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black">
                          ✓
                        </span>
                      )}
                      <div className="text-2xl mb-3">{method.icon}</div>
                      <p className="font-black text-slate-800 pr-5">
                        {method.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {method.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === PAYMENT_METHODS.ONLINE && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                  <span className="text-xl">🔐</span>
                  <div>
                    <p className="font-black">Secure Online Payment</p>
                    <p className="text-xs mt-0.5">
                      You will be redirected to Razorpay to complete payment.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === PAYMENT_METHODS.WHATSAPP && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <span className="text-xl">💬</span>
                  <div>
                    <p className="font-black">WhatsApp Confirmation</p>
                    <p className="text-xs mt-0.5">
                      Your order details will be prepared for WhatsApp.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ================================
              RIGHT: SUMMARY
          ================================= */}
          <aside className="order-first h-fit lg:order-none lg:sticky lg:top-5">
            <section className="checkout-enter checkout-delay-3 checkout-card overflow-hidden rounded-[1.5rem] bg-white/95 border border-green-100 shadow-[0_16px_50px_rgba(16,185,129,0.14)] sm:rounded-[1.75rem]">

              <div className="relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-4 text-white sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                      Your Basket
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-black mt-1">
                      Order Summary
                    </h2>
                  </div>
                  <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center text-xl">
                    🛒
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-5">
                <div className="space-y-2.5 max-h-[330px] overflow-y-auto pr-1 sm:max-h-[390px] sm:space-y-3">
                  {cart.map((item, index) => {
                    const itemPrice = Number(
                      item.price || item.products?.price || 0
                    );
                    const itemTotal =
                      itemPrice * Number(item.quantity || 0);

                    return (
                      <div
                        key={item.id || index}
                        className="group rounded-2xl border border-slate-100 bg-slate-50 p-2.5 transition duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50/50 sm:p-3"
                      >
                        <div className="flex gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={item.products?.image}
                              alt={item.products?.name || "Product"}
                              className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200 transition duration-300 group-hover:scale-105 sm:h-16 sm:w-16"
                            />
                            <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-black text-white shadow">
                              {item.quantity}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-slate-800 line-clamp-1">
                              {item.products?.name || "Dairy Product"}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {item.size} × {item.quantity}
                            </p>
                            <p className="text-base font-black text-green-700 mt-1">
                              ₹{itemTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="my-5 h-px bg-slate-100" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Items</span>
                    <span className="font-black text-slate-800">
                      {totalItems}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  {paymentMethod === PAYMENT_METHODS.ONLINE && (
                    <div className="flex justify-between text-orange-600">
                      <span>GST (2%)</span>
                      <span className="font-bold">
                        ₹{gst.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-slate-600">Delivery</span>
                    <span className="font-black text-green-600">
                      FREE
                    </span>
                  </div>
                </div>

                <div className="my-5 h-px bg-slate-100" />

                <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                        Total Amount
                      </p>
                      <p className="text-[2rem] font-black text-green-700 mt-1 sm:text-4xl">
                        ₹{total.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-2xl">🥛</span>
                  </div>
                </div>

                {/* Desktop CTA */}
                <button
                  type="button"
                  onClick={() => handlePlaceOrder()}
                  disabled={loading || cart.length === 0}
                  className="hidden lg:flex group relative w-full mt-5 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 py-4 text-base font-black text-white shadow-xl shadow-green-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      🛍️ Place Order
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="w-full mt-3 rounded-2xl bg-slate-100 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]"
                >
                  ← Back to Cart
                </button>

                <p className="text-center text-[11px] text-slate-400 mt-4">
                  🔒 Your order details are securely processed.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* ================================
          MOBILE STICKY CTA
      ================================= */}
      <div className="fixed inset-x-0 bottom-[76px] z-[80] lg:hidden border-t border-emerald-100/80 bg-white/95 backdrop-blur-2xl px-3 pb-2.5 pt-2.5 shadow-[0_-14px_40px_rgba(5,150,105,.13)] sm:bottom-[82px]">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              Total
            </p>
            <p className="text-[1.35rem] leading-none font-black text-green-700 sm:text-xl">
              ₹{total.toFixed(2)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handlePlaceOrder()}
            disabled={loading || cart.length === 0}
            className="min-w-0 flex-[1.45] flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-3.5 text-[13px] font-black text-white shadow-lg shadow-green-200 transition active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:from-slate-400 disabled:to-slate-400 sm:px-5 sm:text-sm"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <span>🛍️ Place Order</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Address modal/form */}
      {showAddressForm && (
        <AddressForm
          customerId={JSON.parse(localStorage.getItem("customer"))?.id}
          onSave={handleSaveAddress}
          onCancel={() => setShowAddressForm(false)}
        />
      )}
    </div>
  );
}
