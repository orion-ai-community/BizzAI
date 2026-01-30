import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
    getPurchaseOrderById,
    convertToPurchase,
    reset,
} from "../../redux/slices/purchaseOrderSlice";
import { toast } from "react-toastify";
import { FiArrowLeft, FiEdit, FiFileText, FiPackage } from "react-icons/fi";
import Layout from "../../components/Layout";

const PurchaseOrderDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentPO, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.purchaseOrder
    );

    useEffect(() => {
        dispatch(getPurchaseOrderById(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }
        if (isSuccess && message) {
            toast.success(message);
            dispatch(reset());
        }
    }, [isError, isSuccess, message, dispatch]);

    const handleConvertToPurchase = async () => {
        if (window.confirm("Convert this PO to Purchase?")) {
            await dispatch(convertToPurchase(id));
        }
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
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status] || "bg-gray-200"}`}>
                {status}
            </span>
        );
    };

    if (isLoading) {
        return <div className="container mx-auto px-4 py-6">Loading...</div>;
    }

    if (!currentPO) {
        return <div className="container mx-auto px-4 py-6">Purchase Order not found</div>;
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/purchase-orders")}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            <FiArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{currentPO.poNumber}</h1>
                            <p className="text-gray-600">Purchase Order Details</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {currentPO.status === "Draft" && (
                            <button
                                onClick={() => navigate(`/purchase-orders/${id}/edit`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <FiEdit /> Edit
                            </button>
                        )}
                        {currentPO.status === "Approved" && !currentPO.convertedToPurchase && (
                            <button
                                onClick={handleConvertToPurchase}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <FiFileText /> Convert to Purchase
                            </button>
                        )}
                        {(currentPO.status === "Approved" || currentPO.status === "Partially Received") && (
                            <button
                                onClick={() => navigate(`/grns/new?po=${id}`)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                            >
                                Create GRN
                            </button>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <div className="mt-1">{getStatusBadge(currentPO.status)}</div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">PO Date</p>
                            <p className="text-lg font-semibold">{new Date(currentPO.poDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Expected Delivery</p>
                            <p className="text-lg font-semibold">
                                {new Date(currentPO.expectedDeliveryDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Supplier</p>
                            <p className="text-lg font-semibold">{currentPO.supplier?.businessName || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-lg font-semibold text-blue-600">₹{currentPO.totalAmount?.toLocaleString()}</p>
                        </div>
                        {currentPO.warehouse && (
                            <div>
                                <p className="text-sm text-gray-600">Warehouse</p>
                                <p className="text-lg font-semibold">{currentPO.warehouse}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Items</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentPO.items?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 text-sm">{item.itemName}</td>
                                        <td className="px-4 py-3 text-sm">{item.orderedQty}</td>
                                        <td className="px-4 py-3 text-sm text-green-600">{item.receivedQty}</td>
                                        <td className="px-4 py-3 text-sm text-orange-600">{item.pendingQty}</td>
                                        <td className="px-4 py-3 text-sm">₹{item.rate}</td>
                                        <td className="px-4 py-3 text-sm">{item.discount}</td>
                                        <td className="px-4 py-3 text-sm">{item.taxRate}%</td>
                                        <td className="px-4 py-3 text-sm font-semibold">₹{item.total?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-semibold">₹{currentPO.subtotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Item Discount:</span>
                            <span className="font-semibold text-red-600">-₹{currentPO.itemDiscount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Bill Discount:</span>
                            <span className="font-semibold text-red-600">-₹{currentPO.billDiscount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">CGST:</span>
                            <span className="font-semibold">₹{currentPO.totalCGST?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">SGST:</span>
                            <span className="font-semibold">₹{currentPO.totalSGST?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">IGST:</span>
                            <span className="font-semibold">₹{currentPO.totalIGST?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Shipping Charges:</span>
                            <span className="font-semibold">₹{currentPO.shippingCharges?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Packing Charges:</span>
                            <span className="font-semibold">₹{currentPO.packingCharges?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Other Charges:</span>
                            <span className="font-semibold">₹{currentPO.otherCharges?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">TDS:</span>
                            <span className="font-semibold text-red-600">-₹{currentPO.tdsAmount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Round Off:</span>
                            <span className="font-semibold">₹{currentPO.roundOff?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                            <span>Total Amount:</span>
                            <span className="text-blue-600">₹{currentPO.totalAmount?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Approval History */}
                {currentPO.approvalHistory && currentPO.approvalHistory.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Approval History</h2>
                        <div className="space-y-3">
                            {currentPO.approvalHistory.map((approval, index) => (
                                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{approval.approverName}</p>
                                            <p className="text-sm text-gray-600 capitalize">{approval.action}</p>
                                            {approval.comments && (
                                                <p className="text-sm text-gray-700 mt-1">{approval.comments}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(approval.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* GRNs */}
                {currentPO.grns && currentPO.grns.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Goods Received Notes</h2>
                        <div className="space-y-2">
                            {currentPO.grns.map((grn, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <span className="font-medium">{grn.grnNumber || grn._id}</span>
                                    <button
                                        onClick={() => navigate(`/grns/${grn._id}`)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {(currentPO.notes || currentPO.termsAndConditions) && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Notes & Terms</h2>
                        {currentPO.notes && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700">Notes:</p>
                                <p className="text-gray-600 mt-1">{currentPO.notes}</p>
                            </div>
                        )}
                        {currentPO.termsAndConditions && (
                            <div>
                                <p className="text-sm font-medium text-gray-700">Terms & Conditions:</p>
                                <p className="text-gray-600 mt-1">{currentPO.termsAndConditions}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Audit Trail */}
                {currentPO.auditLog && currentPO.auditLog.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold mb-4">Audit Trail</h2>
                        <div className="space-y-2">
                            {currentPO.auditLog.map((log, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div>
                                        <span className="font-medium capitalize">{log.action}</span>
                                        <span className="text-gray-600"> by {log.performedByName}</span>
                                        {log.details && <span className="text-gray-500"> - {log.details}</span>}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PurchaseOrderDetail;
