import mongoose from "mongoose";
import Item from "../models/Item.js";
import { checkStockAlerts } from "../utils/stockAlert.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Add new item to inventory
 * @route POST /api/inventory
 */
export const addItem = async (req, res) => {
  try {
    const { name, sku, category, costPrice, sellingPrice, stockQty, lowStockLimit, unit } =
      req.body;

    if (!name || !costPrice || !sellingPrice) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Check if item already exists for this user
    const existing = await Item.findOne({ name, addedBy: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "Item already exists in your inventory" });
    }

    const item = await Item.create({
      name,
      sku,
      category,
      costPrice,
      sellingPrice,
      stockQty,
      lowStockLimit,
      unit,
      addedBy: req.user._id,
    });

    info(`Item added by ${req.user.name}: ${item.name}`);
    const alerts = await checkStockAlerts(req.user._id);

    res.status(201).json({ item, alerts });
  } catch (err) {
    console.error("Add Item Error:", err);
    error(`Add Item Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get all items (only for current owner)
 * @route GET /api/inventory
 */
export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find({ addedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    error(`Get All Items Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get single item by ID
 * @route GET /api/inventory/:id
 */
export const getSingleItem = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    const item = await Item.findOne({
      _id: req.params.id,
      addedBy: req.user._id
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found or unauthorized" });
    }

    res.status(200).json(item);
  } catch (err) {
    error(`Get Single Item Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Update item
 * @route PUT /api/inventory/:id
 */
export const updateItem = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    // First check if item belongs to this owner
    const item = await Item.findOne({
      _id: req.params.id,
      addedBy: req.user._id
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found or unauthorized" });
    }

    // Check for duplicate name if name is being updated
    if (req.body.name && req.body.name !== item.name) {
      const existingName = await Item.findOne({
        name: req.body.name,
        addedBy: req.user._id,
        _id: { $ne: req.params.id }
      });

      if (existingName) {
        return res.status(400).json({ message: "Item name already exists in your inventory" });
      }
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });

    info(`Item updated by ${req.user.name}: ${updated.name}`);

    const alerts = await checkStockAlerts(req.user._id);
    res.status(200).json({ updated, alerts });
  } catch (err) {
    error(`Update Item Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Delete item
 * @route DELETE /api/inventory/:id
 */
export const deleteItem = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }

    const item = await Item.findOne({
      _id: req.params.id,
      addedBy: req.user._id
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found or unauthorized" });
    }

    await Item.findByIdAndDelete(req.params.id);

    info(`Item deleted by ${req.user.name}: ${item.name}`);
    res.status(200).json({ message: "Item deleted" });
  } catch (err) {
    error(`Delete Item Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get low-stock items (only for current owner)
 * @route GET /api/inventory/low-stock
 */
export const getLowStockItems = async (req, res) => {
  try {
    // Get all items and filter by available stock (stockQty - reservedStock)
    const allItems = await Item.find({ addedBy: req.user._id });

    const lowStockItems = allItems.filter(item => {
      const availableStock = item.stockQty - (item.reservedStock || 0);
      return availableStock <= item.lowStockLimit;
    });

    res.status(200).json(lowStockItems);
  } catch (err) {
    error(`Low Stock Item Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Bulk import items from file
 * @route POST /api/inventory/import
 */
export const importItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided for import" });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];

        // Validate required fields
        if (!item.name || !item.costPrice || !item.sellingPrice) {
          results.errors.push(`Row ${i + 1}: Missing required fields (name, cost price, or selling price)`);
          results.skipped++;
          continue;
        }

        // Check if item already exists
        const existing = await Item.findOne({
          name: item.name,
          addedBy: req.user._id
        });

        if (existing) {
          results.errors.push(`Row ${i + 1}: Item "${item.name}" already exists`);
          results.skipped++;
          continue;
        }

        // Create new item
        await Item.create({
          name: item.name,
          sku: item.sku || undefined,
          category: item.category || undefined,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          stockQty: item.stockQty || 0,
          unit: item.unit || undefined,
          addedBy: req.user._id
        });

        results.imported++;
      } catch (itemError) {
        results.errors.push(`Row ${i + 1}: ${itemError.message}`);
        results.skipped++;
      }
    }

    info(`Items imported by ${req.user.name}: ${results.imported} imported, ${results.skipped} skipped`);
    const alerts = await checkStockAlerts(req.user._id);

    res.status(200).json({
      message: `Import completed: ${results.imported} items imported, ${results.skipped} skipped`,
      ...results,
      alerts
    });
  } catch (err) {
    console.error("Bulk Import Error:", err);
    error(`Bulk Import Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};