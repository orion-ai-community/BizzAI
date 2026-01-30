import mongoose from "mongoose";

/**
 * Refund Transaction Schema
 * Tracks all refund transactions for purchase returns
 * Separate from CashbankTransaction for better reporting and reconciliation
 */
const refundTransactionSchema = new mongoose.Schema(
    {
        refundNo: {
            type: String,
            required: true,
        },
        refundDate: {
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
        // Refund details
        refundMethod: {
            type: String,
            enum: ["cash", "bank_transfer", "credit_note", "adjust_payable"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        // Bank details (if bank_transfer)
        bankAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BankAccount",
        },
        transactionReference: {
            type: String,
            default: "",
        },
        // Credit note reference (if credit_note)
        creditNote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CreditNote",
        },
        // Cashbank transaction reference
        cashbankTransaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CashbankTransaction",
        },
        // Status
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed", "reversed"],
            default: "pending",
        },
        processedAt: {
            type: Date,
        },
        completedAt: {
            type: Date,
        },
        failedAt: {
            type: Date,
        },
        failureReason: {
            type: String,
            default: "",
        },
        reversedAt: {
            type: Date,
        },
        reversalReason: {
            type: String,
            default: "",
        },
        // Notes
        notes: {
            type: String,
            default: "",
        },
        // Audit
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reversedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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

// Indexes
refundTransactionSchema.index({ refundNo: 1, createdBy: 1 }, { unique: true });
refundTransactionSchema.index({ purchaseReturn: 1 });
refundTransactionSchema.index({ supplier: 1, createdBy: 1 });
refundTransactionSchema.index({ status: 1, createdBy: 1 });
refundTransactionSchema.index({ refundMethod: 1 });
refundTransactionSchema.index({ refundDate: -1 });
refundTransactionSchema.index({ isDeleted: 1 });

const RefundTransaction = mongoose.model("RefundTransaction", refundTransactionSchema);
export default RefundTransaction;
