import { UAParser } from "ua-parser-js";

/**
 * Parse User-Agent string to extract device metadata
 * @param {string} userAgent - User-Agent header string
 * @returns {object} Parsed device information
 */
export const parseUserAgent = (userAgent) => {
    if (!userAgent || typeof userAgent !== "string") {
        return {
            browser: "Unknown",
            browserVersion: null,
            os: "Unknown",
            osVersion: null,
            deviceType: "unknown",
            deviceVendor: null,
        };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let deviceType = "desktop"; // default
    if (result.device.type === "mobile") {
        deviceType = "mobile";
    } else if (result.device.type === "tablet") {
        deviceType = "tablet";
    } else if (result.device.type) {
        deviceType = result.device.type;
    } else {
        // Fallback: check OS for mobile indicators
        const osName = (result.os.name || "").toLowerCase();
        if (osName.includes("android") || osName.includes("ios")) {
            deviceType = "mobile";
        }
    }

    return {
        browser: result.browser.name || "Unknown",
        browserVersion: result.browser.version || null,
        os: result.os.name || "Unknown",
        osVersion: result.os.version || null,
        deviceType: deviceType,
        deviceVendor: result.device.vendor || null,
    };
};

/**
 * Extract device metadata from Express request
 * @param {object} req - Express request object
 * @returns {object} Device metadata
 */
export const getDeviceMetadata = (req) => {
    const userAgent = req.headers["user-agent"] || "";
    const parsed = parseUserAgent(userAgent);

    return {
        userAgent: userAgent || "unknown",
        browser: parsed.browser,
        browserVersion: parsed.browserVersion,
        os: parsed.os,
        osVersion: parsed.osVersion,
        deviceType: parsed.deviceType,
        deviceVendor: parsed.deviceVendor,
    };
};

/**
 * Get IP address from Express request
 * Handles proxies and forwarded headers
 * @param {object} req - Express request object
 * @returns {string} IP address
 */
export const getIpAddress = (req) => {
    // Check for forwarded IP (behind proxy/load balancer)
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        // x-forwarded-for can be a comma-separated list, take the first one
        return forwarded.split(",")[0].trim();
    }

    // Fallback to direct connection IP
    return req.ip || req.connection?.remoteAddress || "unknown";
};
