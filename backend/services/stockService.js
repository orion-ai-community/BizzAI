import mongoose from 'mongoose';
import Item from '../models/Item.js';
import StockLedger from '../models/StockLedger.js';

/**
 * CORE STOCK SERVICE - ALL STOCK MUTATIONS MUST GO THROUGH THIS
 * 
 * This function ensures:
 * 1. Atomic stock updates using $inc
 * 2. Oversell protection with $gte condition
 * 3. Stock + Ledger consistency within transaction
 * 4. No read-modify-write race conditions
 * 
 * @param {Object} params
 * @param {string} params.itemId - Item ID
 * @param {number} params.qty - Quantity change (negative = reduce, positive = add)
 * @param {string} params.source - Source type (PURCHASE, SALE, ADJUSTMENT, etc.)
 * @param {string} params.sourceId - Source document ID
 * @param {mongoose.ClientSession} params.session - MongoDB session for transaction
 * @param {Object} params.user - User object for audit
 * @throws {Error} If insufficient stock or update fails
 */
export async function applyStockChange({
    itemId,
    qty,
    source,
    sourceId,
    session,
    user
}) {
    const query = { _id: itemId };

    // Oversell protection: only when reducing stock
    if (qty < 0) {
        query.stockQty = { $gte: Math.abs(qty) };
    }

    // Atomic stock update
    const result = await Item.updateOne(
        query,
        { $inc: { stockQty: qty } },
        { session }
    );

    // Check if update succeeded
    if (result.modifiedCount === 0) {
        const item = await Item.findById(itemId).session(session);
        throw new Error(
            `Insufficient stock for item ${item?.name || itemId}. ` +
            `Available: ${item?.stockQty || 0}, Required: ${Math.abs(qty)}`
        );
    }

    // Get updated item for ledger
    const item = await Item.findById(itemId).session(session);

    // Create stock ledger entry (must be in same transaction)
    await StockLedger.create([{
        item: itemId,
        transactionType: source,
        quantityChange: qty,
        runningBalance: item.stockQty,
        costPerUnit: item.costPrice || 0,
        totalValue: qty * (item.costPrice || 0),
        sourceDocument: {
            type: source,
            id: sourceId
        },
        organizationId: item.organizationId,
        createdBy: user._id
    }], { session });

    return item;
}

/**
 * Apply multiple stock changes in a single transaction
 * 
 * @param {Array} changes - Array of stock change objects
 * @param {mongoose.ClientSession} session - MongoDB session
 */
export async function applyBulkStockChanges(changes, session) {
    const results = [];

    for (const change of changes) {
        const result = await applyStockChange({ ...change, session });
        results.push(result);
    }

    return results;
}
