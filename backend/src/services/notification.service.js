import { supabaseAdmin } from "../config/supabase.js";

// =====================================
// Create Notification
// =====================================
export async function createNotification({
  title,
  message,
  type,
  receiver_role = "admin",
  receiver_id = null,
  reference_id = null,
  reference_type = null,
}) {
  try {
    console.log("Creating Notification...");

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        title,
        message,
        type,
        receiver_role,
        receiver_id,
        reference_id,
        reference_type,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Notification Error:", error);
      throw error;
    }

    console.log("Notification Created Successfully:", data);

    return data;

  } catch (err) {
    console.error("createNotification Error:", err);
    throw err;
  }
}

// =====================================
// Get Notifications
// =====================================
export async function getNotifications() {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

// =====================================
// Mark As Read
// =====================================
export async function markAsRead(id) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

// =====================================
// Unread Count
// =====================================
export async function getUnreadCount() {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("is_read", false);

  if (error) {
    console.error(error);
    throw error;
  }

  return count;
}