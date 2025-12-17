import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    billNo: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['paid', 'unpaid'],
      default: 'unpaid',
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Create compound unique index: billNo must be unique per user
billSchema.index({ billNo: 1, createdBy: 1 }, { unique: true });

const Bill = mongoose.model("Bill", billSchema);
export default Bill;