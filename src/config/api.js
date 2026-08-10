
//const API_URL = "https://farmfreshdairy.onrender.com/api";
const API_URL = "http://localhost:5000/api";
/* ---------------------------------------
   COMMON HELPERS
--------------------------------------- */
export async function getJSON(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json();
}

export async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
export async function putJSON(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function deleteJSON(url) {
  const res = await fetch(url, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json();
}

export async function patchJSON(url, body) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
/* ---------------------------------------
   PRODUCTS
--------------------------------------- */
export async function fetchProducts() {
  try {
    const data = await getJSON(`${API_URL}/products`);
    return data.products || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}
export async function fetchProduct(id) {
  return await getJSON(
    `${API_URL}/products/${id}`
  );
}
export async function fetchCategories() {
  const data = await getJSON(`${API_URL}/categories`);
  return data.categories || [];
}
/* ---------------------------------------
   PLACE PRODUCT ORDER
--------------------------------------- */
// export async function placeOrder(orderPayload) {
//   try {
//     const payload = {
//       action: "placeOrder",
//       ...orderPayload,
//     };

//     return await postJSON(payload);
//   } catch (error) {
//     console.error("placeOrder error:", error);
//     return {
//       success: false,
//       message: "Failed to place order",
//     };
//   }
// }

/* ---------------------------------------
   CUSTOMER ORDERS
--------------------------------------- */
export async function fetchCustomerOrders(customerId) {
  return await getJSON(
    `${API_URL}/orders/customer/${customerId}`
  );
}

/* ---------------------------------------
   SUBSCRIPTIONS
--------------------------------------- */
export async function addSubscription(subscriptionPayload) {
  try {
    const payload = {
      action: "addSubscription",
      ...subscriptionPayload,
    };

    return await postJSON( payload);
  } catch (error) {
    console.error("addSubscription error:", error);
    return {
      success: false,
      message: "Failed to create subscription",
    };
  }
}

export async function fetchSubscriptionsByPhone(phone) {
  try {
    if (!phone) return [];

    const data = await getJSON(
      `${SCRIPT_URL}?action=subscriptions&phone=${encodeURIComponent(phone)}`
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.subscriptions)) return data.subscriptions;

    return [];
  } catch (error) {
    console.error("fetchSubscriptionsByPhone error:", error);
    return [];
  }
}
/* ---------------------------------------
   ADMIN - ORDERS
--------------------------------------- */
export async function fetchAllOrders() {
  try {
    const data = await getJSON(`${SCRIPT_URL}?action=allOrders`);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.orders)) return data.orders;

    return [];
  } catch (error) {
    console.error("fetchAllOrders error:", error);
    return [];
  }
}

/* ---------------------------------------
   UPDATE ORDER STATUS
--------------------------------------- */

export async function updateOrderStatus(orderId, status) {
  try {

    return await putJSON(
      `${API_URL}/orders/${orderId}/status`,
      {
        status,
      }
    );

  } catch (error) {

    console.error(error);

    return {
      success: false,
      message: "Unable to update status.",
    };

  }
}

/* ---------------------------------------
   ADMIN - SUBSCRIPTIONS
--------------------------------------- */
export async function fetchAllSubscriptions() {
  try {
    const data = await getJSON(`${SCRIPT_URL}?action=allSubscriptions`);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.subscriptions))
      return data.subscriptions;

    return [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
/* ---------------------------------------
   ADMIN - CUSTOMERS
--------------------------------------- */
export async function fetchAllCustomers() {
  try {
    const data = await getJSON(`${SCRIPT_URL}?action=allCustomers`);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.customers)) return data.customers;

    return [];
  } catch (error) {
    console.error("fetchAllCustomers error:", error);
    return [];
  }
}

/* ---------------------------------------
   ADMIN - BILLING
--------------------------------------- */
export async function fetchBilling() {
  try {
    const data = await getJSON(`${API_URL}/billing`);

    console.log("Billing API:", data);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.billing)) return data.billing;
    if (Array.isArray(data.bills)) return data.bills;
    if (Array.isArray(data.data)) return data.data;

    return [];
  } catch (error) {
    console.error("fetchBilling error:", error);
    return [];
  }
}

