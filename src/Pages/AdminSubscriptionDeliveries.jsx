import { useEffect, useMemo, useState } from "react";

import {
  getSubscriptionDeliveries,
  generateSubscriptionDeliveries,
  updateSubscriptionDeliveryStatus,
  bulkAssignSubscriptionDeliveries,
  getAutoAssignSetting,
  setAutoAssignSetting,
} from "../services/subscriptionDeliveryService";

import { getDeliveryBoys } from "../services/deliveryBoyService";

import AssignSubscriptionDeliveryBoyModal
  from "../Components/admin/AssignSubscriptionDeliveryBoyModal";

export default function AdminSubscriptionDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);

  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [selectedDelivery, setSelectedDelivery] =
    useState(null);

  const [assignOpen, setAssignOpen] =
    useState(false);

  const [selectedDeliveries, setSelectedDeliveries] =
    useState([]);

  const [selectedDeliveryBoy, setSelectedDeliveryBoy] =
    useState("");

  // Mobile delivery card expand/collapse state
  const [expandedId, setExpandedId] = useState(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
const [autoAssignLoading, setAutoAssignLoading] = useState(false);

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {
    loadDeliveries();
    loadDeliveryBoys();
    loadAutoAssignSetting();
  }, []);
  async function loadAutoAssignSetting() {
  try {
    const response = await getAutoAssignSetting();

    setAutoAssignEnabled(
      response?.enabled ?? true
    );
  } catch (err) {
    console.error(
      "Unable to load auto assign setting:",
      err
    );
  }
}
async function handleAutoAssignToggle() {
  try {
    setAutoAssignLoading(true);

    const newValue = !autoAssignEnabled;

    const response =
      await setAutoAssignSetting(newValue);

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Failed to update auto assignment."
      );
    }

    setAutoAssignEnabled(newValue);

  } catch (err) {
    console.error(
      "Auto Assign Toggle Error:",
      err
    );

    alert(
      err.message ||
        "Failed to update auto assignment."
    );
  } finally {
    setAutoAssignLoading(false);
  }
}

  async function loadDeliveries() {
    try {
      setLoading(true);

      const data =
        await getSubscriptionDeliveries();

      setDeliveries(data || []);
    } catch (err) {
      console.error(err);
      alert("Unable to load deliveries");
    } finally {
      setLoading(false);
    }
  }

  async function loadDeliveryBoys() {
    try {
      const data = await getDeliveryBoys();

      setDeliveryBoys(data || []);
    } catch (err) {
      console.error(
        "Unable to load delivery boys:",
        err
      );
    }
  }

  // ==========================================
  // GENERATE
  // ==========================================

  async function handleGenerate() {
    try {
      setLoading(true);

      const res =
        await generateSubscriptionDeliveries();

      alert(
        `Generated ${res.generated} Deliveries`
      );

      await loadDeliveries();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // STATUS
  // ==========================================

  async function handleStatusChange(id, newStatus) {
    try {
      await updateSubscriptionDeliveryStatus(
        id,
        newStatus
      );

      await loadDeliveries();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }
  async function handleSkipToday(delivery) {
  if (
    delivery.status === "Delivered" ||
    delivery.status === "Out for Delivery"
  ) {
    alert(
      "This delivery cannot be skipped because it is already delivered or out for delivery."
    );
    return;
  }

  const confirmed = window.confirm(
    `Skip today's delivery for ${
      delivery.customers?.full_name || "this customer"
    }?`
  );

  if (!confirmed) return;

  try {
    setLoading(true);

    await updateSubscriptionDeliveryStatus(
      delivery.id,
      "Skipped"
    );

    setSelectedDeliveries((previous) =>
      previous.filter((id) => id !== delivery.id)
    );

    await loadDeliveries();
  } catch (err) {
    console.error("Skip Delivery Error:", err);

    alert(
      err.message ||
        "Failed to skip today's delivery."
    );
  } finally {
    setLoading(false);
  }
}

async function handleRestoreToday(delivery) {
  if (delivery.status !== "Skipped") {
    return;
  }

  const confirmed = window.confirm(
    `Restore today's delivery for ${
      delivery.customers?.full_name || "this customer"
    }?`
  );

  if (!confirmed) return;

  try {
    setLoading(true);

    await updateSubscriptionDeliveryStatus(
      delivery.id,
      "Pending"
    );

    await loadDeliveries();
  } catch (err) {
    console.error(
      "Restore Delivery Error:",
      err
    );

    alert(
      err.message ||
        "Failed to restore today's delivery."
    );
  } finally {
    setLoading(false);
  }
}

  // ==========================================
  // FILTER
  // ==========================================

  const filtered = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return deliveries.filter((d) => {
      const text = `
        ${d.delivery_number || ""}
        ${d.customers?.full_name || ""}
        ${d.customers?.phone || ""}
        ${d.addresses?.area || ""}
      `.toLowerCase();

      return (
        text.includes(keyword) &&
        (status === "" || d.status === status)
      );
    });
  }, [deliveries, search, status]);

  // ==========================================
  // STATS
  // ==========================================

  const stats = useMemo(() => {
    return {
      total: filtered.length,

      pending: filtered.filter(
        (d) => d.status === "Pending"
      ).length,

      assigned: filtered.filter(
        (d) => d.status === "Assigned"
      ).length,

      delivered: filtered.filter(
        (d) => d.status === "Delivered"
      ).length,

      skipped: filtered.filter(
        (d) => d.status === "Skipped"
      ).length,
    };
  }, [filtered]);

  // ==========================================
  // SELECTABLE
  // ==========================================

  const isDeliverySelectable = (delivery) =>
    delivery.status !== "Delivered" &&
    delivery.status !== "Cancelled" &&
    delivery.status !== "Missed" &&
    delivery.status !== "Skipped";

  const selectableDeliveries =
    filtered.filter(isDeliverySelectable);

  const allSelected =
    selectableDeliveries.length > 0 &&
    selectableDeliveries.every(
      (delivery) =>
        selectedDeliveries.includes(delivery.id)
    );

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedDeliveries([]);
    } else {
      setSelectedDeliveries(
        selectableDeliveries.map(
          (delivery) => delivery.id
        )
      );
    }
  }

  function handleSelectAllAndAssign() {
    if (!selectableDeliveries.length) {
      alert("No deliveries are available to assign.");
      return;
    }

    if (allSelected) {
      setSelectedDeliveries([]);
      return;
    }

    setSelectedDeliveries(
      selectableDeliveries.map((delivery) => delivery.id)
    );
  }

  function toggleDeliverySelection(id) {
    setSelectedDeliveries((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (item) => item !== id
        );
      }

      return [...previous, id];
    });
  }

  // ==========================================
  // BULK ASSIGN
  // ==========================================

  async function handleBulkAssign() {
    if (selectedDeliveries.length === 0) {
      alert("Please select at least one delivery.");
      return;
    }

    if (!selectedDeliveryBoy) {
      alert("Please select a delivery boy.");
      return;
    }

    const boy = deliveryBoys.find(
      (item) =>
        item.id === selectedDeliveryBoy
    );

    const confirmed = window.confirm(
      `Assign ${selectedDeliveries.length} deliveries to ${boy?.full_name}?`
    );

    if (!confirmed) return;

    try {
      setAssigning(true);

      const response =
        await bulkAssignSubscriptionDeliveries(
          selectedDeliveries,
          selectedDeliveryBoy
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to assign deliveries."
        );
      }

      alert(
        `✅ ${selectedDeliveries.length} deliveries assigned to ${boy?.full_name}.`
      );

      setSelectedDeliveries([]);
      setSelectedDeliveryBoy("");

      await loadDeliveries();
    } catch (err) {
      console.error(
        "Bulk Assignment Error:",
        err
      );

      alert(
        err.message ||
          "Failed to assign deliveries."
      );
    } finally {
      setAssigning(false);
    }
  }

  function clearSelection() {
    setSelectedDeliveries([]);
    setSelectedDeliveryBoy("");
  }

  // ==========================================
  // STATUS STYLE
  // ==========================================

  function getStatusStyle(value) {
    switch (value) {
      case "Pending":
        return {
          badge:
            "bg-amber-100 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
        };

      case "Assigned":
        return {
          badge:
            "bg-blue-100 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
        };

      case "Out for Delivery":
        return {
          badge:
            "bg-purple-100 text-purple-700 border-purple-200",
          dot: "bg-purple-500",
        };

      case "Delivered":
        return {
          badge:
            "bg-green-100 text-green-700 border-green-200",
          dot: "bg-green-500",
        };

      case "Missed":
      case "Failed":
        return {
          badge:
            "bg-red-100 text-red-700 border-red-200",
          dot: "bg-red-500",
        };

      case "Cancelled":
        return {
          badge:
            "bg-gray-100 text-gray-600 border-gray-200",
          dot: "bg-gray-400",
        };
        case "Skipped":
        return {
          badge:
            "bg-orange-100 text-orange-700 border-orange-200",
          dot: "bg-orange-500",
        };

      default:
        return {
          badge:
            "bg-gray-100 text-gray-600 border-gray-200",
          dot: "bg-gray-400",
        };
    }
  }

  // ==========================================
  // DATE
  // ==========================================

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ==========================================
  // PRODUCT LIST
  // ==========================================

  function ProductItems({ delivery, mobile = false }) {
    const items =
      delivery.subscription_delivery_items || [];

    if (!items.length) {
      return (
        <span className="text-gray-400">
          No products
        </span>
      );
    }

    return (
      <div
        className={
          mobile
            ? "space-y-2"
            : "space-y-1.5"
        }
      >
        {items.map((item) => {
          const isExtra =
            item.is_extra === true;

          return (
            <div
              key={item.id}
              className={`
                flex items-center gap-2
                ${
                  isExtra
                    ? "rounded-xl border border-orange-200 bg-orange-50 px-3 py-2"
                    : ""
                }
              `}
            >
              <span className="text-lg">
                🥛
              </span>

              <span
                className={`
                  text-sm
                  ${
                    isExtra
                      ? "font-bold text-orange-900"
                      : "text-gray-800 font-medium"
                  }
                `}
              >
                {item.products?.name || "-"}
                {" • "}
                {item.quantity}
                {" × "}
                {item.size}
              </span>

              {isExtra && (
                <span className="ml-auto whitespace-nowrap rounded-full bg-orange-500 px-2 py-1 text-[10px] font-black text-white">
                  EXTRA
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ==========================================
  // ASSIGN BUTTON
  // ==========================================

  function openAssign(delivery) {
    setSelectedDelivery(delivery);
    setAssignOpen(true);
  }

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading && deliveries.length === 0) {
    return (
      <div className="min-h-screen bg-[#f4faf7] px-3 py-4 sm:px-6">
        <style>{`
          @keyframes ffShimmer {
            0% { background-position: -700px 0; }
            100% { background-position: 700px 0; }
          }
          .ff-skeleton {
            background: linear-gradient(90deg,#e5f0ea 25%,#f8fcfa 42%,#e5f0ea 60%);
            background-size: 900px 100%;
            animation: ffShimmer 1.1s ease-in-out infinite;
          }
        `}</style>
        <div className="mx-auto max-w-6xl">
          <div className="ff-skeleton h-36 rounded-[28px]" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1,2,3,4].map((n) => (
              <div key={n} className="ff-skeleton h-24 rounded-3xl" />
            ))}
          </div>
          <div className="ff-skeleton mt-4 h-20 rounded-3xl" />
          <div className="mt-4 space-y-3">
            {[1,2,3].map((n) => (
              <div key={n} className="ff-skeleton h-44 rounded-[26px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-900">
      <style>{`
        @keyframes ffFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ffHeader {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ffPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: .65; }
        }
        .ff-enter { animation: ffFadeUp .32s ease-out both; }
        .ff-header { animation: ffHeader .35s ease-out both; }
        .ff-dot { animation: ffPulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ff-enter,.ff-header,.ff-dot { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-5 lg:px-6">
        {/* BRAND HEADER */}
        <header className="ff-header overflow-hidden rounded-[28px] bg-gradient-to-br from-[#063d2b] via-[#087646] to-[#10a968] p-4 text-white shadow-[0_18px_45px_rgba(6,61,43,.16)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg sm:h-16 sm:w-16">
                <img
                  src="/logo.png"
                  alt="Farm Fresh Dairy"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-emerald-100">
                  Farm Fresh Dairy
                </p>
                <h1 className="truncate text-xl font-black sm:text-3xl">
                  Today&apos;s Deliveries
                </h1>
                <p className="mt-0.5 text-xs text-emerald-50/85 sm:text-sm">
                  Manage, assign and update milk deliveries
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

  <button
    onClick={handleAutoAssignToggle}
    disabled={autoAssignLoading}
    className={`
      px-5 py-3.5
      rounded-2xl
      font-black
      transition-all
      active:scale-95
      border
      ${
        autoAssignEnabled
          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
      }
    `}
  >
    {autoAssignLoading
      ? "⏳ Updating..."
      : autoAssignEnabled
      ? "🟢 Auto Assign: ON"
      : "⚪ Auto Assign: OFF"}
  </button>

  <button
    onClick={handleGenerate}
    disabled={loading}
    className="
      px-5 sm:px-6 py-3.5
      rounded-2xl
      bg-green-600
      hover:bg-green-700
      active:scale-95
      text-white
      font-black
      shadow-lg shadow-green-600/20
      transition-all duration-200
      disabled:bg-gray-400
      disabled:shadow-none
    "
  >
    {loading
      ? "⏳ Generating..."
      : "⚡ Generate Today's Deliveries"}
  </button>

</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <HeaderStat label="Total" value={stats.total} icon="📦" />
            <HeaderStat label="Pending" value={stats.pending} icon="🟠" />
            <HeaderStat label="Assigned" value={stats.assigned} icon="🔵" />
            <HeaderStat label="Delivered" value={stats.delivered} icon="✅" />
          </div>
        </header>

        {/* MOBILE-FRIENDLY FILTER */}
        <section className="ff-enter mt-3 rounded-[24px] border border-emerald-100 bg-white/95 p-3 shadow-[0_10px_30px_rgba(15,23,42,.07)] backdrop-blur-xl sm:mt-5 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>
              <input
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                placeholder="Search customer, phone, area or delivery no."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-48"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Missed">Missed</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Skipped">Skipped</option>
            </select>
          </div>

          {(search || status) && (
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                }}
                className="text-xs font-black text-emerald-700"
              >
                Clear
              </button>
            </div>
          )}
        </section>

        {/* MOBILE BULK CONTROLS */}
        {selectableDeliveries.length > 0 && (
          <section className="ff-enter mt-3 md:hidden">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAllAndAssign}
                className={`min-h-11 flex-1 rounded-2xl px-3 text-xs font-black active:scale-[.97] ${
                  allSelected
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "bg-slate-950 text-white shadow-lg"
                }`}
              >
                {allSelected
                  ? "✓ Deselect All"
                  : `☑ Select All (${selectableDeliveries.length})`}
              </button>

              {selectedDeliveries.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("ff-mobile-assign")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                  className="min-h-11 flex-1 rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white shadow-lg active:scale-[.97]"
                >
                  🚚 Assign {selectedDeliveries.length}
                </button>
              )}
            </div>
          </section>
        )}

        {selectedDeliveries.length > 0 && (
          <section
            id="ff-mobile-assign"
            className="ff-enter mt-3 rounded-[26px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm md:hidden"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-emerald-900">
                  🚚 Assign selected deliveries
                </p>
                <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                  {selectedDeliveries.length} selected
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-500 active:scale-95"
              >
                Clear
              </button>
            </div>

            <select
              value={selectedDeliveryBoy}
              onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Select Delivery Boy</option>
              {deliveryBoys.map((boy) => (
                <option key={boy.id} value={boy.id}>
                  {boy.full_name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={assigning || !selectedDeliveryBoy}
              className="mt-3 min-h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-black text-white shadow-lg shadow-emerald-200 active:scale-[.98] disabled:opacity-40"
            >
              {assigning
                ? `⏳ Assigning ${selectedDeliveries.length}...`
                : `🚚 Assign All ${selectedDeliveries.length}`}
            </button>
          </section>
        )}

        {/* MOBILE DELIVERY CARDS */}
        <main className="mt-4 space-y-3 md:hidden">
          {filtered.length === 0 && <EmptyState />}

          {filtered.map((delivery, index) => {
            const selectable = isDeliverySelectable(delivery);
            const checked = selectedDeliveries.includes(delivery.id);
            const statusStyle = getStatusStyle(delivery.status);
            const expanded = expandedId === delivery.id;

            return (
              <article
                key={delivery.id}
                className="ff-enter overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_25px_rgba(15,23,42,.06)]"
                style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
              >
                {/* Always-visible summary */}
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedId((current) =>
                      current === delivery.id ? null : delivery.id
                    )
                  }
                  className="flex min-h-[94px] w-full items-center gap-3 p-3 text-left active:bg-slate-50"
                >
                  {selectable ? (
                    <span
                      role="checkbox"
                      aria-checked={checked}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDeliverySelection(delivery.id);
                      }}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 text-sm font-black ${
                        checked
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-300"
                      }`}
                    >
                      {checked ? "✓" : "☐"}
                    </span>
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                      —
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {delivery.delivery_number || "Delivery"}
                      </p>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${statusStyle.badge}`}
                      >
                        <span
                          className={`ff-dot h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                        />
                        {delivery.status}
                      </span>
                    </div>

                    <h2 className="mt-1 truncate text-base font-black text-slate-900">
                      {delivery.customers?.full_name || "-"}
                    </h2>

                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                      📍 {delivery.addresses?.area || "-"} ·{" "}
                      {formatDate(delivery.delivery_date)}
                    </p>
                  </div>

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-transform duration-300 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {/* Expandable details */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="border-t border-slate-100 p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <InfoTile
                          icon="📞"
                          label="Phone"
                          value={delivery.customers?.phone || "-"}
                        />
                        <InfoTile
                          icon="🚚"
                          label="Delivery Boy"
                          value={
                            delivery.delivery_boys?.full_name ||
                            "Not Assigned"
                          }
                        />
                      </div>

                      <div className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[.15em] text-emerald-700">
                            Products
                          </p>
                          <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-emerald-700 shadow-sm">
                            🥛 Milk
                          </span>
                        </div>
                        <ProductItems delivery={delivery} mobile />
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {selectable && (
                          <button
                            type="button"
                            onClick={() => toggleDeliverySelection(delivery.id)}
                            className={`min-h-11 rounded-2xl text-xs font-black active:scale-[.97] ${
                              checked
                                ? "bg-emerald-600 text-white"
                                : "border border-slate-200 bg-white text-slate-700"
                            }`}
                          >
                            {checked ? "✓ Selected" : "☐ Select"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openAssign(delivery)}
                          className="min-h-11 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-sm active:scale-[.97]"
                        >
                          🚚 Assign
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {delivery.status === "Assigned" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                delivery.id,
                                "Out for Delivery"
                              )
                            }
                            className="min-h-11 rounded-2xl border border-purple-200 bg-purple-50 px-2 text-xs font-black text-purple-700 active:scale-[.97]"
                          >
                            🚚 Out for Delivery
                          </button>
                        )}

                        {delivery.status === "Out for Delivery" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(delivery.id, "Delivered")
                            }
                            className="min-h-11 rounded-2xl border border-emerald-200 bg-emerald-50 px-2 text-xs font-black text-emerald-700 active:scale-[.97]"
                          >
                            ✓ Delivered
                          </button>
                        )}

                        {(delivery.status === "Pending" ||
                          delivery.status === "Assigned") && (
                          <button
                            type="button"
                            onClick={() => handleSkipToday(delivery)}
                            className="min-h-11 rounded-2xl border border-orange-200 bg-orange-50 px-2 text-xs font-black text-orange-700 active:scale-[.97]"
                          >
                            ⏭ Skip Today
                          </button>
                        )}

                        {delivery.status === "Skipped" && (
                          <button
                            type="button"
                            onClick={() => handleRestoreToday(delivery)}
                            className="min-h-11 rounded-2xl border border-emerald-200 bg-emerald-50 px-2 text-xs font-black text-emerald-700 active:scale-[.97]"
                          >
                            ↩ Restore Today
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </main>

        {/* DESKTOP TABLE */}
        <section className="mt-5 hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm md:block">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px]">
                <thead className="bg-gradient-to-r from-[#087346] to-[#0a8b52] text-white">
                  <tr>
                    <th className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-5 w-5 cursor-pointer accent-emerald-600"
                      />
                    </th>
                    {[
                      "Delivery No",
                      "Customer",
                      "Phone",
                      "Area",
                      "Delivery Boy",
                      "Date",
                      "Products",
                      "Status",
                      "Action",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-4 py-4 text-left text-xs font-black uppercase tracking-wide"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((delivery, index) => {
                    const selectable = isDeliverySelectable(delivery);
                    const checked = selectedDeliveries.includes(delivery.id);
                    const statusStyle = getStatusStyle(delivery.status);

                    return (
                      <tr
                        key={delivery.id}
                        className={`ff-enter border-b border-slate-100 transition hover:bg-emerald-50/40 ${
                          checked ? "bg-emerald-50" : ""
                        }`}
                        style={{ animationDelay: `${Math.min(index * 20, 260)}ms` }}
                      >
                        <td className="px-4 py-4 text-center">
                          {selectable ? (
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDeliverySelection(delivery.id)}
                              className="h-5 w-5 cursor-pointer accent-emerald-600"
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4 font-black">
                          {delivery.delivery_number || "-"}
                        </td>
                        <td className="px-4 py-4 font-black">
                          {delivery.customers?.full_name || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {delivery.customers?.phone || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {delivery.addresses?.area || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold">
                            {delivery.delivery_boys?.full_name ||
                              "Not Assigned"}
                          </div>
                          {delivery.delivery_boys && (
                            <div className="mt-1 text-xs font-bold text-emerald-600">
                              ✓ Assigned
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {formatDate(delivery.delivery_date)}
                        </td>
                        <td className="min-w-[260px] px-4 py-4">
                          <ProductItems delivery={delivery} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-black ${statusStyle.badge}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${statusStyle.dot}`}
                            />
                            {delivery.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openAssign(delivery)}
                              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 active:scale-95"
                            >
                              Assign
                            </button>

                            {(delivery.status === "Pending" ||
                              delivery.status === "Assigned") && (
                              <button
                                type="button"
                                onClick={() => handleSkipToday(delivery)}
                                className="rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 active:scale-95"
                              >
                                ⏭ Skip
                              </button>
                            )}

                            {delivery.status === "Skipped" && (
                              <button
                                type="button"
                                onClick={() => handleRestoreToday(delivery)}
                                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 active:scale-95"
                              >
                                ↩ Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <AssignSubscriptionDeliveryBoyModal
        open={assignOpen}
        delivery={selectedDelivery}
        onClose={() => {
          setAssignOpen(false);
          setSelectedDelivery(null);
        }}
        onAssigned={loadDeliveries}
      />
    </div>
  );
}

function HeaderStat({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-100">
          {label}
        </p>
        <span className="text-sm">{icon}</span>
      </div>
      <p className="mt-0.5 text-xl font-black">{value}</p>
    </div>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5">
        <span>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-1 truncate text-xs font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-emerald-50 p-3">
        <img
          src="/logo.png"
          alt="Farm Fresh Dairy"
          className="h-full w-full object-contain"
        />
      </div>
      <h2 className="mt-5 text-xl font-black text-slate-800 sm:text-2xl">
        No Deliveries Found
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Try changing your search or status filter.
      </p>
    </div>
  );
}
