import mongoose from "mongoose";
import Return from "../models/Return.js";
import Invoice from "../models/Invoice.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Create a new return
 * @route POST /api/returns
 */
export const createReturn = async (req, res) => {
    try {
        const {
            invoiceId,
            items,
            refundMethod = "credit",
            discountAmount = 0,
            notes = "",
        } = req.body;

        // Validate input
        if (!invoiceId || !items || items.length === 0) {
            return res.status(400).json({
                message: "Invoice ID and items are required",
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            return res.status(400).json({ message: "Invalid invoice ID format" });
        }

        // Fetch and verify invoice belongs to current user
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            createdBy: req.user._id,
        }).populate("customer");

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found or unauthorized",
            });
        }

        // Check for existing returns for this invoice
        const existingReturns = await Return.find({
            invoice: invoiceId,
            createdBy: req.user._id,
        });

        // Calculate already returned quantities per product
        const returnedQuantities = {};
        existingReturns.forEach((returnRecord) => {
            returnRecord.items.forEach((item) => {
                const productId = item.product.toString();
                if (!returnedQuantities[productId]) {
                    returnedQuantities[productId] = 0;
                }
                returnedQuantities[productId] += item.returnedQty;
            });
        });

        // Validate all return items
        for (const returnItem of items) {
            // Find matching item in original invoice
            const invoiceItem = invoice.items.find(
                (invItem) => invItem.item.toString() === returnItem.productId
            );

            if (!invoiceItem) {
                return res.status(400).json({
                    message: `Product ${returnItem.productName} not found in original invoice`,
                });
            }

            // Check if this item has already been returned
            const alreadyReturned = returnedQuantities[returnItem.productId] || 0;
            const totalReturnQty = alreadyReturned + returnItem.returnedQty;

            // Validate total returned quantity doesn't exceed original quantity
            if (totalReturnQty > invoiceItem.quantity) {
                return res.status(400).json({
                    message: `Cannot return ${returnItem.returnedQty} of ${returnItem.productName}. Original quantity: ${invoiceItem.quantity}, Already returned: ${alreadyReturned}, Remaining: ${invoiceItem.quantity - alreadyReturned}`,
                });
            }

            if (returnItem.returnedQty <= 0) {
                return res.status(400).json({
                    message: `Return quantity must be greater than 0 for ${returnItem.productName}`,
                });
            }

            // Validate condition and reason
            if (!returnItem.condition || !returnItem.reason) {
                return res.status(400).json({
                    message: `Condition and reason are required for ${returnItem.productName}`,
                });
            }
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        const processedItems = [];

        for (const returnItem of items) {
            const lineSubtotal = returnItem.returnedQty * returnItem.rate;
            const lineTax = (lineSubtotal * returnItem.taxPercent) / 100;
            const lineTotal = lineSubtotal + lineTax;

            subtotal += lineSubtotal;
            taxAmount += lineTax;

            processedItems.push({
                product: returnItem.productId,
                productName: returnItem.productName,
                originalQty: returnItem.originalQty,
                returnedQty: returnItem.returnedQty,
                rate: returnItem.rate,
                taxPercent: returnItem.taxPercent,
                taxAmount: lineTax,
                lineTotal: lineTotal,
                condition: returnItem.condition,
                reason: returnItem.reason,
                inventoryAdjusted: false,
            });
        }

        const totalReturnAmount = subtotal + taxAmount - discountAmount;

        // Determine return type
        let isFullReturn = true;
        for (const returnItem of items) {
            const invoiceItem = invoice.items.find(
                (invItem) => invItem.item.toString() === returnItem.productId
            );
            if (returnItem.returnedQty < invoiceItem.quantity) {
                isFullReturn = false;
                break;
            }
        }

        // Check if all invoice items are being returned
        if (isFullReturn && items.length < invoice.items.length) {
            isFullReturn = false;
        }

        const returnType = isFullReturn ? "full" : "partial";

        // Generate unique return ID
        const lastReturn = await Return.findOne({ createdBy: req.user._id })
            .sort({ createdAt: -1 })
            .select("returnId");

        let returnNumber = 1;
        if (lastReturn && lastReturn.returnId) {
            const match = lastReturn.returnId.match(/RET-(\d+)/);
            if (match) {
                returnNumber = parseInt(match[1]) + 1;
            }
        }

        const returnId = `RET-${String(returnNumber).padStart(5, "0")}`;

        // Create return record
        const returnRecord = await Return.create({
            returnId,
            invoice: invoiceId,
            customer: invoice.customer?._id || null,
            customerName: invoice.customer?.name || "Walk-in Customer",
            returnDate: new Date(),
            returnType,
            refundMethod,
            items: processedItems,
            subtotal,
            taxAmount,
            discountAmount,
            totalReturnAmount,
            status: "processed",
            notes,
            createdBy: req.user._id,
        });

        // Update inventory for non-damaged items
        for (const returnItem of processedItems) {
            if (returnItem.condition === "not_damaged") {
                await Item.findByIdAndUpdate(returnItem.product, {
                    $inc: { stockQty: returnItem.returnedQty },
                });

                // Mark inventory as adjusted
                await Return.findOneAndUpdate(
                    { _id: returnRecord._id, "items.product": returnItem.product },
                    { $set: { "items.$.inventoryAdjusted": true } }
                );
            }
        }

        // Update invoice
        await Invoice.findByIdAndUpdate(invoiceId, {
            $inc: { returnedAmount: totalReturnAmount },
            $set: { hasReturns: true },
        });

        // Update customer ledger (reduce dues or create credit)
        // ONLY if refund method is 'credit' (or 'original_payment' which defaults to credit for unpaid invoices logic usually,
        // but let's be strict: if we refund via Bank/Cash, we don't adjust Dues unless it was an unpaid invoice... logic gets complex.
        // Simplified Logic: 
        // 1. If 'credit', we reduce Dues (giving them store credit or reducing debt).
        // 2. If 'cash'/'bank', we pay them out. Dues remains unchanged (assuming they paid for the item originally).
        //    If they hadn't paid (Dues > 0), they shouldn't be getting Cash refund anyway.
        //    So, conditional update is safer.

        if (invoice.customer && (refundMethod === 'credit' || refundMethod === 'original_payment')) {
            await Customer.findByIdAndUpdate(invoice.customer._id, {
                $inc: { dues: -totalReturnAmount },
            });
        }

        // Create transaction record (non-critical). Failures here should not block the return.
        if (invoice.customer) {
            try {
                await Transaction.create({
                    type: "return",
                    customer: invoice.customer._id,
                    invoice: invoiceId,
                    return: returnRecord._id,
                    amount: totalReturnAmount,
                    paymentMethod: refundMethod,
                    description: `Return processed for invoice ${invoice.invoiceNo} - Return ID: ${returnId}`,
                });
            } catch (txnErr) {
                error(`Return transaction creation failed (non-blocking): ${txnErr.message}`);
            }
        }

        // Handle Bank Refund (Money OUT)
        if (refundMethod === 'bank' && req.body.bankAccount) {
            try {
                const BankAccount = (await import("../models/BankAccount.js")).default;
                const CashbankTransactionDyn = (await import("../models/CashbankTransaction.js")).default;

                const bankAcc = await BankAccount.findOne({
                    _id: req.body.bankAccount,
                    userId: req.user._id
                });

                if (bankAcc) {
                    // Create cashbank transaction (money OUT - refund to customer)
                    const cashbankTxn = await CashbankTransactionDyn.create({
                        type: 'out',
                        amount: totalReturnAmount,
                        fromAccount: req.body.bankAccount,
                        toAccount: 'sale_return',
                        description: `Refund for sales return ${returnId}`,
                        date: new Date(),
                        userId: req.user._id,
                    });

                    // Update bank balance (deduct)
                    await BankAccount.updateOne(
                        { _id: req.body.bankAccount, userId: req.user._id },
                        {
                            $inc: { currentBalance: -totalReturnAmount },
                            $push: { transactions: cashbankTxn._id }
                        }
                    );

                    // Update return record
                    returnRecord.bankAccount = req.body.bankAccount;
                    returnRecord.refundProcessed = true;
                    await returnRecord.save();

                    info(`Bank refund for return ${returnId}: -₹${totalReturnAmount} from ${bankAcc.bankName}`);
                }
            } catch (bankErr) {
                error(`Bank refund processing failed (non-blocking): ${bankErr.message}`);
            }
        } else if (refundMethod === 'cash') {
            try {
                // Record cash refund transaction
                await CashbankTransaction.create({
                    type: 'out',
                    amount: totalReturnAmount,
                    fromAccount: 'cash',
                    toAccount: 'sale_return',
                    description: `Cash refund for sales return ${returnId}`,
                    userId: req.user._id,
                });

                info(`Cash refund for return ${returnId}: -₹${totalReturnAmount}`);
            } catch (cashErr) {
                error(`Cash refund processing failed (non-blocking): ${cashErr.message}`);
            }
        }


        info(
            `Return created by ${req.user.name}: ${returnId} for invoice ${invoice.invoiceNo}`
        );

        // Populate and return the created return (best-effort)
        try {
            const populatedReturn = await Return.findById(returnRecord._id)
                .populate("invoice", "invoiceNo")
                .populate("customer", "name phone email");

            return res.status(201).json({
                message: "Return created successfully",
                return: populatedReturn,
            });
        } catch (popErr) {
            error(`Return populate failed (non-blocking): ${popErr.message}`);
            return res.status(201).json({
                message: "Return created successfully",
                return: returnRecord,
            });
        }
    } catch (err) {
        error(`Create Return Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get all returns (only for current owner)
 * @route GET /api/returns
 */
export const getAllReturns = async (req, res) => {
    try {
        const returns = await Return.find({ createdBy: req.user._id })
            .populate("invoice", "invoiceNo")
            .populate("customer", "name phone")
            .sort({ createdAt: -1 });

        res.status(200).json(returns);
    } catch (err) {
        error(`Get All Returns Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get single return by ID
 * @route GET /api/returns/:id
 */
export const getReturnById = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid return ID format" });
        }

        const returnRecord = await Return.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        })
            .populate("invoice", "invoiceNo totalAmount")
            .populate("customer", "name phone email address")
            .populate("items.product", "name sku");

        if (!returnRecord) {
            return res.status(404).json({
                message: "Return not found or unauthorized",
            });
        }

        res.status(200).json(returnRecord);
    } catch (err) {
        error(`Get Return By ID Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Delete return (reverses all changes)
 * @route DELETE /api/returns/:id
 */
export const deleteReturn = async (req, res) => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid return ID format" });
        }

        const returnRecord = await Return.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        });

        if (!returnRecord) {
            return res.status(404).json({
                message: "Return not found or unauthorized",
            });
        }

        // Reverse inventory adjustments
        for (const item of returnRecord.items) {
            if (item.inventoryAdjusted && item.condition === "not_damaged") {
                await Item.findByIdAndUpdate(item.product, {
                    $inc: { stockQty: -item.returnedQty },
                });
            }
        }

        // Reverse invoice updates
        await Invoice.findByIdAndUpdate(returnRecord.invoice, {
            $inc: { returnedAmount: -returnRecord.totalReturnAmount },
        });

        // Check if invoice has other returns
        const otherReturns = await Return.countDocuments({
            invoice: returnRecord.invoice,
            _id: { $ne: returnRecord._id },
        });

        if (otherReturns === 0) {
            await Invoice.findByIdAndUpdate(returnRecord.invoice, {
                $set: { hasReturns: false },
            });
        }

        // Reverse customer ledger
        if (returnRecord.customer) {
            await Customer.findByIdAndUpdate(returnRecord.customer, {
                $inc: { dues: returnRecord.totalReturnAmount },
            });
        }

        // Handle Bank Refund Reversal
        if (returnRecord.refundProcessed && returnRecord.bankAccount) {
            const BankAccount = (await import("../models/BankAccount.js")).default;
            const CashbankTransaction = (await import("../models/CashbankTransaction.js")).default;

            const bankAcc = await BankAccount.findOne({
                _id: returnRecord.bankAccount,
                userId: req.user._id
            });

            if (bankAcc) {
                // Find and delete the associated cashbank transaction
                // We search by amount, account, and description to find the matching one
                const cashbankTxn = await CashbankTransaction.findOne({
                    amount: returnRecord.totalReturnAmount,
                    fromAccount: returnRecord.bankAccount,
                    type: 'out',
                    description: new RegExp(`sales return ${returnRecord.returnId}`),
                    userId: req.user._id
                });

                if (cashbankTxn) {
                    // Update bank balance (add back the money because 'out' is being reversed)
                    await BankAccount.updateOne(
                        { _id: returnRecord.bankAccount, userId: req.user._id },
                        {
                            $inc: { currentBalance: returnRecord.totalReturnAmount },
                            $pull: { transactions: cashbankTxn._id }
                        }
                    );

                    // Delete the cashbank transaction
                    await CashbankTransaction.findByIdAndDelete(cashbankTxn._id);

                    info(`Bank refund reversed for return ${returnRecord.returnId}: +₹${returnRecord.totalReturnAmount} to ${bankAcc.bankName}`);
                }
            }
        }

        // Delete associated general transactions
        const Transaction = (await import("../models/Transaction.js")).default;
        await Transaction.deleteMany({ return: returnRecord._id });

        // Delete return record
        await Return.findByIdAndDelete(req.params.id);

        info(
            `Return deleted by ${req.user.name}: ${returnRecord.returnId}`
        );

        res.status(200).json({ message: "Return deleted successfully" });
    } catch (err) {
        error(`Delete Return Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
