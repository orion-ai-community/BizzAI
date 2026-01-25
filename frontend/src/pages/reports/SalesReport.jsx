import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
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

// Helper function to get auth config (same pattern as other slices)
const getConfig = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

const SalesReport = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get auth token from Redux
    const { user } = useSelector((state) => state.auth);
    const { salesData, salesSummary, salesCharts, salesFilters, salesPagination, isLoading } = useSelector(
        (state) => state.reports
    );

    const [showFilters, setShowFilters] = useState(false);
    const [showCharts, setShowCharts] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    // Initialize filters from URL on mount
    useEffect(() => {
        const urlFilters = {};
        const dateFilter = searchParams.get('dateFilter');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const invoiceNo = searchParams.get('invoiceNo');
        const paymentStatus = searchParams.get('paymentStatus');
        const paymentMethod = searchParams.get('paymentMethod');
        const itemCategory = searchParams.get('itemCategory');
        const itemSku = searchParams.get('itemSku');

        if (dateFilter) urlFilters.dateFilter = dateFilter;
        if (startDate) urlFilters.customStartDate = startDate;
        if (endDate) urlFilters.customEndDate = endDate;
        if (invoiceNo) urlFilters.invoiceNo = invoiceNo;
        if (paymentStatus) urlFilters.paymentStatus = paymentStatus.split(',');
        if (paymentMethod) urlFilters.paymentMethod = paymentMethod.split(',');
        if (itemCategory) urlFilters.itemCategory = itemCategory;
        if (itemSku) urlFilters.itemSku = itemSku;

        if (Object.keys(urlFilters).length > 0) {
            dispatch(updateSalesFilters(urlFilters));
        }
    }, []); // Only run on mount

    // Fetch data on mount and when filters change
    useEffect(() => {
        dispatch(getSalesReportSummary(salesFilters));
        dispatch(getSalesReportData({ filters: salesFilters, page: salesPagination.currentPage, limit: 50 }));
        dispatch(getSalesReportCharts(salesFilters));

        // Update URL with current filters
        const params = new URLSearchParams();
        if (salesFilters.dateFilter) params.set('dateFilter', salesFilters.dateFilter);
        if (salesFilters.customStartDate) params.set('startDate', salesFilters.customStartDate);
        if (salesFilters.customEndDate) params.set('endDate', salesFilters.customEndDate);
        if (salesFilters.invoiceNo) params.set('invoiceNo', salesFilters.invoiceNo);
        if (salesFilters.paymentStatus?.length > 0) params.set('paymentStatus', salesFilters.paymentStatus.join(','));
        if (salesFilters.paymentMethod?.length > 0) params.set('paymentMethod', salesFilters.paymentMethod.join(','));
        if (salesFilters.itemCategory) params.set('itemCategory', salesFilters.itemCategory);
        if (salesFilters.itemSku) params.set('itemSku', salesFilters.itemSku);

        setSearchParams(params, { replace: true });
    }, [dispatch, salesFilters, salesPagination.currentPage, setSearchParams]);

    const handleFilterChange = (newFilters) => {
        dispatch(updateSalesFilters(newFilters));
    };

    const handleResetFilters = () => {
        dispatch(resetSalesFilters());
        setSearchParams({}, { replace: true });
    };

    const handlePageChange = (page) => {
        dispatch(getSalesReportData({ filters: salesFilters, page, limit: 50 }));
    };

    const handleBackToReports = () => {
        navigate('/reports');
    };

    const handleExport = async (format) => {
        if (exportLoading) return;

        setExportLoading(true);
        const toastId = toast.loading(`Generating ${format.toUpperCase()} export...`);

        try {
            const params = {
                dateFilter: salesFilters.dateFilter || 'this_month',
                format,
            };

            if (salesFilters.customStartDate) params.startDate = salesFilters.customStartDate;
            if (salesFilters.customEndDate) params.endDate = salesFilters.customEndDate;
            if (salesFilters.invoiceNo) params.invoiceNo = salesFilters.invoiceNo;
            if (salesFilters.paymentStatus?.length > 0) params.paymentStatus = salesFilters.paymentStatus.join(',');
            if (salesFilters.paymentMethod?.length > 0) params.paymentMethod = salesFilters.paymentMethod.join(',');
            if (salesFilters.customerId) params.customerId = salesFilters.customerId;
            if (salesFilters.itemCategory) params.itemCategory = salesFilters.itemCategory;
            if (salesFilters.itemSku) params.itemSku = salesFilters.itemSku;

            const token = user?.token;

            if (!token) {
                throw new Error('Session expired. Please log in again.');
            }

            // Use axios api instance with explicit auth header (same pattern as other API calls)
            const response = await api.get('/api/reports/sales/export', {
                params,
                responseType: 'blob',
                ...getConfig(token), // Add Authorization header
            });

            const blob = response.data;

            if (blob.size === 0) {
                throw new Error('Export file is empty. Please try again.');
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            toast.update(toastId, {
                render: `${format.toUpperCase()} exported successfully!`,
                type: 'success',
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Export error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to export report. Please try again.';
            toast.update(toastId, {
                render: errorMessage,
                type: 'error',
                isLoading: false,
                autoClose: 5000,
            });
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <Layout>
            {/* Page Header with Back Button */}
            <div className="flex items-center justify-between mb-6">
                <PageHeader
                    title="Sales Report"
                    description="Comprehensive sales analytics with advanced filtering and insights"
                />
                <button
                    onClick={handleBackToReports}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-main rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition border border-border"
                    title="Back to Reports"
                >
                    <span>←</span>
                    <span className="hidden sm:inline">Back</span>
                </button>
            </div>

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
                    disabled={exportLoading || isLoading}
                    className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${exportLoading || isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                >
                    <span>📄</span>
                    {exportLoading ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                    onClick={() => handleExport('csv')}
                    disabled={exportLoading || isLoading}
                    className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${exportLoading || isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    <span>📊</span>
                    {exportLoading ? 'Exporting...' : 'Export CSV'}
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
