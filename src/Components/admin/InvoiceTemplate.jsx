import React from "react";

export default function InvoiceTemplate({ bill }) {
  if (!bill) return null;

  const formatMoney = (value) => {
    const num = Number(value || 0);
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const invoiceNo = `INV-${bill.id || "0000"}`;

  return (
    <div
      id="invoice"
      className="bg-white text-slate-800 max-w-4xl mx-auto rounded-3xl shadow-xl p-8"
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-emerald-700">
            FARM FRESH DAIRY
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Fresh Milk Subscription Service
          </p>

          <div className="mt-4 text-sm space-y-1">
            <p>GSTIN : XXXXXXXXXXXXXXX</p>
            <p>Phone : +91 9989663837</p>
            <p>Email : support@farmfreshdairy.com</p>
            <p>Hyderabad, Telangana</p>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-700">
            TAX INVOICE
          </h2>

          <div className="mt-4 text-sm space-y-1">
            <p>
              <strong>Invoice No :</strong> {invoiceNo}
            </p>

            <p>
              <strong>Date :</strong>{" "}
              {formatDate(bill.billingDate)}
            </p>

            <p className=" text-2xl font-Red text-emerald-500">
              <strong>Status :</strong>{" "}
              
              {bill.billingStatus}
            </p>
          </div>
        </div>
      </div>

      {/* Customer */}
      <div className="mt-8">
        <h3 className="text-lg font-black border-b pb-2">
          Customer Details
        </h3>

        <div className="grid md:grid-cols-2 gap-5 mt-4">
          <Info label="Customer" value={bill.customerName} />
          <Info label="Phone" value={bill.phone} />
          <Info label="Area" value={bill.area} />
          <Info label="Address" value={bill.address} />
        </div>
      </div>

      {/* Subscription */}
      <div className="mt-8">
        <h3 className="text-lg font-black border-b pb-2">
          Subscription Details
        </h3>

        <div className="overflow-x-auto mt-4">
          {loading ? (
              <p>Loading...</p>
            ) : (
              <ExtraMilkTable
                requests={filtered}
                onView={handleView}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
        </div>
      </div>

      {/* Dates */}
      <div className="grid md:grid-cols-3 gap-5 mt-8">
        <Info
          label="Billing Date"
          value={formatDate(bill.billingDate)}
        />

        <Info
          label="Start Date"
          value={formatDate(bill.startDate)}
        />

        <Info
          label="Expire Date"
          value={formatDate(bill.expireDate)}
        />
      </div>

      {/* Total */}
      <div className="mt-8 flex justify-end">
        <div className="w-full md:w-80 border rounded-xl overflow-hidden">
          <div className="flex justify-between p-3 border-b">
            <span>Subtotal</span>
            <span>{formatMoney(bill.amount)}</span>
          </div>

          <div className="flex justify-between p-3 border-b">
            <span>GST</span>
            <span>Included</span>
          </div>

          <div className="flex justify-between p-4 bg-emerald-700 text-white text-lg font-black">
            <span>Grand Total</span>
            <span>{formatMoney(bill.amount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t pt-6 flex justify-between items-end">
        <div className="text-sm text-slate-500">
          <p>Thank you for choosing Farm Fresh Dairy.</p>
          <p>This is a computer-generated invoice.</p>
        </div>

        <div className="text-center">
          <div className="border-b border-slate-400 w-40 mb-2"></div>
          <p className="text-sm font-semibold">
            Authorized Signature
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="border rounded-xl p-4 bg-slate-50">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold mt-1">{value || "-"}</p>
    </div>
  );
}