import { getJSON, putJSON } from "../config/api";
const API_URL = "https://farmfreshdairy.onrender.com/api";

export async function getAllOrders() {
  const response = await getJSON(
    `${API_URL}/admin/orders`
  );

  return response.orders;
}
export async function getOrderById(id) {
  const response = await getJSON(
    `${API_URL}/admin/orders/${id}`
  );

  return response.order;
}


export async function updateOrderStatus(id, status) {
  const response = await putJSON(
    `const API_URL = "https://farmfreshdairy.onrender.com/api";/admin/orders/${id}/status`,
    {
      status,
    }
  );

  return response.order;
}
export async function updatePaymentStatus(
  orderId,
  paymentStatus
) {
  const res = await fetch(
    `${API_URL}/orders/${orderId}/payment`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_status: paymentStatus,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data;
}