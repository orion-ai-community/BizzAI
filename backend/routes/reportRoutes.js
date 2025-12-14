import express from "express";
import {
  getSalesReport,
  getStockReport,
  getCustomerReport
  // getAIReport,
} from "../controllers/reportController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/sales", protect, getSalesReport);
router.get("/stock", protect, getStockReport);
router.get("/customers", protect, getCustomerReport);
// router.get("/ai", protect, getAIReport);

export default router;
