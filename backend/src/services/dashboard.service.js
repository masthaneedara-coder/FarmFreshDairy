import { supabaseAdmin } from "../config/supabase.js";



// ======================================

// Customer Wallet

// ======================================

async function getCustomerWallet(customerId) {

  const { data, error } = await supabaseAdmin

    .from("wallet_accounts")

    .select(`

      id,

      customer_id,

      balance,

      wallet_type,

      status

    `)

    .eq("customer_id", customerId)

    .maybeSingle();



  if (error) {

    console.error(

      "Customer wallet lookup error:",

      error

    );



    throw error;

  }



  return {

    balance: Number(data?.balance || 0),

    type: data?.wallet_type || "Prepaid",

    status: data?.status || "Active",

  };

}



// ======================================

// Get Delivery Rows For Billing

// ======================================

// ======================================

// Delivery Rows For One Billing Record

// ======================================

async function getBillDeliveryRows(
  subscriptionId,
  month,
  year
) {
  if (!subscriptionId) {
    return [];
  }

  // --------------------------------------
  // Normalize month/year safely
  // --------------------------------------

  let numericMonth = Number(month);
  let numericYear = Number(year);

  // Support month names such as "September".
  if (!Number.isFinite(numericMonth)) {
    const monthNames = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    const monthText = String(month || "")
      .trim()
      .toLowerCase();

    numericMonth = monthNames[monthText] || NaN;
  }

  // --------------------------------------
  // Validate year
  // --------------------------------------

  if (
    !Number.isFinite(numericYear) ||
    numericYear < 2000 ||
    numericYear > 2100
  ) {
    console.warn("Invalid billing year:", year);
    return [];
  }

  // --------------------------------------
  // Validate month
  // --------------------------------------

  if (
    !Number.isFinite(numericMonth) ||
    numericMonth < 1 ||
    numericMonth > 12
  ) {
    console.warn("Invalid billing month:", month);
    return [];
  }

  numericMonth = Math.trunc(numericMonth);
  numericYear = Math.trunc(numericYear);

  // --------------------------------------
  // Build date range without toISOString()
  // --------------------------------------

  const firstDay =
    `${numericYear}-${String(numericMonth).padStart(2, "0")}-01`;

  const lastDayNumber = new Date(
    numericYear,
    numericMonth,
    0
  ).getDate();

  const lastDay =
    `${numericYear}-${String(numericMonth).padStart(2, "0")}-${String(lastDayNumber).padStart(2, "0")}`;

  // --------------------------------------
  // Get deliveries
  // --------------------------------------

  const {
    data: deliveries,
    error,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      id,
      delivery_number,
      subscription_id,
      delivery_date,
      status
    `)
    .eq("subscription_id", subscriptionId)
    .gte("delivery_date", firstDay)
    .lte("delivery_date", lastDay)
    .order("delivery_date", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Billing delivery lookup error:",
      error
    );
    throw error;
  }

  if (!deliveries?.length) {
    return [];
  }

  // --------------------------------------
  // Get delivery items
  // --------------------------------------

  const deliveryIds =
    deliveries.map((row) => row.id);

  const {
    data: deliveryItems,
    error: itemError,
  } = await supabaseAdmin
    .from("subscription_delivery_items")
    .select(`
      id,
      delivery_id,
      product_id,
      size,
      quantity,
      unit_price,
      total_price,
      is_extra,
      products(
        id,
        name,
        image
      )
    `)
    .in("delivery_id", deliveryIds);

  if (itemError) {
    console.error(
      "Billing delivery item lookup error:",
      itemError
    );
    throw itemError;
  }

  // --------------------------------------
  // Build rows
  // --------------------------------------

  const rows = [];

  for (const delivery of deliveries) {
    const items =
      (deliveryItems || []).filter(
        (item) =>
          item.delivery_id === delivery.id
      );

    // Keep the delivery even if its item
    // record is missing.
    if (!items.length) {
      rows.push({
        id: delivery.id,
        delivery_id: delivery.id,
        delivery_number:
          delivery.delivery_number,
        delivery_date:
          delivery.delivery_date,
        status:
          delivery.status || "Pending",
        product_name: "-",
        product_image: "",
        size: "-",
        quantity: 0,
        rate: 0,
        amount: 0,
        is_extra: false,
      });

      continue;
    }

    for (const item of items) {
      const quantity =
        Number(item.quantity || 0);

      const rate =
        Number(item.unit_price || 0);

      const itemAmount =
        Number(
          item.total_price ??
            quantity * rate
        );

      const status =
        delivery.status || "Pending";

      const isDelivered =
        String(status)
          .trim()
          .toLowerCase() ===
        "delivered";

      rows.push({
        id: item.id,
        delivery_id: delivery.id,
        delivery_number:
          delivery.delivery_number,
        delivery_date:
          delivery.delivery_date,
        status,

        product_name:
          item.products?.name || "-",

        product_image:
          item.products?.image || "",

        size:
          item.size || "-",

        quantity,
        rate,

        // Only Delivered deliveries contribute
        // to postpaid billing.
        amount:
          isDelivered
            ? itemAmount
            : 0,

        is_extra:
          Boolean(item.is_extra),
      });
    }
  }

  return rows;
}

// ======================================
// Customer Outstanding Billing
// ======================================

async function getCustomerOutstanding(

  customerId

) {

  if (!customerId) {

    throw new Error(

      "Customer ID is required"

    );

  }



  // ======================================

  // Billing Records

  // ======================================

  const {

    data: billingRows,

    error,

  } = await supabaseAdmin

    .from("billing")

    .select(`

      id,

      invoice_number,

      invoice_type,

      subscription_id,

      order_id,

      customer_id,

      total_amount,

      payment_status,

      payment_method,

      invoice_date,

      billing_month,

      billing_year,

      subtotal,

      discount,

      gst_percent,

      gst_amount,

      delivered_days,

      daily_rate

    `)

    .eq(

      "customer_id",

      customerId

    )

    .order(

      "invoice_date",

      {

        ascending: false,

      }

    );



  if (error) {

    console.error(

      "Customer outstanding billing error:",

      error

    );



    throw error;

  }



  // ======================================

  // Find unpaid COD/Postpaid bills

  // ======================================

  const unpaidBills =

    (billingRows || []).filter(

      (bill) => {

        const paymentMethod =

          String(

            bill.payment_method ||

              ""

          )

            .trim()

            .toLowerCase();



        const paymentStatus =

          String(

            bill.payment_status ||

              ""

          )

            .trim()

            .toLowerCase();



        const isPostpaid =

          paymentMethod ===

            "cod" ||

          paymentMethod ===

            "postpaid";



        const isPaid =

          paymentStatus ===

            "paid" ||

          paymentStatus ===

            "completed" ||

          paymentStatus ===

            "success" ||

          paymentStatus ===

            "successful";



        return (

          isPostpaid &&

          !isPaid

        );

      }

    );



  // ======================================

  // Enrich Every Bill

  // ======================================

  const formattedBills =

    await Promise.all(

      unpaidBills.map(

        async (bill) => {

          let customer =

            null;



          let subscription =

            null;



          let item =

            null;



          let product =

            null;



          let address =

            null;



          // ==================================

          // Customer

          // ==================================

          if (

            bill.customer_id

          ) {

            const {

              data,

              error:

                customerError,

            } =

              await supabaseAdmin

                .from(

                  "customers"

                )

                .select(`

                  id,

                  full_name,

                  phone,

                  email

                `)

                .eq(

                  "id",

                  bill.customer_id

                )

                .maybeSingle();



            if (

              customerError

            ) {

              throw customerError;

            }



            customer = data;

          }



          // ==================================

          // Subscription

          // ==================================

          if (

            bill.subscription_id

          ) {

            const {

              data,

              error:

                subscriptionError,

            } =

              await supabaseAdmin

                .from(

                  "subscriptions"

                )

                .select(`

                  id,

                  customer_id,

                  address_id,

                  status,

                  start_date,

                  end_date,

                  delivery_time,

                  frequency,

                  total_amount,

                  payment_method,

                  payment_status

                `)

                .eq(

                  "id",

                  bill.subscription_id

                )

                .maybeSingle();



            if (

              subscriptionError

            ) {

              throw subscriptionError;

            }



            subscription =

              data;

          }



          // ==================================

          // Subscription Item

          // ==================================

          if (

            bill.subscription_id

          ) {

            const {

              data,

              error: itemError,

            } =

              await supabaseAdmin

                .from(

                  "subscription_items"

                )

                .select(`

                  id,

                  subscription_id,

                  product_id,

                  quantity,

                  size,

                  unit_price,

                  price

                `)

                .eq(

                  "subscription_id",

                  bill.subscription_id

                )

                .order(

                  "id",

                  {

                    ascending: true,

                  }

                )

                .limit(1)

                .maybeSingle();



            if (itemError) {

              throw itemError;

            }



            item = data;

          }



          // ==================================

          // Product

          // ==================================

          if (

            item?.product_id

          ) {

            const {

              data,

              error:

                productError,

            } =

              await supabaseAdmin

                .from(

                  "products"

                )

                .select(`

                  id,

                  name,

                  image

                `)

                .eq(

                  "id",

                  item.product_id

                )

                .maybeSingle();



            if (

              productError

            ) {

              throw productError;

            }



            product = data;

          }



          // ==================================

          // Address

          // ==================================

          if (

            subscription?.address_id

          ) {

            const {

              data,

              error:

                addressError,

            } =

              await supabaseAdmin

                .from(

                  "addresses"

                )

                .select(`

                  id,

                  house_no,

                  street,

                  area,

                  city,

                  state,

                  pincode

                `)

                .eq(

                  "id",

                  subscription.address_id

                )

                .maybeSingle();



            if (

              addressError

            ) {

              throw addressError;

            }



            address = data;

          }



          // ==================================

          // Delivery Rows

          // ==================================

          const deliveryRows =

            bill.subscription_id &&

            bill.billing_month &&

            bill.billing_year

              ? await getBillDeliveryRows(

                  bill.subscription_id,

                  bill.billing_month,

                  bill.billing_year

                )

              : [];



          // ==================================

          // Only DELIVERED deliveries

          // contribute to postpaid amount.

          // ==================================

          const deliveredRows =

            deliveryRows.filter(

              (row) =>

                String(

                  row.status ||

                    ""

                )

                  .trim()

                  .toLowerCase() ===

                "delivered"

            );



          // ==================================

          // Delivered Days

          // ==================================

          const calculatedDeliveredDays =

            new Set(

              deliveredRows.map(

                (row) =>

                  row.delivery_date

              )

            ).size;



          // ==================================

          // Actual Delivered Amount

          // ==================================

          const calculatedDeliveryAmount =

            deliveredRows.reduce(

              (

                sum,

                row

              ) =>

                sum +

                Number(

                  row.amount ||

                    0

                ),

              0

            );



          // ==================================

          // Billing Calculation

          // ==================================

          const discount =

            Number(

              bill.discount ||

                0

            );



          const gstPercent =

            Number(

              bill.gst_percent ||

                0

            );



          const calculatedSubtotal =

            calculatedDeliveryAmount;



          const calculatedGst =

            calculatedSubtotal *

            gstPercent /

            100;



          const calculatedTotal =

            Math.max(

              0,

              calculatedSubtotal +

                calculatedGst -

                discount

            );



          // ==================================

          // Return Correct Bill

          // ==================================

          return {

            id:

              bill.id,



            invoice_number:

              bill.invoice_number,



            invoice_type:

              bill.invoice_type,



            customer_id:

              bill.customer_id,



            subscription_id:

              bill.subscription_id,



            order_id:

              bill.order_id,



            invoice_date:

              bill.invoice_date,



            billing_month:

              bill.billing_month,



            billing_year:

              bill.billing_year,



            // ------------------------------

            // Customer

            // ------------------------------

            customer_name:

              customer?.full_name ||

              null,



            customer_phone:

              customer?.phone ||

              null,



            customer_email:

              customer?.email ||

              null,



            // ------------------------------

            // Subscription

            // ------------------------------

            subscription_status:

              subscription?.status ||

              null,



            start_date:

              subscription?.start_date ||

              null,



            end_date:

              subscription?.end_date ||

              null,



            delivery_time:

              subscription?.delivery_time ||

              null,



            frequency:

              subscription?.frequency ||

              null,



            // ------------------------------

            // Product

            // ------------------------------

            product_id:

              product?.id ||

              item?.product_id ||

              null,



            product_name:

              product?.name ||

              null,



            product_image:

              product?.image ||

              "",



            quantity:

              item?.quantity !=

              null

                ? Number(

                    item.quantity

                  )

                : null,



            size:

              item?.size ||

              null,



            unit_price:

              item?.unit_price !=

              null

                ? Number(

                    item.unit_price

                  )

                : null,



            // ------------------------------

            // Address

            // ------------------------------

            address:

              address

                ? {

                    id:

                      address.id,



                    house_no:

                      address.house_no ||

                      "",



                    street:

                      address.street ||

                      "",



                    area:

                      address.area ||

                      "",



                    city:

                      address.city ||

                      "",



                    state:

                      address.state ||

                      "",



                    pincode:

                      address.pincode ||

                      "",

                  }

                : null,



            // ------------------------------

            // Delivery

            // ------------------------------

            delivery_rows:

              deliveryRows,



            delivered_days:

              Number(

                bill.delivered_days ||

                  0

              ),



            calculated_delivered_days:

              calculatedDeliveredDays,



            daily_rate:

              item?.unit_price !=

              null

                ? Number(

                    item.unit_price

                  )

                : Number(

                    bill.daily_rate ||

                      0

                  ),



            calculated_delivery_amount:

              calculatedDeliveryAmount,



            // ------------------------------

            // Original subscription amount

            // ------------------------------

            original_plan_amount:

              Number(

                bill.total_amount ||

                  0

              ),



            // ------------------------------

            // Actual postpaid billing

            // ------------------------------

            subtotal:

              calculatedSubtotal,



            discount,



            gst_percent:

              gstPercent,



            gst_amount:

              calculatedGst,



            total_amount:

              calculatedTotal,



            calculated_total_amount:

              calculatedTotal,



            // ------------------------------

            // Payment

            // ------------------------------

            payment_method:

              bill.payment_method ||

              subscription?.payment_method ||

              "COD",



            payment_status:

              bill.payment_status ||

              "Pending",

          };

        }

      )

    );



  // ======================================

  // Outstanding

  //

  // IMPORTANT:

  // Do NOT use billing.total_amount here.

  //

  // Use actual delivered amount.

  // ======================================

  const outstanding =

    formattedBills.reduce(

      (

        sum,

        bill

      ) =>

        sum +

        Number(

          bill.calculated_total_amount ||

            0

        ),

      0

    );



  return {

    outstanding,



    billCount:

      formattedBills.length,



    bills:

      formattedBills,

  };

}



// ======================================

// Customer Dashboard

// ======================================

export const getDashboardService =

  async (customerId) => {

    if (!customerId) {

      return {

        error:

          new Error(

            "Customer ID is required"

          ),

      };

    }



    // ======================================

    // Customer

    // ======================================

    const {

      data: customer,

      error: customerError,

    } =

      await supabaseAdmin

        .from("customers")

        .select("*")

        .eq("id", customerId)

        .single();



    if (customerError) {

      return {

        error:

          customerError,

      };

    }



    // ======================================

    // Orders

    // ======================================

    const {

      data: orders,

      error: ordersError,

    } =

      await supabaseAdmin

        .from("orders")

        .select(`

          *,

          order_items(

            id,

            quantity,

            total_price,

            products(

              id,

              name,

              image

            )

          )

        `)

        .eq(

          "customer_id",

          customerId

        )

        .order(

          "order_date",

          {

            ascending: false,

          }

        );



    if (ordersError) {

      throw ordersError;

    }



    const formattedOrders =

      (

        orders || []

      ).map(

        (order) => ({

          id:

            order.id,



          orderNumber:

            order.order_number ||

            order.id.substring(

              0,

              8

            ),



          orderDate:

            order.order_date,



          totalAmount:

            Number(

              order.total_amount ||

                0

            ),



          paymentMethod:

            order.payment_method,



          paymentStatus:

            order.payment_status ||

            "Pending",



          status:

            order.status ||

            "Pending",



          totalItems:

            order.order_items?.reduce(

              (

                sum,

                item

              ) =>

                sum +

                Number(

                  item.quantity ||

                    0

                ),

              0

            ) || 0,



          items:

            order.order_items ||

            [],

        })

      );



    // ======================================

    // Subscriptions

    // ======================================

    const {

      data: subscriptions,

      error:

        subscriptionsError,

    } =

      await supabaseAdmin

        .from(

          "subscriptions"

        )

        .select(`

          *,

          addresses(

            id,

            house_no,

            street,

            area,

            city,

            state,

            pincode

          ),

          subscription_items(

            id,

            quantity,

            size,

            unit_price,

            price,

            products(

              id,

              name,

              image

            )

          )

        `)

        .eq(

          "customer_id",

          customerId

        )

        .order(

          "created_at",

          {

            ascending: false,

          }

        );



    if (subscriptionsError) {

      throw subscriptionsError;

    }



    const formattedSubscriptions =

      (

        subscriptions ||

        []

      ).map(

        (sub) => {

          const item =

            sub.subscription_items?.[0];



          return {

            id:

              sub.id,



            product:

              item?.products?.name ||

              "Milk Subscription",



            image:

              item?.products?.image ||

              "",



            quantity:

              item?.quantity ??

              1,



            size:

              item?.size ||

              "1L",



            monthlyAmount:

              sub.total_amount ??

              item?.price ??

              item?.unit_price ??

              0,



            deliveryType:

              sub.delivery_time ||

              "Morning",



            frequency:

              sub.frequency,



            startDate:

              sub.start_date,



            expireDate:

              sub.end_date,



            status:

              sub.status,



            is_paused:

              sub.is_paused,



            pause_from:

              sub.pause_from,



            pause_to:

              sub.pause_to,



            paused_days:

              sub.paused_days,



            address:

              sub.addresses,

          };

        }

      );



    // ======================================

    // Addresses

    // ======================================

    const {

      data: addresses,

      error: addressError,

    } =

      await supabaseAdmin

        .from("addresses")

        .select("*")

        .eq(

          "customer_id",

          customerId

        );



    if (addressError) {

      return {

        error:

          addressError,

      };

    }



    // ======================================

    // Wallet

    // ======================================

    const wallet =

      await getCustomerWallet(

        customerId

      );



    // ======================================

    // Outstanding Billing

    // ======================================

    const billing =

      await getCustomerOutstanding(

        customerId

      );



    // ======================================

    // Summary

    // ======================================

    const totalSpent =

      (

        orders || []

      ).reduce(

        (

          sum,

          order

        ) =>

          sum +

          Number(

            order.total_amount ||

              0

          ),

        0

      );



    const activeSubscriptions =

      (

        subscriptions ||

        []

      ).filter(

        (sub) =>

          sub.status ===

            "Active" &&

          !sub.is_paused

      );



    const pausedSubscriptions =

      (

        subscriptions ||

        []

      ).filter(

        (sub) =>

          sub.is_paused

      );



    // ======================================

    // Final Dashboard Response

    // ======================================

    return {

      data: {

        // ==================================

        // Customer

        // ==================================

        customer,



        // ==================================

        // Summary

        // ==================================

        summary: {

          totalOrders:

            orders?.length ||

            0,



          totalSpent,



          totalSubscriptions:

            subscriptions?.length ||

            0,



          activeSubscriptions:

            activeSubscriptions.length,



          status:

            activeSubscriptions.length >

            0

              ? "Active"

              : pausedSubscriptions.length >

                0

              ? "Paused"

              : "No Subscription",

        },



        // ==================================

        // Wallet

        // ==================================

        wallet: {

          balance:

            wallet.balance,



          type:

            wallet.type,



          status:

            wallet.status,

        },



        // ==================================

        // Billing

        // ==================================

        billing: {

          outstanding:

            Number(

              billing.outstanding ||

                0

            ),



          billCount:

            Number(

              billing.billCount ||

                0

            ),



          type:

            "Postpaid",



          bills:

            billing.bills ||

            [],

        },



        // ==================================

        // Recent Orders

        // ==================================

        recentOrders:

          formattedOrders.slice(

            0,

            5

          ),



        // ==================================

        // Subscriptions

        // ==================================

        subscriptions:

          formattedSubscriptions,



        // ==================================

        // Addresses

        // ==================================

        addresses,

      },

    };

  };