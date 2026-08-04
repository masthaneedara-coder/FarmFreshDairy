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
import { startDeliveryGeneratorJob } from "./jobs/deliveryGenerator.job.js";
import reportRoutes from "./routes/report.routes.js";






dotenv.config();

const app = express();

// Security
app.use(helmet());

// Enable CORS
const allowedOrigins = [
  "http://localhost:5173",
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
app.use("/api/reports", reportRoutes);

// WhatsApp

startDeliveryGeneratorJob();
export default app;