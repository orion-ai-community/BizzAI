import mongoose from "mongoose";
import PurchaseReturn from "../models/PurchaseReturn.js";
import Purchase from "../models/Purchase.js";
import GoodsReceivedNote from "../models/GoodsReceivedNote.js";
import Supplier from "../models/Supplier.js";
import BankAccount from "../models/BankAccount.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import StockMovement from "../models/StockMovement.js";
import Item from "../models/Item.js";
import ApprovalWorkflow from "../models/ApprovalWorkflow.js";
import DebitNote from "../models/DebitNote.js";
import CreditNote from "../models/CreditNote.js";
import RefundTransaction from "../models/RefundTransaction.js";
import { info, error } from "../utils/logger.js";
import {
    calculateItemTotals,
    calculateReturnTotals,
    validateGSTReversal,
    calculateSupplierPayableAdjustment,
    generateReturnNumber,
} from "../utils/returnCalculations.js";
import {
    validateReturnQuantities,
    validateReturnDates,
    validateApprovalRequired,
    validatePurchaseReturn,
} from "../utils/returnValidations.js";

/**
 * @desc Get purchases/GRNs available for return
 * @route GET /api/purchase-returns/purchases-for-return
 */
export const getPurchasesForReturn = async (req, res) => {
    try {
        const { search, type = "purchase" } = req.query;

        let query = {
            createdBy: req.user._id,
            status: "finalized",
            isDeleted: false,
        };

        if (search) {
            if (type === "purchase") {
                query.$or = [
                    { purchaseNo: { $regex: search, $options: "i" } },
                    { supplierInvoiceNo: { $regex: search, $options: "i" } },
                ];
            } else {
                query.$or = [
                    { grnNumber: { $regex: search, $options: "i" } },
                    { poNumber: { $regex: search, $options: "i" } },
                ];
            }
        }

        let documents;
        if (type === "purchase") {
            documents = await Purchase.find(query)
                .populate("supplier", "businessName contactPersonName")
                .sort({ purchaseDate: -1 })
                .limit(50);
        } else {
            documents = await GoodsReceivedNote.find(query)
                .populate("supplier", "businessName contactPersonName")
                .populate("purchaseOrder", "poNumber")
                .sort({ grnDate: -1 })
                .limit(50);
        }

        res.status(200).json(documents);
    } catch (err) {
        error(`Get purchases for return error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Validate return quantities
 * @route POST /api/purchase-returns/validate-quantities
 */
export const validateReturnQuantitiesAPI = async (req, res) => {
    try {
        const { purchaseId, sourceType, items } = req.body;

        const validation = await validateReturnQuantities(
            purchaseId,
            sourceType,
            items,
            req.user._id
        );

        res.status(200).json(validation);
    } catch (err) {
        error(`Validate return quantities error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Create purchase return (draft)
 * @route POST /api/purchase-returns
 */
export const createPurchaseReturn = async (req, res) => {
    try {
        const {
            originalPurchase,
            originalGRN,
            supplier,
            returnType,
            returnReason,
            warehouse,
            items,
            billDiscount = 0,
            tdsAmount = 0,
            transportCharges = 0,
            handlingCharges = 0,
            restockingFee = 0,
            refundMode,
            bankAccount,
            notes = "",
            internalNotes = "",
            returnDate,
        } = req.body;

        // Comprehensive validation
        const validation = await validatePurchaseReturn({
            ...req.body,
            createdBy: req.user._id,
        });

        if (!validation.valid) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validation.errors,
            });
        }

        // Fetch supplier for GST calculation
        const supplierDoc = await Supplier.findById(supplier);
        if (!supplierDoc) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        // Get business state from user settings (assuming stored in user or settings)
        // For now, using a default - this should be fetched from business settings
        const businessState = "MH"; // TODO: Fetch from business settings

        // Calculate item-level totals
        const calculatedItems = items.map((item) => {
            const itemTotals = calculateItemTotals(
                item,
                supplierDoc.state,
                businessState
            );
            return {
                ...item,
                ...itemTotals,
            };
        });

        // Calculate return totals
        const totals = calculateReturnTotals(calculatedItems, billDiscount, {
            tdsAmount,
            transportCharges,
            handlingCharges,
            restockingFee,
        });

        // Generate return number
        const currentYear = new Date().getFullYear();
        const count = await PurchaseReturn.countDocuments({
            createdBy: req.user._id,
            returnId: { $regex: `^PR-${currentYear}` },
        });
        const returnId = generateReturnNumber(count, currentYear);

        // Check if approval is required
        const approvalRequired = validateApprovalRequired(totals.totalAmount);

        // Create purchase return
        const purchaseReturn = await PurchaseReturn.create({
            returnId,
            returnDate: returnDate || new Date(),
            originalPurchase,
            originalGRN,
            supplier,
            returnType,
            returnReason,
            warehouse,
            items: calculatedItems,
            ...totals,
            refundMode,
            bankAccount,
            notes,
            internalNotes,
            status: "draft",
            approvalRequired,
            createdBy: req.user._id,
        });

        info(`Purchase return created: ${returnId} - Draft`);
        res.status(201).json(purchaseReturn);
    } catch (err) {
        error(`Create purchase return error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Update purchase return (draft only)
 * @route PUT /api/purchase-returns/:id
 */
export const updatePurchaseReturn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const purchaseReturn = await PurchaseReturn.findOne({
            _id: id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchaseReturn) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Purchase return not found" });
        }

        if (purchaseReturn.status !== "draft") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Only draft returns can be updated",
            });
        }

        // Update logic similar to create, but updating existing document
        // ... (implementation similar to create with validation)

        await session.commitTransaction();
        res.status(200).json(purchaseReturn);
    } catch (err) {
        await session.abortTransaction();
        error(`Update purchase return error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc Submit purchase return for approval
 * @route POST /api/purchase-returns/:id/submit-for-approval
 */
export const submitForApproval = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const purchaseReturn = await PurchaseReturn.findOne({
            _id: id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchaseReturn) {
            return res.status(404).json({ message: "Purchase return not found" });
        }

        if (purchaseReturn.status !== "draft") {
            return res.status(400).json({
                message: "Only draft returns can be submitted for approval",
            });
        }

        // If approval not required, auto-approve and process
        if (!purchaseReturn.approvalRequired) {
            purchaseReturn.status = "approved";
            purchaseReturn.approvedBy = req.user._id;
            purchaseReturn.approvedAt = new Date();
            await purchaseReturn.save();

            // Process the return (inventory + finance)
            await processApprovedReturn(purchaseReturn);

            info(`Purchase return auto-approved: ${purchaseReturn.returnId}`);
            return res.status(200).json({
                message: "Purchase return approved and processed",
                purchaseReturn,
            });
        }

        // Create approval workflow
        // For now, using a simple single-level approval
        // TODO: Implement multi-level approval based on configuration
        const approvalWorkflow = await ApprovalWorkflow.create({
            entityType: "PurchaseReturn",
            entityId: purchaseReturn._id,
            entityNumber: purchaseReturn.returnId,
            approvalLevels: [
                {
                    level: 1,
                    approver: req.user._id, // TODO: Get actual approver from config
                    approverName: req.user.name,
                    approverEmail: req.user.email,
                    status: "pending",
                },
            ],
            amount: purchaseReturn.totalAmount,
            submittedBy: req.user._id,
        });

        purchaseReturn.status = "pending_approval";
        purchaseReturn.approvalWorkflow = approvalWorkflow._id;
        purchaseReturn.submittedForApprovalAt = new Date();
        purchaseReturn.submittedForApprovalBy = req.user._id;
        await purchaseReturn.save();

        info(`Purchase return submitted for approval: ${purchaseReturn.returnId}`);
        res.status(200).json({
            message: "Purchase return submitted for approval",
            purchaseReturn,
            approvalWorkflow,
        });
    } catch (err) {
        error(`Submit for approval error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Approve purchase return
 * @route POST /api/purchase-returns/:id/approve
 */
export const approvePurchaseReturn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { comments = "" } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const purchaseReturn = await PurchaseReturn.findOne({
            _id: id,
            isDeleted: false,
        }).populate("approvalWorkflow");

        if (!purchaseReturn) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Purchase return not found" });
        }

        if (purchaseReturn.status !== "pending_approval") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Only pending returns can be approved",
            });
        }

        // Update approval workflow
        if (purchaseReturn.approvalWorkflow) {
            const workflow = await ApprovalWorkflow.findById(
                purchaseReturn.approvalWorkflow
            );
            const currentLevel = workflow.approvalLevels.find(
                (level) => level.level === workflow.currentLevel
            );
            currentLevel.status = "approved";
            currentLevel.actionDate = new Date();
            currentLevel.comments = comments;
            workflow.status = "approved";
            workflow.finalStatus = "approved";
            workflow.completedAt = new Date();
            await workflow.save({ session });
        }

        // Update purchase return
        purchaseReturn.status = "approved";
        purchaseReturn.approvedBy = req.user._id;
        purchaseReturn.approvedAt = new Date();
        await purchaseReturn.save({ session });

        // Process the return (inventory + finance)
        await processApprovedReturn(purchaseReturn, session);

        await session.commitTransaction();

        info(`Purchase return approved: ${purchaseReturn.returnId}`);
        res.status(200).json({
            message: "Purchase return approved and processed",
            purchaseReturn,
        });
    } catch (err) {
        await session.abortTransaction();
        error(`Approve purchase return error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {
        session.endSession();
    }
};

/**
 * @desc Reject purchase return
 * @route POST /api/purchase-returns/:id/reject
 */
export const rejectPurchaseReturn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const purchaseReturn = await PurchaseReturn.findOne({
            _id: id,
            isDeleted: false,
        }).populate("approvalWorkflow");

        if (!purchaseReturn) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Purchase return not found" });
        }

        if (purchaseReturn.status !== "pending_approval") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Only pending returns can be rejected",
            });
        }

        // Update approval workflow
        if (purchaseReturn.approvalWorkflow) {
            const workflow = await ApprovalWorkflow.findById(
                purchaseReturn.approvalWorkflow
            );
            const currentLevel = workflow.approvalLevels.find(
                (level) => level.level === workflow.currentLevel
            );
            currentLevel.status = "rejected";
            currentLevel.actionDate = new Date();
            currentLevel.comments = reason;
            workflow.status = "rejected";
            workflow.finalStatus = "rejected";
            workflow.completedAt = new Date();
            await workflow.save({ session });
        }

        // Update purchase return
        purchaseReturn.status = "rejected";
        purchaseReturn.rejectedBy = req.user._id;
        purchaseReturn.rejectedAt = new Date();
        purchaseReturn.rejectionReason = reason;
        await purchaseReturn.save({ session });

        await session.commitTransaction();

        info(`Purchase return rejected: ${purchaseReturn.returnId} - ${reason}`);
        res.status(200).json({
            message: "Purchase return rejected",
            purchaseReturn,
        });
    } catch (err) {
        await session.abortTransaction();
        error(`Reject purchase return error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {
        session.endSession();
    }
};

/**
 * Helper function to process approved return
 * Handles inventory adjustment and financial transactions
 */
const processApprovedReturn = async (purchaseReturn, session) => {
    try {
        // 1. Update inventory for each item
        for (const item of purchaseReturn.items) {
            const itemDoc = await Item.findById(item.item);
            if (!itemDoc) continue;

            const returnQty = item.returnQty || item.quantity;

            // Determine stock adjustment based on disposition
            let stockAdjustment = 0;
            let movementType = "PURCHASE_RETURN_APPROVED";

            switch (item.disposition) {
                case "restock":
                    // Add back to available stock
                    stockAdjustment = -returnQty; // Negative because it's a return
                    movementType = "PURCHASE_RETURN_APPROVED";
                    break;
                case "quarantine":
                    // Don't add to available stock, track separately
                    stockAdjustment = -returnQty;
                    movementType = "PURCHASE_RETURN_QUARANTINE";
                    break;
                case "scrap":
                    // Remove from stock entirely
                    stockAdjustment = -returnQty;
                    movementType = "PURCHASE_RETURN_SCRAP";
                    break;
                case "vendor_return":
                case "repair":
                    // Don't adjust stock yet, pending return to vendor
                    stockAdjustment = -returnQty;
                    movementType = "PURCHASE_RETURN_PENDING";
                    break;
            }

            // Update item stock
            const previousStock = itemDoc.stockQty;
            itemDoc.stockQty += stockAdjustment;
            await itemDoc.save({ session });

            // Create stock movement record
            await StockMovement.create(
                [
                    {
                        item: item.item,
                        type: movementType,
                        quantity: returnQty,
                        sourceId: purchaseReturn._id,
                        sourceType: "PurchaseReturn",
                        previousStock,
                        previousReserved: itemDoc.reservedStock,
                        previousInTransit: itemDoc.inTransitStock,
                        newStock: itemDoc.stockQty,
                        newReserved: itemDoc.reservedStock,
                        newInTransit: itemDoc.inTransitStock,
                        disposition: item.disposition,
                        qualityStatus: item.condition === "resalable" ? "passed" : "failed",
                        createdBy: purchaseReturn.createdBy,
                    },
                ],
                { session }
            );
        }

        // 2. Adjust supplier payable
        const adjustmentAmount = calculateSupplierPayableAdjustment(purchaseReturn);
        await Supplier.findByIdAndUpdate(
            purchaseReturn.supplier,
            {
                $inc: {
                    outstandingBalance: -adjustmentAmount,
                    totalReturns: adjustmentAmount,
                    returnCount: 1,
                },
                lastReturnDate: new Date(),
            },
            { session }
        );

        // 3. Process refund based on refund mode
        await processRefund(purchaseReturn, session);

        // 4. Update purchase return status
        purchaseReturn.status = "completed";
        purchaseReturn.completedAt = new Date();
        purchaseReturn.processedAt = new Date();
        purchaseReturn.processedBy = purchaseReturn.approvedBy;
        await purchaseReturn.save({ session });

        info(`Purchase return processed: ${purchaseReturn.returnId}`);
    } catch (err) {
        error(`Process approved return error: ${err.message}`);
        throw err;
    }
};

/**
 * Helper function to process refund
 */
const processRefund = async (purchaseReturn, session) => {
    try {
        const refundAmount = purchaseReturn.totalAmount;

        // Generate refund number
        const count = await RefundTransaction.countDocuments({
            createdBy: purchaseReturn.createdBy,
        });
        const refundNo = `RF-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

        let refundTransaction;

        switch (purchaseReturn.refundMode) {
            case "cash":
                // Create cash refund transaction
                const cashTxn = await CashbankTransaction.create(
                    [
                        {
                            type: "in",
                            amount: refundAmount,
                            toAccount: "cash",
                            fromAccount: "purchase_return",
                            description: `Cash refund for purchase return ${purchaseReturn.returnId}`,
                            date: new Date(),
                            userId: purchaseReturn.createdBy,
                        },
                    ],
                    { session }
                );

                refundTransaction = await RefundTransaction.create(
                    [
                        {
                            refundNo,
                            purchaseReturn: purchaseReturn._id,
                            supplier: purchaseReturn.supplier,
                            refundMethod: "cash",
                            amount: refundAmount,
                            cashbankTransaction: cashTxn[0]._id,
                            status: "completed",
                            completedAt: new Date(),
                            createdBy: purchaseReturn.createdBy,
                        },
                    ],
                    { session }
                );

                info(`Cash refund processed: +₹${refundAmount}`);
                break;

            case "bank_transfer":
                // Create bank transfer refund
                const bankAcc = await BankAccount.findOne({
                    _id: purchaseReturn.bankAccount,
                    userId: purchaseReturn.createdBy,
                });

                if (!bankAcc) {
                    throw new Error("Bank account not found");
                }

                const bankTxn = await CashbankTransaction.create(
                    [
                        {
                            type: "in",
                            amount: refundAmount,
                            toAccount: purchaseReturn.bankAccount,
                            fromAccount: "purchase_return",
                            description: `Bank refund for purchase return ${purchaseReturn.returnId}`,
                            date: new Date(),
                            userId: purchaseReturn.createdBy,
                        },
                    ],
                    { session }
                );

                await BankAccount.updateOne(
                    { _id: purchaseReturn.bankAccount },
                    {
                        $inc: { currentBalance: refundAmount },
                        $push: { transactions: bankTxn[0]._id },
                    },
                    { session }
                );

                refundTransaction = await RefundTransaction.create(
                    [
                        {
                            refundNo,
                            purchaseReturn: purchaseReturn._id,
                            supplier: purchaseReturn.supplier,
                            refundMethod: "bank_transfer",
                            amount: refundAmount,
                            bankAccount: purchaseReturn.bankAccount,
                            cashbankTransaction: bankTxn[0]._id,
                            status: "completed",
                            completedAt: new Date(),
                            createdBy: purchaseReturn.createdBy,
                        },
                    ],
                    { session }
                );

                info(`Bank refund processed: +₹${refundAmount} to ${bankAcc.bankName}`);
                break;

            case "credit_note":
                // Create credit note
                const creditNoteCount = await CreditNote.countDocuments({
                    createdBy: purchaseReturn.createdBy,
                });
                const creditNoteNo = `CN-${new Date().getFullYear()}-${String(creditNoteCount + 1).padStart(4, "0")}`;

                const creditNote = await CreditNote.create(
                    [
                        {
                            creditNoteNo,
                            purchaseReturn: purchaseReturn._id,
                            supplier: purchaseReturn.supplier,
                            amount: purchaseReturn.subtotal,
                            taxAmount: purchaseReturn.taxAmount,
                            totalAmount: refundAmount,
                            availableCredit: refundAmount,
                            status: "active",
                            createdBy: purchaseReturn.createdBy,
                        },
                    ],
                    { session }
                );

                refundTransaction = await RefundTransaction.create(
                    [
                        {
                            refundNo,
                            purchaseReturn: purchaseReturn._id,
                            supplier: purchaseReturn.supplier,
                            refundMethod: "credit_note",
                            amount: refundAmount,
                            creditNote: creditNote[0]._id,
                            status: "completed",
                            completedAt: new Date(),
                            createdBy: purchaseReturn.createdBy,
                        },
                    ],
                    { session }
                );

                purchaseReturn.creditNote = creditNote[0]._id;

                info(`Credit note created: ${creditNoteNo} - ₹${refundAmount}`);
                break;

            case "adjust_payable":
                // Already adjusted in supplier payable, just create refund record
                refundTransaction = await RefundTransaction.create(
                    [
                        {
                            refundNo,
                            purchaseReturn: purchaseReturn._id,
                            supplier: purchaseReturn.supplier,
                            refundMethod: "adjust_payable",
                            amount: refundAmount,
                            status: "completed",
                            completedAt: new Date(),
                            createdBy: purchaseReturn.createdBy,
                        },
                    ],
                    { session }
                );

                info(`Payable adjusted: -₹${refundAmount} from supplier dues`);
                break;
        }

        if (refundTransaction) {
            purchaseReturn.refundTransaction = refundTransaction[0]._id;
        }
    } catch (err) {
        error(`Process refund error: ${err.message}`);
        throw err;
    }
};

