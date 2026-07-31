import {
  CheckCircle,
  Clock,
  Truck,
  Package
} from "lucide-react";

export default function SubscriptionTimeline({
  subscription,
}) {

  if (!subscription) return null;

  const steps = [
    {
      title: "Subscription Created",
      completed: true,
      icon: Package,
    },
    {
      title: "Subscription Active",
      completed: subscription.status !== "pending",
      icon: CheckCircle,
    },
    {
      title: "Today's Delivery",
      completed:
        subscription.today_delivery === true,
      icon: Truck,
    },
    {
      title: "Completed",
      completed:
        subscription.status === "completed",
      icon: Clock,
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">

      <h2 className="text-2xl font-bold mb-6">
        Subscription Timeline
      </h2>

      <div className="space-y-5">

        {steps.map((step, index) => {

          const Icon = step.icon;

          return (

            <div
              key={index}
              className="flex items-center gap-4"
            >

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center
                ${
                  step.completed
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                <Icon size={22}/>
              </div>

              <div>

                <h3 className="font-semibold">
                  {step.title}
                </h3>

                <p className="text-sm text-gray-500">

                  {step.completed
                    ? "Completed"
                    : "Waiting"}

                </p>

              </div>

            </div>

          );

        })}

      </div>

    </div>
  );
}