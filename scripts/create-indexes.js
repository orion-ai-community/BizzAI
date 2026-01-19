import mongoose from "mongoose";
import { info, error } from "../utils/logger.js";

/**
 * Creates database indexes for optimal query performance
 * Run this script after deployment or schema changes
 */

const createIndexes = async () => {
    try {
        // Connect to database
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI environment variable not set");
        }

        await mongoose.connect(mongoUri);
        info("Connected to MongoDB");

        const db = mongoose.connection.db;

        // Invoice indexes
        info("Creating Invoice indexes...");
        await db.collection("invoices").createIndex({ createdBy: 1, createdAt: -1 });
        await db.collection("invoices").createIndex({ createdBy: 1, paymentStatus: 1 });
        await db.collection("invoices").createIndex({ customer: 1, createdAt: -1 });
        await db.collection("invoices").createIndex({ invoiceNo: 1, createdBy: 1 }, { unique: true });
        info("✅ Invoice indexes created");

        // Customer indexes
        info("Creating Customer indexes...");
        await db.collection("customers").createIndex({ owner: 1, name: 1 });
        await db.collection("customers").createIndex({ owner: 1, phone: 1 }, { unique: true });
        await db.collection("customers").createIndex({ owner: 1, dues: -1 });
        // Text index for search
        await db.collection("customers").createIndex({ name: "text", email: "text", phone: "text" });
        info("✅ Customer indexes created");

        // Item indexes
        info("Creating Item indexes...");
        await db.collection("items").createIndex({ addedBy: 1, category: 1 });
        await db.collection("items").createIndex({ addedBy: 1, stockQty: 1 });
        await db.collection("items").createIndex({ addedBy: 1, name: 1 }, { unique: true });
        await db.collection("items").createIndex({ sku: 1 }, { sparse: true });
        // Text index for search
        await db.collection("items").createIndex({ name: "text", category: "text", sku: "text" });
        info("✅ Item indexes created");

        // Transaction indexes
        info("Creating Transaction indexes...");
        await db.collection("transactions").createIndex({ customer: 1, createdAt: -1 });
        await db.collection("transactions").createIndex({ type: 1, createdAt: -1 });
        info("✅ Transaction indexes created");

        // Sales Order indexes
        info("Creating Sales Order indexes...");
        await db.collection("salesorders").createIndex({ createdBy: 1, createdAt: -1 });
        await db.collection("salesorders").createIndex({ customer: 1, status: 1 });
        await db.collection("salesorders").createIndex({ status: 1, createdAt: -1 });
        info("✅ Sales Order indexes created");

        // Return indexes
        info("Creating Return indexes...");
        await db.collection("returns").createIndex({ invoice: 1 });
        await db.collection("returns").createIndex({ customer: 1, createdAt: -1 });
        await db.collection("returns").createIndex({ refundMethod: 1, createdAt: -1 });
        info("✅ Return indexes created");

        // User indexes
        info("Creating User indexes...");
        await db.collection("users").createIndex({ email: 1 }, { unique: true });
        info("✅ User indexes created");

        info("🎉 All indexes created successfully");

        // List all indexes
        const collections = await db.listCollections().toArray();
        for (const collection of collections) {
            const indexes = await db.collection(collection.name).indexes();
            info(`Indexes for ${collection.name}:`, { count: indexes.length });
        }

        await mongoose.connection.close();
        info("Database connection closed");
        process.exit(0);
    } catch (err) {
        error("Error creating indexes:", { error: err.message });
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createIndexes();
}

export default createIndexes;
