const SalesReportSummaryCards = ({ summary, isLoading }) => {
    if (isLoading || !summary) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-card p-6 rounded-xl border border-border animate-pulse">
                        <div className="h-4 bg-border rounded w-1/2 mb-2"></div>
                        <div className="h-8 bg-border rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    const cards = [
        {
            label: 'Total Sales',
            value: `₹${summary.totalSales.toLocaleString('en-IN')}`,
            icon: '💰',
            color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            textColor: 'text-green-700 dark:text-green-300',
        },
        {
            label: 'Total Invoices',
            value: summary.totalInvoices.toLocaleString('en-IN'),
            icon: '📄',
            color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            textColor: 'text-blue-700 dark:text-blue-300',
        },
        {
            label: 'Total Quantity',
            value: summary.totalQuantity.toLocaleString('en-IN'),
            icon: '📦',
            color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
            textColor: 'text-purple-700 dark:text-purple-300',
        },
        {
            label: 'Total Tax',
            value: `₹${summary.totalTax.toLocaleString('en-IN')}`,
            icon: '🏛️',
            color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
            textColor: 'text-orange-700 dark:text-orange-300',
        },
        {
            label: 'Total Discount',
            value: `₹${summary.totalDiscount.toLocaleString('en-IN')}`,
            icon: '🎁',
            color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
            textColor: 'text-pink-700 dark:text-pink-300',
        },
        {
            label: 'Gross Profit',
            value: `₹${summary.grossProfit.toLocaleString('en-IN')}`,
            icon: '📈',
            color: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
            textColor: 'text-teal-700 dark:text-teal-300',
        },
        {
            label: 'Net Profit',
            value: `₹${summary.netProfit.toLocaleString('en-IN')}`,
            icon: '💎',
            color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
            textColor: 'text-indigo-700 dark:text-indigo-300',
        },
        {
            label: 'Avg Order Value',
            value: `₹${summary.averageOrderValue.toLocaleString('en-IN')}`,
            icon: '📊',
            color: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
            textColor: 'text-cyan-700 dark:text-cyan-300',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`${card.color} p-6 rounded-xl border-2 transition-all hover:shadow-lg`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{card.icon}</span>
                    </div>
                    <p className="text-sm text-secondary mb-1">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
            ))}
        </div>
    );
};

export default SalesReportSummaryCards;
