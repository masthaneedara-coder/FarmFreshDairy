import { useEffect, useMemo, useState } from "react";

import {
  getSubscriptionDeliveries,
  generateSubscriptionDeliveries,
  updateSubscriptionDeliveryStatus,
  bulkAssignSubscriptionDeliveries,
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

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {
    loadDeliveries();
    loadDeliveryBoys();
  }, []);

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
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">

        <style>{`
          @keyframes skeletonPulse {
            0%, 100% { opacity: .5; }
            50% { opacity: 1; }
          }

          .skeleton {
            animation: skeletonPulse 1.2s ease-in-out infinite;
          }
        `}</style>

        <div className="max-w-7xl mx-auto">

          <div className="h-9 w-72 bg-gray-200 rounded-xl skeleton" />

          <div className="h-5 w-56 bg-gray-200 rounded-lg mt-3 skeleton" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 bg-white rounded-3xl shadow-sm skeleton"
              />
            ))}

          </div>

          <div className="h-24 bg-white rounded-3xl mt-5 skeleton" />

          <div className="space-y-4 mt-5">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-52 bg-white rounded-3xl skeleton"
              />
            ))}

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6">

      <style>{`
        @keyframes deliveryFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes headerDrop {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes statusPulse {
          0%, 100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.08);
          }
        }

        .delivery-animation {
          animation: deliveryFadeUp .45s ease-out both;
        }

        .header-animation {
          animation: headerDrop .45s ease-out both;
        }

        .status-dot {
          animation: statusPulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="header-animation mb-5">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <span className="text-3xl sm:text-4xl">
                  🥛
                </span>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                  Subscription Deliveries
                </h1>

              </div>

              <p className="text-gray-500 text-sm sm:text-base mt-1">
                Manage Today's Milk Deliveries
              </p>

            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="
                w-full lg:w-auto
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

        {/* ==========================================
            STATS
        ========================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">

          <StatCard
            icon="📦"
            label="Total"
            value={stats.total}
            delay="0ms"
          />

          <StatCard
            icon="🟠"
            label="Pending"
            value={stats.pending}
            delay="60ms"
          />

          <StatCard
            icon="🔵"
            label="Assigned"
            value={stats.assigned}
            delay="120ms"
          />

          <StatCard
            icon="✅"
            label="Delivered"
            value={stats.delivered}
            delay="180ms"
          />

          <StatCard
            icon="⏭️"
            label="Skipped"
            value={stats.skipped}
            delay="240ms"
          />

        </div>

        {/* ==========================================
            SEARCH / FILTER
        ========================================== */}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-5">

          <div className="flex flex-col md:flex-row gap-3">

            <div className="relative flex-1">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>

              <input
                className="
                  w-full
                  border border-gray-200
                  rounded-2xl
                  pl-11 pr-4 py-3.5
                  text-sm sm:text-base
                  outline-none
                  transition-all
                  focus:border-green-500
                  focus:ring-4
                  focus:ring-green-100
                "
                placeholder="Search delivery / customer / phone / area"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <select
              className="
                w-full md:w-52
                border border-gray-200
                rounded-2xl
                px-4 py-3.5
                bg-white
                outline-none
                focus:border-green-500
                focus:ring-4
                focus:ring-green-100
              "
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option value="">
                All Status
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Assigned">
                Assigned
              </option>

              <option value="Out for Delivery">
                Out for Delivery
              </option>

              <option value="Delivered">
                Delivered
              </option>

              <option value="Missed">
                Missed
              </option>

              <option value="Failed">
                Failed
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
              <option value="Skipped">
                Skipped
              </option>
            </select>

          </div>

        </div>

        {/* ==========================================
            BULK ASSIGN
        ========================================== */}

        {selectedDeliveries.length > 0 && (

          <div className="
            hidden md:block
            delivery-animation
            bg-green-50
            border border-green-200
            rounded-3xl
            p-4
            mb-5
            shadow-sm
          ">

            <div className="
              flex flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-4
            ">

              <div>

                <p className="text-green-800 font-black text-lg">
                  {selectedDeliveries.length}{" "}
                  {selectedDeliveries.length === 1
                    ? "Delivery"
                    : "Deliveries"}{" "}
                  Selected
                </p>

                <p className="text-sm text-green-600 mt-1">
                  Choose a delivery boy to assign.
                </p>

              </div>

              <div className="
                flex flex-col
                sm:flex-row
                gap-2
              ">

                <select
                  value={selectedDeliveryBoy}
                  onChange={(e) =>
                    setSelectedDeliveryBoy(
                      e.target.value
                    )
                  }
                  className="
                    w-full sm:w-60
                    border border-green-200
                    bg-white
                    rounded-2xl
                    px-4 py-3
                    outline-none
                    focus:ring-4
                    focus:ring-green-100
                  "
                >

                  <option value="">
                    Select Delivery Boy
                  </option>

                  {deliveryBoys.map((boy) => (
                    <option
                      key={boy.id}
                      value={boy.id}
                    >
                      {boy.full_name}
                    </option>
                  ))}

                </select>

                <button
                  onClick={handleBulkAssign}
                  disabled={
                    assigning ||
                    !selectedDeliveryBoy
                  }
                  className="
                    px-5 py-3
                    rounded-2xl
                    bg-green-600
                    hover:bg-green-700
                    active:scale-95
                    text-white
                    font-black
                    transition-all
                    disabled:bg-gray-300
                    disabled:cursor-not-allowed
                  "
                >
                  {assigning
                    ? "⏳ Assigning..."
                    : "🚚 Assign Selected"}
                </button>

                <button
                  onClick={clearSelection}
                  className="
                    px-5 py-3
                    rounded-2xl
                    bg-white
                    border border-gray-200
                    hover:bg-gray-50
                    active:scale-95
                    text-gray-700
                    font-bold
                    transition-all
                  "
                >
                  Clear
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            MOBILE BULK ASSIGN TOOLBAR
        ========================================== */}

        {selectableDeliveries.length > 0 && (
          <div className="md:hidden sticky top-2 z-30 mb-4 rounded-3xl border border-emerald-100 bg-white/95 p-3 shadow-[0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSelectAllAndAssign}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black transition-all active:scale-[.97] ${
                  allSelected
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "bg-slate-950 text-white shadow-lg shadow-slate-200"
                }`}
              >
                <span className="text-base">
                  {allSelected ? "✓" : "☑️"}
                </span>
                {allSelected ? "Deselect All" : `Select All (${selectableDeliveries.length})`}
              </button>

              {selectedDeliveries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDelivery(null);
                    setAssignOpen(false);
                    document
                      .getElementById("mobile-bulk-assign")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white shadow-lg shadow-emerald-200 transition-all active:scale-[.97]"
                >
                  🚚 Assign {selectedDeliveries.length}
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-bold text-slate-400">
              <span>
                {selectedDeliveries.length > 0
                  ? `${selectedDeliveries.length} selected`
                  : "Select deliveries to assign together"}
              </span>
              <span>{selectableDeliveries.length} available</span>
            </div>
          </div>
        )}

        {/* ==========================================
            MOBILE BULK ASSIGN PANEL
        ========================================== */}

        {selectedDeliveries.length > 0 && (
          <div
            id="mobile-bulk-assign"
            className="md:hidden delivery-animation mb-5 rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[0_16px_45px_rgba(16,185,129,.12)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-black text-emerald-900">
                  🚚 Assign deliveries
                </p>
                <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                  {selectedDeliveries.length} deliveries selected
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
              className="min-h-12 w-full rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
            >
              {assigning ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Assigning {selectedDeliveries.length}...
                </>
              ) : (
                <>🚚 Assign All {selectedDeliveries.length} Deliveries</>
              )}
            </button>
          </div>
        )}

        {/* ==========================================
            MOBILE CARDS
        ========================================== */}

        <div className="md:hidden space-y-4">

          {filtered.length === 0 && (
            <EmptyState />
          )}

          {filtered.map((delivery, index) => {

            const selectable = isDeliverySelectable(delivery);

            const checked =
              selectedDeliveries.includes(
                delivery.id
              );

            const statusStyle =
              getStatusStyle(delivery.status);

            return (
              <div
                key={delivery.id}
                className="
                  delivery-animation
                  bg-white
                  rounded-3xl
                  border border-gray-100
                  shadow-sm
                  overflow-hidden
                  transition-all
                  duration-300
                  active:scale-[0.99]
                "
                style={{
                  animationDelay:
                    `${index * 55}ms`,
                }}
              >

                {/* Card Header */}

                <div className="p-4 border-b border-gray-100">

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3 min-w-0">

                      {selectable ? (
                        <button
                          type="button"
                          onClick={() =>
                            toggleDeliverySelection(
                              delivery.id
                            )
                          }
                          className={`
                            w-11 h-11
                            rounded-2xl
                            border-2
                            flex items-center justify-center
                            flex-shrink-0
                            transition-all
                            duration-200
                            active:scale-90
                            ${
                              checked
                                ? "bg-green-600 border-green-600 text-white"
                                : "bg-white border-gray-200 text-gray-300"
                            }
                          `}
                        >
                          {checked ? "✓" : "☐"}
                        </button>
                      ) : (
                        <div className="
                          w-11 h-11
                          rounded-2xl
                          bg-gray-100
                          flex items-center justify-center
                          text-gray-300
                          flex-shrink-0
                        ">
                          —
                        </div>
                      )}

                      <div className="min-w-0">

                        <p className="text-xs uppercase tracking-wide text-gray-400 font-bold">
                          Delivery No
                        </p>

                        <h2 className="font-black text-gray-900 text-lg truncate">
                          {delivery.delivery_number ||
                            "-"}
                        </h2>

                      </div>

                    </div>

                    <span
                      className={`
                        flex-shrink-0
                        inline-flex
                        items-center gap-1.5
                        px-2.5 py-1.5
                        rounded-full
                        border
                        text-xs
                        font-black
                        ${statusStyle.badge}
                      `}
                    >
                      <span
                        className={`
                          status-dot
                          w-2 h-2
                          rounded-full
                          ${statusStyle.dot}
                        `}
                      />

                      {delivery.status}
                    </span>

                  </div>

                </div>

                {/* Customer */}

                <div className="p-4">

                  <div className="
                    bg-slate-50
                    rounded-2xl
                    p-4
                    border border-gray-100
                  ">

                    <div className="flex items-start gap-3">

                      <div className="
                        w-11 h-11
                        rounded-xl
                        bg-green-100
                        flex items-center justify-center
                        text-xl
                        flex-shrink-0
                      ">
                        👤
                      </div>

                      <div className="min-w-0">

                        <p className="font-black text-gray-900 truncate">
                          {delivery.customers?.full_name ||
                            "-"}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          📞{" "}
                          {delivery.customers?.phone ||
                            "-"}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          📍{" "}
                          {delivery.addresses?.area ||
                            "-"}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Product */}

                  <div className="
                    mt-3
                    rounded-2xl
                    bg-green-50
                    border border-green-100
                    p-4
                  ">

                    <p className="
                      text-xs
                      uppercase
                      tracking-wide
                      text-green-600
                      font-black
                      mb-2
                    ">
                      Products
                    </p>

                    <ProductItems
                      delivery={delivery}
                      mobile
                    />

                  </div>

                  {/* Delivery Details */}

                  <div className="
                    grid
                    grid-cols-2
                    gap-3
                    mt-3
                  ">

                    <div className="
                      bg-blue-50
                      border border-blue-100
                      rounded-2xl
                      p-3
                    ">

                      <p className="text-xs text-gray-500 font-semibold">
                        Delivery Date
                      </p>

                      <p className="font-black text-gray-900 mt-1">
                        {formatDate(
                          delivery.delivery_date
                        )}
                      </p>

                    </div>

                    <div className="
                      bg-purple-50
                      border border-purple-100
                      rounded-2xl
                      p-3
                    ">

                      <p className="text-xs text-gray-500 font-semibold">
                        Delivery Boy
                      </p>

                      <p className="font-black text-gray-900 mt-1 truncate">
                        {delivery.delivery_boys
                          ?.full_name ||
                          "Not Assigned"}
                      </p>

                    </div>

                  </div>

                </div>

                {/* Actions */}

                <div className="
                  p-4
                  bg-gray-50
                  border-t border-gray-100
                ">

                  <div className="grid grid-cols-2 gap-2">

                    {selectable && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleDeliverySelection(
                            delivery.id
                          )
                        }
                        className={`
                          py-3
                          rounded-xl
                          font-black
                          transition-all
                          active:scale-95
                          ${
                            checked
                              ? "bg-green-600 text-white"
                              : "bg-white border border-gray-200 text-gray-700"
                          }
                        `}
                      >
                        {checked
                          ? "✓ Selected"
                          : "☐ Select"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        openAssign(delivery)
                      }
                      className="
                        py-3
                        rounded-xl
                        bg-blue-600
                        hover:bg-blue-700
                        active:scale-95
                        text-white
                        font-black
                        transition-all
                      "
                    >
                      🚚 Assign
                    </button>

                  </div>

                  {/* Status Controls */}

                  <div className="
                    grid
                    grid-cols-2
                    gap-2
                    mt-2
                  ">

                    {delivery.status === "Assigned" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            delivery.id,
                            "Out for Delivery"
                          )
                        }
                        className="
                          py-2.5
                          rounded-xl
                          bg-purple-50
                          border border-purple-200
                          text-purple-700
                          font-bold
                          text-sm
                          active:scale-95
                          transition-all
                        "
                      >
                        🚚 Out for Delivery
                      </button>
                    )}

                    {delivery.status ===
                      "Out for Delivery" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            delivery.id,
                            "Delivered"
                          )
                        }
                        className="
                          py-2.5
                          rounded-xl
                          bg-green-50
                          border border-green-200
                          text-green-700
                          font-bold
                          text-sm
                          active:scale-95
                          transition-all
                        "
                      >
                        ✓ Delivered
                      </button>
                    )}
                    {(delivery.status === "Pending" ||
  delivery.status === "Assigned") && (
  <button
    type="button"
    onClick={() =>
      handleSkipToday(delivery)
    }
    className="
      py-2.5
      rounded-xl
      bg-orange-50
      border border-orange-200
      text-orange-700
      font-bold
      text-sm
      active:scale-95
      transition-all
    "
  >
    ⏭ Skip Today
  </button>
)}

