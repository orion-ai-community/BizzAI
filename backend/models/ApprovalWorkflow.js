import mongoose from "mongoose";

/**
 * Approval Level Schema
 * Tracks individual approval levels in a workflow
 */
const approvalLevelSchema = new mongoose.Schema({
    level: {
        type: Number,
        required: true,
        min: 1,
    },
    approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    approverName: {
        type: String,
        required: true,
    },
    approverEmail: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "skipped"],
        default: "pending",
    },
    actionDate: {
        type: Date,
    },
    comments: {
        type: String,
        default: "",
    },
    notifiedAt: {
        type: Date,
    },
    remindersSent: {
        type: Number,
        default: 0,
    },
});

/**
 * Approval Workflow Schema
 * Manages multi-level approval workflows for various entities
 */
const approvalWorkflowSchema = new mongoose.Schema(
    {
        // Entity reference
        entityType: {
            type: String,
            enum: ["PurchaseReturn", "Purchase", "Expense", "PaymentOut"],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        entityNumber: {
            type: String,
            required: true,
        },
        // Workflow details
        workflowName: {
            type: String,
            default: "Standard Approval",
        },
        approvalLevels: [approvalLevelSchema],
        currentLevel: {
            type: Number,
            default: 1,
            min: 1,
        },
        // Status
        status: {
            type: String,
            enum: ["pending", "in_progress", "approved", "rejected", "cancelled"],
            default: "pending",
        },
        finalStatus: {
            type: String,
            enum: ["approved", "rejected", "cancelled"],
        },
        // Approval matrix configuration (snapshot at creation)
        approvalMatrix: {
            minAmount: {
                type: Number,
                default: 0,
            },
            maxAmount: {
                type: Number,
            },
            requiredLevels: {
                type: Number,
                default: 1,
            },
        },
        // Amount being approved
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        // Timing
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },
        // Escalation
        escalationRequired: {
            type: Boolean,
            default: false,
        },
        escalatedAt: {
            type: Date,
        },
        escalatedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        // Notes
        submitterNotes: {
            type: String,
            default: "",
        },
        // Audit
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        cancelledAt: {
            type: Date,
        },
        cancelReason: {
            type: String,
            default: "",
        },
        // Soft delete
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Virtual: Is workflow complete
approvalWorkflowSchema.virtual("isComplete").get(function () {
    return ["approved", "rejected", "cancelled"].includes(this.status);
});

// Virtual: Current approver
approvalWorkflowSchema.virtual("currentApprover").get(function () {
    const currentLevelData = this.approvalLevels.find(
        (level) => level.level === this.currentLevel
    );
    return currentLevelData ? currentLevelData.approver : null;
});

// Virtual: Pending duration in hours
approvalWorkflowSchema.virtual("pendingDurationHours").get(function () {
    if (this.completedAt) {
        return Math.round((this.completedAt - this.submittedAt) / (1000 * 60 * 60));
    }
    return Math.round((new Date() - this.submittedAt) / (1000 * 60 * 60));
});

// Ensure virtuals are included in JSON
approvalWorkflowSchema.set("toJSON", { virtuals: true });
approvalWorkflowSchema.set("toObject", { virtuals: true });

// Indexes
approvalWorkflowSchema.index({ entityType: 1, entityId: 1 });
approvalWorkflowSchema.index({ status: 1, submittedBy: 1 });
approvalWorkflowSchema.index({ "approvalLevels.approver": 1, status: 1 });
approvalWorkflowSchema.index({ submittedAt: -1 });
approvalWorkflowSchema.index({ isDeleted: 1 });

const ApprovalWorkflow = mongoose.model("ApprovalWorkflow", approvalWorkflowSchema);
export default ApprovalWorkflow;
