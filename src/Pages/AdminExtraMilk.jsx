import { useEffect, useMemo, useState } from "react";
import {
  getExtraMilkRequests,
  approveExtraMilk,
  rejectExtraMilk,
} from "../config/api";
import ExtraMilkTable from "../Components/admin/ExtraMilkTable";
import ExtraMilkDrawer from "../Components/admin/ExtraMilkDrawer";
export default function AdminExtraMilk() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
const [selectedRequest, setSelectedRequest] = useState(null);
function handleView(request) {
  setSelectedRequest(request);
  setDrawerOpen(true);
}

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

  async function handleApprove(id) {
    if (!window.confirm("Approve this request?")) return;

    await approveExtraMilk(id);
alert("Request Approved");
    loadRequests();
  }

  async function handleReject(id) {
    if (!window.confirm("Reject this request?")) return;

    await rejectExtraMilk(id);

    loadRequests();
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchStatus =
        status === "All" || r.status === status;

      const keyword = search.toLowerCase();

      const matchSearch =
        r.customers?.full_name
          ?.toLowerCase()
          .includes(keyword) ||
        r.customers?.phone?.includes(search) ||
        r.products?.name
          ?.toLowerCase()
          .includes(keyword);

      return matchStatus && matchSearch;
    });
  }, [requests, search, status]);
  




  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">
        Extra Milk Requests
      </h1>

      <div className="flex gap-4 mb-6">

        <input
          className="border rounded-lg px-4 py-2 flex-1"
          placeholder="Search customer / phone / product"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          className="border rounded-lg px-4 py-2"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          <option>All</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Cancelled</option>
        </select>

      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border">

          <thead className="bg-green-700 text-white">

            <tr>
              <th className="p-3">Customer</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Size</th>
              <th>Dates</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            {filtered.map((r) => (

              <tr
                key={r.id}
                className="border-b"
              >
                <td className="p-3">
                  <div className="font-semibold">
                    {r.customers?.full_name}
                  </div>

                  <div className="text-gray-500 text-sm">
                    {r.customers?.phone}
                  </div>
                </td>

                <td>{r.products?.name}</td>

                <td>{r.quantity}</td>

                <td>{r.size}</td>

                <td>
                  {r.from_date}
                  <br />
                  {r.to_date}
                </td>

                <td>{r.status}</td>

                <td className="space-x-2">

                  {r.status === "Pending" && (
                    <>
                      <button
                       onClick={() => handleApprove(r.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          handleReject(r.id)
                        }
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                    </>
                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>
      )}
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