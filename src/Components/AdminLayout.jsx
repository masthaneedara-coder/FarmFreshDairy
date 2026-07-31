import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function AdminLayout({ title = "Admin Panel", children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: "📊",
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: "📦",
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: "🥛",
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: "👥",
    },
    {
      name: "Subscriptions",
      path: "/admin/subscriptions",
      icon: "🔁",
    },
    {
      name: "Billing",
      path: "/admin/billing",
      icon: "💰",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminLogin");
    localStorage.removeItem("adminName");
    localStorage.removeItem("userRole");
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          {/* Sidebar */}
          <aside className="bg-white rounded-3xl shadow-lg p-4 sm:p-5 h-fit lg:sticky lg:top-24">
            <div className="text-center pb-5 border-b">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center text-3xl shadow-lg">
                <img
                                  src={logo}
                                  alt="Farm Fresh Dairy"
                                  className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-green-100 shadow-md group-hover:scale-105 transition duration-300"
                                />
              </div>

              <h2 className="mt-3 text-xl font-black text-green-700">
                Farm Fresh Admin
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Manage orders, products & customers
              </p>
            </div>

            <div className="mt-5 space-y-2">
              {menu.map((item) => {
                const active = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition ${
                      active
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-slate-50 text-slate-700 hover:bg-green-50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-5 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold shadow"
            >
              Logout
            </button>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 md:p-8">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-green-700">
                  {title}
                </h1>
              </div>

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}