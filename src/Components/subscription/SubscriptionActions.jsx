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



const handlePauseClick = async () => {
  const { value: formValues } = await Swal.fire({
    title: "Pause Subscription",
    html: `
      <label style="display:block;text-align:left">Pause From</label>
      <input id="pauseFrom" type="date" class="swal2-input">

      <label style="display:block;text-align:left">Pause To</label>
      <input id="pauseTo" type="date" class="swal2-input">
    `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return {
        pauseFrom: document.getElementById("pauseFrom").value,
        pauseTo: document.getElementById("pauseTo").value,
      };
    },
  });

  if (!formValues) return;

  await updateSubscriptionStatus(
    id,
    "Paused",
    formValues.pauseFrom,
    formValues.pauseTo
  );

  await loadSubscription();

  Swal.fire(
    "Success",
    "Subscription paused successfully.",
    "success"
  );
};


  const handleResume = async () => {
    try {
      await resume();
      alert("Subscription resumed successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to resume subscription.");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this subscription?")) return;

    try {
      await cancel();
      alert("Subscription cancelled.");
    } catch (err) {
      console.error(err);
      alert("Unable to cancel subscription.");
    }
  };

  const handleRenew = async () => {
    try {
      await renew(
        subscription.end_date,
        subscription.total_amount
      );

      alert("Subscription renewed.");
    } catch (err) {
      console.error(err);
      alert("Unable to renew subscription.");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-5">
        <h2 className="text-2xl font-bold">
          Subscription Actions
        </h2>
      </div>

      <div className="p-6 space-y-4">

        {!subscription.is_paused && (
          <button
            disabled={loading}
            onClick={() => {
              console.log("Pause clicked");
              setShowPauseModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl transition"
          >
            <PauseCircle size={20} />
            Pause Subscription
          </button>
        )}

        {subscription.is_paused && (
          <button
            disabled={loading}
            onClick={handleResume}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition"
          >
            <PlayCircle size={20} />
            Resume Subscription
          </button>
        )}

        <button
          disabled={loading}
          onClick={handleRenew}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition"
        >
          <RefreshCw size={20} />
          Renew Subscription
        </button>

        <button
          disabled={loading}
          onClick={handleCancel}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition"
        >
          <XCircle size={20} />
          Cancel Subscription
        </button>

      </div>
      {showPauseModal && (

          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl p-6 w-[420px]">

          <h2 className="text-xl font-bold mb-4">

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
/>

          </div>

          </div>

          <div className="flex justify-end gap-3 mt-6">

          <button

          onClick={()=>setShowPauseModal(false)}

          className="px-4 py-2 border rounded-lg"

          >

          Cancel

          </button>

          <button
            onClick={handlePauseClick}
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