import { useEffect, useMemo, useState } from "react";

import MonthlyBillDrawer from "../Components/admin/MonthlyBillDrawer";

import { generateMonthlyBillPDF } from "../utils/monthlyBillPdf";
import { sendMonthlyBillWhatsapp } from "../utils/whatsappBill";

import {
  getMonthlyDeliveryReport,
  getCombinedCustomerMonthlyBillDetails,
  markMonthlyBillPaid,
} from "../config/api";

export default function AdminMonthlyReport() {
  const today = new Date();

  const [month, setMonth] = useState(
    today.getMonth() + 1
  );

  const [year, setYear] = useState(
    today.getFullYear()
  );

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [customers, setCustomers] = useState([]);

  const [selectedBill, setSelectedBill] =
    useState(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [statusFilter, setStatusFilter] =
    useState("All");


  // Separate customer lists by completed delivery activity.
  const [deliveryTab, setDeliveryTab] = useState("Delivered");
  const [searchTerm, setSearchTerm] = useState("");

  // ==========================================
  // LOAD REPORT
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    async function loadReportFast() {
      const cacheKey = `farmfresh-monthly-report-${year}-${month}`;

      // Show cached data immediately when available.
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && !cancelled) {
            setCustomers(parsed);
          }
        }
      } catch {
        // Ignore cache errors.
      }

      try {
        if (!cancelled) {
          setLoading(customers.length === 0);
          setRefreshing(true);
        }

        const res = await getMonthlyDeliveryReport(month, year);
        const nextCustomers = res.customers || [];

        if (!cancelled) {
          setCustomers(nextCustomers);

          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify(nextCustomers)
            );
          } catch {
            // Ignore storage quota/private-mode errors.
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Monthly report load failed:", err);
          if (!customers.length) {
            alert(err.message || "Failed to load monthly report.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadReportFast();

    return () => {
      cancelled = true;
    };
    // Intentionally only reload when the selected period changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  // ==========================================
  // FILTER REPORT BY PAYMENT / SUBSCRIPTION STATUS
  // ==========================================

 const filteredCustomers = useMemo(() => {
  const grouped = new Map();

  customers.forEach((item) => {
    const customerId = item.customerId || item.customer_id;

    // Do not merge records without a real customer ID.
    const key = customerId || `subscription-${item.subscriptionId || `row-${customers.indexOf(item)}`}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...item,
        customerId,
        subscriptionIds: [],
        products: [],
        quantities: 0,
        normalQuantity: 0,
        deliveryAmount: 0,
        deliveredDays: 0,
        missedDays: 0,
        pausedDays: 0,
        pauseHistory: [],
        extraQuantity: 0,
        extraAmount: 0,
        dailyRate: 0,
        billAmount: 0,
        subtotal: 0,
        discount: 0,
        gstAmount: 0,
        billIds: [],
        paymentStatuses: [],
        subscriptionStatuses: [],
      });
    }

    const row = grouped.get(key);

    if (item.subscriptionId) {
      row.subscriptionIds.push(item.subscriptionId);
    }

    if (item.product && !row.products.includes(item.product)) {
      row.products.push(item.product);
    }

    row.quantities += Number(item.quantity ?? item.normalQuantity ?? item.normal_quantity ?? 0);
    row.normalQuantity += Number(item.normalQuantity ?? item.normal_quantity ?? item.quantity ?? 0);
    row.deliveryAmount += Number(item.deliveryAmount ?? item.delivery_amount ?? item.normalAmount ?? item.normal_amount ?? 0);
    row.deliveredDays += Number(item.deliveredDays ?? item.delivered_days ?? 0);
    row.missedDays += Number(item.missedDays ?? item.missed_days ?? 0);
    row.pausedDays += Number(item.pausedDays ?? item.paused_days ?? 0);
    if (Array.isArray(item.pauseHistory)) {
      row.pauseHistory.push(...item.pauseHistory);
    }
    row.extraQuantity += Number(item.extraQuantity ?? item.extra_quantity ?? 0);
    row.extraAmount += Number(item.extraAmount ?? item.extra_amount ?? 0);
    row.dailyRate += Number(item.dailyRate || 0);
    row.billAmount += Number(item.billAmount || 0);
    row.subtotal += Number(item.subtotal || 0);
    row.discount += Number(item.discount || 0);
    row.gstAmount += Number(item.gstAmount || 0);

    if (item.monthlyBillId) {
      row.billIds.push(item.monthlyBillId);
    }

    if (item.paymentStatus) {
      row.paymentStatuses.push(item.paymentStatus);
    }

    if (item.subscriptionStatus) {
      row.subscriptionStatuses.push(item.subscriptionStatus);
    }
  });

  const combined = Array.from(grouped.values()).map((row) => {
    const statuses = row.paymentStatuses.map((s) =>
      String(s).toLowerCase()
    );

    const allPaid =
      statuses.length > 0 &&
      statuses.every((s) => s === "paid");

    const hasPending = statuses.some((s) => s === "pending");

    const subscriptionStatuses = [
      ...new Set(row.subscriptionStatuses),
    ];

    return {
      ...row,
      customerId: row.customerId || row.customer_id || null,
      customerName: row.customerName || row.customer_name || row.name || "",
      phone: row.phone || row.mobile || row.phone_number || "",
      deliveryAmount: row.deliveryAmount,
      extraAmount: row.extraAmount,
      subscriptionId: row.subscriptionIds[0] || null,
      product: row.products.join(", ") || "No Subscription",
      quantity: row.quantities,
      normalQuantity: row.normalQuantity,
      paymentStatus: allPaid
        ? "Paid"
        : hasPending
          ? "Pending"
          : row.paymentStatuses[0] || "No Invoice",
      subscriptionStatus:
        subscriptionStatuses.length === 1
          ? subscriptionStatuses[0]
          : subscriptionStatuses.length > 1
            ? "Multiple"
            : "No Subscription",
      subscriptionStatuses,
    };
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchPhone = normalizedSearch.replace(/\D/g, "");

  return combined.filter((c) => {
    const customerName = String(c.customerName || "").toLowerCase();
    const phone = String(c.phone || "").replace(/\D/g, "");

    const matchesSearch =
      !normalizedSearch ||
      customerName.includes(normalizedSearch) ||
      (searchPhone && phone.includes(searchPhone));

    if (!matchesSearch) return false;

    const paymentStatus = String(c.paymentStatus || "").toLowerCase();
    const subscriptionStatus = String(
      c.subscriptionStatus || ""
    ).toLowerCase();
    const allSubscriptionStatuses = (
      Array.isArray(c.subscriptionStatuses) && c.subscriptionStatuses.length
        ? c.subscriptionStatuses
        : [c.subscriptionStatus]
    ).map((status) => String(status || "").trim().toLowerCase());

    switch (statusFilter) {
      case "Active":
        return allSubscriptionStatuses.includes("active");
      case "Paused":
        return allSubscriptionStatuses.includes("paused");
      case "Pending":
        return paymentStatus === "pending";
      case "Paid":
        return paymentStatus === "paid";
      case "Cancelled":
        return allSubscriptionStatuses.some((status) =>
          ["cancelled", "canceled"].includes(status)
        );
      case "Stopped":
        return allSubscriptionStatuses.includes("stopped");
      default:
        return true;
    }
  });
}, [customers, statusFilter, searchTerm]);

  // A customer is Delivered if at least one delivery day was completed.
  // Customers with zero completed delivery days appear in Not Delivered.
  const deliveredCustomers = useMemo(
    () => filteredCustomers.filter((customer) => Number(customer.deliveredDays || 0) > 0),
    [filteredCustomers]
  );

  const notDeliveredCustomers = useMemo(
    () => filteredCustomers.filter((customer) => Number(customer.deliveredDays || 0) <= 0),
    [filteredCustomers]
  );

  const reportCustomers =
    deliveryTab === "Delivered" ? deliveredCustomers : notDeliveredCustomers;

  // ==========================================
  // STATISTICS - FOLLOW CURRENT FILTER
  // ==========================================

  const totalCustomers = reportCustomers.length;

  const totalDelivered = reportCustomers.reduce(
    (sum, c) => sum + Number(c.deliveredDays || 0),
    0
  );

  const totalMissed = reportCustomers.reduce(
    (sum, c) => sum + Number(c.missedDays || 0),
    0
  );

  const totalNormalQuantity = reportCustomers.reduce(
    (sum, c) => sum + Number(c.normalQuantity || 0),
    0
  );

  const totalExtraQuantity = reportCustomers.reduce(
    (sum, c) => sum + Number(c.extraQuantity || 0),
    0
  );

  const totalDeliveryAmount = reportCustomers.reduce(
    (sum, c) => sum + Number(c.deliveryAmount || 0),
    0
  );

  const totalExtraAmount = reportCustomers.reduce(
    (sum, c) => sum + Number(c.extraAmount || 0),
    0
  );

  // Revenue is calculated from the two delivery-ledger amount columns.
  const totalRevenue = totalDeliveryAmount + totalExtraAmount;

  // ==========================================
  // VIEW BILL
  // ==========================================

 async function getCombinedInvoice(customer) {
  const customerId = customer?.customerId || customer?.customer_id;

  if (!customerId) {
    throw new Error("Customer ID is missing in the monthly report.");
  }

  if (Number(customer.deliveredDays || 0) <= 0) {
    throw new Error("No completed deliveries are available for this invoice.");
  }

  const data = await getCombinedCustomerMonthlyBillDetails(
    customerId,
    month,
    year
  );

  if (!data?.success || !data.bill || !data.customer) {
    throw new Error(data?.message || "Unable to load combined invoice.");
  }

  return data;
}

async function handleViewBill(customer) {
  try {
    const data = await getCombinedInvoice(customer);

    setSelectedBill({
      ...data,
      // The existing drawer expects a single subscription property.
      // Keep the full subscriptions array as well.
      subscription: data.subscriptions?.[0] || null,
      subscriptions: data.subscriptions || [],
      // The drawer's Mark Paid button passes bill.id.
      // The parent handler will update every bill in data.bills.
      bill: {
        ...data.bill,
        id: data.bills?.[0]?.id || data.bill.id,
      },
    });

    setDrawerOpen(true);
  } catch (err) {
    console.error("Combined invoice view error:", err);
    alert(err.message || "Failed to load combined invoice.");
  }
}

async function handleDownloadInvoice(customer) {
  try {
    const data = await getCombinedInvoice(customer);
    await generateMonthlyBillPDF(data, "download");
  } catch (err) {
    console.error("Combined PDF error:", err);
    alert(err.message || "Failed to download combined invoice.");
  }
}

async function handleShareInvoice(customer) {
  try {
    const data = await getCombinedInvoice(customer);
    await generateMonthlyBillPDF(data, "share");
  } catch (err) {
    console.error("Combined PDF share error:", err);
    alert(err.message || "Failed to share combined invoice.");
  }
}

async function handlePrintInvoice(customer) {
  try {
    const data = await getCombinedInvoice(customer);
    await generateMonthlyBillPDF(data, "print");
  } catch (err) {
    console.error("Combined print error:", err);
    alert(err.message || "Failed to print combined invoice.");
  }
}

async function handleWhatsappInvoice(customer) {
  try {
    const data = await getCombinedInvoice(customer);
    await sendMonthlyBillWhatsapp(data);
  } catch (err) {
    console.error("Combined WhatsApp error:", err);
    alert(err.message || "Failed to prepare WhatsApp invoice.");
  }
}

async function handleMarkPaid() {
  try {
    const billIds = (selectedBill?.bills || [])
      .map((bill) => bill.id)
      .filter(Boolean);

    // Fallback for APIs that return only the primary bill.
    const fallbackBillId = selectedBill?.bill?.id;
    const idsToUpdate = billIds.length
      ? [...new Set(billIds)]
      : fallbackBillId
        ? [fallbackBillId]
        : [];

    if (!idsToUpdate.length) {
      throw new Error("No monthly bill records found for this customer.");
    }

    for (const billId of idsToUpdate) {
      await markMonthlyBillPaid(billId);
    }

    const customerId =
      selectedBill?.customer?.id ||
      selectedBill?.customer?.customerId ||
      selectedBill?.bill?.customer_id;

    if (customerId != null) {
      setCustomers((current) =>
        current.map((item) =>
          String(item.customerId || item.customer_id) === String(customerId)
            ? { ...item, paymentStatus: "Paid" }
            : item
        )
      );
    }

    alert("All monthly bills for this customer are marked as Paid.");
    setDrawerOpen(false);
  } catch (err) {
    console.error("Combined mark-paid error:", err);
    alert(err.message || "Failed to mark customer bills as Paid.");
  }
}

async function handleMarkCustomerPaid(customer) {
  try {
    const data = await getCombinedInvoice(customer);
    const billIds = (data.bills || [])
      .map((bill) => bill.id)
      .filter(Boolean);

    const fallbackBillId = data.bill?.id;
    const idsToUpdate = billIds.length
      ? [...new Set(billIds)]
      : fallbackBillId
        ? [fallbackBillId]
        : [];

    if (!idsToUpdate.length) {
      throw new Error("No monthly bill records found for this customer.");
    }

    for (const billId of idsToUpdate) {
      await markMonthlyBillPaid(billId);
    }

    const customerId = customer.customerId || customer.customer_id;
    setCustomers((current) =>
      current.map((item) =>
        String(item.customerId || item.customer_id) === String(customerId)
          ? { ...item, paymentStatus: "Paid" }
          : item
      )
    );

    alert("All monthly bills for this customer are marked as Paid.");
  } catch (err) {
    console.error("Customer mark-paid error:", err);
    alert(err.message || "Failed to mark customer bills as Paid.");
  }
}

  // ==========================================
  // MONTH NAME
  // ==========================================

  const monthName = new Date(
    year,
    month - 1
  ).toLocaleString("default", {
    month: "long",
  });

  return (
    <div className="monthly-report-page min-h-screen bg-[#f6faf8] text-slate-900">
      <style>{`
        @keyframes mr-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mr-pop {
          0% { opacity: 0; transform: scale(.96); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes mr-shimmer {
          0% { background-position: -500px 0; }
          100% { background-position: 500px 0; }
        }
        @keyframes mr-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(22,101,52,.12); }
          50% { box-shadow: 0 0 0 8px rgba(22,101,52,0); }
        }
        .mr-enter { animation: mr-fade-up .36s ease-out both; }
        .mr-pop { animation: mr-pop .32s ease-out both; }
        .mr-skeleton {
          background: linear-gradient(90deg,#edf4f0 25%,#f8fbf9 37%,#edf4f0 63%);
          background-size: 900px 100%;
          animation: mr-shimmer 1.2s ease-in-out infinite;
        }
        .mr-action { transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease; }
        .mr-action:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(15,23,42,.08); }
        .mr-action:active { transform: scale(.97); }
        .mr-card { content-visibility: auto; contain-intrinsic-size: 220px; }
        @media (max-width: 639px) {
          .monthly-report-page { overflow-x: hidden; }
          .monthly-report-page input,
          .monthly-report-page select,
          .monthly-report-page button {
            -webkit-tap-highlight-color: transparent;
          }
          .monthly-report-page input,
          .monthly-report-page select {
            font-size: 16px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mr-enter,.mr-pop,.mr-skeleton { animation: none !important; }
          .mr-action { transition: none !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7">
        {/* HEADER */}
        <header className="mr-enter mb-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#063b2b] via-[#087346] to-[#0ca86a] p-4 text-white shadow-[0_18px_50px_rgba(6,59,43,.16)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg sm:h-16 sm:w-16">
                <img src="/logo.png" alt="Farm Fresh Dairy" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[.22em] text-emerald-100">
                  Farm Fresh Dairy · Admin
                </p>
                <h1 className="truncate text-2xl font-black tracking-tight sm:text-4xl">
                  Monthly Delivery Report
                </h1>
                <p className="mt-1 text-sm text-emerald-50/85 sm:text-base">
                  Customer delivery, billing & payment summary
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="mr-action min-h-11 rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-white/20"
              >
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>

              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mr-action min-h-11 w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-white/20 sm:w-28"
                aria-label="Report year"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customer name or phone..."
                aria-label="Search customers by name or phone number"
                className="min-h-11 w-full rounded-2xl border border-white/20 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter report by status"
              className="mr-action min-h-11 rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-white/20"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Stopped">Stopped</option>
            </select>
          </div>
        </header>

        {/* DELIVERY TABS */}
        <section className="mr-enter mb-5 grid grid-cols-2 gap-3" aria-label="Filter customers by delivery">
          <button
            type="button"
            onClick={() => setDeliveryTab("Delivered")}
            aria-pressed={deliveryTab === "Delivered"}
            className={`mr-action rounded-2xl border p-4 text-left shadow-sm transition ${
              deliveryTab === "Delivered"
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-emerald-100 bg-white text-slate-800 hover:bg-emerald-50"
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wide opacity-80">Delivered Customers</span>
            <span className="mt-1 block text-2xl font-black">{deliveredCustomers.length}</span>
            <span className="mt-1 block text-xs opacity-80">At least one completed delivery</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryTab("NotDelivered")}
            aria-pressed={deliveryTab === "NotDelivered"}
            className={`mr-action rounded-2xl border p-4 text-left shadow-sm transition ${
              deliveryTab === "NotDelivered"
                ? "border-rose-700 bg-rose-700 text-white"
                : "border-rose-100 bg-white text-slate-800 hover:bg-rose-50"
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wide opacity-80">Not Delivered Customers</span>
            <span className="mt-1 block text-2xl font-black">{notDeliveredCustomers.length}</span>
            <span className="mt-1 block text-xs opacity-80">Zero completed deliveries</span>
          </button>
        </section>

        {/* STATS */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ReportStat icon="👥" label="Customers" value={totalCustomers} delay="0ms" iconBg="bg-emerald-50" valueColor="text-emerald-700" />
          <ReportStat icon="🚚" label="Delivered" value={totalDelivered} delay="50ms" iconBg="bg-blue-50" valueColor="text-blue-700" />
          <ReportStat icon="✕" label="Missed" value={totalMissed} delay="100ms" iconBg="bg-rose-50" valueColor="text-rose-600" />
          <ReportStat icon="₹" label="Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} delay="150ms" iconBg="bg-emerald-50" valueColor="text-emerald-700" />
        </section>

        {/* PERIOD BAR */}
        <div className="mr-enter mb-5 flex items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-white px-4 py-3.5 shadow-sm sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">{deliveryTab === "Delivered" ? "Delivered Customers" : "Not Delivered Customers"} · Report Period</p>
            <p className="mt-1 truncate text-lg font-black">{monthName} {year}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
            {reportCustomers.length} {deliveryTab === "Delivered" ? "Delivered" : "Not Delivered"} Records
          </span>
        </div>

        {/* LOADING */}
        {loading && customers.length === 0 && (
          <div className="space-y-3">
            {[1,2,3,4].map((n) => (
              <div key={n} className="mr-skeleton h-24 rounded-3xl border border-white/70 sm:h-28" />
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && customers.length === 0 && <EmptyReport />}

        {!loading && customers.length > 0 && reportCustomers.length === 0 && (
          <div className="mr-pop rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">⌕</div>
            <h3 className="mt-4 text-xl font-black">No Records Found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              No {deliveryTab === "Delivered" ? "delivered" : "not delivered"} customers match your search and selected filters for {monthName} {year}.
            </p>
            <button
              type="button"
              onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
              className="mr-action mt-5 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* MOBILE */}
        {!loading && reportCustomers.length > 0 && (
          <div className="space-y-3 md:hidden">
            {reportCustomers.map((c, index) => (
              <MobileReportCard
                key={c.customerId || c.customer_id || c.subscriptionIds?.join('-') || index}
                customer={c}
                index={index}
                onView={handleViewBill}
                onDownload={handleDownloadInvoice}
                onShare={handleShareInvoice}
                onPrint={handlePrintInvoice}
                onWhatsapp={handleWhatsappInvoice}
                onPaid={handleMarkCustomerPaid}
              />
            ))}
          </div>
        )}

        {/* DESKTOP */}
        {!loading && reportCustomers.length > 0 && (
          <div className="mr-enter hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm md:block">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-600">Delivery ledger</p>
                <h2 className="mt-1 text-lg font-black">{deliveryTab === "Delivered" ? "Delivered customers" : "Not delivered customers"}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                {reportCustomers.length} customers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1450px]">
                <thead className="bg-[#087346] text-white">
                  <tr>
                    {["Customer Name", "Phone", "Delivered Days", "Missed Days", "Paused Days", "Pause Periods", "Normal Quantity", "Extra Quantity", "Delivery Amount", "Extra Amount", "Actions"].map((head) => (
                      <th key={head} className="whitespace-nowrap px-4 py-4 text-center text-xs font-black">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportCustomers.map((c, index) => {
                    const hasBill = Number(c.deliveredDays || 0) > 0;
                    return (
                      <tr
                        key={c.customerId || c.customer_id || c.subscriptionIds?.join('-') || index}
                        className="mr-enter border-b border-slate-100 transition hover:bg-emerald-50/40"
                        style={{ animationDelay: `${Math.min(index * 25, 300)}ms` }}
                      >
                        {/* <td className="whitespace-nowrap px-4 py-4 text-xs font-mono text-slate-600">{c.customerId || c.customer_id || "—"}</td> */}
                        <td className="whitespace-nowrap px-4 py-4 font-black">{c.customerName || c.customer_name || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-center">{c.phone || "—"}</td>
                        <td className="px-4 py-4 text-center"><CountBadge value={c.deliveredDays ?? c.delivered_days ?? 0} tone="green" /></td>
                        <td className="px-4 py-4 text-center"><CountBadge value={c.missedDays ?? c.missed_days ?? 0} tone="red" /></td>
                        <td className="px-4 py-4 text-center"><CountBadge value={c.pausedDays ?? c.paused_days ?? 0} tone="amber" /></td>
                        <td className="px-4 py-4 text-left text-xs">
                          {Array.isArray(c.pauseHistory) && c.pauseHistory.length
                            ? c.pauseHistory.map((pause, pauseIndex) => (
                                <div key={`${pause.subscriptionId || "sub"}-${pause.pauseFrom}-${pause.pauseTo}-${pauseIndex}`} className="whitespace-nowrap">
                                  {pause.pauseFrom} – {pause.pauseTo} ({pause.pausedDays} days)
                                </div>
                              ))
                            : "—"}
                        </td>
                        <td className="px-4 py-4 text-center font-black">{Number(c.normalQuantity ?? c.normal_quantity ?? c.quantity ?? 0)}</td>
                        <td className="px-4 py-4 text-center font-semibold">{Number(c.extraQuantity ?? c.extra_quantity ?? 0)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-center font-semibold">₹{Number(c.deliveryAmount || 0).toFixed(2)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-center font-semibold">₹{Number(c.extraAmount ?? c.extra_amount ?? 0).toFixed(2)}</td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-[310px] flex-wrap justify-center gap-2">
                            <ActionButton
                              label="View"
                              icon="👁"
                              onClick={() => handleViewBill(c)}
                              disabled={!hasBill}
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                            />

                            <ActionButton
                              label="PDF"
                              icon="▣"
                              onClick={() => handleDownloadInvoice(c)}
                              disabled={!hasBill}
                              className="bg-rose-600 text-white hover:bg-rose-700"
                            />

                            <ActionButton
                              label="Share PDF"
                              icon="↗"
                              onClick={() => handleShareInvoice(c)}
                              disabled={!hasBill}
                              className="bg-violet-600 text-white hover:bg-violet-700"
                            />

                            <ActionButton
                              label="Print"
                              icon="▤"
                              onClick={() => handlePrintInvoice(c)}
                              disabled={!hasBill}
                              className="bg-indigo-600 text-white hover:bg-indigo-700"
                            />

                            <ActionButton
                              label="WhatsApp"
                              icon="↗"
                              onClick={() => handleWhatsappInvoice(c)}
                              disabled={!hasBill}
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-emerald-50 text-slate-900">
                  <tr className="border-t-2 border-emerald-200 font-black">
                    <td colSpan={3} className="whitespace-nowrap px-4 py-4 text-right">MONTH TOTAL</td>
                    <td className="px-4 py-4 text-center">{totalDelivered}</td>
                    <td className="px-4 py-4 text-center">{totalMissed}</td>
                    <td className="px-4 py-4 text-center">{totalNormalQuantity}</td>
                    <td className="px-4 py-4 text-center">{totalExtraQuantity}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">₹{totalDeliveryAmount.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">₹{totalExtraAmount.toFixed(2)}</td>
                    <td className="px-4 py-4 text-center">₹{totalRevenue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      <MonthlyBillDrawer
        open={drawerOpen}
        details={selectedBill}
        month={month}
        year={year}
        onMarkPaid={handleMarkPaid}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

// ==================================================
// MOBILE REPORT CARD
// ==================================================

function MobileReportCard({
  customer,
  index,
  onView,
  onDownload,
  onShare,
  onPrint,
  onWhatsapp,
  onPaid,
}) {
  const c = customer;
  const [expanded, setExpanded] = useState(false);
  const hasBillableDelivery = Number(c.deliveredDays || 0) > 0;
  const isPaid = String(c.paymentStatus || "").toLowerCase() === "paid";

  return (
    <article
      className="mr-card mr-enter overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.06)]"
      style={{ animationDelay: `${Math.min(index * 35, 240)}ms` }}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mr-action flex min-h-[78px] w-full items-center justify-between gap-3 p-3.5 text-left sm:p-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 p-1.5 ring-1 ring-emerald-100">
            <img src="/logo.png" alt="Farm Fresh Dairy" className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-[15px] font-black text-slate-900">
                {c.customerName || "Customer"}
              </h2>
              {isPaid && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                  PAID
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
              {c.phone || "No phone"}
            </p>
            <p className="mt-1 truncate text-[11px] font-bold text-emerald-700">
              {c.product || "Milk"} · {c.quantity || 1} qty · ₹{Number(c.billAmount || 0).toFixed(0)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <SubscriptionBadge status={c.subscriptionStatus ?? c.status} />
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>
            ↓
          </span>
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-100 bg-slate-50/40 p-3.5 sm:p-5">

            <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 p-1.5">
                <img src="/logo.png" alt="Farm Fresh Dairy" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-600">Product</p>
                <p className="mt-0.5 truncate text-sm font-black text-slate-900">
                  {c.product || "Milk"} {c.size ? `· ${c.size}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-100">
              <p className="break-all text-[10px] font-semibold text-slate-500">Customer ID: {c.customerId || c.customer_id || "—"}</p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-amber-700">Pause history</p>
              {Array.isArray(c.pauseHistory) && c.pauseHistory.length
                ? c.pauseHistory.map((pause, pauseIndex) => (
                    <p key={`${pause.subscriptionId || "sub"}-${pause.pauseFrom}-${pause.pauseTo}-${pauseIndex}`} className="mt-1 text-xs text-slate-700">
                      {pause.pauseFrom} – {pause.pauseTo} · {pause.pausedDays} days
                    </p>
                  ))
                : <p className="mt-1 text-xs text-slate-500">No pause history for this month</p>}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="Delivered Days" value={c.deliveredDays || 0} icon="🚚" positive />
              <Metric label="Missed Days" value={c.missedDays || 0} icon="✕" negative />
              <Metric label="Paused Days" value={c.pausedDays || c.paused_days || 0} icon="⏸️" />
              <Metric label="Normal Quantity" value={c.normalQuantity ?? c.quantity ?? 0} icon="📦" />
              <Metric label="Extra Quantity" value={c.extraQuantity || 0} icon="➕" />
              <Metric label="Delivery Amount" value={`₹${Number(c.deliveryAmount ?? c.subtotal ?? 0).toFixed(2)}`} icon="₹" />
              <Metric label="Extra Amount" value={`₹${Number(c.extraAmount || 0).toFixed(2)}`} icon="₹" />
            </div>

            <div className="mt-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-white p-4 ring-1 ring-emerald-100">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Bill Amount</p>
                  <p className="mt-0.5 truncate text-2xl font-black text-emerald-700">
                    ₹{Number(c.billAmount || 0).toFixed(2)}
                  </p>
                </div>
                <PaymentBadge status={c.paymentStatus} noInvoice={!hasBillableDelivery} />
              </div>
            </div>

            {!hasBillableDelivery && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
                <p className="text-sm font-black text-slate-600">No Invoice for this period</p>
                <p className="mt-1 text-[11px] text-slate-500">No deliveries were completed.</p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <ActionButton label="View Bill" icon="👁" onClick={() => onView(c)} disabled={!hasBillableDelivery} className="bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50" />
              <ActionButton label="PDF" icon="▣" onClick={() => onDownload(c)} disabled={!hasBillableDelivery} className="bg-rose-600 text-white hover:bg-rose-700" />
              <ActionButton label="Share PDF" icon="↗" onClick={() => onShare(c)} disabled={!hasBillableDelivery} className="bg-violet-600 text-white hover:bg-violet-700" />
              <ActionButton label="Print" icon="▤" onClick={() => onPrint(c)} disabled={!hasBillableDelivery} className="bg-indigo-600 text-white hover:bg-indigo-700" />
              <ActionButton label="WhatsApp" icon="↗" onClick={() => onWhatsapp(c)} disabled={!hasBillableDelivery} className="col-span-2 bg-emerald-600 text-white hover:bg-emerald-700" />
            </div>

            {!isPaid ? (
              <button
                type="button"
                onClick={() => onPaid(c)}
                disabled={!hasBillableDelivery}
                className="mr-action mt-2 min-h-12 w-full rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ✓ Mark as Paid
              </button>
            ) : (
              <div className="mt-2 flex min-h-11 items-center justify-center rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                ✓ Payment Completed
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// STAT
// ==================================================

function ReportStat({ icon, label, value, delay, iconBg, valueColor }) {
  return (
    <div
      className="mr-enter rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">{label}</p>
          <p className={`mt-1 truncate text-2xl font-black sm:text-3xl ${valueColor}`}>{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl sm:h-14 sm:w-14 ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ==================================================
// METRIC
// ==================================================

function Metric({ label, value, icon, positive, negative }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-[11px] font-bold text-slate-500">{label}</p>
      </div>
      <p className={`mt-1 font-black ${positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function CountBadge({ value, tone }) {
  return (
    <span className={`inline-flex min-w-9 items-center justify-center rounded-full px-2.5 py-1 text-xs font-black ${tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
      {value}
    </span>
  );
}

// ==================================================
// PAYMENT BADGE
// ==================================================

function PaymentBadge({ status, noInvoice = false }) {
  if (noInvoice) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
        — No Invoice
      </span>
    );
  }

  const paid = String(status || "").toLowerCase() === "paid";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
      {paid ? "✓" : "●"} {status || "Pending"}
    </span>
  );
}

// ==================================================
// SUBSCRIPTION BADGE
// ==================================================

function SubscriptionBadge({ status }) {
  const active = String(status || "").toLowerCase() === "active";

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-black ${active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
      ● {status || "-"}
    </span>
  );
}

// ==================================================
// ACTION BUTTON
// ==================================================

function ActionButton({ label, icon, onClick, className, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mr-action min-h-11 rounded-xl px-3 py-2.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      <span className="mr-1">{icon}</span>{label}
    </button>
  );
}

// ==================================================
// EMPTY
// ==================================================

function EmptyReport() {
  return (
    <div className="mr-pop rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-16">
      <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-emerald-50 p-3">
        <img src="/logo.png" alt="Farm Fresh Dairy" className="h-full w-full object-contain" />
      </div>
      <h2 className="mt-5 text-xl font-black sm:text-2xl">No Report Found</h2>
      <p className="mt-2 text-sm text-slate-500">No delivery records found for the selected month.</p>
    </div>
  );
}
