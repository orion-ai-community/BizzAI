import mongoose from "mongoose";

// Bill allocation schema
const billAllocationSchema = new mongoose.Schema({
    bill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bill",
        required: true,
    },
    billNo: {
        type: String,
        required: true,
    },
    allocatedAmount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    billBalanceBefore: {
        type: Number,
        required: true,
    },
});

// Cheque details schema
const chequeDetailsSchema = new mongoose.Schema({
    chequeNumber: {
        type: String,
        required: true,
    },
    chequeDate: {
        type: Date,
        required: true,
    },
    chequeBank: {
        type: String,
        default: "",
    },
    clearingStatus: {
        type: String,
        enum: ["pending", "cleared", "bounced"],
        default: "pending",
    },
    clearedDate: {
        type: Date,
    },
    bouncedDate: {
        type: Date,
    },
    bounceReason: {
        type: String,
        default: "",
    },
});

// Audit log schema
const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ["created", "updated", "cheque_cleared", "cheque_bounced", "cancelled"],
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    performedAt: {
        type: Date,
        required: true,
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

// Main payment out schema
const paymentOutSchema = new mongoose.Schema(
    {
        paymentNo: {
            type: String,
            required: true,
        },
        paymentDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0.01,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "bank", "upi", "card", "cheque"],
            required: true,
        },
        bankAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BankAccount",
        },
        reference: {
            type: String,
            default: "",
        },
        notes: {
            type: String,
            default: "",
        },

        // Cheque details (only for cheque payments)
        chequeDetails: chequeDetailsSchema,

        // Bill allocations
        allocatedBills: [billAllocationSchema],
        totalAllocatedToBills: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Advance payment
        advanceAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Payment status
        status: {
            type: String,
            enum: ["completed", "pending", "cleared", "bounced", "cancelled"],
            default: "completed",
        },
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

        // Transaction reference for ledger linkage
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CashbankTransaction",
        },

        // Audit trail
        auditLog: [auditLogSchema],

        // Ownership
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: Unallocated amount
paymentOutSchema.virtual("unallocatedAmount").get(function () {
    return this.totalAmount - this.totalAllocatedToBills - this.advanceAmount;
});

// Pre-save middleware: Calculate totals
paymentOutSchema.pre("save", function (next) {
    // Calculate total allocated to bills
    this.totalAllocatedToBills = this.allocatedBills.reduce(
        (sum, allocation) => sum + allocation.allocatedAmount,
        0
    );

    // Set status based on payment method and cheque status
    if (this.paymentMethod === "cheque" && this.chequeDetails) {
        this.status = this.chequeDetails.clearingStatus;
    } else if (this.status === "pending" || this.status === "cleared" || this.status === "bounced") {
        // Only cheques can have these statuses, reset to completed for other methods
        this.status = "completed";
    }

    next();
});

// Indexes for performance
paymentOutSchema.index({ paymentNo: 1, createdBy: 1 }, { unique: true });
paymentOutSchema.index({ supplier: 1, createdBy: 1 });
paymentOutSchema.index({ paymentDate: -1 });
paymentOutSchema.index({ status: 1, createdBy: 1 });
paymentOutSchema.index({ paymentMethod: 1, createdBy: 1 });
paymentOutSchema.index({ "chequeDetails.clearingStatus": 1, createdBy: 1 });

// Compound index for reference uniqueness per bank account
paymentOutSchema.index(
    { reference: 1, bankAccount: 1, createdBy: 1 },
    {
        unique: true,
        partialFilterExpression: {
            reference: { $exists: true, $ne: "" },
            bankAccount: { $exists: true },
        },
    }
);

const PaymentOut = mongoose.model("PaymentOut", paymentOutSchema);
export default PaymentOut;
