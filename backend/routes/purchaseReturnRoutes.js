import express from "express";
import {
    createPurchaseReturn,
    getAllPurchaseReturns,
    getPurchaseReturnById,
    deletePurchaseReturn
} from "../controllers/purchaseReturnController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createPurchaseReturn);
router.get("/", protect, getAllPurchaseReturns);
router.get("/:id", protect, getPurchaseReturnById);
router.delete("/:id", protect, deletePurchaseReturn);

export default router;
