import mongoose from "mongoose";
import GoodsReceivedNote from "../models/GoodsReceivedNote.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Item from "../models/Item.js";
import StockMovement from "../models/StockMovement.js";
import { generateGRNNumber } from "../utils/poNumberGenerator.js";

/**
 * @desc    Create a new GRN
 * @route   POST /api/grns
 * @access  Private
 */
export const createGRN = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { purchaseOrder: poId, grnDate, items, notes } = req.body;

        // Validate PO
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: poId,
            createdBy: req.user._id,
            isDeleted: false,
        })
            .populate("supplier")
            .session(session);

        if (!purchaseOrder) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        if (purchaseOrder.status !== "Approved" && purchaseOrder.status !== "Partially Received") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Only approved or partially received POs can have GRNs created",
            });
        }

        // Validate items
        if (!items || items.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "At least one item is required" });
        }

        // Process items
        const processedItems = [];

        for (const grnItem of items) {
            // Find corresponding PO item
            const poItem = purchaseOrder.items.find(
                (item) => item.item.toString() === grnItem.item.toString()
            );

            if (!poItem) {
                await session.abortTransaction();
                return res.status(400).json({
                    message: `Item ${grnItem.item} not found in Purchase Order`,
                });
            }

            // Validate received quantity
            const pendingQty = poItem.orderedQty - poItem.receivedQty;
            if (grnItem.receivedQty > pendingQty) {
                await session.abortTransaction();
                return res.status(400).json({
                    message: `Received quantity for item ${poItem.itemName} exceeds pending quantity`,
                    pendingQty,
                    receivedQty: grnItem.receivedQty,
                });
            }

            processedItems.push({
                item: grnItem.item,
                itemName: poItem.itemName,
                orderedQty: poItem.orderedQty,
                previouslyReceivedQty: poItem.receivedQty,
                receivedQty: grnItem.receivedQty,
                rejectedQty: grnItem.rejectedQty || 0,
                acceptedQty: grnItem.receivedQty - (grnItem.rejectedQty || 0),
                batchNo: grnItem.batchNo || "",
                expiryDate: grnItem.expiryDate || null,
                qualityCheckNotes: grnItem.qualityCheckNotes || "",
                qualityStatus: grnItem.qualityStatus || "pending",
            });
        }

        // Generate GRN number
        const grnNumber = await generateGRNNumber(req.user._id, session);

        // Create GRN
        const grn = new GoodsReceivedNote({
            grnNumber,
            grnDate: grnDate || new Date(),
            purchaseOrder: poId,
            poNumber: purchaseOrder.poNumber,
            supplier: purchaseOrder.supplier._id,
            items: processedItems,
            status: "Draft",
            notes: notes || "",
            createdBy: req.user._id,
        });

        await grn.save({ session });
        await session.commitTransaction();

        await grn.populate("supplier", "businessName contactPersonName");
        await grn.populate("items.item", "name unit");

        res.status(201).json({
            message: "GRN created successfully",
            grn,
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: "Failed to create GRN",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};

/**
 * @desc    Get all GRNs
 * @route   GET /api/grns
 * @access  Private
 */
export const getAllGRNs = async (req, res) => {
    try {
        const {
            status,
            supplier,
            purchaseOrder,
            startDate,
            endDate,
            page = 1,
            limit = 25,
            sortBy = "grnDate",
            sortOrder = "desc",
        } = req.query;

        // Build filter
        const filter = {
            createdBy: req.user._id,
            isDeleted: false,
        };

        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;
        if (purchaseOrder) filter.purchaseOrder = purchaseOrder;

        // Date range filter
        if (startDate || endDate) {
            filter.grnDate = {};
            if (startDate) filter.grnDate.$gte = new Date(startDate);
            if (endDate) filter.grnDate.$lte = new Date(endDate);
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sort
        const sort = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Execute query
        const grns = await GoodsReceivedNote.find(filter)
            .populate("supplier", "businessName contactPersonName")
            .populate("purchaseOrder", "poNumber")
            .populate("createdBy", "name email")
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await GoodsReceivedNote.countDocuments(filter);

        res.status(200).json({
            grns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch GRNs",
            error: error.message,
        });
    }
};

/**
 * @desc    Get GRN by ID
 * @route   GET /api/grns/:id
 * @access  Private
 */
export const getGRNById = async (req, res) => {
    try {
        const grn = await GoodsReceivedNote.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        })
            .populate("supplier")
            .populate("purchaseOrder")
            .populate("items.item")
            .populate("createdBy", "name email")
            .populate("finalizedBy", "name email");

        if (!grn) {
            return res.status(404).json({ message: "GRN not found" });
        }

        res.status(200).json(grn);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch GRN",
            error: error.message,
        });
    }
};

