import { useNotifications } from "../../context/NotificationContext";

export default function NotificationBell({ onClick }) {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className="relative w-12 h-12 rounded-2xl bg-white shadow-lg border border-green-100 flex items-center justify-center hover:scale-105 transition"
    >
      <span className="text-2xl">🔔</span>

      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}