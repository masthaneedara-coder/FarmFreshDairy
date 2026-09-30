import {
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

import { useSubscription } from "../../context/SubscriptionContext";

export default function SubscriptionActions() {
  const {
    subscription,
    loading,
    pause,
    resume,
    cancel,
    renew,
    loadSubscriptionData,
  } = useSubscription();

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseTo, setPauseTo] = useState("");

  if (!subscription) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-2">
          Subscription Actions
        </h2>

        <p className="text-gray-500">
          Create a subscription to enable actions.
        </p>
      </div>
    );
  }

  // ==========================================
  // PAUSE
  // ==========================================

  const handlePause = async () => {
    if (!pauseFrom || !pauseTo) {
      Swal.fire(
        "Select Dates",
        "Please select both Pause From and Pause To dates.",
        "warning"
      );
      return;
    }

    if (pauseTo < pauseFrom) {
      Swal.fire(
        "Invalid Dates",
        "Pause To cannot be before Pause From.",
        "warning"
      );
      return;
    }

    try {
      await pause(
        subscription.id,
        pauseFrom,
        pauseTo
      );

      setShowPauseModal(false);
      setPauseFrom("");
      setPauseTo("");

      Swal.fire(
        "Success",
        "Subscription paused successfully.",
        "success"
      );

    } catch (err) {
      console.error("Pause subscription error:", err);

      Swal.fire(
        "Error",
        err?.message || "Unable to pause subscription.",
        "error"
      );
    }
  };

  // ==========================================
  // RESUME
  // ==========================================

  const handleResume = async () => {
    try {
      await resume();

      Swal.fire(
        "Success",
        "Subscription resumed successfully.",
        "success"
      );

    } catch (err) {
      console.error("Resume subscription error:", err);

      Swal.fire(
        "Error",
        err?.message || "Unable to resume subscription.",
        "error"
      );
    }
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Cancel Subscription?",
      text: "Are you sure you want to cancel this subscription?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "Keep Subscription",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      await cancel();

      Swal.fire(
        "Cancelled",
        "Subscription cancelled successfully.",
        "success"
      );

    } catch (err) {
      console.error("Cancel subscription error:", err);

      Swal.fire(
        "Error",
        err?.message || "Unable to cancel subscription.",
        "error"
      );
    }
  };

  // ==========================================
  // RENEW
  // ==========================================

  const handleRenew = async () => {
    try {
      if (!subscription.id) {
        throw new Error("Subscription ID is missing.");
      }

      if (!subscription.end_date) {
        throw new Error("Subscription expiry date is missing.");
      }

      if (
        subscription.total_amount === undefined ||
        subscription.total_amount === null
      ) {
        throw new Error("Subscription amount is missing.");
      }

      const result = await Swal.fire({
        title: "Renew Subscription?",
        html: `
          <div style="text-align:left">
            <p><strong>Current Plan:</strong> ${
              subscription.subscription_items?.[0]?.size || "Milk"
            }</p>

            <p><strong>Current Monthly Amount:</strong>
              ₹${Number(subscription.total_amount).toLocaleString("en-IN")}
            </p>

            <p><strong>Current Expiry:</strong>
              ${subscription.end_date}
            </p>

            <hr style="margin:12px 0"/>

            <p style="color:#047857;font-weight:600">
              Your renewal will continue after the current expiry date.
            </p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Renew",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#059669",
      });

      if (!result.isConfirmed) return;

      /*
       * IMPORTANT:
       * renew expects:
       *   subscription ID
       *   current end date
       *   total amount
       */
      await renew(
        subscription.id,
        subscription.end_date,
        subscription.total_amount
      );

      // Refresh subscription data
      if (loadSubscriptionData) {
        await loadSubscriptionData(subscription.customer_id);
      }

      await Swal.fire(
        "Renewed Successfully",
        "Your subscription has been renewed successfully.",
        "success"
      );

    } catch (err) {
      console.error("Renew subscription error:", err);

      Swal.fire(
        "Renewal Failed",
        err?.message || "Unable to renew subscription.",
        "error"
      );
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-5">
        <h2 className="text-2xl font-bold">
          Subscription Actions
        </h2>

        <p className="text-green-100 text-sm mt-1">
          Manage your milk subscription
        </p>
      </div>

      {/* ACTIONS */}
      <div className="p-6 space-y-4">

        {/* PAUSE */}
        {!subscription.is_paused && (
          <button
            disabled={loading}
            onClick={() => {
              setPauseFrom("");
              setPauseTo("");
              setShowPauseModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition"
          >
            <PauseCircle size={20} />
            Pause Subscription
          </button>
        )}

        {/* RESUME */}
        {subscription.is_paused && (
          <button
            disabled={loading}
            onClick={handleResume}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition"
          >
            <PlayCircle size={20} />
            Resume Subscription
          </button>
        )}

        {/* RENEW */}
        <button
          disabled={loading}
          onClick={handleRenew}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition"
        >
          <RefreshCw
            size={20}
            className={loading ? "animate-spin" : ""}
          />
          Renew Subscription
        </button>

        {/* CANCEL */}
        <button
          disabled={loading}
          onClick={handleCancel}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition"
        >
          <XCircle size={20} />
          Cancel Subscription
        </button>

      </div>

      {/* PAUSE MODAL */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">

            <h2 className="text-xl font-bold mb-5">
              Pause Subscription
            </h2>

            <div className="space-y-4">

              {/* FROM */}
              <div>
                <label className="block font-semibold mb-2">
                  Pause From
                </label>

                <input
                  type="date"
                  value={pauseFrom}
                  min={new Date()
                    .toISOString()
                    .split("T")[0]}
                  max={subscription.end_date}
                  onChange={(e) =>
                    setPauseFrom(e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                />
              </div>

              {/* TO */}
              <div>
                <label className="block font-semibold mb-2">
                  Pause To
                </label>

                <input
                  type="date"
                  value={pauseTo}
                  min={
                    pauseFrom ||
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  max={subscription.end_date}
                  onChange={(e) =>
                    setPauseTo(e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                />
              </div>

            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => {
                  setShowPauseModal(false);
                  setPauseFrom("");
                  setPauseTo("");
                }}
                className="px-5 py-3 border border-gray-300 rounded-xl font-semibold"
              >
                Cancel
              </button>

              <button
                disabled={loading}
                onClick={handlePause}
                className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold"
              >
                ⏸ Pause
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}