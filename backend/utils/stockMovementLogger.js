import StockMovement from "../models/StockMovement.js";
import { info, error } from "./logger.js";

/**
 * Log stock movement to append-only ledger
 * @param {Object} item - Item document with current state
 * @param {String} type - Movement type: RESERVE, RELEASE, DELIVER, IN_TRANSIT, POS_SALE, RETURN, INVOICE
 * @param {Number} quantity - Quantity moved
 * @param {ObjectId} sourceId - Source document ID (SalesOrder, DeliveryChallan, Invoice, Return)
 * @param {String} sourceType - Source model name
 * @param {ObjectId} userId - User performing the action
 * @param {Object} previousState - Previous stock state {stockQty, reservedStock, inTransitStock}
 * @param {Object} newState - New stock state {stockQty, reservedStock, inTransitStock}
 */
export const logStockMovement = async (
    item,
    type,
    quantity,
    sourceId,
    sourceType,
    userId,
    previousState,
    newState
) => {
    try {
        await StockMovement.create({
            item: item._id,
            type,
            quantity,
            sourceId,
            sourceType,
            previousStock: previousState.stockQty,
            previousReserved: previousState.reservedStock,
            previousInTransit: previousState.inTransitStock,
            newStock: newState.stockQty,
            newReserved: newState.reservedStock,
            newInTransit: newState.inTransitStock,
            createdBy: userId,
        });

        info(
            `Stock movement logged: ${type} | Item: ${item.name} | Qty: ${quantity} | Source: ${sourceType}:${sourceId}`
        );
    } catch (err) {
        error(`Failed to log stock movement: ${err.message}`);
        throw err;
    }
};

/**
 * Get stock movement history for an item
 * @param {ObjectId} itemId - Item ID
 * @param {Number} limit - Number of records to fetch
 */
export const getStockMovementHistory = async (itemId, limit = 50) => {
    try {
        return await StockMovement.find({ item: itemId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("createdBy", "name")
            .lean();
    } catch (err) {
        error(`Failed to get stock movement history: ${err.message}`);
        throw err;
    }
};
