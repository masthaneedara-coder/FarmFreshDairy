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
 const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  async function loadSubscriptions() {
  try {
    setLoading(true);

    console.log("Loading started");

    const data = await getAllSubscriptions();
    console.log("API Data:", data);

data.forEach((sub) => {
  if (sub.is_paused === true) {
    console.log("🟡 PAUSED CUSTOMER:", {
      customer: sub.customerName,
      status: sub.status,
      is_paused: sub.is_paused,
      pause_from: sub.pause_from,
      pause_to: sub.pause_to,
    });
  }
});

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


// =====================================
// Display Subscription Status
// =====================================
const getDisplayStatus = (sub) => {
  if (sub.is_paused === true) {
    return "Paused";
  }

  const status = String(sub.status || "")
    .trim()
    .toLowerCase();

  if (status === "active") {
    return "Active";
  }

  if (status === "paused") {
    return "Paused";
  }

  if (status === "stopped") {
    return "Stopped";
  }

  if (status === "expired") {
    return "Expired";
  }

  return sub.status || "Unknown";
};

const filteredSubscriptions = subscriptions.filter((subscription) => {
  const displayStatus = getDisplayStatus(subscription);

  const matchesSearch =
    `${subscription.customerName || ""} ${
      subscription.phone || ""
    } ${subscription.product || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

  const matchesStatus =
  statusFilter === "All" ||
  displayStatus === statusFilter;

  return matchesSearch && matchesStatus;
});

const stats = useMemo(() => {
  const total = subscriptions.length;

  const activeCount = subscriptions.filter(
    (s) =>
      String(s.status || "").trim().toLowerCase() === "active" &&
      s.is_paused !== true
  ).length;

  const pausedCount = subscriptions.filter(
    (s) => s.is_paused === true
  ).length;

  const stoppedCount = subscriptions.filter(
    (s) =>
      String(s.status || "").trim().toLowerCase() === "stopped"
  ).length;

  const monthlyRevenue = subscriptions.reduce(
    (sum, sub) => {
      // Do not count paused subscriptions
      if (sub.is_paused === true) {
        return sum;
      }

      const status = String(sub.status || "")
        .trim()
        .toLowerCase();

      if (status !== "active") {
        return sum;
      }

      return (
        sum +
        Number(
          sub.monthlyAmount ||
            sub.price ||
            sub.amount ||
            0
        )
      );
    },
    0
  );

  return {
    total,
    active: activeCount,
    paused: pausedCount,
    stopped: stoppedCount,
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

 const updateStatusLocal = async (subscriptionId, newStatus) => {
  try {
    setUpdating(true);

    console.log(
      "Updating subscription:",
      subscriptionId,
      newStatus
    );

    await updateSubscriptionStatus(
      subscriptionId,
      newStatus
    );

    await loadSubscriptions();

  } catch (error) {
    console.error(
      "Update subscription status error:",
      error
    );

    alert(
      error?.message ||
      "Unable to update subscription"
    );
  } finally {
    setUpdating(false);
  }
};

  const getRemainingDays = (expireDate) => {
    if (!expireDate) return null;

    const today = new Date();
    const expiry = new Date(expireDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return Math.max(
      0,
      Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
  };

  const isExpired = (expireDate) => {
    if (!expireDate) return false;

    const today = new Date();
    const expiry = new Date(expireDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return today > expiry;
  };

  return (
    <AdminLayout title="Subscriptions">
      <div className="space-y-5 sm:space-y-6">

        {/* HERO */}
        <div className="rounded-[26px] sm:rounded-[30px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 p-4 sm:p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-white/80 text-xs sm:text-sm font-semibold">
                ADMIN SUBSCRIPTION CONTROL
              </p>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">
                🔁 Subscription Management
              </h1>
              <p className="text-white/90 mt-2 text-sm">
                Manage customer plans, validity, payments and delivery status.
              </p>
            </div>

            <button
              onClick={loadSubscriptions}
              disabled={loading}
              className="w-full lg:w-auto px-5 py-3 rounded-2xl bg-white text-green-700 font-black shadow-lg hover:shadow-xl active:scale-95 transition disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto] gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wide text-slate-500 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Customer, phone or product"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wide text-slate-500 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Stopped">Stopped</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadSubscriptions}
                className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black shadow active:scale-95 transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-10 text-center">
            <div className="text-5xl mb-3 animate-pulse">⏳</div>
            <p className="text-lg font-bold text-slate-600">
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
              Try changing the search or status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredSubscriptions.map((sub, index) => {
              const expireDate = sub.expireDate || sub.endDate;
              const remainingDays = getRemainingDays(expireDate);
              const expired = isExpired(expireDate);

              const displayStatus = expired
                ? "Expired"
                : getDisplayStatus(sub);

              const statusStyle = getStatusStyle(displayStatus);
              const subscriptionId =
                sub.subscriptionId || sub.id || `SUB-${index + 1}`;

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

              const paymentStatus = String(
                sub.payment_status ||
                sub.paymentStatus ||
                sub.payment_status_name ||
                "Pending"
              );

              const paymentMethod =
                sub.payment_method ||
                sub.paymentMethod ||
                "N/A";

              const paymentAmount =
                sub.payment_amount ??
                sub.paymentAmount ??
                sub.total_amount ??
                sub.totalAmount ??
                monthlyAmount;

              const paymentDate =
                sub.payment_date ||
                sub.paymentDate ||
                null;

              const paymentReference =
                sub.payment_reference ||
                sub.paymentReference ||
                sub.razorpay_payment_id ||
                sub.razorpayPaymentId ||
                "N/A";

              return (
                <div
                  key={subscriptionId}
                  className="bg-white rounded-[28px] shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition"
                >
                  {/* CARD HEADER */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-green-50 via-white to-emerald-50 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black text-green-700 break-words">
                            {sub.customerName || sub.name || "Customer"}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black ${statusStyle.badge}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${statusStyle.dot}`}
                            />
                            {displayStatus}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-500 mt-2 break-all">
                          Subscription ID: {subscriptionId}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-4 shadow-lg">
                        <p className="text-[11px] font-bold text-white/75 uppercase tracking-wide">
                          Monthly Amount
                        </p>
                        <p className="text-2xl font-black mt-1">
                          {formatMoney(monthlyAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">

                    {/* CUSTOMER / PLAN */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <MiniInfo label="Phone" value={sub.phone || sub.mobile || "-"} />
                      <MiniInfo label="Product" value={sub.product || "-"} />
                      <MiniInfo label="Quantity" value={sub.qty || "-"} />
                      <MiniInfo label="Delivery" value={sub.deliveryType || "-"} />
                    </div>

                    {/* ADDRESS */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                        Delivery Address
                      </p>
                      <p className="text-sm sm:text-base font-bold text-slate-800 mt-1 break-words">
                        {sub.address || "-"}
                      </p>
                    </div>

                    {/* DATES */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      <MiniInfo
                        label="Start Date"
                        value={formatDate(sub.startDate || sub.date)}
                      />
                      <MiniInfo
                        label="Expire Date"
                        value={formatDate(expireDate)}
                      />
                      <MiniInfo label="Area" value={sub.area || "-"} />
                    </div>

                    {/* VALIDITY */}
                    <div
                      className={`rounded-2xl border p-4 ${
                        expired
                          ? "border-red-200 bg-red-50"
                          : remainingDays !== null && remainingDays <= 7
                          ? "border-orange-200 bg-orange-50"
                          : "border-green-100 bg-green-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm text-xl ${
                              expired ? "text-red-600" : "text-green-700"
                            }`}
                          >
                            {expired ? "⚠️" : "📅"}
                          </div>

                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                              Subscription Validity
                            </p>

                            <p
                              className={`text-xl sm:text-2xl font-black mt-1 ${
                                expired
                                  ? "text-red-700"
                                  : remainingDays !== null && remainingDays <= 7
                                  ? "text-orange-700"
                                  : "text-green-700"
                              }`}
                            >
                              {expired
                                ? "Expired"
                                : remainingDays === null
                                ? "Validity Not Available"
                                : `${remainingDays} ${
                                    remainingDays === 1 ? "Day" : "Days"
                                  } Remaining`}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-black ${
                            expired
                              ? "bg-red-100 text-red-700"
                              : remainingDays !== null && remainingDays <= 7
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {expired ? "EXPIRED" : "VALID"}
                        </span>
                      </div>

                      {!expired &&
                        remainingDays !== null &&
                        remainingDays <= 7 && (
                          <p className="text-sm font-bold text-orange-700 mt-3">
                            🟠 Renewal required soon.
                          </p>
                        )}
                    </div>

                    {/* PAYMENT */}
                    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-blue-500">
                            Billing
                          </p>
                          <h3 className="text-lg sm:text-xl font-black text-blue-700">
                            💳 Payment Information
                          </h3>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black ${
                            paymentStatus.toLowerCase() === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {paymentStatus.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <MiniInfo label="Payment Method" value={paymentMethod} />
                        <MiniInfo
                          label="Amount"
                          value={formatMoney(paymentAmount)}
                        />
                        <MiniInfo
                          label="Payment Date"
                          value={
                            paymentDate ? formatDate(paymentDate) : "Not Paid Yet"
                          }
                        />
                        <MiniInfo
                          label="Reference"
                          value={paymentReference}
                          breakAll
                        />
                      </div>
                    </div>

                    {/* PAUSE INFORMATION */}
                    {sub.is_paused === true && (
                      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">⏸️</span>
                          <div>
                            <p className="font-black text-yellow-800">
                              Subscription Paused
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Pause period:{" "}
                              <span className="font-bold">
                                {formatDate(sub.pause_from || sub.pauseFrom)}
                              </span>
                              {" → "}
                              <span className="font-bold">
                                {formatDate(sub.pause_to || sub.pauseTo)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DELIVERY SUMMARY */}
                    <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-indigo-500">
                            Delivery Tracking
                          </p>
                          <h3 className="text-lg sm:text-xl font-black text-indigo-700">
                            🚚 Delivery Summary
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <SummaryBox label="Delivered" value={summary.delivered} icon="✅" />
                        <SummaryBox label="Out for Delivery" value={summary.outForDelivery} icon="🚚" />
                        <SummaryBox label="Pending" value={summary.pending} icon="⏳" />
                        <SummaryBox label="Missed" value={summary.missed} icon="❌" />
                      </div>
                    </div>

                    {/* ADMIN ACTIONS */}
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                            Admin Controls
                          </p>
                          <h3 className="text-lg sm:text-xl font-black text-slate-800 mt-1">
                            Subscription Status
                          </h3>
                        </div>

                        <span className="text-xs font-bold text-slate-500">
                          {displayStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                        <button
                          onClick={() =>
                            updateStatusLocal(subscriptionId, "Active")
                          }
                          disabled={updating}
                          className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3.5 font-black shadow active:scale-95 transition disabled:opacity-60"
                        >
                          {updating ? "Updating..." : "✅ Activate"}
                        </button>

                        <button
                          onClick={() =>
                            updateStatusLocal(subscriptionId, "Paused")
                          }
                          disabled={updating}
                          className="w-full rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-white py-3.5 font-black shadow active:scale-95 transition disabled:opacity-60"
                        >
                          ⏸️ Pause
                        </button>

                        <button
                          onClick={() =>
                            updateStatusLocal(subscriptionId, "Stopped")
                          }
                          disabled={updating}
                          className="w-full rounded-2xl bg-red-500 hover:bg-red-600 text-white py-3.5 font-black shadow active:scale-95 transition disabled:opacity-60"
                        >
                          ⛔ Stop
                        </button>
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

function MiniInfo({ label, value, breakAll = false }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 min-w-0">
      <p className="text-[10px] sm:text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={`text-sm sm:text-base font-black text-slate-800 mt-1 ${
          breakAll ? "break-all" : "break-words"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryBox({ label, value, icon }) {
  return (
    <div className="rounded-2xl bg-white border border-indigo-100 p-3 sm:p-4 text-center">
      <div className="text-lg sm:text-xl">{icon}</div>
      <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
        {value ?? 0}
      </p>
    </div>
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