import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    originalQty: {
        type: Number,
        required: true,
    },
    returnedQty: {
        type: Number,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    taxPercent: {
        type: Number,
        default: 0,
    },
    taxAmount: {
        type: Number,
        default: 0,
    },
    lineTotal: {
        type: Number,
        required: true,
    },
    condition: {
        type: String,
        enum: ["damaged", "not_damaged"],
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    inventoryAdjusted: {
        type: Boolean,
        default: false,
    },
});

const returnSchema = new mongoose.Schema(
    {
        returnId: {
            type: String,
            required: true,
        },
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
        },
        customerName: {
            type: String,
            default: "Walk-in Customer",
        },
        returnDate: {
            type: Date,
            default: Date.now,
        },
        returnType: {
            type: String,
            enum: ["partial", "full"],
            required: true,
        },
        refundMethod: {
            type: String,
            enum: ["credit", "cash", "bank", "original_payment"],
            default: "credit",
        },
        items: [returnItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        totalReturnAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["processed", "pending", "refunded"],
            default: "processed",
        },
        notes: {
            type: String,
            default: "",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Create compound unique index: returnId must be unique per user
returnSchema.index({ returnId: 1, createdBy: 1 }, { unique: true });

// Index on invoice for fast lookups
returnSchema.index({ invoice: 1 });

// Index on customer for customer history
returnSchema.index({ customer: 1 });

const Return = mongoose.model("Return", returnSchema);
export default Return;
