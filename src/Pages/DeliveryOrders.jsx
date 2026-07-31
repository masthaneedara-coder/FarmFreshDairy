import { useEffect, useMemo, useState } from "react";
import { updateOrderStatus,} from "../config/api";

export default function DeliveryOrders() {
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzx6oRn6rdc_u3_38IwnOR4I_5phOU54uSjmdefCDiUvi4OLqYCQID1iOga7bdEe0s1/exec";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${SCRIPT_URL}?action=allOrders`);
      const data = await res.json();
      

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to load delivery orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const deliveryOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = String(order.status || "").toLowerCase();

      return (
        status === "assigned" ||
        status === "out for delivery" ||
        status === "pending" ||
        status === ""
      );
    });
  }, [orders]);

const updateStatusLocal = async (order, newStatus) => {
  try {

    console.log("Updating Order:", order);

    const refId =
      order.orderId ||
      order.refId ||
      order.id;

    if (!refId) {
      alert("Order ID not found.");
      return;
    }

    const result = await updateOrderStatus(refId, newStatus);

    console.log(result);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setOrders(prev =>
      prev.map(item =>
        item.orderId === refId
          ? { ...item, status: newStatus }
          : item
      )
    );

  } catch (err) {
    console.error(err);
    alert("Unable to update status.");
  }
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

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "delivered") return "bg-green-100 text-green-700";
    if (s === "out for delivery") return "bg-blue-100 text-blue-700";
    if (s === "assigned") return "bg-purple-100 text-purple-700";
    return "bg-orange-100 text-orange-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-orange-700">
              Delivery Orders
            </h1>
            <p className="text-slate-500 mt-1">
              View and update assigned customer orders
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold shadow"
          >
            Refresh Orders
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl shadow-md p-10 text-center">
            <div className="text-5xl mb-3">⏳</div>
            <p className="text-lg font-semibold text-slate-600">
              Loading delivery orders...
            </p>
          </div>
        ) : deliveryOrders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-md p-10 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-lg font-semibold text-slate-600">
              No delivery orders found
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {deliveryOrders.map((order, index) => (
              <div
                key={`${order.orderId || "NO_ID"}-${order.phone || "NO_PHONE"}-${index}`}
                className="bg-white rounded-3xl shadow-md border border-slate-100 p-4 sm:p-5"
              >
                <div className="flex flex-col xl:flex-row gap-4 xl:items-start xl:justify-between">
                  {/* Left */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg sm:text-xl font-black text-orange-700 break-all">
                        {order.orderId ||order.refId ||order.id ||"NO ORDER ID"}
                      </h2>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-sm sm:text-base">
                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-sm">Customer</p>
                        <p className="font-bold text-slate-800">
                          {order.customerName || "-"}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-sm">Phone</p>
                        <p className="font-bold text-slate-800">
                          {order.phone || "-"}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-sm">Product</p>
                        <p className="font-bold text-slate-800">
                           {order.items || "-"}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-sm">Qty</p>
                        <p className="font-bold text-slate-800">
                          {order.rawJson
                            ? JSON.parse(order.rawJson)
                                .map(i => `${i.qty} × ${i.name}`)
                                .join(", ")
                            : "-"}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-sm">Amount</p>
                        <p className="font-bold text-green-700">
                          ₹{order.amount || 0}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-3">
                        <p className="text-slate-500 text-sm">Date</p>
                        <p className="font-bold text-slate-800">
                          {formatDate(order.date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="w-full xl:w-[250px] bg-orange-50 rounded-3xl p-4 border border-orange-100">
                    <p className="font-bold text-orange-700 mb-3">
                      Update Delivery Status
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      <button
                       onClick={() => updateStatusLocal(order, "Assigned")}
                        className="bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm"
                      >
                        Assigned
                      </button>

                      <button
                        onClick={() => updateStatusLocal(order, "Out for Delivery")}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm"
                      >
                        Out for Delivery
                      </button>

                      <button
                       onClick={() => updateStatusLocal(order, "Delivered")}
                        className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm"
                      >
                        Delivered
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}