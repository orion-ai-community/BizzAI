import express from "express";
import {
    getAllSalesInvoices,
    getSalesInvoiceById,
    deleteSalesInvoice,
} from "../controllers/salesInvoiceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/invoices", protect, getAllSalesInvoices);
router.get("/invoice/:id", protect, getSalesInvoiceById);
router.delete("/invoice/:id", protect, deleteSalesInvoice);

export default router;
