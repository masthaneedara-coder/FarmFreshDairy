import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchSubscription,
  updateSubscription,
  fetchCustomerAddresses,
  updateSubscriptionStatus,
} from "../config/api";

export default function ManageSubscription() {
    const PRICE_MAP = {
        "500ml": 1350,
        "1L": 2700,
        "2L": 5400,
        "3L": 8100,
        "5L": 13500,
    };

   const handlePause = async () => {

    if (!pauseFrom || !pauseTo) {
        alert("Please select pause dates.");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const from = new Date(pauseFrom);
    const to = new Date(pauseTo);
    const endDate = new Date(subscription.end_date);

    if (from < today) {
        alert("Pause From cannot be before today.");
        return;
    }

    if (to < from) {
        alert("Pause To cannot be before Pause From.");
        return;
    }

    if (to > endDate) {
        alert("Pause To cannot exceed subscription end date.");
        return;
    }

    try {

        setSaving(true);

        await updateSubscriptionStatus(
            id,
            "Paused",
            pauseFrom,
            pauseTo
        );

        await loadSubscription();

        setShowPauseModal(false);

        alert("Subscription paused successfully.");

    } catch (err) {

        console.error(err);

        alert("Failed to pause subscription.");

    } finally {

        setSaving(false);

    }
};
const handleCancel = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this subscription?"
  );

  if (!confirmed) return;

  try {
    setSaving(true);

    const updated = await updateSubscriptionStatus(
      id,
      "Cancelled"
    );

    if (!updated) {
      throw new Error("Failed to cancel subscription.");
    }

    await loadSubscription();

    alert("Subscription cancelled successfully.");

  } catch (err) {
    console.error(err);
    alert("Failed to cancel subscription.");
  } finally {
    setSaving(false);
  }
};
  const navigate = useNavigate();
  const { id } = useParams();

  const [subscription, setSubscription] = useState(null);
  
  const [form, setForm] = useState({
  quantity: "",
  size: "",
  delivery_time: "",
  address_id: "",
});
const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);

const [pauseFrom, setPauseFrom] = useState("");

