import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import CustomerSelectionModal from '../../components/CustomerSelectionModal';

const Estimate = () => {
    const navigate = useNavigate();
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [formData, setFormData] = useState({
        estimateNo: 'EST-' + Date.now(),
        estimateDate: new Date().toISOString().split('T')[0],
        validUntil: '',
        customer: null,
        items: [{ name: '', quantity: 1, rate: 0, tax: 18, amount: 0 }],
        discount: 0,
        notes: '',
        termsAndConditions: 'This quotation is valid for 30 days from the date of issue.'
    });

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: '', quantity: 1, rate: 0, tax: 18, amount: 0 }]
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

    const calculateSubtotal = () => formData.items.reduce((sum, item) => sum + item.amount, 0);
    const calculateTax = () => formData.items.reduce((sum, item) => sum + (item.amount * item.tax / 100), 0);
    const calculateTotal = () => calculateSubtotal() + calculateTax() - formData.discount;

    return (
        <Layout>
            <PageHeader
                title="Estimate / Quotation"
                description="Create professional quotations for customers"
                actions={[
                    <button key="convert" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Convert to Invoice
                    </button>,
                    <button key="save" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Save Estimate
                    </button>,
                    <button key="print" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Print
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Estimate Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Estimate Number" value={formData.estimateNo} onChange={(e) => setFormData({ ...formData, estimateNo: e.target.value })} required />
                            <FormInput label="Estimate Date" type="date" value={formData.estimateDate} onChange={(e) => setFormData({ ...formData, estimateDate: e.target.value })} required />
                            <FormInput label="Valid Until" type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Customer</h2>
                        </div>
                        {formData.customer ? (
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{formData.customer.name}</p>
                                        <p className="text-sm text-gray-600">{formData.customer.phone}</p>
                                        <p className="text-sm text-gray-600">{formData.customer.email}</p>
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
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition flex flex-col items-center justify-center gap-2"
                            >
                                <span className="font-medium">Click to select customer</span>
                                <span className="text-sm text-gray-400">Search by name, phone or email</span>
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Items</h2>
                            <button onClick={addItem} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Add Item</button>
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3"><input type="text" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Item name" /></td>
                                            <td className="px-4 py-3"><input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" /></td>
                                            <td className="px-4 py-3"><input type="number" value={item.rate} onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded" /></td>
                                            <td className="px-4 py-3">
                                                <select value={item.tax} onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value))} className="w-20 px-2 py-1 border rounded">
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18">18%</option>
                                                    <option value="28">28%</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 font-medium">₹{item.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className="w-full px-4 py-2 border rounded-lg" placeholder="Add notes..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                                <textarea value={formData.termsAndConditions} onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })} rows="3" className="w-full px-4 py-2 border rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>

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
                                <input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">Total:</span>
                                <span className="text-2xl font-bold text-indigo-600">₹{calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Convert to Invoice</button>
                            <button className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save Estimate</button>
                        </div>
                    </div>
                </div>
            </div>

            <CustomerSelectionModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(customer) => setFormData({ ...formData, customer })}
            />
        </Layout >
    );
};

export default Estimate;
