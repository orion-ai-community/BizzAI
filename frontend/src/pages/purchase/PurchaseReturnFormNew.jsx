import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../../components/FormInput';
import api from '../../services/api';
import PurchaseSelectionModal from '../../components/purchase-return/PurchaseSelectionModal';
import ItemsTab from '../../components/purchase-return/ItemsTab';
import FinancialsTab from '../../components/purchase-return/FinancialsTab';
import InventoryImpactTab from '../../components/purchase-return/InventoryImpactTab';

const PurchaseReturnFormNew = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details');
    const [loading, setLoading] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const hasRestoredDraft = useRef(false);

    const [formData, setFormData] = useState({
        // Return identification
        returnId: '',
        returnDate: new Date().toISOString().split('T')[0],

        // Purchase/GRN references
        originalPurchase: null,
        originalGRN: null,
        sourceType: 'purchase', // 'purchase' or 'grn'

        // Supplier
        supplier: null,

        // Return details
        returnType: 'partial',
        returnReason: '',
        warehouse: '',

        // Items
        items: [],

        // Financial
        billDiscount: '',
        tdsAmount: '',
        transportCharges: '',
        handlingCharges: '',
        restockingFee: '',

        // Refund
        refundMode: 'adjust_payable',
        bankAccount: '',

        // Notes
        notes: '',
        internalNotes: '',
    });

    const [calculatedTotals, setCalculatedTotals] = useState({
        subtotal: 0,
        itemDiscount: 0,
        billDiscount: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        taxAmount: 0,
        totalAmount: 0,
    });

    // Load saved draft from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('purchaseReturnDraft');
        if (savedDraft && !hasRestoredDraft.current) {
            try {
                const parsedDraft = JSON.parse(savedDraft);
                setFormData(parsedDraft);
                hasRestoredDraft.current = true;
                toast.info('Draft restored from previous session', { autoClose: 3000 });
            } catch (err) {
                console.error('Error loading draft:', err);
            }
        }
    }, []);

    // Fetch suppliers on mount
    useEffect(() => {
        fetchSuppliers();
    }, []);

    // Auto-save form data to localStorage whenever it changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('purchaseReturnDraft', JSON.stringify(formData));
        }, 1000); // Debounce for 1 second

        return () => clearTimeout(timeoutId);
    }, [formData]);

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/api/suppliers');
            setSuppliers(response.data);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        }
    };

    const fetchBankAccounts = async () => {
        try {
            const response = await api.get('/api/cashbank/bank-accounts');
            setBankAccounts(response.data);
        } catch (err) {
            console.error('Error fetching bank accounts:', err);
        }
    };

    // Handle purchase/GRN selection
    const handlePurchaseSelect = async (purchase) => {
        try {
            setLoading(true);

            // Populate supplier
            const supplier = suppliers.find(s => s._id === purchase.supplier._id);

            // Transform items for return
            const returnItems = purchase.items.map(item => ({
                item: item.item._id || item.item,
                itemName: item.itemName,
                sku: item.sku || '',
                hsnCode: item.hsnCode || '',
                unit: item.unit || 'pcs',
                batchNo: item.batchNo || '',
                expiryDate: item.expiryDate || null,
                purchasedQty: item.quantity,
                previouslyReturnedQty: 0, // Will be calculated by backend
                availableReturnQty: item.quantity,
                returnQty: 0,
                rate: item.purchaseRate || item.rate,
                discount: 0,
                taxRate: item.taxRate || 0,
                condition: 'resalable',
                disposition: 'restock',
                returnReason: '',
                itemNotes: '',
            }));

            setFormData(prev => ({
                ...prev,
                originalPurchase: formData.sourceType === 'purchase' ? purchase._id : null,
                originalGRN: formData.sourceType === 'grn' ? purchase._id : null,
                supplier: supplier,
                items: returnItems,
            }));

            setShowPurchaseModal(false);
            toast.success('Purchase loaded successfully');
        } catch (err) {
            console.error('Error loading purchase:', err);
            toast.error('Failed to load purchase');
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals whenever items or discounts change
    useEffect(() => {
        calculateTotals();
    }, [formData.items, formData.billDiscount, formData.tdsAmount, formData.transportCharges, formData.handlingCharges, formData.restockingFee]);

    const calculateTotals = () => {
        let subtotal = 0;
        let itemDiscount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        formData.items.forEach(item => {
            if (item.returnQty > 0) {
                const baseAmount = item.returnQty * item.rate;
                const discountAmt = item.discount || 0;
                const taxableValue = baseAmount - discountAmt;

                subtotal += taxableValue;
                itemDiscount += discountAmt;

                // Calculate GST (assuming intra-state for now)
                const halfTaxRate = item.taxRate / 2;
                const cgst = (taxableValue * halfTaxRate) / 100;
                const sgst = (taxableValue * halfTaxRate) / 100;

                totalCGST += cgst;
                totalSGST += sgst;
            }
        });

        const taxAmount = totalCGST + totalSGST + totalIGST;
        const totalBeforeAdjustments = subtotal + taxAmount - formData.billDiscount;
        const adjustments = formData.transportCharges + formData.handlingCharges + formData.restockingFee;
        const totalAmount = totalBeforeAdjustments + adjustments - formData.tdsAmount;

        setCalculatedTotals({
            subtotal: parseFloat(subtotal.toFixed(2)),
            itemDiscount: parseFloat(itemDiscount.toFixed(2)),
            billDiscount: parseFloat(formData.billDiscount),
            totalCGST: parseFloat(totalCGST.toFixed(2)),
            totalSGST: parseFloat(totalSGST.toFixed(2)),
            totalIGST: parseFloat(totalIGST.toFixed(2)),
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleItemUpdate = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;
        setFormData(prev => ({
            ...prev,
            items: updatedItems,
        }));
    };

    const handleRemoveItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            items: updatedItems,
        }));
    };

    const validateForm = () => {
        if (!formData.supplier) {
            toast.error('Please select a supplier');
            return false;
        }

        if (!formData.returnReason) {
            toast.error('Please provide a return reason');
            return false;
        }

        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return false;
        }

        const hasValidItems = formData.items.some(item => item.returnQty > 0);
        if (!hasValidItems) {
            toast.error('Please specify return quantity for at least one item');
            return false;
        }

        // Validate each item
        for (const item of formData.items) {
            if (item.returnQty > 0) {
                if (!item.condition) {
                    toast.error(`Please specify condition for ${item.itemName}`);
                    return false;
                }
                if (!item.disposition) {
                    toast.error(`Please specify disposition for ${item.itemName}`);
                    return false;
                }
                if (!item.returnReason) {
                    toast.error(`Please provide return reason for ${item.itemName}`);
                    return false;
                }
            }
        }

        if (formData.refundMode === 'bank_transfer' && !formData.bankAccount) {
            toast.error('Please select a bank account for bank transfer');
            return false;
        }

        return true;
    };

    const handleSaveDraft = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            const payload = {
                returnDate: formData.returnDate,
                originalPurchase: formData.originalPurchase,
                originalGRN: formData.originalGRN,
                sourceType: formData.sourceType,
                supplier: formData.supplier._id,
                returnType: formData.returnType,
                returnReason: formData.returnReason,
                warehouse: formData.warehouse,
                items: formData.items
                    .filter(item => item.returnQty > 0)
                    .map(item => ({
                        item: item.item,
                        itemName: item.itemName,
                        sku: item.sku || '',
                        hsnCode: item.hsnCode || '',
                        unit: item.unit || 'pcs',
                        batchNo: item.batchNo || '',
                        expiryDate: item.expiryDate || null,
                        purchasedQty: item.purchasedQty || item.quantity || 0,
                        availableReturnQty: item.availableReturnQty || item.returnQty,
                        returnQty: item.returnQty,
                        rate: item.rate,
                        discount: item.discount || 0,
                        taxRate: item.taxRate,
                        condition: item.condition,
                        disposition: item.disposition,
                        returnReason: item.returnReason,
                    })),
                billDiscount: formData.billDiscount || 0,
                tdsAmount: formData.tdsAmount || 0,
                transportCharges: formData.transportCharges || 0,
                handlingCharges: formData.handlingCharges || 0,
                restockingFee: formData.restockingFee || 0,
                refundMode: formData.refundMode,
                bankAccount: formData.bankAccount || null,
                notes: formData.notes || '',
                internalNotes: formData.internalNotes || '',
            };

            const response = await api.post('/api/purchase-returns', payload);

            // Clear saved draft on successful save
            localStorage.removeItem('purchaseReturnDraft');

            toast.success('Purchase return saved as draft');
            navigate('/purchase/returns/list');
        } catch (err) {
            console.error('Error saving draft:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Failed to save draft';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            // First create the return
            const payload = {
                returnDate: formData.returnDate,
                originalPurchase: formData.originalPurchase,
                originalGRN: formData.originalGRN,
                sourceType: formData.sourceType,
                supplier: formData.supplier._id,
                returnType: formData.returnType,
                returnReason: formData.returnReason,
                warehouse: formData.warehouse,
                items: formData.items
                    .filter(item => item.returnQty > 0)
                    .map(item => ({
                        item: item.item,
                        itemName: item.itemName,
                        sku: item.sku || '',
                        hsnCode: item.hsnCode || '',
                        unit: item.unit || 'pcs',
                        batchNo: item.batchNo || '',
                        expiryDate: item.expiryDate || null,
                        purchasedQty: item.purchasedQty || item.quantity || 0,
                        availableReturnQty: item.availableReturnQty || item.returnQty,
                        returnQty: item.returnQty,
                        rate: item.rate,
                        discount: item.discount || 0,
                        taxRate: item.taxRate,
                        condition: item.condition,
                        disposition: item.disposition,
                        returnReason: item.returnReason,
                    })),
                billDiscount: formData.billDiscount || 0,
                tdsAmount: formData.tdsAmount || 0,
                transportCharges: formData.transportCharges || 0,
                handlingCharges: formData.handlingCharges || 0,
                restockingFee: formData.restockingFee || 0,
                refundMode: formData.refundMode,
                bankAccount: formData.bankAccount || null,
                notes: formData.notes || '',
                internalNotes: formData.internalNotes || '',
            };

            console.log('Submitting payload:', JSON.stringify(payload, null, 2));

            const createResponse = await api.post('/api/purchase-returns', payload);
            const returnId = createResponse.data._id;

            // Then submit for approval
            await api.post(`/api/purchase-returns/${returnId}/submit-for-approval`);

            // Clear saved draft on successful submission
            localStorage.removeItem('purchaseReturnDraft');

            toast.success('Purchase return submitted for approval');
            navigate('/purchase/returns/list');
        } catch (err) {
            console.error('Error submitting for approval:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);

            let errorMessage = 'Failed to submit for approval';

            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                errorMessage = err.response.data.errors.join('\n');
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }

            toast.error(errorMessage, { autoClose: 8000 });
        } finally {
            setLoading(false);
        }
    };

    const handleClearDraft = () => {
        if (window.confirm('Are you sure you want to clear the saved draft? This will reset all fields.')) {
            localStorage.removeItem('purchaseReturnDraft');
            window.location.reload();
        }
    };

    const tabs = [
        { id: 'details', label: 'Return Details', icon: '📋' },
        { id: 'items', label: 'Items', icon: '📦', badge: formData.items.length },
        { id: 'financials', label: 'Financials', icon: '💰' },
        { id: 'inventory', label: 'Inventory Impact', icon: '📊' },
    ];

    return (
        <>
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-[rgb(var(--color-card))] border-b mb-6">
                <div className="flex space-x-8 px-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors relative ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600 dark:border-[rgb(var(--color-primary))] dark:text-[rgb(var(--color-primary))]'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 py-0.5 px-2 rounded-full text-xs">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-lg shadow p-6">
                {/* Return Details Tab */}
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormInput
                                label="Return Date"
                                type="date"
                                name="returnDate"
                                value={formData.returnDate}
                                onChange={handleInputChange}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Source Type
                                </label>
                                <select
                                    name="sourceType"
                                    value={formData.sourceType}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="purchase">Purchase</option>
                                    <option value="grn">GRN</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Return Type
                                </label>
                                <select
                                    name="returnType"
                                    value={formData.returnType}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="partial">Partial Return</option>
                                    <option value="full">Full Return</option>
                                </select>
                            </div>
                        </div>

                        {/* Purchase/GRN Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select {formData.sourceType === 'purchase' ? 'Purchase' : 'GRN'}
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPurchaseModal(true)}
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                            >
                                {formData.originalPurchase || formData.originalGRN
                                    ? '✓ Purchase Selected - Click to change'
                                    : `+ Select ${formData.sourceType === 'purchase' ? 'Purchase' : 'GRN'}`}
                            </button>
                        </div>

                        {/* Supplier (read-only after selection) */}
                        {formData.supplier && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Supplier</h3>
                                <p className="text-lg font-semibold text-gray-900">
                                    {formData.supplier.businessName}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {formData.supplier.contactPersonName} • {formData.supplier.contactNo}
                                </p>
                            </div>
                        )}

                        {/* Return Reason */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Return Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="returnReason"
                                value={formData.returnReason}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="Explain why items are being returned..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Warehouse */}
                        <FormInput
                            label="Warehouse"
                            name="warehouse"
                            value={formData.warehouse}
                            onChange={handleInputChange}
                            placeholder="Enter warehouse location"
                        />

                        {/* Refund Mode */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Refund Mode
                                </label>
                                <select
                                    name="refundMode"
                                    value={formData.refundMode}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="adjust_payable">Adjust Payable</option>
                                    <option value="cash">Cash</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="credit_note">Credit Note</option>
                                </select>
                            </div>

                            {formData.refundMode === 'bank_transfer' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bank Account <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="bankAccount"
                                        value={formData.bankAccount}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Bank Account</option>
                                        {bankAccounts.map(account => (
                                            <option key={account._id} value={account._id}>
                                                {account.bankName} - {account.accountNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Visible to Supplier)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Add any notes for the supplier..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Internal Notes
                                </label>
                                <textarea
                                    name="internalNotes"
                                    value={formData.internalNotes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Internal notes (not visible to supplier)..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Items Tab */}
                {activeTab === 'items' && (
                    <ItemsTab
                        items={formData.items}
                        onItemUpdate={handleItemUpdate}
                        onRemoveItem={handleRemoveItem}
                    />
                )}

                {/* Financials Tab */}
                {activeTab === 'financials' && (
                    <FinancialsTab
                        formData={formData}
                        calculatedTotals={calculatedTotals}
                        onInputChange={handleInputChange}
                    />
                )}

                {/* Inventory Impact Tab */}
                {activeTab === 'inventory' && (
                    <InventoryImpactTab items={formData.items} />
                )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between items-center">
                <button
                    type="button"
                    onClick={handleClearDraft}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                    disabled={loading}
                >
                    🗑️ Clear Saved Draft
                </button>
                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/purchase/returns/list')}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmitForApproval}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                </div>
            </div>

            {/* Purchase Selection Modal */}
            {showPurchaseModal && (
                <PurchaseSelectionModal
                    sourceType={formData.sourceType}
                    onSelect={handlePurchaseSelect}
                    onClose={() => setShowPurchaseModal(false)}
                />
            )}
        </>
    );
};

export default PurchaseReturnFormNew;
