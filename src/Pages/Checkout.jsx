 import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCart,
  placeOrder,
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

    const openRazorpay = () => {
  const options = {
    key: "rzp_live_SryV51ja9BVho8",

    amount: Math.round(total * 100),

    currency: "INR",

    name: "Farm Fresh Dairy",

    description: "Milk & Grocery Order",

    image: "/logo.png",

    handler: function (response) {
      alert("Payment Successful");

      console.log(response);

      handlePlaceOrder(response.razorpay_payment_id);
    },

    theme: {
      color: "#16a34a",
    },
  };

  const razor = new window.Razorpay(options);

  razor.open();
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
    <div className="min-h-screen bg-slate-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* TITLE */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-green-700">
            💳 Checkout
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Complete your dairy order
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
                  placeholder="Enter customer name"
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
                  placeholder="Enter phone number"
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
                  placeholder="Enter area"
                />
              </div>
              <div className="bg-white rounded-2xl border p-5 mb-6">

                  <div className="flex items-center justify-between mb-4">

                    <div>
                      <h3 className="text-lg font-bold">
                        Delivery Address
                      </h3>

                      <p className="text-gray-500 text-sm">
                        Select where you want your order delivered
                      </p>
                    </div>

                  </div>

                  {addresses.length === 0 ? (

                    <div className="text-center py-8">

                      <p className="text-gray-500 mb-4">
                        No saved addresses found.
                      </p>

                      <button
                          type="button"
                          onClick={() => setShowAddressForm(true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                        >
                          + Add Address
                        </button>

                    </div>

                  ) : (

                    <div className="space-y-4">

                      {addresses.map((address) => (

                        <div
                          key={address.id}
                          onClick={() => setSelectedAddress(address)}
                          className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                            selectedAddress?.id === address.id
                              ? "border-green-600 bg-green-50"
                              : "border-gray-200 hover:border-green-400"
                          }`}
                        >

                          <div className="flex justify-between">

                            <h4 className="font-semibold">
                              {address.house_no}
                            </h4>

                            {address.is_default && (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}

                          </div>

                          <p className="text-gray-600 mt-2">
                            {address.street}
                          </p>

                          <p className="text-gray-600">
                            {address.area}, {address.city}
                          </p>

                          <p className="text-gray-600">
                            {address.state} - {address.pincode}
                          </p>

                        </div>

                      ))}

                    </div>

                  )}

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
                  💬 WhatsApp Order
                </button>
              </div>

              {paymentMethod === PAYMENT_METHODS.ONLINE && (
                <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                  Razorpay / online payment integration can be connected here.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="bg-white rounded-3xl shadow-lg p-5 sm:p-6 h-fit sticky top-24">
            <h2 className="text-2xl font-black text-green-700 mb-5">
              Order Summary
            </h2>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-green-50 border border-green-100 p-4"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.products?.image}
                      alt={item.products?.name}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-green-800 line-clamp-1">
                        {item.products?.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.size} × {item.quantity}
                      </p>
                      <p className="text-green-700 font-black mt-1">
                        ₹{Number(item.products?.price || item.price || 0) * Number(item.quantity || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between">
                <span>Items</span>
                <span className="font-semibold">{totalItems}</span>
              </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {paymentMethod === PAYMENT_METHODS.ONLINE && (
                <div className="flex justify-between text-orange-600">
                  <span>GST (2%)</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-green-600">Free</span>
              </div>

              <hr />

              <div className="flex justify-between text-2xl font-black text-green-700">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <hr />              
            </div>

            <button
              onClick={() => handlePlaceOrder()}
              disabled={loading || cart.length === 0}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-bold disabled:bg-gray-400"
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>

            <button
              onClick={() => navigate("/cart")}
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold"
            >
              ← Back To Cart
            </button>
            {showAddressForm && (
              <AddressForm
                customerId={
                  JSON.parse(localStorage.getItem("customer"))?.id
                }
                onSave={handleSaveAddress}
                onCancel={() => setShowAddressForm(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}