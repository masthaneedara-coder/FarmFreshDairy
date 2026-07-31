export default function StockBadge({ stock }) {
  if (stock <= 0) {
    return (
      <div className="mt-2">
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
          🔴 Out of Stock
        </span>
      </div>
    );
  }

  if (stock <= 5) {
    return (
      <div className="mt-2">
        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
          🟡 Only {stock} Left
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
        🟢 In Stock ({stock})
      </span>
    </div>
  );
}