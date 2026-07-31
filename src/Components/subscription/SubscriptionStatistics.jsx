import {
  CheckCircle,
  Clock3,
  Truck,
  XCircle,
} from "lucide-react";

export default function SubscriptionStatistics({
  subscription,
  summary,
}) {
  console.log("Subscription:", subscription);
console.log("Delivery Summary:", summary);
  if (!subscription) return null;

  const delivered = summary?.delivered || 0;
  const outForDelivery =
    summary?.outForDelivery || 0;
  const pending = summary?.pending || 0;
  const missed = summary?.missed || 0;
  const total = summary?.total || 0;

  const completion =
    total > 0
      ? Math.round((delivered / total) * 100)
      : 0;
      

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">

      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-2xl font-bold">
            Delivery Statistics
          </h2>

          <p className="text-gray-500 text-sm">
            Current subscription delivery summary
          </p>
        </div>

        <div className="text-right">

          <div className="text-3xl font-bold text-green-600">
            {completion}%
          </div>

          <div className="text-xs text-gray-500">
            Completed
          </div>

        </div>

      </div>

      {/* Progress Bar */}

      <div className="w-full bg-gray-200 rounded-full h-3 mb-8">

        <div
          className="bg-green-600 h-3 rounded-full transition-all duration-500"
          style={{
            width: `${completion}%`,
          }}
        />

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-green-50 rounded-2xl p-5 text-center border border-green-100">

          <CheckCircle
            className="mx-auto text-green-600"
            size={36}
          />

          <h3 className="text-3xl font-bold mt-3 text-green-700">
            {delivered}
          </h3>

          <p className="text-gray-600 mt-1">
            Delivered
          </p>

        </div>

        <div className="bg-blue-50 rounded-2xl p-5 text-center border border-blue-100">

          <Truck
            className="mx-auto text-blue-600"
            size={36}
          />

          <h3 className="text-3xl font-bold mt-3 text-blue-700">
            {outForDelivery}
          </h3>

          <p className="text-gray-600 mt-1">
            Out for Delivery
          </p>

        </div>

        <div className="bg-yellow-50 rounded-2xl p-5 text-center border border-yellow-100">

          <Clock3
            className="mx-auto text-yellow-600"
            size={36}
          />

          <h3 className="text-3xl font-bold mt-3 text-yellow-700">
            {pending}
          </h3>

          <p className="text-gray-600 mt-1">
            Pending
          </p>

        </div>

        <div className="bg-red-50 rounded-2xl p-5 text-center border border-red-100">

          <XCircle
            className="mx-auto text-red-600"
            size={36}
          />

          <h3 className="text-3xl font-bold mt-3 text-red-700">
            {missed}
          </h3>

          <p className="text-gray-600 mt-1">
            Missed
          </p>

        </div>

      </div>

      <div className="mt-8 border-t pt-5 flex flex-col sm:flex-row sm:justify-between gap-3 text-sm">

        <div>
          <span className="font-semibold">
            Total Deliveries:
          </span>{" "}
          {total}
        </div>

        <div>
          <span className="font-semibold">
            Subscription Status:
          </span>{" "}
          <span className="text-green-700">
            {subscription.status}
          </span>
        </div>

      </div>

    </div>
  );
}