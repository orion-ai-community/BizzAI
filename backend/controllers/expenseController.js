import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import ExpenseCategory from "../models/ExpenseCategory.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import BankAccount from "../models/BankAccount.js";
import { info, error } from "../utils/logger.js";
import { generateExpenseNumber } from "../utils/expenseNumberGenerator.js";
import { checkCategoryBudget } from "../utils/budgetChecker.js";
import { exportToPDF, exportToExcel, exportToCSV, getExportFilename } from "../utils/expenseExport.js";

/**
 * @desc Get all expenses with advanced filtering, pagination, and sorting
 * @route GET /api/expenses
 */
export const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      sortBy = 'date',
      sortOrder = 'desc',
      category,
      status,
      paymentMethod,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      search,
      includeDeleted = 'false'
    } = req.query;

    // Build query
    const query = { createdBy: req.user._id };

    // Include deleted filter
    if (includeDeleted === 'false') {
      query.isDeleted = false;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Payment method filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.date.$lte = endDate;
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { expenseNo: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
        { referenceNumber: searchRegex },
        { notes: searchRegex }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [expenses, totalCount] = await Promise.all([
      Expense.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('bankAccount', 'bankName accountType')
        .lean(),
      Expense.countDocuments(query)
    ]);

    // Calculate summary stats
    const summaryPipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ];
    const summary = await Expense.aggregate(summaryPipeline);

    res.status(200).json({
      expenses,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      },
      summary: {
        totalAmount: summary[0]?.totalAmount || 0,
        totalCount: summary[0]?.count || 0
      }
    });
  } catch (err) {
    error(`Get all expenses failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Create new expense with full validation and financial integration
 * @route POST /api/expenses
 */
export const createExpense = async (req, res) => {
  try {
    const {
      date,
      category,
      description,
      amount,
      paymentMethod = 'cash',
      bankAccount,
      referenceNumber,
      status = 'Paid',
      attachments = [],
      notes = ''
    } = req.body;

    // Validation
    if (!date || !category || !description || !amount) {
      return res.status(400).json({
        message: "Date, category, description, and amount are required"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Validate date is not in future
    const expenseDate = new Date(date);
    if (expenseDate > new Date()) {
      return res.status(400).json({ message: "Date cannot be in the future" });
    }

    // Validate bank account for non-cash payments
    if (['upi', 'card', 'cheque', 'bank_transfer'].includes(paymentMethod)) {
      if (!bankAccount) {
        return res.status(400).json({
          message: `Bank account is required for ${paymentMethod} payment method`
        });
      }

      const bankAcc = await BankAccount.findOne({
        _id: bankAccount,
        userId: req.user._id
      });

      if (!bankAcc) {
        return res.status(400).json({ message: 'Bank account not found' });
      }

      if (bankAcc.currentBalance < amount) {
        return res.status(400).json({
          message: `Insufficient balance. Available: ₹${bankAcc.currentBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}, Shortfall: ₹${(amount - bankAcc.currentBalance).toFixed(2)}`
        });
      }
    }

    // Validate reference number for cheque
    if (paymentMethod === 'cheque' && (!referenceNumber || referenceNumber.trim() === '')) {
      return res.status(400).json({
        message: "Reference number is required for cheque payments"
      });
    }

    // Check if category exists
    const categoryExists = await ExpenseCategory.findOne({
      userId: req.user._id,
      name: category,
      isActive: true
    });

    if (!categoryExists) {
      return res.status(400).json({
        message: `Category '${category}' not found. Please create it first.`
      });
    }

    // Check budget (warning only, doesn't block)
    const budgetCheck = await checkCategoryBudget(req.user._id, category, amount, expenseDate);

    // Generate expense number
    const expenseNo = await generateExpenseNumber(req.user._id);

    // Create expense
    const expense = await Expense.create({
      expenseNo,
      date: expenseDate,
      category,
      description,
      amount,
      paymentMethod,
      bankAccount: bankAccount || null,
      referenceNumber: referenceNumber || null,
      status,
      attachments,
      notes,
      isDeleted: false,
      createdBy: req.user._id
    });

    // Create financial transaction
    let cashbankTxn = null;

    if (status === 'Paid') {
      try {
        if (paymentMethod === 'cash') {
          // Cash payment
          cashbankTxn = await CashbankTransaction.create({
            type: 'out',
            amount,
            fromAccount: 'cash',
            toAccount: 'expense',
            description: `Expense: ${category} - ${description}`,
            reference: expenseNo,
            date: expenseDate,
            userId: req.user._id,
          });

          info(`Cash payment for expense ${expenseNo}: -₹${amount}`);
        } else {
          // Bank payment (UPI, Card, Cheque, Bank Transfer)
          cashbankTxn = await CashbankTransaction.create({
            type: 'out',
            amount,
            fromAccount: bankAccount,
            toAccount: 'expense',
            description: `Expense: ${category} - ${description}`,
            reference: referenceNumber || expenseNo,
            date: expenseDate,
            userId: req.user._id,
          });

          // Update bank balance
          await BankAccount.updateOne(
            { _id: bankAccount, userId: req.user._id },
            {
              $inc: { currentBalance: -amount },
              $push: { transactions: cashbankTxn._id }
            }
          );

          info(`Bank payment for expense ${expenseNo}: -₹${amount} from account ${bankAccount}`);
        }
      } catch (txnError) {
        // Rollback: delete the expense if transaction creation fails
        await Expense.deleteOne({ _id: expense._id });
        error(`Transaction creation failed, expense rolled back: ${txnError.message}`);
        return res.status(500).json({
          message: "Failed to create financial transaction. Expense not created.",
          error: txnError.message
        });
      }
    }

    info(`Expense created successfully: ${expenseNo} - ₹${amount}`);

    res.status(201).json({
      expense,
      budgetWarnings: budgetCheck.warnings,
      transaction: cashbankTxn
    });
  } catch (err) {
    error(`Create expense failed: ${err.message}`);
    res.status(500).json({
      message: "Failed to create expense",
      error: err.message
    });
  }
};

/**
 * @desc Get single expense by ID
 * @route GET /api/expenses/:id
 */
export const getExpenseById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID format" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })
      .populate('bankAccount', 'bankName accountType accountNumber')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: "Expense not found or unauthorized" });
    }

    // Get related transactions
    const transactions = await CashbankTransaction.find({
      userId: req.user._id,
      reference: expense.expenseNo
    }).sort({ createdAt: -1 });

    res.status(200).json({
      expense,
      transactions
    });
  } catch (err) {
    error(`Get expense by ID failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Update expense with financial recalculation
 * @route PUT /api/expenses/:id
 */
export const updateExpense = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID format" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found or unauthorized" });
    }

    // Prevent editing expense number
    if (req.body.expenseNo && req.body.expenseNo !== expense.expenseNo) {
      return res.status(400).json({ message: "Cannot change expense number" });
    }

    // Store old values for financial reversal
    const oldAmount = expense.amount;
    const oldPaymentMethod = expense.paymentMethod;
    const oldBankAccount = expense.bankAccount;
    const oldStatus = expense.status;

    // Update expense fields
    const allowedFields = [
      'date', 'category', 'description', 'amount', 'paymentMethod',
      'bankAccount', 'referenceNumber', 'status', 'attachments', 'notes'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    expense.updatedBy = req.user._id;

    // Validate updated expense
    await expense.validate();

    // Handle financial impact if amount, payment method, or status changed
    const amountChanged = oldAmount !== expense.amount;
    const paymentMethodChanged = oldPaymentMethod !== expense.paymentMethod;
    const statusChanged = oldStatus !== expense.status;

    if (amountChanged || paymentMethodChanged || statusChanged) {
      // Reverse old transaction if it was Paid
      if (oldStatus === 'Paid') {
        if (oldPaymentMethod === 'cash') {
          // No bank balance to reverse for cash
        } else if (oldBankAccount) {
          // Reverse bank deduction (add money back)
          await BankAccount.updateOne(
            { _id: oldBankAccount, userId: req.user._id },
            { $inc: { currentBalance: oldAmount } }
          );
        }
      }

      // Apply new transaction if status is Paid
      if (expense.status === 'Paid') {
        if (expense.paymentMethod === 'cash') {
          // Create new cash transaction
          await CashbankTransaction.create({
            type: 'out',
            amount: expense.amount,
            fromAccount: 'cash',
            toAccount: 'expense',
            description: `Expense (Updated): ${expense.category} - ${expense.description}`,
            reference: expense.expenseNo,
            date: expense.date,
            userId: req.user._id,
          });
        } else if (expense.bankAccount) {
          // Validate bank balance
          const bankAcc = await BankAccount.findOne({
            _id: expense.bankAccount,
            userId: req.user._id
          });

          if (!bankAcc) {
            // Rollback: restore old bank balance if we reversed it
            if (oldStatus === 'Paid' && oldBankAccount) {
              await BankAccount.updateOne(
                { _id: oldBankAccount, userId: req.user._id },
                { $inc: { currentBalance: -oldAmount } }
              );
            }
            return res.status(400).json({ message: 'Bank account not found' });
          }

          if (bankAcc.currentBalance < expense.amount) {
            // Rollback: restore old bank balance if we reversed it
            if (oldStatus === 'Paid' && oldBankAccount) {
              await BankAccount.updateOne(
                { _id: oldBankAccount, userId: req.user._id },
                { $inc: { currentBalance: -oldAmount } }
              );
            }
            return res.status(400).json({
              message: `Insufficient balance. Available: Rs. ${bankAcc.currentBalance.toFixed(2)}`
            });
          }

          // Create new bank transaction
          const cashbankTxn = await CashbankTransaction.create({
            type: 'out',
            amount: expense.amount,
            fromAccount: expense.bankAccount,
            toAccount: 'expense',
            description: `Expense (Updated): ${expense.category} - ${expense.description}`,
            reference: expense.referenceNumber || expense.expenseNo,
            date: expense.date,
            userId: req.user._id,
          });

          // Deduct from bank
          await BankAccount.updateOne(
            { _id: expense.bankAccount, userId: req.user._id },
            {
              $inc: { currentBalance: -expense.amount },
              $push: { transactions: cashbankTxn._id }
            }
          );
        }
      }
    }

    await expense.save();

    info(`Expense updated by ${req.user.name}: ${expense.expenseNo}`);
    res.status(200).json(expense);
  } catch (err) {
    error(`Update expense failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Soft delete expense (default)
 * @route DELETE /api/expenses/:id
 */
export const deleteExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid expense ID format" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    }).session(session);

    if (!expense) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Expense not found or unauthorized" });
    }

    // Soft delete
    expense.isDeleted = true;
    expense.updatedBy = req.user._id;
    await expense.save({ session });

    // Reverse financial transaction if it was Paid
    if (expense.status === 'Paid') {
      if (expense.paymentMethod === 'cash') {
        // Create reversal transaction
        await CashbankTransaction.create([{
          type: 'in',
          amount: expense.amount,
          fromAccount: 'expense',
          toAccount: 'cash',
          description: `Expense Deleted (Reversal): ${expense.category} - ${expense.description}`,
          reference: `REV-${expense.expenseNo}`,
          date: new Date(),
          userId: req.user._id,
        }], { session });
      } else if (expense.bankAccount) {
        // Add money back to bank
        await BankAccount.updateOne(
          { _id: expense.bankAccount, userId: req.user._id },
          { $inc: { currentBalance: expense.amount } },
          { session }
        );

        // Create reversal transaction
        await CashbankTransaction.create([{
          type: 'in',
          amount: expense.amount,
          fromAccount: 'expense',
          toAccount: expense.bankAccount,
          description: `Expense Deleted (Reversal): ${expense.category} - ${expense.description}`,
          reference: `REV-${expense.expenseNo}`,
          date: new Date(),
          userId: req.user._id,
        }], { session });
      }
    }

    await session.commitTransaction();

    info(`Expense soft deleted by ${req.user.name}: ${expense.expenseNo}`);
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (err) {
    await session.abortTransaction();
    error(`Delete expense failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc Restore soft-deleted expense
 * @route POST /api/expenses/:id/restore
 */
export const restoreExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid expense ID format" });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
      isDeleted: true
    }).session(session);

    if (!expense) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Deleted expense not found" });
    }

    // Restore expense
    expense.isDeleted = false;
    expense.updatedBy = req.user._id;
    await expense.save({ session });

    // Recreate financial transaction if it was Paid
    if (expense.status === 'Paid') {
      if (expense.paymentMethod === 'cash') {
        await CashbankTransaction.create([{
          type: 'out',
          amount: expense.amount,
          fromAccount: 'cash',
          toAccount: 'expense',
          description: `Expense Restored: ${expense.category} - ${expense.description}`,
          reference: expense.expenseNo,
          date: expense.date,
          userId: req.user._id,
        }], { session });
      } else if (expense.bankAccount) {
        // Check bank balance
        const bankAcc = await BankAccount.findOne({
          _id: expense.bankAccount,
          userId: req.user._id
        }).session(session);

        if (!bankAcc) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Bank account not found' });
        }

        if (bankAcc.currentBalance < expense.amount) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Cannot restore: Insufficient bank balance. Available: ₹${bankAcc.currentBalance.toFixed(2)}`
          });
        }

        // Deduct from bank
        await BankAccount.updateOne(
          { _id: expense.bankAccount, userId: req.user._id },
          { $inc: { currentBalance: -expense.amount } },
          { session }
        );

        await CashbankTransaction.create([{
          type: 'out',
          amount: expense.amount,
          fromAccount: expense.bankAccount,
          toAccount: 'expense',
          description: `Expense Restored: ${expense.category} - ${expense.description}`,
          reference: expense.expenseNo,
          date: expense.date,
          userId: req.user._id,
        }], { session });
      }
    }

    await session.commitTransaction();

    info(`Expense restored by ${req.user.name}: ${expense.expenseNo}`);
    res.status(200).json({ message: "Expense restored successfully", expense });
  } catch (err) {
    await session.abortTransaction();
    error(`Restore expense failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc Get expense summary for dashboard
 * @route GET /api/expenses/summary
 */
export const getExpenseSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Total expenses (all time)
    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // This month expenses
    const monthExpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          isDeleted: false,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Category-wise breakdown
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Payment method distribution
    const paymentMethodDistribution = await Expense.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      totalExpenses: {
        amount: totalExpenses[0]?.total || 0,
        count: totalExpenses[0]?.count || 0
      },
      thisMonth: {
        amount: monthExpenses[0]?.total || 0,
        count: monthExpenses[0]?.count || 0
      },
      categoryBreakdown,
      paymentMethodDistribution
    });
  } catch (err) {
    error(`Get expense summary failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get expense analytics
 * @route GET /api/expenses/analytics
 */
export const getExpenseAnalytics = async (req, res) => {
  try {
    const { period = 'year' } = req.query;
    const now = new Date();
    let startDate;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(0); // All time
    }

    // Monthly trend (last 12 months)
    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          isDeleted: false,
          date: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Average, highest, lowest
    const stats = await Expense.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          isDeleted: false,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgExpense: { $avg: '$amount' },
          maxExpense: { $max: '$amount' },
          minExpense: { $min: '$amount' }
        }
      }
    ]);

    // Top 10 expenses
    const topExpenses = await Expense.find({
      createdBy: req.user._id,
      isDeleted: false,
      date: { $gte: startDate }
    })
      .sort({ amount: -1 })
      .limit(10)
      .select('expenseNo date category description amount');

    res.status(200).json({
      monthlyTrend,
      stats: stats[0] || { avgExpense: 0, maxExpense: 0, minExpense: 0 },
      topExpenses
    });
  } catch (err) {
    error(`Get expense analytics failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Detect recurring expenses
 * @route GET /api/expenses/recurring
 */
export const getRecurringExpenses = async (req, res) => {
  try {
    // Find expenses with same category and similar amount (±10%) in consecutive months
    const expenses = await Expense.find({
      createdBy: req.user._id,
      isDeleted: false
    }).sort({ category: 1, date: 1 });

    const recurring = [];
    const categoryGroups = {};

    // Group by category
    expenses.forEach(exp => {
      if (!categoryGroups[exp.category]) {
        categoryGroups[exp.category] = [];
      }
      categoryGroups[exp.category].push(exp);
    });

    // Detect patterns
    Object.keys(categoryGroups).forEach(category => {
      const exps = categoryGroups[category];
      if (exps.length < 3) return; // Need at least 3 occurrences

      // Check for monthly pattern
      for (let i = 0; i < exps.length - 2; i++) {
        const exp1 = exps[i];
        const exp2 = exps[i + 1];
        const exp3 = exps[i + 2];

        const amount1 = exp1.amount;
        const amount2 = exp2.amount;
        const amount3 = exp3.amount;

        // Check if amounts are similar (±10%)
        const avgAmount = (amount1 + amount2 + amount3) / 3;
        const tolerance = avgAmount * 0.1;

        if (
          Math.abs(amount1 - avgAmount) <= tolerance &&
          Math.abs(amount2 - avgAmount) <= tolerance &&
          Math.abs(amount3 - avgAmount) <= tolerance
        ) {
          recurring.push({
            category,
            averageAmount: avgAmount,
            occurrences: [exp1, exp2, exp3],
            pattern: 'monthly'
          });
          break;
        }
      }
    });

    res.status(200).json({ recurring });
  } catch (err) {
    error(`Get recurring expenses failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Bulk delete expenses
 * @route POST /api/expenses/bulk-delete
 */
export const bulkDeleteExpenses = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { expenseIds } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Expense IDs array is required" });
    }

    // Validate all IDs
    const invalidIds = expenseIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid expense ID format" });
    }

    // Find all expenses
    const expenses = await Expense.find({
      _id: { $in: expenseIds },
      createdBy: req.user._id,
      isDeleted: false
    }).session(session);

    if (expenses.length === 0) {
      await session.abortTransaction();
      return res.status(404).json({ message: "No expenses found" });
    }

    // Soft delete all and reverse transactions
    for (const expense of expenses) {
      expense.isDeleted = true;
      expense.updatedBy = req.user._id;
      await expense.save({ session });

      // Reverse financial transaction if Paid
      if (expense.status === 'Paid') {
        if (expense.paymentMethod === 'cash') {
          await CashbankTransaction.create([{
            type: 'in',
            amount: expense.amount,
            fromAccount: 'expense',
            toAccount: 'cash',
            description: `Bulk Delete Reversal: ${expense.expenseNo}`,
            reference: `REV-${expense.expenseNo}`,
            date: new Date(),
            userId: req.user._id,
          }], { session });
        } else if (expense.bankAccount) {
          await BankAccount.updateOne(
            { _id: expense.bankAccount, userId: req.user._id },
            { $inc: { currentBalance: expense.amount } },
            { session }
          );

          await CashbankTransaction.create([{
            type: 'in',
            amount: expense.amount,
            fromAccount: 'expense',
            toAccount: expense.bankAccount,
            description: `Bulk Delete Reversal: ${expense.expenseNo}`,
            reference: `REV-${expense.expenseNo}`,
            date: new Date(),
            userId: req.user._id,
          }], { session });
        }
      }
    }

    await session.commitTransaction();

    info(`Bulk delete: ${expenses.length} expenses deleted by ${req.user.name}`);
    res.status(200).json({
      message: `${expenses.length} expense(s) deleted successfully`,
      deletedCount: expenses.length
    });
  } catch (err) {
    await session.abortTransaction();
    error(`Bulk delete expenses failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * @desc Bulk update category
 * @route PUT /api/expenses/bulk-update-category
 */
export const bulkUpdateCategory = async (req, res) => {
  try {
    const { expenseIds, newCategory } = req.body;

    if (!expenseIds || !Array.isArray(expenseIds) || !newCategory) {
      return res.status(400).json({
        message: "Expense IDs array and new category are required"
      });
    }

    // Validate category exists
    const categoryExists = await ExpenseCategory.findOne({
      userId: req.user._id,
      name: newCategory,
      isActive: true
    });

    if (!categoryExists) {
      return res.status(400).json({
        message: `Category '${newCategory}' not found`
      });
    }

    // Update all expenses
    const result = await Expense.updateMany(
      {
        _id: { $in: expenseIds },
        createdBy: req.user._id,
        isDeleted: false
      },
      {
        $set: {
          category: newCategory,
          updatedBy: req.user._id
        }
      }
    );

    info(`Bulk update: ${result.modifiedCount} expenses updated by ${req.user.name}`);
    res.status(200).json({
      message: `${result.modifiedCount} expense(s) updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    error(`Bulk update category failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Export expenses
 * @route GET /api/expenses/export
 */
export const exportExpenses = async (req, res) => {
  try {
    const { format = 'pdf', ...filters } = req.query;

    // Get filtered expenses
    const query = { createdBy: req.user._id, isDeleted: false };

    // Apply filters (same as getAllExpenses)
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.date.$lte = endDate;
      }
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate('bankAccount', 'bankName')
      .lean();

    const user = req.user;
    const filename = getExportFilename(format);

    if (format === 'pdf') {
      const pdfBuffer = await exportToPDF(expenses, user, filters);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } else if (format === 'excel') {
      const excelBuffer = await exportToExcel(expenses, user, filters);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } else if (format === 'csv') {
      const csv = exportToCSV(expenses);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      res.status(400).json({ message: "Invalid format. Use 'pdf', 'excel', or 'csv'" });
    }
  } catch (err) {
    error(`Export expenses failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};