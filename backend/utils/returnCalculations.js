import { error as logError } from "./logger.js";

/**
 * Calculate item-level totals for a purchase return item
 * @param {Object} item - Item details
 * @param {String} supplierState - Supplier's state code
 * @param {String} businessState - Business's state code
 * @returns {Object} Calculated item totals
 */
export const calculateItemTotals = (item, supplierState, businessState) => {
    try {
        const {
            returnQty,
            rate,
            discount = 0,
            taxRate = 0,
        } = item;

        // Validate inputs
        if (!returnQty || returnQty <= 0) {
            throw new Error("Return quantity must be greater than 0");
        }
        if (!rate || rate < 0) {
            throw new Error("Rate must be a positive number");
        }
        if (discount < 0) {
            throw new Error("Discount cannot be negative");
        }
        if (taxRate < 0 || taxRate > 100) {
            throw new Error("Tax rate must be between 0 and 100");
        }

        // Calculate base amount
        const baseAmount = returnQty * rate;

        // Calculate discount amount
        const discountAmount = discount;

        // Calculate taxable value
        const taxableValue = baseAmount - discountAmount;

        // Determine if inter-state or intra-state
        const isInterState = supplierState !== businessState;

        // Calculate GST
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isInterState) {
            // Inter-state: IGST
            igst = (taxableValue * taxRate) / 100;
        } else {
            // Intra-state: CGST + SGST
            const halfTaxRate = taxRate / 2;
            cgst = (taxableValue * halfTaxRate) / 100;
            sgst = (taxableValue * halfTaxRate) / 100;
        }

        // Calculate total
        const total = taxableValue + cgst + sgst + igst;

        return {
            taxableValue: parseFloat(taxableValue.toFixed(2)),
            cgst: parseFloat(cgst.toFixed(2)),
            sgst: parseFloat(sgst.toFixed(2)),
            igst: parseFloat(igst.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
        };
    } catch (err) {
        logError(`Error calculating item totals: ${err.message}`);
        throw err;
    }
};

/**
 * Calculate return-level totals
 * @param {Array} items - Array of items with calculated totals
 * @param {Number} billDiscount - Bill-level discount
 * @param {Object} adjustments - Additional charges
 * @returns {Object} Return totals
 */
export const calculateReturnTotals = (items, billDiscount = 0, adjustments = {}) => {
    try {
        const {
            tdsAmount = 0,
            transportCharges = 0,
            handlingCharges = 0,
            restockingFee = 0,
        } = adjustments;

        // Validate inputs
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Items array is required and must not be empty");
        }
        if (billDiscount < 0) {
            throw new Error("Bill discount cannot be negative");
        }

        // Calculate item-level totals
        const subtotal = items.reduce((sum, item) => sum + (item.taxableValue || 0), 0);
        const itemDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const totalCGST = items.reduce((sum, item) => sum + (item.cgst || 0), 0);
        const totalSGST = items.reduce((sum, item) => sum + (item.sgst || 0), 0);
        const totalIGST = items.reduce((sum, item) => sum + (item.igst || 0), 0);
        const taxAmount = totalCGST + totalSGST + totalIGST;

        // Calculate total before adjustments
        const totalBeforeAdjustments = subtotal + taxAmount - billDiscount;

        // Apply adjustments
        const adjustmentCharges = transportCharges + handlingCharges + restockingFee;
        const totalAfterAdjustments = totalBeforeAdjustments + adjustmentCharges - tdsAmount;

        // Round off (to nearest rupee)
        const roundOff = Math.round(totalAfterAdjustments) - totalAfterAdjustments;
        const totalAmount = Math.round(totalAfterAdjustments);

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            itemDiscount: parseFloat(itemDiscount.toFixed(2)),
            billDiscount: parseFloat(billDiscount.toFixed(2)),
            totalCGST: parseFloat(totalCGST.toFixed(2)),
            totalSGST: parseFloat(totalSGST.toFixed(2)),
            totalIGST: parseFloat(totalIGST.toFixed(2)),
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            tdsAmount: parseFloat(tdsAmount.toFixed(2)),
            transportCharges: parseFloat(transportCharges.toFixed(2)),
            handlingCharges: parseFloat(handlingCharges.toFixed(2)),
            restockingFee: parseFloat(restockingFee.toFixed(2)),
            adjustmentCharges: parseFloat(adjustmentCharges.toFixed(2)),
            roundOff: parseFloat(roundOff.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2)),
        };
    } catch (err) {
        logError(`Error calculating return totals: ${err.message}`);
        throw err;
    }
};

