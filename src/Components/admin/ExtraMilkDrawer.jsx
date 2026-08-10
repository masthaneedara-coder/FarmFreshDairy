import { X } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function ExtraMilkDrawer({
  open,
  request,
  onClose,
  onApprove,
  onReject,
}) {
  if (!open || !request) return null;

  return (
    <>
      {/* Background */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">

          <div>
            <h2 className="text-xl font-bold">
              Extra Milk Request
            </h2>

            <p className="text-sm text-gray-500">
              Request Details
            </p>
          </div>

          <button onClick={onClose}>
            <X size={24} />
          </button>

        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Customer */}
          <div className="bg-gray-50 rounded-xl p-4">

            <h3 className="font-semibold mb-2">
              Customer
            </h3>

            <p>
              <strong>Name:</strong>{" "}
              {request.customers?.full_name}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {request.customers?.phone}
            </p>

          </div>

          {/* Product */}
          <div className="bg-gray-50 rounded-xl p-4">

            <h3 className="font-semibold mb-2">
              Product
            </h3>

            <p>
              <strong>Product:</strong>{" "}
              {request.products?.name}
            </p>

            <p>
              <strong>Size:</strong>{" "}
              {request.size}
            </p>

            <p>
              <strong>Quantity:</strong>{" "}
              {request.quantity}
            </p>

          </div>

          {/* Duration */}
          <div className="bg-gray-50 rounded-xl p-4">

            <h3 className="font-semibold mb-2">
              Duration
            </h3>

            <p>
              <strong>From:</strong>{" "}
              {request.from_date}
            </p>

            <p>
              <strong>To:</strong>{" "}
              {request.to_date}
            </p>

          </div>

          {/* Estimated Amount */}
          <div className="bg-green-50 rounded-xl p-4">

            <h3 className="font-semibold mb-2">
              Estimated Amount
            </h3>

            <p className="text-2xl font-bold text-green-700">
              ₹ {request.estimated_amount || 0}
            </p>

          </div>

          {/* Remarks */}
          <div className="bg-gray-50 rounded-xl p-4">

            <h3 className="font-semibold mb-2">
              Remarks
            </h3>

            <p>
              {request.remarks || "-"}
            </p>

          </div>

          {/* Status */}
          <div className="flex justify-between items-center">

            <span className="font-semibold">
              Status
            </span>

            <StatusBadge
              status={request.status}
            />

          </div>

        </div>

        {/* Footer */}
        {request.status === "Pending" && (

          <div className="border-t p-5 flex gap-3">

            <button
              onClick={() =>
                onApprove(request.id)
              }
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
            >
              Approve
            </button>

            <button
              onClick={() =>
                onReject(request.id)
              }
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold"
            >
              Reject
            </button>

          </div>

        )}

      </div>
    </>
  );
}