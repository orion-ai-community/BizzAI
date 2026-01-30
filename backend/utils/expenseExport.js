import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Parser } from 'json2csv';

/**
 * Export expenses to PDF with professional enterprise-grade formatting
 * @param {Array} expenses - Array of expense documents
 * @param {Object} user - User object
 * @param {Object} filters - Applied filters
 * @returns {Promise<Buffer>} PDF buffer
 */
export const exportToPDF = async (expenses, user, filters = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                bufferPages: true
            });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Colors
            const primaryColor = '#2563EB';
            const secondaryColor = '#64748B';
            const accentColor = '#10B981';
            const borderColor = '#E2E8F0';

            // Header with company branding
            doc.rect(0, 0, doc.page.width, 120).fill('#F8FAFC');

            doc.fillColor(primaryColor)
                .fontSize(28)
                .font('Helvetica-Bold')
                .text('EXPENSE REPORT', 50, 40, { align: 'center' });

            doc.fillColor(secondaryColor)
                .fontSize(10)
                .font('Helvetica')
                .text('Detailed Financial Summary', { align: 'center' });

            // Business Information Box
            doc.rect(50, 140, 250, 80).stroke(borderColor);
            doc.fillColor('#1E293B')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Business Information', 60, 150);

            doc.fillColor(secondaryColor)
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${user.shopName || user.name}`, 60, 170);

            if (user.gstNumber) {
                doc.text(`GST Number: ${user.gstNumber}`, 60, 185);
            }
            if (user.email) {
                doc.text(`Email: ${user.email}`, 60, 200);
            }

            // Report Information Box
            doc.rect(320, 140, 225, 80).stroke(borderColor);
            doc.fillColor('#1E293B')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Report Details', 330, 150);

            doc.fillColor(secondaryColor)
                .fontSize(10)
                .font('Helvetica')
                .text(`Generated: ${new Date().toLocaleString('en-IN')}`, 330, 170);

            if (filters.startDate || filters.endDate) {
                doc.text(`Period: ${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`, 330, 185, { width: 200 });
            }

            doc.text(`Total Records: ${expenses.length}`, 330, 200);

            // Financial Summary Section
            const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const avgAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;

            doc.rect(50, 240, 495, 70).fill('#EFF6FF');

            doc.fillColor(primaryColor)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('FINANCIAL SUMMARY', 60, 250);

            // Summary metrics in columns
            doc.fillColor('#1E293B')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Total Expenses:', 60, 275);

            doc.fillColor(accentColor)
                .fontSize(16)
                .text(`Rs. ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 60, 290);

            doc.fillColor('#1E293B')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Average Amount:', 280, 275);

            doc.fillColor(secondaryColor)
                .fontSize(14)
                .text(`Rs. ${avgAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 280, 290);

            doc.fillColor('#1E293B')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Total Entries:', 450, 275);

            doc.fillColor(secondaryColor)
                .fontSize(14)
                .text(expenses.length.toString(), 450, 290);

            // Table Section
            const tableTop = 340;
            const colWidths = {
                date: 70,
                expenseNo: 95,
                category: 85,
                amount: 75,
                method: 70,
                status: 60,
            };

            // Table Header
            doc.rect(50, tableTop, 495, 25).fill(primaryColor);

            doc.fillColor('#FFFFFF')
                .fontSize(9)
                .font('Helvetica-Bold');

            let x = 55;
            const headerY = tableTop + 8;
            doc.text('Date', x, headerY, { width: colWidths.date });
            x += colWidths.date;
            doc.text('Expense #', x, headerY, { width: colWidths.expenseNo });
            x += colWidths.expenseNo;
            doc.text('Category', x, headerY, { width: colWidths.category });
            x += colWidths.category;
            doc.text('Amount', x, headerY, { width: colWidths.amount });
            x += colWidths.amount;
            doc.text('Method', x, headerY, { width: colWidths.method });
            x += colWidths.method;
            doc.text('Status', x, headerY, { width: colWidths.status });

            // Table Rows
            let rowY = tableTop + 30;
            doc.font('Helvetica').fontSize(9);

            expenses.forEach((expense, index) => {
                // Check if we need a new page
                if (rowY > 720) {
                    doc.addPage();
                    rowY = 50;

                    // Repeat header on new page
                    doc.rect(50, rowY, 495, 25).fill(primaryColor);
                    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');

                    let headerX = 55;
                    const newHeaderY = rowY + 8;
                    doc.text('Date', headerX, newHeaderY, { width: colWidths.date });
                    headerX += colWidths.date;
                    doc.text('Expense #', headerX, newHeaderY, { width: colWidths.expenseNo });
                    headerX += colWidths.expenseNo;
                    doc.text('Category', headerX, newHeaderY, { width: colWidths.category });
                    headerX += colWidths.category;
                    doc.text('Amount', headerX, newHeaderY, { width: colWidths.amount });
                    headerX += colWidths.amount;
                    doc.text('Method', headerX, newHeaderY, { width: colWidths.method });
                    headerX += colWidths.method;
                    doc.text('Status', headerX, newHeaderY, { width: colWidths.status });

                    rowY += 30;
                }

                // Alternate row background
                if (index % 2 === 0) {
                    doc.rect(50, rowY - 3, 495, 18).fill('#F8FAFC');
                }

                doc.fillColor('#1E293B');
                x = 55;

                doc.text(new Date(expense.date).toLocaleDateString('en-IN'), x, rowY, {
                    width: colWidths.date,
                    lineBreak: false
                });
                x += colWidths.date;

                doc.text(expense.expenseNo || '-', x, rowY, {
                    width: colWidths.expenseNo,
                    lineBreak: false
                });
                x += colWidths.expenseNo;

                doc.text(expense.category || '-', x, rowY, {
                    width: colWidths.category,
                    lineBreak: false
                });
                x += colWidths.category;

                // Format amount without rupee symbol to avoid encoding issues
                doc.fillColor(accentColor)
                    .font('Helvetica-Bold')
                    .text(`Rs. ${expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, x, rowY, {
                        width: colWidths.amount,
                        lineBreak: false
                    });
                x += colWidths.amount;

                doc.fillColor('#1E293B')
                    .font('Helvetica')
                    .text(expense.paymentMethod || '-', x, rowY, {
                        width: colWidths.method,
                        lineBreak: false
                    });
                x += colWidths.method;

                // Status with color coding
                const statusColor = expense.status === 'approved' ? '#10B981' :
                    expense.status === 'rejected' ? '#EF4444' : '#F59E0B';
                doc.fillColor(statusColor)
                    .text(expense.status || 'pending', x, rowY, {
                        width: colWidths.status,
                        lineBreak: false
                    });

                rowY += 18;
            });

            // Footer line
            doc.moveTo(50, rowY + 5)
                .lineTo(545, rowY + 5)
                .strokeColor(borderColor)
                .stroke();

            // Page numbers and footer
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);

                // Footer
                doc.fillColor(secondaryColor)
                    .fontSize(8)
                    .font('Helvetica')
                    .text(
                        `Generated by BizzAI - Enterprise Inventory Management System`,
                        50,
                        doc.page.height - 50,
                        { align: 'center', width: doc.page.width - 100 }
                    );

                // Page number
                doc.text(
                    `Page ${i + 1} of ${pages.count}`,
                    50,
                    doc.page.height - 35,
                    { align: 'center', width: doc.page.width - 100 }
                );
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Export expenses to Excel
 * @param {Array} expenses - Array of expense documents
 * @param {Object} user - User object
 * @param {Object} filters - Applied filters
 * @returns {Promise<Buffer>} Excel buffer
 */