/**
 * @desc    Finalize GRN (update inventory and PO)
 * @route   POST /api/grns/:id/finalize
 * @access  Private
 */
export const finalizeGRN = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const grn = await GoodsReceivedNote.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        }).session(session);

        if (!grn) {
            await session.abortTransaction();
            return res.status(404).json({ message: "GRN not found" });
        }

        if (grn.status === "Finalized") {
            await session.abortTransaction();
            return res.status(400).json({ message: "GRN already finalized" });
        }

        // Get PO
        const purchaseOrder = await PurchaseOrder.findById(grn.purchaseOrder).session(session);
        if (!purchaseOrder) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Purchase Order not found" });
        }

        // Update inventory and PO for each item
        for (const grnItem of grn.items) {
            // Update item stock
            const item = await Item.findById(grnItem.item).session(session);
            if (item) {
                // Increase stock by accepted quantity
                item.stockQty += grnItem.acceptedQty;

                // Decrease reserved stock
                const reservedQtyToRelease = grnItem.receivedQty;
                item.reservedStock = Math.max((item.reservedStock || 0) - reservedQtyToRelease, 0);

                // Add batch if tracked
                if (item.trackBatch && grnItem.batchNo) {
                    item.batches.push({
                        batchNo: grnItem.batchNo,
                        quantity: grnItem.acceptedQty,
                        expiryDate: grnItem.expiryDate,
                        purchaseRate: 0, // Can be calculated from PO
                        purchaseDate: grn.grnDate,
                    });
                }

                await item.save({ session });

                // Create stock movement record
                const stockMovement = new StockMovement({
                    item: grnItem.item,
                    movementType: "in",
                    quantity: grnItem.acceptedQty,
                    reason: "GRN",
                    referenceNo: grn.grnNumber,
                    referenceModel: "GoodsReceivedNote",
                    referenceId: grn._id,
                    performedBy: req.user._id,
                    notes: `GRN ${grn.grnNumber} - PO ${purchaseOrder.poNumber}`,
                });
                await stockMovement.save({ session });
            }

            // Update PO item received quantity
            const poItem = purchaseOrder.items.find(
                (item) => item.item.toString() === grnItem.item.toString()
            );
            if (poItem) {
                poItem.receivedQty += grnItem.receivedQty;
            }
        }

        // Update PO status (will be handled by pre-save middleware)
        purchaseOrder.grns.push(grn._id);
        purchaseOrder.auditLog.push({
            action: "grn_created",
            performedBy: req.user._id,
            performedByName: req.user.name || req.user.email,
            details: `GRN ${grn.grnNumber} finalized`,
        });
        await purchaseOrder.save({ session });

        // Finalize GRN
        grn.status = "Finalized";
        grn.finalizedAt = new Date();
        grn.finalizedBy = req.user._id;
        await grn.save({ session });

        await session.commitTransaction();

        await grn.populate("supplier");
        await grn.populate("purchaseOrder");
        await grn.populate("items.item");

        res.status(200).json({
            message: "GRN finalized successfully",
            grn,
            purchaseOrder,
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: "Failed to finalize GRN",
            error: error.message,
        });
    } finally {
        session.endSession();
    }
};
