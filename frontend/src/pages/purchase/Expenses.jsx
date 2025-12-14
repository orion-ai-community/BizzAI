import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';

const Expenses = () => {
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [formData, setFormData] = useState({
        expenseNo: 'EXP-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: 0,
        paymentMethod: 'cash',
        description: '',
        receipt: null
    });

    const expenseCategories = [
        'Rent', 'Utilities', 'Salaries', 'Transportation', 'Marketing', 'Office Supplies',
        'Maintenance', 'Insurance', 'Professional Fees', 'Miscellaneous'
    ];

    const expenses = [
        { id: 1, expenseNo: 'EXP-001', date: '2024-01-15', category: 'Rent', amount: 25000, paymentMethod: 'bank_transfer', description: 'Monthly office rent' },
        { id: 2, expenseNo: 'EXP-002', date: '2024-01-18', category: 'Utilities', amount: 3500, paymentMethod: 'cash', description: 'Electricity bill' },
        { id: 3, expenseNo: 'EXP-003', date: '2024-01-20', category: 'Marketing', amount: 15000, paymentMethod: 'upi', description: 'Social media ads' }
    ];

    const columns = [
        { key: 'expenseNo', label: 'Expense No', sortable: true, render: (val) => <span className="font-medium text-indigo-600">{val}</span> },
        { key: 'date', label: 'Date', sortable: true },
        { key: 'category', label: 'Category', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true, render: (val) => <span className="font-medium">₹{val.toFixed(2)}</span> },
        { key: 'paymentMethod', label: 'Payment Method', render: (val) => <span className="capitalize">{val.replace('_', ' ')}</span> },
        { key: 'description', label: 'Description' }
    ];

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <Layout>
            <PageHeader title="Expenses" description="Track and manage business expenses" actions={[
                <button key="add" onClick={() => setShowAddExpense(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Add Expense</button>
            ]} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatsCard title="Total Expenses" value={`₹${totalExpenses.toFixed(0)}`} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} iconBgColor="bg-red-100" iconColor="text-red-600" />
                <StatsCard title="This Month" value={`₹${totalExpenses.toFixed(0)}`} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} iconBgColor="bg-orange-100" iconColor="text-orange-600" />
                <StatsCard title="Total Entries" value={expenses.length} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
            </div>

            {showAddExpense && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Expense</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormInput label="Expense Number" value={formData.expenseNo} onChange={(e) => setFormData({ ...formData, expenseNo: e.target.value })} required />
                        <FormInput label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                <option value="">Select category</option>
                                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <FormInput label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                            <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card</option>
                                <option value="cheque">Cheque</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" className="w-full px-4 py-2 border rounded-lg" placeholder="Add description..." />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Expense</button>
                        <button onClick={() => setShowAddExpense(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                </div>
            )}

            <DataTable columns={columns} data={expenses} emptyMessage="No expenses recorded" />
        </Layout>
    );
};

export default Expenses;
