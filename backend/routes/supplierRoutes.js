import express from "express";
import {
  addSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addSupplier);
router.get("/", protect, getAllSuppliers);
router.get("/:id", protect, getSupplierById);
router.put("/:id", protect, updateSupplier);
router.delete("/:id", protect, deleteSupplier);

export default router;
