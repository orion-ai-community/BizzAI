import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getPurchaseById, cancelPurchase, reset } from '../../redux/slices/purchaseSlice';

const PurchaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentPurchase, isLoading, isSuccess, message } = useSelector((state) => state.purchase);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        dispatch(getPurchaseById(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (isSuccess && message) {
            toast.success(message);
            dispatch(reset());
            dispatch(getPurchaseById(id)); // Refresh data
            setShowCancelModal(false);
        }
    }, [isSuccess, message, dispatch, id]);

    const handleCancel = () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }
        dispatch(cancelPurchase({ id, cancelReason }));
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            finalized: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (isLoading || !currentPurchase) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    const purchase = currentPurchase;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-main mb-2">Purchase Details</h1>
                        <p className="text-secondary">Purchase #{purchase.purchaseNo}</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => navigate('/purchase/list')}
                            className="px-4 py-2 border border-default text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Back to List
                        </button>
                        {purchase.status === 'draft' && (
                            <button
                                onClick={() => navigate(`/purchase/edit/${purchase._id}`)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Edit
                            </button>
                        )}
                        {purchase.status === 'finalized' && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Cancel Purchase
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Purchase Header */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-bold text-main">Purchase Information</h2>
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(purchase.status)}`}>
                                    {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-secondary">Purchase Number</p>
                                    <p className="font-medium text-main">{purchase.purchaseNo}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary">Purchase Date</p>
                                    <p className="font-medium text-main">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary">Supplier Invoice No</p>
                                    <p className="font-medium text-main">{purchase.supplierInvoiceNo}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary">Supplier Invoice Date</p>
                                    <p className="font-medium text-main">{new Date(purchase.supplierInvoiceDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary">Purchase Type</p>
                                    <p className="font-medium text-main capitalize">{purchase.purchaseType}</p>
                                </div>
                                {purchase.referenceNo && (
                                    <div>
                                        <p className="text-sm text-secondary">Reference No</p>
                                        <p className="font-medium text-main">{purchase.referenceNo}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Supplier Info */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Supplier Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-secondary">Business Name</p>
                                    <p className="font-medium text-main">{purchase.supplier?.businessName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary">Contact Person</p>
                                    <p className="font-medium text-main">{purchase.supplier?.contactPersonName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary">Contact Number</p>
                                    <p className="font-medium text-main">{purchase.supplier?.contactNo}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary">GSTIN</p>
                                    <p className="font-medium text-main">{purchase.supplier?.gstNo}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Items</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Item</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Qty</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Rate</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Tax%</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Discount</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {purchase.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm">
                                                        <div className="font-medium text-main">{item.itemName}</div>
                                                        {item.hsnCode && <div className="text-secondary text-xs">HSN: {item.hsnCode}</div>}
                                                        {item.batchNo && <div className="text-secondary text-xs">Batch: {item.batchNo}</div>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-secondary">{item.quantity}</td>
                                                <td className="px-4 py-3 text-sm text-secondary">₹{item.purchaseRate.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-sm text-secondary">{item.taxRate}%</td>
                                                <td className="px-4 py-3 text-sm text-secondary">₹{item.discount.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-main">₹{item.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        {purchase.notes && (
                            <div className="bg-card rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-bold text-main mb-4">Notes</h2>
                                <p className="text-secondary">{purchase.notes}</p>
                            </div>
                        )}

                        {/* Cancel Info */}
                        {purchase.status === 'cancelled' && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                                <h2 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2">Cancellation Details</h2>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-1">
                                    Cancelled on: {new Date(purchase.cancelledAt).toLocaleString()}
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300">Reason: {purchase.cancelReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-card rounded-xl shadow-sm p-6 sticky top-4">
                            <h2 className="text-lg font-bold text-main mb-4">Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Subtotal:</span>
                                    <span className="font-medium">₹{purchase.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Item Discount:</span>
                                    <span className="font-medium">-₹{purchase.itemDiscount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Bill Discount:</span>
                                    <span className="font-medium">-₹{purchase.billDiscount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Shipping:</span>
                                    <span className="font-medium">₹{purchase.shippingCharges.toFixed(2)}</span>
                                </div>

                                {/* Tax Breakup */}
                                <div className="border-t pt-3">
                                    <p className="text-sm font-medium text-secondary mb-2">Tax Breakup:</p>
                                    {purchase.totalIGST > 0 ? (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-secondary">IGST:</span>
                                            <span className="font-medium">₹{purchase.totalIGST.toFixed(2)}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">CGST:</span>
                                                <span className="font-medium">₹{purchase.totalCGST.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">SGST:</span>
                                                <span className="font-medium">₹{purchase.totalSGST.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Round Off:</span>
                                    <span className="font-medium">₹{purchase.roundOff.toFixed(2)}</span>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-lg font-bold">Total:</span>
                                        <span className="text-2xl font-bold text-indigo-600">₹{purchase.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="border-t pt-3">
                                    <p className="text-sm font-medium text-secondary mb-2">Payment Details:</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">Method:</span>
                                        <span className="font-medium capitalize">{purchase.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">Paid Amount:</span>
                                        <span className="font-medium text-green-600">₹{purchase.paidAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">Outstanding:</span>
                                        <span className="font-medium text-red-600">₹{purchase.outstandingAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-secondary">Payment Status:</span>
                                        <span className="font-medium capitalize">{purchase.paymentStatus}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-bold text-main mb-4">Cancel Purchase</h3>
                            <p className="text-sm text-secondary mb-4">
                                Are you sure you want to cancel this purchase? This will reverse all inventory and accounting changes.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-secondary mb-1">Reason for Cancellation *</label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    placeholder="Enter reason for cancellation..."
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 px-4 py-2 border border-default text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Confirm Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PurchaseDetail;
