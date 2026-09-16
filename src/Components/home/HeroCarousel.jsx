import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    eyebrow: "FARM FRESH EVERY MORNING",
    title: "Fresh Buffalo Milk",
    subtitle: "Delivered to your doorstep",
    description: "Pure, fresh buffalo milk for your family's everyday routine.",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1600&auto=format&fit=crop",
    button: "Shop Milk",
  },
  {
    eyebrow: "EVERYTHING YOU NEED",
    title: "Farm Fresh Groceries",
    subtitle: "Dairy, groceries and everyday essentials",
    description: "Shop fresh products and daily essentials in one place.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop",
    button: "Shop Groceries",
  },
  {
    eyebrow: "NEVER MISS FRESH MILK",
    title: "Daily Milk Subscription",
    subtitle: "Set your routine once",
    description: "Choose your quantity and delivery schedule for effortless daily delivery.",
    image:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1600&auto=format&fit=crop",
    button: "Subscribe",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative min-h-[430px] overflow-hidden rounded-[30px] bg-slate-900 shadow-[0_24px_60px_rgba(15,23,42,.14)] sm:min-h-[500px] lg:min-h-[540px]">
      {slides.map((item, index) => (
        <img
          key={item.title}
          src={item.image}
          alt=""
          aria-hidden={index !== current}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
            index === current ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-[430px] items-center px-6 py-12 sm:min-h-[500px] sm:px-10 lg:min-h-[540px] lg:px-14">
        <div className="max-w-2xl text-white">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.18em] text-emerald-200 backdrop-blur-md sm:text-xs">
            {slide.eyebrow}
          </span>

          <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>

          <p className="mt-4 text-base font-bold text-white/90 sm:text-xl">
            {slide.subtitle}
          </p>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
            {slide.description}
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              to={current === 2 ? "/subscription" : "/products"}
              className="rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-950/20 transition hover:-translate-y-1 hover:bg-emerald-400"
            >
              {slide.button} →
            </Link>
            <Link
              to="/products"
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-black text-white backdrop-blur-md transition hover:bg-white/15"
            >
              Explore products
            </Link>
          </div>

          <div className="mt-7 flex items-center gap-4 text-[10px] font-bold text-white/60 sm:text-xs">
            <span>🥛 Fresh dairy</span>
            <span>•</span>
            <span>🚚 Home delivery</span>
            <span>•</span>
            <span>💚 Quality first</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-6 z-20 flex gap-2 sm:left-10 lg:left-14">
        {slides.map((item, index) => (
          <button
            key={item.title}
            onClick={() => setCurrent(index)}
            aria-label={`Show slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              current === index ? "w-9 bg-white" : "w-2.5 bg-white/35"
            }`}
          />
        ))}
      </div>

      <div className="absolute bottom-5 right-5 z-20 hidden rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold text-white/70 backdrop-blur sm:block">
        {current + 1} / {slides.length}
      </div>
    </section>
  );
}
