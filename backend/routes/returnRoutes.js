import express from "express";
import {
    createReturn,
    getAllReturns,
    getReturnById,
    deleteReturn,
} from "../controllers/returnController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReturn);
router.get("/", protect, getAllReturns);
router.get("/:id", protect, getReturnById);
router.delete("/:id", protect, deleteReturn);

export default router;
