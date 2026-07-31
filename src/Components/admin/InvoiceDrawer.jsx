import React from "react";
import InvoiceTemplate from "./InvoiceTemplate";
import { downloadInvoicePDF } from "../../utils/pdfGenerator";
import { printInvoice } from "../../utils/printInvoice";

export default function InvoiceDrawer({
  open,
  bill,
  onClose,
}) {
  if (!open || !bill) return null;

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

const subtotal = Number(bill.amount || 0);

const gstPercent = 5;

const gst = Number(
  (subtotal * gstPercent) / 100
);

const discount = Number(
  bill.discount || 0
);

const total =
  subtotal + gst - discount;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex justify-between items-center shadow">

          <div>
            <p className="text-sm opacity-80">
              Invoice
            </p>

            <h2 className="text-2xl font-black">
              {bill.invoiceNumber || "Invoice"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-3xl hover:text-red-200"
          >
            ×
          </button>

        </div>

        <div className="p-6">

            <InvoiceTemplate bill={bill} />

            <div className="grid grid-cols-2 gap-3 mt-6">

                <button
                    onClick={printInvoice}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold"
                >
                    🖨 Print
                </button>

                            <button
                    onClick={() => downloadInvoicePDF(bill)}
                    className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold"
                >
                    📄 Download PDF
                </button>

                <button
                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold"
                >
                    💳 Record Payment
                </button>

            </div>

        </div>

      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-slate-50 border rounded-2xl p-5">

      <h3 className="text-lg font-black text-green-700 mb-4">
        {title}
      </h3>

      <div className="space-y-3">
        {children}
      </div>

    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-5">

      <span className="text-slate-500 font-medium">
        {label}
      </span>

      <span className="font-bold text-right break-words">
        {value || "-"}
      </span>

    </div>
  );
}