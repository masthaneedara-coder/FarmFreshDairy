import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../Components/AdminLayout";
import {
  fetchProducts,
  fetchCategories,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../config/api";
import ProductSizeEditor from "../Components/admin/ProductSizes";

const EMPTY_PRODUCT = {
  id: "",
  name: "",
  price: "",
  stock: "",
  image: "",
  category_id: "",
};

const DEFAULT_IMAGE =
  "https://script.google.com/macros/s/AKfycbwLKt8d5VcS_uGmzk7t16EdgE7Qpx4crtitjxC6QWyJLde3RWtJuwRvIWWX3bXIM9UM/exec";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);

const [selectedProduct, setSelectedProduct] = useState(null);

  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [editingProduct, setEditingProduct] = useState(null);
  

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
        ? data.products
        : [];

      setProducts(list);
    } catch (error) {
      console.error("Products fetch failed:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const list = await fetchCategories();
    console.log("Categories from API:", list);
    setCategories(list);
};
useEffect(() => {
    console.log("Categories state:", categories);
}, [categories]);
  

  const categoryOptions = useMemo(() => {
  const list = products
    .map((p) => String(p.categories?.name || "").trim())
    .filter(Boolean);

  return ["All", ...new Set(list)];
}, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const name = String(product.name || "").toLowerCase();
      const category = String(product.categories.name || "");
      const stock = Number(product.stock || 0);

      const matchesSearch =
        !search.trim() || name.includes(search.trim().toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || category === categoryFilter;

      const matchesStock =
        stockFilter === "All" ||
        (stockFilter === "In Stock" && stock > 5) ||
        (stockFilter === "Low Stock" && stock > 0 && stock <= 5) ||
        (stockFilter === "Out Of Stock" && stock === 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const low = products.filter((p) => {
      const stock = Number(p.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;
    const out = products.filter((p) => Number(p.stock || 0) === 0).length;
    const value = products.reduce(
      (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
      0
    );

    return { total, low, out, value };
  }, [products]);

  const getStockStatus = (stock) => {
    const qty = Number(stock || 0);

    if (qty === 0) {
      return {
        label: "Out Of Stock",
        className: "bg-red-100 text-red-600 border border-red-200",
      };
    }

    if (qty <= 5) {
      return {
        label: "Low Stock",
        className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      };
    }

    return {
      label: "In Stock",
      className: "bg-green-100 text-green-700 border border-green-200",
    };
  };

  const formatMoney = (value) => {
    const num = Number(value || 0);
    if (Number.isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const resetNewProduct = () => {
    setNewProduct(EMPTY_PRODUCT);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert("Please enter product name and price");
      return;
    }

    try {
      const payload = {
        ...newProduct,
        price: Number(newProduct.price || 0),
        stock: Number(newProduct.stock || 0),
      };

      const res = await addProduct(payload);

      if (res?.success) {
        alert("Product added successfully");
        setShowAddModal(false);
        resetNewProduct();
        loadProducts();
      } else {
        alert(res?.message || "Failed to add product");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add product");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct?.name || !editingProduct?.price) {
      alert("Please enter product name and price");
      return;
    }

    try {
      const payload = {
        ...editingProduct,
        price: Number(editingProduct.price || 0),
        stock: Number(editingProduct.stock || 0),
      };

      const res = await updateProduct(payload.id, payload);

      if (res?.success) {
        alert("Product updated successfully");
        setShowEditModal(false);
        setEditingProduct(null);
        loadProducts();
      } else {
        alert(res?.message || "Failed to update product");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update product");
    }
  };

  const handleDeleteProduct = async (product) => {
    const ok = window.confirm(`Delete "${product.name}" from products list?`);
    if (!ok) return;

    try {
      const res = await deleteProduct(product.id || product.name);

      if (res?.success) {
        alert("Product deleted successfully");
        loadProducts();
      } else {
        alert(res?.message || "Failed to delete product");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete product");
    }
  };
 

  return (
    <AdminLayout title="Products Management">
      <div className="space-y-5 sm:space-y-6">
        {/* HERO */}
        <div className="rounded-[26px] sm:rounded-[30px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 p-4 sm:p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-white/80 text-xs sm:text-sm">
                Admin Product Control
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black mt-1">
                🥛 Products Management
              </h1>
              <p className="text-white/90 mt-2 text-sm sm:text-base">
                Add, edit, delete and manage dairy products, stock and pricing.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-3 rounded-2xl bg-white text-green-700 font-bold shadow text-sm sm:text-base"
              >
                + Add Product
              </button>

              <button
                onClick={loadProducts}
                className="px-4 py-3 rounded-2xl bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Total" value={stats.total} color="green" icon="🥛" />
          <StatCard title="Low Stock" value={stats.low} color="yellow" icon="⚠️" />
          <StatCard title="Out" value={stats.out} color="red" icon="📦" />
          <StatCard
            title="Value"
            value={formatMoney(stats.value)}
            color="blue"
            icon="💰"
          />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Search Product
              </label>
              <input
                type="text"
                placeholder="Search product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat || "Uncategorized"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              >
                <option value="All">All</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out Of Stock">Out Of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* PRODUCT LIST */}
        {loading ? (
          <div className="bg-slate-50 rounded-3xl p-10 text-center">
            <div className="text-5xl mb-3 animate-pulse">⏳</div>
            <p className="text-lg font-semibold text-slate-600">
              Loading products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-10 text-center">
            <div className="text-6xl mb-4">🥛</div>
            <h2 className="text-2xl font-black text-slate-700">No products found</h2>
            <p className="text-slate-500 mt-2">
              Try changing search/filter or add a new product.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product, index) => {
              const status = getStockStatus(product.stock);

              return (
                <div
                  key={product.id || index}
                  className="bg-white rounded-3xl shadow-md border border-slate-100 p-4 sm:p-5 hover:shadow-xl transition"
                >
                  {/* MOBILE FIRST PRODUCT CARD */}
                  <div className="flex flex-col gap-4">
                    {/* TOP */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* IMAGE */}
                      <div className="w-full sm:w-36 shrink-0">
                        <img
                          src={product.image || DEFAULT_IMAGE}
                          alt={product.name}
                          className="w-full h-44 sm:h-32 object-cover rounded-2xl border"
                        />
                      </div>

                      {/* MAIN DETAILS */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 break-words">
                              {product.name || "-"}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1 break-all">
                              Product ID: {product.id || "-"}
                            </p>
                          </div>

                          <span
                            className={`inline-flex w-fit px-3 py-1 rounded-full font-bold text-xs sm:text-sm ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <InfoBox label="Category" value={product.categories.name || "-"} />
                          <InfoBox label="Stock" value={product.stock || 0} />
                          <InfoBox label="Price" value={formatMoney(product.price)} />
                          <InfoBox
                            label="Value"
                            value={formatMoney(
                              Number(product.price || 0) * Number(product.stock || 0)
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-2 sm:flex gap-3 sm:justify-end">
                      <button
                        onClick={() => {
                          setEditingProduct({
                            id: product.id || "",
                            name: product.name || "",
                            price: product.price || "",
                            stock: product.stock || "",
                            image: product.image || "",
                            category_id: product.category_id || ""
                          });
                          setShowEditModal(true);
                        }}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow text-sm sm:text-base"
                      >
                        Edit
                      </button>
                     <button
                        onClick={() => {
                          console.log("Sizes button clicked", product);

                          setSelectedProduct(product);
                          setShowSizeModal(true);
                        }}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow"
                      >
                        Sizes
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold shadow text-sm sm:text-base"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ADD MODAL */}
        {showAddModal && (
          <ProductModal
              title="Add New Product"
              product={newProduct}
              setProduct={setNewProduct}
              categories={categories}
              onClose={() => {
                  setShowAddModal(false);
                  resetNewProduct();
              }}
              onSave={handleAddProduct}
              saveText="Add Product"
          />
        )}
        {showSizeModal && selectedProduct && (

            <ProductSizeEditor
                product={selectedProduct}
                onClose={()=>{
                    setShowSizeModal(false);
                    setSelectedProduct(null);
                }}
            />

        )}

        {/* EDIT MODAL */}
        {showEditModal && editingProduct && (
         <ProductModal
            title="Edit Product"
            product={editingProduct}
            setProduct={setEditingProduct}
            categories={categories}
            onClose={() => {
                setShowEditModal(false);
                setEditingProduct(null);
            }}
            onSave={handleUpdateProduct}
            saveText="Save Changes"
        />
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, color = "green", icon = "📊" }) {
  const styles = {
    green: "border-green-100 text-green-700 bg-white",
    yellow: "border-yellow-100 text-yellow-700 bg-white",
    red: "border-red-100 text-red-700 bg-white",
    blue: "border-blue-100 text-blue-700 bg-white",
  };

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 shadow-lg border ${styles[color] || styles.green}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-slate-500 text-xs sm:text-sm">{title}</p>
          <h3 className="text-xl sm:text-3xl font-black mt-2 break-words">
            {value}
          </h3>
        </div>
        <div className="text-2xl sm:text-3xl shrink-0">{icon}</div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 min-w-0">
      <p className="text-xs sm:text-sm text-slate-500 font-medium">{label}</p>
      <h3 className="text-sm sm:text-lg font-black text-slate-800 mt-1 break-words">
        {value}
      </h3>
    </div>
  );
}

function ProductModal({
    title,
    product,
    setProduct,
    categories = [],
    onClose,
    onSave,
    saveText,
}) {
  const [uploading, setUploading] = useState(false);
  const updateField = (field, value) => {
    setProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-3 py-3 sm:py-4">
      <div className="
    w-full
    sm:w-[95%]
    lg:w-[90%]
    xl:w-[80%]
    max-w-6xl
    bg-white
    rounded-t-3xl
    sm:rounded-3xl
    shadow-2xl
    max-h-[95vh]
    flex
    flex-col
">
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-4 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black">{title}</h2>
            <p className="text-white/80 text-xs sm:text-sm mt-1">
              Manage product details, stock and pricing
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-xl shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Product ID
            </label>
            <input
              type="text"
              value={product.id || ""}
              onChange={(e) => updateField("id", e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              placeholder="P001"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={product.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              placeholder="Buffalo Milk"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Price
            </label>
            <input
              type="number"
              value={product.price || ""}
              onChange={(e) => updateField("price", e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              placeholder="85"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Stock
            </label>
            <input
              type="number"
              value={product.stock || ""}
              onChange={(e) => updateField("stock", e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
              placeholder="25"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Category
            </label>
           <select
              value={product.category_id || ""}
              onChange={(e) => updateField("category_id", e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:border-green-500"
          >
              <option value="">Select Category</option>

              {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                      {cat.name}
                  </option>
              ))}
          </select>
          </div>

          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Product Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    setUploading(true);

                    const res = await uploadProductImage(file);

                    updateField("image", res.image);

                  } catch (err) {
                    alert("Image upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
                className="w-full border rounded-2xl p-3"
              />

              {uploading && (
                <p className="text-green-600 mt-2">
                  Uploading image...
                </p>
              )}
            </div>

          <div className="md:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-700 mb-3">Preview</p>

             <div className="
                    flex
                    flex-col
                    lg:grid
                    lg:grid-cols-[140px_1fr]
                    gap-5
                ">
                <img
                  src={product.image || DEFAULT_IMAGE}
                  alt={product.name || "Preview"}
                  className="
                    w-full
                    max-w-[180px]
                    lg:w-[140px]
                    h-40
                    lg:h-32
                    object-cover
                    rounded-2xl
                    border
                "
                />

                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 break-words">
                    {product.name || "Product Name"}
                  </h3>
                  <p className="text-slate-500 mt-1 break-words">
                    Category: {
                        categories.find(c => c.id === product.category_id)?.name || "-"
                    }
                  </p>
                  <p className="text-green-700 font-black text-lg sm:text-xl mt-3">
                    ₹{product.price || 0}
                  </p>
                  <p className="text-slate-600 mt-1">Stock: {product.stock || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>

{/* ==============================
   PRODUCT SIZES
============================== */}
<div className="
    sticky
    bottom-0
    bg-white
    border-t
    px-4
    sm:px-6
    py-4
">

    <div className="
        flex
        flex-col
        sm:flex-row
        justify-end
        gap-3
    ">

        <button
            onClick={onClose}
            className="
                w-full
                sm:w-auto
                px-6
                py-3
                rounded-2xl
                bg-slate-100
                hover:bg-slate-200
                font-bold
            "
        >
            Cancel
        </button>

        <button
            onClick={onSave}
            className="
                w-full
                sm:w-auto
                px-6
                py-3
                rounded-2xl
                bg-green-600
                hover:bg-green-700
                text-white
                font-bold
            "
        >
            {saveText}
        </button>

    </div>

</div>




    </div>
  );
}