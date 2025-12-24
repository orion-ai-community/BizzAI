import express from "express";
import {
  getAllBills,
  createBill,
  getBillById,
  updateBill,
  deleteBill,
  updateBillPayment
} from "../controllers/billController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllBills);
router.post("/", protect, createBill);
router.get("/:id", protect, getBillById);
router.put("/:id", protect, updateBill);
router.delete("/:id", protect, deleteBill);
router.put("/:id/payment", protect, updateBillPayment);

export default router;