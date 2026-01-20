import AuditLog from "../models/AuditLog.js";
import { error as logError } from "../utils/logger.js";

/**
 * Log audit trail for critical operations
 * 
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User performing the action
 * @param {string} params.action - Action type (DELETE_INVOICE, UPDATE_CUSTOMER, etc.)
 * @param {string} params.entityType - Entity type (Invoice, Customer, Item, etc.)
 * @param {string} params.entityId - Entity ID
 * @param {Object} params.beforeSnapshot - Data before change (optional)
 * @param {Object} params.afterSnapshot - Data after change (optional for DELETE)
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.userAgent - Client user agent
 * @param {Object} params.metadata - Additional context (optional)
 */
export const logAudit = async ({
    userId,
    action,
    entityType,
    entityId,
    beforeSnapshot = null,
    afterSnapshot = null,
    ipAddress,
    userAgent = null,
    metadata = {},
}) => {
    try {
        await AuditLog.create({
            userId,
            action,
            entityType,
            entityId,
            beforeSnapshot,
            afterSnapshot,
            ipAddress,
            userAgent,
            metadata,
        });
    } catch (error) {
        // Never fail the main operation due to audit logging failure
        logError("Audit log failed:", error);
    }
};

/**
 * Middleware to automatically log DELETE operations
 * Usage: router.delete('/api/invoices/:id', protect, auditDelete('Invoice', 'DELETE_INVOICE'), deleteInvoice);
 */
export const auditDelete = (entityType, action) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            // Only log if operation was successful (2xx status)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Log audit in background (don't await)
                logAudit({
                    userId: req.user._id,
                    action,
                    entityType,
                    entityId: req.params.id,
                    beforeSnapshot: req.deletedEntity || null, // Controller should attach this
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.headers["user-agent"],
                    metadata: { method: req.method, path: req.path },
                }).catch((err) => logError("Audit logging failed:", err));
            }

            return originalJson(data);
        };

        next();
    };
};

/**
 * Middleware to automatically log UPDATE operations
 * Usage: router.put('/api/customers/:id', protect, auditUpdate('Customer', 'UPDATE_CUSTOMER'), updateCustomer);
 */
export const auditUpdate = (entityType, action) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAudit({
                    userId: req.user._id,
                    action,
                    entityType,
                    entityId: req.params.id,
                    beforeSnapshot: req.originalEntity || null, // Controller should attach this
                    afterSnapshot: req.updatedEntity || data, // Use response data if not attached
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.headers["user-agent"],
                    metadata: { method: req.method, path: req.path },
                }).catch((err) => logError("Audit logging failed:", err));
            }

            return originalJson(data);
        };

        next();
    };
};

export default { logAudit, auditDelete, auditUpdate };
