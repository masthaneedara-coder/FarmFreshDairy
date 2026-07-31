export default function DeliveryBoyTable({
  deliveryBoys = [],
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-green-600 text-white">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Phone</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Vehicle</th>
            <th className="p-3 text-center">Status</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {deliveryBoys.map((boy) => (
            <tr key={boy.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{boy.full_name}</td>

              <td className="p-3">{boy.phone}</td>

              <td className="p-3">{boy.email}</td>

              <td className="p-3">{boy.vehicle_number}</td>

              <td className="p-3 text-center">
                <button
                  onClick={() =>
                    onToggleStatus(
                      boy.id,
                      !boy.is_active
                    )
                  }
                  className={`px-3 py-1 rounded-full text-white ${
                    boy.is_active
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {boy.is_active ? "Active" : "Inactive"}
                </button>
              </td>

              <td className="p-3">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onEdit(boy)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(boy.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}