import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { info, error } from '../utils/logger.js';

dotenv.config();

/**
 * Migration: Fix Supplier Indexes
 * 
 * This migration drops the old global unique index on supplierId
 * and ensures the new compound indexes are created properly.
 * 
 * Run this script once to fix the database schema.
 */

const fixSupplierIndexes = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        info('Connected to MongoDB for migration');

        const db = mongoose.connection.db;
        const suppliersCollection = db.collection('suppliers');

        // Get existing indexes
        const existingIndexes = await suppliersCollection.indexes();
        info('Existing indexes:', JSON.stringify(existingIndexes, null, 2));

        // Drop the old global unique index on supplierId if it exists
        try {
            const supplierIdIndex = existingIndexes.find(idx =>
                idx.key && idx.key.supplierId === 1 && !idx.key.owner
            );

            if (supplierIdIndex) {
                await suppliersCollection.dropIndex(supplierIdIndex.name);
                info(`Dropped old global unique index: ${supplierIdIndex.name}`);
            } else {
                info('No global supplierId index found to drop');
            }
        } catch (err) {
            if (err.code === 27 || err.message.includes('index not found')) {
                info('Index already dropped or does not exist');
            } else {
                throw err;
            }
        }

        // Create new compound indexes
        info('Creating new compound indexes...');

        // Helper function to check if index exists
        const indexExists = (indexes, keyPattern) => {
            return indexes.some(idx => {
                if (!idx.key) return false;
                const keys = Object.keys(keyPattern);
                return keys.every(key => idx.key[key] === keyPattern[key]);
            });
        };

        // Get current indexes after dropping the old one
        const currentIndexes = await suppliersCollection.indexes();

        // Compound index for supplierId and owner
        if (!indexExists(currentIndexes, { supplierId: 1, owner: 1 })) {
            await suppliersCollection.createIndex(
                { supplierId: 1, owner: 1 },
                { unique: true, name: 'supplierId_owner_unique' }
            );
            info('Created compound index: supplierId_owner_unique');
        } else {
            info('Compound index for supplierId and owner already exists');
        }

        // Compound index for contactNo and owner
        if (!indexExists(currentIndexes, { contactNo: 1, owner: 1 })) {
            await suppliersCollection.createIndex(
                { contactNo: 1, owner: 1 },
                { unique: true, name: 'contactNo_owner_unique' }
            );
            info('Created compound index: contactNo_owner_unique');
        } else {
            info('Compound index for contactNo and owner already exists');
        }

        // Compound index for email and owner
        if (!indexExists(currentIndexes, { email: 1, owner: 1 })) {
            await suppliersCollection.createIndex(
                { email: 1, owner: 1 },
                { unique: true, name: 'email_owner_unique' }
            );
            info('Created compound index: email_owner_unique');
        } else {
            info('Compound index for email and owner already exists');
        }

        // Verify new indexes
        const newIndexes = await suppliersCollection.indexes();
        info('New indexes:', JSON.stringify(newIndexes, null, 2));

        info('✅ Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        error('Migration failed:', err);
        process.exit(1);
    }
};

fixSupplierIndexes();
