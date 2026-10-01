import { supabase } from "../config/supabase.js";
import { supabaseAdmin } from "../config/supabase.js";

import {
  createProductService,
  updateProductService,
  deleteProductService,
  searchProductsService,
  getProductsByCategoryService,
  getPaginatedProductsService,
} from "../services/product.service.js";

// ==========================================================
// PHONE NORMALIZATION
// ==========================================================
const normalizeIndianPhone = (phone) => {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, "");

  if (/^91[6-9]\d{9}$/.test(digits)) return digits.slice(2);
  if (/^0[6-9]\d{9}$/.test(digits)) return digits.slice(1);
  if (/^[6-9]\d{9}$/.test(digits)) return digits;

  return null;
};

// ==========================
// Register
// ==========================
export const register = async (req, res) => {
  try {
    const { full_name, phone, email, password } = req.body;

    const normalizedPhone = normalizeIndianPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Indian mobile number.",
      });
    }

    // Check duplicate phone before creating Supabase Auth user
    const { data: existingCustomer, error: phoneLookupError } =
      await supabaseAdmin
        .from("customers")
        .select("id, full_name, phone, email")
        .eq("normalized_phone", normalizedPhone)
        .maybeSingle();

    if (phoneLookupError) {
      console.error("Phone lookup error:", phoneLookupError);
      return res.status(500).json({
        success: false,
        message: "Unable to verify mobile number.",
      });
    }

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered. Please login instead.",
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const user = data.user;

    // Save profile with normalized phone
    const { error: profileError } = await supabaseAdmin
      .from("customers")
      .insert({
        id: user.id,
        full_name,
        phone: normalizedPhone,
        normalized_phone: normalizedPhone,
        email,
        role: "customer",
        is_verified: true,
      });

    if (profileError) {
      // Prevent an orphaned Supabase Auth account if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      } catch (cleanupError) {
        console.error("Failed to cleanup Auth user:", cleanupError);
      }

      return res.status(400).json({
        success: false,
        message: profileError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Customer Registered Successfully",
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================
// Login
// ==========================
export const login = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    let email = loginId;

    // If loginId is not an email, treat it as a phone number
    if (!loginId.includes("@")) {
      const normalizedPhone = normalizeIndianPhone(loginId);

      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid Indian mobile number.",
        });
      }

      const { data: customer, error: customerLookupError } =
        await supabaseAdmin
          .from("customers")
          .select("email")
          .eq("normalized_phone", normalizedPhone)
          .maybeSingle();

      if (customerLookupError || !customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      email = customer.email;
    }

    // Login using email
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Load customer profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    return res.json({
      success: true,
      message: "Login Successful",
      session: data.session,
      user: profile,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        process.env.NODE_ENV === "production"
          ? "https://farm-fresh-dairy.vercel.app/reset-password"
          : "http://localhost:5173/reset-password",
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Password reset email sent.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { access_token, refresh_token, password } = req.body;

    // Set the user's session
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) {
      return res.status(400).json({
        success: false,
        message: sessionError.message,
      });
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
