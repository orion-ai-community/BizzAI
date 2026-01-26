import express from "express";
import {
  getSalesReport,
  getStockReport,
  getCustomerReport,
  getDashboardStats,
  getSalesReportData,
  getSalesReportSummary,
  getSalesReportCharts,
  exportSalesReport
} from "../controllers/reportController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/sales", protect, getSalesReport);
router.get("/stock", protect, getStockReport);
router.get("/customers", protect, getCustomerReport);
router.get("/dashboard-stats", protect, getDashboardStats);

// New Sales Report Endpoints
router.get("/sales/data", protect, getSalesReportData);
router.get("/sales/summary", protect, getSalesReportSummary);
router.get("/sales/charts", protect, getSalesReportCharts);
router.get("/sales/export", protect, exportSalesReport);

export default router;

