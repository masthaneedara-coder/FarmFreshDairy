import { useEffect, useState } from "react";
import ProductSizeModal from "./ProductSizeModal";

import {
  fetchProductSizes,
  addProductSize,
  updateProductSize,
  deleteProductSize,
} from "../../config/api";

export default function ProductSizeEditor({ product, onClose }) {

    console.log("ProductSizeEditor Rendered", product);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadSizes = async () => {
    if (!product?.id) return;

    try {
      setLoading(true);

      const response = await fetchProductSizes(product.id);

      setSizes(response?.sizes || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load product sizes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSizes();
  }, [product?.id]);

  const saveSize = async (size) => {
  try {
    console.log("Product ID:", product.id);
    console.log("Request Body:", size);

    const res = await addProductSize(product.id, size);

    console.log("API Response:", res);

    setShowModal(false);
    loadSizes();
  } catch (err) {
    console.error("Add Size Error:", err);

    if (err?.response) {
      console.log("Status:", err.response.status);
      console.log("Data:", err.response.data);
    }

    alert("Failed to add size");
  }
};
  const updateSize = async (size) => {
    try {
      await updateProductSize(editing.id, size);

      setEditing(null);

      setShowModal(false);

      loadSizes();
    } catch (err) {
      console.error(err);
      alert("Failed to update size");
    }
  };

  const removeSize = async (id) => {
    if (!window.confirm("Delete this size?")) return;

    try {
      await deleteProductSize(id);

      loadSizes();
    } catch (err) {
      console.error(err);
      alert("Failed to delete size");
    }
  };

 return (
  <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

      {/* Header */}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-5 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            Product Sizes
          </h2>

          <p className="text-purple-100">
            {product?.name}
          </p>

        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30"
        >
          ✕
        </button>

      </div>

      {/* Body */}

      <div className="flex-1 overflow-y-auto p-6">

        <div className="flex justify-end mb-6">

          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold"
          >
            + Add Size
          </button>

        </div>

        {loading ? (

          <div className="text-center py-12">
            Loading...
          </div>

        ) : sizes.length === 0 ? (

          <div className="text-center py-12 text-slate-500">
            No Product Sizes Found
          </div>

        ) : (

          <div className="space-y-4">

            {sizes.map((size) => (

              <div
                key={size.id}
                className="border rounded-2xl p-5 flex items-center justify-between"
              >

                <div>

                  <h3 className="font-bold text-lg">
                    {size.label}
                  </h3>

                  <div className="text-green-700 font-bold">
                    ₹{size.price}
                  </div>

                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() => {
                      setEditing(size);
                      setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => removeSize(size.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* Footer */}

      <div className="border-t bg-white px-6 py-4 flex justify-end">

        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl"
        >
          Close
        </button>

      </div>

    </div>

    {showModal && (
      <ProductSizeModal
        initialData={editing}
        onClose={() => {
          setEditing(null);
          setShowModal(false);
        }}
        onSave={editing ? updateSize : saveSize}
      />
    )}

  </div>
);
}