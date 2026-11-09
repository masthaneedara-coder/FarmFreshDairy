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
    <div className="monthly-report-page relative isolate min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f0fdf4_0%,#eff6ff_48%,#fdf2f8_100%)] text-slate-900">
      <style>{`
        @keyframes mr-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mr-pop { 0% { opacity: 0; transform: scale(.96); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes mr-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @keyframes mr-float { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(14px,-16px,0) scale(1.06); } }
        @keyframes mr-glow { 0%,100% { box-shadow: 0 8px 24px rgba(16,185,129,.10); } 50% { box-shadow: 0 12px 34px rgba(59,130,246,.18); } }
        @keyframes mr-button-shine { from { transform: translateX(-140%) skewX(-18deg); } to { transform: translateX(240%) skewX(-18deg); } }
        .mr-enter { animation: mr-fade-up .42s cubic-bezier(.2,.75,.25,1) both; }
        .mr-pop { animation: mr-pop .34s ease-out both; }
        .mr-skeleton { background: linear-gradient(90deg,#e7f5ed 25%,#f8fbff 37%,#e7f5ed 63%); background-size: 900px 100%; animation: mr-shimmer 1.2s ease-in-out infinite; }
        .mr-orb { position:absolute; pointer-events:none; border-radius:9999px; filter:blur(2px); opacity:.55; animation:mr-float 9s ease-in-out infinite; }
        .mr-header { position:relative; isolation:isolate; background:linear-gradient(120deg,#064e3b 0%,#047857 35%,#0284c7 72%,#7c3aed 115%); background-size:180% 180%; animation:mr-glow 6s ease-in-out infinite; }
        .mr-header::after { content:''; position:absolute; inset:0; z-index:-1; pointer-events:none; background:radial-gradient(circle at 90% 0%,rgba(255,255,255,.22),transparent 28%),linear-gradient(115deg,transparent 35%,rgba(255,255,255,.09) 50%,transparent 65%); }
        .mr-action { position:relative; transition:transform .2s ease,box-shadow .2s ease,filter .2s ease,background-color .2s ease; }
        .mr-action:hover { transform:translateY(-2px); box-shadow:0 10px 22px rgba(15,23,42,.12); filter:saturate(1.08); }
        .mr-action:active { transform:scale(.97); }
        .mr-button { position:relative; isolation:isolate; overflow:hidden; transition:transform .18s ease,box-shadow .18s ease,filter .18s ease; }
        .mr-button::after { content:''; position:absolute; inset:-30% auto -30% -40%; width:34%; background:rgba(255,255,255,.22); transform:translateX(-140%) skewX(-18deg); pointer-events:none; }
        .mr-button:hover::after { animation:mr-button-shine .65s ease; }
        .mr-button:hover { transform:translateY(-2px); box-shadow:0 8px 18px rgba(15,23,42,.18); filter:saturate(1.1); }
        .mr-card { content-visibility:auto; contain-intrinsic-size:220px; border-color:rgba(148,163,184,.24); box-shadow:0 8px 28px rgba(30,64,175,.07); }
        .mr-customer-card { background:linear-gradient(145deg,#ffffff 0%,#f8fbff 58%,#f0fdf4 100%); }
        .mr-customer-card:nth-child(3n+2) { background:linear-gradient(145deg,#ffffff 0%,#f5f3ff 100%); }
        .mr-customer-card:nth-child(3n+3) { background:linear-gradient(145deg,#ffffff 0%,#fff7ed 100%); }
        .mr-metric-grid > div:nth-child(4n+1) { background:linear-gradient(135deg,#ecfdf5,#f0fdfa); border-color:#bbf7d0; }
        .mr-metric-grid > div:nth-child(4n+2) { background:linear-gradient(135deg,#eff6ff,#eef2ff); border-color:#bfdbfe; }
        .mr-metric-grid > div:nth-child(4n+3) { background:linear-gradient(135deg,#fff1f2,#fff7ed); border-color:#fecdd3; }
        .mr-metric-grid > div:nth-child(4n+4) { background:linear-gradient(135deg,#faf5ff,#fdf2f8); border-color:#e9d5ff; }
        .mr-stat { position:relative; overflow:hidden; border:1px solid transparent; box-shadow:0 8px 22px rgba(15,23,42,.06); }
        .mr-stat::after { content:''; position:absolute; width:110px; height:110px; border-radius:50%; right:-42px; top:-48px; background:rgba(255,255,255,.52); }
        .mr-stat:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 16px 28px rgba(15,23,42,.11); }
        .mr-stat[data-tone='green'] { background:linear-gradient(135deg,#dcfce7,#f0fdf4); border-color:#bbf7d0; }
        .mr-stat[data-tone='blue'] { background:linear-gradient(135deg,#dbeafe,#eff6ff); border-color:#bfdbfe; }
        .mr-stat[data-tone='rose'] { background:linear-gradient(135deg,#ffe4e6,#fff1f2); border-color:#fecdd3; }
        .mr-stat[data-tone='violet'] { background:linear-gradient(135deg,#ede9fe,#faf5ff); border-color:#ddd6fe; }
        .mr-period { background:linear-gradient(100deg,#ecfdf5,#eff6ff 55%,#faf5ff); border:1px solid #d1fae5; }
        .mr-data-table thead { background:linear-gradient(90deg,#047857,#0284c7,#6d28d9); }
        .mr-data-table tbody tr:nth-child(even) { background:#f8fafc; }
        .mr-data-table tbody tr:hover { background:#ecfdf5; }
        @media (max-width:639px) {
          .monthly-report-page { overflow-x:hidden; }
          .monthly-report-page input,.monthly-report-page select,.monthly-report-page button { -webkit-tap-highlight-color:transparent; }
          .monthly-report-page input,.monthly-report-page select { font-size:16px; }
          .mr-header { border-radius:20px; }
          .mr-stat { border-radius:16px; }
          .mr-action:hover,.mr-button:hover { transform:none; }
        }
        @media (max-width:360px) {
          .mr-customer-card .mr-metric-grid { gap:5px; }
          .mr-customer-card .mr-metric-grid > div { padding:7px; border-radius:10px; }
          .mr-customer-card .mr-metric-grid > div p { font-size:9px; }
          .mr-customer-card .mr-button { padding-left:6px; padding-right:6px; font-size:9px; }
        }
        @media (prefers-reduced-motion:reduce) {
          .mr-enter,.mr-pop,.mr-skeleton,.mr-orb,.mr-header { animation:none !important; }
          .mr-action,.mr-button,.mr-stat { transition:none !important; }
          .mr-button:hover::after { animation:none !important; }
        }
      `}</style>

      <div aria-hidden="true" className="mr-orb left-[-70px] top-24 h-56 w-56 bg-emerald-200/70" />
      <div aria-hidden="true" className="mr-orb right-[-80px] top-[32rem] h-64 w-64 bg-sky-200/70" style={{ animationDelay: "-3s" }} />
      <div aria-hidden="true" className="mr-orb bottom-10 left-[38%] h-44 w-44 bg-fuchsia-200/50" style={{ animationDelay: "-6s" }} />
      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-2.5 py-2.5 sm:px-5 sm:py-6 lg:px-7">
        {/* HEADER */}
        <header className="mr-header mr-enter mb-3 overflow-hidden rounded-[20px] p-3 text-white shadow-[0_14px_36px_rgba(6,59,43,.16)] sm:mb-5 sm:rounded-[28px] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg ring-4 ring-white/15 sm:h-16 sm:w-16">
                <img src="/logo.png" alt="Farm Fresh Dairy" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-black uppercase tracking-[.22em] text-emerald-100">
                  Farm Fresh Dairy · Admin
                </p>
                <h1 className="truncate text-lg font-black tracking-tight drop-shadow-sm sm:text-4xl">
                  Monthly Delivery Report
                </h1>
                <p className="mt-0.5 text-[11px] text-emerald-50/90 sm:mt-1 sm:text-base">
                  Customer delivery, billing & payment summary
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 lg:min-w-[280px] lg:justify-end">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="mr-action min-h-10 rounded-xl border border-white/20 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-white/20 sm:min-h-11 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              >
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>

              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mr-action min-h-10 w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-white/20 sm:min-h-11 sm:w-28 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                aria-label="Report year"
              />
            </div>
          </div>

          <div className="mt-2.5 grid gap-1.5 sm:mt-4 sm:grid-cols-[1fr_auto] sm:gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customer name or phone..."
                aria-label="Search customers by name or phone number"
                className="min-h-10 w-full rounded-xl border border-white/20 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/20 sm:min-h-11 sm:rounded-2xl sm:pl-10 sm:pr-4 sm:text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter report by status"
              className="mr-action min-h-10 rounded-xl border border-white/20 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-4 focus:ring-white/20 sm:min-h-11 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
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
        <section className="mr-enter mb-4 grid grid-cols-2 gap-2.5 sm:mb-5 sm:gap-3" aria-label="Filter customers by delivery">
          <button
            type="button"
            onClick={() => setDeliveryTab("Delivered")}
            aria-pressed={deliveryTab === "Delivered"}
            className={`mr-action rounded-[20px] border p-3 text-left shadow-sm transition sm:rounded-2xl sm:p-4 ${
              deliveryTab === "Delivered"
                ? "border-emerald-600 bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-200/70"
                : "border-emerald-200 bg-gradient-to-br from-white to-emerald-50 text-slate-800 hover:bg-emerald-50"
            }`}
          >
            <span className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-sm sm:h-7 sm:w-7 sm:rounded-lg sm:text-base">🚚</span><span className="block text-[9px] font-black uppercase tracking-wide opacity-85 sm:text-xs">Delivered Customers</span>
            <span className="mt-0.5 block text-lg font-black sm:text-2xl">{deliveredCustomers.length}</span>
            <span className="mt-0.5 block text-[9px] opacity-85 sm:mt-1 sm:text-xs">At least one completed delivery</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryTab("NotDelivered")}
            aria-pressed={deliveryTab === "NotDelivered"}
            className={`mr-action rounded-[20px] border p-3 text-left shadow-sm transition sm:rounded-2xl sm:p-4 ${
              deliveryTab === "NotDelivered"
                ? "border-rose-600 bg-gradient-to-br from-rose-600 to-orange-500 text-white shadow-lg shadow-rose-200/70"
                : "border-rose-200 bg-gradient-to-br from-white to-rose-50 text-slate-800 hover:bg-rose-50"
            }`}
          >
            <span className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-sm sm:h-7 sm:w-7 sm:rounded-lg sm:text-base">⚠️</span><span className="block text-[9px] font-black uppercase tracking-wide opacity-85 sm:text-xs">Not Delivered</span>
            <span className="mt-0.5 block text-lg font-black sm:text-2xl">{notDeliveredCustomers.length}</span>
            <span className="mt-0.5 block text-[9px] opacity-85 sm:mt-1 sm:text-xs">Zero completed deliveries</span>
          </button>
        </section>

        {/* STATS */}
        <section className="mb-3 grid grid-cols-2 gap-2 sm:mb-5 sm:gap-3 lg:grid-cols-4">
          <ReportStat icon="👥" label="Customers" value={totalCustomers} delay="0ms" iconBg="bg-emerald-50" valueColor="text-emerald-700" />
          <ReportStat icon="🚚" label="Delivered" value={totalDelivered} delay="50ms" iconBg="bg-blue-50" valueColor="text-blue-700" />
          <ReportStat icon="✕" label="Missed" value={totalMissed} delay="100ms" iconBg="bg-rose-50" valueColor="text-rose-600" />
          <ReportStat icon="₹" label="Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} delay="150ms" iconBg="bg-emerald-50" valueColor="text-emerald-700" />
        </section>

        {/* PERIOD BAR */}
        <div className="mr-period mr-enter mb-3 flex items-center justify-between gap-2 rounded-2xl px-2.5 py-2.5 shadow-sm sm:mb-5 sm:rounded-3xl sm:px-5 sm:py-3.5">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[.12em] text-emerald-700 sm:text-[10px] sm:tracking-[.18em]">{deliveryTab === "Delivered" ? "Delivered Customers" : "Not Delivered Customers"} · Report Period {refreshing ? "· Updating…" : ""}</p>
            <p className="mt-0.5 truncate text-sm font-black sm:mt-1 sm:text-lg">{monthName} {year}</p>
          </div>
          <span className="max-w-[118px] shrink-0 truncate rounded-full border border-emerald-200 bg-white/80 px-2 py-1 text-[9px] font-black text-emerald-700 sm:max-w-none sm:px-3 sm:py-1.5 sm:text-xs">
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
          <div className="space-y-2.5 md:hidden">
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
          <div className="mr-enter hidden overflow-hidden rounded-[26px] border border-white/80 bg-white/95 shadow-[0_16px_42px_rgba(15,23,42,.08)] backdrop-blur md:block">
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
              <table className="mr-data-table w-full min-w-[1450px]">
                <thead className="text-white">
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
                        className="mr-enter border-b border-slate-100 transition-colors hover:bg-emerald-50"
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
                <tfoot className="bg-gradient-to-r from-emerald-100 via-sky-50 to-violet-100 text-slate-900">
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
      className="mr-card mr-customer-card mr-enter overflow-hidden rounded-[18px] border shadow-[0_6px_20px_rgba(15,23,42,.06)]"
      style={{ animationDelay: `${Math.min(index * 35, 240)}ms` }}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mr-action flex min-h-[58px] w-full items-center justify-between gap-2 p-2.5 text-left sm:min-h-[78px] sm:gap-3 sm:p-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 p-1 ring-1 ring-emerald-100 sm:h-11 sm:w-11 sm:rounded-2xl sm:p-1.5">
            <img src="/logo.png" alt="Farm Fresh Dairy" className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <h2 className="truncate text-[13px] font-black text-slate-900 sm:text-[15px]">
                {c.customerName || "Customer"}
              </h2>
              {isPaid && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-black leading-tight text-emerald-700 sm:px-2 sm:text-[9px]">
                  PAID
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500 sm:text-[11px]">
              {c.phone || "No phone"}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-bold text-emerald-700 sm:mt-1 sm:text-[11px]">
              {c.product || "Milk"} · {c.quantity || 1} qty · ₹{Number(c.billAmount || 0).toFixed(0)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <SubscriptionBadge status={c.subscriptionStatus ?? c.status} />
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500 transition-transform duration-300 sm:h-9 sm:w-9 sm:rounded-xl sm:text-base ${expanded ? "rotate-180" : ""}`} >
            ↓
          </span>
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-white/80 bg-gradient-to-br from-slate-50/90 via-white/80 to-emerald-50/60 p-2.5 sm:p-5">

            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-50 to-white p-2.5 ring-1 ring-emerald-100 sm:gap-3 sm:rounded-2xl sm:p-3.5">
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

            <div className="mt-2 rounded-xl bg-gradient-to-br from-amber-50 to-white p-2.5 ring-1 ring-amber-100 sm:mt-3 sm:rounded-2xl sm:p-3">
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

            <div className="mr-metric-grid mt-3 grid grid-cols-2 gap-2">
              <Metric label="Delivered Days" value={c.deliveredDays || 0} icon="🚚" positive />
              <Metric label="Missed Days" value={c.missedDays || 0} icon="✕" negative />
              <Metric label="Paused Days" value={c.pausedDays || c.paused_days || 0} icon="⏸️" />
              <Metric label="Normal Quantity" value={c.normalQuantity ?? c.quantity ?? 0} icon="📦" />
              <Metric label="Extra Quantity" value={c.extraQuantity || 0} icon="➕" />
              <Metric label="Delivery Amount" value={`₹${Number(c.deliveryAmount ?? c.subtotal ?? 0).toFixed(2)}`} icon="₹" />
              <Metric label="Extra Amount" value={`₹${Number(c.extraAmount || 0).toFixed(2)}`} icon="₹" />
            </div>

            <div className="mt-2 rounded-xl bg-gradient-to-r from-emerald-100 via-white to-cyan-50 p-3 ring-1 ring-emerald-200 shadow-sm sm:mt-3 sm:rounded-2xl sm:p-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Bill Amount</p>
                  <p className="mt-0.5 truncate text-xl font-black text-emerald-700 sm:text-2xl">
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

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2">
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
                className="mr-action mt-1.5 min-h-10 w-full rounded-xl bg-emerald-800 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:mt-2 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              >
                ✓ Mark as Paid
              </button>
            ) : (
              <div className="mt-1.5 flex min-h-9 items-center justify-center rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 sm:mt-2 sm:min-h-11 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
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
  const tone = label === "Customers" ? "green" : label === "Delivered" ? "blue" : label === "Missed" ? "rose" : "violet";
  return (
    <div
      data-tone={tone}
      className="mr-stat mr-enter rounded-2xl p-2.5 transition duration-300 sm:rounded-3xl sm:p-5"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="relative z-10 text-[10px] font-bold text-slate-600 sm:text-sm">{label}</p>
          <p className={`relative z-10 mt-0.5 truncate text-lg font-black sm:mt-1 sm:text-3xl ${valueColor}`}>{value}</p>
        </div>
        <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl ${iconBg}`}>
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
    <div className="rounded-xl border p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl sm:p-3">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-sm sm:text-base">{icon}</span>
        <p className="text-[9px] font-bold leading-tight text-slate-500 sm:text-[11px]">{label}</p>
      </div>
      <p className={`mt-0.5 text-sm font-black sm:mt-1 sm:text-base ${positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-slate-900"}`} >{value}</p>
    </div>
  );
}

