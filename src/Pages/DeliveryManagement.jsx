import { useEffect, useState } from "react";

export default function DeliveryManagement() {
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxrawDo75QKP1RwDwjjAKwoE0-so9UdTG2V4Dpq94PF8KOrMNx4CpfBEuNlk7VvblII/exec";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBoys, setSelectedBoys] = useState({});

  const deliveryBoys = [
    "Ravi",
    "Suresh",
    "Mahesh",
    "Ramu",
  ];

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${SCRIPT_URL}?action=allOrders`
      );
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const assignDelivery = async (orderId) => {
    const deliveryBoy = selectedBoys[orderId];

    if (!deliveryBoy) {
      alert("Please select delivery boy");
      return;
    }

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "assignDelivery",
          orderId,
          deliveryBoy,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert("Delivery assigned successfully");
        loadOrders();
      } else {
        alert(result.message || "Failed to assign delivery");
      }
    } catch (error) {
      console.error("Assign delivery error:", error);
      alert("Failed to assign delivery");
    }
  };

  const visibleOrders = orders.filter(
    (o) => o.status !== "Delivered"
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-5xl font-black text-green-700 mb-8">
        Delivery Management
      </h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
          <p className="text-gray-600 font-semibold">
            Total Orders
          </p>
          <h2 className="text-4xl font-black text-green-600">
            {orders.length}
          </h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
          <p className="text-gray-600 font-semibold">
            Assigned
          </p>
          <h2 className="text-4xl font-black text-blue-600">
            {
              orders.filter(
                (o) =>
                  o.status === "Assigned" ||
                  o.status === "Out for Delivery"
              ).length
            }
          </h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
          <p className="text-gray-600 font-semibold">
            Pending
          </p>
          <h2 className="text-4xl font-black text-orange-600">
            {
              orders.filter(
                (o) =>
                  !o.status ||
                  o.status === "Pending"
              ).length
            }
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-6 overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-lg font-semibold">
            Loading orders...
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-green-50 text-left">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Address</th>
                <th className="p-4">Product</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Delivery Boy</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {visibleOrders.map((order) => {
                const alreadyAssigned =
                  order.status === "Assigned" ||
                  order.status === "Out for Delivery";

                return (
                  <tr
                    key={order.orderId}
                    className="border-b"
                  >
                    <td className="p-4 font-semibold">
                      {order.orderId}
                    </td>
                    <td className="p-4">
                      {order.customerName}
                    </td>
                    <td className="p-4">
                      {order.phone}
                    </td>
                    <td className="p-4">
                      {order.address}
                    </td>
                    <td className="p-4">
                      {order.product}
                    </td>
                    <td className="p-4">
                      {order.qty}
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      ₹{order.amount}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-white font-semibold ${
                          order.status === "Delivered"
                            ? "bg-green-600"
                            : order.status ===
                              "Out for Delivery"
                            ? "bg-blue-600"
                            : order.status ===
                              "Assigned"
                            ? "bg-purple-600"
                            : "bg-orange-500"
                        }`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </td>

                    <td className="p-4">
                      {alreadyAssigned ? (
                        <span className="text-sm text-gray-500 font-medium">
                          Assigned
                        </span>
                      ) : (
                        <select
                          className="border rounded-xl px-3 py-2"
                          value={
                            selectedBoys[
                              order.orderId
                            ] || ""
                          }
                          onChange={(e) =>
                            setSelectedBoys(
                              (prev) => ({
                                ...prev,
                                [order.orderId]:
                                  e.target.value,
                              })
                            )
                          }
                        >
                          <option value="">
                            Select Boy
                          </option>
                          {deliveryBoys.map((boy) => (
                            <option
                              key={boy}
                              value={boy}
                            >
                              {boy}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="p-4">
                      {alreadyAssigned ? (
                        <span className="text-sm font-semibold text-green-600">
                          Assigned
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            assignDelivery(
                              order.orderId
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {visibleOrders.length === 0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="p-6 text-center text-gray-500"
                  >
                    No orders available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}