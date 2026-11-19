
import { verifyAdminToken } from "../utils/adminToken.js";
import { supabaseAdmin } from "../config/supabase.js";

export async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin authorization token is required.",
      });
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyAdminToken(token);

    // Verify that the admin still exists and is active.
    const { data: admin, error } = await supabaseAdmin
      .from("admins")
      .select("id, full_name, email, phone, role, is_active")
      .eq("id", payload.sub)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    const allowedRoles = ["admin", "super_admin"];

if (
  !admin ||
  !allowedRoles.includes(String(admin.role).toLowerCase())
) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive or unauthorized.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("[ADMIN AUTH]", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin session. Please log in again.",
    });
  }
}
