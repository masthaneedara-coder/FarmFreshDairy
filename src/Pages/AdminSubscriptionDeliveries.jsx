import { useEffect, useState } from "react";

import {
  getSubscriptionDeliveries,
  generateSubscriptionDeliveries,
  updateSubscriptionDeliveryStatus,
} from "../services/subscriptionDeliveryService";

import AssignDeliveryBoyModal from "../Components/admin/AssignDeliveryBoyModal";
import AssignSubscriptionDeliveryBoyModal
  from "../Components/admin/AssignSubscriptionDeliveryBoyModal";

export default function AdminSubscriptionDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [selectedDelivery, setSelectedDelivery] =
    useState(null);

  const [assignOpen, setAssignOpen] =
    useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      setLoading(true);

      const data =
        await getSubscriptionDeliveries();

      setDeliveries(data);

    } catch (err) {
      console.error(err);
      alert("Unable to load deliveries");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    try {

      setLoading(true);

      const res =
        await generateSubscriptionDeliveries();

      alert(
        `Generated ${res.generated} Deliveries`
      );

      loadDeliveries();

    } catch (err) {
      console.error(err);

      alert(err.message);

    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(
    id,
    status
  ) {
    try {

      await updateSubscriptionDeliveryStatus(
        id,
        status
      );

      loadDeliveries();

    } catch (err) {
      console.error(err);

      alert(err.message);

    }
  }

  const filtered = deliveries.filter((d) => {

    const text =
      (
        d.delivery_number +
        d.customers?.full_name +
        d.customers?.phone
      ).toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (status === "" ||
        d.status === status)
    );

  });
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

    default:
      return "bg-gray-100 text-gray-700";
  }
};

  return (
    <div className="p-6">

    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

        <div>

          <h1 className="text-3xl font-bold">
            Subscription Deliveries
          </h1>

          <p className="text-gray-500">
            Manage Today's Milk Deliveries
          </p>

        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
          >
          {loading
          ? "Generating..."
          : "Generate Today's Deliveries"}
          </button>

      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6">

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

            <option>
              Pending
            </option>

            <option>
              Assigned
            </option>

            <option>
              Out for Delivery
            </option>

            <option>
              Delivered
            </option>
            <option>Missed</option>

            <option>
              Failed
            </option>

          </select>

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow overflow-x-auto">

       <table className="min-w-[1200px] w-full">

          <thead className="bg-green-600 text-white">
              <tr>
                <th className="p-3 text-left">Delivery No</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Area</th>
                <th className="p-3 text-left">Delivery Boy</th>
                <th className="p-3 text-left">Delivery Date</th>
                <th className="p-3 text-left">Products</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

          <tbody>

            {loading && (
            <tr>
            <td
            colSpan={9}
            className="text-center py-10"
            >
            Loading...
            </td>
            </tr>
            )}

            {!loading && filtered.length === 0 && (
            <tr>
            <td
            colSpan={9}
            className="text-center py-10 text-gray-500"
            >
            No Deliveries Found
            </td>
            </tr>
            )}

            {!loading &&
            filtered.map((delivery) => (

            <tr
            key={delivery.id}
            className="border-t hover:bg-gray-50"
            >

            <td className="p-3 font-semibold">
            {delivery.delivery_number}
            </td>

            <td className="p-3">
            {delivery.customers?.full_name}
            </td>

            <td className="p-3">
            {delivery.customers?.phone}
            </td>

            <td className="p-3">
            {delivery.addresses?.area}
            </td>

            <td className="p-3">

            <div className="font-medium">

            {delivery.delivery_boys?.full_name || "-"}

            </div>

            {delivery.delivery_boys && (
            <div className="text-xs text-green-600">
            Assigned
            </div>
            )}

            </td>

            <td className="p-3">

            {delivery.delivery_date
            ? new Date(
            delivery.delivery_date
            ).toLocaleDateString()
            : "-"}

            </td>

           <td className="p-3">

              <div className="space-y-2">

                {delivery.subscription_delivery_items?.map((item) => {

                  const isExtra = item.is_extra === true;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 ${
                        isExtra
                          ? "bg-orange-50 border border-orange-200 rounded-lg px-2 py-1"
                          : ""
                      }`}
                    >

                      {/* Product */}
                      <span
                        className={
                          isExtra
                            ? "font-semibold text-orange-900"
                            : "text-gray-800"
                        }
                      >
                        {item.products?.name} (
                        {item.quantity} × {item.size}
                        )
                      </span>

                      {/* Extra Badge */}
                      {isExtra && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 text-white px-2 py-1 text-[11px] font-bold">
                          🥛 EXTRA
                        </span>
                      )}

                    </div>
                  );
                })}

              </div>

            </td>

            <td className="p-3">

            <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
            delivery.status
            )}`}
            >

            {delivery.status}

            </span>

            </td>

            <td className="p-3 text-center">

            <button
            onClick={() => {
            setSelectedDelivery(delivery);
            setAssignOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >

            Assign

            </button>

            </td>

            </tr>

            ))}
            </tbody>

        </table>

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