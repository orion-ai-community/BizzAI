import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import StatsCard from '../../components/StatsCard';

const BankSummary = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.token;
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/cashbank/summary`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSummary(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load summary');
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        const colors = {
            'Savings': 'bg-blue-100 text-blue-800',
            'Current': 'bg-green-100 text-green-800',
            'Overdraft': 'bg-orange-100 text-orange-800',
            'Loan': 'bg-red-100 text-red-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

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
                title="Bank Accounts Summary"
                description="Overview of all your bank accounts"
                actions={[
                    <button
                        key="add"
                        onClick={() => navigate('/cashbank/bank-accounts')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Manage Accounts
                    </button>
                ]}
            />

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Total Accounts"
                    value={summary?.accountCount || 0}
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    }
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Total Balance"
                    value={`₹${summary?.totalBalance.toFixed(0) || 0}`}
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Average Balance"
                    value={`₹${summary?.accountCount > 0 ? (summary.totalBalance / summary.accountCount).toFixed(0) : 0}`}
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                />
            </div>

            {/* Accounts Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">All Bank Accounts</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bank Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Account Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Opening Balance
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Current Balance
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {summary?.accounts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No bank accounts found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                summary?.accounts.map((account) => (
                                    <tr key={account._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{account.bankName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">****{account.accountNumber.slice(-4)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(account.accountType)}`}>
                                                {account.accountType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            ₹{account.openingBalance.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                                            <span className={account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                ₹{account.currentBalance.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {account.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/cashbank/ledger/${account._id}`)}
                                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group"
                                                title="View Ledger"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
                                                </svg>
                                                View Ledger
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Account Type Breakdown */}
            {summary?.accounts.length > 0 && (
                <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Type Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Savings', 'Current', 'Overdraft', 'Loan'].map((type) => {
                            const accounts = summary.accounts.filter(a => a.accountType === type);
                            const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
                            return (
                                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">{type}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{accounts.length}</p>
                                    <p className="text-sm text-gray-500 mt-1">₹{totalBalance.toFixed(0)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default BankSummary;
