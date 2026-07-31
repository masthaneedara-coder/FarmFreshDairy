import { useNotifications } from "../context/NotificationContext";

export default function NotificationBell({
  onClick,
  className = "",
}) {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      aria-label="Notifications"
      className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl
      bg-white border border-green-100 shadow-md
      hover:shadow-lg hover:scale-105
      transition-all duration-300
      flex items-center justify-center ${className}`}
    >
      {/* Bell */}
      <span
        className={`text-xl sm:text-2xl ${
          unreadCount > 0 ? "animate-bounce" : ""
        }`}
      >
        🔔
      </span>

      {/* Badge */}
      {unreadCount > 0 && (
        <>
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px]
            px-1 rounded-full bg-red-500 text-white
            text-[10px] sm:text-xs font-bold
            flex items-center justify-center shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>

          {/* Pulse */}
          <span className="absolute -top-1 -right-1 w-[22px] h-[22px]
            rounded-full bg-red-400 opacity-70 animate-ping"></span>
        </>
      )}
    </button>
  );
}