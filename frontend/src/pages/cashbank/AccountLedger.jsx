import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const AccountLedger = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        reconciled: 'all'
    });
    const [selectedTxns, setSelectedTxns] = useState([]);

    useEffect(() => {
        fetchLedger();
    }, [id, filters]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.token;
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.reconciled !== 'all') params.append('reconciled', filters.reconciled);

            const response = await api.get(
                `/api/cashbank/accounts/${id}/ledger?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLedgerData(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load ledger');
        } finally {
            setLoading(false);
        }
    };

    const toggleReconcile = async (txnId) => {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.token;
            await api.put(
                `/api/cashbank/transactions/${txnId}/reconcile`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Reconciliation status updated');
            fetchLedger();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update reconciliation');
        }
    };

    const bulkReconcile = async (reconciled) => {
        if (selectedTxns.length === 0) {
            toast.warning('Please select transactions first');
            return;
        }

        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.token;
            await api.put(
                `/api/cashbank/transactions/bulk-reconcile`,
                { transactionIds: selectedTxns, reconciled },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`${selectedTxns.length} transactions ${reconciled ? 'reconciled' : 'unreconciled'}`);
            setSelectedTxns([]);
            fetchLedger();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Bulk reconciliation failed');
        }
    };

    const toggleSelectTxn = (txnId) => {
        setSelectedTxns(prev =>
            prev.includes(txnId) ? prev.filter(id => id !== txnId) : [...prev, txnId]
        );
    };

    const selectAll = () => {
        if (ledgerData && selectedTxns.length === ledgerData.ledger.length) {
            setSelectedTxns([]);
        } else {
            setSelectedTxns(ledgerData.ledger.map(t => t._id));
        }
    };

    const exportCSV = () => {
        window.open(
            `/api/cashbank/export?accountId=${id}&format=csv&startDate=${filters.startDate}&endDate=${filters.endDate}`,
            '_blank'
        );
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

    if (!ledgerData) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Account not found</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title={`${ledgerData.account.bankName} - Ledger`}
                description={ledgerData.account._id === 'cash'
                    ? `Account: Cash | Type: ${ledgerData.account.accountType}`
                    : `Account: ****${ledgerData.account.accountNumber.slice(-4)} | Type: ${ledgerData.account.accountType}`}
                actions={[
                    <button
                        key="back"
                        onClick={() => navigate('/cashbank/summary')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        ← Back
                    </button>,
                    <button
                        key="export"
                        onClick={exportCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Export CSV
                    </button>
                ]}
            />

            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <p className="text-gray-500 text-sm font-medium">Opening Balance</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">₹{ledgerData.summary.openingBalance.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <p className="text-gray-500 text-sm font-medium">Total Credits</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">₹{ledgerData.summary.totalCredits.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <p className="text-gray-500 text-sm font-medium">Total Debits</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">₹{ledgerData.summary.totalDebits.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <p className="text-gray-500 text-sm font-medium">Closing Balance</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">₹{ledgerData.summary.closingBalance.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filters.reconciled}
                            onChange={(e) => setFilters({ ...filters, reconciled: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                        >
                            <option value="all">All Transactions</option>
                            <option value="true">Reconciled Only</option>
                            <option value="false">Unreconciled Only</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={() => setFilters({ startDate: '', endDate: '', reconciled: 'all' })}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedTxns.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex justify-between items-center">
                    <span className="text-indigo-800 font-medium">{selectedTxns.length} transaction(s) selected</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => bulkReconcile(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Mark as Reconciled
                        </button>
                        <button
                            onClick={() => bulkReconcile(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            Mark as Unreconciled
                        </button>
                        <button
                            onClick={() => setSelectedTxns([])}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Ledger Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={ledgerData.ledger.length > 0 && selectedTxns.length === ledgerData.ledger.length}
                                        onChange={selectAll}
                                        className="rounded"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reconciled</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {ledgerData.ledger.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        No transactions found for the selected filters
                                    </td>
                                </tr>
                            ) : (
                                ledgerData.ledger.map((txn) => (
                                    <tr key={txn._id} className={`hover:bg-gray-50 ${txn.reconciled ? 'bg-green-50' : ''}`}>
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedTxns.includes(txn._id)}
                                                onChange={() => toggleSelectTxn(txn._id)}
                                                className="rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(txn.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {txn.description || 'No description'}
                                            {txn.reference && (
                                                <span className="block text-xs text-gray-500">Ref: {txn.reference}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                                            {txn.debit > 0 ? `₹${txn.debit.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                                            {txn.credit > 0 ? `₹${txn.credit.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-indigo-600">
                                            ₹{txn.runningBalance.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {txn.reconciled ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    ✓ Reconciled
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => toggleReconcile(txn._id)}
                                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                            >
                                                {txn.reconciled ? 'Unreconcile' : 'Reconcile'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default AccountLedger;
