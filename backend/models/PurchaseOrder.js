import mongoose from "mongoose";

/**
 * Purchase Order Item Schema
 * Represents individual line items in a purchase order
 */
const purchaseOrderItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        default: "pcs",
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    discountType: {
        type: String,
        enum: ["flat", "percentage"],
        default: "flat",
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    hsnCode: {
        type: String,
        default: "",
    },
    // Batch and expiry tracking
    batchNo: {
        type: String,
        default: "",
    },
    expiryDate: {
        type: Date,
    },
    // Quantity tracking for GRN
    orderedQty: {
        type: Number,
        required: true,
    },
    receivedQty: {
        type: Number,
        default: 0,
        min: 0,
    },
    pendingQty: {
        type: Number,
        default: 0,
        min: 0,
    },
    // Calculated fields
    taxableValue: {
        type: Number,
        required: true,
    },
    cgst: {
        type: Number,
        default: 0,
    },
    sgst: {
        type: Number,
        default: 0,
    },
    igst: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        required: true,
    },
});

/**
 * Approval History Schema
 * Tracks all approval/rejection actions
 */
const approvalHistorySchema = new mongoose.Schema({
    approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    approverName: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        enum: ["approved", "rejected", "submitted"],
        required: true,
    },
    level: {
        type: Number,
        default: 1,
    },
    comments: {
        type: String,
        default: "",
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

/**
 * Audit Log Schema
 * Immutable history of all changes
 */
const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            "created",
            "updated",
            "submitted",
            "approved",
            "rejected",
            "cancelled",
            "converted",
            "grn_created",
            "status_changed",
        ],
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    performedByName: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    details: {
        type: String,
        default: "",
    },
    changes: {
        type: mongoose.Schema.Types.Mixed,
    },
});

/**
 * Main Purchase Order Schema
 * Enterprise-grade PO with full workflow support
 */
const purchaseOrderSchema = new mongoose.Schema(
    {
        // PO Identification
        poNumber: {
            type: String,
            required: true,
        },
        poDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expectedDeliveryDate: {
            type: Date,
            required: true,
        },
        actualDeliveryDate: {
            type: Date,
        },

        // Supplier Information
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },

        // Warehouse/Location (optional for future expansion)
        warehouse: {
            type: String,
            default: "",
        },

        // Items
        items: [purchaseOrderItemSchema],

        // Financial Calculations
        subtotal: {
            type: Number,
            required: true,
            default: 0,
        },
        itemDiscount: {
            type: Number,
            default: 0,
        },
        billDiscount: {
            type: Number,
            default: 0,
        },
        shippingCharges: {
            type: Number,
            default: 0,
        },
        packingCharges: {
            type: Number,
            default: 0,
        },
        otherCharges: {
            type: Number,
            default: 0,
        },

        // Tax breakup
        totalCGST: {
            type: Number,
            default: 0,
        },
        totalSGST: {
            type: Number,
            default: 0,
        },
        totalIGST: {
            type: Number,
            default: 0,
        },
        tdsAmount: {
            type: Number,
            default: 0,
        },
        roundOff: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },

        // Status Workflow
        status: {
            type: String,
            enum: [
                "Draft",
                "Pending Approval",
                "Approved",
                "Partially Received",
                "Fully Received",
                "Closed",
                "Cancelled",
            ],
            default: "Draft",
        },

        // Approval System
        approvalHistory: [approvalHistorySchema],
        currentApprovalLevel: {
            type: Number,
            default: 0,
        },
        requiredApprovalLevel: {
            type: Number,
            default: 1,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        approvedAt: {
            type: Date,
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        rejectedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            default: "",
        },

        // Conversion Tracking
        convertedToPurchase: {
            type: Boolean,
            default: false,
        },
        purchaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Purchase",
        },
        convertedAt: {
            type: Date,
        },
        convertedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // GRN Tracking
        grns: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "GoodsReceivedNote",
            },
        ],
        isFullyReceived: {
            type: Boolean,
            default: false,
        },

        // Cancellation
        cancelledAt: {
            type: Date,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        cancellationReason: {
            type: String,
            default: "",
        },

        // Attachments
        attachments: [
            {
                filename: String,
                path: String,
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
                uploadedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            },
        ],

        // Notes and Terms
        notes: {
            type: String,
            default: "",
        },
        termsAndConditions: {
            type: String,
            default: "",
        },

        // Audit Trail
        auditLog: [auditLogSchema],

        // Ownership
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // Soft Delete
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
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: Days until expected delivery
purchaseOrderSchema.virtual("daysUntilDelivery").get(function () {
    if (!this.expectedDeliveryDate) return null;
    const today = new Date();
    const expected = new Date(this.expectedDeliveryDate);
    const diffTime = expected - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual: Is overdue
purchaseOrderSchema.virtual("isOverdue").get(function () {
    if (!this.expectedDeliveryDate) return false;
    if (this.status === "Fully Received" || this.status === "Closed" || this.status === "Cancelled") {
        return false;
    }
    return new Date() > new Date(this.expectedDeliveryDate);
});

// Pre-save middleware: Update pending quantities
purchaseOrderSchema.pre("save", function (next) {
    // Update pending quantities for each item
    this.items.forEach((item) => {
        item.orderedQty = item.quantity;
        item.pendingQty = item.orderedQty - item.receivedQty;
    });

    // Check if fully received
    const allReceived = this.items.every((item) => item.receivedQty >= item.orderedQty);
    if (allReceived && this.items.length > 0 && this.status !== "Cancelled") {
        this.isFullyReceived = true;
        if (this.status === "Approved" || this.status === "Partially Received") {
            this.status = "Fully Received";
        }
    } else if (this.items.some((item) => item.receivedQty > 0)) {
        this.isFullyReceived = false;
        if (this.status === "Approved") {
            this.status = "Partially Received";
        }
    }

    next();
});

// Indexes for performance
purchaseOrderSchema.index({ poNumber: 1, createdBy: 1 }, { unique: true });
purchaseOrderSchema.index({ supplier: 1, createdBy: 1 });
purchaseOrderSchema.index({ status: 1, createdBy: 1 });
purchaseOrderSchema.index({ poDate: -1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });
purchaseOrderSchema.index({ createdAt: -1 });
purchaseOrderSchema.index({ isDeleted: 1 });

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
export default PurchaseOrder;
