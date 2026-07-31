import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../services/productService";
import { addToCart, getCartItemCount } from "../config/cart";
import { useSearchParams } from "react-router-dom";

import { addProductToCart } from "../services/cartService";
import { useAuthSession } from "../context/AuthSessionContext";
import Categories from "../Components/home/Categories";


const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1200&auto=format&fit=crop";

export default function Products() {
  const [searchParams] = useSearchParams();

const selectedCategory =
  searchParams.get("category") || "All";
  const navigate = useNavigate();
  const { customer } = useAuthSession();
  const audioRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [toast, setToast] = useState("");
  const [addedProduct, setAddedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
  setCartCount(getCartItemCount());
}, []);

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
  item.categories?.name ||
  item.Category ||
  item["Product Category"] ||
  item.product_category ||
  item.productType ||
  item.type ||
  "",

  product_sizes: item.product_sizes || [],
  };
};
    
    

  const categories = useMemo(() => {
  const uniqueCategories = [
    "All",
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    ),
  ];

  return uniqueCategories;
}, [products]);


 
 const filteredProducts = products.filter((product) => {
  const keyword = searchTerm.trim().toLowerCase();

  const matchesCategory =
    selectedCategory === "All" ||
    product.category?.trim() === selectedCategory;

  const matchesSearch =
    keyword === "" ||
    product.name?.toLowerCase().includes(keyword) ||
    product.category?.toLowerCase().includes(keyword);

  return matchesCategory && matchesSearch;
});

  /* ----------------------------------
     SIZE PRICE CALCULATION
  ---------------------------------- */
  // const getPrice = (basePrice, size) => {
  //   const price = toNumber(basePrice, 0);

  //   switch (size) {
  //     case "250ml":
  //       return Math.round(price * 0.25);
  //     case "500ml":
  //       return Math.round(price * 0.5);
  //     case "1L":
  //       return Math.round(price);
  //     case "2L":
  //       return Math.round(price * 2);
  //     case "3L":
  //       return Math.round(price * 3);
  //     case "5L":
  //       return Math.round(price * 5);
  //     default:
  //       return Math.round(price);
  //   }
  // };

  /* ----------------------------------
     LOAD PRODUCTS
  ---------------------------------- */
 useEffect(() => {
  loadProducts();
}, []);

