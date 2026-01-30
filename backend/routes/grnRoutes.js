import express from "express";
import {
    createGRN,
    getAllGRNs,
    getGRNById,
    finalizeGRN,
} from "../controllers/grnController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// GRN operations
router.post("/", createGRN);
router.get("/", getAllGRNs);
router.get("/:id", getGRNById);
router.post("/:id/finalize", finalizeGRN);

export default router;
