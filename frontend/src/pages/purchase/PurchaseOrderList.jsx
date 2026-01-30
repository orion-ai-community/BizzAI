import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    getAllPurchaseOrders,
    deletePurchaseOrder,
    submitForApproval,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    cancelPurchaseOrder,
    duplicatePurchaseOrder,
    setFilters,
    clearFilters,
    setPagination,
    reset,
} from "../../redux/slices/purchaseOrderSlice";
import { toast } from "react-toastify";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiCopy, FiCheck, FiX, FiSend } from "react-icons/fi";
import Layout from "../../components/Layout";

const PurchaseOrderList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { purchaseOrders, filters, pagination, isLoading, isError, isSuccess, message } =
        useSelector((state) => state.purchaseOrder);

    const [showFilters, setShowFilters] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [approvalComments, setApprovalComments] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [cancellationReason, setCancellationReason] = useState("");

    useEffect(() => {
        dispatch(getAllPurchaseOrders({ ...filters, ...pagination }));
    }, [dispatch, filters, pagination.page]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }
        if (isSuccess && message) {
            toast.success(message);
            dispatch(reset());
            dispatch(getAllPurchaseOrders({ ...filters, ...pagination }));
        }
    }, [isError, isSuccess, message, dispatch]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        dispatch(setFilters({ [name]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        dispatch(setPagination({ page: 1 }));
        dispatch(getAllPurchaseOrders({ ...filters, page: 1, limit: pagination.limit }));
    };

    const handleClearFilters = () => {
        dispatch(clearFilters());
        dispatch(setPagination({ page: 1 }));
    };

    const handlePageChange = (newPage) => {
        dispatch(setPagination({ page: newPage }));
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this Purchase Order?")) {
            await dispatch(deletePurchaseOrder(id));
        }
    };

    const handleSubmit = async (id) => {
        if (window.confirm("Submit this Purchase Order for approval?")) {
            await dispatch(submitForApproval(id));
        }
    };

    const handleApprove = async () => {
        if (selectedPO) {
            await dispatch(approvePurchaseOrder({ id: selectedPO._id, comments: approvalComments }));
            setShowApprovalModal(false);
            setApprovalComments("");
            setSelectedPO(null);
        }
    };

    const handleReject = async () => {
        if (selectedPO && rejectionReason.trim()) {
            await dispatch(rejectPurchaseOrder({ id: selectedPO._id, rejectionReason }));
            setShowRejectModal(false);
            setRejectionReason("");
            setSelectedPO(null);
        } else {
            toast.error("Rejection reason is required");
        }
    };

    const handleCancel = async () => {
        if (selectedPO && cancellationReason.trim()) {
            await dispatch(cancelPurchaseOrder({ id: selectedPO._id, cancellationReason }));
            setShowCancelModal(false);
            setCancellationReason("");
            setSelectedPO(null);
        } else {
            toast.error("Cancellation reason is required");
        }
    };

    const handleDuplicate = async (id) => {
        await dispatch(duplicatePurchaseOrder(id));
        toast.success("Purchase Order duplicated successfully");
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            Draft: "bg-gray-200 text-gray-800",
            "Pending Approval": "bg-yellow-200 text-yellow-800",
            Approved: "bg-green-200 text-green-800",
            "Partially Received": "bg-blue-200 text-blue-800",
            "Fully Received": "bg-purple-200 text-purple-800",
            Closed: "bg-gray-400 text-white",
            Cancelled: "bg-red-200 text-red-800",
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || "bg-gray-200"}`}>
                {status}
            </span>
        );
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
                    <button
                        onClick={() => navigate("/purchase-orders/new")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <FiPlus /> New Purchase Order
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Filters</h2>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            {showFilters ? "Hide" : "Show"} Filters
                        </button>
                    </div>

                    {showFilters && (
                        <form onSubmit={handleSearch}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                    <input
                                        type="text"
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder="PO number, supplier..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={filters.status}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Pending Approval">Pending Approval</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Partially Received">Partially Received</option>
                                        <option value="Fully Received">Fully Received</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                                    <input
                                        type="number"
                                        name="minAmount"
                                        value={filters.minAmount}
                                        onChange={handleFilterChange}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                                    <input
                                        type="number"
                                        name="maxAmount"
                                        value={filters.maxAmount}
                                        onChange={handleFilterChange}
                                        placeholder="999999"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : purchaseOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No purchase orders found</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                PO Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Supplier
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {purchaseOrders.map((po) => (
                                            <tr key={po._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {po.poNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(po.poDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {po.supplier?.businessName || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₹{po.totalAmount?.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(po.status)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => navigate(`/purchase-orders/${po._id}`)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="View"
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        {po.status === "Draft" && (
                                                            <>
                                                                <button
                                                                    onClick={() => navigate(`/purchase-orders/${po._id}/edit`)}
                                                                    className="text-green-600 hover:text-green-900"
                                                                    title="Edit"
                                                                >
                                                                    <FiEdit />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSubmit(po._id)}
                                                                    className="text-purple-600 hover:text-purple-900"
                                                                    title="Submit for Approval"
                                                                >
                                                                    <FiSend />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(po._id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title="Delete"
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </>
                                                        )}

                                                        {po.status === "Pending Approval" && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPO(po);
                                                                        setShowApprovalModal(true);
                                                                    }}
                                                                    className="text-green-600 hover:text-green-900"
                                                                    title="Approve"
                                                                >
                                                                    <FiCheck />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPO(po);
                                                                        setShowRejectModal(true);
                                                                    }}
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title="Reject"
                                                                >
                                                                    <FiX />
                                                                </button>
                                                            </>
                                                        )}

                                                        {(po.status === "Approved" ||
                                                            po.status === "Partially Received") && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPO(po);
                                                                        setShowCancelModal(true);
                                                                    }}
                                                                    className="text-red-600 hover:text-red-900"
                                                                    title="Cancel"
                                                                >
                                                                    <FiX />
                                                                </button>
                                                            )}

                                                        <button
                                                            onClick={() => handleDuplicate(po._id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title="Duplicate"
                                                        >
                                                            <FiCopy />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.pages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                                            <span className="font-medium">
                                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                                            </span>{" "}
                                            of <span className="font-medium">{pagination.total}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                                disabled={pagination.page === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            {[...Array(pagination.pages)].map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => handlePageChange(i + 1)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.page === i + 1
                                                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                                disabled={pagination.page >= pagination.pages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Approval Modal */}
                {showApprovalModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">Approve Purchase Order</h3>
                            <p className="text-gray-600 mb-4">
                                Approve PO: <strong>{selectedPO?.poNumber}</strong>
                            </p>
                            <textarea
                                value={approvalComments}
                                onChange={(e) => setApprovalComments(e.target.value)}
                                placeholder="Comments (optional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                                rows="3"
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowApprovalModal(false);
                                        setApprovalComments("");
                                        setSelectedPO(null);
                                    }}
                                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">Reject Purchase Order</h3>
                            <p className="text-gray-600 mb-4">
                                Reject PO: <strong>{selectedPO?.poNumber}</strong>
                            </p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Rejection reason (required)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                                rows="3"
                                required
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason("");
                                        setSelectedPO(null);
                                    }}
                                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">Cancel Purchase Order</h3>
                            <p className="text-gray-600 mb-4">
                                Cancel PO: <strong>{selectedPO?.poNumber}</strong>
                            </p>
                            <textarea
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Cancellation reason (required)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                                rows="3"
                                required
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancellationReason("");
                                        setSelectedPO(null);
                                    }}
                                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                                >
                                    Confirm Cancellation
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PurchaseOrderList;
