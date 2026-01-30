import Counter from "../models/Counter.js";

/**
 * Generate unique expense number in format: EXP-YYYYMMDD-XXX
 * @param {ObjectId} userId - User ID for user-specific numbering
 * @returns {Promise<string>} Generated expense number
 */
export const generateExpenseNumber = async (userId) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // Counter name format: expense_YYYYMMDD_userId
    const counterName = `expense_${datePrefix}_${userId}`;

    try {
        // Atomic increment to handle race conditions
        const counter = await Counter.findOneAndUpdate(
            { name: counterName },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        // Format sequence number with leading zeros (3 digits)
        const sequenceNumber = String(counter.seq).padStart(3, '0');

        return `EXP-${datePrefix}-${sequenceNumber}`;
    } catch (error) {
        throw new Error(`Failed to generate expense number: ${error.message}`);
    }
};

/**
 * Validate expense number format
 * @param {string} expenseNo - Expense number to validate
 * @returns {boolean} True if valid format
 */
export const validateExpenseNumber = (expenseNo) => {
    // Format: EXP-YYYYMMDD-XXX
    const regex = /^EXP-\d{8}-\d{3}$/;
    return regex.test(expenseNo);
};

/**
 * Extract date from expense number
 * @param {string} expenseNo - Expense number
 * @returns {Date|null} Extracted date or null if invalid
 */
export const extractDateFromExpenseNumber = (expenseNo) => {
    if (!validateExpenseNumber(expenseNo)) {
        return null;
    }

    const datePart = expenseNo.split('-')[1]; // YYYYMMDD
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(datePart.substring(6, 8));

    return new Date(year, month, day);
};
