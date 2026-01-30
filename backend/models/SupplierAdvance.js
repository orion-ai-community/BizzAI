import mongoose from "mongoose";

// Advance application history schema
const advanceApplicationSchema = new mongoose.Schema({
    bill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bill",
        required: true,
    },
    billNo: {
        type: String,
        required: true,
    },
    appliedAmount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    appliedDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    appliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    paymentOut: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentOut",
    },
});

// Main supplier advance schema
const supplierAdvanceSchema = new mongoose.Schema(
    {
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        totalAdvanceGiven: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAdvanceUsed: {
            type: Number,
            default: 0,
            min: 0,
        },
        advanceRemaining: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Application history
        applications: [advanceApplicationSchema],

        // Ownership
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save middleware: Calculate remaining advance
supplierAdvanceSchema.pre("save", function (next) {
    this.advanceRemaining = this.totalAdvanceGiven - this.totalAdvanceUsed;
    next();
});

// Indexes
supplierAdvanceSchema.index({ supplier: 1, userId: 1 }, { unique: true });
supplierAdvanceSchema.index({ userId: 1 });

// Static method: Get or create advance record
supplierAdvanceSchema.statics.getOrCreate = async function (supplierId, userId) {
    let advance = await this.findOne({ supplier: supplierId, userId });

    if (!advance) {
        advance = await this.create({
            supplier: supplierId,
            userId,
            totalAdvanceGiven: 0,
            totalAdvanceUsed: 0,
            advanceRemaining: 0,
        });
    }

    return advance;
};

// Instance method: Add advance
supplierAdvanceSchema.methods.addAdvance = async function (amount) {
    this.totalAdvanceGiven += amount;
    await this.save();
    return this;
};

// Instance method: Apply advance to bill
supplierAdvanceSchema.methods.applyAdvance = async function (
    billId,
    billNo,
    amount,
    userId,
    paymentOutId = null
) {
    if (amount > this.advanceRemaining) {
        throw new Error(
            `Insufficient advance balance. Available: ₹${this.advanceRemaining.toFixed(2)}, Requested: ₹${amount.toFixed(2)}`
        );
    }

    this.totalAdvanceUsed += amount;
    this.applications.push({
        bill: billId,
        billNo,
        appliedAmount: amount,
        appliedDate: new Date(),
        appliedBy: userId,
        paymentOut: paymentOutId,
    });

    await this.save();
    return this;
};

const SupplierAdvance = mongoose.model("SupplierAdvance", supplierAdvanceSchema);
export default SupplierAdvance;
