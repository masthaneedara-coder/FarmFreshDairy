import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import NotificationBell from "./NotificationBell";
import NotificationDrawer from "./NotificationDrawer";
import {
  getCart,
  getCartItemCount,
} from "../config/cart";
import { getCurrentRole,} from "../config/auth";
import { useAuthSession } from "../context/AuthSessionContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
const { customer, logout } = useAuthSession();
const isCustomerLoggedIn = !!customer;
const customerName =  customer?.name || "Customer";
const role = getCurrentRole();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
 
 const [cartCount, setCartCount] = useState(0);

useEffect(() => {
  const updateCart = () => {
    setCartCount(getCartItemCount());
  };

  updateCart();

  window.addEventListener("cartUpdated", updateCart);

  return () => {
    window.removeEventListener("cartUpdated", updateCart);
  };
}, []);


  const [notificationOpen, setNotificationOpen] = useState(false);

 

  const handleLogout = async () => {
  await logout();
  navigate("/auth");
};

  const goToSubscription = () => {
    if (!isCustomerLoggedIn) {
      localStorage.setItem("redirectAfterLogin", "/subscription/create/:productId");
      window.dispatchEvent(new Event("cartUpdated"));
      navigate("/auth");
      return;
    }
    navigate("/subscription/create/:productId");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-xl border-b border-green-100 shadow-md transition-all duration-300">
      {/* TOP BAR */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 shadow-lg border-b border-green-400/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_35%)]"></div>

        <div className="relative">
          <div className="animate-marquee-premium whitespace-nowrap py-3 sm:py-3.5 text-white font-extrabold tracking-wide text-sm sm:text-base md:text-lg">
            ✨ Fresh Farm Milk Delivered Every Morning • 🥛 Pure Cow Milk • 🐃 Fresh Buffalo Milk • 🥣 Fresh Curd Available • 🚚 Free Home Delivery • 📞 Subscribe Today • 🌿 100% Natural & Healthy •
          </div>
        </div>
      </div>

      {/* NAV */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-green-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="min-h-[76px] sm:h-20 flex items-center justify-between gap-3 py-3 sm:py-0">
            {/* LEFT */}
            <Link to="/" className="flex items-center gap-3 min-w-0 group">
              <div className="relative flex-shrink-0">
                <img
                  src={logo}
                  alt="Farm Fresh Dairy"
                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-green-100 shadow-md group-hover:scale-105 transition duration-300"
                />
                <span className="absolute inset-0 rounded-full bg-green-400/10 animate-ping"></span>
              </div>

              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-black text-green-700 truncate leading-tight">
                  FarmFreshDairy
                </h1>
                <p className="text-[10px] sm:text-sm text-gray-500 truncate">
                  Pure Milk Delivered Daily
                </p>
              </div>
            </Link>
             <div className="hidden lg:flex items-center gap-2">
             {role === "customer" && (
                <>
                  {/* Products */}
                  <Link
                    to="/products"
                    className={`px-5 py-3 rounded-2xl font-semibold transition-all ${
                      location.pathname === "/products"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    🛍️ Products
                  </Link>
                  {/* Dashbord */}
                    <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className={`px-4 py-4 rounded-2xl font-bold transition ${
                          location.pathname === "/dashboard"
                            ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        📊 Dashboard
                      </Link>

                  {/* Subscription */}
                  <button
                    onClick={goToSubscription}
                    className={`px-5 py-3 rounded-2xl font-semibold transition-all ${
                      location.pathname.startsWith("/subscription")
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                    }`}
                  >
                    🥛 Subscription
                  </button>

                  {/* Orders */}
                  <Link
                    to="/order-history"
                    className={`px-5 py-3 rounded-2xl font-semibold transition-all ${
                      location.pathname === "/order-history"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    📦 Orders
                  </Link>
                </>
              )}
                {role === "admin" && (
                    <>
                      <Link to="/admin">
                        Dashboard
                      </Link>

                      <Link to="/admin/products">
                        Products
                      </Link>

                      <Link to="/admin/orders">
                        Orders
                      </Link>

                      <Link to="/admin/customers">
                        Customers
                      </Link>
                    </>
                  )}
                  {role === "delivery" && (
  <>
    <Link
      to="/delivery"
      className={`px-4 py-3 rounded-2xl font-semibold transition-all ${
        location.pathname === "/delivery"
          ? "bg-green-600 text-white shadow-md"
          : "bg-green-50 text-green-700 hover:bg-green-100"
      }`}
    >
      📊 Dashboard
    </Link>

    <Link
      to="/delivery"
      className={`px-4 py-3 rounded-2xl font-semibold transition-all ${
        location.pathname === "/delivery"
          ? "bg-blue-600 text-white shadow-md"
          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
      }`}
    >
      🚚 Deliveries
    </Link>

    <Link
      to="/delivery/history"
      className={`px-4 py-3 rounded-2xl font-semibold transition-all ${
        location.pathname === "/delivery/history"
          ? "bg-purple-600 text-white shadow-md"
          : "bg-purple-50 text-purple-700 hover:bg-purple-100"
      }`}
    >
      📋 History
    </Link>
  </>
)}

              </div>
            {/* RIGHT */}
            <NotificationBell
                onClick={() => {
                  // Drawer will be connected in Part 5
                  console.log("Open Notification Drawer");
                }}
              />
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {!role && (
                <button
                  onClick={() => navigate("/auth")}
                  className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  🔐 Login
                </button>
              )}

              {isCustomerLoggedIn && (
                <div className="hidden lg:flex bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm">
                  👋 {dashboard?.customer?.full_name || customer?.name}
                </div>
              )}

              <button
                onClick={() => navigate("/cart")}
                className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border border-green-100 bg-white shadow-md hover:shadow-lg flex items-center justify-center text-lg sm:text-xl hover:scale-105 transition duration-300"
              >
                🛒
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border border-green-100 bg-white shadow-md hover:shadow-lg flex items-center justify-center text-xl sm:text-2xl text-green-700 hover:scale-105 transition duration-300"
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {!role && (
            <div className="sm:hidden pb-3">
              <button
                onClick={() => navigate("/auth")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white py-3 rounded-2xl font-bold shadow-md transition duration-300"
              >
                🔐 Login / Signup
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DROPDOWN */}
      {/* DROPDOWN */}
<div
  className={`overflow-hidden transition-all duration-300 ${
    menuOpen
      ? "max-h-[1000px] opacity-100"
      : "max-h-0 opacity-0"
  }`}
>
  <div className="border-t border-gray-100 bg-white/95 backdrop-blur-xl shadow-lg">
    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">

      {/* ========================================= */}
      {/* DELIVERY BOY MENU */}
      {/* ========================================= */}

      {role === "delivery" && (
        <>
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 p-4 text-white shadow-md">
            <p className="text-sm opacity-90">
              🚚 Delivery Panel
            </p>

            <h2 className="text-xl font-black">
              Welcome Delivery Boy
            </h2>
          </div>

          <Link
            to="/delivery"
            onClick={() => setMenuOpen(false)}
            className={`px-4 py-4 rounded-2xl font-bold transition ${
              location.pathname === "/delivery"
                ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            📊 Dashboard
          </Link>

          <Link
            to="/delivery"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-4 rounded-2xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition"
          >
            📦 Today's Deliveries
          </Link>

          <Link
            to="/delivery/history"
            onClick={() => setMenuOpen(false)}
            className={`px-4 py-4 rounded-2xl font-bold transition ${
              location.pathname === "/delivery/history"
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            📋 Delivery History
          </Link>

          <button
            type="button"
            onClick={async () => {
              setMenuOpen(false);
              await logout();
              navigate("/delivery/login");
            }}
            className="w-full text-left px-4 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition"
          >
            🚪 Logout
          </button>
        </>
      )}

      {/* ========================================= */}
      {/* ADMIN MENU */}
      {/* ========================================= */}

      {role === "admin" && (
        <>
          <Link
            to="/admin"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-4 rounded-2xl bg-green-50 text-green-700 font-bold"
          >
            📊 Dashboard
          </Link>

          <Link
            to="/admin/products"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-4 rounded-2xl bg-blue-50 text-blue-700 font-bold"
          >
            🛍 Products
          </Link>

          <Link
            to="/admin/orders"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-4 rounded-2xl bg-purple-50 text-purple-700 font-bold"
          >
            📦 Orders
          </Link>

          <Link
            to="/admin/customers"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-4 rounded-2xl bg-orange-50 text-orange-700 font-bold"
          >
            👥 Customers
          </Link>
        </>
      )}

     {/* ========================================= */}
      {/* CUSTOMER MENU */}
      {/* ========================================= */}

      {role === "customer" && (
        <>
          {/* Customer Header */}
          <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 p-4 text-white shadow-md">
            <p className="text-sm opacity-90">
              👋 Welcome back
            </p>

            <h2 className="text-xl font-black">
              {dashboard?.customer?.full_name || customer?.name}
            </h2>
          </div>

          {/* Products */}
          <Link
            to="/products"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-lg transition ${
              location.pathname === "/products"
                ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-md"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            <span>🛍️ Products</span>

            <span>→</span>
          </Link>
          {/* Dashbord */}
         <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className={`px-4 py-4 rounded-2xl font-bold transition ${
              location.pathname === "/dashboard"
                ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            📊 Dashboard
          </Link>

          {/* Subscription */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              goToSubscription();
            }}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-lg text-left transition ${
              location.pathname.startsWith("/subscription")
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            <span>🥛 Subscription</span>

            <span className="text-xs px-3 py-1 rounded-full bg-white text-purple-700 font-extrabold">
              POPULAR
            </span>
          </button>

          {/* Orders */}
          <Link
            to="/order-history"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-lg transition ${
              location.pathname === "/order-history"
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <span>📦 Orders</span>

            <span>→</span>
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-5 py-4 rounded-2xl bg-red-50 text-red-600 font-bold text-lg hover:bg-red-100 transition"
          >
            🚪 Logout
          </button>
        </>
      )}

      {/* ========================================= */}
      {/* NO ROLE */}
      {/* ========================================= */}

      {!role && (
        <>
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-4 rounded-2xl bg-green-50 text-green-700 font-bold"
          >
            🏠 Home
          </Link>

          <Link
            to="/products"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-4 rounded-2xl bg-blue-50 text-blue-700 font-bold"
          >
            🛍 Products
          </Link>

          <button
            onClick={goToSubscription}
            className="w-full text-left px-4 py-4 rounded-2xl bg-purple-50 text-purple-700 font-bold"
          >
            🥛 Subscription

            <span className="float-right text-xs px-3 py-1 rounded-full bg-white text-purple-700 font-extrabold">
              POPULAR
            </span>
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              navigate("/auth");
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold"
          >
            🔐 Login / Signup
          </button>
        </>
      )}

    </div>
  </div>
</div>
      <NotificationDrawer
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </header>
  );
}