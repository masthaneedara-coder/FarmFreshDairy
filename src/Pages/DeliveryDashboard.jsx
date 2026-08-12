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

export default function DeliveryDashboard() {
  const navigate = useNavigate();

useEffect(() => {
  if (!isDeliveryLoggedIn()) {
    navigate("/delivery-login");
    return;
  }

  loadDeliveries();
}, [navigate]);

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
async function updateDeliveryStatus(delivery, status) {
  try {
    let res;

    if (delivery.type === "Order") {
      res = await updateOrderStatus(
        delivery.id,
        status
      );
    } else {
      res = await updateSubscriptionDeliveryStatus(
        delivery.id,
        status
      );
    }

    if (res.success) {
      // Refresh delivery data
      await loadDeliveries();

      // Show success message
      alert(
        `Delivery status updated successfully to "${status}"`
      );
    } else {
      alert(
        res.message || "Failed to update delivery status"
      );
    }

  } catch (err) {
    console.error(
      "Update Delivery Status Error:",
      err
    );

    alert(
      "Failed to update delivery status"
    );
  }
}


const filteredDeliveries = deliveries.filter((d) => {
  const q = search.toLowerCase().trim();

  const matchesSearch =
    String(d.customer?.full_name || "")
      .toLowerCase()
      .includes(q) ||

    String(d.customer?.phone || "")
      .includes(q) ||

    String(d.address?.area || "")
      .toLowerCase()
      .includes(q);

  const matchesStatus =
    statusFilter === "All" ||
    d.status === statusFilter;

  return (
    matchesSearch &&
    matchesStatus
  );
});

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

  {/* SEARCH */}
  <div>
    <label className="block text-sm font-bold text-gray-600 mb-2">
      Search Delivery
    </label>

    <input
      type="text"
      placeholder="Search customer / phone / area..."
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
      className="w-full border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-orange-400"
    />
  </div>


  {/* STATUS FILTER */}
        <div>
          <label className="block text-sm font-bold text-gray-600 mb-2">
            Filter by Status
          </label>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="w-full border border-gray-200 rounded-xl p-4 bg-white outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="All">
              All Deliveries
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
          </select>
        </div>

      </div>
       
            

        {/* DELIVERY LIST */}
        <div className="mt-6 bg-white rounded-3xl shadow-lg border border-orange-100 p-5 sm:p-6">
          <h2 className="text-2xl font-black text-orange-600 mb-5">
            Today Delivery List
          </h2>
          

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {loading ? (

            <div className="text-center py-16">
            Loading...
            </div>

            ) : filteredDeliveries.length === 0 ? (

            <div className="bg-white rounded-3xl shadow-lg p-12 text-center">

            <div className="text-7xl mb-4">
            🚚
            </div>

            <h2 className="text-2xl font-bold">
            No Deliveries Found
            </h2>

            <p className="text-gray-500 mt-2">
            There are no deliveries available.
            </p>

            </div>

            ) : (

            filteredDeliveries.map((delivery) => {

            const extraItems = (delivery.items || []).filter(
              (item) => item.is_extra === true
            );

            return (

            <div
                key={delivery.id}
                className="
                  bg-white
                  rounded-2xl
                  shadow-md
                  border
                  border-gray-200
                  overflow-hidden
                  h-full
                  flex
                  flex-col
                "
              >

            {/* Header */}

            <div className="bg-orange-500 text-white p-4">

            <div className="flex justify-between items-center">

            <div>

            <h2 className="font-bold text-lg">

            {delivery.customer?.full_name}

            </h2>

            <p className="text-sm opacity-90">

            {delivery.customer?.phone}

            </p>

            </div>

            <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
            delivery.type==="Order"
            ? "bg-blue-500"
            : "bg-green-600"
            }`}
            >

            {delivery.type}

            </span>

            </div>

            </div>

            {/* Body */}

           <div className="p-4 space-y-3 flex-1">

            <div>

            <p className="text-sm text-gray-500">
            Delivery No
            </p>

            <p className="font-bold">
            {delivery.number}
            </p>

            </div>

            <div>

            <p className="text-sm text-gray-500">
            Address
            </p>

            <p>

            {delivery.address
            ? `${delivery.address.house_no ?? ""} ${delivery.address.street ?? ""}, ${delivery.address.area ?? ""}`
            : "No Address"}

            </p>

            </div>

            <div>
              {extraItems.length > 0 && (

            <div className="mb-3 rounded-xl bg-orange-100 border border-orange-300 p-3">

              <div className="font-semibold text-orange-700">

                🥛 Extra Milk Added

              </div>

              <div className="text-sm text-orange-600">

                {extraItems.length} Extra Item(s)

              </div>

            </div>

          )}

            <p className="text-sm text-gray-500 mb-2">
            Products
            </p>

           <div className="grid grid-cols-3 gap-2 mt-3">
            {(delivery.items || []).map((item) => (
              <div
                key={item.id}
                className={`
                  rounded-xl
                  border
                  p-2
                  flex
                  flex-col
                  items-center
                  justify-center
                  min-h-[120px]
                  ${
                    item.is_extra
                      ? "bg-orange-50 border-orange-300"
                      : "bg-slate-50 border-gray-200"
                  }
                `}
              >
                <img
                  src={item.products?.image}
                  alt={item.products?.name}
                  className="w-12 h-12 mx-auto rounded-lg object-cover"
                />

                {item.is_extra && (
                  <span className="mt-2 px-2 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                    ➕ EXTRA
                  </span>
                )}

                <p className="mt-2 text-sm font-semibold text-center">
                  {item.products?.name}
                </p>

                <p className="text-xs text-gray-500">
                  {item.quantity} × {item.size}
                </p>
              </div>
            ))}
          </div>

            </div>
            <div className="mt-3 bg-green-50 rounded-xl p-3">
            <div className="flex justify-between">
              <span>Total Amount</span>
              <span className="font-bold text-green-700">
                ₹{delivery.total_amount ?? 0}
               
              </span>
            </div>

            <div className="flex justify-between mt-1">
              <span>Payment</span>
              <span>{delivery.payment_method || "-"}</span>
            </div>

            <div className="flex justify-between mt-1">
              <span>Status</span>
              <span
                className={
                  delivery.payment_status === "Paid"
                    ? "text-green-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
              >
                <span
            className={`px-3 py-2 rounded-full text-sm font-bold ${
            delivery.status==="Delivered"
            ? "bg-green-100 text-green-700"
            : delivery.status==="Missed"
            ? "bg-red-100 text-red-700"
            : delivery.status==="Out for Delivery"
            ? "bg-blue-100 text-blue-700"
            : "bg-yellow-100 text-yellow-700"
            }`}
            >

            {delivery.status}

            </span>
              </span>
            </div>
          </div>

            <div>


            </div>

           <div className="grid grid-cols-2 gap-2">

              {/* OUT FOR DELIVERY */}
              <button
                disabled={delivery.status === "Delivered"}
                onClick={() =>
                  updateDeliveryStatus(
                    delivery,
                    "Out for Delivery"
                  )
                }
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold disabled:bg-gray-400"
              >
                🚚 Out For Delivery
              </button>


              {/* DELIVERED */}
              <button
                disabled={delivery.status === "Delivered"}
                onClick={() =>
                  updateDeliveryStatus(
                    delivery,
                    "Delivered"
                  )
                }
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold disabled:bg-gray-400"
              >
                ✅ Delivered
              </button>


              {/* MISSED */}
              <button
                disabled={delivery.status === "Delivered"}
                onClick={() =>
                  updateDeliveryStatus(
                    delivery,
                    "Missed"
                  )
                }
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold disabled:bg-gray-400"
              >
                ❌ Missed
              </button>


              {/* CALL */}
              <a
                href={`tel:${delivery.customer?.phone}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-center font-semibold"
              >
                📞 Call
              </a>

            </div>

            <button
                type="button"
                onClick={() => handleNavigate(delivery)}
                className="
                  w-full
                  mt-3
                  bg-orange-500
                  hover:bg-orange-600
                  active:scale-[0.98]
                  text-white
                  py-3
                  rounded-xl
                  font-bold
                  transition-all
                  duration-200
                  flex
                  items-center
                  justify-center
                  gap-2
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