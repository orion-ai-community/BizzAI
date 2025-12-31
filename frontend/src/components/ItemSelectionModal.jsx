import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const ItemSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                console.error('No user found. Please login again.');
                alert('No authentication found. Please login again.');
                setLoading(false);
                return;
            }

            const user = JSON.parse(userStr);
            const token = user?.token;

            if (!token) {
                console.error('No token found in user object. Please login again.');
                alert('Authentication token missing. Please login again.');
                setLoading(false);
                return;
            }

            console.log('Fetching items from:', `${import.meta.env.VITE_BACKEND_URL}/api/inventory`);
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/inventory`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Items fetched successfully:', response.data);
            console.log('Number of items:', response.data.length);
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching items:', error);
            console.error('Error details:', error.response);
            if (error.response?.status === 401) {
                console.error('Authentication failed. Please logout and login again.');
                alert('Your session has expired. Please logout and login again.');
            } else {
                alert(`Failed to load items: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelect = () => {
        if (selectedItem && quantity > 0) {
            onSelect({ ...selectedItem, quantity });
            setSelectedItem(null);
            setQuantity(1);
            setSearchTerm('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-default">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-main">Select Item</h2>
                        <button
                            onClick={onClose}
                            className="text-muted hover:text-main transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="p-6 overflow-y-auto max-h-96">
                    {loading ? (
                        <div className="text-center py-8 text-secondary">Loading items...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-secondary">No items found</div>
                    ) : (
                        <div className="space-y-2">
                            {filteredItems.map((item) => {
                                const availableStock = item.stockQty - (item.reservedStock || 0);
                                const isOutOfStock = availableStock <= 0;
                                const isLowStock = availableStock > 0 && availableStock <= item.lowStockLimit;

                                return (
                                    <div
                                        key={item._id}
                                        onClick={() => !isOutOfStock && setSelectedItem(item)}
                                        className={`p-4 border rounded-lg cursor-pointer transition ${selectedItem?._id === item._id
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-default hover:border-indigo-300'
                                            } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-main">{item.name}</h3>
                                                    {item.sku && (
                                                        <span className="text-xs text-muted bg-surface px-2 py-1 rounded">
                                                            {item.sku}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-secondary">
                                                    <span>Price: ₹{item.sellingPrice}</span>
                                                    <span>Stock: {item.stockQty}</span>
                                                    {item.reservedStock > 0 && (
                                                        <span className="text-orange-600">Reserved: {item.reservedStock}</span>
                                                    )}
                                                    <span className={isOutOfStock ? 'text-red-600 font-medium' : isLowStock ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                                                        Available: {availableStock}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isOutOfStock && (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                                        Out of Stock
                                                    </span>
                                                )}
                                                {isLowStock && !isOutOfStock && (
                                                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                                        Low Stock
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedItem && (
                    <div className="p-6 border-t border-default bg-surface">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedItem.stockQty - (selectedItem.reservedStock || 0)}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 border border-default text-secondary rounded-lg hover:bg-surface transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSelect}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Add Item
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

ItemSelectionModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
};

export default ItemSelectionModal;
