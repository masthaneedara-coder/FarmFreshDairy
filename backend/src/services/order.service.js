import { supabaseAdmin } from "../config/supabase.js";

// ===============================
// Create Order
// ===============================
export const createOrderService = async (order) => {
  return await supabaseAdmin
    .from("orders")
    .insert(order)
    .select()
    .single();
};

// ===============================
// Create Order Items
// ===============================
export const createOrderItemsService = async (items) => {
  return await supabaseAdmin
    .from("order_items")
    .insert(items)
    .select();
};

// ===============================
// Get Customer Orders
// ===============================
export const getCustomerOrdersService = async (customerId) => {
  return await supabaseAdmin
    .from("orders")
    .select(`
      *,
      addresses(*),
      delivery_boys(id, full_name, phone),
      order_items(
        *,
        products(
          id,
          name,
          image,
          price
        )
      )
    `)
    .eq("customer_id", customerId)
    .order("order_date", { ascending: false });
};

// ===============================
// Get All Orders (Admin)
// ===============================
export const getAllOrdersService = async () => {
  return await supabaseAdmin
    .from("orders")
    .select(`
      *,
      customers(
        id,
        full_name,
        phone,
        email
      ),
      addresses(*),
      delivery_boys(
        id,
        full_name,
        phone
      ),
      order_items(
        *,
        products(
          id,
          name,
          image
        )
      )
    `)
    .order("order_date", { ascending: false });
};

// ===============================
// Get Single Order
// ===============================
export const getOrderByIdService = async (id) => {
  return await supabaseAdmin
    .from("orders")
    .select(`
      *,
      customers(*),
      addresses(*),
      delivery_boys(*),
      order_items(
        *,
        products(*)
      )
    `)
    .eq("id", id)
    .single();
};

// ===============================
// Update Order Status
// ===============================
export const updateOrderStatusService = async (id, status) => {
  return await supabaseAdmin
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
};

// ===============================
// Update Payment Status
// ===============================
export async function updatePaymentStatusService(
  orderId,
  payment
) {

  const {
    payment_status,
    payment_method,
    transaction_id,
    received_by,
  } = payment;

  const { data, error } =
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status,
        payment_method,
        payment_date: new Date().toISOString(),
        transaction_id,
        received_by,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

  if (error) throw error;

  return data;
}
// ===============================
// Assign Delivery Boy
// ===============================
export const assignDeliveryBoyService = async (
  orderId,
  deliveryBoyId
) => {
  return await supabaseAdmin
    .from("orders")
    .update({
      delivery_boy_id: deliveryBoyId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();
};

// ===============================
// Delete Order
// ===============================
export const deleteOrderService = async (id) => {
  return await supabaseAdmin
    .from("orders")
    .delete()
    .eq("id", id);
};