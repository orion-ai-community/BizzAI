/**
 * Prometheus Metrics Configuration
 * Tracks request latency, error rates, and business metrics
 * 
 * Setup:
 * 1. Install: npm install prom-client
 * 2. Add metrics endpoint: GET /metrics
 */

import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Register();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// HTTP request duration histogram
export const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Seconds
    registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

// Error counter
export const errorCounter = new promClient.Counter({
    name: 'app_errors_total',
    help: 'Total number of application errors',
    labelNames: ['type', 'route'],
    registers: [register],
});

// Business metrics
export const invoiceCreated = new promClient.Counter({
    name: 'invoices_created_total',
    help: 'Total number of invoices created',
    labelNames: ['payment_status'],
    registers: [register],
});

export const salesAmount = new promClient.Counter({
    name: 'sales_amount_total',
    help: 'Total sales amount in currency',
    registers: [register],
});

export const activeUsers = new promClient.Gauge({
    name: 'active_users',
    help: 'Number of active users',
    registers: [register],
});

export const databaseConnections = new promClient.Gauge({
    name: 'database_connections',
    help: 'Number of active database connections',
    registers: [register],
});

// Cache metrics
export const cacheHits = new promClient.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    registers: [register],
});

export const cacheMisses = new promClient.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    registers: [register],
});

/**
 * Middleware to track HTTP metrics
 * Usage: app.use(metricsMiddleware);
 */
export const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    // Track response
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000; // Convert to seconds
        const route = req.route ? req.route.path : req.path;
        const labels = {
            method: req.method,
            route,
            status_code: res.statusCode,
        };

        httpRequestDuration.observe(labels, duration);
        httpRequestTotal.inc(labels);

        // Track errors (4xx and 5xx)
        if (res.statusCode >= 400) {
            errorCounter.inc({
                type: res.statusCode >= 500 ? 'server_error' : 'client_error',
                route,
            });
        }
    });

    next();
};

/**
 * Metrics endpoint handler
 * Usage: app.get('/metrics', metricsHandler);
 */
export const metricsHandler = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

export default {
    register,
    httpRequestDuration,
    httpRequestTotal,
    errorCounter,
    invoiceCreated,
    salesAmount,
    activeUsers,
    databaseConnections,
    cacheHits,
    cacheMisses,
    metricsMiddleware,
    metricsHandler,
};
