import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    expenseNo: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Rent',
        'Utilities',
        'Salaries',
        'Transportation',
        'Marketing',
        'Office Supplies',
        'Maintenance',
        'Insurance',
        'Professional Fees',
        'Miscellaneous'
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'cheque', 'bank_transfer'],
      default: 'cash',
    },
    description: {
      type: String,
    },
    receipt: {
      type: String, // URL to uploaded receipt file
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Create compound unique index: expenseNo must be unique per user
expenseSchema.index({ expenseNo: 1, createdBy: 1 }, { unique: true });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;