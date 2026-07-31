import { Link, useLocation } from "react-router-dom";

export default function MobileBottomNav() {
  const location = useLocation();

  const isCustomerLoggedIn =
    localStorage.getItem("customerLogin") === "true";
  const userRole = localStorage.getItem("userRole");

  if (!isCustomerLoggedIn || userRole !== "customer") {
    return null;
  }

  const items = [
    { label: "Home", icon: "🏠", path: "/dashboard" },
    { label: "Products", icon: "🛒", path: "/products" },
    { label: "Subscribe", icon: "🥛", path: "/subscription" },
    { label: "Orders", icon: "📦", path: "/order-history" },
    { label: "Track", icon: "🚚", path: "/track-order" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2.5 px-1 transition ${
                active
                  ? "text-green-700 bg-green-50"
                  : "text-gray-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[11px] font-semibold mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}