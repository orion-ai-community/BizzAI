import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";

// Routes imports
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
import healthRoutes from "./routes/healthRoutes.js";
import refreshTokenRoutes from "./routes/refreshTokenRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from "./config/sentry.js";
import requestId from "./middlewares/requestId.js";
import { corsOptions } from "./config/cors.config.js";
import { requestTimeout } from "./middlewares/timeout.js";

dotenv.config();

const app = express();

// =======================
// Sentry (must be first)
// =======================
initSentry(app);
if (process.env.SENTRY_DSN) {
    app.use(sentryRequestHandler());
    app.use(sentryTracingHandler());
}

// =======================
// Security Middleware
// =======================
// Security Headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
    })
);

// NoSQL Injection Prevention - RE-ENABLED after Express v4 downgrade
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Sanitized key: ${key} in request`);
    },
}));


// Response Compression
app.use(compression());

// =======================
// Basic Middleware
// =======================
// Request ID (for tracing) - MUST be first
app.use(requestId);

// Request timeout protection (30 seconds)
app.use(requestTimeout(30000));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// =======================
// CORS Configuration
// =======================
app.use(cors(corsOptions));

// Logging
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined"));
}

// =======================
// Health Check (First Route)
// =======================
app.use("/api/health", healthRoutes);
// =======================

// Health checks (no auth required)
app.get("/", (req, res) => {
    res.send("🧾 Grocery Billing Software Backend is running...");
});
app.use("/api/health", healthRoutes);

// API routes (with auth where needed)
app.use("/api/auth", authRoutes);
app.use("/api/auth", refreshTokenRoutes);
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
// Error Handler (must be last)
// =======================
// Sentry error handler (before other error handlers)
if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler());
}
// Custom error handler
app.use(errorHandler);

export default app;
