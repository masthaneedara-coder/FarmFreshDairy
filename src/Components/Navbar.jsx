import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import NotificationBell from "./NotificationBell";
import NotificationDrawer from "./NotificationDrawer";
import { getCartItemCount } from "../config/cart";
import { getCurrentRole } from "../config/auth";
import { useAuthSession } from "../context/AuthSessionContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { customer, logout } = useAuthSession();

  const isCustomerLoggedIn = !!customer;
  const customerName = customer?.name || "Customer";
  const role = getCurrentRole();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const updateCart = () => setCartCount(getCartItemCount());

    updateCart();
    window.addEventListener("cartUpdated", updateCart);

    return () => {
      window.removeEventListener("cartUpdated", updateCart);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);

    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Replace the current history entry so the user cannot return
    // to the protected dashboard with the browser Back button.
    navigate("/auth", { replace: true });
  };

  const goToSubscription = () => {
    if (!isCustomerLoggedIn) {
      localStorage.setItem(
        "redirectAfterLogin",
        "/subscription/create/:productId"
      );
      setMenuOpen(false);
      navigate("/auth");
      return;
    }

    setMenuOpen(false);
    navigate("/subscription/create/:productId");
  };

  const isActive = (path, startsWith = false) =>
    startsWith
      ? location.pathname.startsWith(path)
      : location.pathname === path;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[9999]">
        {/* Premium announcement bar */}
        <div className="relative overflow-hidden bg-slate-950 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(16,185,129,.25),transparent_28%),radial-gradient(circle_at_85%_50%,rgba(45,212,191,.18),transparent_28%)]" />

          <div className="relative mx-auto flex h-9 max-w-7xl items-center justify-center overflow-hidden px-4">
            <div className="whitespace-nowrap text-[10px] font-bold tracking-wide text-white/85 sm:text-xs">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
              Fresh dairy • Daily morning delivery • Farm fresh quality
              <span className="mx-2 text-emerald-400">•</span>
              Free home delivery
              <span className="mx-2 text-emerald-400">•</span>
              Subscribe today
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <div className="border-b border-slate-200/80 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,.07)] backdrop-blur-2xl">
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 lg:px-8">
            <div className="flex min-h-[64px] items-center justify-between gap-2 sm:min-h-[72px]">
              {/* Brand */}
              <Link
                to="/"
                className="group flex min-w-0 items-center gap-2.5"
              >
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-emerald-400/15 opacity-0 blur-md transition duration-500 group-hover:opacity-100" />
                  <img
                    src={logo}
                    alt="Farm Fresh Dairy"
                    className="relative h-9 w-9 rounded-full border border-emerald-100 bg-white object-contain shadow-sm transition duration-300 group-hover:scale-105 sm:h-12 sm:w-12"
                  />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-[15px] font-black tracking-tight text-slate-900 sm:text-xl">
                    FarmFresh<span className="text-emerald-600">Dairy</span>
                  </div>
                  <div className="hidden text-[10px] font-semibold text-slate-400 sm:block">
                    Freshness delivered daily
                  </div>
                </div>
              </Link>

              {/* Desktop customer navigation */}
              {role === "customer" && (
                <nav className="hidden items-center gap-1.5 lg:flex">
                  <NavItem
                    to="/products"
                    icon="🛍️"
                    label="Shop"
                    active={isActive("/products")}
                  />

                  <NavItem
                    to="/dashboard"
                    icon="📊"
                    label="Dashboard"
                    active={isActive("/dashboard")}
                  />

                  <button
                    onClick={goToSubscription}
                    className={`group relative flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-black transition-all duration-300 ${
                      isActive("/subscription", true)
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <span>🥛</span>
                    Subscription
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-black text-amber-700">
                      POPULAR
                    </span>
                  </button>

                  <NavItem
                    to="/order-history"
                    icon="📦"
                    label="Orders"
                    active={isActive("/order-history")}
                  />
                </nav>
              )}

              {/* Desktop admin navigation */}
              {role === "admin" && (
                <nav className="hidden items-center gap-1.5 lg:flex">
                  <NavItem to="/admin" icon="📊" label="Dashboard" active={isActive("/admin")} />
                  <NavItem to="/admin/products" icon="🛍️" label="Products" active={isActive("/admin/products")} />
                  <NavItem to="/admin/orders" icon="📦" label="Orders" active={isActive("/admin/orders")} />
                  <NavItem to="/admin/customers" icon="👥" label="Customers" active={isActive("/admin/customers")} />
                  <NavItem to="/admin/subscriptions" icon="🔄" label="Subscriptions" active={isActive("/admin/subscriptions")} />
                  <NavItem to="/admin/billing" icon="💰" label="Billing" active={isActive("/admin/billing")} />
                </nav>
              )}

              {/* Desktop delivery navigation */}
              {role === "delivery" && (
                <nav className="hidden items-center gap-1.5 lg:flex">
                  <NavItem to="/delivery" icon="📊" label="Dashboard" active={isActive("/delivery")} />
                  <NavItem to="/delivery" icon="🚚" label="Deliveries" active={isActive("/delivery")} />
                  <NavItem to="/delivery/history" icon="📋" label="History" active={isActive("/delivery/history")} />
                </nav>
              )}

              {/* Right controls */}
              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                {!role && (
                  <button
                    onClick={() => navigate("/auth")}
                    className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-2.5 py-2.5 text-[10px] font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:px-4 sm:text-xs"
                  >
                    Login
                  </button>
                )}

                {isCustomerLoggedIn && (
                  <div className="hidden max-w-[150px] truncate rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 xl:block">
                    👋 {customerName}
                  </div>
                )}

                {/* Notifications - visible on mobile and desktop */}
                <div
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center sm:h-11 sm:w-11"
                  aria-label="Notifications"
                >
                  <NotificationBell
                    onClick={() => setNotificationOpen(true)}
                  />
                </div>

                <button
                  onClick={() => navigate("/cart")}
                  className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:h-11 sm:w-11"
                  aria-label="Cart"
                >
                  🛒
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-md">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-lg shadow-sm transition-all sm:h-11 sm:w-11 ${
                    menuOpen
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-lg"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md"
                  }`}
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? "✕" : "☰"}
                </button>
              </div>
            </div>

           
          </div>
        </div>

        {/* Modern expandable menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-[620px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-b border-slate-200 bg-white/95 shadow-2xl backdrop-blur-2xl">
            <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 lg:px-8">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {role === "customer" && (
                  <>
                    <MenuCard icon="🛍️" title="Shop Products" subtitle="Fresh dairy & groceries" onClick={() => navigate("/products")} />
                    <MenuCard icon="🥛" title="Subscriptions" subtitle="Manage daily milk" onClick={goToSubscription} />
                    <MenuCard icon="📦" title="Order History" subtitle="Track your orders" onClick={() => navigate("/order-history")} />
                    <MenuCard icon="📊" title="My Dashboard" subtitle="Account overview" onClick={() => navigate("/dashboard")} />
                  </>
                )}

                {role === "admin" && (
                  <>
                    <MenuCard icon="📊" title="Admin Dashboard" subtitle="Business overview" onClick={() => navigate("/admin")} />
                    <MenuCard icon="🛍️" title="Products" subtitle="Stock & pricing" onClick={() => navigate("/admin/products")} />
                    <MenuCard icon="📦" title="Orders" subtitle="Manage customer orders" onClick={() => navigate("/admin/orders")} />
                    <MenuCard icon="👥" title="Customers" subtitle="Customer management" onClick={() => navigate("/admin/customers")} />
                    <MenuCard icon="🔄" title="Subscriptions" subtitle="Manage milk plans" onClick={() => navigate("/admin/subscriptions")} />
                    <MenuCard icon="💰" title="Billing" subtitle="Invoices & payments" onClick={() => navigate("/admin/billing")} />
                  </>
                )}

                {role === "delivery" && (
                  <>
                    <MenuCard icon="📊" title="Dashboard" subtitle="Delivery overview" onClick={() => navigate("/delivery")} />
                    <MenuCard icon="🚚" title="Today's Deliveries" subtitle="Assigned deliveries" onClick={() => navigate("/delivery")} />
                    <MenuCard icon="📋" title="Delivery History" subtitle="Completed deliveries" onClick={() => navigate("/delivery/history")} />
                    <MenuCard icon="🔒" title="Account" subtitle="Delivery account" onClick={() => navigate("/delivery")} />
                  </>
                )}

                {!role && (
                  <>
                    <MenuCard icon="🏠" title="Home" subtitle="Farm Fresh Dairy" onClick={() => navigate("/")} />
                    <MenuCard icon="🛍️" title="Shop Products" subtitle="Browse fresh products" onClick={() => navigate("/products")} />
                    <MenuCard icon="🥛" title="Subscription" subtitle="Daily milk delivery" onClick={goToSubscription} />
                    <MenuCard icon="🔐" title="Login / Signup" subtitle="Access your account" onClick={() => navigate("/auth")} />
                  </>
                )}
              </div>

              {(role === "customer" || role === "admin" || role === "delivery") && (
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
                >
                  🚪 Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <NotificationDrawer
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-black transition-all duration-300 ${
        active
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
          : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function MobileChip({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[11px] font-black transition active:scale-[0.97] ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function MenuCard({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-lg"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm transition group-hover:scale-105">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-800">
          {title}
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
          {subtitle}
        </span>
      </span>
      <span className="ml-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600">
        →
      </span>
    </button>
  );
}
