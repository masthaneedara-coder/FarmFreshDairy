import { useEffect, useMemo, useState } from "react";
import {
  Milk,
  Sparkles,
  CalendarDays,
  Plus,
  Minus,
  MessageCircle,
  ArrowRight,
  ShoppingBasket,
  IndianRupee,
} from "lucide-react";

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
  // Today's local date
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
    return (
      products.find(
        (p) => String(p.id) === String(form.product_id)
      ) || null
    );
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
  // Automatically select first size
  // =========================================================

  useEffect(() => {
    if (!selectedProduct) return;

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

    return rate * duration * quantity;
  }, [
    selectedSize,
    form.quantity,
    duration,
  ]);

  // =========================================================
  // Update Form
  // =========================================================

  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  }

  // =========================================================
  // Product Change
  // =========================================================

  function handleProductChange(e) {
    const productId = e.target.value;

    setForm((prev) => ({
      ...prev,
      product_id: productId,
      size: "",
    }));

    setErrors((prev) => ({
      ...prev,
      product: "",
      size: "",
    }));
  }

  // =========================================================
  // Quantity
  // =========================================================

  function decreaseQuantity() {
    updateForm(
      "quantity",
      Math.max(
        1,
        Number(form.quantity) - 1
      )
    );
  }

  function increaseQuantity() {
    updateForm(
      "quantity",
      Number(form.quantity) + 1
    );
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
      e.size =
        "Price not available for selected size";
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

    await onSubmit(payload);
  }

  const today = getTodayLocal();

  return (
    <>
      {/* =====================================================
          ANIMATIONS
      ====================================================== */}

      <style>{`
        @keyframes bottleFloat {
          0%, 100% {
            transform: translateX(-4px) rotate(-4deg);
          }

          50% {
            transform: translateX(7px) rotate(4deg);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: .35;
            transform: scale(.9);
          }

          50% {
            opacity: .75;
            transform: scale(1.1);
          }
        }

        @keyframes sparkleMove {
          0%, 100% {
            transform: translateY(0) rotate(0);
            opacity: .5;
          }

          50% {
            transform: translateY(-6px) rotate(12deg);
            opacity: 1;
          }
        }

        .extra-bottle {
          animation: bottleFloat 3s ease-in-out infinite;
        }

        .extra-glow {
          animation: glowPulse 3s ease-in-out infinite;
        }

        .extra-sparkle {
          animation: sparkleMove 2s ease-in-out infinite;
        }
      `}</style>

      {/* =====================================================
          PAGE
      ====================================================== */}

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 px-3 py-4 sm:px-6 sm:py-8">

        <div className="max-w-4xl mx-auto">

          {/* =================================================
              HEADER
          ================================================== */}

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 text-white shadow-xl mb-5">

            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -left-16 -bottom-20 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative p-5 sm:p-7 flex items-center justify-between gap-4">

              <div className="min-w-0">

                <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/10 rounded-full px-3 py-1 text-xs font-bold mb-3">

                  <Sparkles
                    size={13}
                  />

                  EXTRA MILK

                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Extra Milk Request
                </h1>

                <p className="text-green-100 text-sm mt-1 max-w-md">
                  Need extra milk for a few days?
                  Request it easily here.
                </p>

              </div>

              {/* Animated Bottle */}

              <div className="relative shrink-0">

                <div className="extra-glow absolute inset-0 rounded-full bg-white/30 blur-xl" />

                <div className="extra-bottle relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center">

                  <Milk
                    size={35}
                    strokeWidth={2}
                  />

                </div>

                <Sparkles
                  size={17}
                  className="extra-sparkle absolute -top-1 -right-1 text-yellow-200"
                />

              </div>

            </div>
          </div>

          {/* =================================================
              FORM CARD
          ================================================== */}

          <form
            onSubmit={submit}
            className="bg-white rounded-3xl shadow-lg border border-green-100 overflow-hidden"
          >

            <div className="p-4 sm:p-7 space-y-5">

              {/* =================================================
                  PRODUCT
              ================================================== */}

              <div>

                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">

                  <ShoppingBasket
                    size={17}
                    className="text-green-600"
                  />

                  Select Milk

                </label>

                <select
                  value={form.product_id}
                  onChange={handleProductChange}
                  className="
                    w-full
                    h-12
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-50
                    px-4
                    text-sm
                    outline-none
                    transition
                    focus:border-green-500
                    focus:ring-4
                    focus:ring-green-100
                  "
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
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.product}
                  </p>
                )}

              </div>

              {/* =================================================
                  SIZE + QUANTITY
              ================================================== */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* SIZE */}

                <div>

                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Milk Size
                  </label>

                  {!selectedProduct ? (
                    <div className="h-24 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400">
                      Select a product first
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">

                      {availableSizes.map(
                        (size) => {

                          const active =
                            form.size?.toLowerCase() ===
                            size.label?.toLowerCase();

                          return (
                            <button
                              key={size.id}
                              type="button"
                              onClick={() =>
                                updateForm(
                                  "size",
                                  size.label
                                )
                              }
                              className={`
                                relative
                                min-h-[58px]
                                rounded-2xl
                                border
                                px-3
                                py-2
                                transition-all
                                duration-200
                                active:scale-95
                                ${
                                  active
                                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200 scale-[1.02]"
                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50"
                                }
                              `}
                            >

                              <div className="text-sm font-black">
                                🥛 {size.label}
                              </div>

                              <div
                                className={`text-xs mt-0.5 ${
                                  active
                                    ? "text-green-100"
                                    : "text-gray-500"
                                }`}
                              >
                                ₹{size.price}
                              </div>

                              {active && (
                                <span className="absolute top-1 right-2 text-[10px]">
                                  ✓
                                </span>
                              )}

                            </button>
                          );
                        }
                      )}

                    </div>
                  )}

                  {errors.size && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.size}
                    </p>
                  )}

                </div>

                {/* QUANTITY */}

                <div>

                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Quantity
                  </label>

                  <div className="h-[122px] rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 flex items-center justify-between px-3">

                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="
                        w-11
                        h-11
                        rounded-xl
                        bg-white
                        border
                        border-gray-200
                        flex
                        items-center
                        justify-center
                        text-gray-700
                        shadow-sm
                        hover:bg-red-50
                        hover:text-red-600
                        active:scale-90
                        transition
                      "
                    >
                      <Minus size={19} />
                    </button>

                    <div className="text-center">

                      <div className="text-3xl font-black text-green-700">
                        {form.quantity}
                      </div>

                      <div className="text-xs text-gray-500">
                        bottle
                        {Number(form.quantity) > 1
                          ? "s"
                          : ""}
                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="
                        w-11
                        h-11
                        rounded-xl
                        bg-green-600
                        text-white
                        flex
                        items-center
                        justify-center
                        shadow-md
                        hover:bg-green-700
                        active:scale-90
                        transition
                      "
                    >
                      <Plus size={19} />
                    </button>

                  </div>

                  {errors.quantity && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.quantity}
                    </p>
                  )}

                </div>

              </div>

              {/* =================================================
                  DATES
              ================================================== */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <DateCard
                  label="From Date"
                  value={form.from_date}
                  min={today}
                  onChange={(value) =>
                    updateForm(
                      "from_date",
                      value
                    )
                  }
                  error={errors.from_date}
                />

                <DateCard
                  label="End Date"
                  value={form.to_date}
                  min={form.from_date || today}
                  onChange={(value) =>
                    updateForm(
                      "to_date",
                      value
                    )
                  }
                  error={errors.to_date}
                />

              </div>

              {/* =================================================
                  SUMMARY
              ================================================== */}

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-4">

                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-green-200/30 blur-xl" />

                <div className="relative">

                  <div className="flex items-center justify-between mb-3">

                    <h3 className="font-black text-green-900">
                      Request Summary
                    </h3>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700 shadow-sm">
                      {duration} day
                      {duration !== 1
                        ? "s"
                        : ""}
                    </span>

                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                    <SummaryCard
                      label="Rate"
                      value={`₹${selectedSize?.price || 0}`}
                    />

                    <SummaryCard
                      label="Quantity"
                      value={`${form.quantity} × ${
                        form.size || "-"
                      }`}
                    />

                    <div className="col-span-2 sm:col-span-1">

                      <SummaryCard
                        label="Estimated Cost"
                        value={`₹${estimatedCost}`}
                        highlight
                      />

                    </div>

                  </div>

                </div>

              </div>

              {/* =================================================
                  REMARKS
              ================================================== */}

              <div>

                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">

                  <MessageCircle
                    size={17}
                    className="text-green-600"
                  />

                  Remarks

                  <span className="font-normal text-gray-400">
                    Optional
                  </span>

                </label>

                <textarea
                  rows={3}
                  value={form.remarks}
                  onChange={(e) =>
                    updateForm(
                      "remarks",
                      e.target.value
                    )
                  }
                  placeholder="Example: Please deliver along with my regular milk..."
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-50
                    p-4
                    text-sm
                    resize-none
                    outline-none
                    transition
                    focus:border-green-500
                    focus:ring-4
                    focus:ring-green-100
                  "
                />

              </div>

            </div>

            {/* =================================================
                SUBMIT
            ================================================== */}

            <div className="border-t border-gray-100 bg-gray-50 p-4">

              <button
                type="submit"
                disabled={loading}
                className="
                  group
                  w-full
                  h-13
                  rounded-2xl
                  bg-gradient-to-r
                  from-green-600
                  to-emerald-500
                  hover:from-green-700
                  hover:to-emerald-600
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  text-white
                  font-black
                  shadow-lg
                  shadow-green-200
                  active:scale-[0.98]
                  transition-all
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                {loading ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />

                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Extra Milk Request

                    <ArrowRight
                      size={19}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}

              </button>

              <p className="text-center text-[11px] text-gray-400 mt-2">
                Your request will be reviewed before delivery.
              </p>

            </div>

          </form>

        </div>
      </div>
    </>
  );
}


// =========================================================
// DATE CARD
// =========================================================

function DateCard({
  label,
  value,
  min,
  onChange,
  error,
}) {
  return (
    <div>

      <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">

        <CalendarDays
          size={17}
          className="text-green-600"
        />

        {label}

      </label>

      <div className="relative">

        <input
          type="date"
          value={value}
          min={min}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="
            w-full
            h-12
            rounded-2xl
            border
            border-gray-200
            bg-gray-50
            px-4
            text-sm
            outline-none
            transition
            focus:border-green-500
            focus:ring-4
            focus:ring-green-100
          "
          required
        />

      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1.5">
          {error}
        </p>
      )}

    </div>
  );
}


// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="bg-white rounded-xl border border-green-100 p-3 shadow-sm">

      <div className="text-[11px] text-gray-500 mb-1">
        {label}
      </div>

      <div
        className={`text-sm sm:text-base font-black ${
          highlight
            ? "text-green-700"
            : "text-gray-800"
        }`}
      >
        {value}
      </div>

    </div>
  );
}