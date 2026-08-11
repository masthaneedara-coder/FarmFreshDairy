import { supabaseAdmin } from "../config/supabase.js";


// ======================================
// Get All Subscriptions
// ======================================
export async function getAllSubscriptionsService() {
  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const result = [];

  for (const sub of subscriptions) {
    
    // Customer
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("full_name, phone")
      .eq("id", sub.customer_id)
      .single();

    // Address
    const { data: address } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("id", sub.address_id)
      .single();
      result.push({
        subscriptionId: sub.id,

        customerName: customer?.full_name || "-",

        phone: customer?.phone || "-",

        product: sub.product || "Milk",

        qty: sub.quantity || "1",

        deliveryType: sub.delivery_time,

        monthlyAmount: sub.total_amount,

        // ==============================
        // Subscription Status
        // ==============================
       status: sub.is_paused === true
          ? "Paused"
          : sub.status,

        // Keep the original pause information
        

        // ==============================
        // Pause Information
        // ==============================
        is_paused: sub.is_paused === true,
        pause_from: sub.pause_from || null,
        pause_to: sub.pause_to || null,

        startDate: sub.start_date,

        expireDate: sub.end_date,

        address: address
          ? `${address.house_no}, ${address.street}`
          : "-",

        area: address?.area || "-",
      });

 
  }

  return result;
}

// ======================================
// Update Subscription Status
// ======================================
export async function updateSubscriptionStatusService(
  id,
  status
) {
  // ======================================
  // Get CURRENT subscription
  // ======================================
  const {
    data: subscription,
    error: fetchError,
  } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  console.log("=================================");
  console.log("SUBSCRIPTION STATUS UPDATE");
  console.log("ID:", id);
  console.log("Requested Status:", status);
  console.log("Current Status:", subscription.status);
  console.log("Current is_paused:", subscription.is_paused);
  console.log("Current pause_from:", subscription.pause_from);
  console.log("Current pause_to:", subscription.pause_to);
  console.log("Current paused_days:", subscription.paused_days);
  console.log("=================================");

  // ======================================
  // ACTIVATE
  // ======================================
  if (status === "Active") {

    // --------------------------------------
    // IMPORTANT:
    // If subscription is NOT paused,
    // activation must NOT add paused days.
    // --------------------------------------
    if (
      subscription.is_paused !== true ||
      !subscription.pause_from
    ) {
      console.log(
        "Already Active / Not Paused."
      );

      const {
        data,
        error,
      } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "Active",
          is_paused: false,
          updated_at: new Date(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    }

    // --------------------------------------
    // Get today's DATE only
    // --------------------------------------
    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    // --------------------------------------
    // Pause start date
    // --------------------------------------
    const pauseFrom =
      new Date(
        `${subscription.pause_from}T00:00:00`
      );

    // --------------------------------------
    // Activation date
    // --------------------------------------
    const activationDate =
      new Date(
        `${today}T00:00:00`
      );

    // --------------------------------------
    // Difference in days
    // --------------------------------------
    const differenceInMs =
      activationDate.getTime() -
      pauseFrom.getTime();

    const completedPausedDays =
      Math.max(
        0,
        Math.floor(
          differenceInMs /
            (1000 * 60 * 60 * 24)
        )
      );

    // --------------------------------------
    // Existing paused days
    // --------------------------------------
    const previousPausedDays =
      Number(
        subscription.paused_days || 0
      );

    // --------------------------------------
    // Add ONLY this pause period
    // --------------------------------------
    const totalPausedDays =
      previousPausedDays +
      completedPausedDays;

    console.log(
      "Pause From:",
      subscription.pause_from
    );

    console.log(
      "Activation Date:",
      today
    );

    console.log(
      "Completed Paused Days:",
      completedPausedDays
    );

    console.log(
      "Previous Paused Days:",
      previousPausedDays
    );

    console.log(
      "Final Paused Days:",
      totalPausedDays
    );

    // ======================================
    // ACTIVATE + SAVE
    // ======================================
    const {
      data,
      error,
    } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "Active",

        is_paused: false,

        pause_from: null,

        pause_to: null,

        paused_days: totalPausedDays,

        updated_at: new Date(),
      })
      .eq("id", id)
      .eq("is_paused", true) // IMPORTANT
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // ======================================
  // PAUSE
  // ======================================
  if (status === "Paused") {

    // --------------------------------------
    // If already paused, don't reset
    // pause_from or paused_days.
    // --------------------------------------
    if (subscription.is_paused === true) {

      console.log(
        "Subscription is already paused."
      );

      return subscription;
    }

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "Paused",

        is_paused: true,

        pause_from: today,

        pause_to: null,

        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(
      "Subscription paused from:",
      today
    );

    return data;
  }

  // ======================================
  // STOP
  // ======================================
  if (status === "Stopped") {

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "Stopped",

        is_paused: false,

        pause_from: null,

        pause_to: null,

        updated_at: new Date(),
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
  // OTHER STATUS
  // ======================================
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status,
      updated_at: new Date(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}