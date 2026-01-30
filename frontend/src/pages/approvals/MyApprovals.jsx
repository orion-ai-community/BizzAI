import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';
import ApprovalActionModal from '../../components/purchase-return/ApprovalActionModal';

const MyApprovals = () => {
    const navigate = useNavigate();
    const [approvals, setApprovals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [approvalAction, setApprovalAction] = useState(null);

    useEffect(() => {
        fetchApprovals();
        fetchStats();
    }, [filter]);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/approvals/my-approvals', {
                params: { status: filter },
            });
            setApprovals(response.data);
        } catch (err) {
            console.error('Error fetching approvals:', err);
            toast.error('Failed to fetch approvals');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/approvals/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleApprove = (approval) => {
        setSelectedApproval(approval);
        setApprovalAction('approve');
        setShowActionModal(true);
    };

    const handleReject = (approval) => {
        setSelectedApproval(approval);
        setApprovalAction('reject');
        setShowActionModal(true);
    };

    const handleActionComplete = () => {
        setShowActionModal(false);
        setSelectedApproval(null);
        fetchApprovals();
        fetchStats();
    };

    const getEntityIcon = (entityType) => {
        const icons = {
            PurchaseReturn: '↩️',
            Purchase: '🛒',
            Sale: '💰',
            Payment: '💳',
        };
        return icons[entityType] || '📄';
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800',
        };
        return badges[priority] || badges.medium;
    };

    return (
        <Layout>
            <PageHeader
                title="My Approvals"
                subtitle="Review and approve pending requests"
            />

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Pending</p>
                        <p className="text-3xl font-bold text-yellow-600">{stats.pending || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Approved Today</p>
                        <p className="text-3xl font-bold text-green-600">{stats.approvedToday || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">This Month</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.thisMonth || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm text-gray-600 mb-1">Total Processed</p>
                        <p className="text-3xl font-bold text-gray-600">{stats.total || 0}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-md ${filter === 'pending'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`px-4 py-2 rounded-md ${filter === 'approved'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Approved
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className={`px-4 py-2 rounded-md ${filter === 'rejected'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Rejected
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {/* Approvals List */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading...</p>
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No approvals found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {approvals.map((approval) => (
                            <div key={approval._id} className="p-6 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className="text-2xl">{getEntityIcon(approval.entityType)}</span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {approval.entityType}: {approval.entityId?.returnId || approval.entityId}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Requested by: {approval.requestedBy?.name} •
                                                    {new Date(approval.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <p className="text-xs text-gray-600">Amount</p>
                                                <p className="font-semibold text-gray-900">
                                                    ₹{approval.entityId?.totalAmount?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Level</p>
                                                <p className="font-semibold text-gray-900">
                                                    {approval.currentLevel} of {approval.totalLevels}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Priority</p>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(approval.priority)}`}>
                                                    {approval.priority}
                                                </span>
                                            </div>
                                        </div>

                                        {approval.comments && (
                                            <div className="mt-3 bg-gray-50 p-3 rounded">
                                                <p className="text-sm text-gray-700 italic">"{approval.comments}"</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-6 flex flex-col space-y-2">
                                        {approval.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(approval)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(approval)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                                                >
                                                    ✗ Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => navigate(`/purchase-returns/${approval.entityId._id || approval.entityId}`)}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approval Action Modal */}
            {showActionModal && selectedApproval && (
                <ApprovalActionModal
                    returnId={selectedApproval.entityId._id || selectedApproval.entityId}
                    action={approvalAction}
                    onClose={() => setShowActionModal(false)}
                    onComplete={handleActionComplete}
                />
            )}
        </Layout>
    );
};

export default MyApprovals;
