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
import { removeSubscription } from "../services/subscriptionService";


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
  const [deletingId, setDeletingId] = useState(null);

const handleDeleteSubscription = async (subscriptionId) => {
  const confirmed = window.confirm(
    "Delete this subscription permanently? This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    setDeletingId(subscriptionId);

    await removeSubscription(subscriptionId);

    // Refresh the list using your existing loading function.
    await loadSubscriptions();

    window.alert("Subscription deleted successfully.");
  } catch (error) {
    console.error("Delete subscription error:", error);
    window.alert(error.message || "Unable to delete subscription.");
  } finally {
    setDeletingId(null);
  }
};

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

 
const getSubscriptionValidity = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return {
      text: "Validity Not Available",
      remainingDays: null,
      progressPercent: 0,
      expired: false,
      upcoming: false,
    };
  }

  const parseDate = (value) => {
    const dateString = String(value).slice(0, 10);
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!start || !end || end < start) {
    return {
      text: "Validity Not Available",
      remainingDays: null,
      progressPercent: 0,
      expired: false,
      upcoming: false,
    };
  }

  const DAY = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor((end - start) / DAY) + 1;

  if (today < start) {
    const daysUntilStart = Math.ceil((start - today) / DAY);

    return {
      text: `Starts in ${daysUntilStart} ${
        daysUntilStart === 1 ? "Day" : "Days"
      }`,
      remainingDays: null,
      progressPercent: 0,
      expired: false,
      upcoming: true,
    };
  }

  if (today > end) {
    return {
      text: "Subscription Expired",
      remainingDays: 0,
      progressPercent: 100,
      expired: true,
      upcoming: false,
    };
  }

  const remainingDays = Math.ceil((end - today) / DAY);
  const elapsedDays = Math.floor((today - start) / DAY);

  return {
    text: `${remainingDays} ${
      remainingDays === 1 ? "Day" : "Days"
    } Remaining`,
    remainingDays,
    progressPercent: Math.min(
      100,
      Math.max(0, (elapsedDays / totalDays) * 100)
    ),
    expired: false,
    upcoming: false,
  };
};
const getRemainingDays = (expireDate) => {
  if (!expireDate) return null;

  const dateValue = String(expireDate).slice(0, 10);
  const expiry = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(expiry.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.ceil(
      (expiry.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    )
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

        .subscription-compact-details {
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: rgba(255,255,255,.96);
        }
        .subscription-compact-details > summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-height: 38px;
          padding: 8px 10px;
          color: #334155;
          cursor: pointer;
          list-style: none;
          font-size: 11px;
          line-height: 1.25;
          font-weight: 850;
        }
        .subscription-compact-details > summary::-webkit-details-marker { display: none; }
        .subscription-compact-details > summary::after {
          content: "+";
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          width: 19px;
          height: 19px;
          border-radius: 7px;
          background: #f1f5f9;
          color: #047857;
          font-size: 14px;
          font-weight: 900;
        }
        .subscription-compact-details[open] > summary {
          border-bottom: 1px solid #eef2f7;
          background: #fbfefd;
        }
        .subscription-compact-details[open] > summary::after { content: "−"; }
        .subscription-compact-content { padding: 8px; }
        .subscription-mini-tag {
          display: inline-flex;
          align-items: center;
          max-width: 48%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #f8fafc;
          padding: 3px 7px;
          color: #475569;
          font-size: 9px;
          line-height: 1.2;
          font-weight: 800;
        }
        .subscription-detail-shell { padding: 8px !important; gap: 7px !important; }
        .subscription-detail-card { border-radius: 12px; }
        .subscription-detail-shell .subscription-mobile-grid { gap: 6px; }
        .subscription-detail-shell .subscription-mobile-grid > div { padding: 8px !important; border-radius: 10px; }
        .subscription-detail-shell .subscription-detail-card { padding: 9px !important; }
        .subscription-detail-shell .subscription-action { min-height: 36px; }
        .subscription-detail-shell button { min-height: 36px; }
        @media (max-width: 640px) {
          .subscription-compact-details > summary { min-height: 36px; padding: 7px 9px; font-size: 10px; }
          .subscription-compact-content { padding: 7px; }
          .subscription-mini-tag { max-width: 55%; font-size: 8px; padding: 2px 6px; }
          .subscription-detail-shell { padding: 7px !important; gap: 6px !important; }
          .subscription-detail-shell .subscription-mobile-grid > div { padding: 7px !important; }
          .subscription-detail-shell button { min-height: 34px; padding-top: 7px !important; padding-bottom: 7px !important; font-size: 10px !important; }
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
              
            const startDate =
              sub.startDate || sub.start_date || sub.date;

            const expireDate =
              sub.expireDate || sub.endDate || sub.end_date;

            const validity = getSubscriptionValidity(
              startDate,
              expireDate
            );

            const remainingDays = validity.remainingDays;
            const expired = validity.expired;
            const upcoming = validity.upcoming;


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

              // Normalize once in this subscription's map scope.
              const normalizedPaymentStatus = paymentStatus.trim().toLowerCase();
              const normalizedPaymentMethod = String(paymentMethod || "N/A")
                .trim()
                .toUpperCase();

              // Customer wallet balance is returned by the admin subscriptions API.
              // Inactive or missing wallets are displayed as zero.
              const rawWalletBalance = Number(
                sub.wallet_balance ?? sub.walletBalance ?? 0
              );
              const walletStatus = String(
                sub.wallet_status ?? sub.walletStatus ?? "Inactive"
              );
              const walletBalance =
                walletStatus === "Active" && Number.isFinite(rawWalletBalance)
                  ? rawWalletBalance
                  : 0;

              // The subscription creation flow initializes payment_amount to
              // the total even while payment_status is Pending. Therefore do
              // not treat payment_amount as money received unless payment is
              // verified as Paid. Explicit paid-amount fields take priority
              // when the API provides them (for genuine partial payments).
              const subscriptionTotalAmount = Math.max(
                0,
                Number(
                  sub.total_amount ??
                  sub.totalAmount ??
                  sub.monthlyAmount ??
                  sub.monthly_amount ??
                  sub.price ??
                  sub.amount ??
                  0
                ) || 0
              );

              const explicitPaidAmount =
                sub.paid_amount ??
                sub.paidAmount ??
                sub.amount_paid ??
                sub.amountPaid ??
                sub.received_amount ??
                sub.receivedAmount ??
                null;

              const paidAmountCandidate =
                explicitPaidAmount !== null && explicitPaidAmount !== undefined && explicitPaidAmount !== ""
                  ? Number(explicitPaidAmount)
                  : normalizedPaymentStatus === "paid"
                    ? Number(paymentAmount ?? subscriptionTotalAmount)
                    : 0;

              const paidAmount = Math.min(
                subscriptionTotalAmount,
                Math.max(0, Number.isFinite(paidAmountCandidate) ? paidAmountCandidate : 0)
              );

              const remainingAmount = Math.max(
                0,
                subscriptionTotalAmount - paidAmount
              );

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
                  <div className="p-2.5 sm:p-3 bg-gradient-to-r from-green-50 via-white to-emerald-50 border-b border-slate-100">
                    <div className="flex flex-row items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="text-sm sm:text-lg font-black text-green-700 break-words">
                            {sub.customerName || sub.name || "Customer"}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black ${statusStyle.badge}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                            />
                            {displayStatus}
                          </span>
                        </div>

                        <p className="hidden sm:block text-[8px] sm:text-[9px] text-slate-500 mt-0.5 break-all">
                          Subscription ID: {subscriptionId}
                        </p>

                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2.5 py-1.5 shadow-sm">

                        <p className="text-[8px] font-bold text-white/75 uppercase tracking-wide">
                          Monthly Amount
                        </p>
                          <p className="text-sm sm:text-base font-black mt-0.5">
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
                          className="group inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:scale-95"
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
                    className={`flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-3 py-1.5 sm:px-4 ${
                      expandedSubscriptionId === subscriptionId
                        ? "border-b"
                        : ""
                    }`}
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-1 text-[9px] sm:text-[10px] text-slate-500">
                      <span className="subscription-mini-tag">{sub.product || "Milk Subscription"}</span>
                      <span className="subscription-mini-tag">{sub.phone || sub.mobile || "No phone"}</span>
                      <span className="subscription-mini-tag">{normalizedPaymentMethod}</span>
                      <span className={`subscription-mini-tag ${normalizedPaymentStatus === "paid" ? "border-green-200 bg-green-50 text-green-700" : "border-orange-200 bg-orange-50 text-orange-700"}`}>{paymentStatus}</span>
                      {(sub.is_paused === true || displayStatus === "Paused") && (
                        <span className="subscription-mini-tag border-yellow-200 bg-yellow-50 text-yellow-700">⏸ Paused</span>
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
                    <div className="subscription-detail-shell min-h-0 overflow-hidden p-2 sm:p-2.5 space-y-2">

<details className="subscription-compact-details">
                      <summary><span>👤 Customer & delivery</span><span className="text-[9px] font-semibold text-slate-400">{sub.area || "View details"}</span></summary>
                      <div className="subscription-compact-content space-y-2">
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

                      </div>
                    </details>

<details className="subscription-compact-details">
                      <summary><span>📅 Validity & renewal</span><span className={`text-[9px] font-bold ${expired ? "text-red-600" : remainingDays !== null && remainingDays <= 7 ? "text-orange-600" : "text-green-700"}`}>{validity.text}</span></summary>
                      <div className="subscription-compact-content space-y-2">
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
                            className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-base ${
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
                              className={`text-base sm:text-lg font-black mt-0.5 ${
                                expired
                                  ? "text-red-700"
                                  : remainingDays !== null && remainingDays <= 7
                                  ? "text-orange-700"
                                  : "text-green-700"
                              }`}
                            >
                             {validity.text}
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
                          <p className="text-[10px] font-bold text-orange-700 mt-2">
                            🟠 Renewal required soon.
                          </p>
                        )}

                      {expired ? (
                        <button
                          type="button"
                          onClick={() => openWhatsAppReminder(sub, true)}
                          className="mt-2 w-full sm:w-auto rounded-xl bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-xs font-bold shadow-sm active:scale-95 transition"
                        >
                          💬 Send Expired Message on WhatsApp
                        </button>
                        
                      ) : remainingDays !== null && remainingDays >= 0 && remainingDays <= 5 && getDisplayStatus(sub) === "Active" ? (
                        <button
                          type="button"
                          onClick={() => openWhatsAppReminder(sub, false)}
                          className="mt-2 w-full sm:w-auto rounded-xl bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-xs font-bold shadow-sm active:scale-95 transition"
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
                            mt-2
                            w-full
                            sm:w-auto
                            rounded-xl
                            bg-green-600
                            px-3
                            py-2
                            text-xs
                            font-bold
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

                      </div>
                    </details>

<details className="subscription-compact-details">
                      <summary><span>💳 Payment</span><span className="flex flex-wrap items-center justify-end gap-1"><span className="subscription-mini-tag">{normalizedPaymentMethod}</span><span className={`subscription-mini-tag ${normalizedPaymentStatus === "paid" ? "border-green-200 bg-green-50 text-green-700" : "border-orange-200 bg-orange-50 text-orange-700"}`}>{paymentStatus}</span>{normalizedPaymentMethod === "ONLINE" && <span className={`subscription-mini-tag ${remainingAmount > 0 ? "border-orange-200 bg-orange-50 text-orange-700" : "border-green-200 bg-green-50 text-green-700"}`}>Due {formatMoney(remainingAmount)}</span>}<span className="subscription-mini-tag border-emerald-200 bg-emerald-50 text-emerald-700">Wallet {formatMoney(walletBalance)}</span></span></summary>
                      <div className="subscription-compact-content space-y-2">
                    {/* PAYMENT */}
                    <div className="subscription-detail-card rounded-xl border border-blue-100 bg-blue-50 p-2">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-blue-500">
                            Billing
                          </p>
                          <h3 className="text-sm sm:text-base font-black text-blue-700">
                            💳 Payment Information
                          </h3>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            normalizedPaymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {paymentStatus.toUpperCase()}
                        </span>
                      </div>

                      <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2">
                        <span className="text-[10px] font-bold text-emerald-800">Available wallet balance</span>
                        <strong className="text-xs font-black text-emerald-700">{formatMoney(walletBalance)}</strong>
                      </div>

                      {normalizedPaymentMethod === "ONLINE" ? (
                        <>
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="min-w-0 rounded-lg border border-blue-100 bg-white p-2">
                              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400">Total</p>
                              <p className="mt-1 break-words text-xs sm:text-sm font-black text-slate-800">{formatMoney(subscriptionTotalAmount)}</p>
                            </div>
                            <div className="min-w-0 rounded-lg border border-green-100 bg-white p-2">
                              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400">Paid</p>
                              <p className="mt-1 break-words text-xs sm:text-sm font-black text-green-700">{formatMoney(paidAmount)}</p>
                            </div>
                            <div className={`min-w-0 rounded-lg border p-2 ${remainingAmount > 0 ? "border-orange-100 bg-white" : "border-green-100 bg-green-50"}`}>
                              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-slate-400">Remaining</p>
                              <p className={`mt-1 break-words text-xs sm:text-sm font-black ${remainingAmount > 0 ? "text-orange-700" : "text-green-700"}`}>{formatMoney(remainingAmount)}</p>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-xs text-slate-500">
                            <span>Method: <strong className="text-slate-700">Online</strong></span>
                            <span>Payment date: <strong className="text-slate-700">{paymentDate ? formatDate(paymentDate) : "Not paid yet"}</strong></span>
                            {paymentReference !== "N/A" && (
                              <span className="min-w-0 break-all">Ref: <strong className="text-slate-700">{paymentReference}</strong></span>
                            )}
                          </div>
                          {remainingAmount > 0 && (
                            <p className="mt-2 rounded-lg bg-orange-50 px-2 py-1.5 text-[10px] font-bold text-orange-700">
                              Payment pending: {formatMoney(remainingAmount)} remaining.
                            </p>
                          )}
                          {remainingAmount === 0 && normalizedPaymentStatus === "paid" && (
                            <p className="mt-2 rounded-lg bg-green-50 px-2 py-1.5 text-[10px] font-bold text-green-700">
                              Payment completed — no balance due.
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="subscription-mobile-grid lg:grid-cols-4">
                          <MiniInfo label="Payment Method" value={paymentMethod} />
                          <MiniInfo label="Amount" value={formatMoney(paymentAmount)} />
                          <MiniInfo
                            label="Payment Date"
                            value={paymentDate ? formatDate(paymentDate) : "Not Paid Yet"}
                          />
                          <MiniInfo label="Reference" value={paymentReference} breakAll />
                        </div>
                      )}
                    </div>

                    

                      </div>
                    </details>

                    {/* PAUSE INFORMATION */}
                    {(sub.is_paused === true || displayStatus === "Paused") && (
                      <details className="subscription-compact-details">
                        <summary>
                          <span>⏸ Pause information</span>
                          <span className="text-[9px] font-semibold text-yellow-700">{formatDate(sub.pause_from || sub.pauseFrom)} → {formatDate(sub.pause_to || sub.pauseTo)}</span>
                        </summary>
                        <div className="subscription-compact-content text-[10px] font-semibold text-yellow-800">
                          Subscription paused from {formatDate(sub.pause_from || sub.pauseFrom)} to {formatDate(sub.pause_to || sub.pauseTo)}.
                        </div>
                      </details>
                    )}

<details className="subscription-compact-details">
                      <summary><span>🚚 Delivery summary</span><span className="text-[9px] font-semibold text-slate-400">Done {summary.delivered || 0} · Pending {summary.pending || 0}</span></summary>
                      <div className="subscription-compact-content space-y-2">
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

                      </div>
                    </details>

                    <details className="subscription-compact-details">
                      <summary><span>⚙️ Admin controls</span><span className="text-[9px] font-semibold text-slate-400">{displayStatus}</span></summary>
                      <div className="subscription-compact-content">
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateStatusLocal(subscriptionId, "Active")
                          }
                          disabled={updating}
                          className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white py-2.5 text-xs font-bold shadow-sm active:scale-95 transition disabled:opacity-60"
                        >
                          {updating ? "Updating..." : "✅ Activate"}
                        </button>

                        <button
                          onClick={() =>
                            updateStatusLocal(subscriptionId, "Paused")
                          }
                          disabled={updating}
                          className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 text-xs font-bold shadow-sm active:scale-95 transition disabled:opacity-60"
                        >
                          ⏸️ Pause
                        </button>

                        <button
                          onClick={() =>
                            updateStatusLocal(subscriptionId, "Stopped")
                          }
                          disabled={updating}
                          className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white py-2.5 text-xs font-bold shadow-sm active:scale-95 transition disabled:opacity-60"
                        >
                          ⛔ Stop
                        </button>
        

{["Stopped", "Expired", "Cancelled"].includes(displayStatus) && (
  <button
    type="button"
    onClick={() => handleDeleteSubscription(subscriptionId)}
    disabled={deletingId === subscriptionId}
    className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {deletingId === subscriptionId
      ? "Deleting..."
      : "🗑️ Delete Subscription"}
  </button>
)}
                      </div>
                    </div>
                  </div>
                    </details>
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
    <div className="rounded-lg bg-white border border-slate-200 p-2 sm:p-2.5 min-w-0 shadow-sm">
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
    <div className="rounded-lg bg-white border border-indigo-100 p-2 sm:p-2.5 text-center shadow-sm">
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

function getSubscriptionValidity(startDate, endDate) {
  if (!startDate || !endDate) {
    return {
      text: "Validity unavailable",
      remainingDays: null,
      progressPercent: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return {
      text: "Validity unavailable",
      remainingDays: null,
      progressPercent: 0,
    };
  }

  const DAY = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(
    1,
    Math.floor((end - start) / DAY) + 1
  );

  if (today < start) {
    const daysUntilStart = Math.ceil((start - today) / DAY);

    return {
      text: `Starts in ${daysUntilStart} ${
        daysUntilStart === 1 ? "Day" : "Days"
      }`,
      remainingDays: daysUntilStart,
      progressPercent: 0,
    };
  }

  if (today > end) {
    return {
      text: "Subscription Expired",
      remainingDays: 0,
      progressPercent: 100,
    };
  }

  const remainingDays = Math.ceil((end - today) / DAY);
  const elapsedDays = Math.max(
    0,
    Math.floor((today - start) / DAY)
  );

  return {
    text: `${remainingDays} ${
      remainingDays === 1 ? "Day" : "Days"
    } Remaining`,
    remainingDays,
    progressPercent: Math.min(
      100,
      Math.max(0, (elapsedDays / totalDays) * 100)
    ),
  };
}
