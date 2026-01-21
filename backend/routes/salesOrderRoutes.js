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
import { requirePermission } from "../middlewares/rbacMiddleware.js";
import { auditUpdate } from "../middlewares/auditMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Sales Order CRUD
router.post("/", createSalesOrder);
router.get("/", listSalesOrders);
router.get("/:id", getSalesOrderById);
router.put("/:id", auditUpdate("SalesOrder", "UPDATE_SALES_ORDER"), updateSalesOrder);

// Sales Order Actions
router.post("/:id/confirm", confirmSalesOrder);
router.post(
    "/:id/cancel",
    requirePermission("delete:salesorder"),
    cancelSalesOrder
);

// Conversion Routes
router.post("/:id/convert-to-dc", convertToDeliveryChallan);
router.post("/:id/convert-to-invoice", convertToInvoice);

export default router;
