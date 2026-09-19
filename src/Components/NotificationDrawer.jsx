import { Link } from "react-router-dom";
import {
  getNotificationIcon,
  getNotificationColor,
} from "../config/notificationTypes";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationDrawer({ open, onClose }) {
  const {
    notifications = [],
    unreadCount = 0,
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
          className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[9999] h-full w-full bg-white shadow-2xl transition-transform duration-300 sm:w-[420px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
              🔔
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-black text-emerald-700">
                Notifications
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                {unreadCount} unread notification
                {unreadCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-slate-700 transition hover:bg-slate-100 hover:text-red-500 active:scale-95"
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-b bg-white p-4">
          <button
            type="button"
            onClick={markAllRead}
            className="flex-1 rounded-xl bg-emerald-100 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-200 active:scale-[0.98]"
          >
            ✓ Mark All Read
          </button>

          <button
            type="button"
            onClick={clearNotifications}
            className="flex-1 rounded-xl bg-red-100 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-200 active:scale-[0.98]"
          >
            🗑 Clear All
          </button>
        </div>

        {/* Notifications */}
        <div className="h-[calc(100%-170px)] overflow-y-auto bg-slate-50 px-1 py-2">
          {notifications.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="text-6xl">🔔</div>
              <h3 className="mt-4 text-xl font-black text-slate-800">
                No Notifications
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                You're all caught up.
              </p>
            </div>
          )}

          {notifications.map((item) => {
            const colors = getNotificationColor(item.type);

            // Supabase uses created_at; older frontend data may use createdAt.
            const notificationDate =
              item.createdAt || item.created_at || item.createdDate;

            const isUnread =
              item.is_read === false || item.status === "unread";

            return (
              <div
                key={item.id}
                className={`m-2 rounded-2xl border p-4 shadow-sm transition ${
                  isUnread ? "ring-1 ring-emerald-100" : ""
                } ${colors.bg} ${colors.border}`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-2xl shadow-sm">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">
                            {item.title}
                          </h4>

                          {isUnread && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-600">
                              Unread
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-5 text-slate-600">
                          {item.message}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteNotification(item.id)}
                        className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="mt-2 text-xs font-medium text-slate-400">
                      {notificationDate ? (
                        <>
                          📅{" "}
                          {new Date(notificationDate).toLocaleDateString()}{" "}
                          · 🕒{" "}
                          {new Date(notificationDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </>
                      ) : (
                        "—"
                      )}
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95"
                      >
                        ✓ Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block w-full rounded-2xl bg-emerald-600 py-3 text-center font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            View All Notifications
          </Link>
        </div>
      </aside>
    </>
  );
}
