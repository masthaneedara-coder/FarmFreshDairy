import { useEffect, useState } from "react";

import {
  assignSubscriptionDelivery,
} from "../../services/subscriptionDeliveryService";

import {
  fetchDeliveryBoys,
} from "../../config/api";

export default function AssignSubscriptionDeliveryBoyModal({
  open,
  delivery,
  onClose,
  onAssigned,
}) {
  const [deliveryBoys, setDeliveryBoys] =
    useState([]);

  const [selectedBoy, setSelectedBoy] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {

    if (open) {

      loadDeliveryBoys();

      setSelectedBoy(
        delivery?.delivery_boy_id || ""
      );

    }

  }, [open, delivery]);

  async function loadDeliveryBoys() {

    try {

      const boys =
        await fetchDeliveryBoys();

      setDeliveryBoys(boys);

    } catch (err) {

      console.error(err);

    }

  }

  async function handleAssign() {

    if (!selectedBoy) {

      alert("Please select Delivery Boy");

      return;

    }

    try {

      setLoading(true);

      await assignSubscriptionDelivery(
        delivery.id,
        selectedBoy
      );

      alert(
        "Delivery Boy Assigned Successfully"
      );

      onAssigned();

      onClose();

    } catch (err) {

      console.error(err);

      alert(err.message);

    } finally {

      setLoading(false);

    }

  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

      <div className="bg-white rounded-xl w-full max-w-md p-6">

        <h2 className="text-xl font-bold mb-5">
          Assign Delivery Boy
        </h2>

        <div className="space-y-4">

          <div>

            <label className="block mb-2">
              Delivery Boy
            </label>

            <select
              className="w-full border rounded-lg p-3"
              value={selectedBoy}
              onChange={(e) =>
                setSelectedBoy(
                  e.target.value
                )
              }
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

          </div>

          <div className="flex justify-end gap-3">

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>

            <button
              onClick={handleAssign}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white"
            >
              {loading
                ? "Assigning..."
                : "Assign"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}