{delivery.status === "Skipped" && (
  <button
    type="button"
    onClick={() =>
      handleRestoreToday(delivery)
    }
    className="
      py-2.5
      rounded-xl
      bg-green-50
      border border-green-200
      text-green-700
      font-bold
      text-sm
      active:scale-95
      transition-all
    "
  >
    ↩ Restore Today
  </button>
)}

                  </div>

                </div>

              </div>
            );
          })}

        </div>

        {/* ==========================================
            DESKTOP TABLE
        ========================================== */}

        <div className="
          hidden md:block
          bg-white
          rounded-3xl
          shadow-sm
          border border-gray-100
          overflow-hidden
        ">

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-green-700 text-white">

                  <tr>

                    <th className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={
                          toggleSelectAll
                        }
                        className="w-5 h-5 accent-green-600 cursor-pointer"
                      />
                    </th>

                    <th className="px-4 py-4 text-left">
                      Delivery No
                    </th>

                    <th className="px-4 py-4 text-left">
                      Customer
                    </th>

                    <th className="px-4 py-4 text-left">
                      Phone
                    </th>

                    <th className="px-4 py-4 text-left">
                      Area
                    </th>

                    <th className="px-4 py-4 text-left">
                      Delivery Boy
                    </th>

                    <th className="px-4 py-4 text-left">
                      Date
                    </th>

                    <th className="px-4 py-4 text-left">
                      Products
                    </th>

                    <th className="px-4 py-4 text-center">
                      Status
                    </th>

                    <th className="px-4 py-4 text-center">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filtered.map(
                    (delivery, index) => {

                      const selectable =
                        isDeliverySelectable(delivery);

                      const checked =
                        selectedDeliveries.includes(
                          delivery.id
                        );

                      const statusStyle =
                        getStatusStyle(
                          delivery.status
                        );

                      return (
                        <tr
                          key={delivery.id}
                          className={`
                            delivery-animation
                            border-b
                            border-gray-100
                            transition-colors
                            hover:bg-green-50/50
                            ${
                              checked
                                ? "bg-green-50"
                                : ""
                            }
                          `}
                          style={{
                            animationDelay:
                              `${index * 35}ms`,
                          }}
                        >

                          <td className="px-4 py-4 text-center">

                            {selectable ? (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleDeliverySelection(
                                    delivery.id
                                  )
                                }
                                className="w-5 h-5 accent-green-600 cursor-pointer"
                              />
                            ) : (
                              <span className="text-gray-300">
                                —
                              </span>
                            )}

                          </td>

                          <td className="px-4 py-4">

                            <span className="font-black text-gray-900">
                              {delivery.delivery_number}
                            </span>

                          </td>

                          <td className="px-4 py-4">

                            <div className="font-bold">
                              {delivery.customers
                                ?.full_name ||
                                "-"}
                            </div>

                          </td>

                          <td className="px-4 py-4 text-sm">
                            {delivery.customers?.phone ||
                              "-"}
                          </td>

                          <td className="px-4 py-4">
                            {delivery.addresses?.area ||
                              "-"}
                          </td>

                          <td className="px-4 py-4">

                            <div className="font-bold">
                              {delivery.delivery_boys
                                ?.full_name ||
                                "-"}
                            </div>

                            {delivery.delivery_boys && (
                              <div className="text-xs text-green-600 mt-1">
                                ✓ Assigned
                              </div>
                            )}

                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            {formatDate(
                              delivery.delivery_date
                            )}
                          </td>

                          <td className="px-4 py-4 min-w-[260px]">

                            <ProductItems
                              delivery={delivery}
                            />

                          </td>

                          <td className="px-4 py-4 text-center">

                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                px-3 py-1.5
                                rounded-full
                                border
                                text-xs
                                font-black
                                ${statusStyle.badge}
                              `}
                            >

                              <span
                                className={`
                                  w-2 h-2
                                  rounded-full
                                  ${statusStyle.dot}
                                `}
                              />

                              {delivery.status}

                            </span>

                          </td>

                          <td className="px-4 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                openAssign(
                                  delivery
                                )
                              }
                              className="
                                px-4 py-2.5
                                rounded-xl
                                bg-blue-600
                                hover:bg-blue-700
                                active:scale-95
                                text-white
                                font-bold
                                transition-all
                              "
                            >
                              Assign
                            </button>

                            {(delivery.status === "Pending" ||
                              delivery.status === "Assigned") && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSkipToday(delivery)
                                }
                                className="
                                  ml-2
                                  px-4 py-2.5
                                  rounded-xl
                                  bg-orange-500
                                  hover:bg-orange-600
                                  active:scale-95
                                  text-white
                                  font-bold
                                  transition-all
                                "
                              >
                                ⏭ Skip
                              </button>
                            )}

                            {delivery.status === "Skipped" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRestoreToday(delivery)
                                }
                                className="
                                  ml-2
                                  px-4 py-2.5
                                  rounded-xl
                                  bg-green-600
                                  hover:bg-green-700
                                  active:scale-95
                                  text-white
                                  font-bold
                                  transition-all
                                "
                              >
                                ↩ Restore
                              </button>
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* ==========================================
          ASSIGN MODAL
      ========================================== */}

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

// ==========================================
// STAT CARD
// ==========================================

function StatCard({
  icon,
  label,
  value,
  delay,
}) {
  return (
    <div
      className="
        delivery-animation
        bg-white
        border border-gray-100
        rounded-3xl
        shadow-sm
        p-4
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
      style={{
        animationDelay: delay,
      }}
    >

      <div className="flex items-center gap-3">

        <div className="
          w-11 h-11
          rounded-2xl
          bg-green-50
          flex items-center justify-center
          text-xl
        ">
          {icon}
        </div>

        <div>

          <p className="text-xs uppercase tracking-wide text-gray-400 font-bold">
            {label}
          </p>

          <p className="text-2xl font-black text-gray-900 mt-0.5">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState() {
  return (
    <div className="text-center py-14 px-5">

      <div className="text-5xl mb-4">
        📦
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-gray-800">
        No Deliveries Found
      </h2>

      <p className="text-sm text-gray-500 mt-2">
        Try changing your search or status filter.
      </p>

    </div>
  );
}