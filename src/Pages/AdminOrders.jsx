import { useEffect, useState } from "react";
import { getAllOrders, updatePaymentStatus } from "../services/adminOrderService";

import OrderFilters from "../Components/admin/OrderFilters";
import OrdersTable from "../Components/admin/OrdersTable";
import { updateOrderStatus } from "../services/adminOrderService";
import OrderDetailsDrawer from "../Components/admin/OrderDetailsDrawer";
import AssignDeliveryBoyModal from "../Components/admin/AssignDeliveryBoyModal";
import ReceivePaymentModal from "../Components/admin/ReceivePaymentModal";
import { getAdminId } from "../config/auth";
import OrdersCards from "./OrdersCards";

export default function AdminOrders() {

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
const [selectedPaymentOrder, setSelectedPaymentOrder] =
  useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] =  useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
const handleStatusChange = async (
  orderId,
  status
) => {
  try {

    await updateOrderStatus(
      orderId,
      status
    );

    alert("Order status updated successfully.");

    loadOrders();

  } catch (err) {

    console.error(err);

    alert("Failed to update order status.");

  }
};
const handleReceivePayment = (order) => {
  setSelectedPaymentOrder(order);
  setPaymentOpen(true);
};
const handleConfirmPayment = async (paymentData) => {
  try {

    await updatePaymentStatus(
      selectedPaymentOrder.id,
      {
        ...paymentData,
        received_by: getAdminId(), // from your auth helper
      }
    );

    alert("Payment received successfully.");

    setPaymentOpen(false);
    setSelectedPaymentOrder(null);

    loadOrders();

  } catch (err) {

    console.error(err);

    alert(err.message);

  }
};

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const data = await getAllOrders();
    setOrders(data);
  }

  const filtered = orders.filter((order) => {

    const text = (
      order.order_number +
      order.customer_name +
      order.phone
    )
      .toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (status === "" || order.status === status)
    );

  });
 
const handleView = (order) => {
  setSelectedOrder(order);
  setDrawerOpen(true);
};
const handleAssign = (order) => {
  setSelectedOrder(order);
  setAssignOpen(true);
};
const handlePaymentPaid = async (orderId) => {
  try {

    await updatePaymentStatus(
      orderId,
      "Paid"
    );

    alert("Payment updated successfully.");

    loadOrders();

  } catch (err) {

    console.error(err);

    alert(err.message);

  }
};

  return (
    <div>

      <h1 className="text-2xl md:text-3xl font-bold mb-6">
        Order Management
      </h1>

      <OrderFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
      />

     {/* Desktop */}
        <div className="hidden lg:block">
          <OrdersTable
            orders={filtered}
            onView={handleView}
            onAssign={handleAssign}
            onStatusChange={handleStatusChange}
            onReceivePayment={handleReceivePayment}
          />
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          <OrdersCards
            orders={filtered}
            onView={handleView}
            onAssign={handleAssign}
            onStatusChange={handleStatusChange}
            onReceivePayment={handleReceivePayment}
          />
        </div>
      <OrderDetailsDrawer
          open={drawerOpen}
          order={selectedOrder}
          onClose={() => {
              setDrawerOpen(false);
              setSelectedOrder(null);
          }}
      />
      <AssignDeliveryBoyModal
        open={assignOpen}
        order={selectedOrder}
        onClose={() => {
          setAssignOpen(false);
          setSelectedOrder(null);
        }}
        onAssigned={loadOrders}
      />
      
        <ReceivePaymentModal
        open={paymentOpen}
        order={selectedPaymentOrder}
        onClose={() => {
          setPaymentOpen(false);
          setSelectedPaymentOrder(null);
        }}
        onConfirm={handleConfirmPayment}
      />

    </div>
  );
}
