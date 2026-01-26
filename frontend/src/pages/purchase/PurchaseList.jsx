import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAllPurchases, reset } from '../../redux/slices/purchaseSlice';
import { getAllSuppliers } from '../../redux/slices/supplierSlice';

const PurchaseList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { purchases, isLoading } = useSelector((state) => state.purchase);
    const { suppliers } = useSelector((state) => state.suppliers);

    const [filters, setFilters] = useState({
        status: '',
        supplier: '',
        startDate: '',
        endDate: '',
    });

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(getAllPurchases(filters));
        dispatch(getAllSuppliers());
    }, [dispatch]);

    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        dispatch(getAllPurchases(newFilters));
    };

    const handleClearFilters = () => {
        const emptyFilters = { status: '', supplier: '', startDate: '', endDate: '' };
        setFilters(emptyFilters);
        dispatch(getAllPurchases(emptyFilters));
    };

    const filteredPurchases = purchases.filter((purchase) => {
        const matchesSearch =
            purchase.purchaseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.supplier?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.supplierInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            finalized: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-main mb-2">Purchase List</h1>
                        <p className="text-secondary">View and manage all purchases</p>
                    </div>
                    <button
                        onClick={() => navigate('/purchase/entry')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        + New Purchase
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary mb-1">Total Purchases</p>
                                <p className="text-2xl font-bold text-main">
                                    {filteredPurchases.filter(p => p.status !== 'cancelled').length}
                                </p>
                            </div>
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary mb-1">Total Amount</p>
                                <p className="text-2xl font-bold text-main">
                                    ₹{filteredPurchases
                                        .filter(p => p.status !== 'cancelled')
                                        .reduce((sum, p) => sum + p.totalAmount, 0)
                                        .toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary mb-1">Total Paid</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{filteredPurchases
                                        .filter(p => p.status !== 'cancelled')
                                        .reduce((sum, p) => sum + p.paidAmount, 0)
                                        .toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-secondary mb-1">Outstanding</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ₹{filteredPurchases
                                        .filter(p => p.status !== 'cancelled')
                                        .reduce((sum, p) => sum + p.outstandingAmount, 0)
                                        .toFixed(2)}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="finalized">Finalized</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Supplier</label>
                            <select
                                value={filters.supplier}
                                onChange={(e) => handleFilterChange('supplier', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier._id} value={supplier._id}>
                                        {supplier.businessName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by purchase number, supplier, or invoice number..."
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 border border-default text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Purchase Table */}
                <div className="bg-card rounded-xl shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="mt-2 text-secondary">Loading purchases...</p>
                        </div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-secondary">No purchases found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Purchase No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Invoice No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Paid
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Outstanding
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredPurchases.map((purchase) => (
                                        <tr key={purchase._id} className="hover:bg-surface">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-main">{purchase.purchaseNo}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                {new Date(purchase.purchaseDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <div className="font-medium text-main">{purchase.supplier?.businessName}</div>
                                                    <div className="text-secondary">{purchase.supplier?.contactPersonName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                {purchase.supplierInvoiceNo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-main">
                                                ₹{purchase.totalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                                ₹{purchase.paidAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                ₹{purchase.outstandingAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(purchase.status)}`}>
                                                    {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(purchase.paymentStatus)}`}>
                                                    {purchase.paymentStatus.charAt(0).toUpperCase() + purchase.paymentStatus.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => navigate(`/purchase/${purchase._id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 font-medium"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseList;
