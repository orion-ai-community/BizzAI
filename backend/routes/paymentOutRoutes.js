import express from "express";
import {
    createPaymentOut,
    getPaymentOutRecords,
    getPaymentOutById,
    cancelPaymentOut,
    getSupplierOutstandingBills,
    getSupplierPaymentInfo,
    markChequeClearedOrBounced,
    getPendingCheques,
    getSupplierPaymentSummary,
    getDateWisePaymentRegister,
    getPaymentMethodBreakdown,
    getAdvancePaymentsReport,
    getUnappliedAdvancesReport,
} from "../controllers/paymentOutController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Reports (must come before :id routes)
router.get("/reports/supplier-summary", protect, getSupplierPaymentSummary);
router.get("/reports/date-register", protect, getDateWisePaymentRegister);
router.get("/reports/method-breakdown", protect, getPaymentMethodBreakdown);
router.get("/reports/advances", protect, getAdvancePaymentsReport);
router.get("/reports/unapplied-advances", protect, getUnappliedAdvancesReport);

// Cheque management
router.get("/cheques/pending", protect, getPendingCheques);
router.post("/:id/cheque-status", protect, markChequeClearedOrBounced);

// Supplier queries
router.get("/supplier/:supplierId/bills", protect, getSupplierOutstandingBills);
router.get("/supplier/:supplierId/info", protect, getSupplierPaymentInfo);

// CRUD operations
router.get("/", protect, getPaymentOutRecords);
router.post("/", protect, createPaymentOut);
router.get("/:id", protect, getPaymentOutById);
router.delete("/:id", protect, cancelPaymentOut);

export default router;
