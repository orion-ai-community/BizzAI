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
            enum: [
                "RESERVE",
                "RELEASE",
                "DELIVER",
                "IN_TRANSIT",
                "POS_SALE",
                "RETURN",
                "INVOICE",
                "PURCHASE",
                "PURCHASE_RETURN",
                "PURCHASE_CANCEL",
                "PURCHASE_RETURN_PENDING",
                "PURCHASE_RETURN_APPROVED",
                "PURCHASE_RETURN_QUARANTINE",
                "PURCHASE_RETURN_SCRAP"
            ],
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
            enum: ["SalesOrder", "DeliveryChallan", "Invoice", "Return", "Purchase", "PurchaseReturn", "GoodsReceivedNote"],
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
        // Disposition tracking (for returns and quality issues)
        disposition: {
            type: String,
            enum: ["restock", "quarantine", "scrap", "vendor_return", "repair", "none"],
            default: "none",
        },
        qualityStatus: {
            type: String,
            enum: ["pending", "passed", "failed", "partial", "none"],
            default: "none",
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
