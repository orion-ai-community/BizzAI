import mongoose from "mongoose";
import { error as logError } from "./logger.js";

/**
 * Execute function within a database transaction
 * Automatically handles commit/rollback
 * 
 * @param {Function} callback - Async function to execute in transaction
 * @returns {Promise} Result of callback
 */
export const withTransaction = async (callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        logError("Transaction aborted", { error: error.message });
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Execute multiple operations atomically
 * 
 * @param {Array} operations - Array of async functions
 * @returns {Promise<Array>} Results of all operations
 */
export const executeAtomic = async (operations) => {
    return withTransaction(async (session) => {
        const results = [];
        for (const operation of operations) {
            const result = await operation(session);
            results.push(result);
        }
        return results;
    });
};

export default { withTransaction, executeAtomic };
