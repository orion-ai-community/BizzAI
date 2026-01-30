import mongoose from "mongoose";
import PurchaseOrder from "../models/PurchaseOrder.js";
import GoodsReceivedNote from "../models/GoodsReceivedNote.js";
import Item from "../models/Item.js";
import Supplier from "../models/Supplier.js";
import Purchase from "../models/Purchase.js";
import { generatePONumber } from "../utils/poNumberGenerator.js";
import {
    calculatePurchaseItemTotal,
    calculateRoundOff,
    extractStateFromGSTIN,
    isInterStatePurchase,
} from "../utils/gstCalculator.js";

/**
 * @desc    Create a new purchase order
 * @route   POST /api/purchase-orders
 * @access  Private
 */
export const createPurchaseOrder = async (req, res) => {
    try {
        const {
            poDate,
            expectedDeliveryDate,
            supplier: supplierId,
            warehouse,
            items,
            billDiscount,
            shippingCharges,
            packingCharges,
            otherCharges,
            tdsAmount,
            notes,
            termsAndConditions,
        } = req.body;

        // Validate supplier
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        if (supplier.status !== "active") {
            return res.status(400).json({ message: "Supplier is not active" });
        }

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "At least one item is required" });
        }

        // Get business GSTIN from environment or settings
        const businessGSTIN = process.env.BUSINESS_GSTIN || "";
        const isInterState = isInterStatePurchase(businessGSTIN, supplier.gstNo);

        // Process items and calculate totals
        let subtotal = 0;
        let itemDiscount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        const processedItems = [];

        for (const itemData of items) {
            // Validate item exists
            const item = await Item.findById(itemData.item);
            if (!item) {
                return res.status(404).json({ message: `Item not found: ${itemData.item}` });
            }

            // Calculate item totals
            const itemTotal = calculatePurchaseItemTotal(
                itemData.quantity,
                itemData.rate,
                itemData.discount || 0,
                itemData.taxRate || 0,
                isInterState
            );

            // Build processed item
            const processedItem = {
                item: itemData.item,
                itemName: item.name,
                description: itemData.description || "",
                quantity: itemData.quantity,
                unit: itemData.unit || item.unit || "pcs",
                rate: itemData.rate,
                discount: itemData.discount || 0,
                discountType: itemData.discountType || "flat",
                taxRate: itemData.taxRate || 0,
                hsnCode: itemData.hsnCode || item.hsnCode || "",
                batchNo: itemData.batchNo || "",
                expiryDate: itemData.expiryDate || null,
                orderedQty: itemData.quantity,
                receivedQty: 0,
                pendingQty: itemData.quantity,
                taxableValue: itemTotal.taxableValue,
                cgst: itemTotal.cgst,
                sgst: itemTotal.sgst,
                igst: itemTotal.igst,
                total: itemTotal.total,
            };

            processedItems.push(processedItem);

            // Accumulate totals
            subtotal += itemTotal.taxableValue;
            itemDiscount += itemData.discount || 0;
            totalCGST += itemTotal.cgst;
            totalSGST += itemTotal.sgst;
            totalIGST += itemTotal.igst;
        }

        // Calculate final total
        const totalBeforeRoundOff =
            subtotal +
            totalCGST +
            totalSGST +
            totalIGST -
            (billDiscount || 0) +
            (shippingCharges || 0) +
            (packingCharges || 0) +
            (otherCharges || 0) -
            (tdsAmount || 0);

        const roundOffResult = calculateRoundOff(totalBeforeRoundOff);
        const roundOff = roundOffResult.roundOff;
        const totalAmount = roundOffResult.roundedAmount;

        // Validate round-off
        if (Math.abs(roundOff) > 0.5) {
            return res.status(400).json({
                message: "Round-off amount exceeds ±0.50",
                roundOff,
            });
        }

        // Generate PO number
        const poNumber = await generatePONumber(req.user._id);

        // Create purchase order
        const purchaseOrder = new PurchaseOrder({
            poNumber,
            poDate: poDate || new Date(),
            expectedDeliveryDate,
            supplier: supplierId,
            warehouse: warehouse || "",
            items: processedItems,
            subtotal,
            itemDiscount,
            billDiscount: billDiscount || 0,
            shippingCharges: shippingCharges || 0,
            packingCharges: packingCharges || 0,
            otherCharges: otherCharges || 0,
            totalCGST,
            totalSGST,
            totalIGST,
            tdsAmount: tdsAmount || 0,
            roundOff,
            totalAmount,
            status: "Draft",
            notes: notes || "",
            termsAndConditions: termsAndConditions || "",
            createdBy: req.user._id,
            auditLog: [
                {
                    action: "created",
                    performedBy: req.user._id,
                    performedByName: req.user.name || req.user.email,
                    details: "Purchase Order created",
                },
            ],
        });

        await purchaseOrder.save();

        // Populate for response
        await purchaseOrder.populate("supplier", "businessName contactPersonName gstNo");
        await purchaseOrder.populate("items.item", "name unit hsnCode");

        res.status(201).json({
            message: "Purchase Order created successfully",
            purchaseOrder,
        });
    } catch (error) {
        console.error('❌ PO Creation Error:', error.message);
        console.error('❌ Full Error:', error);
        res.status(500).json({
            message: "Failed to create purchase order",
            error: error.message,
        });
    }
};

