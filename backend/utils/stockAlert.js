import Item from "../models/Item.js";

/**
 * Checks for low or out-of-stock items and returns alert list
 * @param {String} userId - The owner's user ID
 */
export const checkStockAlerts = async (userId) => {
  try {
    const items = await Item.find({
      addedBy: userId,
      $expr: { $lte: ["$stockQty", "$lowStockLimit"] },
    });

    const alerts = items.map((i) => ({
      type: i.stockQty === 0 ? "out-of-stock" : "low-stock",
      message:
        i.stockQty === 0
          ? `${i.name} is out of stock!`
          : `${i.name} is running low (only ${i.stockQty} left)`,
      itemId: i._id,
    }));

    return alerts;
  } catch (error) {
    console.error("Stock Alert Error:", error);
    return [];
  }
};