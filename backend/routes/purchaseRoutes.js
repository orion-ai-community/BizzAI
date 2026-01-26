import express from "express";
import {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    getDraftPurchases,
    updatePurchase,
    finalizePurchase,
    cancelPurchase,
} from "../controllers/purchaseController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Purchase CRUD
router.post("/", createPurchase);
router.get("/", getAllPurchases);
router.get("/drafts", getDraftPurchases);
router.get("/:id", getPurchaseById);
router.put("/:id", updatePurchase);

// Purchase actions
router.post("/:id/finalize", finalizePurchase);
router.post("/:id/cancel", cancelPurchase);

export default router;
