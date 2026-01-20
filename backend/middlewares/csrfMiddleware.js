/**
 * CSRF Protection Middleware
 * Compatible with JWT + HttpOnly cookies + cross-origin frontend
 * 
 * Note: csurf package is deprecated. Using custom implementation.
 * For production, consider using @fastify/csrf-protection or helmet's csrf
 */

import crypto from "crypto";

// In-memory store for CSRF tokens (use Redis in production for multi-instance)
const csrfTokens = new Map();

// Token expiry: 1 hour
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Generate CSRF token
 * @param {string} userId - User ID
 * @returns {string} CSRF token
 */
export const generateCsrfToken = (userId) => {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + TOKEN_EXPIRY;

    csrfTokens.set(token, { userId, expiry });

    // Cleanup expired tokens periodically
    cleanupExpiredTokens();

    return token;
};

/**
 * Verify CSRF token
 * @param {string} token - CSRF token
 * @param {string} userId - User ID
 * @returns {boolean} True if valid
 */
export const verifyCsrfToken = (token, userId) => {
    if (!token || !userId) return false;

    const stored = csrfTokens.get(token);
    if (!stored) return false;

    // Check expiry
    if (Date.now() > stored.expiry) {
        csrfTokens.delete(token);
        return false;
    }

    // Check user match
    if (stored.userId.toString() !== userId.toString()) {
        return false;
    }

    return true;
};

/**
 * Cleanup expired tokens
 */
const cleanupExpiredTokens = () => {
    const now = Date.now();
    for (const [token, data] of csrfTokens.entries()) {
        if (now > data.expiry) {
            csrfTokens.delete(token);
        }
    }
};

/**
 * Middleware to protect routes from CSRF attacks
 * Usage: router.post('/api/invoices', protect, csrfProtection, createInvoice);
 */
export const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
    }

    // Get token from header
    const token = req.headers["x-csrf-token"];

    if (!token) {
        return res.status(403).json({
            message: "CSRF token missing",
            code: "CSRF_TOKEN_MISSING",
        });
    }

    // Verify token
    if (!req.user || !verifyCsrfToken(token, req.user._id)) {
        return res.status(403).json({
            message: "Invalid CSRF token",
            code: "CSRF_TOKEN_INVALID",
        });
    }

    next();
};

/**
 * Get CSRF token for current user
 * Route handler: GET /api/auth/csrf-token
 */
export const getCsrfToken = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const token = generateCsrfToken(req.user._id);

    res.json({ csrfToken: token });
};

export default { csrfProtection, getCsrfToken, generateCsrfToken, verifyCsrfToken };
