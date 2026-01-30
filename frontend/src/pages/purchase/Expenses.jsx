import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiPlus,
    FiFilter,
    FiDownload,
    FiTrash2,
    FiEdit2,
    FiChevronDown,
    FiChevronUp,
    FiRefreshCw,
    FiCheckSquare,
    FiSquare,
} from 'react-icons/fi';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import ExpenseForm from '../../components/expenses/ExpenseForm';
import ExpenseFilterPanel from '../../components/expenses/ExpenseFilterPanel';
import BulkActionBar from '../../components/expenses/BulkActionBar';
import {
    getAllExpenses,
    getExpenseSummary,
    deleteExpense,
    bulkDeleteExpenses,
    exportExpenses,
    reset,
} from '../../redux/slices/expenseSlice';
import { getAllCategories, seedDefaultCategories } from '../../redux/slices/expenseCategorySlice';

const Expenses = () => {
    const dispatch = useDispatch();
    const { expenses, summary, pagination, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.expense
    );
    const { categories } = useSelector((state) => state.expenseCategory);

    // UI State
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [selectedExpenses, setSelectedExpenses] = useState([]);

    // Filter State
    const [filters, setFilters] = useState({
        page: 1,
        limit: 25,
        sortBy: 'date',
        sortOrder: 'desc',
        category: '',
        status: '',
        paymentMethod: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        search: '',
    });

    // Load data on mount only
    useEffect(() => {
        const initializeCategories = async () => {
            try {
                const result = await dispatch(getAllCategories()).unwrap();
                // Auto-seed default categories if none exist
                if (!result || result.length === 0) {
                    try {
                        await dispatch(seedDefaultCategories()).unwrap();
                        toast.success('Default expense categories initialized');
                        dispatch(getAllCategories());
                    } catch (error) {
                        // Silently fail if categories already exist or other error
                        console.log('Categories already initialized or error:', error);
                    }
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
                // Continue anyway - page should still render
            }
        };

        initializeCategories();
        dispatch(getExpenseSummary());
    }, [dispatch]);

    // Load expenses when filters change (using JSON.stringify to prevent infinite loop)
    useEffect(() => {
        dispatch(getAllExpenses(filters));
    }, [dispatch, JSON.stringify(filters)]);

    // Handle success/error messages
    useEffect(() => {
        if (isError) {
            toast.error(message);
        }

        if (isSuccess && message) {
            toast.success(message);
        }

        return () => {
            dispatch(reset());
        };
    }, [isError, isSuccess, message, dispatch]);

    // Handlers
    const handleFilterChange = (newFilters) => {
        setFilters({ ...filters, ...newFilters, page: 1 });
    };

    const handleClearFilters = () => {
        setFilters({
            page: 1,
            limit: 25,
            sortBy: 'date',
            sortOrder: 'desc',
            category: '',
            status: '',
            paymentMethod: '',
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: '',
            search: '',
        });
    };

    const handlePageChange = (page) => {
        setFilters({ ...filters, page });
    };

    const handleSort = (field) => {
        const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
        setFilters({ ...filters, sortBy: field, sortOrder: newOrder });
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            await dispatch(deleteExpense(id));
            dispatch(getAllExpenses(filters));
            dispatch(getExpenseSummary());
            setSelectedExpenses([]);
        }
    };

    const handleFormClose = (shouldRefresh) => {
        setShowForm(false);
        setEditingExpense(null);
        if (shouldRefresh) {
            // Refresh expense list and summary after create/update
            dispatch(getAllExpenses(filters));
            dispatch(getExpenseSummary());
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expense(s)?`)) {
            await dispatch(bulkDeleteExpenses(selectedExpenses));
            dispatch(getAllExpenses(filters));
            dispatch(getExpenseSummary());
            setSelectedExpenses([]);
        }
    };

    const handleBulkCategoryUpdate = async (categoryId) => {
        // TODO: Implement bulk category update
        toast.info('Bulk category update coming soon');
    };

    // Handle export
    const handleExport = async (format) => {
        await dispatch(exportExpenses({ format, filters }));
    };

    // Handle row selection
    const handleSelectAll = () => {
        if (selectedExpenses.length === expenses.length) {
            setSelectedExpenses([]);
        } else {
            setSelectedExpenses(expenses.map((exp) => exp._id));
        }
    };

    const handleSelectRow = (id) => {
        if (selectedExpenses.includes(id)) {
            setSelectedExpenses(selectedExpenses.filter((expId) => expId !== id));
        } else {
            setSelectedExpenses([...selectedExpenses, id]);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get category name
    const getCategoryName = (categoryId) => {
        const category = categories.find((cat) => cat._id === categoryId);
        return category ? category.name : 'Unknown';
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || badges.pending}`}>
                {status}
            </span>
        );
    };

    // Get payment method badge
    const getPaymentMethodBadge = (method) => {
        const badges = {
            cash: 'bg-blue-100 text-blue-800',
            bank: 'bg-purple-100 text-purple-800',
            cheque: 'bg-indigo-100 text-indigo-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[method] || badges.cash}`}>
                {method}
            </span>
        );
    };

    // Table columns
    const columns = [
        {
            key: 'select',
            label: (
                <input
                    type="checkbox"
                    checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                />
            ),
            render: (_, row) => (
                <input
                    type="checkbox"
                    checked={selectedExpenses.includes(row._id)}
                    onChange={() => handleSelectRow(row._id)}
                    className="rounded border-gray-300"
                />
            ),
        },
        {
            key: 'expenseNo',
            label: 'Expense #',
            sortable: true,
            render: (value) => <span className="font-medium text-blue-600">{value}</span>,
        },
        {
            key: 'date',
            label: 'Date',
            sortable: true,
            render: (value) => formatDate(value),
        },
        {
            key: 'category',
            label: 'Category',
            render: (value) => getCategoryName(value),
        },
        {
            key: 'description',
            label: 'Description',
            render: (value) => (
                <span className="text-sm text-gray-600 max-w-xs truncate block">{value || '-'}</span>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (value) => <span className="text-sm font-semibold">{formatCurrency(value)}</span>,
        },
        {
            key: 'paymentMethod',
            label: 'Payment',
            render: (value) => getPaymentMethodBadge(value),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value) => getStatusBadge(value),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit"
                    >
                        <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row._id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Expenses Management"
                    subtitle="Track and manage all business expenses"
                />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Expenses"
                        value={summary?.totalExpenses?.amount ? formatCurrency(summary.totalExpenses.amount) : formatCurrency(0)}
                        subtitle={`${summary?.totalExpenses?.count || 0} entries`}
                        icon="💰"
                        color="blue"
                    />
                    <StatsCard
                        title="This Month"
                        value={summary?.thisMonth?.amount ? formatCurrency(summary.thisMonth.amount) : formatCurrency(0)}
                        subtitle={`${summary?.thisMonth?.count || 0} expenses`}
                        icon="📅"
                        color="green"
                    />
                    <StatsCard
                        title="Top Category"
                        value={
                            summary?.categoryBreakdown && summary.categoryBreakdown.length > 0
                                ? summary.categoryBreakdown[0].categoryName
                                : 'N/A'
                        }
                        subtitle={
                            summary?.categoryBreakdown && summary.categoryBreakdown.length > 0
                                ? formatCurrency(summary.categoryBreakdown[0].total)
                                : 'No data'
                        }
                        icon="📊"
                        color="purple"
                    />
                    <StatsCard
                        title="Average Expense"
                        value={
                            summary?.totalExpenses?.count && summary?.totalExpenses?.amount
                                ? formatCurrency(summary.totalExpenses.amount / summary.totalExpenses.count)
                                : formatCurrency(0)
                        }
                        subtitle="Per transaction"
                        icon="📈"
                        color="orange"
                    />
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setEditingExpense(null);
                                setShowForm(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiPlus className="w-5 h-5" />
                            Add Expense
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FiFilter className="w-5 h-5" />
                            Filters
                            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        <button
                            onClick={() => {
                                dispatch(getAllExpenses(filters));
                                dispatch(getExpenseSummary());
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FiRefreshCw className="w-5 h-5" />
                            Refresh
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FiDownload className="w-5 h-5" />
                            Export PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FiDownload className="w-5 h-5" />
                            Export Excel
                        </button>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedExpenses.length > 0 && (
                    <BulkActionBar
                        selectedCount={selectedExpenses.length}
                        onDelete={handleBulkDelete}
                        onCategoryUpdate={handleBulkCategoryUpdate}
                        onClearSelection={() => setSelectedExpenses([])}
                        categories={categories}
                    />
                )}

                {/* Filter Panel */}
                {showFilters && (
                    <ExpenseFilterPanel
                        filters={filters}
                        categories={categories}
                        onFilterChange={handleFilterChange}
                        onClear={handleClearFilters}
                    />
                )}

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <DataTable
                        columns={columns}
                        data={expenses || []}
                        isLoading={isLoading}
                        emptyMessage="No expenses found. Click 'Add Expense' to create your first expense."
                    />

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.totalItems)} of {pagination.totalItems} results
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Expense Form Modal */}
            {showForm && (
                <ExpenseForm
                    expense={editingExpense}
                    categories={categories}
                    onClose={handleFormClose}
                />
            )}
        </Layout>
    );
};

export default Expenses;
