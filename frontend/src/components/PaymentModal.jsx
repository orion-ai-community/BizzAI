import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const PaymentModal = ({ isOpen, onClose, onSubmit, documentType, totalAmount, paidAmount }) => {
    const [bankAccounts, setBankAccounts] = useState([]);
    const [formData, setFormData] = useState({
        paidAmount: totalAmount - paidAmount,
        paymentMethod: 'cash',
        bankAccount: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBankAccounts = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem('user'));
                const token = userData?.token;
                console.log('PaymentModal: Fetching bank accounts...');
                console.log('API URL:', `${import.meta.env.VITE_BACKEND_URL}/api/cashbank/accounts`);

                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/cashbank/accounts`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                console.log('Payment modal - bank accounts response:', response.data);
                console.log('Number of accounts:', response.data?.length);

                if (!response.data || response.data.length === 0) {
                    console.warn('No bank accounts found!');
                    alert('No bank accounts found. Please create a bank account first.');
                }

                setBankAccounts(response.data || []);
            } catch (error) {
                console.error('Error fetching bank accounts:', error);
                console.error('Error details:', error.response?.data);
                alert(`Failed to load bank accounts: ${error.response?.data?.message || error.message}`);
            }
        };

        if (isOpen) {
            fetchBankAccounts();
            setFormData({
                paidAmount: totalAmount - paidAmount,
                paymentMethod: 'cash',
                bankAccount: ''
            });
        }
    }, [isOpen, totalAmount, paidAmount]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.paymentMethod === 'bank_transfer' && !formData.bankAccount) {
            alert('Please select a bank account');
            return;
        }

        setLoading(true);
        onSubmit(formData);
    };

    const remainingAmount = totalAmount - paidAmount;
    const selectedAccount = bankAccounts.find(a => a._id === formData.bankAccount);
    const hasInsufficientBalance = selectedAccount && selectedAccount.currentBalance < formData.paidAmount;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment - ${documentType}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">Total Amount:</span>
                        <span className="font-bold text-gray-900">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">Already Paid:</span>
                        <span className="font-bold text-green-600">₹{paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                        <span className="text-gray-800 font-semibold">Remaining:</span>
                        <span className="font-bold text-red-600 text-lg">₹{remainingAmount.toFixed(2)}</span>
                    </div>
                </div>

                {/* Payment Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={remainingAmount}
                        value={formData.paidAmount}
                        onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum: ₹{remainingAmount.toFixed(2)}</p>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value, bankAccount: '' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="cheque">Cheque</option>
                    </select>
                </div>

                {/* Bank Account Selection */}
                {formData.paymentMethod === 'bank_transfer' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Bank Account <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.bankAccount}
                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        >
                            <option value="">Choose Bank Account</option>
                            {bankAccounts.map(acc => (
                                <option key={acc._id} value={acc._id}>
                                    {acc.bankName} - ****{acc.accountNumber.slice(-4)}
                                    {' '}(Balance: ₹{acc.currentBalance.toFixed(2)})
                                </option>
                            ))}
                        </select>

                        {/* Insufficient Balance Warning */}
                        {hasInsufficientBalance && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-red-800 font-medium text-sm">Insufficient Balance!</p>
                                    <p className="text-red-700 text-sm">
                                        Available: ₹{selectedAccount.currentBalance.toFixed(2)} |
                                        Required: ₹{formData.paidAmount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={loading || hasInsufficientBalance}
                    >
                        {loading ? 'Processing...' : 'Record Payment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PaymentModal;
