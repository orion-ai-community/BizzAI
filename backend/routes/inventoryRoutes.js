import express from "express";
import {
  addItem,
  getAllItems,
  getSingleItem,
  updateItem,
  deleteItem,
  getLowStockItems,
} from "../controllers/inventoryController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addItem);
router.get("/", protect, getAllItems);
router.get("/low-stock", protect, getLowStockItems);
router.get("/:id", protect, getSingleItem);
router.put("/:id", protect, updateItem);
router.delete("/:id", protect, deleteItem);

export default router;
