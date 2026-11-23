
import { supabaseAdmin } from "../config/supabase.js";

const TABLE = "announcements";

const ensureSupabase = () => {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }
};

const getIndiaDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

export const getActiveAnnouncementsService = async (placement = "home") => {
  ensureSupabase();

  const placementColumns = {
    home: "show_on_home",
    dashboard: "show_on_dashboard",
    renewal: "show_on_renewal",
  };

  const placementColumn = placementColumns[placement];

  if (!placementColumn) {
    throw new Error("Invalid announcement placement.");
  }

  const today = getIndiaDate();

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .eq(placementColumn, true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
};

export const getAllAnnouncementsService = async () => {
  ensureSupabase();

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
};

export const createAnnouncementService = async (payload, adminId) => {
  ensureSupabase();

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      ...payload,
      created_by: adminId,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export const updateAnnouncementService = async (id, payload) => {
  ensureSupabase();

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export const deleteAnnouncementService = async (id) => {
  ensureSupabase();

  const { error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
};

export const validAnnouncementDate = validDate;
