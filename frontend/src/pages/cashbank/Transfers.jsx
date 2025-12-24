import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { getAccounts, createTransfer, reset, getCashBankPosition } from '../../redux/slices/cashbankSlice';

const Transfers = () => {
    const [formData, setFormData] = useState({
        fromAccount: '',
        toAccount: '',
        amount: 0,
        description: ''
    });
    const [hasShownToast, setHasShownToast] = useState(false);

    const dispatch = useDispatch();
    const location = useLocation();
    const { accounts, isLoading, isTransferSuccess, position } = useSelector(state => state.cashbank);

    useEffect(() => {
        dispatch(getAccounts());
        dispatch(getCashBankPosition());
        if (location.state?.fromAccount) {
            setFormData(prev => ({ ...prev, fromAccount: location.state.fromAccount }));
        }
        if (location.state?.toAccount) {
            setFormData(prev => ({ ...prev, toAccount: location.state.toAccount }));
        }
    }, [dispatch, location.state]);

    useEffect(() => {
        if (isTransferSuccess && !hasShownToast) {
            setHasShownToast(true);
            setFormData({
                fromAccount: '',
                toAccount: '',
                amount: 0,
                description: ''
            });
            dispatch(getAccounts());
            dispatch(getCashBankPosition());
        }
        if (!isTransferSuccess && hasShownToast) {
            setHasShownToast(false);
        }
        dispatch(reset());
    }, [isTransferSuccess, dispatch, hasShownToast]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.fromAccount === formData.toAccount) {
            return;
        }
        dispatch(createTransfer(formData));
    };

    const accountOptions = [
        ...accounts.map(acc => ({
            value: acc._id,
            label: `${acc.bankName} - ${acc.accountType} (₹${acc.currentBalance.toLocaleString()})`
        })),
        { value: 'cash', label: `Cash in Hand (₹${position?.cashInHand?.toLocaleString() || 0})` }
    ];

    const selectedFrom = accountOptions.find(opt => opt.value === formData.fromAccount);
    const selectedTo = accountOptions.find(opt => opt.value === formData.toAccount);

    // Dynamic balance check
    const fromBalance = formData.fromAccount === 'cash'
        ? (position?.cashInHand || 0)
        : (accounts.find(acc => acc._id === formData.fromAccount)?.currentBalance || 0);

    const insufficientBalance = formData.amount > fromBalance;

    return (
        <Layout>
            <PageHeader title="Transfers" description="Transfer money between accounts" />

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Transfer Visualization */}
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center animate-slide-down">New Transfer</h2>

                        <div className="flex items-center justify-between mb-8">
                            {/* From Account */}
                            <div className="flex-1 max-w-sm group">
                                <label className="block text-sm font-medium text-gray-700 mb-3 transition-colors group-hover:text-indigo-600">From Account</label>
                                <div className="relative transform transition-all duration-200 group-hover:scale-105">
                                    <select
                                        value={formData.fromAccount}
                                        onChange={(e) => setFormData({ ...formData, fromAccount: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:shadow-lg appearance-none bg-white transition-all duration-200"
                                        required
                                    >
                                        <option value="">Select source account</option>
                                        {accountOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {formData.fromAccount && (
                                    <div className={`mt-3 p-3 rounded-lg transform transition-all duration-300 animate-fade-in ${insufficientBalance ? 'bg-red-50' : 'bg-gray-50'}`}>
                                        <div className="flex items-center">
                                            <span className={`text-sm font-medium ${insufficientBalance ? 'text-red-700' : 'text-gray-700'}`}>Available Balance:</span>
                                        </div>
                                        <p className={`text-lg font-bold ${insufficientBalance ? 'text-red-600' : 'text-green-600'}`}>₹{fromBalance.toLocaleString()}</p>
                                        {insufficientBalance && (
                                            <p className="text-xs text-red-500 mt-1 font-medium">Insufficient funds for this transfer</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Transfer Arrow */}
                            <div className="flex-shrink-0 mx-6">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${formData.fromAccount && formData.toAccount ? 'bg-indigo-600 text-white animate-bounce' : 'bg-gray-100 text-gray-400'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </div>

                            {/* To Account */}
                            <div className="flex-1 max-w-sm group">
                                <label className="block text-sm font-medium text-gray-700 mb-3 transition-colors group-hover:text-indigo-600">To Account</label>
                                <div className="relative transform transition-all duration-200 group-hover:scale-105">
                                    <select
                                        value={formData.toAccount}
                                        onChange={(e) => setFormData({ ...formData, toAccount: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:shadow-lg appearance-none bg-white transition-all duration-200"
                                        required
                                    >
                                        <option value="">Select destination account</option>
                                        {accountOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                {selectedTo && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg transform transition-all duration-300 animate-fade-in">
                                        <span className="text-sm font-medium text-gray-700">Current Balance:</span>
                                        <p className="text-lg font-bold text-blue-600">₹{
                                            formData.toAccount === 'cash'
                                                ? (position?.cashInHand || 0).toLocaleString()
                                                : (accounts.find(acc => acc._id === formData.toAccount)?.currentBalance || 0).toLocaleString()
                                        }</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Amount Section */}
                        <div className="border-t pt-6">
                            <div className="max-w-xs mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Transfer Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">₹</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className={`block w-full pl-7 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:shadow-lg text-center text-xl font-bold transition-all duration-200 ${insufficientBalance ? 'border-red-300 bg-red-50 text-red-900' : 'border-gray-300'}`}
                                        placeholder="0.00"
                                        required
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="border-t pt-6">
                            <div className="max-w-md mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                    placeholder="Add a note for this transfer..."
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="border-t pt-6 flex justify-center">
                            <button
                                type="submit"
                                disabled={isLoading || !formData.fromAccount || !formData.toAccount || formData.amount <= 0 || insufficientBalance || formData.fromAccount === formData.toAccount}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing Transfer...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        {insufficientBalance ? 'Insufficient Balance' : 'Transfer Money'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default Transfers;