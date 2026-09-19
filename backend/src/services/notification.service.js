import { supabaseAdmin } from "../config/supabase.js";

/* =========================================================
   GET ALL NOTIFICATIONS
   Used by admin notification APIs
========================================================= */

export async function getNotifications() {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select(`
      id,
      customer_id,
      title,
      message,
      type,
      is_read,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

/* =========================================================
   GET GLOBAL UNREAD NOTIFICATION COUNT
========================================================= */

export async function getUnreadCount() {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("is_read", false);

  if (error) throw error;

  return count || 0;
}

/* =========================================================
   CREATE NOTIFICATION
========================================================= */

export async function createNotification({
  customerId,
  title,
  message,
  type = "General",
}) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      customer_id: customerId,
      title,
      message,
      type,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   MARK NOTIFICATION AS READ
   Admin/global operation
========================================================= */

export async function markAsRead(notificationId) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
   Admin/global operation
========================================================= */

export async function markAllAsRead() {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("is_read", false)
    .select();

  if (error) throw error;

  return data || [];
}

/* =========================================================
   GET CUSTOMER NOTIFICATIONS
========================================================= */

export async function getCustomerNotifications(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select(`
      id,
      customer_id,
      title,
      message,
      type,
      is_read,
      created_at
    `)
    .eq("customer_id", customerId)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

/* =========================================================
   GET CUSTOMER UNREAD COUNT
========================================================= */

export async function getCustomerUnreadCount(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("customer_id", customerId)
    .eq("is_read", false);

  if (error) throw error;

  return count || 0;
}

/* =========================================================
   MARK CUSTOMER NOTIFICATION AS READ
   Customer can only update their own notification
========================================================= */

export async function markCustomerNotificationAsRead(
  notificationId,
  customerId
) {
  if (!notificationId || !customerId) {
    throw new Error("Notification ID and customer ID are required");
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .eq("customer_id", customerId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   MARK ALL CUSTOMER NOTIFICATIONS AS READ
   IMPORTANT: Only this customer's notifications are updated
========================================================= */

export async function markAllCustomerNotificationsAsRead(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("customer_id", customerId)
    .eq("is_read", false)
    .select();

  if (error) throw error;

  return data || [];
}

/* =========================================================
   DELETE NOTIFICATION
   Admin/global operation
========================================================= */

export async function deleteNotification(notificationId) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   DELETE CUSTOMER NOTIFICATION
   IMPORTANT: Customer ID is required.
========================================================= */

export async function deleteCustomerNotification(
  notificationId,
  customerId
) {
  if (!notificationId || !customerId) {
    throw new Error("Notification ID and customer ID are required");
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("customer_id", customerId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   DELETE ALL CUSTOMER NOTIFICATIONS
   IMPORTANT: Only this customer's notifications are deleted
========================================================= */

export async function deleteAllCustomerNotifications(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .delete()
    .eq("customer_id", customerId)
    .select();

  if (error) throw error;

  return data || [];
}