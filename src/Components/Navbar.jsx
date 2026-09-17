import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Bell,
  Boxes,
  ChartNoAxesColumn,
  ChevronRight,
  CircleUserRound,
  LayoutDashboard,
  Menu,
  Milk,
  Package,
  ShoppingBag,
  Sparkles,
  Users,
  X,
  LogIn,
  CreditCard,
  Truck,
} from "lucide-react";
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
  const role = getCurrentRole();
  const isCustomerLoggedIn = !!customer;
  const customerName = customer?.name || "Customer";

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const updateCart = () => setCartCount(getCartItemCount());
    updateCart();
    window.addEventListener("cartUpdated", updateCart);
    return () => window.removeEventListener("cartUpdated", updateCart);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path, startsWith = false) =>
    startsWith ? location.pathname.startsWith(path) : location.pathname === path;

  const goToSubscription = () => {
    if (!isCustomerLoggedIn) {
      localStorage.setItem("redirectAfterLogin", "/subscription/create/:productId");
      navigate("/auth");
      return;
    }
    navigate("/subscription/create/:productId");
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/auth");
  };

  const customerItems = [
    { to: "/products", label: "Shop", icon: ShoppingBag },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/subscription/create/:productId", label: "Subscription", icon: Milk, action: goToSubscription, activePath: "/subscription" },
    { to: "/order-history", label: "Orders", icon: Package },
  ];

  const adminItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/products", label: "Products", icon: ShoppingBag },
    { to: "/admin/orders", label: "Orders", icon: Package },
    { to: "/admin/customers", label: "Customers", icon: Users },
    { to: "/admin/subscriptions", label: "Subscriptions", icon: Milk },
    { to: "/admin/billing", label: "Billing", icon: CreditCard },
  ];

  const deliveryItems = [
    { to: "/delivery", label: "Dashboard", icon: LayoutDashboard },
    { to: "/delivery", label: "Deliveries", icon: Truck },
    { to: "/delivery/history", label: "History", icon: Boxes },
  ];

  const items = role === "admin" ? adminItems : role === "delivery" ? deliveryItems : customerItems;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[9999]">
        {/* slim animated top ribbon */}
        <div className="relative h-8 overflow-hidden bg-[#031b17] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,.28),transparent_24%),radial-gradient(circle_at_80%_50%,rgba(45,212,191,.2),transparent_24%)]" />
          <div className="relative flex h-full items-center justify-center overflow-hidden whitespace-nowrap px-3 text-[9px] font-black tracking-[.08em] text-white/80 sm:text-[10px]">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)] animate-pulse" />
            FRESH DAIRY
            <span className="mx-2 text-emerald-400">•</span>
            DAILY MORNING DELIVERY
            <span className="mx-2 text-emerald-400">•</span>
            FARM FRESH QUALITY
            <span className="mx-2 text-emerald-400">•</span>
            FREE HOME DELIVERY
          </div>
        </div>

        <div className="border-b border-slate-200/70 bg-white/88 shadow-[0_10px_35px_rgba(15,23,42,.07)] backdrop-blur-2xl">
          <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
            {/* Main row */}
            <div className="flex h-[68px] items-center gap-3 sm:h-[76px]">
              <Link to="/" className="group flex min-w-0 items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-emerald-400/20 blur-md transition group-hover:opacity-100" />
                  <img
                    src={logo}
                    alt="Farm Fresh Dairy"
                    className="relative h-10 w-10 rounded-full border border-emerald-100 bg-white object-contain shadow-sm transition duration-300 group-hover:scale-105 sm:h-12 sm:w-12"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-black tracking-[-.04em] text-slate-900 sm:text-xl">
                    FarmFresh<span className="text-emerald-600">Dairy</span>
                  </div>
                  <div className="hidden text-[9px] font-bold tracking-wide text-slate-400 sm:block">
                    FRESHNESS DELIVERED DAILY
                  </div>
                </div>
              </Link>

              {/* Desktop navigation */}
              <nav className="ml-auto hidden items-center gap-1 lg:flex">
                {items.map(({ to, label, icon: Icon, action, activePath }) => {
                  const active = isActive(activePath || to, !!activePath);
                  const content = (
                    <>
                      <Icon size={15} strokeWidth={2.5} />
                      <span>{label}</span>
                      {label === "Subscription" && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[7px] font-black text-amber-700">
                          POPULAR
                        </span>
                      )}
                    </>
                  );

                  return action ? (
                    <button
                      key={label}
                      onClick={action}
                      className={`relative flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-black transition-all duration-300 ${
                        active
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                          : "text-slate-600 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      key={label}
                      to={to}
                      className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-black transition-all duration-300 ${
                        active
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                          : "text-slate-600 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </nav>

              <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-3">
                {!role && (
                  <button
                    onClick={() => navigate("/auth")}
                    className="hidden rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:inline-flex"
                  >
                    <LogIn size={14} className="mr-1.5" />
                    Login
                  </button>
                )}

                {isCustomerLoggedIn && (
                  <div className="hidden max-w-[150px] truncate rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 xl:block">
                    👋 {customerName}
                  </div>
                )}

                <div className="hidden sm:flex">
                  <NotificationBell onClick={() => setNotificationOpen(true)} />
                </div>

                <button
                  onClick={() => navigate("/cart")}
                  aria-label="Open cart"
                  className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-lg sm:h-11 sm:w-11"
                >
                  <ShoppingBag size={19} strokeWidth={2.3} />
                  {cartCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-md">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Open menu"
                  aria-expanded={menuOpen}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 sm:h-11 sm:w-11 ${
                    menuOpen
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-lg"
                  }`}
                >
                  {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile quick navigation — compact grid, no horizontal clipping */}
            <div className="grid grid-cols-4 gap-1.5 pb-2.5 lg:hidden">
              {items.slice(0, 4).map(({ to, label, icon: Icon, action, activePath }) => {
                const active = isActive(activePath || to, !!activePath);
                return (
                  <button
                    key={label}
                    onClick={action || (() => navigate(to))}
                    className={`flex min-w-0 items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-[9px] font-black transition-all duration-300 ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-100"
                        : "border-slate-200 bg-white text-slate-600 active:scale-95"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2.6} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Expandable menu */}
        <div className={`overflow-hidden transition-all duration-400 ${menuOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="border-b border-slate-200 bg-white/96 shadow-2xl backdrop-blur-2xl">
            <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 lg:px-8">
              <div className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-emerald-600">
                <Sparkles size={13} />
                Quick menu
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {items.map(({ to, label, icon: Icon, action }) => (
                  <button
                    key={label}
                    onClick={action || (() => navigate(to))}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-lg"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm transition group-hover:scale-105">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black text-slate-800">{label}</span>
                      <span className="mt-0.5 block text-[9px] font-semibold text-slate-400">
                        Open {label.toLowerCase()}
                      </span>
                    </span>
                    <ChevronRight size={15} className="ml-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
                  </button>
                ))}
              </div>

              {role && (
                <button
                  onClick={handleLogout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                >
                  <LogIn size={15} className="rotate-180" />
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile app-style bottom navigation */}
      {role === "customer" && (
        <div className="fixed inset-x-3 bottom-3 z-[9998] lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-around rounded-[26px] border border-white/80 bg-white/92 p-2 shadow-[0_18px_50px_rgba(15,23,42,.18)] backdrop-blur-2xl">
            {customerItems.map(({ to, label, icon: Icon, action, activePath }) => {
              const active = isActive(activePath || to, !!activePath);
              return (
                <button
                  key={label}
                  onClick={action || (() => navigate(to))}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[8px] font-black transition-all duration-300 ${
                    active ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-slate-500"
                  }`}
                >
                  <Icon size={17} strokeWidth={2.5} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </>
  );
}
