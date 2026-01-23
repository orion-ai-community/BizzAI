import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        isRevoked: {
            type: Boolean,
            default: false,
        },
        revokedAt: {
            type: Date,
        },
        replacedByToken: {
            type: String,
        },
        createdByIp: {
            type: String,
        },
        userAgent: {
            type: String,
        },
        // Device metadata for session correlation
        deviceId: {
            type: String,
            index: true,
        },
        deviceType: {
            type: String,
            enum: ["mobile", "tablet", "desktop", "unknown"],
            default: "unknown",
        },
        browser: {
            type: String,
        },
        os: {
            type: String,
        },
        lastUsedAt: {
            type: Date,
            default: function () {
                return this.createdAt || new Date();
            },
        },
    },
    { timestamps: true }
);

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance method to check if token is expired
refreshTokenSchema.methods.isExpired = function () {
    return Date.now() >= this.expiresAt;
};

// Instance method to check if token is active
refreshTokenSchema.methods.isActive = function () {
    return !this.isRevoked && !this.isExpired();
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export default RefreshToken;
