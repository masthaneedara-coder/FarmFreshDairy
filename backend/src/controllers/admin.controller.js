import { loginAdminService } from "../services/admin.service.js";
import {
  getAutoAssignSettingService,
  setAutoAssignSettingService,
} from "../services/deliveryAssignment.service.js";

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