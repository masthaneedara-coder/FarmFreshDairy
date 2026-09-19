import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getNotificationColor, getNotificationIcon } from "../config/notificationTypes";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_STATUS_FILTERS,
  NOTIFICATION_PRIORITY_FILTERS,
  NOTIFICATION_SORT_OPTIONS,
} from "../config/notificationFilters";
import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead,
    deleteNotification,
    markAllRead,
    clearNotifications,
  } = useNotifications();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState([]);

  const dateOf = (n) => n.createdAt || n.created_at || new Date().toISOString();
  const statusOf = (n) => n.status || (n.is_read ? "read" : "unread");
  const priorityOf = (n) => n.priority || "medium";
  const typeOf = (n) => n.type || "system";

  const filtered = useMemo(() => {
    let data = [...notifications];
    const q = search.trim().toLowerCase();

    if (q) {
      data = data.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all")
      data = data.filter((n) => typeOf(n) === categoryFilter);
    if (statusFilter !== "all")
      data = data.filter((n) => statusOf(n) === statusFilter);
    if (priorityFilter !== "all")
      data = data.filter((n) => priorityOf(n) === priorityFilter);

    const po = { high: 3, medium: 2, low: 1 };
    data.sort((a, b) => {
      if (sortBy === "oldest") return new Date(dateOf(a)) - new Date(dateOf(b));
      if (sortBy === "priorityHigh") return (po[priorityOf(b)] || 0) - (po[priorityOf(a)] || 0);
      if (sortBy === "priorityLow") return (po[priorityOf(a)] || 0) - (po[priorityOf(b)] || 0);
      return new Date(dateOf(b)) - new Date(dateOf(a));
    });
    return data;
  }, [notifications, search, categoryFilter, statusFilter, priorityFilter, sortBy]);

  const todayCount = notifications.filter(
    (n) => new Date(dateOf(n)).toDateString() === new Date().toDateString()
  ).length;
  const readCount = Math.max(notifications.length - unreadCount, 0);
  const highCount = notifications.filter((n) => priorityOf(n) === "high").length;

  const toggle = (id) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const selectAll = () => setSelected(filtered.map((n) => n.id));
  const clearSelection = () => setSelected([]);

  const bulkRead = async () => {
    for (const id of selected) await markAsRead(id);
    clearSelection();
  };

  const bulkDelete = async () => {
    for (const id of selected) await deleteNotification(id);
    clearSelection();
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("latest");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 pb-24">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl shadow-sm sm:h-14 sm:w-14 sm:text-3xl">🔔</div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black text-slate-900 sm:text-3xl">Notifications</h1>
                <p className="text-xs font-medium text-slate-500 sm:text-sm">{unreadCount} unread · {todayCount} today</p>
              </div>
            </div>
            <Link to="/notification-settings" className="flex h-11 shrink-0 items-center rounded-xl bg-slate-900 px-3 text-sm font-bold text-white shadow-lg active:scale-95">
              <span className="sm:hidden">⚙️</span><span className="hidden sm:inline">⚙ Settings</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-7">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Stat label="Total" value={notifications.length} icon="🔔" />
          <Stat label="Unread" value={unreadCount} icon="🔴" valueClass="text-red-600" />
          <Stat label="Read" value={readCount} icon="✅" valueClass="text-emerald-600" />
          <Stat label="High Priority" value={highCount} icon="⚡" valueClass="text-orange-600" />
        </div>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:mt-6 sm:p-5">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">🔎</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <button onClick={() => setShowFilters((v) => !v)} className={`h-12 shrink-0 rounded-xl px-4 text-sm font-bold active:scale-95 ${showFilters ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800"}`}>
              <span className="sm:hidden">⚙️</span><span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <Filter label="Category" value={categoryFilter} setValue={setCategoryFilter} options={NOTIFICATION_CATEGORIES} />
              <Filter label="Status" value={statusFilter} setValue={setStatusFilter} options={NOTIFICATION_STATUS_FILTERS} />
              <Filter label="Priority" value={priorityFilter} setValue={setPriorityFilter} options={NOTIFICATION_PRIORITY_FILTERS} />
              <Filter label="Sort" value={sortBy} setValue={setSortBy} options={NOTIFICATION_SORT_OPTIONS.map((x) => x.value)} labels={NOTIFICATION_SORT_OPTIONS} />
              <button onClick={resetFilters} className="h-11 rounded-xl border bg-slate-50 text-sm font-bold sm:col-span-2 lg:col-span-4">Reset Filters</button>
            </div>
          )}
        </section>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {["all", ...NOTIFICATION_CATEGORIES.filter((x) => x !== "all")].map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize active:scale-95 ${categoryFilter === cat ? "bg-emerald-600 text-white shadow-md" : "border bg-white text-slate-600"}`}>
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button onClick={markAllRead} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white active:scale-95">✓ Mark All Read</button>
            <button onClick={clearNotifications} className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 active:scale-95">🗑 Clear All</button>
          </div>
          <p className="text-xs font-semibold text-slate-500">Showing <b>{filtered.length}</b> of <b>{notifications.length}</b></p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button onClick={selectAll} className="rounded-lg border bg-white px-3 py-2 text-xs font-bold">Select All</button>
          {selected.length > 0 && <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{selected.length} selected</span>}
        </div>

        {selected.length > 0 && (
          <div className="sticky top-[73px] z-30 mt-3 rounded-2xl border border-blue-100 bg-blue-50/95 p-3 shadow-lg backdrop-blur sm:top-24">
            <div className="flex flex-wrap gap-2">
              <button onClick={bulkRead} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">✓ Mark Read</button>
              <button onClick={bulkDelete} className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white">🗑 Delete</button>
              <button onClick={clearSelection} className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold">Cancel</button>
            </div>
          </div>
        )}

        <section className="mt-5 space-y-3 sm:space-y-4">
          {filtered.length === 0 && (
            <div className="rounded-3xl border bg-white px-5 py-14 text-center shadow-sm">
              <div className="text-6xl">🔔</div>
              <h2 className="mt-4 text-xl font-black text-slate-800">No Notifications</h2>
              <p className="mt-2 text-sm text-slate-500">There are no notifications matching your filters.</p>
            </div>
          )}

          {filtered.map((item) => {
            const color = getNotificationColor(typeOf(item));
            const status = statusOf(item);
            const priority = priorityOf(item);
            const selectedItem = selected.includes(item.id);
            const created = dateOf(item);

            return (
              <article key={item.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm sm:rounded-3xl ${selectedItem ? "border-blue-400 ring-2 ring-blue-100" : color.border}`}>
                <div className="p-4 sm:p-5">
                  <div className="flex gap-3 sm:gap-4">
                    <input type="checkbox" checked={selectedItem} onChange={() => toggle(item.id)} className="mt-2 h-5 w-5 shrink-0 accent-emerald-600" />
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl sm:h-14 sm:w-14 sm:text-3xl ${color.bg}`}>{getNotificationIcon(typeOf(item))}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="text-base font-black leading-tight text-slate-900 sm:text-lg">{item.title}</h2>
                        <div className="flex gap-1.5">
                          {status === "unread" && <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-black uppercase text-red-600">Unread</span>}
                          {priority === "high" && <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black uppercase text-orange-600">High</span>}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{item.message}</p>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-400 sm:text-xs">
                        <span>📅 {new Date(created).toLocaleDateString()}</span>
                        <span>🕒 {new Date(created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="capitalize">📂 {typeOf(item)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 pl-8 sm:flex sm:justify-end sm:pl-0">
                    {status === "unread" && <button onClick={() => markAsRead(item.id)} className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white active:scale-95 sm:px-5">✓ Mark Read</button>}
                    <button onClick={() => deleteNotification(item.id)} className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 active:scale-95 sm:px-5">🗑 Delete</button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini label="Orders" value={notifications.filter((n) => typeOf(n) === "order").length} icon="📦" />
          <Mini label="Delivery" value={notifications.filter((n) => typeOf(n) === "delivery").length} icon="🥛" />
          <Mini label="Payments" value={notifications.filter((n) => typeOf(n) === "payment").length} icon="💳" />
          <Mini label="Promotions" value={notifications.filter((n) => typeOf(n) === "promotion").length} icon="🎁" />
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, icon, valueClass = "text-slate-900" }) {
  return <div className="rounded-2xl border bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5"><div className="flex justify-between"><span>{icon}</span><span className={`text-2xl font-black sm:text-3xl ${valueClass}`}>{value}</span></div><p className="mt-2 text-xs font-bold text-slate-500">{label}</p></div>;
}

function Mini({ label, value, icon }) {
  return <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex justify-between"><span>{icon}</span><b className="text-xl">{value}</b></div><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>;
}

function Filter({ label, value, setValue, options, labels }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-500">{label}</label>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-500">
        {options.map((item) => {
          const labelText = labels ? labels.find((x) => x.value === item)?.label : item;
          return <option key={item} value={item}>{item === "all" ? "All" : (labelText || item).replace(/^./, (c) => c.toUpperCase())}</option>;
        })}
      </select>
    </div>
  );
}
