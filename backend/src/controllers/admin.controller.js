import { loginAdminService } from "../services/admin.service.js";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: admin, error } = await loginAdminService(email);

    if (error || !admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Temporary plain-text password check
    if (admin.password_hash !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin Login Successful",
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};