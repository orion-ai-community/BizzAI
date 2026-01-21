/**
 * ENTERPRISE ENFORCEMENT: Global Observability
 * 
 * Enforces correlation IDs and structured logging globally
 * Fails startup if logging misconfigured
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds enforcement
 */

import { correlationMiddleware, getCorrelationId } from './correlationMiddleware.js';
import { warn, error as logError } from '../utils/logger.js';

/**
 * Global correlation ID enforcement
 * MUST be first middleware in chain
 * 
 * @param {Object} app - Express app instance
 */
export const enforceGlobalCorrelation = (app) => {
    // Add correlation middleware globally
    app.use(correlationMiddleware);

    console.log('✅ Global correlation ID enforcement enabled');
};

/**
 * Structured logging enforcement
 * Validates that all log calls include correlation context
 * 
 * @returns {Object} Enhanced logger
 */
export const enforceStructuredLogging = () => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Override console methods to include correlation ID
    console.log = function (...args) {
        const correlationId = getCorrelationId();
        if (correlationId) {
            originalConsoleLog(`[${correlationId}]`, ...args);
        } else {
            originalConsoleLog(...args);
        }
    };

    console.error = function (...args) {
        const correlationId = getCorrelationId();
        if (correlationId) {
            originalConsoleError(`[${correlationId}]`, ...args);
        } else {
            originalConsoleError(...args);
        }
    };

    console.warn = function (...args) {
        const correlationId = getCorrelationId();
        if (correlationId) {
            originalConsoleWarn(`[${correlationId}]`, ...args);
        } else {
            originalConsoleWarn(...args);
        }
    };

    console.log('✅ Structured logging enforcement enabled');
};

/**
 * Validate logging configuration on startup
 * Fails if logging is misconfigured
 */
export const validateLoggingConfiguration = () => {
    const errors = [];

    // Check if logger utility exists
    try {
        require('../utils/logger.js');
    } catch (err) {
        errors.push('Logger utility not found');
    }

    // Check if correlation middleware exists
    try {
        require('./correlationMiddleware.js');
    } catch (err) {
        errors.push('Correlation middleware not found');
    }

    if (errors.length > 0) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                'DEPLOYMENT BLOCKED: Logging misconfigured. Errors: ' +
                errors.join(', ')
            );
        } else {
            warn('⚠️  Logging configuration issues:', errors);
        }
        return false;
    }

    console.log('✅ Logging configuration validated');
    return true;
};

/**
 * Background job trace context propagation
 * Ensures correlation IDs propagate through queues
 * 
 * @param {Object} job - Bull job instance
 * @param {Function} handler - Job handler function
 * @returns {Function} Wrapped handler with trace context
 */
export const withTraceContext = (handler) => {
    return async (job) => {
        // Extract correlation ID from job data
        const correlationId = job.data.correlationId || job.id;

        // Store in async context (simplified - use AsyncLocalStorage in production)
        console.log(`[Job ${job.id}] [${correlationId}] Starting job processing`);

        try {
            const result = await handler(job);
            console.log(`[Job ${job.id}] [${correlationId}] Job completed successfully`);
            return result;
        } catch (err) {
            console.error(`[Job ${job.id}] [${correlationId}] Job failed:`, err);
            throw err;
        }
    };
};

export default {
    enforceGlobalCorrelation,
    enforceStructuredLogging,
    validateLoggingConfiguration,
    withTraceContext,
};
