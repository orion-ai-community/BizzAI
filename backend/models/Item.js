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
    barcode: {
      type: String,
      sparse: true, // Allow multiple items without barcode, but enforce uniqueness when present
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
      min: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    inTransitStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockLimit: {
      type: Number,
      default: 5,
    },
    unit: {
      type: String,
      default: "pcs", // e.g. kg, litre, pcs
    },
    // Purchase-specific fields
    hsnCode: {
      type: String,
      default: "",
    },
    taxRate: {
      type: Number,
      default: 18, // GST rate in percentage
      min: 0,
      max: 100,
    },
    trackBatch: {
      type: Boolean,
      default: false,
    },
    trackExpiry: {
      type: Boolean,
      default: false,
    },
    batches: [
      {
        batchNo: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        expiryDate: {
          type: Date,
        },
        purchaseRate: {
          type: Number,
          required: true,
        },
        purchaseDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Barcode/SKU fields for scanning
    barcode: {
      type: String,
      sparse: true,
    },
    supplierSKU: {
      type: String,
      sparse: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual field for available stock (never negative)
itemSchema.virtual("availableStock").get(function () {
  return Math.max(this.stockQty - this.reservedStock, 0);
});

// Virtual field for over-committed stock
itemSchema.virtual("overCommittedStock").get(function () {
  return Math.max(this.reservedStock - this.stockQty, 0);
});

// Ensure virtuals are included in JSON
itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

// Compound index to ensure item name is unique per owner
itemSchema.index({ name: 1, addedBy: 1 }, { unique: true });

// Sparse indexes for barcode scanning (allows null values)
itemSchema.index({ barcode: 1, addedBy: 1 }, { sparse: true });
itemSchema.index({ supplierSKU: 1, addedBy: 1 }, { sparse: true });

const Item = mongoose.model("Item", itemSchema);
export default Item;