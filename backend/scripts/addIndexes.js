/**
 * Database Index Optimization Script
 * Run this to add missing indexes for production performance
 * 
 * Usage: node scripts/addIndexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const addIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Invoice indexes for fast queries
        console.log('📊 Adding Invoice indexes...');
        await db.collection('invoices').createIndex({ createdBy: 1, createdAt: -1 });
        await db.collection('invoices').createIndex({ customer: 1, createdAt: -1 });
        await db.collection('invoices').createIndex({ invoiceNo: 1, createdBy: 1 }, { unique: true });
        await db.collection('invoices').createIndex({ paymentStatus: 1, createdBy: 1 });
        await db.collection('invoices').createIndex({ isDeleted: 1, createdBy: 1 });
        console.log('✅ Invoice indexes added');

        // Customer indexes
        console.log('📊 Adding Customer indexes...');
        await db.collection('customers').createIndex({ owner: 1, name: 1 });
        await db.collection('customers').createIndex({ owner: 1, dues: -1 }); // For top debtors
        console.log('✅ Customer indexes added');

        // Item/Inventory indexes
        console.log('📊 Adding Item indexes...');
        await db.collection('items').createIndex({ addedBy: 1, category: 1 });
        await db.collection('items').createIndex({ addedBy: 1, stockQty: 1 }); // For low stock queries
        await db.collection('items').createIndex({ sku: 1, addedBy: 1 }, { unique: true, sparse: true });
        console.log('✅ Item indexes added');

        // Return indexes
        console.log('📊 Adding Return indexes...');
        await db.collection('returns').createIndex({ createdBy: 1, createdAt: -1 });
        await db.collection('returns').createIndex({ invoice: 1 });
        await db.collection('returns').createIndex({ customer: 1, createdAt: -1 });
        console.log('✅ Return indexes added');

        // Sales Order indexes
        console.log('📊 Adding Sales Order indexes...');
        await db.collection('salesorders').createIndex({ createdBy: 1, status: 1 });
        await db.collection('salesorders').createIndex({ createdBy: 1, createdAt: -1 });
        await db.collection('salesorders').createIndex({ customer: 1, status: 1 });
        console.log('✅ Sales Order indexes added');

        // Transaction indexes
        console.log('📊 Adding Transaction indexes...');
        await db.collection('transactions').createIndex({ customer: 1, createdAt: -1 });
        await db.collection('transactions').createIndex({ invoice: 1 });
        console.log('✅ Transaction indexes added');

        // RefreshToken indexes
        console.log('📊 Adding RefreshToken indexes...');
        await db.collection('refreshtokens').createIndex({ token: 1 }, { unique: true });
        await db.collection('refreshtokens').createIndex({ user: 1, isRevoked: 1 });
        await db.collection('refreshtokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
        console.log('✅ RefreshToken indexes added');

        // List all indexes
        console.log('\n📋 Current indexes:');
        const collections = ['invoices', 'customers', 'items', 'returns', 'salesorders', 'transactions', 'refreshtokens'];

        for (const collName of collections) {
            const indexes = await db.collection(collName).indexes();
            console.log(`\n${collName}:`);
            indexes.forEach(idx => {
                console.log(`  - ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
            });
        }

        console.log('\n✅ All indexes added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding indexes:', error);
        process.exit(1);
    }
};

addIndexes();
