/**
 * GST Calculation Utilities
 * Handles CGST/SGST/IGST calculations based on state
 */

/**
 * Extract state code from GSTIN
 * GSTIN format: 27AABCU9603R1ZM (first 2 digits are state code)
 * @param {String} gstin - GST Identification Number
 * @returns {String} State code
 */
export const extractStateFromGSTIN = (gstin) => {
    if (!gstin || gstin.length < 2) return "";
    return gstin.substring(0, 2);
};

/**
 * Determine if purchase is inter-state
 * @param {String} businessState - Business state code
 * @param {String} supplierState - Supplier state code
 * @returns {Boolean} True if inter-state
 */
export const isInterStatePurchase = (businessState, supplierState) => {
    if (!businessState || !supplierState) return false;
    return businessState !== supplierState;
};

/**
 * Calculate GST breakdown
 * @param {Number} taxableAmount - Amount before tax
 * @param {Number} taxRate - Tax rate percentage (e.g., 18 for 18%)
 * @param {Boolean} isInterState - Whether it's inter-state transaction
 * @returns {Object} { cgst, sgst, igst, totalTax, total }
 */
export const calculateGST = (taxableAmount, taxRate, isInterState) => {
    const totalTax = (taxableAmount * taxRate) / 100;

    if (isInterState) {
        // Inter-state: IGST only
        return {
            cgst: 0,
            sgst: 0,
            igst: parseFloat(totalTax.toFixed(2)),
            totalTax: parseFloat(totalTax.toFixed(2)),
            total: parseFloat((taxableAmount + totalTax).toFixed(2)),
        };
    } else {
        // Intra-state: CGST + SGST (split equally)
        const cgst = totalTax / 2;
        const sgst = totalTax / 2;
        return {
            cgst: parseFloat(cgst.toFixed(2)),
            sgst: parseFloat(sgst.toFixed(2)),
            igst: 0,
            totalTax: parseFloat(totalTax.toFixed(2)),
            total: parseFloat((taxableAmount + totalTax).toFixed(2)),
        };
    }
};

/**
 * Calculate purchase item totals with GST
 * @param {Number} quantity - Item quantity
 * @param {Number} rate - Purchase rate per unit
 * @param {Number} discount - Discount amount
 * @param {Number} taxRate - Tax rate percentage
 * @param {Boolean} isInterState - Whether it's inter-state
 * @returns {Object} Complete calculation breakdown
 */
export const calculatePurchaseItemTotal = (
    quantity,
    rate,
    discount = 0,
    taxRate = 0,
    isInterState = false
) => {
    const baseAmount = quantity * rate;
    const taxableValue = baseAmount - discount;
    const gst = calculateGST(taxableValue, taxRate, isInterState);

    return {
        baseAmount: parseFloat(baseAmount.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        taxableValue: parseFloat(taxableValue.toFixed(2)),
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        totalTax: gst.totalTax,
        total: gst.total,
    };
};

/**
 * Calculate round off amount
 * @param {Number} amount - Amount to round
 * @returns {Object} { roundedAmount, roundOff }
 */
export const calculateRoundOff = (amount) => {
    const rounded = Math.round(amount);
    const roundOff = rounded - amount;
    return {
        roundedAmount: rounded,
        roundOff: parseFloat(roundOff.toFixed(2)),
    };
};

/**
 * State code to name mapping (Indian states)
 */
export const STATE_CODES = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman and Diu",
    "26": "Dadra and Nagar Haveli",
    "27": "Maharashtra",
    "28": "Andhra Pradesh (Old)",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh (New)",
    "38": "Ladakh",
};

/**
 * Get state name from code
 * @param {String} stateCode - 2-digit state code
 * @returns {String} State name
 */
export const getStateName = (stateCode) => {
    return STATE_CODES[stateCode] || "Unknown";
};
