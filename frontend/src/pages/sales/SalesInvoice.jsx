import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import Modal from '../../components/Modal';

const SalesInvoice = () => {
    const [formData, setFormData] = useState({
        invoiceNo: 'INV-' + Date.now(),
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        customer: null,
        items: [{ name: '', quantity: 1, rate: 0, tax: 18, amount: 0 }],
        discount: 0,
        shippingCharges: 0,
        notes: '',
        termsAndConditions: ''
    });

    const [showCustomerModal, setShowCustomerModal] = useState(false);

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: '', quantity: 1, rate: 0, tax: 18, amount: 0 }]
        });
    };

    const removeItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        }

        setFormData({ ...formData, items: newItems });
    };

    const calculateSubtotal = () => {
        return formData.items.reduce((sum, item) => sum + item.amount, 0);
    };

    const calculateTax = () => {
        return formData.items.reduce((sum, item) => {
            return sum + (item.amount * item.tax / 100);
        }, 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() - formData.discount + formData.shippingCharges;
    };

    const handleSave = () => {
        console.log('Saving invoice:', formData);
        alert('Invoice saved successfully!');
    };

    return (
        <Layout>
            <PageHeader
                title="Sales Invoice"
                description="Create and manage sales invoices"
                actions={[
                    <button
                        key="save"
                        onClick={handleSave}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Save Invoice
                    </button>,
                    <button
                        key="print"
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        Print
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Details */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Invoice Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Invoice Number"
                                name="invoiceNo"
                                value={formData.invoiceNo}
                                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Invoice Date"
                                name="invoiceDate"
                                type="date"
                                value={formData.invoiceDate}
                                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Due Date"
                                name="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Customer Selection */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Customer</h2>
                            <button
                                onClick={() => setShowCustomerModal(true)}
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                                + Add Customer
                            </button>
                        </div>
                        {formData.customer ? (
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{formData.customer.name}</p>
                                        <p className="text-sm text-gray-600">{formData.customer.phone}</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, customer: null })}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCustomerModal(true)}
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition"
                            >
                                Click to select customer
                            </button>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Items</h2>
                            <button
                                onClick={addItem}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                + Add Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax %</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Item name"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={item.tax}
                                                    onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18">18%</option>
                                                    <option value="28">28%</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 font-medium">₹{item.amount.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                {formData.items.length > 1 && (
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Add any notes for the customer..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                                <textarea
                                    value={formData.termsAndConditions}
                                    onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Add terms and conditions..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax:</span>
                                <span className="font-medium">₹{calculateTax().toFixed(2)}</span>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Discount:</label>
                                <input
                                    type="number"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Shipping:</label>
                                <input
                                    type="number"
                                    value={formData.shippingCharges}
                                    onChange={(e) => setFormData({ ...formData, shippingCharges: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total:</span>
                                <span className="text-2xl font-bold text-indigo-600">₹{calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleSave}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                                Save Invoice
                            </button>
                            <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                                Save as Draft
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Modal */}
            <Modal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                title="Select Customer"
            >
                <p className="text-gray-600">Customer selection interface would go here...</p>
            </Modal>
        </Layout>
    );
};

export default SalesInvoice;
