import {
  placeOrder,
  fetchOrders,  
  fetchAllOrders,
  fetchCustomerOrders,
  updateOrderStatus,
  assignDeliveryBoy,
} from "../config/api";


// ============================
// Customer Orders
// ============================

export async function createOrder(orderData) {
  return await placeOrder(orderData);
}

export async function getCustomerOrders(customerId) {
  return await fetchCustomerOrders(customerId);
}

// ============================
// Admin Orders
// ============================

export async function getAllOrders() {
  return await fetchAllOrders();
}


export async function changeOrderStatus(
  orderId,
  status
) {
  return await updateOrderStatus(
    orderId,
    status
  );
}

// ============================
// Delivery
// ============================

export async function assignOrder(
  orderId,
  deliveryBoyId
) {
  return await assignDeliveryBoy(
    orderId,
    deliveryBoyId
  );
}

// ============================
// Generic
// ============================

export async function getOrders() {
  return await fetchOrders();
}