export async function updateBillingStatus(billId, paymentStatus) {
  try {
    const response = await fetch(
      `${API_URL}/billing/${billId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentStatus,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("updateBillingStatus error:", error);

    return {
      success: false,
      message: "Failed to update billing status",
    };
  }
}

/* ---------------------------------------
   ADMIN - PRODUCTS
--------------------------------------- */
export async function updateProduct(id, product) {
  try {
    return await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    }).then((r) => r.json());

  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Failed to update product",
    };
  }
}
/* ---------------------------------------
   ADD PRODUCT
--------------------------------------- */
export async function addProduct(product) {
  try {
    return await postJSON(
      `${API_URL}/products`,
      product
    );
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Failed to add product",
    };
  }
}

/* ---------------------------------------
   DELETE PRODUCT
--------------------------------------- */
export async function deleteProduct(id) {
  try {
    return await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    }).then((r) => r.json());

  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Failed to delete product",
    };
  }
}



/* ---------------------------------------
   ASSIGN DELIVERY BOY
--------------------------------------- */
export async function assignDeliveryBoy(
  orderId,
  deliveryBoyId
) {
  return await putJSON(
    `${API_URL}/orders/${orderId}/assign`,
    {
      delivery_boy_id: deliveryBoyId,
    }
  );
}

/* ---------------------------------------
   TODAY DELIVERIES
--------------------------------------- */

export async function fetchTodayDeliveries(deliveryBoy) {
  try {
    const data = await getJSON(
      `${SCRIPT_URL}?action=todayDeliveries&deliveryBoy=${encodeURIComponent(
        deliveryBoy
      )}`
    );

    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.deliveries)) return data.deliveries;

    return [];
  } catch (error) {
    console.error("fetchTodayDeliveries:", error);
    return [];
  }
}
/* ---------------------------------------
   FETCH DELIVERY BOYS
--------------------------------------- */
export async function fetchDeliveryBoys() {
  try {
    const data = await getJSON(`${API_URL}/delivery-boys`);

    return data.deliveryBoys || [];

  } catch (error) {
    console.error("fetchDeliveryBoys:", error);
    return [];
  }
}
export async function fetchOrders() {
  try {
    const data = await getJSON(`${SCRIPT_URL}?action=allOrders`);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.orders)) return data.orders;

    return [];
  } catch (error) {
    console.error("fetchOrders:", error);
    return [];
  }
}
export async function fetchNotifications(phone) {
  return await getJSON(
    `${SCRIPT_URL}?action=getNotifications&phone=${encodeURIComponent(phone)}`
  );
}
export async function createNotification(notification) {
  return await postJSON(
    `${API_URL}/notifications`,
    notification
  );
}
export async function markNotificationRead(id) {
  return await postJSON({
    action: "markNotificationRead",
    id,
  });
}
export async function deleteNotification(id) {
  return await postJSON({
    action: "deleteNotification",
    id,
  });
}
export async function sendBroadcastNotification(notification) {
  return await postJSON({
    action: "broadcastNotification",
    ...notification,
  });
}
export async function markAllNotificationsRead(customerPhone) {
  return await postJSON({
    action: "markAllNotificationsRead",
    customerPhone,
  });
}

export async function markNotificationUnread(id) {
  return await postJSON({
    action: "markNotificationUnread",
    id,
  });
}

export async function clearNotifications(customerPhone) {
  return await postJSON({
    action: "clearNotifications",
    customerPhone,
  });
}

export async function deleteMultipleNotifications(ids) {
  return await postJSON({
    action: "deleteMultipleNotifications",
    ids,
  });
}
export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/products/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Image upload failed");
  }

  return await res.json();
}
// ===============================
// Get Customer Cart
// ===============================
export async function fetchCart(customerId) {
  return await getJSON(`${API_URL}/cart/${customerId}`);
}

// ===============================
// Place Order
// ===============================
export async function placeOrder(orderData) {
  return await postJSON(
    `${API_URL}/orders`,
    orderData
  );
}


/* ==========================================================
   SUBSCRIPTIONS
========================================================== */

export async function fetchCustomerSubscription(customerId) {
  const data = await getJSON(
    `${API_URL}/subscriptions/customer/${customerId}`
  );
  return data.subscription;
}

export async function createSubscription(payload) {
  return await postJSON(
    `${API_URL}/subscriptions`,
    payload
  );
}

export async function updateSubscription(id, payload) {
  const data = await putJSON(
    `${API_URL}/subscriptions/${id}`,
    payload
  );
  return data.subscription;
}

export async function updateSubscriptionStatus(id, status) {
  return await putJSON(
    `${API_URL}/subscriptions/${id}/status`,
    { status }
  );
}

export async function renewSubscription(id, payload) {
  const data = await putJSON(
    `${API_URL}/subscriptions/${id}/renew`,
    payload
  );
  return data.subscription;
}

export async function deleteSubscription(id) {
  return await deleteJSON(
    `${API_URL}/subscriptions/${id}`
  );
}

export async function fetchSubscriptionHistory(customerId) {
  const data = await getJSON(
    `${API_URL}/subscriptions/history/${customerId}`
  );
  return data.history;
}

export async function fetchBillingSummary(customerId) {
  const data = await getJSON(
    `${API_URL}/subscriptions/billing/${customerId}`
  );
  return data.billing;
}

export async function fetchUpcomingDelivery(customerId) {
  const data = await getJSON(
    `${API_URL}/subscriptions/upcoming/${customerId}`
  );
  return data.delivery;
}
/* ---------------------------------------
   ADD TO CART
--------------------------------------- */

export async function addCartItem(cartItem) {
  return await postJSON(`${API_URL}/cart`, cartItem);
}
export async function deleteCartItem(id) {
  return await deleteJSON(`${API_URL}/cart/${id}`);
}
export async function updateCartItem(id, quantity) {
  return await putJSON(`${API_URL}/cart/${id}`, {
    quantity,
  });
}

export async function getDashboard(customerId) {
  return await getJSON(
    `${API_URL}/dashboard/${customerId}`
  );
}
export async function fetchCustomerSubscriptions(customerId) {
  return await getJSON(
    `${API_URL}/subscriptions/customer/${customerId}`
  );
}
export async function fetchSubscription(id) {
  return await getJSON(`${API_URL}/subscriptions/${id}`);
}
export async function fetchCustomerAddresses(customerId) {
  return await getJSON(
    `${API_URL}/addresses/customer/${customerId}`
  );
}
export async function createAddress(data) {
  return await postJSON(`${API_URL}/addresses`, data);
}

export async function updateAddress(id, data) {
  return await putJSON(`${API_URL}/addresses/${id}`, data);
}

export async function deleteAddress(id) {
  return await deleteJSON(`${API_URL}/addresses/${id}`);
}

export async function setDefaultAddress(id, customer_id) {
  return await putJSON(
    `${API_URL}/addresses/${id}/default`,
    { customer_id }
  );
}
export async function getCustomerOrders(customerId) {
  return await getJSON(`${API_URL}/orders/customer/${customerId}`);
}
export async function createCustomer(payload) {
  return await postJSON(
    `${API_URL}/customers`,
    payload
  );
}
export async function fetchProductSizes(productId) {
  return await getJSON(
    `${API_URL}/products/${productId}/sizes`
  );
}

export async function addProductSize(productId, size) {
  return await postJSON(
    `${API_URL}/products/${productId}/sizes`,
    size
  );
}

export async function updateProductSize(id, size) {
  return await putJSON(
    `${API_URL}/products/size/${id}`,
    size
  );
}

export async function deleteProductSize(id) {
  return await deleteJSON(
    `${API_URL}/products/size/${id}`
  );
}
export async function deliveryLogin(phone, password) {
  return await postJSON(
    `${API_URL}/delivery-boys/login`,
    {
      phone,
      password,
    }
  );
}
export async function fetchDeliveryOrders(deliveryBoyId) {
  return await getJSON(
    `${API_URL}/delivery-boys/${deliveryBoyId}/orders`
  );
}
/* ==========================================================
   PAYMENTS
========================================================== */

export async function createPaymentOrder(amount) {
  return await postJSON(
    `${API_URL}/payments/create-order`,
    {
      amount,
    }
  );
}

export async function verifyPayment(paymentData) {
  return await postJSON(
    `${API_URL}/payments/verify`,
    paymentData
  );
}
export async function getMonthlyDeliveryReport(month, year) {
  const res = await fetch(
    `${API_URL}/reports/monthly-delivery?month=${month}&year=${year}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data;
}
export async function loginCustomer(loginId, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      loginId,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}
export async function registerCustomer(customer) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customer),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data;
}
const handleCustomerLogin = async () => {
  try {
    setLoading(true);

    const res = await loginCustomer(loginId, password);

    console.log("Login Response:", res);

    setCustomerLogin(res.user);

    localStorage.setItem(
      "supabase_session",
      JSON.stringify(res.session)
    );

    redirectUser("/dashboard");

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    setLoading(false);
  }
};
export function setCustomerLogin(customer) {
  localStorage.setItem(
    "customer",
    JSON.stringify(customer)
  );
}
export async function forgotPassword(email) {

  const response =
    await fetch(
      `${API_URL}/auth/forgot-password`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          email
        })

      }
    );

  const data =
    await response.json();

  if(!response.ok){

    throw new Error(data.message);

  }

  return data;

}
export async function resetPassword(payload){

  const response=
    await fetch(
      `${API_URL}/auth/reset-password`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify(payload)

      }
    );

  const data=
    await response.json();

  if(!response.ok){

    throw new Error(data.message);

  }

  return data;

}

