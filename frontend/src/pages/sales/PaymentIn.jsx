import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';
import CustomerSelectionModal from '../../components/CustomerSelectionModal';

const PaymentIn = () => {
    const navigate = useNavigate();
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [formData, setFormData] = useState({
        receiptNo: 'RCP-' + Date.now(),
        receiptDate: new Date().toISOString().split('T')[0],
        customer: null,
        paymentMethod: 'cash',
        amount: 0,
        invoices: [],
        notes: ''
    });

    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Sample outstanding invoices
    const outstandingInvoices = [
        { id: 1, invoiceNo: 'INV-001', date: '2024-01-15', total: 15000, paid: 5000, balance: 10000 },
        { id: 2, invoiceNo: 'INV-002', date: '2024-01-20', total: 25000, paid: 0, balance: 25000 },
        { id: 3, invoiceNo: 'INV-003', date: '2024-01-25', total: 8000, paid: 3000, balance: 5000 }
    ];

    const paymentMethods = [
        { value: 'cash', label: 'Cash', icon: '💵' },
        { value: 'upi', label: 'UPI', icon: '📱' },
        { value: 'card', label: 'Card', icon: '💳' },
        { value: 'cheque', label: 'Cheque', icon: '🏦' },
        { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏧' }
    ];

    const handleSave = () => {
        console.log('Saving payment:', formData);
        alert('Payment recorded successfully!');
    };

    return (
        <Layout>
            <PageHeader
                title="Payment In"
                description="Record customer payments and receipts"
                actions={[
                    <button key="save" onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Save Payment
                    </button>,
                    <button key="print" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Print Receipt
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Payment Details */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Receipt Number"
                                value={formData.receiptNo}
                                onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Receipt Date"
                                type="date"
                                value={formData.receiptDate}
                                onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Customer Selection */}
                    {/* Customer Selection */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Customer</h2>
                            {/* Add Customer button removed */}
                        </div>
                        {formData.customer ? (
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{formData.customer.name}</p>
                                        <p className="text-sm text-gray-600">{formData.customer.phone}</p>
                                        <p className="text-sm text-orange-600 font-medium mt-1">Outstanding: ₹{formData.customer.outstanding || 0}</p>
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
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition flex flex-col items-center justify-center gap-2"
                            >
                                <span className="font-medium">Click to select customer</span>
                                <span className="text-sm text-gray-400">Search by name, phone or email</span>
                            </button>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.value}
                                    onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                                    className={`p-4 border-2 rounded-lg transition ${formData.paymentMethod === method.value
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{method.icon}</div>
                                    <div className="text-sm font-medium text-gray-900">{method.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Outstanding Invoices */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Outstanding Invoices</h2>
                            <button
                                onClick={() => setShowInvoiceModal(true)}
                                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                            >
                                Select Invoices
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {outstandingInvoices.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td className="px-4 py-3 font-medium text-indigo-600">{invoice.invoiceNo}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{invoice.date}</td>
                                            <td className="px-4 py-3 font-medium">₹{invoice.total.toFixed(2)}</td>
                                            <td className="px-4 py-3 font-medium text-orange-600">₹{invoice.balance.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    className="w-32 px-3 py-1 border border-gray-300 rounded-lg"
                                                    placeholder="0.00"
                                                    max={invoice.balance}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Add any notes about this payment..."
                        />
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Outstanding:</span>
                                <span className="font-medium text-orange-600">₹40,000.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Amount Received:</span>
                                <span className="font-medium text-green-600">₹{formData.amount.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-3">
                                <div className="flex justify-between">
                                    <span className="font-medium">Remaining Balance:</span>
                                    <span className="text-lg font-bold text-gray-900">₹{(40000 - formData.amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleSave}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                Save Payment
                            </button>
                            <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Print Receipt
                            </button>
                            <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Email Receipt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <CustomerSelectionModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(customer) => setFormData({ ...formData, customer })}
            />
        </Layout>
    );
};

export default PaymentIn;
