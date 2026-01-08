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
  "http://localhost:5174",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,                 // production frontend
  "https://bizz-ai-theta.vercel.app",     // deployed frontend
  /\.vercel\.app$/                        // ✅ ALL Vercel preview URLs
];

// Helper to validate origin
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow server-to-server

  // In development, allow any localhost
  if (
    process.env.NODE_ENV !== "production" &&
    (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))
  ) {
    return true;
  }

  return allowedOrigins.some((allowed) =>
    allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
  );
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed from this origin"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204, // ensure preflight works across proxies
};

// Apply CORS and handle preflight across all routes
app.use(cors(corsOptions));

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