import { supabaseAdmin } from "../config/supabase.js";

// ======================================
// Create Extra Milk Request
// ======================================
export async function createExtraMilkRequestService(data) {
  console.log("=================================");
  console.log("INCOMING EXTRA MILK DATA");
  console.log(data);
  console.log("Frontend estimated_amount:", data.estimated_amount);
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
    estimated_amount: Number(data.estimated_amount || 0),
    status: "Pending",
  };

  console.log("=================================");
  console.log("DATA BEING INSERTED INTO SUPABASE");
  console.log(insertData);
  console.log("=================================");

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
    console.error("SUPABASE INSERT ERROR:", error);
    throw error;
  }

  console.log("=================================");
  console.log("SUPABASE CREATED REQUEST");
  console.log(request);
  console.log("Saved estimated_amount:", request.estimated_amount);
  console.log("=================================");

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

  if (error) {
    throw error;
  }

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

  if (error) {
    throw error;
  }

  return data;
}


// ======================================
// Approve Extra Milk
// ======================================
export async function approveExtraMilkService(id) {
  console.log("[ExtraMilk] Approval started:", id);

  // 1. Fetch the request
  const { data: request, error: requestError } =
    await supabaseAdmin
      .from("extra_milk_requests")
      .select(`
        *,
        products (
          id,
          name
        )
      `)
      .eq("id", id)
      .single();

  if (requestError) throw requestError;
  if (!request) throw new Error("Extra milk request not found");

  // 2. Only the database function can approve and reserve stock.
  // It performs both operations atomically.
  const { data: result, error: rpcError } =
    await supabaseAdmin.rpc("approve_extra_milk_request", {
      p_request_id: id,
    });

  if (rpcError) {
    console.error("[ExtraMilk] Stock reservation failed:", rpcError);
    throw rpcError;
  }

  if (!result?.success) {
    if (result?.reason === "INSUFFICIENT_STOCK") {
      const error = new Error(
        `Insufficient stock. Required: ${result.required_packets} packets; available: ${result.available_packets}. Request remains Pending.`
      );
      error.statusCode = 409;
      error.code = "INSUFFICIENT_STOCK";
      throw error;
    }

    throw new Error(result?.message || "Extra milk approval failed");
  }

  // 3. Reload the authoritative request status
  const { data: approvedRequest, error: reloadError } =
    await supabaseAdmin
      .from("extra_milk_requests")
      .select("*")
      .eq("id", id)
      .single();

  if (reloadError) throw reloadError;

  console.log("[ExtraMilk] Approval result:", {
    requestId: id,
    status: approvedRequest.status,
    stockReserved: result.stock_reserved,
    reservedPackets: result.reserved_packets,
    remainingStock: result.remaining_stock,
    alreadyApproved: result.already_approved,
  });

  // 4. A future-dated request is picked up by the existing daily
  // delivery generator. Do not generate today's deliveries for it now.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (
    approvedRequest.status === "Approved" &&
    approvedRequest.from_date <= today &&
    approvedRequest.to_date >= today
  ) {
    const { generateTodayDeliveriesService } =
      await import("./subscriptionDelivery.service.js");

    const { autoAssignTodayDeliveriesService } =
      await import("./deliveryAssignment.service.js");

    const generation = await generateTodayDeliveriesService();
    console.log("[ExtraMilk] Delivery generation result:", generation);

    const assignment = await autoAssignTodayDeliveriesService();
    console.log("[ExtraMilk] Auto-assignment result:", assignment);
  }

  return approvedRequest;
}

// ======================================
// Reject
// ======================================
export async function rejectExtraMilkService(id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("extra_milk_requests")
    .update({
      status: "Rejected",
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}


// ======================================
// Cancel Extra Milk
// ======================================
export async function cancelExtraMilkService(id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("extra_milk_requests")
    .update({
      status: "Cancelled",
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}