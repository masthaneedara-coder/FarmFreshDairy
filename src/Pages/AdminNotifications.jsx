import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "https://farmfreshdairy.onrender.com/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const raw = await response.text();
  let body = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = { message: raw || "Unexpected server response" };
  }

  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || `Request failed (${response.status})`);
  }
  return body;
}

function unwrapList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.notifications)) return body.notifications;
  if (Array.isArray(body?.data)) return body.data;
  return [];
}

function dateLabel(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString();
}

function categoryOf(notification) {
  const type = String(notification?.type || "General").toLowerCase();
  if (type.includes("order")) return "Order";
  if (type.includes("deliver")) return "Delivery";
  if (type.includes("payment") || type.includes("billing")) return "Payment";
  if (type.includes("subscription") || type.includes("renew")) return "Subscription";
  if (type.includes("promotion") || type.includes("offer")) return "Promotion";
  if (type.includes("system") || type.includes("general")) return "System";
  return "System";
}

const categories = ["All", "Order", "Delivery", "Payment", "Subscription", "Promotion", "System"];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");

console.log("AdminNotifications component mounted");


const loadNotifications = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const body = await request("/notifications");
console.log("Admin API response:", body);
    console.log("Full API body:", body);

    const list = unwrapList(body);

    console.log("ADMIN NOTIFICATIONS COMPONENT RUNNING");
    console.log("NOTIFICATION COUNT:", list.length);

    setNotifications(list);
  } catch (err) {
    console.error("Notification loading error:", err);
    setError(err?.message || "Unable to load notifications.");
  } finally {
    setLoading(false);
  }
}, []);



  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((item) => item.is_read === false).length;
  const readCount = notifications.filter((item) => item.is_read === true).length;
  const highPriorityCount = notifications.filter((item) => {
    const text = `${item.title || ""} ${item.message || ""} ${item.priority || ""}`.toLowerCase();
    return text.includes("high priority") || text.includes("urgent") || text.includes("critical");
  }).length;

  const filteredNotifications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesSearch =
        !term ||
        [item.title, item.message, item.type, item.customer_id]
          .some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesCategory = category === "All" || categoryOf(item) === category;
      const matchesUnread = !unreadOnly || item.is_read === false;
      return matchesSearch && matchesCategory && matchesUnread;
    });
  }, [notifications, search, category, unreadOnly]);

  async function markOneRead(id) {
    if (!id) return;
    setBusyId(id);
    setActionError("");
    try {
      await request(`/notifications/${encodeURIComponent(id)}/read`, { method: "PUT" });
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch (err) {
      setActionError(err?.message || "Could not mark notification as read.");
    } finally {
      setBusyId("");
    }
  }

  async function markAllRead() {
    setBusyId("all");
    setActionError("");
    try {
      await request("/notifications/read-all", { method: "PUT" });
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setActionError(err?.message || "Could not mark notifications as read.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteOne(id) {
    if (!id || !window.confirm("Delete this notification?")) return;
    setBusyId(id);
    setActionError("");
    try {
      await request(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
      setNotifications((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setActionError(err?.message || "Could not delete notification.");
    } finally {
      setBusyId("");
    }
  }

  async function clearAll() {
    if (!notifications.length) return;
    if (!window.confirm("Delete all notifications? This cannot be undone.")) return;
    setBusyId("clear");
    setActionError("");
    try {
      // The current backend routes expose delete-one, but no admin delete-all endpoint.
      // Delete each record using the existing admin DELETE /api/notifications/:id route.
      await Promise.all(
        notifications.map((item) =>
          request(`/notifications/${encodeURIComponent(item.id)}`, { method: "DELETE" })
        )
      );
      setNotifications([]);
    } catch (err) {
      setActionError(
        `${err?.message || "Could not clear all notifications."} Some records may have been deleted; refresh the list.`
      );
      await loadNotifications();
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-3 py-5 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white bg-white/90 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-2xl shadow-sm">🔔</div>
            <div>
              <h1 className="text-xl font-black tracking-tight sm:text-3xl">Notifications</h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {unreadCount} unread · {notifications.length} total
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </header>

        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: notifications.length, icon: "🔔", color: "text-slate-900" },
            { label: "Unread", value: unreadCount, icon: "🔴", color: "text-rose-600" },
            { label: "Read", value: readCount, icon: "☑️", color: "text-emerald-600" },
            { label: "High Priority", value: highPriorityCount, icon: "⚡", color: "text-orange-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg">{stat.icon}</span>
                <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <span aria-hidden="true">🔎</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications…"
                aria-label="Search notifications"
                className="w-full min-w-0 bg-transparent py-3 text-sm outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">
              <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />
              Unread only
            </label>
          </div>
        </section>

        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Notification categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition sm:text-sm ${
                category === item
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0 || busyId !== ""}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✓ Mark all read
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={notifications.length === 0 || busyId !== ""}
              className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyId === "clear" ? "Deleting…" : "Delete all"}
            </button>
          </div>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            Showing <strong>{filteredNotifications.length}</strong> of {notifications.length}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-bold">Could not load notifications</p>
            <p className="mt-1 break-words">{error}</p>
            <button type="button" onClick={loadNotifications} className="mt-3 rounded-lg bg-rose-600 px-3 py-2 font-bold text-white">Try again</button>
          </div>
        )}

        {actionError && (
          <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {actionError}
          </div>
        )}

        <section className="space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
              <p className="text-sm font-semibold text-slate-500">Loading notifications…</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white px-5 py-14 text-center shadow-sm">
              <div className="mb-3 text-5xl">🔔</div>
              <h2 className="text-lg font-black">No notifications found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {notifications.length === 0
                  ? "No notification records were returned by the API."
                  : "Try changing your search, category, or unread filter."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isRead = item.is_read === true;
              const categoryName = categoryOf(item);
              return (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
                    isRead ? "border-slate-100 bg-white" : "border-emerald-200 bg-white ring-1 ring-emerald-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${
                      isRead ? "bg-slate-100" : "bg-emerald-100"
                    }`}>
                      {categoryName === "Order" ? "🛒" : categoryName === "Delivery" ? "🥛" : categoryName === "Payment" ? "💳" : categoryName === "Subscription" ? "🔄" : categoryName === "Promotion" ? "🎉" : "🔔"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words font-extrabold">{item.title || "Notification"}</h2>
                        {!isRead && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">Unread</span>}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.message || "No message provided."}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">{categoryName}</span>
                        <span>{dateLabel(item.created_at)}</span>
                        <span>{item.customer_id ? `Customer: ${item.customer_id}` : "Admin / general notification"}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {!isRead && (
                          <button
                            type="button"
                            disabled={busyId !== ""}
                            onClick={() => markOneRead(item.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {busyId === item.id ? "Saving…" : "Mark as read"}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId !== ""}
                          onClick={() => deleteOne(item.id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
