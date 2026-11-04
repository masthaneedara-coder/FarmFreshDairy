import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchSubscription,
  updateSubscription,
  fetchCustomerAddresses,
  updateSubscriptionStatus,
} from "../config/api";

const PRICE_MAP = {
  "500ml": 1350,
  "1L": 2700,
  "2L": 5400,
  "3L": 8100,
  "5L": 13500,
};

const todayLocalISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const addressLabel = (address) =>
  [address?.house_no, address?.street, address?.area, address?.city, address?.pincode]
    .filter(Boolean)
    .join(", ");

export default function ManageSubscription() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ quantity: 1, size: "", delivery_time: "", address_id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseTo, setPauseTo] = useState("");

  const monthlyAmount = useMemo(
    () => (PRICE_MAP[form.size] || 0) * Number(form.quantity || 1),
    [form.size, form.quantity]
  );

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const response = await fetchSubscription(id);
      if (!response?.success || !response?.subscription) {
        throw new Error(response?.message || "Unable to load subscription.");
      }

      const sub = response.subscription;
      setSubscription(sub);
      const item = sub.subscription_items?.[0] || {};
      setForm({
        quantity: item.quantity || 1,
        size: item.size || "",
        delivery_time: sub.delivery_time || "",
        address_id: sub.address_id || "",
      });

      let customer = null;
      try {
        customer = JSON.parse(localStorage.getItem("customer") || "null");
      } catch {
        customer = null;
      }
      if (customer?.id) {
        const addressResponse = await fetchCustomerAddresses(customer.id);
        setAddresses(addressResponse?.addresses || []);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error("Load subscription error:", error);
      setLoadError(error?.message || "Failed to load subscription.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const handleSave = async () => {
    if (!form.size) return window.alert("Please select milk size.");
    if (!form.address_id) return window.alert("Please select a delivery address.");

    try {
      setSaving(true);
      const result = await updateSubscription(id, {
        quantity: Number(form.quantity),
        size: form.size,
        delivery_time: form.delivery_time,
        address_id: form.address_id,
        total_amount: monthlyAmount,
      });
      if (result === false || result?.success === false) {
        throw new Error(result?.message || "Update failed.");
      }
      await loadSubscription();
      window.alert("Subscription updated successfully.");
    } catch (error) {
      console.error("Update subscription error:", error);
      window.alert(error?.message || "Failed to update subscription.");
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    if (!pauseFrom || !pauseTo) return window.alert("Please select both pause dates.");
    const today = todayLocalISO();
    const endDate = String(subscription?.end_date || "").slice(0, 10);
    if (pauseFrom < today) return window.alert("Pause date cannot be before today.");
    if (pauseTo < pauseFrom) return window.alert("End date cannot be before start date.");
    if (endDate && pauseTo > endDate) return window.alert("Pause date cannot exceed subscription end date.");

    try {
      setSaving(true);
      const result = await updateSubscriptionStatus(id, "Paused", pauseFrom, pauseTo);
      if (result === false || result?.success === false) {
        throw new Error(result?.message || "Failed to pause subscription.");
      }
      await loadSubscription();
      setShowPauseModal(false);
      setPauseFrom("");
      setPauseTo("");
      window.alert("Subscription paused successfully.");
    } catch (error) {
      console.error("Pause subscription error:", error);
      window.alert(error?.message || "Failed to pause subscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this subscription? Future deliveries may stop.")) return;
    try {
      setSaving(true);
      const result = await updateSubscriptionStatus(id, "Cancelled");
      if (!result || result === false || result?.success === false) {
        throw new Error(result?.message || "Failed to cancel subscription.");
      }
      await loadSubscription();
      window.alert("Subscription cancelled.");
    } catch (error) {
      console.error("Cancel subscription error:", error);
      window.alert(error?.message || "Failed to cancel subscription.");
    } finally {
      setSaving(false);
    }
  };

  const selectedAddress = addresses.find((address) => address.id === form.address_id);
  const status = subscription?.status || "Unknown";
  const statusLower = String(status).toLowerCase();
  const isStopped = ["cancelled", "expired"].includes(statusLower);

  if (loading) {
    return <div className="flex min-h-[55vh] items-center justify-center px-4 text-sm font-semibold text-green-800">Loading subscription…</div>;
  }

  if (!subscription) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="font-bold text-red-700">Unable to load subscription</p>
        <p className="mt-2 text-sm text-slate-600">{loadError || "Subscription details not found."}</p>
        <button onClick={loadSubscription} className="mt-4 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white">Try again</button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-3 py-4 pb-8 sm:px-5">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-green-800">← Back</button>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusLower === "active" ? "bg-green-100 text-green-800" : statusLower === "paused" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
          {status}
        </span>
      </div>

      <h1 className="mb-3 text-xl font-extrabold text-slate-900">Manage subscription</h1>

      <section className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">YOUR DAILY MILK</p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">{form.quantity || 1} × {form.size || "Select size"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Monthly amount</p>
            <p className="text-lg font-extrabold text-green-800">₹{monthlyAmount.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-slate-100 py-3">
          <label htmlFor="sub-quantity" className="text-sm font-semibold text-slate-700">Quantity per day</label>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Decrease quantity" onClick={() => setForm((current) => ({ ...current, quantity: Math.max(1, Number(current.quantity || 1) - 1) }))} className="h-9 w-9 rounded-full bg-slate-100 text-lg font-bold">−</button>
            <span id="sub-quantity" className="min-w-5 text-center font-bold">{form.quantity || 1}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setForm((current) => ({ ...current, quantity: Number(current.quantity || 1) + 1 }))} className="h-9 w-9 rounded-full bg-green-700 text-lg font-bold text-white">+</button>
          </div>
        </div>

        <div className="border-t border-slate-100 py-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Milk size</p>
          <div className="grid grid-cols-5 gap-1.5">
            {["500ml", "1L", "2L", "3L", "5L"].map((size) => (
              <button key={size} type="button" aria-pressed={form.size === size} onClick={() => setForm((current) => ({ ...current, size }))} className={`rounded-lg border px-1 py-2 text-xs font-bold ${form.size === size ? "border-green-700 bg-green-700 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <label htmlFor="sub-address" className="mb-2 block text-sm font-semibold text-slate-700">Delivery address</label>
          <select id="sub-address" value={form.address_id} onChange={(event) => setForm((current) => ({ ...current, address_id: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Select address</option>
            {addresses.map((address) => <option key={address.id} value={address.id}>{addressLabel(address) || "Saved address"}</option>)}
          </select>
          {selectedAddress && <p className="mt-1 text-xs text-slate-500">{addressLabel(selectedAddress)}</p>}
          {!addresses.length && <p className="mt-1 text-xs text-amber-700">No saved address found.</p>}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>Start: <strong>{formatDate(subscription.start_date)}</strong></span>
          <span>End: <strong>{formatDate(subscription.end_date)}</strong></span>
          {form.delivery_time && <span>Delivery: <strong className="capitalize">{String(form.delivery_time).replaceAll("_", " ")}</strong></span>}
        </div>

        <button type="button" onClick={handleSave} disabled={saving || isStopped} className="mt-3 min-h-11 w-full rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {saving ? "Please wait…" : "Save changes"}
        </button>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setShowPauseModal(true)} disabled={saving || isStopped} className="min-h-11 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 disabled:opacity-50">
          ⏸ Pause deliveries
        </button>
        <button type="button" onClick={handleCancel} disabled={saving || isStopped} className="min-h-11 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-50">
          Cancel subscription
        </button>
      </div>

      {statusLower === "paused" && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">Your subscription is paused.</p>}

      {showPauseModal && (
        <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setShowPauseModal(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pause-title" className="w-full rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-sm sm:rounded-2xl">
            <h2 id="pause-title" className="text-lg font-extrabold text-slate-900">Pause deliveries</h2>
            <p className="mt-1 text-xs text-slate-500">Choose the days you do not need milk.</p>
            <label htmlFor="pause-from" className="mt-4 block text-sm font-semibold text-slate-700">From</label>
            <input id="pause-from" type="date" value={pauseFrom} min={todayLocalISO()} max={subscription.end_date || undefined} onChange={(event) => { setPauseFrom(event.target.value); if (pauseTo && event.target.value > pauseTo) setPauseTo(""); }} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3" />
            <label htmlFor="pause-to" className="mt-3 block text-sm font-semibold text-slate-700">Until</label>
            <input id="pause-to" type="date" value={pauseTo} min={pauseFrom || todayLocalISO()} max={subscription.end_date || undefined} onChange={(event) => setPauseTo(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" disabled={saving} onClick={() => setShowPauseModal(false)} className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700">Back</button>
              <button type="button" disabled={saving || !pauseFrom || !pauseTo} onClick={handlePause} className="min-h-11 rounded-xl bg-green-700 px-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Pausing…" : "Confirm pause"}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
