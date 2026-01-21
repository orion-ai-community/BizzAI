import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getDeviceIdFromCookie } from "../utils/deviceUtils.js";

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

      if (!deviceIdFromCookie || req.user.activeDeviceId !== deviceIdFromCookie) {
        // Device mismatch - this device was logged out from another location
        if (process.env.NODE_ENV === 'production') {
          console.warn('⚠️  Device validation failed:', {
            hasCookie: !!deviceIdFromCookie,
            hasActiveDevice: !!req.user.activeDeviceId,
            userId: req.user._id
          });
        }
        return res.status(401).json({
          message: "Session expired. Please log in again.",
          sessionExpired: true
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
