import {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  getCustomerNotifications,
  getCustomerUnreadCount,
  markCustomerNotificationAsRead,
  deleteNotification,
} from "../services/notification.service.js";

/* =========================================================
   GET ALL NOTIFICATIONS
   Admin
   GET /api/notifications
========================================================= */

export async function getAllNotifications(req, res) {
  try {
    const notifications = await getNotifications();

    return res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    console.error(
      "Get All Notifications Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================================
   GET CUSTOMER NOTIFICATIONS
   GET /api/notifications/customer/:customerId
========================================================= */

export async function getCustomerNotificationsController(
  req,
  res
) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const notifications =
      await getCustomerNotifications(
        customerId
      );

    const unreadCount =
      await getCustomerUnreadCount(
        customerId
      );

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error(
      "Get Customer Notifications Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================================
   GET UNREAD COUNT
   Admin
   GET /api/notifications/count
========================================================= */

export async function getNotificationCount(
  req,
  res
) {
  try {
    const count = await getUnreadCount();

    return res.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error(
      "Get Notification Count Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================================
   GET CUSTOMER UNREAD COUNT
   GET /api/notifications/customer/:customerId/count
========================================================= */

export async function getCustomerNotificationCount(
  req,
  res
) {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const count =
      await getCustomerUnreadCount(
        customerId
      );

    return res.json({
      success: true,
      count,
    });
  } catch (err) {
    console.error(
      "Get Customer Notification Count Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================================
   CREATE NOTIFICATION
   POST /api/notifications
========================================================= */

export async function sendNotification(
  req,
  res
) {
  try {
    const {
      customer_id,
      title,
      message,
      type,
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Notification title is required",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Notification message is required",
      });
    }

    const notification =
      await createNotification({
        customerId: customer_id,
        title,
        message,
        type: type || "General",
      });

    return res.status(201).json({
      success: true,
      message:
        "Notification created successfully",
      notification,
    });
  } catch (err) {
    console.error(
      "Create Notification Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================================
   MARK ONE NOTIFICATION AS READ
   PUT /api/notifications/:id/read
========================================================= */

export async function readNotification(
  req,
  res
) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    const notification =
      await markAsRead(id);

    return res.json({
      success: true,
      message:
        "Notification marked as read",
      notification,
    });
  } catch (err) {
    console.error(
      "Mark Notification Read Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
   PUT /api/notifications/read-all
========================================================= */

export async function readAllNotifications(
  req,
  res
) {
  try {
    const notifications =
      await markAllAsRead();

    return res.json({
      success: true,
      message:
        "All notifications marked as read",
      notifications,
    });
  } catch (err) {
    console.error(
      "Mark All Notifications Read Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================================
   MARK CUSTOMER NOTIFICATION AS READ
   PUT /api/notifications/customer/:customerId/:id/read
========================================================= */

export async function readCustomerNotification(
  req,
  res
) {
  try {
    const {
      customerId,
      id,
    } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Notification ID is required",
      });
    }

    const notification =
      await markCustomerNotificationAsRead(
        id,
        customerId
      );

    return res.json({
      success: true,
      message:
        "Notification marked as read",
      notification,
    });
  } catch (err) {
    console.error(
      "Mark Customer Notification Read Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* =========================================================
   DELETE NOTIFICATION
   DELETE /api/notifications/:id
========================================================= */

export async function removeNotification(
  req,
  res
) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Notification ID is required",
      });
    }

    const notification =
      await deleteNotification(id);

    return res.json({
      success: true,
      message:
        "Notification deleted successfully",
      notification,
    });
  } catch (err) {
    console.error(
      "Delete Notification Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}