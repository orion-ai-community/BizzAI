import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Generate access token (short-lived)
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "24h", // 24 hours for access token (similar to Vyapar app)
  });
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: "7d", // 7 days for refresh token
  });
};

/**
 * Generate random refresh token string
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(40).toString("hex");
};

/**
 * Verify access token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
