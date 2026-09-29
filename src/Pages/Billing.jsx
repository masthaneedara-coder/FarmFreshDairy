import {

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  ArrowLeft,

  Receipt,

  RefreshCw,

  CreditCard,

  Download,

  Printer,

  Share2,

  Clock3,

  CheckCircle2,

  AlertCircle,

} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getCustomer } from "../config/auth";

import { fetchDashboard } from "../services/dashboardService";

const API_URL = "https://farmfreshdairy.onrender.com/api";

const RAZORPAY_KEY_ID = String(
  import.meta.env.VITE_RAZORPAY_KEY_ID || ""
).trim();

import {

  downloadInvoicePDF,

  shareInvoicePDF,

  printInvoice,

} from "../utils/invoicePdf";

export default function Billing() {

  const navigate = useNavigate();

  const [billing, setBilling] =

    useState(null);

  const [loading, setLoading] =

    useState(true);

  const [actionLoading, setActionLoading] =

    useState("");

  // ======================================

  // Load Billing

  // ======================================

  useEffect(() => {

    loadBilling();

  }, []);

  async function loadBilling() {

    try {

      setLoading(true);

      const customer =

        getCustomer();

      if (!customer?.id) {

        navigate("/auth");

        return;

      }

      const dashboard =

        await fetchDashboard(

          customer.id

        );

      setBilling(

        dashboard?.billing ||

          null

      );

    } catch (error) {

      console.error(

        "Billing loading error:",

        error

      );

      setBilling(null);

    } finally {

      setLoading(false);

    }

  }

  // ======================================

  // Bills

  // ======================================

  const bills = useMemo(

    () =>

      Array.isArray(

        billing?.bills

      )

        ? billing.bills

        : [],

    [billing]

  );

  // Latest/current unpaid bill

  const currentBill =

    bills[0] || null;

  // Actual outstanding returned

  // by backend

  const outstanding = Number(
    billing?.outstanding || 0
  );

  // Subscription plan pricing. Prefer values returned by the backend.
  // Do not invent a discount or subscription price in the UI.
  const subscription = currentBill?.subscription ?? billing?.subscription ?? {};

  const originalPlanAmount = Number(
    currentBill?.original_amount ??
      currentBill?.original_plan_amount ??
      subscription?.original_amount ??
      subscription?.original_plan_amount ??
      currentBill?.subscription_total_amount ??
      subscription?.subscription_total_amount ??
      0
  );

  const planDiscount = Number(
    currentBill?.discount_amount ??
      subscription?.discount_amount ??
      currentBill?.coupon_discount ??
      subscription?.coupon_discount ??
      currentBill?.discount ??
      subscription?.discount ??
      0
  );

  const couponCode =
    currentBill?.coupon_code ??
    subscription?.coupon_code ??
    "";

  const finalPlanAmount = Number(
    currentBill?.final_subscription_amount ??
      subscription?.final_subscription_amount ??
      subscription?.total_amount ??
      Math.max(0, originalPlanAmount - planDiscount)
  );

  // ======================================

  // Money

  // ======================================

  function formatMoney(

    amount

  ) {

    return `₹${Number(

      amount || 0

    ).toLocaleString(

      "en-IN",

      {

        minimumFractionDigits: 0,

        maximumFractionDigits: 2,

      }

    )}`;

  }

  // ======================================

  // Date

  // ======================================

  function formatDate(

    value

  ) {

    if (!value) {

      return "-";

    }

    const date =

      new Date(value);

    if (

      Number.isNaN(

        date.getTime()

      )

    ) {

      return "-";

    }

    return date.toLocaleDateString(

      "en-IN",

      {

        day: "2-digit",

        month: "short",

        year: "numeric",

      }

    );

  }

  // ======================================

  // Invoice Number

  // ======================================

  function getInvoiceNumber(

    bill

  ) {

    return (

      bill?.invoice_number ||

      bill?.invoiceNumber ||

      `INV-${String(

        bill?.id || ""

      ).slice(0, 8)}`

    );

  }

  // ======================================

  // Payment Status

  // ======================================

  function getPaymentStatus(

    bill

  ) {

    return (

      bill?.payment_status ||

      bill?.paymentStatus ||

      "Pending"

    );

  }

  // ======================================

  // Delivery Status CSS

  // ======================================

  function getStatusClass(

    status

  ) {

    const value =

      String(

        status || ""

      )

        .trim()

        .toLowerCase();

    if (

      value ===

      "delivered"

    ) {

      return "bg-emerald-100 text-emerald-700";

    }

    if (

      value === "missed" ||

      value ===

        "cancelled"

    ) {

      return "bg-red-100 text-red-700";

    }

    if (

      value === "assigned"

    ) {

      return "bg-amber-100 text-amber-700";

    }

    return "bg-slate-100 text-slate-600";

  }

  // ======================================

  // Download PDF

  // ======================================

  async function handleDownload(

    bill

  ) {

    try {

      setActionLoading(`download-${bill.id}`);

      // IMPORTANT:

      // Pass the complete bill object.

      // No invoice DOM ID required.

      await downloadInvoicePDF(

        bill

      );

    } catch (error) {

      console.error(

        "PDF download error:",

        error

      );

      alert(

        error?.message ||

          "Failed to generate invoice PDF."

      );

    } finally {

      setActionLoading("");

    }

  }

  // ======================================

  // Share PDF

  // ======================================

  async function handleShare(

    bill

  ) {

    try {

      setActionLoading(

        `share-${bill.id}`

      );

      await shareInvoicePDF(

        bill

      );

    } catch (error) {

      console.error(

        "PDF share error:",

        error

      );

      alert(

        error?.message ||

          "Failed to share invoice PDF."

      );

    } finally {

      setActionLoading("");

    }

  }

  // ======================================

  // Print

  // ======================================

  async function handlePrint(

    bill

  ) {

    try {

      setActionLoading(

        `print-${bill.id}`

      );

      await printInvoice(

        bill

      );

    } catch (error) {

      console.error(

        "Print error:",

        error

      );

      alert(

        error?.message ||

          "Failed to print invoice."

      );

    } finally {

      setActionLoading("");

    }

  }

  // ======================================

  // Payment

  // ======================================

  async function loadRazorpayScript() {

    if (window.Razorpay) return true;

    return await new Promise((resolve) => {

      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');

      if (existing) {

        existing.addEventListener("load", () => resolve(true), { once: true });

        existing.addEventListener("error", () => resolve(false), { once: true });

        return;

      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);

    });

  }

  async function postJSON(url, body) {

    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);

    return data;

  }

  async function handlePayment() {

    const customer = getCustomer();

    if (!customer?.id) { navigate("/auth"); return; }

    if (!currentBill?.id) { alert("No outstanding billing record was found."); return; }

    if (outstanding <= 0) { alert("There is no outstanding amount to pay."); return; }

    if (!RAZORPAY_KEY_ID) { alert("Razorpay key is not configured. Please contact support."); return; }

    try {

      setActionLoading(`payment-${currentBill.id}`);

      // Send the actual unpaid delivery balance, not the subscription plan price.
      const outstandingAmount = Number(outstanding.toFixed(2));
      const expectedAmountPaise = Math.round(outstandingAmount * 100);
      const orderResponse = await postJSON(`${API_URL}/payments/create-billing-order`, {
        billing_id: currentBill.id,
        customer_id: customer.id,
        amount: outstandingAmount,
        amount_paise: expectedAmountPaise,
        payment_for: "outstanding"
      });

      const razorpayOrder = orderResponse?.order || orderResponse?.data?.order || orderResponse?.data;

      if (!razorpayOrder?.id) throw new Error("Razorpay billing order was not created.");

      if (!Number(razorpayOrder.amount)) throw new Error("Invalid Razorpay billing amount.");

      // Never open Razorpay if the backend order amount differs from the
      // customer's current outstanding amount (Razorpay uses paise).
      if (Number(razorpayOrder.amount) !== expectedAmountPaise) {
        throw new Error(
          `Payment amount mismatch. Current outstanding is ${formatMoney(outstandingAmount)}, but the payment order is ${formatMoney(Number(razorpayOrder.amount) / 100)}. Please contact support; no payment was started.`
        );
      }

      if (!(await loadRazorpayScript())) throw new Error("Unable to load Razorpay Checkout.");

      await new Promise((resolve, reject) => {

        const options = {

          key: RAZORPAY_KEY_ID, amount: razorpayOrder.amount, currency: razorpayOrder.currency || "INR",

          name: "Farm Fresh Dairy", description: `Postpaid Billing - ${getInvoiceNumber(currentBill)}`, order_id: razorpayOrder.id,

          prefill: { name: customer.full_name || customer.name || currentBill.customer_name || "", email: customer.email || currentBill.customer_email || "", contact: customer.phone || currentBill.customer_phone || "" },

          theme: { color: "#2563eb" },

          handler: async (paymentResponse) => {

            try {

              const verification = await postJSON(`${API_URL}/payments/verify-billing`, {

                billing_id: currentBill.id, customer_id: customer.id, razorpay_order_id: paymentResponse?.razorpay_order_id, razorpay_payment_id: paymentResponse?.razorpay_payment_id, razorpay_signature: paymentResponse?.razorpay_signature,

              });

              if (!verification?.success) throw new Error(verification?.message || "Billing payment verification failed.");

              resolve(verification);

            } catch (error) { reject(error); }

          },

          modal: { ondismiss: () => { const error = new Error("Payment cancelled by customer."); error.name = "PaymentCancelled"; reject(error); } },

        };

        const razorpay = new window.Razorpay(options);

        razorpay.on("payment.failed", (response) => reject(new Error(response?.error?.description || "Razorpay payment failed.")));

        razorpay.open();

      });

      alert("Payment successful. Your billing has been updated.");

      await loadBilling();

    } catch (error) {

      if (error?.name !== "PaymentCancelled") { console.error("Billing payment error:", error); alert(error?.message || "Billing payment failed."); }

    } finally { setActionLoading(""); }

  }

  // ======================================

  // Loading

  // ======================================

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-blue-50">

        <div className="text-center">

          <RefreshCw

            size={30}

            className="mx-auto animate-spin text-blue-600"

          />

          <p className="mt-3 font-semibold text-slate-700">

            Loading billing...

          </p>

        </div>

      </div>

    );

  }

  // ======================================

  // Page

  // ======================================

  return (

    <div className="billing-page min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-3 py-4 sm:px-4 sm:py-6 md:py-10">
      <style>{`
        .billing-page { animation: billingEnter .4s ease-out both; padding-bottom: max(1.25rem, env(safe-area-inset-bottom)); }
        @keyframes billingEnter { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .billing-page button { -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:transform .16s ease, box-shadow .2s ease, filter .2s ease; }
        .billing-page button:active { transform:scale(.98); }
        .billing-page section, .billing-page .bg-white { min-width:0; }
        .billing-page .max-w-6xl { width:100%; }
        .billing-page h1 { letter-spacing:-.035em; }
        .billing-page .rounded-3xl { border-radius:clamp(1.15rem,3vw,1.5rem); }
        .billing-page button:focus-visible { outline:3px solid rgba(16,185,129,.45); outline-offset:3px; }
        .billing-page .overflow-x-auto { -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
        .billing-page table th, .billing-page table td { white-space:nowrap; }
        .billing-page .grid { min-width:0; }
        @media(max-width:640px) {
          .billing-page .max-w-6xl { max-width:100%; }
          .billing-page .flex.items-center.gap-3.mb-6 { align-items:flex-start; gap:.65rem; margin-bottom:1rem; }
          .billing-page .flex.items-center.gap-3.mb-6 > button { flex:0 0 44px; width:44px;height:44px; }
          .billing-page .flex.items-center.gap-3.mb-6 h1 { font-size:1.55rem; line-height:1.15; }
          .billing-page .flex.items-center.gap-3.mb-6 p { font-size:.8rem; line-height:1.35; margin-top:.35rem; }
          .billing-page section.relative.overflow-hidden { padding:1.15rem; }
          .billing-page section.relative.overflow-hidden h2 { font-size:2.35rem; line-height:1.05; overflow-wrap:anywhere; }
          .billing-page section.relative.overflow-hidden .mt-8 { margin-top:1.5rem; }
          .billing-page .grid.grid-cols-1.md\\:grid-cols-2 { gap:.7rem; margin-top:.85rem; }
          .billing-page .grid.grid-cols-1.md\\:grid-cols-2 > div { padding:1rem; border-radius:1rem; }
          .billing-page .grid.grid-cols-1.md\\:grid-cols-2 > div p.text-3xl { font-size:1.7rem; }
          .billing-page section.mt-6.bg-white { margin-top:1rem; border-radius:1.15rem; }
          .billing-page section.mt-6.bg-white > .p-5, .billing-page section.mt-6.bg-white > .p-5.md\\:p-6 { padding:1rem; }
          .billing-page .rounded-2xl.bg-slate-50.p-5,
          .billing-page .rounded-2xl.bg-blue-50.p-5,
          .billing-page .rounded-2xl.bg-emerald-50.p-5 { padding:.9rem; }
          .billing-page .grid.grid-cols-2.md\\:grid-cols-4 { grid-template-columns:repeat(2,minmax(0,1fr)); gap:.8rem; }
          .billing-page .grid.grid-cols-1.sm\\:grid-cols-3 { grid-template-columns:minmax(0,1fr); gap:.75rem; }
          .billing-page .grid.grid-cols-1.sm\\:grid-cols-3 > div { overflow-wrap:anywhere; }
          .billing-page .mt-6.rounded-2xl.bg-slate-50.p-5 { padding:1rem; }
          .billing-page .mt-6.rounded-2xl.bg-slate-50.p-5 .text-xl { font-size:1rem; }
          .billing-page .mt-6.rounded-2xl.bg-slate-50.p-5 .text-2xl { font-size:1.3rem; }
          .billing-page .grid.grid-cols-1.sm\\:grid-cols-3.gap-3.mt-6 { grid-template-columns:minmax(0,1fr); }
          .billing-page .grid.grid-cols-1.sm\\:grid-cols-3.gap-3.mt-6 button { min-height:50px; }
          .billing-page .w-full.mt-4.min-h-\\[54px\\] { position:sticky; bottom:max(.5rem,env(safe-area-inset-bottom)); z-index:10; box-shadow:0 8px 28px rgba(37,99,235,.28); }
          .billing-page .mt-6.bg-white.rounded-2xl.p-5 { padding:1rem; }
          .billing-page .flex.justify-between { gap:1rem; }
          .billing-page .flex.justify-between > :last-child { text-align:right; }
          .billing-page .overflow-x-auto table { min-width:700px; }
        }
        @media(prefers-reduced-motion:reduce) {
          .billing-page, .billing-page * { animation:none !important; transition:none !important; scroll-behavior:auto !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">

        {/* ==================================

            Header

        ================================== */}

        <div className="flex items-center gap-3 mb-6">

          <button

            type="button"

            onClick={() =>

              navigate("/dashboard")

            }

            className="w-11 h-11 rounded-full bg-white shadow flex items-center justify-center hover:bg-slate-50"

          >

            <ArrowLeft size={20} />

          </button>

          <div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900">

              My Billing

            </h1>

            <p className="text-sm md:text-base text-slate-500">

              View your monthly postpaid billing and invoices

            </p>

          </div>

        </div>

        {/* ==================================

            Outstanding

        ================================== */}

        <section className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-blue-800 via-blue-700 to-sky-500 text-white shadow-xl">

          <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/10" />

          <div className="relative">

            <div className="flex justify-between items-start gap-4">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">

                  <Receipt size={25} />

                </div>

                <div>

                  <p className="font-bold text-lg">

                    FarmFreshDairy Billing

                  </p>

                  <span className="text-xs font-bold opacity-80">

                    POSTPAID

                  </span>

                </div>

              </div>

              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">

                Postpaid

              </span>

            </div>

            <div className="mt-8">

              <p className="text-xs uppercase tracking-widest opacity-80 font-bold">

                Outstanding Amount

              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-2">

                {formatMoney(

                  outstanding

                )}

              </h2>

            </div>

            <p className="mt-4 text-sm opacity-90">

              Only delivered COD/Postpaid deliveries are included in your outstanding amount.

            </p>

            {currentBill && (

              <p className="mt-3 text-sm font-semibold">

                Invoice:{" "}

                {getInvoiceNumber(

                  currentBill

                )}

              </p>

            )}

          </div>

        </section>

        {/* ==================================

            Summary

        ================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">

              Outstanding Bills

            </p>

            <p className="text-3xl font-black text-slate-900 mt-2">

              {billing?.billCount || 0}

            </p>

          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">

              Payment Type

            </p>

            <p className="text-2xl font-black text-blue-700 mt-2">

              Postpaid

            </p>

          </div>

        </div>

        {/* ==================================

            Current Bill

        ================================== */}

        {currentBill ? (

          <section className="mt-6 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

            {/* Header */}

            <div className="p-5 md:p-6 border-b border-slate-100">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                <div>

                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">

                    Current Bill

                  </p>

                  <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">

                    {getInvoiceNumber(

                      currentBill

                    )}

                  </h2>

                </div>

                <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">

                  <Clock3 size={14} />

                  {getPaymentStatus(

                    currentBill

                  )}

                </span>

              </div>

            </div>

            <div className="p-5 md:p-6">

              {/* ==================================

                  Customer Details

              ================================== */}

              <div className="rounded-2xl bg-slate-50 p-5">

                <h3 className="font-black text-slate-900 mb-4">

                  Customer Details

                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  <div>

                    <p className="text-xs text-slate-500 font-bold uppercase">

                      Name

                    </p>

                    <p className="font-bold mt-1">

                      {currentBill.customer_name ||

                        "-"}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-slate-500 font-bold uppercase">

                      Mobile

                    </p>

                    <p className="font-bold mt-1">

                      {currentBill.customer_phone ||

                        "-"}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-slate-500 font-bold uppercase">

                      Email

                    </p>

                    <p className="font-bold mt-1 break-all">

                      {currentBill.customer_email ||

                        "-"}

                    </p>

                  </div>

                </div>

              </div>

              {/* ==================================

                  Address

              ================================== */}

              {currentBill.address && (

                <div className="rounded-2xl bg-blue-50 p-5 mt-4">

                  <h3 className="font-black text-blue-900 mb-3">

                    Delivery Address

                  </h3>

                  <p className="text-sm text-slate-700 leading-6">

                    {[

                      currentBill.address.house_no,

                      currentBill.address.street,

                      currentBill.address.area,

                      currentBill.address.city,

                      currentBill.address.state,

                      currentBill.address.pincode,

                    ]

                      .filter(Boolean)

                      .join(", ")}

                  </p>

                </div>

              )}

              {/* ==================================

                  Subscription

              ================================== */}

              <div className="rounded-2xl bg-emerald-50 p-5 mt-4">

                <h3 className="font-black text-emerald-900 mb-4">

                  Subscription

                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  <div>

                    <p className="text-xs text-emerald-700 font-bold uppercase">

                      Product

                    </p>

                    <p className="font-bold mt-1">

                      {currentBill.product_name ||

                        "-"}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-emerald-700 font-bold uppercase">

                      Size / Qty

                    </p>

                    <p className="font-bold mt-1">

                      {currentBill.size ||

                        "-"}{" "}

                      /{" "}

                      {currentBill.quantity ??

                        0}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-emerald-700 font-bold uppercase">

                      Frequency

                    </p>

                    <p className="font-bold mt-1">

                      {currentBill.frequency ||

                        "-"}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-emerald-700 font-bold uppercase">

                      Delivery

                    </p>

                    <p className="font-bold mt-1">

                      {currentBill.delivery_time ||

                        "-"}

                    </p>

                  </div>

                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-emerald-100">

                  <div>

                    <p className="text-xs text-emerald-700 font-bold uppercase">

                      Start Date

                    </p>

                    <p className="font-bold mt-1">

                      {formatDate(

                        currentBill.start_date

                      )}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-emerald-700 font-bold uppercase">

                      End Date

                    </p>

                    <p className="font-bold mt-1">

                      {formatDate(

                        currentBill.end_date

                      )}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-emerald-700 font-bold uppercase">

                      Daily Rate

                    </p>

                    <p className="font-bold mt-1">

                      {formatMoney(

                        currentBill.daily_rate

                      )}

                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-emerald-700 font-bold uppercase">

                      Plan Amount

                    </p>

                    <p className="font-bold mt-1">

                      {formatMoney(

                        currentBill.original_plan_amount

                      )}

                    </p>

                  </div>

                </div>

              </div>

              {/* ==================================

                  Delivery Details

              ================================== */}

              <div className="mt-6">

                <div className="flex items-center justify-between gap-3 mb-3">

                  <h3 className="text-lg font-black text-slate-900">

                    Delivery Details

                  </h3>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">

                    {currentBill.delivery_rows?.length ||

                      0}{" "}

                    records

                  </span>

                </div>

                {currentBill.delivery_rows?.length ? (

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">

                    <table className="w-full min-w-[760px] text-sm">

                      <thead className="bg-emerald-700 text-white">

                        <tr>

                          <th className="px-4 py-3 text-left">

                            Date

                          </th>

                          <th className="px-4 py-3 text-left">

                            Product

                          </th>

                          <th className="px-4 py-3 text-left">

                            Size

                          </th>

                          <th className="px-4 py-3 text-center">

                            Qty

                          </th>

                          <th className="px-4 py-3 text-right">

                            Rate

                          </th>

                          <th className="px-4 py-3 text-right">

                            Amount

                          </th>

                          <th className="px-4 py-3 text-center">

                            Status

                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {currentBill.delivery_rows.map(

                          (row) => (

                            <tr

                              key={

                                row.id

                              }

                              className="border-t border-slate-100"

                            >

                              <td className="px-4 py-3">

                                {formatDate(

                                  row.delivery_date

                                )}

                              </td>

                              <td className="px-4 py-3 font-semibold">

                                {row.product_name ||

                                  "-"}

                                {row.is_extra && (

                                  <span className="ml-2 text-[10px] px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-bold">

                                    EXTRA

                                  </span>

                                )}

                              </td>

                              <td className="px-4 py-3">

                                {row.size ||

                                  "-"}

                              </td>

                              <td className="px-4 py-3 text-center">

                                {row.quantity ??

                                  0}

                              </td>

                              <td className="px-4 py-3 text-right">

                                {formatMoney(

                                  row.rate

                                )}

                              </td>

                              <td className="px-4 py-3 text-right font-bold">

                                {formatMoney(

                                  row.amount

                                )}

                              </td>

                              <td className="px-4 py-3 text-center">

                                <span

                                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getStatusClass(

                                    row.status

                                  )}`}

                                >

                                  {row.status ||

                                    "Pending"}

                                </span>

                              </td>

                            </tr>

                          )

                        )}

                      </tbody>

                    </table>

                  </div>

                ) : (

                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">

                    <AlertCircle

                      className="mx-auto mb-2"

                      size={24}

                    />

                    No delivery records found for this billing period.

                  </div>

                )}

              </div>

              {/* ==================================

                  Totals

              ================================== */}

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">

                <div className="space-y-3 text-sm">

                  {/* Delivered Days */}

                  <div className="flex justify-between">

                    <span>

                      Delivered Days

                    </span>

                    <strong>

                      {currentBill.calculated_delivered_days ??

                        0}

                    </strong>

                  </div>

                  {/* Actual Delivered Amount */}

                  <div className="flex justify-between">

                    <span>

                      Delivered Amount

                    </span>

                    <strong>

                      {formatMoney(

                        currentBill.calculated_delivery_amount

                      )}

                    </strong>

                  </div>

                  {/* Subtotal */}

                  <div className="flex justify-between">

                    <span>

                      Subtotal

                    </span>

                    <strong>

                      {formatMoney(

                        currentBill.subtotal

                      )}

                    </strong>

                  </div>

                  {/* Discount */}

                  {Number(

                    currentBill.discount ||

                      0

                  ) > 0 && (

                    <div className="flex justify-between">

                      <span>

                        Discount

                      </span>

                      <strong>

                        -

                        {formatMoney(

                          currentBill.discount

                        )}

                      </strong>

                    </div>

                  )}

                  {/* GST */}

                  {Number(

                    currentBill.gst_amount ||

                      0

                  ) > 0 && (

                    <div className="flex justify-between">

                      <span>

                        GST

                        {currentBill.gst_percent

                          ? ` (${currentBill.gst_percent}%)`

                          : ""}

                      </span>

                      <strong>

                        {formatMoney(

                          currentBill.gst_amount

                        )}

                      </strong>

                    </div>

                  )}

                  {/* Total */}

                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center">

                    <span className="text-xl font-black">

                      Current Outstanding

                    </span>

                    <strong className="text-2xl text-emerald-700">

                      {formatMoney(

                        outstanding

                      )}

                    </strong>

                  </div>

                  {/* Original Plan Amount */}

                  <div className="flex justify-between pt-2 text-slate-500">
                <span>Subscription Plan Amount (reference only)</span>
                <strong>{formatMoney(originalPlanAmount)}</strong>
              </div>

              <div className="flex justify-between text-red-600">
                <span>Discount{couponCode ? ` (${couponCode})` : ""}</span>
                <strong>-{formatMoney(planDiscount)}</strong>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900">
                  Final Subscription Amount (not payable here)
                </span>
                <strong className="text-xl text-emerald-700">
                  {formatMoney(finalPlanAmount)}
                </strong>
              </div>

                  {/* Payment Method */}

                  <div className="flex justify-between">

                    <span>

                      Payment Method

                    </span>

                    <strong>

                      {currentBill.payment_method ||

                        "COD"}

                    </strong>

                  </div>

                  {/* Payment Status */}

                  <div className="flex justify-between">

                    <span>

                      Payment Status

                    </span>

                    <strong>

                      {getPaymentStatus(

                        currentBill

                      )}

                    </strong>

                  </div>

                </div>

              </div>

              {/* ==================================

                  Actions

              ================================== */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">

                {/* Download */}

                <button

                  type="button"

                  disabled={

                    !!actionLoading

                  }

                  onClick={() =>

                    handleDownload(

                      currentBill

                    )

                  }

                  className="min-h-[52px] rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2"

                >

                  <Download size={18} />

                  {actionLoading ===

                  `download-${currentBill.id}`

                    ? "Preparing..."

                    : "Download PDF"}

                </button>

                {/* Print */}

                <button

                  type="button"

                  disabled={

                    !!actionLoading

                  }

                  onClick={() =>

                    handlePrint(

                      currentBill

                    )

                  }

                  className="min-h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2"

                >

                  <Printer size={18} />

                  {actionLoading ===

                  `print-${currentBill.id}`

                    ? "Opening..."

                    : "Print"}

                </button>

                {/* Share */}

                <button

                  type="button"

                  disabled={

                    !!actionLoading

                  }

                  onClick={() =>

                    handleShare(

                      currentBill

                    )

                  }

                  className="min-h-[52px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2"

                >

                  <Share2 size={18} />

                  {actionLoading ===

                  `share-${currentBill.id}`

                    ? "Preparing..."

                    : "Share PDF"}

                </button>

              </div>

              {/* ==================================

                  Payment

              ================================== */}

              {outstanding > 0 && (

                <button

                  type="button"

                  onClick={

                    handlePayment

                  }

                  disabled={!!actionLoading || outstanding <= 0}

                  className="w-full mt-4 min-h-[54px] rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black flex items-center justify-center gap-2"

                >

                  <CreditCard

                    size={19}

                  />

                  Pay Outstanding{" "}

                  {formatMoney(

                    outstanding

                  )}

                </button>

              )}

            </div>

          </section>

        ) : (

          <div className="mt-6 bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">

            <CheckCircle2

              className="mx-auto text-emerald-500"

              size={40}

            />

            <h2 className="mt-3 text-xl font-black text-slate-900">

              No outstanding bills

            </h2>

            <p className="mt-2 text-slate-500">

              You currently have no unpaid postpaid billing.

            </p>

          </div>

        )}

        {/* ==================================

            Refresh

        ================================== */}

        <button

          type="button"

          onClick={

            loadBilling

          }

          disabled={loading}

          className="w-full mt-4 min-h-[52px] rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-slate-50"

        >

          <RefreshCw

            size={17}

            className={

              loading

                ? "animate-spin"

                : ""

            }

          />

          Refresh Billing

        </button>

        {/* ==================================

            How It Works

        ================================== */}

        <div className="mt-6 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100">

          <h3 className="font-bold text-slate-900 text-lg">

            How postpaid billing works

          </h3>

          <div className="mt-4 space-y-3 text-sm text-slate-600">

            <p>

              ✓ COD/Postpaid deliveries are not deducted from your prepaid wallet.

            </p>

            <p>

              ✓ Only delivered quantities are added to your outstanding amount.

            </p>

            <p>

              ✓ Pending and Assigned deliveries are not billed yet.

            </p>

            <p>

              ✓ Your monthly delivery records are shown above.

            </p>

            <p>

              ✓ You can download, print or share the monthly PDF.

            </p>

            <p>

              ✓ Payment is verified by the backend before a bill is marked paid.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}