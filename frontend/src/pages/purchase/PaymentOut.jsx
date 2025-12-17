import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import SupplierSelectionModal from '../../components/SupplierSelectionModal';

const PaymentOut = () => {
    const [formData, setFormData] = useState({
        paymentNo: 'PAY-' + Date.now(),
        paymentDate: new Date().toISOString().split('T')[0],
        supplier: null,
        paymentMethod: 'cash',
        amount: 0,
        notes: ''
    });
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    const paymentMethods = [
        { value: 'cash', label: 'Cash', icon: '💵' },
        { value: 'upi', label: 'UPI', icon: '📱' },
        { value: 'card', label: 'Card', icon: '💳' },
        { value: 'cheque', label: 'Cheque', icon: '🏦' },
        { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏧' }
    ];

    return (
        <Layout>
            <PageHeader title="Payment Out" description="Record payments to suppliers" actions={[
                <button key="save" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Payment</button>,
                <button key="print" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Print Receipt</button>
            ]} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Payment Number" value={formData.paymentNo} onChange={(e) => setFormData({ ...formData, paymentNo: e.target.value })} required />
                            <FormInput label="Payment Date" type="date" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} required />
                        </div>
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
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.value}
                                    onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                                    className={`p-4 border-2 rounded-lg transition ${formData.paymentMethod === method.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                                >
                                    <div className="text-3xl mb-2">{method.icon}</div>
                                    <div className="text-sm font-medium text-gray-900">{method.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
                        <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className="w-full px-4 py-2 border rounded-lg" placeholder="Add notes..." />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₹</span>
                                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full pl-8 pr-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg" placeholder="0.00" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save Payment</button>
                            <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Print Receipt</button>
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

export default PaymentOut;