/**
 * Validate GST reversal accuracy against original purchase
 * @param {Object} originalPurchase - Original purchase document
 * @param {Array} returnItems - Items being returned
 * @returns {Boolean} True if GST reversal is accurate
 */
export const validateGSTReversal = (originalPurchase, returnItems) => {
    try {
        if (!originalPurchase || !returnItems || returnItems.length === 0) {
            throw new Error("Original purchase and return items are required");
        }

        // For each return item, verify the tax rate matches the original
        for (const returnItem of returnItems) {
            const originalItem = originalPurchase.items.find(
                (item) => item.item.toString() === returnItem.item.toString()
            );

            if (!originalItem) {
                throw new Error(`Item ${returnItem.itemName} not found in original purchase`);
            }

            // Verify tax rate matches
            if (originalItem.taxRate !== returnItem.taxRate) {
                throw new Error(
                    `Tax rate mismatch for ${returnItem.itemName}: Original ${originalItem.taxRate}%, Return ${returnItem.taxRate}%`
                );
            }

            // Verify rate matches (allowing for minor rounding differences)
            const rateDifference = Math.abs(originalItem.purchaseRate - returnItem.rate);
            if (rateDifference > 0.01) {
                throw new Error(
                    `Rate mismatch for ${returnItem.itemName}: Original ₹${originalItem.purchaseRate}, Return ₹${returnItem.rate}`
                );
            }
        }

        return true;
    } catch (err) {
        logError(`GST reversal validation error: ${err.message}`);
        throw err;
    }
};

/**
 * Calculate supplier payable adjustment
 * @param {Object} purchaseReturn - Purchase return document
 * @returns {Number} Amount to reduce from supplier payable
 */
export const calculateSupplierPayableAdjustment = (purchaseReturn) => {
    try {
        if (!purchaseReturn || !purchaseReturn.totalAmount) {
            throw new Error("Purchase return with totalAmount is required");
        }

        // The total return amount should be deducted from supplier payable
        // This reduces what we owe to the supplier
        return parseFloat(purchaseReturn.totalAmount.toFixed(2));
    } catch (err) {
        logError(`Error calculating supplier payable adjustment: ${err.message}`);
        throw err;
    }
};

/**
 * Generate return number in format PR-YYYY-NNNN
 * @param {Number} count - Current count of returns for the year
 * @param {Number} year - Year (optional, defaults to current year)
 * @returns {String} Generated return number
 */
export const generateReturnNumber = (count, year = null) => {
    try {
        const currentYear = year || new Date().getFullYear();
        const paddedCount = String(count + 1).padStart(4, "0");
        return `PR-${currentYear}-${paddedCount}`;
    } catch (err) {
        logError(`Error generating return number: ${err.message}`);
        throw err;
    }
};

/**
 * Calculate item-level discount amount
 * @param {Number} quantity - Item quantity
 * @param {Number} rate - Item rate
 * @param {Number} discountPercent - Discount percentage
 * @returns {Number} Discount amount
 */
export const calculateItemDiscount = (quantity, rate, discountPercent = 0) => {
    try {
        if (quantity <= 0 || rate < 0 || discountPercent < 0 || discountPercent > 100) {
            throw new Error("Invalid input for discount calculation");
        }

        const baseAmount = quantity * rate;
        const discountAmount = (baseAmount * discountPercent) / 100;

        return parseFloat(discountAmount.toFixed(2));
    } catch (err) {
        logError(`Error calculating item discount: ${err.message}`);
        throw err;
    }
};
