import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllItems, deleteItem, getLowStockItems, reset } from '../redux/slices/inventorySlice';
import Layout from '../components/Layout';

const Inventory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, lowStockItems, alerts, isLoading, isError, message } = useSelector(
    (state) => state.inventory
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    dispatch(getAllItems());
    dispatch(getLowStockItems());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleDelete = async (id) => {
    await dispatch(deleteItem(id));
    setDeleteConfirm(null);
    dispatch(getAllItems());
  };

  // Get unique categories
  const categories = ['all', ...new Set(items.map((item) => item.category).filter(Boolean))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate inventory value
  const inventoryValue = items.reduce((sum, item) => sum + item.costPrice * item.stockQty, 0);
  const expectedRevenue = items.reduce((sum, item) => sum + item.sellingPrice * item.stockQty, 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-2">Inventory Management</h1>
          <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">Manage your products and stock levels</p>
        </div>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-yellow-800 dark:text-yellow-400 font-medium mb-2">Stock Alerts</h3>
                <ul className="space-y-1">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className="text-yellow-700 dark:text-yellow-300 text-sm">
                      • {alert.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-2">{items.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium">Inventory Value</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-2">
                  ₹{inventoryValue.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium">Expected Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-2">
                  ₹{expectedRevenue.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-2">{lowStockItems.length}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 gap-4">
            {/* Search */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-gray-900 dark:text-[rgb(var(--color-text))] placeholder:text-gray-400 dark:placeholder:text-[rgb(var(--color-placeholder))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-[rgb(var(--color-text-muted))]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-gray-900 dark:text-[rgb(var(--color-text))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              {/* Add Item Button - FIX: Added type="button" */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/inventory/add');
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))] transition whitespace-nowrap"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded h-12 w-12 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))]"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 dark:text-[rgb(var(--color-text-muted))] mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-lg">No items found</p>
              <button
                type="button"
                onClick={() => navigate('/inventory/add')}
                className="mt-4 text-indigo-600 dark:text-[rgb(var(--color-primary))] hover:text-indigo-700 dark:hover:text-[rgb(var(--color-primary-hover))] font-medium"
              >
                Add your first item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reserved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cost Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Selling Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Profit Margin
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredItems.map((item) => {
                    const profitMargin = ((item.sellingPrice - item.costPrice) / item.costPrice * 100).toFixed(1);
                    const availableStock = item.stockQty - (item.reservedStock || 0);
                    const isLowStock = availableStock <= item.lowStockLimit;

                    return (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                            {item.sku && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded whitespace-nowrap">
                            {item.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isLowStock ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 whitespace-nowrap">
                              {item.stockQty} {item.unit}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 whitespace-nowrap">
                              {item.stockQty} {item.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.reservedStock > 0 ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 whitespace-nowrap">
                              {item.reservedStock} {item.unit}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const available = item.stockQty - (item.reservedStock || 0);
                            return (
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                                available <= 0 
                                  ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' 
                                  : available <= item.lowStockLimit 
                                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' 
                                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                              }`}>
                                {available} {item.unit}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 whitespace-nowrap">
                          ₹{item.costPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          ₹{item.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium whitespace-nowrap ${
                            profitMargin > 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {profitMargin}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/inventory/edit/${item._id}`);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteConfirm(item._id);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl p-6 max-w-md w-full mx-4 border dark:border-[rgb(var(--color-border))]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-4">Confirm Delete</h3>
              <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] text-gray-700 dark:text-[rgb(var(--color-text))] bg-white dark:bg-[rgb(var(--color-card))] rounded-lg hover:bg-gray-50 dark:hover:bg-[rgb(var(--color-input))]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inventory;


