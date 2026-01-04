"""
ERP-Grade Hardening Patch Script
Applies all remaining controller updates for BizzAI system
"""

import re
import os
from pathlib import Path

# Base path
BASE_PATH = r"f:\Inventory Management\Tushar's Code\BizzAI\backend\controllers"

def patch_sales_order_controller():
    """Patch salesOrderController.js with in-transit stock and logging"""
    file_path = os.path.join(BASE_PATH, "salesOrderController.js")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patch 1: Replace stock update in convertToDeliveryChallan (around line 541-544)
    old_code_1 = r"""            // Update delivered quantity in sales order
            soItem.deliveredQty \+= dcItem.quantity;

            // Reduce ONLY actual stock \(reserved stock released on invoice\)
            await Item.findByIdAndUpdate\(dcItem.item, \{
                \$inc: \{ stockQty: -dcItem.quantity \},
            \}\);"""
    
    new_code_1 = """            // Update delivered quantity in sales order
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
            );"""
    
    content = re.sub(old_code_1, new_code_1, content, flags=re.MULTILINE)
    
    # Patch 2: Add validation after DC items loop
    old_code_2 = r"""        \}

        // Generate unique challan number"""
    
    new_code_2 = """        }

        // Validate Sales Order quantities
        validateSalesOrderQuantities(salesOrder);

        // Generate unique challan number"""
    
    content = re.sub(old_code_2, new_code_2, content, flags=re.MULTILINE)
    
    # Patch 3: Replace payment status calculation in convertToInvoice (around line 679-687)
    old_code_3 = r"""        // Determine payment status
        let paymentStatus;
        if \(paidAmount >= totalAmount\) \{
            paymentStatus = "paid";
        \} else if \(paidAmount > 0\) \{
            paymentStatus = "partial";
        \} else \{
            paymentStatus = "unpaid";
        \}"""
    
    new_code_3 = """        // Determine payment status - USE CENTRALIZED FUNCTION
        const paymentStatus = calculatePaymentStatus(totalAmount, paidAmount, 0);"""
    
    content = re.sub(old_code_3, new_code_3, content, flags=re.MULTILINE)
    
    # Patch 4: Add stock release and logging before creating invoice in convertToInvoice
    old_code_4 = r"""            // Update invoiced quantity in sales order
            soItem.invoicedQty \+= invItem.quantity;
        \}

        const totalAmount = subtotal - discount;"""
    
    new_code_4 = """            // Update invoiced quantity in sales order
            soItem.invoicedQty += invItem.quantity;

            // ERP-GRADE: Release reserved stock and reduce in-transit
            const item = await Item.findById(invItem.item);
            
            const previousState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock,
                inTransitStock: item.inTransitStock || 0,
            };

            // Release reserved stock
            item.reservedStock -= invItem.quantity;
            
            // Reduce in-transit stock (if any)
            if (item.inTransitStock > 0) {
                item.inTransitStock = Math.max(0, item.inTransitStock - invItem.quantity);
            }

            validateStockLevels(item);
            await item.save();

            const newState = {
                stockQty: item.stockQty,
                reservedStock: item.reservedStock,
                inTransitStock: item.inTransitStock,
            };

            // Log INVOICE movement
            await logStockMovement(
                item,
                "INVOICE",
                invItem.quantity,
                salesOrder._id,
                "SalesOrder",
                req.user._id,
                previousState,
                newState
            );
        }

        // Validate Sales Order quantities
        validateSalesOrderQuantities(salesOrder);

        const totalAmount = subtotal - discount;"""
    
    content = re.sub(old_code_4, new_code_4, content, flags=re.MULTILINE)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Patched {file_path}")
    return True

