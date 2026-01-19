import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const ReturnedItems = () => {
    const navigate = useNavigate();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refundMethodFilter, setRefundMethodFilter] = useState('all');
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Get token from user object in localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchReturns();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, refundMethodFilter]);

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const response = await api.get(`${API_URL}/api/returns`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReturns(response.data);
        } catch (error) {
            console.error('Error fetching returns:', error);
            alert('Failed to fetch returns');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (returnId) => {
        if (!confirm('Are you sure you want to delete this return? This will reverse all inventory and customer ledger changes.')) {
            return;
        }

        try {
            await api.delete(`${API_URL}/api/returns/${returnId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Return deleted successfully');
            fetchReturns();
        } catch (error) {
            console.error('Error deleting return:', error);
            alert(error.response?.data?.message || 'Failed to delete return');
        }
    };

    const toggleRowExpansion = (returnId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(returnId)) {
            newExpanded.delete(returnId);
        } else {
            newExpanded.add(returnId);
        }
        setExpandedRows(newExpanded);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'processed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'refunded':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredReturns = returns.filter(ret => {
        const matchesSearch =
            ret.returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ret.invoice?.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.customerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
        const matchesRefundMethod = refundMethodFilter === 'all' || ret.refundMethod === refundMethodFilter;

        return matchesSearch && matchesStatus && matchesRefundMethod;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedReturns = filteredReturns.slice(startIndex, endIndex);

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title="Returned Items"
                description="View and manage all customer returns"
                actions={[
                    <button
                        key="new"
                        onClick={() => navigate('/sales/return')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        + New Return
                    </button>
                ]}
            />

            {/* Summary Stats - Moved to Top */}
            {filteredReturns.length > 0 && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-lg shadow-sm p-4">
                        <p className="text-sm text-secondary">Total Returns</p>
                        <p className="text-2xl font-bold text-main">{filteredReturns.length}</p>
                    </div>
                    <div className="bg-card rounded-lg shadow-sm p-4">
                        <p className="text-sm text-secondary">Total Amount</p>
                        <p className="text-2xl font-bold text-red-600">
                            ₹{filteredReturns.reduce((sum, ret) => sum + ret.totalReturnAmount, 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-card rounded-lg shadow-sm p-4">
                        <p className="text-sm text-secondary">Full Returns</p>
                        <p className="text-2xl font-bold text-purple-600">
                            {filteredReturns.filter(ret => ret.returnType === 'full').length}
                        </p>
                    </div>
                    <div className="bg-card rounded-lg shadow-sm p-4">
                        <p className="text-sm text-secondary">Partial Returns</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {filteredReturns.filter(ret => ret.returnType === 'partial').length}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Search by Return ID, Invoice, or Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all" className="bg-input text-main">All Statuses</option>
                            <option value="processed" className="bg-input text-main">Processed</option>
                            <option value="pending" className="bg-input text-main">Pending</option>
                            <option value="refunded" className="bg-input text-main">Refunded</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">Refund Method</label>
                        <select
                            value={refundMethodFilter}
                            onChange={(e) => setRefundMethodFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-default rounded-lg bg-input text-main focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all" className="bg-input text-main">All Methods</option>
                            <option value="credit" className="bg-input text-main">Credit</option>
                            <option value="cash" className="bg-input text-main">Cash</option>
                            <option value="bank" className="bg-input text-main">Bank</option>
                            <option value="original_payment" className="bg-input text-main">Original Payment</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Returns Table */}
            <div className="bg-card rounded-xl shadow-sm overflow-hidden">
                {filteredReturns.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-main">No returns found</h3>
                        <p className="mt-1 text-sm text-muted">Get started by creating a new return.</p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/sales/return')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                + New Return
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Return ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Invoice</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Refund Method</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-gray-200">
                                    {paginatedReturns.map((returnItem) => (
                                        <>
                                            <tr key={returnItem._id} className="hover:bg-surface">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => toggleRowExpansion(returnItem._id)}
                                                        className="flex items-center text-indigo-600 hover:text-indigo-900 font-medium"
                                                    >
                                                        <svg
                                                            className={`w-4 h-4 mr-2 transition-transform ${expandedRows.has(returnItem._id) ? 'rotate-90' : ''}`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                        {returnItem.returnId}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-main">
                                                    {new Date(returnItem.returnDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => navigate(`/pos/invoice/${returnItem.invoice._id}`)}
                                                        className="text-sm text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {returnItem.invoice?.invoiceNo || 'N/A'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-main">
                                                    {returnItem.customerName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${returnItem.returnType === 'full' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {returnItem.returnType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-main">
                                                    {returnItem.items.length}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-main">
                                                    ₹{returnItem.totalReturnAmount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-main capitalize">
                                                    {returnItem.refundMethod.replace('_', ' ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(returnItem.status)}`}>
                                                        {returnItem.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDelete(returnItem._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRows.has(returnItem._id) && (
                                                <tr>
                                                    <td colSpan="10" className="px-6 py-4 bg-surface">
                                                        <div className="space-y-4">
                                                            <h4 className="font-medium text-main">Return Items Details</h4>
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-surface">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Product</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Original Qty</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Returned Qty</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Rate</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Condition</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Reason</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Inventory Adjusted</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-muted uppercase">Line Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-card divide-y divide-gray-200">
                                                                        {returnItem.items.map((item, idx) => (
                                                                            <tr key={idx}>
                                                                                <td className="px-4 py-2 text-sm text-main">{item.productName}</td>
                                                                                <td className="px-4 py-2 text-sm text-main">{item.originalQty}</td>
                                                                                <td className="px-4 py-2 text-sm text-main">{item.returnedQty}</td>
                                                                                <td className="px-4 py-2 text-sm text-main">₹{item.rate.toFixed(2)}</td>
                                                                                <td className="px-4 py-2 text-sm">
                                                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.condition === 'damaged' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                                        }`}>
                                                                                        {item.condition.replace('_', ' ')}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-2 text-sm text-main">{item.reason}</td>
                                                                                <td className="px-4 py-2 text-sm">
                                                                                    {item.inventoryAdjusted ? (
                                                                                        <span className="text-green-600">✓ Yes</span>
                                                                                    ) : (
                                                                                        <span className="text-muted">✗ No</span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-sm font-medium text-main">₹{item.lineTotal.toFixed(2)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            {returnItem.notes && (
                                                                <div className="mt-4">
                                                                    <h5 className="text-sm font-medium text-secondary">Notes:</h5>
                                                                    <p className="text-sm text-secondary mt-1">{returnItem.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-secondary">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredReturns.length)} of {filteredReturns.length} results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`px-3 py-1 border rounded-md text-sm ${currentPage === page
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'hover:bg-surface'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                                            return <span key={page} className="px-2">...</span>;
                                        }
                                        return null;
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ReturnedItems;
