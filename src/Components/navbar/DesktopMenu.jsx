import { Link } from "react-router-dom";

export default function DesktopMenu() {
  const deliveryBoy = JSON.parse(
    localStorage.getItem("deliveryBoy") || "null"
  );

  const isDeliveryBoy = !!deliveryBoy?.id;

  // ==========================================
  // DELIVERY BOY DESKTOP MENU
  // ==========================================
  if (isDeliveryBoy) {
    return (
      <div className="hidden lg:flex items-center gap-2">

        <Link
          to="/delivery"
          className="px-4 py-2 rounded-xl hover:bg-green-50 text-green-700 font-semibold"
        >
          📊 Dashboard
        </Link>

        <Link
          to="/delivery"
          className="px-4 py-2 rounded-xl hover:bg-blue-50 text-blue-700 font-semibold"
        >
          📦 Today's Deliveries
        </Link>

        <Link
          to="/delivery/history"
          className="px-4 py-2 rounded-xl hover:bg-purple-50 text-purple-700 font-semibold"
        >
          📋 History
        </Link>

        <Link
          to="/delivery/profile"
          className="px-4 py-2 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold"
        >
          👤 Profile
        </Link>

      </div>
    );
  }

  // ==========================================
  // CUSTOMER DESKTOP MENU
  // ==========================================
  return (
    <div className="hidden lg:flex items-center gap-3">

      <Link
        to="/"
        className="px-4 py-2 rounded-xl hover:bg-green-50 font-semibold"
      >
        Home
      </Link>

      <Link
        to="/products"
        className="px-4 py-2 rounded-xl hover:bg-green-50 font-semibold"
      >
        Products
      </Link>

      <Link
        to="/subscription"
        className="px-4 py-2 rounded-xl hover:bg-green-50 font-semibold"
      >
        Subscription
      </Link>

      <Link
        to="/order-history"
        className="px-4 py-2 rounded-xl hover:bg-green-50 font-semibold"
      >
        Orders
      </Link>

    </div>
  );
}