import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCustomerOrders } from "../services/orderService";
import { useAuthSession } from "../context/AuthSessionContext";

const MiniOrderCard = ({ label, value, color = "green" }) => {
  const styles = {
    green: "bg-green-50 border-green-100 text-green-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    yellow: "bg-amber-50 border-amber-100 text-amber-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
  };

  return (
    <div className={`min-w-0 rounded-2xl border p-3 ${styles[color] || styles.green}`}>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-60">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black">
        {value}
      </p>
    </div>
  );
};

const MetaCard = ({ label, value, color = "green" }) => {
  const styles = {
    green: "bg-green-50 border-green-100 text-green-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    yellow: "bg-amber-50 border-amber-100 text-amber-800",
    purple: "bg-purple-50 border-purple-100 text-purple-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[color] || styles.green}`}>
      <p className="text-[10px] font-black uppercase tracking-wide opacity-60">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black">
        {value}
      </p>
    </div>
  );
};

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
    let cancelled = false;

    const loadOrders = async () => {
      // AuthSessionContext can briefly have no customer while restoring the session.
      if (!customer) return;

      if (!customer.id) {
        console.error("OrderHistory: customer ID is missing", customer);
        if (!cancelled) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) setLoading(true);

        console.log(
          "OrderHistory: loading orders for customer:",
          customer.id
        );

        const data = await getCustomerOrders(customer.id);

        if (cancelled) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : [];

        setOrders(Array.isArray(list) ? list.filter(Boolean) : []);
      } catch (error) {
        console.error("OrderHistory: failed to load orders:", error);

        if (!cancelled) {
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [customer]);

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
    <>
      <style>{`
        @keyframes orderHistoryFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orderHistoryFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes orderHistoryShimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes orderHistoryGlow {
          0%, 100% { opacity: .45; }
          50% { opacity: .9; }
        }
      `}</style>
      <div className="min-h-screen animate-[orderHistoryFadeIn_.45s_ease-out] overflow-x-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,.14),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(132,204,22,.10),transparent_25%),linear-gradient(180deg,#f0fdf4_0%,#ffffff_45%,#ecfdf5_100%)] px-3 sm:px-5 lg:px-8 py-4 sm:py-6 pb-10">
      <div className="mx-auto max-w-7xl">

        {/* ================= HERO ================= */}
        <section className="relative isolate overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#16a34a] text-white shadow-[0_24px_70px_rgba(4,120,87,.24)]">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime-300/15 blur-3xl animate-[orderHistoryFloat_5s_ease-in-out_infinite]" />
          <div className="absolute -left-20 -bottom-28 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-[orderHistoryFloat_6s_ease-in-out_infinite_reverse]" />
          <div className="absolute right-[30%] top-1/2 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl animate-[orderHistoryGlow_3s_ease-in-out_infinite]" />

          <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-white/10 blur-2xl animate-[orderHistoryShimmer_7s_ease-in-out_infinite]" />
          <div className="relative p-5 sm:p-7 lg:p-9">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7">

              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-extrabold tracking-wide backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
                  FARM FRESH DAIRY
                </div>

                <h1 className="mt-4 text-[2.65rem] sm:text-5xl lg:text-6xl font-black leading-[.95] tracking-tight">
                  Order
                  <span className="block text-lime-200">History</span>
                </h1>

                <p className="mt-4 max-w-xl text-sm sm:text-base lg:text-lg leading-relaxed text-emerald-50">
                  Everything you ordered, all in one beautiful place.
                  Track status, payments and delivery details instantly.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur">
                    📦 {totalOrders} Orders
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur">
                    🥛 Fresh Dairy
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur">
                    🚚 Doorstep Delivery
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:min-w-[410px]">
                <div className="group rounded-[1.5rem] border border-white/15 bg-white/10 p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 animate-[orderHistoryFadeIn_.55s_ease-out_.08s_both]">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl">
                      📦
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">
                      Orders
                    </span>
                  </div>
                  <p className="mt-5 text-xs text-white/65">Total Orders</p>
                  <p className="mt-1 text-3xl sm:text-4xl font-black">{totalOrders}</p>
                </div>

                <div className="group rounded-[1.5rem] border border-white/15 bg-white/10 p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 animate-[orderHistoryFadeIn_.55s_ease-out_.16s_both]">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl">
                      ₹
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">
                      Spent
                    </span>
                  </div>
                  <p className="mt-5 text-xs text-white/65">Total Spent</p>
                  <p className="mt-1 text-3xl sm:text-4xl font-black">{formatMoney(totalSpent)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-3 bg-white/10">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-lime-300 via-white to-emerald-200 opacity-70" />
          </div>
        </section>

        {/* ================= ACTION BAR ================= */}
        <div className="mt-6 mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100 text-sm">
                ✨
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-green-900">
                Your Orders
              </h2>
            </div>
            <p className="ml-10 mt-1 text-sm text-slate-500">
              Your latest purchases are shown first
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-2xl border border-green-200 bg-white px-4 sm:px-5 py-3 text-sm font-black text-green-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-50 hover:shadow-md active:scale-95 hover:ring-4 hover:ring-green-100"
            >
              ← Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              🛍️ Shop Now
            </button>
          </div>
        </div>

        {/* ================= LOADING ================= */}
        {loading ? (
          <section className="overflow-hidden rounded-[2rem] border border-green-100 bg-white p-6 sm:p-10 shadow-[0_16px_55px_rgba(15,118,110,.10)]">
            <div className="animate-pulse">
              <div className="mx-auto h-16 w-16 rounded-3xl bg-green-100" />
              <div className="mx-auto mt-5 h-7 max-w-xs rounded-xl bg-slate-100" />
              <div className="mx-auto mt-3 h-4 max-w-sm rounded-lg bg-slate-100" />
              <div className="mx-auto mt-7 h-2 max-w-xs overflow-hidden rounded-full bg-green-100">
                <div className="h-full w-1/2 rounded-full bg-green-400 animate-[pulse_1.2s_ease-in-out_infinite]" />
              </div>
            </div>
            <p className="mt-5 text-center text-sm font-semibold text-slate-500">
              Loading your fresh order history...
            </p>
          </section>
        ) : orders.length === 0 ? (
          /* ================= EMPTY ================= */
          <section className="rounded-[2rem] border border-dashed border-green-200 bg-white/90 px-5 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-green-50 text-5xl shadow-inner">
              🛒
            </div>
            <h2 className="mt-6 text-2xl sm:text-3xl font-black text-slate-800">
              Your order history is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm sm:text-base text-slate-500">
              Fresh buffalo milk and dairy products are just a few clicks away.
            </p>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="mt-6 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-green-200 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              🥛 Start Shopping
            </button>
          </section>
        ) : (
          <div className="space-y-6">

            {/* ================= ORDER CAROUSEL ================= */}
            <section className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 shadow-[0_18px_60px_rgba(15,118,110,.10)] animate-[orderHistoryFadeIn_.55s_ease-out_.2s_both]">

              <div className="relative overflow-hidden bg-gradient-to-r from-green-700 via-emerald-600 to-green-600 p-5 sm:p-6 text-white">
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      <h2 className="text-xl sm:text-2xl font-black">Recent Orders</h2>
                    </div>
                    <p className="mt-1 text-sm text-green-50">
                      Swipe on mobile or use the arrows to explore.
                    </p>
                  </div>

                  {orders.length > 1 && (
                    <div className="flex gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => scrollOrders("left")}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-black backdrop-blur transition hover:bg-white/20 active:scale-90"
                        aria-label="Previous orders"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollOrders("right")}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-black backdrop-blur transition hover:bg-white/20 active:scale-90"
                        aria-label="Next orders"
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
                  className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {orders.map((order, index) => {
                    if (!order) return null;

                    const status = order.status || "Pending";
                    const statusLower = String(status).toLowerCase();

                    let icon = "⏳";
                    if (statusLower.includes("deliver")) icon = "✓";
                    else if (statusLower.includes("cancel")) icon = "×";
                    else if (statusLower.includes("confirm")) icon = "✓";
                    else if (statusLower.includes("out")) icon = "🚚";

                    const itemCount =
                      order.order_items?.length ||
                      String(order.items || "")
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean).length ||
                      0;

                    return (
                      <button
                        type="button"
                        key={order.orderId || index}
                        style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}
                        onClick={() => {
                          const element = document.getElementById(
                            `order-details-${order.orderId || index}`
                          );
                          element?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                        className="group relative snap-start shrink-0 w-[292px] sm:w-[345px] lg:w-[370px] overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-2xl active:scale-[.985] animate-[orderHistoryFadeIn_.5s_ease-out_both]"
                      >
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-green-400 to-emerald-600" />

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">
                                Order
                              </p>
                              <h3 className="mt-1 break-all text-xl sm:text-2xl font-black text-green-700">
                                #{order.orderId || index + 1}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {order.date || order.createdAt || "Date unavailable"}
                              </p>
                            </div>

                            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(status)}`}>
                              <span className="relative flex h-4 w-4 items-center justify-center">
                                <span className="absolute h-3 w-3 rounded-full bg-current opacity-20 animate-ping" />
                                <span className="relative">{icon}</span>
                              </span>
                              {status}
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-2.5">
                            <MiniOrderCard
                              label="Amount"
                              value={formatMoney(order.total_amount || order.totalAmount || order.total || 0)}
                              color="green"
                            />
                            <MiniOrderCard
                              label="Items"
                              value={itemCount}
                              color="blue"
                            />
                            <MiniOrderCard
                              label="Payment"
                              value={order.payment_status || order.paymentStatus || "Pending"}
                              color="yellow"
                            />
                            <MiniOrderCard
                              label="Area"
                              value={order.addresses?.area || order.area || "-"}
                              color="purple"
                            />
                          </div>

                          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">
                                📍
                              </span>
                              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Delivery Address
                              </p>
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-relaxed text-slate-700">
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
                            <span className="text-xs font-semibold text-slate-400">
                              Tap to see full details
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm font-black text-green-700 transition-transform group-hover:translate-x-1">
                              View Details →
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {orders.length > 1 && (
                  <div className="mt-4 flex flex-col items-center">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-1/2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">
                      Swipe left or right
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ================= DETAILS ================= */}
            <div className="space-y-5">
              {orders.map((order, index) => {
                if (!order) return null;

                const itemsArray =
                  order.order_items?.map((item) => ({
                    name: item.products?.name || "Product",
                    quantity: item.quantity,
                    price: item.total_price,
                    image: item.products?.image,
                  })) || [];

                const orderStatus = order.status || "Pending";
                const paymentStatus = order.payment_status || "Pending";

                return (
                  <section
                    id={`order-details-${order.orderId || index}`}
                    key={`details-${order.orderId || index}`}
                    className="scroll-mt-6 overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-[0_14px_50px_rgba(15,118,110,.08)] transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="border-b border-green-100 bg-gradient-to-r from-green-50 via-white to-emerald-50 p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-600 text-lg text-white shadow-md">
                              📦
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">
                                Order Details
                              </p>
                              <h2 className="mt-0.5 break-all text-xl sm:text-2xl font-black text-green-800">
                                #{order.order_number || order.orderId || index + 1}
                              </h2>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(orderStatus)}`}>
                            🚚 {orderStatus}
                          </span>
                          <span className={`rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(paymentStatus)}`}>
                            💳 {paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MetaCard
                          label="Order Date"
                          value={
                            order.order_date
                              ? new Date(order.order_date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : order.date || "-"
                          }
                          color="green"
                        />
                        <MetaCard
                          label="Payment Method"
                          value={order.payment_method || order.paymentStatus || "-"}
                          color="blue"
                        />
                        <MetaCard
                          label="Delivery Area"
                          value={order.addresses?.area || order.area || "-"}
                          color="yellow"
                        />
                        <MetaCard
                          label="Total Amount"
                          value={formatMoney(order.total_amount || order.totalAmount || order.total || 0)}
                          color="purple"
                        />
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                            📍
                          </span>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                              Delivery Address
                            </p>
                            <p className="mt-1 text-sm sm:text-base font-semibold leading-relaxed text-slate-700">
                              {order.addresses
                                ? [
                                    order.addresses.house_no,
                                    order.addresses.street,
                                    order.addresses.area,
                                    order.addresses.city,
                                    order.addresses.state,
                                    order.addresses.pincode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")
                                : order.address || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {itemsArray.length > 0 && (
                        <div className="mt-5 rounded-3xl border border-slate-100 bg-white">
                          <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-5 py-4">
                            <div>
                              <h3 className="text-lg font-black text-slate-800">
                                🧾 Ordered Items
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Products included in this order
                              </p>
                            </div>
                            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
                              {itemsArray.length} item{itemsArray.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {itemsArray.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-4 transition hover:bg-green-50/40"
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
                                  />
                                ) : (
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                                    🥛
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-black text-slate-800">
                                    {item.name}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>

                                <p className="shrink-0 font-black text-green-700">
                                  {formatMoney(item.price)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-green-700 to-emerald-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-green-100">
                            Order Total
                          </p>
                          <p className="mt-1 text-3xl font-black">
                            {formatMoney(order.total_amount || order.totalAmount || order.total || 0)}
                          </p>
                        </div>

                        <div className="text-sm text-green-50 sm:text-right">
                          <p>{itemsArray.length} item{itemsArray.length === 1 ? "" : "s"}</p>
                          <p className="mt-1">Thank you for choosing Farm Fresh Dairy 🥛</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => navigate("/products")}
                          className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:bg-green-700 active:scale-95"
                        >
                          🛍️ Reorder Products
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/dashboard")}
                          className="rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-700 transition hover:bg-green-50 active:scale-95"
                        >
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