/**
 * @desc    Get all purchase orders with filters
 * @route   GET /api/purchase-orders
 * @access  Private
 */
export const getAllPurchaseOrders = async (req, res) => {
    try {
        const {
            status,
            supplier,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            warehouse,
            search,
            page = 1,
            limit = 25,
            sortBy = "poDate",
            sortOrder = "desc",
        } = req.query;

        // Build filter
        const filter = {
            createdBy: req.user._id,
            isDeleted: false,
        };

        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;
        if (warehouse) filter.warehouse = warehouse;

        // Date range filter
        if (startDate || endDate) {
            filter.poDate = {};
            if (startDate) filter.poDate.$gte = new Date(startDate);
            if (endDate) filter.poDate.$lte = new Date(endDate);
        }

        // Amount range filter
        if (minAmount || maxAmount) {
            filter.totalAmount = {};
            if (minAmount) filter.totalAmount.$gte = parseFloat(minAmount);
            if (maxAmount) filter.totalAmount.$lte = parseFloat(maxAmount);
        }

        // Search filter (PO number, supplier name, item name)
        if (search) {
            const suppliers = await Supplier.find({
                owner: req.user._id,
                businessName: { $regex: search, $options: "i" },
            }).select("_id");

            const supplierIds = suppliers.map((s) => s._id);

            filter.$or = [
                { poNumber: { $regex: search, $options: "i" } },
                { supplier: { $in: supplierIds } },
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sort
        const sort = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Execute query
        const purchaseOrders = await PurchaseOrder.find(filter)
            .populate("supplier", "businessName contactPersonName gstNo")
            .populate("createdBy", "name email")
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PurchaseOrder.countDocuments(filter);

        res.status(200).json({
            purchaseOrders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch purchase orders",
            error: error.message,
        });
    }
};

/**
 * @desc    Get purchase order by ID
 * @route   GET /api/purchase-orders/:id
 * @access  Private
 */
export const getPurchaseOrderById = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        })
            .populate("supplier")
            .populate("items.item")
            .populate("grns")
            .populate("purchaseId")
            .populate("createdBy", "name email")
            .populate("approvedBy", "name email")
            .populate("rejectedBy", "name email")
            .populate("approvalHistory.approver", "name email");

        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        res.status(200).json(purchaseOrder);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch purchase order",
            error: error.message,
        });
    }
};

/**
 * @desc    Update purchase order (Draft only)
 * @route   PUT /api/purchase-orders/:id
 * @access  Private
 */
