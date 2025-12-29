import express from "express";
import {
    createPaymentIn,
    getPaymentInRecords,
    getPaymentInById,
    getCustomerOutstandingInvoices,
    getCustomerPaymentInfo,
} from "../controllers/paymentInController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Payment In routes
router.post("/", createPaymentIn);
router.get("/", getPaymentInRecords);
router.get("/:id", getPaymentInById);

// Customer-specific routes
router.get("/customer/:customerId/invoices", getCustomerOutstandingInvoices);
router.get("/customer/:customerId/info", getCustomerPaymentInfo);

export default router;
