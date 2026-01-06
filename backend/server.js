import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";

// Routes imports remain SAME
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import salesInvoiceRoutes from "./routes/salesInvoiceRoutes.js";
import purchaseReturnRoutes from "./routes/purchaseReturnRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import estimateRoutes from "./routes/estimateRoutes.js";
import dueRoutes from "./routes/dueRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import cashbankRoutes from "./routes/cashbankRoutes.js";
import paymentInRoutes from "./routes/paymentInRoutes.js";
import salesOrderRoutes from "./routes/salesOrderRoutes.js";
import deliveryChallanRoutes from "./routes/deliveryChallanRoutes.js";

dotenv.config();

const app = express();

// =======================
// Middleware
// =======================
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,      // production frontend
  /\.vercel\.app$/               // ✅ ALL Vercel preview URLs
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server / Postman / curl
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) =>
        allowed instanceof RegExp
          ? allowed.test(origin)
          : allowed === origin
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed from this origin"));
      }
    },
    credentials: true,
  })
);

app.use(morgan("dev"));

// =======================
// DB
// =======================
connectDB();

// =======================
// Routes
// =======================
app.get("/", (req, res) => {
  res.send("🧾 Grocery Billing Software Backend is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/sales-invoice", salesInvoiceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/purchase-returns", purchaseReturnRoutes);
app.use("/api/estimates", estimateRoutes);
app.use("/api/due", dueRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/cashbank", cashbankRoutes);
app.use("/api/payment-in", paymentInRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/delivery-challan", deliveryChallanRoutes);

// =======================
// Server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);