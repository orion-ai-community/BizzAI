import UserActivityLog from "../models/UserActivityLog.js";
import { warn, error } from "./logger.js";

/**
 * Log user activity event to UserActivityLog collection
 * 
 * This is a non-blocking operation - errors are logged but don't affect the main flow
 * 
 * @param {string} userId - User ID (ObjectId as string)
 * @param {string} eventType - Event type (LOGIN, LOGOUT, etc.)
 * @param {object} options - Additional event data
 * @param {string} options.ipAddress - IP address
 * @param {string} options.userAgent - User-Agent string
 * @param {string} options.deviceId - Device ID
 * @param {string} options.deviceType - Device type (mobile/tablet/desktop)
 * @param {string} options.browser - Browser name
 * @param {string} options.os - Operating system
 * @param {object} options.metadata - Additional metadata
 * @returns {Promise<void>}
 */
export const logUserActivity = async (userId, eventType, options = {}) => {
    try {
        const {
            ipAddress = "unknown",
            userAgent = null,
            deviceId = null,
            deviceType = "unknown",
            browser = null,
            os = null,
            metadata = {},
        } = options;

        await UserActivityLog.create({
            userId,
            eventType,
            ipAddress,
            userAgent,
            deviceId,
            deviceType,
            browser,
            os,
            metadata,
        });
    } catch (err) {
        // Non-blocking: log error but don't throw
        error("Failed to log user activity", {
            userId,
            eventType,
            error: err.message,
        });
    }
};

/**
 * Log multiple activity events in batch
 * Useful for migration or bulk operations
 * 
 * @param {Array} events - Array of event objects
 * @returns {Promise<void>}
 */
export const logUserActivityBatch = async (events) => {
    try {
        if (!Array.isArray(events) || events.length === 0) {
            return;
        }

        await UserActivityLog.insertMany(events, { ordered: false });
    } catch (err) {
        // Non-blocking: log error but don't throw
        warn("Failed to log user activity batch", {
            eventCount: events.length,
            error: err.message,
        });
    }
};
