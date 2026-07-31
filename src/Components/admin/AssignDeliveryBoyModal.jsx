import { useEffect, useState } from "react";
import { getDeliveryBoys } from "../../services/deliveryBoyService";
import { assignOrder } from "../../services/orderService";
export default function AssignDeliveryBoyModal({
  open,
  order,
  onClose,
  onAssigned
  
}) {
  if (!open || !order) return null;
  const [deliveryBoys, setDeliveryBoys] = useState([]);
const [selectedBoy, setSelectedBoy] = useState("");

  useEffect(() => {
    if (open) {
        loadDeliveryBoys();
    }
    }, [open]);

    async function loadDeliveryBoys() {
    try {
        const data = await getDeliveryBoys();

        setDeliveryBoys(
        data.filter((boy) => boy.is_active)
        );
    } catch (err) {
        console.error(err);
    }
    }
    const handleAssign = async () => {

  if (!selectedBoy) {
    alert("Please select a Delivery Boy");
    return;
  }

  try {
    await assignOrder(
      order.id,
      selectedBoy
    );

    alert("Delivery Boy Assigned Successfully");

    onAssigned();

    onClose();

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
  

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center z-50">

        <div className="bg-white rounded-2xl w-[500px] p-6">

          <h2 className="text-2xl font-bold mb-6">
            Assign Delivery Boy
          </h2>

          <div className="space-y-3">

            <p>
              <strong>Order:</strong>{" "}
              {order.order_number}
            </p>

            <p>
              <strong>Customer:</strong>{" "}
              {order.customer_name}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {order.phone}
            </p>

            <p>
              <strong>Area:</strong>{" "}
              {order.addresses?.area}
            </p>
            <div className="mt-6">

                <label className="block font-semibold mb-2">
                    Delivery Boy
                </label>

                <select
                    value={selectedBoy}
                    onChange={(e) => setSelectedBoy(e.target.value)}
                    className="w-full border rounded-lg p-3"
                >
                    <option value="">
                    Select Delivery Boy
                    </option>

                    {deliveryBoys.map((boy) => (
                    <option
                        key={boy.id}
                        value={boy.id}
                    >
                        {boy.full_name} ({boy.phone})
                    </option>
                    ))}
                </select>

                </div>

          </div>

          <div className="mt-8 flex justify-end gap-3">

            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-300"
            >
              Cancel
            </button>

            <button
                onClick={handleAssign}
                className="px-4 py-2 rounded bg-green-600 text-white"
                >
                Assign
                </button>

          </div>

        </div>

      </div>
    </>
  );
}