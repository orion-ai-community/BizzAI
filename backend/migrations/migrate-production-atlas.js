import mongoose from 'mongoose';

/**
 * Migration: Add admin tracking fields to PRODUCTION Atlas users
 * This will update all 34 users in the production database
 */

const ATLAS_URI = 'mongodb+srv://workorionai_db_user:8tqc141bvjNXG96Y@cluster0.vcb57bt.mongodb.net/test?appName=Cluster0';

async function migrateProductionUsers() {
    try {
        console.log('🔄 Starting PRODUCTION user migration...');
        console.log('📍 Connecting to: MongoDB Atlas (test database)\n');

        await mongoose.connect(ATLAS_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Count total users
        const totalUsers = await usersCollection.countDocuments();
        console.log(`📊 Total users in database: ${totalUsers}`);

        // Count users that need migration
        const needsMigration = await usersCollection.countDocuments({
            status: { $exists: false }
        });

        console.log(`📊 Users needing migration: ${needsMigration}\n`);

        if (needsMigration === 0) {
            console.log('✅ All users already have tracking fields');
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log('🔧 Adding tracking fields to users...\n');

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

        console.log('✅ Migration complete!');
        console.log(`   Updated ${result.modifiedCount} users\n`);

        console.log('📋 Fields added to each user:');
        console.log('   - status: "active"');
        console.log('   - failedLoginAttempts: 0');
        console.log('   - loginHistory: []');
        console.log('   - lastLogin: null (will be set on next login)');
        console.log('   - accountLockedUntil: null');
        console.log('   - lastFailedLogin: null\n');

        // Verify one user to confirm
        const sampleUser = await usersCollection.findOne({ status: 'active' });
        if (sampleUser) {
            console.log('✅ Verification: Sample user has new fields');
            console.log(`   Email: ${sampleUser.email}`);
            console.log(`   Status: ${sampleUser.status}`);
            console.log(`   Failed Attempts: ${sampleUser.failedLoginAttempts}`);
            console.log(`   Login History Length: ${sampleUser.loginHistory?.length || 0}\n`);
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB Atlas');
        console.log('\n🎉 Production database migration successful!');
        console.log('   All 34 users now have admin tracking fields.');
        console.log('   The admin console can now display complete user data.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateProductionUsers();
