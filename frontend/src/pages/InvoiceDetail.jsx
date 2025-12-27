import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoiceById, reset, clearInvoice } from '../redux/slices/posSlice';
import Layout from '../components/Layout';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoice, isLoading, isError, message } = useSelector((state) => state.pos);

  useEffect(() => {
    dispatch(getInvoiceById(id));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !invoice) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))]"></div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{message}</p>
          </div>
          <button
            onClick={() => navigate('/pos/invoices')}
            className="mt-4 text-indigo-600 dark:text-[rgb(var(--color-primary))] hover:text-indigo-700 dark:hover:text-[rgb(var(--color-primary-hover))]"
          >
            Back to Invoices
          </button>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header - Hidden on print */}
        <div className="mb-8 print:hidden">
          <button
            onClick={() => navigate('/pos/invoices')}
            className="flex items-center text-gray-600 dark:text-[rgb(var(--color-text-secondary))] hover:text-gray-900 dark:hover:text-[rgb(var(--color-text))] mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoices
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-2">Invoice Details</h1>
              <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">View and print invoice</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => {
                  dispatch(clearInvoice());
                  dispatch(reset());
                  navigate('/pos');
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Done - Return to POS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-8 print:shadow-none">
          {/* Invoice Header */}
          <div className="border-b dark:border-[rgb(var(--color-border))] pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-indigo-600 mb-2">INVOICE</h2>
                <div className="text-lg font-semibold text-gray-900">{invoice.invoiceNo}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Invoice Date</div>
                <div className="font-medium text-gray-900">
                  {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {new Date(invoice.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info & Status */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
              {invoice.customer ? (
                <div>
                  <div className="font-bold text-gray-900 text-lg">{invoice.customer.name}</div>
                  <div className="text-gray-600 mt-1">{invoice.customer.phone}</div>
                  {invoice.customer.email && (
                    <div className="text-gray-600">{invoice.customer.email}</div>
                  )}
                  {invoice.customer.address && (
                    <div className="text-gray-600 mt-1">{invoice.customer.address}</div>
                  )}
                </div>
              ) : (
                <div className="text-gray-600">Walk-in Customer</div>
              )}
            </div>

            <div className="text-right">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Payment Status</h3>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(invoice.paymentStatus)}`}>
                {invoice.paymentStatus.toUpperCase()}
              </span>
              <div className="mt-4">
                <div className="text-sm text-gray-600">Payment Method</div>
                <div className="font-medium text-gray-900 capitalize">{invoice.paymentMethod}</div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">#</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Item</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">Price</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 px-2 text-gray-600">{index + 1}</td>
                    <td className="py-3 px-2 text-gray-900">{item.name || 'Item'}</td>
                    <td className="py-3 px-2 text-right text-gray-900">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-gray-900">₹{item.price.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-medium text-gray-900">
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
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-₹{invoice.discount.toFixed(2)}</span>
                </div>
              )}
              {invoice.previousDueAmount > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Previous Due Added:</span>
                  <span className="font-medium text-amber-600">+₹{invoice.previousDueAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-b-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-indigo-600">
                  ₹{invoice.totalAmount.toFixed(2)}
                </span>
              </div>
              {invoice.creditApplied > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Credit Applied:</span>
                  <span className="font-medium text-green-600">-₹{invoice.creditApplied.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Paid Amount:</span>
                <span className="font-medium text-green-600">₹{invoice.paidAmount.toFixed(2)}</span>
              </div>
              {(() => {
                const effectivePayment = invoice.paidAmount + (invoice.creditApplied || 0);
                const balanceDue = invoice.totalAmount - effectivePayment;
                
                if (balanceDue > 0) {
                  return (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 font-medium">Balance Due:</span>
                      <span className="font-bold text-red-600">
                        ₹{balanceDue.toFixed(2)}
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 font-medium">Paid in Full</span>
                      <span className="font-bold text-green-600">✓</span>
                    </div>
                  );
                }
              })()}
              {invoice.customer && invoice.customer.dues !== undefined && (
                <div className={`flex justify-between py-2 mt-2 pt-2 border-t ${invoice.customer.dues < 0 ? 'bg-green-50' : invoice.customer.dues > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <span className="text-sm font-medium text-gray-700">
                    {invoice.customer.dues < 0 ? 'Available Credit Balance:' : invoice.customer.dues > 0 ? 'Customer Outstanding Due:' : 'Account Balance:'}
                  </span>
                  <span className={`text-sm font-bold ${invoice.customer.dues < 0 ? 'text-green-700' : invoice.customer.dues > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                    ₹{Math.abs(invoice.customer.dues).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-gray-500 text-sm">
            <p>Thank you for your business!</p>
            <p className="mt-2">This is a computer-generated invoice.</p>
          </div>
        </div>

        {/* Additional Info - Hidden on print */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border dark:border-blue-800 rounded-lg p-4 print:hidden">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-blue-900 dark:text-blue-400 font-medium mb-1">Invoice Information</h4>
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                Created on {new Date(invoice.createdAt).toLocaleString('en-IN')}
              </p>
              {invoice.customer && (
                <p className="text-blue-800 dark:text-blue-300 text-sm mt-1">
                  Customer: {invoice.customer.name} ({invoice.customer.phone})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default InvoiceDetail;