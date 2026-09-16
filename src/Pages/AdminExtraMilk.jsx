import { useEffect, useMemo, useState } from "react";

import {
  getExtraMilkRequests,
  approveExtraMilk,
  rejectExtraMilk,
} from "../config/api";

import ExtraMilkDrawer from "../Components/admin/ExtraMilkDrawer";

export default function AdminExtraMilk() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // ==========================================
  // Load Requests
  // ==========================================

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);

      const res = await getExtraMilkRequests();

      setRequests(res.requests || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // View
  // ==========================================

  function handleView(request) {
    setSelectedRequest(request);
    setDrawerOpen(true);
  }

  // ==========================================
  // Approve
  // ==========================================

  async function handleApprove(id) {
    if (!window.confirm("Approve this request?")) return;

    try {
      await approveExtraMilk(id);

      alert("Request Approved");

      await loadRequests();

      setDrawerOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to approve request.");
    }
  }

  // ==========================================
  // Reject
  // ==========================================

  async function handleReject(id) {
    if (!window.confirm("Reject this request?")) return;

    try {
      await rejectExtraMilk(id);

      alert("Request Rejected");

      await loadRequests();

      setDrawerOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to reject request.");
    }
  }

  // ==========================================
  // Search + Filter
  // ==========================================

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((r) => {
      const matchStatus =
        status === "All" || r.status === status;

      const customerName =
        r.customers?.full_name?.toLowerCase() || "";

      const phone =
        String(r.customers?.phone || "");

      const productName =
        r.products?.name?.toLowerCase() || "";

      const matchSearch =
        !keyword ||
        customerName.includes(keyword) ||
        phone.includes(search.trim()) ||
        productName.includes(keyword);

      return matchStatus && matchSearch;
    });
  }, [requests, search, status]);

  // ==========================================
  // Status Styling
  // ==========================================

  function getStatusStyle(value) {
    switch (value) {
      case "Approved":
        return {
          badge:
            "bg-green-100 text-green-700 border-green-200",
          dot: "bg-green-500",
        };

      case "Pending":
        return {
          badge:
            "bg-orange-100 text-orange-700 border-orange-200",
          dot: "bg-orange-500",
        };

      case "Rejected":
        return {
          badge:
            "bg-red-100 text-red-700 border-red-200",
          dot: "bg-red-500",
        };

      case "Cancelled":
        return {
          badge:
            "bg-gray-100 text-gray-600 border-gray-200",
          dot: "bg-gray-400",
        };

      default:
        return {
          badge:
            "bg-gray-100 text-gray-600 border-gray-200",
          dot: "bg-gray-400",
        };
    }
  }

  // ==========================================
  // Date Formatting
  // ==========================================

  function formatDate(date) {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">

          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded-lg mb-6" />

            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <div className="h-12 bg-gray-200 rounded-2xl mb-4" />

              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-24 bg-gray-100 rounded-2xl"
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6">

      {/* ==========================================
          Animation Styles
      ========================================== */}

      <style>{`
        @keyframes adminCardIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes adminHeaderIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .admin-card-animation {
          animation: adminCardIn 0.45s ease-out both;
        }

        .admin-header-animation {
          animation: adminHeaderIn 0.4s ease-out both;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="admin-header-animation mb-5 sm:mb-7">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl">
                  🥛
                </span>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                  Extra Milk Requests
                </h1>
              </div>

              <p className="text-sm sm:text-base text-gray-500 mt-2">
                Manage customer extra milk requests
              </p>
            </div>

            <div className="self-start sm:self-auto bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
              {filtered.length} Request
              {filtered.length === 1 ? "" : "s"}
            </div>

          </div>
        </div>

        {/* ==========================================
            FILTER PANEL
        ========================================== */}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-5">

          <div className="flex flex-col sm:flex-row gap-3">

            {/* Search */}

            <div className="relative flex-1">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                🔎
              </span>

              <input
                className="w-full border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm sm:text-base outline-none transition-all focus:border-green-500 focus:ring-4 focus:ring-green-100"
                placeholder="Search customer / phone / product"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            {/* Status */}

            <select
              className="w-full sm:w-48 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm sm:text-base bg-white outline-none transition-all focus:border-green-500 focus:ring-4 focus:ring-green-100"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>

          </div>

        </div>

        {/* ==========================================
            EMPTY STATE
        ========================================== */}

        {filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 sm:p-14 text-center">

            <div className="text-5xl mb-4">
              📭
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-800">
              No Requests Found
            </h2>

            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Try changing your search or status filter.
            </p>

          </div>
        )}

        {/* ==========================================
            MOBILE CARDS
        ========================================== */}

        <div className="md:hidden space-y-4">

          {filtered.map((r, index) => {
            const statusStyle =
              getStatusStyle(r.status);

            return (
              <div
                key={r.id}
                className="admin-card-animation bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 active:scale-[0.99]"
                style={{
                  animationDelay: `${index * 60}ms`,
                }}
              >

                {/* Card Header */}

                <div className="p-4 border-b border-gray-100">

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3 min-w-0">

                      <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
                        👤
                      </div>

                      <div className="min-w-0">

                        <h2 className="font-black text-gray-900 truncate">
                          {r.customers?.full_name || "-"}
                        </h2>

                        <p className="text-sm text-gray-500 mt-0.5">
                          📞 {r.customers?.phone || "-"}
                        </p>

                      </div>

                    </div>

                    {/* Status */}

                    <span
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold ${statusStyle.badge}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${statusStyle.dot}`}
                      />

                      {r.status}
                    </span>

                  </div>

                </div>

                {/* Product */}

                <div className="p-4">

                  <div className="bg-green-50 rounded-2xl border border-green-100 p-4">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm">
                        🥛
                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="text-xs uppercase tracking-wide text-gray-500 font-bold">
                          Product
                        </p>

                        <p className="font-black text-gray-900 mt-1 truncate">
                          {r.products?.name || "-"}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Details */}

                  <div className="grid grid-cols-2 gap-3 mt-3">

                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">

                      <p className="text-xs text-gray-500 font-semibold">
                        Quantity
                      </p>

                      <p className="font-black text-gray-900 mt-1">
                        {r.quantity || 0}
                      </p>

                    </div>

                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">

                      <p className="text-xs text-gray-500 font-semibold">
                        Size
                      </p>

                      <p className="font-black text-gray-900 mt-1">
                        {r.size || "-"}
                      </p>

                    </div>

                  </div>

                  {/* Dates */}

                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">

                    <div className="flex items-center justify-between gap-3">

                      <div>
                        <p className="text-xs text-gray-500 font-semibold">
                          From
                        </p>

                        <p className="font-bold text-gray-900 mt-1">
                          {formatDate(r.from_date)}
                        </p>
                      </div>

                      <div className="text-gray-400">
                        →
                      </div>

                      <div className="text-right">

                        <p className="text-xs text-gray-500 font-semibold">
                          To
                        </p>

                        <p className="font-bold text-gray-900 mt-1">
                          {formatDate(r.to_date)}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

                {/* Actions */}

                <div className="p-4 bg-gray-50 border-t border-gray-100">

                  <div className="grid grid-cols-2 gap-2">

                    <button
                      type="button"
                      onClick={() => handleView(r)}
                      className="py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold transition-all duration-200 hover:border-green-400 hover:text-green-700 active:scale-95"
                    >
                      👁️ View
                    </button>

                    {r.status === "Pending" ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleApprove(r.id)
                        }
                        className="py-3 rounded-xl bg-green-600 text-white font-bold shadow-sm transition-all duration-200 hover:bg-green-700 active:scale-95"
                      >
                        ✓ Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleView(r)}
                        className="py-3 rounded-xl bg-gray-900 text-white font-bold transition-all duration-200 hover:bg-gray-800 active:scale-95"
                      >
                        Details
                      </button>
                    )}

                  </div>

                  {r.status === "Pending" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleReject(r.id)
                      }
                      className="w-full mt-2 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold transition-all duration-200 hover:bg-red-100 active:scale-95"
                    >
                      ✕ Reject Request
                    </button>
                  )}

                </div>

              </div>
            );
          })}

        </div>

        {/* ==========================================
            DESKTOP TABLE
        ========================================== */}

        <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-green-700 text-white">

                <tr>

                  <th className="px-5 py-4 text-left text-sm font-black">
                    Customer
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-black">
                    Product
                  </th>

                  <th className="px-4 py-4 text-center text-sm font-black">
                    Qty
                  </th>

                  <th className="px-4 py-4 text-center text-sm font-black">
                    Size
                  </th>

                  <th className="px-4 py-4 text-left text-sm font-black">
                    Dates
                  </th>

                  <th className="px-4 py-4 text-center text-sm font-black">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-black">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filtered.map((r, index) => {
                  const statusStyle =
                    getStatusStyle(r.status);

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 transition-colors duration-200 hover:bg-green-50/50"
                      style={{
                        animation: "adminCardIn 0.4s ease-out both",
                        animationDelay: `${index * 40}ms`,
                      }}
                    >

                      {/* Customer */}

                      <td className="px-5 py-4">

                        <div className="font-black text-gray-900">
                          {r.customers?.full_name || "-"}
                        </div>

                        <div className="text-gray-500 text-sm mt-1">
                          {r.customers?.phone || "-"}
                        </div>

                      </td>

                      {/* Product */}

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            🥛
                          </span>

                          <span className="font-semibold">
                            {r.products?.name || "-"}
                          </span>
                        </div>

                      </td>

                      {/* Quantity */}

                      <td className="px-4 py-4 text-center font-bold">
                        {r.quantity || 0}
                      </td>

                      {/* Size */}

                      <td className="px-4 py-4 text-center font-bold">
                        {r.size || "-"}
                      </td>

                      {/* Dates */}

                      <td className="px-4 py-4">

                        <div className="text-sm">
                          <span className="text-gray-500">
                            From:
                          </span>{" "}
                          <span className="font-semibold">
                            {formatDate(r.from_date)}
                          </span>
                        </div>

                        <div className="text-sm mt-1">
                          <span className="text-gray-500">
                            To:
                          </span>{" "}
                          <span className="font-semibold">
                            {formatDate(r.to_date)}
                          </span>
                        </div>

                      </td>

                      {/* Status */}

                      <td className="px-4 py-4 text-center">

                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusStyle.badge}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${statusStyle.dot}`}
                          />

                          {r.status}
                        </span>

                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">

                        <div className="flex items-center justify-center gap-2">

                          <button
                            type="button"
                            onClick={() => handleView(r)}
                            className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm transition-all duration-200 hover:bg-gray-200 active:scale-95"
                          >
                            View
                          </button>

                          {r.status === "Pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleApprove(r.id)
                                }
                                className="px-3 py-2 rounded-xl bg-green-600 text-white font-bold text-sm transition-all duration-200 hover:bg-green-700 active:scale-95"
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleReject(r.id)
                                }
                                className="px-3 py-2 rounded-xl bg-red-600 text-white font-bold text-sm transition-all duration-200 hover:bg-red-700 active:scale-95"
                              >
                                Reject
                              </button>
                            </>
                          )}

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ==========================================
          DRAWER
      ========================================== */}

      <ExtraMilkDrawer
        open={drawerOpen}
        request={selectedRequest}
        onClose={() => setDrawerOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

    </div>
  );
}