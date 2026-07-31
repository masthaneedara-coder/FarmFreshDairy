import { Link } from "react-router-dom";

export default function DesktopMenu() {
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