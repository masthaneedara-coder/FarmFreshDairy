import {
  CalendarDays,
  Droplets,
  RefreshCw,
  Award,
  CheckCircle2,
} from "lucide-react";

export default function ProgressCard({
  remainingDays = 21,
  totalDays = 30,
  deliveredLitres = 21,
  todayDelivered = true,
}) {
  const progress =
    ((totalDays - remainingDays) / totalDays) * 100;

  const renewalDays = remainingDays;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-emerald-600 to-green-500 p-5 text-white">

        <h2 className="text-2xl font-bold">
          Subscription Progress
        </h2>

        <p className="opacity-90 mt-1">
          Live Delivery Statistics
        </p>

      </div>

      <div className="p-6">

        {/* Circle */}

        <div className="flex justify-center">

          <div className="relative w-44 h-44">

            <svg
              className="rotate-[-90deg]"
              width="176"
              height="176"
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
                strokeDashoffset={
                  452 -
                  (452 * progress) / 100
                }
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">

              <h2 className="text-4xl font-bold text-green-700">
                {Math.round(progress)}%
              </h2>

              <p className="text-gray-500">
                Completed
              </p>

            </div>

          </div>

        </div>

        {/* Remaining */}

        <div className="mt-8 text-center">

          <h3 className="text-xl font-bold">

            {remainingDays} Days Remaining

          </h3>

          <p className="text-gray-500 mt-2">

            Subscription expires in {remainingDays} days

          </p>

        </div>

        {/* Stats */}

        <div className="grid grid-cols-2 gap-4 mt-8">

          <Stat
            icon={<CheckCircle2 />}
            title="Today's Delivery"
            value={
              todayDelivered
                ? "Delivered"
                : "Pending"
            }
          />

          <Stat
            icon={<Droplets />}
            title="Milk Delivered"
            value={`${deliveredLitres} L`}
          />

          <Stat
            icon={<RefreshCw />}
            title="Renewal"
            value={`${renewalDays} Days`}
          />

          <Stat
            icon={<CalendarDays />}
            title="Total Days"
            value={totalDays}
          />

        </div>

        {/* Health */}

        <div className="mt-8 bg-green-50 rounded-2xl p-5">

          <div className="flex gap-3">

            <Award
              className="text-green-700"
              size={36}
            />

            <div>

              <h3 className="font-bold text-lg">

                Subscription Health

              </h3>

              <p className="text-gray-600">

                Excellent

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

function Stat({
  icon,
  title,
  value,
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">

      <div className="text-green-700">

        {icon}

      </div>

      <p className="text-sm text-gray-500 mt-2">

        {title}

      </p>

      <h3 className="font-bold mt-1">

        {value}

      </h3>

    </div>
  );
}