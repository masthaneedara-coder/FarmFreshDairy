
import {
  CalendarDays,
  Droplets,
  RefreshCw,
  Award,
  CheckCircle2,
} from "lucide-react";

export default function ProgressCard({
  startDate,
  endDate,
  remainingDays,
  totalDays = 30,
  deliveredLitres = 21,
  todayDelivered = true,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use actual subscription dates when available.
  const parseDate = (value) => {
    if (!value) return null;

    // Avoid timezone issues with YYYY-MM-DD values.
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    const date = match
      ? new Date(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3])
        )
      : new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);
    return date;
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  let validityText = "Subscription dates unavailable";
  let renewalText = "N/A";
  let calculatedRemaining = 0;
  let calculatedTotal = totalDays;
  let progress = 0;

  if (start && end && end >= start) {
    const dayMs = 24 * 60 * 60 * 1000;

    // Inclusive subscription duration.
    calculatedTotal =
      Math.floor((end - start) / dayMs) + 1;

    if (today < start) {
      const daysUntilStart = Math.ceil(
        (start - today) / dayMs
      );

      validityText = `Starts in ${daysUntilStart} ${
        daysUntilStart === 1 ? "Day" : "Days"
      }`;

      renewalText = "Not started";
      progress = 0;
    } else if (today > end) {
      validityText = "Subscription Expired";
      renewalText = "Expired";
      calculatedRemaining = 0;
      progress = 100;
    } else {
      // Include today in the remaining subscription days.
      calculatedRemaining =
        Math.floor((end - today) / dayMs) + 1;

      validityText = `${calculatedRemaining} ${
        calculatedRemaining === 1 ? "Day" : "Days"
      } Remaining`;

      renewalText = `${calculatedRemaining} Days`;

      const elapsedDays =
        calculatedTotal - calculatedRemaining;

      progress = calculatedTotal > 0
        ? (elapsedDays / calculatedTotal) * 100
        : 0;
    }
  } else if (Number.isFinite(remainingDays)) {
    // Fallback for callers that have not yet passed dates.
    calculatedRemaining = Math.max(0, remainingDays);
    validityText = `${calculatedRemaining} Days Remaining`;
    renewalText = `${calculatedRemaining} Days`;

    progress = totalDays > 0
      ? ((totalDays - calculatedRemaining) / totalDays) * 100
      : 0;
  }

  progress = Math.max(0, Math.min(100, progress));

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 p-5 text-white">
        <h2 className="text-2xl font-bold">
          Subscription Progress
        </h2>
        <p className="opacity-90 mt-1">
          Live Delivery Statistics
        </p>
      </div>

      <div className="p-6">
        <div className="flex justify-center">
          <div className="relative w-44 h-44">
            <svg
              className="rotate-[-90deg]"
              width="176"
              height="176"
              viewBox="0 0 176 176"
            >
              <circle
                cx="88"
                cy="88"
                r="72"
                stroke="#E5E7EB"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="88"
                cy="88"
                r="72"
                stroke="#16A34A"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={452}
                strokeDashoffset={452 - (452 * progress) / 100}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h2 className="text-4xl font-bold text-green-700">
                {Math.round(progress)}%
              </h2>
              <p className="text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-xl font-bold">
            {validityText}
          </h3>
          <p className="text-gray-500 mt-2">
            {start && end && today < start
              ? `Subscription starts on ${start.toLocaleDateString("en-IN")}`
              : end && today <= end
                ? `Subscription expires on ${end.toLocaleDateString("en-IN")}`
                : end
                  ? `Expired on ${end.toLocaleDateString("en-IN")}`
                  : "Please check the subscription dates"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <Stat
            icon={<CheckCircle2 />}
            title="Today's Delivery"
            value={todayDelivered ? "Delivered" : "Pending"}
          />
          <Stat
            icon={<Droplets />}
            title="Milk Delivered"
            value={`${deliveredLitres} L`}
          />
          <Stat
            icon={<RefreshCw />}
            title="Renewal"
            value={renewalText}
          />
          <Stat
            icon={<CalendarDays />}
            title="Total Days"
            value={calculatedTotal}
          />
        </div>

        <div className="mt-8 bg-green-50 rounded-2xl p-5">
          <div className="flex gap-3">
            <Award className="text-green-700" size={36} />
            <div>
              <h3 className="font-bold text-lg">
                Subscription Health
              </h3>
              <p className="text-gray-600">
                {end && today > end
                  ? "Expired"
                  : start && today < start
                    ? "Not Started"
                    : "Active Period"}
              </p>
              <div className="mt-2 flex gap-1 text-yellow-500 text-xl">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, title, value }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="text-green-700">{icon}</div>
      <p className="text-sm text-gray-500 mt-2">{title}</p>
      <h3 className="font-bold mt-1">{value}</h3>
    </div>
  );
}
