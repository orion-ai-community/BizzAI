/**
 * Transaction wrapper that gracefully handles standalone MongoDB instances
 * In production with replica sets, this will use transactions
 * In development with standalone MongoDB, it will execute without transactions
 */

/**
 * Execute a function with or without a transaction based on MongoDB configuration
 * @param {Function} callback - Async function to execute
 * @returns {Promise} Result of the callback function
 */
export const withOptionalTransaction = async (callback) => {
    const mongoose = await import('mongoose');

    // Check if we're connected to a replica set
    const isReplicaSet = mongoose.connection.db?.admin &&
        mongoose.connection.db.serverConfig?.s?.description?.type === 'RSPrimary';

    if (isReplicaSet) {
        // Use transactions for replica sets
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const result = await callback(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } else {
        // Execute without transaction for standalone instances
        // Pass null as session to indicate no transaction
        return await callback(null);
    }
};

/**
 * Helper to conditionally add session to query options
 * @param {Object} options - Query options
 * @param {Session|null} session - MongoDB session or null
 * @returns {Object} Options with session if available
 */
export const withSession = (options = {}, session) => {
    if (session) {
        return { ...options, session };
    }
    return options;
};
