import express from "express";
import {
    getAllSalesInvoices,
    getSalesInvoiceById,
    deleteSalesInvoice,
    markSalesInvoiceAsPaid,
    getSalesInvoiceSummary,
} from "../controllers/salesInvoiceController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/rbacMiddleware.js";
import { auditDelete } from "../middlewares/auditMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getSalesInvoiceSummary);
router.get("/invoices", protect, getAllSalesInvoices);
router.get("/invoice/:id", protect, getSalesInvoiceById);
router.put("/invoice/:id/mark-paid", protect, markSalesInvoiceAsPaid);
router.delete(
    "/invoice/:id",
    protect,
    requirePermission("delete:invoice"),
    auditDelete("Invoice", "DELETE_INVOICE"),
    deleteSalesInvoice
);

export default router;
