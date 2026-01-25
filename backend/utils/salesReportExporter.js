import jsPDF from 'jspdf';
import { error as logError } from '../utils/logger.js';

/**
 * Sales Report Exporter
 * 
 * Utility for exporting sales reports to PDF, Excel, and CSV formats
 */

class SalesReportExporter {
    /**
     * Export sales report to PDF
     */
    async exportToPDF(reportData, summary, userInfo, filters) {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPosition = 20;

            // Header - Company Info
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text(userInfo.shopName || 'Sales Report', pageWidth / 2, yPosition, { align: 'center' });

            yPosition += 8;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            if (userInfo.shopAddress) {
                doc.text(userInfo.shopAddress, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 5;
            }
            if (userInfo.gstNumber) {
                doc.text(`GSTIN: ${userInfo.gstNumber}`, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 5;
            }
            if (userInfo.phone) {
                doc.text(`Phone: ${userInfo.phone}`, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 5;
            }

            // Report Title and Date Range
            yPosition += 5;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Sales Report', pageWidth / 2, yPosition, { align: 'center' });

            yPosition += 7;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const dateRange = this.getDateRangeText(filters);
            doc.text(dateRange, pageWidth / 2, yPosition, { align: 'center' });

            // Summary Section
            yPosition += 10;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Summary', 14, yPosition);

            yPosition += 7;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');

            const summaryData = [
                ['Total Sales:', `₹${summary.totalSales.toLocaleString('en-IN')}`],
                ['Total Invoices:', summary.totalInvoices.toString()],
                ['Total Quantity:', summary.totalQuantity.toString()],
                ['Total Tax:', `₹${summary.totalTax.toLocaleString('en-IN')}`],
                ['Total Discount:', `₹${summary.totalDiscount.toLocaleString('en-IN')}`],
                ['Net Profit:', `₹${summary.netProfit.toLocaleString('en-IN')}`],
                ['Average Order Value:', `₹${summary.averageOrderValue.toLocaleString('en-IN')}`],
            ];

            summaryData.forEach(([label, value]) => {
                doc.text(label, 14, yPosition);
                doc.text(value, 100, yPosition);
                yPosition += 6;
            });

            // Table Header
            yPosition += 10;
            if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Transaction Details', 14, yPosition);

            yPosition += 7;
            doc.setFontSize(9);

            // Table headers
            const headers = ['Date', 'Invoice No', 'Customer', 'Amount', 'Tax', 'Total'];
            const colWidths = [25, 30, 50, 25, 20, 25];
            let xPosition = 14;

            headers.forEach((header, i) => {
                doc.text(header, xPosition, yPosition);
                xPosition += colWidths[i];
            });

            yPosition += 2;
            doc.line(14, yPosition, pageWidth - 14, yPosition);
            yPosition += 5;

            // Table rows
            doc.setFont(undefined, 'normal');
            reportData.data.forEach((row) => {
                if (yPosition > pageHeight - 20) {
                    doc.addPage();
                    yPosition = 20;
                }

                xPosition = 14;
                const rowData = [
                    new Date(row.invoiceDate).toLocaleDateString('en-IN'),
                    row.invoiceNo,
                    row.customerName.substring(0, 20),
                    `₹${row.netAmount.toLocaleString('en-IN')}`,
                    `₹${row.totalTax.toLocaleString('en-IN')}`,
                    `₹${row.netAmount.toLocaleString('en-IN')}`,
                ];

                rowData.forEach((data, i) => {
                    doc.text(data, xPosition, yPosition);
                    xPosition += colWidths[i];
                });

                yPosition += 6;
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
                doc.text(
                    `Generated on ${new Date().toLocaleString('en-IN')}`,
                    pageWidth - 14,
                    pageHeight - 10,
                    { align: 'right' }
                );
            }

            return doc.output('arraybuffer');
        } catch (err) {
            logError(`PDF Export Error: ${err.message}`);
            throw err;
        }
    }

    /**
     * Export sales report to CSV
     */
    async exportToCSV(reportData, summary) {
        try {
            const headers = [
                'Invoice Date',
                'Invoice No',
                'Customer Name',
                'Items Count',
                'Quantity Sold',
                'Gross Amount',
                'Discount',
                'Taxable Amount',
                'CGST',
                'SGST',
                'IGST',
                'Total Tax',
                'Net Amount',
                'Payment Status',
                'Payment Method',
            ];

            let csv = headers.join(',') + '\n';

            reportData.data.forEach((row) => {
                const rowData = [
                    new Date(row.invoiceDate).toLocaleDateString('en-IN'),
                    row.invoiceNo,
                    `"${row.customerName}"`,
                    row.itemsCount,
                    row.quantitySold,
                    row.grossAmount,
                    row.discount,
                    row.taxableAmount,
                    row.cgst,
                    row.sgst,
                    row.igst,
                    row.totalTax,
                    row.netAmount,
                    row.paymentStatus,
                    row.paymentMethod,
                ];
                csv += rowData.join(',') + '\n';
            });

            // Add summary at the end
            csv += '\n\nSummary\n';
            csv += `Total Sales,₹${summary.totalSales}\n`;
            csv += `Total Invoices,${summary.totalInvoices}\n`;
            csv += `Total Quantity,${summary.totalQuantity}\n`;
            csv += `Total Tax,₹${summary.totalTax}\n`;
            csv += `Total Discount,₹${summary.totalDiscount}\n`;
            csv += `Net Profit,₹${summary.netProfit}\n`;
            csv += `Average Order Value,₹${summary.averageOrderValue}\n`;

            return csv;
        } catch (err) {
            logError(`CSV Export Error: ${err.message}`);
            throw err;
        }
    }

    /**
     * Get human-readable date range text
     */
    getDateRangeText(filters) {
        const presets = {
            today: 'Today',
            yesterday: 'Yesterday',
            this_week: 'This Week',
            last_week: 'Last Week',
            this_month: 'This Month',
            last_month: 'Last Month',
            this_quarter: 'This Quarter',
            financial_year: 'Financial Year',
        };

        if (filters.dateFilter === 'custom' && filters.customStartDate && filters.customEndDate) {
            return `${new Date(filters.customStartDate).toLocaleDateString('en-IN')} - ${new Date(filters.customEndDate).toLocaleDateString('en-IN')}`;
        }

        return presets[filters.dateFilter] || 'This Month';
    }
}

export default new SalesReportExporter();
