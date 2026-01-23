/**
 * Migration Script: User Activity Tracking Infrastructure
 * 
 * Purpose: Migrate existing production users to new activity tracking schema
 * 
 * This script:
 * 1. Adds default values for all new tracking fields
 * 2. Migrates existing loginHistory to new format with device metadata
 * 3. Updates RefreshToken documents with device metadata
 * 4. Creates initial UserActivityLog entries from existing data
 * 5. Ensures backward compatibility for all 35 production users
 * 
 * Safety:
 * - Idempotent (can be re-run safely)
 * - No data deletion
 * - Preserves all existing data
 * - Adds only new fields with safe defaults
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import UserActivityLog from "../models/UserActivityLog.js";
import { parseUserAgent } from "../utils/deviceParser.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in environment variables");
    process.exit(1);
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB Atlas");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
}

/**
 * Migrate User documents
 */
async function migrateUsers() {
    console.log("\n📊 Migrating User documents...");

    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
        try {
            let needsUpdate = false;

            // Check if user needs migration (if accountStatus doesn't exist)
            if (!user.accountStatus) {
                needsUpdate = true;

                // Account lifecycle
                user.accountStatus = user.status || "active";
                user.accountCreatedSource = "web";
                user.accountDeactivatedAt = null;
                user.accountSuspendedReason = null;

                // Activity tracking
                user.lastLoginAt = user.lastLogin || user.createdAt;
                user.lastLogoutAt = null;
                user.lastSeenAt = user.lastLogin || user.createdAt;
                user.lastActivityType = null;

                // Session & device tracking
                user.activeSessionCount = 0; // Will be recalculated on next login
                user.activeDeviceIds = user.activeDeviceId ? [user.activeDeviceId] : [];
                user.lastActiveDeviceId = user.activeDeviceId || null;
                user.lastActiveDeviceType = null;
                user.lastActiveOS = null;
                user.lastActiveBrowser = null;

                // Network & location
                user.lastKnownIp = user.lastLoginIp || null;
                user.lastKnownCountry = null;
                user.lastKnownCity = null;

                // Security tracking
                user.suspiciousActivityCount = 0;
                user.lastSuspiciousActivityAt = null;
                user.riskScore = 0;
                user.passwordChangedAt = null;
                user.passwordChangeRequired = false;

                // Migrate loginHistory to new format
                if (user.loginHistory && user.loginHistory.length > 0) {
                    user.loginHistory = user.loginHistory.map(entry => {
                        // Parse userAgent if available
                        let deviceMeta = {
                            deviceType: null,
                            browser: null,
                            os: null,
                        };

                        if (entry.userAgent) {
                            const parsed = parseUserAgent(entry.userAgent);
                            deviceMeta = {
                                deviceType: parsed.deviceType,
                                browser: parsed.browser,
                                os: parsed.os,
                            };
                        }

                        return {
                            timestamp: entry.timestamp,
                            ipAddress: entry.ipAddress,
                            userAgent: entry.userAgent,
                            deviceId: null, // Unknown for old entries
                            deviceType: deviceMeta.deviceType,
                            browser: deviceMeta.browser,
                            os: deviceMeta.os,
                            success: entry.success !== undefined ? entry.success : true,
                            failureReason: entry.success === false ? "unknown" : null,
                        };
                    });
                }

                await user.save();
                migratedCount++;
                console.log(`  ✅ Migrated user: ${user.email}`);
            } else {
                skippedCount++;
            }
        } catch (error) {
            console.error(`  ❌ Error migrating user ${user.email}:`, error.message);
        }
    }

    console.log(`\n✅ User migration complete:`);
    console.log(`   - Migrated: ${migratedCount}`);
    console.log(`   - Skipped (already migrated): ${skippedCount}`);
}

/**
 * Migrate RefreshToken documents
 */
