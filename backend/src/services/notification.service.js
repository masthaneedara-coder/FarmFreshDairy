import { supabaseAdmin } from "../config/supabase.js";

/* =========================================================
   GET ALL NOTIFICATIONS
   Used by notification.controller.js
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

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   GET UNREAD NOTIFICATION COUNT
========================================================= */

export async function getUnreadCount() {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("is_read", false);

  if (error) {
    throw error;
  }

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

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   MARK NOTIFICATION AS READ
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

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */

export async function markAllAsRead() {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("is_read", false)
    .select();

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   GET CUSTOMER NOTIFICATIONS
========================================================= */

export async function getCustomerNotifications(customerId) {
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

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   GET CUSTOMER UNREAD COUNT
========================================================= */

export async function getCustomerUnreadCount(customerId) {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("customer_id", customerId)
    .eq("is_read", false);

  if (error) {
    throw error;
  }

  return count || 0;
}

/* =========================================================
   MARK CUSTOMER NOTIFICATION AS READ
========================================================= */

export async function markCustomerNotificationAsRead(
  notificationId,
  customerId
) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .eq("customer_id", customerId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   DELETE NOTIFICATION
========================================================= */

export async function deleteNotification(notificationId) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}