import {
  fetchNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification as deleteNotificationAPI,
  markAllNotificationsRead,
  markNotificationUnread,
  clearNotifications as clearNotificationsAPI,
  deleteMultipleNotifications,
} from "./api";

import {
  NOTIFICATION_STATUS,
  NOTIFICATION_PRIORITY,
} from "./notificationTypes";

// Generate Notification ID
function generateNotificationId() {
  return `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Get Notifications
export async function getNotifications(phone) {
  try {
    return await fetchNotifications(phone);
  } catch (error) {
    console.error("Load Notifications:", error);
    return [];
  }
}

// Add Notification
export async function addNotification(notification) {
  try {
    return await createNotification({
      id: generateNotificationId(),
      title: notification.title,
      message: notification.message,
      type: notification.type || "system",
      priority:
        notification.priority || NOTIFICATION_PRIORITY.MEDIUM,
      customerPhone: notification.customerPhone,
      customerName: notification.customerName || "",
      actionUrl: notification.actionUrl || "",
    });
  } catch (error) {
    console.error(error);
  }
}

// Mark Read
export async function markAsRead(id) {
  return await markNotificationRead(id);
}

// Mark Unread
export async function markAsUnread(id) {
  return await markNotificationUnread(id);
}

// Mark All Read
export async function markAllRead(customerPhone) {
  return await markAllNotificationsRead(customerPhone);
}

// Delete
export async function deleteNotification(id) {
  return await deleteNotificationAPI(id);
}

// Clear All
export async function clearNotifications(customerPhone) {
  return await clearNotificationsAPI(customerPhone);
}

// Bulk Delete
export async function bulkDelete(ids) {
  return await deleteMultipleNotifications(ids);
}

// Helper Functions
export function getUnreadCount(notifications = []) {
  return notifications.filter(
    (item) => item.status === NOTIFICATION_STATUS.UNREAD
  ).length;
}

export function searchNotifications(
  notifications = [],
  keyword = ""
) {
  const search = keyword.toLowerCase();

  return notifications.filter(
    (item) =>
      item.title.toLowerCase().includes(search) ||
      item.message.toLowerCase().includes(search)
  );
}

export function getNotificationsByType(
  notifications = [],
  type
) {
  return notifications.filter(
    (item) => item.type === type
  );
}

export function getHighPriorityNotifications(
  notifications = []
) {
  return notifications.filter(
    (item) =>
      item.priority === NOTIFICATION_PRIORITY.HIGH
  );
}

const NotificationService = {
  getNotifications,
  addNotification,
  markAsRead,
  markAsUnread,
  markAllRead,
  deleteNotification,
  clearNotifications,
  bulkDelete,
  getUnreadCount,
  searchNotifications,
  getNotificationsByType,
  getHighPriorityNotifications,
};

export default NotificationService;