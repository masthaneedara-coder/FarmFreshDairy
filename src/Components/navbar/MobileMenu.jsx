import { Link } from "react-router-dom";

export default function MobileMenu({
  open,
  onClose,
  deliveryBoy = null,
}) {
  if (!open) return null;

  const isDeliveryBoy = !!deliveryBoy;

  return (
    <div className="lg:hidden border-t border-green-100 bg-white shadow-lg">
      <div className="flex flex-col p-4 gap-3">

        {/* =========================
            CUSTOMER MENU
        ========================== */}
        {!isDeliveryBoy && (
          <>
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
              className="px-4 py-3 rounded-xl hover:bg-green-50 font-semibold"
            >
              🛍 Products
            </Link>

            <Link
              to="/subscription"
              onClick={onClose}
              className="px-4 py-3 rounded-xl hover:bg-green-50 font-semibold"
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
          </>
        )}

        {/* =========================
            DELIVERY BOY MENU
        ========================== */}
        {isDeliveryBoy && (
          <>
            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">
              Delivery
            </div>

            <Link
              to="/delivery"
              onClick={onClose}
              className="px-4 py-3 rounded-xl hover:bg-green-50 font-semibold text-green-700"
            >
              🚚 Delivery Dashboard
            </Link>

            <Link
              to="/delivery/history"
              onClick={onClose}
              className="px-4 py-3 rounded-xl hover:bg-green-50 font-semibold text-green-700"
            >
              📋 Delivery History
            </Link>
          </>
        )}

      </div>
    </div>
  );
}