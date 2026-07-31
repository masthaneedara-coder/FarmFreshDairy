import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCustomerById } from "../services/adminCustomerService";
import AdminLayout from "../Components/AdminLayout";

export default function AdminCustomerDetails() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    loadCustomer();
  }, [id]);

  async function loadCustomer() {
    try {
      const data = await getCustomerById(id);
      setCustomer(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Customer Details">
        <div className="p-8">Loading...</div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout title="Customer Details">
        <div className="p-8">Customer not found.</div>
      </AdminLayout>
    );
  }

  return (
  <AdminLayout title="Customer Details">

    <div className="space-y-6">

      {/* Header */}

      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl text-white p-8 shadow-xl">

        <button
          onClick={() => window.history.back()}
          className="mb-5 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl"
        >
          ← Back
        </button>

        <div className="flex items-center gap-5">

          <div className="w-24 h-24 rounded-full bg-white text-green-700 flex items-center justify-center text-5xl font-black">
            👤
          </div>

          <div>

            <h1 className="text-4xl font-black">
              {customer.full_name}
            </h1>

            <p className="mt-2">
              📞 {customer.phone}
            </p>

            <p>
              ✉️ {customer.email}
            </p>

          </div>

        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">

            <StatCard
                title="Total Paid"
                value={`₹${
                customer.orders
                    ?.filter(o => o.payment_status === "Paid")
                    .reduce((sum, o) => sum + Number(o.total_amount), 0)
                }`}
                icon="💰"
            />

            <StatCard
                title="Pending"
                value={`₹${
                customer.orders
                    ?.filter(o => o.payment_status === "Pending")
                    .reduce((sum, o) => sum + Number(o.total_amount), 0)
                }`}
                icon="⏳"
            />

            <StatCard
                title="Transactions"
                value={customer.orders?.length || 0}
                icon="💳"
            />

            </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
            title="Orders"
            value={customer.totalOrders || 0}
            icon="📦"
        />

        <StatCard
            title="Subscriptions"
            value={customer.totalSubscriptions || 0}
            icon="🥛"
        />

        <StatCard
            title="Spent"
            value={`₹${customer.totalSpent || 0}`}
            icon="💰"
        />

        <StatCard
            title="Status"
            value="Active"
            icon="✅"
        />

        </div>
<div className="bg-white rounded-3xl shadow p-4">

  <div className="flex gap-3 flex-wrap">
         <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2 rounded-xl ${
                activeTab === "profile"
                ? "bg-green-600 text-white"
                : "bg-gray-100"
            }`}
            >
            Profile
            </button>

            <button
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2 rounded-xl ${
                activeTab === "orders"
                ? "bg-green-600 text-white"
                : "bg-gray-100"
            }`}
            >
            Orders
            </button>

            <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-5 py-2 rounded-xl ${
                activeTab === "subscriptions"
                ? "bg-green-600 text-white"
                : "bg-gray-100"
            }`}
            >
            Subscriptions
            </button>

            <button
            onClick={() => setActiveTab("addresses")}
            className={`px-5 py-2 rounded-xl ${
                activeTab === "addresses"
                ? "bg-green-600 text-white"
                : "bg-gray-100"
            }`}
            >
            Addresses
            </button>

            <button
            onClick={() => setActiveTab("payments")}
            className={`px-5 py-2 rounded-xl ${
                activeTab === "payments"
                ? "bg-green-600 text-white"
                : "bg-gray-100"
            }`}
            >
            Payments
            </button>
   

  </div>

</div>
{activeTab === "profile" && (
  <div className="bg-white rounded-3xl shadow p-6">

    <h2 className="text-2xl font-black mb-5">
      Customer Information
    </h2>

    <div className="grid md:grid-cols-2 gap-5">

      <InfoBox
        label="Full Name"
        value={customer.full_name}
      />

      <InfoBox
        label="Phone"
        value={customer.phone}
      />

      <InfoBox
        label="Email"
        value={customer.email}
      />

      <InfoBox
        label="Area"
        value={customer.area || "-"}
      />

      <InfoBox
        label="Address"
        value={customer.address || "-"}
      />

      <InfoBox
        label="Joined"
        value={new Date(customer.created_at).toLocaleDateString()}
      />

    </div>

  </div>
)}
{activeTab === "orders" && (

  <div className="bg-white rounded-3xl shadow overflow-hidden">

    <div className="px-6 py-5 border-b">

      <h2 className="text-2xl font-black">
        Customer Orders
      </h2>

    </div>

    <div className="overflow-x-auto">

      <table className="w-full">

        <thead className="bg-green-600 text-white">

          <tr>

            <th className="text-left p-4">
              Order No
            </th>

            <th className="text-left p-4">
              Date
            </th>

            <th className="text-left p-4">
              Amount
            </th>

            <th className="text-left p-4">
              Payment
            </th>

            <th className="text-left p-4">
              Payment Status
            </th>

            <th className="text-left p-4">
              Order Status
            </th>

          </tr>

        </thead>

        <tbody>

          {customer.orders?.length > 0 ? (

            customer.orders.map((order) => (

              <tr
                key={order.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="p-4 font-semibold">
                  {order.order_number}
                </td>

                <td className="p-4">
                  {new Date(
                    order.order_date
                  ).toLocaleDateString()}
                </td>

                <td className="p-4 font-bold text-green-700">
                  ₹{order.total_amount}
                </td>

                <td className="p-4">
                  {order.payment_method}
                </td>

                <td className="p-4">

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.payment_status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.payment_status}
                  </span>

                </td>

                <td className="p-4">

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "Packed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {order.status}
                  </span>

                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td
                colSpan="6"
                className="text-center p-10 text-gray-500"
              >
                No Orders Found
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>

  </div>

)}
{activeTab === "subscriptions" && (

  <div className="bg-white rounded-3xl shadow overflow-hidden">

    <div className="px-6 py-5 border-b">

      <h2 className="text-2xl font-black">
        Customer Subscriptions
      </h2>

    </div>

    {customer.subscriptions?.length > 0 ? (

      <div className="grid gap-6 p-6">

        {customer.subscriptions.map((subscription) => (

          <div
            key={subscription.id}
            className="border rounded-2xl p-6 hover:shadow-lg transition"
          >

            <div className="flex justify-between items-center mb-5">

              <div>

                <h3 className="text-2xl font-bold text-green-700">
                  🥛 Milk Subscription
                </h3>

                <p className="text-gray-500">
                  ID : {subscription.id.slice(0, 8)}
                </p>

              </div>

              <span
                className={`px-4 py-2 rounded-full font-semibold ${
                  subscription.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {subscription.status}
              </span>

            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

              <SubscriptionInfo
                label="Delivery Time"
                value={subscription.delivery_time}
              />

              <SubscriptionInfo
                label="Frequency"
                value={subscription.frequency}
              />

              <SubscriptionInfo
                label="Start Date"
                value={new Date(
                  subscription.start_date
                ).toLocaleDateString()}
              />

              <SubscriptionInfo
                label="End Date"
                value={new Date(
                  subscription.end_date
                ).toLocaleDateString()}
              />

              <SubscriptionInfo
                label="Total Amount"
                value={`₹${subscription.total_amount}`}
              />

              <SubscriptionInfo
                label="Status"
                value={subscription.status}
              />

            </div>

          </div>

        ))}

      </div>

    ) : (

      <div className="text-center p-12 text-gray-500">
        No Subscriptions Found
      </div>

    )}

  </div>

)}
{activeTab === "addresses" && (

  <div className="bg-white rounded-3xl shadow overflow-hidden">

    <div className="px-6 py-5 border-b">

      <h2 className="text-2xl font-black">
        Customer Addresses
      </h2>

    </div>

    {customer.addresses?.length > 0 ? (

      <div className="grid md:grid-cols-2 gap-6 p-6">

        {customer.addresses.map((address) => (

          <div
            key={address.id}
            className="border rounded-2xl p-6 hover:shadow-lg"
          >

            <div className="flex justify-between mb-5">

              <h3 className="text-xl font-bold">
                📍 {address.address_type || "Address"}
              </h3>

              {address.is_default && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  Default
                </span>
              )}

            </div>

           <AddressInfo
                label="House No"
                value={address.house_no}
                />

                <AddressInfo
                label="Street"
                value={address.street}
                />

                <AddressInfo
                label="Area"
                value={address.area}
                />

                <AddressInfo
                label="City"
                value={address.city}
                />

                <AddressInfo
                label="State"
                value={address.state}
                />

                <AddressInfo
                label="Pincode"
                value={address.pincode}
                />

          </div>

        ))}

      </div>

    ) : (

      <div className="text-center py-12 text-gray-500">
        No Addresses Found
      </div>

    )}

  </div>

)}
{activeTab === "payments" && (

  <div className="bg-white rounded-3xl shadow overflow-hidden">

    <div className="px-6 py-5 border-b">

      <h2 className="text-2xl font-black">
        Payment History
      </h2>

    </div>

    <div className="overflow-x-auto">

      <table className="w-full">

        <thead className="bg-green-600 text-white">

          <tr>

            <th className="p-4 text-left">
              Order
            </th>

            <th className="p-4 text-left">
              Date
            </th>

            <th className="p-4 text-left">
              Amount
            </th>

            <th className="p-4 text-left">
              Method
            </th>

            <th className="p-4 text-left">
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          {customer.orders?.length > 0 ? (

            customer.orders.map((order) => (

              <tr
                key={order.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="p-4 font-semibold">
                  {order.order_number}
                </td>

                <td className="p-4">
                  {new Date(order.order_date).toLocaleDateString()}
                </td>

                <td className="p-4 font-bold text-green-700">
                  ₹{order.total_amount}
                </td>

                <td className="p-4">
                  {order.payment_method}
                </td>

                <td className="p-4">

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.payment_status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : order.payment_status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {order.payment_status}
                  </span>

                </td>

              </tr>

            ))

          ) : (

            <tr>

              <td
                colSpan="5"
                className="text-center p-10 text-gray-500"
              >
                No Payments Found
              </td>

            </tr>

          )}

        </tbody>

      </table>

    </div>

  </div>

)}
</div>
    </AdminLayout>
    );
    }
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="text-3xl">{icon}</div>
      <p className="text-gray-500 mt-2">{title}</p>
      <h3 className="text-3xl font-black mt-2">{value}</h3>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="border rounded-2xl p-4">
      <p className="text-gray-500">{label}</p>
      <h3 className="text-lg font-bold mt-1">{value}</h3>
    </div>
  );
}
function SubscriptionInfo({ label, value }) {
  return (
    <div className="border rounded-xl p-4">
      <p className="text-gray-500 text-sm">
        {label}
      </p>

      <h3 className="font-bold mt-2">
        {value || "-"}
      </h3>
    </div>
  );
}
function AddressInfo({ label, value }) {
  return (
    <div className="mb-4">
      <p className="text-gray-500 text-sm">
        {label}
      </p>

      <h3 className="font-semibold mt-1">
        {value || "-"}
      </h3>
    </div>
  );
}