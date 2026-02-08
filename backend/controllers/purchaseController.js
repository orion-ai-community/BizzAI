import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Item from "../models/Item.js";
import Supplier from "../models/Supplier.js";
import Counter from "../models/Counter.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import BankAccount from "../models/BankAccount.js";
import { info, error } from "../utils/logger.js";
import { logStockMovement } from "../utils/stockMovementLogger.js";
import { validateStockLevels } from "../utils/inventoryValidator.js";
import { createBillFromPurchase } from "../utils/billUtils.js";
import {
    calculatePurchaseItemTotal,
    calculateRoundOff,
    extractStateFromGSTIN,
    isInterStatePurchase,
} from "../utils/gstCalculator.js";

/**
 * @desc Create a new purchase
 * @route POST /api/purchases
 */
export const createPurchase = async (req, res) => {
    try {
        const {
            purchaseDate,
            supplierInvoiceNo,
            supplierInvoiceDate,
            dueDate,
            supplierId,
            purchaseType,
            referenceNo,
            notes,
            items,
            billDiscount = 0,
            shippingCharges = 0,
            paidAmount = 0,
            paymentMethod = "cash",
            bankAccount,
            paymentReference,
            status = "finalized", // Can be 'draft' or 'finalized'
        } = req.body;

        // Validation
        if (!supplierId) {
            return res.status(400).json({ success: false, message: "Supplier is required" });
        }

        if (!supplierInvoiceNo) {
            return res.status(400).json({ success: false, message: "Supplier invoice number is required" });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "At least one item is required" });
        }

        // Validate supplier ownership
        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            return res.status(400).json({ success: false, message: "Invalid supplier ID format" });
        }

        const supplier = await Supplier.findOne({
            _id: supplierId,
            owner: req.user._id,
        });

        if (!supplier) {
            return res.status(404).json({ success: false, message: "Supplier not found or unauthorized" });
        }

        // Get business state from user's GST number
        const businessState = extractStateFromGSTIN(req.user.gstNumber || "");
        const supplierState = supplier.state || extractStateFromGSTIN(supplier.gstNo);
        const isInterState = isInterStatePurchase(businessState, supplierState);

        // Validate and calculate items
        let subtotal = 0;
        let itemDiscount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        const processedItems = [];

        for (const itemData of items) {
            // Validate item ownership
            if (!mongoose.Types.ObjectId.isValid(itemData.item)) {
                return res.status(400).json({ success: false, message: `Invalid item ID format: ${itemData.item}` });
            }

            const item = await Item.findOne({
                _id: itemData.item,
                addedBy: req.user._id,
            });

            if (!item) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid item ID or item not found: ${itemData.item}`,
                });
            }

            // Validate quantities
            if (itemData.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for item ${item.name}`,
                });
            }

            if (itemData.purchaseRate < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid purchase rate for item ${item.name}`,
                });
            }

            // Calculate item totals
            const calculation = calculatePurchaseItemTotal(
                itemData.quantity,
                itemData.purchaseRate,
                itemData.discount || 0,
                itemData.taxRate || 0,
                isInterState
            );

            subtotal += calculation.baseAmount;
            itemDiscount += calculation.discount;
            totalCGST += calculation.cgst;
            totalSGST += calculation.sgst;
            totalIGST += calculation.igst;

            processedItems.push({
                item: item._id,
                itemName: item.name,
                quantity: itemData.quantity,
                purchaseRate: itemData.purchaseRate,
                sellingPrice: itemData.sellingPrice || item.sellingPrice,
                taxRate: itemData.taxRate || 0,
                discount: itemData.discount || 0,
                hsnCode: itemData.hsnCode || item.hsnCode || "",
                barcode: itemData.barcode || item.barcode || "",
                batchNo: itemData.batchNo || "",
                expiryDate: itemData.expiryDate || null,
                taxableValue: calculation.taxableValue,
                cgst: calculation.cgst,
                sgst: calculation.sgst,
                igst: calculation.igst,
                total: calculation.total,
            });
        }

        // Calculate final totals
        const beforeRoundOff = subtotal - itemDiscount - billDiscount + shippingCharges + totalCGST + totalSGST + totalIGST;
        const { roundedAmount, roundOff } = calculateRoundOff(beforeRoundOff);
        const totalAmount = roundedAmount;

        // Determine payment status
        let paymentStatus = "unpaid";
        if (paidAmount >= totalAmount) {
            paymentStatus = "paid";
        } else if (paidAmount > 0) {
            paymentStatus = "partial";
        }

        const outstandingAmount = totalAmount - paidAmount;

        // Generate unique purchase number
        const purchaseNumber = await Counter.getNextSequence("purchase", req.user._id);
        const purchaseNo = `PUR-${String(purchaseNumber).padStart(5, "0")}`;

        // Create purchase
        const purchase = await Purchase.create(
            [
                {
                    purchaseNo,
                    purchaseDate: purchaseDate || Date.now(),
                    supplierInvoiceNo,
                    supplierInvoiceDate: supplierInvoiceDate || Date.now(),
                    dueDate: dueDate || null,
                    supplier: supplierId,
                    purchaseType,
                    referenceNo: referenceNo || "",
                    notes: notes || "",
                    items: processedItems,
                    subtotal,
                    itemDiscount,
                    billDiscount,
                    shippingCharges,
                    totalCGST,
                    totalSGST,
                    totalIGST,
                    roundOff,
                    totalAmount,
                    paidAmount,
                    paymentMethod,
                    bankAccount: paymentMethod === "bank" ? bankAccount : null,
                    paymentStatus,
                    outstandingAmount,
                    paymentReference: paymentReference || "",
                    status,
                    finalizedAt: status === "finalized" ? Date.now() : null,
                    createdBy: req.user._id,
                },
            ],
            {}
        );

        // If finalized, update inventory and accounting
        if (status === "finalized") {
            // Update inventory
            for (const itemData of processedItems) {
                const item = await Item.findById(itemData.item);

                // Capture previous state for stock movement logging
                const previousState = {
                    stockQty: item.stockQty,
                    reservedStock: item.reservedStock || 0,
                    inTransitStock: item.inTransitStock || 0,
                };

                // Atomic stock increase using $inc for concurrency safety
                const updatedItem = await Item.findByIdAndUpdate(
                    itemData.item,
                    {
                        $inc: { stockQty: itemData.quantity }
                    },
                    { new: true }
                );

                // Update cost price (weighted average) and other fields
                const totalCost = item.costPrice * previousState.stockQty + itemData.purchaseRate * itemData.quantity;
                const totalQty = previousState.stockQty + itemData.quantity;
                updatedItem.costPrice = totalQty > 0 ? totalCost / totalQty : itemData.purchaseRate;

                // Update selling price if provided
                if (itemData.sellingPrice > 0) {
                    updatedItem.sellingPrice = itemData.sellingPrice;
                }

                // Update barcode if provided
                if (itemData.barcode) {
                    updatedItem.barcode = itemData.barcode;
                }

                // Handle batch tracking
                if (updatedItem.trackBatch && itemData.batchNo) {
                    updatedItem.batches.push({
                        batchNo: itemData.batchNo,
                        quantity: itemData.quantity,
                        expiryDate: itemData.expiryDate || null,
                        purchaseRate: itemData.purchaseRate,
                        purchaseDate: purchaseDate || Date.now(),
                    });
                }

                // Validate stock levels
                validateStockLevels(updatedItem);

                // Save other field updates (cost price, selling price, barcode, batches)
                await updatedItem.save({});

                // Capture new state
                const newState = {
                    stockQty: updatedItem.stockQty,
                    reservedStock: updatedItem.reservedStock || 0,
                    inTransitStock: updatedItem.inTransitStock || 0,
                };

                // Log stock movement
                await logStockMovement(
                    updatedItem,
                    "PURCHASE",
                    itemData.quantity,
                    purchase[0]._id,
                    "Purchase",
                    req.user._id,
                    previousState,
                    newState);
            }

            // Update supplier balance
            supplier.outstandingBalance += outstandingAmount;
            supplier.totalPurchases += totalAmount;
            await supplier.save({});

            // Record payment if any
            if (paidAmount > 0) {
                if (paymentMethod === "bank" && bankAccount) {
                    // Validate bank account
                    const bankAcc = await BankAccount.findOne({
                        _id: bankAccount,
                        userId: req.user._id,
                    });

                    if (!bankAcc) {
                        return res.status(400).json({ message: "Bank account not found" });
                    }

                    // Create cashbank transaction (money OUT for purchase payment)
                    const cashbankTxn = await CashbankTransaction.create(
                        [
                            {
                                type: "out",
                                amount: paidAmount,
                                fromAccount: bankAccount,
                                toAccount: "purchase",
                                description: `Purchase payment for ${purchaseNo}`,
                                userId: req.user._id,
                            },
                        ],
                        {}
                    );

                    // Update bank balance (decrease)
                    await BankAccount.updateOne(
                        { _id: bankAccount, userId: req.user._id },
                        {
                            $inc: { currentBalance: -paidAmount },
                            $push: { transactions: cashbankTxn[0]._id },
                        },
                        {}
                    );

                    info(`Bank payment recorded for purchase ${purchaseNo}: -₹${paidAmount}`);
                } else if (paymentMethod === "cash") {
                    // Record cash payment transaction (money OUT)
                    await CashbankTransaction.create(
                        [
                            {
                                type: "out",
                                amount: paidAmount,
                                fromAccount: "cash",
                                toAccount: "purchase",
                                description: `Cash payment for purchase ${purchaseNo}`,
                                userId: req.user._id,
                            },
                        ],
                        {}
                    );

                    info(`Cash payment recorded for purchase ${purchaseNo}: -₹${paidAmount}`);
                }
            }
        }
        info(`Purchase created by ${req.user.name}: ${purchaseNo}`);

        // AUTO-CREATE BILL if purchase is finalized
        if (status === "finalized") {
            try {
                const bill = await createBillFromPurchase(purchase[0], req.user._id);
                info(`Bill ${bill.billNo} auto-created from Purchase ${purchaseNo}`);
            } catch (billError) {
                // Log error but don't fail the purchase creation
                error(`Failed to auto-create bill for Purchase ${purchaseNo}: ${billError.message}`);
            }
        }

        // Populate and return
        const populatedPurchase = await Purchase.findById(purchase[0]._id)
            .populate("supplier")
            .populate("items.item", "name sku")
            .populate({ path: "createdBy", select: "shopName name gstNumber" });

        res.status(201).json({ success: true, message: "Purchase created successfully", purchase: populatedPurchase });
    } catch (err) {
        error(`Purchase creation failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get all purchases
 * @route GET /api/purchases
 */
export const getAllPurchases = async (req, res) => {
    try {
        const { status, supplier, startDate, endDate } = req.query;

        const filter = { createdBy: req.user._id, isDeleted: false };

        if (status) {
            filter.status = status;
        }

        if (supplier) {
            filter.supplier = supplier;
        }

        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) filter.purchaseDate.$gte = new Date(startDate);
            if (endDate) filter.purchaseDate.$lte = new Date(endDate);
        }

        const purchases = await Purchase.find(filter)
            .populate("supplier", "businessName contactPersonName contactNo")
            .sort({ purchaseDate: -1, createdAt: -1 });

        res.status(200).json({ success: true, purchases });
    } catch (err) {
        error(`Get purchases failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get purchase by ID
 * @route GET /api/purchases/:id
 */
export const getPurchaseById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid purchase ID format" });
        }

        const purchase = await Purchase.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        })
            .populate("supplier")
            .populate("items.item", "name sku")
            .populate("bankAccount", "bankName accountNumber")
            .populate({ path: "createdBy", select: "shopName name gstNumber" });

        if (!purchase) {
            return res.status(404).json({ message: "Purchase not found or unauthorized" });
        }

        res.status(200).json(purchase);
    } catch (err) {
        error(`Get purchase failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get draft purchases
 * @route GET /api/purchases/drafts
 */
export const getDraftPurchases = async (req, res) => {
    try {
        const drafts = await Purchase.find({
            createdBy: req.user._id,
            status: "draft",
            isDeleted: false,
        })
            .populate("supplier", "businessName contactPersonName")
            .sort({ updatedAt: -1 });

        res.status(200).json(drafts);
    } catch (err) {
        error(`Get drafts failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Update draft purchase
 * @route PUT /api/purchases/:id
 */
export const updatePurchase = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid purchase ID format" });
        }

        const purchase = await Purchase.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchase) {
            return res.status(404).json({ message: "Purchase not found or unauthorized" });
        }

        if (purchase.status !== "draft") {
            return res.status(400).json({
                message: "Only draft purchases can be edited. Finalized purchases cannot be modified.",
            });
        }

        // Update allowed fields
        const {
            purchaseDate,
            supplierInvoiceNo,
            supplierInvoiceDate,
            dueDate,
            purchaseType,
            referenceNo,
            notes,
            items,
            billDiscount,
            shippingCharges,
            paidAmount,
            paymentMethod,
            bankAccount,
            paymentReference,
            status, // NEW: Accept status field
        } = req.body;

        // If items are updated, recalculate everything
        if (items) {
            const supplier = await Supplier.findById(purchase.supplier);
            const businessState = extractStateFromGSTIN(req.user.gstNumber || "");
            const supplierState = supplier.state || extractStateFromGSTIN(supplier.gstNo);
            const isInterState = isInterStatePurchase(businessState, supplierState);

            let subtotal = 0;
            let itemDiscount = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;
            const processedItems = [];

            for (const itemData of items) {
                const item = await Item.findOne({
                    _id: itemData.item,
                    addedBy: req.user._id,
                });

                if (!item) {
                    return res.status(400).json({ message: `Invalid item ID or item not found: ${itemData.item}` });
                }

                const calculation = calculatePurchaseItemTotal(
                    itemData.quantity,
                    itemData.purchaseRate,
                    itemData.discount || 0,
                    itemData.taxRate || 0,
                    isInterState
                );

                subtotal += calculation.baseAmount;
                itemDiscount += calculation.discount;
                totalCGST += calculation.cgst;
                totalSGST += calculation.sgst;
                totalIGST += calculation.igst;

                processedItems.push({
                    item: item._id,
                    itemName: item.name,
                    quantity: itemData.quantity,
                    purchaseRate: itemData.purchaseRate,
                    sellingPrice: itemData.sellingPrice || item.sellingPrice,
                    taxRate: itemData.taxRate || 0,
                    discount: itemData.discount || 0,
                    hsnCode: itemData.hsnCode || item.hsnCode || "",
                    barcode: itemData.barcode || item.barcode || "",
                    batchNo: itemData.batchNo || "",
                    expiryDate: itemData.expiryDate || null,
                    taxableValue: calculation.taxableValue,
                    cgst: calculation.cgst,
                    sgst: calculation.sgst,
                    igst: calculation.igst,
                    total: calculation.total,
                });
            }

            const beforeRoundOff =
                subtotal -
                itemDiscount -
                (billDiscount || 0) +
                (shippingCharges || 0) +
                totalCGST +
                totalSGST +
                totalIGST;
            const { roundedAmount, roundOff } = calculateRoundOff(beforeRoundOff);
            const totalAmount = roundedAmount;

            purchase.items = processedItems;
            purchase.subtotal = subtotal;
            purchase.itemDiscount = itemDiscount;
            purchase.billDiscount = billDiscount || 0;
            purchase.shippingCharges = shippingCharges || 0;
            purchase.totalCGST = totalCGST;
            purchase.totalSGST = totalSGST;
            purchase.totalIGST = totalIGST;
            purchase.roundOff = roundOff;
            purchase.totalAmount = totalAmount;
        }

        // Update other fields
        if (purchaseDate) purchase.purchaseDate = purchaseDate;
        if (supplierInvoiceNo) purchase.supplierInvoiceNo = supplierInvoiceNo;
        if (supplierInvoiceDate) purchase.supplierInvoiceDate = supplierInvoiceDate;
        if (dueDate !== undefined) purchase.dueDate = dueDate;
        if (purchaseType) purchase.purchaseType = purchaseType;
        if (referenceNo !== undefined) purchase.referenceNo = referenceNo;
        if (notes !== undefined) purchase.notes = notes;
        if (paidAmount !== undefined) purchase.paidAmount = paidAmount;
        if (paymentMethod) purchase.paymentMethod = paymentMethod;
        if (bankAccount !== undefined) purchase.bankAccount = bankAccount;
        if (paymentReference !== undefined) purchase.paymentReference = paymentReference;

        // Recalculate payment status and outstanding
        const totalAmt = purchase.totalAmount;
        const paid = purchase.paidAmount;
        purchase.outstandingAmount = totalAmt - paid;

        if (paid >= totalAmt) {
            purchase.paymentStatus = "paid";
        } else if (paid > 0) {
            purchase.paymentStatus = "partial";
        } else {
            purchase.paymentStatus = "unpaid";
        }

        await purchase.save({});

        // NEW: If status is changing from draft to finalized, trigger finalization
        if (status === "finalized") {
            // Update inventory
            for (const itemData of purchase.items) {
                const item = await Item.findById(itemData.item);

                const previousState = {
                    stockQty: item.stockQty,
                    reservedStock: item.reservedStock || 0,
                    inTransitStock: item.inTransitStock || 0,
                };

                item.stockQty += itemData.quantity;

                // Update cost price (weighted average)
                const totalCost = item.costPrice * previousState.stockQty + itemData.purchaseRate * itemData.quantity;
                const totalQty = previousState.stockQty + itemData.quantity;
                item.costPrice = totalQty > 0 ? totalCost / totalQty : itemData.purchaseRate;

                if (itemData.sellingPrice > 0) {
                    item.sellingPrice = itemData.sellingPrice;
                }

                // Update barcode if provided
                if (itemData.barcode) {
                    item.barcode = itemData.barcode;
                }

                if (item.trackBatch && itemData.batchNo) {
                    item.batches.push({
                        batchNo: itemData.batchNo,
                        quantity: itemData.quantity,
                        expiryDate: itemData.expiryDate || null,
                        purchaseRate: itemData.purchaseRate,
                        purchaseDate: purchase.purchaseDate,
                    });
                }

                validateStockLevels(item);
                await item.save({});

                const newState = {
                    stockQty: item.stockQty,
                    reservedStock: item.reservedStock || 0,
                    inTransitStock: item.inTransitStock || 0,
                };

                await logStockMovement(
                    item,
                    "PURCHASE",
                    itemData.quantity,
                    purchase._id,
                    "Purchase",
                    req.user._id,
                    previousState,
                    newState);
            }

            // Update supplier balance
            const supplier = await Supplier.findById(purchase.supplier);
            supplier.outstandingBalance += purchase.outstandingAmount;
            supplier.totalPurchases += purchase.totalAmount;
            await supplier.save({});

            // Record payment if any
            if (purchase.paidAmount > 0) {
                if (purchase.paymentMethod === "bank" && purchase.bankAccount) {
                    const bankAcc = await BankAccount.findOne({
                        _id: purchase.bankAccount,
                        userId: req.user._id,
                    });

                    if (!bankAcc) {
                        return res.status(400).json({ message: "Bank account not found" });
                    }

                    const cashbankTxn = await CashbankTransaction.create(
                        [
                            {
                                type: "out",
                                amount: purchase.paidAmount,
                                fromAccount: purchase.bankAccount,
                                toAccount: "purchase",
                                description: `Purchase payment for ${purchase.purchaseNo}`,
                                userId: req.user._id,
                            },
                        ],
                        {}
                    );

                    await BankAccount.updateOne(
                        { _id: purchase.bankAccount, userId: req.user._id },
                        {
                            $inc: { currentBalance: -purchase.paidAmount },
                            $push: { transactions: cashbankTxn[0]._id },
                        },
                        {}
                    );
                } else if (purchase.paymentMethod === "cash") {
                    await CashbankTransaction.create(
                        [
                            {
                                type: "out",
                                amount: purchase.paidAmount,
                                fromAccount: "cash",
                                toAccount: "purchase",
                                description: `Cash payment for purchase ${purchase.purchaseNo}`,
                                userId: req.user._id,
                            },
                        ],
                        {}
                    );
                }
            }

            // Mark as finalized
            purchase.status = "finalized";
            purchase.finalizedAt = Date.now();
            await purchase.save({});
            info(`Purchase finalized: ${purchase.purchaseNo}`);

            // AUTO-CREATE BILL from finalized purchase
            try {
                const bill = await createBillFromPurchase(purchase, req.user._id);
                info(`Bill ${bill.billNo} auto-created from Purchase ${purchase.purchaseNo}`);
            } catch (billError) {
                // Log error but don't fail the purchase finalization
                error(`Failed to auto-create bill for Purchase ${purchase.purchaseNo}: ${billError.message}`);
            }
        }

        const updatedPurchase = await Purchase.findById(purchase._id)
            .populate("supplier")
            .populate("items.item", "name sku");

        res.status(200).json({
            message: status === "finalized" ? "Purchase finalized successfully" : "Purchase updated successfully",
            purchase: updatedPurchase,
        });
    } catch (err) {
        error(`Update purchase failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Finalize draft purchase
 * @route POST /api/purchases/:id/finalize
 */
export const finalizePurchase = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid purchase ID format" });
        }

        const purchase = await Purchase.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchase) {
            return res.status(404).json({ message: "Purchase not found or unauthorized" });
        }

        if (purchase.status !== "draft") {
            return res.status(400).json({ message: "Purchase is already finalized or cancelled" });
        }

        // Update inventory
        for (const itemData of purchase.items) {
            const item = await Item.findById(itemData.item);

            const previousState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock || 0,
                inTransitStock: item.inTransitStock || 0,
            };

            item.stockQty += itemData.quantity;

            // Update cost price (weighted average)
            const totalCost = item.costPrice * previousState.stockQty + itemData.purchaseRate * itemData.quantity;
            const totalQty = previousState.stockQty + itemData.quantity;
            item.costPrice = totalQty > 0 ? totalCost / totalQty : itemData.purchaseRate;

            if (itemData.sellingPrice > 0) {
                item.sellingPrice = itemData.sellingPrice;
            }

            const foundItem = await Item.findById(itemData.item);
            if (!foundItem) {
                return res.status(404).json({
                    success: false,
                    message: `Item not found: ${itemData.item}`,
                });
            }

            // Atomic stock deduction with oversell protection
            // NOTE: The provided instruction's code snippet was for stock DEDUCTION.
            // For purchase finalization, stock should INCREASE.
            // Assuming the intent was to make the stock update atomic,
            // but for an increase, the $gte condition for deduction is not applicable.
            // I will apply the atomic update for addition, and keep other updates on the 'item' object.
            const updateResult = await Item.updateOne(
                {
                    _id: itemData.item,
                },
                {
                    $inc: { stockQty: itemData.quantity }, // Stock increases for a purchase
                    $set: {
                        costPrice: item.costPrice, // Update cost price calculated above
                        sellingPrice: item.sellingPrice, // Update selling price calculated above
                        barcode: itemData.barcode || item.barcode, // Update barcode if provided
                    },
                    ...(item.trackBatch && itemData.batchNo && {
                        $push: {
                            batches: {
                                batchNo: itemData.batchNo,
                                quantity: itemData.quantity,
                                expiryDate: itemData.expiryDate || null,
                                purchaseRate: itemData.purchaseRate,
                                purchaseDate: purchase.purchaseDate,
                            }
                        }
                    })
                }
            );

            // Check if update succeeded (item existed)
            if (updateResult.modifiedCount === 0) {
                // This case should ideally not happen if item was found initially
                return res.status(400).json({
                    success: false,
                    message: `Failed to update stock for item ${foundItem.name}. Item might have been removed.`,
                });
            }

            // Get updated item for logging and further validation
            const updatedItem = await Item.findById(itemData.item);
            if (!updatedItem) {
                return res.status(404).json({
                    success: false,
                    message: `Item not found after update: ${itemData.item}`,
                });
            }

            validateStockLevels(updatedItem); // Validate with the newly updated item state

            const newState = {
                stockQty: updatedItem.stockQty, // Use updated stockQty
                reservedStock: updatedItem.reservedStock || 0,
                inTransitStock: updatedItem.inTransitStock || 0,
            };

            await logStockMovement(
                updatedItem, // Log with the updated item
                "PURCHASE",
                itemData.quantity,
                purchase._id,
                "Purchase",
                req.user._id,
                previousState,
                newState);
        }

        // Update supplier balance
        const supplier = await Supplier.findById(purchase.supplier);
        supplier.outstandingBalance += purchase.outstandingAmount;
        supplier.totalPurchases += purchase.totalAmount;
        await supplier.save({});

        // Record payment if any
        if (purchase.paidAmount > 0) {
            if (purchase.paymentMethod === "bank" && purchase.bankAccount) {
                const bankAcc = await BankAccount.findOne({
                    _id: purchase.bankAccount,
                    userId: req.user._id,
                });

                if (!bankAcc) {
                    return res.status(400).json({ message: "Bank account not found" });
                }

                const cashbankTxn = await CashbankTransaction.create(
                    [
                        {
                            type: "out",
                            amount: purchase.paidAmount,
                            fromAccount: purchase.bankAccount,
                            toAccount: "purchase",
                            description: `Purchase payment for ${purchase.purchaseNo}`,
                            userId: req.user._id,
                        },
                    ],
                    {}
                );

                await BankAccount.updateOne(
                    { _id: purchase.bankAccount, userId: req.user._id },
                    {
                        $inc: { currentBalance: -purchase.paidAmount },
                        $push: { transactions: cashbankTxn[0]._id },
                    },
                    {}
                );
            } else if (purchase.paymentMethod === "cash") {
                await CashbankTransaction.create(
                    [
                        {
                            type: "out",
                            amount: purchase.paidAmount,
                            fromAccount: "cash",
                            toAccount: "purchase",
                            description: `Cash payment for purchase ${purchase.purchaseNo}`,
                            userId: req.user._id,
                        },
                    ],
                    {}
                );
            }
        }

        // Mark as finalized
        purchase.status = "finalized";
        purchase.finalizedAt = Date.now();
        await purchase.save({});
        info(`Purchase finalized: ${purchase.purchaseNo}`);

        // AUTO-CREATE BILL from finalized purchase
        try {
            const bill = await createBillFromPurchase(purchase, req.user._id);
            info(`Bill ${bill.billNo} auto-created from Purchase ${purchase.purchaseNo}`);
        } catch (billError) {
            // Log error but don't fail the purchase finalization
            error(`Failed to auto-create bill for Purchase ${purchase.purchaseNo}: ${billError.message}`);
            // Continue with purchase response
        }

        const finalizedPurchase = await Purchase.findById(purchase._id)
            .populate("supplier")
            .populate("items.item", "name sku");

        res.status(200).json({
            message: "Purchase finalized successfully",
            purchase: finalizedPurchase,
        });
    } catch (err) {
        error(`Finalize purchase failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Cancel purchase (with full reversal)
 * @route POST /api/purchases/:id/cancel
 */
export const cancelPurchase = async (req, res) => {
    try {
        const { cancelReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid purchase ID format" });
        }

        const purchase = await Purchase.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchase) {
            return res.status(404).json({ message: "Purchase not found or unauthorized" });
        }

        if (purchase.status === "cancelled") {
            return res.status(400).json({ message: "Purchase is already cancelled" });
        }

        if (purchase.status === "draft") {
            // Just mark as cancelled, no reversal needed
            purchase.status = "cancelled";
            purchase.cancelledAt = Date.now();
            purchase.cancelReason = cancelReason || "Cancelled by user";
            await purchase.save({});

            return res.status(200).json({
                message: "Draft purchase cancelled successfully",
                purchase,
            });
        }

        // Reverse inventory changes
        for (const itemData of purchase.items) {
            const item = await Item.findById(itemData.item);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: `Item not found: ${itemData.item}`,
                });
            }

            const previousState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock || 0,
                inTransitStock: item.inTransitStock || 0,
            };

            // Atomic stock deduction with oversell protection
            const updateResult = await Item.updateOne(
                {
                    _id: itemData.item,
                    stockQty: { $gte: itemData.quantity }
                },
                {
                    $inc: { stockQty: -itemData.quantity }
                }
            );

            // Check if update succeeded (stock was sufficient)
            if (updateResult.modifiedCount === 0) {
                // Stock insufficient - allow cancellation but set to 0
                await Item.updateOne(
                    { _id: itemData.item },
                    { $set: { stockQty: 0 } }
                );
                info(`Stock went negative during cancel, set to 0 for item ${item.name}`);
            }

            // Remove batch if tracked
            if (item.trackBatch && itemData.batchNo) {
                await Item.updateOne(
                    { _id: itemData.item },
                    { $pull: { batches: { batchNo: itemData.batchNo } } }
                );
            }

            // Get updated item for logging
            const updatedItem = await Item.findById(itemData.item);
            if (!updatedItem) {
                error(`Item not found after update during purchase cancellation: ${itemData.item}`);
                continue;
            }

            const newState = {
                stockQty: updatedItem.stockQty,
                reservedStock: updatedItem.reservedStock || 0,
                inTransitStock: updatedItem.inTransitStock || 0,
            };

            // Log stock movement
            await logStockMovement(
                updatedItem,
                "PURCHASE_CANCEL",
                -itemData.quantity,
                purchase._id,
                "Purchase",
                req.user._id,
                previousState,
                newState
            );
        }

        // Reverse supplier balance
        const supplier = await Supplier.findById(purchase.supplier);
        supplier.outstandingBalance -= purchase.outstandingAmount;
        supplier.totalPurchases -= purchase.totalAmount;
        await supplier.save({});

        // Reverse payment if any
        if (purchase.paidAmount > 0) {
            if (purchase.paymentMethod === "bank" && purchase.bankAccount) {
                const cashbankTxn = await CashbankTransaction.create(
                    [
                        {
                            type: "in",
                            amount: purchase.paidAmount,
                            fromAccount: "purchase_refund",
                            toAccount: purchase.bankAccount,
                            description: `Refund for cancelled purchase ${purchase.purchaseNo}`,
                            userId: req.user._id,
                        },
                    ],
                    {}
                );

                await BankAccount.updateOne(
                    { _id: purchase.bankAccount, userId: req.user._id },
                    {
                        $inc: { currentBalance: purchase.paidAmount },
                        $push: { transactions: cashbankTxn[0]._id },
                    },
                    {}
                );
            } else if (purchase.paymentMethod === "cash") {
                await CashbankTransaction.create(
                    [
                        {
                            type: "in",
                            amount: purchase.paidAmount,
                            fromAccount: "purchase_refund",
                            toAccount: "cash",
                            description: `Cash refund for cancelled purchase ${purchase.purchaseNo}`,
                            userId: req.user._id,
                        },
                    ],
                    {}
                );
            }
        }

        // Mark as cancelled
        purchase.status = "cancelled";
        purchase.cancelledAt = Date.now();
        purchase.cancelReason = cancelReason || "Cancelled by user";
        await purchase.save({});
        info(`Purchase cancelled: ${purchase.purchaseNo}`);

        const cancelledPurchase = await Purchase.findById(purchase._id)
            .populate("supplier")
            .populate("items.item", "name sku");

        res.status(200).json({
            message: "Purchase cancelled successfully. All changes have been reversed.",
            purchase: cancelledPurchase,
        });
    } catch (err) {
        error(`Cancel purchase failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};





