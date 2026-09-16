export default function OrdersCards({
  orders,
  onView,
  onAssign,
  onStatusChange,
  onReceivePayment,
}) {
  if (!orders.length) {
    return (
      <div className="
        bg-white
        rounded-3xl
        border
        border-gray-100
        shadow-sm
        px-6
        py-14
        text-center
        animate-fade-in
      ">

        <div className="text-6xl mb-4">
          📦
        </div>

        <h2 className="
          text-xl
          font-black
          text-gray-800
        ">
          No Orders Found
        </h2>

        <p className="
          text-sm
          text-gray-500
          mt-2
        ">
          Try changing your search or status filter.
        </p>

      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes orderCardIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .order-card-animation {
          animation:
            orderCardIn
            .45s
            ease-out
            both;
        }

        .animate-fade-in {
          animation:
            fadeIn
            .35s
            ease-out
            both;
        }
      `}</style>

      <div className="space-y-4">

        {orders.map((order, index) => {

          const isPaid =
            order.payment_status === "Paid";

          const deliveryBoy =
            order.delivery_boys;

          return (
            <div
              key={order.id}
              className="
                order-card-animation
                bg-white
                rounded-3xl
                border
                border-gray-100
                shadow-sm
                overflow-hidden
                transition-all
                duration-300
                hover:shadow-xl
                hover:-translate-y-0.5
                active:scale-[0.99]
              "
              style={{
                animationDelay:
                  `${index * 60}ms`,
              }}
            >

              {/* ==================================
                  HEADER
              ================================== */}

              <div className="
                p-4
                sm:p-5
                border-b
                border-gray-100
                bg-gradient-to-r
                from-green-50
                to-white
              ">

                <div className="
                  flex
                  items-start
                  justify-between
                  gap-3
                ">

                  {/* Order Number */}

                  <div className="
                    flex
                    items-center
                    gap-3
                    min-w-0
                  ">

                    <div className="
                      w-11
                      h-11
                      rounded-2xl
                      bg-green-100
                      flex
                      items-center
                      justify-center
                      text-xl
                      flex-shrink-0
                    ">
                      🛍️
                    </div>

                    <div className="min-w-0">

                      <p className="
                        text-[11px]
                        uppercase
                        tracking-wider
                        font-black
                        text-gray-400
                      ">
                        Order
                      </p>

                      <h2 className="
                        text-lg
                        sm:text-xl
                        font-black
                        text-gray-900
                        truncate
                      ">
                        {order.order_number}
                      </h2>

                    </div>

                  </div>

                  {/* Amount */}

                  <div className="
                    text-right
                    flex-shrink-0
                  ">

                    <p className="
                      text-[11px]
                      uppercase
                      tracking-wider
                      font-black
                      text-gray-400
                    ">
                      Total
                    </p>

                    <p className="
                      text-xl
                      sm:text-2xl
                      font-black
                      text-green-700
                      mt-0.5
                    ">
                      ₹
                      {Number(
                        order.total_amount || 0
                      ).toLocaleString("en-IN")}
                    </p>

                  </div>

                </div>

              </div>

              {/* ==================================
                  CUSTOMER
              ================================== */}

              <div className="p-4 sm:p-5">

                <div className="
                  flex
                  items-center
                  gap-3
                  mb-4
                ">

                  <div className="
                    w-10
                    h-10
                    rounded-xl
                    bg-blue-50
                    flex
                    items-center
                    justify-center
                    text-lg
                    flex-shrink-0
                  ">
                    👤
                  </div>

                  <div className="min-w-0">

                    <p className="
                      text-xs
                      text-gray-400
                      font-bold
                      uppercase
                      tracking-wide
                    ">
                      Customer
                    </p>

                    <p className="
                      font-black
                      text-gray-900
                      truncate
                    ">
                      {order.customer_name || "-"}
                    </p>

                    <p className="
                      text-sm
                      text-gray-500
                      mt-0.5
                    ">
                      📞 {order.phone || "-"}
                    </p>

                  </div>

                </div>

                {/* ==================================
                    INFORMATION GRID
                ================================== */}

                <div className="
                  grid
                  grid-cols-2
                  gap-3
                ">

                  {/* Date */}

                  <InfoBox
                    icon="📅"
                    label="Order Date"
                    value={
                      order.order_date || "-"
                    }
                  />

                  {/* Payment */}

                  <InfoBox
                    icon="💳"
                    label="Payment"
                    value={
                      <PaymentBadge
                        status={
                          order.payment_status
                        }
                      />
                    }
                  />

                  {/* Status */}

                  <InfoBox
                    icon="📦"
                    label="Status"
                    value={
                      <StatusBadge
                        status={order.status}
                      />
                    }
                  />

                  {/* Delivery Boy */}

                  <InfoBox
                    icon="🚚"
                    label="Delivery"
                    value={
                      deliveryBoy
                        ? deliveryBoy.full_name
                        : "Not Assigned"
                    }
                  />

                </div>

                {/* ==================================
                    DELIVERY BOY DETAIL
                ================================== */}

                {deliveryBoy && (
                  <div className="
                    mt-3
                    rounded-2xl
                    bg-blue-50
                    border
                    border-blue-100
                    p-3
                  ">

                    <div className="
                      flex
                      items-center
                      gap-3
                    ">

                      <div className="
                        w-10
                        h-10
                        rounded-xl
                        bg-white
                        flex
                        items-center
                        justify-center
                        text-lg
                        shadow-sm
                      ">
                        🚚
                      </div>

                      <div className="min-w-0">

                        <p className="
                          text-[11px]
                          uppercase
                          tracking-wide
                          font-black
                          text-blue-500
                        ">
                          Delivery Boy
                        </p>

                        <p className="
                          font-black
                          text-gray-900
                          truncate
                        ">
                          {deliveryBoy.full_name}
                        </p>

                        {deliveryBoy.phone && (
                          <p className="
                            text-xs
                            text-gray-500
                            mt-0.5
                          ">
                            📞 {deliveryBoy.phone}
                          </p>
                        )}

                      </div>

                    </div>

                  </div>
                )}

                {/* ==================================
                    NOT ASSIGNED
                ================================== */}

                {!deliveryBoy && (
                  <div className="
                    mt-3
                    rounded-2xl
                    bg-amber-50
                    border
                    border-amber-100
                    p-3
                  ">

                    <div className="
                      flex
                      items-center
                      gap-3
                    ">

                      <div className="
                        w-10
                        h-10
                        rounded-xl
                        bg-white
                        flex
                        items-center
                        justify-center
                        text-lg
                      ">
                        ⚠️
                      </div>

                      <div>

                        <p className="
                          text-[11px]
                          uppercase
                          tracking-wide
                          font-black
                          text-amber-600
                        ">
                          Delivery
                        </p>

                        <p className="
                          font-bold
                          text-amber-800
                        ">
                          Delivery boy not assigned
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              </div>

              {/* ==================================
                  ACTIONS
              ================================== */}

              <div className="
                p-4
                sm:p-5
                bg-gray-50
                border-t
                border-gray-100
              ">

                <div className="
                  grid
                  grid-cols-2
                  gap-2
                ">

                  {/* VIEW */}

                  <button
                    type="button"
                    onClick={() =>
                      onView(order)
                    }
                    className="
                      py-3
                      rounded-xl
                      bg-blue-600
                      hover:bg-blue-700
                      active:scale-95
                      text-white
                      font-black
                      text-sm
                      transition-all
                      duration-200
                    "
                  >
                    👁 View
                  </button>

                  {/* ASSIGN */}

                  <button
                    type="button"
                    onClick={() =>
                      onAssign(order)
                    }
                    className="
                      py-3
                      rounded-xl
                      bg-green-600
                      hover:bg-green-700
                      active:scale-95
                      text-white
                      font-black
                      text-sm
                      transition-all
                      duration-200
                    "
                  >
                    🚚 Assign
                  </button>

                </div>

                {/* RECEIVE PAYMENT */}

                {!isPaid && (
                  <button
                    type="button"
                    onClick={() =>
                      onReceivePayment(order)
                    }
                    className="
                      w-full
                      mt-2
                      py-3
                      rounded-xl
                      bg-amber-500
                      hover:bg-amber-600
                      active:scale-95
                      text-white
                      font-black
                      text-sm
                      transition-all
                      duration-200
                    "
                  >
                    💰 Receive Payment
                  </button>
                )}

                {/* PAID */}

                {isPaid && (
                  <div className="
                    w-full
                    mt-2
                    py-3
                    rounded-xl
                    bg-green-100
                    text-green-700
                    text-center
                    font-black
                    text-sm
                  ">
                    ✓ Payment Completed
                  </div>
                )}

              </div>

            </div>
          );
        })}

      </div>
    </>
  );
}


// ==================================================
// INFO BOX
// ==================================================

function InfoBox({
  icon,
  label,
  value,
}) {
  return (
    <div className="
      rounded-2xl
      bg-gray-50
      border
      border-gray-100
      p-3
      min-w-0
    ">

      <div className="
        flex
        items-center
        gap-2
      ">

        <span className="text-base">
          {icon}
        </span>

        <p className="
          text-[11px]
          uppercase
          tracking-wide
          text-gray-400
          font-black
        ">
          {label}
        </p>

      </div>

      <div className="
        mt-1.5
        text-sm
        font-bold
        text-gray-800
        truncate
      ">
        {value}
      </div>

    </div>
  );
}


// ==================================================
// PAYMENT BADGE
// ==================================================

function PaymentBadge({
  status,
}) {
  const paid =
    status === "Paid";

  return (
    <span className={`
      inline-flex
      items-center
      gap-1
      px-2.5
      py-1
      rounded-full
      text-[11px]
      font-black
      ${
        paid
          ? "bg-green-100 text-green-700"
          : "bg-amber-100 text-amber-700"
      }
    `}>
      {paid ? "✓" : "●"}

      {status || "Pending"}
    </span>
  );
}


// ==================================================
// STATUS BADGE
// ==================================================

function StatusBadge({
  status,
}) {
  const normalized =
    String(status || "")
      .toLowerCase();

  let classes =
    "bg-gray-100 text-gray-700";

  if (
    normalized === "delivered"
  ) {
    classes =
      "bg-green-100 text-green-700";
  }

  if (
    normalized === "pending"
  ) {
    classes =
      "bg-amber-100 text-amber-700";
  }

  if (
    normalized === "missed"
  ) {
    classes =
      "bg-red-100 text-red-700";
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    classes =
      "bg-red-100 text-red-700";
  }

  if (
    normalized === "assigned"
  ) {
    classes =
      "bg-blue-100 text-blue-700";
  }

  return (
    <span className={`
      inline-flex
      items-center
      gap-1
      px-2.5
      py-1
      rounded-full
      text-[11px]
      font-black
      whitespace-nowrap
      ${classes}
    `}>
      ● {status || "-"}
    </span>
  );
}