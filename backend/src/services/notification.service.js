import { supabaseAdmin } from "../config/supabase.js";

export async function createNotification({
  title,
  message,
  type,
  receiver_role = "admin",
  receiver_id = null,
  reference_id = null,
  reference_type = null,
}) {
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

  if (error) throw error;

  return data;
}
export async function getNotifications() {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}
export async function markAsRead(id) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}
export async function getUnreadCount() {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("is_read", false);

  if (error) throw error;

  return count;
}