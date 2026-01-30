import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const PaymentOutDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Get token from user object in localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showChequeModal, setShowChequeModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [chequeStatus, setChequeStatus] = useState('');
    const [chequeReason, setChequeReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPaymentDetails();
    }, [id]);

    const fetchPaymentDetails = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`${API_URL}/api/payment-out/${id}`);
            setPayment(data);
        } catch (err) {
            toast.error('Error fetching payment details');
            console.error(err);
            navigate('/purchase/payment-out/list');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPayment = async () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }

        setProcessing(true);
        try {
            await api.delete(`${API_URL}/api/payment-out/${id}`, {
                data: { reason: cancelReason }
            });
            toast.success('Payment cancelled successfully');
            setShowCancelModal(false);
            fetchPaymentDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error cancelling payment');
        } finally {
            setProcessing(false);
        }
    };

    const handleChequeStatusUpdate = async () => {
        if (!chequeStatus) {
            toast.error('Please select cheque status');
            return;
        }

        if (chequeStatus === 'bounced' && !chequeReason.trim()) {
            toast.error('Please provide bounce reason');
            return;
        }

        setProcessing(true);
        try {
            await api.post(
                `${API_URL}/api/payment-out/${id}/cheque-status`,
                { status: chequeStatus, reason: chequeReason }
            );
            toast.success(`Cheque marked as ${chequeStatus} successfully`);
            setShowChequeModal(false);
            fetchPaymentDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error updating cheque status');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            cleared: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Cleared' },
            bounced: { bg: 'bg-red-100', text: 'text-red-800', label: 'Bounced' },
            cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
        };

        const config = statusConfig[status] || statusConfig.completed;
        return (
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </Layout>
        );
    }

    if (!payment) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-muted">Payment not found</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title={`Payment: ${payment.paymentNo}`}
                description="Payment details and information"
                actions={[
                    payment.paymentMethod === 'cheque' && payment.status === 'pending' && (
                        <button
                            key="cheque"
                            onClick={() => setShowChequeModal(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Update Cheque Status
                        </button>
                    ),
                    payment.status !== 'cancelled' && (
                        <button
                            key="cancel"
                            onClick={() => setShowCancelModal(true)}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Cancel Payment
                        </button>
                    ),
                    <button
                        key="back"
                        onClick={() => navigate('/purchase/payment-out/list')}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Back to List
                    </button>,
                ].filter(Boolean)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Payment Information */}
                    <div className="bg-dark rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Payment Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted">Payment Number</p>
                                <p className="font-medium text-main">{payment.paymentNo}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted">Payment Date</p>
                                <p className="font-medium text-main">
                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted">Payment Method</p>
                                <p className="font-medium text-main capitalize">{payment.paymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted">Status</p>
                                <div className="mt-1">{getStatusBadge(payment.status)}</div>
                            </div>
                            <div>
                                <p className="text-sm text-muted">Total Amount</p>
                                <p className="text-2xl font-bold text-indigo-600">₹{payment.totalAmount.toFixed(2)}</p>
                            </div>
                            {payment.reference && (
                                <div>
                                    <p className="text-sm text-muted">Reference</p>
                                    <p className="font-medium text-main">{payment.reference}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Supplier Information */}
                    <div className="bg-dark rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Supplier Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted">Business Name</p>
                                <p className="font-medium text-main">{payment.supplier?.businessName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted">Contact Person</p>
                                <p className="font-medium text-main">{payment.supplier?.contactPersonName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted">Contact Number</p>
                                <p className="font-medium text-main">{payment.supplier?.contactNo}</p>
                            </div>
                            {payment.supplier?.email && (
                                <div>
                                    <p className="text-sm text-muted">Email</p>
                                    <p className="font-medium text-main">{payment.supplier.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bank/Cheque Details */}
                    {payment.bankAccount && (
                        <div className="bg-dark rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">
                                {payment.paymentMethod === 'cheque' ? 'Cheque Details' : 'Bank Details'}
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted">Bank Name</p>
                                    <p className="font-medium text-main">{payment.bankAccount?.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted">Account Number</p>
                                    <p className="font-medium text-main">
                                        ****{payment.bankAccount?.accountNumber.slice(-4)}
                                    </p>
                                </div>

                                {payment.paymentMethod === 'cheque' && payment.chequeDetails && (
                                    <>
                                        <div>
                                            <p className="text-sm text-muted">Cheque Number</p>
                                            <p className="font-medium text-main">{payment.chequeDetails.chequeNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Cheque Date</p>
                                            <p className="font-medium text-main">
                                                {new Date(payment.chequeDetails.chequeDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {payment.chequeDetails.chequeBank && (
                                            <div>
                                                <p className="text-sm text-muted">Cheque Bank</p>
                                                <p className="font-medium text-main">{payment.chequeDetails.chequeBank}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-muted">Clearing Status</p>
                                            <p className="font-medium text-main capitalize">
                                                {payment.chequeDetails.clearingStatus}
                                            </p>
                                        </div>
                                        {payment.chequeDetails.clearedDate && (
                                            <div>
                                                <p className="text-sm text-muted">Cleared Date</p>
                                                <p className="font-medium text-main">
                                                    {new Date(payment.chequeDetails.clearedDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        {payment.chequeDetails.bouncedDate && (
                                            <div className="col-span-2">
                                                <p className="text-sm text-muted">Bounced Date</p>
                                                <p className="font-medium text-red-600">
                                                    {new Date(payment.chequeDetails.bouncedDate).toLocaleDateString()}
                                                </p>
                                                {payment.chequeDetails.bounceReason && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        Reason: {payment.chequeDetails.bounceReason}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bill Allocations */}
                    {payment.allocatedBills && payment.allocatedBills.length > 0 && (
                        <div className="bg-dark rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Bill Allocations</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Bill No
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                Allocated Amount
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                Bill Balance Before
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {payment.allocatedBills.map((allocation, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-sm font-medium text-main">
                                                    {allocation.billNo}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-right font-bold text-indigo-600">
                                                    ₹{allocation.allocatedAmount.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    ₹{allocation.billBalanceBefore.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td className="px-4 py-2 text-sm font-bold text-main">Total</td>
                                            <td className="px-4 py-2 text-sm text-right font-bold text-indigo-600">
                                                ₹{payment.totalAllocatedToBills.toFixed(2)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {payment.notes && (
                        <div className="bg-dark rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Notes</h2>
                            <p className="text-muted whitespace-pre-wrap">{payment.notes}</p>
                        </div>
                    )}

                    {/* Cancellation Info */}
                    {payment.status === 'cancelled' && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                            <h2 className="text-lg font-bold text-red-800 mb-4">Cancellation Information</h2>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-red-600">Cancelled At</p>
                                    <p className="font-medium text-red-800">
                                        {new Date(payment.cancelledAt).toLocaleString()}
                                    </p>
                                </div>
                                {payment.cancellationReason && (
                                    <div>
                                        <p className="text-sm text-red-600">Reason</p>
                                        <p className="font-medium text-red-800">{payment.cancellationReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Payment Summary */}
                    <div className="bg-dark rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-main mb-4">Payment Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted">Total Payment</span>
                                <span className="font-bold text-main">₹{payment.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Allocated to Bills</span>
                                <span className="font-medium text-main">
                                    ₹{payment.totalAllocatedToBills.toFixed(2)}
                                </span>
                            </div>
                            {payment.advanceAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted">Advance Amount</span>
                                    <span className="font-medium text-green-600">
                                        ₹{payment.advanceAmount.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-muted">Unallocated</span>
                                    <span className="font-bold text-main">
                                        ₹{payment.unallocatedAmount?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Audit Trail */}
                    {payment.auditLog && payment.auditLog.length > 0 && (
                        <div className="bg-dark rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Audit Trail</h2>
                            <div className="space-y-3">
                                {payment.auditLog.map((log, index) => (
                                    <div key={index} className="text-sm">
                                        <p className="font-medium text-main capitalize">
                                            {log.action.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-muted text-xs">
                                            {new Date(log.performedAt).toLocaleString()}
                                        </p>
                                        {log.details && <p className="text-muted text-xs mt-1">{log.details}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cancel Payment Modal */}
            <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Payment">
                <div className="space-y-4">
                    <p className="text-muted">
                        Are you sure you want to cancel this payment? This will reverse all bill allocations and
                        ledger entries.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cancellation Reason *
                        </label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows="3"
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Enter reason for cancellation..."
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancelPayment}
                            disabled={processing}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {processing ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Cheque Status Modal */}
            <Modal isOpen={showChequeModal} onClose={() => setShowChequeModal(false)} title="Update Cheque Status">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Status *</label>
                        <select
                            value={chequeStatus}
                            onChange={(e) => setChequeStatus(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                        >
                            <option value="">Select status</option>
                            <option value="cleared">Cleared</option>
                            <option value="bounced">Bounced</option>
                        </select>
                    </div>

                    {chequeStatus === 'bounced' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bounce Reason *</label>
                            <textarea
                                value={chequeReason}
                                onChange={(e) => setChequeReason(e.target.value)}
                                rows="3"
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="Enter reason for bounce..."
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleChequeStatusUpdate}
                            disabled={processing}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {processing ? 'Updating...' : 'Update Status'}
                        </button>
                        <button
                            onClick={() => setShowChequeModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default PaymentOutDetail;
