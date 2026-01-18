import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import RefreshToken from "../models/RefreshToken.js";
import { generateToken, generateRefreshToken, verifyRefreshToken, generateRandomToken } from "../config/jwt.js";
import User from "../models/User.js";

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

        // Generate new tokens
        const newAccessToken = generateToken(user._id);
        const newRefreshToken = generateRandomToken();

        // Revoke old refresh token and create new one
        storedToken.isRevoked = true;
        storedToken.revokedAt = new Date();
        storedToken.replacedByToken = newRefreshToken;
        await storedToken.save();

        // Create new refresh token
        await RefreshToken.create({
            token: newRefreshToken,
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdByIp: req.ip,
            userAgent: req.headers["user-agent"],
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

        res.json({ message: "All refresh tokens revoked successfully" });
    } catch (error) {
        console.error("Revoke all tokens error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
