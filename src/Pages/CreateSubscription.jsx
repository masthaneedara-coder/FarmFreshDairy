import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchProducts,
  fetchCustomerAddresses,
} from "../config/api";

const PRICE_MAP = {
  "500ml": 1350,
  "1L": 2700,
  "2L": 5400,
  "3L": 8100,
  "5L": 13500,
};

export default function CreateSubscription() {
  const navigate = useNavigate();
 

  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [addresses, setAddresses] = useState([]);

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
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);

      await Promise.all([
        loadProducts(),
        loadAddresses(),
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    const customer = JSON.parse(
      localStorage.getItem("customer")
    );

    if (!customer?.id) return;

    const res = await fetchCustomerAddresses(
      customer.id
    );

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

  return (<div className="min-h-screen bg-slate-50">

  <div className="max-w-6xl mx-auto px-6 py-10">

    <h1 className="text-4xl font-black text-green-700 mb-8">
      Create Subscription
    </h1>

    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

      {/* Product */}

      <div className="border-b p-8 flex flex-col lg:flex-row gap-8">

        <img
        src={selectedProduct.image}
        alt={selectedProduct.name}
        className="w-56 h-56 rounded-2xl object-cover border"
        />

        <div className="flex-1">

          <h2 className="text-3xl font-bold">
            {selectedProduct.name}
          </h2>

          <p className="text-gray-500 mt-3">
            Fresh farm milk delivered directly to your doorstep.
          </p>

        </div>

      </div>
      <div className="mt-8">

  <h3 className="text-lg font-bold mb-4">
    Choose Product
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {products.map((item) => {

      const active =
        selectedProduct?.id === item.id;

      return (

        <button
          key={item.id}
          type="button"
          onClick={() => setSelectedProduct(item)}
          className={`rounded-2xl border-2 p-4 transition ${
            active
              ? "border-green-600 bg-green-50"
              : "border-gray-300 hover:border-green-400"
          }`}
        >

          <img
            src={item.image}
            alt={item.name}
            className="w-24 h-24 object-cover rounded-xl mx-auto"
          />

          <h4 className="mt-3 text-lg font-bold">
            {item.name}
          </h4>

          <p className="text-gray-500">
            ₹{item.price}/Litre
          </p>

        </button>

      );

    })}

  </div>

</div>

      <div className="p-8 space-y-8">

        {/* Product Size */}

        <div>

          <label className="block font-semibold mb-3">
            Product Size
          </label>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

            {["500ml","1L","2L","3L","5L"].map((size)=>{

              const active=form.size===size;

              return(

                <button
                  key={size}
                  type="button"
                  onClick={()=>updateForm("size",size)}
                  className={`rounded-xl py-4 border-2 font-bold transition ${
                    active
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-white border-gray-300 hover:border-green-500"
                  }`}
                >
                  {size}
                </button>

              );

            })}

          </div>

        </div>

        {/* Quantity */}

        <div>

          <label className="block font-semibold mb-3">
            Quantity
          </label>

          <div className="flex items-center gap-6">

            <button
              type="button"
              onClick={decreaseQuantity}
              className="w-12 h-12 rounded-full bg-red-500 text-white text-2xl"
            >
              −
            </button>

            <span className="text-3xl font-bold">
              {form.quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              className="w-12 h-12 rounded-full bg-green-600 text-white text-2xl"
            >
              +
            </button>

          </div>

        </div>

        {/* Delivery Time */}

        <div>

          <label className="block font-semibold mb-3">
            Delivery Time
          </label>

          <select
            value={form.deliveryTime}
            onChange={(e)=>updateForm("deliveryTime",e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          >
            <option>Morning</option>
            <option>Evening</option>
          </select>

        </div>

        {/* Frequency */}

        <div>

          <label className="block font-semibold mb-3">
            Frequency
          </label>

          <select
            value={form.frequency}
            onChange={(e)=>updateForm("frequency",e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          >
            <option>Daily</option>
            <option>Alternate Days</option>
            <option>Weekly</option>
          </select>

        </div>

        {/* Start Date */}

        <div>

          <label className="block font-semibold mb-3">
            Start Date
          </label>

          <input
            type="date"
            value={form.startDate}
            onChange={(e)=>updateForm("startDate",e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

        </div>

        {/* Address */}

        <div>

          <label className="block font-semibold mb-3">
            Delivery Address
          </label>

          <select
            value={form.addressId}
            onChange={(e)=>updateForm("addressId",e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          >

            <option value="">
              Select Delivery Address
            </option>

            {addresses.map(address=>(

              <option
                key={address.id}
                value={address.id}
              >
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

          {addresses.length===0 &&(

            <div className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4">

              <p className="text-yellow-700">
                No delivery address found.
              </p>

              <button
                type="button"
                onClick={()=>navigate("/address-book")}
                className="mt-3 text-green-700 font-semibold"
              >
                + Add Address
              </button>

            </div>

          )}

        </div>

        {/* Monthly Amount */}

        <div className="rounded-2xl bg-green-50 border border-green-200 p-6">

          <p className="text-lg font-semibold text-green-700">
            Monthly Amount
          </p>

          <h2 className="text-5xl font-black mt-3">
            ₹{monthlyAmount.toLocaleString()}
          </h2>

        </div>

        {/* Continue */}

        <button
          onClick={handleContinue}
          className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white py-4 text-xl font-bold"
        >
          Continue →
        </button>

      </div>

    </div>

  </div>
      </div>

 

);
}