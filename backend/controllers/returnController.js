import mongoose from "mongoose";
import Return from "../models/Return.js";
import Invoice from "../models/Invoice.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
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
        if (invoice.customer) {
            await Customer.findByIdAndUpdate(invoice.customer._id, {
                $inc: { dues: -totalReturnAmount },
            });

            // Create transaction record
            await Transaction.create({
                type: "return",
                customer: invoice.customer._id,
                invoice: invoiceId,
                return: returnRecord._id,
                amount: totalReturnAmount,
                paymentMethod: refundMethod,
                description: `Return processed for invoice ${invoice.invoiceNo} - Return ID: ${returnId}`,
            });
        }

        info(
            `Return created by ${req.user.name}: ${returnId} for invoice ${invoice.invoiceNo}`
        );

        // Populate and return the created return
        const populatedReturn = await Return.findById(returnRecord._id)
            .populate("invoice", "invoiceNo")
            .populate("customer", "name phone email");

        res.status(201).json({
            message: "Return created successfully",
            return: populatedReturn,
        });
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

        // Delete associated transactions
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
