import express from "express";
import {
    createPurchaseReturn,
    updatePurchaseReturn,
    getAllPurchaseReturns,
    getPurchaseReturnById,
    deletePurchaseReturn,
    getPurchasesForReturn,
    validateReturnQuantitiesAPI,
    submitForApproval,
    approvePurchaseReturn,
    rejectPurchaseReturn,
    cancelPurchaseReturn,
} from "../controllers/purchaseReturnController.js";
import {
    getReturnAnalytics,
    getSupplierReturnReport,
    getItemReturnReport,
} from "../controllers/purchaseReturnAnalyticsController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Analytics routes
router.get("/analytics", protect, getReturnAnalytics);
router.get("/analytics/supplier-report", protect, getSupplierReturnReport);
router.get("/analytics/item-report", protect, getItemReturnReport);

// Get purchases/GRNs available for return
router.get("/purchases-for-return", protect, getPurchasesForReturn);

// Validate return quantities
router.post("/validate-quantities", protect, validateReturnQuantitiesAPI);

// CRUD operations
router.post("/", protect, createPurchaseReturn);
router.get("/", protect, getAllPurchaseReturns);
router.get("/:id", protect, getPurchaseReturnById);
router.put("/:id", protect, updatePurchaseReturn);
router.delete("/:id", protect, deletePurchaseReturn);

// Approval workflow
router.post("/:id/submit-for-approval", protect, submitForApproval);
router.post("/:id/approve", protect, approvePurchaseReturn);
router.post("/:id/reject", protect, rejectPurchaseReturn);

// Cancel
router.post("/:id/cancel", protect, cancelPurchaseReturn);

export default router;