async function migrateRefreshTokens() {
    console.log("\n📊 Migrating RefreshToken documents...");

    const tokens = await RefreshToken.find({});
    console.log(`Found ${tokens.length} refresh tokens to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const token of tokens) {
        try {
            // Check if token needs migration (if deviceType doesn't exist)
            if (!token.deviceType) {
                // Parse userAgent to extract device metadata
                let deviceMeta = {
                    deviceType: "unknown",
                    browser: null,
                    os: null,
                };

                if (token.userAgent) {
                    const parsed = parseUserAgent(token.userAgent);
                    deviceMeta = {
                        deviceType: parsed.deviceType,
                        browser: parsed.browser,
                        os: parsed.os,
                    };
                }

                token.deviceId = null; // Unknown for old tokens
                token.deviceType = deviceMeta.deviceType;
                token.browser = deviceMeta.browser;
                token.os = deviceMeta.os;
                token.lastUsedAt = token.createdAt;

                await token.save();
                migratedCount++;
            } else {
                skippedCount++;
            }
        } catch (error) {
            console.error(`  ❌ Error migrating token:`, error.message);
        }
    }

    console.log(`\n✅ RefreshToken migration complete:`);
    console.log(`   - Migrated: ${migratedCount}`);
    console.log(`   - Skipped (already migrated): ${skippedCount}`);
}

/**
 * Create initial UserActivityLog entries from existing loginHistory
 */
async function createInitialActivityLogs() {
    console.log("\n📊 Creating initial UserActivityLog entries...");

    // Check if any activity logs already exist
    const existingLogs = await UserActivityLog.countDocuments();
    if (existingLogs > 0) {
        console.log(`⚠️  Found ${existingLogs} existing activity logs. Skipping initial log creation.`);
        return;
    }

    const users = await User.find({});
    let totalLogsCreated = 0;

    for (const user of users) {
        try {
            if (user.loginHistory && user.loginHistory.length > 0) {
                const activityLogs = user.loginHistory.map(entry => ({
                    userId: user._id,
                    eventType: entry.success ? "LOGIN" : "FAILED_LOGIN",
                    timestamp: entry.timestamp,
                    ipAddress: entry.ipAddress || "unknown",
                    userAgent: entry.userAgent || null,
                    deviceId: entry.deviceId || null,
                    deviceType: entry.deviceType || "unknown",
                    browser: entry.browser || null,
                    os: entry.os || null,
                    metadata: entry.success === false ? { reason: entry.failureReason || "unknown" } : {},
                }));

                await UserActivityLog.insertMany(activityLogs, { ordered: false });
                totalLogsCreated += activityLogs.length;
                console.log(`  ✅ Created ${activityLogs.length} activity logs for user: ${user.email}`);
            }
        } catch (error) {
            console.error(`  ❌ Error creating activity logs for user ${user.email}:`, error.message);
        }
    }

    console.log(`\n✅ UserActivityLog creation complete: ${totalLogsCreated} logs created`);
}

/**
 * Verify migration success
 */
async function verifyMigration() {
    console.log("\n🔍 Verifying migration...");

    const users = await User.find({});
    const tokens = await RefreshToken.find({});
    const activityLogs = await UserActivityLog.find({});

    console.log("\n📊 Migration Summary:");
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Users with accountStatus: ${users.filter(u => u.accountStatus).length}`);
    console.log(`   - Users with lastSeenAt: ${users.filter(u => u.lastSeenAt).length}`);
    console.log(`   - Total refresh tokens: ${tokens.length}`);
    console.log(`   - Tokens with deviceType: ${tokens.filter(t => t.deviceType).length}`);
    console.log(`   - Total activity logs: ${activityLogs.length}`);

    // Check for any users missing new fields
    const usersNeedingMigration = users.filter(u => !u.accountStatus);
    if (usersNeedingMigration.length > 0) {
        console.log(`\n⚠️  WARNING: ${usersNeedingMigration.length} users still need migration:`);
        usersNeedingMigration.forEach(u => console.log(`   - ${u.email}`));
    } else {
        console.log("\n✅ All users successfully migrated!");
    }
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log("🚀 Starting User Activity Tracking Migration");
    console.log("=".repeat(60));

    try {
        await connectDB();

        await migrateUsers();
        await migrateRefreshTokens();
        await createInitialActivityLogs();
        await verifyMigration();

        console.log("\n" + "=".repeat(60));
        console.log("✅ Migration completed successfully!");
        console.log("=".repeat(60));
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log("\n👋 Disconnected from MongoDB");
    }
}

// Run migration
runMigration();
