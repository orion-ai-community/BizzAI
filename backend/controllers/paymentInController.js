import mongoose from "mongoose";
import PaymentIn from "../models/PaymentIn.js";
import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import Transaction from "../models/Transaction.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import BankAccount from "../models/BankAccount.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Create a new payment in record
 * @route POST /api/payment-in
 */
export const createPaymentIn = async (req, res) => {
    try {
        const {
            customerId,
            paymentMethods,
            allocatedInvoices = [],
            creditApplied = 0,
            depositAccount,
            notes = "",
        } = req.body;

        // ===== VALIDATION =====

        // 1. Validate customer
        if (!customerId) {
            return res.status(400).json({ message: "Customer is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ message: "Invalid customer ID format" });
        }

        const customer = await Customer.findOne({
            _id: customerId,
            owner: req.user._id,
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found or unauthorized",
            });
        }

        // 2. Validate payment methods
        if (!paymentMethods || paymentMethods.length === 0) {
            return res.status(400).json({
                message: "At least one payment method is required",
            });
        }

        let totalPayment = 0;
        for (const pm of paymentMethods) {
            if (!pm.method || !pm.amount || pm.amount <= 0) {
                return res.status(400).json({
                    message: "Invalid payment method data",
                });
            }
            totalPayment += parseFloat(pm.amount);

            // Validate bank account if specified
            if (pm.bankAccount) {
                if (!mongoose.Types.ObjectId.isValid(pm.bankAccount)) {
                    return res.status(400).json({
                        message: "Invalid bank account ID format",
                    });
                }
                const bankAccount = await BankAccount.findOne({
                    _id: pm.bankAccount,
                    userId: req.user._id,
                });
                if (!bankAccount) {
                    return res.status(400).json({
                        message: "Bank account not found or unauthorized",
                    });
                }
            }
        }

        // Round to 2 decimal places
        totalPayment = Math.round(totalPayment * 100) / 100;

        // 3. Validate deposit account
        if (!depositAccount) {
            return res.status(400).json({
                message: "Deposit account is required",
            });
        }

        if (depositAccount !== "cash") {
            if (!mongoose.Types.ObjectId.isValid(depositAccount)) {
                return res.status(400).json({
                    message: "Invalid deposit account ID format",
                });
            }
            const depositBankAccount = await BankAccount.findOne({
                _id: depositAccount,
                userId: req.user._id,
            });
            if (!depositBankAccount) {
                return res.status(400).json({
                    message: "Deposit account not found or unauthorized",
                });
            }
        }

        // 4. Validate credit applied
        if (creditApplied < 0) {
            return res.status(400).json({
                message: "Credit applied cannot be negative",
            });
        }

        if (creditApplied > 0) {
            const availableCredit = customer.dues < 0 ? Math.abs(customer.dues) : 0;
            if (creditApplied > availableCredit) {
                return res.status(400).json({
                    message: `Credit applied (₹${creditApplied}) exceeds available credit (₹${availableCredit.toFixed(2)})`,
                });
            }
        }

        // 5. Validate invoice allocations
        let totalAllocated = 0;
        const validatedAllocations = [];

        for (const allocation of allocatedInvoices) {
            if (!allocation.invoice || !allocation.allocatedAmount) {
                return res.status(400).json({
                    message: "Invalid invoice allocation data",
                });
            }

            if (allocation.allocatedAmount <= 0) {
                return res.status(400).json({
                    message: "Allocated amount must be greater than zero",
                });
            }

            if (!mongoose.Types.ObjectId.isValid(allocation.invoice)) {
                return res.status(400).json({
                    message: "Invalid invoice ID format",
                });
            }

            const invoice = await Invoice.findOne({
                _id: allocation.invoice,
                createdBy: req.user._id,
                customer: customerId,
            });

            if (!invoice) {
                return res.status(404).json({
                    message: `Invoice not found or does not belong to this customer`,
                });
            }

            const invoiceBalance =
                invoice.totalAmount - invoice.paidAmount - invoice.returnedAmount;

            if (allocation.allocatedAmount > invoiceBalance) {
                return res.status(400).json({
                    message: `Allocated amount (₹${allocation.allocatedAmount}) exceeds invoice balance (₹${invoiceBalance.toFixed(2)}) for invoice ${invoice.invoiceNo}`,
                });
            }

            totalAllocated += parseFloat(allocation.allocatedAmount);
            validatedAllocations.push({
                invoice: allocation.invoice,
                allocatedAmount: allocation.allocatedAmount,
                invoiceBalanceBefore: invoiceBalance,
            });
        }

        totalAllocated = Math.round(totalAllocated * 100) / 100;

        // 6. Calculate effective payment and excess
        const effectivePayment = totalPayment + creditApplied;
        const excessAmount = Math.max(0, effectivePayment - totalAllocated);

        // Validate that we're not over-allocating
        if (totalAllocated > effectivePayment) {
            return res.status(400).json({
                message: `Total allocated (₹${totalAllocated}) exceeds total payment (₹${effectivePayment.toFixed(2)})`,
            });
        }

        // ===== CREATE RECORDS =====

        // Generate receipt number
        const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create PaymentIn record
        const paymentIn = await PaymentIn.create({
            receiptNumber,
            customer: customerId,
            paymentDate: req.body.paymentDate || new Date(),
            totalAmount: totalPayment,
            paymentMethods,
            allocatedInvoices: validatedAllocations,
            creditApplied,
            excessAmount,
            depositAccount,
            notes,
            createdBy: req.user._id,
        });

        // ===== UPDATE INVOICES =====
        for (const allocation of validatedAllocations) {
            const invoice = await Invoice.findById(allocation.invoice);
            const newPaidAmount = invoice.paidAmount + allocation.allocatedAmount;
            const newBalance =
                invoice.totalAmount - newPaidAmount - invoice.returnedAmount;

            let newPaymentStatus = "unpaid";
            if (newBalance <= 0.01) {
                newPaymentStatus = "paid";
            } else if (newPaidAmount > 0) {
                newPaymentStatus = "partial";
            }

            await Invoice.findByIdAndUpdate(
                allocation.invoice,
                {
                    $inc: { paidAmount: allocation.allocatedAmount },
                    paymentStatus: newPaymentStatus,
                }
            );
        }

        // ===== UPDATE CUSTOMER DUES =====
        // Logic:
        // 1. totalAllocated: Amount paid against invoices -> REDUCE dues
        // 2. creditApplied: Using existing credit (negative dues) -> INCREASE dues (consume credit)
        // 3. excessAmount: Payment more than invoices -> REDUCE dues (create credit)
        //
        // Net change in dues = -totalAllocated + creditApplied - excessAmount
        // Simplified: -(totalAllocated - creditApplied + excessAmount)

        const duesChange = creditApplied - totalAllocated - excessAmount;

        await Customer.findByIdAndUpdate(
            customerId,
            {
                $inc: { dues: duesChange },
            }
        );

        // ===== CREATE TRANSACTION RECORDS =====
        if (totalAllocated > 0) {
            await Transaction.create({
                type: "payment",
                customer: customerId,
                amount: totalAllocated,
                paymentMethod: paymentMethods.length === 1 ? paymentMethods[0].method : "split",
                description: `Payment received - Receipt ${receiptNumber}`,
            });
        }

        if (creditApplied > 0) {
            await Transaction.create({
                type: "payment",
                customer: customerId,
                amount: creditApplied,
                paymentMethod: "credit",
                description: `Customer credit applied - Receipt ${receiptNumber}`,
            });
        }

        if (excessAmount > 0) {
            await Transaction.create({
                type: "payment",
                customer: customerId,
                amount: -excessAmount,
                paymentMethod: "credit",
                description: `Excess payment - Customer credit created - Receipt ${receiptNumber}`,
            });
        }

        // ===== UPDATE CASH/BANK BALANCE =====
        await CashbankTransaction.create({
            type: "in",
            amount: totalPayment,
            fromAccount: "external",
            toAccount: depositAccount,
            description: `Payment In - Receipt ${receiptNumber} - Customer: ${customer.name}`,
            reference: receiptNumber,
            userId: req.user._id,
        });

        if (depositAccount !== "cash") {
            await BankAccount.findByIdAndUpdate(
                depositAccount,
                {
                    $inc: { currentBalance: totalPayment },
                }
            );
        }

        info(
            `Payment In created by ${req.user.name}: Receipt ${receiptNumber} - ₹${totalPayment} from ${customer.name}`
        );

        // Populate and return
        const populatedPayment = await PaymentIn.findById(paymentIn._id)
            .populate("customer", "name phone email dues")
            .populate("allocatedInvoices.invoice", "invoiceNo totalAmount paidAmount paymentStatus")
            .populate("createdBy", "name email");

        res.status(201).json({
            message: "Payment recorded successfully",
            payment: populatedPayment,
        });
    } catch (err) {
        console.error('=== Payment In Error ===');
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        console.error('Request body:', JSON.stringify(req.body, null, 2));
        error(`Create Payment In Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get all payment in records
 * @route GET /api/payment-in
 */
export const getPaymentInRecords = async (req, res) => {
    try {
        const payments = await PaymentIn.find({ createdBy: req.user._id })
            .populate("customer", "name phone email")
            .populate("allocatedInvoices.invoice", "invoiceNo totalAmount")
            .populate("createdBy", "name email")
            .sort({ paymentDate: -1 });

        res.status(200).json(payments);
    } catch (err) {
        error(`Get Payment In Records Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get single payment in record
 * @route GET /api/payment-in/:id
 */
export const getPaymentInById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid payment ID format" });
        }

        const payment = await PaymentIn.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        })
            .populate("customer", "name phone email dues")
            .populate("allocatedInvoices.invoice", "invoiceNo totalAmount paidAmount paymentStatus")
            .populate("createdBy", "name email");

        if (!payment) {
            return res.status(404).json({
                message: "Payment record not found or unauthorized",
            });
        }

        // Get customer's current dues for message calculation
        const customer = await Customer.findById(payment.customer._id);
        const customerCurrentDues = customer ? customer.dues : 0;

        // Add customer dues to response
        const paymentWithDues = payment.toObject();
        paymentWithDues.customerCurrentDues = customerCurrentDues;

        res.status(200).json(paymentWithDues);
    } catch (err) {
        error(`Get Payment In By ID Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get customer outstanding invoices
 * @route GET /api/payment-in/customer/:customerId/invoices
 */
export const getCustomerOutstandingInvoices = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ message: "Invalid customer ID format" });
        }

        // Verify customer belongs to user
        const customer = await Customer.findOne({
            _id: customerId,
            owner: req.user._id,
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found or unauthorized",
            });
        }

        // Fetch unpaid and partially paid invoices
        const invoices = await Invoice.find({
            customer: customerId,
            createdBy: req.user._id,
            paymentStatus: { $in: ["unpaid", "partial"] },
        })
            .select("invoiceNo createdAt totalAmount paidAmount returnedAmount paymentStatus")
            .sort({ createdAt: -1 });

        // Calculate balance for each invoice
        const invoicesWithBalance = invoices.map((inv) => ({
            _id: inv._id,
            invoiceNo: inv.invoiceNo,
            date: inv.createdAt,
            total: inv.totalAmount,
            paid: inv.paidAmount,
            returned: inv.returnedAmount,
            balance: inv.totalAmount - inv.paidAmount - inv.returnedAmount,
            paymentStatus: inv.paymentStatus,
        }));

        res.status(200).json(invoicesWithBalance);
    } catch (err) {
        error(`Get Customer Outstanding Invoices Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get customer payment info (dues, credit, outstanding invoices)
 * @route GET /api/payment-in/customer/:customerId/info
 */
export const getCustomerPaymentInfo = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ message: "Invalid customer ID format" });
        }

        // Verify customer belongs to user
        const customer = await Customer.findOne({
            _id: customerId,
            owner: req.user._id,
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found or unauthorized",
            });
        }

        // Calculate outstanding due and available credit
        const outstandingDue = customer.dues > 0 ? customer.dues : 0;
        const availableCredit = customer.dues < 0 ? Math.abs(customer.dues) : 0;

        // Fetch outstanding invoices
        const invoices = await Invoice.find({
            customer: customerId,
            createdBy: req.user._id,
            paymentStatus: { $in: ["unpaid", "partial"] },
        })
            .select("invoiceNo createdAt totalAmount paidAmount returnedAmount paymentStatus")
            .sort({ createdAt: -1 });

        const invoicesWithBalance = invoices.map((inv) => ({
            _id: inv._id,
            invoiceNo: inv.invoiceNo,
            date: inv.createdAt,
            total: inv.totalAmount,
            paid: inv.paidAmount,
            returned: inv.returnedAmount,
            balance: inv.totalAmount - inv.paidAmount - inv.returnedAmount,
            paymentStatus: inv.paymentStatus,
        }));

        res.status(200).json({
            customer: {
                _id: customer._id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
            },
            outstandingDue,
            availableCredit,
            outstandingInvoices: invoicesWithBalance,
        });
    } catch (err) {
        error(`Get Customer Payment Info Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
