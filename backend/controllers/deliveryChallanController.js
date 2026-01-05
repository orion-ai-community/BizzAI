import mongoose from "mongoose";
import DeliveryChallan from "../models/DeliveryChallan.js";
import Customer from "../models/Customer.js";
import Item from "../models/Item.js";
import Invoice from "../models/Invoice.js";
import Transaction from "../models/Transaction.js";
import SalesOrder from "../models/SalesOrder.js";
import { info, error } from "../utils/logger.js";
import { logStockMovement } from "../utils/stockMovementLogger.js";
import { calculatePaymentStatus } from "../utils/paymentStatusCalculator.js";
import { validateStockLevels, validateSalesOrderQuantities } from "../utils/inventoryValidator.js";

/**
 * @desc Create a new delivery challan
 * @route POST /api/delivery-challan
 */
export const createDeliveryChallan = async (req, res) => {
    // Validate user is authenticated
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    try {
        const {
            customerId,
            challanDate,
            deliveryDate,
            salesOrderId,
            items,
            vehicleNo,
            driverName,
            transportMode,
            notes,
        } = req.body;

        // Validate customer
        if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ message: "Valid customer is required" });
        }

        const customer = await Customer.findOne({
            _id: customerId,
            owner: req.user._id,
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "At least one item is required" });
        }

        // Validate and prepare items
        const validatedItems = [];
        for (const item of items) {
            if (!item.item || !mongoose.Types.ObjectId.isValid(item.item)) {
                return res.status(400).json({ message: "Invalid item ID" });
            }

            const inventoryItem = await Item.findOne({
                _id: item.item,
                addedBy: req.user._id,
            });

            if (!inventoryItem) {
                return res.status(404).json({ message: `Item not found: ${item.item}` });
            }

            const deliveredQty = parseFloat(item.deliveredQty) || 0;
            if (deliveredQty <= 0) {
                return res.status(400).json({
                    message: `Delivered quantity must be greater than 0 for ${inventoryItem.name}`,
                });
            }

            if (deliveredQty > inventoryItem.stock) {
                return res.status(400).json({
                    message: `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.stock}, Requested: ${deliveredQty}`,
                });
            }

            validatedItems.push({
                item: item.item,
                quantity: item.quantity || deliveredQty,
                deliveredQty,
                unit: item.unit || inventoryItem.unit || "pcs",
                description: item.description || "",
            });
        }

        // Generate challan number
        const challanNumber = `DC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create delivery challan
        const challanData = {
            challanNumber,
            customer: customerId,
            challanDate: challanDate || new Date(),
            deliveryDate,
            items: validatedItems,
            vehicleNo: vehicleNo || "",
            driverName: driverName || "",
            transportMode: transportMode || "road",
            notes: notes || "",
            status: "Draft",
            createdBy: req.user._id,
        };

        // Add salesOrder reference if provided
        if (salesOrderId && mongoose.Types.ObjectId.isValid(salesOrderId)) {
            challanData.salesOrder = salesOrderId;
        }

        const challan = await DeliveryChallan.create(challanData);

        // Update Sales Order if challan was created from one
        if (salesOrderId && mongoose.Types.ObjectId.isValid(salesOrderId)) {
            const salesOrder = await SalesOrder.findById(salesOrderId);
            if (salesOrder) {
                // Update deliveredQty and reduce actual stock for each item
                for (const challanItem of validatedItems) {
                    const soItem = salesOrder.items.find(
                        (i) => i.item.toString() === challanItem.item.toString()
                    );
                    if (soItem) {
                        soItem.deliveredQty += challanItem.deliveredQty;
                    }

                    // OPTION A: Move to in-transit ONLY (DO NOT reduce stockQty)
                    const item = await Item.findById(challanItem.item);

                    const previousState = {
                        stockQty: item.stockQty,
                        reservedStock: item.reservedStock,
                        inTransitStock: item.inTransitStock || 0,
                    };

                    // Only increment inTransitStock
                    item.inTransitStock = (item.inTransitStock || 0) + challanItem.deliveredQty;

                    await item.save();

                    const newState = {
                        stockQty: item.stockQty,
                        reservedStock: item.reservedStock,
                        inTransitStock: item.inTransitStock,
                    };

                    // Log stock movement (2 entries as per requirement)
                    const { logStockMovement } = await import('../utils/stockMovementLogger.js');
                    await logStockMovement(
                        item,
                        "DELIVER",
                        challanItem.deliveredQty,
                        challan._id,
                        "DeliveryChallan",
                        req.user._id,
                        previousState,
                        newState
                    );
                    await logStockMovement(
                        item,
                        "IN_TRANSIT",
                        challanItem.deliveredQty,
                        challan._id,
                        "DeliveryChallan",
                        req.user._id,
                        previousState,
                        newState
                    );

                }

                // Add challan to sales order
                salesOrder.deliveryChallans.push(challan._id);

                // Update sales order status
                const totalOrdered = salesOrder.items.reduce((sum, item) => sum + item.quantity, 0);
                const totalDelivered = salesOrder.items.reduce((sum, item) => sum + item.deliveredQty, 0);

                if (totalDelivered >= totalOrdered) {
                    salesOrder.status = "Delivered";
                } else if (totalDelivered > 0) {
                    salesOrder.status = "Partially Delivered";
                }

                await salesOrder.save();
            }
        } else {
            // If not from sales order, move to in-transit (DO NOT reduce stockQty)
            for (const challanItem of validatedItems) {
                const item = await Item.findById(challanItem.item);

                const previousState = {
                    stockQty: item.stockQty,
                    reservedStock: item.reservedStock,
                    inTransitStock: item.inTransitStock || 0,
                };

                // Only increment inTransitStock
                item.inTransitStock = (item.inTransitStock || 0) + challanItem.deliveredQty;

                await item.save();

                const newState = {
                    stockQty: item.stockQty,
                    reservedStock: item.reservedStock,
                    inTransitStock: item.inTransitStock,
                };

                // Log stock movement
                const { logStockMovement } = await import('../utils/stockMovementLogger.js');
                await logStockMovement(
                    item,
                    "DELIVER",
                    challanItem.deliveredQty,
                    challan._id,
                    "DeliveryChallan",
                    req.user._id,
                    previousState,
                    newState
                );
                await logStockMovement(
                    item,
                    "IN_TRANSIT",
                    challanItem.deliveredQty,
                    challan._id,
                    "DeliveryChallan",
                    req.user._id,
                    previousState,
                    newState
                );
            }
        }

        info(`Delivery Challan created: ${challanNumber} by ${req.user.name}`);

        // Populate and return
        const populatedChallan = await DeliveryChallan.findById(challan._id)
            .populate("customer", "name phone email")
            .populate("items.item", "name sku unit sellingPrice");

        res.status(201).json({
            message: "Delivery Challan created successfully",
            challan: populatedChallan,
        });
    } catch (err) {
        error(`Create Delivery Challan Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get all delivery challans
 * @route GET /api/delivery-challan
 */