export const updatePurchaseOrder = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        if (purchaseOrder.status !== "Draft") {
            return res.status(400).json({
                message: "Only Draft purchase orders can be updated",
            });
        }

        const {
            poDate,
            expectedDeliveryDate,
            supplier: supplierId,
            warehouse,
            items,
            billDiscount,
            shippingCharges,
            packingCharges,
            otherCharges,
            tdsAmount,
            notes,
            termsAndConditions,
        } = req.body;

        // If supplier changed, validate
        if (supplierId && supplierId !== purchaseOrder.supplier.toString()) {
            const supplier = await Supplier.findById(supplierId);
            if (!supplier || supplier.status !== "active") {
                return res.status(400).json({ message: "Invalid supplier" });
            }
            purchaseOrder.supplier = supplierId;
        }

        // Recalculate if items changed
        if (items && items.length > 0) {
            const supplier = await Supplier.findById(purchaseOrder.supplier);
            const businessGSTIN = process.env.BUSINESS_GSTIN || "";
            const isInterState = isInterStatePurchase(businessGSTIN, supplier.gstNo);

            let subtotal = 0;
            let itemDiscount = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;

            const processedItems = [];

            for (const itemData of items) {
                const item = await Item.findById(itemData.item);
                if (!item) {
                    return res.status(404).json({ message: `Item not found: ${itemData.item}` });
                }

                const itemTotal = calculatePurchaseItemTotal(
                    itemData.quantity,
                    itemData.rate,
                    itemData.discount || 0,
                    itemData.taxRate || 0,
                    isInterState
                );

                processedItems.push({
                    item: itemData.item,
                    itemName: item.name,
                    description: itemData.description || "",
                    quantity: itemData.quantity,
                    unit: itemData.unit || item.unit || "pcs",
                    rate: itemData.rate,
                    discount: itemData.discount || 0,
                    discountType: itemData.discountType || "flat",
                    taxRate: itemData.taxRate || 0,
                    hsnCode: itemData.hsnCode || item.hsnCode || "",
                    batchNo: itemData.batchNo || "",
                    expiryDate: itemData.expiryDate || null,
                    orderedQty: itemData.quantity,
                    receivedQty: 0,
                    pendingQty: itemData.quantity,
                    taxableValue: itemTotal.taxableValue,
                    cgst: itemTotal.cgst,
                    sgst: itemTotal.sgst,
                    igst: itemTotal.igst,
                    total: itemTotal.total,
                });

                subtotal += itemTotal.taxableValue;
                itemDiscount += itemData.discount || 0;
                totalCGST += itemTotal.cgst;
                totalSGST += itemTotal.sgst;
                totalIGST += itemTotal.igst;
            }

            const totalBeforeRoundOff =
                subtotal +
                totalCGST +
                totalSGST +
                totalIGST -
                (billDiscount || 0) +
                (shippingCharges || 0) +
                (packingCharges || 0) +
                (otherCharges || 0) -
                (tdsAmount || 0);

            const roundOffResult = calculateRoundOff(totalBeforeRoundOff);
            const roundOff = roundOffResult.roundOff;

            if (Math.abs(roundOff) > 0.5) {
                return res.status(400).json({
                    message: "Round-off amount exceeds ±0.50",
                    roundOff,
                });
            }

            purchaseOrder.items = processedItems;
            purchaseOrder.subtotal = subtotal;
            purchaseOrder.itemDiscount = itemDiscount;
            purchaseOrder.totalCGST = totalCGST;
            purchaseOrder.totalSGST = totalSGST;
            purchaseOrder.totalIGST = totalIGST;
            purchaseOrder.roundOff = roundOff;
            purchaseOrder.totalAmount = roundOffResult.roundedAmount;
        }

        // Update other fields
        if (poDate) purchaseOrder.poDate = poDate;
        if (expectedDeliveryDate) purchaseOrder.expectedDeliveryDate = expectedDeliveryDate;
        if (warehouse !== undefined) purchaseOrder.warehouse = warehouse;
        if (billDiscount !== undefined) purchaseOrder.billDiscount = billDiscount;
        if (shippingCharges !== undefined) purchaseOrder.shippingCharges = shippingCharges;
        if (packingCharges !== undefined) purchaseOrder.packingCharges = packingCharges;
        if (otherCharges !== undefined) purchaseOrder.otherCharges = otherCharges;
        if (tdsAmount !== undefined) purchaseOrder.tdsAmount = tdsAmount;
        if (notes !== undefined) purchaseOrder.notes = notes;
        if (termsAndConditions !== undefined) purchaseOrder.termsAndConditions = termsAndConditions;

        purchaseOrder.updatedBy = req.user._id;
        purchaseOrder.auditLog.push({
            action: "updated",
            performedBy: req.user._id,
            performedByName: req.user.name || req.user.email,
            details: "Purchase Order updated",
        });

        await purchaseOrder.save();

        await purchaseOrder.populate("supplier");
        await purchaseOrder.populate("items.item");

        res.status(200).json({
            message: "Purchase Order updated successfully",
            purchaseOrder,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update purchase order",
            error: error.message,
        });
    }
};

/**
 * @desc    Delete purchase order (soft delete, Draft only)
 * @route   DELETE /api/purchase-orders/:id
 * @access  Private
 */
