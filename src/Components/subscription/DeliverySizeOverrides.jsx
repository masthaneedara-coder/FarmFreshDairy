import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchSubscription,
  getSubscriptionDeliveryOverrides,
  saveSubscriptionDeliveryOverrides,
  deleteSubscriptionDeliveryOverride,
} from "../../config/api";

const MILK_NAMES = ["buffalo", "cow"];
const SIZES = ["500ml", "1L", "2L", "3L", "5L"];
const EMPTY_ITEMS = Object.freeze([]);

// Reuse an in-flight request if React StrictMode mounts the component twice
// or the popup is quickly reopened. This prevents duplicate requests.
const subscriptionRequests = new Map();
const overrideRequests = new Map();

function getSubscriptionOnce(subscriptionId) {
  if (!subscriptionRequests.has(subscriptionId)) {
    const request = fetchSubscription(subscriptionId).finally(() => {
      subscriptionRequests.delete(subscriptionId);
    });
    subscriptionRequests.set(subscriptionId, request);
  }
  return subscriptionRequests.get(subscriptionId);
}

function getOverridesOnce(subscriptionId) {
  if (!overrideRequests.has(subscriptionId)) {
    const request = getSubscriptionDeliveryOverrides(subscriptionId).finally(() => {
      overrideRequests.delete(subscriptionId);
    });
    overrideRequests.set(subscriptionId, request);
  }
  return overrideRequests.get(subscriptionId);
}

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

function getMilkProducts(subscriptionDetails) {
  const items = Array.isArray(subscriptionDetails?.subscription_items)
    ? subscriptionDetails.subscription_items
    : EMPTY_ITEMS;

  return items
    .filter((item) => {
      const name = getProductName(item).toLowerCase();
      return MILK_NAMES.some((kind) => name.includes(kind)) && getProductId(item);
    })
    .map((item) => ({
      id: String(getProductId(item)),
      name: getProductName(item),
      defaultSize: item.size || "1L",
      defaultQuantity: Number(item.quantity || 1),
    }));
}

function getLocalDate() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function unwrapSubscription(response, fallback) {
  if (response?.success === false) {
    throw new Error(response.message || "Could not load subscription details.");
  }
  return (
    response?.subscription ||
    response?.data?.subscription ||
    response?.data ||
    response ||
    fallback
  );
}

