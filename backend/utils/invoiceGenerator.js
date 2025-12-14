import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

/**
 * Generates PDF invoice and saves it to /invoices folder
 * @param {Object} invoiceData - Invoice object from DB
 * @returns {String} filePath - Generated PDF path
 */
export const generateInvoicePDF = async (invoiceData) => {
  const doc = new PDFDocument({ margin: 40 });
  const invoicesDir = path.join("invoices");
  if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

  const filePath = path.join(invoicesDir, `${invoiceData.invoiceNo}.pdf`);
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Header
  doc.fontSize(20).text("🧾 Grocery Billing Invoice", { align: "center" });
  doc.moveDown(1);

  // Shop Info
  doc.fontSize(12).text(`Invoice No: ${invoiceData.invoiceNo}`);
  doc.text(`Date: ${new Date(invoiceData.createdAt).toLocaleString()}`);
  doc.moveDown(1);

  // Customer Info
  if (invoiceData.customer) {
    doc.text(`Customer: ${invoiceData.customer.name}`);
    doc.text(`Phone: ${invoiceData.customer.phone}`);
    doc.moveDown(1);
  }

  // Table Header
  doc.text("Items:");
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold");
  doc.text("Name", 50).text("Qty", 200).text("Price", 250).text("Total", 320);
  doc.font("Helvetica").moveDown(0.5);

  // Table Rows
  invoiceData.items.forEach((it) => {
    doc
      .text(it.name, 50)
      .text(it.quantity, 200)
      .text(it.price.toFixed(2), 250)
      .text(it.total.toFixed(2), 320);
  });

  doc.moveDown(1);

  // Totals
  doc.text(`Subtotal: ₹${invoiceData.subtotal.toFixed(2)}`);
  doc.text(`Discount: ₹${invoiceData.discount.toFixed(2)}`);
  doc.text(`Total Amount: ₹${invoiceData.totalAmount.toFixed(2)}`);
  doc.text(`Paid: ₹${invoiceData.paidAmount.toFixed(2)}`);
  doc.text(`Status: ${invoiceData.paymentStatus.toUpperCase()}`);
  doc.moveDown(2);

  doc.fontSize(10).text("Thank you for shopping with us!", { align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
};
