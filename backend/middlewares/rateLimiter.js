import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        message: "Too many authentication attempts. Please try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
});

/**
 * General API rate limiter
 * Prevents API abuse and DDoS
 */
export const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes default
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10), // 100 requests default
    message: {
        message: "Too many requests from this IP. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Moderate rate limiter for general routes
 * More permissive for authenticated users
 */
export const moderateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour
    message: {
        message: "Rate limit exceeded. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict limiter for password reset
 * Prevents email flooding
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        message: "Too many password reset attempts. Please try again in 1 hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export default {
    authLimiter,
    apiLimiter,
    moderateLimiter,
    passwordResetLimiter,
};
