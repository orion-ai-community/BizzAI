import express from "express";
import {
    getMyApprovals,
    approveEntity,
    rejectEntity,
    getApprovalHistory,
    getApprovalStats,
} from "../controllers/approvalController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get my pending approvals
router.get("/my-approvals", protect, getMyApprovals);

// Get approval statistics
router.get("/stats", protect, getApprovalStats);

// Approve/Reject
router.post("/:id/approve", protect, approveEntity);
router.post("/:id/reject", protect, rejectEntity);

// Get approval history for an entity
router.get("/entity/:entityType/:entityId", protect, getApprovalHistory);

export default router;
