/**
 * EXAMPLE: POS Sale with Database Transaction
 * 
 * This example shows how to refactor the POS sale flow to use transactions
 * Ensures atomic operations: inventory update + invoice creation + customer dues update
 */

import { withTransaction } from "../utils/transaction.js";
import Item from "../models/Item.js";
import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";

/**
 * Create POS sale with transaction (EXAMPLE - integrate into posController.js)
 */
export const createPOSSaleWithTransaction = async (req, res) => {
    try {
        const { items, customer, paymentMethod, paidAmount, discount } = req.body;

        // Execute all operations in a transaction
        const result = await withTransaction(async (session) => {
            // 1. Update inventory for each item
            for (const item of items) {
                const inventoryItem = await Item.findById(item.item).session(session);

                if (!inventoryItem) {
                    throw new Error(`Item ${item.item} not found`);
                }

                if (inventoryItem.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${inventoryItem.name}`);
                }

                // Deduct inventory
                await Item.updateOne(
                    { _id: item.item },
                    { $inc: { quantity: -item.quantity } },
                    { session }
                );
            }

            // 2. Create invoice
            const invoice = await Invoice.create([{
                invoiceNo: `INV-${Date.now()}`, // Generate proper invoice number
                customer: customer || null,
                items,
                subtotal: items.reduce((sum, i) => sum + i.total, 0),
                discount: discount || 0,
                totalAmount: items.reduce((sum, i) => sum + i.total, 0) - (discount || 0),
                paidAmount: paidAmount || 0,
                paymentMethod,
                paymentStatus: paidAmount >= totalAmount ? "paid" : "partial",
                createdBy: req.user._id,
            }], { session });

            // 3. Update customer dues (if applicable)
            if (customer && paidAmount < totalAmount) {
                const dueAmount = totalAmount - paidAmount;
                await Customer.updateOne(
                    { _id: customer },
                    { $inc: { dues: dueAmount } },
                    { session }
                );
            }

            return invoice[0];
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("POS Sale Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Process return with transaction (EXAMPLE - integrate into returnController.js)
 */
export const processReturnWithTransaction = async (req, res) => {
    try {
        const { invoiceId, returnedItems, refundMethod, refundAmount } = req.body;

        const result = await withTransaction(async (session) => {
            // 1. Restore inventory
            for (const item of returnedItems) {
                await Item.updateOne(
                    { _id: item.itemId },
                    { $inc: { quantity: item.quantity } },
                    { session }
                );
            }

            // 2. Create return record
            const returnRecord = await Return.create([{
                invoice: invoiceId,
                items: returnedItems,
                refundMethod,
                refundAmount,
                createdBy: req.user._id,
            }], { session });

            // 3. Update invoice
            await Invoice.updateOne(
                { _id: invoiceId },
                {
                    $inc: { returnedAmount: refundAmount },
                    hasReturns: true,
                },
                { session }
            );

            // 4. Update customer balance (if refund is credit)
            if (refundMethod === "customer_credit") {
                const invoice = await Invoice.findById(invoiceId).session(session);
                if (invoice.customer) {
                    await Customer.updateOne(
                        { _id: invoice.customer },
                        { $inc: { dues: -refundAmount } },
                        { session }
                    );
                }
            }

            return returnRecord[0];
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Return Processing Error:", error);
        res.status(500).json({ message: error.message });
    }
};
