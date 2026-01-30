import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    expenseNo: {
      type: String,
      required: [true, "Expense number is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      validate: {
        validator: function (value) {
          // Prevent future dates
          return value <= new Date();
        },
        message: "Date cannot be in the future"
      }
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'upi', 'card', 'cheque', 'bank_transfer'],
        message: '{VALUE} is not a valid payment method'
      },
      default: 'cash',
    },
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      validate: {
        validator: function (value) {
          // Bank account required for non-cash payments
          if (['upi', 'card', 'cheque', 'bank_transfer'].includes(this.paymentMethod)) {
            return value != null;
          }
          return true;
        },
        message: "Bank account is required for {PATH} payment method"
      }
    },
    referenceNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          // Reference number required for cheque payments
          if (this.paymentMethod === 'cheque') {
            return value != null && value.length > 0;
          }
          return true;
        },
        message: "Reference number is required for cheque payments"
      }
    },
    status: {
      type: String,
      enum: {
        values: ['Paid', 'Pending', 'Cancelled'],
        message: '{VALUE} is not a valid status'
      },
      default: 'Paid',
      index: true,
    },
    attachments: {
      type: [String], // Array of URLs to uploaded receipt files
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for performance optimization
expenseSchema.index({ expenseNo: 1, createdBy: 1 }, { unique: true });
expenseSchema.index({ createdBy: 1, date: -1 }); // For date-sorted queries
expenseSchema.index({ createdBy: 1, category: 1 }); // For category filtering
expenseSchema.index({ createdBy: 1, status: 1 }); // For status filtering
expenseSchema.index({ createdBy: 1, isDeleted: 1, date: -1 }); // For active expenses list

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function () {
  return `₹${this.amount.toFixed(2)}`;
});

// Pre-save middleware to validate conditional fields
expenseSchema.pre('save', function (next) {
  // Validate bank account for non-cash payments
  if (['upi', 'card', 'cheque', 'bank_transfer'].includes(this.paymentMethod)) {
    if (!this.bankAccount) {
      return next(new Error(`Bank account is required for ${this.paymentMethod} payment method`));
    }
  }

  // Validate reference number for cheque payments
  if (this.paymentMethod === 'cheque' && (!this.referenceNumber || this.referenceNumber.trim() === '')) {
    return next(new Error('Reference number is required for cheque payments'));
  }

  next();
});

// Static method to get expenses with filters
expenseSchema.statics.getFilteredExpenses = async function (userId, filters = {}) {
  const query = { createdBy: userId, isDeleted: false };

  // Category filter
  if (filters.category) {
    query.category = filters.category;
  }

  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }

  // Payment method filter
  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    query.date = {};
    if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
  }

  // Amount range filter
  if (filters.minAmount || filters.maxAmount) {
    query.amount = {};
    if (filters.minAmount) query.amount.$gte = parseFloat(filters.minAmount);
    if (filters.maxAmount) query.amount.$lte = parseFloat(filters.maxAmount);
  }

  // Search filter (expense number, category, description, reference)
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { expenseNo: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
      { referenceNumber: searchRegex }
    ];
  }

  return this.find(query);
};

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;