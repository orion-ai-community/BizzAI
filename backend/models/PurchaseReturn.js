import mongoose from "mongoose";

const purchaseReturnItemSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    }
});

const purchaseReturnSchema = new mongoose.Schema(
    {
        returnId: {
            type: String,
            required: true,
        },
        bill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bill",
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        returnDate: {
            type: Date,
            default: Date.now,
        },
        refundMethod: {
            type: String,
            enum: ["credit", "cash", "bank_transfer", "adjust_next_bill"],
            default: "credit",
        },
        bankAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BankAccount',
        },
        items: [purchaseReturnItemSchema],
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
        totalAmount: {
            type: Number,
            required: true,
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

purchaseReturnSchema.index({ returnId: 1, createdBy: 1 }, { unique: true });

const PurchaseReturn = mongoose.model("PurchaseReturn", purchaseReturnSchema);
export default PurchaseReturn;
