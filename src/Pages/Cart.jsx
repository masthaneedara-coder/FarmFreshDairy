import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  isCustomerLoggedIn,
  setRedirectAfterLogin,
} from "../config/auth";

import {
  fetchCart,
  deleteCartItem,
  updateCartItem,
} from "../config/api";

import { useAuthSession } from "../context/AuthSessionContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1200&auto=format&fit=crop";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const { customer } = useAuthSession();

  const loadCart = async () => {
    try {
      if (!customer) {
        setCart([]);
        return;
      }

      setLoading(true);
      const res = await fetchCart(customer.id);
      console.log("Cart:", res);
      setCart(res.cart || []);
    } catch (err) {
      console.error(err);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer) {
      loadCart();
    } else {
      setCart([]);
      setLoading(false);
    }
  }, [customer]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price ?? item.products?.price ?? 0);
      const qty = Number(item.quantity ?? 0);
      return sum + price * qty;
    }, 0);
  }, [cart]);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart]
  );

  const handleIncrease = async (item) => {
    try {
      setBusyId(item.id);
      await updateCartItem(item.id, Number(item.quantity || 0) + 1);
      await loadCart();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDecrease = async (item) => {
    if (item.quantity <= 1) return;

    try {
      setBusyId(item.id);
      await updateCartItem(item.id, Number(item.quantity || 0) - 1);
      await loadCart();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (item) => {
    try {
      setBusyId(item.id);
      await deleteCartItem(item.id);
      await loadCart();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (!isCustomerLoggedIn()) {
      setRedirectAfterLogin("/checkout");
      navigate("/auth");
      return;
    }

    navigate("/checkout");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4faf7] pb-10">
      <style>{`
        @keyframes cartReveal {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cartFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(2deg); }
        }

        @keyframes shimmer {
          0% { background-position: -700px 0; }
          100% { background-position: 700px 0; }
        }

        .cart-reveal {
          animation: cartReveal .55s cubic-bezier(.22,1,.36,1) both;
        }

        .cart-float {
          animation: cartFloat 3.6s ease-in-out infinite;
        }

        .cart-shimmer {
          background: linear-gradient(
            90deg,
            #f1f5f9 25%,
            #e2e8f0 37%,
            #f1f5f9 63%
          );
          background-size: 700px 100%;
          animation: shimmer 1.5s infinite linear;
        }

        @media (prefers-reduced-motion: reduce) {
          .cart-reveal,
          .cart-float,
          .cart-shimmer {
            animation: none !important;
          }
        }
      `}</style>

      <main className="mx-auto max-w-7xl px-3 pt-4 sm:px-5 sm:pt-6 lg:px-7">
        {/* Premium hero */}
        <section className="cart-reveal relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#064e3b] via-[#087f5b] to-[#11a875] px-5 py-6 text-white shadow-[0_20px_55px_rgba(6,95,70,.18)] sm:px-8 sm:py-8">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-emerald-50 backdrop-blur">
                🌿 Fresh • Simple • Delivered
              </span>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Shopping Cart
              </h1>

              <p className="mt-1.5 max-w-xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                Review your selected dairy products and continue to a secure checkout.
              </p>
            </div>

            <div className="cart-float hidden h-20 w-20 shrink-0 items-center justify-center rounded-[26px] border border-white/15 bg-white/10 text-4xl shadow-xl backdrop-blur-md sm:flex lg:h-24 lg:w-24 lg:text-5xl">
              🛒
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="cart-reveal mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "80ms" }}>
          <MiniStat icon="🛒" label="Items" value={totalItems} />
          <MiniStat icon="🥛" label="Products" value={cart.length} />
          <MiniStat icon="🚚" label="Delivery" value="FREE" />
          <MiniStat icon="🔒" label="Checkout" value="Secure" />
        </section>

        {loading ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="cart-reveal rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex gap-4">
                    <div className="cart-shimmer h-24 w-24 shrink-0 rounded-2xl sm:h-32 sm:w-32" />
                    <div className="flex-1 space-y-3">
                      <div className="cart-shimmer h-5 w-2/3 rounded-lg" />
                      <div className="cart-shimmer h-4 w-1/3 rounded-lg" />
                      <div className="cart-shimmer h-9 w-28 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-shimmer h-72 rounded-[28px]" />
          </div>
        ) : (
          <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
            {/* Cart items */}
            <div className="cart-reveal overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm" style={{ animationDelay: "140ms" }}>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-600">
                    Selected products
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                    {cart.length
                      ? `${cart.length} ${cart.length === 1 ? "product" : "products"}`
                      : "Your Cart"}
                  </h2>
                </div>

                <button
                  onClick={() => navigate("/products")}
                  className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-100 active:scale-95 sm:text-xs"
                >
                  + Add More
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="px-5 py-16 text-center sm:py-20">
                  <div className="cart-float mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-emerald-50 text-5xl shadow-inner">
                    🛒
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-slate-900">
                    Your Cart Is Empty
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-slate-400">
                    Add fresh milk, curd, ghee, paneer and other essentials to your cart.
                  </p>

                  <button
                    onClick={() => navigate("/products")}
                    className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 active:scale-95"
                  >
                    Continue Shopping →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cart.map((item, index) => {
                    const price = Number(
                      item.price ?? item.products?.price ?? 0
                    );
                    const quantity = Number(item.quantity || 0);
                    const itemTotal = price * quantity;
                    const image =
                      item.products?.image?.trim() || FALLBACK_IMAGE;
                    const name = item.products?.name || "Dairy Product";
                    const isBusy = busyId === item.id;

                    return (
                      <article
                        key={item.id}
                        className="cart-reveal p-4 sm:p-6"
                        style={{ animationDelay: `${180 + index * 60}ms` }}
                      >
                        <div className="flex gap-3 sm:gap-5">
                          <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-emerald-50 sm:h-32 sm:w-32">
                            <img
                              src={image}
                              alt={name}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = FALLBACK_IMAGE;
                              }}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-900 sm:text-lg">
                                  {name}
                                </h3>

                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {item.size ? (
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                                      {item.size.toLowerCase().includes("pcs")
                                        ? `Quantity: ${item.size}`
                                        : `Size: ${item.size}`}
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">
                                      Size unavailable
                                    </span>
                                  )}

                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">
                                    ₹{price.toLocaleString("en-IN")} each
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRemove(item)}
                                disabled={isBusy}
                                aria-label={`Remove ${name}`}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-sm transition hover:bg-rose-100 active:scale-90 disabled:opacity-50"
                              >
                                🗑️
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              <div className="flex items-center rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-100">
                                <button
                                  onClick={() => handleDecrease(item)}
                                  disabled={isBusy || quantity <= 1}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xl font-black text-slate-700 shadow-sm transition hover:text-rose-500 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  −
                                </button>

                                <span className="w-9 text-center text-sm font-black text-slate-900">
                                  {quantity}
                                </span>

                                <button
                                  onClick={() => handleIncrease(item)}
                                  disabled={isBusy}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-xl font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-90 disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                  Item Total
                                </p>
                                <p className="mt-0.5 text-lg font-black text-emerald-700 sm:text-xl">
                                  ₹{itemTotal.toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            <aside className="cart-reveal lg:sticky lg:top-24" style={{ animationDelay: "220ms" }}>
              <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-emerald-800 to-teal-600 px-5 py-5 text-white sm:px-6">
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-200">
                    Checkout
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Order Summary</h2>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="space-y-4">
                    <SummaryLine label="Items" value={totalItems} />
                    <SummaryLine
                      label="Subtotal"
                      value={`₹${total.toLocaleString("en-IN")}`}
                    />
                    <SummaryLine
                      label="Delivery"
                      value="FREE"
                      valueClass="text-emerald-600"
                    />
                  </div>

                  <div className="my-5 border-t border-dashed border-slate-200" />

                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                          Total Payable
                        </p>
                        <p className="mt-1 text-3xl font-black text-emerald-800">
                          ₹{total.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-emerald-700">
                        FREE DELIVERY
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className={`mt-5 w-full rounded-2xl py-4 text-sm font-black transition-all active:scale-[.98] ${
                      cart.length === 0
                        ? "cursor-not-allowed bg-slate-200 text-slate-400"
                        : "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-200 hover:-translate-y-0.5 hover:shadow-xl"
                    }`}
                  >
                    Proceed To Checkout →
                  </button>

                  <button
                    onClick={() => navigate("/products")}
                    className="mt-2.5 w-full rounded-2xl border border-slate-200 bg-white py-3 text-xs font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[.98]"
                  >
                    Continue Shopping
                  </button>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <TrustItem icon="🥛" label="Fresh" />
                    <TrustItem icon="🚚" label="Delivery" />
                    <TrustItem icon="🔒" label="Secure" />
                  </div>
                </div>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="cart-reveal rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm sm:px-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-1 text-base font-black text-slate-900 sm:text-lg">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value, valueClass = "text-slate-800" }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-medium text-slate-500">{label}</span>
      <span className={`font-black ${valueClass}`}>{value}</span>
    </div>
  );
}

function TrustItem({ icon, label }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
      <div className="text-base">{icon}</div>
      <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}
