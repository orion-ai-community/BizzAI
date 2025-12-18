import express from "express";
import {
  getAllBills,
  createBill,
  getBillById,
  updateBill,
  deleteBill,
} from "../controllers/billController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAllBills);
router.post("/", protect, createBill);
router.get("/:id", protect, getBillById);
router.put("/:id", protect, updateBill);
router.delete("/:id", protect, deleteBill);

export default router;