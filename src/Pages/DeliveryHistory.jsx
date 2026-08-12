import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getDeliveryBoyHistory,
} from "../config/deliveryBoyApi";

import {
  Search,
  CalendarDays,
  PackageCheck,
  User,
  Phone,
  MapPin,
  Milk,
  IndianRupee,
} from "lucide-react";




export default function DeliveryHistory() {

  const [history, setHistory] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState("");


  // ======================================
  // Get Logged-in Delivery Boy
  // ======================================
  const deliveryBoy =
    JSON.parse(
      localStorage.getItem(
        "deliveryBoy"
      ) || "null"
    );


  // ======================================
  // Load History
  // ======================================
  useEffect(() => {

    loadHistory();

  }, []);


  async function loadHistory() {

    try {

      if (!deliveryBoy?.id) {
        console.error(
          "Delivery Boy ID not found"
        );

        return;
      }

      setLoading(true);

      const data =
        await getDeliveryBoyHistory(
          deliveryBoy.id
        );

      setHistory(data);

    } catch (error) {

      console.error(
        "History Error:",
        error
      );

    } finally {

      setLoading(false);

    }
  }


  // ======================================
  // Filter History
  // ======================================
  const filteredHistory =
    useMemo(() => {

      return history.filter(
        (delivery) => {

          const customerName =
            delivery.customer
              ?.full_name
              ?.toLowerCase() || "";

          const phone =
            delivery.customer
              ?.phone
              ?.toString() || "";

          const number =
            delivery.number
              ?.toLowerCase() || "";

          const matchesSearch =
            !search ||
            customerName.includes(
              search.toLowerCase()
            ) ||
            phone.includes(search) ||
            number.includes(
              search.toLowerCase()
            );

          const deliveryDate =
            delivery.date
              ? new Date(
                  delivery.date
                )
                  .toISOString()
                  .split("T")[0]
              : "";

          const matchesDate =
            !dateFilter ||
            deliveryDate === dateFilter;

          return (
            matchesSearch &&
            matchesDate
          );
        }
      );

    }, [
      history,
      search,
      dateFilter,
    ]);


  // ======================================
  // Format Date
  // ======================================
  function formatDate(date) {

    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }


  // ======================================
  // Format Time
  // ======================================
  function formatTime(date) {

    if (!date) return "";

    return new Date(
      date
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }


  // ======================================
  // Loading
  // ======================================
  if (loading) {

    return (
      <div className="max-w-6xl mx-auto p-6">

        <div className="text-center py-20">

          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4" />

          <p className="text-gray-500">
            Loading delivery history...
          </p>

        </div>

      </div>
    );
  }


  return (

    <div className="max-w-6xl mx-auto p-6">

      {/* ==================================
          Header
      ================================== */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold text-gray-900">
          Delivery History
        </h1>

        <p className="text-gray-500 mt-1">
          View your completed deliveries
        </p>

      </div>


      {/* ==================================
          Filters
      ================================== */}

      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Search */}

          <div className="relative">

            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search customer, phone or delivery number..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>


          {/* Date */}

          <div className="relative">

            <CalendarDays
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(
                  e.target.value
                )
              }
              className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />

          </div>

        </div>

      </div>


      {/* ==================================
          Count
      ================================== */}

      <div className="mb-4 text-sm text-gray-500">

        Showing{" "}
        <span className="font-semibold text-gray-800">
          {filteredHistory.length}
        </span>{" "}
        deliveries

      </div>


      {/* ==================================
          Empty
      ================================== */}

      {filteredHistory.length === 0 ? (

        <div className="bg-white border rounded-2xl p-12 text-center">

          <PackageCheck
            size={48}
            className="mx-auto text-gray-300 mb-4"
          />

          <h2 className="text-xl font-semibold">
            No delivery history
          </h2>

          <p className="text-gray-500 mt-2">
            Completed deliveries will appear here.
          </p>

        </div>

      ) : (

        /* ==================================
           History List
        ================================== */

        <div className="space-y-5">

          {filteredHistory.map(
            (delivery) => (

              <div
                key={`${delivery.type}-${delivery.id}`}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden"
              >

                {/* Header */}

                <div className="p-5 border-b bg-gray-50">

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                    <div>

                      <div className="flex items-center gap-2">

                        <PackageCheck
                          size={20}
                          className="text-green-600"
                        />

                        <h2 className="font-bold text-lg">
                          {delivery.number}
                        </h2>

                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">

                        <span>
                          {formatDate(
                            delivery.date
                          )}
                        </span>

                        <span>•</span>

                        <span>
                          {formatTime(
                            delivery.date
                          )}
                        </span>

                      </div>

                    </div>


                    <div className="flex items-center gap-3">

                      <span
                        className="
                          px-4 py-2
                          rounded-full
                          bg-green-100
                          text-green-700
                          text-sm
                          font-semibold
                        "
                      >
                        ✓ Delivered
                      </span>

                      <span
                        className="
                          px-4 py-2
                          rounded-full
                          bg-blue-100
                          text-blue-700
                          text-sm
                          font-semibold
                        "
                      >
                        {delivery.type}
                      </span>

                    </div>

                  </div>

                </div>


                {/* Customer */}

                <div className="p-5">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Customer */}

                    <div>

                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">

                        <User size={17} />

                        Customer

                      </div>

                      <p className="font-semibold text-gray-900">

                        {
                          delivery.customer
                            ?.full_name ||
                          "-"
                        }

                      </p>

                      <a
                        href={`tel:${delivery.customer?.phone}`}
                        className="flex items-center gap-2 text-green-600 text-sm mt-1"
                      >

                        <Phone size={15} />

                        {
                          delivery.customer?.phone ||
                          "-"
                        }

                      </a>

                    </div>


                    {/* Address */}

                    <div>

                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">

                        <MapPin size={17} />

                        Delivery Address

                      </div>

                      <p className="text-sm text-gray-700">

                        {
                          delivery.address
                            ?.house_no
                        }

                        {delivery.address
                          ?.street && (
                          <>
                            ,{" "}
                            {
                              delivery.address
                                .street
                            }
                          </>
                        )}

                        {delivery.address
                          ?.area && (
                          <>
                            ,{" "}
                            {
                              delivery.address
                                .area
                            }
                          </>
                        )}

                        {delivery.address
                          ?.city && (
                          <>
                            ,{" "}
                            {
                              delivery.address
                                .city
                            }
                          </>
                        )}

                        {delivery.address
                          ?.pincode && (
                          <>
                            {" "}
                            -{" "}
                            {
                              delivery.address
                                .pincode
                            }
                          </>
                        )}

                      </p>

                    </div>

                  </div>


                  {/* ==================================
                      Items
                  ================================== */}

                  <div className="mt-5">

                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">

                      <Milk size={17} />

                      Delivered Items

                    </div>


                    <div className="space-y-2">

                      {(
                        delivery.items ||
                        []
                      ).map(
                        (item) => (

                          <div
                            key={item.id}
                            className="
                              flex
                              items-center
                              justify-between
                              border
                              rounded-xl
                              p-3
                            "
                          >

                            <div className="flex items-center gap-3">

                              {item.products
                                ?.image && (

                                <img
                                  src={
                                    item
                                      .products
                                      .image
                                  }
                                  alt={
                                    item
                                      .products
                                      ?.name
                                  }
                                  className="w-12 h-12 rounded-lg object-cover"
                                />

                              )}

                              <div>

                                <p className="font-semibold">

                                  {
                                    item
                                      .products
                                      ?.name ||
                                    "-"
                                  }

                                </p>

                                <p className="text-sm text-gray-500">

                                  {item.quantity} ×{" "}
                                  {item.size}

                                  {item.is_extra && (
                                    <span className="ml-2 text-orange-600 font-semibold">
                                      Extra
                                    </span>
                                  )}

                                </p>

                              </div>

                            </div>


                            <div className="font-semibold text-green-600">

                              ₹
                              {Number(
                                item.total_price ||
                                0
                              ).toFixed(0)}

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </div>


                  {/* ==================================
                      Total
                  ================================== */}

                  <div className="mt-5 bg-green-50 rounded-xl p-4 flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500">
                        Total Amount
                      </p>

                      <p className="text-xl font-bold text-green-700">

                        ₹
                        {Number(
                          delivery.total_amount ||
                          0
                        ).toFixed(0)}

                      </p>

                    </div>


                    <div className="text-right">

                      <p className="text-sm text-gray-500">
                        Payment
                      </p>

                      <p className="font-semibold">

                        {
                          delivery.payment_method ||
                          "Monthly Billing"
                        }

                      </p>

                    </div>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );
}