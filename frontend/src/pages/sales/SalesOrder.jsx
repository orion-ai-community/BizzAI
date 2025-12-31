import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import CustomerSelectionModal from '../../components/CustomerSelectionModal';
import ItemSelectionModal from '../../components/ItemSelectionModal';

const SalesOrder = () => {
    const navigate = useNavigate();
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        customer: null,
        items: [],
        discount: 0,
        notes: ''
    });

    const addItemFromModal = (item) => {
        const existingIndex = formData.items.findIndex(i => i.item === item._id);

        if (existingIndex >= 0) {
            // Update quantity if item already exists
            const newItems = [...formData.items];
            newItems[existingIndex].quantity += item.quantity;
            setFormData({ ...formData, items: newItems });
        } else {
            // Add new item
            setFormData({
                ...formData,
                items: [...formData.items, {
                    item: item._id,
                    name: item.name,
                    quantity: item.quantity,
                    rate: item.sellingPrice,
                    tax: 18,
                    discount: 0,
                    availableStock: item.stockQty - (item.reservedStock || 0)
                }]
            });
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const calculateItemTotal = (item) => {
        const subtotal = item.quantity * item.rate;
        const taxAmount = (subtotal * item.tax) / 100;
        return subtotal + taxAmount - item.discount;
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    };

    const calculateTax = () => {
        return formData.items.reduce((sum, item) => {
            const subtotal = item.quantity * item.rate;
            return sum + (subtotal * item.tax / 100);
        }, 0);
    };

    const calculateItemDiscount = () => {
        return formData.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() - calculateItemDiscount() - formData.discount;
    };

    const validateForm = () => {
        if (!formData.customer) {
            toast.error('Please select a customer');
            return false;
        }

        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return false;
        }

        if (!formData.expectedDeliveryDate) {
            toast.error('Please select expected delivery date');
            return false;
        }

        // Validate stock availability
        for (const item of formData.items) {
            if (item.quantity > item.availableStock) {
                toast.error(`Insufficient available stock for ${item.name}. Available: ${item.availableStock}`);
                return false;
            }
        }

        return true;
    };

    const handleSaveDraft = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;
            const payload = {
                customerId: formData.customer._id,
                orderDate: formData.orderDate,
                expectedDeliveryDate: formData.expectedDeliveryDate,
                items: formData.items.map(item => ({
                    item: item.item,
                    quantity: item.quantity,
                    rate: item.rate,
                    tax: item.tax,
                    discount: item.discount
                })),
                discount: formData.discount,
                notes: formData.notes
            };

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/sales-orders`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Sales Order saved as draft successfully!');
            navigate('/sales/sales-order-list');
        } catch (error) {
            console.error('Error saving sales order:', error);
            toast.error(error.response?.data?.message || 'Failed to save sales order');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = user?.token;

            // First create the order
            const payload = {
                customerId: formData.customer._id,
                orderDate: formData.orderDate,
                expectedDeliveryDate: formData.expectedDeliveryDate,
                items: formData.items.map(item => ({
                    item: item.item,
                    quantity: item.quantity,
                    rate: item.rate,
                    tax: item.tax,
                    discount: item.discount
                })),
                discount: formData.discount,
                notes: formData.notes
            };

            const createResponse = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/sales-orders`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const orderId = createResponse.data.salesOrder._id;

            // Then confirm it
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/sales-orders/${orderId}/confirm`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Sales Order confirmed successfully! Stock reserved.');
            navigate('/sales/sales-order-list');
        } catch (error) {
            console.error('Error confirming sales order:', error);
            toast.error(error.response?.data?.message || 'Failed to confirm sales order');
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = [
        { value: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
        { value: 'Confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
        { value: 'Partially Delivered', label: 'Partially Delivered', color: 'bg-purple-100 text-purple-800' },
        { value: 'Delivered', label: 'Delivered', color: 'bg-indigo-100 text-indigo-800' },
        { value: 'Partially Invoiced', label: 'Partially Invoiced', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'Invoiced', label: 'Invoiced', color: 'bg-green-100 text-green-800' },
        { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    ];

    return (
        <Layout>
            <PageHeader
                title="Sales Order"
                description="Create and manage sales orders"
                actions={[
                    <button
                        key="list"
                        onClick={() => navigate('/sales/sales-order-list')}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        View Orders
                    </button>,
                    <button
                        key="save"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save as Draft'}
                    </button>,
                    <button
                        key="confirm"
                        onClick={handleConfirmOrder}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Confirm Order'}
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Order Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Order Date"
                                type="date"
                                value={formData.orderDate}
                                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Expected Delivery Date"
                                type="date"
                                value={formData.expectedDeliveryDate}
                                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-main">Customer</h2>
                        </div>
                        {formData.customer ? (
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-main">{formData.customer.name}</p>
                                        <p className="text-sm text-secondary">{formData.customer.phone}</p>
                                        {formData.customer.email && (
                                            <p className="text-sm text-secondary">{formData.customer.email}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, customer: null })}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCustomerModal(true)}
                                className="w-full px-4 py-3 border-2 border-dashed border-default rounded-lg text-secondary hover:border-indigo-500 hover:text-indigo-600 transition flex flex-col items-center justify-center gap-2"
                            >
                                <span className="font-medium">Click to select customer</span>
                                <span className="text-sm text-muted">Search by name, phone or email</span>
                            </button>
                        )}
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-main">Items</h2>
                            <button
                                onClick={() => setShowItemModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                + Add Item
                            </button>
                        </div>
                        {formData.items.length === 0 ? (
                            <div className="text-center py-8 text-secondary">
                                No items added. Click "Add Item" to select from inventory.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Item</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Qty</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Rate</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Tax %</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Disc</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Total</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {formData.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="font-medium text-main">{item.name}</div>
                                                        <div className="text-xs text-muted">Available: {item.availableStock}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-20 px-2 py-1 border rounded"
                                                        min="1"
                                                        max={item.availableStock}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                        className="w-24 px-2 py-1 border rounded"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        value={item.tax}
                                                        onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                                                        className="w-20 px-2 py-1 border rounded"
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="5">5%</option>
                                                        <option value="12">12%</option>
                                                        <option value="18">18%</option>
                                                        <option value="28">28%</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={item.discount}
                                                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                        className="w-20 px-2 py-1 border rounded"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 font-medium">₹{calculateItemTotal(item).toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Order Notes</h2>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Add notes..."
                        />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-main mb-4">Order Summary</h2>
                        <div className="mb-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                Draft
                            </span>
                        </div>
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Subtotal:</span>
                                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Tax:</span>
                                <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Item Discount:</span>
                                <span className="font-medium">₹{calculateItemDiscount().toFixed(2)}</span>
                            </div>
                            <div>
                                <label className="block text-sm text-secondary mb-1">Order Discount:</label>
                                <input
                                    type="number"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">Total:</span>
                                <span className="text-2xl font-bold text-indigo-600">₹{calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleConfirmOrder}
                                disabled={loading}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Confirm Order'}
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save as Draft'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CustomerSelectionModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(customer) => {
                    setFormData({ ...formData, customer });
                    setShowCustomerModal(false);
                }}
            />

            <ItemSelectionModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                onSelect={addItemFromModal}
            />
        </Layout>
    );
};

export default SalesOrder;
