import mongoose from "mongoose";
import ExpenseCategory from "../models/ExpenseCategory.js";
import Expense from "../models/Expense.js";
import { info, error } from "../utils/logger.js";
import { getAllCategoryBudgetUtilization } from "../utils/budgetChecker.js";

/**
 * @desc Get all expense categories for the user
 * @route GET /api/expense-categories
 */
export const getAllCategories = async (req, res) => {
    try {
        const categories = await ExpenseCategory.find({
            userId: req.user._id,
            isActive: true
        }).sort({ isSystem: -1, name: 1 }); // System categories first, then alphabetically

        res.status(200).json(categories);
    } catch (err) {
        error(`Get all categories failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get single category by ID
 * @route GET /api/expense-categories/:id
 */
export const getCategoryById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid category ID format" });
        }

        const category = await ExpenseCategory.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json(category);
    } catch (err) {
        error(`Get category by ID failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Create new expense category
 * @route POST /api/expense-categories
 */
export const createCategory = async (req, res) => {
    try {
        const { name, description, monthlyBudget, yearlyBudget, color, icon } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        // Check for duplicate category name
        const existingCategory = await ExpenseCategory.findOne({
            name: name.trim(),
            userId: req.user._id
        });

        if (existingCategory) {
            return res.status(400).json({ message: "Category with this name already exists" });
        }

        const category = await ExpenseCategory.create({
            name: name.trim(),
            description: description?.trim() || '',
            monthlyBudget: monthlyBudget || null,
            yearlyBudget: yearlyBudget || null,
            color: color || '#6366f1',
            icon: icon || '💰',
            isSystem: false,
            isActive: true,
            userId: req.user._id
        });

        info(`Expense category created by ${req.user.name}: ${category.name}`);
        res.status(201).json(category);
    } catch (err) {
        error(`Create category failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Update expense category
 * @route PUT /api/expense-categories/:id
 */
export const updateCategory = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid category ID format" });
        }

        const category = await ExpenseCategory.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Prevent updating name of system categories
        if (category.isSystem && req.body.name && req.body.name !== category.name) {
            return res.status(400).json({ message: "Cannot change name of system category" });
        }

        // Check for duplicate name if name is being updated
        if (req.body.name && req.body.name !== category.name) {
            const existingCategory = await ExpenseCategory.findOne({
                name: req.body.name.trim(),
                userId: req.user._id,
                _id: { $ne: req.params.id }
            });

            if (existingCategory) {
                return res.status(400).json({ message: "Category with this name already exists" });
            }
        }

        // Update allowed fields
        const allowedUpdates = ['description', 'monthlyBudget', 'yearlyBudget', 'color', 'icon', 'isActive'];
        if (!category.isSystem) {
            allowedUpdates.push('name');
        }

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                category[field] = req.body[field];
            }
        });

        await category.save();

        info(`Expense category updated by ${req.user.name}: ${category.name}`);
        res.status(200).json(category);
    } catch (err) {
        error(`Update category failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Delete expense category
 * @route DELETE /api/expense-categories/:id
 */
export const deleteCategory = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid category ID format" });
        }

        const category = await ExpenseCategory.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Prevent deletion of system categories
        if (category.isSystem) {
            return res.status(400).json({ message: "Cannot delete system category" });
        }

        // Check if category is in use
        const expenseCount = await Expense.countDocuments({
            createdBy: req.user._id,
            category: category.name,
            isDeleted: false
        });

        if (expenseCount > 0) {
            return res.status(400).json({
                message: `Cannot delete category. It is used in ${expenseCount} expense(s). Please reassign or delete those expenses first.`
            });
        }

        await category.deleteOne();

        info(`Expense category deleted by ${req.user.name}: ${category.name}`);
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (err) {
        error(`Delete category failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get budget status for a category
 * @route GET /api/expense-categories/:id/budget-status
 */
export const getCategoryBudgetStatus = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid category ID format" });
        }

        const category = await ExpenseCategory.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const budgetStatus = {
            categoryName: category.name,
            monthlyBudget: category.monthlyBudget,
            yearlyBudget: category.yearlyBudget,
            monthly: null,
            yearly: null,
        };

        // Calculate monthly budget status
        if (category.monthlyBudget) {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

            const monthlyExpenses = await Expense.aggregate([
                {
                    $match: {
                        createdBy: req.user._id,
                        category: category.name,
                        date: { $gte: monthStart, $lte: monthEnd },
                        isDeleted: false,
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

            const spent = monthlyExpenses[0]?.total || 0;
            const count = monthlyExpenses[0]?.count || 0;
            const remaining = category.monthlyBudget - spent;
            const percentage = ((spent / category.monthlyBudget) * 100).toFixed(2);

            budgetStatus.monthly = {
                budget: category.monthlyBudget,
                spent,
                remaining,
                percentage,
                expenseCount: count,
                status: spent > category.monthlyBudget ? 'exceeded' : spent > category.monthlyBudget * 0.8 ? 'warning' : 'good',
            };
        }

        // Calculate yearly budget status
        if (category.yearlyBudget) {
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

            const yearlyExpenses = await Expense.aggregate([
                {
                    $match: {
                        createdBy: req.user._id,
                        category: category.name,
                        date: { $gte: yearStart, $lte: yearEnd },
                        isDeleted: false,
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

            const spent = yearlyExpenses[0]?.total || 0;
            const count = yearlyExpenses[0]?.count || 0;
            const remaining = category.yearlyBudget - spent;
            const percentage = ((spent / category.yearlyBudget) * 100).toFixed(2);

            budgetStatus.yearly = {
                budget: category.yearlyBudget,
                spent,
                remaining,
                percentage,
                expenseCount: count,
                status: spent > category.yearlyBudget ? 'exceeded' : spent > category.yearlyBudget * 0.8 ? 'warning' : 'good',
            };
        }

        res.status(200).json(budgetStatus);
    } catch (err) {
        error(`Get category budget status failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get budget utilization for all categories
 * @route GET /api/expense-categories/budget-utilization
 */
export const getAllBudgetUtilization = async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;

        if (!['monthly', 'yearly'].includes(period)) {
            return res.status(400).json({ message: "Period must be 'monthly' or 'yearly'" });
        }

        const utilization = await getAllCategoryBudgetUtilization(req.user._id, period);

        res.status(200).json({
            period,
            categories: utilization,
            summary: {
                totalCategories: utilization.length,
                exceeded: utilization.filter(c => c.status === 'exceeded').length,
                warning: utilization.filter(c => c.status === 'warning').length,
                good: utilization.filter(c => c.status === 'good').length,
            }
        });
    } catch (err) {
        error(`Get all budget utilization failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Seed default categories for user
 * @route POST /api/expense-categories/seed-defaults
 */
export const seedDefaultCategories = async (req, res) => {
    try {
        await ExpenseCategory.seedDefaultCategories(req.user._id);

        const categories = await ExpenseCategory.find({
            userId: req.user._id,
            isSystem: true
        });

        info(`Default expense categories seeded for ${req.user.name}`);
        res.status(201).json({
            message: "Default categories created successfully",
            categories
        });
    } catch (err) {
        error(`Seed default categories failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
