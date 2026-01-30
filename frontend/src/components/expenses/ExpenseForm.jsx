import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiX, FiAlertCircle, FiUpload, FiTrash2 } from 'react-icons/fi';
import { createExpense, updateExpense, clearBudgetWarnings } from '../../redux/slices/expenseSlice';
import { getAccounts } from '../../redux/slices/cashbankSlice';

const ExpenseForm = ({ expense, categories, onClose }) => {
    const dispatch = useDispatch();
    const { isLoading, budgetWarnings } = useSelector((state) => state.expense);
    const { accounts } = useSelector((state) => state.cashbank);

    const [formData, setFormData] = useState({
        date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: expense?.category || '',
        description: expense?.description || '',
        amount: expense?.amount || '',
        paymentMethod: expense?.paymentMethod || 'cash',
        bankAccount: expense?.bankAccount?._id || '',
        referenceNumber: expense?.referenceNumber || '',
        status: expense?.status || 'Paid',
        notes: expense?.notes || '',
        attachments: expense?.attachments || [],
    });

    const [errors, setErrors] = useState({});
    const [showBudgetWarning, setShowBudgetWarning] = useState(false);

    useEffect(() => {
        dispatch(getAccounts());
        return () => {
            dispatch(clearBudgetWarnings());
        };
    }, [dispatch]);

    useEffect(() => {
        if (budgetWarnings && budgetWarnings.length > 0) {
            setShowBudgetWarning(true);
        }
    }, [budgetWarnings]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }

        // Clear bank account if payment method is cash
        if (name === 'paymentMethod' && value === 'cash') {
            setFormData({ ...formData, [name]: value, bankAccount: '', referenceNumber: '' });
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        // In production, upload to cloud storage and get URLs
        // For now, we'll just store file names
        const fileNames = files.map(file => file.name);
        setFormData({ ...formData, attachments: [...formData.attachments, ...fileNames] });
    };

    const removeAttachment = (index) => {
        const newAttachments = formData.attachments.filter((_, i) => i !== index);
        setFormData({ ...formData, attachments: newAttachments });
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else if (new Date(formData.date) > new Date()) {
            newErrors.date = 'Date cannot be in the future';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        if (!formData.description || formData.description.trim() === '') {
            newErrors.description = 'Description is required';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        if (['upi', 'card', 'cheque', 'bank_transfer'].includes(formData.paymentMethod) && !formData.bankAccount) {
            newErrors.bankAccount = `Bank account is required for ${formData.paymentMethod} payment`;
        }

        if (formData.paymentMethod === 'cheque' && (!formData.referenceNumber || formData.referenceNumber.trim() === '')) {
            newErrors.referenceNumber = 'Cheque number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        const expenseData = {
            ...formData,
            amount: parseFloat(formData.amount),
            bankAccount: formData.bankAccount || undefined,
            referenceNumber: formData.referenceNumber || undefined,
        };

        try {
            if (expense) {
                await dispatch(updateExpense({ id: expense._id, expenseData })).unwrap();
                toast.success('Expense updated successfully');
            } else {
                await dispatch(createExpense(expenseData)).unwrap();
                toast.success('Expense created successfully');
            }
            onClose(true);
        } catch (error) {
            toast.error(error || 'Failed to save expense');
        }
    };

    const paymentMethods = [
        { value: 'cash', label: 'Cash' },
        { value: 'upi', label: 'UPI' },
        { value: 'card', label: 'Card' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
    ];

    const statuses = [
        { value: 'Paid', label: 'Paid' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Cancelled', label: 'Cancelled' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {expense ? 'Edit Expense' : 'Add New Expense'}
                    </h2>
                    <button
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Budget Warnings */}
                {showBudgetWarning && budgetWarnings && budgetWarnings.length > 0 && (
                    <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-yellow-800 mb-2">Budget Warning</h3>
                                <ul className="space-y-1">
                                    {budgetWarnings.map((warning, index) => (
                                        <li key={index} className="text-sm text-yellow-700">
                                            • {warning.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button
                                onClick={() => setShowBudgetWarning(false)}
                                className="text-yellow-600 hover:text-yellow-800"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Row 1: Date, Category, Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                max={new Date().toISOString().split('T')[0]}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.category ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat.name}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                {statuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="e.g., Office rent for January 2026"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    </div>

                    {/* Row 3: Amount, Payment Method */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.amount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                {paymentMethods.map((method) => (
                                    <option key={method.value} value={method.value}>
                                        {method.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 4: Bank Account & Reference Number (conditional) */}
                    {formData.paymentMethod !== 'cash' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Account <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="bankAccount"
                                    value={formData.bankAccount}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.bankAccount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Select Bank Account</option>
                                    {accounts?.map((acc) => (
                                        <option key={acc._id} value={acc._id}>
                                            {acc.bankName} - {acc.accountType} (₹{acc.currentBalance.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                                {errors.bankAccount && <p className="mt-1 text-xs text-red-500">{errors.bankAccount}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reference Number {formData.paymentMethod === 'cheque' && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="text"
                                    name="referenceNumber"
                                    value={formData.referenceNumber}
                                    onChange={handleChange}
                                    placeholder={
                                        formData.paymentMethod === 'cheque'
                                            ? 'Cheque number'
                                            : formData.paymentMethod === 'upi'
                                                ? 'UPI transaction ID'
                                                : 'Transaction reference'
                                    }
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.referenceNumber ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.referenceNumber && <p className="mt-1 text-xs text-red-500">{errors.referenceNumber}</p>}
                            </div>
                        </div>
                    )}

                    {/* Row 5: Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Add any additional notes..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Row 6: Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                        <div className="space-y-2">
                            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                                <FiUpload className="w-5 h-5 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">Click to upload files</span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                            </label>

                            {formData.attachments.length > 0 && (
                                <div className="space-y-2">
                                    {formData.attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                                        >
                                            <span className="text-sm text-gray-700 truncate">{file}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="text-red-600 hover:text-red-800 ml-2"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseForm;
