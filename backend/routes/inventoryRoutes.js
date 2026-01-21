import express from "express";
import {
  addItem,
  getAllItems,
  getSingleItem,
  updateItem,
  deleteItem,
  getLowStockItems,
  importItems,
} from "../controllers/inventoryController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/rbacMiddleware.js";
import { auditDelete, auditUpdate } from "../middlewares/auditMiddleware.js";

const router = express.Router();

router.post("/", protect, addItem);
router.post("/import", protect, importItems);
router.get("/", protect, getAllItems);
router.get("/low-stock", protect, getLowStockItems);
router.get("/:id", protect, getSingleItem);
router.put(
  "/:id",
  protect,
  auditUpdate("Item", "UPDATE_ITEM"),
  updateItem
);
router.delete(
  "/:id",
  protect,
  requirePermission("delete:item"),
  auditDelete("Item", "DELETE_ITEM"),
  deleteItem
);

export default router;
