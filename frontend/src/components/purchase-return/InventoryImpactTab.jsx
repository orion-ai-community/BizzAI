const InventoryImpactTab = ({ items }) => {
    const getDispositionColor = (disposition) => {
        const colors = {
            restock: 'bg-green-100 text-green-800',
            quarantine: 'bg-yellow-100 text-yellow-800',
            scrap: 'bg-red-100 text-red-800',
            vendor_return: 'bg-blue-100 text-blue-800',
            repair: 'bg-purple-100 text-purple-800',
        };
        return colors[disposition] || 'bg-gray-100 text-gray-800';
    };

    const getConditionColor = (condition) => {
        const colors = {
            resalable: 'bg-green-100 text-green-800',
            damaged: 'bg-red-100 text-red-800',
            defective: 'bg-orange-100 text-orange-800',
            expired: 'bg-red-100 text-red-800',
            wrong_item: 'bg-yellow-100 text-yellow-800',
            scrap: 'bg-gray-100 text-gray-800',
        };
        return colors[condition] || 'bg-gray-100 text-gray-800';
    };

    const returningItems = items.filter(item => item.returnQty > 0);

    if (returningItems.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No items with return quantity</p>
                <p className="text-sm mt-2">Go to Items tab and specify return quantities</p>
            </div>
        );
    }

    // Group by disposition
    const groupedByDisposition = returningItems.reduce((acc, item) => {
        if (!acc[item.disposition]) {
            acc[item.disposition] = [];
        }
        acc[item.disposition].push(item);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">Total Items Returning</h3>
                    <p className="text-2xl font-bold text-blue-900">{returningItems.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm font-medium text-green-800 mb-1">Total Quantity</h3>
                    <p className="text-2xl font-bold text-green-900">
                        {returningItems.reduce((sum, item) => sum + item.returnQty, 0)}
                    </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-sm font-medium text-purple-800 mb-1">Dispositions</h3>
                    <p className="text-2xl font-bold text-purple-900">
                        {Object.keys(groupedByDisposition).length}
                    </p>
                </div>
            </div>

            {/* Disposition Breakdown */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Impact by Disposition</h3>
                <div className="space-y-4">
                    {Object.entries(groupedByDisposition).map(([disposition, items]) => (
                        <div key={disposition} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className={`px-4 py-3 ${getDispositionColor(disposition)} font-semibold flex justify-between items-center`}>
                                <span className="capitalize">{disposition.replace('_', ' ')}</span>
                                <span>{items.length} items • {items.reduce((sum, item) => sum + item.returnQty, 0)} units</span>
                            </div>
                            <div className="bg-white">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Condition</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Impact</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2">
                                                    <p className="font-medium text-gray-900">{item.itemName}</p>
                                                    <p className="text-xs text-gray-500">{item.sku || 'N/A'}</p>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                    {item.returnQty} {item.unit}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(item.condition)}`}>
                                                        {item.condition}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                    {disposition === 'restock' && '✓ Will be added back to available stock'}
                                                    {disposition === 'quarantine' && '⚠️ Will be moved to quarantine'}
                                                    {disposition === 'scrap' && '🗑️ Will be removed from inventory'}
                                                    {disposition === 'vendor_return' && '↩️ Pending return to vendor'}
                                                    {disposition === 'repair' && '🔧 Will be sent for repair'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Inventory adjustments will only be made after approval (if required)</li>
                    <li>Items marked for "Restock" will be added back to available inventory</li>
                    <li>Items in "Quarantine" will not be available for sale until inspected</li>
                    <li>Items marked as "Scrap" will be permanently removed from inventory</li>
                    <li>Items for "Vendor Return" or "Repair" will be tracked separately</li>
                </ul>
            </div>
        </div>
    );
};

export default InventoryImpactTab;
