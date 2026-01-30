import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generatePurchaseReturnPDF = (returnData) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Helper function to add text with alignment
        const addText = (text, x, y, options = {}) => {
            const { align = 'left', fontSize = 10, fontStyle = 'normal', color = [0, 0, 0] } = options;
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', fontStyle);
            doc.setTextColor(...color);

            if (align === 'center') {
                doc.text(text, x, y, { align: 'center' });
            } else if (align === 'right') {
                doc.text(text, x, y, { align: 'right' });
            } else {
                doc.text(text, x, y);
            }
        };

        // Header Section
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 35, 'F');

        addText('PURCHASE RETURN', pageWidth / 2, 15, {
            align: 'center',
            fontSize: 20,
            fontStyle: 'bold',
            color: [255, 255, 255]
        });

        addText(returnData.returnId || 'N/A', pageWidth / 2, 25, {
            align: 'center',
            fontSize: 12,
            color: [255, 255, 255]
        });

        yPos = 45;

        // Company Info (Left) and Return Info (Right)
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);

        // Left Column - Company Info
        addText('BizzAI', 15, yPos, { fontSize: 14, fontStyle: 'bold' });
        yPos += 6;
        addText('Inventory Management System', 15, yPos, { fontSize: 9 });
        yPos += 5;
        addText('Email: support@bizzai.com', 15, yPos, { fontSize: 9 });
        yPos += 5;
        addText('Phone: +91 1234567890', 15, yPos, { fontSize: 9 });

        // Right Column - Return Info
        let rightYPos = 45;
        const rightX = pageWidth - 15;

        addText('Return Date:', rightX - 70, rightYPos, { fontSize: 9, fontStyle: 'bold' });
        addText(new Date(returnData.returnDate).toLocaleDateString(), rightX, rightYPos, { align: 'right', fontSize: 9 });
        rightYPos += 5;

        addText('Status:', rightX - 70, rightYPos, { fontSize: 9, fontStyle: 'bold' });
        addText((returnData.status || 'draft').toUpperCase().replace('_', ' '), rightX, rightYPos, { align: 'right', fontSize: 9 });
        rightYPos += 5;

        addText('Return Type:', rightX - 70, rightYPos, { fontSize: 9, fontStyle: 'bold' });
        addText((returnData.returnType || 'full').toUpperCase(), rightX, rightYPos, { align: 'right', fontSize: 9 });

        yPos = Math.max(yPos, rightYPos) + 10;

        // Separator Line
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 10;

        // Supplier Information
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 5, pageWidth - 30, 25, 'F');

        addText('SUPPLIER DETAILS', 20, yPos, { fontSize: 11, fontStyle: 'bold' });
        yPos += 7;

        addText('Business Name:', 20, yPos, { fontSize: 9, fontStyle: 'bold' });
        addText(returnData.supplier?.businessName || 'N/A', 60, yPos, { fontSize: 9 });
        yPos += 5;

        addText('Contact Person:', 20, yPos, { fontSize: 9, fontStyle: 'bold' });
        addText(returnData.supplier?.contactPersonName || 'N/A', 60, yPos, { fontSize: 9 });

        addText('Contact No:', pageWidth / 2 + 10, yPos, { fontSize: 9, fontStyle: 'bold' });
        addText(returnData.supplier?.contactNo || 'N/A', pageWidth / 2 + 40, yPos, { fontSize: 9 });
        yPos += 5;

        addText('Email:', 20, yPos, { fontSize: 9, fontStyle: 'bold' });
        addText(returnData.supplier?.email || 'N/A', 60, yPos, { fontSize: 9 });
        yPos += 10;

        // Return Reason
        if (returnData.returnReason) {
            doc.setFillColor(255, 243, 205);
            doc.rect(15, yPos - 5, pageWidth - 30, 15, 'F');

            addText('RETURN REASON:', 20, yPos, { fontSize: 9, fontStyle: 'bold' });
            yPos += 5;
            addText(returnData.returnReason, 20, yPos, { fontSize: 9 });
            yPos += 10;
        }

        // Items Table
        const tableData = (returnData.items || []).map(item => [
            item.itemName || 'N/A',
            item.sku || 'N/A',
            item.batchNo || 'N/A',
            (item.returnQty || item.quantity || 0).toString(),
            `₹${(item.rate || 0).toFixed(2)}`,
            `${item.taxRate || 0}%`,
            `₹${(item.total || 0).toFixed(2)}`,
            item.condition || 'N/A',
            item.disposition || 'N/A'
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Item', 'SKU', 'Batch', 'Qty', 'Rate', 'Tax', 'Total', 'Condition', 'Disposition']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 20, halign: 'right' },
                5: { cellWidth: 15, halign: 'center' },
                6: { cellWidth: 25, halign: 'right' },
                7: { cellWidth: 20, halign: 'center', fontSize: 7 },
                8: { cellWidth: 20, halign: 'center', fontSize: 7 }
            },
            margin: { left: 15, right: 15 },
            didDrawPage: (data) => {
                // Footer on each page
                const pageCount = doc.internal.getNumberOfPages();
                const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Page ${currentPage} of ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );

                doc.text(
                    `Generated on ${new Date().toLocaleString()}`,
                    15,
                    pageHeight - 10
                );
            }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Financial Summary
        const summaryX = pageWidth - 80;
        const summaryWidth = 65;

        // Summary Box
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(summaryX - 5, yPos - 5, summaryWidth, 45);

        addText('FINANCIAL SUMMARY', summaryX, yPos, { fontSize: 10, fontStyle: 'bold' });
        yPos += 7;

        // Summary Items
        const addSummaryLine = (label, value, isBold = false) => {
            addText(label, summaryX, yPos, { fontSize: 9, fontStyle: isBold ? 'bold' : 'normal' });
            addText(value, summaryX + summaryWidth - 5, yPos, {
                align: 'right',
                fontSize: 9,
                fontStyle: isBold ? 'bold' : 'normal'
            });
            yPos += 5;
        };

        addSummaryLine('Subtotal:', `₹${(returnData.subtotal || 0).toFixed(2)}`);
        addSummaryLine('Item Discount:', `- ₹${(returnData.itemDiscount || 0).toFixed(2)}`);
        addSummaryLine('Bill Discount:', `- ₹${(returnData.billDiscount || 0).toFixed(2)}`);
        addSummaryLine('Tax Amount:', `₹${(returnData.taxAmount || 0).toFixed(2)}`);

        // Total Line
        yPos += 2;
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(0.5);
        doc.line(summaryX, yPos - 2, summaryX + summaryWidth - 5, yPos - 2);

        doc.setFillColor(41, 128, 185);
        doc.rect(summaryX - 5, yPos - 4, summaryWidth, 10, 'F');

        addText('TOTAL AMOUNT:', summaryX, yPos + 2, {
            fontSize: 11,
            fontStyle: 'bold',
            color: [255, 255, 255]
        });
        addText(`₹${(returnData.totalAmount || 0).toFixed(2)}`, summaryX + summaryWidth - 5, yPos + 2, {
            align: 'right',
            fontSize: 11,
            fontStyle: 'bold',
            color: [255, 255, 255]
        });

        yPos += 15;

        // Refund Mode
        if (returnData.refundMode) {
            addText('Refund Mode:', 15, yPos, { fontSize: 9, fontStyle: 'bold' });
            addText((returnData.refundMode || '').replace('_', ' ').toUpperCase(), 50, yPos, { fontSize: 9 });
        }

        // Notes Section
        if (returnData.notes) {
            yPos += 10;
            doc.setFillColor(245, 245, 245);
            doc.rect(15, yPos - 5, pageWidth - 30, 20, 'F');

            addText('NOTES:', 20, yPos, { fontSize: 9, fontStyle: 'bold' });
            yPos += 5;

            const splitNotes = doc.splitTextToSize(returnData.notes, pageWidth - 40);
            doc.setFontSize(8);
            doc.text(splitNotes, 20, yPos);
        }

        // Save PDF
        doc.save(`Purchase_Return_${returnData.returnId || 'document'}.pdf`);

        console.log('PDF generated successfully');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
    }
};
