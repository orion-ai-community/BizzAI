import { useState } from 'react';

const SalesReportTable = ({ data, pagination, isLoading, onPageChange }) => {
    const [visibleColumns, setVisibleColumns] = useState({
        invoiceDate: true,
        invoiceNo: true,
        customerName: true,
        itemsCount: true,
        quantitySold: true,
        grossAmount: true,
        discount: true,
        taxableAmount: true,
        cgst: false,
        sgst: false,
        igst: false,
        totalTax: true,
        netAmount: true,
        paymentStatus: true,
        paymentMethod: true,
    });

    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const toggleColumn = (column) => {
        setVisibleColumns({ ...visibleColumns, [column]: !visibleColumns[column] });
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedData = data ? [...data].sort((a, b) => {
        if (!sortField) return 0;
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    }) : [];

    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border border-border p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-border rounded w-1/4"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-border rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-main mb-2">No Sales Data Found</h3>
                <p className="text-secondary">Try adjusting your filters to see results.</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Table Header with Column Toggle */}
            <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-main">Sales Transactions</h3>
                <details className="relative">
                    <summary className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                        Columns
                    </summary>
                    <div className="absolute right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-4 z-10 w-64">
                        {Object.keys(visibleColumns).map((col) => (
                            <label key={col} className="flex items-center gap-2 mb-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns[col]}
                                    onChange={() => toggleColumn(col)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-main">
                                    {col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                </span>
                            </label>
                        ))}
                    </div>
                </details>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            {visibleColumns.invoiceDate && (
                                <th
                                    onClick={() => handleSort('invoiceDate')}
                                    className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Date {sortField === 'invoiceDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            )}
                            {visibleColumns.invoiceNo && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                    Invoice No
                                </th>
                            )}
                            {visibleColumns.customerName && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                    Customer
                                </th>
                            )}
                            {visibleColumns.itemsCount && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    Items
                                </th>
                            )}
                            {visibleColumns.quantitySold && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    Qty
                                </th>
                            )}
                            {visibleColumns.grossAmount && (
                                <th
                                    onClick={() => handleSort('grossAmount')}
                                    className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Gross {sortField === 'grossAmount' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            )}
                            {visibleColumns.discount && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    Discount
                                </th>
                            )}
                            {visibleColumns.taxableAmount && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    Taxable
                                </th>
                            )}
                            {visibleColumns.cgst && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    CGST
                                </th>
                            )}
                            {visibleColumns.sgst && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    SGST
                                </th>
                            )}
                            {visibleColumns.igst && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    IGST
                                </th>
                            )}
                            {visibleColumns.totalTax && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    Total Tax
                                </th>
                            )}
                            {visibleColumns.netAmount && (
                                <th
                                    onClick={() => handleSort('netAmount')}
                                    className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Net Amount {sortField === 'netAmount' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                            )}
                            {visibleColumns.paymentStatus && (
                                <th className="px-4 py-3 text-center text-xs font-medium text-secondary uppercase tracking-wider">
                                    Status
                                </th>
                            )}
                            {visibleColumns.paymentMethod && (
                                <th className="px-4 py-3 text-center text-xs font-medium text-secondary uppercase tracking-wider">
                                    Method
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sortedData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                {visibleColumns.invoiceDate && (
                                    <td className="px-4 py-3 text-sm text-main whitespace-nowrap">
                                        {new Date(row.invoiceDate).toLocaleDateString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.invoiceNo && (
                                    <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                        {row.invoiceNo}
                                    </td>
                                )}
                                {visibleColumns.customerName && (
                                    <td className="px-4 py-3 text-sm text-main">{row.customerName}</td>
                                )}
                                {visibleColumns.itemsCount && (
                                    <td className="px-4 py-3 text-sm text-main text-right">{row.itemsCount}</td>
                                )}
                                {visibleColumns.quantitySold && (
                                    <td className="px-4 py-3 text-sm text-main text-right">{row.quantitySold}</td>
                                )}
                                {visibleColumns.grossAmount && (
                                    <td className="px-4 py-3 text-sm text-main text-right">
                                        ₹{row.grossAmount.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.discount && (
                                    <td className="px-4 py-3 text-sm text-orange-600 dark:text-orange-400 text-right">
                                        ₹{row.discount.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.taxableAmount && (
                                    <td className="px-4 py-3 text-sm text-main text-right">
                                        ₹{row.taxableAmount.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.cgst && (
                                    <td className="px-4 py-3 text-sm text-main text-right">
                                        ₹{row.cgst.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.sgst && (
                                    <td className="px-4 py-3 text-sm text-main text-right">
                                        ₹{row.sgst.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.igst && (
                                    <td className="px-4 py-3 text-sm text-main text-right">
                                        ₹{row.igst.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.totalTax && (
                                    <td className="px-4 py-3 text-sm text-purple-600 dark:text-purple-400 text-right">
                                        ₹{row.totalTax.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.netAmount && (
                                    <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400 text-right">
                                        ₹{row.netAmount.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {visibleColumns.paymentStatus && (
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${row.paymentStatus === 'paid'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : row.paymentStatus === 'partial'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}
                                        >
                                            {row.paymentStatus}
                                        </span>
                                    </td>
                                )}
                                {visibleColumns.paymentMethod && (
                                    <td className="px-4 py-3 text-sm text-main text-center uppercase">
                                        {row.paymentMethod}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="p-4 border-t border-border flex justify-between items-center">
                    <p className="text-sm text-secondary">
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of{' '}
                        {pagination.totalRecords} results
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="px-4 py-2 bg-card border border-border rounded-lg text-main hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                            {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="px-4 py-2 bg-card border border-border rounded-lg text-main hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesReportTable;
