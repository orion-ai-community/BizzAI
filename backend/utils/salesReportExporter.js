import { jsPDF } from 'jspdf';
import { error as logError } from '../utils/logger.js';

/**
 * Sales Report Exporter - Enterprise Grade
 * 
 * Generates audit-ready, print-ready PDF reports with precise formatting
 * A4 page size with fixed margins and professional layout
 */

class SalesReportExporter {
    /**
     * Export sales report to PDF - Enterprise Grade
     * A4 size: 210mm x 297mm (595.28 x 841.89 points)
     * Margins: Top/Bottom 20mm (56.69pt), Left/Right 15mm (42.52pt)
     */
    async exportToPDF(reportData, summary, userInfo, filters) {
        try {
            // Initialize PDF with A4 size
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });

            // A4 dimensions in points (1mm = 2.83465pt)
            const pageWidth = 595.28;  // 210mm
            const pageHeight = 841.89; // 297mm

            // Fixed margins in points
            const marginTop = 56.69;    // 20mm
            const marginBottom = 56.69; // 20mm
            const marginLeft = 42.52;   // 15mm
            const marginRight = 42.52;  // 15mm

            const contentWidth = pageWidth - marginLeft - marginRight;
            const contentHeight = pageHeight - marginTop - marginBottom;

            let yPosition = marginTop;

