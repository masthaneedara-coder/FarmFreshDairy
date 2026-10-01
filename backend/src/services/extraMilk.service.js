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
// Approve Extra Milk
// ======================================
export async function approveExtraMilkService(id) {

  console.log("=================================");
  console.log("APPROVE EXTRA MILK");
  console.log("Request ID:", id);
  console.log("=================================");

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

  if (requestError) {
    console.error("Request Fetch Error:", requestError);
    throw requestError;
  }

  if (!request) {
    throw new Error("Extra milk request not found");
  }

  console.log("EXTRA MILK REQUEST:", request);

  // ======================================
  // 2. Approve Request
  // ======================================
  //
  // IMPORTANT:
  // Even if it is already Approved, we continue
  // because the delivery item may be missing.
  //
  if (request.status !== "Approved") {

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

    if (approveError) {
      console.error("Approve Error:", approveError);
      throw approveError;
    }

    console.log("REQUEST APPROVED:", approvedRequest);

    // Update local request status
    request.status = "Approved";
  } else {
    console.log(
      "Request already Approved. Checking delivery synchronization..."
    );
  }

  // ======================================
  // 3. Get Today's Date
  // ======================================
  const today = new Date()
    .toISOString()
    .split("T")[0];

  console.log("TODAY:", today);

  // ======================================
  // 4. Check whether request applies today
  // ======================================
  if (
    today < request.from_date ||
    today > request.to_date
  ) {
    console.log("Extra milk does not apply today.");

    return request;
  }

  console.log("Extra milk applies today.");


  // ======================================
  // 5. Find Today's Subscription Delivery
  // ======================================
  const {
    data: delivery,
    error: deliveryError,
  } = await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      id,
      delivery_number,
      delivery_date,
      status
    `)
    .eq(
      "subscription_id",
      request.subscription_id
    )
    .eq(
      "delivery_date",
      today
    )
    .maybeSingle();

  if (deliveryError) {
    console.error(
      "Today's Delivery Query Error:",
      deliveryError
    );

    throw deliveryError;
  }

  // ======================================
  // No delivery generated yet
  // ======================================
  if (!delivery) {

    console.log(
      "No today's delivery found."
    );

    console.log(
      "Daily delivery generator will add the extra milk."
    );

    return request;
  }

  console.log(
    "TODAY'S DELIVERY FOUND:",
    delivery
  );


  // ======================================
  // 6. Check if THIS request already exists
  // ======================================
  //
  // IMPORTANT:
  // We use extra_milk_request_id.
  //
  const {
    data: existingItem,
    error: existingError,
  } = await supabaseAdmin
    .from("subscription_delivery_items")
    .select(`
      id,
      delivery_id,
      product_id,
      quantity,
      size,
      unit_price,
      total_price,
      is_extra,
      extra_milk_request_id
    `)
    .eq(
      "delivery_id",
      delivery.id
    )
    .eq(
      "extra_milk_request_id",
      request.id
    )
    .maybeSingle();

  if (existingError) {
    console.error(
      "Existing Extra Item Check Error:",
      existingError
    );

    throw existingError;
  }

  // ======================================
  // Already added
  // ======================================
  if (existingItem) {

    console.log(
      "================================="
    );

    console.log(
      "EXTRA MILK ALREADY EXISTS"
    );

    console.log(
      "Request ID:",
      request.id
    );

    console.log(
      "Delivery:",
      delivery.delivery_number
    );

    console.log(
      "Existing Item:",
      existingItem.id
    );

    console.log(
      "================================="
    );

    return request;
  }


  // ======================================
  // 7. Get Product Size Price
  // ======================================
  //
  // We fetch active sizes and normalize spaces
  // so both:
  //
  // 500ml
  // 500 ml
  //
  // will work.
  //
  const {
    data: productSizes,
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
    .eq(
      "product_id",
      request.product_id
    )
    .eq(
      "is_active",
      true
    );

  if (productSizeError) {
    console.error(
      "Product Size Query Error:",
      productSizeError
    );

    throw productSizeError;
  }

  const requestedSize = String(
    request.size || ""
  )
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();

  const productSize = (productSizes || []).find(
    (item) =>
      String(item.label || "")
        .trim()
        .replace(/\s+/g, "")
        .toLowerCase() === requestedSize
  );

  if (!productSize) {
    throw new Error(
      `Price not found for ${request.size}`
    );
  }

  console.log(
    "Extra Milk Size:",
    productSize.label
  );

  console.log(
    "Extra Milk Unit Price:",
    productSize.price
  );


  // ======================================
  // 8. Calculate Price
  // ======================================
  const unitPrice = Number(
    productSize.price || 0
  );

  const quantity = Number(
    request.quantity || 0
  );

  if (quantity <= 0) {
    throw new Error(
      "Extra milk quantity must be greater than 0."
    );
  }

  const totalPrice =
    quantity * unitPrice;

  console.log("=================================");
  console.log("EXTRA MILK DELIVERY PRICE");
  console.log("Request ID:", request.id);
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

      product_id:
        request.product_id,

      quantity,

      size:
        request.size,

      unit_price:
        unitPrice,

      total_price:
        totalPrice,

      is_extra: true,

extra_request_id: request.id,

extra_milk_request_id: request.id,
    })
    .select()
    .single();

  if (extraItemError) {

    console.error(
      "Extra Milk Delivery Item Insert Error:",
      extraItemError
    );

    throw extraItemError;
  }

  console.log("=================================");
  console.log(
    "EXTRA MILK SUCCESSFULLY ADDED"
  );
  console.log(
    "Delivery:",
    delivery.delivery_number
  );
  console.log(
    "Request ID:",
    request.id
  );
  console.log(
    "Item ID:",
    extraItem.id
  );
  console.log(
    "Quantity:",
    quantity
  );
  console.log(
    "Size:",
    request.size
  );
  console.log(
    "Price:",
    totalPrice
  );
  console.log("=================================");


  // ======================================
  // 10. Return Approved Request
  // ======================================
  return request;
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

  if (error) throw error;

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

  if (error) throw error;

  return data;
}