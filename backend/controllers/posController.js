import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import BankAccount from "../models/BankAccount.js";
import { generateInvoicePDF } from "../utils/invoiceGenerator.js";
import { sendEmail } from "../utils/emailService.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Create a new invoice (Billing)
 * @route POST /api/pos/invoice
 */
export const createInvoice = async (req, res) => {
  try {
    const { customerId, items, discount = 0, paymentMethod, bankAccount } = req.body;
    const paidAmount = Number(req.body.paidAmount || 0);
    console.log('POS invoice request:', { customerId, items, discount, paymentMethod, bankAccount, paidAmount });

    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items in invoice" });

    console.log('Items validation passed, calculating totals');

    // Calculate totals
    let subtotal = 0;
    for (const it of items) {
      console.log('Calculating item:', it);
      subtotal += it.quantity * it.price;
    }
    const totalAmount = subtotal - discount;
    console.log('Totals calculated:', { subtotal, discount, totalAmount });

    // IMPORTANT: Walk-in customers cannot take due
    if (!customerId && paidAmount < totalAmount) {
      return res.status(400).json({
        message: "Walk-in customers must pay full amount. Please add customer details to allow credit."
      });
    }

    // Verify all items belong to current user
    console.log('Validating items...');
    for (const it of items) {
      console.log('Validating item:', it);
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(it.item)) {
        console.log('Invalid ObjectId:', it.item);
        return res.status(400).json({ message: `Invalid item ID format: ${it.item}` });
      }

      const item = await Item.findOne({ _id: it.item, addedBy: req.user._id });
      if (!item) {
        console.log('Item not found:', it.item);
        return res.status(400).json({
          message: `Item not found or unauthorized: ${it.item}`
        });
      }

      // Check stock availability
      if (item.stockQty < it.quantity) {
        console.log('Insufficient stock for', item.name);
        return res.status(400).json({
          message: `Insufficient stock for ${item.name}. Available: ${item.stockQty}`
        });
      }
    }
    console.log('All items validated successfully');

    // Verify customer belongs to current user if provided
    if (customerId) {
      console.log('Validating customer:', customerId);
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        console.log('Invalid customer ObjectId');
        return res.status(400).json({ message: "Invalid customer ID format" });
      }

      const customer = await Customer.findOne({
        _id: customerId,
        owner: req.user._id
      });
      if (!customer) {
        console.log('Customer not found');
        return res.status(400).json({
          message: "Customer not found or unauthorized"
        });
      }
      console.log('Customer validated');
    }

    // Handle overpayment and change return
    const changeOwed = Math.max(0, paidAmount - totalAmount);
    const changeReturned = parseFloat(req.body.changeReturned) || 0;
    const changeNotReturned = Math.max(0, changeOwed - changeReturned);

    // Cap paidAmount at totalAmount (don't record overpayment)
    const actualPaidAmount = Math.min(paidAmount, totalAmount);

    // Determine payment status
    let paymentStatus;
    if (actualPaidAmount >= totalAmount) {
      paymentStatus = "paid";
    } else if (actualPaidAmount > 0) {
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
    console.log('Creating invoice with data:', {
      invoiceNo,
      customer: customerId || null,
      items,
      subtotal,
      discount,
      totalAmount,
      paidAmount: actualPaidAmount,
      paymentMethod,
      paymentStatus,
      bankAccount: paymentMethod === 'bank_transfer' ? bankAccount : undefined,
      createdBy: req.user._id,
    });

    const invoice = await Invoice.create({
      invoiceNo,
      customer: customerId || null,
      items,
      subtotal,
      discount,
      totalAmount,
      paidAmount: actualPaidAmount,
      paymentMethod,
      paymentStatus,
      bankAccount: paymentMethod === 'bank_transfer' ? bankAccount : undefined,
      createdBy: req.user._id,
    });

    console.log('Invoice created successfully:', invoice._id);

    // Update stock
    for (const it of items) {
      await Item.findByIdAndUpdate(it.item, { $inc: { stockQty: -it.quantity } });
    }

    // Handle customer dues if unpaid
    if (customerId && actualPaidAmount < totalAmount) {
      const dueAmount = totalAmount - actualPaidAmount;
      await Customer.findByIdAndUpdate(customerId, { $inc: { dues: dueAmount } });

      await Transaction.create({
        type: "due",
        customer: customerId,
        invoice: invoice._id,
        amount: dueAmount,
        description: `Due added for invoice ${invoiceNo}`,
      });
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

      // Handle bank payment
      if (paymentMethod === 'bank_transfer' && bankAccount) {
        console.log('Processing bank payment for account:', bankAccount);
        // Validate bank account exists
        const bankAcc = await BankAccount.findOne({ _id: bankAccount, userId: req.user._id });
        if (!bankAcc) {
          console.log('Bank account not found');
          return res.status(400).json({ message: 'Selected bank account not found' });
        }
        console.log('Bank account validated:', bankAcc.bankName);

        // Create cashbank transaction
        const cashbankTxn = await CashbankTransaction.create({
          type: 'in',
          amount: actualPaidAmount,
          fromAccount: 'sale', // Indicates money from sale
          toAccount: bankAccount,
          description: `Payment for invoice ${invoiceNo}`,
          userId: req.user._id,
        });

        // Update bank balance
        await BankAccount.updateOne(
          { _id: bankAccount, userId: req.user._id },
          { $inc: { currentBalance: actualPaidAmount }, $push: { transactions: cashbankTxn._id } }
        );

        // Verify update
        const updatedAcc = await BankAccount.findById(bankAccount);
        console.log(`Bank balance updated for ${bankAccount}: new balance ${updatedAcc.currentBalance}`);

        info(`Bank payment recorded for invoice ${invoiceNo}: +${actualPaidAmount} to account ${bankAccount}`);
      }
    }

    // Generate invoice PDF + Email it + Log it
    try {
      const populatedInvoice = await Invoice.findById(invoice._id).populate("customer");
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
    } catch (pdfError) {
      console.error('PDF/Email generation error:', pdfError);
      // Don't fail the invoice creation if PDF/email fails
    }

    res.status(201).json({ message: "Invoice created successfully", invoice: populatedInvoice });
  } catch (err) {
    console.error('Create Invoice Error:', err);
    console.error('Stack trace:', err.stack);
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

/**
 * @desc Mark invoice as paid (for unpaid/partial invoices)
 * @route PUT /api/pos/invoice/:id/payment
 */
export const markInvoiceAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, bankAccount } = req.body;
    const paidAmount = Number(req.body.paidAmount);

    if (isNaN(paidAmount) || paidAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid invoice ID format" });
    }

    const invoice = await Invoice.findOne({
      _id: id,
      createdBy: req.user._id
    }).populate('customer');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const newPaidAmount = invoice.paidAmount + paidAmount;

    if (newPaidAmount > invoice.totalAmount) {
      return res.status(400).json({
        message: `Payment exceeds invoice total. Remaining: ₹${invoice.totalAmount - invoice.paidAmount}`
      });
    }

    // Determine new payment status
    let paymentStatus = 'unpaid';

    if (newPaidAmount >= invoice.totalAmount) {
      paymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    }

    // Handle bank payment
    if (paymentMethod === 'bank_transfer') {
      if (!bankAccount) {
        return res.status(400).json({
          message: 'Bank account is required for bank transfer'
        });
      }

      const bankAcc = await BankAccount.findOne({
        _id: bankAccount,
        userId: req.user._id
      });

      if (!bankAcc) {
        return res.status(400).json({ message: 'Bank account not found' });
      }

      // Create cashbank transaction (money IN)
      const cashbankTxn = await CashbankTransaction.create({
        type: 'in',
        amount: paidAmount,
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
          $inc: { currentBalance: paidAmount },
          $push: { transactions: cashbankTxn._id }
        }
      );

      info(`Bank payment for invoice ${invoice.invoiceNo}: +₹${paidAmount}`);
    }

    // Update customer dues if exists
    if (invoice.customer) {
      const dueReduction = Math.min(
        paidAmount,
        invoice.totalAmount - invoice.paidAmount
      );

      await Customer.findByIdAndUpdate(
        invoice.customer._id,
        { $inc: { dues: -dueReduction } }
      );

      // Record transaction
      await Transaction.create({
        type: 'payment',
        customer: invoice.customer._id,
        invoice: invoice._id,
        amount: paidAmount,
        paymentMethod,
        description: `Payment received for invoice ${invoice.invoiceNo}`,
      });
    }

    // Update invoice
    invoice.paidAmount = newPaidAmount;
    invoice.paymentStatus = paymentStatus;
    invoice.paymentMethod = paymentMethod;
    await invoice.save();

    res.status(200).json({
      message: 'Payment recorded successfully',
      invoice
    });
  } catch (err) {
    error(`Mark invoice as paid failed: ${err.stack || err.message}`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};