import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import StatsCard from '../../components/StatsCard';

const CashBankPosition = () => {
    const navigate = useNavigate();
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosition();
    }, []);

    const fetchPosition = async () => {
        try {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.token;
            const response = await api.get(
                `/api/cashbank/position`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPosition(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load cash/bank position');
        } finally {
            setLoading(false);
        }
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
                title="Cash & Bank Position"
                description="Your liquidity snapshot"
                actions={[
                    <button
                        key="refresh"
                        onClick={fetchPosition}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        🔄 Refresh
                    </button>
                ]}
            />

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Cash in Hand"
                    value={`₹${position?.cashInHand.toFixed(0) || 0}`}
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Total in Bank"
                    value={`₹${position?.totalBankBalance.toFixed(0) || 0}`}
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    }
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Total Liquidity"
                    value={`₹${position?.totalLiquidity.toFixed(0) || 0}`}
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                />
            </div>

            {/* Visual Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Cash */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Cash Position</h3>
                        <span className="text-3xl font-bold text-green-600">
                            {position?.breakdown.cash.percentage}%
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-semibold text-gray-900">₹{position?.cashInHand.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className="bg-green-600 h-4 rounded-full transition-all"
                                style={{ width: `${position?.breakdown.cash.percentage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500">Physical cash available for transactions</p>
                    </div>
                </div>

                {/* Bank */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Bank Position</h3>
                        <span className="text-3xl font-bold text-blue-600">
                            {position?.breakdown.bank.percentage}%
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-semibold text-gray-900">₹{position?.totalBankBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Accounts:</span>
                            <span className="font-semibold text-gray-900">{position?.breakdown.bank.accounts}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className="bg-blue-600 h-4 rounded-full transition-all"
                                style={{ width: `${position?.breakdown.bank.percentage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500">Total balance across all bank accounts</p>
                    </div>
                </div>
            </div>

            {/* Visual Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribution Overview</h3>
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div className="text-sm font-semibold text-green-600">Cash ({position?.breakdown.cash.percentage}%)</div>
                        <div className="text-sm font-semibold text-blue-600">Bank ({position?.breakdown.bank.percentage}%)</div>
                    </div>
                    <div className="flex h-8 mb-4 overflow-hidden rounded-lg">
                        <div
                            className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold"
                            style={{ width: `${position?.breakdown.cash.percentage}%` }}
                        >
                            {position?.breakdown.cash.percentage > 10 && `₹${position?.cashInHand.toFixed(0)}`}
                        </div>
                        <div
                            className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
                            style={{ width: `${position?.breakdown.bank.percentage}%` }}
                        >
                            {position?.breakdown.bank.percentage > 10 && `₹${position?.totalBankBalance.toFixed(0)}`}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Lqiuidity Management</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <button
                            onClick={() => navigate('/cashbank/transfers', { state: { toAccount: 'cash' } })}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                            </svg>
                            Withdraw Cash
                        </button>
                        <button
                            onClick={() => navigate('/cashbank/transfers', { state: { fromAccount: 'cash' } })}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010 18z" />
                            </svg>
                            Deposit Cash
                        </button>
                        <button
                            onClick={() => navigate('/cashbank/bank-accounts')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                            Manage Accounts
                        </button>
                        <button
                            onClick={() => navigate('/cashbank/summary')}
                            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                        >
                            View Summary
                        </button>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">💡 Insights</h3>
                <div className="space-y-2 text-sm text-indigo-800">
                    {position?.breakdown.cash.percentage > 30 && (
                        <p>• Consider transferring excess cash to bank for better security</p>
                    )}
                    {position?.breakdown.bank.percentage > 95 && (
                        <p>• Maintain some cash on hand for immediate expenses</p>
                    )}
                    {position?.totalLiquidity === 0 && (
                        <p>• No liquidity detected. Add funds to get started.</p>
                    )}
                    {position?.totalLiquidity > 0 && (
                        <p>• Total liquidity: ₹{position.totalLiquidity.toFixed(2)} available for business operations</p>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default CashBankPosition;
