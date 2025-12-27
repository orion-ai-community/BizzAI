import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import { getAllExpenses, createExpense, deleteExpense, reset } from '../../redux/slices/expenseSlice';
import { getAccounts } from '../../redux/slices/cashbankSlice';

const Expenses = () => {
    const dispatch = useDispatch();
    const { expenses, isLoading, isError, message } = useSelector(state => state.expense);
    const { accounts } = useSelector(state => state.cashbank);

    const [showAddExpense, setShowAddExpense] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        expenseNo: 'EXP-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: 0,
        paymentMethod: 'cash',
        bankAccount: '',
        description: '',
        receipt: null
    });

    const expenseCategories = [
        'Rent', 'Utilities', 'Salaries', 'Transportation', 'Marketing', 'Office Supplies',
        'Maintenance', 'Insurance', 'Professional Fees', 'Miscellaneous'
    ];

    useEffect(() => {
        dispatch(getAllExpenses());
        dispatch(getAccounts());
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(createExpense(formData));
            setShowAddExpense(false);
            setFormData({
                expenseNo: 'EXP-' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                category: '',
                amount: 0,
                paymentMethod: 'cash',
                bankAccount: '',
                description: '',
                receipt: null
            });
            dispatch(getAllExpenses()); // Refresh the list
            dispatch(getAccounts()); // Refresh bank balances
        } catch (error) {
            console.error('Error creating expense:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteExpense(id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const columns = [
        { key: 'expenseNo', label: 'Expense No', sortable: true, render: (val) => <span className="font-medium text-indigo-600">{val}</span> },
        { key: 'date', label: 'Date', sortable: true, render: (val) => new Date(val).toLocaleDateString() },
        { key: 'category', label: 'Category', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true, render: (val) => <span className="font-medium">₹{val.toFixed(2)}</span> },
        { key: 'paymentMethod', label: 'Payment Method', render: (val) => <span className="capitalize">{val.replace('_', ' ')}</span> },
        { key: 'description', label: 'Description' },
        {
            key: 'actions',
            label: 'Actions',
            render: (val, row) => (
                <button
                    onClick={() => setDeleteConfirm(row._id)}
                    className="text-red-600 hover:text-red-900"
                >
                    Delete
                </button>
            )
        }
    ];

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Filter expenses based on search term
    const filteredExpenses = expenses.filter((expense) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            expense.expenseNo.toLowerCase().includes(searchLower) ||
            expense.category.toLowerCase().includes(searchLower) ||
            (expense.description || '').toLowerCase().includes(searchLower) ||
            expense.paymentMethod.toLowerCase().includes(searchLower) ||
            expense.amount.toString().includes(searchLower)
        );
    });

    return (
        <Layout>
            <PageHeader title="Expenses" description="Track and manage business expenses" actions={[
                <button key="add" onClick={() => setShowAddExpense(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Add Expense</button>
            ]} />

            {/* Error Message */}
            {isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatsCard title="Total Expenses" value={`₹${totalExpenses.toFixed(0)}`} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} iconBgColor="bg-red-100" iconColor="text-red-600" />
                <StatsCard title="This Month" value={`₹${totalExpenses.toFixed(0)}`} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} iconBgColor="bg-orange-100" iconColor="text-orange-600" />
                <StatsCard title="Total Entries" value={expenses.length} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
            </div>

            {showAddExpense && (
                <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-main mb-4">Add New Expense</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormInput label="Expense Number" value={formData.expenseNo} onChange={(e) => setFormData({ ...formData, expenseNo: e.target.value })} required />
                            <FormInput label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Category <span className="text-red-500">*</span></label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required>
                                    <option value="">Select category</option>
                                    {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <FormInput label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Payment Method</label>
                                <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>
                            {formData.paymentMethod === 'bank_transfer' && (
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Select Bank Account</label>
                                    <select value={formData.bankAccount} onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required>
                                        <option value="">Choose account</option>
                                        {accounts.map(account => (
                                            <option key={account._id} value={account._id}>
                                                {account.bankName} - {account.accountType} (₹{account.currentBalance})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-secondary mb-2">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" className="w-full px-4 py-2 border rounded-lg" placeholder="Add description..." />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {isLoading ? 'Saving...' : 'Save Expense'}
                            </button>
                            <button type="button" onClick={() => setShowAddExpense(false)} className="px-6 py-2 border border-default text-secondary rounded-lg hover:bg-gray-50">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-card rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="w-full sm:w-96">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by expense number, category, description, payment method, or amount..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-sm text-muted">
                        {filteredExpenses.length} of {expenses.length} expenses
                    </div>
                </div>
            </div>

            <DataTable columns={columns} data={filteredExpenses} emptyMessage={searchTerm ? "No expenses match your search" : "No expenses recorded"} />

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/20">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this expense? This action cannot be undone.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-default text-secondary rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Expenses;
