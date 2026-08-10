import { useEffect, useState } from "react";
import {
  generateMonthlyBills,
  getMonthlyBills,
  markBillPaid,
} from "../services/monthlyBillingService";
import MonthlyBillDrawer from "../Components/MonthlyBillDrawer";

export default function AdminMonthlyBilling() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    loadBills();
  }, [month, year]);

  async function loadBills() {
    try {
      setLoading(true);

      const res = await getMonthlyBills(month, year);

      setBills(res.bills || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }
  const summary = {
  totalBills: bills.length,

  pendingBills: bills.filter(
    b => b.payment_status === "Pending"
  ).length,

  paidBills: bills.filter(
    b => b.payment_status === "Paid"
  ).length,

  totalRevenue: bills.reduce(
    (sum, b) => sum + Number(b.total_amount || 0),
    0
  ),

  pendingAmount: bills
    .filter(b => b.payment_status === "Pending")
    .reduce(
      (sum, b) => sum + Number(b.total_amount || 0),
      0
    ),

  paidAmount: bills
    .filter(b => b.payment_status === "Paid")
    .reduce(
      (sum, b) => sum + Number(b.total_amount || 0),
      0
    ),
};

  async function handleGenerateBills() {
    try {
      setLoading(true);

      await generateMonthlyBills(month, year);

      alert("Monthly Bills Generated Successfully");

      await loadBills();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(id) {
    try {
      await markBillPaid(id);

      alert("Bill Marked Paid");

      loadBills();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  return (
    <div className="p-6">

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">

        <h1 className="text-3xl font-bold">
          Monthly Billing
        </h1>

        <div className="flex gap-3">

          <select
            value={month}
            onChange={(e) =>
              setMonth(Number(e.target.value))
            }
            className="border rounded-lg px-4 py-2"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option
                key={i}
                value={i + 1}
              >
                {i + 1}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={year}
            onChange={(e) =>
              setYear(Number(e.target.value))
            }
            className="border rounded-lg px-4 py-2 w-28"
          />

         
         <button
            onClick={handleGenerateBills}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold"
            >
            {loading ? "Generating..." : "Generate Bills"}
            </button>

        </div>

      </div>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

        <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500">Total Bills</p>
            <h2 className="text-3xl font-bold text-blue-600">
            {summary.totalBills}
            </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500">Pending Amount</p>
            <h2 className="text-3xl font-bold text-red-600">
            ₹{summary.pendingAmount}
            </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500">Paid Amount</p>
            <h2 className="text-3xl font-bold text-green-600">
            ₹{summary.paidAmount}
            </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
            <p className="text-gray-500">Revenue</p>
            <h2 className="text-3xl font-bold text-purple-600">
            ₹{summary.totalRevenue}
            </h2>
        </div>

        </div>

        <table className="w-full">

          <thead className="bg-green-600 text-white">

            <tr>

              <th className="px-4 py-3">Customer</th>

              <th className="px-4 py-3">Phone</th>

              <th className="px-4 py-3">Delivered</th>

              <th className="px-4 py-3">Missed</th>

              <th className="px-4 py-3">Bill</th>

              <th className="px-4 py-3">Status</th>

              <th className="px-4 py-3">Actions</th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan="7"
                  className="text-center p-10"
                >
                  Loading...
                </td>

              </tr>

            ) : bills.length === 0 ? (

              <tr>

                <td
                  colSpan="7"
                  className="text-center p-10"
                >
                  No Bills Found
                </td>

              </tr>

            ) : (

              bills.map((bill) => (

                <tr
                  key={bill.id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="px-4 py-3">
                    {bill.customers?.full_name}
                  </td>

                  <td className="px-4 py-3">
                    {bill.customers?.phone}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {bill.delivered_days}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {bill.missed_days}
                  </td>

                  <td className="px-4 py-3 font-bold text-green-700">
                    ₹{bill.total_amount}
                  </td>

                  <td className="px-4 py-3">

                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        bill.payment_status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {bill.payment_status}
                    </span>

                  </td>

                  <td className="px-4 py-3">

                    <div className="flex gap-2">
                        <button
                        onClick={() => {
                            setSelectedBill(bill);
                            setDrawerOpen(true);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                        View
                        </button>

                      {bill.payment_status !== "Paid" && (

                        <button
                          onClick={() =>
                            handleMarkPaid(bill.id)
                          }
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Paid
                        </button>

                      )}

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
      <MonthlyBillDrawer
  open={drawerOpen}
  bill={selectedBill}
  month={month}
  year={year}
  onClose={() => {
    setDrawerOpen(false);
    setSelectedBill(null);
  }}
/>

    </div>
  );
}