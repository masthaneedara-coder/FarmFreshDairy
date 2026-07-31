import {
  Wallet,
  Receipt,
  Gift,
  CalendarDays,
  Download,
  History,
} from "lucide-react";

export default function BillingCard({
  monthlyAmount = 2700,
  walletBalance = 850,
  savings = 300,
  gst = 48,
  coupon = "SAVE10",
  nextBilling = "01 Aug 2026",
  paymentStatus = "Paid",
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

      {/* Header */}

      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-5">

        <h2 className="text-2xl font-bold">
          Billing Summary
        </h2>

        <p className="opacity-90 mt-1">
          Subscription Payments
        </p>

      </div>

      <div className="p-6 space-y-5">

        <Item
          icon={<Receipt />}
          title="Monthly Amount"
          value={`₹${monthlyAmount}`}
        />

        <Item
          icon={<Wallet />}
          title="Wallet Balance"
          value={`₹${walletBalance}`}
        />

        <Item
          icon={<Gift />}
          title="Coupon Applied"
          value={coupon}
          green
        />

        <Item
          icon={<Gift />}
          title="Savings"
          value={`₹${savings}`}
          green
        />

        <Item
          icon={<CalendarDays />}
          title="Next Billing"
          value={nextBilling}
        />

        <Item
          icon={<Receipt />}
          title="GST"
          value={`₹${gst}`}
        />

        {/* Payment Status */}

        <div className="rounded-2xl bg-green-50 p-4 flex justify-between items-center">

          <div>

            <h3 className="font-semibold">
              Payment Status
            </h3>

            <p className="text-sm text-gray-500">
              Latest Billing Cycle
            </p>

          </div>

          <span className="px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold">

            {paymentStatus}

          </span>

        </div>

        {/* Buttons */}

        <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition text-white rounded-2xl py-3 font-semibold">

          <Download size={18} />

          Download Invoice

        </button>

        <button className="w-full flex items-center justify-center gap-2 border border-green-600 text-green-700 hover:bg-green-50 transition rounded-2xl py-3 font-semibold">

          <History size={18} />

          Billing History

        </button>

      </div>

    </div>
  );
}

function Item({
  icon,
  title,
  value,
  green,
}) {
  return (
    <div className="flex justify-between items-center">

      <div className="flex items-center gap-3">

        <div className="text-green-700">
          {icon}
        </div>

        <span className="text-gray-600">
          {title}
        </span>

      </div>

      <span
        className={`font-bold ${
          green
            ? "text-green-700"
            : "text-slate-800"
        }`}
      >
        {value}
      </span>

    </div>
  );
}