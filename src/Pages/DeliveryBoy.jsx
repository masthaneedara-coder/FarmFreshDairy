import { useEffect, useState } from "react";

export default function DeliveryBoy() {
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxrawDo75QKP1RwDwjjAKwoE0-so9UdTG2V4Dpq94PF8KOrMNx4CpfBEuNlk7VvblII/exec";

  const [deliveryBoy, setDeliveryBoy] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const savedBoy = localStorage.getItem("deliveryBoyName") || "Ravi";
    setDeliveryBoy(savedBoy);
  }, []);

  const loadOrders = async (boyName) => {
    if (!boyName) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${SCRIPT_URL}?action=deliveryBoyDailyOrders&deliveryBoy=${encodeURIComponent(
          boyName
        )}&date=${today}`
      );

      const data = await res.json();
      console.log("DeliveryBoy daily orders:", data);

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load delivery orders:", error);
      alert("Failed to load delivery orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryBoy) {
      loadOrders(deliveryBoy);
    }
  }, [deliveryBoy]);

  const updateDeliveryStatus = async (row, status) => {
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "updateDailyDeliveryStatus",
          refId: row.refId,
          type: row.type,
          date: row.date || today,
          status,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert(`Status updated to ${status}`);
        loadOrders(deliveryBoy);
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Update delivery status error:", error);
      alert("Failed to update delivery status");
    }
  };

  const assignedCount = orders.filter(
    (o) => (o.status || "").trim() === "Assigned"
  ).length;

  const outForDeliveryCount = orders.filter(
    (o) => (o.status || "").trim() === "Out for Delivery"
  ).length;

  const deliveredCount = orders.filter(
    (o) => (o.status || "").trim() === "Delivered"
  ).length;

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <h1 className="text-5xl font-black text-orange-700 mb-8 text-center">
        🚚 Delivery Boy Panel
      </h1>

      <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
        <div className="text-center mb-8">
          <p className="text-gray-500 font-semibold text-2xl">Logged in as</p>
          <h2 className="text-5xl font-black text-orange-700 mt-2">
            {deliveryBoy}
          </h2>
          <p className="text-gray-500 mt-2">Date: {today}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-orange-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-600 font-semibold">Total</p>
            <h2 className="text-4xl font-black text-orange-700 mt-2">
              {orders.length}
            </h2>
          </div>

          <div className="bg-purple-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-600 font-semibold">Assigned</p>
            <h2 className="text-4xl font-black text-purple-700 mt-2">
              {assignedCount}
            </h2>
          </div>

          <div className="bg-blue-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-600 font-semibold">
              Out for Delivery
            </p>
            <h2 className="text-4xl font-black text-blue-700 mt-2">
              {outForDeliveryCount}
            </h2>
          </div>

          <div className="bg-green-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-600 font-semibold">Delivered</p>
            <h2 className="text-4xl font-black text-green-700 mt-2">
              {deliveredCount}
            </h2>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-lg font-semibold">
            Loading delivery orders...
          </p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-3">📭</div>
            <h3 className="text-2xl font-bold text-gray-700">
              No orders assigned to {deliveryBoy}
            </h3>
            <p className="text-gray-500 mt-2">
              Once admin assigns deliveries, they will appear here
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-orange-50 text-left">
                <th className="p-4">Ref ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Address</th>
                <th className="p-4">Product</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order, index) => {
                const status = (order.status || "Pending").trim();

                return (
                  <tr key={`${order.refId}_${index}`} className="border-b">
                    <td className="p-4 font-semibold">{order.refId}</td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          order.type === "Subscription"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {order.type}
                      </span>
                    </td>

                    <td className="p-4">{order.customerName}</td>
                    <td className="p-4">{order.phone}</td>
                    <td className="p-4">{order.address || "-"}</td>
                    <td className="p-4">{order.product}</td>
                    <td className="p-4">{order.qty}</td>
                    <td className="p-4 font-bold text-green-700">
                      ₹{order.amount || 0}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-white font-semibold ${
                          status === "Delivered"
                            ? "bg-green-600"
                            : status === "Out for Delivery"
                            ? "bg-blue-600"
                            : status === "Assigned"
                            ? "bg-purple-600"
                            : "bg-orange-500"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="p-4">
                      {status === "Assigned" && (
                        <button
                          onClick={() =>
                            updateDeliveryStatus(order, "Out for Delivery")
                          }
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                        >
                          Start Delivery
                        </button>
                      )}

                      {status === "Out for Delivery" && (
                        <button
                          onClick={() =>
                            updateDeliveryStatus(order, "Delivered")
                          }
                          className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {status === "Delivered" && (
                        <span className="text-green-600 font-bold">
                          Completed
                        </span>
                      )}

                      {(status === "Pending" || !status) && (
                        <span className="text-orange-600 font-semibold">
                          Waiting for admin
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}