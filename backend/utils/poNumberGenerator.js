import Counter from "../models/Counter.js";

/**
 * Generate Purchase Order Number in format: PO-YYYYMM-000001
 * Sequential, gap-safe, server-side generation
 * 
 * @param {ObjectId} userId - User ID for multi-tenant isolation
 * @param {Object} session - MongoDB session for transaction support
 * @returns {Promise<String>} Generated PO number
 */
export const generatePONumber = async (userId, session = null) => {
    try {
        // Get current year and month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const yearMonth = `${year}${month}`;

        // Counter name includes year-month for monthly reset
        const counterName = `po-${yearMonth}`;

        // Get next sequence number (atomic operation)
        const sequenceNumber = await Counter.getNextSequence(counterName, userId, session);

        // Format: PO-YYYYMM-000001
        const poNumber = `PO-${yearMonth}-${String(sequenceNumber).padStart(6, "0")}`;

        return poNumber;
    } catch (error) {
        throw new Error(`Failed to generate PO number: ${error.message}`);
    }
};

/**
 * Generate GRN Number in format: GRN-YYYYMM-000001
 * Sequential, gap-safe, server-side generation
 * 
 * @param {ObjectId} userId - User ID for multi-tenant isolation
 * @param {Object} session - MongoDB session for transaction support
 * @returns {Promise<String>} Generated GRN number
 */
export const generateGRNNumber = async (userId, session = null) => {
    try {
        // Get current year and month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const yearMonth = `${year}${month}`;

        // Counter name includes year-month for monthly reset
        const counterName = `grn-${yearMonth}`;

        // Get next sequence number (atomic operation)
        const sequenceNumber = await Counter.getNextSequence(counterName, userId, session);

        // Format: GRN-YYYYMM-000001
        const grnNumber = `GRN-${yearMonth}-${String(sequenceNumber).padStart(6, "0")}`;

        return grnNumber;
    } catch (error) {
        throw new Error(`Failed to generate GRN number: ${error.message}`);
    }
};
