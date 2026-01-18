import mongoose from "mongoose";

/**
 * Health check controller
 * Provides endpoints for monitoring application health
 */

/**
 * Basic health check
 * Returns 200 if application is running
 * @route GET /api/health
 */
export const healthCheck = async (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    });
};

/**
 * Readiness check
 * Returns 200 if application is ready to serve traffic
 * Checks database connectivity
 * @route GET /api/health/ready
 */
export const readinessCheck = async (req, res) => {
    try {
        // Check database connection
        const dbState = mongoose.connection.readyState;
        const dbReady = dbState === 1; // 1 = connected

        if (!dbReady) {
            return res.status(503).json({
                status: "not_ready",
                timestamp: new Date().toISOString(),
                checks: {
                    database: "disconnected",
                },
            });
        }

        res.status(200).json({
            status: "ready",
            timestamp: new Date().toISOString(),
            checks: {
                database: "connected",
            },
        });
    } catch (error) {
        res.status(503).json({
            status: "not_ready",
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
};

/**
 * Liveness check
 * Returns 200 if application is alive (not deadlocked)
 * @route GET /api/health/live
 */
export const livenessCheck = async (req, res) => {
    res.status(200).json({
        status: "alive",
        timestamp: new Date().toISOString(),
    });
};

export default {
    healthCheck,
    readinessCheck,
    livenessCheck,
};
