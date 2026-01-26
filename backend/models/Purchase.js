import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
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
    purchaseRate: {
        type: Number,
        required: true,
        min: 0,
    },
    sellingPrice: {
        type: Number,
        default: 0,
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
    },
    hsnCode: {
        type: String,
        default: "",
    },
    batchNo: {
        type: String,
        default: "",
    },
    expiryDate: {
        type: Date,
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
});

const purchaseSchema = new mongoose.Schema(
    {
        purchaseNo: {
            type: String,
            required: true,
        },
        purchaseDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        supplierInvoiceNo: {
            type: String,
            required: true,
        },
        supplierInvoiceDate: {
            type: Date,
            required: true,
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: true,
        },
        purchaseType: {
            type: String,
            enum: ["cash", "credit"],
            default: "cash",
        },
        referenceNo: {
            type: String,
            default: "",
        },
        notes: {
            type: String,
            default: "",
        },
        items: [purchaseItemSchema],
        // Calculation fields
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
        shippingCharges: {
            type: Number,
            default: 0,
        },
        // Tax breakup
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
        roundOff: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        // Payment fields
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "bank", "credit", "split"],
            default: "cash",
        },
        bankAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BankAccount",
        },
        paymentStatus: {
            type: String,
            enum: ["paid", "unpaid", "partial"],
            default: "unpaid",
        },
        outstandingAmount: {
            type: Number,
            default: 0,
        },
        paymentReference: {
            type: String,
            default: "",
        },
        // Status management
        status: {
            type: String,
            enum: ["draft", "finalized", "cancelled"],
            default: "draft",
        },
        finalizedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        cancelReason: {
            type: String,
            default: "",
        },
        // Attachments
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
        // Audit
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Soft delete support
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

// Compound unique index: purchaseNo must be unique per user
purchaseSchema.index({ purchaseNo: 1, createdBy: 1 }, { unique: true });

// Index for faster queries
purchaseSchema.index({ supplier: 1, createdBy: 1 });
purchaseSchema.index({ status: 1, createdBy: 1 });
purchaseSchema.index({ purchaseDate: -1 });

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;
