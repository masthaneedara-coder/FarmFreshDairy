
import { verifyAdminToken } from "../utils/adminToken.js";
import { supabaseAdmin } from "../config/supabase.js";

export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin authorization token is required.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }
if (!supabaseAdmin) {
  return res.status(500).json({
    success: false,
    message: "Supabase admin client is not configured.",
  });
}
    const payload = verifyAdminToken(token);

    const { data: admin, error } = await supabaseAdmin
      .from("admins")
      .select("id, full_name, email, role, is_active")
      .eq("id", payload.sub)
      .maybeSingle();

    if (error) throw error;

    if (!admin || !admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive or unavailable.",
      });
    }

    if (
      !["admin", "super_admin"].includes(
        String(admin.role || "").toLowerCase()
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin access denied.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin session.",
    });
  }
};
