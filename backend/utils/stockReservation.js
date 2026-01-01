import Item from "../models/Item.js";

/**
 * Reserve stock for an item
 * @param {String} itemId - Item ID
 * @param {Number} quantity - Quantity to reserve
 */
export const reserveStock = async (itemId, quantity) => {
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

    await Item.findByIdAndUpdate(itemId, {
        $inc: { reservedStock: quantity },
    });
};

/**
 * Release reserved stock for an item
 * @param {String} itemId - Item ID
 * @param {Number} quantity - Quantity to release
 */
export const releaseStock = async (itemId, quantity) => {
    const item = await Item.findById(itemId);
    if (!item) {
        throw new Error(`Item not found: ${itemId}`);
    }

    if (item.reservedStock < quantity) {
        throw new Error(
            `Cannot release more stock than reserved for ${item.name}. Reserved: ${item.reservedStock}, Requested: ${quantity}`
        );
    }

    await Item.findByIdAndUpdate(itemId, {
        $inc: { reservedStock: -quantity },
    });
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
