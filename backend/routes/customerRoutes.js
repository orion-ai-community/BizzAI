import express from "express";
import {
  addCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
} from "../controllers/customerController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/rbacMiddleware.js";
import { auditDelete, auditUpdate } from "../middlewares/auditMiddleware.js";

const router = express.Router();

router.post("/", protect, addCustomer);
router.get("/", protect, getAllCustomers);
router.get("/:id/transactions", protect, getCustomerTransactions);
router.get("/:id", protect, getCustomerById);
router.put(
  "/:id",
  protect,
  auditUpdate("Customer", "UPDATE_CUSTOMER"),
  updateCustomer
);
router.delete(
  "/:id",
  protect,
  requirePermission("delete:customer"),
  auditDelete("Customer", "DELETE_CUSTOMER"),
  deleteCustomer
);

export default router;
