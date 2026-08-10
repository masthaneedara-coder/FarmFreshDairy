import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../Components/AdminLayout";
import { getAllCustomers } from "../services/adminCustomerService";
import { useNavigate } from "react-router-dom";

// ==========================================
// Customer Subscription Status
// ==========================================
function getCustomerSubscriptionStatus(customer) {
  if (customer.pausedSubscriptions > 0) {
    return "Paused";
  }

  if (customer.activeSubscriptions > 0) {
    return "Active";
  }

  return "None";
}

export default function AdminCustomers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  // ==========================================
  // Load Customers
  // ==========================================
  async function loadCustomers() {
    try {
      setLoading(true);

      const data = await getAllCustomers();

      console.log("Customers:", data);

      setCustomers(data || []);
    } catch (err) {
      console.error("Load Customers Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  // ==========================================
  // Filter Customers
  // ==========================================
  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();

    return customers.filter((customer) => {
      const name = String(
        customer.name || ""
      ).toLowerCase();

      const phone = String(
        customer.phone || ""
      ).toLowerCase();

      const area = String(
        customer.area || ""
      ).toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        phone.includes(q) ||
        area.includes(q);

      const matchesType =
        filterType === "All" ||

        (
          filterType === "Subscribed" &&
          customer.totalSubscriptions > 0
        ) ||

        (
          filterType === "Only Orders" &&
          customer.totalOrders > 0 &&
          customer.totalSubscriptions === 0
        ) ||

        (
          filterType === "Active Subscription" &&
          customer.activeSubscriptions > 0
        ) ||

        (
          filterType === "Paused Subscription" &&
          customer.pausedSubscriptions > 0
        );

      return matchesSearch && matchesType;
    });
  }, [customers, search, filterType]);

  // ==========================================
  // Statistics
  // ==========================================
  const stats = useMemo(() => {
    const totalCustomers = customers.length;

    const orderedCustomers =
      customers.filter(
        (c) => c.totalOrders > 0
      ).length;

    const subscribedCustomers =
      customers.filter(
        (c) => c.totalSubscriptions > 0
      ).length;

    const activeSubscribers =
      customers.filter(
        (c) => c.activeSubscriptions > 0
      ).length;

    const pausedSubscribers =
      customers.filter(
        (c) => c.pausedSubscriptions > 0
      ).length;

    const totalRevenue =
      customers.reduce(
        (sum, c) =>
          sum + Number(c.totalSpent || 0),
        0
      );

    return {
      totalCustomers,
      orderedCustomers,
      subscribedCustomers,
      activeSubscribers,
      pausedSubscribers,
      totalRevenue,
    };
  }, [customers]);

  // ==========================================
  // Money
  // ==========================================
  const formatMoney = (value) => {
    const num = Number(value || 0);

    if (Number.isNaN(num)) {
      return "₹0";
    }

    return `₹${num.toLocaleString("en-IN")}`;
  };

  // ==========================================
  // Date
  // ==========================================
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout title="Customers">

      <div className="space-y-5 sm:space-y-6">

        {/* ==========================================
            HERO
        ========================================== */}
        <div className="rounded-[26px] sm:rounded-[30px] bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 p-4 sm:p-6 text-white shadow-xl">

          <div className="flex flex-col gap-4">

            <div>

              <p className="text-white/80 text-xs sm:text-sm">
                Admin Customer Control
              </p>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
                👥 Customers Management
              </h1>

              <p className="text-white/90 mt-2 text-sm sm:text-base">
                View customer orders, subscriptions,
                spending and subscription status.
              </p>

            </div>

            <div className="grid grid-cols-2 sm:flex gap-3">

              <button
                onClick={loadCustomers}
                disabled={loading}
                className="px-4 py-3 rounded-2xl bg-white text-emerald-700 font-bold shadow text-sm sm:text-base disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Refresh Customers"}
              </button>

            </div>

          </div>

        </div>

        {/* ==========================================
            STATS
        ========================================== */}
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 sm:gap-4">

          <StatCard
            title="Customers"
            value={stats.totalCustomers}
            color="green"
            icon="👥"
          />

          <StatCard
            title="Ordered"
            value={stats.orderedCustomers}
            color="blue"
            icon="📦"
          />

          <StatCard
            title="Subscribed"
            value={stats.subscribedCustomers}
            color="purple"
            icon="🥛"
          />

          <StatCard
            title="Active"
            value={stats.activeSubscribers}
            color="emerald"
            icon="✅"
          />

          <StatCard
            title="Paused"
            value={stats.pausedSubscribers}
            color="orange"
            icon="⏸️"
          />

          <StatCard
            title="Revenue"
            value={formatMoney(stats.totalRevenue)}
            color="orange"
            icon="💰"
          />

        </div>

        {/* ==========================================
            FILTERS
        ========================================== */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-4 sm:p-5">

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto] gap-4">

            <div>

              <label className="block text-sm font-bold text-slate-700 mb-2">
                Search Customer
              </label>

              <input
                type="text"
                placeholder="Search by name / phone / area"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              />

            </div>

            <div>

              <label className="block text-sm font-bold text-slate-700 mb-2">
                Customer Type
              </label>

              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value)
                }
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              >

                <option value="All">
                  All
                </option>

                <option value="Subscribed">
                  Subscribed
                </option>

                <option value="Only Orders">
                  Only Orders
                </option>

                <option value="Active Subscription">
                  Active Subscription
                </option>

                <option value="Paused Subscription">
                  Paused Subscription
                </option>

              </select>

            </div>

            <div className="flex items-end">

              <button
                onClick={loadCustomers}
                className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-bold shadow"
              >
                Refresh
              </button>

            </div>

          </div>

        </div>

        {/* ==========================================
            CONTENT
        ========================================== */}

        {loading ? (

          <div className="bg-slate-50 rounded-3xl p-10 text-center">

            <div className="text-5xl mb-3 animate-pulse">
              ⏳
            </div>

            <p className="text-lg font-semibold text-slate-600">
              Loading customers...
            </p>

          </div>

        ) : filteredCustomers.length === 0 ? (

          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-10 text-center">

            <div className="text-6xl mb-4">
              👥
            </div>

            <h2 className="text-2xl font-black text-slate-700">
              No customers found
            </h2>

            <p className="text-slate-500 mt-2">
              Try changing search or customer type filter.
            </p>

          </div>

        ) : (

          <div className="grid gap-4">

            {filteredCustomers.map(
              (customer, index) => {

                const subscriptionStatus =
                  getCustomerSubscriptionStatus(
                    customer
                  );

                return (

                  <div
                    key={customer.id || index}
                    className="bg-white rounded-3xl shadow-md border border-slate-100 p-4 sm:p-5 hover:shadow-xl transition"
                  >

                    <div className="flex flex-col gap-4">

                      {/* ==========================================
                          TOP
                      ========================================== */}

                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                        <div className="flex items-start gap-4 min-w-0">

                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0">
                            👤
                          </div>

                          <div className="min-w-0">

                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 break-words">
                              {customer.name || "Customer"}
                            </h2>

                            <p className="text-slate-500 mt-1 break-all">
                              {customer.phone || "-"}
                            </p>

                            {/* ==========================================
                                BADGES
                            ========================================== */}

                            <div className="flex flex-wrap gap-2 mt-3">

                              {subscriptionStatus === "Paused" && (

                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700 border border-orange-200">
                                  ⏸️ Paused Subscriber
                                </span>

                              )}

                              {subscriptionStatus === "Active" && (

                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 border border-green-200">
                                  🟢 Active Subscriber
                                </span>

                              )}

                              {customer.totalSubscriptions > 0 && (

                                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs sm:text-sm font-bold border border-purple-200">
                                  Subscription Customer
                                </span>

                              )}

                              {customer.totalOrders > 0 && (

                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold border border-blue-200">
                                  Ordered Customer
                                </span>

                              )}

                            </div>

                          </div>

                        </div>

                        {/* TOTAL SPENT */}

                        <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-4 shadow w-full sm:w-auto">

                          <p className="text-xs sm:text-sm text-white/80">
                            Total Spent
                          </p>

                          <h3 className="text-2xl font-black mt-1">
                            {formatMoney(
                              customer.totalSpent
                            )}
                          </h3>

                        </div>

                      </div>

                      {/* ==========================================
                          CUSTOMER SUMMARY
                      ========================================== */}

                      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">

                        <InfoBox
                          label="Area"
                          value={
                            customer.area || "-"
                          }
                        />

                        <InfoBox
                          label="Orders"
                          value={
                            customer.totalOrders || 0
                          }
                        />

                        <InfoBox
                          label="Subscriptions"
                          value={
                            customer.totalSubscriptions || 0
                          }
                        />

                        <InfoBox
                          label="Active Plans"
                          value={
                            customer.activeSubscriptions || 0
                          }
                        />

                        <InfoBox
                          label="Paused Plans"
                          value={
                            customer.pausedSubscriptions || 0
                          }
                        />

                      </div>

                      {/* ==========================================
                          CURRENT SUBSCRIPTION STATUS
                      ========================================== */}

                      {customer.latestSubscription && (

                        <div
                          className={`rounded-2xl p-4 border ${
                            subscriptionStatus === "Paused"
                              ? "bg-orange-50 border-orange-200"
                              : subscriptionStatus === "Active"
                              ? "bg-green-50 border-green-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <div>

                              <p className="text-sm font-medium text-slate-500">
                                Current Subscription
                              </p>

                              <p className="font-bold text-slate-800 mt-1">
                                {subscriptionStatus ===
                                "Paused"
                                  ? "⏸️ Subscription Paused"
                                  : subscriptionStatus ===
                                    "Active"
                                  ? "🟢 Subscription Active"
                                  : "No Active Subscription"}
                              </p>

                            </div>

                            {subscriptionStatus ===
                              "Paused" && (

                              <div className="text-sm text-orange-700 font-semibold">

                                Pause:
                                {" "}
                                {formatDate(
                                  customer.latestSubscription
                                    .pause_from
                                )}

                                {" → "}

                                {formatDate(
                                  customer.latestSubscription
                                    .pause_to
                                )}

                              </div>

                            )}

                          </div>

                        </div>

                      )}

                      {/* ==========================================
                          ADDRESS
                      ========================================== */}

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                        <p className="text-sm text-slate-500 font-medium">
                          Address
                        </p>

                        <p className="text-slate-800 font-semibold mt-1 break-words">
                          {customer.address || "-"}
                        </p>

                      </div>

                      {/* ==========================================
                          TIMELINE
                      ========================================== */}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                          <p className="text-sm text-slate-500 font-medium">
                            Latest Order
                          </p>

                          <p className="text-slate-800 font-bold mt-1">
                            {formatDate(
                              customer.latestOrderDate
                            )}
                          </p>

                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                          <p className="text-sm text-slate-500 font-medium">
                            Latest Subscription
                          </p>

                          <p className="text-slate-800 font-bold mt-1">
                            {formatDate(
                              customer.latestSubscriptionDate
                            )}
                          </p>

                        </div>

                      </div>

                      {/* ==========================================
                          ACTIONS
                      ========================================== */}

                      <div className="flex justify-end mt-5">

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/customers/${customer.id}`
                            )
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-bold"
                        >
                          👁 View Details
                        </button>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

    </AdminLayout>
  );
}

// ==========================================
// Stat Card
// ==========================================
function StatCard({
  title,
  value,
  color = "green",
  icon = "👥",
}) {

  const styles = {
    green:
      "border-green-100 text-green-700 bg-white",

    blue:
      "border-blue-100 text-blue-700 bg-white",

    purple:
      "border-purple-100 text-purple-700 bg-white",

    emerald:
      "border-emerald-100 text-emerald-700 bg-white",

    orange:
      "border-orange-100 text-orange-700 bg-white",
  };

  return (

    <div
      className={`rounded-3xl p-4 sm:p-5 shadow-lg border ${
        styles[color] || styles.green
      }`}
    >

      <div className="flex items-start justify-between gap-2">

        <div className="min-w-0">

          <p className="text-slate-500 text-xs sm:text-sm">
            {title}
          </p>

          <h3 className="text-xl sm:text-3xl font-black mt-2 break-words">
            {value}
          </h3>

        </div>

        <div className="text-2xl sm:text-3xl shrink-0">
          {icon}
        </div>

      </div>

    </div>
  );
}

// ==========================================
// Info Box
// ==========================================
function InfoBox({ label, value }) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-4 min-w-0">

      <p className="text-xs sm:text-sm text-slate-500 font-medium">
        {label}
      </p>

      <h3 className="text-sm sm:text-lg font-black text-slate-800 mt-1 break-words">
        {value}
      </h3>

    </div>

  );
}