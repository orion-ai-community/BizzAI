import express from "express";
import {
  addDue,
  getAllDues,
  getCustomerDues,
  updateDue,
  clearDue,
  createDueAdjustment,
  getDueAdjustments,
  getCustomerDueAdjustments,
} from "../controllers/dueController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// New due adjustment routes
router.post("/adjust", protect, createDueAdjustment);
router.get("/adjustments", protect, getDueAdjustments);
router.get("/customer/:customerId/adjustments", protect, getCustomerDueAdjustments);

// Legacy routes (kept for backward compatibility)
router.post("/", protect, addDue);
router.get("/", protect, getAllDues);
router.get("/customer/:id", protect, getCustomerDues);
router.put("/:id", protect, updateDue);
router.put("/:id/clear", protect, clearDue);

export default router;
