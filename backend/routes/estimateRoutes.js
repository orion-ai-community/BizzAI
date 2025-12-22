import express from "express";
import {
    createEstimate,
    getAllEstimates,
    getEstimateById,
    updateEstimate,
    deleteEstimate
} from "../controllers/estimateController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Estimate routes
router.post("/", createEstimate);
router.get("/", getAllEstimates);
router.get("/:id", getEstimateById);
router.put("/:id", updateEstimate);
router.delete("/:id", deleteEstimate);

export default router;
