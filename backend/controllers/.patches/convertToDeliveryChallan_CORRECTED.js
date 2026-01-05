// CORRECTED VERSION OF convertToDeliveryChallan function
// Replace lines 482-608 in salesOrderController.js

export const convertToDeliveryChallan = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, deliveryDate, vehicleNo, driverName, transportMode, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid sales order ID format" });
        }

        const salesOrder = await SalesOrder.findOne({
            _id: id,
            createdBy: req.user._id,
        });

        if (!salesOrder) {
            return res.status(404).json({ message: "Sales Order not found or unauthorized" });
        }

        if (!salesOrder.isConfirmed) {
            return res.status(400).json({ message: "Only confirmed orders can be converted to Delivery Challan" });
        }

        if (salesOrder.isCancelled) {
            return res.status(400).json({ message: "Cannot convert cancelled order" });
        }

        if (salesOrder.status === "Invoiced") {
            return res.status(400).json({ message: "Order is already fully invoiced" });
        }

        // Validate items and quantities
        const dcItems = [];
        for (const dcItem of items) {
            const soItem = salesOrder.items.find((i) => i.item.toString() === dcItem.item);
            if (!soItem) {
                return res.status(400).json({ message: `Item ${dcItem.item} not found in sales order` });
            }

            const remainingQty = soItem.reservedQty - soItem.deliveredQty;
            if (dcItem.quantity > remainingQty) {
                return res.status(400).json({
                    message: `Cannot deliver ${dcItem.quantity} units. Only ${remainingQty} units remaining for delivery.`,
                });
            }

            dcItems.push({
                item: dcItem.item,
                quantity: soItem.quantity,
                deliveredQty: dcItem.quantity,
                unit: dcItem.unit || "pcs",
                description: dcItem.description || "",
            });

            // Update delivered quantity in sales order
            soItem.deliveredQty += dcItem.quantity;

            // ERP-GRADE: Update stock with in-transit tracking
            const item = await Item.findById(dcItem.item);

            // Capture previous state
            const previousState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock,
                inTransitStock: item.inTransitStock || 0,
            };

            // Reduce actual stock and increase in-transit
            item.stockQty -= dcItem.quantity;
            item.inTransitStock = (item.inTransitStock || 0) + dcItem.quantity;

            // Validate stock levels
            validateStockLevels(item);

            await item.save();

            // Capture new state
            const newState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock,
                inTransitStock: item.inTransitStock,
            };

            // Log DELIVER movement
            await logStockMovement(
                item,
                "DELIVER",
                dcItem.quantity,
                salesOrder._id,
                "SalesOrder",
                req.user._id,
                previousState,
                { ...previousState, stockQty: item.stockQty }
            );

            // Log IN_TRANSIT movement
            await logStockMovement(
                item,
                "IN_TRANSIT",
                dcItem.quantity,
                salesOrder._id,
                "SalesOrder",
                req.user._id,
                { ...previousState, stockQty: item.stockQty },
                newState
            );
        }

        // Validate Sales Order quantities
        validateSalesOrderQuantities(salesOrder);

        // Generate unique challan number
        const lastChallan = await DeliveryChallan.findOne({ createdBy: req.user._id })
            .sort({ createdAt: -1 })
            .select("challanNumber");

        let challanNumber = 1;
        if (lastChallan && lastChallan.challanNumber) {
            const match = lastChallan.challanNumber.match(/DC-(\d+)/);
            if (match) {
                challanNumber = parseInt(match[1]) + 1;
            }
        }

        const challanNo = `DC-${String(challanNumber).padStart(5, "0")}`;

        // Create delivery challan
        const deliveryChallan = await DeliveryChallan.create({
            challanNumber: challanNo,
            customer: salesOrder.customer,
            challanDate: new Date(),
            deliveryDate: deliveryDate || new Date(),
            items: dcItems,
            salesOrder: salesOrder._id,
            vehicleNo: vehicleNo || "",
            driverName: driverName || "",
            transportMode: transportMode || "road",
            notes: notes || "",
            createdBy: req.user._id,
        });

        // Link delivery challan to sales order
        salesOrder.deliveryChallans.push(deliveryChallan._id);

        // Update sales order status
        const totalDelivered = salesOrder.items.reduce((sum, item) => sum + item.deliveredQty, 0);
        const totalReserved = salesOrder.items.reduce((sum, item) => sum + item.reservedQty, 0);

        if (totalDelivered >= totalReserved) {
            salesOrder.status = "Delivered";
        } else if (totalDelivered > 0) {
            salesOrder.status = "Partially Delivered";
        }

        await salesOrder.save();

        info(`Delivery Challan created from Sales Order ${salesOrder.orderNumber}: ${challanNo}`);

        const populatedChallan = await DeliveryChallan.findById(deliveryChallan._id)
            .populate("customer", "name phone email")
            .populate("items.item", "name sku unit")
            .populate("salesOrder", "orderNumber");

        res.status(201).json({
            message: "Delivery Challan created successfully",
            deliveryChallan: populatedChallan,
            salesOrder: await SalesOrder.findById(salesOrder._id)
                .populate("customer", "name phone email")
                .populate("items.item", "name sku unit"),
        });
    } catch (err) {
        console.error("Convert to Delivery Challan Error:", err);
        error(`Conversion to Delivery Challan failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
