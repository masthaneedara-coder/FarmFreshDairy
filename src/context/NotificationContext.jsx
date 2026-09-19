import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import { useNotificationPreferences } from "./NotificationPreferenceContext";

const NotificationContext = createContext(null);

const API_URL = "https://farmfreshdairy.onrender.com/api";
// Local backend:
// const API_URL = "http://localhost:5000/api";

/* =========================================================
   GET LOGGED-IN CUSTOMER ID

   Auth stores the complete customer object in:
   localStorage.customer
========================================================= */

function getCustomerId() {
  try {
    const customerRaw = localStorage.getItem("customer");

    if (customerRaw) {
      const customer = JSON.parse(customerRaw);

      if (customer?.id) {
        return customer.id;
      }
    }
  } catch (error) {
    console.warn(
      "Unable to read customer from localStorage:",
      error
    );
  }

  return (
    localStorage.getItem("customerId") ||
    localStorage.getItem("customer_id") ||
    ""
  );
}

/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      success: false,
      message: text || "Invalid server response",
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

/* =========================================================
   PROVIDER
========================================================= */

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { preferences } = useNotificationPreferences();

  const customerId = getCustomerId();

  /* =======================================================
     LOAD CUSTOMER NOTIFICATIONS
  ======================================================= */

  const loadNotifications = useCallback(async () => {
    const id = getCustomerId();

    if (!id) {
      console.warn(
        "Customer ID not found. Notifications cannot load."
      );

      setNotifications([]);
      setError("Customer ID not found");

      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        `${API_URL}/notifications/customer/${id}`
      );

      console.log(
        "Customer notifications API response:",
        data
      );

      const notificationList = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setNotifications(notificationList);
    } catch (err) {
      console.error(
        "Load notifications error:",
        err
      );

      setNotifications([]);
      setError(
        err?.message ||
          "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, customerId]);

  /* =======================================================
     AUTO REFRESH
     Every 30 seconds
  ======================================================= */

  useEffect(() => {
    if (!customerId) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [customerId, loadNotifications]);

  /* =======================================================
     ADD NOTIFICATION
  ======================================================= */

  const addNotification = async (notification) => {
    const id = getCustomerId();

    if (!id) {
      console.warn(
        "Cannot create notification: customer ID missing"
      );

      return;
    }

    const type = (
      notification?.type || "General"
    ).toLowerCase();

    const preferenceMap = {
      order: preferences?.order,
      delivery: preferences?.delivery,
      payment: preferences?.payment,
      subscription: preferences?.subscription,
      promotion: preferences?.promotion,
      system: preferences?.system,
      general: preferences?.system,
    };

    if (
      Object.prototype.hasOwnProperty.call(
        preferenceMap,
        type
      ) &&
      preferenceMap[type] === false
    ) {
      return;
    }

    try {
      await apiRequest(
        `${API_URL}/notifications`,
        {
          method: "POST",
          body: JSON.stringify({
            customer_id: id,
            title:
              notification?.title ||
              "Farm Fresh Dairy",
            message:
              notification?.message || "",
            type:
              notification?.type ||
              "General",
          }),
        }
      );

      await loadNotifications();
    } catch (err) {
      console.error(
        "Add notification error:",
        err
      );

      throw err;
    }
  };

  /* =======================================================
     MARK ONE AS READ
     Customer-specific
  ======================================================= */

  const markAsRead = async (id) => {
    if (!id) return;

    const idCustomer = getCustomerId();

    if (!idCustomer) return;

    try {
      await apiRequest(
        `${API_URL}/notifications/customer/${idCustomer}/${id}/read`,
        {
          method: "PUT",
        }
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                is_read: true,
                status: "read",
              }
            : notification
        )
      );
    } catch (err) {
      console.error(
        "Mark notification as read error:",
        err
      );

      throw err;
    }
  };

  /* =======================================================
     MARK AS UNREAD

     Backend does not currently provide this endpoint.
  ======================================================= */

  const markAsUnread = async () => {
    console.warn(
      "markAsUnread is not supported by the current backend."
    );
  };

  /* =======================================================
     MARK ALL AS READ
     CUSTOMER-SAFE

     PUT /notifications/customer/:customerId/read-all
  ======================================================= */

  const markAllRead = async () => {
    const idCustomer = getCustomerId();

    if (!idCustomer) {
      console.warn(
        "Cannot mark all notifications as read: customer ID missing"
      );

      return;
    }

    try {
      await apiRequest(
        `${API_URL}/notifications/customer/${idCustomer}/read-all`,
        {
          method: "PUT",
        }
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          status: "read",
        }))
      );
    } catch (err) {
      console.error(
        "Mark all customer notifications read error:",
        err
      );

      throw err;
    }
  };

  /* =======================================================
     DELETE ONE
     CUSTOMER-SAFE

     DELETE /notifications/customer/:customerId/:id
  ======================================================= */

  const deleteNotification = async (id) => {
    if (!id) return;

    const idCustomer = getCustomerId();

    if (!idCustomer) {
      console.warn(
        "Cannot delete notification: customer ID missing"
      );

      return;
    }

    try {
      await apiRequest(
        `${API_URL}/notifications/customer/${idCustomer}/${id}`,
        {
          method: "DELETE",
        }
      );

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== id
        )
      );
    } catch (err) {
      console.error(
        "Delete customer notification error:",
        err
      );

      throw err;
    }
  };

  /* =======================================================
     CLEAR ALL
     CUSTOMER-SAFE

     DELETE /notifications/customer/:customerId
  ======================================================= */

  const clearNotifications = async () => {
    const idCustomer = getCustomerId();

    if (!idCustomer) {
      console.warn(
        "Cannot clear notifications: customer ID missing"
      );

      return;
    }

    try {
      await apiRequest(
        `${API_URL}/notifications/customer/${idCustomer}`,
        {
          method: "DELETE",
        }
      );

      setNotifications([]);
    } catch (err) {
      console.error(
        "Clear customer notifications error:",
        err
      );

      throw err;
    }
  };

  /* =======================================================
     BULK DELETE
     CUSTOMER-SAFE

     Each notification is deleted with customer ID.
  ======================================================= */

  const bulkDelete = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      return;
    }

    const idCustomer = getCustomerId();

    if (!idCustomer) {
      console.warn(
        "Cannot bulk delete notifications: customer ID missing"
      );

      return;
    }

    try {
      await Promise.all(
        ids.map((id) => {
          if (!id) return Promise.resolve();

          return apiRequest(
            `${API_URL}/notifications/customer/${idCustomer}/${id}`,
            {
              method: "DELETE",
            }
          );
        })
      );

      setNotifications((current) =>
        current.filter(
          (notification) =>
            !ids.includes(notification.id)
        )
      );
    } catch (err) {
      console.error(
        "Bulk delete customer notifications error:",
        err
      );

      throw err;
    }
  };

  /* =======================================================
     REFRESH
  ======================================================= */

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  /* =======================================================
     UNREAD COUNT
  ======================================================= */

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) =>
        notification?.is_read === false ||
        notification?.status === "unread"
    ).length;
  }, [notifications]);

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    customerId,

    loadNotifications,
    refreshNotifications,

    addNotification,
    deleteNotification,

    markAsRead,
    markAsUnread,
    markAllRead,

    clearNotifications,
    bulkDelete,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useNotifications() {
  const context = useContext(
    NotificationContext
  );

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
}