import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import BankAccount from "../models/BankAccount.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Get sales invoice summary with actual customer dues
 * @route GET /api/sales-invoice/summary
 */
export const getSalesInvoiceSummary = async (req, res) => {
  try {
    // Get all invoices for this user
    const invoices = await Invoice.find({ createdBy: req.user._id });

    // Calculate invoice totals
    const totalInvoices = invoices.length;
    const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

    // Get actual customer dues (source of truth)
    // Sum all positive dues (customers who owe money)
    const customers = await Customer.find({ owner: req.user._id });
    const outstandingDues = customers.reduce((sum, customer) => {
      return sum + (customer.dues > 0 ? customer.dues : 0);
    }, 0);

    res.status(200).json({
      totalInvoices,
      totalSales,
      totalPaid,
      outstandingDues
    });
  } catch (err) {
    error(`Get sales invoice summary failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get all sales invoices (only for current owner)
 * @route GET /api/sales-invoice/invoices
 */
export const getAllSalesInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ createdBy: req.user._id })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (err) {
    error(`Get all sales invoices failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get single sales invoice
 * @route GET /api/sales-invoice/invoice/:id
 */
export const getSalesInvoiceById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid invoice ID format" });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })
      .populate("customer")
      .populate("items.item", "name sku");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found or unauthorized" });
    }

    // Transform items to include name property at root level for frontend compatibility
    const transformedInvoice = invoice.toObject();
    transformedInvoice.items = transformedInvoice.items.map(item => ({
      ...item,
      name: item.item?.name || 'Item',
      sku: item.item?.sku || ''
    }));

    res.status(200).json(transformedInvoice);
  } catch (err) {
    error(`Get sales invoice by ID failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Delete sales invoice
 * @route DELETE /api/sales-invoice/invoice/:id
 */
export const deleteSalesInvoice = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid invoice ID format" });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found or unauthorized" });
    }

    await invoice.deleteOne();
    res.status(200).json({ message: "Invoice deleted" });
  } catch (err) {
    error(`Delete sales invoice failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Mark sales invoice as paid with bank account selection
 * @route PUT /api/sales-invoice/invoice/:id/mark-paid
 */
export const markSalesInvoiceAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, bankAccount, paymentMethod = 'bank_transfer' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid payment amount is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid invoice ID format" });
    }

    // Find invoice
    const invoice = await Invoice.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found or unauthorized" });
    }

    // Check if invoice is already fully paid
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({ message: "Invoice is already fully paid" });
    }

    // Validate bank payment
    if (paymentMethod === 'bank_transfer' && bankAccount) {
      const bankAcc = await BankAccount.findOne({ _id: bankAccount, userId: req.user._id });
      if (!bankAcc) {
        return res.status(400).json({ message: 'Bank account not found' });
      }

      if (bankAcc.currentBalance < amount) {
        return res.status(400).json({
          message: `Insufficient balance. Available: ₹${bankAcc.currentBalance}`
        });
      }
    }

    // Calculate new paid amount and status
    const newPaidAmount = invoice.paidAmount + amount;
    let newPaymentStatus = 'partial';

    if (newPaidAmount >= invoice.totalAmount) {
      newPaymentStatus = 'paid';
    }

    // Update invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        $set: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus,
          paymentMethod: paymentMethod
        }
      },
      { new: true }
    );

    // Handle bank payment
    if (paymentMethod === 'bank_transfer' && bankAccount) {
      // Create cashbank transaction (money IN)
      const cashbankTxn = await CashbankTransaction.create({
        type: 'in',
        amount,
        fromAccount: 'sale',
        toAccount: bankAccount,
        description: `Payment for invoice ${invoice.invoiceNo}`,
        date: new Date(),
        userId: req.user._id,
      });

      // Update bank balance (add)
      await BankAccount.updateOne(
        { _id: bankAccount, userId: req.user._id },
        {
          $inc: { currentBalance: amount },
          $push: { transactions: cashbankTxn._id }
        }
      );

      info(`Bank payment recorded for sales invoice ${invoice.invoiceNo}: +₹${amount} to account ${bankAccount}`);
    }

    info(`Sales invoice ${invoice.invoiceNo} marked as ${newPaymentStatus} by ${req.user.name}: +₹${amount}`);

    res.status(200).json({
      message: `Invoice marked as ${newPaymentStatus}`,
      invoice: updatedInvoice
    });
  } catch (err) {
    error(`Mark sales invoice as paid failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
