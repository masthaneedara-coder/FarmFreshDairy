export async function approveExtraMilkService(id) {

  console.log("STEP 1 - Approving Request");

  const { data: request, error } = await supabaseAdmin
    .from("extra_milk_requests")
    .update({
      status: "Approved",
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      products(*)
    `)
    .single();

  if (error) throw error;

  console.log("STEP 2 - Request");
  console.log(request);

  const today = new Date().toISOString().split("T")[0];

  const { data: delivery, error: deliveryError } =
    await supabaseAdmin
      .from("subscription_deliveries")
      .select("*")
      .eq("subscription_id", request.subscription_id)
      .eq("delivery_date", today)
      .maybeSingle();

  console.log("STEP 3 - Delivery");
  console.log(delivery);
  console.log(deliveryError);

  return request;
}