import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                "DELETE_INVOICE",
                "DELETE_CUSTOMER",
                "DELETE_ITEM",
                "UPDATE_INVOICE",
                "UPDATE_CUSTOMER",
                "UPDATE_ITEM",
                "DELETE_RETURN",
                "UPDATE_RETURN",
                "DELETE_SALES_ORDER",
                "UPDATE_SALES_ORDER",
                "DELETE_PAYMENT",
                "UPDATE_PAYMENT",
                "FORCE_LOGOUT",
                "PASSWORD_RESET",
                "USER_ROLE_CHANGE",
            ],
            index: true,
        },
        entityType: {
            type: String,
            required: true,
            enum: ["Invoice", "Customer", "Item", "Return", "SalesOrder", "Payment", "User"],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        // Snapshot of data before change (for UPDATE) or deleted data (for DELETE)
        beforeSnapshot: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        // Snapshot of data after change (for UPDATE only)
        afterSnapshot: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        ipAddress: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
            default: null,
        },
        // Additional context
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 }); // Recent logs first
auditLogSchema.index({ userId: 1, createdAt: -1 }); // User activity timeline
auditLogSchema.index({ entityType: 1, entityId: 1 }); // Entity history

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
