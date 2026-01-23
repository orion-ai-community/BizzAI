import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: Add admin tracking fields to existing users
 * Run this once to update all existing users in the database
 */

async function migrateUsers() {
    try {
        console.log('🔄 Starting user migration...');
        console.log(`📍 Connecting to: ${process.env.MONGO_URI}\n`);

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Count users that need migration
        const needsMigration = await usersCollection.countDocuments({
            status: { $exists: false }
        });

        console.log(`📊 Found ${needsMigration} users that need migration\n`);

        if (needsMigration === 0) {
            console.log('✅ All users already have tracking fields');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Update all existing users with default values
        const result = await usersCollection.updateMany(
            { status: { $exists: false } },
            {
                $set: {
                    status: 'active',
                    failedLoginAttempts: 0,
                    loginHistory: []
                }
            }
        );

        console.log(`✅ Migration complete!`);
        console.log(`   Updated ${result.modifiedCount} users`);
        console.log(`\n📋 Added fields:`);
        console.log(`   - status: 'active'`);
        console.log(`   - failedLoginAttempts: 0`);
        console.log(`   - loginHistory: []`);
        console.log(`   - lastLogin: null (will be set on next login)`);
        console.log(`   - accountLockedUntil: null`);
        console.log(`   - lastFailedLogin: null\n`);

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateUsers();
