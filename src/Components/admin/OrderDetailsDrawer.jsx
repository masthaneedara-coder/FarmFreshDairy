export default function OrderDetailsDrawer({
  open,
  order,
  onClose,
}) {
  if (!open || !order) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 overflow-y-auto">

        <div className="p-6 border-b flex justify-between items-center">

          <h2 className="text-2xl font-bold">
            {order.order_number}
          </h2>

          <button
            onClick={onClose}
            className="text-2xl"
          >
            ✕
          </button>

        </div>

        <div className="p-6 space-y-6">

            {/* Customer */}

            <div className="bg-gray-50 rounded-xl p-4">

                                <p>
                <strong>Name:</strong>{" "}
                {order.customers?.full_name || order.customer_name}
                </p>

                <p>
                <strong>Phone:</strong>{" "}
                {order.customers?.phone || order.phone}
                </p>

                <p>
                <strong>Email:</strong>{" "}
                {order.customers?.email || "-"}
                </p>

            </div>

            {/* Address */}

            <div className="bg-gray-50 rounded-xl p-4">

                <h3 className="font-bold text-lg mb-3">
                Delivery Address
                </h3>

               <p>{order.addresses?.address_line1}</p>
                <p>{order.addresses?.area}</p>
                <p>{order.addresses?.city}</p>
                <p>{order.addresses?.pincode}</p>

            </div>
            {/* Ordered Products */}

               {order.order_items.map((item) => {

                const unitPrice = Number(item.unit_price || 0);
                const qty = Number(item.quantity || 0);
                const total = Number(item.total_price || unitPrice * qty);

                return (
                    <div
                    key={item.id}
                    className="flex gap-4 border rounded-xl bg-white p-3"
                    >
                    <img
                        src={item.products?.image}
                        alt={item.products?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                    />

                    <div className="flex-1">

                        <h4 className="font-semibold text-lg">
                        {item.products?.name}
                        </h4>

                        <p className="text-gray-500">
                        {item.size?.toLowerCase().includes("pcs")
                            ? `Quantity: ${item.size}`
                            : `Size: ${item.size}`}
                        </p>

                        <div className="flex justify-between mt-2 text-sm">
                        <span>Qty: {qty}</span>
                        <span>₹{unitPrice}</span>
                        </div>

                        <div className="text-right font-bold text-green-700 mt-1">
                        ₹{total}
                        </div>

                    </div>
                    </div>
                );

                })}

            {/* Payment */}

            <div className="bg-gray-50 rounded-xl p-4">

                <h3 className="font-bold text-lg mb-3">
                Payment
                </h3>

                <p>
                <strong>Method:</strong>{" "}
                {order.payment_method}
                </p>

                <p>
                <strong>Status:</strong>{" "}
                {order.payment_status}
                </p>
                <div className="mt-6 bg-gray-50 rounded-xl p-5">

                  <h3 className="text-lg font-bold mb-4">
                      💳 Payment Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div>

                          <p className="text-gray-500 text-sm">
                              Payment Status
                          </p>

                          <span
                              className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                                  order.payment_status === "Paid"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                              }`}
                          >
                              {order.payment_status}
                          </span>

                      </div>

                      <div>

                          <p className="text-gray-500 text-sm">
                              Payment Method
                          </p>

                          <p className="font-semibold mt-1">
                              {order.payment_method || "-"}
                          </p>

                      </div>

                      <div>

                          <p className="text-gray-500 text-sm">
                              Paid Date
                          </p>

                          <p className="font-semibold mt-1">

                              {order.payment_date
                                  ? new Date(
                                      order.payment_date
                                    ).toLocaleString()
                                  : "-"}

                          </p>

                      </div>

                      <div>

                          <p className="text-gray-500 text-sm">
                              Received By
                          </p>

                          <p className="font-semibold mt-1">

                              {order.admins?.full_name || "-"}

                          </p>

                      </div>

                      <div className="md:col-span-2">

                          <p className="text-gray-500 text-sm">
                              Transaction ID
                          </p>

                          <p className="font-semibold mt-1 break-all">

                              {order.transaction_id || "-"}

                          </p>

                      </div>

                  </div>

              </div>

            </div>

            {/* Summary */}

            <div className="bg-gray-50 rounded-xl p-4">

                <h3 className="font-bold text-lg mb-3">
                Summary
                </h3>

                <p>
                <strong>Subtotal:</strong> ₹
                {order.subtotal}
                </p>

                <p>
                <strong>Delivery:</strong> ₹
                {order.delivery_charge}
                </p>

                <p>
                <strong>Discount:</strong> ₹
                {order.discount}
                </p>

                <hr className="my-3"/>

                <p className="text-xl font-bold">
                Total ₹{order.total_amount}
                </p>

            </div>

            {/* Status */}

            <div className="bg-gray-50 rounded-xl p-4">

                <h3 className="font-bold text-lg mb-3">
                Order Status
                </h3>

                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                {order.status}
                </span>

            </div>

            </div>

      </div>
    </>
  );
}