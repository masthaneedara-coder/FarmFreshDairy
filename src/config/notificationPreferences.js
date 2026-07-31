export const DEFAULT_NOTIFICATION_PREFERENCES = {
  order: true,
  delivery: true,
  payment: true,
  subscription: true,
  promotion: true,
  system: true,

  sound: true,
  desktop: false,

  vibration: false,
};

export const NOTIFICATION_PREFERENCE_OPTIONS = [
  {
    key: "order",
    label: "Order Updates",
    description: "Receive order confirmation and status updates.",
  },
  {
    key: "delivery",
    label: "Delivery Updates",
    description: "Receive delivery assignment and delivery status.",
  },
  {
    key: "payment",
    label: "Payment Alerts",
    description: "Receive payment confirmations and reminders.",
  },
  {
    key: "subscription",
    label: "Subscription Reminders",
    description: "Receive subscription renewal and billing reminders.",
  },
  {
    key: "promotion",
    label: "Promotional Offers",
    description: "Receive offers and discounts.",
  },
  {
    key: "system",
    label: "System Notifications",
    description: "Receive important application announcements.",
  },
  {
    key: "sound",
    label: "Notification Sound",
    description: "Play a sound when a new notification arrives.",
  },
  {
    key: "desktop",
    label: "Desktop Notifications",
    description: "Show browser notifications.",
  },
  {
    key: "vibration",
    label: "Vibration",
    description: "Reserved for the future mobile application.",
  },
];