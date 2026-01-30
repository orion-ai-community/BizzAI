import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';

const PurchaseReturnAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/purchase-returns/analytics', {
                params: dateRange,
            });
            setAnalytics(response.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            toast.error('Failed to fetch analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading analytics...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title="Purchase Return Analytics"
                subtitle="Analyze return trends and patterns"
            />

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchAnalytics}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>

            {analytics && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-600 mb-1">Total Returns</p>
                            <p className="text-3xl font-bold text-gray-900">{analytics.totalReturns || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-600 mb-1">Total Value</p>
                            <p className="text-3xl font-bold text-blue-600">
                                ₹{(analytics.totalValue || 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-600 mb-1">Avg Return Value</p>
                            <p className="text-3xl font-bold text-green-600">
                                ₹{(analytics.avgReturnValue || 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm text-gray-600 mb-1">Return Rate</p>
                            <p className="text-3xl font-bold text-orange-600">
                                {(analytics.returnRate || 0).toFixed(2)}%
                            </p>
                        </div>
                    </div>

                    {/* Top Suppliers by Return Value */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers by Return Value</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Returns</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Return Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {analytics.topSuppliers?.map((supplier, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {supplier.supplierName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{supplier.returnCount}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                ₹{supplier.totalValue.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${supplier.returnRate > 10 ? 'bg-red-100 text-red-800' :
                                                        supplier.returnRate > 5 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                    }`}>
                                                    {supplier.returnRate.toFixed(2)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Return Reasons */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Return Reasons</h3>
                        <div className="space-y-3">
                            {analytics.topReasons?.map((reason, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900">{reason.reason}</span>
                                            <span className="text-sm text-gray-600">{reason.count} returns</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${(reason.count / analytics.totalReturns) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disposition Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Disposition Breakdown</h3>
                            <div className="space-y-3">
                                {analytics.dispositionBreakdown?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700 capitalize">{item.disposition.replace('_', ' ')}</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900">{item.count} items</span>
                                            <span className="text-xs text-gray-500">
                                                ({((item.count / analytics.totalItems) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Condition Breakdown</h3>
                            <div className="space-y-3">
                                {analytics.conditionBreakdown?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-700 capitalize">{item.condition}</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900">{item.count} items</span>
                                            <span className="text-xs text-gray-500">
                                                ({((item.count / analytics.totalItems) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Financial Impact */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Impact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Total Refunded</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ₹{(analytics.totalRefunded || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Payable Adjusted</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    ₹{(analytics.payableAdjusted || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Credit Notes Issued</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{(analytics.creditNotesIssued || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default PurchaseReturnAnalytics;