export const exportToExcel = async (expenses, user, filters = {}) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    // Set column headers
    worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Expense Number', key: 'expenseNo', width: 18 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Amount (Rs.)', key: 'amount', width: 12 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Reference Number', key: 'referenceNumber', width: 15 },
        { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data rows
    expenses.forEach(expense => {
        worksheet.addRow({
            date: new Date(expense.date).toLocaleDateString('en-IN'),
            expenseNo: expense.expenseNo,
            category: expense.category,
            description: expense.description || '',
            amount: expense.amount,
            paymentMethod: expense.paymentMethod,
            status: expense.status,
            referenceNumber: expense.referenceNumber || '',
            notes: expense.notes || '',
        });
    });

    // Add summary row
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    worksheet.addRow({});
    const summaryRow = worksheet.addRow({
        date: '',
        expenseNo: '',
        category: '',
        description: 'TOTAL',
        amount: totalAmount,
        paymentMethod: '',
        status: '',
        referenceNumber: '',
        notes: `${expenses.length} entries`,
    });
    summaryRow.font = { bold: true };
    summaryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
    };

    // Format amount column as currency
    worksheet.getColumn('amount').numFmt = 'Rs. #,##0.00';

    // Auto-filter
    worksheet.autoFilter = {
        from: 'A1',
        to: 'I1',
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};

/**
 * Export expenses to CSV
 * @param {Array} expenses - Array of expense documents
 * @returns {string} CSV string
 */
export const exportToCSV = (expenses) => {
    const fields = [
        { label: 'Date', value: (row) => new Date(row.date).toLocaleDateString('en-IN') },
        { label: 'Expense Number', value: 'expenseNo' },
        { label: 'Category', value: 'category' },
        { label: 'Description', value: 'description' },
        { label: 'Amount', value: 'amount' },
        { label: 'Payment Method', value: 'paymentMethod' },
        { label: 'Status', value: 'status' },
        { label: 'Reference Number', value: 'referenceNumber' },
        { label: 'Notes', value: 'notes' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(expenses);

    return csv;
};

/**
 * Get export filename with timestamp
 * @param {string} format - Export format (pdf, excel, csv)
 * @returns {string} Filename
 */
export const getExportFilename = (format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const extensions = {
        pdf: 'pdf',
        excel: 'xlsx',
        csv: 'csv',
    };

    return `expenses_${timestamp}.${extensions[format] || 'pdf'}`;
};
