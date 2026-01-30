import FormInput from '../FormInput';

const FinancialsTab = ({ formData, calculatedTotals, onInputChange }) => {
    return (
        <div className="space-y-6">
            {/* Item-Level Totals */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Totals</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">₹{calculatedTotals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Item Discount:</span>
                        <span className="text-red-600">- ₹{calculatedTotals.itemDiscount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Bill-Level Adjustments */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill-Level Adjustments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Bill Discount"
                        type="number"
                        name="billDiscount"
                        value={formData.billDiscount}
                        onChange={onInputChange}
                        min="0"
                        step="0.01"
                    />
                    <FormInput
                        label="TDS Amount"
                        type="number"
                        name="tdsAmount"
                        value={formData.tdsAmount}
                        onChange={onInputChange}
                        min="0"
                        step="0.01"
                    />
                    <FormInput
                        label="Transport Charges"
                        type="number"
                        name="transportCharges"
                        value={formData.transportCharges}
                        onChange={onInputChange}
                        min="0"
                        step="0.01"
                    />
                    <FormInput
                        label="Handling Charges"
                        type="number"
                        name="handlingCharges"
                        value={formData.handlingCharges}
                        onChange={onInputChange}
                        min="0"
                        step="0.01"
                    />
                    <FormInput
                        label="Restocking Fee"
                        type="number"
                        name="restockingFee"
                        value={formData.restockingFee}
                        onChange={onInputChange}
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>

            {/* Tax Breakdown */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-600">CGST:</span>
                        <span className="font-semibold">₹{calculatedTotals.totalCGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">SGST:</span>
                        <span className="font-semibold">₹{calculatedTotals.totalSGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">IGST:</span>
                        <span className="font-semibold">₹{calculatedTotals.totalIGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                        <span className="text-gray-900 font-medium">Total Tax:</span>
                        <span className="font-semibold">₹{calculatedTotals.taxAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Final Total */}
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-gray-900">Total Return Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                        ₹{calculatedTotals.totalAmount.toFixed(2)}
                    </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    This amount will be {formData.refundMode === 'adjust_payable' ? 'adjusted from supplier payable' :
                        formData.refundMode === 'cash' ? 'refunded in cash' :
                            formData.refundMode === 'bank_transfer' ? 'transferred to bank account' :
                                'issued as credit note'}
                </p>
            </div>

            {/* Calculation Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Calculation Breakdown</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>₹{calculatedTotals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Item Discount:</span>
                        <span className="text-red-600">- ₹{calculatedTotals.itemDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Bill Discount:</span>
                        <span className="text-red-600">- ₹{calculatedTotals.billDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tax Amount:</span>
                        <span>+ ₹{calculatedTotals.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Transport Charges:</span>
                        <span>+ ₹{formData.transportCharges}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Handling Charges:</span>
                        <span>+ ₹{formData.handlingCharges}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Restocking Fee:</span>
                        <span>+ ₹{formData.restockingFee}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">TDS:</span>
                        <span className="text-red-600">- ₹{formData.tdsAmount}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-2 font-semibold">
                        <span>Total:</span>
                        <span>₹{calculatedTotals.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialsTab;
