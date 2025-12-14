import express from "express";
import {
  addDue,
  getAllDues,
  getCustomerDues,
  updateDue,
  clearDue,
} from "../controllers/dueController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addDue);
router.get("/", protect, getAllDues);
router.get("/customer/:id", protect, getCustomerDues);
router.put("/:id", protect, updateDue);
router.put("/:id/clear", protect, clearDue);

export default router;
