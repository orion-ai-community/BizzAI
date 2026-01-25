import { useState } from 'react';

const SalesReportFilters = ({ filters, onFilterChange, onReset }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const datePresets = [
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'This Week', value: 'this_week' },
        { label: 'Last Week', value: 'last_week' },
        { label: 'This Month', value: 'this_month' },
        { label: 'Last Month', value: 'last_month' },
        { label: 'This Quarter', value: 'this_quarter' },
        { label: 'Financial Year', value: 'financial_year' },
        { label: 'Custom', value: 'custom' },
    ];

    const paymentStatuses = ['paid', 'unpaid', 'partial'];
    const paymentMethods = ['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'due'];

    const handleDatePresetChange = (preset) => {
        const updated = { ...localFilters, dateFilter: preset };
        if (preset !== 'custom') {
            updated.customStartDate = null;
            updated.customEndDate = null;
        }
        setLocalFilters(updated);
    };

    const handleInputChange = (field, value) => {
        setLocalFilters({ ...localFilters, [field]: value });
    };

    const handleMultiSelectChange = (field, value) => {
        const current = localFilters[field] || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        setLocalFilters({ ...localFilters, [field]: updated });
    };

    const handleApply = () => {
        onFilterChange(localFilters);
    };

    const handleReset = () => {
        setLocalFilters({
            dateFilter: 'this_month',
            customStartDate: null,
            customEndDate: null,
            invoiceNo: '',
            paymentStatus: [],
            paymentMethod: [],
            customerId: null,
        });
        onReset();
    };

    return (
        <div className="bg-card p-6 rounded-xl border border-border mb-6">
            <h3 className="text-lg font-bold text-main mb-4">Advanced Filters</h3>

            {/* Date Filters */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-main mb-2">Date Range</label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {datePresets.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => handleDatePresetChange(preset.value)}
                            className={`px-4 py-2 rounded-lg border transition ${localFilters.dateFilter === preset.value
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-card text-main border-border hover:border-blue-400'
                                }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {localFilters.dateFilter === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-secondary mb-1">Start Date</label>
                            <input
                                type="date"
                                value={localFilters.customStartDate || ''}
                                onChange={(e) => handleInputChange('customStartDate', e.target.value)}
                                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-secondary mb-1">End Date</label>
                            <input
                                type="date"
                                value={localFilters.customEndDate || ''}
                                onChange={(e) => handleInputChange('customEndDate', e.target.value)}
                                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-main mb-2">Invoice Number</label>
                    <input
                        type="text"
                        placeholder="Search by invoice number..."
                        value={localFilters.invoiceNo || ''}
                        onChange={(e) => handleInputChange('invoiceNo', e.target.value)}
                        className="w-full px-4 py-2 bg-card border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-main mb-2">Payment Status</label>
                    <div className="flex flex-wrap gap-2">
                        {paymentStatuses.map((status) => (
                            <button
                                key={status}
                                onClick={() => handleMultiSelectChange('paymentStatus', status)}
                                className={`px-3 py-1 rounded-lg border text-sm transition ${localFilters.paymentStatus?.includes(status)
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-card text-main border-border hover:border-green-400'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-main mb-2">Payment Method</label>
                <div className="flex flex-wrap gap-2">
                    {paymentMethods.map((method) => (
                        <button
                            key={method}
                            onClick={() => handleMultiSelectChange('paymentMethod', method)}
                            className={`px-3 py-1 rounded-lg border text-sm transition ${localFilters.paymentMethod?.includes(method)
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-card text-main border-border hover:border-purple-400'
                                }`}
                        >
                            {method.toUpperCase().replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleApply}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                    Apply Filters
                </button>
                <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default SalesReportFilters;
