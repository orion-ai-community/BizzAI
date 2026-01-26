import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Layout from '../../components/Layout';
import QuickAddItemModal from '../../components/QuickAddItemModal';
import useDraftSave from '../../hooks/useDraftSave';
import { getAllItems } from '../../redux/slices/inventorySlice';
import { getAllSuppliers } from '../../redux/slices/supplierSlice';
import { getAccounts } from '../../redux/slices/cashbankSlice';
import { createPurchase, reset } from '../../redux/slices/purchaseSlice';

const PurchaseEntry = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { items } = useSelector((state) => state.inventory);
    const { suppliers } = useSelector((state) => state.suppliers);
    const { accounts } = useSelector((state) => state.cashbank);
    const { isLoading, isSuccess, isError, message, currentPurchase } = useSelector((state) => state.purchase);
    const { user } = useSelector((state) => state.auth);

    // Use draft save hook to preserve form data
    const initialFormData = {
        purchaseDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNo: '',
        supplierInvoiceDate: new Date().toISOString().split('T')[0],
        supplier: null,
        purchaseType: 'cash',
        referenceNo: '',
        notes: '',
        items: [{ item: null, quantity: 1, purchaseRate: 0, sellingPrice: 0, taxRate: 18, discount: 0, hsnCode: '', batchNo: '', expiryDate: '' }],
        billDiscount: 0,
        shippingCharges: 0,
        paidAmount: 0,
        paymentMethod: 'cash',
        bankAccount: '',
        paymentReference: '',
        status: 'finalized',
    };

    const [formData, setFormData, clearDraft, hasDraft] = useDraftSave('purchaseDraft', initialFormData);

    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState(null);

    // Barcode scanning state
    const [scanInput, setScanInput] = useState('');
    const [scanError, setScanError] = useState('');
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [quickAddBarcode, setQuickAddBarcode] = useState('');
    const scanInputRef = useRef(null);

    useEffect(() => {
        dispatch(getAllItems());
        dispatch(getAllSuppliers());
        dispatch(getAccounts());

        // Auto-focus scan input on mount
        if (scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [dispatch]);

    useEffect(() => {
        if (isSuccess && currentPurchase) {
            clearDraft(); // Clear draft on successful submission
            toast.success(message || 'Purchase created successfully');
            dispatch(reset());
            navigate(`/purchase/${currentPurchase._id}`);
        }

        if (isError) {
            toast.error(message || 'Failed to create purchase');
            dispatch(reset());
        }
    }, [isSuccess, isError, message, currentPurchase, dispatch, navigate, clearDraft]);

    // Calculate GST based on supplier state
    const isInterState = () => {
        if (!formData.supplier || !user?.gstNumber) return false;
        const businessState = user.gstNumber.substring(0, 2);
        const supplierState = formData.supplier.state || formData.supplier.gstNo?.substring(0, 2) || '';
        return businessState !== supplierState;
    };

    // Calculate item totals
    const calculateItemTotal = (item) => {
        const baseAmount = item.quantity * item.purchaseRate;
        const taxableValue = baseAmount - (item.discount || 0);
        const taxAmount = (taxableValue * (item.taxRate || 0)) / 100;
        const total = taxableValue + taxAmount;

        const interState = isInterState();
        let cgst = 0, sgst = 0, igst = 0;

        if (interState) {
            igst = taxAmount;
        } else {
            cgst = taxAmount / 2;
            sgst = taxAmount / 2;
        }

        return {
            baseAmount,
            taxableValue,
            cgst,
            sgst,
            igst,
            total,
        };
    };

    // Calculate summary totals
    const calculateTotals = () => {
        let subtotal = 0;
        let itemDiscount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        formData.items.forEach((item) => {
            if (item.item) {
                const calc = calculateItemTotal(item);
                subtotal += calc.baseAmount;
                itemDiscount += item.discount || 0;
                totalCGST += calc.cgst;
                totalSGST += calc.sgst;
                totalIGST += calc.igst;
            }
        });

        const beforeRoundOff = subtotal - itemDiscount - formData.billDiscount + formData.shippingCharges + totalCGST + totalSGST + totalIGST;
        const totalAmount = Math.round(beforeRoundOff);
        const roundOff = totalAmount - beforeRoundOff;

        return {
            subtotal,
            itemDiscount,
            totalCGST,
            totalSGST,
            totalIGST,
            roundOff,
            totalAmount,
            outstandingAmount: totalAmount - formData.paidAmount,
        };
    };

    const totals = calculateTotals();

    // Add item row
    const addItemRow = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { item: null, quantity: 1, purchaseRate: 0, sellingPrice: 0, taxRate: 18, discount: 0, hsnCode: '', batchNo: '', expiryDate: '' }],
        });
    };

    // Remove item row
    const removeItemRow = (index) => {
        if (formData.items.length === 1) {
            toast.error('At least one item is required');
            return;
        }
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    // Update item
    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Auto-fill from selected item
        if (field === 'item' && value) {
            const selectedItem = items.find((item) => item._id === value);
            if (selectedItem) {
                newItems[index].purchaseRate = selectedItem.costPrice || 0;
                newItems[index].sellingPrice = selectedItem.sellingPrice || 0;
                newItems[index].hsnCode = selectedItem.hsnCode || '';
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    // Handle barcode scan
    const handleScanKeyDown = async (e) => {
        if (e.key === 'Enter' && scanInput.trim()) {
            setScanError('');

            try {
                const response = await api.get(`/api/inventory/scan?code=${encodeURIComponent(scanInput.trim())}`);

                const scannedItem = response.data;

                // Check if item already in table
                const existingIndex = formData.items.findIndex(i => i.item === scannedItem._id);

                if (existingIndex >= 0) {
                    // Increment quantity
                    const newItems = [...formData.items];
                    newItems[existingIndex].quantity += 1;
                    setFormData({ ...formData, items: newItems });
                    toast.success(`Quantity increased for ${scannedItem.name}`);
                } else {
                    // Add new row
                    const newItem = {
                        item: scannedItem._id,
                        quantity: 1,
                        purchaseRate: scannedItem.lastPurchaseRate || scannedItem.costPrice || 0,
                        sellingPrice: scannedItem.sellingPrice || 0,
                        taxRate: 18,
                        discount: 0,
                        hsnCode: scannedItem.hsnCode || '',
                        batchNo: '',
                        expiryDate: ''
                    };
                    setFormData({ ...formData, items: [...formData.items, newItem] });
                    toast.success(`Added ${scannedItem.name}`);
                }

                // Clear and refocus
                setScanInput('');
                if (scanInputRef.current) {
                    scanInputRef.current.focus();
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    // Item not found - open quick add modal
                    setQuickAddBarcode(scanInput.trim());
                    setShowQuickAddModal(true);
                    setScanInput('');
                } else {
                    const message = error.response?.data?.message || 'Failed to scan item';
                    setScanError(message);
                    toast.error(message);
                }
            }
        }
    };

    // Handle item created from Quick Add modal
    const handleItemCreated = (createdItem) => {
        // Add created item to purchase table
        const newItem = {
            item: createdItem._id,
            quantity: 1,
            purchaseRate: createdItem.lastPurchaseRate || createdItem.costPrice || 0,
            sellingPrice: createdItem.sellingPrice || 0,
            taxRate: 18,
            discount: 0,
            hsnCode: createdItem.hsnCode || '',
            batchNo: '',
            expiryDate: ''
        };
        setFormData({ ...formData, items: [...formData.items, newItem] });

        // Refresh items list
        dispatch(getAllItems());

        // Refocus scan input
        setTimeout(() => {
            if (scanInputRef.current) {
                scanInputRef.current.focus();
            }
        }, 100);
    };

    // Handle submit
    const handleSubmit = async (saveAs) => {
        // Validation
        if (!formData.supplier) {
            toast.error('Please select a supplier');
            return;
        }

        if (!formData.supplierInvoiceNo) {
            toast.error('Supplier invoice number is required');
            return;
        }

        const validItems = formData.items.filter((item) => item.item);
        if (validItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        // Check for invalid quantities or rates
        for (const item of validItems) {
            if (item.quantity <= 0) {
                toast.error('All item quantities must be greater than 0');
                return;
            }
            if (item.purchaseRate < 0) {
                toast.error('Purchase rate cannot be negative');
                return;
            }
        }

        if (formData.paymentMethod === 'bank' && !formData.bankAccount) {
            toast.error('Please select a bank account');
            return;
        }

        // Prepare data for API
        const purchaseData = {
            purchaseDate: formData.purchaseDate,
            supplierInvoiceNo: formData.supplierInvoiceNo,
            supplierInvoiceDate: formData.supplierInvoiceDate,
            supplierId: formData.supplier._id,
            purchaseType: formData.purchaseType,
            referenceNo: formData.referenceNo,
            notes: formData.notes,
            items: validItems.map((item) => ({
                item: item.item,
                quantity: parseFloat(item.quantity),
                purchaseRate: parseFloat(item.purchaseRate),
                sellingPrice: parseFloat(item.sellingPrice) || 0,
                taxRate: parseFloat(item.taxRate) || 0,
                discount: parseFloat(item.discount) || 0,
                hsnCode: item.hsnCode || '',
                batchNo: item.batchNo || '',
                expiryDate: item.expiryDate || null,
            })),
            billDiscount: parseFloat(formData.billDiscount) || 0,
            shippingCharges: parseFloat(formData.shippingCharges) || 0,
            paidAmount: parseFloat(formData.paidAmount) || 0,
            paymentMethod: formData.paymentMethod,
            bankAccount: formData.paymentMethod === 'bank' ? formData.bankAccount : null,
            paymentReference: formData.paymentReference,
            status: saveAs === 'draft' ? 'draft' : 'finalized',
        };

        dispatch(createPurchase(purchaseData));
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-main mb-2">Purchase Entry</h1>
                            <p className="text-secondary">Record purchases from suppliers</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Draft indicator */}
                            {hasDraft && formData.items.some(item => item.item !== null) && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Draft Auto-Saved</span>
                                </div>
                            )}
                            {/* View All Purchases Button */}
                            <button
                                onClick={() => navigate('/purchase/list')}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                View All Purchases
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {isError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Purchase Header */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Purchase Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Purchase Date</label>
                                    <input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Supplier Invoice No *</label>
                                    <input
                                        type="text"
                                        value={formData.supplierInvoiceNo}
                                        onChange={(e) => setFormData({ ...formData, supplierInvoiceNo: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="Enter supplier invoice number"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Supplier Invoice Date</label>
                                    <input
                                        type="date"
                                        value={formData.supplierInvoiceDate}
                                        onChange={(e) => setFormData({ ...formData, supplierInvoiceDate: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Purchase Type</label>
                                    <select
                                        value={formData.purchaseType}
                                        onChange={(e) => setFormData({ ...formData, purchaseType: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Reference No (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.referenceNo}
                                        onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="PO number, etc."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Supplier Selection */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Supplier *</h2>
                            {formData.supplier ? (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-main">{formData.supplier.businessName}</p>
                                            <p className="text-sm text-secondary">{formData.supplier.contactPersonName}</p>
                                            <p className="text-sm text-secondary">{formData.supplier.contactNo}</p>
                                            <p className="text-sm text-secondary">GSTIN: {formData.supplier.gstNo}</p>
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, supplier: null })}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <select
                                        onChange={(e) => {
                                            const supplier = suppliers.find((s) => s._id === e.target.value);
                                            setFormData({ ...formData, supplier });
                                        }}
                                        className="w-full px-4 py-3 border-2 border-dashed rounded-lg focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select a supplier</option>
                                        {suppliers.map((supplier) => (
                                            <option key={supplier._id} value={supplier._id}>
                                                {supplier.businessName} - {supplier.contactPersonName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-main">Items *</h2>
                                <button
                                    onClick={addItemRow}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    + Add Item
                                </button>
                            </div>

                            {/* Barcode Scan Input */}
                            <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                                <label className="block text-sm font-medium text-secondary mb-2">
                                    🔍 Scan Item (Barcode / SKU)
                                </label>
                                <input
                                    ref={scanInputRef}
                                    type="text"
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={handleScanKeyDown}
                                    placeholder="Scan barcode or enter SKU, then press Enter..."
                                    className="w-full px-4 py-3 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-lg"
                                />
                                {scanError && (
                                    <p className="text-sm text-red-600 mt-1">{scanError}</p>
                                )}
                                <p className="text-xs text-secondary mt-1">
                                    💡 Tip: Use a USB barcode scanner or type manually and press Enter
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface border-b">
                                        <tr>
                                            <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase">Item</th>
                                            <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase">Qty</th>
                                            <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase">Rate</th>
                                            <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase">Selling</th>
                                            <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase">Tax%</th>
                                            <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase">Disc</th>
                                            <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase">Total</th>
                                            <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {formData.items.map((item, index) => {
                                            const calc = calculateItemTotal(item);
                                            return (
                                                <tr key={index}>
                                                    <td className="px-2 py-3">
                                                        <select
                                                            value={item.item || ''}
                                                            onChange={(e) => updateItem(index, 'item', e.target.value)}
                                                            className="w-full px-2 py-1 border rounded text-sm"
                                                        >
                                                            <option value="">Select item</option>
                                                            {items.map((i) => (
                                                                <option key={i._id} value={i._id}>
                                                                    {i.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-16 px-2 py-1 border rounded text-sm"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input
                                                            type="number"
                                                            value={item.purchaseRate}
                                                            onChange={(e) => updateItem(index, 'purchaseRate', parseFloat(e.target.value) || 0)}
                                                            className="w-20 px-2 py-1 border rounded text-sm"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input
                                                            type="number"
                                                            value={item.sellingPrice}
                                                            onChange={(e) => updateItem(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                                            className="w-20 px-2 py-1 border rounded text-sm"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <select
                                                            value={item.taxRate}
                                                            onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value))}
                                                            className="w-16 px-2 py-1 border rounded text-sm"
                                                        >
                                                            <option value="0">0%</option>
                                                            <option value="5">5%</option>
                                                            <option value="12">12%</option>
                                                            <option value="18">18%</option>
                                                            <option value="28">28%</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <input
                                                            type="number"
                                                            value={item.discount}
                                                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                            className="w-16 px-2 py-1 border rounded text-sm"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-3 font-medium">₹{calc.total.toFixed(2)}</td>
                                                    <td className="px-2 py-3">
                                                        <button
                                                            onClick={() => removeItemRow(index)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-main mb-4">Notes</h2>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                                placeholder="Add any notes about this purchase..."
                            />
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-card rounded-xl shadow-sm p-6 sticky top-4">
                            <h2 className="text-lg font-bold text-main mb-4">Summary</h2>

                            {/* Calculations */}
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Subtotal:</span>
                                    <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Item Discount:</span>
                                    <span className="font-medium">-₹{totals.itemDiscount.toFixed(2)}</span>
                                </div>

                                {/* Bill Discount */}
                                <div>
                                    <label className="block text-sm text-secondary mb-1">Bill Discount:</label>
                                    <input
                                        type="number"
                                        value={formData.billDiscount}
                                        onChange={(e) => setFormData({ ...formData, billDiscount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                {/* Shipping */}
                                <div>
                                    <label className="block text-sm text-secondary mb-1">Shipping/Loading:</label>
                                    <input
                                        type="number"
                                        value={formData.shippingCharges}
                                        onChange={(e) => setFormData({ ...formData, shippingCharges: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                {/* Tax Breakup */}
                                <div className="border-t pt-3">
                                    <p className="text-sm font-medium text-secondary mb-2">Tax Breakup:</p>
                                    {isInterState() ? (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-secondary">IGST:</span>
                                            <span className="font-medium">₹{totals.totalIGST.toFixed(2)}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">CGST:</span>
                                                <span className="font-medium">₹{totals.totalCGST.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">SGST:</span>
                                                <span className="font-medium">₹{totals.totalSGST.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Round Off:</span>
                                    <span className="font-medium">₹{totals.roundOff.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t pt-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">Total:</span>
                                    <span className="text-2xl font-bold text-indigo-600">₹{totals.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div className="space-y-3 mb-4 border-t pt-4">
                                <h3 className="font-medium text-main">Payment</h3>

                                <div>
                                    <label className="block text-sm text-secondary mb-1">Payment Method:</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="credit">Credit (Pay Later)</option>
                                    </select>
                                </div>

                                {formData.paymentMethod === 'bank' && (
                                    <div>
                                        <label className="block text-sm text-secondary mb-1">Bank Account:</label>
                                        <select
                                            value={formData.bankAccount}
                                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            <option value="">Select bank account</option>
                                            {accounts.map((acc) => (
                                                <option key={acc._id} value={acc._id}>
                                                    {acc.bankName} - {acc.accountNumber}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm text-secondary mb-1">Amount Paid:</label>
                                    <input
                                        type="number"
                                        value={formData.paidAmount}
                                        onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        min="0"
                                        max={totals.totalAmount}
                                        step="0.01"
                                    />
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Outstanding:</span>
                                    <span className="font-medium text-red-600">₹{totals.outstandingAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleSubmit('finalized')}
                                    disabled={isLoading}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Save & Finalize'}
                                </button>
                                <button
                                    onClick={() => handleSubmit('draft')}
                                    disabled={isLoading}
                                    className="w-full py-3 border border-default text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    onClick={() => navigate('/purchase/list')}
                                    className="w-full py-3 border border-default text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add Item Modal */}
            <QuickAddItemModal
                isOpen={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onItemCreated={handleItemCreated}
                prefilledBarcode={quickAddBarcode}
            />
        </Layout>
    );
};

export default PurchaseEntry;
