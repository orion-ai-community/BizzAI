import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createGRN, reset } from "../../redux/slices/grnSlice";
import { getPurchaseOrderById } from "../../redux/slices/purchaseOrderSlice";
import { toast } from "react-toastify";
import { FiSave, FiX } from "react-icons/fi";
import Layout from "../../components/Layout";

const GRNForm = () => {
    const [searchParams] = useSearchParams();
    const poId = searchParams.get("po");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isLoading, isError, isSuccess, message } = useSelector((state) => state.grn);
    const { currentPO } = useSelector((state) => state.purchaseOrder);

    const [formData, setFormData] = useState({
        purchaseOrder: poId || "",
        grnDate: new Date().toISOString().split("T")[0],
        receivedBy: "",
        vehicleNumber: "",
        driverName: "",
        driverContact: "",
        items: [],
        notes: "",
    });

    useEffect(() => {
        if (poId) {
            dispatch(getPurchaseOrderById(poId));
        }
    }, [dispatch, poId]);

    useEffect(() => {
        if (currentPO && currentPO.items) {
            const grnItems = currentPO.items.map((item) => ({
                item: item.item?._id || item.item,
                itemName: item.itemName || item.item?.name,
                orderedQty: item.orderedQty,
                receivedQty: item.receivedQty || 0,
                pendingQty: item.pendingQty,
                receivingQty: 0,
                rejectedQty: 0,
                qualityCheck: "passed",
                batchNo: item.batchNo || "",
                expiryDate: item.expiryDate || "",
                remarks: "",
            }));
            setFormData({ ...formData, items: grnItems });
        }
    }, [currentPO]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }
        if (isSuccess && message) {
            toast.success(message);
            dispatch(reset());
            navigate("/grns");
        }
    }, [isError, isSuccess, message, dispatch, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;

        // Auto-calculate accepted quantity
        if (field === "receivingQty" || field === "rejectedQty") {
            const receivingQty = parseFloat(updatedItems[index].receivingQty) || 0;
            const rejectedQty = parseFloat(updatedItems[index].rejectedQty) || 0;
            updatedItems[index].acceptedQty = receivingQty - rejectedQty;

            // Update quality check based on rejection
            if (rejectedQty === 0) {
                updatedItems[index].qualityCheck = "passed";
            } else if (rejectedQty === receivingQty) {
                updatedItems[index].qualityCheck = "failed";
            } else {
                updatedItems[index].qualityCheck = "partial";
            }
        }

        setFormData({ ...formData, items: updatedItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.purchaseOrder) {
            toast.error("Please select a Purchase Order");
            return;
        }

        if (!formData.receivedBy) {
            toast.error("Please enter received by name");
            return;
        }

        const hasReceivingItems = formData.items.some((item) => parseFloat(item.receivingQty) > 0);
        if (!hasReceivingItems) {
            toast.error("Please enter receiving quantity for at least one item");
            return;
        }

        // Validate receiving quantities
        const invalidItems = formData.items.filter(
            (item) => parseFloat(item.receivingQty) > item.pendingQty
        );
        if (invalidItems.length > 0) {
            toast.error("Receiving quantity cannot exceed pending quantity");
            return;
        }

        const grnData = {
            ...formData,
            items: formData.items
                .filter((item) => parseFloat(item.receivingQty) > 0)
                .map((item) => ({
                    item: item.item,
                    receivedQty: parseFloat(item.receivingQty),
                    rejectedQty: parseFloat(item.rejectedQty) || 0,
                    qualityCheck: item.qualityCheck,
                    batchNo: item.batchNo || "",
                    expiryDate: item.expiryDate || null,
                    remarks: item.remarks || "",
                })),
        };

        await dispatch(createGRN(grnData));
    };

    if (!currentPO) {
        return (
            <div className="container mx-auto px-4 py-6">
                <p>Loading Purchase Order...</p>
            </div>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Create Goods Received Note</h1>
                    <button onClick={() => navigate("/grns")} className="text-gray-600 hover:text-gray-800">
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* PO Details */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Purchase Order Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">PO Number</p>
                                <p className="text-lg font-semibold">{currentPO.poNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Supplier</p>
                                <p className="text-lg font-semibold">{currentPO.supplier?.businessName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">PO Date</p>
                                <p className="text-lg font-semibold">
                                    {new Date(currentPO.poDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* GRN Details */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">GRN Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    GRN Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="grnDate"
                                    value={formData.grnDate}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Received By <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="receivedBy"
                                    value={formData.receivedBy}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                                <input
                                    type="text"
                                    name="vehicleNumber"
                                    value={formData.vehicleNumber}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                                <input
                                    type="text"
                                    name="driverName"
                                    value={formData.driverName}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Contact</label>
                                <input
                                    type="text"
                                    name="driverContact"
                                    value={formData.driverContact}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6 overflow-x-auto">
                        <h2 className="text-lg font-semibold mb-4">Items</h2>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Item
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Ordered
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Already Received
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Pending
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Receiving Now
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Rejected
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Accepted
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Quality
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Batch No
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Expiry
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-3 text-sm font-medium">{item.itemName}</td>
                                        <td className="px-4 py-3 text-sm">{item.orderedQty}</td>
                                        <td className="px-4 py-3 text-sm text-green-600">{item.receivedQty}</td>
                                        <td className="px-4 py-3 text-sm text-orange-600">{item.pendingQty}</td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.receivingQty}
                                                onChange={(e) =>
                                                    handleItemChange(index, "receivingQty", e.target.value)
                                                }
                                                min="0"
                                                max={item.pendingQty}
                                                step="1"
                                                className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.rejectedQty}
                                                onChange={(e) =>
                                                    handleItemChange(index, "rejectedQty", e.target.value)
                                                }
                                                min="0"
                                                max={item.receivingQty}
                                                step="1"
                                                className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                            {item.acceptedQty || 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={item.qualityCheck}
                                                onChange={(e) =>
                                                    handleItemChange(index, "qualityCheck", e.target.value)
                                                }
                                                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="passed">Passed</option>
                                                <option value="failed">Failed</option>
                                                <option value="partial">Partial</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={item.batchNo}
                                                onChange={(e) => handleItemChange(index, "batchNo", e.target.value)}
                                                placeholder="Batch"
                                                className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="date"
                                                value={item.expiryDate}
                                                onChange={(e) =>
                                                    handleItemChange(index, "expiryDate", e.target.value)
                                                }
                                                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Notes</h2>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Any additional notes..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={() => navigate("/grns")}
                            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
                        >
                            <FiSave /> {isLoading ? "Creating..." : "Create GRN"}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default GRNForm;
