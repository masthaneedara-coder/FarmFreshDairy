import { useEffect, useState } from "react";
import { getJSON } from "../../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);

  async function loadNotifications() {
    try {
      const data = await getJSON(`${API_URL}/notifications`);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-xl font-bold mb-4">
        🔔 Notifications
      </h2>

      {notifications.length === 0 ? (
        <p>No Notifications</p>
      ) : (
        notifications.map((item) => (
          <div
            key={item.id}
            className="border-b py-3"
          >
            <div className="font-bold">
              {item.title}
            </div>

            <div className="text-gray-600">
              {item.message}
            </div>
          </div>
        ))
      )}
    </div>
  );
}