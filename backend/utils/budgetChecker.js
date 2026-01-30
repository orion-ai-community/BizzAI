import Expense from "../models/Expense.js";
import ExpenseCategory from "../models/ExpenseCategory.js";

/**
 * Check if expense exceeds category budget
 * @param {ObjectId} userId - User ID
 * @param {string} categoryName - Category name
 * @param {number} amount - Expense amount
 * @param {Date} expenseDate - Expense date
 * @returns {Promise<Object>} Budget check result with warnings
 */
export const checkCategoryBudget = async (userId, categoryName, amount, expenseDate = new Date()) => {
    const result = {
        withinBudget: true,
        warnings: [],
        budgetInfo: null,
    };

    try {
        // Get category with budget info
        const category = await ExpenseCategory.findOne({
            userId,
            name: categoryName,
            isActive: true,
        });

        if (!category) {
            return result; // No category found, no budget to check
        }

        // If no budgets set, return early
        if (!category.monthlyBudget && !category.yearlyBudget) {
            return result;
        }

        result.budgetInfo = {
            categoryName: category.name,
            monthlyBudget: category.monthlyBudget,
            yearlyBudget: category.yearlyBudget,
        };

        const expenseMonth = expenseDate.getMonth();
        const expenseYear = expenseDate.getFullYear();

        // Check monthly budget
        if (category.monthlyBudget) {
            const monthStart = new Date(expenseYear, expenseMonth, 1);
            const monthEnd = new Date(expenseYear, expenseMonth + 1, 0, 23, 59, 59, 999);

            const monthlyExpenses = await Expense.aggregate([
                {
                    $match: {
                        createdBy: userId,
                        category: categoryName,
                        date: { $gte: monthStart, $lte: monthEnd },
                        isDeleted: false,
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            const currentMonthlySpend = monthlyExpenses[0]?.total || 0;
            const projectedMonthlySpend = currentMonthlySpend + amount;

            result.budgetInfo.monthlySpent = currentMonthlySpend;
            result.budgetInfo.monthlyRemaining = category.monthlyBudget - currentMonthlySpend;
            result.budgetInfo.monthlyUtilization = ((currentMonthlySpend / category.monthlyBudget) * 100).toFixed(2);

            if (projectedMonthlySpend > category.monthlyBudget) {
                result.withinBudget = false;
                const overspend = projectedMonthlySpend - category.monthlyBudget;
                result.warnings.push({
                    type: 'monthly',
                    message: `This expense will exceed your monthly budget for ${categoryName} by ₹${overspend.toFixed(2)}`,
                    severity: 'high',
                    budget: category.monthlyBudget,
                    currentSpend: currentMonthlySpend,
                    projectedSpend: projectedMonthlySpend,
                });
            } else if (projectedMonthlySpend > category.monthlyBudget * 0.8) {
                // Warning at 80% utilization
                result.warnings.push({
                    type: 'monthly',
                    message: `This expense will use ${((projectedMonthlySpend / category.monthlyBudget) * 100).toFixed(0)}% of your monthly budget for ${categoryName}`,
                    severity: 'medium',
                    budget: category.monthlyBudget,
                    currentSpend: currentMonthlySpend,
                    projectedSpend: projectedMonthlySpend,
                });
            }
        }

        // Check yearly budget
        if (category.yearlyBudget) {
            const yearStart = new Date(expenseYear, 0, 1);
            const yearEnd = new Date(expenseYear, 11, 31, 23, 59, 59, 999);

            const yearlyExpenses = await Expense.aggregate([
                {
                    $match: {
                        createdBy: userId,
                        category: categoryName,
                        date: { $gte: yearStart, $lte: yearEnd },
                        isDeleted: false,
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            const currentYearlySpend = yearlyExpenses[0]?.total || 0;
            const projectedYearlySpend = currentYearlySpend + amount;

            result.budgetInfo.yearlySpent = currentYearlySpend;
            result.budgetInfo.yearlyRemaining = category.yearlyBudget - currentYearlySpend;
            result.budgetInfo.yearlyUtilization = ((currentYearlySpend / category.yearlyBudget) * 100).toFixed(2);

            if (projectedYearlySpend > category.yearlyBudget) {
                result.withinBudget = false;
                const overspend = projectedYearlySpend - category.yearlyBudget;
                result.warnings.push({
                    type: 'yearly',
                    message: `This expense will exceed your yearly budget for ${categoryName} by ₹${overspend.toFixed(2)}`,
                    severity: 'high',
                    budget: category.yearlyBudget,
                    currentSpend: currentYearlySpend,
                    projectedSpend: projectedYearlySpend,
                });
            } else if (projectedYearlySpend > category.yearlyBudget * 0.8) {
                // Warning at 80% utilization
                result.warnings.push({
                    type: 'yearly',
                    message: `This expense will use ${((projectedYearlySpend / category.yearlyBudget) * 100).toFixed(0)}% of your yearly budget for ${categoryName}`,
                    severity: 'medium',
                    budget: category.yearlyBudget,
                    currentSpend: currentYearlySpend,
                    projectedSpend: projectedYearlySpend,
                });
            }
        }

        return result;
    } catch (error) {
        // Don't fail the expense creation if budget check fails
        console.error('Budget check error:', error);
        return result;
    }
};

/**
 * Get budget utilization for all categories
 * @param {ObjectId} userId - User ID
 * @param {string} period - 'monthly' or 'yearly'
 * @returns {Promise<Array>} Budget utilization for all categories
 */
export const getAllCategoryBudgetUtilization = async (userId, period = 'monthly') => {
    const categories = await ExpenseCategory.find({
        userId,
        isActive: true,
        [period === 'monthly' ? 'monthlyBudget' : 'yearlyBudget']: { $ne: null }
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let startDate, endDate;
    if (period === 'monthly') {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    } else {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    const utilization = await Promise.all(
        categories.map(async (category) => {
            const expenses = await Expense.aggregate([
                {
                    $match: {
                        createdBy: userId,
                        category: category.name,
                        date: { $gte: startDate, $lte: endDate },
                        isDeleted: false,
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            const spent = expenses[0]?.total || 0;
            const budget = period === 'monthly' ? category.monthlyBudget : category.yearlyBudget;
            const percentage = budget > 0 ? ((spent / budget) * 100).toFixed(2) : 0;

            return {
                categoryId: category._id,
                categoryName: category.name,
                budget,
                spent,
                remaining: budget - spent,
                percentage,
                status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good',
            };
        })
    );

    return utilization.sort((a, b) => b.percentage - a.percentage);
};
