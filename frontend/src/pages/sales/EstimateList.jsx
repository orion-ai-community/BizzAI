import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EstimateList = () => {
    const navigate = useNavigate();
    const [estimates, setEstimates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEstimates();
    }, []);

    const fetchEstimates = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await api.get(
                `/api/estimates`,
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            setEstimates(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch estimates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this estimate?')) return;

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.delete(
                `/api/estimates/${id}`,
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            toast.success('Estimate deleted');
            fetchEstimates();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete estimate');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
            case 'sent':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
            case 'accepted':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
    };

    const filteredEstimates = estimates.filter((est) =>
        est.estimateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))]"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title="Estimates"
                description="View and manage all estimates"
                actions={[
                    <button
                        key="create"
                        onClick={() => navigate('/sales/estimate')}
                        className="px-6 py-2 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))]"
                    >
                        + Create Estimate
                    </button>
                ]}
            />

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by estimate number or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-gray-900 dark:text-[rgb(var(--color-text))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))]"
                />
            </div>

            {/* Estimates Table */}
            <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-[rgb(var(--color-table-header))] border-b border-gray-200 dark:border-[rgb(var(--color-border))]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">Estimate #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[rgb(var(--color-table-row))] divide-y divide-gray-200 dark:divide-[rgb(var(--color-border))]">
                            {filteredEstimates.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                                        No estimates found
                                    </td>
                                </tr>
                            ) : (
                                filteredEstimates.map((estimate) => (
                                    <tr key={estimate._id} className="hover:bg-gray-50 dark:hover:bg-[rgb(var(--color-input))]">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => navigate(`/sales/estimate/${estimate._id}`)}
                                                className="text-indigo-600 dark:text-[rgb(var(--color-primary))] hover:text-indigo-900 font-medium"
                                            >
                                                {estimate.estimateNo}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[rgb(var(--color-text))]">
                                            {estimate.customer?.name || 'Walk-in Customer'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                                            {new Date(estimate.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">
                                            ₹{estimate.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(estimate.status)}`}>
                                                {estimate.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                            <button
                                                onClick={() => navigate(`/sales/estimate/${estimate._id}`)}
                                                className="text-indigo-600 dark:text-[rgb(var(--color-primary))] hover:text-indigo-900"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDelete(estimate._id)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-900"
                                            >
                                                Delete
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

export default EstimateList;
