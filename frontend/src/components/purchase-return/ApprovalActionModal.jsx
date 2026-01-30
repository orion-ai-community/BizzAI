import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ApprovalActionModal = ({ returnId, action, onClose, onComplete }) => {
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (action === 'reject' && !comments.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            setLoading(true);

            if (action === 'approve') {
                await api.post(`/api/purchase-returns/${returnId}/approve`, { comments });
                toast.success('Purchase return approved successfully');
            } else {
                await api.post(`/api/purchase-returns/${returnId}/reject`, { reason: comments });
                toast.success('Purchase return rejected');
            }

            onComplete();
        } catch (err) {
            console.error(`Error ${action}ing return:`, err);
            toast.error(err.response?.data?.message || `Failed to ${action} return`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {action === 'approve' ? 'Approve' : 'Reject'} Purchase Return
                    </h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {action === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection *'}
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={4}
                            placeholder={action === 'approve'
                                ? 'Add any comments...'
                                : 'Please explain why you are rejecting this return...'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={action === 'reject'}
                        />
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-md text-white ${action === 'approve'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                } disabled:opacity-50`}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApprovalActionModal;
