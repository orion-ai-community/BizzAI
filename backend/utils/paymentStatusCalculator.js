/**
 * Calculate payment status based on total amount, paid amount, and credit applied
 * @param {Number} totalAmount - Total invoice amount
 * @param {Number} paidAmount - Amount paid in cash/card/UPI/bank
 * @param {Number} creditApplied - Customer credit applied (default: 0)
 * @returns {String} Payment status: "paid", "partial", or "unpaid"
 */
export const calculatePaymentStatus = (totalAmount, paidAmount, creditApplied = 0) => {
    const effectivePaid = paidAmount + creditApplied;

    if (effectivePaid >= totalAmount) {
        return "paid";
    }

    if (effectivePaid > 0) {
        return "partial";
    }

    return "unpaid";
};