export const getAllDeliveryChallans = async (req, res) => {
    try {
        const challans = await DeliveryChallan.find({
            createdBy: req.user._id,
            systemGenerated: { $ne: true },
            isDeleted: { $ne: true }
        })
            .populate("customer", "name phone email")
            .populate("items.item", "name sku")
            .populate("convertedToInvoice", "invoiceNo")
            .sort({ createdAt: -1 });

        res.status(200).json(challans);
    } catch (err) {
        error(`Get All Delivery Challans Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get single delivery challan
 * @route GET /api/delivery-challan/:id
 */
export const getDeliveryChallanById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid challan ID" });
        }

        const challan = await DeliveryChallan.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        })
            .populate("customer", "name phone email address")
            .populate("items.item", "name sku unit sellingPrice tax")
            .populate("convertedToInvoice", "invoiceNo totalAmount")
            .populate("createdBy", "name email");

        if (!challan) {
            return res.status(404).json({ message: "Delivery Challan not found" });
        }

        res.status(200).json(challan);
    } catch (err) {
        error(`Get Delivery Challan By ID Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Update delivery challan
 * @route PUT /api/delivery-challan/:id
 */
export const updateDeliveryChallan = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid challan ID" });
        }

        const challan = await DeliveryChallan.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        });

        if (!challan) {
            return res.status(404).json({ message: "Delivery Challan not found" });
        }

        // Cannot update if already converted
        if (challan.status === "Converted") {
            return res.status(400).json({
                message: "Cannot update a challan that has been converted to invoice",
            });
        }

        // Update allowed fields
        const { challanDate, deliveryDate, vehicleNo, driverName, transportMode, notes, status } = req.body;

        if (challanDate) challan.challanDate = challanDate;
        if (deliveryDate) challan.deliveryDate = deliveryDate;
        if (vehicleNo !== undefined) challan.vehicleNo = vehicleNo;
        if (driverName !== undefined) challan.driverName = driverName;
        if (transportMode) challan.transportMode = transportMode;
        if (notes !== undefined) challan.notes = notes;
        if (status && ["Draft", "Delivered"].includes(status)) {
            challan.status = status;
        }

        await challan.save();

        const updatedChallan = await DeliveryChallan.findById(challan._id)
            .populate("customer", "name phone email")
            .populate("items.item", "name sku unit sellingPrice");

        info(`Delivery Challan updated: ${challan.challanNumber} by ${req.user.name}`);

        res.status(200).json({
            message: "Delivery Challan updated successfully",
            challan: updatedChallan,
        });
    } catch (err) {
        error(`Update Delivery Challan Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Convert delivery challan to invoice
 * @route POST /api/delivery-challan/:id/convert-to-invoice
 */
export const convertToInvoice = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid challan ID" });
        }

        const challan = await DeliveryChallan.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        }).populate("items.item", "name sku sellingPrice tax");

        if (!challan) {
            return res.status(404).json({ message: "Delivery Challan not found" });
        }

        // Validate not already converted
        if (challan.status === "Converted" || challan.convertedToInvoice) {
            return res.status(400).json({
                message: "This challan has already been converted to an invoice",
            });
        }

        // Validate has items
        if (!challan.items || challan.items.length === 0) {
            return res.status(400).json({
                message: "Cannot convert challan with no items",
            });
        }

        // Fetch Sales Order if exists to get tax and discount
        let salesOrder = null;
        if (challan.salesOrder) {
            salesOrder = await SalesOrder.findById(challan.salesOrder);
        }

        // Prepare invoice items
        const invoiceItems = challan.items.map((challanItem) => {
            let itemPrice = challanItem.item.sellingPrice || 0;
            let itemTaxAmount = 0;
            let itemDiscount = 0;
            let itemTotal = 0;

            // If from Sales Order, use SO's pricing
            if (salesOrder) {
                const soItem = salesOrder.items.find(
                    (i) => i.item.toString() === challanItem.item._id.toString()
                );
                if (soItem) {
                    // Use SO item's rate, tax%, and discount
                    itemPrice = soItem.rate;
                    const itemSubtotal = itemPrice * challanItem.deliveredQty;

                    // CRITICAL: SO stores tax as PERCENTAGE, not amount
                    // Calculate tax amount from percentage
                    itemTaxAmount = (itemSubtotal * (soItem.tax || 0)) / 100;
                    itemDiscount = soItem.discount || 0;

                    // Calculate item total: subtotal + tax - discount
                    itemTotal = itemSubtotal + itemTaxAmount - itemDiscount;
                } else {
                    // Fallback if SO item not found
                    itemTotal = itemPrice * challanItem.deliveredQty;
                }
            } else {
                // Standalone invoice (no SO)
                itemTotal = itemPrice * challanItem.deliveredQty;
            }

            return {
                item: challanItem.item._id,
                quantity: challanItem.deliveredQty,
                price: itemPrice,
                tax: itemTaxAmount,  // Store calculated tax AMOUNT, not percentage
                discount: itemDiscount,
                total: itemTotal,
            };
        });

        // Calculate totals from invoice items
        const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const taxTotal = invoiceItems.reduce((sum, item) => sum + (item.tax || 0), 0);
        const discountTotal = invoiceItems.reduce((sum, item) => sum + (item.discount || 0), 0);
        const totalAmount = subtotal + taxTotal - discountTotal;

        // Generate invoice number
        const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Create invoice
        const invoice = await Invoice.create({
            invoiceNo,
            customer: challan.customer,
            salesOrder: challan.salesOrder || undefined,
            items: invoiceItems,
            subtotal,
            tax: taxTotal,
            discount: discountTotal,
            totalAmount,
            paidAmount: 0,
            paymentStatus: "unpaid",
            paymentMethod: "due",
            createdBy: req.user._id,
        });

        // Update customer dues (add invoice amount to dues)
        await Customer.findByIdAndUpdate(challan.customer, {
            $inc: { dues: totalAmount },
        });

        // Create transaction record
        await Transaction.create({
            type: "sale",
            customer: challan.customer,
            amount: totalAmount,
            paymentMethod: "due",
            description: `Invoice ${invoiceNo} created from Delivery Challan ${challan.challanNumber}`,
            owner: req.user._id,
        });

        // Update Sales Order if challan was created from one
        if (challan.salesOrder) {
            const salesOrder = await SalesOrder.findById(challan.salesOrder);
            if (salesOrder) {
                // Update invoicedQty and release reserved stock for each item
                for (const challanItem of challan.items) {
                    const soItem = salesOrder.items.find(
                        (i) => i.item.toString() === challanItem.item._id.toString()
                    );
                    if (soItem) {
                        soItem.invoicedQty += challanItem.deliveredQty;

                        // STRICT VALIDATION: Invoiced cannot exceed delivered
                        if (soItem.invoicedQty > soItem.deliveredQty) {
                            throw new Error(
                                `Invoiced quantity cannot exceed delivered quantity for item ${challanItem.item._id}`
                            );
                        }

                        // ERP-GRADE: Release reserved stock and reduce in-transit
                        const item = await Item.findById(challanItem.item._id);

                        const previousState = {
                            stockQty: item.stockQty,
                            reservedStock: item.reservedStock,
                            inTransitStock: item.inTransitStock || 0,
                        };

                        // OPTION A: Reduce ALL THREE (ONLY place stockQty is reduced)
                        item.stockQty -= challanItem.deliveredQty;           // PHYSICAL SALE
                        item.reservedStock -= challanItem.deliveredQty;      // RELEASE LOCK
                        item.inTransitStock = Math.max(0, (item.inTransitStock || 0) - challanItem.deliveredQty); // CLEAR DC

                        // STRICT VALIDATION: Reserved stock cannot be negative
                        if (item.reservedStock < 0) {
                            throw new Error(
                                `Reserved stock cannot be negative for item ${item.name}`
                            );
                        }

                        validateStockLevels(item);
                        await item.save();

                        const newState = {
                            stockQty: item.stockQty,
                            reservedStock: item.reservedStock,
                            inTransitStock: item.inTransitStock,
                        };

                        await logStockMovement(
                            item,
                            "INVOICE",
                            challanItem.deliveredQty,
                            invoice._id,
                            "Invoice",
                            req.user._id,
                            previousState,
                            newState
                        );

                        soItem.reservedQty = Math.max(0, soItem.reservedQty - challanItem.deliveredQty);
                    }
                }

                // Add invoice to sales order
                salesOrder.invoices.push(invoice._id);

                // Update sales order status
                const totalInvoiced = salesOrder.items.reduce((sum, item) => sum + item.invoicedQty, 0);
                const totalDelivered = salesOrder.items.reduce((sum, item) => sum + item.deliveredQty, 0);

                if (totalInvoiced >= totalDelivered) {
                    salesOrder.status = "Invoiced";
                } else if (totalInvoiced > 0) {
                    salesOrder.status = "Partially Invoiced";
                }

                await salesOrder.save();
            }
        }

        // Update challan
        challan.status = "Converted";
        challan.convertedToInvoice = invoice._id;
        challan.convertedAt = new Date();
        await challan.save();

        info(`Delivery Challan ${challan.challanNumber} converted to Invoice ${invoiceNo} by ${req.user.name}`);

        res.status(200).json({
            message: "Delivery Challan converted to Invoice successfully",
            invoice,
            challan,
        });
    } catch (err) {
        error(`Convert to Invoice Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Delete delivery challan
 * @route DELETE /api/delivery-challan/:id
 */
export const deleteDeliveryChallan = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid challan ID" });
        }

        const challan = await DeliveryChallan.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        });

        if (!challan) {
            return res.status(404).json({ message: "Delivery Challan not found" });
        }

        // Cannot delete if converted to invoice
        if (challan.status === "Converted" || challan.convertedToInvoice) {
            return res.status(400).json({
                message: "Cannot delete a challan that has been converted to invoice",
            });
        }

        // Restore inventory stock (add back the delivered quantity)
        for (const item of challan.items) {
            await Item.findByIdAndUpdate(item.item, {
                $inc: { stockQty: item.deliveredQty },
            });
        }

        // Update Sales Order if challan was created from one
        if (challan.salesOrder) {
            const salesOrder = await SalesOrder.findById(challan.salesOrder);
            if (salesOrder) {
                // Restore deliveredQty for each item
                for (const challanItem of challan.items) {
                    const soItem = salesOrder.items.find(
                        (i) => i.item.toString() === challanItem.item.toString()
                    );
                    if (soItem) {
                        soItem.deliveredQty = Math.max(0, soItem.deliveredQty - challanItem.deliveredQty);
                    }
                }

                // Remove challan from sales order
                salesOrder.deliveryChallans = salesOrder.deliveryChallans.filter(
                    (dc) => dc.toString() !== challan._id.toString()
                );

                // Update sales order status
                const totalOrdered = salesOrder.items.reduce((sum, item) => sum + item.quantity, 0);
                const totalDelivered = salesOrder.items.reduce((sum, item) => sum + item.deliveredQty, 0);

                if (totalDelivered === 0) {
                    salesOrder.status = "Confirmed";
                } else if (totalDelivered < totalOrdered) {
                    salesOrder.status = "Partially Delivered";
                } else {
                    salesOrder.status = "Delivered";
                }

                await salesOrder.save();
            }
        }

        await challan.deleteOne();

        info(`Delivery Challan deleted: ${challan.challanNumber} by ${req.user.name}`);

        res.status(200).json({ message: "Delivery Challan deleted successfully" });
    } catch (err) {
        error(`Delete Delivery Challan Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
