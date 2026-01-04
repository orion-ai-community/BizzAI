import mongoose from "mongoose";

const deliveryChallanItemSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    deliveredQty: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        default: "pcs",
    },
    description: {
        type: String,
        default: "",
    },
});

const deliveryChallanSchema = new mongoose.Schema(
    {
        challanNumber: {
            type: String,
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        challanDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        deliveryDate: {
            type: Date,
        },
        items: [deliveryChallanItemSchema],
        // Sales Order reference (optional - only if created from SO)
        salesOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SalesOrder",
        },
        // Transport details
        vehicleNo: {
            type: String,
            default: "",
        },
        driverName: {
            type: String,
            default: "",
        },
        transportMode: {
            type: String,
            enum: ["road", "rail", "air", "ship", "courier"],
            default: "road",
        },
        notes: {
            type: String,
            default: "",
        },
        // Status tracking
        status: {
            type: String,
            enum: ["Draft", "Delivered", "Converted"],
            default: "Draft",
        },
        // Invoice conversion tracking
        convertedToInvoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
        },
        convertedAt: {
            type: Date,
        },
        // System-generated flag (for SO → Invoice without explicit DC)
        systemGenerated: {
            type: Boolean,
            default: false,
        },
        // Soft delete support
        isDeleted: {
            type: Boolean,
            default: false,
        },
        // Audit fields
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Create compound unique index: challanNumber must be unique per user
deliveryChallanSchema.index({ challanNumber: 1, createdBy: 1 }, { unique: true });

// Index for faster queries
deliveryChallanSchema.index({ customer: 1 });
deliveryChallanSchema.index({ salesOrder: 1 });
deliveryChallanSchema.index({ createdAt: -1 });

const DeliveryChallan = mongoose.model("DeliveryChallan", deliveryChallanSchema);
export default DeliveryChallan;
