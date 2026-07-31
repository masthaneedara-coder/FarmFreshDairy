import { supabaseAdmin } from "../config/supabase.js";

export async function getTodayDeliveriesService() {
  const today = new Date().toISOString().split("T")[0];

  return await supabaseAdmin
    .from("subscription_deliveries")
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
      subscription_delivery_items(
        *,
        products(
          id,
          name,
          image
        )
      )
    `)
    .eq("delivery_date", today)
    .order("created_at", { ascending: false });
}
export async function getDeliveryByIdService(id) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .select(`
      *,
      customers(*),
      addresses(*),
      delivery_boys(*),
      subscription_delivery_items(
        *,
        products(*)
      )
    `)
    .eq("id", id)
    .single();
}
export async function assignDeliveryBoyService(
  deliveryId,
  deliveryBoyId
) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .update({
      elivery_boy_id,
  status: "Assigned",
  assigned_at: new Date().toISOString(),
    })
    .eq("id", deliveryId)
    .select()
    .single();
}
export async function updateDeliveryStatusService(
  deliveryId,
  status
) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliveryId)
    .select()
    .single();
}
export async function deleteDeliveryService(id) {
  return await supabaseAdmin
    .from("subscription_deliveries")
    .delete()
    .eq("id", id);
}
export async function generateTodayDeliveriesService() {

  const today =
    new Date().toISOString().split("T")[0];

  const { data: subscriptions, error } =
    await supabaseAdmin
      .from("subscriptions")
      .select(`
        *,
        subscription_items(
          *,
          products(*)
        )
      `)
      .eq("status", "Active");

  if (error) throw error;

  const created = [];
  let skipped = 0;

  for (const subscription of subscriptions) {

    if (!shouldGenerateDelivery(subscription, today)) {
      skipped++;
      continue;
    }

    const { data: existing } =
      await supabaseAdmin
        .from("subscription_deliveries")
        .select("id")
        .eq("subscription_id", subscription.id)
        .eq("delivery_date", today)
        .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const deliveryNumber =
      await generateDeliveryNumber();

    const { data: delivery, error: deliveryError } =
      await supabaseAdmin
        .from("subscription_deliveries")
        .insert({
                delivery_number: deliveryNumber,
                subscription_id: subscription.id,
                customer_id: subscription.customer_id,
                address_id: subscription.address_id,
                delivery_date: today,
                status: "Pending",
                //payment_status: "Pending"
            })
        .select()
        .single();

    if (deliveryError) {
            console.error("Delivery Insert Error:", deliveryError);
            throw deliveryError;
            }

    const items =
      subscription.subscription_items.map(item => ({
        delivery_id: delivery.id,
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        unit_price: item.unit_price ?? item.price,
        total_price:
          item.quantity *
          (item.unit_price ?? item.price),
      }));

    if (items.length > 0) {

      const { error: itemError } =
        await supabaseAdmin
          .from("subscription_delivery_items")
          .insert(items);

      if (itemError) throw itemError;
    }

    created.push(delivery);
  }

  return {
    created,
    skipped,
  };
}
function shouldGenerateDelivery(subscription, today) {

    const todayDate = new Date(today);
    const startDate = new Date(subscription.start_date);

    // Before subscription starts
    if (todayDate < startDate) {
        return false;
    }

    // Subscription ended
    if (
        subscription.end_date &&
        todayDate > new Date(subscription.end_date)
    ) {
        return false;
    }

    // =====================================
    // NEW: Subscription Paused
    // =====================================
    if (
        subscription.is_paused &&
        subscription.pause_from &&
        subscription.pause_to
    ) {
        const pauseFrom = new Date(subscription.pause_from);
        const pauseTo = new Date(subscription.pause_to);

        if (todayDate >= pauseFrom && todayDate <= pauseTo) {
            return false;
        }
    }

    const frequency = (subscription.frequency || "")
        .trim()
        .toLowerCase();

    switch (frequency) {

        case "daily":
            return true;

        case "alternate":
        case "alternate day":
        case "alternate days": {

            const diffDays = Math.floor(
                (todayDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return diffDays % 2 === 0;
        }

        case "weekly":
            return todayDate.getDay() === startDate.getDay();

        default:
            return true;
    }
}
async function generateDeliveryNumber() {

  const { count } = await supabaseAdmin
    .from("subscription_deliveries")
    .select("*", {
      count: "exact",
      head: true,
    });

  return `SDL${String((count || 0) + 1).padStart(6, "0")}`;
}
export async function assignSubscriptionDeliveryService(
  id,
  deliveryBoyId
) {

  const { data, error } =
    await supabaseAdmin
      .from("subscription_deliveries")
      .update({
        delivery_boy_id: deliveryBoyId,
        status: "Assigned",
      })
      .eq("id", id)
      .select()
      .single();

  if (error) throw error;

  return data;
}
