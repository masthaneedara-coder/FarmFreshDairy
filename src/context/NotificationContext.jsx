import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import NotificationService from "../config/notificationService";
import {
  useNotificationPreferences,
} from "./NotificationPreferenceContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { preferences } = useNotificationPreferences();

  const customerPhone =
    localStorage.getItem("customerPhone") || "";

  const loadNotifications = async () => {

    if (!customerPhone) {
      setNotifications([]);
      return;
    }

    setLoading(true);

    try {

      const data =
        await NotificationService.getNotifications(
          customerPhone
        );

      setNotifications(Array.isArray(data) ? data : []);

    } catch (error) {

      console.error(error);

      setNotifications([]);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadNotifications();

  }, [customerPhone]);

 const addNotification = async (notification) => {

  const type = notification.type || "system";

  const preferenceMap = {
    order: preferences.order,
    delivery: preferences.delivery,
    payment: preferences.payment,
    subscription: preferences.subscription,
    promotion: preferences.promotion,
    system: preferences.system,
  };

  if (preferenceMap[type] === false) {
    return;
  }

  await NotificationService.addNotification({
    ...notification,
    customerPhone,
    customerName:
      localStorage.getItem("customerName") || "",
  });

  await loadNotifications();
};

  const deleteNotification = async (id) => {

    await NotificationService.deleteNotification(id);

    await loadNotifications();

  };

  const markAsRead = async (id) => {

    await NotificationService.markAsRead(id);

    await loadNotifications();

  };

  const markAsUnread = async (id) => {
  await NotificationService.markAsUnread(id);
  await loadNotifications();
};

const markAllRead = async () => {
  await NotificationService.markAllRead(customerPhone);
  await loadNotifications();
};

const clearNotifications = async () => {
  await NotificationService.clearNotifications(customerPhone);
  await loadNotifications();
};

const bulkDelete = async (ids) => {
  await NotificationService.bulkDelete(ids);
  await loadNotifications();
};
useEffect(() => {
  if (!customerPhone) return;

  const interval = setInterval(() => {
    loadNotifications();
  }, 30000);

  return () => clearInterval(interval);
}, [customerPhone]);

  const unreadCount = useMemo(() => {

    return notifications.filter(
      (item) => item.status === "unread"
    ).length;

  }, [notifications]);
  const refreshNotifications = async () => {
    await loadNotifications();
  };
  const value = {
  notifications,
  unreadCount,
  loading,
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

export function useNotifications() {

  const context = useContext(NotificationContext);

  if (!context) {

    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );

  }

  return context;

}