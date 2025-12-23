const EstimateTemplate = ({ estimate }) => {
  return (
    <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-8 print:shadow-none">
      {/* Estimate Header */}
      <div className="border-b dark:border-[rgb(var(--color-border))] pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-indigo-600 dark:text-[rgb(var(--color-primary))] mb-2">
              ESTIMATE
            </h2>
            <div className="text-lg font-semibold text-gray-900 dark:text-[rgb(var(--color-text))]">
              {estimate.estimateNo}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-[rgb(var(--color-text-secondary))] mb-1">
              Estimate Date
            </div>
            <div className="font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">
              {new Date(estimate.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase mb-2">
            Estimate For
          </h3>
          {estimate.customer ? (
            <div>
              <div className="font-bold text-gray-900 dark:text-[rgb(var(--color-text))] text-lg">
                {estimate.customer.name}
              </div>
              <div className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] mt-1">
                {estimate.customer.phone}
              </div>
              {estimate.customer.email && (
                <div className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                  {estimate.customer.email}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
              Walk-in Customer
            </div>
          )}
        </div>

        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase mb-2">
            Status
          </h3>
          <span
            className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
              estimate.status === "accepted"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                : estimate.status === "rejected"
                ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                : estimate.status === "sent"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}
          >
            {estimate.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300 dark:border-[rgb(var(--color-border))]">
              <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">
                #
              </th>
              <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">
                Item
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">
                Quantity
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">
                Price
              </th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {estimate.items.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 dark:border-[rgb(var(--color-border))]"
              >
                <td className="py-3 px-2 text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                  {index + 1}
                </td>
                <td className="py-3 px-2 text-gray-900 dark:text-[rgb(var(--color-text))]">
                  {item.name}
                </td>
                <td className="py-3 px-2 text-right text-gray-900 dark:text-[rgb(var(--color-text))]">
                  {item.quantity}
                </td>
                <td className="py-3 px-2 text-right text-gray-900 dark:text-[rgb(var(--color-text))]">
                  ₹{item.price.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">
                  ₹{item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b dark:border-[rgb(var(--color-border))]">
            <span className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
              Subtotal:
            </span>
            <span className="font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">
              ₹{estimate.subtotal.toFixed(2)}
            </span>
          </div>
          {estimate.discount > 0 && (
            <div className="flex justify-between py-2 border-b dark:border-[rgb(var(--color-border))]">
              <span className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                Discount:
              </span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -₹{estimate.discount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between py-3 border-b-2 border-gray-300 dark:border-[rgb(var(--color-border))]">
            <span className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">
              Estimated Total:
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-[rgb(var(--color-primary))]">
              ₹{estimate.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {estimate.notes && (
        <div className="mt-8 pt-6 border-t dark:border-[rgb(var(--color-border))]">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase mb-2">
            Notes
          </h4>
          <p className="text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">
            {estimate.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t dark:border-[rgb(var(--color-border))] text-center text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm">
        <p>This is an estimate and not a final invoice.</p>
        <p className="mt-2">Valid for 30 days from the date of issue.</p>
      </div>
    </div>
  );
};

export default EstimateTemplate;
