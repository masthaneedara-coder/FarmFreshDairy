import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../Components/AdminLayout";
import { fetchBilling, updateBillingStatus } from "../config/api";
import InvoiceDrawer from "../Components/admin/InvoiceDrawer";

export default function AdminBilling() {
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

const [invoiceOpen, setInvoiceOpen] = useState(false);
  

const loadBilling = async () => {
  try {
    setLoading(true);

    const rows = await fetchBilling();

    const billRows = rows.map((bill) => ({
  ...bill,

  // Invoice
  invoiceNumber: bill.invoice_number,
  billingDate: bill.invoice_date,

  // Customer

}));

    setBilling(billRows);
  } catch (error) {
    console.error("Failed to load billing:", error);
    setBilling([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadBilling();
  }, []);

  const filteredBilling = useMemo(() => {
    const q = search.toLowerCase().trim();

    return billing.filter((bill) => {
      const customerName = String(bill.customerName || "").toLowerCase();
      const phone = String(bill.phone || "").toLowerCase();
      const product = String(bill.product || "").toLowerCase();
      const area = String(bill.area || "").toLowerCase();
      const billingStatus = String(bill.billingStatus || "").toLowerCase();

      const matchesSearch =
        !q ||
        customerName.includes(q) ||
        phone.includes(q) ||
        product.includes(q) ||
        area.includes(q);

      const matchesStatus =
        statusFilter === "All" ||
        billingStatus === statusFilter.toLowerCase();

      const matchesMonth =
        monthFilter === "All" ||
        getMonthKey(bill.billingDate) === monthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [billing, search, statusFilter, monthFilter]);

  const stats = useMemo(() => {
    const totalCustomers = filteredBilling.length;

    const totalAmount = filteredBilling.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const paidCount = filteredBilling.filter(
      (item) => String(item.billingStatus || "").toLowerCase() === "paid"
    ).length;

    const unpaidCount = filteredBilling.filter((item) => {
      const status = String(item.billingStatus || "").toLowerCase();

      return status === "pending" || status === "unpaid";
    }).length;

    const inactiveCount = filteredBilling.filter(
      (item) => String(item.billingStatus || "").toLowerCase() === "inactive"
    ).length;

    return {
      totalCustomers,
      totalAmount,
      paidCount,
      unpaidCount,
      inactiveCount,
    };
  }, [filteredBilling]);

  const monthOptions = useMemo(() => {
    const months = new Set();

    billing.forEach((bill) => {
      const key = getMonthKey(bill.billingDate);
      if (key) months.add(key);
    });

    return Array.from(months).sort().reverse();
  }, [billing]);

 const updateBillingStatusLocal = async (billId, newStatus) => {
  try {
    const res = await updateBillingStatus(billId, newStatus);

    if (res.success) {
    await loadBilling();
    } else {
      alert(res.message);
    }
  } catch (err) {
    console.error(err);
    alert("Unable to update billing status");
  }
};

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getBillingBadge = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "paid") {
      return {
        badge: "bg-green-100 text-green-700 border border-green-200",
        dot: "bg-green-500",
      };
    }

    if (s === "inactive") {
      return {
        badge: "bg-slate-100 text-slate-700 border border-slate-200",
        dot: "bg-slate-500",
      };
    }

    return {
      badge: "bg-orange-100 text-orange-700 border border-orange-200",
      dot: "bg-orange-500",
    };
  };

  return (
    <AdminLayout title="Billing">
      <div className="space-y-5 sm:space-y-6">
        {/* HERO */}
        <div className="rounded-[26px] sm:rounded-[30px] bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 p-4 sm:p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-white/80 text-xs sm:text-sm">
                Admin Billing Control
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
                💰 Billing Management
              </h1>
              <p className="text-white/90 mt-2 text-sm sm:text-base">
                View monthly subscription billing, customer dues and payment status.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-3">
              <button
                onClick={loadBilling}
                className="px-4 py-3 rounded-2xl bg-white text-emerald-700 font-bold shadow text-sm sm:text-base"
              >
                Refresh Billing
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          <StatCard title="Bills" value={stats.totalCustomers} color="green" icon="🧾" />
          <StatCard title="Total Amount" value={formatMoney(stats.totalAmount)} color="emerald" icon="💰" />
          <StatCard title="Paid" value={stats.paidCount} color="blue" icon="✅" />
          <StatCard title="Unpaid" value={stats.unpaidCount} color="orange" icon="⏳" />
          <StatCard title="Inactive" value={stats.inactiveCount} color="slate" icon="⛔" />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-4 sm:p-5">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px_220px_auto] gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Search Billing
              </label>
              <input
                type="text"
                placeholder="Search customer / phone / product / area"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Billing Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              >
                <option value="All">All</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Billing Month
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              >
                <option value="All">All</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadBilling}
                className="w-full xl:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-bold shadow"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="bg-slate-50 rounded-3xl p-10 text-center">
            <div className="text-5xl mb-3 animate-pulse">⏳</div>
            <p className="text-lg font-semibold text-slate-600">
              Loading billing...
            </p>
          </div>
        ) : filteredBilling.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-10 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-2xl font-black text-slate-700">
              No billing data found
            </h2>
            <p className="text-slate-500 mt-2">
              Try changing search or filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBilling.map((bill) => {
              const billingBadge = getBillingBadge(bill.billingStatus);

              return (
                <div
                  key={bill.id}
                  className="bg-white rounded-3xl shadow-md border border-slate-100 p-4 sm:p-5 hover:shadow-xl transition"
                >
                  <div className="flex flex-col gap-4">
                    {/* TOP */}
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg sm:text-2xl font-black text-emerald-700 break-words">
                            {bill.customerName || "Customer"}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${billingBadge.badge}`}
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${billingBadge.dot}`}
                            ></span>
                            {bill.billingStatus || "Unpaid"}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 mt-2 break-all">
                          {bill.phone || "-"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white px-5 py-4 shadow w-full sm:w-auto">
                        <p className="text-xs sm:text-sm text-white/80">
                          Monthly Bill
                        </p>
                        <h3 className="text-2xl font-black mt-1">
                          {formatMoney(bill.amount)}
                        </h3>
                      </div>
                    </div>

                    {/* MAIN INFO */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                      <InfoBox label="Product" value={bill.product || "-"} />
                      <InfoBox label="Quantity" value={bill.qty || "-"} />
                      <InfoBox label="Delivery" value={bill.deliveryType || "-"} />
                      <InfoBox label="Area" value={bill.area || "-"} />
                    </div>

                    {/* ADDRESS */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-500 font-medium">Address</p>
                      <p className="text-slate-800 font-semibold mt-1 break-words">
                        {bill.address || "-"}
                      </p>
                    </div>

                    {/* DATE + SUBSCRIPTION STATUS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <InfoBox
                        label="Billing Start"
                        value={formatDate(bill.startDate)}
                      />
                      <InfoBox
                        label="Expire Date"
                        value={formatDate(bill.expireDate)}
                      />
                      <InfoBox
                        label="Subscription Status"
                        value={bill.subscriptionStatus || "-"}
                      />
                    </div>

                    {/* ACTIONS */}
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                      <h3 className="text-lg font-black text-slate-800">
                        Update Billing Status
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Mark this month bill as paid or unpaid
                      </p>

                      <div className="flex flex-col md:flex-row gap-3 mt-4">
                        <button
                          onClick={() => updateBillingStatusLocal(bill.id, "Paid")}
                          className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-semibold text-sm"
                        >
                          Mark Paid
                        </button>

                        <button
                          onClick={() => updateBillingStatusLocal(bill.id, "Unpaid")}
                          className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-semibold text-sm"
                        >
                          Mark Unpaid
                        </button>
                        <button
                              onClick={() => {
                                  setSelectedInvoice(bill);
                                  setInvoiceOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold"
                          >
                              👁 View Invoice
                          </button>
                          
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <InvoiceDrawer
    open={invoiceOpen}
    bill={selectedInvoice}
    onClose={() => {
        setInvoiceOpen(false);
        setSelectedInvoice(null);
    }}
    />
    </AdminLayout>
  );
}

function getMonthKey(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey) {
  if (!monthKey) return "-";
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function StatCard({ title, value, color = "green", icon = "💰" }) {
  const styles = {
    green: "border-green-100 text-green-700 bg-white",
    emerald: "border-emerald-100 text-emerald-700 bg-white",
    blue: "border-blue-100 text-blue-700 bg-white",
    orange: "border-orange-100 text-orange-700 bg-white",
    slate: "border-slate-100 text-slate-700 bg-white",
  };

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 shadow-lg border ${styles[color] || styles.green}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs sm:text-sm">{title}</p>
          <h3 className="text-xl sm:text-3xl font-black mt-2 break-words">
            {value}
          </h3>
        </div>
        <div className="text-2xl sm:text-3xl shrink-0">{icon}</div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 min-w-0">
      <p className="text-xs sm:text-sm text-slate-500 font-medium">{label}</p>
      <h3 className="text-sm sm:text-lg font-black text-slate-800 mt-1 break-words">
        {value}
      </h3>
    </div>
  );
}
