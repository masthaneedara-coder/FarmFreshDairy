import { supabaseAdmin } from "../config/supabase.js";

/* ==========================================================
   Get Customer Addresses
========================================================== */

export async function getCustomerAddressesService(customerId) {
  return await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
}

/* ==========================================================
   Get Address
========================================================== */

export async function getAddressByIdService(id) {
  return await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("id", id)
    .single();
}

/* ==========================================================
   Create Address
========================================================== */

export async function createAddressService(data) {
  return await supabaseAdmin
    .from("addresses")
    .insert({
      customer_id: data.customer_id,
      house_no: data.house_no,
      street: data.street,
      area: data.area,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      landmark: data.landmark,
      is_default: data.is_default ?? false,
    })
    .select()
    .single();
}

/* ==========================================================
   Update Address
========================================================== */

export async function updateAddressService(id, data) {
  return await supabaseAdmin
    .from("addresses")
    .update({
      house_no: data.house_no,
      street: data.street,
      area: data.area,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      landmark: data.landmark,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
}

/* ==========================================================
   Delete Address
========================================================== */



/* ==========================================================
   Set Default Address
========================================================== */

export async function setDefaultAddressService(customerId, addressId) {
  // Remove current default
  await supabaseAdmin
    .from("addresses")
    .update({ is_default: false })
    .eq("customer_id", customerId);

  // Set new default
  return await supabaseAdmin
    .from("addresses")
    .update({
      is_default: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", addressId)
    .select()
    .single();
}
export async function deleteAddressService(addressId) {
  // Check if address is used by any subscription
  const { data: subscriptions, error: subError } =
    await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("address_id", addressId)
      .limit(1);

  if (subError) {
    return { error: subError };
  }

  if (subscriptions.length > 0) {
    return {
      error: {
        message:
          "This address is linked to an active subscription and cannot be deleted.",
      },
    };
  }

  return await supabaseAdmin
    .from("addresses")
    .delete()
    .eq("id", addressId);
}