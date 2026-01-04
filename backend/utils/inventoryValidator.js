/**
 * Validate inventory stock levels
 * @param {Object} item - Item document
 * @throws {Error} If validation fails
 */
export const validateStockLevels = (item) => {
    if (item.stockQty < 0) {
        throw new Error(`stockQty cannot be negative for item: ${item.name}`);
    }

    if (item.reservedStock < 0) {
        throw new Error(`reservedStock cannot be negative for item: ${item.name}`);
    }

    if (item.inTransitStock < 0) {
        throw new Error(`inTransitStock cannot be negative for item: ${item.name}`);
    }

    // OPTION A: Reserved stock cannot exceed physical + in-transit
    if (item.reservedStock > (item.stockQty + (item.inTransitStock || 0))) {
        throw new Error(
            `reservedStock (${item.reservedStock}) cannot exceed stockQty + inTransitStock (${item.stockQty + (item.inTransitStock || 0)}) for item: ${item.name}`
        );
    }

    // availableStock is virtual and uses Math.max, so it's always >= 0
    // But we can still validate the logic
    const calculatedAvailable = item.stockQty - item.reservedStock;
    if (calculatedAvailable < 0 && item.overCommittedStock === 0) {
        throw new Error(`Stock calculation error for item: ${item.name}`);
    }
};

/**
 * Validate Sales Order quantities
 * @param {Object} salesOrder - SalesOrder document
 * @throws {Error} If validation fails
 */
export const validateSalesOrderQuantities = (salesOrder) => {
    for (const item of salesOrder.items) {
        if (item.deliveredQty > item.reservedQty) {
            throw new Error(
                `deliveredQty (${item.deliveredQty}) cannot exceed reservedQty (${item.reservedQty})`
            );
        }

        if (item.invoicedQty > item.deliveredQty) {
            throw new Error(
                `invoicedQty (${item.invoicedQty}) cannot exceed deliveredQty (${item.deliveredQty})`
            );
        }

        if (item.reservedQty < 0) {
            throw new Error(`reservedQty cannot be negative`);
        }

        if (item.deliveredQty < 0) {
            throw new Error(`deliveredQty cannot be negative`);
        }

        if (item.invoicedQty < 0) {
            throw new Error(`invoicedQty cannot be negative`);
        }
    }
};

/**
 * Validate all inventory constraints before save
 * @param {Object} item - Item document
 * @param {Object} salesOrder - SalesOrder document (optional)
 * @throws {Error} If any validation fails
 */
export const validateInventoryConstraints = (item, salesOrder = null) => {
    validateStockLevels(item);

    if (salesOrder) {
        validateSalesOrderQuantities(salesOrder);
    }
};
