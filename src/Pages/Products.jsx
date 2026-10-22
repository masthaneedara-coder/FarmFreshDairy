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
  const [search, setSearch] = useState("");
const [activeCategory, setActiveCategory] = useState("All");

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
 const getPrice = (basePrice, size, productName = "") => {
  const price = toNumber(basePrice, 0);

  const normalizedProductName = String(productName || "")
    .trim()
    .toLowerCase();

  // -----------------------------------------
  // BUFFALO MILK PRICING
  // -----------------------------------------
  if (normalizedProductName === "buffalo milk") {
    switch (size) {
      case "500ml":
        return 45;

      case "1L":
        return 85;

      case "250ml":
        return 25;

      case "2L":
        return 170;

      case "3L":
        return 255;

      case "5L":
        return 425;

      default:
        return 85;
    }
  }

  // -----------------------------------------
  // DEFAULT PRICING FOR OTHER PRODUCTS
  // -----------------------------------------
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
    let mounted = true;

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
          .filter((product) => product.name.trim() !== "");

        console.log("Normalized products:", normalized);

        if (mounted) {
          setProducts(normalized);
        }
      } catch (error) {
        console.error("Products fetch failed:", error);

        if (mounted) {
          setProducts([]);
        }
      }
    };

    loadProducts();
    setCartCount(getCartItemCount());

    const onStorage = () => {
      setCartCount(getCartItemCount());
    };

    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  
const categories = [
  "All",
  ...new Set(
    products
      .map((product) => String(product.category || "").trim())
      .filter(Boolean)
  ),
];

const visibleProducts = products.filter((product) => {
  const matchesSearch = String(product.name || "")
    .toLowerCase()
    .includes(search.trim().toLowerCase());

  const matchesCategory =
    activeCategory === "All" ||
    String(product.category || "").trim() === activeCategory;

  return matchesSearch && matchesCategory;
});

