import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchProducts } from "../config/api";
import { addProductToCart } from "../services/cartService";
import { addToCart, getCartItemCount } from "../config/cart";
import { useAuthSession } from "../context/AuthSessionContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1200&auto=format&fit=crop";

export default function Products() {
  const navigate = useNavigate();
  const { customer } = useAuthSession();
  const audioRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [quantities, setQuantities] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [toast, setToast] = useState("");

  /* ----------------------------------
     PLAY CART SOUND
  ---------------------------------- */
  const playCartSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.log("Audio play failed", err);
    }
  };

  /* ----------------------------------
     SAFE NUMBER
  ---------------------------------- */
  const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  /* ----------------------------------
     NORMALIZE PRODUCT DATA
     Supports many Google Sheet column names
  ---------------------------------- */
  const normalizeProduct = (item, index = 0) => {
    const rawName =
      item.name ||
      item.Name ||
      item.productName ||
      item["Product Name"] ||
      item["Product"] ||
      item["Item Name"] ||
      item["Title"] ||
      "";

    const rawPrice =
      item.price ??
      item.Price ??
      item.productPrice ??
      item["Product Price"] ??
      item["Price/Liter"] ??
      item["Price Per Liter"] ??
      item["Rate"] ??
      item["Amount"] ??
      0;

    const rawStock =
      item.stock ??
      item.Stock ??
      item.qty ??
      item.quantity ??
      item["Stock Qty"] ??
      item["Stock Quantity"] ??
      item["Available Stock"] ??
      item["Available Qty"] ??
      0;

    const rawImage =
      item.image ||
      item.Image ||
      item.productImage ||
      item["Product Image"] ||
      item["Image URL"] ||
      item["Photo"] ||
      "";

    return {
      id:
        item.id ||
        item.productId ||
        item["Product ID"] ||
        item["ID"] ||
        `product-${index}`,
      name: String(rawName || "Product"),
      price: toNumber(rawPrice, 0),
      stock: toNumber(rawStock, 0),
      image: String(rawImage || "").trim(),
      category:
        item.category ||
        item.Category ||
        item["Product Category"] ||
        "",
    };
  };

  /* ----------------------------------
     SIZE PRICE CALCULATION
  ---------------------------------- */
  const getPrice = (basePrice, size) => {
    const price = toNumber(basePrice, 0);

    switch (size) {
      case "250ml":
        return Math.round(price * 0.25);
      case "500ml":
        return Math.round(price * 0.5);
      case "1L":
        return Math.round(price);
      case "2L":
        return Math.round(price * 2);
      case "3L":
        return Math.round(price * 3);
      case "5L":
        return Math.round(price * 5);
      default:
        return Math.round(price);
    }
  };

  /* ----------------------------------
     LOAD PRODUCTS
  ---------------------------------- */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();

        console.log("Products API response:", data);

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const normalized = list
          .map((item, index) => normalizeProduct(item, index))
          .filter((p) => p.name && p.name.trim() !== "");

        console.log("Normalized products:", normalized);

        setProducts(normalized);
      } catch (error) {
        console.error("Products fetch failed:", error);
        setProducts([]);
      }
    };

    loadProducts();
    setCartCount(getCartItemCount());

    // sync cart count if localStorage changes in another tab/page
    const onStorage = () => setCartCount(getCartItemCount());
    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ----------------------------------
     QUANTITY HANDLERS
  ---------------------------------- */
  const increaseQty = (product) => {
    const current = quantities[product.id] || 1;
    const stock = toNumber(product.stock, 0);

    if (current < stock) {
      setQuantities((prev) => ({
        ...prev,
        [product.id]: current + 1,
      }));
    }
  };

  const decreaseQty = (product) => {
    const current = quantities[product.id] || 1;

    if (current > 1) {
      setQuantities((prev) => ({
        ...prev,
        [product.id]: current - 1,
      }));
    }
  };

  /* ----------------------------------
     ADD TO CART
  ---------------------------------- */
  const handleAddToCart = async (product) => {
    const qty = quantities[product.id] || 1;
    const size = selectedSizes[product.id] || "1L";
    const price = getPrice(product.price, size);

    if (!customer) {
      setToast("Please login to add products to cart");
      setTimeout(() => setToast(""), 1800);
      navigate("/auth");
      return;
    }

    if (!product.name || price <= 0) {
      setToast("Product data is invalid");
      setTimeout(() => setToast(""), 1800);
      return;
    }

    try {
      await addProductToCart({
        customer_id: customer.id,
        product_id: product.id,
        quantity: qty,
        price,
        size,
      });

      // Keep the existing local cart badge in sync.
      addToCart({
        id: product.id,
        name: product.name,
        image: product.image || FALLBACK_IMAGE,
        size,
        qty,
        price,
        stock: product.stock,
        total: qty * price,
      });

      setCartCount(getCartItemCount());
      setToast(`${product.name} added to cart`);
      playCartSound();

      setTimeout(() => setToast(""), 1800);
    } catch (err) {
      console.error("Add to cart failed:", err);
      setToast(err?.message || "Failed to add item");
      setTimeout(() => setToast(""), 2200);
    }
  };

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    ...Array.from(
      new Set(
        products
          .map((p) => String(p.category || "").trim())
          .filter(Boolean)
      )
    ),
  ];

  const visibleProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      String(product.category || "").trim() === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f6fbf7] text-slate-900">
      <audio ref={audioRef} preload="auto">
        <source
          src="https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
          type="audio/ogg"
        />
      </audio>

      {/* Floating cart */}
      <button
        onClick={() => navigate("/cart")}
        className="fixed right-4 bottom-5 sm:right-7 sm:bottom-7 z-50 group"
        aria-label="Open cart"
      >
        <span className="absolute inset-0 rounded-[22px] bg-emerald-400/30 blur-xl group-hover:blur-2xl transition" />
        <span className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-emerald-500 to-green-700 text-2xl shadow-[0_16px_40px_rgba(16,185,129,.35)] ring-4 ring-white">
          🛒
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-2 flex min-w-6 h-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-black text-white shadow-lg animate-bounce">
              {cartCount}
            </span>
          )}
        </span>
      </button>

      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 lg:px-8 lg:py-7">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-[#063b24] via-[#087b45] to-[#11ad67] px-5 py-8 text-white shadow-[0_25px_70px_rgba(6,95,55,.22)] sm:px-9 sm:py-11 lg:px-14 lg:py-14">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl animate-pulse" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="absolute right-[18%] top-10 text-3xl opacity-60 animate-bounce">✦</div>

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur-md">
                <span>🌿</span>
                Farm Fresh • Pure • Delivered Daily
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Fresh dairy,
                <span className="block text-emerald-100">made simple.</span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base sm:leading-7">
                Shop fresh milk, curd and everyday dairy essentials with
                convenient sizes and doorstep delivery.
              </p>

              <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold sm:text-sm">
                <span className="rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                  🥛 Fresh Dairy
                </span>
                <span className="rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                  🚚 Home Delivery
                </span>
                <span className="rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                  🔒 Secure Checkout
                </span>
              </div>
            </div>

            <div className="hidden lg:flex h-44 w-44 items-center justify-center rounded-[38px] border border-white/20 bg-white/10 text-7xl shadow-2xl backdrop-blur-md">
              🥛
            </div>
          </div>
        </section>

        {/* SEARCH + CONTROLS */}
        <section className="sticky top-2 z-30 mt-5 rounded-[26px] border border-emerald-100 bg-white/90 p-3 shadow-[0_12px_35px_rgba(15,118,80,.10)] backdrop-blur-xl sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                🔎
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search milk, curd, ghee, paneer..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-black transition-all duration-300 ${
                    activeCategory === category
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.02]"
                      : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION TITLE */}
        <div className="mt-8 mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-600">
              Our collection
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Fresh Dairy Products
            </h2>
          </div>
          <div className="rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">
            {visibleProducts.length} products
          </div>
        </div>

        {/* TOAST */}
        {toast && (
          <div className="fixed left-1/2 top-24 z-[60] -translate-x-1/2 animate-[fadeIn_.25s_ease-out]">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-2xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                ✓
              </span>
              {toast}
            </div>
          </div>
        )}

        {/* PRODUCT GRID */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((product, index) => {
              const currentSize = selectedSizes[product.id] || "1L";
              const currentQty = quantities[product.id] || 1;
              const currentPrice = getPrice(product.price, currentSize);
              const stock = toNumber(product.stock, 0);
              const lowStock = stock > 0 && stock <= 5;

              return (
                <article
                  key={product.id || index}
                  className={`group relative overflow-hidden rounded-[26px] border bg-white shadow-[0_8px_30px_rgba(15,23,42,.07)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(16,120,75,.16)] ${
                    stock === 0
                      ? "border-slate-200 opacity-75"
                      : "border-emerald-100"
                  }`}
                >
                  {/* IMAGE */}
                  <div className="relative aspect-[1.05/1] overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-100 sm:aspect-[1.12/1]">
                    <img
                      src={product.image || FALLBACK_IMAGE}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="absolute left-3 top-3">
                      <span
                        className={`rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide shadow-lg backdrop-blur-md sm:px-3 sm:text-[10px] ${
                          stock > 0
                            ? "bg-white/95 text-emerald-700"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {stock > 0 ? "● In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    {lowStock && (
                      <div className="absolute bottom-3 left-3 rounded-full bg-amber-400 px-2.5 py-1.5 text-[9px] font-black text-amber-950 shadow-lg">
                        ⚡ Only {stock} left
                      </div>
                    )}

                    <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1.5 text-[9px] font-bold text-white backdrop-blur-md">
                      {stock} available
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-3.5 sm:p-5">
                    <div className="min-h-[44px]">
                      <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-900 sm:text-lg">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-2 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xl font-black text-emerald-700 sm:text-2xl">
                          ₹{currentPrice}
                        </p>
                        <p className="text-[9px] font-medium text-slate-400 sm:text-[11px]">
                          Base ₹{toNumber(product.price)}/L
                        </p>
                      </div>
                      <span className="rounded-xl bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                        Fresh
                      </span>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                        Select size
                      </label>
                      <select
                        value={currentSize}
                        onChange={(e) =>
                          setSelectedSizes((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      >
                        <option value="250ml">250 ml</option>
                        <option value="500ml">500 ml</option>
                        <option value="1L">1 Liter</option>
                        <option value="2L">2 Liter</option>
                        <option value="3L">3 Liter</option>
                        <option value="5L">5 Liter</option>
                      </select>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-100">
                      <button
                        disabled={stock === 0 || currentQty <= 1}
                        onClick={() => decreaseQty(product)}
                        className="h-9 w-9 rounded-xl bg-white text-lg font-black text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-500 active:scale-90 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        −
                      </button>
                      <div className="text-center">
                        <span className="block text-sm font-black text-slate-900">
                          {currentQty}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                          Quantity
                        </span>
                      </div>
                      <button
                        disabled={stock === 0 || currentQty >= stock}
                        onClick={() => increaseQty(product)}
                        className="h-9 w-9 rounded-xl bg-emerald-600 text-lg font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        +
                      </button>
                    </div>

                    <button
                      disabled={stock === 0}
                      onClick={() => handleAddToCart(product)}
                      className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black transition-all duration-300 active:scale-[.97] sm:text-sm ${
                        stock === 0
                          ? "cursor-not-allowed bg-slate-200 text-slate-400"
                          : "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-300"
                      }`}
                    >
                      <span>{stock === 0 ? "Unavailable" : "Add to Cart"}</span>
                      {stock > 0 && <span className="text-base">→</span>}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[32px] border border-emerald-100 bg-white px-6 py-16 text-center shadow-lg">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-4xl">
              🥛
            </div>
            <h3 className="mt-5 text-2xl font-black text-slate-900">
              No products found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Try another search or category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
              className="mt-5 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg"
            >
              Show All Products
            </button>
          </div>
        )}

        {/* TRUST STRIP */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["🥛", "Fresh Products"],
            ["🚚", "Daily Delivery"],
            ["💳", "Easy Payment"],
            ["💚", "Quality First"],
          ].map(([icon, title]) => (
            <div
              key={title}
              className="rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl">{icon}</div>
              <p className="mt-2 text-[10px] font-black text-slate-600 sm:text-xs">
                {title}
              </p>
            </div>
          ))}
        </section>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
