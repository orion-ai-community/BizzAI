/**
 * Basic AI-like report generation using data patterns
 * @param {Array} invoices - All invoices from DB
 * @param {Array} items - All items from DB
 * @returns {Object} report
 */
export const generateAIReport = (invoices, items) => {
  const totalSales = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalInvoices = invoices.length;
  const avgBill = totalInvoices ? totalSales / totalInvoices : 0;

  const lowStockItems = items.filter((i) => i.stockQty <= i.lowStockLimit);
  const topSellingItems = findTopSellingItems(invoices);

  return {
    summary: {
      totalSales,
      totalInvoices,
      averageBill: avgBill,
      topSellingItems,
      lowStockItems,
    },
    insight: [
      totalSales > 50000
        ? "Great! High sales volume this week."
        : "Sales are moderate. Try adding offers or discounts.",
      lowStockItems.length > 0
        ? "Restock soon! Some items are below threshold."
        : "Inventory looks healthy.",
      topSellingItems.length > 0
        ? `Your top-selling product is ${topSellingItems[0].name}`
        : "No top-selling data available yet.",
    ],
  };
};

// Helper: find most frequently sold items
const findTopSellingItems = (invoices) => {
  const itemMap = {};
  invoices.forEach((invoice) => {
    invoice.items.forEach((i) => {
      itemMap[i.name] = (itemMap[i.name] || 0) + i.quantity;
    });
  });
  const sorted = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));
  return sorted;
};
