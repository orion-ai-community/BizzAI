import mongoose from "mongoose";

/**
 * UserActivityLog - Append-only telemetry for user activity events
 * 
 * This is NOT admin code - it's raw system telemetry that tracks user actions.
 * The admin panel (separate repo) will read this data for analytics.
 * 
 * TTL: 90 days automatic cleanup
 */

const userActivityLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        eventType: {
            type: String,
            required: true,
            enum: [
                "REGISTRATION",
                "LOGIN",
                "LOGOUT",
                "LOGOUT_ALL",
                "TOKEN_REFRESH",
                "FAILED_LOGIN",
                "PASSWORD_CHANGE",
                "PASSWORD_RESET_REQUEST",
                "ACCOUNT_LOCKED",
                "ACCOUNT_UNLOCKED",
                "SUSPICIOUS_ACTIVITY",
            ],
            index: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
        ipAddress: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
            default: null,
        },
        deviceId: {
            type: String,
            default: null,
        },
        deviceType: {
            type: String,
            enum: ["mobile", "tablet", "desktop", "unknown"],
            default: "unknown",
        },
        browser: {
            type: String,
            default: null,
        },
        os: {
            type: String,
            default: null,
        },
        // Flexible metadata for event-specific data
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

// Compound indexes for efficient querying
userActivityLogSchema.index({ userId: 1, timestamp: -1 }); // User activity timeline
userActivityLogSchema.index({ eventType: 1, timestamp: -1 }); // Event type analysis
userActivityLogSchema.index({ deviceId: 1, timestamp: -1 }); // Device tracking

// TTL index - automatically delete logs older than 90 days
userActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Prevent updates (append-only)
userActivityLogSchema.pre('updateOne', function (next) {
    next(new Error('UserActivityLog is append-only and cannot be updated'));
});

userActivityLogSchema.pre('findOneAndUpdate', function (next) {
    next(new Error('UserActivityLog is append-only and cannot be updated'));
});

// Allow deletion for cleanup/testing purposes (unlike AuditLog which is stricter)
// TTL will handle automatic cleanup in production

const UserActivityLog = mongoose.model("UserActivityLog", userActivityLogSchema);
export default UserActivityLog;
