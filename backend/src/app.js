import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import testRoutes from "./routes/test.routes.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import addressRoutes from "./routes/address.routes.js";
import customerRoutes from "./routes/customer.routes.js";

import adminRoutes from "./routes/admin.routes.js";
import adminOrderRoutes from "./routes/adminOrder.routes.js";
import deliveryBoyRoutes from "./routes/deliveryBoy.routes.js";
import adminCustomerRoutes from "./routes/adminCustomer.routes.js";
import adminSubscriptionRoutes from "./routes/adminSubscription.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productSizeRoutes from "./routes/productSize.routes.js";
import subscriptionDeliveryRoutes from "./routes/subscriptionDelivery.routes.js";
import deliveryDashboardRoutes from "./routes/deliveryDashboard.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import paymentBillingRoutes from "./routes/payment.billing.routes.js";
//import { startDeliveryGeneratorJob } from "./jobs/deliveryGenerator.job.js";
import reportRoutes from "./routes/report.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import monthlyBillingRoutes from "./routes/monthlyBilling.routes.js";
import extraMilkRoutes from "./routes/extraMilk.routes.js";
import customerDeviceRoutes from "./routes/customerDevice.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import whatsappRoutes from "./routes/whatsapp.routes.js";



dotenv.config();

const app = express();
app.get("/api/version", (req, res) => {
  res.json({
    success: true,
    version: "2026-09-24-auth-fix",
    message: "Latest Farm Fresh Dairy backend is running"
  });
});
// Security
app.use(helmet());

// Enable CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://localhost",
  "http://localhost",
  "https://farm-fresh-dairy.vercel.app",
  "https://farm-fresh-dairy-mrwawn6uk-masthaneedara-coders-projects.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Logging
app.use(morgan("dev"));

// Parse JSON
app.use(express.json());

// Parse Form Data
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// Rate Limiter
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  });

  app.use(limiter);
}

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Farm Fresh Dairy Backend Running 🚀",
  });
});
app.get("/api/cron/delivery", async (req, res) => {
  try {
    console.log("==================================");
    console.log("VERCEL DAILY DELIVERY CRON");
    console.log("Time:", new Date().toISOString());
    console.log("==================================");

    const { generateTodayDeliveriesService } =
      await import("./services/subscriptionDelivery.service.js");

    const { autoAssignTodayDeliveriesService } =
      await import("./services/deliveryAssignment.service.js");

    const deliveryResult =
      await generateTodayDeliveriesService();

    const assignmentResult =
      await autoAssignTodayDeliveriesService();

    console.log(
      `Generated: ${deliveryResult.created?.length || 0}`
    );

    console.log(
      `Existing: ${deliveryResult.updated?.length || 0}`
    );

    console.log(
      `Skipped: ${deliveryResult.skipped || 0}`
    );

    console.log(
      `Auto Assigned: ${assignmentResult.assigned?.length || 0}`
    );

    console.log(
      `Remaining Pending: ${assignmentResult.pending?.length || 0}`
    );

    return res.status(200).json({
      success: true,
      message: "Daily delivery job completed",
      generated: deliveryResult.created?.length || 0,
      existing: deliveryResult.updated?.length || 0,
      skipped: deliveryResult.skipped || 0,
      assigned: assignmentResult.assigned?.length || 0,
      pending: assignmentResult.pending?.length || 0,
    });
  } catch (error) {
    console.error("VERCEL DAILY DELIVERY CRON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Daily delivery job failed",
      error: error.message,
    });
  }
});
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/customers", customerRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/delivery-boys", deliveryBoyRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/subscriptions", adminSubscriptionRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productSizeRoutes);
app.use("/api/subscription-deliveries", subscriptionDeliveryRoutes);
app.use("/api/delivery-dashboard", deliveryDashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payments", paymentBillingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/monthly-bills", monthlyBillingRoutes);
app.use("/api/extra-milk", extraMilkRoutes);
app.use("/api/customer-devices", customerDeviceRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/whatsapp", whatsappRoutes);

// WhatsApp

//startDeliveryGeneratorJob();
export default app;