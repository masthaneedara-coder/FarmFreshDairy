import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroCarousel from "../Components/home/HeroCarousel";
import Categories from "../Components/home/Categories";
import Statistics from "../Components/home/Statistics";
import Offers from "../Components/home/Offers";
import Testimonials from "../Components/home/Testimonials";
import FAQ from "../Components/home/FAQ";
import FloatingButtons from "../Components/home/FloatingButtons";
import TrustedBrands from "../Components/home/TrustedBrands";
import InstagramGallery from "../Components/home/InstagramGallery";
import ServiceAreas from "../Components/home/ServiceAreas";
import MapSection from "../Components/home/MapSection";
import MobileApp from "../Components/home/MobileApp";
import ReferEarn from "../Components/home/ReferEarn";
import ProductsSection from "../Components/home/ProductsSection";

import { fetchProducts } from "../config/api";
import { getCartItemCount  } from "../config/cart";
import {
  isCustomerLoggedIn,
  setRedirectAfterLogin,
  getCustomerName,
  logoutCustomer,
} from "../config/auth";

export default function FarmFreshDairyWebsite() {
  const navigate = useNavigate();

  const productsRef = useRef(null);
  const subscriptionRef = useRef(null);
  const orderRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [products, setProducts] = useState([]);
 useEffect(() => {
  if (selectedCategory === "All") return;

  productsRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, [selectedCategory]);
  useEffect(() => {
    setCartCount(getCartItemCount());
    setIsLoggedIn(isCustomerLoggedIn());

    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        console.log("Products:", data);
        setProducts(data);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

       setFeaturedProducts(list);
        console.log("Featured Products:", list);
      } catch (error) {
        console.error("Home products load failed:", error);
        setFeaturedProducts([]);
      }
    };

    loadProducts();
  }, []);
