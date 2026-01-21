/**
 * ENTERPRISE SECURITY: Token Replay Protection & Session Anomaly Detection
 * 
 * Adds:
 * - jti (JWT ID) for token replay protection
 * - Refresh token reuse detection
 * - Session anomaly logging (IP/UA mismatch)
 * - Absolute session lifetime (30 days max)
 * 
 * NO BUSINESS LOGIC CHANGES - Only adds security guards
 */

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { warn, error as logError } from "../utils/logger.js";

/**
 * Generate JWT access token with jti (JWT ID) for replay protection
 * @param {string} userId - User ID
 * @param {Object} sessionContext - Session metadata (IP, UA)
 * @returns {string} JWT token
 */
export const generateToken = (userId, sessionContext = {}) => {
  const jti = crypto.randomBytes(16).toString("hex"); // Unique token ID

  return jwt.sign(
    {
      id: userId,
      jti, // Token replay protection
      iat: Math.floor(Date.now() / 1000), // Issued at
      ctx: {
        ip: sessionContext.ip || null,
        ua: sessionContext.ua ? crypto.createHash('sha256').update(sessionContext.ua).digest('hex').substring(0, 16) : null
      }
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // 15 minutes - production security
  );
};

/**
 * Generate JWT refresh token with absolute session lifetime
 * @param {string} userId - User ID
 * @param {Date} sessionStart - When session started (for absolute lifetime)
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId, sessionStart = new Date()) => {
  const jti = crypto.randomBytes(16).toString("hex");
  const absoluteExpiry = new Date(sessionStart);
  absoluteExpiry.setDate(absoluteExpiry.getDate() + 30); // 30 days absolute max

  return jwt.sign(
    {
      id: userId,
      jti,
      sessionStart: sessionStart.toISOString(),
      absoluteExpiry: absoluteExpiry.toISOString()
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } // 7 days rolling, but absolute max is 30 days
  );
};

/**
 * Generate random token for refresh tokens (cryptographically secure)
 * @returns {string} Random token (80 chars hex)
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

/**
 * Verify JWT access token with session anomaly detection
 * @param {string} token - JWT token
 * @param {Object} requestContext - Current request context (IP, UA)
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token, requestContext = {}) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Session anomaly detection (non-blocking, log only)
  if (decoded.ctx) {
    const currentUAHash = requestContext.ua
      ? crypto.createHash('sha256').update(requestContext.ua).digest('hex').substring(0, 16)
      : null;

    // IP mismatch detection
    if (decoded.ctx.ip && requestContext.ip && decoded.ctx.ip !== requestContext.ip) {
      warn('Session anomaly: IP mismatch', {
        userId: decoded.id,
        tokenIP: decoded.ctx.ip,
        requestIP: requestContext.ip,
        jti: decoded.jti
      });
    }

    // User-Agent mismatch detection
    if (decoded.ctx.ua && currentUAHash && decoded.ctx.ua !== currentUAHash) {
      warn('Session anomaly: User-Agent mismatch', {
        userId: decoded.id,
        jti: decoded.jti
      });
    }
  }

  return decoded;
};

/**
 * Verify JWT refresh token with absolute session lifetime check
 * @param {string} token - JWT refresh token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid, expired, or past absolute lifetime
 */
export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  // Check absolute session lifetime (30 days max)
  if (decoded.absoluteExpiry) {
    const absoluteExpiry = new Date(decoded.absoluteExpiry);
    if (Date.now() > absoluteExpiry.getTime()) {
      throw new Error('Session expired: absolute lifetime exceeded (30 days)');
    }
  }

  return decoded;
};

/**
 * Detect refresh token reuse (security breach indicator)
 * Call this AFTER revoking old token but BEFORE creating new one
 * 
 * @param {string} tokenString - The refresh token being used
 * @param {Object} RefreshToken - Mongoose model
 * @returns {Promise<boolean>} True if reuse detected
 */
export const detectRefreshTokenReuse = async (tokenString, RefreshToken) => {
  const storedToken = await RefreshToken.findOne({ token: tokenString });

  if (!storedToken) {
    return false; // Token not found, not reuse
  }

  // If token is already revoked, this is REUSE (security breach)
  if (storedToken.isRevoked) {
    logError('SECURITY ALERT: Refresh token reuse detected', {
      userId: storedToken.user,
      tokenId: storedToken._id,
      revokedAt: storedToken.revokedAt,
      attemptedAt: new Date()
    });

    // Revoke ALL tokens for this user (security breach response)
    await RefreshToken.updateMany(
      { user: storedToken.user, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokeReason: 'token_reuse_detected' }
    );

    return true; // Reuse detected
  }

  return false; // Valid token, not reuse
};

export default {
  generateToken,
  generateRefreshToken,
  generateRandomToken,
  verifyToken,
  verifyRefreshToken,
  detectRefreshTokenReuse,
};
