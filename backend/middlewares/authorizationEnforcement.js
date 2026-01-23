/**
 * ENTERPRISE ENFORCEMENT: Authorization Coverage Validator
 * 
 * Ensures ALL mutating routes are protected
 * Fails deployment if any route bypasses authorization
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds validation
 */

import { warn, error as logError } from '../utils/logger.js';

/**
 * HTTP methods that mutate state (require authorization)
 */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Routes that are intentionally public (no auth required)
 */
const PUBLIC_ROUTES = new Set([
    'POST /api/auth/register',
    'POST /api/auth/login',
    'POST /api/auth/forgot-password',
    'POST /api/auth/reset-password',
    'GET /api/auth/csrf-token',
    'GET /health',
    'GET /metrics',
]);

/**
 * Extract all routes from Express app
 * @param {Object} app - Express app instance
 * @returns {Array} List of routes
 */
const extractRoutes = (app) => {
    const routes = [];

    const extractFromStack = (stack, basePath = '') => {
        stack.forEach((layer) => {
            if (layer.route) {
                // Direct route
                const path = basePath + layer.route.path;
                const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());

                routes.push({
                    path,
                    methods,
                    middlewares: layer.route.stack.map(s => s.name || 'anonymous'),
                });
            } else if (layer.name === 'router' && layer.handle.stack) {
                // Nested router
                const routerPath = layer.regexp.source
                    .replace('\\/?', '')
                    .replace('(?=\\/|$)', '')
                    .replace(/\\\//g, '/')
                    .replace(/\^/g, '')
                    .replace(/\$/g, '');

                extractFromStack(layer.handle.stack, basePath + routerPath);
            }
        });
    };

    if (app._router && app._router.stack) {
        extractFromStack(app._router.stack);
    }

    return routes;
};

/**
 * Check if route has authorization middleware
 * @param {Array} middlewares - List of middleware names
 * @returns {boolean} True if protected
 */
const isProtected = (middlewares) => {
    const authMiddlewares = ['protect', 'requirePermission', 'requireOwner', 'requireAdminOrOwner'];
    return middlewares.some(mw => authMiddlewares.includes(mw));
};

/**
 * Validate authorization coverage
 * Fails if any mutating route is unprotected
 * 
 * @param {Object} app - Express app instance
 * @returns {Object} Validation result
 */
export const validateAuthorizationCoverage = (app) => {
    const routes = extractRoutes(app);
    const results = {
        valid: true,
        total: 0,
        protected: 0,
        unprotected: [],
        public: [],
    };

    routes.forEach((route) => {
        route.methods.forEach((method) => {
            if (MUTATING_METHODS.has(method)) {
                results.total++;

                const routeKey = `${method} ${route.path}`;

                // Check if intentionally public
                if (PUBLIC_ROUTES.has(routeKey)) {
                    results.public.push(routeKey);
                    return;
                }

                // Check if protected
                if (isProtected(route.middlewares)) {
                    results.protected++;
                } else {
                    results.unprotected.push({
                        route: routeKey,
                        middlewares: route.middlewares,
                    });
                    results.valid = false;
                }
            }
        });
    });

    return results;
};

/**
 * Authorization enforcement middleware
 * Ensures request has been authorized
 * 
 * Usage: Add as last middleware before controllers
 * app.use(enforceAuthorization);
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const enforceAuthorization = (req, res, next) => {
    // Skip for non-mutating methods
    if (!MUTATING_METHODS.has(req.method)) {
        return next();
    }

    // Skip for public routes
    const routeKey = `${req.method} ${req.route?.path || req.path}`;
    if (PUBLIC_ROUTES.has(routeKey)) {
        return next();
    }

    // Check if user is authenticated
    if (!req.user) {
        logError('Authorization enforcement failed: No user', {
            method: req.method,
            path: req.path,
        });

        return res.status(401).json({
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
        });
    }

    // User is authenticated, proceed
    next();
};

/**
 * Startup validation - print authorization coverage report
 * @param {Object} app - Express app instance
 */
export const printAuthorizationReport = (app) => {
    console.log('\n🔒 Authorization Coverage Report\n');

    const results = validateAuthorizationCoverage(app);

    console.log(`Total mutating routes: ${results.total}`);
    console.log(`Protected routes: ${results.protected}`);
    console.log(`Public routes: ${results.public.length}`);
    console.log(`Unprotected routes: ${results.unprotected.length}\n`);

    if (results.unprotected.length > 0) {
        console.error('❌ UNPROTECTED ROUTES DETECTED:\n');
        results.unprotected.forEach(({ route, middlewares }) => {
            console.error(`  - ${route}`);
            console.error(`    Middlewares: ${middlewares.join(', ')}\n`);
        });

        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                'DEPLOYMENT BLOCKED: Unprotected routes detected. ' +
                'All mutating routes must have authorization middleware.'
            );
        } else {
            warn('⚠️  Unprotected routes detected (development mode)');
        }
    } else {
        console.log('✅ All mutating routes are protected\n');
    }

    return results;
};

export default {
    validateAuthorizationCoverage,
    enforceAuthorization,
    printAuthorizationReport,
    PUBLIC_ROUTES,
    MUTATING_METHODS,
};
