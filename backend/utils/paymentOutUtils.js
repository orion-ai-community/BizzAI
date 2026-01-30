import Counter from "../models/Counter.js";

/**
 * Generate unique payment out number
 * @param {ObjectId} userId - User ID
 * @returns {Promise<string>} Payment number in format PAYOUT-YYYYMMDD-XXXX
 */
export const generatePaymentOutNo = async (userId) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const counter = await Counter.findOneAndUpdate(
        { name: `paymentOut-${userId}-${dateStr}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const seqStr = String(counter.seq).padStart(4, '0');
    return `PAYOUT-${dateStr}-${seqStr}`;
};

/**
 * Validate payment allocation
 * @param {Number} totalAmount - Total payment amount
 * @param {Array} allocatedBills - Bill allocations
 * @param {Number} advanceAmount - Advance amount
 * @returns {Object} Validation result
 */
export const validatePaymentAllocation = (totalAmount, allocatedBills, advanceAmount) => {
    const totalAllocated = allocatedBills.reduce((sum, bill) => sum + bill.allocatedAmount, 0);
    const totalUsed = totalAllocated + advanceAmount;

    if (totalUsed > totalAmount) {
        return {
            valid: false,
            message: `Total allocation (₹${totalUsed.toFixed(2)}) exceeds payment amount (₹${totalAmount.toFixed(2)})`
        };
    }

    return {
        valid: true,
        totalAllocated,
        advanceAmount,
        unallocated: totalAmount - totalUsed
    };
};

/**
 * Validate bill allocation against bill outstanding
 * @param {Object} bill - Bill document
 * @param {Number} allocatedAmount - Amount to allocate
 * @returns {Object} Validation result
 */
export const validateBillAllocation = (bill, allocatedAmount) => {
    const outstanding = bill.outstandingAmount;

    if (allocatedAmount > outstanding) {
        return {
            valid: false,
            message: `Allocated amount (₹${allocatedAmount.toFixed(2)}) exceeds bill outstanding (₹${outstanding.toFixed(2)}) for bill ${bill.billNo}`
        };
    }

    if (allocatedAmount <= 0) {
        return {
            valid: false,
            message: `Allocated amount must be greater than zero for bill ${bill.billNo}`
        };
    }

    return {
        valid: true,
        outstanding
    };
};

/**
 * Apply payment to bill
 * @param {Object} bill - Bill document
 * @param {Number} amount - Payment amount
 * @param {ObjectId} paymentOutId - PaymentOut ID
 * @returns {Promise<Object>} Updated bill
 */
export const applyPaymentOutToBill = async (bill, amount, paymentOutId) => {
    bill.paidAmount += amount;
    bill.outstandingAmount = bill.totalAmount - bill.paidAmount - bill.totalCreditApplied;

    // Update payment status
    if (bill.outstandingAmount <= 0) {
        bill.paymentStatus = 'paid';
    } else if (bill.paidAmount > 0 || bill.totalCreditApplied > 0) {
        bill.paymentStatus = 'partial';
    }

    // Add to audit log
    bill.auditLog.push({
        action: 'payment_recorded',
        performedBy: bill.createdBy,
        performedAt: new Date(),
        details: `Payment of ₹${amount.toFixed(2)} recorded via PaymentOut ${paymentOutId}`,
        changes: {
            paymentAmount: amount,
            paymentOutId
        }
    });

    await bill.save();
    return bill;
};

/**
 * Reverse payment from bill
 * @param {Object} bill - Bill document
 * @param {Number} amount - Payment amount to reverse
 * @param {ObjectId} paymentOutId - PaymentOut ID
 * @returns {Promise<Object>} Updated bill
 */
export const reversePaymentFromBill = async (bill, amount, paymentOutId) => {
    bill.paidAmount -= amount;
    bill.outstandingAmount = bill.totalAmount - bill.paidAmount - bill.totalCreditApplied;

    // Update payment status
    if (bill.outstandingAmount <= 0) {
        bill.paymentStatus = 'paid';
    } else if (bill.paidAmount > 0 || bill.totalCreditApplied > 0) {
        bill.paymentStatus = 'partial';
    } else {
        bill.paymentStatus = 'unpaid';
    }

    // Add to audit log
    bill.auditLog.push({
        action: 'payment_recorded',
        performedBy: bill.createdBy,
        performedAt: new Date(),
        details: `Payment of ₹${amount.toFixed(2)} reversed from PaymentOut ${paymentOutId}`,
        changes: {
            paymentAmount: -amount,
            paymentOutId
        }
    });

    await bill.save();
    return bill;
};
