import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import { sendEmail } from "../utils/emailService.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Create a new invoice (Billing)
 * @route POST /api/pos/invoice
 */
export const createInvoice = async (req, res) => {
  try {
    const { customerId, items, discount = 0, paidAmount = 0, paymentMethod, creditApplied = 0 } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items in invoice" });

    // Calculate totals
    let subtotal = 0;
    for (const it of items) subtotal += it.quantity * it.price;
    const totalAmount = subtotal - discount;

    // Validate credit usage
    if (creditApplied > 0 && !customerId) {
      return res.status(400).json({
        message: "Walk-in customers cannot use credit. Please select a customer."
      });
    }

    // IMPORTANT: Walk-in customers cannot take due
    if (!customerId && paidAmount < totalAmount) {
      return res.status(400).json({
        message: "Walk-in customers must pay full amount. Please add customer details to allow credit."
      });
    }

    // Verify all items belong to current user
    for (const it of items) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(it.item)) {
        return res.status(400).json({ message: `Invalid item ID format: ${it.item}` });
      }

      const item = await Item.findOne({ _id: it.item, addedBy: req.user._id });
      if (!item) {
        return res.status(400).json({
          message: `Item not found or unauthorized: ${it.item}`
        });
      }

      // Check stock availability
      if (item.stockQty < it.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.name}. Available: ${item.stockQty}`
        });
      }
    }

    // Verify customer belongs to current user if provided
    let customer = null;
    if (customerId) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID format" });
      }

      customer = await Customer.findOne({
        _id: customerId,
        owner: req.user._id
      });
      if (!customer) {
        return res.status(400).json({
          message: "Customer not found or unauthorized"
        });
      }

      // Validate credit application if creditApplied > 0
      if (creditApplied > 0) {
        const availableCredit = customer.dues < 0 ? Math.abs(customer.dues) : 0;

        if (availableCredit === 0) {
          return res.status(400).json({
            message: "Customer has no available credit"
          });
        }
        if (creditApplied > availableCredit) {
          return res.status(400).json({
            message: `Credit applied (₹${creditApplied}) exceeds available credit (₹${availableCredit.toFixed(2)})`
          });
        }
        if (creditApplied > totalAmount) {
          return res.status(400).json({
            message: `Credit applied (₹${creditApplied}) cannot exceed total amount (₹${totalAmount})`
          });
        }
      }
    } else if (creditApplied > 0) {
      return res.status(400).json({
        message: "Cannot apply credit for walk-in customers"
      });
    }

    // Handle overpayment and change return
    const effectivePaidAmount = paidAmount + creditApplied; // Credit counts as payment
    const changeOwed = Math.max(0, effectivePaidAmount - totalAmount);
    const changeReturned = parseFloat(req.body.changeReturned) || 0;

    // CRITICAL VALIDATION: Prevent Change Returned from exceeding Change Owed
    if (changeReturned > changeOwed) {
      return res.status(400).json({
        message: "You are returning more amount than required. Please correct the change returned."
      });
    }

    const changeNotReturned = Math.max(0, changeOwed - changeReturned);

    // Cap actualPaidAmount at totalAmount (don't record overpayment)
    const actualPaidAmount = Math.min(paidAmount, totalAmount - creditApplied);

    // Determine payment status based on effective payment (cash + credit)
    let paymentStatus;
    if (effectivePaidAmount >= totalAmount) {
      paymentStatus = "paid";
    } else if (effectivePaidAmount > 0) {
      paymentStatus = "partial";
    } else {
      paymentStatus = "unpaid";
    }

    // Generate unique invoice number - find most recent invoice and increment
    const lastInvoice = await Invoice.findOne({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('invoiceNo');

    let invoiceNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNo) {
      // Extract number from format INV-00001
      const match = lastInvoice.invoiceNo.match(/INV-(\d+)/);
      if (match) {
        invoiceNumber = parseInt(match[1]) + 1;
      }
    }

    const invoiceNo = `INV-${String(invoiceNumber).padStart(5, "0")}`;

    // Save invoice
    const invoice = await Invoice.create({
      invoiceNo,
      customer: customerId || null,
      items,
      subtotal,
      discount,
      totalAmount,
      paidAmount: actualPaidAmount,
      creditApplied,
      paymentMethod,
      paymentStatus,
      createdBy: req.user._id,
    });

    // Update stock
    for (const it of items) {
      await Item.findByIdAndUpdate(it.item, { $inc: { stockQty: -it.quantity } });
    }

    // Handle customer credit usage
    if (customerId && creditApplied > 0) {
      // Increase dues by creditApplied (reduce customer credit)
      await Customer.findByIdAndUpdate(customerId, { $inc: { dues: creditApplied } });

      await Transaction.create({
        type: "payment",
        customer: customerId,
        invoice: invoice._id,
        amount: creditApplied,
        paymentMethod: "credit",
        description: `Customer credit applied to invoice ${invoiceNo}`,
      });
    }

    // Handle customer dues if unpaid (after credit application)
    if (customerId && effectivePaidAmount < totalAmount) {
      const dueAmount = totalAmount - effectivePaidAmount;
      if (dueAmount > 0) {
        await Customer.findByIdAndUpdate(customerId, { $inc: { dues: dueAmount } });

        await Transaction.create({
          type: "due",
          customer: customerId,
          invoice: invoice._id,
          amount: dueAmount,
          description: `Due added for invoice ${invoiceNo}`,
        });
      }
    }

    // Handle change not returned - create NEGATIVE due (customer credit)
    if (customerId && changeNotReturned > 0) {
      // Decrease customer dues by changeNotReturned (customer has credit)
      await Customer.findByIdAndUpdate(customerId, { $inc: { dues: -changeNotReturned } });

      await Transaction.create({
        type: "due",
        customer: customerId,
        invoice: invoice._id,
        amount: -changeNotReturned,
        description: `Credit due to customer - change not returned for invoice ${invoiceNo}`,
      });
    }

    // Record payment transaction
    if (actualPaidAmount > 0) {
      await Transaction.create({
        type: "payment",
        customer: customerId,
        invoice: invoice._id,
        amount: actualPaidAmount,
        paymentMethod,
        description: `Payment received for invoice ${invoiceNo}`,
      });
    }

    // Generate invoice PDF + Email it + Log it
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customer")
      .populate("items.item")
      .populate({ path: "createdBy", select: "shopName name" });
    const pdfPath = await generateInvoicePDF(populatedInvoice);

    if (populatedInvoice.customer?.email) {
      await sendEmail(
        populatedInvoice.customer.email,
        `Invoice ${invoiceNo}`,
        `Thank you for your purchase! Attached is your invoice ${invoiceNo}.`,
        pdfPath
      );
    }

    info(`Invoice generated by ${req.user.name}: ${invoiceNo}`);

    res.status(201).json({ message: "Invoice created successfully", invoice: populatedInvoice });
  } catch (err) {
    error(`Invoice creation failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get all invoices (only for current owner)
 * @route GET /api/pos/invoices
 */
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ createdBy: req.user._id })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Get single invoice
 * @route GET /api/pos/invoice/:id
 */
export const getInvoiceById = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Delete invoice
 * @route DELETE /api/pos/invoice/:id
 */
export const deleteInvoice = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};