import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";

import { isAdminLoggedIn, logoutAdmin } from "../config/auth";
import { fetchProducts } from "../config/api";
import AdminNotifications from "../Components/admin/AdminNotifications";
import { playNotification } from "../utils/playNotification";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!isAdminLoggedIn()) {
        navigate("/admin-login");
        return;
      }

      try {
        setLoading(true);
        const data = await fetchProducts();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        setProducts(list);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
    loadNotifications();
  }, [navigate]);
  useEffect(() => {

  const channel = supabase
    .channel("notifications-channel")

    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      },
      (payload) => {

        console.log("Realtime Notification:", payload);

        playNotification();

        loadNotifications();

      }
    )

    .subscribe();

  return () => {

    supabase.removeChannel(channel);

  };

}, []);


  const totalProducts = useMemo(() => products.length, [products]);

  const lowStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const stock = Number(p.stock || 0);
        return stock > 0 && stock < 5;
      }),
    [products]
  );

  const outOfStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const stock = Number(p.stock || 0);
        return stock === 0;
      }),
    [products]
  );

  const totalStockUnits = useMemo(
    () =>
      products.reduce((sum, p) => sum + Number(p.stock || 0), 0),
    [products]
  );

  const totalInventoryValue = useMemo(
    () =>
      products.reduce(
        (sum, p) =>
          sum + Number(p.price || 0) * Number(p.stock || 0),
        0
      ),
    [products]
  );

  const recentLowStock = useMemo(() => lowStockProducts.slice(0, 6), [lowStockProducts]);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/");
  };

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getStockStatus = (stock) => {
    const qty = Number(stock || 0);

    if (qty === 0) {
      return {
        label: "Out Of Stock",
        className: "bg-red-100 text-red-600 border border-red-200",
      };
    }

    if (qty < 5) {
      return {
        label: "Low Stock",
        className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      };
    }

    return {
      label: "In Stock",
      className: "bg-green-100 text-green-700 border border-green-200",
    };
  };
