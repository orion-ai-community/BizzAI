import Invoice from "../models/Invoice.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
import Expense from "../models/Expense.js";
import { generateAIReport } from "../utils/aiReportHelper.js";
import { checkStockAlerts } from "../utils/stockAlert.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Generate Sales Report (daily/weekly/monthly) - Only for current owner
 * @route GET /api/reports/sales
 */
export const getSalesReport = async (req, res) => {
  try {
    // Only get invoices and items for current user
    const invoices = await Invoice.find({ createdBy: req.user._id });
    const items = await Item.find({ addedBy: req.user._id });

    const report = generateAIReport(invoices, items);
    const stockAlerts = await checkStockAlerts(req.user._id);

    info(`Sales report generated for ${req.user.name} with ${report.summary.totalInvoices} invoices`);

    res.status(200).json({ report, stockAlerts });
  } catch (err) {
    error(`Report Generation Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get Stock Report (only for current owner)
 * @route GET /api/reports/stock
 */
export const getStockReport = async (req, res) => {
  try {
    const items = await Item.find({ addedBy: req.user._id }).sort({ stockQty: 1 });
    const lowStock = items.filter((i) => i.stockQty <= i.lowStockLimit);
    res.status(200).json({ totalItems: items.length, lowStock });
  } catch (err) {
    error(`Stock Report Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get Customer Dues Report (only for current owner)
 * @route GET /api/reports/customers
 */
export const getCustomerReport = async (req, res) => {
  try {
    const customers = await Customer.find({
      owner: req.user._id,
      dues: { $gt: 0 }
    }).sort({ dues: -1 });
    res.status(200).json(customers);
  } catch (err) {
    error(`Customer Report Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get Dashboard Statistics for Graphs
 * @route GET /api/reports/dashboard-stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Sales over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySales = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. Revenue vs Expenses (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          createdBy: userId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          createdBy: userId,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          expenses: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Combine monthly revenue and expenses
    const months = Array.from(new Set([
      ...monthlyRevenue.map(r => r._id),
      ...monthlyExpenses.map(e => e._id)
    ])).sort();

    const revenueVsExpenses = months.map(month => ({
      month,
      revenue: monthlyRevenue.find(r => r._id === month)?.revenue || 0,
      expenses: monthlyExpenses.find(e => e._id === month)?.expenses || 0
    }));

    // 3. Payment methods distribution (Invoices)
    const paymentMethods = await Invoice.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // 4. Outstanding dues trend (Top 5 customers)
    const topCustomersWithDues = await Customer.find({
      owner: userId,
      dues: { $gt: 0 }
    })
      .sort({ dues: -1 })
      .limit(5)
      .select('name dues');

    res.status(200).json({
      dailySales,
      revenueVsExpenses,
      paymentMethods,
      topCustomersWithDues
    });
  } catch (err) {
    error(`Dashboard Stats Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};