import express from "express";
import {
    getAllSalesInvoices,
    getSalesInvoiceById,
    deleteSalesInvoice,
    markSalesInvoiceAsPaid,
    getSalesInvoiceSummary,
} from "../controllers/salesInvoiceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getSalesInvoiceSummary);
router.get("/invoices", protect, getAllSalesInvoices);
router.get("/invoice/:id", protect, getSalesInvoiceById);
router.put("/invoice/:id/mark-paid", protect, markSalesInvoiceAsPaid);
router.delete("/invoice/:id", protect, deleteSalesInvoice);

export default router;
