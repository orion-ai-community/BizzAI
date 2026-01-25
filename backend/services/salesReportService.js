import Invoice from '../models/Invoice.js';
import Return from '../models/Return.js';
import SalesOrder from '../models/SalesOrder.js';
import Item from '../models/Item.js';
import Customer from '../models/Customer.js';
import { info, error as logError } from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Sales Report Service
 * 
 * Comprehensive service layer for generating enterprise-grade sales reports
 * with advanced filtering, aggregation, and analytics.
 */

class SalesReportService {
    /**
     * Build date range filter based on preset or custom range
     */
    buildDateFilter(dateFilter, customStartDate, customEndDate) {
        const now = new Date();
        let startDate, endDate;

        switch (dateFilter) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;

            case 'yesterday':
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = new Date(yesterday.setHours(0, 0, 0, 0));
                endDate = new Date(yesterday.setHours(23, 59, 59, 999));
                break;

            case 'this_week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                startDate = new Date(weekStart.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;

            case 'last_week':
                const lastWeekEnd = new Date(now);
                lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
                const lastWeekStart = new Date(lastWeekEnd);
                lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
                startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));
                endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
                break;

            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;

            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;

            case 'this_quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
                break;

            case 'financial_year':
                // Indian FY: April 1 to March 31
                const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
                startDate = new Date(fyYear, 3, 1); // April 1
                endDate = new Date(fyYear + 1, 2, 31, 23, 59, 59, 999); // March 31
                break;

            case 'custom':
                if (customStartDate && customEndDate) {
                    startDate = new Date(customStartDate);
                    endDate = new Date(customEndDate);
                    endDate.setHours(23, 59, 59, 999);
                } else {
                    // Default to this month if custom dates not provided
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                }
                break;

            default:
                // Default to this month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        return { startDate, endDate };
    }

    /**
     * Build MongoDB query based on filters
     */
    buildQuery(userId, filters) {
        const query = { createdBy: userId, isDeleted: { $ne: true } };

        // Date filter
        if (filters.dateFilter) {
            const { startDate, endDate } = this.buildDateFilter(
                filters.dateFilter,
                filters.customStartDate,
                filters.customEndDate
            );
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        // Invoice number search
        if (filters.invoiceNo) {
            query.invoiceNo = { $regex: filters.invoiceNo, $options: 'i' };
        }

        // Payment status filter
        if (filters.paymentStatus && filters.paymentStatus.length > 0) {
            query.paymentStatus = { $in: filters.paymentStatus };
        }

        // Payment method filter
        if (filters.paymentMethod && filters.paymentMethod.length > 0) {
            query.paymentMethod = { $in: filters.paymentMethod };
        }

        // Customer filter
        if (filters.customerId) {
            query.customer = filters.customerId;
        }

        return query;
    }

    /**
     * Get sales report data with pagination
     */
    async getSalesData(userId, filters = {}, page = 1, limit = 50) {
        try {
            const query = this.buildQuery(userId, filters);
            const skip = (page - 1) * limit;

            // Get invoices with populated data
            const invoices = await Invoice.find(query)
                .populate('customer', 'name phone email address')
                .populate('items.item', 'name category costPrice sellingPrice')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Get total count for pagination
            const totalCount = await Invoice.countDocuments(query);

            // Process invoices to calculate additional fields
            const processedInvoices = invoices.map(invoice => {
                // Calculate total items count
                const itemsCount = invoice.items.reduce((sum, item) => sum + item.quantity, 0);

                // Calculate cost and profit
                let totalCost = 0;
                invoice.items.forEach(item => {
                    if (item.item && item.item.costPrice) {
                        totalCost += item.item.costPrice * item.quantity;
                    }
                });

                const grossProfit = invoice.subtotal - totalCost;
                const netProfit = invoice.totalAmount - totalCost;
                const profitMargin = invoice.totalAmount > 0
                    ? ((netProfit / invoice.totalAmount) * 100).toFixed(2)
                    : 0;

                // Calculate GST breakdown (assuming CGST + SGST for intra-state, IGST for inter-state)
                const taxAmount = invoice.tax || 0;
                const isSameState = true; // TODO: Determine based on customer state vs shop state

                return {
                    _id: invoice._id,
                    invoiceNo: invoice.invoiceNo,
                    invoiceDate: invoice.createdAt,
                    customerName: invoice.customer?.name || 'Walk-in Customer',
                    customerPhone: invoice.customer?.phone || '',
                    itemsCount,
                    quantitySold: itemsCount,
                    grossAmount: invoice.subtotal,
                    discount: invoice.discount || 0,
                    taxableAmount: invoice.subtotal - (invoice.discount || 0),
                    cgst: isSameState ? taxAmount / 2 : 0,
                    sgst: isSameState ? taxAmount / 2 : 0,
                    igst: isSameState ? 0 : taxAmount,
                    totalTax: taxAmount,
                    netAmount: invoice.totalAmount,
                    costPrice: totalCost,
                    grossProfit,
                    netProfit,
                    profitMargin,
                    paymentStatus: invoice.paymentStatus,
                    paymentMethod: invoice.paymentMethod,
                    paidAmount: invoice.paidAmount || 0,
                    creditApplied: invoice.creditApplied || 0,
                };
            });

            return {
                data: processedInvoices,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalRecords: totalCount,
                    limit,
                },
            };
        } catch (err) {
            logError(`Sales Report Data Error: ${err.message}`);
            throw err;
        }
    }

    /**
     * Get summary KPIs for sales report
     */
    async getSalesSummary(userId, filters = {}) {
        try {
            const query = this.buildQuery(userId, filters);

            // Get all invoices matching filters
            const invoices = await Invoice.find(query)
                .populate('items.item', 'costPrice')
                .lean();

            // Calculate summary metrics
            let totalSales = 0;
            let totalInvoices = invoices.length;
            let totalQuantity = 0;
            let totalTax = 0;
            let totalDiscount = 0;
            let totalCost = 0;
            let totalPaid = 0;

            invoices.forEach(invoice => {
                totalSales += invoice.totalAmount || 0;
                totalTax += invoice.tax || 0;
                totalDiscount += invoice.discount || 0;
                totalPaid += (invoice.paidAmount || 0) + (invoice.creditApplied || 0);

                invoice.items.forEach(item => {
                    totalQuantity += item.quantity;
                    if (item.item && item.item.costPrice) {
                        totalCost += item.item.costPrice * item.quantity;
                    }
                });
            });

            const grossProfit = totalSales - totalDiscount - totalCost;
            const netProfit = totalSales - totalCost;
            const averageOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;
            const totalOutstanding = totalSales - totalPaid;

            return {
                totalSales: parseFloat(totalSales.toFixed(2)),
                totalInvoices,
                totalQuantity,
                totalTax: parseFloat(totalTax.toFixed(2)),
                totalDiscount: parseFloat(totalDiscount.toFixed(2)),
                grossProfit: parseFloat(grossProfit.toFixed(2)),
                netProfit: parseFloat(netProfit.toFixed(2)),
                averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
                totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
            };
        } catch (err) {
            logError(`Sales Summary Error: ${err.message}`);
            throw err;
        }
    }

    /**
     * Get chart data for visualizations
     */
    async getChartsData(userId, filters = {}) {
        try {
            const query = this.buildQuery(userId, filters);

            // Sales Trend (Daily)
            const salesTrend = await Invoice.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        totalSales: { $sum: '$totalAmount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Payment Method Distribution
            const paymentMethods = await Invoice.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$paymentMethod',
                        count: { $sum: 1 },
                        amount: { $sum: '$totalAmount' },
                    },
                },
            ]);

            // Top Customers
            const topCustomers = await Invoice.aggregate([
                { $match: { ...query, customer: { $ne: null } } },
                {
                    $group: {
                        _id: '$customer',
                        totalSales: { $sum: '$totalAmount' },
                        invoiceCount: { $sum: 1 },
                    },
                },
                { $sort: { totalSales: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'customers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'customerInfo',
                    },
                },
                { $unwind: '$customerInfo' },
                {
                    $project: {
                        customerName: '$customerInfo.name',
                        totalSales: 1,
                        invoiceCount: 1,
                    },
                },
            ]);

            // Category-wise Sales (requires item population)
            const invoicesWithItems = await Invoice.find(query)
                .populate('items.item', 'category')
                .lean();

            const categorySales = {};
            invoicesWithItems.forEach(invoice => {
                invoice.items.forEach(item => {
                    const category = item.item?.category || 'Uncategorized';
                    if (!categorySales[category]) {
                        categorySales[category] = 0;
                    }
                    categorySales[category] += item.total || 0;
                });
            });

            const categoryData = Object.entries(categorySales).map(([category, amount]) => ({
                category,
                amount: parseFloat(amount.toFixed(2)),
            }));

            // Top Items
            const itemSales = {};
            invoicesWithItems.forEach(invoice => {
                invoice.items.forEach(item => {
                    const itemName = item.item?.name || 'Unknown Item';
                    if (!itemSales[itemName]) {
                        itemSales[itemName] = { quantity: 0, amount: 0 };
                    }
                    itemSales[itemName].quantity += item.quantity;
                    itemSales[itemName].amount += item.total || 0;
                });
            });

            const topItems = Object.entries(itemSales)
                .map(([name, data]) => ({
                    itemName: name,
                    quantity: data.quantity,
                    amount: parseFloat(data.amount.toFixed(2)),
                }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 10);

            return {
                salesTrend,
                paymentMethods,
                topCustomers,
                categoryData,
                topItems,
            };
        } catch (err) {
            logError(`Charts Data Error: ${err.message}`);
            throw err;
        }
    }

    /**
     * Generate cache key for filters
     */
    generateCacheKey(userId, filters) {
        const filterString = JSON.stringify({ userId, ...filters });
        return `sales_report:${crypto.createHash('md5').update(filterString).digest('hex')}`;
    }
}

export default new SalesReportService();
