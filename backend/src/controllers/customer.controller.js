import { supabaseAdmin } from "../config/supabase.js";



export const getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer: data,
    });

  } catch (err) {
    console.error("getCustomerByPhone Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};