import { useEffect, useState } from "react";
import { getCustomerOrders } from "../services/orderService";

export default function TrackOrder() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxrawDo75QKP1RwDwjjAKwoE0-so9UdTG2V4Dpq94PF8KOrMNx4CpfBEuNlk7VvblII/exec";

  useEffect(() => {
    const phone = localStorage.getItem("customerPhone");

    if (!phone) {
      setLoading(false);
      return;
    }

    const loadTrackingData = async () => {
      try {
        const [subsRes, ordersRes] = await Promise.all([
          fetch(
            `${SCRIPT_URL}?action=subscriptions&phone=${encodeURIComponent(
              phone
            )}`
          ),
          fetch(
            `${SCRIPT_URL}?action=orders&phone=${encodeURIComponent(phone)}`
          ),
        ]);

        const subsData = await subsRes.json();
        const ordersData = await ordersRes.json();

        setSubscriptions(Array.isArray(subsData) ? subsData : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (error) {
        console.error("Failed to load tracking data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrackingData();
  }, []);

  const getOrderStep = (status) => {
    const normalized = (status || "").trim().toLowerCase();

    if (normalized === "delivered") return 4;
    if (normalized === "out for delivery") return 3;
    if (normalized === "assigned") return 2;
    return 1;
  };

  const getStatusStyle = (status) => {
    const normalized = (status || "").trim().toLowerCase();

    if (normalized === "delivered") {
      return "bg-green-100 text-green-700";
    }

    if (normalized === "out for delivery") {
      return "bg-blue-100 text-blue-700";
    }

    if (normalized === "assigned") {
      return "bg-purple-100 text-purple-700";
    }

    return "bg-orange-100 text-orange-700";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="text-6xl mb-4">🚚</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-700">
            Loading your deliveries...
          </h2>
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0 && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="text-6xl mb-4">🚚</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-600">
            No Active Deliveries
          </h2>
          <p className="text-gray-500 mt-2">
            Your subscription deliveries and orders will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-green-700">
            🚚 Live Order Tracking
          </h1>
          <p className="text-gray-500 mt-3 text-sm sm:text-lg">
            Track your milk delivery in real time
          </p>
        </div>

        {/* Subscription Deliveries */}
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-green-700">
              🥛 Active Subscription Deliveries
            </h2>

            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
              {subscriptions.length}
            </span>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No Active Subscriptions
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {subscriptions.map((sub, index) => {
                const subStatus =
                  sub.computedStatus || sub.status || "Active";

                return (
                  <div
                    key={sub.subscriptionId || index}
                    className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-3xl p-5 sm:p-6 shadow-lg"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xl sm:text-2xl font-bold break-words">
                          🥛 {sub.product || "Milk Subscription"}
                        </h3>

                        <p className="mt-2 text-sm sm:text-base">
                          Quantity: {sub.qty || "-"}
                        </p>

                        <p className="text-sm sm:text-base">
                          Delivery: {sub.deliveryType || "Daily"}
                        </p>

                        <p className="text-sm sm:text-base">
                          Expiry: {formatDate(sub.expireDate)}
                        </p>
                      </div>

                      <span className="bg-white text-green-700 px-3 py-2 rounded-full font-bold whitespace-nowrap text-xs sm:text-sm">
                        {subStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-blue-700">
              🛒 Today's Orders
            </h2>

            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">
              {orders.length}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No Orders Found
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {orders.map((order, index) => {
                const status = order.status || "Pending";
                const step = getOrderStep(status);

                return (
                  <div
                    key={order.orderId || index}
                    className="bg-white border rounded-3xl shadow-lg overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5">
                      <h3 className="text-xl sm:text-2xl font-bold break-words">
                        🥛 {order.product || "Milk"}
                      </h3>
                      <p className="text-xs sm:text-sm mt-1 break-all">
                        Order ID: {order.orderId}
                      </p>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <div className="space-y-2 mb-5 text-sm sm:text-base">
                        <p>
                          <strong>Qty:</strong> {order.qty}
                        </p>

                        <p>
                          <strong>Amount:</strong> ₹{order.amount}
                        </p>

                        <p className="flex items-center gap-2 flex-wrap">
                          <strong>Status:</strong>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusStyle(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </p>
                      </div>

                      {/* Progress labels */}
                      <div className="flex justify-between text-[10px] sm:text-xs font-medium mb-2 text-gray-600">
                        <span>Placed</span>
                        <span>Assigned</span>
                        <span>Delivery</span>
                        <span>Done</span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                            step >= 1 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></div>

                        <div
                          className={`flex-1 h-1 ${
                            step >= 2 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></div>

                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                            step >= 2 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></div>

                        <div
                          className={`flex-1 h-1 ${
                            step >= 3 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></div>

                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                            step >= 3 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></div>

                        <div
                          className={`flex-1 h-1 ${
                            step >= 4 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></div>

                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${
                            step >= 4 ? "bg-green-500" : "bg-gray-300"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}