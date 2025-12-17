import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import { getAllBills, createBill, updateBill, deleteBill, reset } from '../../redux/slices/billSlice';
import { getAllSuppliers } from '../../redux/slices/supplierSlice';

const Bills = () => {
    const dispatch = useDispatch();
    const { bills, isLoading, isError, message } = useSelector(state => state.bill);
    const { suppliers } = useSelector(state => state.suppliers);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddBill, setShowAddBill] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingBill, setEditingBill] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        amount: '',
        dueDate: '',
        status: 'unpaid',
        description: ''
    });

    useEffect(() => {
        dispatch(getAllBills());
        dispatch(getAllSuppliers());
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'unpaid': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBill) {
                await dispatch(updateBill({ id: editingBill._id, billData: formData }));
            } else {
                await dispatch(createBill(formData));
            }
            setShowAddBill(false);
            setEditingBill(null);
            resetForm();
            dispatch(getAllBills()); // Refresh the list
        } catch (error) {
            console.error('Error saving bill:', error);
        }
    };

    const handleEdit = (bill) => {
        setEditingBill(bill);
        setFormData({
            date: new Date(bill.date).toISOString().split('T')[0],
            supplier: bill.supplier._id,
            amount: bill.amount,
            dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
            status: bill.status,
            description: bill.description || ''
        });
        setShowAddBill(true);
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteBill(id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting bill:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            supplier: '',
            amount: '',
            dueDate: '',
            status: 'unpaid',
            description: ''
        });
    };

    const columns = [
        { key: 'billNo', label: 'Bill No', sortable: true, render: (val) => <span className="font-medium text-indigo-600">{val}</span> },
        { key: 'date', label: 'Date', sortable: true, render: (val) => new Date(val).toLocaleDateString() },
        { key: 'supplier', label: 'Supplier', sortable: true, render: (val) => val?.businessName || 'N/A' },
        { key: 'amount', label: 'Amount', sortable: true, render: (val) => <span className="font-medium">₹{val.toFixed(2)}</span> },
        { key: 'status', label: 'Status', render: (val) => <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(val)}`}>{val}</span> },
        { key: 'dueDate', label: 'Due Date', sortable: true, render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
        {
            key: 'actions',
            label: 'Actions',
            render: (val, row) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:text-blue-900"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setDeleteConfirm(row._id)}
                        className="text-red-600 hover:text-red-900"
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ];

    const filteredBills = bills.filter(bill => {
        const matchesSearch = bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (bill.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             bill.amount.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalBillsAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalPaidAmount = bills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0);
    const totalOutstanding = bills.filter(bill => bill.status === 'unpaid').reduce((sum, bill) => sum + bill.amount, 0);

    return (
        <Layout>
            <PageHeader
                title="Bills"
                description="Manage supplier bills and payments"
                actions={[
                    <button key="add" onClick={() => setShowAddBill(true)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ New Bill</button>
                ]}
            />

            {/* Error Message */}
            {isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatsCard
                    title="Total Bills"
                    value={bills.length}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Total Amount"
                    value={`₹${totalBillsAmount.toFixed(0)}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Amount Paid"
                    value={`₹${totalPaidAmount.toFixed(0)}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Outstanding"
                    value={`₹${totalOutstanding.toFixed(0)}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-red-100"
                    iconColor="text-red-600"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="w-full sm:w-96">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by bill number or supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredBills}
                emptyMessage={searchTerm ? "No bills match your search" : "No bills recorded"}
                isLoading={isLoading}
            />

            {/* Add/Edit Bill Modal */}
            {showAddBill && (
                <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {editingBill ? 'Edit Bill' : 'Add New Bill'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <FormInput
                                    label="Date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">Select supplier</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier._id} value={supplier._id}>
                                                {supplier.businessName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <FormInput
                                    label="Amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                                    required
                                />

                                <FormInput
                                    label="Due Date (Optional)"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="Add description..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : (editingBill ? 'Update Bill' : 'Save Bill')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddBill(false);
                                        setEditingBill(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/20">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this bill? This action cannot be undone.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Bills;
