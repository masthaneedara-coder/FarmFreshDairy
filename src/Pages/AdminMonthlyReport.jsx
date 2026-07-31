import { useEffect, useState } from "react";

import { getMonthlyDeliveryReport } from "../config/api";

export default function AdminMonthlyReport() {

  const today = new Date();

  const [month, setMonth] = useState(
    today.getMonth() + 1
  );

  const [year, setYear] = useState(
    today.getFullYear()
  );

  const [loading, setLoading] =
    useState(false);

  const [customers, setCustomers] =
    useState([]);

  useEffect(() => {
    loadReport();
  }, [month, year]);

  async function loadReport() {

    try {

      setLoading(true);

      const res =
        await getMonthlyDeliveryReport(
          month,
          year
        );

      setCustomers(res.customers || []);

    } catch (err) {

      console.error(err);

      alert(err.message);

    } finally {

      setLoading(false);

    }

  }
  const totalCustomers = customers.length;

const totalDelivered = customers.reduce(
  (sum, c) => sum + Number(c.deliveredDays || 0),
  0
);

const totalMissed = customers.reduce(
  (sum, c) => sum + Number(c.missedDays || 0),
  0
);

const totalRevenue = customers.reduce(
  (sum, c) => sum + Number(c.billAmount || 0),
  0
);

  return (

    <div className="p-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>

          <h1 className="text-3xl font-bold">
            Monthly Delivery Report
          </h1>

          <p className="text-gray-500">
            Customer Delivery Summary
          </p>

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

  {/* Customers */}
  <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">
          Customers
        </p>

        <h2 className="text-3xl font-bold text-green-700 mt-2">
          {totalCustomers}
        </h2>
      </div>

      <div className="text-5xl">
        👥
      </div>
    </div>
  </div>

  {/* Delivered */}
  <div className="bg-white rounded-2xl shadow-md p-5 border border-blue-100">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">
          Delivered
        </p>

        <h2 className="text-3xl font-bold text-blue-700 mt-2">
          {totalDelivered}
        </h2>
      </div>

      <div className="text-5xl">
        🚚
      </div>
    </div>
  </div>

  {/* Missed */}
  <div className="bg-white rounded-2xl shadow-md p-5 border border-red-100">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">
          Missed
        </p>

        <h2 className="text-3xl font-bold text-red-600 mt-2">
          {totalMissed}
        </h2>
      </div>

      <div className="text-5xl">
        ❌
      </div>
    </div>
  </div>

  {/* Revenue */}
  <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">
          Revenue
        </p>

        <h2 className="text-3xl font-bold text-emerald-700 mt-2">
          ₹{totalRevenue.toLocaleString()}
        </h2>
      </div>

      <div className="text-5xl">
        💰
      </div>
    </div>
  </div>

</div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

         <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="border rounded-xl px-4 py-3 w-full sm:w-52"
                >
                {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                ].map((m, index) => (
                    <option
                    key={index}
                    value={index + 1}
                    >
                    {m}
                    </option>
                ))}
                </select>

          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-xl px-4 py-3 w-full sm:w-36"
            />

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-x-auto border border-gray-100">

        <table className="min-w-[1250px] w-full">

         <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">

                <tr>

                <th className="px-4 py-4 text-left font-semibold">
                Customer
                </th>

                <th className="px-4 py-4 text-left font-semibold">
                Product
                </th>

                <th className="px-4 py-4 text-center font-semibold">
                Qty
                </th>

                <th className="px-4 py-4 text-center font-semibold">
                Delivered
                </th>

                <th className="px-4 py-4 text-center font-semibold">
                Missed
                </th>

                <th className="px-4 py-4 text-center font-semibold">
                Daily Rate
                </th>

                <th className="px-4 py-4 text-center font-semibold">
                Bill Amount
                </th>

                <th className="px-4 py-4 text-center font-semibold">
                Payment
                </th>

                <th className="px-4 py-4 text-center font-semibold">
                Subscription
                </th>

                </tr>

                </thead>

          <tbody>

  {loading ? (

    <tr>
      <td
        colSpan={9}
        className="py-12 text-center"
      >
        <div className="flex flex-col items-center">

          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent mb-4"></div>

          <p className="text-gray-500 font-medium">
            Loading Monthly Report...
          </p>

        </div>
      </td>
    </tr>

  ) : customers.length === 0 ? (

    <tr>

      <td
        colSpan={9}
        className="py-20 text-center"
      >

        <div className="flex flex-col items-center">

          <div className="text-7xl mb-4">
            📊
          </div>

          <h2 className="text-2xl font-bold text-gray-700">
            No Report Found
          </h2>

          <p className="text-gray-500 mt-2">
            No delivery records found for
          </p>

          <p className="text-lg font-semibold text-green-700 mt-1">
            {new Date(year, month - 1).toLocaleString("default", {
              month: "long",
            })}{" "}
            {year}
          </p>

        </div>

      </td>

    </tr>

  ) : (

    customers.map((c) => (

      <tr
        key={c.subscriptionId}
        className="border-t even:bg-gray-50 hover:bg-green-50 transition-all"
      >

        <td className="px-4 py-4">
          <div className="font-semibold">
            {c.customerName}
          </div>

          <div className="text-sm text-gray-500">
            {c.phone}
          </div>
        </td>

        <td className="px-4 py-4 text-center">
          {c.product}
        </td>

        <td className="px-4 py-4 text-center">
          {c.quantity}
        </td>

        <td className="px-4 py-4 text-center">
          <span className="font-bold text-lg text-green-600">
            {c.deliveredDays}
          </span>
        </td>

        <td className="px-4 py-4 text-center">
          <span className="font-bold text-lg text-red-600">
            {c.missedDays}
          </span>
        </td>

        <td className="px-4 py-4 text-center">
          ₹{Number(c.dailyRate).toFixed(2)}
        </td>

        <td className="px-4 py-4 text-center font-bold text-green-700">
          ₹{Number(c.billAmount).toFixed(2)}
        </td>

        <td className="px-4 py-4 text-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              c.paymentStatus === "Paid"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {c.paymentStatus}
          </span>
        </td>

        <td className="px-4 py-4 text-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              c.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {c.status}
          </span>
        </td>

      </tr>

    ))

  )}

</tbody>

        </table>

      </div>

    </div>

  );

}