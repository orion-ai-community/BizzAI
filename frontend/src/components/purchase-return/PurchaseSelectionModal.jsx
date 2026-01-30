import { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PurchaseSelectionModal = ({ sourceType, onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch purchases on mount
    useEffect(() => {
        fetchPurchases();
    }, [sourceType]);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/purchase-returns/purchases-for-return', {
                params: { search, type: sourceType },
            });
            setPurchases(response.data);
        } catch (err) {
            console.error('Error fetching purchases:', err);
            toast.error('Failed to fetch purchases');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPurchases();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Select {sourceType === 'purchase' ? 'Purchase' : 'GRN'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSearch} className="flex space-x-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search by ${sourceType === 'purchase' ? 'purchase number or invoice' : 'GRN number or PO'}`}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="px-6 py-4 overflow-y-auto max-h-96">
                    {purchases.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No purchases found. Try searching above.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {purchases.map((purchase) => (
                                <div
                                    key={purchase._id}
                                    onClick={() => onSelect(purchase)}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {sourceType === 'purchase' ? purchase.purchaseNo : purchase.grnNumber}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {purchase.supplier?.businessName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Date: {new Date(sourceType === 'purchase' ? purchase.purchaseDate : purchase.grnDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                ₹{purchase.totalAmount?.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {purchase.items?.length} items
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseSelectionModal;
