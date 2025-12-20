# Comprehensive Dark Mode Fix Script
# Applies dark mode classes to all remaining JSX pages

$basePath = "F:\Inventory Management\Tushar's Code\BizzAI\frontend\src\pages"

# List of all files to process
$files = @(
    "$basePath\Suppliers.jsx",
    "$basePath\Inventory.jsx",
    "$basePath\Reports.jsx",
    "$basePath\InvoiceDetail.jsx",
    "$basePath\CustomerDetail.jsx",
    "$basePath\SupplierDetail.jsx",
    "$basePath\POS.jsx",
    "$basePath\ProfileSettings.jsx",
    "$basePath\AddCustomer.jsx",
    "$basePath\AddSupplier.jsx",
    "$basePath\AddItem.jsx",
    "$basePath\EditCustomer.jsx",
    "$basePath\EditSupplier.jsx",
    "$basePath\EditItem.jsx",
    "$basePath\sales\SalesInvoiceDetail.jsx",
    "$basePath\sales\Estimate.jsx",
    "$basePath\sales\ProformaInvoice.jsx",
    "$basePath\sales\SalesOrder.jsx",
    "$basePath\sales\DeliveryChallan.jsx",
    "$basePath\sales\PaymentIn.jsx",
    "$basePath\sales\Return.jsx",
    "$basePath\sales\ReturnedItems.jsx",
    "$basePath\purchase\Purchase.jsx",
    "$basePath\purchase\Bills.jsx",
    "$basePath\purchase\PurchaseOrder.jsx",
    "$basePath\purchase\PurchaseReturn.jsx",
    "$basePath\purchase\PaymentOut.jsx",
    "$basePath\purchase\Expenses.jsx",
    "$basePath\business\GoogleProfile.jsx",
    "$basePath\business\MarketingTools.jsx",
    "$basePath\business\WhatsAppMarketing.jsx",
    "$basePath\business\OnlineShop.jsx",
    "$basePath\cashbank\BankAccounts.jsx",
    "$basePath\cashbank\CashInHand.jsx",
    "$basePath\cashbank\Cheques.jsx",
    "$basePath\cashbank\LoanAccounts.jsx",
    "$basePath\sync\Backup.jsx",
    "$basePath\sync\Restore.jsx",
    "$basePath\sync\SyncShare.jsx",
    "$basePath\utilities\BusinessSetup.jsx",
    "$basePath\utilities\BarcodeGenerator.jsx",
    "$basePath\utilities\ImportItems.jsx",
    "$basePath\utilities\DataExport.jsx",
    "$basePath\reports\ReportsDashboard.jsx"
)

$replacements = @(
    @('className="bg-white rounded', 'className="bg-white dark:bg-[rgb(var(--color-card))] rounded'),
    @('className="bg-gray-50 border', 'className="bg-gray-50 dark:bg-[rgb(var(--color-table-header))] border'),
    @('text-gray-900 mb-2"', 'text-gray-900 dark:text-[rgb(var(--color-text))] mb-2"'),
    @('text-gray-900 mt-2"', 'text-gray-900 dark:text-[rgb(var(--color-text))] mt-2"'),
    @('text-gray-900"', 'text-gray-900 dark:text-[rgb(var(--color-text))]"'),
    @('text-gray-600"', 'text-gray-600 dark:text-[rgb(var(--color-text-secondary))]"'),
    @('text-gray-500"', 'text-gray-500 dark:text-[rgb(var(--color-text-secondary))]"'),
    @('text-gray-400"', 'text-gray-400 dark:text-[rgb(var(--color-text-muted))]"'),
    @('bg-indigo-600 text-white', 'bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white'),
    @('text-indigo-600 hover', 'text-indigo-600 dark:text-[rgb(var(--color-primary))] hover'),
    @('text-red-600 hover', 'text-red-600 dark:text-red-400 hover'),
    @('bg-red-50 border border-red-200', 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800')
)

$count = 0
foreach ($file in $files) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw -ErrorAction Stop
            $modified = $false
            
            foreach ($pair in $replacements) {
                $old = $pair[0]
                $new = $pair[1]
                if ($content -like "*$old*") {
                    $content = $content.Replace($old, $new)
                    $modified = $true
                }
            }
            
            if ($modified) {
                Set-Content $file $content -NoNewline
                $count++
                Write-Host "✓ Fixed: $(Split-Path $file -Leaf)"
            } else {
                Write-Host "- Skipped: $(Split-Path $file -Leaf) (no changes needed)"
            }
        } catch {
            Write-Host "✗ Error: $(Split-Path $file -Leaf) - $($_.Exception.Message)"
        }
    } else {
        Write-Host "✗ Not found: $(Split-Path $file -Leaf)"
    }
}

Write-Host "`n========================================="
Write-Host "Batch fix complete! Modified $count files."
Write-Host "========================================="
