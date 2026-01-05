import Item from "../models/Item.js";
import { logStockMovement } from "./stockMovementLogger.js";
import { validateStockLevels } from "./inventoryValidator.js";

/**
 * Reserve stock for an item
 * @param {String} itemId - Item ID
 * @param {Number} quantity - Quantity to reserve
 * @param {ObjectId} sourceId - Source document ID (SalesOrder)
 * @param {String} sourceType - Source model name
 * @param {ObjectId} userId - User performing the action
 */
export const reserveStock = async (itemId, quantity, sourceId = null, sourceType = "SalesOrder", userId = null) => {
    const item = await Item.findById(itemId);
    if (!item) {
        throw new Error(`Item not found: ${itemId}`);
    }

    const availableStock = item.stockQty - item.reservedStock;
    if (availableStock < quantity) {
        throw new Error(
            `Insufficient available stock for ${item.name}. Available: ${availableStock}, Requested: ${quantity}`
        );
    }

    // Capture previous state
    const previousState = {
        stockQty: item.stockQty,
        reservedStock: item.reservedStock,
        inTransitStock: item.inTransitStock || 0,
    };

    // Update reserved stock
    item.reservedStock += quantity;

    // Validate stock levels
    validateStockLevels(item);
    await item.save();

    // Capture new state
    const newState = {
        stockQty: item.stockQty,
        reservedStock: item.reservedStock,
        inTransitStock: item.inTransitStock || 0,
    };

    // Log stock movement if source info provided
    if (sourceId && userId) {
        await logStockMovement(
            item,
            "RESERVE",
            quantity,
            sourceId,
            sourceType,
            userId,
            previousState,
            newState
        );
    }
};

/**
 * Release reserved stock for an item
 * @param {String} itemId - Item ID
 * @param {Number} quantity - Quantity to release
 * @param {ObjectId} sourceId - Source document ID (SalesOrder)
 * @param {String} sourceType - Source model name
 * @param {ObjectId} userId - User performing the action
 */
export const releaseStock = async (itemId, quantity, sourceId = null, sourceType = "SalesOrder", userId = null) => {
    const item = await Item.findById(itemId);
    if (!item) {
        throw new Error(`Item not found: ${itemId}`);
    }

    if (item.reservedStock < quantity) {
        throw new Error(
            `Cannot release more stock than reserved for ${item.name}. Reserved: ${item.reservedStock}, Requested: ${quantity}`
        );
    }

    // Capture previous state
    const previousState = {
        stockQty: item.stockQty,
        reservedStock: item.reservedStock,
        inTransitStock: item.inTransitStock || 0,
    };

    // Update reserved stock
    item.reservedStock -= quantity;

    // Validate stock levels
    validateStockLevels(item);
    await item.save();

    // Capture new state
    const newState = {
        stockQty: item.stockQty,
        reservedStock: item.reservedStock,
        inTransitStock: item.inTransitStock || 0,
    };

    // Log stock movement if source info provided
    if (sourceId && userId) {
        await logStockMovement(
            item,
            "RELEASE",
            quantity,
            sourceId,
            sourceType,
            userId,
            previousState,
            newState
        );
    }
};

/**
 * Check if sufficient stock is available
 * @param {String} itemId - Item ID
 * @param {Number} quantity - Quantity to check
 * @returns {Boolean} - True if available, false otherwise
 */
export const checkAvailableStock = async (itemId, quantity) => {
    const item = await Item.findById(itemId);
    if (!item) {
        throw new Error(`Item not found: ${itemId}`);
    }

    const availableStock = item.stockQty - item.reservedStock;
    return availableStock >= quantity;
};

/**
 * Get available stock for an item
 * @param {String} itemId - Item ID
 * @returns {Number} - Available stock quantity
 */
export const getAvailableStock = async (itemId) => {
    const item = await Item.findById(itemId);
    if (!item) {
        throw new Error(`Item not found: ${itemId}`);
    }

    return item.stockQty - item.reservedStock;
};
