import Invoice from "../models/Invoice.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
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