import {
  CalendarDays,
  Clock3,
  Milk,
  MessageSquare,
  XCircle,
} from "lucide-react";

export default function ExtraMilkHistory({
  requests = [],
  onCancel,
}) {

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center mt-8">
        <Milk
          size={60}
          className="mx-auto text-green-600 mb-4"
        />

        <h2 className="text-xl font-semibold">
          No Extra Milk Requests
        </h2>

        <p className="text-gray-500 mt-2">
          Your submitted requests will appear here.
        </p>
      </div>
    );
  }

  const badgeColor = (status) => {

    switch (status) {

      case "Approved":
        return "bg-green-100 text-green-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      case "Completed":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }

  };

  const calculateDays = (from, to) => {

    const diff =
      (new Date(to) - new Date(from)) /
      (1000 * 60 * 60 * 24);

    return diff + 1;

  };

  return (

    <div className="mt-8">

      <h2 className="text-2xl font-bold mb-5">

        My Extra Milk Requests

      </h2>

      <div className="grid gap-5">

        {requests.map((item) => (

          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-lg border p-6"
          >

            <div className="flex justify-between items-start">

              <div>

                <div className="flex items-center gap-2">

                  <Milk
                    className="text-green-700"
                    size={22}
                  />

                  <h3 className="font-bold text-lg">

                    {item.products?.name}

                  </h3>

                </div>

                <p className="text-gray-600 mt-2">

                  {item.quantity} × {item.size}

                </p>

              </div>

              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor(item.status)}`}
              >

                {item.status}

              </span>

            </div>

            {/* Date */}

            <div className="grid md:grid-cols-3 gap-5 mt-6">

              <div className="flex items-center gap-2">

                <CalendarDays size={18} />

                <div>

                  <p className="text-sm text-gray-500">
                    From
                  </p>

                  <p className="font-medium">

                    {item.from_date}

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                <CalendarDays size={18} />

                <div>

                  <p className="text-sm text-gray-500">
                    To
                  </p>

                  <p className="font-medium">

                    {item.to_date}

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                <Clock3 size={18} />

                <div>

                  <p className="text-sm text-gray-500">
                    Duration
                  </p>

                  <p className="font-medium">

                    {calculateDays(
                      item.from_date,
                      item.to_date
                    )} Days

                  </p>

                </div>

              </div>

            </div>

            {/* Estimated */}

            <div className="mt-5 p-4 bg-green-50 rounded-xl">

              <p className="font-semibold">

                Estimated Amount

              </p>

              <p className="text-green-700 text-lg font-bold">

                ₹ {item.estimated_amount || 0}

              </p>

            </div>

            {/* Remarks */}

            {item.remarks && (

              <div className="mt-5 flex gap-3">

                <MessageSquare
                  className="text-gray-500 mt-1"
                  size={18}
                />

                <div>

                  <p className="text-sm text-gray-500">

                    Remarks

                  </p>

                  <p>

                    {item.remarks}

                  </p>

                </div>

              </div>

            )}

            {/* Cancel */}

            {item.status === "Pending" && (

              <div className="mt-6">

                <button
                  onClick={() =>
                    onCancel(item.id)
                  }
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
                >

                  <XCircle size={18} />

                  Cancel Request

                </button>

              </div>

            )}

          </div>

        ))}

      </div>

    </div>

  );

}