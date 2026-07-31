import { useMemo, useState } from "react";
import {
  CalendarDays,
  Wallet,
  RotateCw,
  Download,
  Search,
  Package,
} from "lucide-react";

export default function SubscriptionHistory({
  subscriptions = SAMPLE_HISTORY,
  onDownloadInvoice,
  onResubscribe,
}) {
  const [search, setSearch] = useState("");

 const filtered = useMemo(() => {
  const text = (search || "").toLowerCase();

  return (subscriptions || []).filter((item) => {
    const product =
      item.product ||
      item.subscription_items?.[0]?.products?.name ||
      "";

    return product.toLowerCase().includes(text);
  });
}, [subscriptions, search]);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6">

        <h2 className="text-2xl font-bold">
          Subscription History
        </h2>

        <p className="opacity-90 mt-2">
          View all previous subscriptions
        </p>

      </div>

      {/* Search */}

      <div className="p-6">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-4 top-4 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
          />

        </div>

      </div>

      {/* List */}

      <div className="px-6 pb-6 space-y-5">

        {filtered.length === 0 && (

          <div className="text-center py-10 text-gray-500">
            No subscriptions found.
          </div>

        )}

        {filtered.map((item) => (

          <HistoryCard
            key={item.id}
            item={item}
            onDownloadInvoice={onDownloadInvoice}
            onResubscribe={onResubscribe}
          />

        ))}

      </div>

    </div>
  );
}

/* ------------------------------------------------ */

function HistoryCard({
  item,
  onDownloadInvoice,
  onResubscribe,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

        {/* Left */}

        <div className="flex gap-4">

          <img
            src={
              item.image ||
              item.subscription_items?.[0]?.products?.image ||
              "/milk-placeholder.png"
            }
            alt={
              item.product ||
              item.subscription_items?.[0]?.products?.name ||
              "Milk Subscription"
            }
            className="w-24 h-24 rounded-2xl object-cover"
          />

          <div>

            <h3 className="text-xl font-bold">
               {item.product ||
                item.subscription_items?.[0]?.products?.name ||
                "Milk Subscription"}
            </h3>

            <p className="text-gray-500 mt-1">
              {item.quantity ||
                item.subscription_items?.[0]?.quantity ||
                "N/A"}
            </p>

            <div className="flex flex-wrap gap-4 mt-4 text-sm">

              <Info
                icon={<CalendarDays size={16} />}
                text={`${
                      item.startDate || item.start_date || "-"
                    } → ${
                      item.endDate || item.end_date || "-"
                    }`}
              />

              <Info
                icon={<Wallet size={16} />}
               text={`₹${item.amount || item.total_amount || 0}`}
              />

              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                {item.status || "Completed"}
              </div>

            </div>

          </div>

        </div>

        {/* Right */}

        <div className="flex flex-wrap gap-3">

          <button
            onClick={() => onDownloadInvoice?.(item)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border hover:bg-gray-100 transition"
          >
            <Download size={18} />
            Invoice
          </button>

          <button
            onClick={() => onResubscribe?.(item)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white transition"
          >
            <RotateCw size={18} />
            Subscribe Again
          </button>

        </div>

      </div>
    </div>
  );
}

/* ------------------------------------------------ */

function Info({
  icon,
  text,
}) {
  return (
    <div className="flex items-center gap-2 text-gray-600">

      <span className="text-green-600">
        {icon}
      </span>

      <span>{text}</span>

    </div>
  );
}

/* ------------------------------------------------ */

const SAMPLE_HISTORY = [
  {
    id: 1,
    product: "Buffalo Milk",
    quantity: "1L Daily",
    amount: 2700,
    status: "Completed",
    startDate: "01 Jun 2026",
    endDate: "30 Jun 2026",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600",
  },
  {
    id: 2,
    product: "Cow Milk",
    quantity: "500ml Daily",
    amount: 1800,
    status: "Completed",
    startDate: "01 May 2026",
    endDate: "31 May 2026",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600",
  },
];