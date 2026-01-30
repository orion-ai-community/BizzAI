import mongoose from "mongoose";

/**
 * Credit Note Schema
 * Tracks credit notes received from suppliers or issued internally
 * Used for refund tracking and application against future purchases
 */
const creditNoteSchema = new mongoose.Schema(
    {
        creditNoteNo: {
            type: String,
            required: true,
        },
        creditNoteDate: {
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
        // Financial details
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        taxAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        // Credit tracking
        availableCredit: {
            type: Number,
            required: true,
            min: 0,
        },
        usedCredit: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Status
        status: {
            type: String,
            enum: ["pending", "active", "fully_used", "expired", "cancelled"],
            default: "pending",
        },
        expiryDate: {
            type: Date,
        },
        // Application tracking
        appliedToInvoices: [
            {
                invoice: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Purchase",
                },
                amountApplied: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                appliedDate: {
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
        // Audit
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
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
    { timestamps: true }
);

// Pre-save middleware to calculate available credit
creditNoteSchema.pre("save", function (next) {
    this.availableCredit = this.totalAmount - this.usedCredit;

    // Update status based on credit usage
    if (this.usedCredit >= this.totalAmount) {
        this.status = "fully_used";
    } else if (this.expiryDate && this.expiryDate < new Date()) {
        this.status = "expired";
    } else if (this.status === "pending" && this.usedCredit === 0) {
        this.status = "active";
    }

    next();
});

// Indexes
creditNoteSchema.index({ creditNoteNo: 1, createdBy: 1 }, { unique: true });
creditNoteSchema.index({ purchaseReturn: 1 });
creditNoteSchema.index({ supplier: 1, createdBy: 1 });
creditNoteSchema.index({ status: 1, createdBy: 1 });
creditNoteSchema.index({ creditNoteDate: -1 });
creditNoteSchema.index({ expiryDate: 1 });
creditNoteSchema.index({ isDeleted: 1 });

const CreditNote = mongoose.model("CreditNote", creditNoteSchema);
export default CreditNote;