export const deletePurchaseOrder = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        if (purchaseOrder.status !== "Draft") {
            return res.status(400).json({
                message: "Only Draft purchase orders can be deleted",
            });
        }

        purchaseOrder.isDeleted = true;
        purchaseOrder.deletedAt = new Date();
        purchaseOrder.deletedBy = req.user._id;
        purchaseOrder.auditLog.push({
            action: "deleted",
            performedBy: req.user._id,
            performedByName: req.user.name || req.user.email,
            details: "Purchase Order deleted",
        });

        await purchaseOrder.save();

        res.status(200).json({ message: "Purchase Order deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete purchase order",
            error: error.message,
        });
    }
};

/**
 * @desc    Submit purchase order for approval
 * @route   POST /api/purchase-orders/:id/submit
 * @access  Private
 */
export const submitForApproval = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        if (purchaseOrder.status !== "Draft") {
            return res.status(400).json({
                message: "Only Draft purchase orders can be submitted for approval",
            });
        }

        // Determine required approval level based on amount (simplified - can be enhanced)
        let requiredLevel = 1;
        if (purchaseOrder.totalAmount > 100000) requiredLevel = 2;
        if (purchaseOrder.totalAmount > 500000) requiredLevel = 3;

        purchaseOrder.status = "Pending Approval";
        purchaseOrder.requiredApprovalLevel = requiredLevel;
        purchaseOrder.approvalHistory.push({
            approver: req.user._id,
            approverName: req.user.name || req.user.email,
            action: "submitted",
            level: 0,
            comments: "Submitted for approval",
        });
        purchaseOrder.auditLog.push({
            action: "submitted",
            performedBy: req.user._id,
            performedByName: req.user.name || req.user.email,
            details: `Submitted for approval (Level ${requiredLevel} required)`,
        });

        await purchaseOrder.save();

        res.status(200).json({
            message: "Purchase Order submitted for approval",
            purchaseOrder,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to submit purchase order",
            error: error.message,
        });
    }
};

/**
 * @desc    Approve purchase order
 * @route   POST /api/purchase-orders/:id/approve
 * @access  Private
 */
export const approvePurchaseOrder = async (req, res) => {
    try {
        const { comments } = req.body;

        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            isDeleted: false,
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        if (purchaseOrder.status !== "Pending Approval") {
            return res.status(400).json({
                message: `Cannot approve Purchase Order. Current status: ${purchaseOrder.status}. Please submit for approval first.`,
                currentStatus: purchaseOrder.status,
            });
        }

        // Update status
        purchaseOrder.status = "Approved";
        purchaseOrder.approvedBy = req.user._id;
        purchaseOrder.approvedAt = new Date();
        purchaseOrder.currentApprovalLevel = purchaseOrder.requiredApprovalLevel;

        // Add to approval history
        purchaseOrder.approvalHistory.push({
            approver: req.user._id,
            approverName: req.user.name || req.user.email,
            action: "approved",
            level: purchaseOrder.requiredApprovalLevel,
            comments: comments || "",
        });

        // Reserve inventory
        for (const poItem of purchaseOrder.items) {
            const item = await Item.findById(poItem.item);
            if (item) {
                item.reservedStock = (item.reservedStock || 0) + poItem.quantity;
                await item.save();
            }
        }

        purchaseOrder.auditLog.push({
            action: "approved",
            performedBy: req.user._id,
            performedByName: req.user.name || req.user.email,
            details: `Approved by ${req.user.name || req.user.email}`,
            changes: { comments },
        });

        await purchaseOrder.save();

        await purchaseOrder.populate("supplier");
        await purchaseOrder.populate("items.item");

        res.status(200).json({
            message: "Purchase Order approved successfully",
            purchaseOrder,
        });
    } catch (error) {
        console.error('❌ PO Approval Error:', error.message);
        console.error('❌ Full Error:', error);
        res.status(500).json({
            message: "Failed to approve purchase order",
            error: error.message,
        });
    }
};

/**
 * @desc    Reject purchase order
 * @route   POST /api/purchase-orders/:id/reject
 * @access  Private
 */
export const rejectPurchaseOrder = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            isDeleted: false,
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        if (purchaseOrder.status !== "Pending Approval") {
            return res.status(400).json({
                message: "Only pending purchase orders can be rejected",
            });
        }

        purchaseOrder.status = "Draft";
        purchaseOrder.rejectedBy = req.user._id;
        purchaseOrder.rejectedAt = new Date();
        purchaseOrder.rejectionReason = rejectionReason;

        purchaseOrder.approvalHistory.push({
            approver: req.user._id,
            approverName: req.user.name || req.user.email,
            action: "rejected",
            level: purchaseOrder.currentApprovalLevel,
            comments: rejectionReason,
        });

        purchaseOrder.auditLog.push({
            action: "rejected",
            performedBy: req.user._id,
            performedByName: req.user.name || req.user.email,
            details: `Rejected: ${rejectionReason}`,
        });

        await purchaseOrder.save();

        res.status(200).json({
            message: "Purchase Order rejected",
            purchaseOrder,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to reject purchase order",
            error: error.message,
        });
    }
};

