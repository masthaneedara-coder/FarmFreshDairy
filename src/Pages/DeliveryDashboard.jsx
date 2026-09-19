import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getDelivery,
  getDeliveryName,
  isDeliveryLoggedIn,
  logoutDelivery,
} from "../config/auth";


import { updateOrderStatus } from "../config/api";

import {
  fetchDeliveryDashboard,
} from "../services/deliveryDashboardService";
import {
  updateSubscriptionDeliveryStatus,
} from "../services/subscriptionDeliveryService";
function getDeliveryItems(delivery) {
  return Array.isArray(delivery?.items)
    ? delivery.items
    : [];
}
function isStatusLocked(delivery) {
  return (
    delivery?.status === "Delivered" ||
    delivery?.status === "Missed"
  );
}

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  
   // ===============================
// STATE
// ===============================
const [deliveries, setDeliveries] = useState([]);
const [loading, setLoading] = useState(true);

const [search, setSearch] = useState("");

const [selectedShift, setSelectedShift] = useState("All");

const [selectedStatus, setSelectedStatus] =
  useState("All Deliveries");

useEffect(() => {
  if (!isDeliveryLoggedIn()) {
    navigate("/delivery-login");
    return;
  }

  loadDeliveries();
}, [navigate]);

 
  const handleLogout = () => {
    logoutDelivery();
    navigate("/");
  };

