import { useEffect, useMemo, useState } from "react";

const SIZE_OPTIONS = [
  { value: "250ml", label: "250 ml" },
  { value: "500ml", label: "500 ml" },
  { value: "1L", label: "1 L" },
  { value: "2L", label: "2 L" },
];

export default function ExtraMilkForm({
  products = [],
  loading = false,
  onSubmit,
}) {
  const [form, setForm] = useState({
    product_id: "",
    size: "500ml",
    quantity: 1,
    from_date: "",
    to_date: "",
    remarks: "",
  });

  const [errors, setErrors] = useState({});

  // Auto set today's date
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    setForm((prev) => ({
      ...prev,
      from_date: today,
      to_date: today,
    }));
  }, []);

  // Selected Product
  const selectedProduct = useMemo(() => {
    return products.find(
      (p) => p.id === form.product_id
    );
  }, [products, form.product_id]);

  // Estimate Days
  const duration = useMemo(() => {
    if (!form.from_date || !form.to_date) return 0;

    const from = new Date(form.from_date);
    const to = new Date(form.to_date);

    const diff =
      (to - from) / (1000 * 60 * 60 * 24);

    return diff >= 0 ? diff + 1 : 0;
  }, [form.from_date, form.to_date]);

  // Estimate Cost
  const estimatedCost = useMemo(() => {
    if (!selectedProduct) return 0;

    let rate = 0;

    switch (form.size) {
      case "250ml":
        rate = selectedProduct.price_250ml || 0;
        break;

      case "500ml":
        rate = selectedProduct.price_500ml || 0;
        break;

      case "1L":
        rate = selectedProduct.price_1l || 0;
        break;

      case "2L":
        rate = selectedProduct.price_2l || 0;
        break;

      default:
        rate = 0;
    }

    return rate * duration * Number(form.quantity);
  }, [
    selectedProduct,
    form.size,
    form.quantity,
    duration,
  ]);

  function validate() {
    const e = {};

    if (!form.product_id)
      e.product = "Select a product";

    if (Number(form.quantity) <= 0)
      e.quantity = "Invalid quantity";

    if (!form.from_date)
      e.from_date = "Required";

    if (!form.to_date)
      e.to_date = "Required";

    if (
      new Date(form.to_date) <
      new Date(form.from_date)
    ) {
      e.to_date =
        "To Date cannot be before From Date";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit(form);
  }
  async function handleSubmit(data) {

  console.log("handleSubmit called");

  console.log(data);

  console.log(subscription);

  try {

    const res = await createExtraMilkRequest({
      customer_id: customer.id,
      subscription_id: subscription.id,
      ...data,
    });

    console.log("API Response:", res);

  } catch (err) {

    console.error("API Error:", err);

  }

}

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold mb-6">
        🥛 Extra Milk Request
      </h2>

      {/* Product */}
      <div className="mb-5">
        <label className="font-medium">
          Product
        </label>

        <select
          className="w-full mt-2 border rounded-xl p-3"
          value={form.product_id}
          onChange={(e) =>
            setForm({
              ...form,
              product_id: e.target.value,
            })
          }
        >
          <option value="">
            Select Product
          </option>

          {products.map((p) => (
            <option
              key={p.id}
              value={p.id}
            >
              {p.name}
            </option>
          ))}
        </select>

        {errors.product && (
          <p className="text-red-500 text-sm mt-1">
            {errors.product}
          </p>
        )}
      </div>

      {/* Size & Quantity */}
      <div className="grid md:grid-cols-2 gap-5">

        <div>
          <label className="font-medium">
            Size
          </label>

          <select
            className="w-full mt-2 border rounded-xl p-3"
            value={form.size}
            onChange={(e) =>
              setForm({
                ...form,
                size: e.target.value,
              })
            }
          >
            {SIZE_OPTIONS.map((s) => (
              <option
                key={s.value}
                value={s.value}
              >
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium">
            Quantity
          </label>

          <div className="flex items-center mt-2">

            <button
              type="button"
              className="w-10 h-10 bg-gray-200 rounded-l-xl"
              onClick={() =>
                setForm({
                  ...form,
                  quantity: Math.max(
                    1,
                    Number(form.quantity) - 1
                  ),
                })
              }
            >
              -
            </button>

            <input
              className="w-full border-y h-10 text-center"
              value={form.quantity}
              readOnly
            />

            <button
              type="button"
              className="w-10 h-10 bg-gray-200 rounded-r-xl"
              onClick={() =>
                setForm({
                  ...form,
                  quantity:
                    Number(form.quantity) + 1,
                })
              }
            >
              +
            </button>

          </div>

        </div>

      </div>

      {/* Dates */}
      <div className="grid md:grid-cols-2 gap-5 mt-5">

        <div>
          <label>From Date</label>

          <input
            type="date"
            className="w-full mt-2 border rounded-xl p-3"
            value={form.from_date}
            onChange={(e) =>
              setForm({
                ...form,
                from_date: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label>End Date</label>

          <input
            type="date"
            className="w-full mt-2 border rounded-xl p-3"
            value={form.to_date}
            onChange={(e) =>
              setForm({
                ...form,
                to_date: e.target.value,
              })
            }
          />
        </div>

      </div>

      {/* Duration */}
      <div className="mt-5 bg-green-50 rounded-xl p-4">

        <p>
          <strong>Duration:</strong> {duration} Day(s)
        </p>

        <p className="mt-2">
          <strong>Estimated Cost:</strong> ₹
          {estimatedCost}
        </p>

      </div>

      {/* Remarks */}
      <div className="mt-5">

        <label>Remarks</label>

        <textarea
          rows={4}
          className="w-full mt-2 border rounded-xl p-3"
          value={form.remarks}
          onChange={(e) =>
            setForm({
              ...form,
              remarks: e.target.value,
            })
          }
          placeholder="Optional remarks..."
        />

      </div>

      {/* Submit */}
      <button
        disabled={loading}
        className="mt-6 w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-semibold"
      >
        {loading
          ? "Submitting..."
          : "Submit Request"}
      </button>

    </form>
  );
}