import { useEffect, useState } from "react";

import {
  ArrowLeft,
  WalletCards,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getCustomer } from "../config/auth";
import { fetchDashboard } from "../services/dashboardService";
import {
  createPaymentOrder,
  verifyPayment,
} from "../config/api";
import { openRazorpayCheckout } from "../utils/razorpay";

const RAZORPAY_KEY =
  import.meta.env.VITE_RAZORPAY_KEY_ID;

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function Wallet() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [wallet, setWallet] = useState(null);

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      setLoading(true);
      setError("");

      const storedCustomer = getCustomer();

      if (!storedCustomer?.id) {
        navigate("/auth");
        return;
      }

      setCustomer(storedCustomer);

      const dashboard = await fetchDashboard(
        storedCustomer.id
      );

      setWallet(dashboard?.wallet || null);
    } catch (err) {
      console.error("Wallet loading error:", err);
      setError(
        err?.message || "Unable to load wallet"
      );
    } finally {
      setLoading(false);
    }
  }

  function selectAmount(value) {
    setAmount(String(value));
    setError("");
    setMessage("");
  }

  async function handleRecharge() {
    try {
      setError("");
      setMessage("");

      const rechargeAmount = Number(amount);

      if (
        !Number.isFinite(rechargeAmount) ||
        rechargeAmount <= 0
      ) {
        setError("Please enter a valid recharge amount.");
        return;
      }

      if (rechargeAmount < 10) {
        setError(
          "Minimum wallet recharge amount is ₹10."
        );
        return;
      }

      if (!customer?.id) {
        setError("Customer session not found.");
        return;
      }

      if (!RAZORPAY_KEY) {
        setError(
          "Razorpay key is not configured."
        );
        return;
      }

      setPaymentLoading(true);

      // 1. Create Razorpay order
      const orderResponse =
        await createPaymentOrder({
          amount: rechargeAmount,
          customer_id: customer.id,
        });

      if (
        !orderResponse?.success ||
        !orderResponse?.order?.id
      ) {
        throw new Error(
          orderResponse?.message ||
            "Unable to create payment order."
        );
      }

      // 2. Open Razorpay
      const payment =
        await openRazorpayCheckout({
          order: orderResponse.order,
          customer: {
            id: customer.id,
            name:
              customer.full_name ||
              customer.name ||
              "",
            email: customer.email || "",
            phone: customer.phone || "",
          },
          key: RAZORPAY_KEY,
        });

      if (!payment) {
        throw new Error(
          "Payment response was not received."
        );
      }

      // 3. Verify payment
      const verification =
        await verifyPayment({
          razorpay_order_id:
            payment.razorpay_order_id,

          razorpay_payment_id:
            payment.razorpay_payment_id,

          razorpay_signature:
            payment.razorpay_signature,

          customer_id: customer.id,

          payment_type: "WALLET_RECHARGE",
        });

      if (!verification?.success) {
        throw new Error(
          verification?.message ||
            "Payment verification failed."
        );
      }

      // 4. Refresh wallet
      const dashboard =
        await fetchDashboard(customer.id);

      setWallet(dashboard?.wallet || null);

      setAmount("");

      setMessage(
        `₹${rechargeAmount.toLocaleString(
          "en-IN"
        )} added to your wallet successfully.`
      );
    } catch (err) {
      console.error(
        "Wallet recharge error:",
        err
      );

      setError(
        err?.message ||
          "Unable to complete wallet recharge."
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-emerald-600"
          />

          <p className="mt-3 font-semibold text-slate-700">
            Loading wallet...
          </p>
        </div>
      </div>
    );
  }

  const balance = Number(
    wallet?.balance || 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 py-6 pb-12">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center hover:bg-slate-50 transition"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <h1 className="text-2xl font-black text-slate-900">
              My Wallet
            </h1>

            <p className="text-sm text-slate-500">
              Manage your prepaid milk delivery balance
            </p>
          </div>
        </div>

        {/* WALLET BALANCE */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white shadow-xl">

          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10" />

          <div className="relative flex justify-between items-start">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <WalletCards size={25} />
              </div>

              <div>
                <p className="font-bold text-lg">
                  FarmFreshDairy Wallet
                </p>

                <span className="text-xs opacity-80 font-bold">
                  PREPAID
                </span>
              </div>

            </div>

            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
              {wallet?.status || "Active"}
            </span>
          </div>

          <div className="relative mt-8">

            <p className="text-xs uppercase tracking-widest opacity-80 font-bold">
              Available Balance
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-2">
              ₹{balance.toLocaleString("en-IN")}
            </h2>

            <p className="mt-4 text-sm opacity-85">
              This balance is automatically used for
              prepaid subscription deliveries.
            </p>

          </div>
        </div>

        {/* SUCCESS */}
        {message && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-start gap-3">
            <CheckCircle2
              size={21}
              className="shrink-0 mt-0.5"
            />

            <div>
              <p className="font-bold">
                Recharge successful
              </p>

              <p className="text-sm mt-1">
                {message}
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            <p className="font-bold">
              Payment failed
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>
          </div>
        )}

        {/* RECHARGE */}
        <div className="mt-6 bg-white rounded-3xl p-5 md:p-7 shadow-sm border border-emerald-100">

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CreditCard
                className="text-emerald-600"
                size={22}
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">
                Recharge Wallet
              </h2>

              <p className="text-sm text-slate-500">
                Add money securely using Razorpay
              </p>
            </div>
          </div>

          {/* QUICK AMOUNTS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">

            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                disabled={paymentLoading}
                onClick={() =>
                  selectAmount(value)
                }
                className={`py-3 rounded-xl border-2 font-bold transition ${
                  Number(amount) === value
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400"
                }`}
              >
                ₹{value.toLocaleString("en-IN")}
              </button>
            ))}

          </div>

          {/* CUSTOM AMOUNT */}
          <div className="mt-5">

            <label className="block text-sm font-bold text-slate-700 mb-2">
              Enter Amount
            </label>

            <div className="relative">

              <IndianRupee
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="number"
                min="10"
                step="1"
                value={amount}
                disabled={paymentLoading}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="Enter recharge amount"
                className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none text-lg font-bold"
              />

            </div>

          </div>

          {/* PAY BUTTON */}
          <button
            type="button"
            disabled={
              paymentLoading ||
              !amount ||
              Number(amount) <= 0
            }
            onClick={handleRecharge}
            className="w-full mt-5 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg shadow-lg transition flex items-center justify-center gap-2"
          >
            {paymentLoading ? (
              <>
                <RefreshCw
                  size={20}
                  className="animate-spin"
                />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard size={20} />
                Pay ₹
                {Number(amount || 0).toLocaleString(
                  "en-IN"
                )}
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            Secure payment powered by Razorpay
          </p>

        </div>

        {/* HOW WALLET WORKS */}
        <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm">

          <h3 className="font-bold text-slate-900">
            How your wallet works
          </h3>

          <div className="mt-4 space-y-3 text-sm text-slate-600">

            <p>
              ✓ Successful online payments are added
              to your prepaid wallet.
            </p>

            <p>
              ✓ Each prepaid delivery deducts the
              delivery amount.
            </p>

            <p>
              ✓ Your wallet balance is updated
              automatically after delivery.
            </p>

            <p>
              ✓ If your balance is insufficient,
              prepaid delivery can be blocked until
              you recharge.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}