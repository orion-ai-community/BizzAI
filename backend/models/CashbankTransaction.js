import mongoose from "mongoose";

const cashbankTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["transfer", "in", "out"],
      required: [true, "Please specify transaction type"],
    },
    amount: {
      type: Number,
      required: [true, "Please enter amount"],
      min: [0.01, "Amount must be positive"],
    },
    fromAccount: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or 'cash'
      required: [true, "Please specify source account"],
    },
    toAccount: {
      type: mongoose.Schema.Types.Mixed, // Can be ObjectId or 'cash'
      required: [true, "Please specify destination account"],
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    reconciled: {
      type: Boolean,
      default: false,
    },
    reconciledDate: {
      type: Date,
    },
    reconciledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reference: {
      type: String, // Check number, reference ID, etc.
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Validation to ensure from and to are not the same
cashbankTransactionSchema.pre("validate", function (next) {
  if (this.fromAccount === this.toAccount) {
    return next(new Error("Source and destination accounts cannot be the same"));
  }
  next();
});

const CashbankTransaction = mongoose.model("CashbankTransaction", cashbankTransactionSchema);
export default CashbankTransaction;