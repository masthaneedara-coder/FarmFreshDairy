import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = "https://farmfreshdairy.onrender.com/api";

function getTodayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function readApiResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Unable to process your request.");
  }
  return data;
}

export default function WhatsAppPauseManagement() {
  const { token } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseTo, setPauseTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDetails = useCallback(async () => {
    if (!token) {
      setError("This management link is invalid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/subscriptions/manage/${encodeURIComponent(token)}`,
        { method: "GET", cache: "no-store" }
      );
      const data = await readApiResponse(response);
      setSubscription(data.subscription);
      setExpiresAt(data.expiresAt || null);
    } catch (err) {
      setSubscription(null);
      setError(err.message || "Unable to load this management link.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const isPaused =
    subscription?.isPaused === true ||
    String(subscription?.status || "").toLowerCase() === "paused";

  const handlePause = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!pauseFrom || !pauseTo) {
      setError("Please select both pause dates.");
      return;
    }
    if (pauseFrom < getTodayIST()) {
      setError("Pause From cannot be before today.");
      return;
    }
    if (pauseTo < pauseFrom) {
      setError("Pause To cannot be earlier than Pause From.");
      return;
    }
    if (subscription?.endDate && pauseTo > subscription.endDate) {
      setError("Pause period cannot exceed the subscription end date.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/subscriptions/manage/${encodeURIComponent(token)}/pause`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pause_from: pauseFrom,
            pause_to: pauseTo,
          }),
        }
      );
      const data = await readApiResponse(response);
      setMessage(data.message || "Subscription paused successfully.");
      await loadDetails();
    } catch (err) {
      setError(err.message || "Unable to pause the subscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleResume = async () => {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/subscriptions/manage/${encodeURIComponent(token)}/resume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      const data = await readApiResponse(response);
      setMessage(data.message || "Subscription resumed successfully.");
      await loadDetails();
    } catch (err) {
      setError(err.message || "Unable to resume the subscription.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <p className="text-gray-600">Loading subscription details…</p>
      </main>
    );
  }

  if (!subscription) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow">
          <h1 className="text-xl font-semibold text-gray-900">
            Subscription management
          </h1>
          <p className="mt-3 text-sm text-red-600">
            {error || "This management link is unavailable."}
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Please contact Farm Fresh Dairy if you need help.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] px-4 py-8">
      <section className="mx-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-lg sm:p-7">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Farm Fresh Dairy
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Manage your subscription
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Use this secure link to pause or resume this subscription.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="font-semibold text-gray-900">Subscription details</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Product</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {subscription.product || "Milk"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Size</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {subscription.size || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Quantity</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {subscription.quantity ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Delivery time</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {subscription.deliveryTime || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Start date</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {formatDate(subscription.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">End date</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {formatDate(subscription.endDate)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Amount</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {Number.isFinite(Number(subscription.amount))
                  ? `₹${Number(subscription.amount).toLocaleString("en-IN")}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className="mt-1 font-semibold text-gray-900">
                {subscription.status || "—"}
              </dd>
            </div>
          </dl>
          {isPaused && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Paused from {formatDate(subscription.pauseFrom)} to{" "}
              {formatDate(subscription.pauseTo)}.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </p>
        )}

        {isPaused ? (
          <div className="mt-6">
            <h2 className="font-semibold text-gray-900">Resume subscription</h2>
            <p className="mt-1 text-sm text-gray-600">
              Resume this subscription using the secure WhatsApp link.
            </p>
            <button
              type="button"
              onClick={handleResume}
              disabled={saving}
              className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Please wait…" : "Resume subscription"}
            </button>
          </div>
        ) : String(subscription.status || "").toLowerCase() !== "active" ? (
          <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            This subscription is not active, so it cannot be paused using this link.
          </p>
        ) : (
          <form onSubmit={handlePause} className="mt-6">
            <h2 className="font-semibold text-gray-900">Pause subscription</h2>
            <p className="mt-1 text-sm text-gray-600">
              Select the dates when you want milk delivery to stop.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Pause from
                <input
                  type="date"
                  required
                  min={getTodayIST()}
                  max={subscription.endDate || undefined}
                  value={pauseFrom}
                  onChange={(event) => {
                    setPauseFrom(event.target.value);
                    if (pauseTo && event.target.value > pauseTo) setPauseTo("");
                  }}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Pause to
                <input
                  type="date"
                  required
                  min={pauseFrom || getTodayIST()}
                  max={subscription.endDate || undefined}
                  value={pauseTo}
                  onChange={(event) => setPauseTo(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Processing…" : "Confirm pause"}
            </button>
          </form>
        )}

        {expiresAt && (
          <p className="mt-5 text-center text-xs text-gray-500">
            Secure link expires: {new Date(expiresAt).toLocaleString("en-IN")}
          </p>
        )}
        <p className="mt-3 text-center text-xs text-gray-400">
          If you need assistance, contact Farm Fresh Dairy.
        </p>
      </section>
    </main>
  );
}
