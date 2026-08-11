import { supabaseAdmin } from "../config/supabase.js";

// ======================================
// Create Extra Milk Request
// ======================================
export async function createExtraMilkRequestService(data) {
  console.log("=================================");
  console.log("Incoming Extra Milk Request:");
  console.log(data);
  console.log("Estimated Amount:", data.estimated_amount);
  console.log("=================================");

  const insertData = {
    customer_id: data.customer_id,
    subscription_id: data.subscription_id,
    product_id: data.product_id,
    quantity: Number(data.quantity || 1),
    size: data.size,
    from_date: data.from_date,
    to_date: data.to_date,
    remarks: data.remarks || null,

    // IMPORTANT
    estimated_amount: Number(data.estimated_amount || 0),

    status: "Pending",
  };

  console.log("Data going to Supabase:");
  console.log(insertData);

  const {
    data: request,
    error,
  } = await supabaseAdmin
    .from("extra_milk_requests")
    .insert(insertData)
    .select(`
      *,
      customers(
        full_name,
        phone
      ),
      products(
        name
      )
    `)
    .single();

  if (error) {
    console.error("Supabase Extra Milk Insert Error:", error);
    throw error;
  }

  console.log("Created Extra Milk Request:");
  console.log(request);

  return request;
}

// ======================================
// Admin List
// ======================================
export async function getExtraMilkRequestsService() {

  const { data, error } = await supabaseAdmin
    .from("extra_milk_requests")
    .select(`
      *,
      customers(
        id,
        full_name,
        phone
      ),
      products(
        id,
        name
      ),
      subscriptions(
        id,
        status
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data;
}

// ======================================
// Customer History
// ======================================
export async function getCustomerExtraMilkService(customerId) {

  const { data, error } = await supabaseAdmin
    .from("extra_milk_requests")
    .select(`
      *,
      products(
        id,
        name
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data;
}

// ======================================
// Approve
// ======================================
// ======================================
// Approve Extra Milk
// ======================================
export async function approveExtraMilkService(id) {

  // ======================================
  // 1. Get Extra Milk Request
  // ======================================
  const {
    data: request,
    error: requestError,
  } = await supabaseAdmin
    .from("extra_milk_requests")
    .select(`
      *,
      products(
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

  if (requestError) throw requestError;

  if (!request) {
    throw new Error("Extra milk request not found");
  }

  // Prevent duplicate approval
  if (request.status === "Approved") {
    return request;
  }

  // ======================================
  // 2. Approve Request
  // ======================================
  const {
    data: approvedRequest,
    error: approveError,
  } = await supabaseAdmin
    .from("extra_milk_requests")
    .update({
      status: "Approved",
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (approveError) throw approveError;

  // ======================================
  // 3. Get Today's Date
  // ======================================
  const today =
    new Date().toISOString().split("T")[0];

  // ======================================
  // 4. Check whether request applies today
  // ======================================
  if (
    today < request.from_date ||
    today > request.to_date
  ) {
    return approvedRequest;
  }

  // ======================================
  // 5. Find Today's Subscription Delivery
  // ======================================
  const {
    data: delivery,
    error: deliveryError,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select("id")
    .eq("subscription_id", request.subscription_id)
    .eq("delivery_date", today)
    .maybeSingle();

  if (deliveryError) {
    throw deliveryError;
  }

  // ======================================
  // No delivery generated yet
  // ======================================
  if (!delivery) {
    console.log(
      "No today's delivery found. Generator will add extra milk."
    );

    return approvedRequest;
  }

  // ======================================
  // 6. Check if extra item already exists
  // ======================================
  const {
    data: existingItem,
    error: existingError,
  } = await supabaseAdmin
    .from("subscription_delivery_items")
    .select("id")
    .eq("delivery_id", delivery.id)
    .eq("product_id", request.product_id)
    .eq("size", request.size)
    .eq("is_extra", true)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  // Prevent duplicate item
  if (existingItem) {
    console.log(
      "Extra milk item already exists:",
      existingItem.id
    );

    return approvedRequest;
  }

 // ======================================
// 7. Get Product Size Price
// ======================================
const {
  data: productSize,
  error: productSizeError,
} = await supabaseAdmin
  .from("product_sizes")
  .select(`
    id,
    product_id,
    label,
    price,
    is_active
  `)
  .eq("product_id", request.product_id)
  .eq("is_active", true)
  .ilike("label", request.size)
  .maybeSingle();

if (productSizeError) {
  throw productSizeError;
}

if (!productSize) {
  throw new Error(
    `Price not found for ${request.size}`
  );
}

console.log("Extra Milk Size:", productSize.label);
console.log("Extra Milk Unit Price:", productSize.price);

  if (productError) {
    throw productError;
  }

 // ======================================
// 8. Calculate Price
// ======================================
const unitPrice = Number(
  productSize.price || 0
);

const quantity =
  Number(request.quantity || 0);

const totalPrice =
  quantity * unitPrice;

console.log("=================================");
console.log("EXTRA MILK DELIVERY PRICE");
console.log("Size:", request.size);
console.log("Unit Price:", unitPrice);
console.log("Quantity:", quantity);
console.log("Total:", totalPrice);
console.log("=================================");

  // ======================================
  // 9. Insert Extra Delivery Item
  // ======================================
  const {
    data: extraItem,
    error: extraItemError,
  } = await supabaseAdmin
    .from("subscription_delivery_items")
    .insert({
      delivery_id: delivery.id,
      product_id: request.product_id,
      quantity,
      size: request.size,
      unit_price: unitPrice,
      total_price: totalPrice,
      is_extra: true,
    })
    .select()
    .single();

  if (extraItemError) {
    throw extraItemError;
  }

  console.log(
    "Extra milk added to today's delivery:",
    extraItem
  );

  // ======================================
  // 10. Return Approved Request
  // ======================================
  return approvedRequest;
}
// ======================================
// Reject
// ======================================
export async function rejectExtraMilkService(id) {

  const { data, error } = await supabaseAdmin
    .from("extra_milk_requests")
    .update({
      status: "Rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}
export async function cancelExtraMilkService(id) {

  const { data, error } =
    await supabaseAdmin
      .from("extra_milk_requests")
      .update({
        status: "Cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

  if (error) throw error;

  return data;
}