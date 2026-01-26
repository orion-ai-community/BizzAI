import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';

const QuickAddItemModal = ({ isOpen, onClose, onItemCreated, prefilledBarcode = '' }) => {
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        category: '',
        hsnCode: '',
        taxRate: 18,
        costPrice: '',
        sellingPrice: '',
        trackBatch: false,
        trackExpiry: false,
    });
    const [isLoading, setIsLoading] = useState(false);

    // Update barcode when prefilledBarcode prop changes
    useEffect(() => {
        if (prefilledBarcode) {
            setFormData(prev => ({ ...prev, barcode: prefilledBarcode }));
        }
    }, [prefilledBarcode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Item name is required');
            return;
        }

        if (!formData.category.trim()) {
            toast.error('Category is required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/api/inventory', {
                name: formData.name.trim(),
                barcode: formData.barcode.trim() || undefined,
                category: formData.category.trim(),
                hsnCode: formData.hsnCode.trim() || undefined,
                costPrice: parseFloat(formData.costPrice) || 0,
                sellingPrice: parseFloat(formData.sellingPrice) || 0,
                trackBatch: formData.trackBatch,
                trackExpiry: formData.trackExpiry,
                // CRITICAL: stockQty must be 0 - stock will be added when purchase is finalized
                stockQty: 0,
            });

            toast.success('Item created successfully');

            // Call parent callback with created item
            if (onItemCreated) {
                onItemCreated({
                    ...response.data.item,
                    lastPurchaseRate: parseFloat(formData.costPrice) || 0,
                });
            }

            // Reset form and close
            setFormData({
                name: '',
                barcode: '',
                category: '',
                hsnCode: '',
                taxRate: 18,
                costPrice: '',
                sellingPrice: '',
                trackBatch: false,
                trackExpiry: false,
            });
            onClose();
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create item';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-main">Quick Add Item</h3>
                    <button
                        onClick={onClose}
                        className="text-secondary hover:text-main"
                        type="button"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Item Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-secondary mb-1">
                                Item Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="Enter item name"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Barcode */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">
                                Barcode
                            </label>
                            <input
                                type="text"
                                value={formData.barcode}
                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="Barcode (optional)"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">
                                Category *
                            </label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="e.g., Groceries, Electronics"
                                required
                            />
                        </div>

                        {/* HSN Code */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">
                                HSN Code
                            </label>
                            <input
                                type="text"
                                value={formData.hsnCode}
                                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="HSN Code (optional)"
                            />
                        </div>

                        {/* Tax Rate */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">
                                Tax Rate (%)
                            </label>
                            <select
                                value={formData.taxRate}
                                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>

                        {/* Cost Price */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">
                                Purchase Rate
                            </label>
                            <input
                                type="number"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* Selling Price */}
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">
                                Selling Price
                            </label>
                            <input
                                type="number"
                                value={formData.sellingPrice}
                                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex space-x-6 mb-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.trackBatch}
                                onChange={(e) => setFormData({ ...formData, trackBatch: e.target.checked })}
                                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
                            />
                            <span className="text-sm text-secondary">Track Batch</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.trackExpiry}
                                onChange={(e) => setFormData({ ...formData, trackExpiry: e.target.checked })}
                                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
                            />
                            <span className="text-sm text-secondary">Track Expiry</span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-default text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : 'Create & Add to Purchase'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickAddItemModal;
