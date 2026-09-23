import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  Leaf,
  MapPin,
  Menu,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthSession } from "../context/AuthSessionContext";

import { fetchProducts } from "../config/api";
import { getCartItemCount } from "../config/cart";

const HERO_SLIDES = [
  {
    eyebrow: "FRESH EVERY MORNING",
    title: "Pure Buffalo Milk,",
    highlight: "Straight to Your Door.",
    description:
      "Fresh dairy goodness delivered to your family with care, every day.",
    image:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=85&w=1400&auto=format&fit=crop",
    cta: "Shop Milk",
    href: "/products",
  },
  {
    eyebrow: "SMART DAILY DELIVERY",
    title: "Fresh Milk,",
    highlight: "Without the Reminder.",
    description:
      "Choose a subscription and enjoy convenient daily or alternate-day delivery.",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=85&w=1400&auto=format&fit=crop",
    cta: "View Plans",
    href: "/subscription-plans",
  },
  {
    eyebrow: "MORE THAN JUST MILK",
    title: "Curd, Ghee & Paneer,",
    highlight: "Made for Your Family.",
    description:
      "Shop everyday dairy essentials from one trusted local store.",
    image:
      "https://images.unsplash.com/photo-1571212515416-fef01fc43637?q=85&w=1400&auto=format&fit=crop",
    cta: "Explore Products",
    href: "/products",
  },
];

const CATEGORIES = [
  { name: "All", icon: ShoppingBag, tone: "from-emerald-500 to-green-600" },
  { name: "Buffalo Milk", icon: Sparkles, tone: "from-green-500 to-emerald-600" },
  { name: "Cow Milk", icon: Leaf, tone: "from-lime-500 to-green-600" },
  { name: "Curd", icon: Package, tone: "from-sky-400 to-cyan-500" },
  { name: "Ghee", icon: Sparkles, tone: "from-amber-400 to-orange-500" },
  { name: "Paneer", icon: CheckCircle2, tone: "from-violet-400 to-purple-500" },
];

const BENEFITS = [
  { icon: Leaf, title: "Farm Fresh", text: "Freshness you can taste" },
  { icon: ShieldCheck, title: "Hygienic", text: "Handled with care" },
  { icon: Truck, title: "On-Time", text: "Reliable doorstep delivery" },
  { icon: Heart, title: "Made for Family", text: "Quality everyday essentials" },
];

const REVIEWS = [
  {
    name: "Ramesh",
    place: "ECIL",
    text: "Milk quality is excellent and delivery is always on time.",
  },
  {
    name: "Lakshmi",
    place: "Dammaiguda",
    text: "Very fresh buffalo milk. My family loves the quality.",
  },
  {
    name: "Prasad",
    place: "Kapra",
    text: "Easy subscription and dependable daily delivery.",
  },
];

function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value || "—";
  return number.toLocaleString("en-IN");
}

function matchesCategory(product, category) {
  if (category === "All") return true;

  const name = String(product?.name || "").toLowerCase();

  if (category === "Buffalo Milk") return name.includes("buffalo");
  if (category === "Cow Milk") return name.includes("cow");
  if (category === "Curd") return name.includes("curd");
  if (category === "Ghee") return name.includes("ghee") || name.includes("gee");
  if (category === "Paneer") return name.includes("paneer");

  return true;
}

