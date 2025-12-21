import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["sale", "due", "payment", "purchase", "refund", "return", "due_adjustment"],
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    return: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return",
    },
    dueAdjustment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DueAdjustment",
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "due", "split", "bank", "credit"],
      default: "cash",
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
