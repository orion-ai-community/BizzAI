import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';

const BankAccounts = () => {
    const [showAddAccount, setShowAddAccount] = useState(false);

    const accounts = [
        { id: 1, bankName: 'HDFC Bank', accountNo: '****1234', accountType: 'Current', balance: 250000, branch: 'Mumbai Main', ifsc: 'HDFC0001234' },
        { id: 2, bankName: 'ICICI Bank', accountNo: '****5678', accountType: 'Savings', balance: 150000, branch: 'Andheri West', ifsc: 'ICIC0005678' },
        { id: 3, bankName: 'Axis Bank', accountNo: '****9012', accountType: 'Current', balance: 320000, branch: 'BKC', ifsc: 'UTIB0009012' }
    ];

    const columns = [
        { key: 'bankName', label: 'Bank Name', sortable: true, render: (val) => <span className="font-medium text-gray-900">{val}</span> },
        { key: 'accountNo', label: 'Account No', render: (val) => <span className="font-mono text-gray-600">{val}</span> },
        { key: 'accountType', label: 'Type', sortable: true },
        { key: 'branch', label: 'Branch' },
        { key: 'ifsc', label: 'IFSC Code', render: (val) => <span className="font-mono text-sm">{val}</span> },
        { key: 'balance', label: 'Balance', sortable: true, render: (val) => <span className="font-bold text-green-600">₹{val.toLocaleString()}</span> }
    ];

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <Layout>
            <PageHeader title="Bank Accounts" description="Manage your business bank accounts" actions={[
                <button key="add" onClick={() => setShowAddAccount(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Add Bank Account</button>
            ]} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatsCard title="Total Balance" value={`₹${totalBalance.toLocaleString()}`} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} iconBgColor="bg-green-100" iconColor="text-green-600" />
                <StatsCard title="Active Accounts" value={accounts.length} icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} iconBgColor="bg-blue-100" iconColor="text-blue-600" />
                <StatsCard title="This Month Transactions" value="156" icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} iconBgColor="bg-purple-100" iconColor="text-purple-600" />
            </div>

            {showAddAccount && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Bank Account</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                            <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., HDFC Bank" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                            <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="Enter account number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                            <select className="w-full px-4 py-2 border rounded-lg">
                                <option>Savings</option>
                                <option>Current</option>
                                <option>Overdraft</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                            <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., HDFC0001234" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                            <input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="Branch name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Opening Balance</label>
                            <input type="number" className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Account</button>
                        <button onClick={() => setShowAddAccount(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                </div>
            )}

            <DataTable columns={columns} data={accounts} emptyMessage="No bank accounts added" />
        </Layout>
    );
};

export default BankAccounts;
