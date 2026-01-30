import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const PaymentOutList = () => {
    const navigate = useNavigate();

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        supplier: '',
        startDate: '',
        endDate: '',
        paymentMethod: '',
        status: '',
        bankAccount: '',
    });
    const [suppliers, setSuppliers] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);

    useEffect(() => {
        fetchPayments();
        fetchSuppliers();
        fetchBankAccounts();
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [filters]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });

            const { data } = await api.get(`${API_URL}/api/payment-out?${params.toString()}`);
            setPayments(data);
        } catch (err) {
            toast.error('Error fetching payments');
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const { data } = await api.get(`${API_URL}/api/suppliers`);
            setSuppliers(data);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        }
    };

    const fetchBankAccounts = async () => {
        try {
            const { data } = await api.get(`${API_URL}/api/cashbank/bank-accounts`);
            setBankAccounts(data);
        } catch (err) {
            console.error('Error fetching bank accounts:', err);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            cleared: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Cleared' },
            bounced: { bg: 'bg-red-100', text: 'text-red-800', label: 'Bounced' },
            cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
        };

        const config = statusConfig[status] || statusConfig.completed;
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentMethodIcon = (method) => {
        const icons = {
            cash: '💵',
            bank: '🏦',
            upi: '📱',
            card: '💳',
            cheque: '📝',
        };
        return icons[method] || '💰';
    };

    const columns = [
        {
            key: 'paymentNo',
            label: 'Payment No',
            render: (value, row) => (
                <button
                    onClick={() => navigate(`/purchase/payment-out/${row._id}`)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    {row.paymentNo}
                </button>
            ),
        },
        {
            key: 'paymentDate',
            label: 'Date',
            render: (value, row) => new Date(row.paymentDate).toLocaleDateString(),
        },
        {
            key: 'supplier',
            label: 'Supplier',
            render: (value, row) => (
                <div>
                    <p className="font-medium text-main">{row.supplier?.businessName}</p>
                    <p className="text-sm text-muted">{row.supplier?.contactPersonName}</p>
                </div>
            ),
        },
        {
            key: 'totalAmount',
            label: 'Amount',
            render: (value, row) => <span className="font-bold">₹{row.totalAmount.toFixed(2)}</span>,
        },
        {
            key: 'paymentMethod',
            label: 'Method',
            render: (value, row) => (
                <div className="flex items-center gap-2">
                    <span>{getPaymentMethodIcon(row.paymentMethod)}</span>
                    <span className="capitalize">{row.paymentMethod}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => getStatusBadge(row.status),
        },
        {
            key: 'allocatedBills',
            label: 'Bills',
            render: (value, row) => (
                <span className="text-sm">
                    {row.allocatedBills?.length || 0} bill{row.allocatedBills?.length !== 1 ? 's' : ''}
                </span>
            ),
        },
        {
            key: 'reference',
            label: 'Reference',
            render: (value, row) => row.reference || '-',
        },
        {
            key: '_id',
            label: 'Actions',
            render: (value, row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/purchase/payment-out/${row._id}`)}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="View Details"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <PageHeader
                title="Payment Out List"
                description="View and manage supplier payments"
                actions={[
                    <button
                        key="new"
                        onClick={() => navigate('/purchase/payment-out')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        + New Payment
                    </button>,
                ]}
            />

            {/* Filters */}
            <div className="bg-dark rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-bold text-main mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                        <select
                            value={filters.supplier}
                            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                            value={filters.paymentMethod}
                            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="upi">UPI</option>
                            <option value="card">Card</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="cleared">Cleared</option>
                            <option value="bounced">Bounced</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                        <select
                            value={filters.bankAccount}
                            onChange={(e) => setFilters({ ...filters, bankAccount: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="">All Accounts</option>
                            {bankAccounts.map((account) => (
                                <option key={account._id} value={account._id}>
                                    {account.bankName} - ****{account.accountNumber.slice(-4)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => setFilters({
                            supplier: '',
                            startDate: '',
                            endDate: '',
                            paymentMethod: '',
                            status: '',
                            bankAccount: '',
                        })}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-dark rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2 text-muted">Loading payments...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-muted">No payments found</p>
                        <button
                            onClick={() => navigate('/purchase/payment-out')}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Create First Payment
                        </button>
                    </div>
                ) : (
                    <DataTable columns={columns} data={payments} />
                )}
            </div>
        </Layout>
    );
};

export default PaymentOutList;