export default function DeliverySizeOverrides({ subscription }) {
  const subscriptionId = subscription?.id || "";
  const subscriptionRef = useRef(subscription);
  subscriptionRef.current = subscription;
  const detailsRef = useRef(subscription || null);

  const [resolvedSubscription, setResolvedSubscription] = useState(subscription || null);
  const [startDate, setStartDate] = useState(getLocalDate);
  const [endDate, setEndDate] = useState(getLocalDate);
  const [overrides, setOverrides] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(Boolean(subscriptionId));
  const [savingProductId, setSavingProductId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  const milkProducts = useMemo(
    () => getMilkProducts(resolvedSubscription),
    [resolvedSubscription?.subscription_items]
  );

  const loadOverrides = useCallback(async () => {
    if (!subscriptionId) {
      setLoading(false);
      setOverrides([]);
      return;
    }

    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");

    try {
      // The dashboard API intentionally sends a compact subscription summary.
      // Load the full subscription once so product IDs and names are available.
      let fullSubscription = detailsRef.current || subscriptionRef.current || {};
      const hasItems = Array.isArray(fullSubscription.subscription_items) &&
        fullSubscription.subscription_items.length > 0;

      if (!hasItems) {
        const response = await getSubscriptionOnce(subscriptionId);
        fullSubscription = unwrapSubscription(response, fullSubscription);
      }
      detailsRef.current = fullSubscription;

      if (requestId !== requestSequence.current) return;
      setResolvedSubscription(fullSubscription);

      const products = getMilkProducts(fullSubscription);
      if (products.length === 0) {
        setOverrides([]);
        setError(
          "Milk product details are missing from this subscription. Please refresh the dashboard or contact support."
        );
        return;
      }

      // One request per subscription. Date changes only filter this local list.
      const response = await getOverridesOnce(subscriptionId);
      if (requestId !== requestSequence.current) return;

      if (response?.success === false) {
        throw new Error(response.message || "Could not load delivery overrides.");
      }

      const rows = Array.isArray(response)
        ? response
        : Array.isArray(response?.overrides)
          ? response.overrides
          : Array.isArray(response?.data)
            ? response.data
            : [];

      setOverrides(rows);
    } catch (err) {
      if (requestId === requestSequence.current) {
        setError(err?.message || "Could not load delivery overrides.");
      }
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [subscriptionId]);

  useEffect(() => {
    loadOverrides();
    return () => {
      requestSequence.current += 1;
    };
  }, [loadOverrides]);

  useEffect(() => {
    const nextDrafts = {};
    for (const product of milkProducts) {
      const existing = overrides.find(
        (row) =>
          row.delivery_date >= startDate &&
          row.delivery_date <= endDate &&
          String(row.product_id) === product.id &&
          row.status !== "Cancelled"
      );
      nextDrafts[product.id] = {
        size: existing?.size || product.defaultSize,
        quantity: String(existing?.quantity ?? product.defaultQuantity),
        exists: Boolean(existing),
      };
    }
    setDrafts(nextDrafts);
  }, [milkProducts, overrides, startDate, endDate]);

  function updateDraft(productId, field, value) {
    setDrafts((previous) => ({
      ...previous,
      [productId]: {
        ...(previous[productId] || {}),
        [field]: value,
      },
    }));
    setMessage("");
    setError("");
  }

  async function saveProduct(product) {
    const draft = drafts[product.id];
    if (!draft) return;

    const quantity = Number(draft.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      setError("Please select a valid start date and end date.");
      return;
    }

    setSavingProductId(product.id);
    setError("");
    setMessage("");

    try {
      const result = await saveSubscriptionDeliveryOverrides(subscriptionId, {
        start_date: startDate,
        end_date: endDate,
        product_id: product.id,
        size: draft.size,
        quantity,
      });

      const pricing = result?.pricing;
      const estimate = pricing && Number.isFinite(Number(pricing.estimated_total))
        ? ` Estimated range charges: ₹${Number(pricing.estimated_total).toFixed(2)} (${pricing.scheduled_delivery_count} scheduled deliveries at ₹${Number(pricing.unit_price).toFixed(2)} × ${quantity}).`
        : "";

      setMessage(
        `${product.name} override saved from ${startDate} through ${endDate}. Regular subscription quantities resume after the end date.${estimate}`
      );
      await loadOverrides();
    } catch (err) {
      setError(err?.message || "Could not save override.");
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
        .filter(
          (row) =>
            String(row.product_id) === product.id &&
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
      // Force a fresh read after a successful delete.
      await loadOverrides();
    } catch (err) {
      setError(err?.message || "Could not remove override.");
    } finally {
      setSavingProductId("");
    }
  }

  if (!subscriptionId) return null;

  const minDate = resolvedSubscription?.start_date || subscription?.start_date || getLocalDate();
  const maxDate = resolvedSubscription?.end_date || subscription?.end_date || undefined;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Delivery Size Overrides</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose a date range and set the milk size and quantity for scheduled deliveries in that period. Your permanent subscription stays unchanged; billing uses the actual size, quantity, and price delivered. Regular subscription quantities resume the day after the end date.
        </p>
      </div>

      <label className="mb-4 block text-sm font-semibold text-slate-700">
        <span className="mb-1 block">From date</span>
        <input
          type="date"
          min={minDate}
          max={maxDate}
          value={startDate}
          onChange={(event) => {
            const nextDate = event.target.value;
            setStartDate(nextDate);
            if (endDate < nextDate) setEndDate(nextDate);
          }}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-base"
        />
      </label>

      <label className="mb-4 block text-sm font-semibold text-slate-700">
        To date
        <input
          type="date"
          min={startDate}
          max={maxDate}
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-base"
        />
      </label>

      {loading && (
        <p className="py-3 text-sm text-slate-500" role="status">
          Loading subscription and saved delivery changes…
        </p>
      )}

      {!loading && error && (
        <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadOverrides}
            className="mt-2 rounded-lg bg-red-100 px-3 py-2 font-semibold hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && milkProducts.length > 0 && (
        <div className="space-y-4">
          {milkProducts.map((product) => {
            const draft = drafts[product.id] || {
              size: product.defaultSize,
              quantity: String(product.defaultQuantity),
              exists: false,
            };

            return (
              <div key={product.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{product.name}</h3>
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
                      onChange={(event) => updateDraft(product.id, "size", event.target.value)}
                      className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    >
                      {SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
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
                      onChange={(event) => updateDraft(product.id, "quantity", event.target.value)}
                      className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingProductId === product.id || loading}
                    onClick={() => saveProduct(product)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProductId === product.id ? "Saving…" : "Save override"}
                  </button>

                  <button
                    type="button"
                    disabled={savingProductId === product.id || loading || !draft.exists}
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
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      )}
    </section>
  );
}
