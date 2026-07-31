import { useState } from "react";

export default function AddressForm({
  customerId,
  onSave,
  onCancel,
  address = null,
}) {
  const [form, setForm] = useState({
  house_no: address?.house_no || "",
  street: address?.street || "",
  area: address?.area || "",
  city: address?.city || "",
  state: address?.state || "",
  pincode: address?.pincode || "",
  landmark: address?.landmark || "",
  is_default: address?.is_default || false,
});

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await onSave({
      customer_id: customerId,
      ...form,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl w-full max-w-xl p-6">

        <h2 className="text-2xl font-bold mb-6">
          Add Address
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input
            name="house_no"
            placeholder="House No"
            value={form.house_no}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
            required
          />

          <input
            name="street"
            placeholder="Street"
            value={form.street}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
            required
          />

          <input
            name="area"
            placeholder="Area"
            value={form.area}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
            required
          />

          <div className="grid grid-cols-2 gap-4">

            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              className="border rounded-xl p-3"
              required
            />

            <input
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
              className="border rounded-xl p-3"
              required
            />

          </div>

          <input
            name="pincode"
            placeholder="Pincode"
            value={form.pincode}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
            required
          />

          <input
            name="landmark"
            placeholder="Landmark"
            value={form.landmark}
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
          />

          <label className="flex items-center gap-3">

            <input
              type="checkbox"
              name="is_default"
              checked={form.is_default}
              onChange={handleChange}
            />

            Set as Default Address

          </label>

          <div className="flex justify-end gap-3 pt-4">

            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl border"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-green-600 text-white"
            >
              Save Address
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}