import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Receipt,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getCustomer } from "../config/auth";
import { fetchDashboard } from "../services/dashboardService";

import {
  createPaymentOrder,
  payBilling,
} from "../config/api";

import {
  openRazorpayCheckout,
} from "../utils/razorpay";

const RAZORPAY_KEY =
  import.meta.env.VITE_RAZORPAY_KEY_ID;

export default function Billing() {
  const navigate = useNavigate();

  const [customer, setCustomer] =
    useState(null);

  const [billing, setBilling] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ==========================================
  // LOAD BILLING
  // ==========================================

  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    try {
      setLoading(true);
      setError("");

      const storedCustomer =
        getCustomer();

      if (!storedCustomer?.id) {
        navigate("/auth");
        return;
      }

      setCustomer(storedCustomer);

      const dashboard =
        await fetchDashboard(
          storedCustomer.id
        );

      console.log(
        "Billing dashboard:",
        dashboard?.billing
      );

      setBilling(
        dashboard?.billing || null
      );

    } catch (err) {
      console.error(
        "Billing loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load billing information."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // PAY OUTSTANDING
  // ==========================================

  async function handlePayOutstanding() {
    try {
      setError("");
      setMessage("");

      if (!customer?.id) {
        throw new Error(
          "Customer session not found."
        );
      }

      if (!RAZORPAY_KEY) {
        throw new Error(
          "Razorpay key is not configured."
        );
      }

      const bills = Array.isArray(
        billing?.bills
      )
        ? billing.bills
        : [];

      if (bills.length === 0) {
        throw new Error(
          "No outstanding bill was found."
        );
      }

      if (bills.length > 1) {
        throw new Error(
          "Multiple outstanding bills found. Please pay them individually."
        );
      }

      const bill = bills[0];

      if (!bill?.id) {
        throw new Error(
          "Billing record ID is missing."
        );
      }

      const billAmount = Number(
        bill.total_amount || 0
      );

      if (
        !Number.isFinite(billAmount) ||
        billAmount <= 0
      ) {
        throw new Error(
          "Invalid outstanding bill amount."
        );
      }

      setPaymentLoading(true);

      // ========================================
      // 1. CREATE RAZORPAY ORDER
      // ========================================

      const orderResponse =
        await createPaymentOrder({
          amount: billAmount,
          customer_id: customer.id,
        });

      if (
        !orderResponse?.success ||
        !orderResponse?.order?.id
      ) {
        throw new Error(
          orderResponse?.message ||
            "Unable to create Razorpay order."
        );
      }

      console.log(
        "Billing Razorpay order:",
        orderResponse.order
      );

      // ========================================
      // 2. OPEN RAZORPAY
      // ========================================

      const payment =
        await openRazorpayCheckout({
          order:
            orderResponse.order,

          customer: {
            id: customer.id,

            name:
              customer.full_name ||
              customer.name ||
              "",

            email:
              customer.email || "",

            phone:
              customer.phone || "",
          },

          key: RAZORPAY_KEY,
        });

      if (!payment) {
        throw new Error(
          "No payment response received."
        );
      }

      console.log(
        "Razorpay payment:",
        payment
      );

      // ========================================
      // 3. VERIFY + MARK BILL PAID
      // ========================================

      const result =
        await payBilling(
          bill.id,
          {
            razorpay_order_id:
              payment.razorpay_order_id,

            razorpay_payment_id:
              payment.razorpay_payment_id,

            razorpay_signature:
              payment.razorpay_signature,

            customer_id:
              customer.id,
          }
        );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            "Billing payment verification failed."
        );
      }

      // ========================================
      // 4. SUCCESS
      // ========================================

      setMessage(
        `₹${billAmount.toLocaleString(
          "en-IN"
        )} payment completed successfully.`
      );

      // Reload billing
      await loadBilling();

    } catch (err) {
      console.error(
        "Billing payment error:",
        err
      );

      setError(
        err?.message ||
          "Unable to complete billing payment."
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
        <div className="text-center">

          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 font-semibold text-slate-700">
            Loading billing...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
  // BILLING VALUES
  // ==========================================

  const outstanding = Number(
    billing?.outstanding || 0
  );

  const billCount = Number(
    billing?.billCount || 0
  );

  const bills = Array.isArray(
    billing?.bills
  )
    ? billing.bills
    : [];

  const currentBill =
    bills.length === 1
      ? bills[0]
      : null;

  const invoiceNumber =
    currentBill?.invoice_number ||
    currentBill?.invoiceNumber ||
    null;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-6 pb-12">

      <div className="max-w-4xl mx-auto">

        {/* HEADER */}

        <div className="flex items-center gap-3 mb-6">

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-slate-50 transition"
          >
            <ArrowLeft size={19} />
          </button>

          <div>

            <h1 className="text-2xl font-black text-slate-900">
              My Billing
            </h1>

            <p className="text-sm text-slate-500">
              View and pay your postpaid
              outstanding amount
            </p>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">

            <AlertCircle
              size={21}
              className="shrink-0 mt-0.5"
            />

            <div>

              <p className="font-bold">
                Payment failed
              </p>

              <p className="text-sm mt-1">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-3">

            <CheckCircle2
              size={21}
              className="shrink-0 mt-0.5"
            />

            <div>

              <p className="font-bold">
                Payment successful
              </p>

              <p className="text-sm mt-1">
                {message}
              </p>

            </div>

          </div>
        )}

        {/* BILLING CARD */}

        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-blue-800 via-blue-700 to-sky-500 text-white shadow-xl">

          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10" />

          <div className="relative flex justify-between items-start">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Receipt size={25} />
              </div>

              <div>

                <p className="font-bold text-lg">
                  FarmFreshDairy Billing
                </p>

                <span className="text-xs opacity-80 font-bold">
                  POSTPAID
                </span>

              </div>

            </div>

            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
              {billing?.type ||
                "Postpaid"}
            </span>

          </div>

          <div className="relative mt-8">

            <p className="text-xs uppercase tracking-widest opacity-80 font-bold">
              Outstanding Amount
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-2">
              ₹
              {outstanding.toLocaleString(
                "en-IN"
              )}
            </h2>

          </div>

          <p className="relative mt-4 text-sm opacity-85">
            COD/Postpaid deliveries accumulate
            here as monthly outstanding.
          </p>

          {invoiceNumber && (
            <div className="relative mt-4 text-xs opacity-75">
              Invoice: {invoiceNumber}
            </div>
          )}

        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              Outstanding Bills
            </p>

            <p className="text-3xl font-black text-slate-900 mt-2">
              {billCount}
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

        {/* BILL DETAILS */}

        {currentBill && (
          <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

            <div className="flex justify-between items-start gap-4">

              <div>

                <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                  Current Bill
                </p>

                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {invoiceNumber ||
                    "Outstanding Bill"}
                </h3>

              </div>

              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                {currentBill.payment_status ||
                  "Pending"}
              </span>

            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">

              <div>

                <p className="text-xs text-slate-500">
                  Bill Amount
                </p>

                <p className="font-black text-slate-900 mt-1">
                  ₹
                  {Number(
                    currentBill.total_amount ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>

              </div>

              <div>

                <p className="text-xs text-slate-500">
                  Payment Method
                </p>

                <p className="font-bold text-slate-900 mt-1">
                  {currentBill.payment_method ||
                    "Postpaid"}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* PAY BUTTON */}

       {outstanding > 0 && (
  <button
    type="button"
    disabled={paymentLoading}
    onClick={handlePayOutstanding}
    className="w-full mt-6 p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition shadow-lg"
  >
    {paymentLoading ? (
      <>
        <RefreshCw
          size={19}
          className="animate-spin"
        />
        Processing Payment...
      </>
    ) : (
      <>
        <CreditCard size={19} />
        Pay Outstanding ₹
        {outstanding.toLocaleString("en-IN")}
      </>
    )}
  </button>
)}

        {/* NO OUTSTANDING */}

        {outstanding <= 0 && (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">

            <div className="flex items-center gap-3">

              <CheckCircle2 size={23} />

              <div>

                <p className="font-black">
                  No outstanding payment
                </p>

                <p className="text-sm mt-1">
                  Your postpaid billing account
                  is currently clear.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* REFRESH */}

        <button
          type="button"
          disabled={paymentLoading}
          onClick={loadBilling}
          className="w-full mt-3 p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50 transition"
        >

          <RefreshCw
            size={17}
          />

          Refresh Billing

        </button>

        {/* INFORMATION */}

        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

          <h3 className="font-bold text-slate-900">
            How postpaid billing works
          </h3>

          <div className="mt-4 space-y-3 text-sm text-slate-600">

            <p>
              ✓ COD/Postpaid deliveries are
              not deducted from your prepaid
              wallet.
            </p>

            <p>
              ✓ Delivered amounts accumulate
              as monthly outstanding.
            </p>

            <p>
              ✓ Your outstanding amount is
              shown here.
            </p>

            <p>
              ✓ Online payment securely settles
              the selected outstanding bill.
            </p>

            <p>
              ✓ After successful payment,
              the bill is marked as Paid.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}