function CountBadge({ value, tone }) {
  const toneClass = tone === "green" ? "bg-emerald-100 text-emerald-700" : tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-600";
  return (
    <span className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black leading-tight sm:min-w-9 sm:px-2.5 sm:py-1 sm:text-xs ${toneClass}`} >
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
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black leading-tight text-slate-500 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
        — No Invoice
      </span>
    );
  }

  const paid = String(status || "").toLowerCase() === "paid";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black leading-tight ring-1 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs ${paid ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-amber-100 text-amber-800 ring-amber-200"}`} >
      {paid ? "✓" : "●"} {status || "Pending"}
    </span>
  );
}

// ==================================================
// SUBSCRIPTION BADGE
// ==================================================

function SubscriptionBadge({ status }) {
  const value = String(status || "-").toLowerCase();
  const tone = value === "active" ? "bg-emerald-100 text-emerald-700" : value === "paused" ? "bg-amber-100 text-amber-700" : value === "stopped" || value.includes("cancel") ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex max-w-[88px] items-center gap-1 whitespace-nowrap truncate rounded-full px-1.5 py-1 text-[8px] font-black leading-tight sm:max-w-none sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[11px] ${tone}`} >
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
      className={`mr-action mr-button min-h-9 rounded-lg px-2 py-1.5 text-[10px] font-black leading-tight shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:min-h-11 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-xs ${className}`} 
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
