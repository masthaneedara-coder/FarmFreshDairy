import { useEffect, useState } from "react";

export default function ReceivePaymentModal({
  open,
  order,
  onClose,
  onConfirm,
}) {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (open) {
      setPaymentMethod("Cash");
      setTransactionId("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    onConfirm({
      payment_status: "Paid",
      payment_method: paymentMethod,
      transaction_id: transactionId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        <div className="border-b p-5">

          <h2 className="text-2xl font-bold">
            Receive Payment
          </h2>

          <p className="text-gray-500 mt-1">
            Order #{order?.order_number}
          </p>

        </div>

        <div className="p-5 space-y-5">

          <div>

            <label className="block mb-2 font-medium">
              Payment Method
            </label>

            <select
              className="w-full border rounded-xl p-3"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Bank Transfer</option>
            </select>

          </div>

          {paymentMethod !== "Cash" && (

            <div>

              <label className="block mb-2 font-medium">
                Transaction ID
              </label>

              <input
                type="text"
                value={transactionId}
                onChange={(e) =>
                  setTransactionId(e.target.value)
                }
                placeholder="Enter Transaction ID"
                className="w-full border rounded-xl p-3"
              />

            </div>

          )}

        </div>

        <div className="border-t p-5 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
          >
            Confirm Payment
          </button>

        </div>

      </div>

    </div>
  );
}