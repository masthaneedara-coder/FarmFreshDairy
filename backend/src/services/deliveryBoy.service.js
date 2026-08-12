import { supabaseAdmin } from "../config/supabase.js";

// Get All Delivery Boys
export const getAllDeliveryBoysService = async () => {
  return await supabaseAdmin
    .from("delivery_boys")
    .select("*")
    .order("full_name", { ascending: true });
};

// Get Delivery Boy By ID
export const getDeliveryBoyByIdService = async (id) => {
  return await supabaseAdmin
    .from("delivery_boys")
    .select("*")
    .eq("id", id)
    .single();
};
// Add Delivery Boy
export const createDeliveryBoyService = async (deliveryBoy) => {
  return await supabaseAdmin
    .from("delivery_boys")
    .insert(deliveryBoy)
    .select()
    .single();
};

// Update Delivery Boy
export const updateDeliveryBoyService = async (id, deliveryBoy) => {
  return await supabaseAdmin
    .from("delivery_boys")
    .update({
      ...deliveryBoy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
};

// Delete Delivery Boy
export const deleteDeliveryBoyService = async (id) => {
  return await supabaseAdmin
    .from("delivery_boys")
    .delete()
    .eq("id", id);
};

// Activate / Deactivate
export const toggleDeliveryBoyStatusService = async (
  id,
  is_active
) => {
  return await supabaseAdmin
    .from("delivery_boys")
    .update({
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
};
export const loginDeliveryBoyService = async (phone) => {

    return await supabaseAdmin
        .from("delivery_boys")
        .select("*")
        .eq("phone", phone)
        .single();

};
export const getAssignedOrdersService = async (deliveryBoyId) => {
  return await supabaseAdmin
    .from("orders")
    .select(`
      *,
      customers(
        full_name,
        phone
      )
    `)
    .eq("delivery_boy_id", deliveryBoyId)
    .order("order_date", { ascending: false });
};
// ======================================
// Delivery Boy History
// ======================================
// ======================================
// Delivery Boy History
// ======================================
export const getDeliveryBoyHistoryService = async (deliveryBoyId) => {
  // ======================================
  // 1. Delivered One-Time Orders
  // ======================================
  const {
    data: orders,
    error: orderError,
  } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      order_number,
      total_amount,
      payment_method,
      payment_status,
      status,
      created_at,
      customer_id,
      address_id,
      delivery_boy_id,

      customers(
        id,
        full_name,
        phone
      ),

      addresses(
        house_no,
        street,
        area,
        city,
        state,
        pincode
      ),

      order_items(
        id,
        quantity,
        unit_price,
        total_price,
        size,

        products(
          id,
          name,
          image
        )
      )
    `)
    .eq("delivery_boy_id", deliveryBoyId)
    .eq("status", "Delivered")
    .order("created_at", {
      ascending: false,
    });

  if (orderError) {
    throw orderError;
  }

  // ======================================
  // 2. Delivered Subscription Deliveries
  // ======================================
  const {
    data: subscriptions,
    error: subscriptionError,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      id,
      delivery_number,
      delivery_date,
      status,
      created_at,
      customer_id,
      address_id,
      delivery_boy_id,

      customers(
        id,
        full_name,
        phone
      ),

      addresses(
        house_no,
        street,
        area,
        city,
        state,
        pincode
      ),

      subscription_delivery_items(
        id,
        quantity,
        unit_price,
        total_price,
        size,
        is_extra,

        products(
          id,
          name,
          image
        )
      )
    `)
    .eq("delivery_boy_id", deliveryBoyId)
    .eq("status", "Delivered")
    .order("delivery_date", {
      ascending: false,
    });

  if (subscriptionError) {
    throw subscriptionError;
  }

  // ======================================
  // 3. Convert Orders
  // ======================================
  const orderHistory = (orders || []).map((order) => ({
    type: "Order",

    id: order.id,

    number: order.order_number,

    date: order.created_at,

    status: order.status,

    total_amount: Number(order.total_amount || 0),

    payment_method: order.payment_method,

    payment_status: order.payment_status,

    customer: order.customers,

    address: order.addresses,

    items: order.order_items || [],
  }));

  // ======================================
  // 4. Convert Subscription Deliveries
  // ======================================
  const subscriptionHistory = (subscriptions || []).map(
    (delivery) => {

      const totalAmount =
        (delivery.subscription_delivery_items || [])
          .reduce(
            (sum, item) =>
              sum + Number(item.total_price || 0),
            0
          );

      return {
        type: "Subscription",

        id: delivery.id,

        number: delivery.delivery_number,

        date:
          delivery.delivery_date ||
          delivery.created_at,

        status: delivery.status,

        total_amount: totalAmount,

        payment_method: "Monthly Billing",

        payment_status: "Pending",

        customer: delivery.customers,

        address: delivery.addresses,

        items:
          delivery.subscription_delivery_items || [],
      };
    }
  );

  // ======================================
  // 5. Merge
  // ======================================
  const history = [
    ...orderHistory,
    ...subscriptionHistory,
  ];

  // ======================================
  // 6. Latest First
  // ======================================
  history.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  return history;
};