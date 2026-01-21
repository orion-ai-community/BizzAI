/**
 * ENTERPRISE DATA CONSISTENCY: Transaction Guards & Optimistic Locking
 * 
 * Adds:
 * - Mandatory transaction wrapper enforcement
 * - Optimistic locking (versioning)
 * - Idempotency key support
 * - Database safety (writeConcern, readConcern)
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds safety guards
 */

import mongoose from "mongoose";
import { error as logError, warn } from "./logger.js";

/**
 * Execute database operations within a transaction with safety guards
 * @param {Function} callback - Async function that receives session parameter
 * @param {Object} options - Transaction options
 * @returns {Promise<any>} Result from callback
 * @throws {Error} If transaction fails
 */
export const withTransaction = async (callback, options = {}) => {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        writeConcern = 'majority', // Enterprise default
        readConcern = 'majority',  // Enterprise default
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const session = await mongoose.startSession();

        try {
            // Start transaction with enterprise-grade options
            session.startTransaction({
                readConcern: { level: readConcern },
                writeConcern: { w: writeConcern },
                readPreference: 'primary',
            });

            // Execute callback with session
            const result = await callback(session);

            // Commit transaction
            await session.commitTransaction();

            return result;
        } catch (err) {
            // Rollback on any error
            await session.abortTransaction();
            lastError = err;

            // Retry on transient errors
            if (err.hasErrorLabel && err.hasErrorLabel('TransientTransactionError') && attempt < maxRetries) {
                warn(`Transaction attempt ${attempt} failed (transient), retrying in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
                continue;
            }

            // Don't retry on non-transient errors
            logError("Transaction failed:", err);
            throw err;
        } finally {
            // Always end session
            session.endSession();
        }
    }

    // All retries exhausted
    throw lastError;
};

/**
 * Transaction guard - ensures operation is wrapped in transaction
 * Throws error if not in transaction (fail-fast for safety)
 * 
 * @param {Object} session - Mongoose session
 * @param {string} operationName - Name of operation for error message
 * @throws {Error} If not in transaction
 */
export const requireTransaction = (session, operationName) => {
    if (!session || !session.inTransaction()) {
        throw new Error(
            `TRANSACTION_REQUIRED: ${operationName} must be executed within a transaction. ` +
            `Use withTransaction() wrapper.`
        );
    }
};

/**
 * Optimistic locking helper - check version before update
 * Prevents lost updates in concurrent scenarios
 * 
 * @param {Object} Model - Mongoose model
 * @param {string} id - Document ID
 * @param {number} expectedVersion - Expected __v value
 * @param {Object} update - Update operations
 * @param {Object} session - Mongoose session
 * @returns {Promise<Object>} Updated document
 * @throws {Error} If version mismatch (concurrent update detected)
 */
export const updateWithOptimisticLock = async (Model, id, expectedVersion, update, session) => {
    const result = await Model.findOneAndUpdate(
        { _id: id, __v: expectedVersion },
        { ...update, $inc: { __v: 1 } },
        { new: true, session }
    );

    if (!result) {
        throw new Error(
            `OPTIMISTIC_LOCK_FAILED: Document ${id} was modified by another operation. ` +
            `Expected version ${expectedVersion}. Please retry.`
        );
    }

    return result;
};

/**
 * Idempotency key store (in-memory, use Redis in production)
 * Prevents duplicate operations from double-submit
 */
const idempotencyStore = new Map();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check and store idempotency key
 * Returns cached result if key exists
 * 
 * @param {string} key - Idempotency key (e.g., UUID from client)
 * @param {Function} operation - Async operation to execute if key is new
 * @returns {Promise<Object>} Operation result (cached or fresh)
 */
export const withIdempotency = async (key, operation) => {
    if (!key) {
        // No idempotency key provided, execute normally
        return await operation();
    }

    // Check if operation already executed
    const cached = idempotencyStore.get(key);
    if (cached) {
        warn(`Idempotency: Returning cached result for key ${key}`);
        return cached.result;
    }

    // Execute operation
    const result = await operation();

    // Store result with TTL
    idempotencyStore.set(key, {
        result,
        timestamp: Date.now(),
    });

    // Cleanup expired keys periodically
    setTimeout(() => {
        const entry = idempotencyStore.get(key);
        if (entry && Date.now() - entry.timestamp > IDEMPOTENCY_TTL) {
            idempotencyStore.delete(key);
        }
    }, IDEMPOTENCY_TTL);

    return result;
};

/**
 * Database safety validator - checks connection and replica set
 * Call on startup (non-blocking warning)
 */
export const validateDatabaseSafety = async () => {
    try {
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();

        // Check if replica set is configured
        if (!serverStatus.repl) {
            warn(
                'DATABASE SAFETY WARNING: Not running in replica set mode. ' +
                'Transactions require replica set. ' +
                'This is acceptable for development but NOT for production.'
            );
        } else {
            console.log(`✅ Database safety: Replica set '${serverStatus.repl.setName}' detected`);
        }

        // Check write concern
        const dbStats = await mongoose.connection.db.stats();
        console.log(`✅ Database safety: Connected to ${dbStats.db}`);

    } catch (err) {
        warn('Database safety check failed (non-blocking):', err.message);
    }
};

/**
 * Validate indexes exist on startup (non-blocking warning)
 * @param {Array<Object>} models - Array of Mongoose models to check
 */
export const validateIndexes = async (models) => {
    for (const Model of models) {
        try {
            const indexes = await Model.collection.getIndexes();
            const indexCount = Object.keys(indexes).length;

            if (indexCount <= 1) {
                // Only _id index exists
                warn(`INDEX WARNING: Model ${Model.modelName} has no custom indexes. Performance may be degraded.`);
            } else {
                console.log(`✅ Indexes: ${Model.modelName} has ${indexCount} indexes`);
            }
        } catch (err) {
            warn(`Index validation failed for ${Model.modelName}:`, err.message);
        }
    }
};

export default {
    withTransaction,
    requireTransaction,
    updateWithOptimisticLock,
    withIdempotency,
    validateDatabaseSafety,
    validateIndexes,
};
