import { useEffect, useState } from "react";
import {
  Milk,
  Sparkles,
  CalendarDays,
  Clock3,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import {
  createExtraMilkRequest,
  getCustomerExtraMilk,
  cancelExtraMilkRequest,
  fetchProducts,
  fetchCustomerSubscriptions,
} from "../config/api";
import ExtraMilkForm from "../Components/extraMilk/ExtraMilkForm";
import ExtraMilkHistory from "../Components/extraMilk/ExtraMilkHistory";

function getStoredCustomer() {
  try {
    return JSON.parse(localStorage.getItem("customer") || "null");
  } catch {
    return null;
  }
}

export default function ExtraMilkRequest() {
  const customer = getStoredCustomer();
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [form, setForm] = useState({
    product_id: "",
    quantity: 1,
    size: "500ml",
    from_date: "",
    to_date: "",
    remarks: "",
  });

  useEffect(() => {
    loadData();
    // Load the customer's products, active subscription, and request history on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setPageLoading(true);
    try {
      if (!customer?.id) {
        setProducts([]);
        setSubscription(null);
        setHistory([]);
        return;
      }

      const [p, s, h] = await Promise.all([
        fetchProducts(),
        fetchCustomerSubscriptions(customer.id),
        getCustomerExtraMilk(customer.id),
      ]);

      setProducts(Array.isArray(p) ? p : p?.products || []);
      if (s?.success && s?.subscription?.status === "Active") {
        setSubscription(s.subscription);
      } else {
        setSubscription(null);
      }
      setHistory(h?.requests || []);
    } catch (err) {
      console.error("Failed to load extra milk data:", err);
    } finally {
      setPageLoading(false);
    }
  }

  async function loadHistory() {
    if (!customer?.id) return;
    const res = await getCustomerExtraMilk(customer.id);
    setHistory(res?.requests || []);
  }

  async function handleSubmit(data) {
    try {
      if (!customer?.id) {
        alert("Please login again.");
        return;
      }
      if (!subscription?.id) {
        alert("No active milk subscription found.");
        return;
      }

      setLoading(true);
      const payload = {
        customer_id: customer.id,
        subscription_id: subscription.id,
        product_id: data.product_id,
        size: data.size,
        quantity: Number(data.quantity),
        from_date: data.from_date,
        to_date: data.to_date,
        remarks: data.remarks || "",
        estimated_amount: Number(data.estimated_amount || 0),
      };

      console.log("FINAL EXTRA MILK PAYLOAD:", payload);
      const response = await createExtraMilkRequest(payload);
      console.log("Extra Milk API Response:", response);
      alert("✅ Extra milk request submitted successfully!");
      await loadHistory();
    } catch (error) {
      console.error("Extra Milk Request Error:", error);
      alert(error?.message || "❌ Failed to submit extra milk request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    try {
      if (!id) {
        alert("Invalid request ID.");
        return;
      }
      const ok = window.confirm("Are you sure you want to cancel this extra milk request?");
      if (!ok) return;

      setLoading(true);
      console.log("Cancelling Extra Milk Request:", id);
      const response = await cancelExtraMilkRequest(id);
      console.log("Cancel API Response:", response);
      alert("✅ Extra milk request cancelled successfully.");
      await loadHistory();
    } catch (error) {
      console.error("Cancel Extra Milk Error:", error);
      alert(error?.message || "❌ Unable to cancel extra milk request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="extra-milk-page mx-auto w-full max-w-5xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-7">
      <style>{`
        @keyframes em-gradient { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes em-float { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-5px) rotate(3deg); } }
        @keyframes em-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes em-shine { 0% { transform: translateX(-130%) skewX(-18deg); } 60%,100% { transform: translateX(230%) skewX(-18deg); } }
        .em-hero { background-size: 220% 220%; animation: em-gradient 11s ease infinite; }
        .em-milk-float { animation: em-float 3.5s ease-in-out infinite; }
        .em-hero-shine { position:absolute; inset:0 auto 0 -35%; width:28%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent); animation:em-shine 7s ease-in-out infinite; pointer-events:none; }
        .em-panel { transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
        .em-panel:focus-within { border-color:#6ee7b7; box-shadow:0 12px 32px rgba(16,185,129,.10); }
        .em-dot { animation: em-float 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .em-hero,.em-milk-float,.em-hero-shine,.em-dot { animation:none !important; } .em-panel { transition:none; } }
      `}</style>

      <header className="em-hero relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-600 to-lime-500 p-5 text-white shadow-lg shadow-emerald-900/10 sm:p-7 lg:p-8">
        <div className="em-hero-shine" />
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl sm:h-48 sm:w-48" />
        <div className="em-dot pointer-events-none absolute bottom-0 right-24 h-16 w-16 rounded-full border border-white/20 sm:right-40 sm:h-24 sm:w-24" />
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-5">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] backdrop-blur sm:text-xs">
              <Sparkles size={12} /> FARMFRESHDAIRY
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">Extra Milk Request</h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/85 sm:text-sm">
              Need a little extra freshness? Schedule additional milk for the days you need it.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur sm:text-sm">
              <ShieldCheck size={15} /> Easy request · Simple tracking
            </div>
          </div>
          <div className="em-milk-float relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/35 bg-white/20 shadow-lg shadow-emerald-950/10 backdrop-blur sm:h-20 sm:w-20 sm:rounded-3xl">
            <Milk size={28} strokeWidth={1.8} className="sm:hidden" />
            <Milk size={38} strokeWidth={1.8} className="hidden sm:block" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-emerald-900 shadow-sm"><Sparkles size={11} /></span>
          </div>
        </div>
      </header>

      {!customer?.id && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Please log in again to submit or view your extra milk requests.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="em-panel min-w-0 rounded-2xl border border-emerald-100/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 sm:h-11 sm:w-11">
              <CalendarDays size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Plan extra delivery</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">Select your milk and delivery period below.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:text-xs">REQUEST</span>
          </div>

          {pageLoading ? (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
              Loading your milk details…
            </div>
          ) : !subscription ? (
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Clock3 size={20} /></div>
                <div>
                  <h3 className="font-bold text-amber-950">Active subscription required</h3>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">An active milk subscription is needed before you can request extra milk.</p>
                </div>
              </div>
            </div>
          ) : (
            <ExtraMilkForm products={products} loading={loading} form={form} setForm={setForm} onSubmit={handleSubmit} />
          )}
        </section>

        <section className="em-panel min-w-0 rounded-2xl border border-sky-100/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-indigo-700 sm:h-11 sm:w-11">
              <ClipboardList size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Request history</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">Review your extra milk requests and their status.</p>
            </div>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700 sm:text-xs">{history.length} TOTAL</span>
          </div>
          {pageLoading ? (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
              Loading request history…
            </div>
          ) : (
            <ExtraMilkHistory requests={history} onCancel={handleCancel} />
          )}
        </section>
      </div>
      <p className="pb-1 text-center text-[11px] text-slate-400 sm:text-xs">Freshness when you need it. Thank you for choosing FarmFreshDairy.</p>
    </div>
  );
}
