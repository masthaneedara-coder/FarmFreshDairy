import { Link, useNavigate } from "react-router-dom";

export default function MobileMenu({
  open,
  onClose,
}) {
  const navigate = useNavigate();

  if (!open) return null;

  const customer = JSON.parse(
    localStorage.getItem("customer") || "null"
  );

  const deliveryBoy = JSON.parse(
    localStorage.getItem("deliveryBoy") || "null"
  );

  const isDeliveryBoy = !!deliveryBoy?.id;

  const handleLogout = () => {
    if (isDeliveryBoy) {
      localStorage.removeItem("deliveryBoy");
      onClose();
      navigate("/delivery/login");
      return;
    }

    localStorage.removeItem("customer");
    onClose();
    navigate("/login");
  };

  // ==========================================
  // DELIVERY BOY MOBILE MENU
  // ==========================================
  if (isDeliveryBoy) {
    return (
      <div className="lg:hidden border-t border-green-100 bg-white shadow-xl">

        <div className="p-4 space-y-3">

          {/* Delivery Header */}
          <div className="px-4 py-3 mb-2 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
            <p className="text-sm opacity-90">
              🚚 Delivery Panel
            </p>

            <p className="text-lg font-bold">
              Welcome {deliveryBoy.full_name}
            </p>
          </div>

          {/* Dashboard */}
          <Link
            to="/delivery"
            onClick={onClose}
            className="block px-4 py-4 rounded-xl bg-green-50 text-green-700 font-semibold"
          >
            📊 Dashboard
          </Link>

          {/* Today's Deliveries */}
          <Link
            to="/delivery"
            onClick={onClose}
            className="block px-4 py-4 rounded-xl bg-blue-50 text-blue-700 font-semibold"
          >
            📦 Today's Deliveries
          </Link>

          {/* Delivery History */}
          <Link
            to="/delivery/history"
            onClick={onClose}
            className="block px-4 py-4 rounded-xl bg-purple-50 text-purple-700 font-semibold"
          >
            📋 Delivery History
          </Link>

          {/* Profile */}
          <Link
            to="/delivery/profile"
            onClick={onClose}
            className="block px-4 py-4 rounded-xl bg-gray-50 text-gray-700 font-semibold"
          >
            👤 My Profile
          </Link>

          {/* Divider */}
          <div className="border-t border-gray-200 my-3" />

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold"
          >
            🚪 Logout
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // CUSTOMER MOBILE MENU
  // ==========================================
  return (
    <div className="lg:hidden border-t border-green-100 bg-white shadow-lg">

      <div className="flex flex-col p-4 gap-3">

        <Link
          to="/"
          onClick={onClose}
          className="px-4 py-3 rounded-xl hover:bg-green-50 font-semibold"
        >
          🏠 Home
        </Link>

        <Link
          to="/products"
          onClick={onClose}
          className="px-4 py-3 rounded-xl hover:bg-blue-50 font-semibold"
        >
          🛍 Products
        </Link>

        <Link
          to="/subscription"
          onClick={onClose}
          className="px-4 py-3 rounded-xl hover:bg-purple-50 font-semibold"
        >
          🥛 Subscription
        </Link>

        <Link
          to="/order-history"
          onClick={onClose}
          className="px-4 py-3 rounded-xl hover:bg-green-50 font-semibold"
        >
          📦 Orders
        </Link>

      </div>

    </div>
  );
}