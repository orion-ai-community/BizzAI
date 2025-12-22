import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllInvoices, deleteInvoice, reset } from "../redux/slices/posSlice";
import Layout from "../components/Layout";

const Invoices = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices, isLoading, isError, message } = useSelector(
    (state) => state.pos
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    dispatch(getAllInvoices());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleDelete = async (id) => {
    await dispatch(deleteInvoice(id));
    setDeleteConfirm(null);
    dispatch(getAllInvoices());
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = totalSales - totalPaid;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/pos")}
            className="flex items-center text-gray-600 dark:text-[rgb(var(--color-text-secondary))] hover:text-gray-900 dark:hover:text-[rgb(var(--color-text))] mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to POS
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-2">
            Invoices
          </h1>
          <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
            View and manage all invoices
          </p>
        </div>

        {/* Error Message */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium">
                  Total Invoices
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-2">
                  {invoices.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium">
                  Total Sales
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-2">
                  ₹{totalSales.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium">
                  Amount Collected
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-2">
                  ₹{totalPaid.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm font-medium">
                  Outstanding Dues
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-2">
                  ₹{totalDue.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="w-full sm:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by invoice number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-gray-900 dark:text-[rgb(var(--color-text))] placeholder:text-gray-400 dark:placeholder:text-[rgb(var(--color-placeholder))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-[rgb(var(--color-text-muted))]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-gray-900 dark:text-[rgb(var(--color-text))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))]"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 dark:text-[rgb(var(--color-text-muted))] mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-lg">
                No invoices found
              </p>
              <button
                onClick={() => navigate("/pos")}
                className="mt-4 text-indigo-600 dark:text-[rgb(var(--color-primary))] hover:text-indigo-700 dark:hover:text-[rgb(var(--color-primary-hover))] font-medium"
              >
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[rgb(var(--color-table-header))] border-b border-gray-200 dark:border-[rgb(var(--color-border))]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Invoice No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[rgb(var(--color-table-row))] divide-y divide-gray-200 dark:divide-[rgb(var(--color-border))]">
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice._id}
                      className="hover:bg-gray-50 dark:hover:bg-[rgb(var(--color-input))]"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-indigo-600 dark:text-[rgb(var(--color-primary))]">
                          {invoice.invoiceNo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-[rgb(var(--color-text))]">
                          {new Date(invoice.createdAt).toLocaleDateString(
                            "en-IN"
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                          {new Date(invoice.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-[rgb(var(--color-text))]">
                          {invoice.customer?.name || "Walk-in"}
                        </div>
                        {invoice.customer?.phone && (
                          <div className="text-xs text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                            {invoice.customer.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-[rgb(var(--color-text))]">
                          {invoice.items.length} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">
                          ₹{invoice.totalAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-[rgb(var(--color-text))]">
                          ₹{invoice.paidAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            invoice.paymentStatus
                          )}`}
                        >
                          {invoice.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-[rgb(var(--color-text))] capitalize">
                          {invoice.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            navigate(`/pos/invoice/${invoice._id}`)
                          }
                          className="text-indigo-600 dark:text-[rgb(var(--color-primary))] hover:text-indigo-900 dark:hover:text-[rgb(var(--color-primary-hover))] mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(invoice._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-500"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl p-6 max-w-md w-full mx-4 border dark:border-[rgb(var(--color-border))]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] mb-6">
                Are you sure you want to delete this invoice? This action cannot
                be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] text-gray-700 dark:text-[rgb(var(--color-text))] bg-white dark:bg-[rgb(var(--color-card))] rounded-lg hover:bg-gray-50 dark:hover:bg-[rgb(var(--color-input))]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Invoices;
