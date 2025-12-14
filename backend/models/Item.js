import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
    },
    category: {
      type: String,
    },
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    stockQty: {
      type: Number,
      default: 0,
    },
    lowStockLimit: {
      type: Number,
      default: 5,
    },
    unit: {
      type: String,
      default: "pcs", // e.g. kg, litre, pcs
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure item name is unique per owner
itemSchema.index({ name: 1, addedBy: 1 }, { unique: true });

const Item = mongoose.model("Item", itemSchema);
export default Item;