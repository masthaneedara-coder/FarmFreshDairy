import { Link } from "react-router-dom";
import {
  getNotificationIcon,
  getNotificationColor,
} from "../config/notificationTypes";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationDrawer({
  open,
  onClose,
}) {
  const {
    notifications,
    markAsRead,
    deleteNotification,
    markAllRead,
    clearNotifications,
  } = useNotifications();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-[9998]"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px]
        bg-white shadow-2xl z-[9999]
        transition-transform duration-300
        ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-xl font-black text-green-700">
            🔔 Notifications
          </h2>

          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-red-500"
          >
            ✕
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-b">
          <button
            onClick={markAllRead}
            className="flex-1 bg-green-100 text-green-700 py-2 rounded-xl font-semibold hover:bg-green-200"
          >
            Mark All Read
          </button>

          <button
            onClick={clearNotifications}
            className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl font-semibold hover:bg-red-200"
          >
            Clear All
          </button>
        </div>

        {/* Notifications */}
        <div className="overflow-y-auto h-[calc(100%-170px)]">

          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="text-6xl">🔔</div>

              <h3 className="mt-4 text-xl font-bold">
                No Notifications
              </h3>

              <p className="text-gray-500 mt-2">
                You're all caught up.
              </p>
            </div>
          )}

          {notifications.map((item) => {
            const colors = getNotificationColor(item.type);

            return (
              <div
                key={item.id}
                className={`m-3 rounded-2xl border p-4 shadow-sm
                ${colors.bg}
                ${colors.border}`}
              >
                <div className="flex justify-between">

                  <div className="flex gap-3">

                    <div className="text-2xl">
                      {getNotificationIcon(item.type)}
                    </div>

                    <div>

                      <h4 className="font-bold">
                        {item.title}
                      </h4>

                      <p className="text-sm text-gray-600 mt-1">
                        {item.message}
                      </p>

                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </p>

                    </div>

                  </div>

                  <div className="flex flex-col gap-2">

                    {item.status === "unread" && (
                      <button
                        onClick={() =>
                          markAsRead(item.id)
                        }
                        className="text-green-600 text-xs"
                      >
                        Read
                      </button>
                    )}

                    <button
                      onClick={() =>
                        deleteNotification(item.id)
                      }
                      className="text-red-500 text-xs"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-bold"
          >
            View All Notifications
          </Link>
        </div>
      </div>
    </>
  );
}