import mongoose from "mongoose";

/**
 * Purchase Return Item Schema - Enhanced
 * Tracks individual items being returned with full details
 */
const purchaseReturnItemSchema = new mongoose.Schema({
    // Item reference
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        default: "",
    },
    hsnCode: {
        type: String,
        default: "",
    },
    unit: {
        type: String,
        default: "pcs",
    },
    // Batch and expiry tracking
    batchNo: {
        type: String,
        default: "",
    },
    expiryDate: {
        type: Date,
    },
    // Quantity tracking
    purchasedQty: {
        type: Number,
        required: true,
        min: 0,
    },
    previouslyReturnedQty: {
        type: Number,
        default: 0,
        min: 0,
    },
    availableReturnQty: {
        type: Number,
        required: true,
        min: 0,
    },
    returnQty: {
        type: Number,
        required: true,
        min: 0,
    },
    // Pricing
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
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
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
    // Item condition and disposition
    condition: {
        type: String,
        enum: ["damaged", "defective", "resalable", "scrap", "expired", "wrong_item"],
        required: true,
    },
    disposition: {
        type: String,
        enum: ["restock", "quarantine", "scrap", "vendor_return", "repair"],
        required: true,
    },
    // Return reason
    returnReason: {
        type: String,
        required: true,
    },
    itemNotes: {
        type: String,
        default: "",
    },
    // Legacy fields for backward compatibility
    productName: {
        type: String,
    },
    quantity: {
        type: Number,
    },
    amount: {
        type: Number,
    },
    tax: {
        type: Number,
    },
    reason: {
        type: String,
    },
});

/**
 * Purchase Return Schema - Enhanced Enterprise Version
 * Fully GST-compliant, approval-driven, audit-safe purchase return management
 */
const purchaseReturnSchema = new mongoose.Schema(
    {
        // Return identification
        returnId: {
            type: String,
            required: true,
        },
        returnDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        // Original purchase references
        originalPurchase: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Purchase",
        },
        originalGRN: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GoodsReceivedNote",
        },
        // Legacy bill reference (backward compatibility)
        bill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bill",
        },
        // Supplier
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        // Return type and reason
        returnType: {
            type: String,
            enum: ["full", "partial"],
            default: "partial",
        },
        returnReason: {
            type: String,
            required: true,
        },
        warehouse: {
            type: String,
            default: "",
        },
        // Items
        items: [purchaseReturnItemSchema],
        // Financial calculations
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
        // Tax breakdown
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
        taxAmount: {
            type: Number,
            default: 0,
        },
        // Additional charges
        tdsAmount: {
            type: Number,
            default: 0,
        },
        transportCharges: {
            type: Number,
            default: 0,
        },
        handlingCharges: {
            type: Number,
            default: 0,
        },
        restockingFee: {
            type: Number,
            default: 0,
        },
        adjustmentCharges: {
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
        // Refund details
        refundMode: {
            type: String,
            enum: ["cash", "bank_transfer", "credit_note", "adjust_payable"],
            default: "adjust_payable",
        },
        // Legacy field for backward compatibility
        refundMethod: {
            type: String,
            enum: ["credit", "cash", "bank_transfer", "adjust_next_bill"],
        },
        bankAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BankAccount",
        },
        // Status management
        status: {
            type: String,
            enum: ["draft", "pending_approval", "approved", "rejected", "processing", "completed", "cancelled"],
            default: "draft",
        },
        // Approval workflow
        approvalWorkflow: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApprovalWorkflow",
        },
        approvalRequired: {
            type: Boolean,
            default: false,
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
        // Related documents
        debitNote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DebitNote",
        },
        creditNote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CreditNote",
        },
        qualityInspection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QualityInspection",
        },
        refundTransaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RefundTransaction",
        },
        // Attachments
        attachments: [
            {
                filename: String,
                path: String,
                fileType: String,
                fileSize: Number,
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // Notes
        notes: {
            type: String,
            default: "",
        },
        internalNotes: {
            type: String,
            default: "",
        },
        // Legacy fields for backward compatibility
        discountAmount: {
            type: Number,
        },
        // Audit trail
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        submittedForApprovalAt: {
            type: Date,
        },
        submittedForApprovalBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        processedAt: {
            type: Date,
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        completedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: Total items
purchaseReturnSchema.virtual("totalItems").get(function () {
    return this.items.length;
});

// Virtual: Total quantity
purchaseReturnSchema.virtual("totalQuantity").get(function () {
    return this.items.reduce((sum, item) => sum + (item.returnQty || item.quantity || 0), 0);
});

// Virtual: Is editable
purchaseReturnSchema.virtual("isEditable").get(function () {
    return this.status === "draft";
});

// Virtual: Can be approved
purchaseReturnSchema.virtual("canBeApproved").get(function () {
    return this.status === "pending_approval";
});

// Pre-save middleware: Sync legacy fields
purchaseReturnSchema.pre("save", function (next) {
    // Sync refundMethod with refundMode for backward compatibility
    if (this.refundMode && !this.refundMethod) {
        const modeToMethodMap = {
            cash: "cash",
            bank_transfer: "bank_transfer",
            credit_note: "credit",
            adjust_payable: "adjust_next_bill",
        };
        this.refundMethod = modeToMethodMap[this.refundMode];
    }

    // Sync item legacy fields
    this.items.forEach((item) => {
        if (!item.productName) item.productName = item.itemName;
        if (!item.quantity) item.quantity = item.returnQty;
        if (!item.amount) item.amount = item.total;
        if (!item.tax) item.tax = item.taxRate;
        if (!item.reason) item.reason = item.returnReason;
    });

    // Sync discountAmount
    if (!this.discountAmount) {
        this.discountAmount = this.itemDiscount + this.billDiscount;
    }

    next();
});

// Indexes
purchaseReturnSchema.index({ returnId: 1, createdBy: 1 }, { unique: true });
purchaseReturnSchema.index({ supplier: 1, createdBy: 1 });
purchaseReturnSchema.index({ originalPurchase: 1 });
purchaseReturnSchema.index({ originalGRN: 1 });
purchaseReturnSchema.index({ status: 1, createdBy: 1 });
purchaseReturnSchema.index({ returnDate: -1 });
purchaseReturnSchema.index({ approvalWorkflow: 1 });
purchaseReturnSchema.index({ isDeleted: 1 });

const PurchaseReturn = mongoose.model("PurchaseReturn", purchaseReturnSchema);
export default PurchaseReturn;
