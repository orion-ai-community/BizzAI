import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import {
    getSalesReportData,
    getSalesReportSummary,
    getSalesReportCharts,
    updateSalesFilters,
    resetSalesFilters,
} from '../../redux/slices/reportsSlice';
import SalesReportSummaryCards from './components/SalesReportSummaryCards';
import SalesReportFilters from './components/SalesReportFilters';
import SalesReportTable from './components/SalesReportTable';
import SalesReportCharts from './components/SalesReportCharts';

const SalesReport = () => {
    const dispatch = useDispatch();
    const { salesData, salesSummary, salesCharts, salesFilters, salesPagination, isLoading } = useSelector(
        (state) => state.reports
    );

    const [showFilters, setShowFilters] = useState(false);
    const [showCharts, setShowCharts] = useState(true);

    // Fetch data on mount and when filters change
    useEffect(() => {
        dispatch(getSalesReportSummary(salesFilters));
        dispatch(getSalesReportData({ filters: salesFilters, page: salesPagination.currentPage, limit: 50 }));
        dispatch(getSalesReportCharts(salesFilters));
    }, [dispatch, salesFilters, salesPagination.currentPage]);

    const handleFilterChange = (newFilters) => {
        dispatch(updateSalesFilters(newFilters));
    };

    const handleResetFilters = () => {
        dispatch(resetSalesFilters());
    };

    const handlePageChange = (page) => {
        dispatch(getSalesReportData({ filters: salesFilters, page, limit: 50 }));
    };

    const handleExport = async (format) => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                dateFilter: salesFilters.dateFilter || 'this_month',
                format,
            });

            if (salesFilters.customStartDate) params.append('startDate', salesFilters.customStartDate);
            if (salesFilters.customEndDate) params.append('endDate', salesFilters.customEndDate);
            if (salesFilters.invoiceNo) params.append('invoiceNo', salesFilters.invoiceNo);
            if (salesFilters.paymentStatus?.length > 0) params.append('paymentStatus', salesFilters.paymentStatus.join(','));
            if (salesFilters.paymentMethod?.length > 0) params.append('paymentMethod', salesFilters.paymentMethod.join(','));
            if (salesFilters.customerId) params.append('customerId', salesFilters.customerId);

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/reports/sales/export?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export report. Please try again.');
        }
    };

    return (
        <Layout>
            <PageHeader
                title="Sales Report"
                description="Comprehensive sales analytics with advanced filtering and insights"
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <span>🔍</span>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button
                    onClick={() => setShowCharts(!showCharts)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                    <span>📊</span>
                    {showCharts ? 'Hide Charts' : 'Show Charts'}
                </button>
                <button
                    onClick={() => handleExport('pdf')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                    <span>📄</span>
                    Export PDF
                </button>
                <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                    <span>📊</span>
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            {showFilters && (
                <SalesReportFilters
                    filters={salesFilters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                />
            )}

            {/* Summary Cards */}
            <SalesReportSummaryCards summary={salesSummary} isLoading={isLoading} />

            {/* Charts */}
            {showCharts && <SalesReportCharts charts={salesCharts} isLoading={isLoading} />}

            {/* Data Table */}
            <SalesReportTable
                data={salesData}
                pagination={salesPagination}
                isLoading={isLoading}
                onPageChange={handlePageChange}
            />
        </Layout>
    );
};

export default SalesReport;
