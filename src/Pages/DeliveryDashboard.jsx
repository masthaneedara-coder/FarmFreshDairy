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
    console.log("=================================");
    console.log("UPDATING DELIVERY");
    console.log("=================================");
    console.log("ID:", delivery.id);
    console.log("TYPE:", delivery.type);
    console.log("STATUS:", status);
    console.log("FULL DELIVERY:", delivery);
    console.log("=================================");

    if (delivery.type === "Subscription") {
      console.log("Calling Subscription API");

      await updateSubscriptionDeliveryStatus(
        delivery.id,
        status
      );
    } else if (delivery.type === "Order") {
      console.log("Calling Order API");

      await updateOrderDeliveryStatus(
        delivery.id,
        status
      );
    } else {
      throw new Error(
        `Unknown delivery type: ${delivery.type}`
      );
    }

    console.log("Delivery status updated successfully");

    // refresh dashboard
    await loadDashboard();

  } catch (error) {
    console.error(
      "Update Delivery Status Error:",
      error
    );
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
    <div className="min-h-screen bg-slate-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="rounded-[32px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 p-6 sm:p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-white/80 text-sm sm:text-base">Delivery Panel</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mt-1">
                🚚 Welcome {getDeliveryName()}
              </h1>
              <p className="mt-2 text-white/90">
                Manage today’s milk deliveries and customer drop points
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleLogout}
                className="px-5 py-3 rounded-2xl bg-red-500 text-white font-bold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        {/* STATS */}
        
    {/* STATS */}

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

  {/* TODAY DELIVERIES */}
  <div className="bg-white rounded-3xl p-5 shadow-lg border border-orange-100">
    <p className="text-gray-500 text-sm">
      Today Deliveries
    </p>

    <p className="text-3xl font-black text-orange-600 mt-2">
      {deliveries.length}
    </p>
  </div>


  {/* DELIVERED */}
  <div className="bg-white rounded-3xl p-5 shadow-lg border border-green-100">
    <p className="text-gray-500 text-sm">
      Delivered
    </p>

    <p className="text-3xl font-black text-green-700 mt-2">
      {deliveries.filter(
        (d) => d.status === "Delivered"
      ).length}
    </p>
  </div>


  {/* PENDING */}
  <div className="bg-white rounded-3xl p-5 shadow-lg border border-blue-100">
    <p className="text-gray-500 text-sm">
      Pending
    </p>

    <p className="text-3xl font-black text-blue-700 mt-2">
      {deliveries.filter(
        (d) =>
          d.status !== "Delivered" &&
          d.status !== "Missed"
      ).length}
    </p>
  </div>


  {/* MISSED */}
  <div className="bg-white rounded-3xl p-5 shadow-lg border border-red-100">
    <p className="text-gray-500 text-sm">
      Missed
    </p>

    <p className="text-3xl font-black text-red-700 mt-2">
      {deliveries.filter(
        (d) => d.status === "Missed"
      ).length}
    </p>
  </div>

</div>
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-red-100">
            <p className="text-gray-500 text-sm">
              Missed
            </p>

            <p className="text-3xl font-black text-red-700 mt-2">
              
               {deliveries.filter(
                  (d) =>
                    d.status !== "Delivered" &&
                    d.status !== "Missed"
                ).length}
              
            </p>
          </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">




  {/* STATUS FILTER */}
       

      </div>
      <div className="mt-6 space-y-4">

  {/* SHIFT FILTER */}
  <div>
    <label className="block text-sm font-bold text-gray-600 mb-2">
      Delivery Shift
    </label>
    <div className="grid grid-cols-3 gap-3">

  <button
    onClick={() => setSelectedShift("All")}
    className={`p-4 rounded-xl font-bold ${
      selectedShift === "All"
        ? "bg-orange-500 text-white"
        : "bg-white border"
    }`}
  >
    📋 All
  </button>

  <button
    onClick={() => setSelectedShift("Morning")}
    className={`p-4 rounded-xl font-bold ${
      selectedShift === "Morning"
        ? "bg-orange-500 text-white"
        : "bg-white border"
    }`}
  >
    🌅 Morning
  </button>

  <button
    onClick={() => setSelectedShift("Evening")}
    className={`p-4 rounded-xl font-bold ${
      selectedShift === "Evening"
        ? "bg-purple-600 text-white"
        : "bg-white border"
    }`}
  >
    🌙 Evening
  </button>

</div>

  
  </div>


  {/* SEARCH + STATUS */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    <div>
      <label className="block text-sm font-bold text-gray-600 mb-2">
        Search Delivery
      </label>

      <input
        type="text"
        placeholder="Search customer / phone / area..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>


    <div>
      <label className="block text-sm font-bold text-gray-600 mb-2">
        Filter by Status
      </label>

     <select
  value={selectedStatus}
  onChange={(e) => setSelectedStatus(e.target.value)}
  className="w-full border rounded-xl p-4"
>
  <option value="All Deliveries">
    All Deliveries
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
</select>
    </div>

  </div>

</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">

  {/* TOTAL DELIVERIES */}
  <div className="bg-white rounded-2xl p-4 shadow-md border border-orange-100">
    <p className="text-xs text-gray-500">
      Today's Deliveries
    </p>

    <p className="text-3xl font-black text-orange-600 mt-1">
      {filteredDeliveries.length}
    </p>
  </div>


  {/* MORNING */}
  <div className="bg-white rounded-2xl p-4 shadow-md border border-orange-100">
    <p className="text-xs text-gray-500">
      🌅 Morning
    </p>

    <p className="text-3xl font-black text-orange-500 mt-1">
      {morningCount}
    </p>
  </div>


  {/* EVENING */}
  <div className="bg-white rounded-2xl p-4 shadow-md border border-purple-100">
    <p className="text-xs text-gray-500">
      🌙 Evening
    </p>

    <p className="text-3xl font-black text-purple-600 mt-1">
      {eveningCount}
    </p>
  </div>


  {/* TOTAL LITERS */}
  <div className="bg-white rounded-2xl p-4 shadow-md border border-green-100">
    <p className="text-xs text-gray-500">
      🥛 Total Milk
    </p>

    <p className="text-3xl font-black text-green-600 mt-1">
      {summary.totalLiters.toFixed(1)} L
    </p>
  </div>

</div>
<div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">

  <div className="flex items-center justify-between mb-3">
    <h3 className="font-black text-green-800">
      🥛 Milk Loading Summary
    </h3>

    <span className="text-sm font-bold text-green-700">
      {summary.totalLiters.toFixed(1)} Liters
    </span>
  </div>


  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
      <p className="text-xs text-gray-500">
        500 ml
      </p>

      <p className="text-2xl font-black text-orange-600">
        {summary.bottles500ml}
      </p>

      <p className="text-xs text-gray-400">
        bottles
      </p>
    </div>


    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
      <p className="text-xs text-gray-500">
        1 L
      </p>

      <p className="text-2xl font-black text-green-600">
        {summary.bottles1L}
      </p>

      <p className="text-xs text-gray-400">
        bottles
      </p>
    </div>


    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
      <p className="text-xs text-gray-500">
        2 L
      </p>

      <p className="text-2xl font-black text-blue-600">
        {summary.bottles2L}
      </p>

      <p className="text-xs text-gray-400">
        bottles
      </p>
    </div>


    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
      <p className="text-xs text-gray-500">
        5 L
      </p>

      <p className="text-2xl font-black text-purple-600">
        {summary.bottles5L}
      </p>

      <p className="text-xs text-gray-400">
        cans
      </p>
    </div>

  </div>

</div>
       {/* ========================================= */}
{/* DELIVERY LIST - MODERN + ANIMATED */}
{/* ========================================= */}

{/* ========================================= */}
{/* DELIVERY LIST */}
{/* ========================================= */}

<div className="mt-6 space-y-5">

  {filteredDeliveries.length === 0 ? (

    <div className="bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100">
      <div className="text-5xl mb-3">📦</div>

      <p className="text-gray-500 font-bold">
        No deliveries found
      </p>
    </div>

  ) : (

    filteredDeliveries.map((delivery) => {

      const locked = isStatusLocked(delivery);

      const items = getDeliveryItems(delivery);

      return (

        <div
          key={`${delivery.type}-${delivery.id}`}
          className="
            bg-white
            rounded-3xl
            overflow-hidden
            shadow-lg
            border border-gray-100
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-2xl
          "
        >

          {/* ================================= */}
          {/* CUSTOMER HEADER */}
          {/* ================================= */}

          <div className="
            bg-gradient-to-r
            from-orange-500
            via-amber-500
            to-orange-500
            p-4 sm:p-5
            text-white
          ">

            <div className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
            ">

              <div className="min-w-0">

                <h3 className="
                  text-lg
                  sm:text-xl
                  font-black
                  truncate
                ">
                  {delivery.customer?.full_name || "Customer"}
                </h3>

                <p className="text-sm text-white/90">
                  📞 {delivery.customer?.phone || "-"}
                </p>

              </div>


              {/* TYPE */}

              <span className="
                self-start
                sm:self-auto
                px-3
                py-1.5
                rounded-full
                bg-green-500
                text-white
                text-xs
                sm:text-sm
                font-black
                shadow
              ">
                {delivery.type}
              </span>

            </div>

          </div>


          {/* ================================= */}
          {/* DELIVERY INFORMATION */}
          {/* ================================= */}

          <div className="p-4 sm:p-5">

            <div className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
            ">

              {/* DELIVERY NUMBER */}

              <div>

                <p className="text-xs text-gray-400 uppercase font-bold">
                  Delivery No
                </p>

                <p className="text-base sm:text-lg font-black text-gray-800">
                  {delivery.number || "-"}
                </p>

              </div>


              {/* SHIFT */}

              <div>

                <p className="text-xs text-gray-400 uppercase font-bold">
                  Shift
                </p>

                <p className="font-bold text-gray-700">

                  {delivery.delivery_shift === "Morning"
                    ? "🌅 Morning"
                    : delivery.delivery_shift === "Evening"
                    ? "🌙 Evening"
                    : "Shift not set"}

                </p>

              </div>

            </div>


            {/* DATE */}

            <div className="mt-3">

              <p className="text-xs text-gray-400 uppercase font-bold">
                Delivery Date
              </p>

              <p className="text-sm text-gray-600">
                📅 {delivery.delivery_date || "-"}
              </p>

            </div>


            {/* ================================= */}
            {/* ADDRESS */}
            {/* ================================= */}

            <div className="
              mt-4
              p-3
              rounded-2xl
              bg-slate-50
              border border-slate-100
            ">

              <p className="text-xs text-gray-400 uppercase font-bold mb-1">
                Delivery Address
              </p>

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">

                📍{" "}

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

              </p>

            </div>


            {/* ================================= */}
            {/* PRODUCTS */}
            {/* ================================= */}

            <div className="mt-5">

              <div className="flex items-center justify-between mb-3">

                <h4 className="
                  font-black
                  text-gray-800
                  text-base
                  sm:text-lg
                ">
                  🥛 Delivery Items
                </h4>

                <span className="text-xs text-gray-400">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>

              </div>


              {items.length === 0 ? (

                <div className="
                  bg-gray-50
                  rounded-2xl
                  p-4
                  text-center
                  text-sm
                  text-gray-400
                ">
                  No items found
                </div>

              ) : (

                <div className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-3
                ">

                  {items.map((item) => (

                    <div
                      key={item.id}
                      className={`
                        flex
                        items-center
                        gap-3
                        p-3
                        rounded-2xl
                        border
                        transition-all
                        duration-300
                        hover:scale-[1.02]
                        ${
                          item.is_extra
                            ? "bg-orange-50 border-orange-200"
                            : "bg-slate-50 border-gray-100"
                        }
                      `}
                    >

                      {/* IMAGE */}

                      <div className="
                        w-16
                        h-16
                        sm:w-20
                        sm:h-20
                        rounded-2xl
                        overflow-hidden
                        bg-white
                        flex-shrink-0
                        shadow-sm
                      ">

                        {item.products?.image ? (

                          <img
                            src={item.products.image}
                            alt={item.products?.name || "Milk"}
                            className="
                              w-full
                              h-full
                              object-cover
                              transition-transform
                              duration-500
                              hover:scale-110
                            "
                          />

                        ) : (

                          <div className="
                            w-full
                            h-full
                            flex
                            items-center
                            justify-center
                            text-2xl
                          ">
                            🥛
                          </div>

                        )}

                      </div>


                      {/* PRODUCT DETAILS */}

                      <div className="min-w-0 flex-1">

                        <p className="
                          font-black
                          text-gray-800
                          truncate
                        ">
                          {item.products?.name || "Milk"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {item.quantity} × {item.size}
                        </p>

                        {item.is_extra && (

                          <span className="
                            inline-block
                            mt-1
                            px-2
                            py-0.5
                            rounded-full
                            bg-orange-500
                            text-white
                            text-[10px]
                            font-black
                          ">
                            ➕ EXTRA
                          </span>

                        )}

                      </div>


                      {/* PRICE */}

                      <div className="text-right">

                        <p className="
                          font-black
                          text-orange-600
                        ">
                          ×{item.quantity}
                        </p>

                        {item.total_price != null && (

                          <p className="text-xs text-gray-500">
                            ₹{Number(item.total_price).toFixed(2)}
                          </p>

                        )}

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>


            {/* ================================= */}
            {/* TOTAL / PAYMENT / STATUS */}
            {/* ================================= */}

            <div className="
              mt-5
              bg-green-50
              border border-green-100
              rounded-2xl
              p-4
            ">

              <div className="
                flex
                justify-between
                items-center
                gap-3
              ">

                <span className="text-gray-600">
                  Total Amount
                </span>

                <span className="
                  text-xl
                  font-black
                  text-green-700
                ">
                  ₹{Number(delivery.total_amount || 0).toFixed(2)}
                </span>

              </div>


              <div className="
                flex
                justify-between
                items-center
                mt-2
                gap-3
              ">

                <span className="text-gray-600">
                  Payment
                </span>

                <span className="
                  text-sm
                  sm:text-base
                  font-semibold
                  text-gray-700
                  text-right
                ">
                  {delivery.payment_method || "-"}
                </span>

              </div>


              <div className="
                flex
                justify-between
                items-center
                mt-3
                gap-3
              ">

                <span className="text-gray-600">
                  Status
                </span>


                <span
                  className={`
                    px-3
                    py-1.5
                    rounded-full
                    text-xs
                    sm:text-sm
                    font-black
                    ${
                      delivery.status === "Delivered"
                        ? "bg-green-200 text-green-800"
                        : delivery.status === "Missed"
                        ? "bg-red-200 text-red-800"
                        : delivery.status === "Out for Delivery"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-yellow-200 text-yellow-800"
                    }
                  `}
                >
                  {delivery.status}
                </span>

              </div>

            </div>


            {/* ================================= */}
            {/* ACTION BUTTONS */}
            {/* ================================= */}

            <div className="
              mt-5
              grid
              grid-cols-2
              gap-3
            ">

              {/* OUT FOR DELIVERY */}

              <button
                disabled={
                  locked ||
                  delivery.status === "Out for Delivery"
                }

                onClick={() =>
                  updateDeliveryStatus(
                    delivery,
                    "Out for Delivery"
                  )
                }

                className={`
                  min-h-[52px]
                  rounded-2xl
                  px-3
                  py-3
                  font-black
                  text-sm
                  sm:text-base
                  text-white
                  transition-all
                  duration-300

                  ${
                    locked ||
                    delivery.status === "Out for Delivery"
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg"
                  }
                `}
              >
                🚚 Out For Delivery
              </button>


              {/* DELIVERED */}

              <button
                disabled={locked}

                onClick={() =>
                  updateDeliveryStatus(
                    delivery,
                    "Delivered"
                  )
                }

                className={`
                  min-h-[52px]
                  rounded-2xl
                  px-3
                  py-3
                  font-black
                  text-sm
                  sm:text-base
                  text-white
                  transition-all
                  duration-300

                  ${
                    locked
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 active:scale-95 shadow-md hover:shadow-lg"
                  }
                `}
              >
                ✅ Delivered
              </button>


              {/* MISSED */}

              <button
                disabled={locked}

                onClick={() =>
                  updateDeliveryStatus(
                    delivery,
                    "Missed"
                  )
                }

                className={`
                  min-h-[52px]
                  rounded-2xl
                  px-3
                  py-3
                  font-black
                  text-sm
                  sm:text-base
                  text-white
                  transition-all
                  duration-300

                  ${
                    locked
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 active:scale-95 shadow-md hover:shadow-lg"
                  }
                `}
              >
                ❌ Missed
              </button>


              {/* CALL */}

              <a
                href={`tel:${delivery.customer?.phone || ""}`}

                className="
                  min-h-[52px]
                  rounded-2xl
                  px-3
                  py-3
                  font-black
                  text-sm
                  sm:text-base
                  text-white
                  bg-indigo-600
                  hover:bg-indigo-700
                  active:scale-95
                  shadow-md
                  hover:shadow-lg
                  transition-all
                  duration-300
                  flex
                  items-center
                  justify-center
                "
              >
                📞 Call
              </a>

            </div>


            {/* ================================= */}
            {/* MAP BUTTON */}
            {/* ================================= */}

            <button
              onClick={() => handleNavigate(delivery)}

              className="
                w-full
                mt-3
                min-h-[52px]
                rounded-2xl
                bg-orange-500
                hover:bg-orange-600
                active:scale-[0.98]
                text-white
                font-black
                transition-all
                duration-300
                shadow-md
              "
            >
              🗺️ Navigate to Customer
            </button>

          </div>

        </div>

      );

    })

  )}

</div>
            

    



        {/* ROUTE / NOTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
            <div className="text-4xl">🗺️</div>
            <h2 className="text-xl font-black text-blue-700 mt-3">
              Delivery Areas
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Dammaiguda, ECIL, Kapra, Rampally, Parimal Nagar
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-green-100">
            <div className="text-4xl">⏰</div>
            <h2 className="text-xl font-black text-green-700 mt-3">
              Morning Delivery Slot
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              Daily milk delivery from 5:30 AM to 8:30 AM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}