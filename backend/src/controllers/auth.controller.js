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

// ==========================
// Register
// ==========================
export const register = async (req, res) => {
  try {
    const { full_name, phone, email, password } = req.body;

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

    // Save profile in customers table
    const { error: profileError } = await supabaseAdmin
      .from("customers")
      .insert({
        id: user.id,
        full_name,
        phone,
        email,
        role: "customer",
        is_verified: true,
      });

    if (profileError) {
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
      const { data: customer, error: customerLookupError } =
        await supabaseAdmin
          .from("customers")
          .select("email")
          .eq("phone", loginId)
          .single();

      if (customerLookupError || !customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      email = customer.email;
    }

    // Login using email
    const { data, error } =
      await supabase.auth.signInWithPassword({
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
    const { data: profile, error: profileError } =
      await supabaseAdmin
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

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          "http://localhost:5173/reset-password",
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
    const {
      access_token,
      refresh_token,
      password,
    } = req.body;

    // Set the user's session
    const { error: sessionError } =
      await supabase.auth.setSession({
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
    const { error } =
      await supabase.auth.updateUser({
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