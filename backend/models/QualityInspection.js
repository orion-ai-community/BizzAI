import mongoose from "mongoose";

/**
 * Quality Inspection Item Schema
 * Tracks inspection results for individual returned items
 */
const inspectionItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    // Inspection results
    condition: {
        type: String,
        enum: ["damaged", "defective", "resalable", "scrap", "expired"],
        required: true,
    },
    disposition: {
        type: String,
        enum: ["restock", "quarantine", "scrap", "vendor_return", "repair"],
        required: true,
    },
    // Detailed inspection
    defectDescription: {
        type: String,
        default: "",
    },
    inspectorNotes: {
        type: String,
        default: "",
    },
    // Photos
    photos: [
        {
            filename: String,
            path: String,
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

/**
 * Quality Inspection Schema
 * Tracks quality inspection for returned items
 */
const qualityInspectionSchema = new mongoose.Schema(
    {
        inspectionNo: {
            type: String,
            required: true,
        },
        inspectionDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        purchaseReturn: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PurchaseReturn",
            required: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        // Items inspected
        items: [inspectionItemSchema],
        // Overall assessment
        overallCondition: {
            type: String,
            enum: ["acceptable", "poor", "unacceptable"],
            default: "acceptable",
        },
        // Status
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "approved"],
            default: "pending",
        },
        // Inspector details
        inspectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        inspectionStartTime: {
            type: Date,
        },
        inspectionEndTime: {
            type: Date,
        },
        // Approval
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        approvedAt: {
            type: Date,
        },
        // Notes
        generalNotes: {
            type: String,
            default: "",
        },
        // Audit
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
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

// Virtual: Total items inspected
qualityInspectionSchema.virtual("totalItemsInspected").get(function () {
    return this.items.length;
});

// Virtual: Total quantity inspected
qualityInspectionSchema.virtual("totalQuantityInspected").get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Ensure virtuals are included in JSON
qualityInspectionSchema.set("toJSON", { virtuals: true });
qualityInspectionSchema.set("toObject", { virtuals: true });

// Indexes
qualityInspectionSchema.index({ inspectionNo: 1, createdBy: 1 }, { unique: true });
qualityInspectionSchema.index({ purchaseReturn: 1 });
qualityInspectionSchema.index({ supplier: 1, createdBy: 1 });
qualityInspectionSchema.index({ status: 1, createdBy: 1 });
qualityInspectionSchema.index({ inspectionDate: -1 });
qualityInspectionSchema.index({ isDeleted: 1 });

const QualityInspection = mongoose.model("QualityInspection", qualityInspectionSchema);
export default QualityInspection;
