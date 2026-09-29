import { useEffect, useMemo, useState } from "react";
import {
  getSubscriptionDeliveryOverrides,
  saveSubscriptionDeliveryOverrides,
  deleteSubscriptionDeliveryOverride,
} from "../../config/api";

const MILK_NAMES = ["buffalo", "cow"];
const SIZES = ["500ml", "1L", "2L", "3L", "5L"];

function getProductName(item) {
  return (
    item?.products?.name ||
    item?.product?.name ||
    item?.name ||
    "Milk"
  );
}

function getProductId(item) {
  return item?.product_id || item?.products?.id || item?.product?.id || item?.id;
}

function isMilkProduct(item, kind) {
  return getProductName(item).toLowerCase().includes(kind);
}

export default function DeliverySizeOverrides({ subscription }) {
  const subscriptionId = subscription?.id;
  const items = subscription?.subscription_items || [];

  const milkProducts = useMemo(
    () =>
      items
        .filter(
          (item) =>
            MILK_NAMES.some((kind) => isMilkProduct(item, kind)) &&
            getProductId(item)
        )
        .map((item) => ({
          id: getProductId(item),
          name: getProductName(item),
          defaultSize: item.size || "1L",
          defaultQuantity: Number(item.quantity || 1),
        })),
    [items]
  );

  const getLocalDate = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
  };
  const [startDate, setStartDate] = useState(getLocalDate);
  const [endDate, setEndDate] = useState(getLocalDate);
  const [overrides, setOverrides] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingProductId, setSavingProductId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadOverrides() {
    if (!subscriptionId) return;
    setLoading(true);
    setError("");
    try {
      const response = await getSubscriptionDeliveryOverrides(subscriptionId);
      const rows = response?.overrides || response?.data || response || [];
      const list = Array.isArray(rows) ? rows : [];
      setOverrides(list);

      const nextDrafts = {};
      for (const product of milkProducts) {
        const existing = list.find(
          (row) =>
            row.delivery_date >= startDate &&
            row.delivery_date <= endDate &&
            row.product_id === product.id &&
            row.status !== "Cancelled"
        );
        nextDrafts[product.id] = {
          size: existing?.size || product.defaultSize,
          quantity: String(existing?.quantity ?? product.defaultQuantity),
          exists: Boolean(existing),
        };
      }
      setDrafts(nextDrafts);
    } catch (e) {
      setError(e.message || "Could not load delivery overrides.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverrides();
    // Loading is intentionally tied to subscription, date, and products.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionId, startDate, endDate, milkProducts]);

  function updateDraft(productId, field, value) {
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value,
      },
    }));
    setMessage("");
  }

  async function saveProduct(product) {
    const draft = drafts[product.id];
    if (!draft) return;

    const quantity = Number(draft.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    setSavingProductId(product.id);
    setError("");
    setMessage("");

    if (!startDate || !endDate || startDate > endDate) {
      setError("Please select a valid start date and end date.");
      return;
    }

    try {
      const payload = {
        start_date: startDate,
        end_date: endDate,
        product_id: product.id,
        size: draft.size,
        quantity,
      };

      const result = await saveSubscriptionDeliveryOverrides(subscriptionId, payload);
      const pricing = result?.pricing;
      const estimate = pricing && Number.isFinite(Number(pricing.estimated_total))
        ? ` Estimated range charges: ₹${Number(pricing.estimated_total).toFixed(2)} (${pricing.scheduled_delivery_count} scheduled deliveries at ₹${Number(pricing.unit_price).toFixed(2)} × ${quantity}).`
        : "";
      setMessage(`${product.name} override saved from ${startDate} through ${endDate}. The regular subscription resumes after the end date.${estimate}`);
      await loadOverrides();
    } catch (e) {
      setError(e.message || "Could not save override.");
    } finally {
      setSavingProductId("");
    }
  }

  async function resetProduct(product) {
    setSavingProductId(product.id);
    setError("");
    setMessage("");

    try {
      const matchingDates = overrides
        .filter((row) =>
          row.product_id === product.id &&
          row.delivery_date >= startDate &&
          row.delivery_date <= endDate &&
          row.status !== "Cancelled"
        )
        .map((row) => row.delivery_date);
      await Promise.all(
        [...new Set(matchingDates)].map((date) =>
          deleteSubscriptionDeliveryOverride(subscriptionId, date, product.id)
        )
      );
      setMessage(`${product.name} overrides removed for the selected date range.`);
      await loadOverrides();
    } catch (e) {
      setError(e.message || "Could not remove override.");
    } finally {
      setSavingProductId("");
    }
  }

  if (!subscriptionId) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Delivery Size Overrides
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose a date range and set the milk size and quantity for scheduled deliveries in that period. Your permanent subscription stays unchanged; billing uses the actual size, quantity, and price delivered. Regular subscription quantities resume the day after the end date.
        </p>
      </div>

      <label className="mb-4 block text-sm font-semibold text-slate-700">
        <span className="mb-1 block">From date</span>
        <input
          type="date"
          min={subscription?.start_date || getLocalDate()}
          max={subscription?.end_date || undefined}
          value={startDate}
          onChange={(e) => {
            const next = e.target.value;
            setStartDate(next);
            if (endDate < next) setEndDate(next);
          }}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-base"
        />
      </label>

      <label className="mb-4 block text-sm font-semibold text-slate-700">
        To date
        <input
          type="date"
          min={startDate}
          max={subscription?.end_date || undefined}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-base"
        />
      </label>

      {loading && (
        <p className="py-3 text-sm text-slate-500">Loading overrides...</p>
      )}

      {!loading && milkProducts.length === 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Buffalo Milk and Cow Milk subscription items were not found. Confirm
          the subscription API returns subscription_items with product names
          and product IDs.
        </div>
      )}

      <div className="space-y-4">
        {milkProducts.map((product) => {
          const draft = drafts[product.id] || {
            size: product.defaultSize,
            quantity: String(product.defaultQuantity),
            exists: false,
          };

          return (
            <div
              key={product.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">
                  {product.name}
                </h3>
                {draft.exists && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                    Range override exists
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Size
                  <select
                    value={draft.size}
                    onChange={(e) =>
                      updateDraft(product.id, "size", e.target.value)
                    }
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  >
                    {SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={draft.quantity}
                    onChange={(e) =>
                      updateDraft(product.id, "quantity", e.target.value)
                    }
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingProductId === product.id}
                  onClick={() => saveProduct(product)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProductId === product.id ? "Saving..." : "Save override"}
                </button>

                <button
                  type="button"
                  disabled={savingProductId === product.id || !draft.exists}
                  onClick={() => resetProduct(product)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove override from start date
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
    </section>
  );
}
