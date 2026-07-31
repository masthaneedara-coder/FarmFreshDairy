import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  getNotificationColor,
  getNotificationIcon,
} from "../config/notificationTypes";

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_STATUS_FILTERS,
  NOTIFICATION_PRIORITY_FILTERS,
  NOTIFICATION_SORT_OPTIONS,
} from "../config/notificationFilters";

import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    markAllRead,
    clearNotifications,
  } = useNotifications();

  /* -----------------------------
     Search & Filters
  ------------------------------*/

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [priorityFilter, setPriorityFilter] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("latest");

  /* -----------------------------
     Bulk Selection
  ------------------------------*/

  const [
    selectedNotifications,
    setSelectedNotifications,
  ] = useState([]);

  /* -----------------------------
     Filter Notifications
  ------------------------------*/

  const filteredNotifications = useMemo(() => {
    let data = [...notifications];

    // Search

    if (search.trim()) {
      const keyword = search.toLowerCase();

      data = data.filter(
        (item) =>
          item.title
            ?.toLowerCase()
            .includes(keyword) ||
          item.message
            ?.toLowerCase()
            .includes(keyword)
      );
    }

    // Category

    if (categoryFilter !== "all") {
      data = data.filter(
        (item) => item.type === categoryFilter
      );
    }

    // Status

    if (statusFilter !== "all") {
      data = data.filter(
        (item) => item.status === statusFilter
      );
    }

    // Priority

    if (priorityFilter !== "all") {
      data = data.filter(
        (item) =>
          item.priority === priorityFilter
      );
    }

    // Sorting

    const priorityOrder = {
      high: 3,
      medium: 2,
      low: 1,
    };

    switch (sortBy) {
      case "oldest":
        data.sort(
          (a, b) =>
            new Date(a.createdAt) -
            new Date(b.createdAt)
        );
        break;

      case "priorityHigh":
        data.sort(
          (a, b) =>
            priorityOrder[b.priority] -
            priorityOrder[a.priority]
        );
        break;

      case "priorityLow":
        data.sort(
          (a, b) =>
            priorityOrder[a.priority] -
            priorityOrder[b.priority]
        );
        break;

      default:
        data.sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );
    }

    return data;
  }, [
    notifications,
    search,
    categoryFilter,
    statusFilter,
    priorityFilter,
    sortBy,
  ]);

  /* -----------------------------
     Statistics
  ------------------------------*/

  const todayCount = notifications.filter(
    (item) =>
      new Date(item.createdAt).toDateString() ===
      new Date().toDateString()
  ).length;

  const readCount =
    notifications.length - unreadCount;

  const highPriorityCount =
    notifications.filter(
      (item) => item.priority === "high"
    ).length;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}

      <div className="bg-white shadow-sm border-b sticky top-0 z-20">

        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div>

            <h1 className="text-3xl font-bold text-green-700">
              🔔 Notifications
            </h1>

            <p className="text-gray-500 mt-1">
              View and manage all your
              notifications
            </p>

          </div>

          <Link
            to="/notification-settings"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            ⚙ Settings
          </Link>

        </div>

      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* Statistics */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

          <div className="bg-white rounded-xl shadow p-5">

            <p className="text-gray-500">
              Total
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {notifications.length}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-5">

            <p className="text-gray-500">
              Unread
            </p>

            <h2 className="text-3xl font-bold text-red-500 mt-2">
              {unreadCount}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-5">

            <p className="text-gray-500">
              Read
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {readCount}
            </h2>

          </div>

          <div className="bg-white rounded-xl shadow p-5">

            <p className="text-gray-500">
              High Priority
            </p>

            <h2 className="text-3xl font-bold text-orange-500 mt-2">
              {highPriorityCount}
            </h2>

          </div>

        </div>

        {/* Search & Filters start here in Part 2 */}
                {/* Search & Filters */}

        <div className="bg-white rounded-2xl shadow p-5 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Search */}

            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
            />

            {/* Category */}

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
              className="border rounded-lg px-4 py-3"
            >
              {NOTIFICATION_CATEGORIES.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item.charAt(0).toUpperCase() +
                    item.slice(1)}
                </option>
              ))}
            </select>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="border rounded-lg px-4 py-3"
            >
              {NOTIFICATION_STATUS_FILTERS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item.charAt(0).toUpperCase() +
                      item.slice(1)}
                  </option>
                )
              )}
            </select>

            {/* Priority */}

            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value)
              }
              className="border rounded-lg px-4 py-3"
            >
              {NOTIFICATION_PRIORITY_FILTERS.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item.charAt(0).toUpperCase() +
                      item.slice(1)}
                  </option>
                )
              )}
            </select>

            {/* Sort */}

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="border rounded-lg px-4 py-3"
            >
              {NOTIFICATION_SORT_OPTIONS.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

          </div>

        </div>

        {/* Action Buttons */}

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">

          <div className="flex flex-wrap gap-3">

            <button
              onClick={markAllRead}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
            >
              ✓ Mark All Read
            </button>

            <button
              onClick={clearNotifications}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
            >
              🗑 Clear All
            </button>

          </div>

          <div className="text-sm text-gray-500">

            Showing{" "}
            <span className="font-semibold">
              {filteredNotifications.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold">
              {notifications.length}
            </span>{" "}
            notifications

          </div>

        </div>

        {/* Selection Controls */}

        <div className="flex flex-wrap gap-3 mb-5">

          <button
            onClick={() =>
              setSelectedNotifications(
                filteredNotifications.map(
                  (item) => item.id
                )
              )
            }
            className="border rounded-lg px-4 py-2 hover:bg-gray-100"
          >
            Select All
          </button>

          <button
            onClick={() =>
              setSelectedNotifications([])
            }
            className="border rounded-lg px-4 py-2 hover:bg-gray-100"
          >
            Deselect All
          </button>

        </div>

        {/* Bulk Toolbar */}

        {selectedNotifications.length > 0 && (

          <div className="sticky top-24 z-10 bg-white rounded-xl shadow border p-4 mb-6 flex flex-wrap justify-between items-center">

            <h3 className="font-semibold">

              {selectedNotifications.length} Selected

            </h3>

            <div className="flex gap-3">

              <button
                onClick={async () => {

                  for (const id of selectedNotifications) {
                    await markAsRead(id);
                  }

                  setSelectedNotifications([]);

                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Mark Read
              </button>

              <button
                onClick={async () => {

                  for (const id of selectedNotifications) {
                    await deleteNotification(id);
                  }

                  setSelectedNotifications([]);

                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>

              <button
                onClick={() =>
                  setSelectedNotifications([])
                }
                className="border px-4 py-2 rounded-lg"
              >
                Cancel
              </button>

            </div>

          </div>

        )}

        {/* Notification List starts in Part 3 */}
                {/* Notification List */}

        <div className="space-y-5">

          {filteredNotifications.length === 0 && (

            <div className="bg-white rounded-2xl shadow p-12 text-center">

              <div className="text-7xl mb-4">
                🔔
              </div>

              <h2 className="text-2xl font-bold text-gray-700">
                No Notifications Found
              </h2>

              <p className="text-gray-500 mt-3">
                Try changing your search or filter.
              </p>

            </div>

          )}

          {filteredNotifications.map((item) => {

            const color =
              getNotificationColor(item.type);

            const selected =
              selectedNotifications.includes(
                item.id
              );

            return (

              <div
                key={item.id}
                className={`rounded-2xl border shadow transition-all duration-300 hover:shadow-lg

                ${
                  selected
                    ? "border-blue-500 bg-blue-50"
                    : `${color.border} bg-white`
                }`}
              >

                <div className="p-5 flex flex-col lg:flex-row justify-between gap-5">

                  {/* Left */}

                  <div className="flex gap-4 flex-1">

                    {/* Checkbox */}

                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {

                        setSelectedNotifications(
                          (prev) =>

                            prev.includes(item.id)

                              ? prev.filter(
                                  (id) =>
                                    id !== item.id
                                )

                              : [
                                  ...prev,
                                  item.id,
                                ]
                        );

                      }}
                      className="mt-2 w-5 h-5"
                    />

                    {/* Icon */}

                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${color.bg}`}
                    >
                      {getNotificationIcon(
                        item.type
                      )}
                    </div>

                    {/* Content */}

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="font-bold text-lg">
                          {item.title}
                        </h2>

                        {item.status ===
                          "unread" && (

                          <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold">

                            Unread

                          </span>

                        )}

                        {item.priority ===
                          "high" && (

                          <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold">

                            High Priority

                          </span>

                        )}

                      </div>

                      <p className="text-gray-600 mt-3 leading-relaxed">

                        {item.message}

                      </p>

                      <div className="flex flex-wrap gap-5 mt-4 text-sm text-gray-500">

                        <span>

                          📅{" "}

                          {new Date(
                            item.createdAt
                          ).toLocaleDateString()}

                        </span>

                        <span>

                          🕒{" "}

                          {new Date(
                            item.createdAt
                          ).toLocaleTimeString()}

                        </span>

                        <span>

                          📂{" "}

                          {item.type}

                        </span>

                      </div>

                    </div>

                  </div>

                  {/* Right */}

                  <div className="flex lg:flex-col gap-3 justify-center">

                    {item.status ===
                      "unread" && (

                      <button
                        onClick={() =>
                          markAsRead(item.id)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition"
                      >
                        ✓ Read
                      </button>

                    )}

                    <button
                      onClick={() =>
                        deleteNotification(
                          item.id
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
                    >
                      🗑 Delete
                    </button>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

        {/* Footer */}

        <div className="mt-8 flex justify-center">

          <div className="text-gray-500 text-sm">

            Showing

            <span className="font-bold mx-1">

              {filteredNotifications.length}

            </span>

            of

            <span className="font-bold mx-1">

              {notifications.length}

            </span>

            notifications

          </div>

        </div>

        {/* Part 4 starts here */}
                {/* Refresh Section */}

        <div className="mt-8 flex flex-wrap justify-between items-center gap-4">

          <div className="text-sm text-gray-500">
            Last updated:
            <span className="font-semibold ml-2">
              {new Date().toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            🔄 Refresh
          </button>

        </div>

        {/* Bottom Statistics */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

          <div className="bg-white rounded-xl shadow p-4">

            <p className="text-gray-500 text-sm">
              Orders
            </p>

            <h3 className="text-2xl font-bold text-green-600">
              {
                notifications.filter(
                  (n) => n.type === "order"
                ).length
              }
            </h3>

          </div>

          <div className="bg-white rounded-xl shadow p-4">

            <p className="text-gray-500 text-sm">
              Delivery
            </p>

            <h3 className="text-2xl font-bold text-blue-600">
              {
                notifications.filter(
                  (n) => n.type === "delivery"
                ).length
              }
            </h3>

          </div>

          <div className="bg-white rounded-xl shadow p-4">

            <p className="text-gray-500 text-sm">
              Payments
            </p>

            <h3 className="text-2xl font-bold text-purple-600">
              {
                notifications.filter(
                  (n) => n.type === "payment"
                ).length
              }
            </h3>

          </div>

          <div className="bg-white rounded-xl shadow p-4">

            <p className="text-gray-500 text-sm">
              Promotions
            </p>

            <h3 className="text-2xl font-bold text-orange-600">
              {
                notifications.filter(
                  (n) => n.type === "promotion"
                ).length
              }
            </h3>

          </div>

        </div>

      </div>

    </div>

  );

}