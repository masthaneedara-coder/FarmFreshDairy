import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProducts,
  fetchCustomerAddresses,
  createAddress
} from "../config/api";
import LocationButton from "../Components/LocationButton";
import AddressForm from "../Components/AddressForm";

const PRICE_MAP = {
  "500ml": 1350,
  "1L": 2700,
  "2L": 5400,
  "3L": 8100,
  "5L": 13500,
};

export default function CreateSubscription() {
  const navigate = useNavigate();
  const initialLoadStarted = useRef(false);
 

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] =
  useState(false);

const [editingAddress, setEditingAddress] =
  useState(null);

  const [form, setForm] = useState({
    size: "1L",
    quantity: 1,
    deliveryTime: "Morning",
    frequency: "Daily",
    startDate: new Date().toISOString().split("T")[0],
    addressId: "",
  });
  const FREQUENCY_MULTIPLIER = {
  Daily: 1,
  "Alternate Days": 0.5,
  Weekly: 4 / 30,
};

const monthlyAmount = useMemo(() => {

  const basePrice =
    PRICE_MAP[form.size] || 0;

  const qty =
    Number(form.quantity || 1);

  const multiplier =
    FREQUENCY_MULTIPLIER[
      form.frequency
    ] || 1;

  return Math.round(
    basePrice *
    qty *
    multiplier
  );

}, [
  form.size,
  form.quantity,
  form.frequency,
]);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);

    // Load independently so one slow/failing request cannot keep the
    // entire subscription screen stuck on a global loading state.
    await Promise.allSettled([loadProducts(), loadAddresses()]);

    setLoading(false);
  }
