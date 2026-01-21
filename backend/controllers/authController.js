import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { generateToken, generateRefreshToken, generateRandomToken } from "../config/jwt.js";
import crypto from "crypto";
import { sendHtmlEmail, generatePasswordResetEmail } from "../utils/emailService.js";
import { generateDeviceId, setDeviceIdCookie, getDeviceIdFromCookie } from "../utils/deviceUtils.js";

// Simple password strength check for registration
const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSymbol;
};

const isValidPhone = (phone) => /^\d{10}$/.test((phone || "").trim());

/**
 * @desc Register new user (Shop Owner)
 * @route POST /api/auth/register
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, shopName, phone } = req.body;

    // Validate inputs
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password too weak. Use at least 8 characters with uppercase, lowercase, number, and symbol.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      shopName,
      phone,
    });

    if (user) {
      // Generate cryptographically secure deviceId for initial session
      const deviceId = generateDeviceId();

      // Store audit metadata (IP and UA for logging only, NOT for device identification)
      const userAgent = req.headers["user-agent"] || "unknown";
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

      // Set initial device session
      user.activeDeviceId = deviceId;
      user.activeSessionCreatedAt = new Date();
      user.lastLoginIp = ipAddress;
      user.lastLoginUserAgent = userAgent;
      await user.save();

      // Issue deviceId as secure HttpOnly signed cookie
      setDeviceIdCookie(res, deviceId);

      // Generate tokens
      const accessToken = generateToken(user._id);
      const refreshToken = generateRandomToken();

      // Store refresh token
      await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdByIp: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        phone: user.phone,
        token: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Login existing user
 * @route POST /api/auth/login
 */
export const loginUser = async (req, res) => {
  // Import rate limiter handler
  const { handleLoginAttempt } = await import('../middlewares/rateLimiter.js');

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      await handleLoginAttempt(req, false);
      return res.status(400).json({ message: "Please enter email and password" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      await handleLoginAttempt(req, false);
      return res.status(404).json({ message: "User not found" });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await handleLoginAttempt(req, false);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Get deviceId from signed cookie (if exists)
    const existingDeviceId = getDeviceIdFromCookie(req);

    // Store audit metadata (IP and UA for logging only, NOT for device identification)
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

    // Check for active session on different device
    // Device conflict occurs when:
    // 1. User has an active deviceId stored
    // 2. AND the deviceId from cookie doesn't match (or doesn't exist)
    if (user.activeDeviceId && user.activeDeviceId !== existingDeviceId) {
      return res.status(409).json({
        message: "This account is currently active on another device.",
        deviceConflict: true,
      });
    }

    // Determine deviceId to use:
    // - If existingDeviceId matches user.activeDeviceId, reuse it (same device)
    // - If no activeDeviceId (first login or after force logout), generate new one
    // - If existingDeviceId exists and matches, reuse it
    let deviceIdToUse;
    if (existingDeviceId && user.activeDeviceId === existingDeviceId) {
      // Same device, same session - reuse existing deviceId
      deviceIdToUse = existingDeviceId;
    } else {
      // New device or first login - generate new deviceId
      deviceIdToUse = generateDeviceId();
    }

    // Update device session tracking
    user.activeDeviceId = deviceIdToUse;
    user.activeSessionCreatedAt = new Date();
    user.lastLoginIp = ipAddress;
    user.lastLoginUserAgent = userAgent;
    await user.save();

    // Issue deviceId as secure HttpOnly signed cookie
    setDeviceIdCookie(res, deviceIdToUse);

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRandomToken();

    // Store refresh token
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdByIp: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Reset rate limit counters on successful login
    await handleLoginAttempt(req, true);

    // Send response
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      shopName: user.shopName,
      gstNumber: user.gstNumber,
      shopAddress: user.shopAddress,
      phone: user.phone,
      token: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Get user profile (Protected)
 * @route GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc Request password reset link
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Respond success even if user missing to avoid user enumeration
      return res.status(200).json({ message: "If this email exists, a reset link has been sent" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save to user with 1 hour expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Generate professional HTML email
    const { html, text } = generatePasswordResetEmail(resetUrl, user.name || "User");

    const mailSent = await sendHtmlEmail(
      email,
      "Reset your BizzAI password",
      html,
      text
    );

    if (!mailSent) {
      // Log detailed error server-side only
      console.error("Failed to send password reset email to:", email);
      // CRITICAL: Always return success to prevent information leakage
      // User enumeration protection + email configuration privacy
    }

    // Always return generic success message (security best practice)
    res.status(200).json({ message: "If this email exists, a reset link has been sent" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    // CRITICAL: Never expose error details to client
    res.status(500).json({ message: "Unable to process request. Please try again later." });
  }
};

/**
 * @desc Force logout from previous device and allow new login
 * @route POST /api/auth/force-logout
 * @security HIGH RISK - Strict rate limiting and audit logging required
 */
export const forceLogout = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Generic error message to prevent information leakage
    const genericError = "Invalid credentials";

    if (!email || !password) {
      return res.status(400).json({ message: genericError });
    }

    // Find and verify user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: genericError });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: genericError });
    }

    // Audit logging (CRITICAL for security monitoring)
    const auditData = {
      userId: user._id,
      email: user.email,
      action: "FORCE_LOGOUT",
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      timestamp: new Date(),
    };
    console.warn("SECURITY AUDIT - Force Logout:", JSON.stringify(auditData));

    // Revoke all refresh tokens for this user
    await RefreshToken.updateMany(
      { user: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );

    // Clear device session fields
    user.activeDeviceId = null;
    user.activeSessionCreatedAt = null;
    await user.save();

    res.status(200).json({
      message: "All sessions revoked successfully. You can now log in from this device."
    });
  } catch (error) {
    console.error("Force Logout Error:", error);
    // Generic error message to prevent information leakage
    res.status(500).json({ message: "Unable to process request" });
  }
};


/**
 * @desc Reset password using token
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ message: "Token, email and new password are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: "Password too weak. Use at least 8 characters with uppercase, lowercase, number, and symbol.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successful. Please log in." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
