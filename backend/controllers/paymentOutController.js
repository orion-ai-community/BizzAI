import mongoose from "mongoose";
import PaymentOut from "../models/PaymentOut.js";
import SupplierAdvance from "../models/SupplierAdvance.js";
import Supplier from "../models/Supplier.js";
import Bill from "../models/Bill.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import BankAccount from "../models/BankAccount.js";
import { info, error } from "../utils/logger.js";
import {
    generatePaymentOutNo,
    validatePaymentAllocation,
    validateBillAllocation,
    applyPaymentOutToBill,
    reversePaymentFromBill,
} from "../utils/paymentOutUtils.js";

/**
 * @desc Create a new payment out record
 * @route POST /api/payment-out
 */
export const createPaymentOut = async (req, res) => {
    try {
        const {
            paymentDate,
            supplierId,
            totalAmount,
            paymentMethod,
            bankAccount,
            reference = "",
            notes = "",
            chequeDetails,
            allocatedBills = [],
            advanceAmount = 0,
        } = req.body;

        // ===== VALIDATION =====

        // 1. Validate supplier
        if (!supplierId) {

            return res.status(400).json({ message: "Supplier is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(supplierId)) {

            return res.status(400).json({ message: "Invalid supplier ID format" });
        }

        const supplier = await Supplier.findOne({
            _id: supplierId,
            owner: req.user._id,
        });

        if (!supplier) {

            return res.status(404).json({
                message: "Supplier not found or unauthorized",
            });
        }

        // 2. Validate payment amount
        const paymentAmount = parseFloat(totalAmount);
        if (!paymentAmount || paymentAmount <= 0) {

            return res.status(400).json({
                message: "Payment amount must be greater than zero",
            });
        }

        // 3. Validate payment method
        const validMethods = ["cash", "bank", "upi", "card", "cheque"];
        if (!validMethods.includes(paymentMethod)) {

            return res.status(400).json({
                message: "Invalid payment method",
            });
        }

        // 4. Validate bank account for non-cash payments
        const bankMethods = ["bank", "upi", "card", "cheque"];
        let bankAccountDoc = null;

        if (bankMethods.includes(paymentMethod)) {
            if (!bankAccount) {

                return res.status(400).json({
                    message: `Bank account is required for ${paymentMethod} payment`,
                });
            }

            if (!mongoose.Types.ObjectId.isValid(bankAccount)) {

                return res.status(400).json({
                    message: "Invalid bank account ID format",
                });
            }

            bankAccountDoc = await BankAccount.findOne({
                _id: bankAccount,
                userId: req.user._id,
            });

            if (!bankAccountDoc) {

                return res.status(400).json({
                    message: "Bank account not found or unauthorized",
                });
            }

            // Check bank balance (only for non-cheque payments)
            if (paymentMethod !== "cheque" && bankAccountDoc.currentBalance < paymentAmount) {

                return res.status(400).json({
                    insufficientFunds: true,
                    paymentMethod: paymentMethod,
                    bankAccountName: `${bankAccountDoc.bankName} - ****${bankAccountDoc.accountNumber.slice(-4)}`,
                    available: bankAccountDoc.currentBalance,
                    requested: paymentAmount,
                    shortfall: paymentAmount - bankAccountDoc.currentBalance,
                    message: `Insufficient bank balance. Available: ₹${bankAccountDoc.currentBalance.toFixed(2)}, Required: ₹${paymentAmount.toFixed(2)}, Shortfall: ₹${(paymentAmount - bankAccountDoc.currentBalance).toFixed(2)}`,
                });
            }
        }

        // 5. Validate cash balance for cash payments
        if (paymentMethod === "cash") {
            const cashBalance = await CashbankTransaction.getCashBalance(req.user._id);

            if (paymentAmount > cashBalance) {

                return res.status(400).json({
                    insufficientFunds: true,
                    paymentMethod: "cash",
                    available: cashBalance,
                    requested: paymentAmount,
                    shortfall: paymentAmount - cashBalance,
                    message: `Insufficient cash balance. Available: ₹${cashBalance.toFixed(2)}, Required: ₹${paymentAmount.toFixed(2)}, Shortfall: ₹${(paymentAmount - cashBalance).toFixed(2)}`,
                });
            }
        }

        // 6. Validate cheque details
        if (paymentMethod === "cheque") {
            if (!chequeDetails || !chequeDetails.chequeNumber || !chequeDetails.chequeDate) {

                return res.status(400).json({
                    message: "Cheque number and date are required for cheque payment",
                });
            }
        }

        // 7. Validate bill allocations
        const validatedAllocations = [];
        let totalAllocatedToBills = 0;

        for (const allocation of allocatedBills) {
            if (!allocation.bill || !allocation.allocatedAmount) {

                return res.status(400).json({
                    message: "Invalid bill allocation data",
                });
            }

            if (!mongoose.Types.ObjectId.isValid(allocation.bill)) {

                return res.status(400).json({
                    message: "Invalid bill ID format",
                });
            }

            const bill = await Bill.findOne({
                _id: allocation.bill,
                createdBy: req.user._id,
                supplier: supplierId,
                isDeleted: false,
            });

            if (!bill) {

                return res.status(404).json({
                    message: `Bill not found or does not belong to this supplier`,
                });
            }

            // Validate allocation amount
            const validation = validateBillAllocation(bill, allocation.allocatedAmount);
            if (!validation.valid) {

                return res.status(400).json({ message: validation.message });
            }

            totalAllocatedToBills += parseFloat(allocation.allocatedAmount);
            validatedAllocations.push({
                bill: allocation.bill,
                billNo: bill.billNo,
                allocatedAmount: allocation.allocatedAmount,
                billBalanceBefore: bill.outstandingAmount,
            });
        }

        // 8. Validate total allocation
        const allocationValidation = validatePaymentAllocation(
            paymentAmount,
            validatedAllocations,
            advanceAmount
        );

        if (!allocationValidation.valid) {

            return res.status(400).json({ message: allocationValidation.message });
        }

        // 9. Validate duplicate reference for bank payments
        if (reference && bankAccount) {
            const existingPayment = await PaymentOut.findOne({
                reference,
                bankAccount,
                createdBy: req.user._id,
                status: { $ne: "cancelled" },
            });

            if (existingPayment) {

                return res.status(400).json({
                    message: `A payment with reference "${reference}" already exists for this bank account`,
                });
            }
        }

        // ===== CREATE PAYMENT OUT RECORD =====

        const paymentNo = await generatePaymentOutNo(req.user._id);

        // Determine initial status
        let initialStatus = "completed";
        if (paymentMethod === "cheque") {
            initialStatus = "pending";
        }

        const paymentOutData = {
            paymentNo,
            paymentDate: paymentDate || new Date(),
            supplier: supplierId,
            totalAmount: paymentAmount,
            paymentMethod,
            bankAccount: bankAccount || null,
            reference,
            notes,
            allocatedBills: validatedAllocations,
            totalAllocatedToBills,
            advanceAmount: parseFloat(advanceAmount) || 0,
            status: initialStatus,
            createdBy: req.user._id,
            auditLog: [
                {
                    action: "created",
                    performedBy: req.user._id,
                    performedAt: new Date(),
                    details: `Payment created via ${paymentMethod}`,
                },
            ],
        };

        // Add cheque details if applicable
        if (paymentMethod === "cheque" && chequeDetails) {
            paymentOutData.chequeDetails = {
                chequeNumber: chequeDetails.chequeNumber,
                chequeDate: chequeDetails.chequeDate,
                chequeBank: chequeDetails.chequeBank || "",
                clearingStatus: "pending",
            };
        }

        const paymentOut = await PaymentOut.create(paymentOutData);

        // ===== UPDATE BILLS =====
        for (const allocation of validatedAllocations) {
            const bill = await Bill.findById(allocation.bill);
            await applyPaymentOutToBill(bill, allocation.allocatedAmount, paymentOut._id);
        }

        // ===== UPDATE SUPPLIER =====
        // Reduce outstanding by total allocated to bills
        supplier.outstandingBalance -= totalAllocatedToBills;

        // Handle advance
        if (advanceAmount > 0) {
            supplier.advanceBalance += advanceAmount;
            supplier.totalAdvanceGiven += advanceAmount;
        }

        await supplier.save();

        // ===== UPDATE SUPPLIER ADVANCE RECORD =====
        if (advanceAmount > 0) {
            const supplierAdvance = await SupplierAdvance.getOrCreate(supplierId, req.user._id);
            await supplierAdvance.addAdvance(advanceAmount);
        }

        // ===== CREATE CASHBANK TRANSACTION =====
        // Only create transaction for non-cheque or cleared cheques
        let transactionId = null;

        if (paymentMethod !== "cheque") {
            const cashbankTxn = await CashbankTransaction.create({
                type: "out",
                amount: paymentAmount,
                fromAccount: paymentMethod === "cash" ? "cash" : bankAccount,
                toAccount: "supplier-payment",
                description: `Payment to ${supplier.businessName} - ${paymentNo}`,
                reference: reference || paymentNo,
                date: paymentDate || new Date(),
                userId: req.user._id,
            });

            transactionId = cashbankTxn._id;

            // Update bank balance for non-cash payments
            if (paymentMethod !== "cash") {
                await BankAccount.findByIdAndUpdate(bankAccount, {
                    $inc: { currentBalance: -paymentAmount },
                    $push: { transactions: transactionId },
                });
            }
        }

        // Update payment out with transaction ID
        if (transactionId) {
            paymentOut.transactionId = transactionId;
            await paymentOut.save();
        }

        // ===== COMMIT TRANSACTION =====


        info(
            `Payment Out created by ${req.user.name}: ${paymentNo} - ₹${paymentAmount} to ${supplier.businessName}`
        );

        // Populate and return
        const populatedPayment = await PaymentOut.findById(paymentOut._id)
            .populate("supplier", "businessName contactPersonName contactNo")
            .populate("allocatedBills.bill", "billNo totalAmount paidAmount outstandingAmount")
            .populate("bankAccount", "bankName accountNumber")
            .populate("createdBy", "name email");

        res.status(201).json({
            message: "Payment recorded successfully",
            payment: populatedPayment,
        });
    } catch (err) {

        error(`Create Payment Out Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {

    }
};

/**
 * @desc Get all payment out records
 * @route GET /api/payment-out
 */
export const getPaymentOutRecords = async (req, res) => {
    try {
        const {
            supplier,
            startDate,
            endDate,
            paymentMethod,
            status,
            bankAccount,
        } = req.query;

        const filter = { createdBy: req.user._id };

        if (supplier) {
            filter.supplier = supplier;
        }

        if (startDate || endDate) {
            filter.paymentDate = {};
            if (startDate) filter.paymentDate.$gte = new Date(startDate);
            if (endDate) filter.paymentDate.$lte = new Date(endDate);
        }

        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }

        if (status) {
            filter.status = status;
        }

        if (bankAccount) {
            filter.bankAccount = bankAccount;
        }

        const payments = await PaymentOut.find(filter)
            .populate("supplier", "businessName contactPersonName contactNo")
            .populate("bankAccount", "bankName accountNumber")
            .populate("createdBy", "name email")
            .sort({ paymentDate: -1, createdAt: -1 });

        info(`Found ${payments.length} payments for user ${req.user._id}`);

        res.status(200).json(payments);
    } catch (err) {
        error(`Get Payment Out Records Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get single payment out record
 * @route GET /api/payment-out/:id
 */
export const getPaymentOutById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid payment ID format" });
        }

        const payment = await PaymentOut.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        })
            .populate("supplier", "businessName contactPersonName contactNo email physicalAddress gstNo")
            .populate("allocatedBills.bill", "billNo billDate totalAmount paidAmount outstandingAmount paymentStatus")
            .populate("bankAccount", "bankName accountNumber branch ifsc")
            .populate("transactionId")
            .populate("createdBy", "name email")
            .populate("auditLog.performedBy", "name");

        if (!payment) {
            return res.status(404).json({
                message: "Payment record not found or unauthorized",
            });
        }

        res.status(200).json(payment);
    } catch (err) {
        error(`Get Payment Out By ID Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get supplier outstanding bills
 * @route GET /api/payment-out/supplier/:supplierId/bills
 */
export const getSupplierOutstandingBills = async (req, res) => {
    try {
        const { supplierId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            return res.status(400).json({ message: "Invalid supplier ID format" });
        }

        // Verify supplier belongs to user
        const supplier = await Supplier.findOne({
            _id: supplierId,
            owner: req.user._id,
        });

        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found or unauthorized",
            });
        }

        // Fetch unpaid and partially paid bills
        const bills = await Bill.find({
            supplier: supplierId,
            createdBy: req.user._id,
            isDeleted: false,
            paymentStatus: { $in: ["unpaid", "partial", "overdue"] },
        })
            .select("billNo billDate dueDate totalAmount paidAmount outstandingAmount paymentStatus")
            .sort({ billDate: 1 });

        res.status(200).json(bills);
    } catch (err) {
        error(`Get Supplier Outstanding Bills Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get supplier payment info (outstanding, advance, bills)
 * @route GET /api/payment-out/supplier/:supplierId/info
 */
export const getSupplierPaymentInfo = async (req, res) => {
    try {
        const { supplierId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            return res.status(400).json({ message: "Invalid supplier ID format" });
        }

        // Verify supplier belongs to user
        const supplier = await Supplier.findOne({
            _id: supplierId,
            owner: req.user._id,
        });

        if (!supplier) {
            return res.status(404).json({
                message: "Supplier not found or unauthorized",
            });
        }

        // Fetch outstanding bills
        const bills = await Bill.find({
            supplier: supplierId,
            createdBy: req.user._id,
            isDeleted: false,
            paymentStatus: { $in: ["unpaid", "partial", "overdue"] },
        })
            .select("billNo billDate dueDate totalAmount paidAmount outstandingAmount paymentStatus")
            .sort({ billDate: 1 });

        // Get advance balance
        const supplierAdvance = await SupplierAdvance.findOne({
            supplier: supplierId,
            userId: req.user._id,
        });

        res.status(200).json({
            supplier: {
                _id: supplier._id,
                businessName: supplier.businessName,
                contactPersonName: supplier.contactPersonName,
                contactNo: supplier.contactNo,
                email: supplier.email,
            },
            outstandingBalance: supplier.outstandingBalance,
            advanceBalance: supplier.advanceBalance || 0,
            advanceDetails: supplierAdvance
                ? {
                    totalGiven: supplierAdvance.totalAdvanceGiven,
                    totalUsed: supplierAdvance.totalAdvanceUsed,
                    remaining: supplierAdvance.advanceRemaining,
                }
                : {
                    totalGiven: 0,
                    totalUsed: 0,
                    remaining: 0,
                },
            outstandingBills: bills,
        });
    } catch (err) {
        error(`Get Supplier Payment Info Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Cancel payment out
 * @route DELETE /api/payment-out/:id
 */
export const cancelPaymentOut = async (req, res) => {



    try {
        const { id } = req.params;
        const { reason = "" } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({ message: "Invalid payment ID format" });
        }

        const payment = await PaymentOut.findOne({
            _id: id,
            createdBy: req.user._id,
        });

        if (!payment) {

            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.status === "cancelled") {

            return res.status(400).json({ message: "Payment is already cancelled" });
        }

        // ===== REVERSE BILL PAYMENTS =====
        for (const allocation of payment.allocatedBills) {
            const bill = await Bill.findById(allocation.bill);
            if (bill) {
                await reversePaymentFromBill(bill, allocation.allocatedAmount, payment._id);
            }
        }

        // ===== REVERSE SUPPLIER UPDATES =====
        const supplier = await Supplier.findById(payment.supplier);
        if (supplier) {
            supplier.outstandingBalance += payment.totalAllocatedToBills;

            if (payment.advanceAmount > 0) {
                supplier.advanceBalance -= payment.advanceAmount;
                supplier.totalAdvanceGiven -= payment.advanceAmount;
            }

            await supplier.save();
        }

        // ===== REVERSE ADVANCE =====
        if (payment.advanceAmount > 0) {
            const supplierAdvance = await SupplierAdvance.findOne({
                supplier: payment.supplier,
                userId: req.user._id,
            });

            if (supplierAdvance) {
                supplierAdvance.totalAdvanceGiven -= payment.advanceAmount;
                await supplierAdvance.save();
            }
        }

        // ===== REVERSE CASHBANK TRANSACTION =====
        if (payment.transactionId) {
            // Delete the transaction
            await CashbankTransaction.findByIdAndDelete(payment.transactionId);

            // Restore bank balance if applicable
            if (payment.bankAccount && payment.paymentMethod !== "cash") {
                await BankAccount.findByIdAndUpdate(
                    payment.bankAccount,
                    {
                        $inc: { currentBalance: payment.totalAmount },
                        $pull: { transactions: payment.transactionId },
                    }
                );
            }
        }

        // ===== UPDATE PAYMENT STATUS =====
        payment.status = "cancelled";
        payment.cancelledAt = new Date();
        payment.cancelledBy = req.user._id;
        payment.cancellationReason = reason;
        payment.auditLog.push({
            action: "cancelled",
            performedBy: req.user._id,
            performedAt: new Date(),
            details: `Payment cancelled. Reason: ${reason || "No reason provided"}`,
        });

        await payment.save();



        info(`Payment Out cancelled by ${req.user.name}: ${payment.paymentNo}`);

        res.status(200).json({
            message: "Payment cancelled successfully",
            payment,
        });
    } catch (err) {

        error(`Cancel Payment Out Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {

    }
};

/**
 * @desc Mark cheque as cleared or bounced
 * @route POST /api/payment-out/:id/cheque-status
 */
export const markChequeClearedOrBounced = async (req, res) => {



    try {
        const { id } = req.params;
        const { status, reason = "" } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({ message: "Invalid payment ID format" });
        }

        if (!["cleared", "bounced"].includes(status)) {

            return res.status(400).json({ message: "Status must be 'cleared' or 'bounced'" });
        }

        const payment = await PaymentOut.findOne({
            _id: id,
            createdBy: req.user._id,
            paymentMethod: "cheque",
        });

        if (!payment) {

            return res.status(404).json({ message: "Cheque payment not found" });
        }

        if (payment.status === "cancelled") {

            return res.status(400).json({ message: "Cannot update cancelled payment" });
        }

        if (payment.status !== "pending") {

            return res.status(400).json({ message: "Cheque is not in pending status" });
        }

        if (status === "cleared") {
            // ===== MARK AS CLEARED =====
            payment.chequeDetails.clearingStatus = "cleared";
            payment.chequeDetails.clearedDate = new Date();
            payment.status = "cleared";

            // Create cashbank transaction
            const cashbankTxn = await CashbankTransaction.create(
                [
                    {
                        type: "out",
                        amount: payment.totalAmount,
                        fromAccount: payment.bankAccount,
                        toAccount: "supplier-payment",
                        description: `Cheque cleared - Payment to supplier - ${payment.paymentNo}`,
                        reference: payment.reference || payment.paymentNo,
                        date: new Date(),
                        userId: req.user._id,
                    },
                ]
            );

            payment.transactionId = cashbankTxn[0]._id;

            // Update bank balance
            await BankAccount.findByIdAndUpdate(
                payment.bankAccount,
                {
                    $inc: { currentBalance: -payment.totalAmount },
                    $push: { transactions: cashbankTxn[0]._id },
                }
            );

            payment.auditLog.push({
                action: "cheque_cleared",
                performedBy: req.user._id,
                performedAt: new Date(),
                details: "Cheque marked as cleared",
            });

            info(`Cheque cleared: ${payment.paymentNo}`);
        } else if (status === "bounced") {
            // ===== MARK AS BOUNCED =====
            payment.chequeDetails.clearingStatus = "bounced";
            payment.chequeDetails.bouncedDate = new Date();
            payment.chequeDetails.bounceReason = reason;
            payment.status = "bounced";

            // Reverse bill payments
            for (const allocation of payment.allocatedBills) {
                const bill = await Bill.findById(allocation.bill);
                if (bill) {
                    await reversePaymentFromBill(bill, allocation.allocatedAmount, payment._id);
                }
            }

            // Reverse supplier updates
            const supplier = await Supplier.findById(payment.supplier);
            if (supplier) {
                supplier.outstandingBalance += payment.totalAllocatedToBills;

                if (payment.advanceAmount > 0) {
                    supplier.advanceBalance -= payment.advanceAmount;
                    supplier.totalAdvanceGiven -= payment.advanceAmount;
                }

                await supplier.save();
            }

            // Reverse advance
            if (payment.advanceAmount > 0) {
                const supplierAdvance = await SupplierAdvance.findOne({
                    supplier: payment.supplier,
                    userId: req.user._id,
                });

                if (supplierAdvance) {
                    supplierAdvance.totalAdvanceGiven -= payment.advanceAmount;
                    await supplierAdvance.save();
                }
            }

            payment.auditLog.push({
                action: "cheque_bounced",
                performedBy: req.user._id,
                performedAt: new Date(),
                details: `Cheque bounced. Reason: ${reason || "No reason provided"}`,
            });

            info(`Cheque bounced: ${payment.paymentNo}`);
        }

        await payment.save();


        const populatedPayment = await PaymentOut.findById(payment._id)
            .populate("supplier", "businessName contactPersonName contactNo")
            .populate("bankAccount", "bankName accountNumber");

        res.status(200).json({
            message: `Cheque marked as ${status} successfully`,
            payment: populatedPayment,
        });
    } catch (err) {

        error(`Mark Cheque Status Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    } finally {

    }
};

/**
 * @desc Get pending cheques
 * @route GET /api/payment-out/cheques/pending
 */
export const getPendingCheques = async (req, res) => {
    try {
        const payments = await PaymentOut.find({
            createdBy: req.user._id,
            paymentMethod: "cheque",
            status: "pending",
        })
            .populate("supplier", "businessName contactPersonName contactNo")
            .populate("bankAccount", "bankName accountNumber")
            .sort({ paymentDate: 1 });

        res.status(200).json(payments);
    } catch (err) {
        error(`Get Pending Cheques Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
/**
 * @desc Get supplier-wise payment summary
 * @route GET /api/payment-out/reports/supplier-summary
 */
export const getSupplierPaymentSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchFilter = {
            createdBy: req.user._id,
            status: { $ne: "cancelled" },
        };

        if (startDate || endDate) {
            matchFilter.paymentDate = {};
            if (startDate) matchFilter.paymentDate.$gte = new Date(startDate);
            if (endDate) matchFilter.paymentDate.$lte = new Date(endDate);
        }

        const summary = await PaymentOut.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: "$supplier",
                    totalPayments: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                    totalAllocatedToBills: { $sum: "$totalAllocatedToBills" },
                    totalAdvance: { $sum: "$advanceAmount" },
                    paymentMethods: { $addToSet: "$paymentMethod" },
                },
            },
            {
                $lookup: {
                    from: "suppliers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "supplier",
                },
            },
            { $unwind: "$supplier" },
            {
                $project: {
                    supplier: {
                        _id: "$supplier._id",
                        businessName: "$supplier.businessName",
                        contactPersonName: "$supplier.contactPersonName",
                    },
                    totalPayments: 1,
                    totalAmount: 1,
                    totalAllocatedToBills: 1,
                    totalAdvance: 1,
                    paymentMethods: 1,
                    averagePayment: { $divide: ["$totalAmount", "$totalPayments"] },
                },
            },
            { $sort: { totalAmount: -1 } },
        ]);

        res.status(200).json(summary);
    } catch (err) {
        error(`Get Supplier Payment Summary Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get date-wise payment register
 * @route GET /api/payment-out/reports/date-register
 */
export const getDateWisePaymentRegister = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchFilter = {
            createdBy: req.user._id,
            status: { $ne: "cancelled" },
        };

        if (startDate || endDate) {
            matchFilter.paymentDate = {};
            if (startDate) matchFilter.paymentDate.$gte = new Date(startDate);
            if (endDate) matchFilter.paymentDate.$lte = new Date(endDate);
        }

        const register = await PaymentOut.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" },
                    },
                    totalPayments: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                    cashPayments: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$totalAmount", 0],
                        },
                    },
                    bankPayments: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentMethod", "bank"] }, "$totalAmount", 0],
                        },
                    },
                    upiPayments: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentMethod", "upi"] }, "$totalAmount", 0],
                        },
                    },
                    cardPayments: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentMethod", "card"] }, "$totalAmount", 0],
                        },
                    },
                    chequePayments: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentMethod", "cheque"] }, "$totalAmount", 0],
                        },
                    },
                },
            },
            { $sort: { _id: -1 } },
        ]);

        res.status(200).json(register);
    } catch (err) {
        error(`Get Date-wise Payment Register Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get payment method breakdown
 * @route GET /api/payment-out/reports/method-breakdown
 */
export const getPaymentMethodBreakdown = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchFilter = {
            createdBy: req.user._id,
            status: { $ne: "cancelled" },
        };

        if (startDate || endDate) {
            matchFilter.paymentDate = {};
            if (startDate) matchFilter.paymentDate.$gte = new Date(startDate);
            if (endDate) matchFilter.paymentDate.$lte = new Date(endDate);
        }

        const breakdown = await PaymentOut.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: "$paymentMethod",
                    totalPayments: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                },
            },
            { $sort: { totalAmount: -1 } },
        ]);

        res.status(200).json(breakdown);
    } catch (err) {
        error(`Get Payment Method Breakdown Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get advance payments report
 * @route GET /api/payment-out/reports/advances
 */
export const getAdvancePaymentsReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchFilter = {
            createdBy: req.user._id,
            status: { $ne: "cancelled" },
            advanceAmount: { $gt: 0 },
        };

        if (startDate || endDate) {
            matchFilter.paymentDate = {};
            if (startDate) matchFilter.paymentDate.$gte = new Date(startDate);
            if (endDate) matchFilter.paymentDate.$lte = new Date(endDate);
        }

        const advances = await PaymentOut.find(matchFilter)
            .populate("supplier", "businessName contactPersonName contactNo")
            .select("paymentNo paymentDate supplier advanceAmount totalAmount status")
            .sort({ paymentDate: -1 });

        const totalAdvanceGiven = advances.reduce((sum, payment) => sum + payment.advanceAmount, 0);

        res.status(200).json({
            advances,
            summary: {
                totalAdvancePayments: advances.length,
                totalAdvanceGiven,
            },
        });
    } catch (err) {
        error(`Get Advance Payments Report Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get unapplied advances report
 * @route GET /api/payment-out/reports/unapplied-advances
 */
export const getUnappliedAdvancesReport = async (req, res) => {
    try {
        const advances = await SupplierAdvance.find({
            userId: req.user._id,
            advanceRemaining: { $gt: 0 },
        })
            .populate("supplier", "businessName contactPersonName contactNo")
            .sort({ advanceRemaining: -1 });

        const totalUnapplied = advances.reduce((sum, adv) => sum + adv.advanceRemaining, 0);

        res.status(200).json({
            advances,
            summary: {
                suppliersWithAdvance: advances.length,
                totalUnapplied,
            },
        });
    } catch (err) {
        error(`Get Unapplied Advances Report Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
