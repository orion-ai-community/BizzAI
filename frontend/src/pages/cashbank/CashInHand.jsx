import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';

const CashInHand = () => {
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'in',
        category: '',
        reference: ''
    });

    const [adjustmentData, setAdjustmentData] = useState({
        newBalance: 0,
        reason: ''
    });

    // Sample data
    const cashSummary = {
        openingBalance: 50000,
        totalIn: 125000,
        totalOut: 85000,
        closingBalance: 90000
    };

    const transactions = [
        { id: 1, date: '2024-01-15', description: 'Cash Sales', amount: 15000, type: 'in', category: 'Sales', reference: 'INV-001' },
        { id: 2, date: '2024-01-16', description: 'Office Supplies', amount: 2500, type: 'out', category: 'Expense', reference: 'EXP-001' },
        { id: 3, date: '2024-01-17', description: 'Customer Payment', amount: 25000, type: 'in', category: 'Payment', reference: 'PAY-001' },
        { id: 4, date: '2024-01-18', description: 'Petty Cash', amount: 5000, type: 'out', category: 'Expense', reference: 'EXP-002' },
        { id: 5, date: '2024-01-19', description: 'Cash Sales', amount: 18000, type: 'in', category: 'Sales', reference: 'INV-002' }
    ];

    const filteredTransactions = transactions.filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesDate = (!dateRange.from || t.date >= dateRange.from) && (!dateRange.to || t.date <= dateRange.to);
        return matchesType && matchesDate;
    });

    const columns = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'description', label: 'Description', sortable: true },
        { key: 'category', label: 'Category', sortable: true },
        { key: 'reference', label: 'Reference', render: (val) => <span className="text-indigo-600 font-medium">{val}</span> },
        {
            key: 'type',
            label: 'Type',
            render: (val) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${val === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {val === 'in' ? 'Cash In' : 'Cash Out'}
                </span>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (val, row) => (
                <span className={`font-bold ${row.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {row.type === 'in' ? '+' : '-'}₹{val.toLocaleString()}
                </span>
            )
        }
    ];

    return (
        <Layout>
            <PageHeader
                title="Cash in Hand"
                description="Manage your cash transactions and balance"
                actions={[
                    <button
                        key="cash-in"
                        onClick={() => { setFormData({ ...formData, type: 'in' }); setShowAddTransaction(true); }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        + Cash In
                    </button>,
                    <button
                        key="cash-out"
                        onClick={() => { setFormData({ ...formData, type: 'out' }); setShowAddTransaction(true); }}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        - Cash Out
                    </button>,
                    <button
                        key="adjust"
                        onClick={() => setShowAdjustment(true)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Adjust Balance
                    </button>
                ]}
            />

            {/* Current Balance Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 text-sm font-medium mb-2">Current Cash Balance</p>
                        <h2 className="text-5xl font-bold mb-4">₹{cashSummary.closingBalance.toLocaleString()}</h2>
                        <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span>Today: +₹12,500</span>
                            </div>
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>This Month: +₹40,000</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatsCard
                    title="Opening Balance"
                    value={`₹${cashSummary.openingBalance.toLocaleString()}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Total Cash In"
                    value={`₹${cashSummary.totalIn.toLocaleString()}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Total Cash Out"
                    value={`₹${cashSummary.totalOut.toLocaleString()}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                    iconBgColor="bg-red-100"
                    iconColor="text-red-600"
                />
                <StatsCard
                    title="Closing Balance"
                    value={`₹${cashSummary.closingBalance.toLocaleString()}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-indigo-100"
                    iconColor="text-indigo-600"
                />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterType('in')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filterType === 'in' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Cash In
                        </button>
                        <button
                            onClick={() => setFilterType('out')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filterType === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Cash Out
                        </button>
                    </div>
                    <div className="flex items-center space-x-4">
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Add Transaction Form */}
            {showAddTransaction && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        {formData.type === 'in' ? 'Add Cash In' : 'Add Cash Out'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormInput
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                        <FormInput
                            label="Amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            required
                        />
                        <FormInput
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter description"
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="">Select category</option>
                                <option value="Sales">Sales</option>
                                <option value="Payment">Payment</option>
                                <option value="Expense">Expense</option>
                                <option value="Withdrawal">Withdrawal</option>
                                <option value="Deposit">Deposit</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <FormInput
                            label="Reference"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Invoice/Bill number"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className={`px-6 py-2 text-white rounded-lg ${formData.type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                            }`}>
                            Add Transaction
                        </button>
                        <button
                            onClick={() => setShowAddTransaction(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Cash Adjustment Form */}
            {showAdjustment && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Adjust Cash Balance</h2>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> This will adjust your current cash balance. Use this only to correct discrepancies.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormInput
                            label="Current Balance"
                            value={cashSummary.closingBalance}
                            disabled
                        />
                        <FormInput
                            label="New Balance"
                            type="number"
                            value={adjustmentData.newBalance}
                            onChange={(e) => setAdjustmentData({ ...adjustmentData, newBalance: parseFloat(e.target.value) || 0 })}
                            placeholder="Enter new balance"
                        />
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                            <textarea
                                value={adjustmentData.reason}
                                onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="Explain the reason for adjustment..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            Adjust Balance
                        </button>
                        <button
                            onClick={() => setShowAdjustment(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            <DataTable columns={columns} data={filteredTransactions} emptyMessage="No cash transactions found" />
        </Layout>
    );
};

export default CashInHand;
