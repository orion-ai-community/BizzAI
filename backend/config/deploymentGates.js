/**
 * ENTERPRISE ENFORCEMENT: Deployment Safety Gates
 * 
 * Pre-deploy and post-deploy validation
 * Fails deployment if invariants violated
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds safety checks
 */

import mongoose from 'mongoose';
import { validateDatabaseSafety } from '../utils/transaction.js';
import { validateAuthorizationCoverage } from './authorizationEnforcement.js';
import { validateAuditCoverage, validateAuditLoggingEnabled } from './auditEnforcement.js';
import { validateLoggingConfiguration } from './observabilityEnforcement.js';

/**
 * Pre-deploy safety checks
 * Run before deployment - fails if any check fails
 * 
 * @param {Object} app - Express app instance
 * @returns {Object} Check results
 */
export const runPreDeployChecks = async (app) => {
    console.log('\n🔍 Running pre-deploy safety checks...\n');

    const results = {
        passed: true,
        checks: {},
    };

    // 1. Environment variables
    try {
        const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'];
        const missing = required.filter(key => !process.env[key]);

        if (missing.length > 0) {
            results.checks.environment = {
                passed: false,
                error: `Missing required variables: ${missing.join(', ')}`,
            };
            results.passed = false;
        } else {
            results.checks.environment = { passed: true };
            console.log('✅ Environment variables validated');
        }
    } catch (err) {
        results.checks.environment = { passed: false, error: err.message };
        results.passed = false;
    }

    // 2. Database connection
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        await validateDatabaseSafety();
        results.checks.database = { passed: true };
        console.log('✅ Database connection validated');
    } catch (err) {
        results.checks.database = { passed: false, error: err.message };
        results.passed = false;
    }

    // 3. Authorization coverage
    try {
        const authResults = validateAuthorizationCoverage(app);

        if (!authResults.valid) {
            results.checks.authorization = {
                passed: false,
                error: `${authResults.unprotected.length} unprotected routes`,
                details: authResults.unprotected,
            };
            results.passed = false;
        } else {
            results.checks.authorization = { passed: true };
            console.log('✅ Authorization coverage validated');
        }
    } catch (err) {
        results.checks.authorization = { passed: false, error: err.message };
        results.passed = false;
    }

    // 4. Audit logging
    try {
        const auditEnabled = validateAuditLoggingEnabled();

        if (!auditEnabled && process.env.NODE_ENV === 'production') {
            results.checks.audit = {
                passed: false,
                error: 'Audit logging disabled in production',
            };
            results.passed = false;
        } else {
            results.checks.audit = { passed: true };
            console.log('✅ Audit logging validated');
        }
    } catch (err) {
        results.checks.audit = { passed: false, error: err.message };
        results.passed = false;
    }

    // 5. Logging configuration
    try {
        const loggingValid = validateLoggingConfiguration();

        if (!loggingValid && process.env.NODE_ENV === 'production') {
            results.checks.logging = {
                passed: false,
                error: 'Logging misconfigured',
            };
            results.passed = false;
        } else {
            results.checks.logging = { passed: true };
            console.log('✅ Logging configuration validated');
        }
    } catch (err) {
        results.checks.logging = { passed: false, error: err.message };
        results.passed = false;
    }

    console.log('\n📊 Pre-deploy checks summary:');
    console.log(`  Passed: ${Object.values(results.checks).filter(c => c.passed).length}`);
    console.log(`  Failed: ${Object.values(results.checks).filter(c => !c.passed).length}\n`);

    if (!results.passed && process.env.NODE_ENV === 'production') {
        console.error('❌ DEPLOYMENT BLOCKED: Pre-deploy checks failed\n');
        throw new Error('Pre-deploy checks failed');
    }

    return results;
};

/**
 * Post-deploy smoke tests
 * Run after deployment to verify system health
 * 
 * @param {string} baseUrl - Base URL of deployed app
 * @returns {Object} Test results
 */
export const runPostDeploySmokeTests = async (baseUrl) => {
    console.log('\n🔍 Running post-deploy smoke tests...\n');

    const results = {
        passed: true,
        tests: {},
    };

    // 1. Health endpoint
    try {
        const response = await fetch(`${baseUrl}/health`);
        const data = await response.json();

        if (data.status !== 'healthy' && data.status !== 'degraded') {
            throw new Error(`Health check failed: ${data.status}`);
        }

        results.tests.health = { passed: true, status: data.status };
        console.log(`✅ Health check passed (${data.status})`);
    } catch (err) {
        results.tests.health = { passed: false, error: err.message };
        results.passed = false;
    }

    // 2. CSRF token endpoint
    try {
        const response = await fetch(`${baseUrl}/api/auth/csrf-token`);

        if (response.status === 401) {
            // Expected - requires auth
            results.tests.csrf = { passed: true };
            console.log('✅ CSRF endpoint accessible');
        } else {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    } catch (err) {
        results.tests.csrf = { passed: false, error: err.message };
        results.passed = false;
    }

    // 3. Metrics endpoint (if enabled)
    try {
        if (process.env.ENABLE_METRICS === 'true') {
            const response = await fetch(`${baseUrl}/metrics`);

            if (response.status === 200) {
                results.tests.metrics = { passed: true };
                console.log('✅ Metrics endpoint accessible');
            } else {
                throw new Error(`Metrics endpoint failed: ${response.status}`);
            }
        } else {
            results.tests.metrics = { passed: true, skipped: true };
        }
    } catch (err) {
        results.tests.metrics = { passed: false, error: err.message };
        results.passed = false;
    }

    console.log('\n📊 Post-deploy smoke tests summary:');
    console.log(`  Passed: ${Object.values(results.tests).filter(t => t.passed).length}`);
    console.log(`  Failed: ${Object.values(results.tests).filter(t => !t.passed).length}\n`);

    if (!results.passed) {
        console.error('❌ POST-DEPLOY VALIDATION FAILED\n');
    }

    return results;
};

/**
 * Graceful shutdown validation under load
 * Ensures in-flight requests complete before shutdown
 * 
 * @param {Object} server - HTTP server instance
 * @returns {Promise} Resolves when shutdown complete
 */
export const validateGracefulShutdown = (server) => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let requestsInFlight = 0;

        // Track in-flight requests
        server.on('request', (req, res) => {
            requestsInFlight++;
            res.on('finish', () => {
                requestsInFlight--;
            });
        });

        // Initiate shutdown
        server.close(() => {
            const duration = Date.now() - startTime;
            console.log(`✅ Graceful shutdown completed in ${duration}ms`);
            console.log(`   In-flight requests at shutdown: ${requestsInFlight}`);
            resolve({ duration, requestsInFlight });
        });

        // Force shutdown after 30s
        setTimeout(() => {
            console.error('⚠️  Graceful shutdown timeout - forcing shutdown');
            process.exit(1);
        }, 30000);
    });
};

export default {
    runPreDeployChecks,
    runPostDeploySmokeTests,
    validateGracefulShutdown,
};
