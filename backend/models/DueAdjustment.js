import mongoose from "mongoose";

const dueAdjustmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    relatedInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    adjustmentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    adjustmentMethod: {
      type: String,
      enum: ["cash", "bank", "credit", "original_payment"],
      required: true,
    },
    previousDue: {
      type: Number,
      required: true,
    },
    updatedDue: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for customer and user queries
dueAdjustmentSchema.index({ customer: 1, createdBy: 1 });

// Index on createdBy for user-specific queries
dueAdjustmentSchema.index({ createdBy: 1 });

const DueAdjustment = mongoose.model("DueAdjustment", dueAdjustmentSchema);
export default DueAdjustment;
