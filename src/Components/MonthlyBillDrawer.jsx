import { useEffect, useState } from "react";
import { getMonthlyBillDetails } from "../services/monthlyBillingService";
import { generateMonthlyBillPDF } from "../utils/monthlyBillPdf";
import { sendMonthlyBillWhatsApp } from "../utils/whatsappBill";
import {
  getMonthlyBillDetails,
  markMonthlyBillPaid,
  downloadMonthlyInvoice,
  printMonthlyInvoice,
  sendMonthlyInvoiceWhatsapp,
} from "../../config/api";

export default function MonthlyBillDrawer({
 open,
    bill,
    customer,
    subscription,
    deliveries,
    month,
    year,
    onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

 
  const handleDownload = async () => {
    await downloadMonthlyInvoice(details.bill.id);
};
const handlePrint = async () => {
    await printMonthlyInvoice(details.bill.id);
};
const handleWhatsapp = async () => {
    await sendMonthlyInvoiceWhatsapp(details.bill.id);
};
const handleMarkPaid = async () => {

    await markMonthlyBillPaid(details.bill.id);

    alert("Bill marked as paid.");

    onClose();

};

 if (!open || !bill) return null;

  return (
    <>
      {/* Overlay */}

      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}

      <div className="fixed right-0 top-0 w-full md:w-[520px] h-screen bg-white shadow-2xl z-50 overflow-y-auto">

        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">

          <h2 className="text-2xl font-bold">
            Monthly Bill
          </h2>

          <button
            onClick={onClose}
            className="text-3xl"
          >
            ×
          </button>

        </div>

        {loading ? (

          <div className="p-10 text-center">
            Loading...
          </div>

        ) : !details ? (

          <div className="p-10 text-center">
            No Data
          </div>

        ) : (

          <div className="p-5 space-y-6">

            {/* Customer */}

            <div className="bg-gray-50 rounded-xl p-5">

              <h3 className="font-bold text-lg mb-3">
                👤 Customer
              </h3>

              <p>
                <strong>Name :</strong>{" "}
                {customer.full_name}
              </p>

              <p>
                <strong>Phone :</strong>{" "}
                {details.customer.phone}
              </p>

              <p>
                <strong>Email :</strong>{" "}
                {details.customer.email}
              </p>

            </div>

            {/* Address */}

            <div className="bg-gray-50 rounded-xl p-5">

              <h3 className="font-bold text-lg mb-3">
                📍 Delivery Address
              </h3>

              {details.deliveries.length > 0 && (

                <>
                  <p>
                    {details.deliveries[0].addresses.house_no}
                  </p>

                  <p>
                    {details.deliveries[0].addresses.street}
                  </p>

                  <p>
                    {details.deliveries[0].addresses.area}
                  </p>

                  <p>
                    {details.deliveries[0].addresses.city}
                  </p>

                  <p>
                    {details.deliveries[0].addresses.pincode}
                  </p>
                </>

              )}

            </div>

            {/* Subscription */}

            <div className="bg-gray-50 rounded-xl p-5">

              <h3 className="font-bold text-lg mb-3">
                🥛 Subscription
              </h3>

              <p>
                <strong>Status :</strong>{" "}
                {details.subscription.status}
              </p>

              <p>
                <strong>Frequency :</strong>{" "}
                {details.subscription.frequency}
              </p>

              <p>
                <strong>Delivery Time :</strong>{" "}
                {details.subscription.delivery_time}
              </p>

            </div>

            {/* Delivery History */}

            <div className="bg-gray-50 rounded-xl p-5">

              <h3 className="font-bold text-lg mb-4">
                📅 Delivery History
              </h3>

              {details.deliveries.map((delivery) => (

                <div
                  key={delivery.id}
                  className="border rounded-xl p-4 mb-4 bg-white"
                >

                  <div className="flex justify-between">

                    <h4 className="font-bold">

                      {new Date(
                        delivery.delivery_date
                      ).toLocaleDateString()}

                    </h4>

                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        delivery.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {delivery.status}
                    </span>

                  </div>

                  <div className="mt-3 space-y-3">

                    {delivery.subscription_delivery_items.map(
                      (item) => (

                        <div
                          key={item.id}
                          className="flex gap-3"
                        >

                          <img
                            src={item.products.image}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover"
                          />

                          <div className="flex-1">

                            <h5 className="font-semibold">
                              {item.products.name}
                            </h5>

                            <p>
                              Size : {item.size}
                            </p>

                            <p>
                              Qty : {item.quantity}
                            </p>

                            <p className="font-bold text-green-700">
                              ₹{item.total_price}
                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </div>

              ))}

            </div>

            {/* Bill Summary */}

            <div className="bg-gray-50 rounded-xl p-5">

              <h3 className="font-bold text-lg mb-3">
                💰 Bill Summary
              </h3>

              <div className="flex justify-between">

                <span>Delivered Days</span>

                <span>
                  {details.bill.delivered_days}
                </span>

              </div>

              <div className="flex justify-between">

                <span>Missed Days</span>

                <span>
                  {details.bill.missed_days}
                </span>

              </div>

              <div className="flex justify-between">

                <span>Subtotal</span>

                <span>
                  ₹{details.bill.subtotal}
                </span>

              </div>

              <div className="flex justify-between">

                <span>Discount</span>

                <span>
                  ₹{details.bill.discount}
                </span>

              </div>

              <hr className="my-3"/>

              <div className="flex justify-between text-xl font-bold text-green-700">

                <span>Total</span>

                <span>
                  ₹{details.bill.total_amount}
                </span>

              </div>

            </div>

            {/* Payment */}

            <div className="bg-gray-50 rounded-xl p-5">

              <h3 className="font-bold text-lg mb-3">
                💳 Payment
              </h3>

              <p>
                Status :{" "}
                <span
                  className={`font-bold ${
                    details.bill.payment_status ===
                    "Paid"
                      ? "text-green-700"
                      : "text-red-600"
                  }`}
                >
                  {details.bill.payment_status}
                </span>
              </p>

            </div>

            {/* Buttons */}

           <div className="grid grid-cols-2 gap-3">

                   <button
                        onClick={async () =>
                            await generateMonthlyBillPDF(
                            details,
                            "download"
                            )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
                        >
                        📄 Download PDF
                        </button>

                   <button
                        onClick={async () =>
                            await generateMonthlyBillPDF(
                            details,
                            "print"
                            )
                        }
                        className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold"
                        >
                        🖨 Print
                        </button>

                   <button
                        onClick={() =>
                            sendMonthlyBillWhatsApp(details)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
                        >
                        📲 WhatsApp
                        </button>

                    <button
                        className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold"
                    >
                        💰 Mark Paid
                    </button>

                    </div>

          </div>

        )}

      </div>

    </>
  );
}