/**
 * @desc Get all purchase returns with filters
 * @route GET /api/purchase-returns
 */
export const getAllPurchaseReturns = async (req, res) => {
    try {
        const {
            status,
            supplier,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            search,
            page = 1,
            limit = 20,
        } = req.query;

        let query = {
            createdBy: req.user._id,
            isDeleted: false,
        };

        // Apply filters
        if (status) {
            query.status = status;
        }
        if (supplier) {
            query.supplier = supplier;
        }
        if (startDate || endDate) {
            query.returnDate = {};
            if (startDate) query.returnDate.$gte = new Date(startDate);
            if (endDate) query.returnDate.$lte = new Date(endDate);
        }
        if (minAmount || maxAmount) {
            query.totalAmount = {};
            if (minAmount) query.totalAmount.$gte = parseFloat(minAmount);
            if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount);
        }
        if (search) {
            query.$or = [
                { returnId: { $regex: search, $options: "i" } },
                { notes: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [returns, total] = await Promise.all([
            PurchaseReturn.find(query)
                .populate("supplier", "businessName contactPersonName")
                .populate("approvalWorkflow")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            PurchaseReturn.countDocuments(query),
        ]);

        res.status(200).json({
            returns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        error(`Get all purchase returns error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get single purchase return by ID
 * @route GET /api/purchase-returns/:id
 */
export const getPurchaseReturnById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const purchaseReturn = await PurchaseReturn.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
            isDeleted: false,
        })
            .populate("supplier", "businessName contactPersonName contactNo email")
            .populate("originalPurchase")
            .populate("originalGRN")
            .populate("approvalWorkflow")
            .populate("debitNote")
            .populate("creditNote")
            .populate("refundTransaction")
            .populate("approvedBy", "name email")
            .populate("rejectedBy", "name email");

        if (!purchaseReturn) {
            return res.status(404).json({ message: "Purchase return not found" });
        }

        res.status(200).json(purchaseReturn);
    } catch (err) {
        error(`Get purchase return by ID error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Cancel purchase return
 * @route POST /api/purchase-returns/:id/cancel
 */
export const cancelPurchaseReturn = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Cancel reason is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const purchaseReturn = await PurchaseReturn.findOne({
            _id: id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchaseReturn) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Purchase return not found" });
        }

        if (purchaseReturn.status === "cancelled") {
            await session.abortTransaction();
            return res.status(400).json({ message: "Return is already cancelled" });
        }

        // If return was completed, reverse all transactions
        if (purchaseReturn.status === "completed") {
            await reverseCompletedReturn(purchaseReturn, session);
        }

        purchaseReturn.status = "cancelled";
        purchaseReturn.cancelledAt = new Date();
        purchaseReturn.cancelledBy = req.user._id;
        purchaseReturn.cancelReason = reason;
        await purchaseReturn.save({ session });

        await session.commitTransaction();

        info(`Purchase return cancelled: ${purchaseReturn.returnId} - ${reason}`);
        res.status(200).json({
            message: "Purchase return cancelled successfully",
            purchaseReturn,
        });
    } catch (err) {
        await session.abortTransaction();
        error(`Cancel purchase return error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {
        session.endSession();
    }
};

/**
 * Helper function to reverse completed return
 */
const reverseCompletedReturn = async (purchaseReturn, session) => {
    try {
        // Reverse inventory adjustments
        for (const item of purchaseReturn.items) {
            const itemDoc = await Item.findById(item.item);
            if (!itemDoc) continue;

            const returnQty = item.returnQty || item.quantity;
            const stockAdjustment = returnQty; // Positive to reverse the negative adjustment

            const previousStock = itemDoc.stockQty;
            itemDoc.stockQty += stockAdjustment;
            await itemDoc.save({ session });

            // Create reversal stock movement
            await StockMovement.create(
                [
                    {
                        item: item.item,
                        type: "PURCHASE_CANCEL",
                        quantity: returnQty,
                        sourceId: purchaseReturn._id,
                        sourceType: "PurchaseReturn",
                        previousStock,
                        previousReserved: itemDoc.reservedStock,
                        previousInTransit: itemDoc.inTransitStock,
                        newStock: itemDoc.stockQty,
                        newReserved: itemDoc.reservedStock,
                        newInTransit: itemDoc.inTransitStock,
                        createdBy: purchaseReturn.createdBy,
                    },
                ],
                { session }
            );
        }

        // Reverse supplier payable adjustment
        const adjustmentAmount = calculateSupplierPayableAdjustment(purchaseReturn);
        await Supplier.findByIdAndUpdate(
            purchaseReturn.supplier,
            {
                $inc: {
                    outstandingBalance: adjustmentAmount,
                    totalReturns: -adjustmentAmount,
                    returnCount: -1,
                },
            },
            { session }
        );

        // Reverse refund (if applicable)
        // This is complex and depends on refund mode
        // For now, just mark refund transaction as reversed
        if (purchaseReturn.refundTransaction) {
            await RefundTransaction.findByIdAndUpdate(
                purchaseReturn.refundTransaction,
                {
                    status: "reversed",
                    reversedAt: new Date(),
                    reversedBy: purchaseReturn.cancelledBy,
                    reversalReason: purchaseReturn.cancelReason,
                },
                { session }
            );
        }

        info(`Purchase return reversed: ${purchaseReturn.returnId}`);
    } catch (err) {
        error(`Reverse completed return error: ${err.message}`);
        throw err;
    }
};

/**
 * @desc Delete purchase return (soft delete)
 * @route DELETE /api/purchase-returns/:id
 */
export const deletePurchaseReturn = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const purchaseReturn = await PurchaseReturn.findOne({
            _id: id,
            createdBy: req.user._id,
            isDeleted: false,
        });

        if (!purchaseReturn) {
            return res.status(404).json({ message: "Purchase return not found" });
        }

        // Only allow deletion of draft or rejected returns
        if (!["draft", "rejected"].includes(purchaseReturn.status)) {
            return res.status(400).json({
                message: "Only draft or rejected returns can be deleted",
            });
        }

        purchaseReturn.isDeleted = true;
        purchaseReturn.deletedAt = new Date();
        purchaseReturn.deletedBy = req.user._id;
        await purchaseReturn.save();

        info(`Purchase return deleted: ${purchaseReturn.returnId}`);
        res.status(200).json({ message: "Purchase return deleted successfully" });
    } catch (err) {
        error(`Delete purchase return error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
