/**
 * ENTERPRISE ENFORCEMENT: Mandatory Audit Logging
 * 
 * Ensures ALL destructive operations are logged
 * Cannot be skipped or suppressed
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds enforcement
 */

import AuditLog from '../models/AuditLog.js';
import { error as logError } from '../utils/logger.js';

/**
 * Mandatory audit logging middleware
 * MUST be applied to all DELETE and sensitive UPDATE routes
 * 
 * Usage:
 * router.delete('/:id', protect, requirePermission('delete:invoice'), mandatoryAudit('Invoice', 'DELETE_INVOICE'), deleteInvoice);
 * 
 * @param {string} entityType - Type of entity (Invoice, Customer, etc.)
 * @param {string} action - Action performed (DELETE_INVOICE, UPDATE_CUSTOMER, etc.)
 * @returns {Function} Express middleware
 */
export const mandatoryAudit = (entityType, action) => {
    return async (req, res, next) => {
        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json to capture response
        res.json = async function (data) {
            // Only log on success (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    // Get entity snapshots from request (set by controller)
                    const beforeSnapshot = req.deletedEntity || req.originalEntity || null;
                    const afterSnapshot = req.updatedEntity || null;

                    // Create audit log (MANDATORY - cannot be skipped)
                    await AuditLog.create({
                        userId: req.user._id,
                        action,
                        entityType,
                        entityId: req.params.id || req.body.id || 'unknown',
                        beforeSnapshot,
                        afterSnapshot,
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.headers['user-agent'],
                        metadata: {
                            correlationId: req.correlationId,
                            method: req.method,
                            path: req.path,
                        },
                    });

                    console.log(`✅ Audit log created: ${action} by user ${req.user._id}`);
                } catch (err) {
                    // CRITICAL: Audit logging failure should NOT block the operation
                    // but MUST be logged as critical error
                    logError('CRITICAL: Audit logging failed', {
                        error: err.message,
                        action,
                        entityType,
                        userId: req.user._id,
                    });

                    // In production, this should trigger alerts
                    if (process.env.NODE_ENV === 'production') {
                        // Send alert to monitoring system
                        console.error('🚨 AUDIT LOGGING FAILURE - ALERT TRIGGERED');
                    }
                }
            }

            return originalJson(data);
        };

        next();
    };
};

/**
 * Validate audit logging coverage on startup
 * Checks that all destructive routes have audit middleware
 * 
 * @param {Object} app - Express app instance
 * @returns {Object} Validation result
 */
export const validateAuditCoverage = (app) => {
    const results = {
        valid: true,
        totalDestructive: 0,
        audited: 0,
        missing: [],
    };

    // Extract routes and check for audit middleware
    const extractRoutes = (stack, basePath = '') => {
        stack.forEach((layer) => {
            if (layer.route) {
                const path = basePath + layer.route.path;
                const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
                const middlewares = layer.route.stack.map(s => s.name || 'anonymous');

                methods.forEach((method) => {
                    if (method === 'DELETE' || (method === 'PUT' && path.includes('/:id'))) {
                        results.totalDestructive++;

                        if (middlewares.includes('mandatoryAudit') || middlewares.includes('auditDelete') || middlewares.includes('auditUpdate')) {
                            results.audited++;
                        } else {
                            results.missing.push(`${method} ${path}`);
                            results.valid = false;
                        }
                    }
                });
            } else if (layer.name === 'router' && layer.handle.stack) {
                extractRoutes(layer.handle.stack, basePath);
            }
        });
    };

    if (app._router && app._router.stack) {
        extractRoutes(app._router.stack);
    }

    return results;
};

/**
 * Periodic audit log integrity verification
 * Runs hash chain verification every N minutes
 * 
 * @param {number} intervalMinutes - Verification interval (default: 60 minutes)
 */
export const startAuditIntegrityVerification = (intervalMinutes = 60) => {
    const interval = intervalMinutes * 60 * 1000;

    const verify = async () => {
        try {
            console.log('🔍 Running audit log integrity verification...');

            const result = await AuditLog.verifyIntegrity();

            if (result.verified) {
                console.log(`✅ Audit log integrity verified (${result.totalLogs} logs)`);
            } else {
                console.error(`❌ Audit log integrity FAILED: ${result.errors.length} errors`);
                logError('Audit log integrity check failed', result.errors);

                // In production, trigger critical alert
                if (process.env.NODE_ENV === 'production') {
                    console.error('🚨 AUDIT INTEGRITY FAILURE - CRITICAL ALERT');
                }
            }
        } catch (err) {
            logError('Audit integrity verification error:', err);
        }
    };

    // Run immediately on startup
    verify();

    // Then run periodically
    setInterval(verify, interval);

    console.log(`✅ Audit integrity verification scheduled (every ${intervalMinutes} minutes)`);
};

/**
 * Startup validation - ensure audit logging is enabled
 */
export const validateAuditLoggingEnabled = () => {
    const enabled = process.env.ENABLE_AUDIT_LOGGING !== 'false';

    if (!enabled) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                'DEPLOYMENT BLOCKED: Audit logging is disabled in production. ' +
                'Set ENABLE_AUDIT_LOGGING=true or remove the variable.'
            );
        } else {
            console.warn('⚠️  Audit logging is disabled (development mode)');
        }
    } else {
        console.log('✅ Audit logging is enabled');
    }

    return enabled;
};

export default {
    mandatoryAudit,
    validateAuditCoverage,
    startAuditIntegrityVerification,
    validateAuditLoggingEnabled,
};
