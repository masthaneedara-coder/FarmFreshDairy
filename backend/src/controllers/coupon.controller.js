import {
  validateCouponService,
} from "../services/coupon.service.js";

export async function validateCoupon(req, res) {
  try {
    const { code, billing_id } = req.body;

    if (!code || !billing_id) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and billing ID are required.",
      });
    }

    const { data, error } =
      await validateCouponService({
        code,
        billing_id,
        customer_id: req.user?.id,
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      coupon: data,
    });
  } catch (error) {
    console.error("Coupon Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate coupon.",
    });
  }
}