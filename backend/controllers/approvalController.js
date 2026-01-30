import mongoose from "mongoose";
import ApprovalWorkflow from "../models/ApprovalWorkflow.js";
import PurchaseReturn from "../models/PurchaseReturn.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Get pending approvals for current user
 * @route GET /api/approvals/my-approvals
 */
export const getMyApprovals = async (req, res) => {
    try {
        const { status = "pending", page = 1, limit = 20 } = req.query;

        const query = {
            "approvalLevels.approver": req.user._id,
            isDeleted: false,
        };

        if (status === "pending") {
            query.status = { $in: ["pending", "in_progress"] };
            query["approvalLevels.status"] = "pending";
        } else if (status === "completed") {
            query.status = { $in: ["approved", "rejected"] };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [approvals, total] = await Promise.all([
            ApprovalWorkflow.find(query)
                .populate("submittedBy", "name email")
                .populate("approvalLevels.approver", "name email")
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            ApprovalWorkflow.countDocuments(query),
        ]);

        // Populate entity details based on entityType
        for (const approval of approvals) {
            if (approval.entityType === "PurchaseReturn") {
                const entity = await PurchaseReturn.findById(approval.entityId)
                    .populate("supplier", "businessName")
                    .select("returnId supplier totalAmount items status");
                approval._doc.entity = entity;
            }
            // Add other entity types as needed
        }

        res.status(200).json({
            approvals,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        error(`Get my approvals error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Approve an entity
 * @route POST /api/approvals/:id/approve
 */
export const approveEntity = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { comments = "" } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const workflow = await ApprovalWorkflow.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!workflow) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Approval workflow not found" });
        }

        // Check if current user is the approver for current level
        const currentLevel = workflow.approvalLevels.find(
            (level) => level.level === workflow.currentLevel
        );

        if (!currentLevel || currentLevel.approver.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({
                message: "You are not authorized to approve this request",
            });
        }

        if (currentLevel.status !== "pending") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "This approval level has already been processed",
            });
        }

        // Update current level
        currentLevel.status = "approved";
        currentLevel.actionDate = new Date();
        currentLevel.comments = comments;

        // Check if there are more levels
        if (workflow.currentLevel < workflow.approvalLevels.length) {
            workflow.currentLevel += 1;
            workflow.status = "in_progress";
        } else {
            // All levels approved
            workflow.status = "approved";
            workflow.finalStatus = "approved";
            workflow.completedAt = new Date();
        }

        await workflow.save({ session });

        // If fully approved, trigger entity-specific approval logic
        if (workflow.status === "approved") {
            if (workflow.entityType === "PurchaseReturn") {
                // This will be handled by the purchaseReturnController
                // Just update the status here
                await PurchaseReturn.findByIdAndUpdate(
                    workflow.entityId,
                    {
                        status: "approved",
                        approvedBy: req.user._id,
                        approvedAt: new Date(),
                    },
                    { session }
                );
            }
        }

        await session.commitTransaction();

        info(`Approval workflow approved: ${workflow.entityNumber} by ${req.user.name}`);
        res.status(200).json({
            message: "Approval processed successfully",
            workflow,
        });
    } catch (err) {
        await session.abortTransaction();
        error(`Approve entity error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc Reject an entity
 * @route POST /api/approvals/:id/reject
 */
export const rejectEntity = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const workflow = await ApprovalWorkflow.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!workflow) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Approval workflow not found" });
        }

        // Check if current user is the approver for current level
        const currentLevel = workflow.approvalLevels.find(
            (level) => level.level === workflow.currentLevel
        );

        if (!currentLevel || currentLevel.approver.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            return res.status(403).json({
                message: "You are not authorized to reject this request",
            });
        }

        if (currentLevel.status !== "pending") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "This approval level has already been processed",
            });
        }

        // Update current level
        currentLevel.status = "rejected";
        currentLevel.actionDate = new Date();
        currentLevel.comments = reason;

        // Mark workflow as rejected
        workflow.status = "rejected";
        workflow.finalStatus = "rejected";
        workflow.completedAt = new Date();

        await workflow.save({ session });

        // Update entity status
        if (workflow.entityType === "PurchaseReturn") {
            await PurchaseReturn.findByIdAndUpdate(
                workflow.entityId,
                {
                    status: "rejected",
                    rejectedBy: req.user._id,
                    rejectedAt: new Date(),
                    rejectionReason: reason,
                },
                { session }
            );
        }

        await session.commitTransaction();

        info(`Approval workflow rejected: ${workflow.entityNumber} by ${req.user.name}`);
        res.status(200).json({
            message: "Request rejected successfully",
            workflow,
        });
    } catch (err) {
        await session.abortTransaction();
        error(`Reject entity error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc Get approval history for an entity
 * @route GET /api/approvals/entity/:entityType/:entityId
 */
export const getApprovalHistory = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(entityId)) {
            return res.status(400).json({ message: "Invalid entity ID format" });
        }

        const workflows = await ApprovalWorkflow.find({
            entityType,
            entityId,
            isDeleted: false,
        })
            .populate("submittedBy", "name email")
            .populate("approvalLevels.approver", "name email")
            .sort({ submittedAt: -1 });

        res.status(200).json(workflows);
    } catch (err) {
        error(`Get approval history error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get approval statistics for current user
 * @route GET /api/approvals/stats
 */
export const getApprovalStats = async (req, res) => {
    try {
        const [pending, approved, rejected] = await Promise.all([
            ApprovalWorkflow.countDocuments({
                "approvalLevels.approver": req.user._id,
                status: { $in: ["pending", "in_progress"] },
                "approvalLevels.status": "pending",
                isDeleted: false,
            }),
            ApprovalWorkflow.countDocuments({
                "approvalLevels.approver": req.user._id,
                "approvalLevels.status": "approved",
                isDeleted: false,
            }),
            ApprovalWorkflow.countDocuments({
                "approvalLevels.approver": req.user._id,
                "approvalLevels.status": "rejected",
                isDeleted: false,
            }),
        ]);

        res.status(200).json({
            pending,
            approved,
            rejected,
            total: pending + approved + rejected,
        });
    } catch (err) {
        error(`Get approval stats error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
