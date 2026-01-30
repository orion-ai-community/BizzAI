const ItemsTab = ({ items, onItemUpdate, onRemoveItem }) => {
    const conditionOptions = [
        { value: 'resalable', label: 'Resalable', color: 'green' },
        { value: 'damaged', label: 'Damaged', color: 'red' },
        { value: 'defective', label: 'Defective', color: 'orange' },
        { value: 'expired', label: 'Expired', color: 'red' },
        { value: 'wrong_item', label: 'Wrong Item', color: 'yellow' },
        { value: 'scrap', label: 'Scrap', color: 'gray' },
    ];

    const dispositionOptions = [
        { value: 'restock', label: 'Restock', icon: '📦' },
        { value: 'quarantine', label: 'Quarantine', icon: '⚠️' },
        { value: 'scrap', label: 'Scrap', icon: '🗑️' },
        { value: 'vendor_return', label: 'Return to Vendor', icon: '↩️' },
        { value: 'repair', label: 'Repair', icon: '🔧' },
    ];

    // Valid condition-disposition combinations (matching backend validation)
    const validCombinations = {
        damaged: ['quarantine', 'scrap', 'vendor_return'],
        defective: ['quarantine', 'repair', 'vendor_return', 'scrap'],
        resalable: ['restock', 'vendor_return'],
        scrap: ['scrap'],
        expired: ['scrap', 'vendor_return'],
        wrong_item: ['vendor_return', 'restock'],
    };

    const getValidDispositions = (condition) => {
        const validValues = validCombinations[condition] || [];
        return dispositionOptions.filter(opt => validValues.includes(opt.value));
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No items loaded</p>
                <p className="text-sm mt-2">Please select a purchase or GRN from the Return Details tab</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Specify return quantity, condition, and disposition for each item.
                    Only items with return quantity &gt; 0 will be included in the return.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch/Expiry</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disposition</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => (
                            <tr key={index} className={item.returnQty > 0 ? 'bg-green-50' : ''}>
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.itemName}</p>
                                        <p className="text-xs text-gray-500">{item.sku || 'N/A'}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm">
                                        <p className="text-gray-900">{item.batchNo || 'N/A'}</p>
                                        {item.expiryDate && (
                                            <p className="text-xs text-gray-500">
                                                Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                    {item.purchasedQty}
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        min="0"
                                        max={item.availableReturnQty}
                                        value={item.returnQty}
                                        onChange={(e) => onItemUpdate(index, 'returnQty', parseFloat(e.target.value) || 0)}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                    ₹{item.rate.toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        value={item.condition}
                                        onChange={(e) => {
                                            const newCondition = e.target.value;
                                            onItemUpdate(index, 'condition', newCondition);
                                            // Auto-set first valid disposition for new condition
                                            const validDispositions = getValidDispositions(newCondition);
                                            if (validDispositions.length > 0 && !validDispositions.find(d => d.value === item.disposition)) {
                                                onItemUpdate(index, 'disposition', validDispositions[0].value);
                                            }
                                        }}
                                        className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {conditionOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        value={item.disposition}
                                        onChange={(e) => onItemUpdate(index, 'disposition', e.target.value)}
                                        className="w-40 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {getValidDispositions(item.condition).map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.icon} {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        value={item.returnReason}
                                        onChange={(e) => onItemUpdate(index, 'returnReason', e.target.value)}
                                        placeholder="Reason..."
                                        className="w-40 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => onRemoveItem(index)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Remove item"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ItemsTab;
