import { ShoppingCart } from "lucide-react";

const SIZES = ["500ml", "1L", "2L"];

export default function ProductCard({
  product,
  quantity,
  selectedSize,
  onIncrease,
  onDecrease,
  onSizeChange,
  onSubscribe,
}) {
  return (
    <div className="bg-white border border-green-100 rounded-2xl shadow hover:shadow-lg transition-all p-5 max-w-sm mx-auto">

      <img
        src={product.image_url}
        alt={product.product_name || product.name}
        className="w-24 h-24 object-cover rounded-xl mx-auto"
      />

      <h3 className="mt-4 text-xl font-bold text-center">
        {product.product_name || product.name}
      </h3>

      <p className="text-center text-green-700 font-semibold mt-1">
        ₹{product.price}/Litre
      </p>

      <div className="flex justify-center gap-2 mt-4">
        {SIZES.map((size) => (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className={`px-3 py-1 rounded-lg border ${
              selectedSize === size
                ? "bg-green-600 text-white"
                : "bg-white"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-5">

        <button
          onClick={onDecrease}
          className="w-10 h-10 rounded-full bg-red-500 text-white"
        >
          -
        </button>

        <span className="text-xl font-bold">
          {quantity}
        </span>

        <button
          onClick={onIncrease}
          className="w-10 h-10 rounded-full bg-green-600 text-white"
        >
          +
        </button>

      </div>

      <button
        onClick={onSubscribe}
        className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"
      >
        <ShoppingCart size={18} />
        Select Product
      </button>

    </div>
  );
}