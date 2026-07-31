// ==========================================
// Notification Types
// Farm Fresh Dairy
// ==========================================

// Notification Categories
export const NOTIFICATION_TYPES = {
  ORDER: "order",
  DELIVERY: "delivery",
  PAYMENT: "payment",
  SUBSCRIPTION: "subscription",
  OFFER: "offer",
  WALLET: "wallet",
  SYSTEM: "system",
  REMINDER: "reminder",
};

// Priority Levels
export const NOTIFICATION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

// Read Status
export const NOTIFICATION_STATUS = {
  UNREAD: "unread",
  READ: "read",
};

// Icons
export const NOTIFICATION_ICONS = {
  order: "📦",
  delivery: "🚚",
  payment: "💳",
  subscription: "🥛",
  offer: "🎁",
  wallet: "👛",
  reminder: "⏰",
  system: "⚙️",
};

// Tailwind Colors
export const NOTIFICATION_COLORS = {
  order: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },

  delivery: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },

  payment: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },

  subscription: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },

  offer: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },

  wallet: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },

  reminder: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
  },

  system: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
};

// Notification Filters
export const NOTIFICATION_FILTERS = [
  { label: "All", value: "all" },
  { label: "Orders", value: NOTIFICATION_TYPES.ORDER },
  { label: "Delivery", value: NOTIFICATION_TYPES.DELIVERY },
  { label: "Payments", value: NOTIFICATION_TYPES.PAYMENT },
  { label: "Subscription", value: NOTIFICATION_TYPES.SUBSCRIPTION },
  { label: "Offers", value: NOTIFICATION_TYPES.OFFER },
  { label: "Wallet", value: NOTIFICATION_TYPES.WALLET },
  { label: "Reminder", value: NOTIFICATION_TYPES.REMINDER },
  { label: "System", value: NOTIFICATION_TYPES.SYSTEM },
];

// Priority Badge Colors
export const PRIORITY_BADGE = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};
// Get Icon
export const getNotificationIcon = (type) =>
  NOTIFICATION_ICONS[type] || "🔔";

// Get Tailwind Color Classes
export const getNotificationColor = (type) =>
  NOTIFICATION_COLORS[type] || NOTIFICATION_COLORS.system;

// Is High Priority
export const isHighPriority = (priority) =>
  priority === NOTIFICATION_PRIORITY.HIGH;

// Is Unread
export const isUnread = (status) =>
  status === NOTIFICATION_STATUS.UNREAD;