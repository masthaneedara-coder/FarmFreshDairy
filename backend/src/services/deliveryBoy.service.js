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