import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
      type: String,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    contactPersonName: {
      type: String,
      required: true,
    },
    contactNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    physicalAddress: {
      type: String,
      required: true,
    },
    gstNo: {
      type: String,
      required: true,
    },
    supplierType: {
      type: String,
      enum: ["manufacturer", "wholesaler", "distributor"],
      required: true,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    balanceType: {
      type: String,
      enum: ["payable", "receivable"],
      default: "payable",
    },
    creditPeriod: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    itemsSupplied: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure contactNo is unique per owner
supplierSchema.index({ contactNo: 1, owner: 1 }, { unique: true });

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
