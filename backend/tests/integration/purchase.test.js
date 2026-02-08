import request from 'supertest';
import app from '../../app.js';
import Purchase from '../../models/Purchase.js';
import Item from '../../models/Item.js';
import StockMovement from '../../models/StockMovement.js';
import { createTestUser, createTestItem, createTestSupplier } from '../setup/fixtures.js';
import FinancialPeriod from '../../models/FinancialPeriod.js';

describe.skip('Purchase API Integration Tests', () => {
    let testUser, authToken, testItem, testSupplier;

    beforeEach(async () => {
        testUser = await createTestUser();

        // Create financial period for current date
        await FinancialPeriod.create({
            name: 'FY 2026',
            fiscalYear: 2026,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            status: 'open',
            organization: testUser.organizationId,
            createdBy: testUser._id
        });
        testItem = await createTestItem(testUser._id, { stockQty: 100 });
        testSupplier = await createTestSupplier(testUser._id);

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'Password123!'
            });

        authToken = loginResponse.body.token;
    });

    describe('POST /api/purchases', () => {
        test('should create purchase and update stock', async () => {
            const purchaseData = {
                supplierInvoiceNo: 'SUP-INV-001',
                supplierInvoiceDate: new Date(),
                supplierId: testSupplier._id,
                purchaseType: 'cash',
                items: [{
                    item: testItem._id,
                    itemName: testItem.name,
                    quantity: 50,
                    purchaseRate: 90,
                    taxRate: 18,
                    discount: 0,
                    hsnCode: testItem.hsnCode
                }],
                paymentMethod: 'cash'
            };

            const response = await request(app)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${authToken}`)
                .send(purchaseData);

            if (response.status !== 201) {
                console.log('ERROR:', response.status, response.body);
            }
            expect(response.status).toBe(201);

            expect(response.body.success).toBe(true);
            expect(response.body.purchase).toHaveProperty('purchaseNo');
            expect(response.body.purchase.status).toBe('finalized');

            // Verify stock increased
            const updatedItem = await Item.findById(testItem._id);
            expect(updatedItem.stockQty).toBe(150); // 100 + 50

            // Verify stock movement created
            const movement = await StockMovement.findOne({
                item: testItem._id,
                type: 'PURCHASE'
            });
            expect(movement).toBeTruthy();
            expect(movement.quantity).toBe(50);
            expect(movement.previousStock).toBe(100);
            expect(movement.newStock).toBe(150);

            // Verify purchase calculations
            expect(response.body.purchase.subtotal).toBe(4500); // 50 * 90
            expect(response.body.purchase.totalCGST).toBe(405); // 9% of 4500
            expect(response.body.purchase.totalSGST).toBe(405); // 9% of 4500
            expect(response.body.purchase.totalAmount).toBe(5310); // 4500 + 810
        });

        test('should handle multiple items in purchase', async () => {
            const item2 = await createTestItem(testUser._id, {
                name: 'Item 2',
                sku: 'ITEM-002',
                stockQty: 50
            });

            const purchaseData = {
                supplierInvoiceNo: 'SUP-INV-002',
                supplierInvoiceDate: new Date(),
                supplierId: testSupplier._id,
                purchaseType: 'cash',
                items: [
                    {
                        item: testItem._id,
                        itemName: testItem.name,
                        quantity: 20,
                        purchaseRate: 100,
                        taxRate: 18,
                        discount: 0
                    },
                    {
                        item: item2._id,
                        itemName: item2.name,
                        quantity: 30,
                        purchaseRate: 200,
                        taxRate: 12,
                        discount: 0
                    }
                ],
                paymentMethod: 'cash'
            };

            const response = await request(app)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${authToken}`)
                .send(purchaseData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.purchase.items).toHaveLength(2);

            // Verify both items' stock increased
            const updatedItem1 = await Item.findById(testItem._id);
            const updatedItem2 = await Item.findById(item2._id);
            expect(updatedItem1.stockQty).toBe(120); // 100 + 20
            expect(updatedItem2.stockQty).toBe(80); // 50 + 30
        });

        test('should apply bill discount correctly', async () => {
            const purchaseData = {
                supplierInvoiceNo: 'SUP-INV-003',
                supplierInvoiceDate: new Date(),
                supplierId: testSupplier._id,
                purchaseType: 'cash',
                items: [{
                    item: testItem._id,
                    itemName: testItem.name,
                    quantity: 10,
                    purchaseRate: 100,
                    taxRate: 18,
                    discount: 0
                }],
                billDiscount: 100,
                paymentMethod: 'cash'
            };

            const response = await request(app)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${authToken}`)
                .send(purchaseData)
                .expect(201);

            expect(response.body.purchase.billDiscount).toBe(100);
            expect(response.body.purchase.totalAmount).toBe(1080); // (1000 + 180 tax) - 100
        });

        test('should handle credit purchase', async () => {
            const purchaseData = {
                supplierInvoiceNo: 'SUP-INV-004',
                supplierInvoiceDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                supplierId: testSupplier._id,
                purchaseType: 'credit',
                items: [{
                    item: testItem._id,
                    itemName: testItem.name,
                    quantity: 10,
                    purchaseRate: 100,
                    taxRate: 18,
                    discount: 0
                }],
                paymentMethod: 'credit'
            };

            const response = await request(app)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${authToken}`)
                .send(purchaseData)
                .expect(201);

            expect(response.body.purchase.purchaseType).toBe('credit');
            expect(response.body.purchase.paymentStatus).toBe('unpaid');
            expect(response.body.purchase.outstandingAmount).toBe(response.body.purchase.totalAmount);
        });

        test('should fail with invalid item', async () => {
            const purchaseData = {
                supplierInvoiceNo: 'SUP-INV-005',
                supplierInvoiceDate: new Date(),
                supplierId: testSupplier._id,
                purchaseType: 'cash',
                items: [{
                    item: '507f1f77bcf86cd799439011', // Non-existent item
                    itemName: 'Invalid Item',
                    quantity: 10,
                    purchaseRate: 100,
                    taxRate: 18,
                    discount: 0
                }],
                paymentMethod: 'cash'
            };

            const response = await request(app)
                .post('/api/purchases')
                .set('Authorization', `Bearer ${authToken}`)
                .send(purchaseData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/purchases', () => {
        beforeEach(async () => {
            // Create test purchases
            await Purchase.create({
                purchaseNo: 'PUR-001',
                purchaseDate: new Date(),
                supplierInvoiceNo: 'SUP-001',
                supplierInvoiceDate: new Date(),
                supplier: testSupplier._id,
                purchaseType: 'cash',
                items: [{
                    item: testItem._id,
                    itemName: testItem.name,
                    quantity: 10,
                    purchaseRate: 100,
                    taxRate: 18,
                    discount: 0,
                    taxableValue: 1000,
                    cgst: 90,
                    sgst: 90,
                    total: 1180
                }],
                subtotal: 1000,
                totalCGST: 90,
                totalSGST: 90,
                totalAmount: 1180,
                status: 'finalized',
                createdBy: testUser._id
            });
        });

        test('should get all purchases for authenticated user', async () => {
            const response = await request(app)
                .get('/api/purchases')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.purchases).toHaveLength(1);
            expect(response.body.purchases[0].purchaseNo).toBe('PUR-001');
        });

        test('should filter purchases by supplier', async () => {
            const response = await request(app)
                .get(`/api/purchases?supplier=${testSupplier._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.purchases).toHaveLength(1);
            expect(response.body.purchases[0].supplier._id.toString()).toBe(testSupplier._id.toString());
        });

        test('should not return other users\' purchases', async () => {
            const otherUser = await createTestUser({ email: 'other@example.com' });
            const otherSupplier = await createTestSupplier(otherUser._id);

            await Purchase.create({
                purchaseNo: 'PUR-002',
                purchaseDate: new Date(),
                supplierInvoiceNo: 'SUP-002',
                supplierInvoiceDate: new Date(),
                supplier: otherSupplier._id,
                purchaseType: 'cash',
                items: [],
                subtotal: 1000,
                totalAmount: 1000,
                status: 'finalized',
                createdBy: otherUser._id
            });

            const response = await request(app)
                .get('/api/purchases')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.purchases).toHaveLength(1);
            expect(response.body.purchases[0].purchaseNo).toBe('PUR-001');
        });
    });

    describe('PUT /api/purchases/:id/cancel', () => {
        let testPurchase;

        beforeEach(async () => {
            testPurchase = await Purchase.create({
                purchaseNo: 'PUR-CANCEL-001',
                purchaseDate: new Date(),
                supplierInvoiceNo: 'SUP-CANCEL-001',
                supplierInvoiceDate: new Date(),
                supplier: testSupplier._id,
                purchaseType: 'cash',
                items: [{
                    item: testItem._id,
                    itemName: testItem.name,
                    quantity: 20,
                    purchaseRate: 100,
                    taxRate: 18,
                    discount: 0,
                    taxableValue: 2000,
                    cgst: 180,
                    sgst: 180,
                    total: 2360
                }],
                subtotal: 2000,
                totalCGST: 180,
                totalSGST: 180,
                totalAmount: 2360,
                status: 'finalized',
                createdBy: testUser._id
            });

            // Increase stock as if purchase was processed
            await Item.findByIdAndUpdate(testItem._id, { $inc: { stockQty: 20 } });
        });

        test('should cancel purchase and revert stock', async () => {
            const initialStock = (await Item.findById(testItem._id)).stockQty;

            const response = await request(app)
                .put(`/api/purchases/${testPurchase._id}/cancel`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ cancelReason: 'Supplier cancelled order' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.purchase.status).toBe('cancelled');
            expect(response.body.purchase.cancelReason).toBe('Supplier cancelled order');

            // Verify stock reverted
            const updatedItem = await Item.findById(testItem._id);
            expect(updatedItem.stockQty).toBe(initialStock - 20);

            // Verify stock movement created
            const movement = await StockMovement.findOne({
                item: testItem._id,
                type: 'PURCHASE_CANCEL'
            });
            expect(movement).toBeTruthy();
            expect(movement.quantity).toBe(-20);
        });
    });
});






