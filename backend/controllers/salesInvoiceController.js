import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import { error } from "../utils/logger.js";

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
