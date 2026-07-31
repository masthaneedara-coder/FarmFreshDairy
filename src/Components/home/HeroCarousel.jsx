import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    title: "Fresh Buffalo Milk",
    subtitle: "Delivered Every Morning",
    description:
      "Pure buffalo milk collected fresh from our farm and delivered directly to your doorstep.",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1400&auto=format&fit=crop",
    button: "Order Now",
  },
  {
    title: "Farm Fresh Groceries",
    subtitle: "Everything You Need",
    description:
      "Fresh vegetables, groceries and dairy products available in one place.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1400&auto=format&fit=crop",
    button: "Shop Grocery",
  },
  {
    title: "Daily Milk Subscription",
    subtitle: "Never Miss Fresh Milk",
    description:
      "Subscribe once and receive fresh milk every morning automatically.",
    image:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1400&auto=format&fit=crop",
    button: "Subscribe",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden rounded-[35px] h-[620px]">
      <img
        src={slide.image}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-2xl px-10 text-white">
          <span className="bg-green-600 px-4 py-2 rounded-full font-bold">
            {slide.subtitle}
          </span>

          <h1 className="text-6xl font-black mt-6 leading-tight">
            {slide.title}
          </h1>

          <p className="mt-5 text-xl opacity-90">
            {slide.description}
          </p>

          <Link
            to="/products"
            className="inline-block mt-8 px-8 py-4 bg-green-600 rounded-2xl font-bold hover:bg-green-700"
          >
            {slide.button}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full ${
              current === index ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}