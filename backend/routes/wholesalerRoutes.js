import express from "express";
import {
  addWholesaler,
  getAllWholesalers,
  getWholesalerById,
  updateWholesaler,
  deleteWholesaler,
} from "../controllers/wholesalerController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addWholesaler);
router.get("/", protect, getAllWholesalers);
router.get("/:id", protect, getWholesalerById);
router.put("/:id", protect, updateWholesaler);
router.delete("/:id", protect, deleteWholesaler);

export default router;
