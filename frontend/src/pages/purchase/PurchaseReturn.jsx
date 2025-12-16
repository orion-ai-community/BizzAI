import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import SupplierSelectionModal from '../../components/SupplierSelectionModal';

const PurchaseReturn = () => {
    const [formData, setFormData] = useState({
        debitNoteNo: 'DN-' + Date.now(),
        debitNoteDate: new Date().toISOString().split('T')[0],
        originalPurchase: null,
        supplier: null,
        items: [{ name: '', quantity: 1, rate: 0, tax: 18, amount: 0, reason: '' }],
        refundMethod: 'credit',
        discount: 0,
        notes: ''
    });
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    const addItem = () => setFormData({ ...formData, items: [...formData.items, { name: '', quantity: 1, rate: 0, tax: 18, amount: 0, reason: '' }] });
    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'rate') newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        setFormData({ ...formData, items: newItems });
    };

    const calculateSubtotal = () => formData.items.reduce((sum, item) => sum + item.amount, 0);
    const calculateTax = () => formData.items.reduce((sum, item) => sum + (item.amount * item.tax / 100), 0);
    const calculateTotal = () => calculateSubtotal() + calculateTax() - formData.discount;

    const returnReasons = ['Damaged Product', 'Wrong Item', 'Quality Issue', 'Expired Product', 'Other'];

    return (
        <Layout>
            <PageHeader title="Purchase Return / Debit Note" description="Process returns to suppliers" actions={[
                <button key="save" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Debit Note</button>,
                <button key="print" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Print</button>
            ]} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Debit Note Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Debit Note Number" value={formData.debitNoteNo} onChange={(e) => setFormData({ ...formData, debitNoteNo: e.target.value })} required />
                            <FormInput label="Debit Note Date" type="date" value={formData.debitNoteDate} onChange={(e) => setFormData({ ...formData, debitNoteDate: e.target.value })} required />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Original Purchase</h2>
                        <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600">
                            Click to select original purchase
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Supplier</h2>
                        {formData.supplier ? (
                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{formData.supplier.businessName}</p>
                                        <p className="text-sm text-gray-600">{formData.supplier.contactPersonName}</p>
                                        <p className="text-sm text-gray-600">{formData.supplier.contactNo}</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, supplier: null })}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowSupplierModal(true)}
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                            >
                                Click to select supplier
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Return Items</h2>
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
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
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
                                            <td className="px-4 py-3">
                                                <select value={item.reason} onChange={(e) => updateItem(index, 'reason', e.target.value)} className="w-40 px-2 py-1 border rounded">
                                                    <option value="">Select reason</option>
                                                    {returnReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Refund Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['credit', 'cash', 'bank_transfer', 'adjust_next_bill'].map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setFormData({ ...formData, refundMethod: method })}
                                            className={`p-3 border-2 rounded-lg transition ${formData.refundMethod === method ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                                        >
                                            <div className="text-sm font-medium text-gray-900 capitalize">{method.replace('_', ' ')}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className="w-full px-4 py-2 border rounded-lg" placeholder="Add notes..." />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Return Summary</h2>
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
                        <div className="border-t pt-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">Refund Amount:</span>
                                <span className="text-2xl font-bold text-green-600">₹{calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save Debit Note</button>
                            <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Print Debit Note</button>
                        </div>
                    </div>
                </div>
            </div>

            <SupplierSelectionModal
                isOpen={showSupplierModal}
                onClose={() => setShowSupplierModal(false)}
                onSelectSupplier={(supplier) => setFormData({ ...formData, supplier })}
            />
        </Layout>
    );
};

export default PurchaseReturn;