function handleAddAddress() {
  setEditingAddress(null);
  setShowAddressForm(true);
}
function handleLocationFound(location) {
  console.log(
    "Current location detected:",
    location
  );

  setEditingAddress({
    ...location,
    is_default: false,
  });

  setShowAddressForm(true);
}
async function handleSaveAddress(addressData) {
  try {
    const customer = JSON.parse(
      localStorage.getItem("customer")
    );

    if (!customer?.id) {
      alert("Please login again.");
      return;
    }

    const response = await createAddress({
      ...addressData,
      customer_id: customer.id,
    });

    console.log(
      "Created address:",
      response
    );

    // Reload addresses
    const result =
      await fetchCustomerAddresses(
        customer.id
      );

    const list =
      result.addresses || [];

    setAddresses(list);

    // Try to identify newly created address
    const newAddress =
      response?.address ||
      response?.data ||
      response;

    if (newAddress?.id) {
      updateForm(
        "addressId",
        newAddress.id
      );
    } else {
      // fallback: select latest address
      const latest =
        list[list.length - 1];

      if (latest?.id) {
        updateForm(
          "addressId",
          latest.id
        );
      }
    }

    setShowAddressForm(false);
    setEditingAddress(null);

  } catch (error) {
    console.error(
      "Create address error:",
      error
    );

    alert(
      error?.message ||
      "Failed to create address."
    );
  }
}
async function loadProducts() {
  try {
    const list = await fetchProducts();

    const dairyProducts = list.filter((p) =>
      ["Cow Milk", "Buffalo Milk", "Curd"].includes(p.name)
    );

    setProducts(dairyProducts);

    if (dairyProducts.length > 0) {
      setSelectedProduct(dairyProducts[0]);
    }
  } catch (err) {
    console.error(err);
  }
}

  async function loadAddresses() {
    setAddressesLoading(true);
    try {
      const customer = JSON.parse(
        localStorage.getItem("customer")
      );

      if (!customer?.id) {
        return;
      }

      const res = await Promise.race([
        fetchCustomerAddresses(customer.id),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Address request timed out")), 10000)
        ),
      ]);

    const list = res.addresses || [];

    setAddresses(list);

      if (list.length > 0) {
        const defaultAddress =
          list.find((a) => a.is_default) || list[0];

        setForm((prev) => ({
          ...prev,
          addressId: defaultAddress.id,
        }));
      }
    } catch (err) {
      console.error("Subscription address error:", err);
    } finally {
      setAddressesLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function increaseQuantity() {
    setForm((prev) => ({
      ...prev,
      quantity: prev.quantity + 1,
    }));
  }

  function decreaseQuantity() {
    setForm((prev) => ({
      ...prev,
      quantity: Math.max(
        1,
        prev.quantity - 1
      ),
    }));
  }

  function handleContinue() {
    if (!form.addressId) {
      alert("Please select a delivery address.");
      return;
    }

   navigate("/subscription/review", {
  state: {
    product: selectedProduct,
    form,
    monthlyAmount,
    addresses,
  },
});
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-green-700">
          Loading Subscription...
        </h2>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-red-600">
          Product not found.
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_8%_8%,rgba(16,185,129,.14),transparent_28%),radial-gradient(circle_at_92%_24%,rgba(132,204,22,.12),transparent_24%),linear-gradient(180deg,#f0fdf4_0%,#ffffff_46%,#ecfdf5_100%)]">
      <style>{`
        @keyframes createSubFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes createSubFloat {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(10px,-10px,0); }
        }

        @keyframes createSubPulse {
          0%, 100% { transform: scale(1); opacity: .45; }
          50% { transform: scale(1.12); opacity: .8; }
        }

        @keyframes createSubShimmer {
          0% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(170%) skewX(-18deg); }
        }

        .create-sub-stagger > * {
          animation: createSubFadeUp .55s ease-out both;
        }

        .create-sub-stagger > *:nth-child(2) { animation-delay: .06s; }
        .create-sub-stagger > *:nth-child(3) { animation-delay: .12s; }
        .create-sub-stagger > *:nth-child(4) { animation-delay: .18s; }

        .create-sub-card {
          transition:
            transform .3s cubic-bezier(.2,.8,.2,1),
            box-shadow .3s ease,
            border-color .3s ease;
        }

        .create-sub-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 22px 60px rgba(15,118,110,.12);
          border-color: rgba(16,185,129,.3);
        }

        @media (prefers-reduced-motion: reduce) {
          .create-sub-stagger > *,
          .create-sub-card,
          [class*="animate-"] {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="relative mx-auto max-w-7xl px-3 pb-28 pt-5 sm:px-5 sm:pb-10 sm:pt-7 lg:px-8">

        {/* Premium Hero */}
        <section className="relative isolate mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#043b2d] via-[#047857] to-[#16a34a] text-white shadow-[0_25px_80px_rgba(4,120,87,.22)] sm:rounded-[2.5rem]">
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-lime-300/15 blur-3xl animate-[createSubFloat_7s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-[createSubFloat_8s_ease-in-out_infinite_reverse]" />
          <div className="pointer-events-none absolute right-[18%] top-8 hidden h-28 w-28 rounded-full border border-white/10 animate-[createSubPulse_4s_ease-in-out_infinite] sm:block" />
          <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/10 blur-2xl animate-[createSubShimmer_8s_ease-in-out_infinite]" />

          <div className="relative p-5 sm:p-7 lg:p-9">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[11px] font-black uppercase tracking-[.16em] backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
                  Fresh Daily Subscription
                </div>

                <h1 className="mt-4 text-[2.45rem] font-black leading-[.96] tracking-tight sm:text-5xl lg:text-6xl">
                  Build Your
                  <span className="block text-lime-200">Perfect Milk Plan</span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-50 sm:text-base">
                  Choose your dairy product, quantity, delivery schedule and
                  doorstep address — all in one simple plan.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    ["🥛", "Fresh Dairy"],
                    ["🚚", "Home Delivery"],
                    ["🔄", "Flexible Plan"],
                  ].map(([icon, label]) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur"
                    >
                      <span>{icon}</span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[270px] lg:mx-0">
                <div className="absolute inset-5 rounded-[2rem] bg-lime-200/20 blur-2xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-xl">
                  <div className="overflow-hidden rounded-[1.5rem] bg-white/10">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="h-52 w-full object-cover transition duration-700 hover:scale-105 sm:h-60"
                    />
                  </div>
                  <div className="flex items-center justify-between px-2 pb-1 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                        Selected
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {selectedProduct.name}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300 text-xl shadow-lg">
                      🥛
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-1 bg-gradient-to-r from-lime-300 via-white to-emerald-200 opacity-80" />
        </section>

        {/* Step Indicator */}
        <div className="mb-6 grid grid-cols-4 gap-1.5 sm:gap-2">
          {[
            ["01", "Product"],
            ["02", "Plan"],
            ["03", "Delivery"],
            ["04", "Review"],
          ].map(([number, label], index) => (
            <div key={number} className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-emerald-100 bg-white/90 px-2.5 py-3 shadow-sm backdrop-blur sm:px-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                    index === 0
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {number}
                </span>
                <span className="truncate text-[10px] font-black uppercase tracking-wide text-slate-600 sm:text-xs">
                  {label}
                </span>
              </div>
              {index < 3 && (
                <span className="hidden text-emerald-300 sm:block">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="create-sub-stagger grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* Main Form */}
          <div className="space-y-5">

            {/* Product Selection */}
            <section className="create-sub-card overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/95 shadow-[0_14px_50px_rgba(15,118,110,.075)]">
              <div className="border-b border-emerald-50 bg-gradient-to-r from-emerald-50/80 via-white to-lime-50/60 px-4 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-lg shadow-emerald-600/20">
                    🥛
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">
                      Step 01
                    </p>
                    <h2 className="text-xl font-black text-slate-800 sm:text-2xl">
                      Choose Your Product
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                      Pick the dairy product you want delivered regularly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                {products.map((item) => {
                  const active = selectedProduct?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedProduct(item)}
                      className={`group relative overflow-hidden rounded-[1.5rem] border-2 p-3 text-left transition-all duration-300 ${
                        active
                          ? "border-emerald-500 bg-emerald-50 shadow-[0_15px_40px_rgba(16,185,129,.14)]"
                          : "border-slate-200 bg-white hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
                      }`}
                    >
                      {active && (
                        <span className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white shadow-lg">
                          ✓
                        </span>
                      )}

                      <div className="overflow-hidden rounded-[1.2rem] bg-slate-50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-36 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-44"
                        />
                      </div>

                      <div className="flex items-end justify-between gap-3 px-1 pb-1 pt-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-800">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            Fresh & delivered to your doorstep
                          </p>
                        </div>
                        <span className="shrink-0 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-700">
                          ₹{item.price}/L
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Plan Configuration */}
            <section className="create-sub-card overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/95 shadow-[0_14px_50px_rgba(15,118,110,.075)]">
              <div className="border-b border-emerald-50 bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-4 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl text-white">
                    ⚙️
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">
                      Step 02
                    </p>
                    <h2 className="text-xl font-black text-slate-800 sm:text-2xl">
                      Build Your Plan
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                      Select size, quantity, timing and frequency.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-7 p-4 sm:p-6">

                {/* Size */}
                <div>
                  <div className="mb-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">
                        Quantity per delivery
                      </p>
                      <h3 className="mt-1 text-base font-black text-slate-800">
                        Choose Size
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {form.size}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {["500ml", "1L", "2L", "3L", "5L"].map((size) => {
                      const active = form.size === size;

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateForm("size", size)}
                          className={`rounded-2xl border-2 px-3 py-3.5 text-sm font-black transition-all duration-300 ${
                            active
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                              : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-700"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">
                        Bottles / units
                      </p>
                      <h3 className="mt-1 text-base font-black text-slate-800">
                        Daily Quantity
                      </h3>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-emerald-100 sm:justify-start">
                      <button
                        type="button"
                        onClick={decreaseQuantity}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl font-black text-slate-700 transition hover:bg-slate-200 active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <div className="min-w-[90px] text-center">
                        <span className="text-3xl font-black text-emerald-700">
                          {form.quantity}
                        </span>
                        <span className="ml-1 text-xs font-bold text-slate-400">
                          {form.size}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={increaseQuantity}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xl font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delivery + Frequency */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">
                      Delivery Time
                    </span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                        🌅
                      </span>
                      <select
                        value={form.deliveryTime}
                        onChange={(e) =>
                          updateForm("deliveryTime", e.target.value)
                        }
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-4 font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      >
                        <option>Morning</option>
                        <option>Evening</option>
                      </select>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">
                      Frequency
                    </span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                        🔄
                      </span>
                      <select
                        value={form.frequency}
                        onChange={(e) =>
                          updateForm("frequency", e.target.value)
                        }
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-4 font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      >
                        <option>Daily</option>
                        <option>Alternate Days</option>
                        <option>Weekly</option>
                      </select>
                    </div>
                  </label>
                </div>

                {/* Start Date */}
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">
                    Start Date
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      📅
                    </span>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        updateForm("startDate", e.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-4 font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </label>
              </div>
            </section>

            {/* Address */}
            <section className="create-sub-card overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/95 shadow-[0_14px_50px_rgba(15,118,110,.075)]">
              <div className="border-b border-emerald-50 bg-gradient-to-r from-emerald-50/80 via-white to-lime-50/60 px-4 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                    📍
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">
                      Step 03
                    </p>
                    <h2 className="text-xl font-black text-slate-800 sm:text-2xl">
                      Delivery Address
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                      Where should we deliver your fresh dairy?
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <select
                  value={form.addressId}
                  onChange={(e) => updateForm("addressId", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">Select Delivery Address</option>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {[
                        address.house_no,
                        address.street,
                        address.area,
                        address.city,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </option>
                  ))}
                </select>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3.5 font-black text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 active:scale-[.98]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-lg shadow-sm transition group-hover:rotate-90">
                      +
                    </span>
                    Add New Address
                  </button>

                  <LocationButton onLocationFound={handleLocationFound} />
                </div>

                {form.addressId &&
                  (() => {
                    const selected = addresses.find(
                      (a) => String(a.id) === String(form.addressId)
                    );

                    if (!selected) return null;

                    return (
                      <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-lg text-white shadow-lg shadow-emerald-600/20">
                            ✓
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                              Selected Delivery Address
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">
                              {[
                                selected.house_no,
                                selected.street,
                                selected.area,
                                selected.city,
                                selected.state,
                                selected.pincode,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {addresses.length === 0 && (
                  <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
                    <p className="font-black text-amber-800">
                      No delivery address found.
                    </p>
                    <p className="mt-1 text-sm font-medium text-amber-700">
                      Add your address to continue with the subscription.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sticky Summary */}
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/95 shadow-[0_20px_65px_rgba(15,118,110,.12)] backdrop-blur">
              <div className="relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#10b981] p-5 text-white sm:p-6">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-100">
                    Step 04 · Review
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Your Subscription
                  </h2>
                  <p className="mt-1 text-xs text-emerald-100">
                    Everything ready for your doorstep.
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-16 w-16 rounded-2xl object-cover shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                      Product
                    </p>
                    <p className="truncate text-base font-black text-slate-800">
                      {selectedProduct.name}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {form.quantity} × {form.size}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <SummaryMini icon="📅" label="Frequency" value={form.frequency} />
                  <SummaryMini icon="🌅" label="Delivery" value={form.deliveryTime} />
                  <SummaryMini icon="▶️" label="Starts" value={form.startDate} />
                  <SummaryMini
                    icon="📍"
                    label="Address"
                    value={form.addressId ? "Selected" : "Required"}
                    danger={!form.addressId}
                  />
                </div>

                <div className="rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-600">
                    Estimated Monthly Amount
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <span className="text-4xl font-black tracking-tight text-emerald-800">
                      ₹{monthlyAmount.toLocaleString("en-IN")}
                    </span>
                    <span className="pb-1 text-xs font-bold text-slate-400">
                      / month
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between gap-4">
                    <span>Product</span>
                    <span className="text-right font-black text-slate-700">
                      {selectedProduct.name}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Size × Quantity</span>
                    <span className="font-black text-slate-700">
                      {form.size} × {form.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Frequency</span>
                    <span className="font-black text-slate-700">
                      {form.frequency}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="group relative w-full overflow-hidden rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-xl shadow-emerald-600/20 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-2xl active:scale-[.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Continue to Review
                    <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                  <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/20 blur-xl transition-transform duration-700 group-hover:translate-x-[430%]" />
                </button>

                <p className="text-center text-[10px] font-semibold leading-relaxed text-slate-400">
                  You can review your plan and payment details on the next step.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>

  {/* Mobile sticky action */}
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-emerald-100 bg-white/95 px-3 py-3 shadow-[0_-12px_35px_rgba(0,0,0,.10)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "calc(.75rem + env(safe-area-inset-bottom))" }}>
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition active:scale-[.98]"
        >
          Continue to Review →
        </button>
      </div>

  {showAddressForm && (
  <AddressForm
    customerId={
      JSON.parse(
        localStorage.getItem("customer")
      )?.id
    }

    address={editingAddress}

    onSave={handleSaveAddress}

    onCancel={() => {
      setShowAddressForm(false);
      setEditingAddress(null);
    }}
  />
)}
      </div>

 

);

function SummaryMini({ icon, label, value, danger = false }) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        danger
          ? "border-amber-200 bg-amber-50"
          : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <p
        className={`mt-1 truncate text-xs font-black ${
          danger ? "text-amber-700" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
}