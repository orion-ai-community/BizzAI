import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getGRNById, finalizeGRN, reset } from "../../redux/slices/grnSlice";
import { toast } from "react-toastify";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import Layout from "../../components/Layout";

const GRNDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentGRN, isLoading, isError, isSuccess, message } = useSelector((state) => state.grn);

    useEffect(() => {
        dispatch(getGRNById(id));
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

    const handleFinalize = async () => {
        if (window.confirm("Finalize this GRN? This will update inventory and cannot be undone.")) {
            await dispatch(finalizeGRN(id));
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            Draft: "bg-gray-200 text-gray-800",
            Finalized: "bg-green-200 text-green-800",
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status] || "bg-gray-200"}`}>
                {status}
            </span>
        );
    };

    const getQualityBadge = (quality) => {
        const qualityColors = {
            passed: "bg-green-100 text-green-800",
            failed: "bg-red-100 text-red-800",
            partial: "bg-yellow-100 text-yellow-800",
        };

        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${qualityColors[quality] || "bg-gray-100"}`}>
                {quality?.toUpperCase()}
            </span>
        );
    };

    if (isLoading) {
        return <div className="container mx-auto px-4 py-6">Loading...</div>;
    }

    if (!currentGRN) {
        return <div className="container mx-auto px-4 py-6">GRN not found</div>;
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/grns")} className="text-gray-600 hover:text-gray-800">
                            <FiArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{currentGRN.grnNumber}</h1>
                            <p className="text-gray-600">Goods Received Note Details</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {currentGRN.status === "Draft" && (
                            <button
                                onClick={handleFinalize}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <FiCheck /> Finalize GRN
                            </button>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <div className="mt-1">{getStatusBadge(currentGRN.status)}</div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">GRN Date</p>
                            <p className="text-lg font-semibold">
                                {new Date(currentGRN.grnDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">PO Number</p>
                            <p className="text-lg font-semibold">
                                {currentGRN.purchaseOrder?.poNumber || "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Supplier</p>
                            <p className="text-lg font-semibold">
                                {currentGRN.supplier?.businessName || "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Received By</p>
                            <p className="text-lg font-semibold">{currentGRN.receivedBy}</p>
                        </div>
                        {currentGRN.vehicleNumber && (
                            <div>
                                <p className="text-sm text-gray-600">Vehicle Number</p>
                                <p className="text-lg font-semibold">{currentGRN.vehicleNumber}</p>
                            </div>
                        )}
                        {currentGRN.driverName && (
                            <div>
                                <p className="text-sm text-gray-600">Driver Name</p>
                                <p className="text-lg font-semibold">{currentGRN.driverName}</p>
                            </div>
                        )}
                        {currentGRN.driverContact && (
                            <div>
                                <p className="text-sm text-gray-600">Driver Contact</p>
                                <p className="text-lg font-semibold">{currentGRN.driverContact}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Items Received</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Item
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Received Qty
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Rejected Qty
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Accepted Qty
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Quality Check
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Batch No
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Expiry Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentGRN.items?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {item.item?.name || item.itemName || "N/A"}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{item.receivedQty}</td>
                                        <td className="px-4 py-3 text-sm text-red-600">{item.rejectedQty || 0}</td>
                                        <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                                            {item.acceptedQty}
                                        </td>
                                        <td className="px-4 py-3">{getQualityBadge(item.qualityCheck)}</td>
                                        <td className="px-4 py-3 text-sm">{item.batchNo || "-"}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {item.expiryDate
                                                ? new Date(item.expiryDate).toLocaleDateString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total Items</p>
                            <p className="text-2xl font-bold text-blue-600">{currentGRN.items?.length || 0}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total Accepted</p>
                            <p className="text-2xl font-bold text-green-600">
                                {currentGRN.items?.reduce((sum, item) => sum + (item.acceptedQty || 0), 0)}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total Rejected</p>
                            <p className="text-2xl font-bold text-red-600">
                                {currentGRN.items?.reduce((sum, item) => sum + (item.rejectedQty || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {currentGRN.notes && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Notes</h2>
                        <p className="text-gray-600">{currentGRN.notes}</p>
                    </div>
                )}

                {/* Finalization Info */}
                {currentGRN.status === "Finalized" && currentGRN.finalizedAt && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold mb-4">Finalization Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Finalized By</p>
                                <p className="text-lg font-semibold">{currentGRN.finalizedBy?.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Finalized At</p>
                                <p className="text-lg font-semibold">
                                    {new Date(currentGRN.finalizedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default GRNDetail;
