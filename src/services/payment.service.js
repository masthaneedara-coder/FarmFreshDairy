import api from "./api"; // Your existing axios instance

// Create Razorpay Order
export const createOrder = async ({
  amount,
  customer_id,
  subscription_id,
}) => {
  const response = await api.post("/payments/create-order", {
    amount,
    customer_id,
    subscription_id,
  });

  return response.data;
};
// Verify Razorpay Payment
export const verifyPayment = async (paymentData) => {
  const response = await api.post("/payments/verify", paymentData);

  return response.data;
};
/* ==========================================================
   PAYMENTS
========================================================== */

export async function createPaymentOrder({
  amount,
  customer_id,
  subscription_id,
}) {
  return await postJSON(
    `${API_URL}/payments/create-order`,
    {
      amount,
      customer_id,
      subscription_id,
    }
  );
}

export async function verifyPayment(paymentData) {
  return await postJSON(
    `${API_URL}/payments/verify`,
    paymentData
  );
}