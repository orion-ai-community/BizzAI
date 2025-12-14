// Run this script to fix the invoice index issue
// Execute with: node fixInvoiceIndex.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixInvoiceIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const invoicesCollection = db.collection('invoices');

        // Drop the old unique index on invoiceNo
        try {
            await invoicesCollection.dropIndex('invoiceNo_1');
            console.log('✓ Dropped old invoiceNo_1 index');
        } catch (error) {
            console.log('Old index not found or already dropped');
        }

        // Create new compound unique index
        await invoicesCollection.createIndex(
            { invoiceNo: 1, createdBy: 1 },
            { unique: true }
        );
        console.log('✓ Created new compound index: invoiceNo + createdBy');

        console.log('\n✅ Database indexes fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing indexes:', error.message);
        process.exit(1);
    }
};

fixInvoiceIndex();
