import {
  getNotifications,
  markAsRead,
  getUnreadCount,
} from "../services/notification.service.js";

// ==========================================
// Get All Notifications
// ==========================================
export async function getAllNotifications(req, res) {
  try {
    const notifications = await getNotifications();

    res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ==========================================
// Get Unread Count
// ==========================================
export async function getNotificationCount(req, res) {
  try {
    const count = await getUnreadCount();

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ==========================================
// Mark Notification As Read
// ==========================================
export async function readNotification(req, res) {
  try {
    const { id } = req.params;

    const notification = await markAsRead(id);

    res.json({
      success: true,
      notification,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}