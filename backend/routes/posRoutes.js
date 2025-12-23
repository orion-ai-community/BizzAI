import express from "express";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  deleteInvoice,
  markInvoiceAsPaid
} from "../controllers/posController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/invoice", protect, createInvoice);
router.get("/invoices", protect, getAllInvoices);
router.get("/invoice/:id", protect, getInvoiceById);
router.delete("/invoice/:id", protect, deleteInvoice);
router.put("/invoice/:id/payment", protect, markInvoiceAsPaid);

export default router;
