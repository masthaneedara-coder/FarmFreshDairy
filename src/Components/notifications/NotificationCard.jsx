export default function NotificationCard({
  notification,
  onRead,
  onDelete,
}) {
  const colors = {
    order: "bg-green-50 border-green-200",
    delivery: "bg-blue-50 border-blue-200",
    subscription: "bg-purple-50 border-purple-200",
    payment: "bg-yellow-50 border-yellow-200",
    offer: "bg-pink-50 border-pink-200",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${
        colors[notification.type] || "bg-gray-50"
      }`}
    >
      <div className="flex justify-between">

        <div>

          <h3 className="font-bold">
            {notification.title}
          </h3>

          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            {notification.time}
          </p>

        </div>

        {!notification.read && (
          <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
        )}
      </div>

      <div className="flex gap-2 mt-4">

        {!notification.read && (
          <button
            onClick={() => onRead(notification.id)}
            className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm"
          >
            Mark Read
          </button>
        )}

        <button
          onClick={() => onDelete(notification.id)}
          className="px-3 py-2 rounded-xl bg-red-500 text-white text-sm"
        >
          Delete
        </button>

      </div>
    </div>
  );
}