const [pauseTo, setPauseTo] = useState("");
  const monthlyAmount =  (PRICE_MAP[form.size] || 0) * Number(form.quantity || 1);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);

      const res = await fetchSubscription(id);

      console.log("Subscription:", res);

      if (!res.success) {
        throw new Error(res.message);
      }

      setSubscription(res.subscription);
      const customer = JSON.parse(
        localStorage.getItem("customer")
        );

        const addressRes =
        await fetchCustomerAddresses(customer.id);

        setAddresses(addressRes.addresses || []);
      const sub = res.subscription;

            setForm({
            quantity:
                sub.subscription_items?.[0]?.quantity || "",

            size:
                sub.subscription_items?.[0]?.size || "",

            delivery_time:
                sub.delivery_time || "",

            address_id:
                sub.address_id || "",
            });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
 const handleSave = async () => {
  try {
    setSaving(true);

    const payload = {
  quantity: Number(form.quantity),
  size: form.size,
  delivery_time: form.delivery_time,
  address_id: form.address_id,
  total_amount: monthlyAmount,
};

    const subscription = await updateSubscription(id, payload);
    console.log("Subscription ID:", id);
console.log("Payload:", payload);

    if (!subscription) {
      throw new Error("Update failed.");
    }

    // Reload latest subscription
    const latest = await fetchSubscription(id);

    setSubscription(latest);

    const item = latest.subscription_items?.[0];

    setForm({
        quantity: item?.quantity || 1,
        size: item?.size || "",
        delivery_time: subscription.delivery_time,
        address_id: subscription.address_id,
        });

    alert("✅ Subscription updated successfully.");

  } catch (err) {
    console.error(err);
    alert("Failed to update subscription.");
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-green-700">
          Loading Subscription...
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">

      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
      >
        ← Back
      </button>

      <h1 className="text-4xl font-black text-green-700 mb-6">
        Manage Subscription
      </h1>
      <div className="mt-8 bg-white rounded-3xl shadow-xl border border-green-100">

  {/* Header */}
  <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6">
    <h2 className="text-3xl font-bold">
      Manage Subscription
    </h2>

    <p className="opacity-90 mt-2">
      Update your delivery preferences
    </p>
  </div>

  <div className="p-8">

    <div className="grid lg:grid-cols-2 gap-6">

      {/* Quantity */}
      <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity
            </label>

            <div className="flex items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3">

                <button
                type="button"
                onClick={() =>
                    setForm({
                    ...form,
                    quantity: Math.max(
                        1,
                        Number(form.quantity || 1) - 1
                    ),
                    })
                            }
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white text-xl font-bold transition"
                >
                −
                </button>

                <span className="text-2xl font-bold text-gray-800">
                {form.quantity || 1}
                </span>

                <button
                type="button"
                onClick={() =>
                    setForm({
                    ...form,
                    quantity: Number(form.quantity || 1) + 1,
                    })
                }
                className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold transition"
                >
                +
                </button>

            </div>
            </div>

      {/* Size */}
      <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
                Product Size
            </label>

            <div className="grid grid-cols-3 gap-3">

                {[                
                "500ml",
                "1L",
                "2L",
                "3L",
                "5L",
                ].map((size) => {

                const active = form.size === size;

                return (

                    <button
                    key={size}
                    type="button"
                    onClick={() =>
                        setForm({
                        ...form,
                        size,
                        })
                    }
                    className={`rounded-xl border-2 py-3 font-bold transition-all duration-200 ${
                        active
                        ? "bg-green-600 border-green-600 text-white shadow-lg scale-105"
                        : "bg-white border-gray-300 text-gray-700 hover:border-green-500 hover:bg-green-50"
                    }`}
                    >
                    {size}
                    </button>

                );

                })}

            </div>
            </div>

      {/* Delivery */}
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Address
            </label>

            <select
                value={form.address_id}
                onChange={(e) =>
                setForm({
                    ...form,
                    address_id: e.target.value,
                })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            >
                <option value="">
                Select Delivery Address
                </option>

                {addresses.map((address) => (
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
            </div>

        {/* Monthly Amount */}
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
            Monthly Amount
            </label>

            <input
                value={monthlyAmount}
                disabled
                className="w-full rounded-xl border bg-slate-100 px-4 py-3"
                />
        </div>

        {/* Start Date */}
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
            Start Date
            </label>

            <input
            value={subscription?.start_date || ""}
            disabled
            className="w-full rounded-xl border bg-slate-100 px-4 py-3"
            />
        </div>

        {/* Status */}
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
            Status
            </label>

            <input
            value={subscription?.status || ""}
            disabled
            className="w-full rounded-xl border bg-slate-100 px-4 py-3"
            />
        </div>

        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mt-10">

       <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl py-4 font-bold"
            >
            {saving ? "Saving..." : "💾 Save Changes"}
            </button>

        <button
                onClick={() =>{ setShowPauseModal(true); console.log("Pause clicked");}}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-xl py-4 font-bold"
            >
                ⏸ Pause
            </button>

        <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl py-4 font-bold"
        >
            ❌ Cancel
        </button>

        </div>

    </div>

    </div>
    {showPauseModal && (

<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[99999]">

    <div className="bg-white rounded-2xl p-6 w-[420px]">

        <h2 className="text-2xl font-bold mb-5">
            Pause Subscription
        </h2>

        <div className="space-y-4">

            <div>
                <label className="font-semibold">
                    Pause From
                </label>

                <input
                    type="date"
                    value={pauseFrom}
                    min={new Date().toISOString().split("T")[0]}
                    max={subscription.end_date}
                    onChange={(e) => setPauseFrom(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 mt-2"
                />
            </div>

            <div>
                <label className="font-semibold">
                    Pause To
                </label>

                <input
                    type="date"
                    value={pauseTo}
                    min={pauseFrom || new Date().toISOString().split("T")[0]}
                    max={subscription.end_date}
                    onChange={(e) => setPauseTo(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 mt-2"
                />
            </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">

            <button
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 border rounded-lg"
            >
                Cancel
            </button>

            <button
                onClick={handlePause}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
                Pause
            </button>

        </div>

    </div>

</div>

)}

     

    </div>
  );
}