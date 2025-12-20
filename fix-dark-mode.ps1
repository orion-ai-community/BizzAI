
# Dark Mode Batch Fix Script
# This script applies dark mode classes to all JSX files

$files = @(
    "F:\Inventory Management\Tushar's Code\BizzAI\frontend\src\pages\Customers.jsx",
    "F:\Inventory Management\Tushar's Code\BizzAI\frontend\src\pages\Suppliers.jsx",
    "F:\Inventory Management\Tushar's Code\BizzAI\frontend\src\pages\Inventory.jsx",
    "F:\Inventory Management\Tushar's Code\BizzAI\frontend\src\pages\Reports.jsx",
    "F:\Inventory Management\Tushar's Code\BizzAI\frontend\src\pages\CustomerDetail.jsx",
    "F:\Inventory Management\Tushar's Code\BizzAI\frontend\src\pages\SupplierDetail.jsx",
    "F:\Inventory Management\Tushar's Code\BizzAI\frontend\src\pages\InvoiceDetail.jsx"
)

# Common replacements
$replacements = @{
    'className="bg-white rounded' = 'className="bg-white dark:bg-[rgb(var(--color-card))] rounded'
    'className="bg-gray-50 ' = 'className="bg-gray-50 dark:bg-[rgb(var(--color-table-header))] '
    'text-gray-900"' = 'text-gray-900 dark:text-[rgb(var(--color-text))]"'
    'text-gray-600"' = 'text-gray-600 dark:text-[rgb(var(--color-text-secondary))]"'
    'text-gray-500"' = 'text-gray-500 dark:text-[rgb(var(--color-text-secondary))]"'
    'text-gray-400"' = 'text-gray-400 dark:text-[rgb(var(--color-text-muted))]"'
    'border-gray-300"' = 'border-gray-300 dark:border-[rgb(var(--color-border))]"'
    'border-gray-200"' = 'border-gray-200 dark:border-[rgb(var(--color-border))]"'
    'divide-gray-200"' = 'divide-gray-200 dark:divide-[rgb(var(--color-border))]"'
}

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        foreach ($key in $replacements.Keys) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
        }
        
        Set-Content $file $content -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "Batch fix complete!"
