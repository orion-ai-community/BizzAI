import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const SalesOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const response = await api.get(
                `/api/sales-orders/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrder(response.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to fetch order details');
            navigate('/sales/sales-order-list');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm('Are you sure you want to cancel this order? Reserved stock will be released.')) {
            return;
        }

        setActionLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            await api.post(
                `/api/sales-orders/${id}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Sales Order cancelled successfully');
            fetchOrderDetails();
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Draft': 'bg-gray-100 text-gray-800',
            'Confirmed': 'bg-blue-100 text-blue-800',
            'Partially Delivered': 'bg-purple-100 text-purple-800',
            'Delivered': 'bg-indigo-100 text-indigo-800',
            'Partially Invoiced': 'bg-yellow-100 text-yellow-800',
            'Invoiced': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <Layout>
                <div className="text-center py-12 text-secondary">Loading order details...</div>
            </Layout>
        );
    }

    if (!order) {
        return (
            <Layout>
                <div className="text-center py-12 text-secondary">Order not found</div>
            </Layout>
        );
    }

    const hasItemsToDeliver = order?.items?.some(item =>
        (item.reservedQty - item.deliveredQty) > 0
    );

    const canConvertToDC = hasItemsToDeliver && (order.status === 'Confirmed' || order.status === 'Partially Delivered');
    const canCancel = order.status !== 'Cancelled' && order.status !== 'Invoiced';

    return (
        <Layout>
            <PageHeader
                title={`Sales Order: ${order.orderNumber}`}
                description={`Status: ${order.status}`}
                actions={[
                    <button
                        key="back"
                        onClick={() => navigate('/sales/sales-order-list')}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Back to List
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Header */}
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-main">Order Information</h2>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-secondary">Order Number</p>
                                <p className="font-medium text-main">{order.orderNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Order Date</p>
                                <p className="font-medium text-main">{new Date(order.orderDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Expected Delivery</p>
                                <p className="font-medium text-main">
                                    {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                                    {order.isOverdue && <span className="ml-2 text-xs text-red-600 font-medium">OVERDUE</span>}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Created By</p>
                                <p className="font-medium text-main">{order.createdBy?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Customer Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-secondary">Name</p>
                                <p className="font-medium text-main">{order.customer?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary">Phone</p>
                                <p className="font-medium text-main">{order.customer?.phone}</p>
                            </div>
                            {order.customer?.email && (
                                <div>
                                    <p className="text-sm text-secondary">Email</p>
                                    <p className="font-medium text-main">{order.customer.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Order Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Rate</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Tax</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Reserved</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Delivered</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Invoiced</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 font-medium text-main">{item.item?.name}</td>
                                            <td className="px-4 py-3">{item.quantity}</td>
                                            <td className="px-4 py-3">₹{item.rate}</td>
                                            <td className="px-4 py-3">{item.tax}%</td>
                                            <td className="px-4 py-3 text-blue-600">{item.reservedQty}</td>
                                            <td className="px-4 py-3 text-purple-600">{item.deliveredQty}</td>
                                            <td className="px-4 py-3 text-green-600">{item.invoicedQty}</td>
                                            <td className="px-4 py-3 font-medium">₹{item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Notes</h2>
                            <p className="text-secondary">{order.notes}</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {/* Summary */}
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Order Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Subtotal:</span>
                                <span className="font-medium">₹{order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Tax:</span>
                                <span className="font-medium">₹{order.taxTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Discount:</span>
                                <span className="font-medium">₹{order.discountTotal.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">Total:</span>
                                    <span className="text-2xl font-bold text-indigo-600">₹{order.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Actions</h2>
                        <div className="space-y-3">
                            {canConvertToDC && (
                                <button
                                    onClick={() => navigate(`/sales/delivery-challan?salesOrderId=${order._id}`)}
                                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                                >
                                    Create Delivery Challan
                                </button>
                            )}
                            {canCancel && (
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Conversion History */}
                    {(order.deliveryChallans?.length > 0 || order.invoices?.length > 0) && (
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Conversion History</h2>
                            {order.deliveryChallans?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-secondary mb-2">Delivery Challans</p>
                                    <div className="space-y-1">
                                        {order.deliveryChallans.map((dc, index) => (
                                            <p key={index} className="text-sm text-main">{dc.challanNumber || `DC #${index + 1}`}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {order.invoices?.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-secondary mb-2">Invoices</p>
                                    <div className="space-y-1">
                                        {order.invoices.map((inv, index) => (
                                            <p key={index} className="text-sm text-main">{inv.invoiceNo || `Invoice #${index + 1}`}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SalesOrderDetail;
