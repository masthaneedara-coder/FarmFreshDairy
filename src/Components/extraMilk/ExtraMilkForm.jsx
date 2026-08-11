import { useEffect, useMemo, useState } from "react";

export default function ExtraMilkForm({
  products = [],
  loading = false,
  onSubmit,
}) {
  const [form, setForm] = useState({
    product_id: "",
    size: "",
    quantity: 1,
    from_date: "",
    to_date: "",
    remarks: "",
  });

  const [errors, setErrors] = useState({});

  // =========================================================
  // Today's date - local date
  // =========================================================
  function getTodayLocal() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // =========================================================
  // Set today's date
  // =========================================================
  useEffect(() => {
    const today = getTodayLocal();

    setForm((prev) => ({
      ...prev,
      from_date: today,
      to_date: today,
    }));
  }, []);

  // =========================================================
  // Selected Product
  // =========================================================
  const selectedProduct = useMemo(() => {
    const product = products.find(
      (p) => String(p.id) === String(form.product_id)
    );

    console.log("SELECTED PRODUCT:", product);

    return product || null;
  }, [products, form.product_id]);

  // =========================================================
  // Available Sizes
  // =========================================================
  const availableSizes = useMemo(() => {
    if (!selectedProduct?.product_sizes) {
      return [];
    }

    return selectedProduct.product_sizes.filter(
      (size) => size.is_active !== false
    );
  }, [selectedProduct]);

  // =========================================================
  // Automatically select first available size
  // =========================================================
  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    if (availableSizes.length === 0) {
      setForm((prev) => ({
        ...prev,
        size: "",
      }));

      return;
    }

    const currentSizeExists = availableSizes.some(
      (size) =>
        size.label?.trim().toLowerCase() ===
        form.size?.trim().toLowerCase()
    );

    if (!currentSizeExists) {
      setForm((prev) => ({
        ...prev,
        size: availableSizes[0].label,
      }));
    }
  }, [selectedProduct, availableSizes]);

  // =========================================================
  // Selected Size
  // =========================================================
  const selectedSize = useMemo(() => {
    if (!selectedProduct || !form.size) {
      return null;
    }

    return (
      selectedProduct.product_sizes?.find(
        (size) =>
          size.label?.trim().toLowerCase() ===
          form.size.trim().toLowerCase()
      ) || null
    );
  }, [selectedProduct, form.size]);

  // =========================================================
  // Duration
  // =========================================================
  const duration = useMemo(() => {
    if (!form.from_date || !form.to_date) {
      return 0;
    }

    const from = new Date(`${form.from_date}T00:00:00`);
    const to = new Date(`${form.to_date}T00:00:00`);

    const diff =
      (to - from) / (1000 * 60 * 60 * 24);

    return diff >= 0 ? diff + 1 : 0;
  }, [form.from_date, form.to_date]);

  // =========================================================
  // Estimated Cost
  // =========================================================
  const estimatedCost = useMemo(() => {
    if (!selectedSize) {
      return 0;
    }

    const rate = Number(selectedSize.price || 0);
    const quantity = Number(form.quantity || 0);

    const total = rate * duration * quantity;

    console.log("================================");
    console.log("Extra Milk Calculation");
    console.log("Product:", selectedProduct?.name);
    console.log("Size:", selectedSize?.label);
    console.log("Rate:", rate);
    console.log("Quantity:", quantity);
    console.log("Duration:", duration);
    console.log("Estimated Cost:", total);
    console.log("================================");

    return total;
  }, [
    selectedSize,
    form.quantity,
    duration,
    selectedProduct,
  ]);

  // =========================================================
  // Input Change
  // =========================================================
  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Remove error for field
    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  }

  // =========================================================
  // Validation
  // =========================================================
  function validate() {
    const e = {};

    if (!form.product_id) {
      e.product = "Please select a product";
    }

    if (!form.size) {
      e.size = "Please select a size";
    }

    if (Number(form.quantity) <= 0) {
      e.quantity = "Invalid quantity";
    }

    if (!form.from_date) {
      e.from_date = "Please select from date";
    }

    if (!form.to_date) {
      e.to_date = "Please select end date";
    }

    if (
      form.from_date &&
      form.to_date &&
      form.to_date < form.from_date
    ) {
      e.to_date =
        "End Date cannot be before From Date";
    }

    if (!selectedSize) {
      e.size = "Price not available for selected size";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  }

  // =========================================================
  // Submit
  // =========================================================
  async function submit(e) {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      estimated_amount: Number(estimatedCost),
    };

    console.log("EXTRA MILK FORM PAYLOAD:", payload);

    await onSubmit(payload);
  }

  return (
    <form onSubmit={submit} className="space-y-5">

      {/* =====================================================
          Product
      ====================================================== */}
      <div>
        <label className="font-medium">
          Product
        </label>

        <select
          className="w-full mt-2 border rounded-xl p-3"
          value={form.product_id}
          onChange={(e) => {
            updateForm("product_id", e.target.value);

            // Reset size when product changes
            setForm((prev) => ({
              ...prev,
              product_id: e.target.value,
              size: "",
            }));
          }}
        >
          <option value="">
            Select Product
          </option>

          {products.map((product) => (
            <option
              key={product.id}
              value={product.id}
            >
              {product.name}
            </option>
          ))}
        </select>

        {errors.product && (
          <p className="text-red-500 text-sm mt-1">
            {errors.product}
          </p>
        )}
      </div>

      {/* =====================================================
          Size + Quantity
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* SIZE */}
        <div>
          <label className="font-medium">
            Size
          </label>

          <select
            className="w-full mt-2 border rounded-xl p-3"
            value={form.size}
            onChange={(e) =>
              updateForm("size", e.target.value)
            }
            disabled={!selectedProduct}
          >
            {!selectedProduct && (
              <option value="">
                Select Product First
              </option>
            )}

            {selectedProduct &&
              availableSizes.map((size) => (
                <option
                  key={size.id}
                  value={size.label}
                >
                  {size.label} - ₹{size.price}
                </option>
              ))}
          </select>

          {errors.size && (
            <p className="text-red-500 text-sm mt-1">
              {errors.size}
            </p>
          )}
        </div>

        {/* QUANTITY */}
        <div>
          <label className="font-medium">
            Quantity
          </label>

          <div className="flex items-center mt-2">

            <button
              type="button"
              className="w-12 h-12 bg-gray-200 rounded-l-xl text-lg font-bold"
              onClick={() =>
                updateForm(
                  "quantity",
                  Math.max(
                    1,
                    Number(form.quantity) - 1
                  )
                )
              }
            >
              −
            </button>

            <input
              className="flex-1 border-y h-12 text-center"
              value={form.quantity}
              readOnly
            />

            <button
              type="button"
              className="w-12 h-12 bg-gray-200 rounded-r-xl text-lg font-bold"
              onClick={() =>
                updateForm(
                  "quantity",
                  Number(form.quantity) + 1
                )
              }
            >
              +
            </button>

          </div>

          {errors.quantity && (
            <p className="text-red-500 text-sm mt-1">
              {errors.quantity}
            </p>
          )}
        </div>

      </div>

      {/* =====================================================
          Dates
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* FROM */}
        <div>
          <label className="font-medium">
            From Date
          </label>

          <input
            type="date"
            className="w-full mt-2 border rounded-xl p-3"
            value={form.from_date}
            onChange={(e) =>
              updateForm(
                "from_date",
                e.target.value
              )
            }
          />

          {errors.from_date && (
            <p className="text-red-500 text-sm mt-1">
              {errors.from_date}
            </p>
          )}
        </div>

        {/* TO */}
        <div>
          <label className="font-medium">
            End Date
          </label>

          <input
            type="date"
            className="w-full mt-2 border rounded-xl p-3"
            value={form.to_date}
            onChange={(e) =>
              updateForm(
                "to_date",
                e.target.value
              )
            }
          />

          {errors.to_date && (
            <p className="text-red-500 text-sm mt-1">
              {errors.to_date}
            </p>
          )}
        </div>

      </div>

      {/* =====================================================
          Duration + Estimated Cost
      ====================================================== */}
      <div className="bg-green-50 rounded-xl p-4">

        <p>
          <strong>Duration:</strong>{" "}
          {duration} Day(s)
        </p>

        <p className="mt-2">
          <strong>Rate:</strong>{" "}
          ₹{selectedSize?.price || 0}
        </p>

        <p className="mt-2">
          <strong>Estimated Cost:</strong>{" "}
          <span className="text-green-700 font-bold">
            ₹{estimatedCost}
          </span>
        </p>

      </div>

      {/* =====================================================
          Remarks
      ====================================================== */}
      <div>
        <label className="font-medium">
          Remarks
        </label>

        <textarea
          rows={4}
          className="w-full mt-2 border rounded-xl p-3"
          value={form.remarks}
          onChange={(e) =>
            updateForm(
              "remarks",
              e.target.value
            )
          }
          placeholder="Optional remarks..."
        />
      </div>

      {/* =====================================================
          Submit
      ====================================================== */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white py-3 rounded-xl font-semibold"
      >
        {loading
          ? "Submitting..."
          : "Submit Request"}
      </button>

    </form>
  );
}