import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Categories from "../Components/home/Categories";
import HeroCarousel from "../Components/home/HeroCarousel";
import Statistics from "../Components/home/Statistics";
import Testimonials from "../Components/home/Testimonials";
import FAQ from "../Components/home/FAQ";
import FloatingButtons from "../Components/home/FloatingButtons";
import ServiceAreas from "../Components/home/ServiceAreas";
import MapSection from "../Components/home/MapSection";
import MobileApp from "../Components/home/MobileApp";
import ReferEarn from "../Components/home/ReferEarn";
import ProductsSection from "../Components/home/ProductsSection";

import { fetchProducts } from "../config/api";
import { getCartItemCount } from "../config/cart";
import { isCustomerLoggedIn } from "../config/auth";

export default function FarmFreshDairyWebsite() {
  const navigate = useNavigate();

  const productsRef = useRef(null);
  const subscriptionRef = useRef(null);

  const [cartCount, setCartCount] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    setCartCount(getCartItemCount());

    const loadProducts = async () => {
      try {
        isCustomerLoggedIn();
        const data = await fetchProducts();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        setFeaturedProducts(list);
      } catch (error) {
        console.error("Home products load failed:", error);
        setFeaturedProducts([]);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const updateCart = () => setCartCount(getCartItemCount());
    window.addEventListener("cartUpdated", updateCart);
    updateCart();

    return () => window.removeEventListener("cartUpdated", updateCart);
  }, []);

  useEffect(() => {
    if (selectedCategory !== "All") {
      productsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return featuredProducts;

    return featuredProducts.filter((product) => {
      const name = String(product.name || "").toLowerCase();

      if (selectedCategory === "Buffalo Milk") return name.includes("buffalo");
      if (selectedCategory === "Cow Milk") return name.includes("cow");
      if (selectedCategory === "Curd") return name.includes("curd");
      if (selectedCategory === "Ghee") return name.includes("ghee") || name.includes("gee");
      if (selectedCategory === "Paneer") return name.includes("paneer");
      if (selectedCategory === "Eggs") return name.includes("egg");
      if (selectedCategory === "Vegetables") {
        return ["vegetable", "tomato", "onion", "potato", "carrot"].some((x) =>
          name.includes(x)
        );
      }
      if (selectedCategory === "Groceries") {
        return ["rice", "oil", "sugar", "cashew", "badam", "dal", "atta", "flour"].some(
          (x) => name.includes(x)
        );
      }

      return true;
    });
  }, [featuredProducts, selectedCategory]);

  const goToSubscription = () => {
    subscriptionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-900">
      <style>{`
        @keyframes ffFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ffFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes ffPulse {
          0%, 100% { opacity: .7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .ff-fade-up { animation: ffFadeUp .65s ease-out both; }
        .ff-float { animation: ffFloat 4s ease-in-out infinite; }
        .ff-pulse { animation: ffPulse 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ff-fade-up, .ff-float, .ff-pulse { animation: none !important; }
        }
      `}</style>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-8">
        <section className="ff-fade-up pt-5 sm:pt-7">
          <Categories
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </section>

        <section className="ff-fade-up mt-1">
          <HeroCarousel />
        </section>

        {/* Trust strip */}
        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["🥛", "Fresh daily", "Milk & dairy"],
            ["🚚", "Morning delivery", "At your doorstep"],
            ["🛡️", "Quality first", "Handled with care"],
            ["🔄", "Easy subscription", "Pause anytime"],
          ].map(([icon, title, text], index) => (
            <div
              key={title}
              style={{ animationDelay: `${index * 80}ms` }}
              className="ff-fade-up rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black sm:text-sm">{title}</p>
                  <p className="truncate text-[10px] font-semibold text-slate-400 sm:text-xs">{text}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <Statistics />

        {/* Products */}
        <div ref={productsRef} className="scroll-mt-24">
          <ProductsSection
            productsRef={null}
            filteredProducts={filteredProducts}
            goToSubscription={goToSubscription}
          />
        </div>

        {/* Subscription CTA */}
        <section ref={subscriptionRef} className="scroll-mt-24 py-8 sm:py-10">
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-6 text-white shadow-[0_24px_60px_rgba(4,120,87,.20)] sm:p-9 lg:p-11">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative grid gap-7 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
              <div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-emerald-200">
                  Daily milk subscription
                </span>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Fresh milk, every morning.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                  Choose your quantity and delivery schedule, then let Farm Fresh Dairy handle the daily routine.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-white/80">
                  <span className="rounded-full bg-white/10 px-3 py-2">🥛 Fresh milk</span>
                  <span className="rounded-full bg-white/10 px-3 py-2">🚚 Home delivery</span>
                  <span className="rounded-full bg-white/10 px-3 py-2">⏸️ Pause when needed</span>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <p className="text-xs font-bold text-white/55">START YOUR ROUTINE</p>
                <p className="mt-1 text-2xl font-black">Choose your milk plan</p>
                <button
                  onClick={() => navigate("/subscription/create/:productId")}
                  className="mt-5 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-emerald-800 shadow-lg transition hover:-translate-y-0.5"
                >
                  Start Subscription →
                </button>
              </div>
            </div>
          </div>
        </section>

        <Testimonials />
        <ServiceAreas />
        <MapSection />
        <MobileApp />
        <ReferEarn />

        {/* Why choose us */}
        <section className="py-8 sm:py-10">
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-600">
              Why Farm Fresh
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Simple, fresh and reliable.
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["🥛", "Pure fresh milk", "Daily fresh cow and buffalo milk with hygienic handling."],
              ["🚚", "Morning delivery", "Reliable doorstep delivery for your daily routine."],
              ["📅", "Easy subscription", "Choose quantity and delivery schedule with ease."],
              ["💚", "Customer first", "Fresh products and service designed around your family."],
            ].map(([icon, title, desc], index) => (
              <div
                key={title}
                style={{ animationDelay: `${index * 70}ms` }}
                className="ff-fade-up rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                  {icon}
                </div>
                <h3 className="mt-4 text-base font-black">{title}</h3>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <FAQ />
      </main>

      <FloatingButtons />

    </div>
  );
}

function MobileNav({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition ${
        active ? "bg-emerald-700 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="mt-1 text-[9px] font-black">{label}</span>
    </button>
  );
}
