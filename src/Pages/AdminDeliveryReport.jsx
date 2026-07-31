import { useEffect, useMemo, useState } from "react";

export default function AdminDeliveryReport() {
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxrawDo75QKP1RwDwjjAKwoE0-so9UdTG2V4Dpq94PF8KOrMNx4CpfBEuNlk7VvblII/exec";

  const deliveryBoys = ["Ravi", "Suresh", "Mahesh", "Ramu"];

  const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigningKey, setAssigningKey] = useState("");
  const [statusUpdatingKey, setStatusUpdatingKey] = useState("");
  const [selectedBoys, setSelectedBoys] = useState({});

  const loadReport = async (dateValue = selectedDate) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${SCRIPT_URL}?action=dailyDeliveryReport&date=${dateValue}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setRows(data);

        const initialMap = {};
        data.forEach((row) => {
          const key = `${row.type}_${row.refId}`;
          initialMap[key] = row.deliveryBoy || "";
        });
        setSelectedBoys(initialMap);
      } else {
        setRows([]);
        setSelectedBoys({});
      }
    } catch (error) {
      console.error("Failed to load daily report:", error);
      alert("Failed to load daily delivery report");
      setRows([]);
      setSelectedBoys({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const generateTodayDeliveries = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${SCRIPT_URL}?action=generateDailyDeliveries`
      );
      const result = await res.json();

      if (result.success) {
        alert(
          `Daily deliveries generated successfully. Added rows: ${result.added || 0}`
        );

        // after generating, force selected date to today
        const today = getTodayDate();
        setSelectedDate(today);
        await loadReport(today);
      } else {
        alert(result.message || "Failed to generate daily deliveries");
      }
    } catch (error) {
      console.error("Generate daily deliveries error:", error);
      alert("Failed to generate daily deliveries");
    } finally {
      setLoading(false);
    }
  };

  const assignDeliveryBoy = async (row) => {
    const key = `${row.type}_${row.refId}`;
    const deliveryBoy = selectedBoys[key];

    if (!deliveryBoy) {
      alert("Please select delivery boy");
      return;
    }

    try {
      setAssigningKey(key);

      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "assignDailyDelivery",
          refId: row.refId,
          type: row.type,
          deliveryBoy,
          date: selectedDate,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert("Delivery boy assigned successfully");
        await loadReport(selectedDate);
      } else {
        alert(result.message || "Failed to assign delivery boy");
      }
    } catch (error) {
      console.error("Assign delivery boy error:", error);
      alert("Failed to assign delivery boy");
    } finally {
      setAssigningKey("");
    }
  };

  const updateDeliveryStatus = async (row, newStatus) => {
    try {
      setStatusUpdatingKey(`${row.type}_${row.refId}_${newStatus}`);

      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "updateDailyDeliveryStatus",
          refId: row.refId,
          type: row.type,
          status: newStatus,
          date: selectedDate,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert(`Status updated to ${newStatus}`);
        await loadReport(selectedDate);
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Update daily delivery status error:", error);
      alert("Failed to update delivery status");
    } finally {
      setStatusUpdatingKey("");
    }
  };

  const summary = useMemo(() => {
    const total = rows.length;

    const pending = rows.filter(
      (r) => !r.status || r.status === "Pending"
    ).length;

    const assigned = rows.filter(
      (r) => r.status === "Assigned"
    ).length;

    const outForDelivery = rows.filter(
      (r) => r.status === "Out for Delivery"
    ).length;

    const delivered = rows.filter(
      (r) => r.status === "Delivered"
    ).length;

    const subscriptionCount = rows.filter(
      (r) => r.type === "Subscription"
    ).length;

    const orderCount = rows.filter(
      (r) => r.type === "Order"
    ).length;

    return {
      total,
      pending,
      assigned,
      outForDelivery,
      delivered,
      subscriptionCount,
      orderCount,
    };
  }, [rows]);

  const getStatusBadge = (status) => {
    const value = status || "Pending";

    if (value === "Delivered") return "bg-green-600 text-white";
    if (value === "Out for Delivery") return "bg-blue-600 text-white";
    if (value === "Assigned") return "bg-purple-600 text-white";
    return "bg-orange-500 text-white";
  };

  const getTypeBadge = (type) => {
    if (type === "Subscription") {
      return "bg-green-100 text-green-700";
    }
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black text-green-700">
              🚚 Daily Delivery Report
            </h1>
            <p className="text-gray-500 mt-2">
              Manage today’s order + subscription deliveries in one place
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-2xl px-4 py-3 bg-white shadow-sm"
            />

            <button
              onClick={() => loadReport(selectedDate)}
              className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg"
            >
              Refresh
            </button>

            <button
              onClick={generateTodayDeliveries}
              className="px-5 py-3 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg"
            >
              Generate Today Deliveries
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
            <p className="text-gray-600 font-semibold">Total</p>
            <h2 className="text-4xl font-black text-green-700 mt-2">
              {summary.total}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
            <p className="text-gray-600 font-semibold">Pending</p>
            <h2 className="text-4xl font-black text-orange-600 mt-2">
              {summary.pending}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
            <p className="text-gray-600 font-semibold">Assigned</p>
            <h2 className="text-4xl font-black text-purple-600 mt-2">
              {summary.assigned}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
            <p className="text-gray-600 font-semibold">Out for Delivery</p>
            <h2 className="text-4xl font-black text-blue-600 mt-2">
              {summary.outForDelivery}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
            <p className="text-gray-600 font-semibold">Delivered</p>
            <h2 className="text-4xl font-black text-green-600 mt-2">
              {summary.delivered}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg text-center">
            <p className="text-gray-600 font-semibold">
              Subscriptions / Orders
            </p>
            <h2 className="text-2xl font-black text-slate-700 mt-2">
              {summary.subscriptionCount} / {summary.orderCount}
            </h2>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-xl p-6 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-lg font-semibold text-gray-600">
              Loading delivery report...
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-3">📭</div>
              <h3 className="text-2xl font-bold text-gray-700">
                No delivery rows found
              </h3>
              <p className="text-gray-500 mt-2">
                Click <strong>Generate Today Deliveries</strong> to create today’s report
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[1500px]">
              <thead>
                <tr className="bg-green-50 text-left">
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Ref ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Area</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Delivery Boy</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assign</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const rowKey = `${row.type}_${row.refId}`;
                  const currentStatus = row.status || "Pending";

                  return (
                    <tr key={`${rowKey}_${index}`} className="border-b align-top">
                      <td className="p-4 whitespace-nowrap">{row.date}</td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full font-bold ${getTypeBadge(
                            row.type
                          )}`}
                        >
                          {row.type}
                        </span>
                      </td>

                      <td className="p-4 font-semibold">{row.refId}</td>
                      <td className="p-4">{row.customerName || "-"}</td>
                      <td className="p-4">{row.phone || "-"}</td>
                      <td className="p-4">{row.address || "-"}</td>
                      <td className="p-4">{row.area || "-"}</td>
                      <td className="p-4">{row.product || "-"}</td>
                      <td className="p-4">{row.qty || "-"}</td>

                      <td className="p-4 font-bold text-green-700">
                        ₹{row.amount || 0}
                      </td>

                      <td className="p-4">
                        {row.deliveryBoy ? (
                          <span className="font-semibold text-slate-700">
                            {row.deliveryBoy}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not Assigned</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full font-bold ${getStatusBadge(
                            currentStatus
                          )}`}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      <td className="p-4">
                        {currentStatus === "Delivered" ? (
                          <span className="text-green-600 font-bold">
                            Completed
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedBoys[rowKey] || ""}
                              onChange={(e) =>
                                setSelectedBoys((prev) => ({
                                  ...prev,
                                  [rowKey]: e.target.value,
                                }))
                              }
                              className="border rounded-xl px-3 py-2"
                            >
                              <option value="">Select Boy</option>
                              {deliveryBoys.map((boy) => (
                                <option key={boy} value={boy}>
                                  {boy}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => assignDeliveryBoy(row)}
                              disabled={assigningKey === rowKey}
                              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-60"
                            >
                              {assigningKey === rowKey ? "Assigning..." : "Assign"}
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {currentStatus === "Pending" && (
                          <button
                            onClick={() =>
                              updateDeliveryStatus(row, "Assigned")
                            }
                            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700"
                          >
                            Mark Assigned
                          </button>
                        )}

                        {currentStatus === "Assigned" && (
                          <button
                            onClick={() =>
                              updateDeliveryStatus(row, "Out for Delivery")
                            }
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
                          >
                            Start Delivery
                          </button>
                        )}

                        {currentStatus === "Out for Delivery" && (
                          <button
                            onClick={() =>
                              updateDeliveryStatus(row, "Delivered")
                            }
                            className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
                          >
                            Mark Delivered
                          </button>
                        )}

                        {currentStatus === "Delivered" && (
                          <span className="text-green-600 font-bold">
                            Completed
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
    </div>
  );
}