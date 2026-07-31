import {
  getMonthlyDeliveryReportService,
} from "../services/report.service.js";

export async function getMonthlyDeliveryReport(req, res) {
  try {
    const { month, year } = req.query;

    // Validation
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and Year are required.",
      });
    }

    const report =
      await getMonthlyDeliveryReportService(
        Number(month),
        Number(year)
      );

    return res.json({
      success: true,
      month: Number(month),
      year: Number(year),
      totalCustomers: report.length,
      customers: report,
    });

  } catch (err) {
    console.error("Monthly Report Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}