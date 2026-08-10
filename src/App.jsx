import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import { USER_ROLES } from "./config/appConfig";

/* Customer Pages */
import FarmFreshDairyWebsite from "./Pages/FarmFreshDairyWebsite";
import Products from "./Pages/Products";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import Auth from "./Pages/Auth";
import Subscription from "./Pages/Subscription";
import SubscriptionCheckout from "./Pages/SubscriptionCheckout";
import CustomerDashboard from "./Pages/CustomerDashboard";
import OrderHistory from "./Pages/OrderHistory";
import TrackOrder from "./Pages/TrackOrder";

/* Customer Protected Route */
import CustomerRoute from "./Components/CustomerRoute";
import AdminRoute from "./Components/AdminRoute";
import DeliveryRoute from "./Components/DeliveryRoute";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import ManageSubscription from "./Pages/ManageSubscription";
import AddressBook from "./Pages/AddressBook";
import SubscriptionPlans from "./Pages/SubscriptionPlans";
import CreateSubscription from "./Pages/CreateSubscription";
import ReviewSubscription from "./Pages/ReviewSubscription";
import ExtraMilkRequest from "./Pages/ExtraMilkRequest";
/* Admin */
import AdminLogin from "./Pages/AdminLogin";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminOrders from "./Pages/AdminOrders";
import AdminProducts from "./Pages/AdminProducts";
import AdminCustomers from "./Pages/AdminCustomers";
import AdminSubscriptions from "./Pages/AdminSubscriptions";
import AdminBilling from "./Pages/AdminBilling";
import AdminProtectedRoute from "./Components/AdminProtectedRoute";
import AdminDeliveryBoys from "./Pages/AdminDeliveryBoys";
import AdminCustomerDetails from "./Pages/AdminCustomerDetails";
import AdminSubscriptionDeliveries from "./Pages/AdminSubscriptionDeliveries";
import AdminMonthlyReport from "./Pages/AdminMonthlyReport";
import AdminExtraMilk from "./Pages/AdminExtraMilk";

/* Delivery */
import DeliveryLogin from "./Pages/DeliveryLogin";
import DeliveryDashboard from "./Pages/DeliveryDashboard";
import DeliveryOrders from "./Pages/DeliveryOrders";
import DeliveryProtectedRoute from "./Components/DeliveryProtectedRoute";


/* Notification */
import Notifications from "./Pages/Notifications";
import NotificationSettings from "./Pages/NotificationSettings";

export default function App() {
  const location = useLocation();
  const hideNavbar =  location.pathname.startsWith("/admin");
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 animate-gradient">
    <div className="fixed inset-0 -z-10 overflow-hidden">

      <div className="absolute w-96 h-96 bg-green-300 rounded-full blur-3xl opacity-20 animate-pulse top-10 left-10"></div>

      <div className="absolute w-80 h-80 bg-blue-300 rounded-full blur-3xl opacity-20 animate-pulse bottom-20 right-20"></div>

      <div className="absolute w-72 h-72 bg-yellow-300 rounded-full blur-3xl opacity-20 animate-pulse top-1/2 left-1/2"></div>

    </div>
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? "pt-8" : "pt-[140px]"}>

      <Routes>
        {/* =========================
            PUBLIC ROUTES
        ========================= */}
        <Route path="/" element={<FarmFreshDairyWebsite />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/auth" element={<Auth />} />

        {/* Checkout should be protected */}
        <Route
          path="/checkout"
          element={
            <CustomerRoute>
              <Checkout />
            </CustomerRoute>
          }
        />

        {/* Subscription */}
        <Route path="/subscription" element={<Subscription />} />

        <Route
          path="/subscription-checkout"
          element={
            <CustomerRoute>
              <SubscriptionCheckout />
            </CustomerRoute>
          }
        />
        <Route
            path="/subscription/manage/:id"
            element={
              <CustomerRoute>
                <ManageSubscription />
              </CustomerRoute>
            }
          />

        {/* =========================
            CUSTOMER PROTECTED
        ========================= */}
       <Route
          path="/dashboard"
          element={
            <CustomerRoute>
              <CustomerDashboard />
            </CustomerRoute>
          }
        />

        <Route
          path="/order-history"
          element={
            <CustomerRoute>
              <OrderHistory />
            </CustomerRoute>
          }
        />

        <Route
          path="/track-order"
          element={
            <CustomerRoute>
              <TrackOrder />
            </CustomerRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

        {/* =========================
            ADMIN ROUTES
        ========================= */}
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/customers"
          element={
            <AdminRoute>
              <AdminCustomers />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/subscriptions"
          element={
            <AdminRoute>
              <AdminSubscriptions />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/billing"
          element={
            <AdminRoute>
              <AdminBilling />
            </AdminRoute>
          }
        />

        {/* =========================
            DELIVERY ROUTES
        ========================= */}
        <Route path="/delivery-login" element={<DeliveryLogin />} />

        <Route
            path="/delivery"
            element={
              <DeliveryRoute>
                <DeliveryDashboard />
              </DeliveryRoute>
            }
          />

        <Route
          path="/delivery/orders"
          element={
            <DeliveryRoute>
              <DeliveryOrders />
            </DeliveryRoute>
          }
        />
        <Route
          path="/notifications"
          element={<Notifications />}
        />
        <Route
          path="/notification-settings"
          element={<NotificationSettings />}
        />
        <Route
          path="/address-book"
          element={<AddressBook />}
        />
        <Route
          path="/subscription-plans"
          element={<SubscriptionPlans />}
        />
        <Route
            path="/subscription/create/:productId"
            element={<CreateSubscription />}
        />
        <Route
          path="/subscription/review"
          element={<ReviewSubscription />}
        />
        <Route
          path="/admin/delivery-boys"
          element={<AdminDeliveryBoys />}
        />
        <Route
          path="/admin/customers/:id"
          element={<AdminCustomerDetails />}
        />
        <Route
          path="/admin/subscription-deliveries"
          element={<AdminSubscriptionDeliveries />}
        />
        <Route
          path="/admin/monthly-report"
          element={<AdminMonthlyReport />}
        />
          <Route
          path="/extra-milk"
          element={<ExtraMilkRequest />}
      />
      <Route
      path="/admin/extra-milk"
      element={<AdminExtraMilk />}
    />
      </Routes>
    
      
      </div>
    </div>
  );
}