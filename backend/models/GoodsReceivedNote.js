import mongoose from "mongoose";

/**
 * GRN Item Schema
 * Tracks receipt of individual items against PO
 */
const grnItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    orderedQty: {
        type: Number,
        required: true,
        min: 0,
    },
    previouslyReceivedQty: {
        type: Number,
        default: 0,
        min: 0,
    },
    receivedQty: {
        type: Number,
        required: true,
        min: 0,
    },
    rejectedQty: {
        type: Number,
        default: 0,
        min: 0,
    },
    acceptedQty: {
        type: Number,
        required: true,
        min: 0,
    },
    // Batch and expiry tracking
    batchNo: {
        type: String,
        default: "",
    },
    expiryDate: {
        type: Date,
    },
    // Quality check
    qualityCheckNotes: {
        type: String,
        default: "",
    },
    qualityStatus: {
        type: String,
        enum: ["pending", "passed", "failed", "partial"],
        default: "pending",
    },
});

/**
 * Goods Received Note Schema
 * Tracks receipt of goods against Purchase Orders
 */
const grnSchema = new mongoose.Schema(
    {
        // GRN Identification
        grnNumber: {
            type: String,
            required: true,
        },
        grnDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // References
        purchaseOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            required: true,
        },
        poNumber: {
            type: String,
            required: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },

        // Items
        items: [grnItemSchema],

        // Status
        status: {
            type: String,
            enum: ["Draft", "Finalized"],
            default: "Draft",
        },

        // Finalization
        finalizedAt: {
            type: Date,
        },
        finalizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // Notes and Attachments
        notes: {
            type: String,
            default: "",
        },
        attachments: [
            {
                filename: String,
                path: String,
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // Ownership
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
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

// Virtual: Total received quantity
grnSchema.virtual("totalReceivedQty").get(function () {
    return this.items.reduce((sum, item) => sum + item.receivedQty, 0);
});

// Virtual: Total accepted quantity
grnSchema.virtual("totalAcceptedQty").get(function () {
    return this.items.reduce((sum, item) => sum + item.acceptedQty, 0);
});

// Virtual: Total rejected quantity
grnSchema.virtual("totalRejectedQty").get(function () {
    return this.items.reduce((sum, item) => sum + item.rejectedQty, 0);
});

// Pre-save middleware: Calculate accepted quantity
grnSchema.pre("save", function (next) {
    this.items.forEach((item) => {
        item.acceptedQty = item.receivedQty - item.rejectedQty;
    });
    next();
});

// Indexes
grnSchema.index({ grnNumber: 1, createdBy: 1 }, { unique: true });
grnSchema.index({ purchaseOrder: 1 });
grnSchema.index({ supplier: 1, createdBy: 1 });
grnSchema.index({ status: 1, createdBy: 1 });
grnSchema.index({ grnDate: -1 });
grnSchema.index({ isDeleted: 1 });

const GoodsReceivedNote = mongoose.model("GoodsReceivedNote", grnSchema);
export default GoodsReceivedNote;
