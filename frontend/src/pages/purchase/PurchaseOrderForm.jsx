import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrderById,
    reset,
} from "../../redux/slices/purchaseOrderSlice";
import { getAllSuppliers } from "../../redux/slices/supplierSlice";
import { getAllItems } from "../../redux/slices/inventorySlice";
import { toast } from "react-toastify";
import { FiPlus, FiTrash2, FiSave, FiX } from "react-icons/fi";
import api from "../../services/api";
import QuickAddItemModal from "../../components/QuickAddItemModal";
import Layout from "../../components/Layout";

const PurchaseOrderForm = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const { currentPO, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.purchaseOrder
    );
    const { suppliers } = useSelector((state) => state.suppliers);
    const { items } = useSelector((state) => state.inventory);

    const [formData, setFormData] = useState({
        poDate: new Date().toISOString().split("T")[0],
        expectedDeliveryDate: "",
        supplier: "",
        warehouse: "",
        items: [],
        billDiscount: 0,
        shippingCharges: 0,
        packingCharges: 0,
        otherCharges: 0,
        tdsAmount: 0,
        notes: "",
        termsAndConditions: "",
    });

    const [selectedItem, setSelectedItem] = useState("");
    const [itemDetails, setItemDetails] = useState({
        item: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        discountType: "flat",
        taxRate: 0,
        description: "",
        batchNo: "",
        expiryDate: "",
    });

    // Barcode scanning state
    const [scanInput, setScanInput] = useState("");
    const [scanError, setScanError] = useState("");
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [quickAddBarcode, setQuickAddBarcode] = useState("");
    const scanInputRef = useRef(null);

    // Draft auto-save state
    const [hasDraft, setHasDraft] = useState(false);
    const DRAFT_KEY = 'purchaseOrderDraft';

    // Load draft on mount
    useEffect(() => {
        if (!isEditMode) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    setFormData(draft);
                    setHasDraft(true);
                    toast.info('Draft restored');
                } catch (error) {
                    console.error('Failed to load draft:', error);
                }
            }
        }
    }, [isEditMode]);

    // Auto-save draft
    useEffect(() => {
        if (!isEditMode && (formData.supplier || formData.items.length > 0)) {
            const timer = setTimeout(() => {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
                setHasDraft(true);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [formData, isEditMode]);

    // Clear draft helper
    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
    };

    useEffect(() => {
        dispatch(getAllSuppliers({ page: 1, limit: 1000 }));
        dispatch(getAllItems({ page: 1, limit: 1000 }));

        if (isEditMode) {
            dispatch(getPurchaseOrderById(id));
        }

        // Auto-focus scan input on mount
        if (scanInputRef.current && !isEditMode) {
            scanInputRef.current.focus();
        }
    }, [dispatch, id, isEditMode]);

    useEffect(() => {
        if (isEditMode && currentPO) {
            setFormData({
                poDate: new Date(currentPO.poDate).toISOString().split("T")[0],
                expectedDeliveryDate: new Date(currentPO.expectedDeliveryDate)
                    .toISOString()
                    .split("T")[0],
                supplier: currentPO.supplier?._id || "",
                warehouse: currentPO.warehouse || "",
                items: currentPO.items || [],
                billDiscount: currentPO.billDiscount || 0,
                shippingCharges: currentPO.shippingCharges || 0,
                packingCharges: currentPO.packingCharges || 0,
                otherCharges: currentPO.otherCharges || 0,
                tdsAmount: currentPO.tdsAmount || 0,
                notes: currentPO.notes || "",
                termsAndConditions: currentPO.termsAndConditions || "",
            });
        }
    }, [isEditMode, currentPO]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }
        if (isSuccess && message) {
            toast.success(message);
            clearDraft(); // Clear draft on successful creation
            dispatch(reset());
            navigate("/purchase-orders");
        }
    }, [isError, isSuccess, message, dispatch, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleItemSelect = (e) => {
        const itemId = e.target.value;
        setSelectedItem(itemId);

        const item = items.find((i) => i._id === itemId);
        if (item) {
            setItemDetails({
                ...itemDetails,
                item: itemId,
                rate: item.purchaseRate || 0,
                taxRate: item.taxRate || 0,
            });
        }
    };

    const handleItemDetailChange = (e) => {
        const { name, value } = e.target;
        setItemDetails({ ...itemDetails, [name]: value });
    };

    const calculateItemTotal = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const discount = parseFloat(item.discount) || 0;
        const taxRate = parseFloat(item.taxRate) || 0;

        let taxableValue = qty * rate;
        if (item.discountType === "percentage") {
            taxableValue -= (taxableValue * discount) / 100;
        } else {
            taxableValue -= discount;
        }

        const taxAmount = (taxableValue * taxRate) / 100;
        return taxableValue + taxAmount;
    };

    const addItem = () => {
        if (!itemDetails.item || itemDetails.quantity <= 0 || itemDetails.rate <= 0) {
            toast.error("Please fill all item details");
            return;
        }

        const item = items.find((i) => i._id === itemDetails.item);
        if (!item) {
            toast.error("Invalid item selected");
            return;
        }

        const newItem = {
            ...itemDetails,
            itemName: item.name,
            unit: item.unit || "pcs",
            hsnCode: item.hsnCode || "",
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem],
        });

        // Reset item details
        setItemDetails({
            item: "",
            quantity: 1,
            rate: 0,
            discount: 0,
            discountType: "flat",
            taxRate: 0,
            description: "",
            batchNo: "",
            expiryDate: "",
        });
        setSelectedItem("");
    };

    const removeItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: updatedItems });
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;
        setFormData({ ...formData, items: updatedItems });
    };

    // Handle barcode scan
    const handleScanKeyDown = async (e) => {
        if (e.key === "Enter" && scanInput.trim()) {
            setScanError("");

            try {
                const response = await api.get(`/api/inventory/scan?code=${encodeURIComponent(scanInput.trim())}`);
                const scannedItem = response.data;

                // Check if item already in table
                const existingIndex = formData.items.findIndex((i) => i.item === scannedItem._id);

                if (existingIndex >= 0) {
                    // Increment quantity
                    const updatedItems = [...formData.items];
                    updatedItems[existingIndex].quantity = parseFloat(updatedItems[existingIndex].quantity) + 1;
                    setFormData({ ...formData, items: updatedItems });
                    toast.success(`Quantity increased for ${scannedItem.name}`);
                } else {
                    // Add new item
                    const newItem = {
                        item: scannedItem._id,
                        itemName: scannedItem.name,
                        quantity: 1,
                        rate: scannedItem.lastPurchaseRate || scannedItem.costPrice || 0,
                        discount: 0,
                        discountType: "flat",
                        taxRate: scannedItem.taxRate || 18,
                        unit: scannedItem.unit || "pcs",
                        hsnCode: scannedItem.hsnCode || "",
                        batchNo: "",
                        expiryDate: "",
                        description: "",
                    };
                    setFormData({ ...formData, items: [...formData.items, newItem] });
                    toast.success(`Added ${scannedItem.name}`);
                }

                // Clear and refocus
                setScanInput("");
                if (scanInputRef.current) {
                    scanInputRef.current.focus();
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    // Item not found - open quick add modal
                    setQuickAddBarcode(scanInput.trim());
                    setShowQuickAddModal(true);
                    setScanInput("");
                } else {
                    const message = error.response?.data?.message || "Failed to scan item";
                    setScanError(message);
                    toast.error(message);
                }
            }
        }
    };

    // Handle item created from Quick Add modal
    const handleItemCreated = (createdItem) => {
        // Add created item to PO table
        const newItem = {
            item: createdItem._id,
            itemName: createdItem.name,
            quantity: 1,
            rate: createdItem.lastPurchaseRate || createdItem.costPrice || 0,
            discount: 0,
            discountType: "flat",
            taxRate: createdItem.taxRate || 18,
            unit: createdItem.unit || "pcs",
            hsnCode: createdItem.hsnCode || "",
            batchNo: "",
            expiryDate: "",
            description: "",
        };
        setFormData({ ...formData, items: [...formData.items, newItem] });

        // Refresh items list
        dispatch(getAllItems({ page: 1, limit: 1000 }));

        // Refocus scan input
        setTimeout(() => {
            if (scanInputRef.current) {
                scanInputRef.current.focus();
            }
        }, 100);
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rate) || 0;
            return sum + qty * rate;
        }, 0);

        const itemDiscount = formData.items.reduce((sum, item) => {
            const discount = parseFloat(item.discount) || 0;
            if (item.discountType === "percentage") {
                const qty = parseFloat(item.quantity) || 0;
                const rate = parseFloat(item.rate) || 0;
                return sum + ((qty * rate * discount) / 100);
            }
            return sum + discount;
        }, 0);

        const taxableValue = subtotal - itemDiscount;

        const totalTax = formData.items.reduce((sum, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rate) || 0;
            const discount = parseFloat(item.discount) || 0;
            const taxRate = parseFloat(item.taxRate) || 0;

            let itemTaxable = qty * rate;
            if (item.discountType === "percentage") {
                itemTaxable -= (itemTaxable * discount) / 100;
            } else {
                itemTaxable -= discount;
            }

            return sum + (itemTaxable * taxRate) / 100;
        }, 0);

        const billDiscount = parseFloat(formData.billDiscount) || 0;
        const shippingCharges = parseFloat(formData.shippingCharges) || 0;
        const packingCharges = parseFloat(formData.packingCharges) || 0;
        const otherCharges = parseFloat(formData.otherCharges) || 0;
        const tdsAmount = parseFloat(formData.tdsAmount) || 0;

        const totalAmount =
            taxableValue + totalTax - billDiscount + shippingCharges + packingCharges + otherCharges - tdsAmount;

        return {
            subtotal: subtotal.toFixed(2),
            itemDiscount: itemDiscount.toFixed(2),
            taxableValue: taxableValue.toFixed(2),
            totalTax: totalTax.toFixed(2),
            totalAmount: Math.round(totalAmount),
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.supplier) {
            toast.error("Please select a supplier");
            return;
        }

        if (!formData.expectedDeliveryDate) {
            toast.error("Please select expected delivery date");
            return;
        }

        if (formData.items.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        const poData = {
            ...formData,
            items: formData.items.map((item) => ({
                item: item.item,
                quantity: parseFloat(item.quantity),
                rate: parseFloat(item.rate),
                discount: parseFloat(item.discount) || 0,
                discountType: item.discountType,
                taxRate: parseFloat(item.taxRate) || 0,
                description: item.description || "",
                batchNo: item.batchNo || "",
                expiryDate: item.expiryDate || null,
            })),
        };

        if (isEditMode) {
            await dispatch(updatePurchaseOrder({ id, poData }));
        } else {
            await dispatch(createPurchaseOrder(poData));
        }
    };

    const totals = calculateTotals();

    return (
        <Layout>
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                {isEditMode ? "Edit Purchase Order" : "Purchase Order"}
                            </h1>
                            <p className="text-gray-600">Create and manage purchase orders</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Draft indicator */}
                            {hasDraft && !isEditMode && (formData.supplier || formData.items.length > 0) && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-green-700">Draft Auto-Saved</span>
                                </div>
                            )}
                            {/* View All Purchase Orders Button */}
                            <button
                                onClick={() => navigate('/purchase-orders')}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                View All Purchase Orders
                            </button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Basic Details */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Basic Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PO Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="poDate"
                                    value={formData.poDate}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expected Delivery Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="expectedDeliveryDate"
                                    value={formData.expectedDeliveryDate}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="supplier"
                                    value={formData.supplier}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier._id} value={supplier._id}>
                                            {supplier.businessName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                                <input
                                    type="text"
                                    name="warehouse"
                                    value={formData.warehouse}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Add Items */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Add Items</h2>

                        {/* Barcode Scan Input */}
                        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                🔍 Scan Item (Barcode / SKU)
                            </label>
                            <input
                                ref={scanInputRef}
                                type="text"
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                onKeyDown={handleScanKeyDown}
                                placeholder="Scan barcode or enter SKU, then press Enter..."
                                className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                            />
                            {scanError && (
                                <p className="text-sm text-red-600 mt-1">{scanError}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                                💡 Tip: Use a USB barcode scanner or type manually and press Enter. Item not found? It will open quick-add dialog.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                                <select
                                    value={selectedItem}
                                    onChange={handleItemSelect}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Item</option>
                                    {items.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name} ({item.stockQty} in stock)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={itemDetails.quantity}
                                    onChange={handleItemDetailChange}
                                    min="1"
                                    step="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                                <input
                                    type="number"
                                    name="rate"
                                    value={itemDetails.rate}
                                    onChange={handleItemDetailChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={itemDetails.discount}
                                    onChange={handleItemDetailChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                <select
                                    name="discountType"
                                    value={itemDetails.discountType}
                                    onChange={handleItemDetailChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="flat">Flat</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    name="taxRate"
                                    value={itemDetails.taxRate}
                                    onChange={handleItemDetailChange}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch No</label>
                                <input
                                    type="text"
                                    name="batchNo"
                                    value={itemDetails.batchNo}
                                    onChange={handleItemDetailChange}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={itemDetails.expiryDate}
                                    onChange={handleItemDetailChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                        >
                            <FiPlus /> Add Item
                        </button>
                    </div>

                    {/* Items Table */}
                    {formData.items.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6 overflow-x-auto">
                            <h2 className="text-lg font-semibold mb-4">Items</h2>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Item
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Qty
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Rate
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Discount
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Tax %
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Total
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 text-sm">{item.itemName}</td>
                                            <td className="px-4 py-2 text-sm">{item.quantity}</td>
                                            <td className="px-4 py-2 text-sm">₹{item.rate}</td>
                                            <td className="px-4 py-2 text-sm">
                                                {item.discount} {item.discountType === "percentage" ? "%" : ""}
                                            </td>
                                            <td className="px-4 py-2 text-sm">{item.taxRate}%</td>
                                            <td className="px-4 py-2 text-sm font-semibold">
                                                ₹{calculateItemTotal(item).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Additional Charges */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Additional Charges & Discounts</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bill Discount</label>
                                <input
                                    type="number"
                                    name="billDiscount"
                                    value={formData.billDiscount}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Charges</label>
                                <input
                                    type="number"
                                    name="shippingCharges"
                                    value={formData.shippingCharges}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Packing Charges</label>
                                <input
                                    type="number"
                                    name="packingCharges"
                                    value={formData.packingCharges}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Other Charges</label>
                                <input
                                    type="number"
                                    name="otherCharges"
                                    value={formData.otherCharges}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">TDS Amount</label>
                                <input
                                    type="number"
                                    name="tdsAmount"
                                    value={formData.tdsAmount}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Notes & Terms</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Terms & Conditions
                                </label>
                                <textarea
                                    name="termsAndConditions"
                                    value={formData.termsAndConditions}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Summary</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-semibold">₹{totals.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Item Discount:</span>
                                <span className="font-semibold text-red-600">-₹{totals.itemDiscount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Taxable Value:</span>
                                <span className="font-semibold">₹{totals.taxableValue}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Tax:</span>
                                <span className="font-semibold">₹{totals.totalTax}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Bill Discount:</span>
                                <span className="font-semibold text-red-600">-₹{formData.billDiscount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Additional Charges:</span>
                                <span className="font-semibold">
                                    ₹
                                    {(
                                        parseFloat(formData.shippingCharges) +
                                        parseFloat(formData.packingCharges) +
                                        parseFloat(formData.otherCharges)
                                    ).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">TDS:</span>
                                <span className="font-semibold text-red-600">-₹{formData.tdsAmount}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total Amount:</span>
                                <span>₹{totals.totalAmount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={() => navigate("/purchase-orders")}
                            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
                        >
                            <FiSave /> {isLoading ? "Saving..." : isEditMode ? "Update PO" : "Create PO"}
                        </button>
                    </div>
                </form>

                {/* Quick Add Item Modal */}
                {showQuickAddModal && (
                    <QuickAddItemModal
                        isOpen={showQuickAddModal}
                        onClose={() => setShowQuickAddModal(false)}
                        onItemCreated={handleItemCreated}
                        initialBarcode={quickAddBarcode}
                    />
                )}
            </div>
        </Layout>
    );
};

export default PurchaseOrderForm;
