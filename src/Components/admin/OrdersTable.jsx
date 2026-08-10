export default function OrdersTable({
  orders = [],
  onStatusChange,
  onView,
  onAssign,
  onPaymentPaid,
  onReceivePayment,
  
}) {
    const statusColor = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-700";

    case "Confirmed":
      return "bg-blue-100 text-blue-700";

    case "Packed":
      return "bg-purple-100 text-purple-700";

    case "Out For Delivery":
      return "bg-indigo-100 text-indigo-700";

    case "Delivered":
      return "bg-green-100 text-green-700";

    case "Cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};
const paymentColor = (payment) => {
  switch (payment) {
    case "Paid":
      return "bg-green-100 text-green-700";

    case "Pending":
      return "bg-yellow-100 text-yellow-700";

    case "Failed":
      return "bg-red-100 text-red-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
};
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-green-600 text-white">
            <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Delivery Boy</th>
                <th className="px-4 py-3 text-left">Order Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
            </tr>
            </thead>

        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="text-center p-6 text-gray-500"
              >
                No Orders Found
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">

                    <td className="px-4 py-3 font-semibold">
                        {order.order_number}
                    </td>

                    <td className="px-4 py-3">
                        {order.customer_name}
                    </td>

                    <td className="px-4 py-3">
                        {order.phone}
                    </td>

                    <td className="px-4 py-3 font-bold text-green-700">
                        ₹{order.total_amount}
                    </td>

                    <td className="px-4 py-3">

                  <div className="flex flex-col gap-2">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentColor(
                        order.payment_status
                      )}`}
                    >
                      {order.payment_status}
                    </span>

                    {order.status === "Delivered" &&
                      order.payment_status === "Pending" && (

                      <button
                        onClick={() =>
                           onPaymentPaid(order)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                      >
                        Mark Paid
                      </button>

                    )}

                  </div>

                </td>

                    <td className="px-4 py-3">
                        <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
                            order.status
                        )}`}
                        >
                        {order.status}
                        </span>
                    </td>

                    <td className="px-4 py-3">
                        {order.delivery_boys?.full_name || "-"}
                    </td>

                    <td className="px-4 py-3">
                        {new Date(
                        order.order_date || order.created_at
                        ).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                       <div className="flex gap-2 justify-center">

                       <button
                        onClick={() => onView(order)}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                        View
                        </button>

                        <button
                            onClick={() => {if (onAssign) {onAssign(order); }}}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                        >
                            Assign
                        </button>

                        </div>
                    </td>

                    </tr>
                    
            ))
            
          )}
          
        </tbody>
      </table>
    </div>
  );
}