async function loadNotifications() {
  try {
    const res = await fetch(
      "https://farmfreshdairy.onrender.com/api/notifications"
    );

    const data = await res.json();

    if (data.success) {
      setNotifications(data.notifications);
      setNotificationCount(
        data.notifications.filter(n => !n.is_read).length
      );
    }

  } catch (err) {
    console.error(err);
  }
}
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-white/80 text-sm sm:text-base">Farm Fresh Dairy Admin</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mt-1">
                📊 Admin Dashboard
              </h1>
              <p className="mt-2 text-white/90 max-w-2xl">
                Manage products, stock, orders, subscriptions and daily dairy operations from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/admin/products")}
                className="px-5 py-3 rounded-2xl bg-white text-blue-700 font-bold shadow"
              >
                Manage Products
              </button>
              

              <button
                onClick={() => navigate("/products")}
                className="px-5 py-3 rounded-2xl bg-white/15 border border-white/20 text-white font-bold"
              >
                View Store
              </button>

              <button
                onClick={handleLogout}
                className="px-5 py-3 rounded-2xl bg-red-500 text-white font-bold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <AdminNotifications />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-6">
          <StatCard
            title="Total Products"
            value={totalProducts}
            subtitle="All listed products"
            color="blue"
            icon="🥛"
          />
          <StatCard
            title="Low Stock"
            value={lowStockProducts.length}
            subtitle="Need refill soon"
            color="yellow"
            icon="⚠️"
          />
          <StatCard
            title="Out Of Stock"
            value={outOfStockProducts.length}
            subtitle="Unavailable now"
            color="red"
            icon="📦"
          />
          <StatCard
            title="Total Stock Units"
            value={totalStockUnits}
            subtitle="Current inventory"
            color="green"
            icon="📊"
          />
          <StatCard
            title="Inventory Value"
            value={formatMoney(totalInventoryValue)}
            subtitle="Price × stock"
            color="purple"
            icon="💰"
          />
        </div>
        
       

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          <ActionCard
            icon="🥛"
            title="Products"
            desc="Add, edit and manage stock, price and category."
            color="green"
            onClick={() => navigate("/admin/products")}
          />
          <ActionCard
            icon="📦"
            title="Orders"
            desc="Track customer orders, status and payment updates."
            color="blue"
            onClick={() => navigate("/admin/orders")}
          />
          <ActionCard
            icon="👥"
            title="Customers"
            desc="View customer details, order history and subscriptions."
            color="purple"
            onClick={() => navigate("/admin/customers")}
          />
          <ActionCard
            icon="🔁"
            title="Subscriptions"
            desc="Manage active, paused and expired milk subscriptions."
            color="orange"
            onClick={() => navigate("/admin/subscriptions")}
          />
          <ActionCard
            icon="📊"
            title="Monthly Report"
            desc="View delivered, missed, billing and payment reports."
            color="blue"
            onClick={() => navigate("/admin/monthly-report")}
          />
          <ActionCard
               icon="🚚"
              title="Today's Deliveries"
              subtitle="Generate & Manage Subscription Deliveries"
              color="green"             
              onClick={() => navigate("/admin/subscription-deliveries")}
            />
        </div>

        {/* LOW STOCK + PRODUCT TABLE */}
        <div className="grid xl:grid-cols-3 gap-6 mt-6">
          {/* LOW STOCK PANEL */}
          <div className="bg-white rounded-3xl shadow-lg border border-yellow-100 p-5 sm:p-6 xl:col-span-1">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-black text-yellow-700">Low Stock Alert</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Products that need stock refill
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center text-2xl">
                ⚠️
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading alerts...</div>
            ) : recentLowStock.length === 0 ? (
              <div className="rounded-2xl border border-green-100 bg-green-50 p-5 text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="font-black text-green-700 text-lg">All products look good</h3>
                <p className="text-sm text-gray-500 mt-1">
                  No low-stock items right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLowStock.map((product, index) => (
                  <div
                    key={product.id || index}
                    className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h3 className="font-black text-yellow-800 break-words">
                        {product.name || "Unnamed Product"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Price: ₹{product.price || 0}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm text-gray-500">Stock</p>
                      <h4 className="text-2xl font-black text-yellow-700">
                        {Number(product.stock || 0)}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate("/admin/products")}
              className="mt-5 w-full px-5 py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow"
            >
              Open Product Management
            </button>
          </div>

          {/* PRODUCT TABLE */}
          <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-5 sm:p-6 xl:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-black text-blue-700">Products & Stock</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Current product inventory overview
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/admin/products")}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold"
                >
                  Manage Products
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3 animate-pulse">⏳</div>
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">📭</div>
                <h3 className="text-xl font-bold text-gray-700">No products found</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm sm:text-base">
                  <thead>
                    <tr className="text-left border-b border-slate-200">
                      <th className="py-3 px-3 font-black text-gray-700">Product</th>
                      <th className="py-3 px-3 font-black text-gray-700">Category</th>
                      <th className="py-3 px-3 font-black text-gray-700">Price</th>
                      <th className="py-3 px-3 font-black text-gray-700">Stock</th>
                      <th className="py-3 px-3 font-black text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => {
                      const stock = Number(product.stock || 0);
                      const status = getStockStatus(stock);

                      return (
                        <tr
                          key={product.id || index}
                          className="border-b border-slate-100 hover:bg-slate-50 transition"
                        >
                          <td className="py-3 px-3">
                            <div>
                              <p className="font-semibold text-gray-800 break-words">
                                {product.name || "-"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                ID: {product.id || "-"}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-700">
                            {product.category || "-"}
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-800">
                            ₹{Number(product.price || 0)}
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-800">
                            {stock}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-3 py-1 rounded-full font-bold text-xs sm:text-sm ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTION STRIP */}
        <div className="mt-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Next Admin Modules</h2>
              <p className="text-white/70 mt-1">
                Orders, Customers, Subscriptions and Billing can now be connected to the same dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/admin/orders")}
                className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold"
              >
                Orders
              </button>
              <button
                onClick={() => navigate("/admin/customers")}
                className="px-5 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-bold"
              >
                Customers
              </button>
              <button
                onClick={() => navigate("/admin/subscriptions")}
                className="px-5 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-bold"
              >
                Subscriptions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, color = "blue", icon = "📊" }) {
  const styles = {
    blue: "border-blue-100 text-blue-700 bg-white",
    yellow: "border-yellow-100 text-yellow-700 bg-white",
    red: "border-red-100 text-red-700 bg-white",
    green: "border-green-100 text-green-700 bg-white",
    purple: "border-purple-100 text-purple-700 bg-white",
  };

  return (
    <div
      className={`rounded-3xl p-5 shadow-lg border ${styles[color] || styles.blue}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-3xl font-black mt-2 break-words">{value}</h3>
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        </div>

        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, color = "blue", onClick }) {
  const styles = {
    blue: "border-blue-100 text-blue-700",
    green: "border-green-100 text-green-700",
    purple: "border-purple-100 text-purple-700",
    orange: "border-orange-100 text-orange-600",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-3xl p-6 shadow-lg border text-left hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${styles[color] || styles.blue}`}
    >
      <div className="text-4xl">{icon}</div>
      <h2 className="text-xl font-black mt-3">{title}</h2>
      <p className="text-gray-500 mt-2 text-sm">{desc}</p>
    </button>
  );
}