/**
 * @desc    Cancel purchase order
 * @route   POST /api/purchase-orders/:id/cancel
 * @access  Private
 */
export const cancelPurchaseOrder = async (req, res) => {
    try {
        const { cancellationReason } = req.body;

        if (!cancellationReason) {
            return res.status(400).json({ message: "Cancellation reason is required" });
        }

        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchaseOrder) {
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        if (purchaseOrder.status === "Cancelled" || purchaseOrder.status === "Closed") {
            return res.status(400).json({
                message: "Purchase Order is already cancelled or closed",
            });
        }

        // Release reserved inventory
        if (purchaseOrder.status === "Approved" || purchaseOrder.status === "Partially Received") {
            for (const poItem of purchaseOrder.items) {
                const item = await Item.findById(poItem.item);
                if (item) {
                    const pendingQty = poItem.orderedQty - poItem.receivedQty;
                    item.reservedStock = Math.max((item.reservedStock || 0) - pendingQty, 0);
                    await item.save();
                }
            }
        }

        purchaseOrder.status = "Cancelled";
        purchaseOrder.cancelledBy = req.user._id;
        purchaseOrder.cancelledAt = new Date();
        purchaseOrder.cancellationReason = cancellationReason;

        purchaseOrder.auditLog.push({
            action: "cancelled",
            performedBy: req.user._id,
            performedByName: req.user.name || req.user.email,
            details: `Cancelled: ${cancellationReason}`,
        });

        await purchaseOrder.save();

        res.status(200).json({
            message: "Purchase Order cancelled successfully",
            purchaseOrder,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to cancel purchase order",
            error: error.message,
        });
    }
};

/**
 * @desc    Convert PO to Purchase
 * @route   POST /api/purchase-orders/:id/convert
 * @access  Private
 */