const loadDeliveries = async () => {
  try {
    setLoading(true);

    const deliveryBoy = getDelivery();

    console.log("Logged in Delivery Boy:", deliveryBoy);

    if (!deliveryBoy?.id) {
      setDeliveries([]);
      return;
    }

    const res = await fetchDeliveryDashboard(
      deliveryBoy.id
    );

    console.log("Delivery Dashboard Response:", res);
    console.log(
  "SHIFT DATA:",
  res.deliveries.map((d) => ({
    id: d.id,
    type: d.type,
    customer: d.customer?.full_name,
    delivery_date: d.delivery_date,
    delivery_shift: d.delivery_shift,
    status: d.status,
  }))
);

    if (res.success) {
      setDeliveries(res.deliveries || []);
    } else {
      setDeliveries([]);
    }

  } catch (err) {
    console.error("Delivery Dashboard Error:", err);
    setDeliveries([]);
  } finally {
    setLoading(false);
  }
};
const handleNavigate = (delivery) => {
  const address = [
    delivery.address?.house_no,
    delivery.address?.street,
    delivery.address?.area,
    delivery.address?.city,
    delivery.address?.state,
    delivery.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  if (!address) {
    alert("Customer delivery address is not available.");
    return;
  }

  const destination = encodeURIComponent(address);

  const mapsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&destination=${destination}` +
    `&travelmode=driving`;

  window.open(mapsUrl, "_blank");
};

// addNotification({
//   title: "Out for Delivery",
//   message: "Your milk is on the way.",
//   type: "delivery",
//   priority: "high",
//   actionUrl: "/track-order",
// });
// addNotification({
//   title: "Delivered Successfully",
//   message: "Thank you for choosing Farm Fresh Dairy.",
//   type: "delivery",
//   priority: "medium",
//   actionUrl: "/order-history",
// });
// addNotification({
//   title: "Payment Successful",
//   message: `₹${amount} payment received successfully.`,
//   type: "payment",
//   priority: "high",
//   actionUrl: "/order-history",
// });
const updateDeliveryStatus = async (delivery, status) => {
  try {
    console.log("Updating delivery:", delivery);

    await updateSubscriptionDeliveryStatus(
      delivery.id,
      status
    );

    // Update screen immediately
    setDeliveries((prev) =>
      prev.map((item) =>
        item.id === delivery.id
          ? { ...item, status }
          : item
      )
    );

  } catch (error) {
    console.error("Update Delivery Status Error:", error);
    alert("Failed to update delivery status");
  }
};
function getSizeInLiters(size) {
  if (!size) return 0;

  const value = String(size).toLowerCase().replace(/\s/g, "");

  if (value.includes("500ml")) return 0.5;
  if (value.includes("250ml")) return 0.25;
  if (value.includes("1l")) return 1;
  if (value.includes("2l")) return 2;
  if (value.includes("5l")) return 5;

  // fallback for values like "500 ml", "1 L", etc.
  const number = parseFloat(value);

  if (value.includes("ml")) {
    return number / 1000;
  }

  if (value.includes("l")) {
    return number;
  }

  return 0;
}
const morningDeliveries = (deliveries || []).filter(
  (delivery) =>
    String(delivery.delivery_shift || "")
      .trim()
      .toLowerCase() === "morning"
);

const eveningDeliveries = (deliveries || []).filter(
  (delivery) =>
    String(delivery.delivery_shift || "")
      .trim()
      .toLowerCase() === "evening"
);
function calculateMilkSummary(list) {
  let totalLiters = 0;
  let bottles500ml = 0;
  let bottles1L = 0;
  let bottles2L = 0;
  let bottles5L = 0;

  list.forEach((delivery) => {
    (delivery.items || []).forEach((item) => {
      const quantity = Number(item.quantity || 0);
      const liters = getSizeInLiters(item.size);

      totalLiters += quantity * liters;

      const size = String(item.size || "")
        .toLowerCase()
        .replace(/\s/g, "");

      if (size === "500ml") {
        bottles500ml += quantity;
      }

      if (size === "1l" || size === "1ltr" || size === "1liter") {
        bottles1L += quantity;
      }

      if (size === "2l" || size === "2ltr") {
        bottles2L += quantity;
      }

      if (size === "5l" || size === "5ltr") {
        bottles5L += quantity;
      }
    });
  });

  return {
    totalLiters,
    bottles500ml,
    bottles1L,
    bottles2L,
    bottles5L,
  };
}

// ===============================
// FILTER DELIVERIES
// ===============================
const filteredDeliveries = deliveries.filter((delivery) => {

  // -------------------------------
  // SHIFT
  // -------------------------------
  const deliveryShift = String(
    delivery.delivery_shift || ""
  )
    .trim()
    .toLowerCase();

  const selectedShiftValue = String(
    selectedShift || "All"
  )
    .trim()
    .toLowerCase();

  const matchesShift =
    selectedShiftValue === "all" ||
    deliveryShift === selectedShiftValue;


  // -------------------------------
  // STATUS
  // -------------------------------
  const statusValue = String(
    delivery.status || ""
  )
    .trim()
    .toLowerCase();

  const selectedStatusValue = String(
    selectedStatus || "All Deliveries"
  )
    .trim()
    .toLowerCase();

  const matchesStatus =
    selectedStatusValue === "all" ||
    selectedStatusValue === "all deliveries" ||
    statusValue === selectedStatusValue;


  // -------------------------------
  // SEARCH
  // -------------------------------
  const searchValue = String(search || "")
    .trim()
    .toLowerCase();

  const customerName = String(
    delivery.customer?.full_name || ""
  ).toLowerCase();

  const customerPhone = String(
    delivery.customer?.phone || ""
  ).toLowerCase();

  const customerArea = String(
    delivery.address?.area || ""
  ).toLowerCase();

  const orderNumber = String(
    delivery.number || ""
  ).toLowerCase();

  const matchesSearch =
    !searchValue ||
    customerName.includes(searchValue) ||
    customerPhone.includes(searchValue) ||
    customerArea.includes(searchValue) ||
    orderNumber.includes(searchValue);


  return (
    matchesShift &&
    matchesStatus &&
    matchesSearch
  );
});
// ===============================
// MILK SUMMARY
// ===============================

const totalMilkLiters = filteredDeliveries.reduce(
  (total, delivery) => {

    const deliveryMilk =
      (delivery.items || []).reduce(
        (sum, item) => {

          const liters =
            getSizeInLiters(item.size);

          return (
            sum +
            liters *
              Number(item.quantity || 0)
          );
        },
        0
      );

    return total + deliveryMilk;
  },
  0
);
const totalDeliveries =
  filteredDeliveries.length;
  const total500ml =
  filteredDeliveries.reduce(
    (total, delivery) => {

      return (
        total +
        (delivery.items || []).reduce(
          (sum, item) => {

            const size = String(
              item.size || ""
            )
              .toLowerCase()
              .replace(/\s/g, "");

            if (size === "500ml") {
              return (
                sum +
                Number(item.quantity || 0)
              );
            }

            return sum;
          },
          0
        )
      );
    },
    0
  );
  const total1Ltr =
  filteredDeliveries.reduce(
    (total, delivery) => {

      return (
        total +
        (delivery.items || []).reduce(
          (sum, item) => {

            const size = String(
              item.size || ""
            )
              .toLowerCase()
              .replace(/\s/g, "");

            if (
              size === "1l" ||
              size === "1ltr" ||
              size === "1liter" ||
              size === "1000ml"
            ) {
              return (
                sum +
                Number(item.quantity || 0)
              );
            }

            return sum;
          },
          0
        )
      );
    },
    0
  );

const summary = calculateMilkSummary(filteredDeliveries);

const morningCount = deliveries.filter(
  (delivery) =>
    String(delivery.delivery_shift || "")
      .trim()
      .toLowerCase() === "morning"
).length;

const eveningCount = deliveries.filter(
  (delivery) =>
    String(delivery.delivery_shift || "")
      .trim()
      .toLowerCase() === "evening"
).length;


function getMilkSummary(deliveries) {
  const summary = {
    "500ml": 0,
    "1L": 0,
    "2L": 0,
    "5L": 0,
    totalLiters: 0,
  };

  deliveries.forEach((delivery) => {
    (delivery.items || []).forEach((item) => {
      const quantity = Number(item.quantity || 0);

      const size = String(item.size || "")
        .toLowerCase()
        .replace(/\s/g, "");

      if (size.includes("500ml")) {
        summary["500ml"] += quantity;
        summary.totalLiters += quantity * 0.5;
      } 
      else if (size === "1l" || size.includes("1liter")) {
        summary["1L"] += quantity;
        summary.totalLiters += quantity * 1;
      } 
      else if (size === "2l" || size.includes("2liter")) {
        summary["2L"] += quantity;
        summary.totalLiters += quantity * 2;
      } 
      else if (size === "5l" || size.includes("5liter")) {
        summary["5L"] += quantity;
        summary.totalLiters += quantity * 5;
      }
    });
  });

  return summary;
}
  return (
    <div className="min-h-screen bg-[#f5f8f7] text-slate-900 pb-8">
      <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-5 sm:pt-6 lg:px-8">

        {/* MOBILE-FIRST HEADER */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-4 text-white shadow-xl shadow-emerald-900/15 sm:rounded-[34px] sm:p-7">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-50 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Delivery Panel
              </div>

              <h1 className="truncate text-[25px] font-black leading-tight tracking-tight sm:text-4xl">
                Hello, {getDeliveryName()}
              </h1>

              <p className="mt-1 max-w-xl text-xs font-medium text-emerald-50/80 sm:text-sm">
                Today&apos;s route, customer drops and milk loading in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-black text-white backdrop-blur transition active:scale-95 sm:px-5 sm:py-3 sm:text-sm"
            >
              Logout
            </button>
          </div>

          <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/70">
                Today
              </p>
              <p className="mt-0.5 text-sm font-black">
                {deliveries.length} stops
              </p>
            </div>

            <div className="h-8 w-px bg-white/15" />

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/70">
                Milk
              </p>
              <p className="mt-0.5 text-sm font-black">
                {summary.totalLiters.toFixed(1)} L
              </p>
            </div>
          </div>
        </section>

        {/* QUICK STATS */}
        <section className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-4 sm:gap-3">
          {[
            {
              label: "Total",
              value: deliveries.length,
              icon: "📦",
              tone: "bg-orange-50 border-orange-100 text-orange-600",
            },
            {
              label: "Delivered",
              value: deliveries.filter((d) => d.status === "Delivered").length,
              icon: "✓",
              tone: "bg-emerald-50 border-emerald-100 text-emerald-700",
            },
            {
              label: "Pending",
              value: deliveries.filter(
                (d) => d.status !== "Delivered" && d.status !== "Missed"
              ).length,
              icon: "⏳",
              tone: "bg-blue-50 border-blue-100 text-blue-700",
            },
            {
              label: "Missed",
              value: deliveries.filter((d) => d.status === "Missed").length,
              icon: "!",
              tone: "bg-red-50 border-red-100 text-red-700",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-[22px] border p-3 shadow-sm sm:rounded-3xl sm:p-4 ${stat.tone}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                  {stat.label}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs font-black shadow-sm">
                  {stat.icon}
                </span>
              </div>
              <p className="mt-1 text-2xl font-black sm:text-3xl">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* FILTERS */}
        <section className="mt-3 rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-sm sm:mt-5 sm:rounded-[28px] sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">Today&apos;s route</p>
              <p className="text-[10px] font-semibold text-slate-400">
                Filter your stops quickly
              </p>
            </div>

            {(search || selectedShift !== "All" || selectedStatus !== "All Deliveries") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedShift("All");
                  setSelectedStatus("All Deliveries");
                }}
                className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600 active:scale-95"
              >
                Reset
              </button>
            )}
          </div>

          {/* SHIFT CHIPS */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {[
              { value: "All", label: "📋 All", count: deliveries.length },
              { value: "Morning", label: "🌅 Morning", count: morningCount },
              { value: "Evening", label: "🌙 Evening", count: eveningCount },
            ].map((shift) => {
              const active = selectedShift === shift.value;

              return (
                <button
                  key={shift.value}
                  type="button"
                  onClick={() => setSelectedShift(shift.value)}
                  className={`min-h-10 shrink-0 rounded-xl px-3.5 text-xs font-black transition active:scale-95 ${
                    active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "border border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {shift.label}
                  <span className={`ml-1 ${active ? "text-white/70" : "text-slate-400"}`}>
                    {shift.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>
              <input
                type="text"
                placeholder="Search customer, phone, area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="All Deliveries">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Missed">Missed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </section>

        {/* ROUTE SUMMARY */}
        <section className="mt-3 rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3.5 shadow-sm sm:mt-5 sm:rounded-[28px] sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-emerald-950">
                🥛 Milk Loading
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-emerald-700/70">
                Based on filtered deliveries
              </p>
            </div>
            <span className="rounded-xl bg-white px-3 py-2 text-sm font-black text-emerald-700 shadow-sm">
              {summary.totalLiters.toFixed(1)} L
            </span>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              ["500ml", summary.bottles500ml, "orange"],
              ["1L", summary.bottles1L, "green"],
              ["2L", summary.bottles2L, "blue"],
              ["5L", summary.bottles5L, "purple"],
            ].map(([size, count]) => (
              <div
                key={size}
                className="rounded-2xl border border-white bg-white p-2.5 text-center shadow-sm"
              >
                <p className="text-[9px] font-black text-slate-400">{size}</p>
                <p className="mt-0.5 text-lg font-black text-slate-800">{count}</p>
                <p className="text-[8px] font-bold text-slate-400">bottles</p>
              </div>
            ))}
          </div>
        </section>

        {/* RESULT COUNT */}
        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500">
            Showing <span className="font-black text-slate-900">{filteredDeliveries.length}</span> deliveries
          </p>
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
            {selectedShift === "All" ? "All shifts" : selectedShift}
          </p>
        </div>

        {/* DELIVERY LIST */}
        <section className="mt-2.5 space-y-3.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm"
              >
                <div className="h-20 bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="h-12 rounded-2xl bg-slate-100" />
                  <div className="h-12 rounded-2xl bg-slate-100" />
                </div>
              </div>
            ))
          ) : filteredDeliveries.length === 0 ? (
            <div className="rounded-[26px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl">
                📦
              </div>
              <p className="mt-4 text-base font-black text-slate-800">
                No deliveries found
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Try changing the search or filters.
              </p>
            </div>
          ) : (
            filteredDeliveries.map((delivery) => {
              const locked = isStatusLocked(delivery);
              const items = getDeliveryItems(delivery);

              return (
                <article
                  key={`${delivery.type}-${delivery.id}`}
                  className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {/* CARD HEADER */}
                  <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-4 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl backdrop-blur">
                            👤
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black">
                              {delivery.customer?.full_name || "Customer"}
                            </h3>
                            <a
                              href={`tel:${delivery.customer?.phone || ""}`}
                              className="mt-0.5 block text-xs font-semibold text-emerald-100"
                            >
                              📞 {delivery.customer?.phone || "Phone unavailable"}
                            </a>
                          </div>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider backdrop-blur">
                        {delivery.type || "Delivery"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-emerald-50/90">
                      <span className="rounded-xl bg-white/10 px-2.5 py-1.5">
                        #{delivery.number || "—"}
                      </span>
                      <span className="rounded-xl bg-white/10 px-2.5 py-1.5">
                        {delivery.delivery_shift === "Morning"
                          ? "🌅 Morning"
                          : delivery.delivery_shift === "Evening"
                          ? "🌙 Evening"
                          : "Shift not set"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-5">
                    {/* DATE + STATUS */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Delivery date
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-800">
                          📅 {delivery.delivery_date || "—"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                          delivery.status === "Delivered"
                            ? "bg-emerald-100 text-emerald-700"
                            : delivery.status === "Missed"
                            ? "bg-red-100 text-red-700"
                            : delivery.status === "Out for Delivery"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {delivery.status}
                      </span>
                    </div>

                    {/* ADDRESS */}
                    <button
                      type="button"
                      onClick={() => handleNavigate(delivery)}
                      className="mt-3 flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition active:scale-[.99] hover:border-emerald-200 hover:bg-emerald-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        📍
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Delivery address
                        </span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-700">
                          {[
                            delivery.address?.house_no,
                            delivery.address?.street,
                            delivery.address?.area,
                            delivery.address?.city,
                            delivery.address?.state,
                            delivery.address?.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Address not available"}
                        </span>
                      </span>
                      <span className="pt-1 text-xs font-black text-emerald-600">
                        MAP
                      </span>
                    </button>

                    {/* ITEMS */}
                    <div className="mt-4">
                      <div className="mb-2.5 flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-800">
                          🥛 Delivery items
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400">
                          {items.length} item{items.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-4 text-center text-xs font-semibold text-slate-400">
                          No items found
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 rounded-2xl border p-2.5 ${
                                item.is_extra
                                  ? "border-orange-200 bg-orange-50"
                                  : "border-slate-100 bg-slate-50"
                              }`}
                            >
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm">
                                {item.products?.image ? (
                                  <img
                                    src={item.products.image}
                                    alt={item.products?.name || "Milk"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xl">
                                    🥛
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-black text-slate-800">
                                  {item.products?.name || "Milk"}
                                </p>
                                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                  {item.quantity} × {item.size}
                                </p>
                                {item.is_extra && (
                                  <span className="mt-1 inline-flex rounded-full bg-orange-500 px-2 py-0.5 text-[8px] font-black text-white">
                                    EXTRA
                                  </span>
                                )}
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-black text-emerald-700">
                                  ×{item.quantity}
                                </p>
                                {item.total_price != null && (
                                  <p className="text-[10px] font-semibold text-slate-400">
                                    ₹{Number(item.total_price).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PAYMENT SUMMARY */}
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-500">
                          Total amount
                        </span>
                        <span className="text-xl font-black text-emerald-700">
                          ₹{Number(delivery.total_amount || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Payment
                        </span>
                        <span className="text-xs font-black text-slate-700">
                          {delivery.payment_method || "—"}
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={
                          locked || delivery.status === "Out for Delivery"
                        }
                        onClick={() =>
                          updateDeliveryStatus(
                            delivery,
                            "Out for Delivery"
                          )
                        }
                        className={`min-h-12 rounded-2xl px-2 text-xs font-black text-white transition active:scale-95 ${
                          locked || delivery.status === "Out for Delivery"
                            ? "cursor-not-allowed bg-slate-300"
                            : "bg-blue-600 shadow-md shadow-blue-100 hover:bg-blue-700"
                        }`}
                      >
                        🚚 Out for Delivery
                      </button>

                      <button
                        type="button"
                        disabled={locked}
                        onClick={() =>
                          updateDeliveryStatus(
                            delivery,
                            "Delivered"
                          )
                        }
                        className={`min-h-12 rounded-2xl px-2 text-xs font-black text-white transition active:scale-95 ${
                          locked
                            ? "cursor-not-allowed bg-slate-300"
                            : "bg-emerald-600 shadow-md shadow-emerald-100 hover:bg-emerald-700"
                        }`}
                      >
                        ✓ Delivered
                      </button>

                      <button
                        type="button"
                        disabled={locked}
                        onClick={() =>
                          updateDeliveryStatus(
                            delivery,
                            "Missed"
                          )
                        }
                        className={`min-h-12 rounded-2xl px-2 text-xs font-black text-white transition active:scale-95 ${
                          locked
                            ? "cursor-not-allowed bg-slate-300"
                            : "bg-red-500 shadow-md shadow-red-100 hover:bg-red-600"
                        }`}
                      >
                        ✕ Missed
                      </button>

                      <a
                        href={`tel:${delivery.customer?.phone || ""}`}
                        className="flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-2 text-xs font-black text-white shadow-md shadow-indigo-100 transition active:scale-95 hover:bg-indigo-700"
                      >
                        📞 Call
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleNavigate(delivery)}
                      className="mt-2.5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white text-xs font-black text-emerald-700 transition active:scale-[.98] hover:bg-emerald-50"
                    >
                      🗺️ Navigate to Customer
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* FOOTER INFO */}
        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                🗺️
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800">
                  Delivery Areas
                </h2>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">
                  Dammaiguda • ECIL • Kapra • Rampally • Parimal Nagar
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                ⏰
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800">
                  Morning Delivery
                </h2>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">
                  Daily milk delivery from 5:30 AM to 8:30 AM
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
