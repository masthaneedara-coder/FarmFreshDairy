import { supabaseAdmin } from "../config/supabase.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token",
      });
    }

    if (!supabaseAdmin) {
      console.error("[AUTH] Supabase admin client is not configured");

      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured",
      });
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error("[AUTH] Invalid token:", error?.message);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("[AUTH] Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};