export const convertToPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        })
            .populate("supplier")
            .session(session);

        if (!purchaseOrder) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        if (purchaseOrder.status !== "Approved") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Only approved purchase orders can be converted",
            });
        }

        if (purchaseOrder.convertedToPurchase) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Purchase Order already converted to Purchase",
            });
        }

        // Create Purchase record using existing Purchase model
        const purchaseItems = purchaseOrder.items.map((poItem) => ({
            item: poItem.item,
            itemName: poItem.itemName,
            quantity: poItem.quantity,
            purchaseRate: poItem.rate,
            sellingPrice: 0, // Can be set later
            taxRate: poItem.taxRate,
            discount: poItem.discount,
            hsnCode: poItem.hsnCode,
            barcode: "",
            batchNo: poItem.batchNo,
            expiryDate: poItem.expiryDate,
            taxableValue: poItem.taxableValue,
            cgst: poItem.cgst,
            sgst: poItem.sgst,
            igst: poItem.igst,
            total: poItem.total,
        }));

        // Generate purchase number
        const Counter = (await import("../models/Counter.js")).default;
        const purchaseNumber = await Counter.getNextSequence("purchase", req.user._id, session);
        const purchaseNo = `PUR-${String(purchaseNumber).padStart(6, "0")}`;

        const purchase = new Purchase({
            purchaseNo,
            purchaseDate: new Date(),
            supplierInvoiceNo: `PO-${purchaseOrder.poNumber}`,
            supplierInvoiceDate: purchaseOrder.poDate,
            dueDate: purchaseOrder.expectedDeliveryDate,
            supplier: purchaseOrder.supplier._id,
            purchaseType: "credit",
            referenceNo: purchaseOrder.poNumber,
            notes: `Converted from PO: ${purchaseOrder.poNumber}\n${purchaseOrder.notes}`,
            items: purchaseItems,
            subtotal: purchaseOrder.subtotal,
            itemDiscount: purchaseOrder.itemDiscount,
            billDiscount: purchaseOrder.billDiscount,
            shippingCharges: purchaseOrder.shippingCharges,
            totalCGST: purchaseOrder.totalCGST,
            totalSGST: purchaseOrder.totalSGST,
            totalIGST: purchaseOrder.totalIGST,
            roundOff: purchaseOrder.roundOff,
            totalAmount: purchaseOrder.totalAmount,
            status: "draft",
            createdBy: req.user._id,
        });

        await purchase.save({ session });

        // Update PO
        purchaseOrder.convertedToPurchase = true;
        purchaseOrder.purchaseId = purchase._id;
        purchaseOrder.convertedAt = new Date();
        purchaseOrder.convertedBy = req.user._id;

        purchaseOrder.auditLog.push({
            action: "converted",
            performedBy: req.user._id,
            performedByName: req.user.name || req.user.email,
            details: `Converted to Purchase: ${purchaseNo}`,
        });

        await purchaseOrder.save({ session });
        await session.commitTransaction();

        res.status(201).json({
            message: "Purchase Order converted to Purchase successfully",
            purchase,
            purchaseOrder,
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: "Failed to convert purchase order",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    Duplicate purchase order
 * @route   POST /api/purchase-orders/:id/duplicate
 * @access  Private
 */
export const duplicatePurchaseOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const originalPO = await PurchaseOrder.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        }).session(session);

        if (!originalPO) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        // Generate new PO number
        const poNumber = await generatePONumber(req.user._id, session);

        // Create duplicate
        const duplicatePO = new PurchaseOrder({
            poNumber,
            poDate: new Date(),
            expectedDeliveryDate: originalPO.expectedDeliveryDate,
            supplier: originalPO.supplier,
            warehouse: originalPO.warehouse,
            items: originalPO.items.map((item) => ({
                ...item.toObject(),
                receivedQty: 0,
                pendingQty: item.quantity,
            })),
            subtotal: originalPO.subtotal,
            itemDiscount: originalPO.itemDiscount,
            billDiscount: originalPO.billDiscount,
            shippingCharges: originalPO.shippingCharges,
            packingCharges: originalPO.packingCharges,
            otherCharges: originalPO.otherCharges,
            totalCGST: originalPO.totalCGST,
            totalSGST: originalPO.totalSGST,
            totalIGST: originalPO.totalIGST,
            tdsAmount: originalPO.tdsAmount,
            roundOff: originalPO.roundOff,
            totalAmount: originalPO.totalAmount,
            status: "Draft",
            notes: `Duplicated from ${originalPO.poNumber}\n${originalPO.notes}`,
            termsAndConditions: originalPO.termsAndConditions,
            createdBy: req.user._id,
            auditLog: [
                {
                    action: "created",
                    performedBy: req.user._id,
                    performedByName: req.user.name || req.user.email,
                    details: `Duplicated from ${originalPO.poNumber}`,
                },
            ],
        });

        await duplicatePO.save({ session });
        await session.commitTransaction();

        await duplicatePO.populate("supplier");
        await duplicatePO.populate("items.item");

        res.status(201).json({
            message: "Purchase Order duplicated successfully",
            purchaseOrder: duplicatePO,
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: "Failed to duplicate purchase order",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    Get PO analytics
 * @route   GET /api/purchase-orders/analytics
 * @access  Private
 */
export const getPOAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        // Total POs
        const totalPOs = await PurchaseOrder.countDocuments({
            createdBy: userId,
            isDeleted: false,
        });

        // Pending approvals
        const pendingApprovals = await PurchaseOrder.countDocuments({
            createdBy: userId,
            status: "Pending Approval",
            isDeleted: false,
        });

        // Total PO value
        const totalValueResult = await PurchaseOrder.aggregate([
            { $match: { createdBy: userId, isDeleted: false } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const totalPOValue = totalValueResult.length > 0 ? totalValueResult[0].total : 0;

        // Average order value
        const avgOrderValue = totalPOs > 0 ? totalPOValue / totalPOs : 0;

        // Spend by supplier (top 10)
        const spendBySupplier = await PurchaseOrder.aggregate([
            { $match: { createdBy: userId, isDeleted: false } },
            {
                $group: {
                    _id: "$supplier",
                    totalSpend: { $sum: "$totalAmount" },
                    poCount: { $sum: 1 },
                },
            },
            { $sort: { totalSpend: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "suppliers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "supplierInfo",
                },
            },
            { $unwind: "$supplierInfo" },
            {
                $project: {
                    supplierName: "$supplierInfo.businessName",
                    totalSpend: 1,
                    poCount: 1,
                },
            },
        ]);

        res.status(200).json({
            totalPOs,
            pendingApprovals,
            totalPOValue,
            avgOrderValue,
            spendBySupplier,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch analytics",
            error: error.message,
        });
    }
};
