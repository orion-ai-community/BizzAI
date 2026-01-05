import express from "express";
import {
    createDeliveryChallan,
    getAllDeliveryChallans,
    getDeliveryChallanById,
    updateDeliveryChallan,
    convertToInvoice,
    deleteDeliveryChallan,
} from "../controllers/deliveryChallanController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createDeliveryChallan);
router.get("/", protect, getAllDeliveryChallans);
router.get("/:id", protect, getDeliveryChallanById);
router.put("/:id", protect, updateDeliveryChallan);
router.post("/:id/convert-to-invoice", protect, convertToInvoice);
router.delete("/:id", protect, deleteDeliveryChallan);

export default router;
