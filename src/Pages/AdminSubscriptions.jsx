import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../Components/AdminLayout";

import {
  getAllSubscriptions,
  updateSubscriptionStatus,
  getDeliverySummary
} from "../services/adminSubscriptionService";
import {
  createSubscriptionRenewalLink,
} from "../config/api";


export default function AdminSubscriptions() {
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [deliverySummary, setDeliverySummary] =  useState({});
  const [loading, setLoading] = useState(true);
 const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Accordion: keep one customer expanded at a time.
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState(null);

  // Performance: only render/load summaries for the visible page.
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  async function loadSubscriptions() {
  try {
    setLoading(true);

    const data = await getAllSubscriptions();

    setSubscriptions(Array.isArray(data) ? data : []);
    setDeliverySummary({});
    setCurrentPage(1);
  } catch (err) {
    console.error("Load subscriptions error:", err);
    setSubscriptions([]);
  } finally {
    setLoading(false);
  }
}

async function loadPageDeliverySummaries(pageSubscriptions) {
  const idsToLoad = pageSubscriptions
    .map((sub) => sub.subscriptionId || sub.id)
    .filter(Boolean)
    .filter((id) => !deliverySummary[id]);

  if (!idsToLoad.length) return;

  try {
    const results = await Promise.all(
      idsToLoad.map(async (subscriptionId) => {
        try {
          const summary = await getDeliverySummary(subscriptionId);
          return [subscriptionId, summary];
        } catch (error) {
          console.error("Delivery Summary Error:", subscriptionId, error);
          return [
            subscriptionId,
            {
              delivered: 0,
              outForDelivery: 0,
              pending: 0,
              missed: 0,
              total: 0
            }
          ];
        }
      })
    );

    setDeliverySummary((prev) => {
      const next = { ...prev };
      results.forEach(([id, summary]) => {
        next[id] = summary;
      });
      return next;
    });
  } catch (error) {
    console.error("Page delivery summaries error:", error);
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

const filteredSubscriptions = useMemo(() => {
  const searchText = search.trim().toLowerCase();

  return subscriptions.filter((subscription) => {
    const displayStatus = getDisplayStatus(subscription);

    const matchesSearch =
      !searchText ||
      `${subscription.customerName || ""} ${
        subscription.phone || ""
      } ${subscription.product || ""}`
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      displayStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });
}, [subscriptions, search, statusFilter]);

const totalPages = Math.max(
  1,
  Math.ceil(filteredSubscriptions.length / PAGE_SIZE)
);

const visibleSubscriptions = useMemo(() => {
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  return filteredSubscriptions.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );
}, [filteredSubscriptions, currentPage]);

useEffect(() => {
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

useEffect(() => {
  if (!loading && visibleSubscriptions.length > 0) {
    loadPageDeliverySummaries(visibleSubscriptions);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading, currentPage, visibleSubscriptions]);

useEffect(() => {
  setCurrentPage(1);
}, [search, statusFilter]);

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

  // Active, non-paused subscriptions expiring today through the next 5 days.
  const expiringSoonSubscriptions = subscriptions.filter((sub) => {
    const remainingDays = getRemainingDays(sub.expireDate || sub.endDate);
    return getDisplayStatus(sub) === "Active" && sub.is_paused !== true && remainingDays !== null && remainingDays >= 0 && remainingDays <= 5;
  });

  // WhatsApp requires the admin to press Send in each chat. Browsers may block bulk tabs.
  const openBulkWhatsAppReminders = () => {
    const eligible = expiringSoonSubscriptions.filter((sub) =>
      String(sub.phone || sub.mobile || "").replace(/\D/g, "").length >= 10
    );
    if (!eligible.length) {
      alert("No customers with valid phone numbers are expiring within the next 5 days.");
      return;
    }
    if (!window.confirm(`Open WhatsApp reminders for ${eligible.length} customer(s)? You must press Send in each WhatsApp chat.`)) return;
    eligible.forEach((sub, index) => {
      const rawPhone = String(sub.phone || sub.mobile || "").replace(/\D/g, "");
      const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
      const name = sub.customerName || sub.name || "Customer";
      const expiry = formatDate(sub.expireDate || sub.endDate);
      const days = getRemainingDays(sub.expireDate || sub.endDate);
      const message = `Dear ${name},\n\nThis is a friendly reminder that your FarmFreshDairy subscription will expire ${days === 0 ? "today" : `in ${days} day(s)`}, on ${expiry}.\n\nKindly renew your subscription to ensure uninterrupted fresh milk delivery.\n\nThank you for choosing FarmFreshDairy! 🥛\n\nBest regards,\nFarmFreshDairy Team`;
      window.setTimeout(() => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"), index * 350);
    });
  };

  const openWhatsAppReminder = (sub, expired = false) => {
    const rawPhone = String(sub.phone || sub.mobile || "").replace(/\D/g, "");
    if (!rawPhone) {
      alert("Customer phone number is not available.");
      return;
    }

    // WhatsApp requires country code. Add India's 91 when a 10-digit number is stored.
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const customerName = sub.customerName || sub.name || "Customer";
    const expiry = formatDate(sub.expireDate || sub.endDate);
    const message = expired
      ? `Dear ${customerName},\n\nThis is a friendly reminder that your FarmFreshDairy subscription expired on ${expiry}.\n\nKindly renew your subscription to resume your fresh milk deliveries.\n\nThank you for choosing FarmFreshDairy! 🥛\n\nBest regards,\nFarmFreshDairy Team`
      : `Dear ${customerName},\n\nThis is a friendly reminder that your FarmFreshDairy subscription will expire in ${getRemainingDays(sub.expireDate || sub.endDate)} days, on ${expiry}.\n\nKindly renew your subscription to ensure uninterrupted fresh milk delivery.\n\nThank you for choosing FarmFreshDairy! 🥛\n\nBest regards,\nFarmFreshDairy Team`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const isExpired = (expireDate) => {
    if (!expireDate) return false;

    const today = new Date();
    const expiry = new Date(expireDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return today > expiry;
  };
  const handleSendRenewalLink = async (sub) => {
  try {
    const rawPhone = String(
      sub.phone || ""
    ).replace(/\D/g, "");

    if (!rawPhone) {
      alert(
        "Customer phone number is not available."
      );
      return;
    }

    const result =
      await createSubscriptionRenewalLink(
        sub.subscriptionId || sub.id
      );

    if (!result?.renewalUrl) {
      throw new Error(
        "Renewal link was not created."
      );
    }

    const phone =
      rawPhone.length === 10
        ? `91${rawPhone}`
        : rawPhone;

    const customerName =
      sub.customerName ||
      sub.name ||
      "Customer";

    const amount = Number(
      sub.monthlyAmount ||
      sub.totalAmount ||
      sub.total_amount ||
      0
    );

    const message =
      `Dear ${customerName},\n\n` +
      `Your FarmFreshDairy subscription is ready for renewal. 🥛\n\n` +
      `Renewal Amount: ₹${amount.toLocaleString("en-IN")}\n\n` +
      `👉 Renew your subscription here:\n` +
      `${result.renewalUrl}\n\n` +
      `Please open the link and click "Renew Subscription".\n\n` +
      `Thank you for choosing FarmFreshDairy! 🥛\n\n` +
      `FarmFreshDairy Team`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener,noreferrer"
    );

  } catch (err) {
    console.error(
      "Renewal link error:",
      err
    );

    alert(
      err?.message ||
        "Unable to create renewal link."
    );
  }
};

  return (
    <AdminLayout title="Subscriptions">
      <style>{`
        @keyframes subscriptionCardIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .subscription-admin-card {
          animation: subscriptionCardIn .45s ease both;
        }

        @media (max-width: 640px) {
          .subscription-admin-card {
            border-radius: 18px;
          }

          .subscription-admin-card button {
            min-height: 40px;
          }
        }

        @media (max-width: 420px) {
          .subscription-admin-card {
            border-radius: 16px;
          }
        }

        @keyframes detailPop {
          from { opacity: 0; transform: translateY(-8px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes softFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .subscription-detail-shell {
          background:
            radial-gradient(circle at 100% 0%, rgba(16,185,129,.07), transparent 30%),
            linear-gradient(180deg, #f8fffb 0%, #ffffff 38%, #f8fafc 100%);
          border-top: 1px solid rgba(148,163,184,.12);
        }

        .subscription-detail-card {
          border-radius: 16px;
          border: 1px solid rgba(226,232,240,.9);
          background: rgba(255,255,255,.92);
          box-shadow: 0 5px 18px rgba(15,23,42,.045);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }

        .subscription-detail-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 9px 24px rgba(15,23,42,.07);
          border-color: rgba(16,185,129,.2);
        }

        .subscription-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 9px;
        }

        .subscription-section-kicker {
          font-size: 9px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .subscription-section-title {
          margin-top: 4px;
          font-size: 16px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -.025em;
        }

        .subscription-mobile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .subscription-action {
          min-height: 42px;
          border-radius: 12px !important;
          transition: transform .2s ease, box-shadow .2s ease, filter .2s ease !important;
        }

        .subscription-action:hover {
          transform: translateY(-2px);
          filter: saturate(1.05);
        }

        .subscription-action:active {
          transform: scale(.98);
        }

        .subscription-detail-card .text-2xl {
          line-height: 1.05;
        }

        @media (max-width: 640px) {
          .subscription-detail-shell {
            padding: 10px !important;
          }

          .subscription-detail-card {
            border-radius: 14px;
            box-shadow: 0 4px 14px rgba(15,23,42,.04);
          }

          .subscription-section-title {
            font-size: 14px;
          }

          .subscription-section-kicker {
            font-size: 8px;
          }

          .subscription-mobile-grid {
            gap: 6px;
          }

          .subscription-action {
            min-height: 40px;
            font-size: 11px !important;
          }
        }

        @media (max-width: 380px) {
          .subscription-mobile-grid {
            grid-template-columns: 1fr 1fr;
            gap: 5px;
          }

          .subscription-action {
            min-height: 38px;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
        }

        .subscription-admin-card .grid-rows-\[1fr\] > div {
          animation: detailPop .28s ease-out both;
        }

        @media (max-width: 640px) {
          .subscription-admin-card .grid {
            gap: 0.5rem;
          }

          .subscription-admin-card p {
            line-height: 1.3;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .subscription-admin-card,
          .subscription-admin-card .grid-rows-\[1fr\] > div {
            animation: none;
          }
        }
      `}</style>

      <div className="space-y-5 sm:space-y-6">

        {/* HERO */}
        <div className="rounded-[26px] sm:rounded-[30px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 p-4 sm:p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="shrink-0 rounded-2xl bg-white p-2 shadow-lg">
                <img
                  src="/farmfresh-logo.png"
                  alt="FarmFreshDairy logo"
                  className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-xl"
                />
              </div>
              <div className="min-w-0">
                <p className="text-white/80 text-xs sm:text-sm font-semibold">
                  FARMFRESHDAIRY • ADMIN SUBSCRIPTION CONTROL
                </p>
                <h1 className="text-2xl sm:text-3xl font-black mt-1">
                  🔁 Subscription Management
                </h1>
                <p className="text-white/90 mt-2 text-sm">
                  Manage customer plans, validity, payments and delivery status.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={openBulkWhatsAppReminders}
                disabled={loading || expiringSoonSubscriptions.length === 0}
                className="w-full lg:w-auto px-5 py-3 rounded-2xl bg-amber-300 text-green-950 font-black shadow-lg hover:bg-amber-200 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                💬 Send Expiry Reminders ({expiringSoonSubscriptions.length})
              </button>
              <button
                onClick={loadSubscriptions}
                disabled={loading}
                className="w-full lg:w-auto px-5 py-3 rounded-2xl bg-white text-green-700 font-black shadow-lg hover:shadow-xl active:scale-95 transition disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* BRANDED EXPIRY REMINDER NOTE */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-3xl border border-green-100 bg-white p-4 shadow-sm">
          <img
            src="/farmfresh-logo.png"
            alt="FarmFreshDairy logo"
            className="h-14 w-14 object-contain rounded-xl border border-green-100 bg-white p-1"
          />
          <div className="flex-1">
            <p className="font-black text-green-800">FarmFreshDairy Renewal Reminders</p>
            <p className="text-sm text-slate-600 mt-1">
              Send WhatsApp reminders to active customers whose subscriptions expire within the next 5 days.
              The logo is displayed here in the admin panel; the standard WhatsApp click-to-chat link sends text only.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 border border-green-100">Brand logo</span>
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
          <div className="space-y-3 sm:space-y-4">
            {visibleSubscriptions.map((sub, index) => {
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
                  className="subscription-admin-card bg-white rounded-[22px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* CARD HEADER */}
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 via-white to-emerald-50 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg sm:text-xl font-black text-green-700 break-words">
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

                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 break-all">
                          Subscription ID: {subscriptionId}
                        </p>

                        {(
                          sub.is_paused === true ||
                          displayStatus === "Paused"
                        ) && (
                          <div className="mt-2 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-yellow-800">
                            <span className="text-base">⏸️</span>
                            <span>Paused:</span>
                            <span className="font-black">
                              {formatDate(
                                sub.pause_from ||
                                sub.pauseFrom ||
                                sub.pauseStart ||
                                sub.pausedFrom
                              )}
                            </span>
                            <span>→</span>
                            <span className="font-black">
                              {formatDate(
                                sub.pause_to ||
                                sub.pauseTo ||
                                sub.pauseEnd ||
                                sub.pausedTo
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3.5 py-2.5 shadow-md">

                        <p className="text-[11px] font-bold text-white/75 uppercase tracking-wide">
                          Monthly Amount
                        </p>
                          <p className="text-lg sm:text-xl font-black mt-0.5">
                            {formatMoney(monthlyAmount)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSubscriptionId((current) =>
                              current === subscriptionId
                                ? null
                                : subscriptionId
                            )
                          }
                          className="group inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:scale-95"
                          aria-expanded={
                            expandedSubscriptionId === subscriptionId
                          }
                          aria-label={
                            expandedSubscriptionId === subscriptionId
                              ? "Collapse subscription details"
                              : "Expand subscription details"
                          }
                        >
                          <span
                            className={`text-lg transition-transform duration-300 ${
                              expandedSubscriptionId === subscriptionId
                                ? "rotate-180"
                                : "rotate-0"
                            }`}
                          >
                           ⌄
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-2.5 sm:px-5 ${
                      expandedSubscriptionId === subscriptionId
                        ? "border-b"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-slate-500">
                      <span className="font-bold">
                        {sub.product || "Milk Subscription"}
                      </span>
                      <span>•</span>
                      <span>{sub.phone || sub.mobile || "No phone"}</span>
                      {(sub.is_paused === true ||
                        displayStatus === "Paused") && (
                        <>
                          <span>•</span>
                          <span className="font-black text-yellow-700">
                            ⏸ Paused
                          </span>
                          <span>•</span>
                          <span className="font-bold text-yellow-700">
                            {formatDate(
                              sub.pause_from ||
                              sub.pauseFrom ||
                              sub.pauseStart ||
                              sub.pausedFrom
                            )}
                            {" → "}
                            {formatDate(
                              sub.pause_to ||
                              sub.pauseTo ||
                              sub.pauseEnd ||
                              sub.pausedTo
                            )}
                          </span>
                        </>
                      )}
                    </div>

                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wide text-slate-400">
                      {expandedSubscriptionId === subscriptionId
                        ? "Hide details"
                        : "View details"}
                    </span>
                  </div>

                  <div
                    className={`grid transition-all duration-500 ease-out ${
                      expandedSubscriptionId === subscriptionId
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="subscription-detail-shell min-h-0 overflow-hidden p-2.5 sm:p-3 space-y-2.5">

                    {/* CUSTOMER / PLAN */}
                    <div className="subscription-mobile-grid lg:grid-cols-4">
                      <MiniInfo label="Phone" value={sub.phone || sub.mobile || "-"} />
                      <MiniInfo label="Product" value={sub.product || "-"} />
                      <MiniInfo label="Quantity" value={sub.qty || "-"} />
                      <MiniInfo label="Delivery" value={sub.deliveryType || "-"} />
                    </div>

                    {/* ADDRESS */}
                    <div className="subscription-detail-card rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                      className={`rounded-xl border p-3 ${
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

                      {expired ? (
                        <button
                          type="button"
                          onClick={() => openWhatsAppReminder(sub, true)}
                          className="mt-4 w-full sm:w-auto rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-3 font-black shadow-md active:scale-95 transition"
                        >
                          💬 Send Expired Message on WhatsApp
                        </button>
                        
                      ) : remainingDays !== null && remainingDays >= 0 && remainingDays <= 5 && getDisplayStatus(sub) === "Active" ? (
                        <button
                          type="button"
                          onClick={() => openWhatsAppReminder(sub, false)}
                          className="mt-4 w-full sm:w-auto rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 font-black shadow-md active:scale-95 transition"
                        >
                          💬 Send 5-Day Renewal Reminder
                        </button>
                      ) : null}
                      <button
                          type="button"
                          onClick={() =>
                            handleSendRenewalLink(sub)
                          }
                          className="
                            mt-3
                            w-full
                            sm:w-auto
                            rounded-2xl
                            bg-green-600
                            px-5
                            py-3
                            font-black
                            text-white
                            shadow-md
                            transition
                            hover:bg-green-700
                            active:scale-95
                          "
                        >
                          🔗 Send Renewal Link on WhatsApp
                        </button>
                    </div>

                    {/* PAYMENT */}
                    <div className="subscription-detail-card rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-3.5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-blue-500">
                            Billing
                          </p>
                          <h3 className="text-base sm:text-lg font-black text-blue-700">
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

                      <div className="subscription-mobile-grid lg:grid-cols-4">
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
                    {(sub.is_paused === true ||
                      displayStatus === "Paused") && (
                      <div className="subscription-detail-card rounded-xl border border-yellow-200 bg-yellow-50 p-3">
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
                    <div className="subscription-detail-card rounded-2xl border border-indigo-100 bg-indigo-50 p-3 sm:p-3.5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-indigo-500">
                            Delivery Tracking
                          </p>
                          <h3 className="text-base sm:text-lg font-black text-indigo-700">
                            🚚 Delivery Summary
                          </h3>
                        </div>
                      </div>

                      <div className="subscription-mobile-grid sm:grid-cols-4">
                        <SummaryBox label="Delivered" value={summary.delivered} icon="✅" />
                        <SummaryBox label="Out for Delivery" value={summary.outForDelivery} icon="🚚" />
                        <SummaryBox label="Pending" value={summary.pending} icon="⏳" />
                        <SummaryBox label="Missed" value={summary.missed} icon="❌" />
                      </div>
                    </div>

                    {/* ADMIN ACTIONS */}
                    <div className="subscription-detail-card rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                            Admin Controls
                          </p>
                          <h3 className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
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
                </div>
              );
            })}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-3">
              <p className="text-sm font-semibold text-slate-500">
                Showing{" "}
                <span className="font-black text-slate-700">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                {" "}–{" "}
                <span className="font-black text-slate-700">
                  {Math.min(
                    currentPage * PAGE_SIZE,
                    filteredSubscriptions.length
                  )}
                </span>
                {" "}of{" "}
                <span className="font-black text-slate-700">
                  {filteredSubscriptions.length}
                </span>
                {" "}subscriptions
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-black text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  ← Previous
                </button>

                <span className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-black">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-black text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function MiniInfo({ label, value, breakAll = false }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-2.5 sm:p-3 min-w-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400 truncate">
        {label}
      </p>
      <p
        className={`text-xs sm:text-sm font-black text-slate-800 mt-0.5 leading-tight ${
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
    <div className="rounded-xl bg-white border border-indigo-100 p-2.5 sm:p-3 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-base sm:text-lg">{icon}</div>
      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5 truncate">
        {label}
      </p>
      <p className="text-lg sm:text-xl font-black text-slate-800 mt-0.5">
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