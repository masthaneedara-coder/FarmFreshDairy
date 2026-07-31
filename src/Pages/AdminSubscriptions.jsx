import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../Components/AdminLayout";

import {
  getAllSubscriptions,
  updateSubscriptionStatus,
  getDeliverySummary
} from "../services/adminSubscriptionService";


export default function AdminSubscriptions() {
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliverySummary, setDeliverySummary] =  useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  async function loadSubscriptions() {
  try {
    setLoading(true);

    console.log("Loading started");

    const data = await getAllSubscriptions();

    console.log("API Data:", data);

    setSubscriptions(data);
    for (const sub of data) {
      const id = sub.subscriptionId || sub.id;

      if (id) {
        loadDeliverySummary(id);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    console.log("Loading finished");
    setLoading(false);
  }
}
async function loadDeliverySummary(subscriptionId) {
  try {
    console.log("Loading summary for:", subscriptionId);

    const summary = await getDeliverySummary(subscriptionId);

    console.log("Summary Response:", summary);

    setDeliverySummary((prev) => ({
      ...prev,
      [subscriptionId]: summary,
    }));
  } catch (err) {
    console.error("Delivery Summary Error:", err);
  }
}

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    const q = search.toLowerCase().trim();

    return subscriptions.filter((sub) => {
      const customerName = String(sub.customerName || sub.name || "").toLowerCase();
      const phone = String(sub.phone || sub.mobile || "").toLowerCase();
      const product = String(sub.product || sub.planName || "").toLowerCase();
      const status = String(sub.status || "Active").toLowerCase();

      const matchesSearch =
        !q ||
        customerName.includes(q) ||
        phone.includes(q) ||
        product.includes(q);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, search, statusFilter]);

  const stats = useMemo(() => {
    const total = subscriptions.length;
    const active = subscriptions.filter(
      (s) => String(s.status || "Active").toLowerCase() === "active"
    ).length;
    const paused = subscriptions.filter(
      (s) => String(s.status || "").toLowerCase() === "paused"
    ).length;
    const stopped = subscriptions.filter(
      (s) =>
        String(s.status || "").toLowerCase() === "stopped" ||
        String(s.status || "").toLowerCase() === "expired"
    ).length;

    const monthlyRevenue = subscriptions.reduce((sum, sub) => {
      const status = String(sub.status || "Active").toLowerCase();
      if (status !== "active") return sum;

      return (
        sum +
        Number(
          sub.monthlyAmount ||
            sub.price ||
            sub.amount ||
            0
        )
      );
    }, 0);

    return {
      total,
      active,
      paused,
      stopped,
      monthlyRevenue,
    };
  }, [subscriptions]);

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

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getStatusStyle = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "active") {
      return {
        badge: "bg-green-100 text-green-700 border border-green-200",
        dot: "bg-green-500",
      };
    }

    if (s === "paused") {
      return {
        badge: "bg-yellow-100 text-yellow-700 border border-yellow-200",
        dot: "bg-yellow-500",
      };
    }

    if (s === "stopped" || s === "expired") {
      return {
        badge: "bg-red-100 text-red-700 border border-red-200",
        dot: "bg-red-500",
      };
    }

    return {
      badge: "bg-orange-100 text-orange-700 border border-orange-200",
      dot: "bg-orange-500",
    };
  };

  const updateStatusLocal = async (
  subscriptionId,
  newStatus
) => {
  try {
    await updateSubscriptionStatus(
      subscriptionId,
      newStatus
    );

    setSubscriptions((prev) =>
      prev.map((sub) =>
        String(sub.subscriptionId || sub.id) ===
        String(subscriptionId)
          ? { ...sub, status: newStatus }
          : sub
      )
    );

  } catch (err) {
    console.error(err);
    alert("Unable to update subscription");
  }
};


  return (
    <AdminLayout title="Subscriptions">
      <div className="space-y-5 sm:space-y-6">
        {/* HERO */}
        <div className="rounded-[26px] sm:rounded-[30px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 p-4 sm:p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-white/80 text-xs sm:text-sm">
                Admin Subscription Control
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
                🔁 Subscriptions Management
              </h1>
              <p className="text-white/90 mt-2 text-sm sm:text-base">
                View active plans, manage customer subscriptions and update status.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-3">
              <button
                onClick={loadSubscriptions}
                className="px-4 py-3 rounded-2xl bg-white text-green-700 font-bold shadow text-sm sm:text-base"
              >
                Refresh Subscriptions
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          <StatCard title="Total" value={stats.total} color="green" icon="🔁" />
          <StatCard title="Active" value={stats.active} color="emerald" icon="✅" />
          <StatCard title="Paused" value={stats.paused} color="yellow" icon="⏸️" />
          <StatCard title="Stopped" value={stats.stopped} color="red" icon="⛔" />
          <StatCard
            title="Monthly Revenue"
            value={formatMoney(stats.monthlyRevenue)}
            color="blue"
            icon="💰"
          />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto] gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Search Subscription
              </label>
              <input
                type="text"
                placeholder="Search by customer / phone / product"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Stopped">Stopped</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadSubscriptions}
                className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-bold shadow"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="bg-slate-50 rounded-3xl p-10 text-center">
            <div className="text-5xl mb-3 animate-pulse">⏳</div>
            <p className="text-lg font-semibold text-slate-600">
              Loading subscriptions...
            </p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-10 text-center">
            <div className="text-6xl mb-4">🔁</div>
            <h2 className="text-2xl font-black text-slate-700">
              No subscriptions found
            </h2>
            <p className="text-slate-500 mt-2">
              Try changing search or status filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubscriptions.map((sub, index) => {
              const statusStyle = getStatusStyle(sub.status || "Active");
              const subscriptionId = sub.subscriptionId || sub.id || `SUB-${index + 1}`;
              const summary =
                    deliverySummary[subscriptionId] || {
                      delivered: 0,
                      outForDelivery: 0,
                      pending: 0,
                      missed: 0,
                      total: 0,
                    };
              const monthlyAmount =
                sub.monthlyAmount || sub.price || sub.amount || 0;

              return (
                <div
                  key={subscriptionId}
                  className="bg-white rounded-3xl shadow-md border border-slate-100 p-4 sm:p-5 hover:shadow-xl transition"
                >
                  <div className="flex flex-col gap-4">
                    {/* TOP */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg sm:text-2xl font-black text-green-700 break-words">
                            {sub.customerName || sub.name || "Customer"}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${statusStyle.badge}`}
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${statusStyle.dot}`}
                            ></span>
                            {sub.status || "Active"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 mt-2 break-all">
                          Subscription ID: {subscriptionId}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-4 shadow w-full sm:w-auto">
                        <p className="text-xs sm:text-sm text-white/80">
                          Monthly Amount
                        </p>
                        <h3 className="text-2xl font-black mt-1">
                          {formatMoney(monthlyAmount)}
                        </h3>
                      </div>
                    </div>

                    {/* CUSTOMER + PLAN INFO */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <InfoBox label="Phone" value={sub.phone || sub.mobile || "-"} />
                      <InfoBox label="Product" value={sub.product || "-"} />
                      <InfoBox label="Quantity" value={sub.qty || "-"} />
                      <InfoBox label="Delivery" value={sub.deliveryType || "-"} />
                    </div>

                    {/* ADDRESS */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500 font-medium">Address</p>
                      <p className="text-slate-800 font-semibold mt-1 break-words">
                        {sub.address || "-"}
                      </p>
                    </div>

                    {/* DATES */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <InfoBox
                        label="Start Date"
                        value={formatDate(sub.startDate || sub.date)}
                      />
                      <InfoBox
                        label="Expire Date"
                        value={formatDate(sub.expireDate || sub.endDate)}
                      />
                      <InfoBox label="Area" value={sub.area || "-"} />
                    </div>

                    {/* SUMMARY + ACTIONS */}
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px_360px] gap-4">
                      <div className="rounded-3xl border border-green-100 bg-green-50 p-4 sm:p-5">
                        <h3 className="text-lg sm:text-xl font-black text-green-700">
                          Subscription Summary
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3 mt-4">
                          <div className="rounded-2xl bg-white border border-green-100 p-4">
                            <p className="text-sm text-slate-500">Plan</p>
                            <p className="font-black text-slate-800 mt-1 break-words">
                              {sub.product || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white border border-green-100 p-4">
                            <p className="text-sm text-slate-500">Delivery Type</p>
                            <p className="font-black text-slate-800 mt-1 break-words">
                              {sub.deliveryType || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white border border-green-100 p-4">
                            <p className="text-sm text-slate-500">Quantity</p>
                            <p className="font-black text-slate-800 mt-1">
                              {sub.qty || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white border border-green-100 p-4">
                            <p className="text-sm text-slate-500">Monthly Fee</p>
                            <p className="font-black text-green-700 mt-1">
                              {formatMoney(monthlyAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 mt-4">

                        <h3 className="text-lg font-bold text-blue-700 mb-4">
                          Delivery Summary
                        </h3>

                       <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                          <InfoBox
                            label="Delivered"
                            value={summary.delivered}
                          />

                          <InfoBox
                            label="Out For Delivery"
                            value={summary.outForDelivery}
                          />

                          <InfoBox
                            label="Pending"
                            value={summary.pending}
                          />

                          <InfoBox
                            label="Missed"
                            value={summary.missed}
                          />

                        </div>

                      </div>

                      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                        <h3 className="text-lg font-black text-slate-800">
                          Update Subscription Status
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Pause, activate or stop this customer plan
                        </p>

                        <div className="grid grid-cols-3 xl:grid-cols-1 gap-2 mt-4">
                          <button
                            onClick={() =>
                              updateStatusLocal(subscriptionId, "Active")
                            }
                            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-semibold text-sm"
                          >
                            Activate
                          </button>

                          <button
                            onClick={() =>
                              updateStatusLocal(subscriptionId, "Paused")
                            }
                            className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-2xl font-semibold text-sm"
                          >
                            Pause
                          </button>

                          <button
                            onClick={() =>
                              updateStatusLocal(subscriptionId, "Stopped")
                            }
                            className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-semibold text-sm"
                          >
                            Stop
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, color = "green", icon = "🔁" }) {
  const styles = {
    green: "border-green-100 text-green-700 bg-white",
    emerald: "border-emerald-100 text-emerald-700 bg-white",
    yellow: "border-yellow-100 text-yellow-700 bg-white",
    red: "border-red-100 text-red-700 bg-white",
    blue: "border-blue-100 text-blue-700 bg-white",
  };

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 shadow-lg border ${styles[color] || styles.green}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs sm:text-sm">{title}</p>
          <h3 className="text-xl sm:text-3xl font-black mt-2 break-words">
            {value}
          </h3>
        </div>
        <div className="text-2xl sm:text-3xl shrink-0">{icon}</div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 text-center">

      <p className="text-[11px] sm:text-sm text-gray-500 font-medium">
        {label}
      </p>

      <h3 className="text-lg sm:text-xl font-bold text-slate-800 mt-2 break-words">
        {value}
      </h3>

    </div>
  );
}