import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

/**
 * Generates professional PDF invoice using jsPDF and saves it to /invoices folder
 * @param {Object} invoiceData - Invoice object from DB
 * @returns {String} filePath - Generated PDF path
 */
export const generateInvoicePDF = async (invoiceData) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Colors (keep neutral for simple layout)
  const grayColor = [107, 114, 128]; // Gray

  // === HEADER SECTION ===
  // Shop Name as Heading
  const shopName = invoiceData.createdBy?.shopName || invoiceData.createdBy?.name || "INVOICE";
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(shopName, margin, 20);

  // Invoice Number
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.invoiceNo || "INV-00000", margin, 28);

  // Date and Time - Right aligned
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text("Invoice Date", pageWidth - margin, 20, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const invoiceDate = new Date(invoiceData.createdAt);
  doc.text(invoiceDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), 
    pageWidth - margin, 25, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(invoiceDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase(), 
    pageWidth - margin, 30, { align: "right" });

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);

  // === CUSTOMER SECTION ===
  let yPos = 45;

  // Bill To
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", margin, yPos);

  // Payment Status - Right aligned
  doc.text("PAYMENT STATUS", pageWidth - margin, yPos, { align: "right" });

  yPos += 6;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  
  if (invoiceData.customer) {
    doc.text(invoiceData.customer.name || "N/A", margin, yPos);
  } else {
    doc.text("Walk-in Customer", margin, yPos);
  }

  // Payment Status Value (neutral)
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceData.paymentStatus?.toUpperCase() || "UNPAID", pageWidth - margin, yPos, { align: "right" });

  yPos += 5;
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");

  if (invoiceData.customer) {
    if (invoiceData.customer.phone) {
      doc.text(invoiceData.customer.phone, margin, yPos);
      yPos += 4;
    }
    if (invoiceData.customer.email) {
      doc.text(invoiceData.customer.email, margin, yPos);
      yPos += 4;
    }
    if (invoiceData.customer.address) {
      const addressLines = doc.splitTextToSize(invoiceData.customer.address, 80);
      doc.text(addressLines, margin, yPos);
      yPos += (addressLines.length * 4);
    }
  }

  // Payment Method - Right side
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text("Payment Method", pageWidth - margin, yPos - 10, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.paymentMethod || "Cash", pageWidth - margin, yPos - 5, { align: "right" });

  yPos += 10;

  // === TABLE SECTION ===
  // Table headers
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "bold");

  const col1 = margin + 5; // #
  const col2 = margin + 15; // Item
  const col3 = pageWidth - 85; // Quantity
  const col4 = pageWidth - 55; // Price
  const col5 = pageWidth - 25; // Total

  doc.text("#", col1, yPos);
  doc.text("Item", col2, yPos);
  doc.text("Quantity", col3, yPos, { align: "center" });
  doc.text("Price", col4, yPos, { align: "right" });
  doc.text("Total", col5, yPos, { align: "right" });

  yPos += 4;
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Table rows
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  invoiceData.items.forEach((item, index) => {
    yPos += 7;
    
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(String(index + 1), col1, yPos);
    
    // Get item name from populated item reference or fallback
    const itemName = item.item?.name || item.name || item.itemName || "Item";
    const maxWidth = col3 - col2 - 5;
    const itemLines = doc.splitTextToSize(itemName, maxWidth);
    doc.text(itemLines[0], col2, yPos); // Show first line only for compact view
    
    doc.text(String(item.quantity || 0), col3, yPos, { align: "center" });
    doc.text(`Rs. ${(item.price || 0).toFixed(2)}`, col4, yPos, { align: "right" });
    doc.text(`Rs. ${(item.total || 0).toFixed(2)}`, col5, yPos, { align: "right" });
  });

  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // === TOTALS SECTION (simple + aligned) ===
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  const labelX = pageWidth - 70; // left edge of labels
  const valueX = pageWidth - margin; // right-aligned numbers

  // Subtotal
  doc.text("Subtotal:", labelX, yPos);
  doc.text(`Rs. ${(invoiceData.subtotal || 0).toFixed(2)}`, valueX, yPos, { align: "right" });

  // Discount (only if applied)
  if ((invoiceData.discount || 0) > 0) {
    yPos += 7;
    doc.text("Discount:", labelX, yPos);
    doc.text(`Rs. ${(invoiceData.discount || 0).toFixed(2)}`, valueX, yPos, { align: "right" });
  }

  // Total
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Total:", labelX, yPos);
  doc.text(`Rs. ${(invoiceData.totalAmount || 0).toFixed(2)}`, valueX, yPos, { align: "right" });

  // Paid To Date
  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text("Paid To Date:", labelX, yPos);
  doc.text(`Rs. ${(invoiceData.paidAmount || 0).toFixed(2)}`, valueX, yPos, { align: "right" });

  // Balance Due
  const balanceDue = (invoiceData.totalAmount || 0) - (invoiceData.paidAmount || 0);
  yPos += 7;
  doc.setFont("helvetica", balanceDue > 0 ? "bold" : "normal");
  doc.text("Balance Due:", labelX, yPos);
  doc.text(`Rs. ${Math.max(0, balanceDue).toFixed(2)}`, valueX, yPos, { align: "right" });

  // === FOOTER SECTION ===
  const footerY = pageHeight - 25;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you & Please Visit Again ", pageWidth / 2, footerY + 6, { align: "center" });
  
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("This is a computer-generated invoice.", pageWidth / 2, footerY + 11, { align: "center" });

  // Save PDF
  const invoicesDir = path.join("invoices");
  if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

  const filePath = path.join(invoicesDir, `${invoiceData.invoiceNo}.pdf`);
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(filePath, pdfBuffer);

  return filePath;
};
