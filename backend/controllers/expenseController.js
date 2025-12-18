import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import { error } from "../utils/logger.js";

/**
 * @desc Get all expenses (only for current owner)
 * @route GET /api/expenses
 */
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    error(`Get all expenses failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Create new expense
 * @route POST /api/expenses
 */
export const createExpense = async (req, res) => {
  try {
    const { expenseNo, date, category, amount, paymentMethod, description, receipt } = req.body;

    if (!expenseNo || !date || !category || !amount) {
      return res.status(400).json({ message: "Expense number, date, category, and amount are required" });
    }

    // Check for duplicate expenseNo within this owner's expenses
    const existingExpense = await Expense.findOne({
      expenseNo,
      createdBy: req.user._id
    });

    if (existingExpense) {
      return res.status(400).json({ message: "Expense number already exists" });
    }

    const expense = await Expense.create({
      expenseNo,
      date,
      category,
      amount,
      paymentMethod: paymentMethod || 'cash',
      description,
      receipt,
      createdBy: req.user._id
    });

    res.status(201).json(expense);
  } catch (err) {
    error(`Create expense failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get single expense
 * @route GET /api/expenses/:id
 */
export const getExpenseById = async (req, res) => {
  try {
    // Validate ObjectId format
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

    res.status(200).json(expense);
  } catch (err) {
    error(`Get expense by ID failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Update expense
 * @route PUT /api/expenses/:id
 */
export const updateExpense = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense ID format" });
    }

    // First check if expense belongs to this user
    const expense = await Expense.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found or unauthorized" });
    }

    // Check for duplicate expenseNo if being updated
    if (req.body.expenseNo && req.body.expenseNo !== expense.expenseNo) {
      const existingExpense = await Expense.findOne({
        expenseNo: req.body.expenseNo,
        createdBy: req.user._id,
        _id: { $ne: req.params.id }
      });

      if (existingExpense) {
        return res.status(400).json({ message: "Expense number already exists" });
      }
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedExpense);
  } catch (err) {
    error(`Update expense failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Delete expense
 * @route DELETE /api/expenses/:id
 */
export const deleteExpense = async (req, res) => {
  try {
    // Validate ObjectId format
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

    await expense.deleteOne();
    res.status(200).json({ message: "Expense deleted" });
  } catch (err) {
    error(`Delete expense failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};