import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const SalesOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showConvertDC, setShowConvertDC] = useState(false);
    const [showConvertInvoice, setShowConvertInvoice] = useState(false);
    const [dcItems, setDcItems] = useState([]);
    const [invoiceItems, setInvoiceItems] = useState([]);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/sales-orders/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrder(response.data);

            // Initialize DC items with deliverable quantities
            setDcItems(response.data.items.map(item => ({
                item: item.item._id,
                name: item.item.name,
                quantity: item.reservedQty - item.deliveredQty,
                maxQty: item.reservedQty - item.deliveredQty,
                unit: item.item.unit || 'pcs'
            })));

            // Initialize invoice items with invoiceable quantities
            setInvoiceItems(response.data.items.map(item => ({
                item: item.item._id,
                name: item.item.name,
                quantity: item.deliveredQty - item.invoicedQty,
                maxQty: item.deliveredQty - item.invoicedQty,
                rate: item.rate
            })));
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
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/sales-orders/${id}/cancel`,
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

    const handleConvertToDC = async () => {
        const itemsToDeliver = dcItems.filter(item => item.quantity > 0);

        if (itemsToDeliver.length === 0) {
            toast.error('Please select at least one item to deliver');
            return;
        }

        setActionLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/sales-orders/${id}/convert-to-dc`,
                {
                    items: itemsToDeliver.map(item => ({
                        item: item.item,
                        quantity: item.quantity,
                        unit: item.unit
                    })),
                    deliveryDate: new Date().toISOString()
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Delivery Challan created successfully');
            setShowConvertDC(false);
            fetchOrderDetails();
        } catch (error) {
            console.error('Error converting to DC:', error);
            toast.error(error.response?.data?.message || 'Failed to create Delivery Challan');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConvertToInvoice = async () => {
        const itemsToInvoice = invoiceItems.filter(item => item.quantity > 0);

        if (itemsToInvoice.length === 0) {
            toast.error('Please select at least one item to invoice');
            return;
        }

        setActionLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/sales-orders/${id}/convert-to-invoice`,
                {
                    items: itemsToInvoice.map(item => ({
                        item: item.item,
                        quantity: item.quantity
                    })),
                    discount: 0,
                    paidAmount: 0,
                    paymentMethod: 'due'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Invoice created successfully');
            setShowConvertInvoice(false);
            fetchOrderDetails();
        } catch (error) {
            console.error('Error converting to invoice:', error);
            toast.error(error.response?.data?.message || 'Failed to create invoice');
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

    const canConvertToDC = order.status === 'Confirmed' || order.status === 'Partially Delivered';
    const canConvertToInvoice = order.status === 'Delivered' || order.status === 'Partially Invoiced';
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
                                    onClick={() => setShowConvertDC(true)}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                                >
                                    Convert to Delivery Challan
                                </button>
                            )}
                            {canConvertToInvoice && (
                                <button
                                    onClick={() => setShowConvertInvoice(true)}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                                >
                                    Convert to Invoice
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

            {/* Convert to DC Modal */}
            {showConvertDC && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-default">
                            <h2 className="text-xl font-bold text-main">Convert to Delivery Challan</h2>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-96">
                            <table className="w-full">
                                <thead className="bg-surface border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Available</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Deliver Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {dcItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 font-medium text-main">{item.name}</td>
                                            <td className="px-4 py-3 text-secondary">{item.maxQty}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.maxQty}
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...dcItems];
                                                        newItems[index].quantity = Math.min(parseInt(e.target.value) || 0, item.maxQty);
                                                        setDcItems(newItems);
                                                    }}
                                                    className="w-24 px-2 py-1 border rounded"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-default flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConvertDC(false)}
                                className="px-6 py-2 border border-default text-secondary rounded-lg hover:bg-surface"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConvertToDC}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Creating...' : 'Create Delivery Challan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Convert to Invoice Modal */}
            {showConvertInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-default">
                            <h2 className="text-xl font-bold text-main">Convert to Invoice</h2>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-96">
                            <table className="w-full">
                                <thead className="bg-surface border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Available</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Invoice Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoiceItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 font-medium text-main">{item.name}</td>
                                            <td className="px-4 py-3 text-secondary">{item.maxQty}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.maxQty}
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...invoiceItems];
                                                        newItems[index].quantity = Math.min(parseInt(e.target.value) || 0, item.maxQty);
                                                        setInvoiceItems(newItems);
                                                    }}
                                                    className="w-24 px-2 py-1 border rounded"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 border-t border-default flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConvertInvoice(false)}
                                className="px-6 py-2 border border-default text-secondary rounded-lg hover:bg-surface"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConvertToInvoice}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Creating...' : 'Create Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default SalesOrderDetail;
