import { Link } from "react-router-dom";

export default function MobileMenu({
  open,
  onClose,
}) {
  if (!open) return null;

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

      </div>

    </div>
  );
}