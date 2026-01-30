import PurchaseReturn from '../models/PurchaseReturn.js';
import Purchase from '../models/Purchase.js';
import Supplier from '../models/Supplier.js';
import mongoose from 'mongoose';

// Get purchase return analytics
export const getReturnAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {
            createdBy: req.user._id,
            status: { $nin: ['draft', 'cancelled'] },
        };

        if (startDate && endDate) {
            matchStage.returnDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        // Total returns and value
        const totalStats = await PurchaseReturn.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalReturns: { $sum: 1 },
                    totalValue: { $sum: '$totalAmount' },
                },
            },
        ]);

        const stats = totalStats[0] || { totalReturns: 0, totalValue: 0 };
        stats.avgReturnValue = stats.totalReturns > 0 ? stats.totalValue / stats.totalReturns : 0;

        // Top suppliers by return value
        const topSuppliers = await PurchaseReturn.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$supplier',
                    returnCount: { $sum: 1 },
                    totalValue: { $sum: '$totalAmount' },
                },
            },
            { $sort: { totalValue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'suppliers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'supplierData',
                },
            },
            { $unwind: '$supplierData' },
            {
                $project: {
                    supplierName: '$supplierData.businessName',
                    returnCount: 1,
                    totalValue: 1,
                    returnRate: { $multiply: [{ $divide: ['$returnCount', stats.totalReturns] }, 100] },
                },
            },
        ]);

        // Top return reasons
        const topReasons = await PurchaseReturn.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$returnReason',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $project: {
                    reason: '$_id',
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        // Disposition breakdown
        const dispositionBreakdown = await PurchaseReturn.aggregate([
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.disposition',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    disposition: '$_id',
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        // Condition breakdown
        const conditionBreakdown = await PurchaseReturn.aggregate([
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.condition',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    condition: '$_id',
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        // Financial impact by refund mode
        const financialImpact = await PurchaseReturn.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$refundMode',
                    totalAmount: { $sum: '$totalAmount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const totalItems = dispositionBreakdown.reduce((sum, item) => sum + item.count, 0);

        // Calculate return rate (returns vs purchases)
        const totalPurchases = await Purchase.countDocuments({
            createdBy: req.user._id,
            ...(startDate && endDate && {
                purchaseDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            }),
        });

        const returnRate = totalPurchases > 0 ? (stats.totalReturns / totalPurchases) * 100 : 0;

        res.status(200).json({
            ...stats,
            returnRate,
            topSuppliers,
            topReasons,
            dispositionBreakdown,
            conditionBreakdown,
            totalItems,
            totalRefunded: financialImpact.find(f => f._id === 'cash')?.totalAmount || 0,
            payableAdjusted: financialImpact.find(f => f._id === 'adjust_payable')?.totalAmount || 0,
            creditNotesIssued: financialImpact.find(f => f._id === 'credit_note')?.totalAmount || 0,
        });
    } catch (err) {
        console.error('Get analytics error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Get supplier-wise return report
export const getSupplierReturnReport = async (req, res) => {
    try {
        const { startDate, endDate, supplierId } = req.query;

        const matchStage = {
            createdBy: req.user._id,
            status: { $nin: ['draft', 'cancelled'] },
        };

        if (supplierId) {
            matchStage.supplier = new mongoose.Types.ObjectId(supplierId);
        }

        if (startDate && endDate) {
            matchStage.returnDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const report = await PurchaseReturn.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$supplier',
                    totalReturns: { $sum: 1 },
                    totalValue: { $sum: '$totalAmount' },
                    avgReturnValue: { $avg: '$totalAmount' },
                },
            },
            {
                $lookup: {
                    from: 'suppliers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'supplierData',
                },
            },
            { $unwind: '$supplierData' },
            {
                $project: {
                    supplierName: '$supplierData.businessName',
                    contactPerson: '$supplierData.contactPersonName',
                    totalReturns: 1,
                    totalValue: 1,
                    avgReturnValue: 1,
                },
            },
            { $sort: { totalValue: -1 } },
        ]);

        res.status(200).json(report);
    } catch (err) {
        console.error('Get supplier report error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// Get item-wise return report
export const getItemReturnReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {
            createdBy: req.user._id,
            status: { $nin: ['draft', 'cancelled'] },
        };

        if (startDate && endDate) {
            matchStage.returnDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const report = await PurchaseReturn.aggregate([
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.item',
                    itemName: { $first: '$items.itemName' },
                    totalQuantity: { $sum: '$items.returnQty' },
                    totalValue: { $sum: '$items.total' },
                    returnCount: { $sum: 1 },
                    conditions: { $push: '$items.condition' },
                    dispositions: { $push: '$items.disposition' },
                },
            },
            { $sort: { totalValue: -1 } },
            { $limit: 50 },
        ]);

        res.status(200).json(report);
    } catch (err) {
        console.error('Get item report error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};
