export default function OrdersCards({
  orders,
  onView,
  onAssign,
  onStatusChange,
  onReceivePayment,
}) {
  if (!orders.length) {
    return (
      <div className="text-center py-10 text-gray-500">
        No Orders Found
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {orders.map((order) => (

        <div
          key={order.id}
          className="bg-white rounded-2xl shadow-md border p-4"
        >

          <div className="flex justify-between items-center">

            <h2 className="font-bold text-lg">
              {order.order_number}
            </h2>

            <span className="font-bold text-green-600">
              ₹{order.total_amount}
            </span>

          </div>

          <div className="mt-4 space-y-2 text-sm">

            <p>
              <b>Customer:</b> {order.customer_name}
            </p>

            <p>
              <b>Phone:</b> {order.phone}
            </p>

            <p>
              <b>Date:</b> {order.order_date}
            </p>

            <p>
              <b>Payment:</b>

              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  order.payment_status === "Paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {order.payment_status}
              </span>
            </p>

            <p>
              <b>Status:</b>

              <span className="ml-2">
                {order.status}
              </span>
            </p>

           <p>
              <b>Delivery Boy:</b>{" "}
              {order.delivery_boys
                ? `${order.delivery_boys.full_name} (${order.delivery_boys.phone})`
                : "-"}
            </p>

          </div>

          <div className="grid grid-cols-2 gap-2 mt-5">

            <button
              onClick={() => onView(order)}
              className="bg-blue-600 text-white rounded-lg py-2"
            >
              View
            </button>

            <button
              onClick={() => onAssign(order)}
              className="bg-green-600 text-white rounded-lg py-2"
            >
              Assign
            </button>

            {order.payment_status !== "Paid" && (
              <button
                onClick={() => onReceivePayment(order)}
                className="col-span-2 bg-amber-500 text-white rounded-lg py-2"
              >
                Receive Payment
              </button>
            )}

          </div>

        </div>

      ))}

    </div>
  );
}