import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import salesInvoiceRoutes from "./routes/salesInvoiceRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
// import dueRoutes from "./routes/dueRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
// import settingsRoutes from "./routes/settingsRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// DB Connection
connectDB();

// Default route
app.get("/", (req, res) => {
  res.send("🧾 Grocery Billing Software Backend is running...");
});


app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/sales-invoice", salesInvoiceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
// app.use("/api/due", dueRoutes);
app.use("/api/reports", reportRoutes);
// app.use("/api/settings", settingsRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
