import { useEffect, useState } from "react";

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

  // Individual assignment
  const [selectedDelivery, setSelectedDelivery] =
    useState(null);

  const [assignOpen, setAssignOpen] =
    useState(false);

  // Bulk assignment
  const [selectedDeliveries, setSelectedDeliveries] =
    useState([]);

  const [selectedDeliveryBoy, setSelectedDeliveryBoy] =
    useState("");

  useEffect(() => {
    loadDeliveries();
    loadDeliveryBoys();
  }, []);

  // ==========================================
  // Load Deliveries
  // ==========================================

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

  // ==========================================
  // Load Delivery Boys
  // ==========================================

  async function loadDeliveryBoys() {
    try {

      const data =
        await getDeliveryBoys();

      setDeliveryBoys(data || []);

    } catch (err) {

      console.error(
        "Unable to load delivery boys:",
        err
      );

    }
  }

  // ==========================================
  // Generate Deliveries
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
  // Status Change
  // ==========================================

  async function handleStatusChange(
    id,
    status
  ) {

    try {

      await updateSubscriptionDeliveryStatus(
        id,
        status
      );

      await loadDeliveries();

    } catch (err) {

      console.error(err);

      alert(err.message);

    }

  }

  // ==========================================
  // Filter
  // ==========================================

  const filtered =
    deliveries.filter((d) => {

      const text =
        (
          `${d.delivery_number || ""} ${
            d.customers?.full_name || ""
          } ${
            d.customers?.phone || ""
          }`
        ).toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (
          status === "" ||
          d.status === status
        )
      );

    });

  // ==========================================
  // Selectable Deliveries
  // ==========================================

  const selectableDeliveries =
    filtered.filter(
      (delivery) =>
        delivery.status !== "Delivered" &&
        delivery.status !== "Cancelled" &&
        delivery.status !== "Missed"
    );

  // ==========================================
  // Select All
  // ==========================================

  const allSelected =
    selectableDeliveries.length > 0 &&
    selectableDeliveries.every(
      (delivery) =>
        selectedDeliveries.includes(
          delivery.id
        )
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

  // ==========================================
  // Select Single Delivery
  // ==========================================

  function toggleDeliverySelection(id) {

    setSelectedDeliveries((previous) => {

      if (previous.includes(id)) {

        return previous.filter(
          (item) => item !== id
        );

      }

      return [
        ...previous,
        id,
      ];

    });

  }

  // ==========================================
  // Bulk Assign
  // ==========================================

  async function handleBulkAssign() {

    if (
      selectedDeliveries.length === 0
    ) {

      alert(
        "Please select at least one delivery."
      );

      return;
    }

    if (!selectedDeliveryBoy) {

      alert(
        "Please select a delivery boy."
      );

      return;
    }

    const boy =
      deliveryBoys.find(
        (item) =>
          item.id === selectedDeliveryBoy
      );

    const confirmed =
      window.confirm(
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

  // ==========================================
  // Status Colors
  // ==========================================

  const statusColor = (status) => {

    switch (status) {

      case "Pending":
        return "bg-yellow-100 text-yellow-700";

      case "Assigned":
        return "bg-blue-100 text-blue-700";

      case "Out for Delivery":
        return "bg-purple-100 text-purple-700";

      case "Delivered":
        return "bg-green-100 text-green-700";

      case "Missed":
        return "bg-red-100 text-red-700";

      case "Failed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";

    }

  };

  // ==========================================
  // Clear Selection
  // ==========================================

  function clearSelection() {

    setSelectedDeliveries([]);
    setSelectedDeliveryBoy("");

  }

  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="p-4 md:p-6">

      {/* ================================= */}
      {/* Header */}
      {/* ================================= */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

        <div>

          <h1 className="text-2xl md:text-3xl font-bold">
            Subscription Deliveries
          </h1>

          <p className="text-gray-500">
            Manage Today's Milk Deliveries
          </p>

        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="
            w-full md:w-auto
            bg-green-600
            hover:bg-green-700
            text-white
            px-6
            py-3
            rounded-xl
            font-semibold
          "
        >

          {loading
            ? "Generating..."
            : "Generate Today's Deliveries"}

        </button>

      </div>


      {/* ================================= */}
      {/* Search / Filter */}
      {/* ================================= */}

      <div className="bg-white rounded-xl shadow p-4 mb-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            className="border rounded-lg p-3"
            placeholder="Search Delivery No / Customer / Phone"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            className="border rounded-lg p-3"
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

          </select>

        </div>

      </div>


      {/* ================================= */}
      {/* BULK ASSIGN BAR */}
      {/* ================================= */}

      {selectedDeliveries.length > 0 && (

        <div
          className="
            bg-green-50
            border
            border-green-200
            rounded-2xl
            p-4
            mb-4
            shadow-sm
          "
        >

          <div className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-4
          ">

            {/* Selected count */}

            <div>

              <div className="text-green-800 font-bold">

                {selectedDeliveries.length}
                {" "}
                {selectedDeliveries.length === 1
                  ? "Delivery"
                  : "Deliveries"} Selected

              </div>

              <div className="text-sm text-green-600">

                Select a delivery boy to assign

              </div>

            </div>


            {/* Controls */}

            <div className="
              flex
              flex-col
              sm:flex-row
              gap-3
            ">

              <select
                value={selectedDeliveryBoy}
                onChange={(e) =>
                  setSelectedDeliveryBoy(
                    e.target.value
                  )
                }
                className="
                  border
                  border-green-200
                  bg-white
                  rounded-xl
                  px-4
                  py-3
                  min-w-[220px]
                  outline-none
                "
              >

                <option value="">
                  Select Delivery Boy
                </option>

                {deliveryBoys.map(
                  (boy) => (

                    <option
                      key={boy.id}
                      value={boy.id}
                    >
                      {boy.full_name}
                    </option>

                  )
                )}

              </select>


              <button
                onClick={handleBulkAssign}
                disabled={
                  assigning ||
                  !selectedDeliveryBoy
                }
                className="
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-gray-300
                  disabled:cursor-not-allowed
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-bold
                  whitespace-nowrap
                "
              >

                {assigning
                  ? "Assigning..."
                  : "🚚 Assign Selected"}

              </button>


              <button
                onClick={clearSelection}
                className="
                  bg-white
                  border
                  border-gray-200
                  hover:bg-gray-50
                  text-gray-700
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                "
              >
                Clear
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ================================= */}
      {/* TABLE */}
      {/* ================================= */}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">

        <table className="min-w-[1250px] w-full">

          <thead className="bg-green-600 text-white">

            <tr>

              {/* Select All */}

              <th className="p-3 text-center w-14">

                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="
                    w-5
                    h-5
                    accent-green-700
                    cursor-pointer
                  "
                />

              </th>

              <th className="p-3 text-left">
                Delivery No
              </th>

              <th className="p-3 text-left">
                Customer
              </th>

              <th className="p-3 text-left">
                Phone
              </th>

              <th className="p-3 text-left">
                Area
              </th>

              <th className="p-3 text-left">
                Delivery Boy
              </th>

              <th className="p-3 text-left">
                Delivery Date
              </th>

              <th className="p-3 text-left">
                Products
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-center">
                Actions
              </th>

            </tr>

          </thead>


          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan={10}
                  className="text-center py-10"
                >
                  Loading...
                </td>

              </tr>

            )}


            {!loading &&
              filtered.length === 0 && (

                <tr>

                  <td
                    colSpan={10}
                    className="
                      text-center
                      py-10
                      text-gray-500
                    "
                  >
                    No Deliveries Found
                  </td>

                </tr>

              )}


            {!loading &&
              filtered.map(
                (delivery) => {

                  const selectable =
                    delivery.status !== "Delivered" &&
                    delivery.status !== "Cancelled" &&
                    delivery.status !== "Missed";

                  const checked =
                    selectedDeliveries.includes(
                      delivery.id
                    );

                  return (

                    <tr
                      key={delivery.id}
                      className={`
                        border-t
                        hover:bg-gray-50
                        ${
                          checked
                            ? "bg-green-50"
                            : ""
                        }
                      `}
                    >

                      {/* Checkbox */}

                      <td className="p-3 text-center">

                        {selectable ? (

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleDeliverySelection(
                                delivery.id
                              )
                            }
                            className="
                              w-5
                              h-5
                              accent-green-600
                              cursor-pointer
                            "
                          />

                        ) : (

                          <span className="text-gray-300">
                            —
                          </span>

                        )}

                      </td>


                      {/* Delivery Number */}

                      <td className="p-3 font-semibold">
                        {delivery.delivery_number}
                      </td>


                      {/* Customer */}

                      <td className="p-3">
                        {delivery.customers?.full_name}
                      </td>


                      {/* Phone */}

                      <td className="p-3">
                        {delivery.customers?.phone}
                      </td>


                      {/* Area */}

                      <td className="p-3">
                        {delivery.addresses?.area}
                      </td>


                      {/* Delivery Boy */}

                      <td className="p-3">

                        <div className="font-medium">

                          {delivery.delivery_boys?.full_name ||
                            "-"}

                        </div>

                        {delivery.delivery_boys && (

                          <div className="text-xs text-green-600">
                            Assigned
                          </div>

                        )}

                      </td>


                      {/* Date */}

                      <td className="p-3">

                        {delivery.delivery_date
                          ? new Date(
                              delivery.delivery_date
                            ).toLocaleDateString()
                          : "-"}

                      </td>


                      {/* Products */}

                      <td className="p-3">

                        <div className="space-y-2">

                          {delivery
                            .subscription_delivery_items
                            ?.map((item) => {

                              const isExtra =
                                item.is_extra === true;

                              return (

                                <div
                                  key={item.id}
                                  className={`
                                    flex
                                    items-center
                                    gap-2
                                    ${
                                      isExtra
                                        ? "bg-orange-50 border border-orange-200 rounded-lg px-2 py-1"
                                        : ""
                                    }
                                  `}
                                >

                                  <span
                                    className={
                                      isExtra
                                        ? "font-semibold text-orange-900"
                                        : "text-gray-800"
                                    }
                                  >

                                    {item.products?.name}

                                    {" ("}

                                    {item.quantity}

                                    {" × "}

                                    {item.size}

                                    {")"}

                                  </span>


                                  {isExtra && (

                                    <span
                                      className="
                                        inline-flex
                                        items-center
                                        gap-1
                                        rounded-full
                                        bg-orange-500
                                        text-white
                                        px-2
                                        py-1
                                        text-[11px]
                                        font-bold
                                      "
                                    >
                                      🥛 EXTRA
                                    </span>

                                  )}

                                </div>

                              );

                            })}

                        </div>

                      </td>


                      {/* Status */}

                      <td className="p-3">

                        <span
                          className={`
                            px-3
                            py-1
                            rounded-full
                            text-xs
                            font-semibold
                            ${statusColor(
                              delivery.status
                            )}
                          `}
                        >
                          {delivery.status}
                        </span>

                      </td>


                      {/* Individual Assign */}

                      <td className="p-3 text-center">

                        <button
                          onClick={() => {

                            setSelectedDelivery(
                              delivery
                            );

                            setAssignOpen(true);

                          }}
                          className="
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            px-4
                            py-2
                            rounded-lg
                          "
                        >
                          Assign
                        </button>

                      </td>

                    </tr>

                  );

                }
              )}

          </tbody>

        </table>

      </div>


      {/* ================================= */}
      {/* Existing Individual Assign Modal */}
      {/* ================================= */}

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