const loadProducts = async () => {
  try {
    setLoading(true);
    setError("");

    const products = await getProducts();

    console.log("API Response:", products);

    const list = products.map((item, index) =>
      normalizeProduct(item, index)
    );

    setProducts(list);
  } catch (err) {
    console.error(err);

    setError("Failed to load products.");
  } finally {
    setLoading(false);
  }
};

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
 const getCalculatedPrice = (product) => {

  const sizes = product.product_sizes || [];

  // If no sizes exist, use the product price
  if (sizes.length === 0) {
    return Number(product.price || 0);
  }

  // Selected size label
  const selectedLabel =
    selectedSizes[product.id] ||
    sizes[0].label;

  // Find selected size object
  const selectedSize = sizes.find(
    (size) => size.label === selectedLabel
  );
  if (selectedSize && !selectedSize.available) {

  setToast("Selected size is out of stock.");

  return;

}

  return Number(
    selectedSize?.price || product.price || 0
  );
};
const handleAddToCart = async (product) => {
  const qty = quantities[product.id] || 1;
  const size = selectedSizes[product.id] || "1 L";
  const price = getCalculatedPrice(product);

  if (!customer) {
    navigate("/auth");
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

    // Keep local cart temporarily so existing Cart page still works
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
    setAddedProduct(product.id);
    playCartSound();
    setToast(`${product.name} added to cart`);

    setTimeout(() => {
      setToast("");
      setAddedProduct(null);
    }, 2000);

  } catch (err) {
    console.error(err);
    setToast("Failed to add item");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Cart sound */}
      <audio ref={audioRef} preload="auto">
        <source src="https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg" type="audio/ogg" />
      </audio>

      <div className="max-w-7xl mx-auto">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-[28px] border border-green-100 bg-gradient-to-br from-[#f7fff8] via-white to-[#eefaf0] px-4 sm:px-8 py-8 sm:py-10 shadow-[0_10px_40px_rgba(34,197,94,0.08)] mb-6 sm:mb-8">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
            <button
              onClick={() => navigate("/cart")}
              className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 backdrop-blur-md border border-green-100 text-green-700 shadow-xl hover:scale-105 transition"
            >
              <span className="text-2xl">🛒</span>

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[22px] h-6 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-green-100 bg-white/90 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-green-700 shadow-sm backdrop-blur-md">
              <span>🌿</span>
              <span>100% Natural & Fresh Dairy</span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-green-950">
              Fresh Dairy Products
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
              Pure, fresh and healthy dairy products delivered daily with quality you can trust.
            </p>

            <div className="mx-auto mt-5 h-1.5 w-20 sm:w-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"></div>
          </div>
        </div>

        {/* TOAST */}
        {toast && (
          <div className="fixed top-24 right-4 z-50 rounded-2xl bg-green-600 text-white px-5 py-3 shadow-2xl font-bold">
            {toast}
          </div>
        )}

        {/* PRODUCTS GRID */}
        <Categories
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={(category) =>
            navigate(`/products?category=${encodeURIComponent(category)}`)
          }
        />
        <div className="max-w-xl mx-auto mt-6">
        <input
          type="text"
          placeholder="🔍 Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-green-200 px-5 py-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />
      </div>
        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center mt-8">

            <div className="animate-spin rounded-full h-14 w-14 border-4 border-green-200 border-t-green-600 mx-auto"></div>

            <p className="mt-5 text-lg font-semibold text-gray-600">
              Loading products...
            </p>

          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center mt-8">

            <h2 className="text-2xl font-bold text-red-700">
              {error}
            </h2>

            <button
              onClick={loadProducts}
              className="mt-5 bg-red-600 text-white px-6 py-3 rounded-xl font-bold"
            >
              Retry
            </button>

          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-lg p-10 text-center mt-8">
                  <div className="text-6xl mb-4">🥛</div>

                  <h2 className="text-2xl font-black text-gray-700">
                    {searchTerm
                      ? `No products found for "${searchTerm}"`
                      : "No products found"}
                  </h2>
                </div>
              ) : (
           
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">

                {filteredProducts.map((product) => {
                  const qty = quantities[product.id] || 1;
                const price = getCalculatedPrice(product);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl shadow-lg border border-green-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                    >
                      <img
                        src={product.image?.trim() || FALLBACK_IMAGE}
                        onError={(e) => {
                          e.target.src = FALLBACK_IMAGE;
                        }}
                        alt={product.name}
                        className="w-full h-36 object-cover"
                      />

                      <div className="p-3">
                        <h3 className="text-lg font-bold text-green-800">
                          {product.name}
                        </h3>

                        <p className="text-xl font-bold text-green-600 mt-1">
                          ₹{getCalculatedPrice(product)}
                        </p>
                        {/* Size Selection */}

                         <div className="mt-3">

                            <p className="text-sm font-semibold text-gray-700 mb-2">
                              Size
                            </p>

                            <div className="flex flex-wrap gap-2">

                             {(product.product_sizes || []).map((size) => {

                              const isSelected =
                                (selectedSizes[product.id] ||
                                  product.product_sizes?.[0]?.label) === size.label;

                              return (
                                <button
                                  key={size.id}
                                  type="button"

                                  disabled={!size.available}

                                  onClick={() => {

                                    if (!size.available) return;

                                    setSelectedSizes(prev => ({
                                      ...prev,
                                      [product.id]: size.label,
                                    }));

                                  }}

                                  className={`

                                    px-3
                                    py-1.5
                                    rounded-full
                                    text-sm
                                    font-semibold
                                    border
                                    transition-all
                                    duration-300

                                    ${
                                      !size.available
                                        ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                                        : isSelected
                                        ? "bg-green-600 text-white border-green-600 shadow"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600"
                                    }

                                  `}
                                >
                                  {size.label}

                                  {!size.available && (
                                    <div className="text-[10px]">
                                      Out
                                    </div>
                                  )}

                                </button>
                              );

                            })}

                            </div>

                          </div>

                       <p
                            className={`mt-2 font-semibold ${
                              product.stock <= 0
                                ? "text-red-600"
                                : product.stock <= 5
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            {product.stock <= 0
                              ? "🔴 Out of Stock"
                              : product.stock <= 5
                              ? `🟡 Only ${product.stock} Left`
                              : `🟢 In Stock (${product.stock})`}
                              
                          </p>

                       <div
                          className={
                            product.is_subscription
                              ? "grid grid-cols-2 gap-2 mt-3"
                              : "mt-3"
                          }
                        >
                          <button
                            disabled={Number(product.stock) === 0}
                            onClick={() => handleAddToCart(product)}
                            className={`rounded-2xl py-3 font-bold transition-all duration-300 ${
                              Number(product.stock) === 0
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : addedProduct === product.id
                                ? "bg-green-700 text-white scale-105 shadow-lg"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            } ${
                              product.is_subscription ? "" : "w-full"
                            }`}
                          >
                            {Number(product.stock) === 0
                              ? "Out of Stock"
                              : addedProduct === product.id
                              ? "✓ Added"
                              : "Add To Cart"}
                          </button>

                          {product.is_subscription && (
                            <button
                              disabled={Number(product.stock) === 0}
                              onClick={() => navigate("/subscription")}
                              className={`rounded-2xl py-3 font-bold ${
                                Number(product.stock) === 0
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-green-50 hover:bg-green-100 text-green-700"
                              }`}
                            >
                              Subscribe
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}

                  </div>
                </div>
              );
            }
            
            
          