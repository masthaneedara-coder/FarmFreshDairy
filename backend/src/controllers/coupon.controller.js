import {
  validateCouponService,
} from "../services/coupon.service.js";

export async function validateCoupon(req, res) {
  try {
    const { code, amount } = req.body;

    const { data, error } =
      await validateCouponService({
        code,
        amount,
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
    console.error(
      "Coupon Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to validate coupon.",
    });
  }
}