import {
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

import StatusBadge from "./StatusBadge";

export default function ExtraMilkTable({
  requests,
  onView,
  onApprove,
  onReject,
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">

      <table className="w-full">

        <thead className="bg-green-700 text-white">

          <tr>

            <th className="p-4 text-left">
              Customer
            </th>

            <th>Product</th>

            <th>Qty</th>

            <th>Size</th>

            <th>Dates</th>

            <th>Status</th>

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>

          {requests.map((r) => (

            <tr
              key={r.id}
              className="border-b hover:bg-gray-50"
            >

              <td className="p-4">

                <div className="font-semibold">
                  {r.customers?.full_name}
                </div>

                <div className="text-sm text-gray-500">
                  {r.customers?.phone}
                </div>

              </td>

              <td>{r.products?.name}</td>

              <td>{r.quantity}</td>

              <td>{r.size}</td>

              <td>

                <div>{r.from_date}</div>

                <div>{r.to_date}</div>

              </td>

              <td>

                <StatusBadge
                  status={r.status}
                />

              </td>

              <td>

                <div className="flex gap-2 justify-center">

                  <button
                    onClick={() => onView(r)}
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg"
                  >
                    <Eye size={18} />
                  </button>

                  {r.status === "Pending" && (
                    <>
                      <button
                        onClick={() =>
                          onApprove(r.id)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
                      >
                        <CheckCircle size={18} />
                      </button>

                      <button
                        onClick={() =>
                          onReject(r.id)
                        }
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                      >
                        <XCircle size={18} />
                      </button>
                    </>
                  )}

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}