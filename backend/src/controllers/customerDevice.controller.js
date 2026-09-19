import { registerCustomerDevice } from "../services/customerDevice.service.js";

export const registerDevice = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { deviceToken, platform } = req.body;

    if (!deviceToken || !platform) {
      return res.status(400).json({
        success: false,
        message: "deviceToken and platform are required",
      });
    }

    const device = await registerCustomerDevice({
      customerId,
      deviceToken,
      platform,
    });

    return res.status(200).json({
      success: true,
      message: "Device registered successfully",
      device,
    });
  } catch (error) {
    console.error("[FCM] Register device error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register device",
    });
  }
};