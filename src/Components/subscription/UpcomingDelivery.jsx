import {
  Truck,
  CalendarDays,
  Clock3,
  MapPin,
  User,
  Phone,
  CheckCircle2,
} from "lucide-react";
const DEFAULT_DELIVERY = {
  date: "",
  time: "",
  status: "No Upcoming Delivery",
  address: "",
  driver: "",
  phone: "",
  products: [],
};

export default function UpcomingDelivery({ delivery }) {
 const currentDelivery = {
  ...DEFAULT_DELIVERY,
  ...(delivery || {}),
};

currentDelivery.products =
  delivery?.products ||
  delivery?.items ||
  [];
  console.log("UpcomingDelivery rendered");
console.log("delivery:", delivery);

  if (!delivery) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-green-100 p-8 text-center">
        <div className="text-5xl mb-4">🚚</div>

        <h2 className="text-2xl font-bold text-gray-700">
          No Upcoming Delivery
        </h2>

        <p className="text-gray-500 mt-2">
          You don't have any upcoming deliveries.
        </p>
      </div>
    );
  }

  
  return (
    
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6">

        <div className="flex items-center gap-3">

          <Truck size={30} />

          <div>

            <h2 className="text-2xl font-bold">
              Upcoming Delivery
            </h2>

            <p className="opacity-90">
              Your next doorstep delivery
            </p>

          </div>

        </div>

      </div>

      <div className="p-6">

        {/* Status */}

        <div className="flex justify-between items-center mb-6">

          <div>

            <h3 className="text-lg font-bold">
              Delivery Status
            </h3>

            <p className="text-gray-500">
              Everything is on schedule
            </p>

          </div>

          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
            {delivery?.status}
          </span>

        </div>

        {/* Timeline */}

        <div className="space-y-4">

          <InfoRow
            icon={<CalendarDays size={18} />}
            title="Delivery Date"
            value={delivery?.date}
          />

          <InfoRow
            icon={<Clock3 size={18} />}
            title="Delivery Time"
            value={currentDelivery.time}
          />

          <InfoRow
            icon={<MapPin size={18} />}
            title="Address"
            value={currentDelivery.address}
          />
          <InfoRow
            icon={<User size={18} />}
            title="Delivery Partner"
           value={currentDelivery.driver}
          />

          <InfoRow
            icon={<Phone size={18} />}
            title="Contact"
            value={currentDelivery.phone}
          />

        </div>

        {/* Products */}

        <div className="mt-8">

          <h3 className="font-bold text-lg mb-4">
            Products
          </h3>

          <div className="space-y-3">


           {Array.isArray(currentDelivery.products) &&
             currentDelivery.products.map((item, index) => (           

              <div
                key={index}
                className="flex justify-between items-center bg-gray-50 rounded-xl p-4"
              >

                <div>

                  <h4 className="font-semibold">
                    {item.name}
                  </h4>

                </div>

                <span className="font-bold text-green-700">
                  {item.qty}
                </span>

              </div>
              

            ))}
            

          </div>

        </div>

        {/* Delivery Progress */}

        <div className="mt-8">

          <h3 className="font-bold text-lg mb-4">
            Delivery Timeline
          </h3>

          <div className="space-y-5">

            <Step
              active
              title="Subscription Confirmed"
            />

            <Step
              active
              title="Order Scheduled"
            />

            <Step
              title="Out For Delivery"
            />

            <Step
              title="Delivered"
            />

          </div>

        </div>

        {/* Footer */}

        <div className="mt-8 bg-green-50 rounded-2xl p-5 flex items-center gap-4">

          <CheckCircle2
            className="text-green-700"
            size={32}
          />

          <div>

            <h3 className="font-bold">
              Delivery Reminder
            </h3>

            <p className="text-sm text-gray-600">
              Your products will arrive tomorrow morning.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

/* -------------------------------- */

function InfoRow({
  icon,
  title,
  value,
}) {
  return (
    <div className="flex gap-3">

      <div className="text-green-700 mt-1">
        {icon}
      </div>

      <div>

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h4 className="font-semibold">
          {value}
        </h4>

      </div>

    </div>
  );
}

/* -------------------------------- */

function Step({
  title,
  active,
}) {
  return (
    <div className="flex gap-4">

      <div
        className={`w-5 h-5 rounded-full mt-1 ${
          active
            ? "bg-green-600"
            : "bg-gray-300"
        }`}
      />

      <div>

        <h4 className="font-semibold">
          {title}
        </h4>

      </div>

    </div>
  );
}