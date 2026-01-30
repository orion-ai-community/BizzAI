import Purchase from "../models/Purchase.js";
import GoodsReceivedNote from "../models/GoodsReceivedNote.js";
import PurchaseReturn from "../models/PurchaseReturn.js";
import { error as logError } from "./logger.js";

/**
 * Validate return quantities against available quantities
 * @param {String} purchaseId - Purchase or GRN ID
 * @param {String} sourceType - 'Purchase' or 'GRN'
 * @param {Array} items - Items to be returned
 * @param {String} userId - User ID for filtering
 * @returns {Object} Validation result with errors if any
 */
export const validateReturnQuantities = async (purchaseId, sourceType, items, userId) => {
    try {
        const errors = [];

        // Fetch the original purchase or GRN
        let sourceDocument;
        if (sourceType === "Purchase") {
            sourceDocument = await Purchase.findOne({
                _id: purchaseId,
                createdBy: userId,
                isDeleted: false,
            });
        } else if (sourceType === "GRN") {
            sourceDocument = await GoodsReceivedNote.findOne({
                _id: purchaseId,
                createdBy: userId,
                isDeleted: false,
            });
        } else {
            return {
                valid: false,
                errors: ["Invalid source type. Must be 'Purchase' or 'GRN'"],
            };
        }

        if (!sourceDocument) {
            return {
                valid: false,
                errors: ["Source document not found"],
            };
        }

        // Get all previous returns for this purchase/GRN
        const previousReturns = await PurchaseReturn.find({
            [sourceType === "Purchase" ? "originalPurchase" : "originalGRN"]: purchaseId,
            createdBy: userId,
            status: { $nin: ["cancelled", "rejected"] },
            isDeleted: false,
        });

        // Validate each item
        for (const returnItem of items) {
            const sourceItem = sourceDocument.items.find(
                (item) => item.item.toString() === returnItem.item.toString()
            );

            if (!sourceItem) {
                errors.push(`Item ${returnItem.itemName} not found in source document`);
                continue;
            }

            // Calculate purchased quantity
            const purchasedQty = sourceType === "Purchase"
                ? sourceItem.quantity
                : sourceItem.acceptedQty;

            // Calculate previously returned quantity
            let previouslyReturnedQty = 0;
            for (const prevReturn of previousReturns) {
                const prevReturnItem = prevReturn.items.find(
                    (item) => item.item.toString() === returnItem.item.toString()
                );
                if (prevReturnItem) {
                    previouslyReturnedQty += prevReturnItem.returnQty || prevReturnItem.quantity || 0;
                }
            }

            // Calculate available return quantity
            const availableReturnQty = purchasedQty - previouslyReturnedQty;

            // Validate return quantity
            if (returnItem.returnQty > availableReturnQty) {
                errors.push(
                    `${returnItem.itemName}: Cannot return ${returnItem.returnQty} units. ` +
                    `Purchased: ${purchasedQty}, Previously returned: ${previouslyReturnedQty}, ` +
                    `Available: ${availableReturnQty}`
                );
            }

            if (returnItem.returnQty <= 0) {
                errors.push(`${returnItem.itemName}: Return quantity must be greater than 0`);
            }

            // Validate batch number if batch-tracked
            if (sourceItem.batchNo && returnItem.batchNo !== sourceItem.batchNo) {
                errors.push(
                    `${returnItem.itemName}: Batch number mismatch. ` +
                    `Expected: ${sourceItem.batchNo}, Provided: ${returnItem.batchNo}`
                );
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    } catch (err) {
        logError(`Error validating return quantities: ${err.message}`);
        return {
            valid: false,
            errors: [`Validation error: ${err.message}`],
        };
    }
};

/**
 * Validate return dates
 * @param {Date} returnDate - Proposed return date
 * @param {Date} purchaseDate - Original purchase date
 * @param {Number} maxDaysAllowed - Maximum days allowed for return (optional)
 * @returns {Object} Validation result
 */
export const validateReturnDates = (returnDate, purchaseDate, maxDaysAllowed = null) => {
    try {
        const errors = [];

        // Convert to Date objects if strings
        const returnDateObj = new Date(returnDate);
        const purchaseDateObj = new Date(purchaseDate);
        const currentDate = new Date();

        // Validate return date is not in the future
        if (returnDateObj > currentDate) {
            errors.push("Return date cannot be in the future");
        }

        // Validate return date is after purchase date
        if (returnDateObj < purchaseDateObj) {
            errors.push("Return date cannot be before purchase date");
        }

        // Validate maximum days allowed (if specified)
        if (maxDaysAllowed) {
            const daysDifference = Math.floor(
                (returnDateObj - purchaseDateObj) / (1000 * 60 * 60 * 24)
            );
            if (daysDifference > maxDaysAllowed) {
                errors.push(
                    `Return is not allowed after ${maxDaysAllowed} days from purchase. ` +
                    `Purchase date: ${purchaseDateObj.toLocaleDateString()}, ` +
                    `Days elapsed: ${daysDifference}`
                );
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    } catch (err) {
        logError(`Error validating return dates: ${err.message}`);
        return {
            valid: false,
            errors: [`Date validation error: ${err.message}`],
        };
    }
};

/**
 * Check if approval is required based on amount
 * @param {Number} amount - Return amount
 * @param {Object} approvalMatrix - Approval configuration (optional)
 * @returns {Boolean} True if approval required
 */
export const validateApprovalRequired = (amount, approvalMatrix = null) => {
    try {
        // Default threshold: ₹10,000
        const defaultThreshold = 10000;

        if (approvalMatrix && approvalMatrix.minAmount !== undefined) {
            return amount >= approvalMatrix.minAmount;
        }

        return amount >= defaultThreshold;
    } catch (err) {
        logError(`Error checking approval requirement: ${err.message}`);
        // Default to requiring approval on error (safer)
        return true;
    }
};

/**
 * Validate item condition and disposition combination
 * @param {String} condition - Item condition
 * @param {String} disposition - Item disposition
 * @returns {Object} Validation result
 */
export const validateItemCondition = (condition, disposition) => {
    try {
        const errors = [];

        // Define valid condition-disposition combinations
        const validCombinations = {
            damaged: ["quarantine", "scrap", "vendor_return"],
            defective: ["quarantine", "repair", "vendor_return", "scrap"],
            resalable: ["restock", "vendor_return"],
            scrap: ["scrap"],
            expired: ["scrap", "vendor_return"],
            wrong_item: ["vendor_return", "restock"],
        };

        // Validate condition
        if (!validCombinations[condition]) {
            errors.push(`Invalid condition: ${condition}`);
            return { valid: false, errors };
        }

        // Validate disposition for the given condition
        if (!validCombinations[condition].includes(disposition)) {
            errors.push(
                `Invalid disposition '${disposition}' for condition '${condition}'. ` +
                `Valid options: ${validCombinations[condition].join(", ")}`
            );
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    } catch (err) {
        logError(`Error validating item condition: ${err.message}`);
        return {
            valid: false,
            errors: [`Condition validation error: ${err.message}`],
        };
    }
};

/**
 * Validate refund mode and related fields
 * @param {String} refundMode - Refund mode
 * @param {String} bankAccountId - Bank account ID (required for bank_transfer)
 * @returns {Object} Validation result
 */
export const validateRefundMode = (refundMode, bankAccountId = null) => {
    try {
        const errors = [];

        const validRefundModes = ["cash", "bank_transfer", "credit_note", "adjust_payable"];

        if (!validRefundModes.includes(refundMode)) {
            errors.push(
                `Invalid refund mode: ${refundMode}. ` +
                `Valid options: ${validRefundModes.join(", ")}`
            );
        }

        // Validate bank account is provided for bank_transfer
        if (refundMode === "bank_transfer" && !bankAccountId) {
            errors.push("Bank account is required for bank transfer refund mode");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    } catch (err) {
        logError(`Error validating refund mode: ${err.message}`);
        return {
            valid: false,
            errors: [`Refund mode validation error: ${err.message}`],
        };
    }
};

/**
 * Validate all return data comprehensively
 * @param {Object} returnData - Complete return data
 * @returns {Object} Validation result with all errors
 */
export const validatePurchaseReturn = async (returnData) => {
    try {
        const allErrors = [];

        // Validate required fields
        if (!returnData.supplier) {
            allErrors.push("Supplier is required");
        }
        if (!returnData.items || returnData.items.length === 0) {
            allErrors.push("At least one item is required");
        }
        if (!returnData.returnReason) {
            allErrors.push("Return reason is required");
        }

        // Validate dates if purchase/GRN is provided
        if (returnData.originalPurchase || returnData.originalGRN) {
            const sourceType = returnData.originalPurchase ? "Purchase" : "GRN";
            const sourceId = returnData.originalPurchase || returnData.originalGRN;

            // Validate quantities
            const qtyValidation = await validateReturnQuantities(
                sourceId,
                sourceType,
                returnData.items,
                returnData.createdBy
            );
            if (!qtyValidation.valid) {
                allErrors.push(...qtyValidation.errors);
            }
        }

        // Validate refund mode
        const refundValidation = validateRefundMode(
            returnData.refundMode,
            returnData.bankAccount
        );
        if (!refundValidation.valid) {
            allErrors.push(...refundValidation.errors);
        }

        // Validate each item's condition and disposition
        if (returnData.items) {
            for (const item of returnData.items) {
                const conditionValidation = validateItemCondition(
                    item.condition,
                    item.disposition
                );
                if (!conditionValidation.valid) {
                    allErrors.push(`${item.itemName}: ${conditionValidation.errors.join(", ")}`);
                }
            }
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors,
        };
    } catch (err) {
        logError(`Error in comprehensive validation: ${err.message}`);
        return {
            valid: false,
            errors: [`Validation error: ${err.message}`],
        };
    }
};
