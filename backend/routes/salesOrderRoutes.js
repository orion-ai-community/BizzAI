import express from "express";
import {
    createSalesOrder,
    updateSalesOrder,
    confirmSalesOrder,
    getSalesOrderById,
    listSalesOrders,
    cancelSalesOrder,
    convertToDeliveryChallan,
    convertToInvoice,
} from "../controllers/salesOrderController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Sales Order CRUD
router.post("/", createSalesOrder);
router.get("/", listSalesOrders);
router.get("/:id", getSalesOrderById);
router.put("/:id", updateSalesOrder);

// Sales Order Actions
router.post("/:id/confirm", confirmSalesOrder);
router.post("/:id/cancel", cancelSalesOrder);

// Conversion Routes
router.post("/:id/convert-to-dc", convertToDeliveryChallan);
router.post("/:id/convert-to-invoice", convertToInvoice);

export default router;
