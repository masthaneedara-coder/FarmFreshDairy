// ============================================
// Storage Keys
// ============================================

const CUSTOMER_KEY = "customer";
const ADMIN_KEY = "admin";
const DELIVERY_KEY = "delivery";
const REDIRECT_KEY = "redirectAfterLogin";

// ============================================
// CUSTOMER
// ============================================



export function setCustomerLogin(customer) {
  // Clear other roles
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(DELIVERY_KEY);

  // Clear old redirect
  localStorage.removeItem(REDIRECT_KEY);

  // Save customer
  localStorage.setItem(
    CUSTOMER_KEY,
    JSON.stringify(customer)
  );
}

export function getCustomer() {
  try {
    return JSON.parse(
      localStorage.getItem(CUSTOMER_KEY) || "null"
    );
  } catch {
    return null;
  }
}
export function getCustomerId() {
  return getCustomer()?.id || null;
}

export function getCustomerName() {
  return getCustomer()?.full_name || getCustomer()?.name || "";
}

export function getCustomerPhone() {
  return getCustomer()?.phone || "";
}

export function isCustomerLoggedIn() {
  return !!getCustomer();
}

export function logoutCustomer() {
  localStorage.removeItem(CUSTOMER_KEY);
}

// ============================================
// ADMIN
// ============================================

export function setAdminLogin(admin) {
  // Clear other roles
  localStorage.removeItem(CUSTOMER_KEY);
  localStorage.removeItem(DELIVERY_KEY);

  // Clear old redirect
  localStorage.removeItem(REDIRECT_KEY);

  // Save admin
  localStorage.setItem(
    ADMIN_KEY,
    JSON.stringify(admin)
  );
}
export function getAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || "null");
  } catch {
    return null;
  }
}

export function getAdminId() {
  return getAdmin()?.id || null;
}

export function getAdminName() {
  return getAdmin()?.full_name || getAdmin()?.name || "";
}

export function isAdminLoggedIn() {
  return !!getAdmin();
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
}

// ============================================
// DELIVERY
// ============================================

export function setDeliveryLogin(delivery) {
  // Clear other roles
  localStorage.removeItem(CUSTOMER_KEY);
  localStorage.removeItem(ADMIN_KEY);

  // Clear old redirect
  localStorage.removeItem(REDIRECT_KEY);

  // Save delivery
  localStorage.setItem(
    DELIVERY_KEY,
    JSON.stringify(delivery)
  );
}
export function getDelivery() {
  try {
    return JSON.parse(localStorage.getItem(DELIVERY_KEY) || "null");
  } catch {
    return null;
  }
}

export function getDeliveryId() {
  return getDelivery()?.id || null;
}

export function getDeliveryName() {
  return getDelivery()?.full_name || getDelivery()?.name || "";
}

export function getDeliveryPhone() {
  return getDelivery()?.phone || "";
}

export function isDeliveryLoggedIn() {
  return !!getDelivery();
}

export function logoutDelivery() {
  localStorage.removeItem(DELIVERY_KEY);
}

// ============================================
// REDIRECT
// ============================================

export function setRedirectAfterLogin(path) {
  localStorage.setItem(REDIRECT_KEY, path);
}

export function getRedirectAfterLogin() {
  return localStorage.getItem(REDIRECT_KEY);
}

export function clearRedirectAfterLogin() {
  localStorage.removeItem(REDIRECT_KEY);
}
// ============================================
// ROLE HELPERS
// ============================================

export function getCurrentRole() {
  if (isCustomerLoggedIn()) {
    return "customer";
  }

  if (isAdminLoggedIn()) {
    return "admin";
  }

  if (isDeliveryLoggedIn()) {
    return "delivery";
  }

  return null;
}

export function isCustomer() {
  return getCurrentRole() === "customer";
}

export function isAdmin() {
  return getCurrentRole() === "admin";
}

export function isDelivery() {
  return getCurrentRole() === "delivery";
}