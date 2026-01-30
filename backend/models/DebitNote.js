import mongoose from "mongoose";

/**
 * Debit Note Schema
 * Issued to suppliers when goods are returned
 * Separate from PurchaseReturn for accounting purposes
 */
const debitNoteSchema = new mongoose.Schema(
    {
        debitNoteNo: {
            type: String,
            required: true,
        },
        debitNoteDate: {
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
        // Financial breakdown
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        cgst: {
            type: Number,
            default: 0,
            min: 0,
        },
        sgst: {
            type: Number,
            default: 0,
            min: 0,
        },
        igst: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        // Status management
        status: {
            type: String,
            enum: ["draft", "issued", "cancelled"],
            default: "draft",
        },
        issuedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        cancelReason: {
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
        issuedBy: {
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
debitNoteSchema.index({ debitNoteNo: 1, createdBy: 1 }, { unique: true });
debitNoteSchema.index({ purchaseReturn: 1 });
debitNoteSchema.index({ supplier: 1, createdBy: 1 });
debitNoteSchema.index({ status: 1, createdBy: 1 });
debitNoteSchema.index({ debitNoteDate: -1 });
debitNoteSchema.index({ isDeleted: 1 });

const DebitNote = mongoose.model("DebitNote", debitNoteSchema);
export default DebitNote;
