import { useState } from "react";

export default function PauseSubscriptionModal({
  open,
  subscription,
  loading,
  onClose,
  onConfirm,
}) {
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseTo, setPauseTo] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!pauseFrom || !pauseTo) {
      alert("Please select both dates.");
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
      alert("Pause To cannot be earlier than Pause From.");
      return;
    }

    if (to > endDate) {
      alert("Pause To cannot exceed subscription end date.");
      return;
    }

    onConfirm(pauseFrom, pauseTo);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center">

      <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-6">

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
              className="w-full border rounded-lg px-3 py-2 mt-2"
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
              className="w-full border rounded-lg px-3 py-2 mt-2"
              value={pauseTo}
              min={pauseFrom || new Date().toISOString().split("T")[0]}
              max={subscription.end_date}
              onChange={(e) => setPauseTo(e.target.value)}
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Pause
          </button>

        </div>

      </div>

    </div>
  );
}