import { loginAdminService } from "../services/admin.service.js";
import {
  getAutoAssignSettingService,
  setAutoAssignSettingService,
} from "../services/deliveryAssignment.service.js";
import { createAdminToken } from "../utils/adminToken.js";


export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const { data: admin, error } =
      await loginAdminService(email);

    if (error || !admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Keep the current password check temporarily.
    // Password hashing should be migrated separately.
    if (admin.password_hash !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive.",
      });
    }

   const allowedRoles = ["admin", "super_admin"];

if (!allowedRoles.includes(String(admin.role).toLowerCase())) {
  return res.status(403).json({
    success: false,
    message: "This account is not authorized as an admin.",
  });
}

    const token = createAdminToken(admin);

    return res.status(200).json({
      success: true,
      message: "Admin Login Successful",
      token,
      expiresIn: Number(
        process.env.ADMIN_TOKEN_EXPIRY_SECONDS || 28800
      ),
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    });
  } catch (err) {
  console.error("Admin login error:", err);

  return res.status(500).json({
    success: false,
    message: err.message || "Admin login failed.",
  });
  }
};

export async function getAutoAssignSettingController(
  req,
  res
) {
  try {

    const enabled =
      await getAutoAssignSettingService();

    return res.json({
      success: true,
      enabled,
    });

  } catch (error) {

    console.error(
      "Get Auto Assign Setting Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get auto assign setting.",
    });

  }
}

export async function setAutoAssignSettingController(
  req,
  res
) {
  try {

    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message:
          "enabled must be true or false.",
      });
    }

    const result =
      await setAutoAssignSettingService(
        enabled
      );

    return res.json({
      success: true,
      ...result,
    });

  } catch (error) {

    console.error(
      "Set Auto Assign Setting Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update auto assign setting.",
    });

  }
}