useEffect(() => {
  const updateCart = () => {
    setCartCount(getCartItemCount());
  };

  updateCart();

  window.addEventListener("cartUpdated", updateCart);

  return () => {
    window.removeEventListener("cartUpdated", updateCart);
  };
}, []);
  const customerName = useMemo(() => {
    if (!isLoggedIn) return "";
    return getCustomerName();
  }, [isLoggedIn]);


  const goToSubscription = () => {
  subscriptionRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

  const handleLogout = () => {
    logoutCustomer();
    setIsLoggedIn(false);
    navigate("/");
  };

const filteredProducts =
  selectedCategory === "All"
    ? featuredProducts
    : featuredProducts.filter((product) => {
        const name = (product.name || "").toLowerCase();

        if (selectedCategory === "Buffalo Milk")
          return name.includes("buffalo");

        if (selectedCategory === "Cow Milk")
          return name.includes("cow");

        if (selectedCategory === "Curd")
          return name.includes("curd");

        if (selectedCategory === "Ghee")
          return name.includes("ghee") || name.includes("gee");

        if (selectedCategory === "Paneer")
          return name.includes("paneer");

        if (selectedCategory === "Eggs")
          return name.includes("egg");

        if (selectedCategory === "Vegetables")
          return (
            name.includes("vegetable") ||
            name.includes("tomato") ||
            name.includes("onion")
          );

        if (selectedCategory === "Groceries")
          return (
            name.includes("rice") ||
            name.includes("oil") ||
            name.includes("sugar") ||
            name.includes("cashew")
          );

        return true;
      });
      console.log(filteredProducts);

const goToOrder = () => {
  orderRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 overflow-x-hidden">
      {/* TOP ANNOUNCEMENT */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 text-white py-3 shadow">
        <div className="animate-marquee-premium whitespace-nowrap text-sm sm:text-base font-semibold">
          🥛 Fresh Cow Milk • 🐃 Fresh Buffalo Milk • 🥣 Fresh Curd • 🚚 Daily Morning Delivery • 🌿 Farm Fresh Dairy • 📞 Order Now
        </div>
      </div>

      {/* HEADER */}


      {/* HERO */}

      <Categories
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <HeroCarousel />
      <Statistics />
      {/* <Offers /> */}
      <Testimonials />
       {/* FEATURED PRODUCTS */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <ProductsSection
            productsRef={productsRef}
            filteredProducts={filteredProducts}
            goToSubscription={goToSubscription}
          />

        </div>
      
      <FloatingButtons />
      {/* <TrustedBrands /> */}

      
      <ServiceAreas />
      <MapSection />
      <InstagramGallery />
      <FAQ />
      <MobileApp />
      <ReferEarn />

      {/* WHY CHOOSE US */}
      <section className="py-6 sm:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-8">
            <h3 className="text-3xl sm:text-4xl font-black text-green-800">
              Why Choose Farm Fresh Dairy?
            </h3>
            <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
              Fresh from farm, delivered with care and trusted quality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                icon: "🥛",
                title: "Pure Fresh Milk",
                desc: "Daily fresh cow and buffalo milk with hygienic handling.",
              },
              {
                icon: "🚚",
                title: "Fast Delivery",
                desc: "Reliable daily delivery at your preferred time slot.",
              },
              {
                icon: "📅",
                title: "Easy Subscription",
                desc: "Choose quantity, delivery type and monthly plan easily.",
              },
              {
                icon: "💚",
                title: "Trusted Quality",
                desc: "Natural, clean and customer-focused dairy service.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group rounded-3xl bg-white border border-green-100 p-6 shadow-sm hover:shadow-xl transition hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  {item.icon}
                </div>
                <h4 className="text-xl font-black text-green-800">{item.title}</h4>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

     
    <section
      ref={subscriptionRef}
      className="py-9 sm:py-10 lg:py-12"
    ></section>

      {/* SUBSCRIPTION CTA */}
      <section className="py-9 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 px-5 sm:px-8 lg:px-10 py-10 sm:py-12 shadow-2xl text-white">
            <div className="absolute -top-10 right-0 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-10 left-0 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                  Start Your Daily Milk Subscription
                </h3>
                <p className="mt-3 text-sm sm:text-base lg:text-lg text-white/90 max-w-2xl">
                  Get fresh milk delivered every day with flexible plans for 500ml, 1L and more.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={goToSubscription}
                    className="px-7 py-4 rounded-2xl bg-white text-green-700 font-black shadow hover:scale-[1.02] transition"
                  >
                    Start Subscription
                  </button>

                  <Link
                    to="/products"
                    className="px-7 py-4 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold transition text-center"
                  >
                    Shop Products
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white/10 backdrop-blur-md p-5 border border-white/15">
                  <p className="text-sm text-white/80">Cow Milk</p>
                  <p className="text-3xl font-black mt-2">₹70/L</p>
                </div>
                <div className="rounded-3xl bg-white/10 backdrop-blur-md p-5 border border-white/15">
                  <p className="text-sm text-white/80">Buffalo Milk</p>
                  <p className="text-3xl font-black mt-2">₹90/L</p>
                </div>
                <div className="rounded-3xl bg-white/10 backdrop-blur-md p-5 border border-white/15 col-span-2">
                  <p className="text-sm text-white/80">Flexible Plans</p>
                  <p className="text-2xl font-black mt-2">
                    Daily / Alternate Day Delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
      ref={orderRef}
    ></section>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-green-100 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8">
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div>
              <h4 className="text-2xl font-black text-green-800">
                Farm Fresh Dairy
              </h4>
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                Fresh milk, buffalo milk and curd delivered daily with care,
                quality and trust.
              </p>
            </div>

            <div>
              <h5 className="text-lg font-black text-green-800">Quick Links</h5>
              <div className="mt-3 space-y-2 text-sm">
                <Link to="/products" className="block text-gray-600 hover:text-green-700">
                  Products
                </Link>
                <button
                  onClick={goToSubscription}
                  className="block text-left text-gray-600 hover:text-green-700"
                >
                  Subscription
                </button>
                <Link to="/cart" className="block text-gray-600 hover:text-green-700">
                  Cart
                </Link>
              </div>
            </div>

            <div>
              <h5 className="text-lg font-black text-green-800">Contact</h5>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p>📍 Dammaiguda / ECIL / Nearby Areas</p>
                <p>📞 +91 9989663838</p>
                <p>🚚 Daily Milk Delivery Available</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-green-100 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Farm Fresh Dairy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}