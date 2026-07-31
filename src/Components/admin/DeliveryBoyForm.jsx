import { useEffect, useState } from "react";

export default function DeliveryBoyForm({
  open,
  onClose,
  onSave,
  editingBoy,
}) {

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    vehicle_number: "",
    password_hash: "",
  });

  useEffect(() => {

    if (editingBoy) {
      setForm({
        full_name: editingBoy.full_name || "",
        phone: editingBoy.phone || "",
        email: editingBoy.email || "",
        vehicle_number: editingBoy.vehicle_number || "",
        password_hash: "",
      });
    } else {
      setForm({
        full_name: "",
        phone: "",
        email: "",
        vehicle_number: "",
        password_hash: "",
      });
    }

  }, [editingBoy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">

        <h2 className="text-2xl font-bold mb-6">
          {editingBoy ? "Edit Delivery Boy" : "Add Delivery Boy"}
        </h2>

        <div className="space-y-4">

          <input
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name: e.target.value,
              })
            }
          />

          <input
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />

          <input
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <input
            className="w-full border rounded-lg px-4 py-2"
            placeholder="Vehicle Number"
            value={form.vehicle_number}
            onChange={(e) =>
              setForm({
                ...form,
                vehicle_number: e.target.value,
              })
            }
          />

          {!editingBoy && (

            <input
              type="password"
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Password"
              value={form.password_hash}
              onChange={(e) =>
                setForm({
                  ...form,
                  password_hash: e.target.value,
                })
              }
            />

          )}

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg bg-green-600 text-white"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}