const notify = (message) => {
  setToast(message);
  window.setTimeout(() => setToast(""), 2000);
};
const searchInputRef = useRef(null);
const handleAddToCart = async (product) => {
  const qty = quantities[product.id] || 1;
  const size = selectedSizes[product.id] || "1L";

  const price = getPrice(
    product.price,
    size,
    product.name
  );

  if (!customer) {
    setToast("Please login to add products to cart");
    window.setTimeout(() => setToast(""), 1800);
    navigate("/auth");
    return;
  }

  if (!product.name || price <= 0) {
    setToast("Product data is invalid");
    window.setTimeout(() => setToast(""), 1800);
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

    window.setTimeout(() => setToast(""), 1800);
  } catch (err) {
    console.error("Add to cart failed:", err);
    setToast(err?.message || "Failed to add item");
    window.setTimeout(() => setToast(""), 2200);
  }
};



    return (
    <div className="min-h-screen bg-white pb-28 text-slate-900">
      <audio ref={audioRef} preload="none">
        <source src="https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg" type="audio/ogg" />
      </audio>

      {/* Page content: compact grocery-app layout */}
      <main className="mx-auto max-w-[1500px]">
        {/* Mobile category header; desktop keeps the site's existing Navbar */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur sm:hidden">
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="flex h-10 w-8 items-center justify-start text-3xl font-light">‹</button>
          <h1 className="min-w-0 flex-1 truncate px-2 text-center text-lg font-bold">
            {activeCategory === "All" ? "Fresh Dairy Products" : activeCategory}
          </h1>
          <button type="button" onClick={() => notify("Search products below")} aria-label="Search products" className="flex h-10 w-9 items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/></svg>
          </button>
        </div>

        {/* Desktop search and filters */}
        <section className="hidden border-b border-slate-100 bg-white p-4 sm:block lg:px-8">
          <label className="relative block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/></svg>
            </span>
            <input ref={searchInputRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search milk, curd, ghee, paneer..." aria-label="Search products" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
          </label>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${activeCategory === category ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{category}</button>
            ))}
          </div>
        </section>

        {/* Compact banner carousel */}
        <section className="overflow-hidden py-3 sm:px-6 sm:py-5">
          <div className="mx-auto flex max-w-5xl gap-3 overflow-x-auto px-3 sm:px-0">
            <div className="relative flex h-28 min-w-[78%] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-sky-700 to-sky-400 px-5 text-white sm:h-40 sm:min-w-[55%]">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">FarmFreshDairy</p>
                <h2 className="mt-1 text-xl font-black sm:text-3xl">Fresh every day</h2>
                <p className="mt-1 text-xs sm:text-sm">Quality essentials delivered to your door</p>
              </div>
              <span className="absolute -right-2 bottom-0 text-7xl opacity-80 sm:text-9xl" aria-hidden="true">🥛</span>
            </div>
            <div className="flex h-28 min-w-[70%] items-center rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-500 px-5 text-white sm:h-40 sm:min-w-[40%]">
              <div><p className="text-xs font-bold uppercase tracking-wider text-white/80">Goodness in every drop</p><h2 className="mt-1 text-xl font-black sm:text-3xl">Shop dairy</h2><p className="mt-1 text-xs">Freshness you can trust</p></div>
            </div>
          </div>
        </section>

        <div className="px-3 pb-5 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-end justify-between sm:mb-5">
            <div>
              <p className="hidden text-[10px] font-extrabold uppercase tracking-[.18em] text-emerald-700 sm:block">Our collection</p>
              <h2 className="text-lg font-extrabold sm:mt-1 sm:text-2xl">{activeCategory === "All" ? "Popular Products" : activeCategory}</h2>
            </div>
            <span className="text-[11px] font-medium text-slate-500">{visibleProducts.length} products</span>
          </div>

          {/* Mobile: category rail + 2-column products; desktop: regular grid */}
          <div className="grid grid-cols-[66px_minmax(0,1fr)] gap-3 sm:block">
            <aside className="sticky top-14 h-[calc(100dvh-230px)] overflow-y-auto border-r border-slate-100 pr-2 sm:hidden">
              {categories.map((category, index) => (
                <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`mb-3 flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-center ${activeCategory === category ? "bg-pink-50 text-fuchsia-700" : "text-slate-600"}`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${activeCategory === category ? "bg-pink-100" : "bg-slate-50"}`}>{category === "All" ? "🧺" : /milk|dairy|curd|paneer|ghee/i.test(category) ? "🥛" : /egg/i.test(category) ? "🥚" : /fruit|veg/i.test(category) ? "🥬" : ["🥣", "🧀", "🫙", "🥛"][index % 4]}</span>
                  <span className="line-clamp-2 w-full text-[9px] leading-3">{category}</span>
                </button>
              ))}
            </aside>

            <div>
              {/* Search appears above products on mobile */}
              <label className="relative mb-3 block sm:hidden">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/></svg></span>
                <input ref={searchInputRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." aria-label="Search products" className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-emerald-400" />
              </label>

              {visibleProducts.length ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {visibleProducts.map((product) => {
                    const size = selectedSizes[product.id] || "1L";
                    const qty = quantities[product.id] || 1;
                    const price = getPrice(product.price, size, product.name);
                    const stock = toNumber(product.stock);
                    const originalPrice = Math.round(toNumber(product.price) * (size === "500ml" ? 0.5 : size === "250ml" ? 0.25 : size === "2L" ? 2 : size === "3L" ? 3 : size === "5L" ? 5 : 1));
                    const discount = originalPrice > price ? originalPrice - price : 0;

                    return (
                      <article key={product.id} className="min-w-0 bg-white">
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 sm:rounded-2xl">
                          <img src={product.image || FALLBACK_IMAGE} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="h-full w-full object-cover" />
                          <button type="button" aria-label={`Save ${product.name} to favourites`} onClick={() => notify("Favourites are not available yet")} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>
                          </button>
                          {stock <= 0 && <span className="absolute left-1 top-1 rounded-md bg-rose-500 px-1.5 py-1 text-[7px] font-bold text-white">OUT OF STOCK</span>}
                          <button type="button" disabled={stock <= 0} onClick={() => handleAddToCart(product)} className="absolute bottom-1.5 right-1.5 flex h-10 min-w-[82px] items-center justify-center rounded-lg border-2 border-pink-500 bg-white px-4 text-sm font-bold tracking-wide text-pink-600 shadow-md disabled:opacity-50 sm:bottom-2 sm:right-2 sm:h-11 sm:min-w-[96px]">ADD</button>
                        </div>

                        <div className="pt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md bg-green-700 px-1.5 py-1 text-xs font-extrabold text-white">₹{price}</span>
                            {discount > 0 && <span className="text-[10px] text-slate-400 line-through">₹{originalPrice}</span>}
                          </div>
                          {discount > 0 && <p className="mt-1 text-[10px] font-bold text-green-700">₹{discount} OFF</p>}
                          <h3 className="mt-1.5 line-clamp-2 text-sm font-medium leading-5 text-slate-900">{product.name}</h3>
                          <p className="mt-1 text-xs text-slate-500">{size === "1L" ? "1 Liter" : size}</p>

                          <div className="mt-2 flex items-center justify-between gap-1">
                            <select aria-label={`Size for ${product.name}`} value={size} onChange={(e) => setSelectedSizes((prev) => ({ ...prev, [product.id]: e.target.value }))} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 text-[10px] sm:text-xs">
                              <option value="250ml">250 ml</option><option value="500ml">500 ml</option><option value="1L">1 Liter</option><option value="2L">2 Liter</option><option value="3L">3 Liter</option><option value="5L">5 Liter</option>
                            </select>
                            <div className="flex items-center gap-1">
                              <button type="button" disabled={stock <= 0 || qty <= 1} onClick={() => decreaseQty(product)} aria-label="Decrease quantity" className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm disabled:opacity-30">−</button>
                              <span className="min-w-3 text-center text-xs font-semibold">{qty}</span>
                              <button type="button" disabled={stock <= 0 || qty >= stock} onClick={() => increaseQty(product)} aria-label="Increase quantity" className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white disabled:bg-slate-200">+</button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No products found. Try another category or search.</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom promo + cart bar, inspired by the reference */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-white via-white/95 to-transparent px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-4 sm:hidden">
        <div className="flex items-stretch gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-[#292e3b] px-3 py-3 text-white shadow-lg">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/80 text-lg">%</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">Fresh offers for you</p>
              <p className="truncate text-[10px] text-white/75">Shop fresh, save more</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate("/cart")} className="flex w-[118px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-pink-600 px-3 text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
            <span className="text-left"><span className="block text-sm font-bold">Cart</span><span className="block text-[10px]">{cartCount} item{cartCount === 1 ? "" : "s"}</span></span>
          </button>
        </div>
      </div>

      {/* Desktop floating cart */}
      <button type="button" onClick={() => navigate("/cart")} aria-label={`Open cart, ${cartCount} items`} className="fixed bottom-6 right-6 z-50 hidden h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg sm:flex">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
        {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">{cartCount}</span>}
      </button>

      {toast && <div role="status" className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl">{toast}</div>}
    </div>
  );
}