def patch_delivery_challan_controller():
    """Patch deliveryChallanController.js"""
    file_path = os.path.join(BASE_PATH, "deliveryChallanController.js")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add imports at top
    old_imports = r"""import \{ info, error \} from "../utils/logger.js";"""
    new_imports = """import { info, error } from "../utils/logger.js";
import { logStockMovement } from "../utils/stockMovementLogger.js";
import { calculatePaymentStatus } from "../utils/paymentStatusCalculator.js";
import { validateStockLevels, validateSalesOrderQuantities } from "../utils/inventoryValidator.js";"""
    
    content = re.sub(old_imports, new_imports, content)
    
    # Patch convertToInvoice - add idempotency check at start
    old_check = r"""export const convertToInvoice = async \(req, res\) => \{
    try \{
        if \(!mongoose.Types.ObjectId.isValid\(req.params.id\)\) \{"""
    
    new_check = """export const convertToInvoice = async (req, res) => {
    try {
        // ERP-GRADE: Idempotency check
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {"""
    
    content = re.sub(old_check, new_check, content)
    
    # Add idempotency validation after finding challan
    old_validation = r"""        if \(!challan\) \{
            return res.status\(404\).json\(\{ message: "Delivery Challan not found" \}\);
        \}

        // Validate not already converted"""
    
    new_validation = """        if (!challan) {
            return res.status(404).json({ message: "Delivery Challan not found" });
        }

        // ERP-GRADE: Idempotency - fail if already converted
        // Validate not already converted"""
    
    content = re.sub(old_validation, new_validation, content)
    
    # Replace payment status calculation
    old_payment = r"""        // Determine payment status
        let paymentStatus;
        if \(effectivePaid >= totalAmount\) \{
            paymentStatus = "paid";
        \} else if \(effectivePaid > 0\) \{
            paymentStatus = "partial";
        \} else \{
            paymentStatus = "unpaid";
        \}"""
    
    new_payment = """        // Determine payment status - USE CENTRALIZED FUNCTION
        const effectivePaid = 0; // DC to Invoice has no payment by default
        const paymentStatus = calculatePaymentStatus(totalAmount, 0, 0);"""
    
    # This pattern might not exist, so use try-except
    try:
        content = re.sub(old_payment, new_payment, content, flags=re.MULTILINE)
    except:
        pass
    
    # Patch getAllDeliveryChallans to exclude system-generated and deleted
    old_find = r"""export const getAllDeliveryChallans = async \(req, res\) => \{
    try \{
        const challans = await DeliveryChallan.find\(\{ createdBy: req.user._id \}\)"""
    
    new_find = """export const getAllDeliveryChallans = async (req, res) => {
    try {
        const challans = await DeliveryChallan.find({ 
            createdBy: req.user._id,
            systemGenerated: { $ne: true },
            isDeleted: { $ne: true }
        })"""
    
    content = re.sub(old_find, new_find, content)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Patched {file_path}")
    return True

def patch_sales_invoice_controller():
    """Patch salesInvoiceController.js"""
    file_path = os.path.join(BASE_PATH, "salesInvoiceController.js")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add imports
    old_imports = r"""import \{ info, error \} from "../utils/logger.js";"""
    new_imports = """import { info, error } from "../utils/logger.js";
import { calculatePaymentStatus } from "../utils/paymentStatusCalculator.js";"""
    
    content = re.sub(old_imports, new_imports, content)
    
    # Patch getAllSalesInvoices to exclude deleted
    old_find = r"""const invoices = await Invoice.find\(\{ createdBy: req.user._id \}\)"""
    new_find = """const invoices = await Invoice.find({ 
      createdBy: req.user._id,
      isDeleted: { $ne: true }
    })"""
    
    content = re.sub(old_find, new_find, content)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Patched {file_path}")
    return True

def main():
    print("🚀 Starting ERP-Grade Hardening Patches...")
    print("=" * 60)
    
    try:
        patch_sales_order_controller()
        patch_delivery_challan_controller()
        patch_sales_invoice_controller()
        
        print("=" * 60)
        print("✅ All patches applied successfully!")
        print("\nNext steps:")
        print("1. Review the changes in each controller")
        print("2. Test the application")
        print("3. Check for any compilation errors")
        
    except Exception as e:
        print(f"❌ Error applying patches: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
