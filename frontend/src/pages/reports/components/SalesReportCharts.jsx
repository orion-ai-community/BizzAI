import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SalesReportCharts = ({ charts, isLoading }) => {
    if (isLoading || !charts) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card p-6 rounded-xl border border-border animate-pulse">
                        <div className="h-4 bg-border rounded w-1/3 mb-4"></div>
                        <div className="h-64 bg-border rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

    // Format sales trend data
    const salesTrendData = charts.salesTrend?.map(item => ({
        date: new Date(item._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        sales: item.totalSales,
        count: item.count,
    })) || [];

    // Format payment methods data
    const paymentMethodsData = charts.paymentMethods?.map(item => ({
        name: item._id?.toUpperCase() || 'UNKNOWN',
        value: item.amount,
        count: item.count,
    })) || [];

    // Format category data
    const categoryData = charts.categoryData?.slice(0, 8) || [];

    // Format top customers data
    const topCustomersData = charts.topCustomers?.map(item => ({
        name: item.customerName?.substring(0, 20) || 'Unknown',
        sales: item.totalSales,
        invoices: item.invoiceCount,
    })) || [];

    // Format top items data
    const topItemsData = charts.topItems?.slice(0, 10).map(item => ({
        name: item.itemName?.substring(0, 20) || 'Unknown',
        amount: item.amount,
        quantity: item.quantity,
    })) || [];

    return (
        <div className="mb-8">
            <h3 className="text-xl font-bold text-main mb-4">Visual Analytics</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                {salesTrendData.length > 0 && (
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <h4 className="text-lg font-semibold text-main mb-4">Sales Trend</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    labelStyle={{ color: '#F3F4F6' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} name="Sales (₹)" />
                                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} name="Invoices" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Payment Methods */}
                {paymentMethodsData.length > 0 && (
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <h4 className="text-lg font-semibold text-main mb-4">Payment Methods</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {paymentMethodsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Category-wise Sales */}
                {categoryData.length > 0 && (
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <h4 className="text-lg font-semibold text-main mb-4">Category-wise Sales</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="category" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                />
                                <Legend />
                                <Bar dataKey="amount" fill="#8B5CF6" name="Sales (₹)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Top Customers */}
                {topCustomersData.length > 0 && (
                    <div className="bg-card p-6 rounded-xl border border-border">
                        <h4 className="text-lg font-semibold text-main mb-4">Top Customers</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topCustomersData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis type="number" stroke="#9CA3AF" />
                                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                />
                                <Legend />
                                <Bar dataKey="sales" fill="#10B981" name="Sales (₹)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Top Items */}
                {topItemsData.length > 0 && (
                    <div className="bg-card p-6 rounded-xl border border-border lg:col-span-2">
                        <h4 className="text-lg font-semibold text-main mb-4">Top Selling Items</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topItemsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value, name) => {
                                        if (name === 'Amount') return `₹${value.toLocaleString('en-IN')}`;
                                        return value;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="amount" fill="#F59E0B" name="Amount (₹)" />
                                <Bar dataKey="quantity" fill="#3B82F6" name="Quantity" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Profit Trend */}
                {charts.profitTrend && charts.profitTrend.length > 0 && (
                    <div className="bg-card p-6 rounded-xl border border-border lg:col-span-2">
                        <h4 className="text-lg font-semibold text-main mb-4">Profit Trend</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={charts.profitTrend.map(item => ({
                                date: new Date(item._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                                revenue: item.totalRevenue,
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue (₹)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesReportCharts;