export default function FarmFreshDairyWebsite() {
  const navigate = useNavigate();
  const { customer } = useAuthSession();
  const isCustomerLoggedIn = Boolean(customer);
  const productsRef = useRef(null);
  const subscriptionRef = useRef(null);

  const [slide, setSlide] = useState(0);
  const [category, setCategory] = useState("All");
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [review, setReview] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetchProducts();
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.products)
            ? response.products
            : [];

        if (active) setProducts(list);
      } catch (error) {
        console.error("Home products load failed:", error);
        if (active) setProducts([]);
      }
    }

    loadProducts();
    setCartCount(getCartItemCount());
    const updateCart = () => setCartCount(getCartItemCount());
    window.addEventListener("cartUpdated", updateCart);

    return () => {
      active = false;
      window.removeEventListener("cartUpdated", updateCart);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setReview((current) => (current + 1) % REVIEWS.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => matchesCategory(product, category))
        .slice(0, 6),
    [products, category]
  );

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const requireLogin = (action) => {
    if (!isCustomerLoggedIn) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      navigate("/auth");
      return;
    }
    action?.();
  };

  const handleHeroAction = () => {
    requireLogin(() => navigate(currentHero.href));
  };

  const handleSubscriptionAction = () => {
    requireLogin(() => scrollTo(subscriptionRef));
  };

  const currentHero = HERO_SLIDES[slide];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfdf9] text-slate-900 pb-24 md:pb-0">
      {/* Global Navbar is rendered by the app.
          Keep this Home page focused on content so we do not duplicate the header. */}
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-3 pt-2 sm:px-6 sm:pt-4">
          <div className="relative h-[440px] overflow-hidden rounded-[26px] bg-[#073e26] shadow-xl sm:h-auto sm:min-h-[560px] sm:rounded-[38px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentHero.image}
                src={currentHero.image}
                alt={currentHero.title}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65 }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative flex h-full items-end px-5 pb-8 pt-20 sm:min-h-[560px] sm:items-center sm:px-10 sm:pb-10 lg:px-14">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHero.title}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.45 }}
                  className="max-w-xl text-white"
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-[10px] font-black tracking-[0.16em] backdrop-blur-md sm:text-xs">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" />
                    {currentHero.eyebrow}
                  </span>

                  <h1 className="mt-4 max-w-[330px] text-[34px] font-black leading-[0.98] tracking-tight sm:max-w-xl sm:text-6xl lg:text-7xl">
                    {currentHero.title}
                    <span className="mt-2 block text-lime-300">{currentHero.highlight}</span>
                  </h1>

                  <p className="mt-4 max-w-[320px] text-[12px] leading-5 text-white/85 sm:mt-5 sm:max-w-lg sm:text-lg sm:leading-6">
                    {currentHero.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
                    <button
                      type="button"
                      onClick={handleHeroAction}
                      className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-4 py-3 text-xs font-black text-[#123c20] shadow-lg shadow-black/10 transition active:scale-[0.98] hover:-translate-y-0.5 hover:bg-lime-300 sm:px-5 sm:py-3.5 sm:text-sm"
                    >
                      {currentHero.cta}
                      <ArrowRight size={16} />
                    </button>

                    <button
                      onClick={handleSubscriptionAction}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md transition active:scale-[0.98] hover:bg-white/20 sm:px-5 sm:py-3.5 sm:text-sm"
                    >
                      Daily Subscription
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3 text-[10px] font-semibold text-white/80 sm:mt-7 sm:gap-4 sm:text-xs">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-lime-300" /> Fresh every day
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-lime-300" /> Local delivery
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="absolute bottom-5 right-5 flex items-center gap-2">
              <button
                onClick={() => setSlide((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md sm:flex"
                aria-label="Previous banner"
              >
                <ChevronLeft size={18} />
              </button>
              {HERO_SLIDES.map((item, index) => (
                <button
                  key={item.title}
                  onClick={() => setSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    index === slide ? "w-7 bg-lime-300" : "w-2 bg-white/55"
                  }`}
                />
              ))}
              <button
                onClick={() => setSlide((slide + 1) % HERO_SLIDES.length)}
                className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md sm:flex"
                aria-label="Next banner"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Quick benefits */}
        <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-6 sm:pt-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black sm:text-sm">{benefit.title}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-xs">
                        {benefit.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-3 pt-8 sm:px-6 sm:pt-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                Explore
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Shop by category
              </h2>
            </div>
            <Link to="/products" className="text-xs font-black text-emerald-700 sm:text-sm">
              View all
            </Link>
          </div>

          <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-6 sm:overflow-visible sm:px-0">
            {CATEGORIES.map((item) => {
              const Icon = item.icon;
              const active = category === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    requireLogin(() => {
                      setCategory(item.name);
                      setTimeout(() => scrollTo(productsRef), 40);
                    });
                  }}
                  className={`min-w-[92px] rounded-3xl border p-3 text-center transition-all sm:min-w-0 ${
                    active
                      ? "border-emerald-600 bg-emerald-700 text-white shadow-lg shadow-emerald-900/15"
                      : "border-emerald-100 bg-white text-slate-700 shadow-sm hover:-translate-y-1 hover:border-emerald-200"
                  }`}
                >
                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-sm`}
                  >
                    <Icon size={22} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] font-black leading-tight">
                    {item.name}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Products */}
        <section ref={productsRef} className="mx-auto max-w-7xl scroll-mt-24 px-3 pt-9 sm:px-6 sm:pt-14">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                Fresh today
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Popular products
              </h2>
            </div>
            <Link to="/products" className="text-xs font-black text-emerald-700 sm:text-sm">
              See all
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
              <ShoppingBag className="mx-auto text-emerald-300" size={38} />
              <p className="mt-3 font-black text-slate-700">No products found</p>
              <button
                onClick={() => {
                  setCategory("All");
                }}
                className="mt-3 text-sm font-bold text-emerald-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <motion.article
                  key={product.id || `${product.name}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="group overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-xl"
                >
                  <button type="button" onClick={() => requireLogin(() => navigate("/products"))} className="block w-full text-left">
                    <div className="relative aspect-square overflow-hidden bg-slate-50">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">🥛</div>
                      )}
                      <span className="absolute left-2 top-2 rounded-full bg-emerald-700 px-2.5 py-1 text-[9px] font-black text-white">
                        FRESH
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          requireLogin();
                        }}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur"
                        aria-label="Add to favorites"
                      >
                        <Heart size={15} />
                      </button>
                    </div>
                  </button>

                  <div className="p-3 sm:p-4">
                    <h3 className="line-clamp-2 min-h-[36px] text-sm font-black leading-5 sm:text-base">
                      {product.name || "Fresh Dairy Product"}
                    </h3>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-lg font-black text-emerald-700">
                        ₹{formatPrice(product.price)}
                      </p>
                      <button
                        type="button"
                        onClick={() => requireLogin(() => navigate("/products"))}
                        className="rounded-xl bg-emerald-700 px-3 py-2 text-[10px] font-black text-white transition active:scale-95 hover:bg-emerald-800 sm:text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        {/* Subscription */}
        <section ref={subscriptionRef} className="mx-auto max-w-7xl scroll-mt-24 px-3 pt-10 sm:px-6 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#07552f] via-emerald-700 to-[#0b7444] p-6 text-white shadow-xl sm:rounded-[38px] sm:p-10 lg:p-12"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime-300/15 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1.25fr_.75fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]">
                  <CalendarDays size={14} />
                  Daily subscription
                </div>
                <h2 className="mt-5 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
                  Fresh milk every morning,
                  <span className="block text-lime-300">without the daily order.</span>
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                  Pick your quantity, delivery pattern and plan. Pause, resume or renew when you need.
                </p>

                <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
                  {["500ml", "1L", "2L+", "Daily", "Alternate days"].map((item) => (
                    <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => requireLogin(() => navigate("/subscription-plans"))}
                    className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-5 py-3.5 text-sm font-black text-[#123c20] transition active:scale-[0.98] hover:bg-lime-300"
                  >
                    View subscription plans <ArrowRight size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => requireLogin(() => navigate("/products"))}
                    className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white"
                  >
                    Shop first
                  </button>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-sm">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
                  className="relative rounded-[30px] border border-white/20 bg-white/10 p-5 backdrop-blur-md"
                >
                  <div className="rounded-[24px] bg-[#f5f9f1] p-5 text-slate-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          Family plan
                        </p>
                        <p className="mt-1 text-2xl font-black">1 Litre Daily</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                        🥛
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      {["Morning doorstep delivery", "Pause whenever needed", "Easy monthly renewal"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-emerald-50 p-3">
                      <span className="text-xs font-bold text-slate-500">Starting from</span>
                      <span className="text-lg font-black text-emerald-700">₹—</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Offer strip */}
        <section className="mx-auto max-w-7xl px-3 pt-7 sm:px-6 sm:pt-10">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Truck, title: "Doorstep delivery", text: "Serving nearby areas with scheduled delivery." },
              { icon: Zap, title: "Easy ordering", text: "Order products or start a subscription in minutes." },
              { icon: Clock3, title: "Flexible plans", text: "Daily and alternate-day options available." },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  whileHover={{ scale: 1.015 }}
                  className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-3 pb-10 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                Customer love
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Families choose fresh
              </h2>
            </div>
            <div className="flex gap-1">
              {REVIEWS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setReview(index)}
                  className={`h-2 rounded-full transition-all ${
                    review === index ? "w-6 bg-emerald-600" : "w-2 bg-emerald-200"
                  }`}
                  aria-label={`Review ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] bg-[#063b24] p-6 text-white shadow-xl sm:rounded-[38px] sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={REVIEWS[review].name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-lime-300 to-emerald-400 text-2xl font-black text-[#063b24]">
                  {REVIEWS[review].name[0]}
                </div>

                <div>
                  <div className="text-sm tracking-widest text-amber-300">★★★★★</div>
                  <p className="mt-2 text-lg font-semibold leading-7 sm:text-2xl">
                    “{REVIEWS[review].text}”
                  </p>
                  <p className="mt-3 text-sm text-white/60">
                    {REVIEWS[review].name} • {REVIEWS[review].place}
                  </p>
                </div>

                <div className="hidden text-right md:block">
                  <p className="text-4xl font-black text-lime-300">Fresh</p>
                  <p className="text-sm text-white/60">Every day</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Service area */}
        <section className="border-y border-emerald-100 bg-emerald-50/60">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                <MapPin size={19} />
              </div>
              <div>
                <p className="text-sm font-black">Delivery areas</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Dammaiguda • Kapra • Rampally • Parimal Nagar • ECIL & nearby areas
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => requireLogin(() => navigate("/products"))}
              className="inline-flex items-center gap-2 text-sm font-black text-emerald-700"
            >
              Start shopping <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {[
            ["/", Home, "Home"],
            ["/products", ShoppingBag, "Products"],
            ["/subscription-plans", CalendarDays, "Subscribe"],
            ["/order-history", Package, "Orders"],
            ["/customer-dashboard", UserRound, "Profile"],
          ].map(([href, Icon, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (label === "Home") return navigate("/");
                requireLogin(() => navigate(href));
              }}
              className={`flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-bold ${
                label === "Home" ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              <Icon size={19} strokeWidth={label === "Home" ? 2.8 : 2} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Floating contact buttons */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2 md:bottom-6 md:right-6">
        <motion.a
          whileTap={{ scale: 0.9 }}
          href="https://wa.me/919989663837"
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-white"
          aria-label="WhatsApp"
        >
          <span className="text-xl">💬</span>
        </motion.a>
        <motion.a
          whileTap={{ scale: 0.9 }}
          href="tel:+919989663837"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07552f] text-white shadow-xl ring-4 ring-white"
          aria-label="Call"
        >
          <Phone size={20} />
        </motion.a>
      </div>

      {/* Footer */}
      <footer className="bg-[#032b1b] px-4 pb-10 pt-10 text-white md:pb-12">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xl font-black">Farm Fresh Dairy</p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Fresh milk and everyday dairy essentials delivered with care.
            </p>
          </div>

          <div>
            <p className="text-sm font-black text-lime-300">Shop</p>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <Link className="block hover:text-white" to="/products">Products</Link>
              <Link className="block hover:text-white" to="/subscription-plans">Subscriptions</Link>
              <Link className="block hover:text-white" to="/cart">Cart</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-lime-300">Account</p>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <Link className="block hover:text-white" to="/auth">Login / Sign up</Link>
              <Link className="block hover:text-white" to="/order-history">Orders</Link>
              <Link className="block hover:text-white" to="/customer-dashboard">Dashboard</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-black text-lime-300">Contact</p>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <p>Hyderabad, Telangana</p>
              <p>+91 9989663837</p>
              <p>Daily milk delivery</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-5 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Farm Fresh Dairy. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
