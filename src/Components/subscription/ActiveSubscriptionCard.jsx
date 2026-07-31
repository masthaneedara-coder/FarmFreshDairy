import {
  CalendarDays,
  Clock3,
  Wallet,
  Package,
  CheckCircle2,
} from "lucide-react";

export default function ActiveSubscriptionCard({
  subscription,
}) {
  if (!subscription) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-green-100">

        <Package
          size={60}
          className="mx-auto text-green-500 mb-5"
        />

        <h2 className="text-2xl font-bold text-slate-700">
          No Active Subscription
        </h2>

        <p className="text-gray-500 mt-3">
          Subscribe to fresh dairy products and enjoy
          doorstep delivery every day.
        </p>

      </div>
    );
  }

  const {
    productName,
    quantity,
    size,
    status,
    startDate,
    endDate,
    nextDelivery,
    deliveryTime,
    monthlyAmount,
    remainingDays,
    totalDays,
  } = subscription;

  const progress =
    (remainingDays / totalDays) * 100;

  return (
    <div className="overflow-hidden rounded-3xl shadow-xl bg-white border border-green-100">

      {/* Header */}

      <div className="bg-gradient-to-r from-green-700 to-green-500 p-6 text-white">

        <div className="flex justify-between items-start">

          <div>

            <h2 className="text-2xl font-bold">
              Active Subscription
            </h2>

            <p className="opacity-90 mt-2">
              {productName}
            </p>

          </div>

          <span className="bg-white text-green-700 px-4 py-2 rounded-full text-sm font-semibold">

            {status}

          </span>

        </div>

      </div>

      {/* Body */}

      <div className="p-6">

        <div className="grid grid-cols-2 gap-5">

          <InfoCard
            icon={<Package size={18} />}
            title="Quantity"
            value={`${quantity} × ${size}`}
          />

          <InfoCard
            icon={<Wallet size={18} />}
            title="Monthly Bill"
            value={`₹${monthlyAmount}`}
          />

          <InfoCard
            icon={<CalendarDays size={18} />}
            title="Start Date"
            value={startDate}
          />

          <InfoCard
            icon={<CalendarDays size={18} />}
            title="Expiry Date"
            value={endDate}
          />

          <InfoCard
            icon={<Clock3 size={18} />}
            title="Next Delivery"
            value={nextDelivery}
          />

          <InfoCard
            icon={<Clock3 size={18} />}
            title="Delivery Time"
            value={deliveryTime}
          />

        </div>

        {/* Progress */}

        <div className="mt-8">

          <div className="flex justify-between">

            <span className="font-semibold">

              Subscription Progress

            </span>

            <span className="font-bold text-green-700">

              {remainingDays} Days Left

            </span>

          </div>

          <div className="mt-3 h-4 rounded-full bg-gray-200 overflow-hidden">

            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-700 rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="flex justify-between text-sm text-gray-500 mt-2">

            <span>
              0
            </span>

            <span>
              {totalDays} Days
            </span>

          </div>

        </div>

        {/* Footer */}

        <div className="mt-8 rounded-2xl bg-green-50 p-4 flex gap-3 items-center">

          <CheckCircle2
            className="text-green-600"
            size={30}
          />

          <div>

            <h3 className="font-bold">

              Everything is on schedule

            </h3>

            <p className="text-sm text-gray-600">

              Your next delivery will arrive
              on {nextDelivery} ({deliveryTime})

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ----------------------------- */

function InfoCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">

      <div className="flex items-center gap-2 text-green-700">

        {icon}

        <span className="text-sm">

          {title}

        </span>

      </div>

      <p className="mt-2 font-bold">

        {value}

      </p>

    </div>
  );
}