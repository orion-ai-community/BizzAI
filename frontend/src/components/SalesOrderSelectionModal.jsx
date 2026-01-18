import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import api from '../services/api';

const SalesOrderSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const { user } = useSelector((state) => state.auth);
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchOrders();
        }
    }, [isOpen]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get(
                `/api/sales-orders`,
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            
            // Filter only Confirmed orders that are not fully delivered
            const availableOrders = response.data.filter(order => 
                order.status === 'Confirmed' || 
                order.status === 'Partially Delivered'
            );
            
            setOrders(availableOrders);
        } catch (error) {
            console.error('Error fetching sales orders:', error);
            alert(`Failed to load sales orders: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (order) => {
        onSelect(order);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-default">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-main">Select Sales Order</h2>
                        <button
                            onClick={onClose}
                            className="text-muted hover:text-main transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by order number or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="p-6 overflow-y-auto max-h-96">
                    {loading ? (
                        <div className="text-center py-8 text-secondary">Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-8 text-secondary">
                            No confirmed sales orders available
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredOrders.map((order) => (
                                <div
                                    key={order._id}
                                    onClick={() => handleSelect(order)}
                                    className="p-4 border border-default rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-indigo-600 text-lg">
                                                    {order.orderNumber}
                                                </h3>
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                    order.status === 'Confirmed' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted">Customer:</span>
                                                    <span className="ml-2 font-medium text-main">
                                                        {order.customer?.name || 'N/A'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted">Order Date:</span>
                                                    <span className="ml-2 font-medium text-main">
                                                        {new Date(order.orderDate).toLocaleDateString('en-IN')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted">Items:</span>
                                                    <span className="ml-2 font-medium text-main">
                                                        {order.items.length}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted">Total Amount:</span>
                                                    <span className="ml-2 font-medium text-main">
                                                        ₹{order.totalAmount.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

SalesOrderSelectionModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
};

export default SalesOrderSelectionModal;
