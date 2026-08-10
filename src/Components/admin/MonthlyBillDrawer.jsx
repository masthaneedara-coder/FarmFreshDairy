 import React, { useState } from "react";
 import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
} from "lucide-react";

export default function MonthlyBillDrawer({
  open,
  details,
  onClose,
  onDownload,
  onPrint,
  onWhatsapp,
  onMarkPaid,
}) {
  if (!open || !details) return null;

  const {
    bill,
    customer,
    subscription,
  } = details;
  const [loadingAction, setLoadingAction] =
useState("");

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
            fixed top-0 right-0 h-full
            w-full sm:w-[700px]
            bg-gray-50
            shadow-2xl
            z-50
            overflow-y-auto
            transform transition-transform duration-300
            ${open ? "translate-x-0" : "translate-x-full"}
        `}
        >

        {/* Header */}
        <div className="sticky top-0 bg-green-700 text-white p-6 flex justify-between items-center shadow">

          <div>

            <h2 className="text-2xl font-bold">
              Monthly Bill
            </h2>

            <p className="text-green-100 text-sm mt-1">
              {bill.month}/{bill.year}
            </p>

          </div>

          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>

        </div>

        <div className="p-6 space-y-6">

          {/* Customer Information */}
          <div className="bg-white rounded-2xl shadow p-5">

            <div className="flex items-center gap-2 mb-5">

              <User
                className="text-green-700"
                size={22}
              />

              <h3 className="text-xl font-bold">
                Customer Information
              </h3>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <InfoCard
                icon={<User size={18} />}
                title="Customer Name"
                value={customer?.full_name}
              />

              <InfoCard
                icon={<Phone size={18} />}
                title="Phone"
                value={customer?.phone}
              />

              <InfoCard
                icon={<Mail size={18} />}
                title="Email"
                value={
                  customer?.email || "-"
                }
              />

              <InfoCard
                icon={<Calendar size={18} />}
                title="Customer Since"
                value={
                  customer?.created_at
                    ? new Date(
                        customer.created_at
                      ).toLocaleDateString()
                    : "-"
                }
              />

            </div>

          </div>

          {/* Subscription Information */}
          <div className="bg-white rounded-2xl shadow p-5">

            <div className="flex items-center gap-2 mb-5">

              <Package
                className="text-blue-700"
                size={22}
              />

              <h3 className="text-xl font-bold">
                Subscription Information
              </h3>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <InfoCard
                icon={<Package size={18} />}
                title="Status"
                value={subscription?.status}
              />

              <InfoCard
                icon={<Calendar size={18} />}
                title="Frequency"
                value={
                  subscription?.frequency
                }
              />

              <InfoCard
                icon={<Calendar size={18} />}
                title="Start Date"
                value={
                  subscription?.start_date
                    ? new Date(
                        subscription.start_date
                      ).toLocaleDateString()
                    : "-"
                }
              />

              <InfoCard
                icon={<Calendar size={18} />}
                title="End Date"
                value={
                  subscription?.end_date
                    ? new Date(
                        subscription.end_date
                      ).toLocaleDateString()
                    : "-"
                }
              />

              <InfoCard
                icon={<Package size={18} />}
                title="Payment Method"
                value={
                  subscription?.payment_method
                }
              />

              <InfoCard
                icon={<Package size={18} />}
                title="Subscription Amount"
                value={`₹${Number(
                  subscription?.payment_amount || 0
                ).toFixed(2)}`}
              />

            </div>

          </div>

          {/* Delivery Address */}
          {details.deliveries?.[0]?.addresses && (
            <div className="bg-white rounded-2xl shadow p-5">

              <div className="flex items-center gap-2 mb-5">

                <MapPin
                  className="text-red-600"
                  size={22}
                />

                <h3 className="text-xl font-bold">
                  Delivery Address
                </h3>

              </div>

              <div className="space-y-2 text-gray-700">

                <p>
                  <strong>House No:</strong>{" "}
                  {
                    details.deliveries[0]
                      .addresses.house_no
                  }
                </p>

                <p>
                  <strong>Street:</strong>{" "}
                  {
                    details.deliveries[0]
                      .addresses.street
                  }
                </p>

                <p>
                  <strong>Area:</strong>{" "}
                  {
                    details.deliveries[0]
                      .addresses.area
                  }
                </p>

                <p>
                  <strong>City:</strong>{" "}
                  {
                    details.deliveries[0]
                      .addresses.city
                  }
                </p>

                <p>
                  <strong>Pincode:</strong>{" "}
                  {
                    details.deliveries[0]
                      .addresses.pincode
                  }
                </p>

              </div>

            </div>
          )}
          

        </div>
        {/* Product Summary */}
<div className="bg-white rounded-2xl shadow p-5">

  <div className="flex items-center gap-2 mb-5">

    <Package
      className="text-emerald-600"
      size={22}
    />

    <h3 className="text-xl font-bold">
      Product Summary
    </h3>

  </div>

  <div className="space-y-4">

    {details.deliveries?.map((delivery) =>
      delivery.subscription_delivery_items?.map((item) => (

        <div
          key={item.id}
          className="border rounded-xl p-4 flex flex
                flex-col
                sm:flex-row
                gap-4-4 bg-gray-50"
                        >

          <img
            src={item.products?.image}
            alt={item.products?.name}
            className="
                w-full
                sm:w-20
                h-44
                sm:h-20
                rounded-xl
                object-cover
                "
          />

          <div className="flex-1">

            <h4 className="font-bold text-lg">
              {item.products?.name}
            </h4>

            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">

              <p>
                <strong>Size</strong>
                <br />
                {item.size}
              </p>

              <p>
                <strong>Quantity</strong>
                <br />
                {item.quantity}
              </p>

              <p>
                <strong>Rate</strong>
                <br />
                ₹{item.unit_price}
              </p>

              <p>
                <strong>Total</strong>
                <br />
                ₹{item.total_price}
              </p>

            </div>

          </div>

        </div>

      ))
    )}

  </div>

</div>
{/* Delivery History */}
<div className="bg-white rounded-2xl shadow p-5">

  <h3 className="text-xl font-bold mb-5">

    📅 Delivery History

  </h3>

  <div className="overflow-x-auto">

    <table className="w-full">

      <thead>

        <tr className="bg-green-600 text-white">

          <th className="p-3 text-left">
            Date
          </th>

          <th className="p-3 text-left">
            Product
          </th>

          <th className="p-3">
            Qty
          </th>

          <th className="p-3">
            Size
          </th>

          <th className="p-3">
            Rate
          </th>

          <th className="p-3">
            Total
          </th>

          <th className="p-3">
            Status
          </th>

        </tr>

      </thead>

      <tbody>

        {details.deliveries?.map((delivery) =>

          delivery.subscription_delivery_items?.map((item) => (

            <tr
              key={item.id}
              className="border-b hover:bg-gray-50"
            >

              <td className="p-3">

                {new Date(
                  delivery.delivery_date
                ).toLocaleDateString()}

              </td>

              <td className="p-3">

                {item.products?.name}

              </td>

              <td className="text-center">

                {item.quantity}

              </td>

              <td className="text-center">

                {item.size}

              </td>

              <td className="text-center">

                ₹{item.unit_price}

              </td>

              <td className="text-center font-semibold">

                ₹{item.total_price}

              </td>

              <td className="text-center">

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    delivery.status === "Delivered"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {delivery.status}
                </span>

              </td>

            </tr>

          ))

        )}

      </tbody>

    </table>

  </div>

</div>
{/* Bill Summary */}

<div className="bg-white rounded-2xl shadow p-5">

  <h3 className="text-xl font-bold mb-5">

    💰 Bill Summary

  </h3>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

    <SummaryCard
      title="Delivered Days"
      value={bill.delivered_days}
      color="text-green-700"
    />

    <SummaryCard
      title="Missed Days"
      value={bill.missed_days}
      color="text-red-600"
    />

    <SummaryCard
      title="Subtotal"
      value={`₹${bill.subtotal}`}
      color="text-blue-700"
    />

    <SummaryCard
      title="Discount"
      value={`₹${bill.discount}`}
      color="text-orange-600"
    />

  </div>

  <hr className="my-6" />

  <div className="flex justify-between items-center">

    <span className="text-2xl font-bold">

      Grand Total

    </span>

    <span className="text-3xl font-bold text-green-700">

      ₹{bill.total_amount}

    </span>

  </div>

</div>
{/* Payment */}

<div className="bg-white rounded-2xl shadow p-5">

  <h3 className="text-xl font-bold mb-5">

    💳 Payment Information

  </h3>

  <div className="grid grid-cols-2 gap-5">

    <InfoCard
      title="Payment Status"
      value={bill.payment_status}
    />

    <InfoCard
      title="Generated"
      value={
        new Date(
          bill.generated_at
        ).toLocaleDateString()
      }
    />

    <InfoCard
      title="Paid At"
      value={
        bill.paid_at
          ? new Date(
              bill.paid_at
            ).toLocaleDateString()
          : "-"
      }
    />

    <InfoCard
      title="Month"
      value={`${bill.month}/${bill.year}`}
    />

  </div>

</div>
{/* Actions */}

<div className="bg-white rounded-2xl shadow p-5">

  <h3 className="text-xl font-bold mb-5">

    ⚙ Actions

  </h3>

  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

    <button
        disabled={loadingAction === "pdf"}
        onClick={async () => {
                try {
                    setLoadingAction("pdf");

                    if (onDownload) {
                    await onDownload();
                    }
                } finally {
                    setLoadingAction("");
                }
                }}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-semibold transition"
            >
            {loadingAction === "pdf"
                ? "Generating..."
                : "📄 Download PDF"}
            </button>

    <button
      onClick={onPrint}
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition"
    >
      🖨 Print
    </button>

    <button
      onClick={onWhatsapp}
      className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold transition"
    >
      📲 WhatsApp
    </button>

    <button
      disabled
      className="bg-gray-300 text-gray-600 rounded-xl py-3 cursor-not-allowed"
    >
      📧 Email (V2)
    </button>

    {bill.payment_status !== "Paid" && (

      <button
        onClick={() => onMarkPaid?.(bill.id)}
        className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-3 font-semibold transition"
      >
        ✅ Mark Paid
      </button>

    )}

  </div>

</div>


      </div>
    </>
  );
}

function InfoCard({
  icon,
  title,
  value,
}) {
  return (
    <div className="border rounded-xl p-4 bg-gray-50">

      <div className="flex items-center gap-2 text-gray-500 text-sm">

        {icon}

        <span>{title}</span>

      </div>

      <div className="mt-2 text-lg font-semibold text-gray-800 break-words">
        {value || "-"}
      </div>

    </div>
  );
}
function SummaryCard({
  title,
  value,
  color,
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border">

      <p className="text-gray-500 text-sm">

        {title}

      </p>

      <h2
        className={`text-2xl font-bold mt-2 ${color}`}
      >
        {value}
      </h2>

    </div>
  );
}
function StatusBadge({ status }) {

  let color =
    "bg-gray-100 text-gray-700";

  switch (status) {

    case "Paid":
      color =
        "bg-green-100 text-green-700";
      break;

    case "Pending":
      color =
        "bg-yellow-100 text-yellow-700";
      break;

    case "Active":
      color =
        "bg-blue-100 text-blue-700";
      break;

    case "Delivered":
      color =
        "bg-green-100 text-green-700";
      break;

    case "Missed":
      color =
        "bg-red-100 text-red-700";
      break;

    default:
      break;

  }

  return (

    <span
      className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}
    >
      {status}
    </span>

  );

}