import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please enter password"],
    },
    shopName: {
      type: String,
      default: "",
    },
    gstNumber: {
      type: String,
      default: "",
    },
    shopAddress: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["owner"],
      default: "owner",
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // ==================== ACCOUNT LIFECYCLE ====================
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended", "locked"],
      default: "active",
      index: true,
    },
    accountCreatedSource: {
      type: String,
      enum: ["web", "mobile", "api"],
      default: "web",
    },
    accountDeactivatedAt: {
      type: Date,
      default: null,
    },
    accountSuspendedReason: {
      type: String,
      default: null,
    },

    // ==================== REAL ACTIVITY TRACKING ====================
    lastLoginAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastLogoutAt: {
      type: Date,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastActivityType: {
      type: String,
      enum: ["login", "logout", "api_call", "token_refresh", "invoice_management", "customer_management", "inventory_management"],
      default: null,
    },

    // ==================== SESSION & DEVICE TRACKING ====================
    activeSessionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeDeviceIds: {
      type: [String],
      default: [],
    },
    // Device session tracking for single device login enforcement
    // deviceId is a cryptographically secure random identifier stored in HttpOnly cookie
    activeDeviceId: {
      type: String,
      default: null,
      index: true,
    },
    activeSessionCreatedAt: {
      type: Date,
      default: null,
    },
    lastActiveDeviceId: {
      type: String,
      default: null,
    },
    lastActiveDeviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "unknown"],
      default: null,
    },
    lastActiveOS: {
      type: String,
      default: null,
    },
    lastActiveBrowser: {
      type: String,
      default: null,
    },

    // ==================== NETWORK & LOCATION ====================
    // IP and UA stored as audit metadata only, NOT used for device identification
    lastLoginIp: {
      type: String,
      default: null,
    },
    lastLoginUserAgent: {
      type: String,
      default: null,
    },
    lastKnownIp: {
      type: String,
      default: null,
    },
    lastKnownCountry: {
      type: String,
      default: null,
    },
    lastKnownCity: {
      type: String,
      default: null,
    },

    // ==================== ENHANCED LOGIN HISTORY ====================
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
        userAgent: String,
        deviceId: { type: String, default: null },
        deviceType: { type: String, default: null },
        browser: { type: String, default: null },
        os: { type: String, default: null },
        success: { type: Boolean, default: true },
        failureReason: { type: String, default: null },
      },
    ],

    // ==================== SECURITY TRACKING ====================
    // Legacy status field - kept for backward compatibility
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    // Legacy lastLogin field - kept for backward compatibility
    lastLogin: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: {
      type: Date,
      default: null,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
    suspiciousActivityCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSuspiciousActivityAt: {
      type: Date,
      default: null,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    passwordChangeRequired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Password encryption before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return this.accountLockedUntil && this.accountLockedUntil > Date.now();
};

// Increment failed login attempts
userSchema.methods.incLoginAttempts = async function () {
  // Lock account after 5 failed attempts for 15 minutes
  if (this.failedLoginAttempts + 1 >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  this.failedLoginAttempts += 1;
  this.lastFailedLogin = new Date();
  return this.save();
};

// Reset failed attempts on successful login
userSchema.methods.resetLoginAttempts = async function () {
  if (this.failedLoginAttempts === 0 && !this.accountLockedUntil) return;
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = undefined;
  return this.save();
};

// Record successful login
userSchema.methods.recordLogin = async function (ipAddress, userAgent) {
  this.lastLogin = new Date();
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success: true,
  });

  // Keep only last 50 login records
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }

  return this.save();
};

// Record failed login
userSchema.methods.recordFailedLogin = async function (ipAddress, userAgent) {
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success: false,
  });

  // Keep only last 50 login records
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }

  return this.save();
};

const User = mongoose.model("User", userSchema);
export default User;
