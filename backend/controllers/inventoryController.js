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

    // Attach for audit middleware (before update)
    req.originalEntity = item.toObject();

    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Attach for audit middleware (after update)
    req.updatedEntity = updated.toObject();

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

    // Attach for audit middleware (before deletion)
    req.deletedEntity = item.toObject();

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
      updated: 0,
      skipped: 0,
      errors: [],
      validationErrors: []
    };

    // Valid unit labels
    const validUnits = [
      'pcs', 'kg', 'g', 'mg', 'l', 'ml', 'box', 'pack', 'bag', 'bottle',
      'can', 'dozen', 'm', 'cm', 'ft', 'unit', 'pair', 'set'
    ];

    // Pre-fetch all existing items for this user to optimize duplicate checks
    const existingItems = await Item.find({ addedBy: req.user._id }).select('name sku stockQty');
    const existingItemsMap = new Map();
    const existingSKUs = new Map();

    existingItems.forEach(item => {
      existingItemsMap.set(item.name.toLowerCase(), item);
      if (item.sku) {
        existingSKUs.set(item.sku.toLowerCase(), item);
      }
    });

    // Check for duplicate SKUs within the import batch
    const importSKUs = new Map();
    items.forEach((item, index) => {
      if (item.sku) {
        const skuLower = item.sku.toLowerCase();
        if (importSKUs.has(skuLower)) {
          importSKUs.get(skuLower).push(index + 1);
        } else {
          importSKUs.set(skuLower, [index + 1]);
        }
      }
    });

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        const rowNum = i + 1;
        const rowErrors = [];

        // Validate required fields
        if (!item.name || item.name.toString().trim() === '') {
          rowErrors.push('Item name is required and cannot be blank');
        }

        if (!item.costPrice || item.costPrice === '') {
          rowErrors.push('Cost price is required');
        } else if (isNaN(item.costPrice) || parseFloat(item.costPrice) <= 0) {
          rowErrors.push('Cost price must be a positive number');
        }

        if (!item.sellingPrice || item.sellingPrice === '') {
          rowErrors.push('Selling price is required');
        } else if (isNaN(item.sellingPrice) || parseFloat(item.sellingPrice) <= 0) {
          rowErrors.push('Selling price must be a positive number');
        }

        // Validate category - must not be blank
        if (!item.category || item.category.toString().trim() === '') {
          rowErrors.push('Category is required and cannot be left blank');
        }

        // Validate unit label
        if (item.unit && item.unit.toString().trim() !== '') {
          const unitLower = item.unit.toLowerCase().trim();
          if (!validUnits.includes(unitLower)) {
            rowErrors.push(
              `Invalid unit "${item.unit}". Valid units: ${validUnits.join(', ')}`
            );
          }
        }

        // Check for duplicate SKU within the import batch only if stock is being added
        if (item.sku && item.sku.toString().trim() !== '') {
          const skuLower = item.sku.toLowerCase().trim();
          const duplicateRows = importSKUs.get(skuLower);
          if (duplicateRows && duplicateRows.length > 1) {
            const otherRows = duplicateRows.filter(r => r !== rowNum);
            if (otherRows.length > 0) {
              rowErrors.push(
                `SKU "${item.sku}" is duplicated in this import file (rows: ${duplicateRows.join(', ')}). Each SKU must be unique within the import`
              );
            }
          }
        }

        // If there are validation errors, skip this item
        if (rowErrors.length > 0) {
          results.validationErrors.push({
            row: rowNum,
            itemName: item.name || 'Unknown',
            sku: item.sku || 'N/A',
            errors: rowErrors
          });
          results.skipped++;
          continue;
        }

        // Check if item already exists by SKU (if SKU provided) or by name
        let existingItem = null;
        if (item.sku && item.sku.toString().trim() !== '') {
          const skuLower = item.sku.toLowerCase().trim();
          existingItem = existingSKUs.get(skuLower);
        }

        // Fallback to name if no SKU match
        if (!existingItem && item.name) {
          const nameLower = item.name.toLowerCase().trim();
          existingItem = existingItemsMap.get(nameLower);
        }

        if (existingItem) {
          // Item exists - UPDATE stock quantity by adding new quantity to existing
          const newStockQty = (existingItem.stockQty || 0) + (item.stockQty ? parseInt(item.stockQty) : 0);

          await Item.findByIdAndUpdate(
            existingItem._id,
            {
              stockQty: newStockQty,
              // Update other fields if they are better/more recent
              category: item.category.trim() || existingItem.category,
              unit: item.unit ? item.unit.toLowerCase().trim() : existingItem.unit,
              costPrice: item.costPrice || existingItem.costPrice,
              sellingPrice: item.sellingPrice || existingItem.sellingPrice,
            },
            { new: true }
          );

          info(`Item stock updated by ${req.user.name}: ${existingItem.name} - Added ${item.stockQty || 0} units (Total: ${newStockQty})`);
          results.updated++;
        } else {
          // Item doesn't exist - CREATE new item
          await Item.create({
            name: item.name.trim(),
            sku: item.sku ? item.sku.trim() : undefined,
            category: item.category.trim(),
            costPrice: parseFloat(item.costPrice),
            sellingPrice: parseFloat(item.sellingPrice),
            stockQty: item.stockQty ? parseInt(item.stockQty) : 0,
            unit: item.unit ? item.unit.toLowerCase().trim() : 'pcs',
            addedBy: req.user._id
          });

          info(`Item created by ${req.user.name}: ${item.name}`);
          results.imported++;
        }
      } catch (itemError) {
        results.errors.push({
          row: i + 1,
          itemName: items[i].name || 'Unknown',
          error: itemError.message
        });
        results.skipped++;
      }
    }

    info(`Items imported by ${req.user.name}: ${results.imported} created, ${results.updated} updated, ${results.skipped} skipped`);
    const alerts = await checkStockAlerts(req.user._id);

    res.status(200).json({
      message: `Import completed: ${results.imported} items created, ${results.updated} items updated, ${results.skipped} skipped`,
      ...results,
      alerts
    });
  } catch (err) {
    console.error("Bulk Import Error:", err);
    error(`Bulk Import Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Scan item by barcode/SKU for purchase entry
 * @route GET /api/items/scan?code=<value>
 */
export const scanItem = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || code.trim() === '') {
      return res.status(400).json({ message: "Scan code is required" });
    }

    const trimmedCode = code.trim();

    // Search by barcode, sku, or supplierSKU
    const item = await Item.findOne({
      addedBy: req.user._id,
      $or: [
        { barcode: trimmedCode },
        { sku: trimmedCode },
        { supplierSKU: trimmedCode }
      ]
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Get last purchase rate from recent purchases (if Purchase model exists)
    let lastPurchaseRate = item.costPrice;

    try {
      const Purchase = (await import("../models/Purchase.js")).default;

      const lastPurchase = await Purchase.findOne({
        createdBy: req.user._id,
        'items.item': item._id,
        status: 'finalized'
      })
        .sort({ purchaseDate: -1 })
        .select('items');

      if (lastPurchase) {
        const purchaseItem = lastPurchase.items.find(i => i.item.toString() === item._id.toString());
        if (purchaseItem) {
          lastPurchaseRate = purchaseItem.purchaseRate;
        }
      }
    } catch (purchaseError) {
      // Purchase model might not exist yet, use costPrice
      info(`Could not fetch last purchase rate: ${purchaseError.message}`);
    }

    info(`Item scanned by ${req.user.name}: ${item.name} (code: ${trimmedCode})`);

    res.status(200).json({
      ...item.toObject(),
      lastPurchaseRate
    });
  } catch (err) {
    error(`Scan Item Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
