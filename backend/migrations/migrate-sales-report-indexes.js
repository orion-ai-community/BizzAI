import mongoose from 'mongoose';
import { info, error } from '../utils/logger.js';

/**
 * Migration: Add optimized indexes for Sales Report queries
 * 
 * This migration adds compound indexes to improve query performance
 * for the Sales Report module, enabling fast filtering and aggregation
 * on large datasets (1M+ invoices).
 */

const MIGRATION_NAME = 'migrate-sales-report-indexes';

export async function up() {
    try {
        info(`[${MIGRATION_NAME}] Starting migration UP...`);

        const db = mongoose.connection.db;

        // Invoice collection indexes
        info(`[${MIGRATION_NAME}] Creating Invoice indexes...`);

        // Compound index for sales report queries (user + date + payment status)
        await db.collection('invoices').createIndex(
            { createdBy: 1, createdAt: -1, paymentStatus: 1 },
            { name: 'idx_sales_report_main', background: true }
        );

        // Compound index for customer-wise reports
        await db.collection('invoices').createIndex(
            { createdBy: 1, customer: 1, createdAt: -1 },
            { name: 'idx_sales_report_customer', background: true }
        );

        // Index for payment method filtering
        await db.collection('invoices').createIndex(
            { createdBy: 1, paymentMethod: 1 },
            { name: 'idx_sales_report_payment_method', background: true }
        );

        // Return collection indexes
        info(`[${MIGRATION_NAME}] Creating Return indexes...`);

        // Compound index for returns in sales report
        await db.collection('returns').createIndex(
            { createdBy: 1, returnDate: -1 },
            { name: 'idx_sales_report_returns', background: true }
        );

        // Index for invoice-based return lookups
        await db.collection('returns').createIndex(
            { createdBy: 1, invoice: 1 },
            { name: 'idx_sales_report_returns_invoice', background: true }
        );

        // SalesOrder collection indexes
        info(`[${MIGRATION_NAME}] Creating SalesOrder indexes...`);

        // Compound index for completed sales orders
        await db.collection('salesorders').createIndex(
            { createdBy: 1, status: 1, orderDate: -1 },
            { name: 'idx_sales_report_orders', background: true }
        );

        // Item collection indexes (for profit calculation)
        info(`[${MIGRATION_NAME}] Creating Item indexes...`);

        // Index for item lookups in sales report
        await db.collection('items').createIndex(
            { addedBy: 1, category: 1 },
            { name: 'idx_sales_report_items_category', background: true }
        );

        info(`[${MIGRATION_NAME}] Migration UP completed successfully`);
        return true;
    } catch (err) {
        error(`[${MIGRATION_NAME}] Migration UP failed: ${err.message}`);
        throw err;
    }
}

export async function down() {
    try {
        info(`[${MIGRATION_NAME}] Starting migration DOWN...`);

        const db = mongoose.connection.db;

        // Drop Invoice indexes
        info(`[${MIGRATION_NAME}] Dropping Invoice indexes...`);
        await db.collection('invoices').dropIndex('idx_sales_report_main').catch(() => { });
        await db.collection('invoices').dropIndex('idx_sales_report_customer').catch(() => { });
        await db.collection('invoices').dropIndex('idx_sales_report_payment_method').catch(() => { });

        // Drop Return indexes
        info(`[${MIGRATION_NAME}] Dropping Return indexes...`);
        await db.collection('returns').dropIndex('idx_sales_report_returns').catch(() => { });
        await db.collection('returns').dropIndex('idx_sales_report_returns_invoice').catch(() => { });

        // Drop SalesOrder indexes
        info(`[${MIGRATION_NAME}] Dropping SalesOrder indexes...`);
        await db.collection('salesorders').dropIndex('idx_sales_report_orders').catch(() => { });

        // Drop Item indexes
        info(`[${MIGRATION_NAME}] Dropping Item indexes...`);
        await db.collection('items').dropIndex('idx_sales_report_items_category').catch(() => { });

        info(`[${MIGRATION_NAME}] Migration DOWN completed successfully`);
        return true;
    } catch (err) {
        error(`[${MIGRATION_NAME}] Migration DOWN failed: ${err.message}`);
        throw err;
    }
}
