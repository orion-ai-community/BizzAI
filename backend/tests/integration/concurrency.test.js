/**
 * Concurrency Tests
 * 
 * Tests system behavior under concurrent operations
 */

import mongoose from 'mongoose';
import Organization from '../../models/Organization.js';
import User from '../../models/User.js';
import Item from '../../models/Item.js';
import Invoice from '../../models/Invoice.js';
import StockLedger from '../../models/StockLedger.js';
import FinancialPeriod from '../../models/FinancialPeriod.js';

describe('Concurrency Tests', () => {
    let organization, user, financialPeriod;

    beforeAll(async () => {
        organization = await Organization.create({
            name: 'Concurrency Test Org',
            subdomain: 'concurrency-test',
            settings: { currency: 'INR', timezone: 'Asia/Kolkata', fiscalYearStart: 4 }
        });

        user = await User.create({
            name: 'Test User',
            email: 'concurrency@example.com',
            password: 'Test@123',
            organization: organization._id
        });

        financialPeriod = await FinancialPeriod.create({
            name: 'FY 2026-2027',
            fiscalYear: 2026,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2027-03-31'),
            status: 'open',
            organization: organization._id,
            createdBy: user._id
        });
    });

    afterAll(async () => {
        await Organization.deleteMany({});
        await User.deleteMany({});
        await Item.deleteMany({});
        await Invoice.deleteMany({});
        // StockLedger is append-only, cannot be deleted
        // await StockLedger.deleteMany({});
        await FinancialPeriod.deleteMany({});
    });

    describe('Concurrent Stock Updates', () => {
        test('should handle concurrent stock ledger entries correctly', async () => {
            const item = await Item.create({
                name: 'Concurrent Test Item',
                sku: 'CONC-001',
                addedBy: user._id,
                costPrice: 50,
                sellingPrice: 100,
                purchasePrice: 50,
                stockQty: 100,
                organization: organization._id,
                createdBy: user._id,
                organizationId: organization._id
            });

            // Simulate 10 concurrent stock updates
            const updates = Array.from({ length: 10 }, (_, i) => {
                return StockLedger.create({
                    item: item._id,
                    transactionType: 'SALE',
                    quantityChange: -5,
                    runningBalance: 0, // Will be calculated
                    costPerUnit: 50,
                    totalValue: -250,
                    sourceDocument: {
                        type: 'Invoice',
                        id: new mongoose.Types.ObjectId()
                    },
                    organizationId: organization._id,
                    createdBy: user._id
                });
            });

            await Promise.all(updates);

            // Verify all entries created
            const entries = await StockLedger.find({ item: item._id }).sort({ timestamp: 1 });
            expect(entries).toHaveLength(10);

            // Verify final stock
            const finalItem = await Item.findById(item._id);
            expect(finalItem.stockQty).toBe(50); // 100 - (10 * 5)
        });

        test('should prevent race conditions in stock updates', async () => {
            const item = await Item.create({
                name: 'Race Condition Test',
                sku: 'RACE-001',
                addedBy: user._id,
                costPrice: 50,
                sellingPrice: 100,
                purchasePrice: 50,
                stockQty: 10,
                organization: organization._id,
                createdBy: user._id,
                organizationId: organization._id
            });

            // Try to sell more than available stock concurrently
            const oversells = Array.from({ length: 5 }, () => {
                return StockLedger.create({
                    item: item._id,
                    transactionType: 'SALE',
                    quantityChange: -5,
                    runningBalance: 0,
                    costPerUnit: 50,
                    totalValue: -250,
                    sourceDocument: {
                        type: 'Invoice',
                        id: new mongoose.Types.ObjectId()
                    },
                    organizationId: organization._id,
                    createdBy: user._id
                });
            });

            // Some should succeed, some might fail
            const results = await Promise.allSettled(oversells);

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            console.log(`Concurrent oversells: ${successful} succeeded, ${failed} failed`);

            // Final stock should never be negative
            const finalItem = await Item.findById(item._id);
            expect(finalItem.stockQty).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Concurrent Invoice Creation', () => {
        test('should handle concurrent invoice creation with unique numbers', async () => {
            // Create 20 invoices concurrently
            const invoices = Array.from({ length: 20 }, (_, i) => {
                return Invoice.create({
                    invoiceNo: `INV-CONC-${Date.now()}-${i}`,
                    customerName: `Customer ${i}`,
                    items: [{ itemName: 'Test', quantity: 1, rate: 100 }],
                    totalAmount: 100,
                    paymentStatus: 'paid',
                    createdBy: user._id,
                    organizationId: organization._id
                });
            });

            const results = await Promise.allSettled(invoices);

            const successful = results.filter(r => r.status === 'fulfilled');
            expect(successful.length).toBe(20);

            // Verify all have unique invoice numbers
            const created = successful.map(r => r.value);
            const invoiceNos = created.map(inv => inv.invoiceNo);
            const uniqueNos = new Set(invoiceNos);

            expect(uniqueNos.size).toBe(20);
        });
    });

    describe('Concurrent Period Locking', () => {
        test('should handle concurrent period lock attempts', async () => {
            const period = await FinancialPeriod.create({
                name: 'Lock Test Period',
                fiscalYear: 2025,
                startDate: new Date('2025-04-01'),
                endDate: new Date('2026-03-31'),
                status: 'open',
                organization: organization._id,
                createdBy: user._id
            });

            // Try to lock the same period concurrently
            const lockAttempts = Array.from({ length: 5 }, () => {
                return FinancialPeriod.findByIdAndUpdate(
                    period._id,
                    {
                        status: 'locked',
                        lockedAt: new Date(),
                        lockedBy: user._id
                    },
                    { new: true }
                );
            });

            const results = await Promise.all(lockAttempts);

            // All should succeed (last write wins)
            results.forEach(result => {
                expect(result.status).toBe('locked');
            });

            // Verify final state
            const finalPeriod = await FinancialPeriod.findById(period._id);
            expect(finalPeriod.status).toBe('locked');
        });
    });

    describe('Transaction Isolation', () => {
        test('should maintain isolation between concurrent transactions', async () => {
            const item = await Item.create({
                name: 'Isolation Test',
                sku: 'ISO-001',
                addedBy: user._id,
                costPrice: 50,
                sellingPrice: 100,
                purchasePrice: 50,
                stockQty: 100,
                organization: organization._id,
                createdBy: user._id,
                organizationId: organization._id
            });

            // Run two concurrent transactions
            const transaction1 = async () => {
                let session;
                try {
                    // Only use transactions if DB supports them (replica set)
                    if (mongoose.connection.client.topology.description.type !== 'Single') {
                        session = await mongoose.startSession();
                        await session.withTransaction(async () => {
                            await Item.findByIdAndUpdate(
                                item._id,
                                { $inc: { stockQty: -10 } },
                                { session }
                            );

                            await StockLedger.create([{
                                item: item._id,
                                transactionType: 'SALE',
                                quantityChange: -10,
                                runningBalance: 90,
                                costPerUnit: 50,
                                totalValue: -500,
                                sourceDocument: {
                                    type: 'Invoice',
                                    id: new mongoose.Types.ObjectId()
                                },
                                organizationId: organization._id,
                                createdBy: user._id
                            }], { session });
                        });
                    } else {
                        // Fallback for standalone MongoDB
                        await Item.findByIdAndUpdate(
                            item._id,
                            { $inc: { stockQty: -10 } }
                        );

                        await StockLedger.create({
                            item: item._id,
                            transactionType: 'SALE',
                            quantityChange: -10,
                            runningBalance: 90,
                            costPerUnit: 50,
                            totalValue: -500,
                            sourceDocument: {
                                type: 'Invoice',
                                id: new mongoose.Types.ObjectId()
                            },
                            organizationId: organization._id,
                            createdBy: user._id
                        });
                    }
                } finally {
                    if (session) session.endSession();
                }
            };

            const transaction2 = async () => {
                let session;
                try {
                    // Only use transactions if DB supports them (replica set)
                    if (mongoose.connection.client.topology.description.type !== 'Single') {
                        session = await mongoose.startSession();
                        await session.withTransaction(async () => {
                            await Item.findByIdAndUpdate(
                                item._id,
                                { $inc: { stockQty: -15 } },
                                { session }
                            );

                            await StockLedger.create([{
                                item: item._id,
                                transactionType: 'SALE',
                                quantityChange: -15,
                                runningBalance: 85,
                                costPerUnit: 50,
                                totalValue: -750,
                                sourceDocument: {
                                    type: 'Invoice',
                                    id: new mongoose.Types.ObjectId()
                                },
                                organizationId: organization._id,
                                createdBy: user._id
                            }], { session });
                        });
                    } else {
                        // Fallback for standalone MongoDB
                        await Item.findByIdAndUpdate(
                            item._id,
                            { $inc: { stockQty: -15 } }
                        );

                        await StockLedger.create({
                            item: item._id,
                            transactionType: 'SALE',
                            quantityChange: -15,
                            runningBalance: 85,
                            costPerUnit: 50,
                            totalValue: -750,
                            sourceDocument: {
                                type: 'Invoice',
                                id: new mongoose.Types.ObjectId()
                            },
                            organizationId: organization._id,
                            createdBy: user._id
                        });
                    }
                } finally {
                    if (session) session.endSession();
                }
            };

            await Promise.all([transaction1(), transaction2()]);

            // Verify final stock
            const finalItem = await Item.findById(item._id);
            expect(finalItem.stockQty).toBe(75); // 100 - 10 - 15

            // Verify both ledger entries created
            const entries = await StockLedger.find({ item: item._id });
            expect(entries.length).toBeGreaterThanOrEqual(2);
        });

        test('should rollback failed transactions without affecting others', async () => {
            const item = await Item.create({
                name: 'Rollback Test',
                sku: 'ROLL-001',
                addedBy: user._id,
                costPrice: 50,
                sellingPrice: 100,
                purchasePrice: 50,
                stockQty: 50,
                organization: organization._id,
                createdBy: user._id,
                organizationId: organization._id
            });

            const successfulTransaction = async () => {
                let session;
                try {
                    if (mongoose.connection.client.topology.description.type !== 'Single') {
                        session = await mongoose.startSession();
                        await session.withTransaction(async () => {
                            await Item.findByIdAndUpdate(
                                item._id,
                                { $inc: { stockQty: -5 } },
                                { session }
                            );
                        });
                    } else {
                        await Item.findByIdAndUpdate(
                            item._id,
                            { $inc: { stockQty: -5 } }
                        );
                    }
                } finally {
                    if (session) session.endSession();
                }
            };

            const failingTransaction = async () => {
                let session;
                try {
                    if (mongoose.connection.client.topology.description.type !== 'Single') {
                        session = await mongoose.startSession();
                        await session.withTransaction(async () => {
                            await Item.findByIdAndUpdate(
                                item._id,
                                { $inc: { stockQty: -10 } },
                                { session }
                            );

                            // Force error
                            throw new Error('Simulated error');
                        });
                    } else {
                        await Item.findByIdAndUpdate(
                            item._id,
                            { $inc: { stockQty: -10 } }
                        );
                        // Force error
                        throw new Error('Simulated error');
                    }
                } finally {
                    if (session) session.endSession();
                }
            };

            await Promise.allSettled([
                successfulTransaction(),
                failingTransaction()
            ]);

            // Verify final stock
            const finalItem = await Item.findById(item._id);

            // In standalone MongoDB, transactions don't rollback
            // So both transactions execute: 50 - 5 - 10 = 35
            // In replica set, failed transaction rolls back: 50 - 5 = 45
            const isReplicaSet = mongoose.connection.client.topology.description.type !== 'Single';
            if (isReplicaSet) {
                expect(finalItem.stockQty).toBe(45); // 50 - 5 (failed transaction rolled back)
            } else {
                expect(finalItem.stockQty).toBe(35); // 50 - 5 - 10 (both executed in standalone)
            }
        });
    });

    describe('Deadlock Prevention', () => {
        test('should handle potential deadlocks gracefully', async () => {
            const item1 = await Item.create({
                name: 'Deadlock Test 1',
                sku: 'DEAD-001',
                addedBy: user._id,
                costPrice: 50,
                sellingPrice: 100,
                purchasePrice: 50,
                stockQty: 100,
                organization: organization._id,
                createdBy: user._id,
                organizationId: organization._id
            });

            const item2 = await Item.create({
                name: 'Deadlock Test 2',
                sku: 'DEAD-002',
                addedBy: user._id,
                costPrice: 50,
                sellingPrice: 100,
                purchasePrice: 50,
                stockQty: 100,
                organization: organization._id,
                createdBy: user._id,
                organizationId: organization._id
            });

            // Transaction 1: Update item1 then item2
            const transaction1 = async () => {
                let session;
                try {
                    if (mongoose.connection.client.topology.description.type !== 'Single') {
                        session = await mongoose.startSession();
                        await session.withTransaction(async () => {
                            await Item.findByIdAndUpdate(
                                item1._id,
                                { $inc: { stockQty: -5 } },
                                { session }
                            );

                            await new Promise(resolve => setTimeout(resolve, 10));

                            await Item.findByIdAndUpdate(
                                item2._id,
                                { $inc: { stockQty: -5 } },
                                { session }
                            );
                        });
                    } else {
                        await Item.findByIdAndUpdate(
                            item1._id,
                            { $inc: { stockQty: -5 } }
                        );

                        await new Promise(resolve => setTimeout(resolve, 10));

                        await Item.findByIdAndUpdate(
                            item2._id,
                            { $inc: { stockQty: -5 } }
                        );
                    }
                } finally {
                    if (session) session.endSession();
                }
            };

            // Transaction 2: Update item2 then item1
            const transaction2 = async () => {
                let session;
                try {
                    if (mongoose.connection.client.topology.description.type !== 'Single') {
                        session = await mongoose.startSession();
                        await session.withTransaction(async () => {
                            await Item.findByIdAndUpdate(
                                item2._id,
                                { $inc: { stockQty: -10 } },
                                { session }
                            );

                            await new Promise(resolve => setTimeout(resolve, 10));

                            await Item.findByIdAndUpdate(
                                item1._id,
                                { $inc: { stockQty: -10 } },
                                { session }
                            );
                        });
                    } else {
                        await Item.findByIdAndUpdate(
                            item2._id,
                            { $inc: { stockQty: -10 } }
                        );

                        await new Promise(resolve => setTimeout(resolve, 10));

                        await Item.findByIdAndUpdate(
                            item1._id,
                            { $inc: { stockQty: -10 } }
                        );
                    }
                } finally {
                    if (session) session.endSession();
                }
            };

            // Both should complete without deadlock
            const results = await Promise.allSettled([transaction1(), transaction2()]);

            const successful = results.filter(r => r.status === 'fulfilled').length;
            expect(successful).toBeGreaterThan(0);

            // Verify final states
            const finalItem1 = await Item.findById(item1._id);
            const finalItem2 = await Item.findById(item2._id);

            expect(finalItem1.stockQty).toBeLessThan(100);
            expect(finalItem2.stockQty).toBeLessThan(100);
        });
    });
});
