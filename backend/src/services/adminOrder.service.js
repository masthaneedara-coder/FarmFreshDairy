import { supabaseAdmin } from "../config/supabase.js";

export const getAllOrdersService = async () => {
  return await supabaseAdmin
    .from("orders")
    .select(`
      *,
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
      delivery_boys(
        id,
        full_name,
        phone
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
    .order("created_at", { ascending: false });
};
export const getOrderByIdService = async (id) => {
  return await supabaseAdmin
    .from("orders")
    .select(`
      *,
      customers(*),
      addresses(*),
       delivery_boys(*),
      admins:received_by(
  id,
  full_name,
  email
),
      order_items(
        *,
        products(*)
      )
    `)
    .eq("id", id)
    .single();
};
export const updateOrderStatusService = async (
  orderId,
  status
) => {
  return await supabaseAdmin
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select()
    .single();
};

export async function assignDeliveryBoyService(
  orderId,
  deliveryBoyId
) {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      delivery_boy_id: deliveryBoyId,
      status: "Assigned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw error;

  return await getOrderByIdService(orderId);
}