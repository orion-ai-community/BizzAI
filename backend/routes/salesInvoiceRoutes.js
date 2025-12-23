import express from "express";
import {
    getAllSalesInvoices,
    getSalesInvoiceById,
    deleteSalesInvoice,
    markSalesInvoiceAsPaid,
} from "../controllers/salesInvoiceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/invoices", protect, getAllSalesInvoices);
router.get("/invoice/:id", protect, getSalesInvoiceById);
router.put("/invoice/:id/mark-paid", protect, markSalesInvoiceAsPaid);
router.delete("/invoice/:id", protect, deleteSalesInvoice);

export default router;
