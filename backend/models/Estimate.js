import mongoose from "mongoose";

const estimateSchema = new mongoose.Schema({
    estimateNo: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null // null means Walk-in Customer
    },
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item"
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    notes: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["draft", "sent", "accepted", "rejected", "expired"],
        default: "draft"
    },
    validUntil: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
estimateSchema.index({ estimateNo: 1 });
estimateSchema.index({ customer: 1 });
estimateSchema.index({ createdAt: -1 });

const Estimate = mongoose.model("Estimate", estimateSchema);
export default Estimate;
