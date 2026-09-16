import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../Components/AdminLayout";
import { getAllCustomers } from "../services/adminCustomerService";
import { useNavigate } from "react-router-dom";

const CUSTOMERS_PER_PAGE = 10;

function getCustomerSubscriptionStatus(customer) {
  if (Number(customer.pausedSubscriptions || 0) > 0) return "Paused";
  if (Number(customer.activeSubscriptions || 0) > 0) return "Active";
  return "None";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  const value = String(name || "Customer").trim();
  if (!value) return "CU";

  const parts = value.split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : value.slice(0, 2).toUpperCase();
}

function StatCard({ title, value, icon, tone, delay }) {
  const tones = {
    green: "from-emerald-50 to-green-100 text-emerald-700 border-emerald-100",
    blue: "from-blue-50 to-indigo-100 text-blue-700 border-blue-100",
    purple: "from-purple-50 to-fuchsia-100 text-purple-700 border-purple-100",
    orange: "from-orange-50 to-amber-100 text-orange-700 border-orange-100",
  };

  return (
    <div
      className={`customer-stat group rounded-3xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        tones[tone] || tones.green
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide opacity-70">
            {title}
          </p>
          <p className="mt-2 truncate text-2xl font-black sm:text-3xl">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {icon} {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-slate-200" />
        <div className="flex-1">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-24 rounded bg-slate-100" />
          <div className="mt-3 h-6 w-40 rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-16 rounded-2xl bg-slate-100" />
        ))}
      </div>

      <div className="mt-4 h-16 rounded-2xl bg-slate-100" />
      <div className="mt-3 h-11 rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function AdminCustomers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: CUSTOMERS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  async function loadCustomers(showRefresh = false, page = currentPage) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getAllCustomers({
        page,
        limit: CUSTOMERS_PER_PAGE,
        search,
        filter: filterType,
      });

      setCustomers(Array.isArray(data?.customers) ? data.customers : []);

      setPagination(
        data?.pagination || {
          page,
          limit: CUSTOMERS_PER_PAGE,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (error) {
      console.error("Load Customers Error:", error);
      setCustomers([]);
      setPagination({
        page: 1,
        limit: CUSTOMERS_PER_PAGE,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCustomers(false, currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  useEffect(() => {
    if (currentPage === 1) {
      loadCustomers(false, 1);
    }
  }, [search, filterType]);

  const filteredCustomers = customers;

  const totalPages = Number(pagination.totalPages || 0);

  const startIndex =
    ((Number(pagination.page || currentPage) - 1) *
      CUSTOMERS_PER_PAGE);

  const paginatedCustomers = customers;

  const stats = useMemo(() => {
    return {
      totalCustomers: customers.length,
      orderedCustomers: customers.filter(
        (customer) => Number(customer.totalOrders || 0) > 0
      ).length,
      subscribedCustomers: customers.filter(
        (customer) => Number(customer.totalSubscriptions || 0) > 0
      ).length,
      activeSubscribers: customers.filter(
        (customer) => Number(customer.activeSubscriptions || 0) > 0
      ).length,
      pausedSubscribers: customers.filter(
        (customer) => Number(customer.pausedSubscriptions || 0) > 0
      ).length,
      totalRevenue: customers.reduce(
        (sum, customer) => sum + Number(customer.totalSpent || 0),
        0
      ),
    };
  }, [customers]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }, [currentPage, totalPages]);

  return (
    <AdminLayout title="Customers">
      <style>{`
        @keyframes customersPageIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes customersHeroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes customersStatIn {
          from { opacity: 0; transform: translateY(18px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes customersCardIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes customersPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(.72); opacity: .55; }
        }

        @keyframes customersSpin {
          to { transform: rotate(360deg); }
        }

        .customers-page {
          animation: customersPageIn .45s ease-out both;
        }

        .customers-hero {
          animation: customersHeroFloat 6s ease-in-out infinite;
        }

        .customer-stat {
          animation: customersStatIn .5s ease-out both;
        }

        .customer-card {
          animation: customersCardIn .5s ease-out both;
        }

        .customer-status-dot {
          animation: customersPulse 2s ease-in-out infinite;
        }

        .customer-refresh-spin {
          animation: customersSpin .8s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .customers-page,
          .customers-hero,
          .customer-stat,
          .customer-card,
          .customer-status-dot,
          .customer-refresh-spin {
            animation: none !important;
          }
        }
      `}</style>

      <div className="customers-page mx-auto w-full space-y-5 pb-8 sm:space-y-6">
        {/* HERO */}
        <section className="customers-hero relative overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-900 via-green-700 to-emerald-500 p-5 text-white shadow-xl sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-1/3 top-1/2 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/70">
                Farm Fresh Admin
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                👥 Customers
              </h1>

              <p className="mt-2 max-w-xl text-sm font-medium text-white/85 sm:text-base">
                Manage customers, orders, subscriptions and spending in one
                place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadCustomers(true, currentPage)}
              disabled={loading || refreshing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-emerald-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <span className={refreshing ? "customer-refresh-spin" : ""}>
                🔄
              </span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Customers"
            value={stats.totalCustomers}
            icon="👥"
            tone="green"
            delay={0}
          />
          <StatCard
            title="Ordered"
            value={stats.orderedCustomers}
            icon="📦"
            tone="blue"
            delay={70}
          />
          <StatCard
            title="Subscribed"
            value={stats.subscribedCustomers}
            icon="🥛"
            tone="purple"
            delay={140}
          />
          <StatCard
            title="Active"
            value={stats.activeSubscribers}
            icon="✅"
            tone="green"
            delay={210}
          />
          <StatCard
            title="Paused"
            value={stats.pausedSubscribers}
            icon="⏸️"
            tone="orange"
            delay={280}
          />
          <StatCard
            title="Revenue"
            value={formatMoney(stats.totalRevenue)}
            icon="💰"
            tone="green"
            delay={350}
          />
        </section>

        {/* SEARCH / FILTER */}
        <section className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_250px_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Search Customer
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name / phone / area"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Customer Type
              </label>

              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 sm:text-base"
              >
                <option value="All">All Customers</option>
                <option value="Subscribed">Subscribed</option>
                <option value="Only Orders">Only Orders</option>
                <option value="Active Subscription">Active Subscription</option>
                <option value="Paused Subscription">Paused Subscription</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilterType("All");
              }}
              className="h-[50px] rounded-2xl bg-emerald-600 px-5 font-black text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95"
            >
              Clear
            </button>
          </div>

          {!loading && (
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-500">
                Showing{" "}
                <span className="font-black text-slate-900">
                  {pagination.total}
                </span>{" "}
                customers
              </p>

              {search || filterType !== "All" ? (
                <p className="font-semibold text-emerald-600">
                  Filters active
                </p>
              ) : (
                <p className="text-slate-400">All customers</p>
              )}
            </div>
          )}
        </section>

        {/* CUSTOMER LIST */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <CustomerSkeleton key={item} />
            ))}
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <section className="rounded-[28px] border border-slate-100 bg-white p-10 text-center shadow-sm">
            <div className="text-6xl">👥</div>
            <h2 className="mt-4 text-xl font-black text-slate-800 sm:text-2xl">
              No customers found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or customer type filter.
            </p>
          </section>
        ) : (
          <div className="grid gap-4">
            {paginatedCustomers.map((customer, index) => {
              const subscriptionStatus =
                getCustomerSubscriptionStatus(customer);

              const statusClasses =
                subscriptionStatus === "Active"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : subscriptionStatus === "Paused"
                  ? "bg-orange-50 border-orange-200 text-orange-700"
                  : "bg-slate-50 border-slate-200 text-slate-600";

              return (
                <article
                  key={customer.id || `${customer.phone}-${index}`}
                  className="customer-card group rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-xl sm:p-5"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {/* HEADER */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-200 text-lg font-black text-emerald-700 shadow-inner sm:h-16 sm:w-16 sm:text-xl">
                        {getInitials(customer.name)}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black text-slate-900 sm:text-xl">
                          {customer.name || "Customer"}
                        </h2>

                        <p className="mt-1 text-sm font-medium text-slate-500">
                          📱 {customer.phone || "-"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${statusClasses}`}
                          >
                            <span
                              className={`customer-status-dot h-2 w-2 rounded-full ${
                                subscriptionStatus === "Active"
                                  ? "bg-emerald-500"
                                  : subscriptionStatus === "Paused"
                                  ? "bg-orange-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {subscriptionStatus}
                          </span>

                          {Number(customer.totalSubscriptions || 0) > 0 && (
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-700">
                              🥛 Subscriber
                            </span>
                          )}

                          {Number(customer.totalOrders || 0) > 0 && (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                              📦 Customer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full shrink-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 px-4 py-3 text-white shadow-lg sm:w-auto sm:min-w-[145px]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                        Total Spent
                      </p>
                      <p className="mt-1 text-xl font-black sm:text-2xl">
                        {formatMoney(customer.totalSpent)}
                      </p>
                    </div>
                  </div>

                  {/* SUMMARY */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                    <InfoBox label="Area" value={customer.area || "-"} icon="📍" />
                    <InfoBox
                      label="Orders"
                      value={customer.totalOrders || 0}
                      icon="📦"
                    />
                    <InfoBox
                      label="Plans"
                      value={customer.totalSubscriptions || 0}
                      icon="🥛"
                    />
                    <InfoBox
                      label="Active"
                      value={customer.activeSubscriptions || 0}
                      icon="✅"
                    />
                    <InfoBox
                      label="Paused"
                      value={customer.pausedSubscriptions || 0}
                      icon="⏸️"
                    />
                  </div>

                  {/* SUBSCRIPTION */}
                  {customer.latestSubscription && (
                    <div
                      className={`mt-4 rounded-2xl border p-4 ${
                        subscriptionStatus === "Paused"
                          ? "border-orange-200 bg-orange-50"
                          : subscriptionStatus === "Active"
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Current Subscription
                          </p>

                          <p className="mt-1 font-black text-slate-900">
                            {subscriptionStatus === "Paused"
                              ? "⏸️ Subscription Paused"
                              : subscriptionStatus === "Active"
                              ? "🟢 Subscription Active"
                              : "Subscription Inactive"}
                          </p>
                        </div>

                        {subscriptionStatus === "Paused" && (
                          <p className="text-xs font-bold text-orange-700 sm:text-sm">
                            {formatDate(customer.latestSubscription.pause_from)}
                            {" → "}
                            {formatDate(customer.latestSubscription.pause_to)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ADDRESS */}
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      📍 Address
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800 sm:text-base">
                      {customer.address || "-"}
                    </p>
                  </div>

                  {/* TIMELINE */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Latest Order
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {formatDate(customer.latestOrderDate)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Latest Subscription
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {formatDate(customer.latestSubscriptionDate)}
                      </p>
                    </div>
                  </div>

                  {/* ACTION */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/admin/customers/${customer.id}`)
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-black text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[.98]"
                  >
                    👁 View Customer Details
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && pagination.total > 0 && totalPages > 1 && (
          <section className="rounded-[26px] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm font-semibold text-slate-500">
                Showing{" "}
                <span className="font-black text-slate-900">
                  {startIndex + 1}
                </span>{" "}
                –{" "}
                <span className="font-black text-slate-900">
                  {Math.min(
                    startIndex + customers.length,
                    Number(pagination.total || 0)
                  )}
                </span>{" "}
                of{" "}
                <span className="font-black text-slate-900">
                  {pagination.total}
                </span>
              </p>

              <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white text-lg font-black transition-all hover:border-emerald-200 hover:bg-emerald-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ‹
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 shrink-0 rounded-xl text-sm font-black transition-all active:scale-90 ${
                      currentPage === page
                        ? "scale-105 bg-emerald-600 text-white shadow-md"
                        : "bg-slate-50 text-slate-700 hover:bg-emerald-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-white text-lg font-black transition-all hover:border-emerald-200 hover:bg-emerald-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
