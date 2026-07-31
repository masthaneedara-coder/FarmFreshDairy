// src/config/appConfig.js

export const APP_NAME = "FarmFreshDairy";

export const DELIVERY_AREAS = [
  "Dammaiguda",
  "ECIL",
  "A S Rao Nagar",
  "Kapra",
  "Sainikpuri",
  "Kushaiguda",
  "Neredmet",
  "Nagaram",
  "Rampally",
];

export const PRODUCT_SIZES = [
  "250ml",
  "500ml",
  "1L",
  "2L",
  "3L",
  "5L",
];

export const SUBSCRIPTION_PRODUCTS = [
  "Cow Milk",
  "Buffalo Milk",
  "Fresh Curd",
];

export const DELIVERY_TYPES = [
  "Daily",
  "Alternate Day",
];

export const PAYMENT_METHODS = {
  COD: "Cash On Delivery",
  ONLINE: "Online Payment",
  WHATSAPP: "WhatsApp Order",
};

export const ORDER_STATUS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  ASSIGNED: "Assigned",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  STOPPED: "Stopped",
  EXPIRED: "Expired",
};

export const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  DELIVERY: "delivery",
};

export const STORAGE_KEYS = {
  // Cart
  CART: "cart",

  // Customer
  CUSTOMER_LOGIN: "customerLogin",
  CUSTOMER_NAME: "customerName",
  CUSTOMER_PHONE: "customerPhone",

  // Admin
  ADMIN_LOGIN: "adminLogin",
  ADMIN_NAME: "adminName",

  // Delivery
  DELIVERY_LOGIN: "deliveryLogin",
  DELIVERY_NAME: "deliveryName",
  DELIVERY_PHONE: "deliveryPhone",

  // Common
  USER_ROLE: "userRole",

  // Redirect
  REDIRECT_AFTER_LOGIN: "redirectAfterLogin",

  // Pending
  PENDING_CART_ITEM: "pendingCartItem",
  PENDING_SUBSCRIPTION: "pendingSubscription",
};

export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1200&auto=format&fit=crop";