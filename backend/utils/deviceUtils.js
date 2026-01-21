import crypto from "crypto";

/**
 * Generate a cryptographically secure device ID
 * @returns {string} 64-character hex string (32 bytes)
 */
export const generateDeviceId = () => {
    return crypto.randomBytes(32).toString("hex");
};

/**
 * Determine sameSite cookie setting based on environment
 * - If COOKIE_SAME_SITE env var is set, use that value ("none", "lax", or "strict")
 * - Otherwise, default to "lax" for production (works for same-domain deployments)
 * - Use "strict" for development
 * 
 * Note: Use "none" only for cross-origin deployments (requires HTTPS)
 */
const getSameSiteSetting = () => {
    if (process.env.COOKIE_SAME_SITE) {
        return process.env.COOKIE_SAME_SITE;
    }
    const isProduction = process.env.NODE_ENV === "production";
    return isProduction ? "lax" : "strict";
};

/**
 * Set secure deviceId cookie
 * @param {object} res - Express response object
 * @param {string} deviceId - Device identifier
 */
export const setDeviceIdCookie = (res, deviceId) => {
    const isProduction = process.env.NODE_ENV === "production";
    const sameSite = getSameSiteSetting();

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite, // Flexible: "lax" (default), "none" (cross-origin), or "strict"
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        signed: true,
        path: '/', // Explicitly set path to root
    };

    // Don't set domain - let browser handle it automatically
    // This ensures cookies work on both localhost and deployed domains

    res.cookie("deviceId", deviceId, cookieOptions);

    // Debug log in development
    if (!isProduction) {
        console.log('🍪 Set deviceId cookie:', {
            deviceId: deviceId.substring(0, 8) + '...',
            sameSite,
            secure: isProduction
        });
    }
};

/**
 * Clear deviceId cookie
 * @param {object} res - Express response object
 */
export const clearDeviceIdCookie = (res) => {
    const isProduction = process.env.NODE_ENV === "production";
    const sameSite = getSameSiteSetting();

    res.clearCookie("deviceId", {
        httpOnly: true,
        secure: isProduction,
        sameSite, // Must match the setting used when cookie was set
        signed: true,
        path: '/', // Must match the path used when cookie was set
    });
};

/**
 * Get deviceId from signed cookie
 * @param {object} req - Express request object
 * @returns {string|null} Device ID or null if not present/invalid
 */
export const getDeviceIdFromCookie = (req) => {
    return req.signedCookies?.deviceId || null;
};
