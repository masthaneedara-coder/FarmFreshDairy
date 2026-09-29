import {
  generateMonthlyBills,
  getMonthlyBills,
  getCustomerMonthlyBill,
  markMonthlyBillPaid,
  getMonthlyBillDetails,
  applyMonthlyBillCoupon,
} from "../services/monthlyBilling.service.js";

// ======================================
// Generate Monthly Bills
// POST /api/monthly-bills/generate
// ======================================
export async function generateBills(req, res) {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and Year are required",
      });
    }

    const result = await generateMonthlyBills(month, year);

    return res.status(200).json({
      success: true,
      message: "Monthly bills generated successfully.",
      ...result,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ======================================
// Get Monthly Bills
// GET /api/monthly-bills?month=8&year=2026
// ======================================
export async function getBills(req, res) {
  try {
    const { month, year } = req.query;

    const bills = await getMonthlyBills(month, year);

    return res.json({
      success: true,
      bills,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ======================================
// Get Single Customer Bill
// GET /api/monthly-bills/:customerId?month=8&year=2026
// ======================================

export async function getCustomerBill(req, res) {
  try {
    const { subscriptionId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required.",
      });
    }

    const bill = await getCustomerMonthlyBill(
      subscriptionId,
      Number(month),
      Number(year)
    );

    return res.json({
      success: true,
      bill,
    });
  } catch (err) {
    console.error("Get Customer Bill Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// ======================================
// Mark Bill Paid
// PUT /api/monthly-bills/:id/pay
// ======================================
export async function markBillPaid(req, res) {
  try {
    const { id } = req.params;

    const bill = await markMonthlyBillPaid(id);

    return res.json({
      success: true,
      message: "Bill marked as paid.",
      bill,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
export async function getBillDetails(req, res) {
  try {
    const { subscriptionId } = req.params;
    const { month, year } = req.query;

    console.log(subscriptionId, month, year);

    const result = await getMonthlyBillDetails(
      subscriptionId,
      month,
      year
    );

    return res.json({
      success: true,
      ...result,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
// ======================================
// Apply Coupon to Existing Monthly Bill
// POST /api/monthly-bills/:id/apply-coupon
// ======================================
export async function applyCouponToMonthlyBill(req, res) {
  try {
    const { id } = req.params;
    const { couponCode } = req.body;

    // Customer ID must come from authenticated user
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to apply a coupon.",
      });
    }

    if (!id || !couponCode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Bill ID and coupon code are required.",
      });
    }

    const result = await applyMonthlyBillCoupon({
      billId: id,
      customerId,
      code: couponCode.trim(),
    });

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully.",
      bill: result.bill,
      coupon: result.coupon,
    });
  } catch (err) {
    console.error("Apply Coupon Error:", err);

    return res.status(400).json({
      success: false,
      message: err.message || "Unable to apply coupon.",
    });
  }
}