            // ========== HEADER SECTION ==========
            // Store Name - Large, Bold
            doc.setFontSize(18);
            doc.text(userInfo.shopName || 'Sales Report', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 18;

            // Store Address
            doc.setFontSize(10);
            if (userInfo.shopAddress) {
                doc.text(userInfo.shopAddress, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 12;
            }

            // Contact Details
            if (userInfo.phone) {
                doc.text(`Phone: ${userInfo.phone}`, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 12;
            }

            // Horizontal divider
            yPosition += 8;
            doc.setLineWidth(0.5);
            doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
            yPosition += 25; // Space after first divider (to Sales Report)

            // ========== REPORT TITLE SECTION ==========
            doc.setFontSize(16);
            doc.text('Sales Report', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 18; // Space between titles

            // Date Range Subtitle
            doc.setFontSize(11);
            const dateRange = this.getDateRangeText(filters);
            doc.text(dateRange, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15; // Space after This Month (to bottom line) - SAME as top

            // Divider line
            doc.setLineWidth(0.5);
            doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
            yPosition += 20;

            // ========== SUMMARY SECTION - TWO COLUMN GRID ==========
            doc.setFontSize(12);
            doc.text('Summary', marginLeft, yPosition);
            yPosition += 18; // More space after heading

            // Two-column layout with fixed positioning
            const col1X = marginLeft;
            const col2X = marginLeft + (contentWidth / 2);
            const labelWidth = 120;
            const valueWidth = 100;

            doc.setFontSize(10);

            // Left Column Data
            const leftColumnData = [
                ['Total Sales:', `Rs ${this.formatCurrency(summary.totalSales)}`],
                ['Total Invoices:', summary.totalInvoices.toString()],
                ['Total Quantity:', summary.totalQuantity.toString()],
                ['Total Tax:', `Rs ${this.formatCurrency(summary.totalTax)}`],
            ];

            // Right Column Data
            const rightColumnData = [
                ['Total Discount:', `Rs ${this.formatCurrency(summary.totalDiscount)}`],
                ['Net Profit:', `Rs ${this.formatCurrency(summary.netProfit)}`],
                ['Average Order Value:', `Rs ${this.formatCurrency(summary.averageOrderValue)}`],
            ];

            const summaryRowHeight = 16;
            let summaryY = yPosition;

            // Render Left Column
            leftColumnData.forEach(([label, value]) => {
                doc.text(label, col1X, summaryY);
                doc.text(value, col1X + labelWidth + valueWidth, summaryY, { align: 'right' });
                summaryY += summaryRowHeight;
            });

            // Render Right Column
            summaryY = yPosition;
            rightColumnData.forEach(([label, value]) => {
                doc.text(label, col2X, summaryY);
                doc.text(value, col2X + labelWidth + valueWidth, summaryY, { align: 'right' });
                summaryY += summaryRowHeight;
            });

            yPosition = summaryY + 20; // More space after summary

            // ========== TRANSACTION DETAILS TABLE ==========
            // Check if we need a new page
            if (yPosition > pageHeight - marginBottom - 120) {
                doc.addPage();
                yPosition = marginTop;
            }

            doc.setFontSize(12);
            doc.text('Transaction Details', marginLeft, yPosition);
            yPosition += 18; // More space after heading

            // Table Configuration - FIXED COLUMN WIDTHS (adjusted for better fit)
            const tableHeaders = ['Date', 'Invoice No', 'Customer', 'Amount', 'Tax', 'Total'];
            const columnWidths = [50, 110, 120, 80, 60, 80]; // Wider invoice column
            const columnAlignments = ['center', 'left', 'left', 'right', 'right', 'right'];

            // Calculate column X positions
            const columnX = [marginLeft];
            for (let i = 0; i < columnWidths.length - 1; i++) {
                columnX.push(columnX[i] + columnWidths[i]);
            }

            // Table Header Background
            doc.setFillColor(240, 240, 240);
            doc.rect(marginLeft, yPosition - 10, contentWidth, 16, 'F');

            // Table Header Text - ALIGNED WITH COLUMNS
            doc.setFontSize(9);
            tableHeaders.forEach((header, i) => {
                let xPos;
                if (columnAlignments[i] === 'right') {
                    xPos = columnX[i] + columnWidths[i] - 5;
                } else if (columnAlignments[i] === 'center') {
                    xPos = columnX[i] + (columnWidths[i] / 2);
                } else {
                    xPos = columnX[i] + 3;
                }
                doc.text(header, xPos, yPosition, { align: columnAlignments[i] });
            });

            yPosition += 4;
            doc.setLineWidth(0.5);
            doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
            yPosition += 14;

            // Table Rows
            doc.setFontSize(8);
            const invoices = reportData.data || reportData;
            const baseRowHeight = 20; // Increased base height
            const lineSpacing = 11; // Spacing between wrapped lines

            invoices.forEach((row, index) => {
                // Prepare row data
                const rowData = [
                    new Date(row.invoiceDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                    }),
                    row.invoiceNo || '',
                    row.customerName || '',
                    `Rs ${this.formatCurrency(row.netAmount)}`,
                    `Rs ${this.formatCurrency(row.totalTax)}`,
                    `Rs ${this.formatCurrency(row.netAmount)}`,
                ];

                // Calculate text wrapping for each cell
                const wrappedTexts = rowData.map((text, i) => {
                    const maxWidth = columnWidths[i] - 10; // 10pt padding (5pt each side)
                    return doc.splitTextToSize(text.toString(), maxWidth);
                });

                // Calculate row height based on maximum lines in any cell
                const maxLines = Math.max(...wrappedTexts.map(lines => lines.length));
                const rowHeight = maxLines > 1 ? (maxLines * lineSpacing) + 8 : baseRowHeight;

                // Check if we need a new page
                if (yPosition + rowHeight > pageHeight - marginBottom) {
                    doc.addPage();
                    yPosition = marginTop + 10;

                    // Repeat table header on new page
                    doc.setFillColor(240, 240, 240);
                    doc.rect(marginLeft, yPosition - 10, contentWidth, 16, 'F');
                    doc.setFontSize(9);
                    tableHeaders.forEach((header, i) => {
                        let xPos;
                        if (columnAlignments[i] === 'right') {
                            xPos = columnX[i] + columnWidths[i] - 5;
                        } else if (columnAlignments[i] === 'center') {
                            xPos = columnX[i] + (columnWidths[i] / 2);
                        } else {
                            xPos = columnX[i] + 3;
                        }
                        doc.text(header, xPos, yPosition, { align: columnAlignments[i] });
                    });
                    yPosition += 4;
                    doc.setLineWidth(0.5);
                    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
                    yPosition += 14;
                    doc.setFontSize(8);
                }

                // Alternating row background - properly sized for multi-line content
                if (index % 2 === 0) {
                    doc.setFillColor(252, 252, 252);
                    doc.rect(marginLeft, yPosition - 6, contentWidth, rowHeight, 'F');
                }

                // Calculate starting Y position for text (vertically centered in row)
                const textStartY = yPosition + 4;

                // Render each cell with proper alignment and wrapping
                wrappedTexts.forEach((lines, i) => {
                    let xPos;
                    if (columnAlignments[i] === 'right') {
                        xPos = columnX[i] + columnWidths[i] - 5;
                    } else if (columnAlignments[i] === 'center') {
                        xPos = columnX[i] + (columnWidths[i] / 2);
                    } else {
                        xPos = columnX[i] + 5;
                    }

                    // Render each line of wrapped text
                    lines.forEach((line, lineIndex) => {
                        const lineY = textStartY + (lineIndex * lineSpacing);
                        doc.text(line, xPos, lineY, { align: columnAlignments[i] });
                    });
                });

                yPosition += rowHeight;
            });

            // Bottom border of table
            doc.setLineWidth(0.5);
            doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);

            // ========== FOOTER ON ALL PAGES ==========
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                // Footer line
                doc.setLineWidth(0.3);
                doc.line(marginLeft, pageHeight - marginBottom + 10, pageWidth - marginRight, pageHeight - marginBottom + 10);

                // Page number
                doc.setFontSize(8);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - marginBottom + 20,
                    { align: 'center' }
                );

                // Generated timestamp
                const timestamp = `Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
                doc.text(
                    timestamp,
                    pageWidth - marginRight,
                    pageHeight - marginBottom + 20,
                    { align: 'right' }
                );
            }

            return doc.output('arraybuffer');
        } catch (err) {
            logError(`PDF Export Error: ${err.message}`);
            logError(`PDF Export Stack: ${err.stack}`);
            console.error('PDF Export Full Error:', err);
            throw new Error(`PDF generation failed: ${err.message}`);
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

            const invoices = reportData.data || reportData;
            invoices.forEach((row) => {
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
            csv += `Total Sales,Rs ${this.formatCurrency(summary.totalSales)}\n`;
            csv += `Total Invoices,${summary.totalInvoices}\n`;
            csv += `Total Quantity,${summary.totalQuantity}\n`;
            csv += `Total Tax,Rs ${this.formatCurrency(summary.totalTax)}\n`;
            csv += `Total Discount,Rs ${this.formatCurrency(summary.totalDiscount)}\n`;
            csv += `Net Profit,Rs ${this.formatCurrency(summary.netProfit)}\n`;
            csv += `Average Order Value,Rs ${this.formatCurrency(summary.averageOrderValue)}\n`;

            return csv;
        } catch (err) {
            logError(`CSV Export Error: ${err.message}`);
            throw err;
        }
    }

    /**
     * Format currency with proper decimal places
     */
    formatCurrency(value) {
        if (value === null || value === undefined) return '0.00';
        return parseFloat(value).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Truncate text to fit column width
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
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
