import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import RefreshToken from "../models/RefreshToken.js";
import { generateToken, generateRefreshToken, verifyRefreshToken, generateRandomToken } from "../config/jwt.js";
import User from "../models/User.js";
import { clearDeviceIdCookie, getDeviceIdFromCookie } from "../utils/deviceUtils.js";
import { getDeviceMetadata, getIpAddress } from "../utils/deviceParser.js";
import { logUserActivity } from "../utils/activityLogger.js";

const router = express.Router();

/**
 * @desc Refresh access token using refresh token
 * @route POST /api/auth/refresh
 * @access Public
 */
router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }

        // Find refresh token in database
        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        // Check if token is active
        if (!storedToken.isActive()) {
            return res.status(401).json({ message: "Refresh token expired or revoked" });
        }

        // Verify JWT signature
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid refresh token signature" });
        }

        // Get user
        const user = await User.findById(storedToken.user).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // CRITICAL: Validate deviceId from cookie matches user's active deviceId
        const deviceIdFromCookie = getDeviceIdFromCookie(req);

        if (!deviceIdFromCookie || user.activeDeviceId !== deviceIdFromCookie) {
            // Device mismatch - this device was logged out
            // Revoke this refresh token
            storedToken.isRevoked = true;
            storedToken.revokedAt = new Date();
            await storedToken.save();

            return res.status(401).json({
                message: "Session expired. Please log in again.",
                sessionExpired: true
            });
        }

        // Generate new tokens
        const newAccessToken = generateToken(user._id);
        const newRefreshToken = generateRandomToken();

        // Revoke old refresh token and create new one
        storedToken.isRevoked = true;
        storedToken.revokedAt = new Date();
        await storedToken.save();

        // Create new refresh token with device metadata
        const deviceMeta = getDeviceMetadata(req);
        const ipAddress = getIpAddress(req);

        await RefreshToken.create({
            token: newRefreshToken,
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdByIp: ipAddress,
            userAgent: deviceMeta.userAgent,
            deviceId: deviceIdFromCookie,
            deviceType: deviceMeta.deviceType,
            browser: deviceMeta.browser,
            os: deviceMeta.os,
        });

        // Update user activity tracking
        user.lastSeenAt = new Date();
        user.lastActivityType = "token_refresh";
        user.lastKnownIp = ipAddress;
        await user.save();

        // Update token lastUsedAt
        storedToken.lastUsedAt = new Date();
        await storedToken.save();

        // Log token refresh activity
        await logUserActivity(user._id, "TOKEN_REFRESH", {
            ipAddress,
            userAgent: deviceMeta.userAgent,
            deviceId: deviceIdFromCookie,
            deviceType: deviceMeta.deviceType,
            browser: deviceMeta.browser,
            os: deviceMeta.os,
        });

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                shopName: user.shopName,
            },
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @desc Revoke refresh token (logout)
 * @route POST /api/auth/revoke
 * @access Protected
 */
router.post("/revoke", protect, async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken, user: req.user._id });

        if (!storedToken) {
            return res.status(404).json({ message: "Refresh token not found" });
        }

        storedToken.isRevoked = true;
        storedToken.revokedAt = new Date();
        await storedToken.save();

        // Clear device session on logout
        const user = await User.findById(req.user._id);
        if (user) {
            // Extract device metadata
            const deviceMeta = getDeviceMetadata(req);
            const ipAddress = getIpAddress(req);
            const deviceIdFromCookie = getDeviceIdFromCookie(req);

            // Update activity tracking
            user.lastLogoutAt = new Date();
            user.lastActivityType = "logout";

            // Decrement session count
            if (user.activeSessionCount > 0) {
                user.activeSessionCount -= 1;
            }

            // Remove device from activeDeviceIds
            if (deviceIdFromCookie && user.activeDeviceIds.includes(deviceIdFromCookie)) {
                user.activeDeviceIds = user.activeDeviceIds.filter(id => id !== deviceIdFromCookie);
            }

            // Clear active device if this was the active device
            if (user.activeDeviceId === deviceIdFromCookie) {
                user.activeDeviceId = null;
                user.activeSessionCreatedAt = null;
            }

            await user.save();

            // Log logout activity
            await logUserActivity(user._id, "LOGOUT", {
                ipAddress,
                userAgent: deviceMeta.userAgent,
                deviceId: deviceIdFromCookie,
                deviceType: deviceMeta.deviceType,
                browser: deviceMeta.browser,
                os: deviceMeta.os,
            });
        }

        // Clear deviceId cookie
        clearDeviceIdCookie(res);

        res.json({ message: "Refresh token revoked successfully" });
    } catch (error) {
        console.error("Revoke token error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/**
 * @desc Revoke all refresh tokens for user (logout all devices)
 * @route POST /api/auth/revoke-all
 * @access Protected
 */
router.post("/revoke-all", protect, async (req, res) => {
    try {
        await RefreshToken.updateMany(
            { user: req.user._id, isRevoked: false },
            { isRevoked: true, revokedAt: new Date() }
        );

        // Clear device session on logout all
        const user = await User.findById(req.user._id);
        if (user) {
            // Extract device metadata
            const deviceMeta = getDeviceMetadata(req);
            const ipAddress = getIpAddress(req);

            // Update activity tracking
            user.lastLogoutAt = new Date();
            user.lastActivityType = "logout";

            // Clear all session data
            user.activeSessionCount = 0;
            user.activeDeviceIds = [];
            user.activeDeviceId = null;
            user.activeSessionCreatedAt = null;

            await user.save();

            // Log logout all activity
            await logUserActivity(user._id, "LOGOUT_ALL", {
                ipAddress,
                userAgent: deviceMeta.userAgent,
                deviceId: null,
                deviceType: deviceMeta.deviceType,
                browser: deviceMeta.browser,
                os: deviceMeta.os,
            });
        }

        // Clear deviceId cookie
        clearDeviceIdCookie(res);

        res.json({ message: "All refresh tokens revoked successfully" });
    } catch (error) {
        console.error("Revoke all tokens error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
