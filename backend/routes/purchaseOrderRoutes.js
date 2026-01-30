import express from "express";
import {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
    submitForApproval,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    cancelPurchaseOrder,
    convertToPurchase,
    duplicatePurchaseOrder,
    getPOAnalytics,
} from "../controllers/purchaseOrderController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Analytics (must be before /:id routes)
router.get("/analytics", getPOAnalytics);

// CRUD operations
router.post("/", createPurchaseOrder);
router.get("/", getAllPurchaseOrders);
router.get("/:id", getPurchaseOrderById);
router.put("/:id", updatePurchaseOrder);
router.delete("/:id", deletePurchaseOrder);

// Workflow actions
router.post("/:id/submit", submitForApproval);
router.post("/:id/approve", approvePurchaseOrder);
router.post("/:id/reject", rejectPurchaseOrder);
router.post("/:id/cancel", cancelPurchaseOrder);
router.post("/:id/convert", convertToPurchase);
router.post("/:id/duplicate", duplicatePurchaseOrder);

export default router;
