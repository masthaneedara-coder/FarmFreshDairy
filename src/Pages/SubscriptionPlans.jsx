import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../config/api";

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        setError("");
        const result = await fetchProducts();
        if (mounted) {
          setProducts(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        console.error("Failed to load subscription products:", err);
        if (mounted) setError("We couldn't load the plans right now. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const plans = [
    { size: "500ml", amount: 900, label: "Daily Essentials", note: "Perfect for one person", accent: "from-emerald-500 to-teal-500" },
    { size: "1L", amount: 1800, label: "Family Favourite", note: "A fresh daily family supply", accent: "from-sky-500 to-indigo-500", popular: true },
    { size: "2L", amount: 3600, label: "Extra Freshness", note: "For homes that need more", accent: "from-orange-400 to-pink-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
          <p className="text-lg font-bold text-slate-800">Preparing your fresh plans...</p>
          <p className="mt-1 text-sm text-slate-500">Just a moment 🥛</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <style>{`
        @keyframes planFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes milkFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-7px) rotate(3deg); }
        }
        .plan-fade-up { animation: planFadeUp .65s ease-out both; }
        .milk-float { animation: milkFloat 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .plan-fade-up, .milk-float { animation: none !important; }
        }
      `}</style>

      <header className="relative isolate overflow-hidden bg-gradient-to-r from-emerald-700 via-green-600 to-teal-500 text-white">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-lime-300/20 blur-2xl" />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
          <div className="max-w-2xl plan-fade-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,.9)]" />
              FarmFreshDairy · Fresh every day
            </div>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Make freshness part of your routine.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
              Choose a subscription that suits your home and enjoy fresh dairy delivered to your doorstep.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold sm:text-sm">
              <span className="rounded-full bg-white/15 px-3 py-2">✓ Easy plan selection</span>
              <span className="rounded-full bg-white/15 px-3 py-2">✓ Daily convenience</span>
              <span className="rounded-full bg-white/15 px-3 py-2">✓ Made for your home</span>
            </div>
          </div>
          <div className="milk-float hidden h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] border border-white/30 bg-white/15 text-6xl shadow-2xl backdrop-blur sm:flex lg:h-36 lg:w-36 lg:text-7xl">
            🥛
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between plan-fade-up">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-700">Find your fit</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Choose your subscription</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Browse our available products and select the plan that works best for you.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm">
            <span className="text-lg">🌿</span> Simple monthly plans
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              Try again
            </button>
          </div>
        )}

        {products.length === 0 && !error ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-5 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl">🧺</div>
            <h3 className="mt-4 text-xl font-extrabold text-slate-900">No products found</h3>
            <p className="mt-2 text-sm text-slate-500">Please check back soon for available subscription products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 xl:gap-7">
            {products.map((product, index) => (
              <article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_12px_40px_rgba(15,23,42,.07)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_55px_rgba(16,185,129,.16)] plan-fade-up"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-100 via-sky-50 to-lime-50 sm:h-56">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name || "Dairy product"}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-7xl transition duration-500 group-hover:scale-110">🥛</div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-extrabold text-emerald-800 shadow-sm backdrop-blur">
                    Farm fresh
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                        {product.name || "Fresh Dairy Product"}
                      </h3>
                      <p className="mt-2 text-sm leading-5 text-slate-500">Fresh dairy product for your daily routine.</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl transition group-hover:rotate-6 group-hover:bg-emerald-100">
                      🥛
                    </span>
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">Monthly plan options</p>
                    <div className="space-y-2">
                      {plans.map((plan) => (
                        <div key={plan.size} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 transition group-hover:border-emerald-100">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 min-w-12 items-center justify-center rounded-lg bg-white px-2 text-sm font-extrabold text-slate-700 shadow-sm">
                              {plan.size}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{plan.label}</p>
                              <p className="text-xs text-slate-500">{plan.note}</p>
                            </div>
                          </div>
                          <p className="shrink-0 text-sm font-black text-emerald-700">₹{plan.amount.toLocaleString("en-IN")}<span className="block text-right text-[10px] font-semibold text-slate-400">/month</span></p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/subscription/create/${product.id}`)}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:from-emerald-700 hover:to-teal-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 active:scale-[.98]"
                  >
                    Choose Plan <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-emerald-100 bg-white/70 p-4 text-center sm:mt-12 sm:p-5">
          <p className="text-sm text-slate-600">
            Need help choosing? <span className="font-bold text-emerald-800">Select a plan to continue</span> and review your subscription details.
          </p>
        </div>
      </main>
    </div>
  );
}
