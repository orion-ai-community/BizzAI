import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSalesReport, getStockReport, getCustomerReport, reset } from '../redux/slices/reportsSlice';
import { getAllInvoices } from '../redux/slices/posSlice';
import Layout from '../components/Layout';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const Reports = () => {
  const dispatch = useDispatch();
  const { salesReport, stockReport, customerReport, isLoading, isError, message } = useSelector(
    (state) => state.reports
  );
  const { invoices } = useSelector((state) => state.pos);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(getSalesReport());
    dispatch(getStockReport());
    dispatch(getCustomerReport());
    dispatch(getAllInvoices());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  // Prepare chart data
  const prepareSalesChartData = () => {
    if (!invoices || invoices.length === 0) return [];

    // Group invoices by date
    const salesByDate = {};
    invoices.forEach((invoice) => {
      const date = new Date(invoice.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      });
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date] += invoice.totalAmount;
    });

    // Convert to array and sort by date
    return Object.entries(salesByDate)
      .map(([date, amount]) => ({ date, amount }))
      .slice(-7); // Last 7 days
  };

  const preparePaymentMethodData = () => {
    if (!invoices || invoices.length === 0) return [];

    const paymentMethods = {};
    invoices.forEach((invoice) => {
      const method = invoice.paymentMethod;
      if (!paymentMethods[method]) {
        paymentMethods[method] = 0;
      }
      paymentMethods[method] += invoice.totalAmount;
    });

    return Object.entries(paymentMethods).map(([name, value]) => ({
      name: name.toUpperCase(),
      value: parseFloat(value.toFixed(2)),
    }));
  };

  const prepareTopSellingItems = () => {
    if (!salesReport?.report?.summary?.topSellingItems) return [];
    return salesReport.report.summary.topSellingItems.slice(0, 5);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const salesChartData = prepareSalesChartData();
  const paymentMethodData = preparePaymentMethodData();
  const topSellingItems = prepareTopSellingItems();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>

        {/* Error Message */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{message}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'sales', label: 'Sales', icon: '💰' },
              { id: 'inventory', label: 'Inventory', icon: '📦' },
              { id: 'customers', label: 'Customers', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Total Sales</h3>
                      <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold">
                      ₹{salesReport?.report?.summary?.totalSales?.toFixed(0) || 0}
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      {salesReport?.report?.summary?.totalInvoices || 0} invoices
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Average Bill</h3>
                      <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold">
                      ₹{salesReport?.report?.summary?.averageBill?.toFixed(0) || 0}
                    </p>
                    <p className="text-sm opacity-80 mt-1">Per transaction</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Total Items</h3>
                      <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold">{stockReport?.totalItems || 0}</p>
                    <p className="text-sm opacity-80 mt-1">In inventory</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Low Stock</h3>
                      <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold">{stockReport?.lowStock?.length || 0}</p>
                    <p className="text-sm opacity-80 mt-1">Items need restock</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sales Trend Chart */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Trend (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} name="Sales (₹)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Payment Methods Chart */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Methods Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Insights */}
                {salesReport?.report?.insight && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI-Powered Business Insights
                    </h3>
                    <div className="space-y-2">
                      {salesReport.report.insight.map((insight, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-indigo-600 mr-2">•</span>
                          <p className="text-gray-700">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Selling Products */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Products</h3>
                    {topSellingItems.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topSellingItems}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="qty" fill="#6366f1" name="Quantity Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No sales data available</p>
                    )}
                  </div>

                  {/* Sales Summary */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Sales Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{salesReport?.report?.summary?.totalSales?.toFixed(2) || 0}
                          </p>
                        </div>
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>

                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Total Invoices</p>
                          <p className="text-2xl font-bold text-green-600">
                            {salesReport?.report?.summary?.totalInvoices || 0}
                          </p>
                        </div>
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>

                      <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Average Bill Value</p>
                          <p className="text-2xl font-bold text-purple-600">
                            ₹{salesReport?.report?.summary?.averageBill?.toFixed(2) || 0}
                          </p>
                        </div>
                        <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                {/* Low Stock Alert */}
                {stockReport?.lowStock && stockReport.lowStock.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Low Stock Alert - {stockReport.lowStock.length} Items
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stockReport.lowStock.map((item) => (
                        <div key={item._id} className="bg-white rounded-lg p-4 border border-red-200">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Stock: <span className="font-bold text-red-600">{item.stockQty}</span> {item.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min. Required: {item.lowStockLimit} {item.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <p className="text-4xl font-bold text-blue-600">{stockReport?.totalItems || 0}</p>
                      <p className="text-gray-600 mt-2">Total Items</p>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <p className="text-4xl font-bold text-green-600">
                        {(stockReport?.totalItems || 0) - (stockReport?.lowStock?.length || 0)}
                      </p>
                      <p className="text-gray-600 mt-2">In Stock</p>
                    </div>
                    <div className="text-center p-6 bg-red-50 rounded-lg">
                      <p className="text-4xl font-bold text-red-600">{stockReport?.lowStock?.length || 0}</p>
                      <p className="text-gray-600 mt-2">Low Stock</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <div className="space-y-6">
                {/* Customer Dues */}
                {customerReport && customerReport.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Customers with Outstanding Dues ({customerReport.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Due Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {customerReport.map((customer) => (
                            <tr key={customer._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{customer.phone}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{customer.email || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm font-bold text-red-600">₹{customer.dues.toFixed(2)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear! 🎉</h3>
                    <p className="text-gray-600">No customers have outstanding dues.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Reports;