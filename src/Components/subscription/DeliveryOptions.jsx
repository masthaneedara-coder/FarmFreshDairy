import {
  CalendarDays,
  Clock3,
  Repeat,
  StickyNote,
} from "lucide-react";

import { useSubscription } from "../../context/SubscriptionContext";

export default function DeliveryOptions() {
  const {
    deliveryOptions,
    setDeliveryOptions,
  } = useSubscription();

  const updateOption = (field, value) => {
    setDeliveryOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6">

        <h2 className="text-2xl font-bold">
          Delivery Options
        </h2>

        <p className="opacity-90">
          Customize your subscription delivery
        </p>

      </div>

      <div className="p-6 space-y-6">

        {/* Frequency */}

        <div>

          <label className="flex items-center gap-2 font-semibold mb-3">

            <Repeat size={18} />

            Delivery Frequency

          </label>

          <select
            value={deliveryOptions.frequency}
            onChange={(e) =>
              updateOption("frequency", e.target.value)
            }
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option>Daily</option>
            <option>Alternate Days</option>
            <option>Weekdays</option>
            <option>Weekends</option>
            <option>Custom</option>
          </select>

        </div>

        {/* Delivery Time */}

        <div>

          <label className="flex items-center gap-2 font-semibold mb-3">

            <Clock3 size={18} />

            Delivery Time

          </label>

          <select
            value={deliveryOptions.deliveryTime}
            onChange={(e) =>
              updateOption("deliveryTime", e.target.value)
            }
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option>Morning (5 AM - 8 AM)</option>
            <option>Evening (5 PM - 8 PM)</option>
          </select>

        </div>

        {/* Start Date */}

        <div>

          <label className="flex items-center gap-2 font-semibold mb-3">

            <CalendarDays size={18} />

            Start Date

          </label>

          <input
            type="date"
            value={deliveryOptions.startDate}
            onChange={(e) =>
              updateOption("startDate", e.target.value)
            }
            className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />

        </div>

        {/* Duration */}

        <div>

          <label className="font-semibold mb-3 block">
            Subscription Duration
          </label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {[7, 15, 30, 90].map((days) => (

              <button
                key={days}
                onClick={() =>
                  updateOption("duration", days)
                }
                className={`rounded-xl py-3 border transition

                ${
                  deliveryOptions.duration === days
                    ? "bg-green-600 text-white border-green-600"
                    : "border-gray-300 hover:border-green-500"
                }`}
              >
                {days} Days
              </button>

            ))}

          </div>

        </div>

        {/* Notes */}

        <div>

          <label className="flex items-center gap-2 font-semibold mb-3">

            <StickyNote size={18} />

            Delivery Notes

          </label>

          <textarea
            rows={4}
            placeholder="Leave at the gate, ring the bell once, etc."
            value={deliveryOptions.notes}
            onChange={(e) =>
              updateOption("notes", e.target.value)
            }
            className="w-full border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          />

        </div>

      </div>

    </div>
  );
}