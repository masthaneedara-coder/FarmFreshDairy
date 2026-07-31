import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCustomerOrders } from "../services/orderService";
import { useAuthSession } from "../context/AuthSessionContext";

export default function OrderHistory() {
  const navigate = useNavigate();
  const { customer } = useAuthSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const orderScrollRef = useRef(null);

    const scrollOrders = (direction = "right") => {
      if (!orderScrollRef.current) return;

      const container = orderScrollRef.current;
      const scrollAmount = window.innerWidth < 640 ? 320 : 420;

      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    };
   

  useEffect(() => {
    const loadOrders = async () => {
      if (!customer) {
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);
        if (!customer?.id) {
          navigate("/auth");
          return;
        }

const data = await getCustomerOrders(customer.id);

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : [];

        setOrders(list);
      } catch (error) {
        console.error(error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [navigate, customer]);

  const totalOrders = useMemo(() => orders.length, [orders]);

  const totalSpent = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + Number(order.totalAmount || order.total || 0),
        0
      ),
    [orders]
  );

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getStatusClasses = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "delivered") {
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    }
    if (s === "pending") {
      return "bg-amber-100 text-amber-700 border border-amber-200";
    }
    if (s === "cancelled") {
      return "bg-red-100 text-red-700 border border-red-200";
    }
    if (s === "confirmed") {
      return "bg-blue-100 text-blue-700 border border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50
px-2 sm:px-4 md:px-6
py-3 sm:py-6">
      <div className="max-w-6xl mx-auto">
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-3xl
bg-gradient-to-r from-green-700 via-emerald-600 to-green-700
p-4 sm:p-6 md:p-8
text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-white/80 text-base">Track your purchases</p>
              <h1 className="text-2xl
              sm:text-4xl
              md:text-5xl
              font-black
              leading-tight">
                📦 Order History
              </h1>
              <p className="mt-2 text-white/90 text-base">
                View all your product orders, payment details and delivery status
              </p>
            </div>

            <div className="
              grid
            grid-cols-2
            gap-2
            sm:gap-4
            w-full
            ">
              <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 w-full">
                <p className="text-white/70 text-xs sm:text-sm">Total Orders</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1">{totalOrders}</h3>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 w-full">
                <p className="text-white/70 text-xs sm:text-sm">Total Spent</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1">
                  {formatMoney(totalSpent)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-green-700">Your Orders</h2>
            <p className="text-gray-500 text-base">
              Latest orders are shown first
            </p>
          </div>

          <div className="
            flex
            flex-col
            sm:flex-row
            gap-3
            w-full
            sm:w-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-3 rounded-2xl bg-white border border-green-200 text-green-700 font-bold shadow-sm hover:shadow transition"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => navigate("/products")}
              className="px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold shadow"
            >
              Shop Products
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center border border-green-100">
            <div className="text-5xl mb-3 animate-bounce">⏳</div>
            <h2 className="text-2xl font-black text-green-700">Loading orders...</h2>
            <p className="text-gray-500 mt-2">Please wait while we fetch your order history</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center border border-green-100">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-black text-gray-700">No orders found</h2>
            <p className="text-gray-500 mt-2">
              You haven’t placed any product orders yet.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold shadow"
            >
              Order Products
            </button>
          </div>
        ) : (
            <div className="space-y-6">
              {/* HORIZONTAL ORDER CARDS */}
              <div className="bg-white rounded-[28px] shadow-lg border border-green-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-4 sm:px-6 py-5 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">Your Orders</h2>
                      <p className="text-sm text-green-50 mt-1">
                        Swipe left or right to view all your orders
                      </p>
                    </div>

                    {orders.length > 1 && (
                      <div className="hidden md:flex items-center gap-3">
                        <button
                          onClick={() => scrollOrders("left")}
                          className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white text-xl font-bold transition"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => scrollOrders("right")}
                          className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white text-xl font-bold transition"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div
                    ref={orderScrollRef}
                    className="
                      flex gap-4 sm:gap-5 overflow-x-auto pb-3
                      snap-x snap-mandatory scroll-smooth
                      [-ms-overflow-style:none] [scrollbar-width:none]
                      [&::-webkit-scrollbar]:hidden
                    "
                  >
                    {orders.map((order, index) => {
                      const itemsArray = String(order.items || "")
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);

                      return (
                        <button
                          key={order.orderId || index}
                          onClick={() => {
                            const element = document.getElementById(
                              `order-details-${order.orderId || index}`
                            );
                            if (element) {
                              element.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }
                          }}
                          className="
                            snap-start shrink-0 text-left
                            w-full sm:w-[360px] lg:w-[390px]
                            rounded-[28px] border border-green-100
                            bg-gradient-to-br from-white to-slate-50
                            p-5 sm:p-5 shadow-md hover:shadow-xl transition-all duration-300
                            hover:-translate-y-1
                          "
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                                Order
                              </p>
                              <h3 className="text-2xl font-black text-green-700 mt-1 break-all">
                                #{order.orderId || index + 1}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {order.date || order.createdAt}
                              </p>
                            </div>

                            <span
                              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold ${getStatusClasses(
                                order.status || "Pending"
                              )}`}
                            >
                              {order.status || "Pending"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-5">
                            <MiniOrderCard
                              label="Amount"
                              value={formatMoney(order.total_amount)}
                              color="green"
                            />
                            <MiniOrderCard
                              label="Items"
                              value={order.order_items?.length || 0}
                              color="blue"
                            />
                            <MiniOrderCard
                              label="Payment"
                              value={order.payment_status}
                              color="yellow"
                            />
                            <MiniOrderCard
                              label="Area"
                              value={order.addresses?.area || order.area || "-"}
                              color="purple"
                            />
                          </div>

                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm text-gray-500 font-medium">Address</p>
                            <p className="text-gray-800 font-semibold mt-1 break-words line-clamp-2">
                              {order.addresses
                                ? [
                                    order.addresses.house_no,
                                    order.addresses.street,
                                    order.addresses.area,
                                    order.addresses.city,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")
                                : order.address || "-"}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              Tap to view full details
                            </p>
                            <span className="text-green-700 font-bold">View ↓</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {orders.length > 1 && (
                    <div className="mt-4 flex flex-col items-center justify-center text-center">
                      <div className="w-full max-w-sm h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full w-24 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-3">
                        Swipe left / right to view all orders
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* FULL ORDER DETAILS */}
              <div className="space-y-5">
                {orders.map((order, index) => {
                  const itemsArray =
                    order.order_items?.map((item) => ({
                      name: item.products?.name || "Product",
                      quantity: item.quantity,
                      price: item.total_price,
                      image: item.products?.image,
                    })) || [];

                  return (
                    <div
                      id={`order-details-${order.orderId || index}`}
                      key={`details-${order.orderId || index}`}
                      className="group bg-white rounded-[28px] shadow-md hover:shadow-2xl p-5 sm:p-6 border border-green-100 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-black text-green-700 break-all">
                               Order #{order.order_number}
                            </h2>

                            <span
                              className={`px-3 py-1.5 rounded-full text-sm font-bold ${getStatusClasses(
                                order.payment_status || "Pending"
                              )}`}
                            >
                              {order.payment_status || "Pending"}
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
                            <MetaCard
                              label="Order Date"
                              value={new Date(order.order_date).toLocaleDateString("en-IN")}
                              color="green"
                            />
                            <MetaCard
                              label="Payment Method"
                              value={order.payment_status || "-"}
                              color="blue"
                            />
                            <MetaCard
                              label="Delivery Area"
                              value={
                                    order.addresses?.area ||
                                    order.area ||
                                    "-"
                                  }
                              color="yellow"
                            />
                            <MetaCard
                              label="Total Amount"
                              value={formatMoney(order.total_amount)}
                              color="purple"
                            />
                          </div>

                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm text-gray-500 font-medium">Delivery Address</p>
                            <p className="text-gray-800 font-semibold mt-1 break-words">
                              {order.addresses
        ? [
            order.addresses.house_no,
            order.addresses.street,
            order.addresses.area,
            order.addresses.city,
          ]
            .filter(Boolean)
            .join(", ")
        : order.address || "-"}
                            </p>
                          </div>
                        </div>
                        

                        <div className="xl:w-[240px] shrink-0">
                          <div className="rounded-3xl bg-gradient-to-br from-green-600 to-emerald-600 text-white p-5 shadow-lg">
                            <p className="text-white/80 text-sm">Order Value</p>
                            <h3 className="text-3xl font-black mt-2">
                              {formatMoney(order.total_amount || order.total || 0)}
                            </h3>
                            <p className="text-sm text-white/80 mt-3">
                              {order.order_items?.length || 0} item{order.order_items?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {order.order_items?.length || 0 > 0 && (
                        <div className="mt-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <h3 className="text-lg sm:text-xl font-black text-gray-800">
                              🧾 Ordered Items
                            </h3>
                            <span className="text-sm text-gray-500">
                              {order.order_items?.length || 0} item{order.order_items?.length || 0}
                            </span>
                          </div>

                          <div className="grid gap-3">
                           {itemsArray.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 rounded-xl border p-3"
                                >
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 rounded-lg object-cover"
                                  />

                                  <div className="flex-1">
                                    <p className="font-bold">{item.name}</p>
                                    <p className="text-sm text-gray-500">
                                      Qty: {item.quantity}
                                    </p>
                                  </div>

                                  <p className="font-bold">
                                    {formatMoney(item.price)}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-500">
                          Need more products? You can place a new order anytime.
                        </p>

                        <div className="
                          flex
                          flex-col
                          sm:flex-row
                          gap-3
                          w-full
                          sm:w-auto">
                          <button
                            onClick={() => navigate("/products")}
                            className="px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold shadow"
                          >
                            Reorder
                          </button>
                          <button
                            onClick={() => navigate("/dashboard")}
                            className="px-5 py-3 rounded-2xl bg-white border border-green-200 text-green-700 font-bold"
                          >
                            Back to Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function MetaCard({ label, value, color = "green" }) {
  const styles = {
    green: "bg-green-50 border-green-100 text-green-800",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[color] || styles.green}`}>
      <p className="text-xs sm:text-sm text-gray-500 font-medium">{label}</p>
      <h3 className="text-base sm:text-lg font-black mt-1 break-words">
        {value}
      </h3>
    </div>
  );
}
function MiniOrderCard({ label, value, color = "green" }) {
  const styles = {
    green: "bg-green-50 border-green-100 text-green-800",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
  };

  return (
    <div className={`rounded-2xl border p-3 ${styles[color] || styles.green}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <h3 className="text-base font-black mt-1 break-words">
        {value}
      </h3>
    </div>
  );
}