// ==========================================
// Subscription Delivery Summary
// ==========================================
export async function fetchSubscriptionDeliverySummary(subscriptionId) {
  return await getJSON(
    `${API_URL}/subscriptions/${subscriptionId}/delivery-summary`
  );
}
export async function pauseSubscriptionApi(id, data) {
  return await postJSON(
    `${API_URL}/subscriptions/${id}/pause`,
    data
  );
}

export async function resumeSubscriptionApi(id) {
  return await postJSON(
    `${API_URL}/subscriptions/${id}/resume`,
    {}
  );
}
// ==========================================
// Customer Delivery Summary
// ==========================================
export async function getCustomerDeliverySummary(customerId) {
  const data = await getJSON(
    `${API_URL}/subscription-deliveries/customer/${customerId}/summary`
  );

  return data.summary;
}
export async function getSubscriptionDeliverySummary(subscriptionId) {
  return getJSON(
    `${API_URL}/subscriptions/${subscriptionId}/delivery-summary`
  );
}
export async function getCustomerMonthlyBill(
  subscriptionId,
  month,
  year
) {
  return await getJSON(
    `${API_URL}/monthly-bills/${subscriptionId}?month=${month}&year=${year}`
  );
}
export async function getMonthlyBillDetails(
  subscriptionId,
  month,
  year
) {
  return await getJSON(
    `${API_URL}/monthly-bills/details/${subscriptionId}?month=${month}&year=${year}`
  );
}
export async function markMonthlyBillPaid(billId) {
  return await putJSON(
    `${API_URL}/monthly-bills/${billId}/pay`
  );
}
export async function createExtraMilkRequest(data) {
  return await postJSON(
    `${API_URL}/extra-milk`,
    data
  );
}

export async function getCustomerExtraMilk(customerId) {
  return await getJSON(
    `${API_URL}/extra-milk/customer/${customerId}`
  );
}
export async function cancelExtraMilkRequest(id) {
  return await putJSON(
    `${API_URL}/extra-milk/${id}/cancel`
  );
}
export async function getExtraMilkRequests() {
  return await getJSON(`${API_URL}/extra-milk`);
}

export async function approveExtraMilk(id) {
  return await putJSON(
    `${API_URL}/extra-milk/${id}/approve`
  );
}

export async function rejectExtraMilk(id) {
  return await putJSON(
    `${API_URL}/extra-milk/${id}/reject`
  );
}
