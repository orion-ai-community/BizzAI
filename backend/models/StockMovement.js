import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true,
        },
        type: {
            type: String,
            enum: ["RESERVE", "RELEASE", "DELIVER", "IN_TRANSIT", "POS_SALE", "RETURN", "INVOICE", "PURCHASE", "PURCHASE_RETURN", "PURCHASE_CANCEL"],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        sourceType: {
            type: String,
            enum: ["SalesOrder", "DeliveryChallan", "Invoice", "Return", "Purchase", "PurchaseReturn"],
            required: true,
        },
        // Before state
        previousStock: {
            type: Number,
            required: true,
        },
        previousReserved: {
            type: Number,
            required: true,
        },
        previousInTransit: {
            type: Number,
            required: true,
        },
        // After state
        newStock: {
            type: Number,
            required: true,
        },
        newReserved: {
            type: Number,
            required: true,
        },
        newInTransit: {
            type: Number,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Index for faster queries
stockMovementSchema.index({ item: 1, createdAt: -1 });
stockMovementSchema.index({ sourceId: 1, sourceType: 1 });
stockMovementSchema.index({ type: 1 });

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
export default StockMovement;
