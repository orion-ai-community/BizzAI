import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

const formatPaymentMethodLabel = (method) => {
  switch (method) {
    case "cash":
      return "Cash";
    case "upi":
      return "UPI";
    case "card":
      return "Card";
    case "due":
      return "Due";
    case "split":
      return "Split";
    case "bank_transfer":
      return "Bank Transfer";
    case "cheque":
      return "Cheque";
    case "credit":
      return "Customer Credit";
    default:
      return method || "Cash";
  }
};

const buildPaymentMethodDisplay = (invoiceData) => {
  const credit = invoiceData.creditApplied || 0;
  const paid = invoiceData.paidAmount || 0;
  const splitDetails = invoiceData.splitPaymentDetails || [];
  const paidVia = invoiceData.paidViaMethod || invoiceData.paymentMethod;

  if (credit > 0 && paid === 0) return "Customer Credit";
  
  // If we have split payment details array, use it
  if (splitDetails.length > 1) {
    const methods = splitDetails.map(d => formatPaymentMethodLabel(d.method)).join(" + ");
    if (credit > 0) {
      return `Split (${methods} + Customer Credit)`;
    }
    return `Split (${methods})`;
  }
  
  // Single split detail (shouldn't happen normally, but handle it)
  if (splitDetails.length === 1) {
    const method = formatPaymentMethodLabel(splitDetails[0].method);
    if (credit > 0) {
      return `Split (${method} + Customer Credit)`;
    }
    return method;
  }
  
  // Fallback to paidViaMethod logic (for backward compatibility)
  const primaryMethod = formatPaymentMethodLabel(paidVia);
  if (credit > 0 && paid > 0) return `Split (${primaryMethod} + Customer Credit)`;
  return primaryMethod;
};

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
  const paymentMethodDisplay = buildPaymentMethodDisplay(invoiceData);
  doc.text(paymentMethodDisplay, pageWidth - margin, yPos - 5, { align: "right" });

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

  // Previous Due Added (only if applied)
  if ((invoiceData.previousDueAmount || 0) > 0) {
    yPos += 7;
    doc.text("Previous Due Added:", labelX, yPos);
    doc.text(`Rs. ${(invoiceData.previousDueAmount || 0).toFixed(2)}`, valueX, yPos, { align: "right" });
  }

  // Total
  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Total:", labelX, yPos);
  doc.text(`Rs. ${(invoiceData.totalAmount || 0).toFixed(2)}`, valueX, yPos, { align: "right" });

  // Credit Applied (only if applied)
  if ((invoiceData.creditApplied || 0) > 0) {
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.text("Credit Applied:", labelX, yPos);
    doc.text(`Rs. ${(invoiceData.creditApplied || 0).toFixed(2)}`, valueX, yPos, { align: "right" });
  }

  // Paid Amount
  yPos += 7;
  doc.setFont("helvetica", "normal");
  const paidMethod = invoiceData.paidViaMethod || invoiceData.paymentMethod;
  const paidMethodLabel = invoiceData.paidAmount > 0
    ? `Paid Amount (${formatPaymentMethodLabel(paidMethod)}):`
    : "Paid Amount:";
  doc.text(paidMethodLabel, labelX, yPos);
  doc.text(`Rs. ${(invoiceData.paidAmount || 0).toFixed(2)}`, valueX, yPos, { align: "right" });

  // Payment Breakdown (only if credit was involved)
  const hasCreditPayment = (invoiceData.creditApplied || 0) > 0;
  if (hasCreditPayment) {
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(labelX, yPos, valueX, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Breakdown", labelX, yPos);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    yPos += 6;
    doc.text("Customer Credit:", labelX, yPos);
    doc.text(`Rs. ${(invoiceData.creditApplied || 0).toFixed(2)}`, valueX, yPos, { align: "right" });

    if ((invoiceData.paidAmount || 0) > 0) {
      const splitDetails = invoiceData.splitPaymentDetails || [];
      
      if (splitDetails.length > 0) {
        // Show each split payment method
        splitDetails.forEach(split => {
          yPos += 6;
          doc.text(`${formatPaymentMethodLabel(split.method)}:`, labelX, yPos);
          doc.text(`Rs. ${(split.amount || 0).toFixed(2)}`, valueX, yPos, { align: "right" });
        });
      } else {
        // Fallback for backward compatibility
        const paidMethod = invoiceData.paidViaMethod || invoiceData.paymentMethod;
        yPos += 6;
        doc.text(`${formatPaymentMethodLabel(paidMethod)}:`, labelX, yPos);
        doc.text(`Rs. ${(invoiceData.paidAmount || 0).toFixed(2)}`, valueX, yPos, { align: "right" });
      }
    }
  }



  // Customer Account Balance (if customer exists)
  if (invoiceData.customer && invoiceData.customer.dues !== undefined) {
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(labelX, yPos, valueX, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    if (invoiceData.customer.dues < 0) {
      doc.setTextColor(0, 128, 0); // Green
      doc.text("Available Credit Balance:", labelX, yPos);
      doc.text(`Rs. ${Math.abs(invoiceData.customer.dues).toFixed(2)}`, valueX, yPos, { align: "right" });
    } else if (invoiceData.customer.dues > 0) {
      doc.setTextColor(180, 0, 0); // Red
      doc.text("Customer Outstanding Due:", labelX, yPos);
      doc.text(`Rs. ${invoiceData.customer.dues.toFixed(2)}`, valueX, yPos, { align: "right" });
    } else {
      doc.setTextColor(100, 100, 100); // Gray
      doc.text("Account Balance:", labelX, yPos);
      doc.text("Rs. 0.00", valueX, yPos, { align: "right" });
    }
    
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.setFontSize(10);
  }
  // Balance Due or Paid in Full
  const effectivePayment = (invoiceData.paidAmount || 0) + (invoiceData.creditApplied || 0);
  const balanceDue = (invoiceData.totalAmount || 0) - effectivePayment;
  yPos += 7;
  if (balanceDue > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Balance Due:", labelX, yPos);
    doc.text(`Rs. ${balanceDue.toFixed(2)}`, valueX, yPos, { align: "right" });
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("Paid in Full", labelX, yPos);
  }
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
