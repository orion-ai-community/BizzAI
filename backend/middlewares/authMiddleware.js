import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getDeviceIdFromCookie } from "../utils/deviceUtils.js";
import { warn } from "../utils/logger.js";

/**
 * Middleware to protect routes
 * Validates both JWT token AND deviceId cookie
 */
export const protect = async (req, res, next) => {
  let token;

  try {
    // Token format: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user (without password)
      req.user = await User.findById(decoded.id).select("-password");

      // CRITICAL: Validate deviceId from cookie matches user's active deviceId
      const deviceIdFromCookie = getDeviceIdFromCookie(req);

      // Enhanced logging for production diagnostics
      if (process.env.NODE_ENV === 'production') {
        if (!deviceIdFromCookie) {
          warn('⚠️  [AUTH] Device validation failed - No cookie', {
            userId: req.user._id,
            hasActiveDevice: !!req.user.activeDeviceId,
            activeDevicePrefix: req.user.activeDeviceId ? req.user.activeDeviceId.substring(0, 8) + '...' : 'none'
          });
        } else if (req.user.activeDeviceId !== deviceIdFromCookie) {
          warn('⚠️  [AUTH] Device validation failed - Mismatch', {
            userId: req.user._id,
            cookieDevicePrefix: deviceIdFromCookie.substring(0, 8) + '...',
            activeDevicePrefix: req.user.activeDeviceId ? req.user.activeDeviceId.substring(0, 8) + '...' : 'none'
          });
        }
      }

      if (!deviceIdFromCookie || req.user.activeDeviceId !== deviceIdFromCookie) {
        // Device mismatch - this device was logged out from another location
        // Provide more specific error message based on the scenario
        const errorMessage = !deviceIdFromCookie
          ? "Session expired. Please log in again."
          : "This account is currently active on another device. Please log in again.";

        return res.status(401).json({
          message: errorMessage,
          sessionExpired: true,
          reason: !deviceIdFromCookie ? 'missing_cookie' : 'device_mismatch'
        });
      }

      next();
    } else {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
