import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import FormInput from "../../components/FormInput";

const Return = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [searchInvoice, setSearchInvoice] = useState("");

  // Load draft from localStorage on mount
  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem("returnDraft");
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (error) {
        console.error("Error loading return draft:", error);
      }
    }
    return {
      selectedInvoice: null,
      customer: null,
      items: [],
      refundMethod: "",
      notes: "",
    };
  });

  // Get token from user object in localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Save draft to localStorage whenever formData changes
  useEffect(() => {
    if (formData.selectedInvoice || formData.items.length > 0) {
      localStorage.setItem("returnDraft", JSON.stringify(formData));
    }
  }, [formData]);

  // Fetch invoices when modal opens
  useEffect(() => {
    if (showInvoiceModal) {
      fetchInvoices();
    }
  }, [showInvoiceModal]);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pos/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert("Failed to fetch invoices");
    }
  };

  const handleInvoiceSelect = async (invoice) => {
    try {
      // Fetch full invoice details with populated items
      const response = await axios.get(
        `${API_URL}/api/pos/invoice/${invoice._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const fullInvoice = response.data;

      // Fetch existing returns for this invoice
      let existingReturns = [];
      try {
        const returnsResponse = await axios.get(`${API_URL}/api/returns`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        existingReturns = returnsResponse.data.filter(
          (ret) => ret.invoice._id === invoice._id
        );
      } catch (error) {
        console.error("Error fetching existing returns:", error);
      }

      // Calculate already returned quantities per product
      const returnedQuantities = {};
      existingReturns.forEach((returnRecord) => {
        returnRecord.items.forEach((item) => {
          const productId = item.product;
          if (!returnedQuantities[productId]) {
            returnedQuantities[productId] = 0;
          }
          returnedQuantities[productId] += item.returnedQty;
        });
      });

      // Populate items with return fields and remaining quantities
      const returnItems = fullInvoice.items
        .map((item) => {
          // Handle both populated and non-populated item references
          const itemData = item.item;
          const itemName =
            typeof itemData === "object" ? itemData.name : "Item";
          const itemId = typeof itemData === "object" ? itemData._id : itemData;

          const alreadyReturned = returnedQuantities[itemId] || 0;
          const remainingQty = item.quantity - alreadyReturned;

          return {
            productId: itemId,
            productName: itemName,
            originalQty: item.quantity,
            alreadyReturned: alreadyReturned,
            remainingQty: remainingQty,
            returnedQty: Math.min(remainingQty, item.quantity), // Default to remaining quantity
            rate: item.price,
            taxPercent: 0,
            condition: "not_damaged",
            reason: "",
          };
        })
        .filter((item) => item.remainingQty > 0); // Only show items that can still be returned

      if (returnItems.length === 0) {
        alert("All items from this invoice have already been returned.");
        return;
      }

      setFormData({
        selectedInvoice: fullInvoice,
        customer: fullInvoice.customer,
        items: returnItems,
        refundMethod: "", // User must select
        notes: "",
      });

      setShowInvoiceModal(false);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      alert("Failed to fetch invoice details");
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + item.returnedQty * item.rate;
    }, 0);
  };

  const calculateTax = () => {
    return formData.items.reduce((sum, item) => {
      const lineSubtotal = item.returnedQty * item.rate;
      return sum + (lineSubtotal * item.taxPercent) / 100;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const validateForm = () => {
    if (!formData.selectedInvoice) {
      alert("Please select an invoice");
      return false;
    }

    const itemsWithQty = formData.items.filter((item) => item.returnedQty > 0);
    if (itemsWithQty.length === 0) {
      alert("Please add at least one item with quantity greater than 0");
      return false;
    }

    for (const item of itemsWithQty) {
      if (item.returnedQty > item.remainingQty) {
        alert(
          `Return quantity for ${
            item.productName
          } cannot exceed remaining quantity (${
            item.remainingQty
          }). Already returned: ${item.alreadyReturned || 0}`
        );
        return false;
      }

      if (!item.condition) {
        alert(`Please select condition for ${item.productName}`);
        return false;
      }

      if (!item.reason) {
        alert(`Please select reason for ${item.productName}`);
        return false;
      }
    }

    // Validate refund method is selected
    if (!formData.refundMethod) {
      alert("Please select a refund method before completing the return");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const itemsToReturn = formData.items.filter(
        (item) => item.returnedQty > 0
      );

      const returnData = {
        invoiceId: formData.selectedInvoice._id,
        items: itemsToReturn,
        refundMethod: formData.refundMethod,
        discountAmount: 0,
        notes: formData.notes,
      };

      const response = await axios.post(`${API_URL}/api/returns`, returnData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear draft from localStorage on successful completion
      localStorage.removeItem("returnDraft");

      alert("Items returned successfully!");
      navigate("/sales/returned-items");
    } catch (error) {
      console.error("Error creating return:", error);
      alert(error.response?.data?.message || "Failed to create return");
    } finally {
      setLoading(false);
    }
  };

  // Function to clear draft
  const clearDraft = () => {
    if (confirm("Are you sure you want to clear this return draft?")) {
      localStorage.removeItem("returnDraft");
      setFormData({
        selectedInvoice: null,
        customer: null,
        items: [],
        refundMethod: "",
        notes: "",
      });
    }
  };

  // Separate reasons based on condition
  const damagedReasons = [
    "Damaged Product",
    "Quality Issue",
    "Expired Product",
    "Defective Item",
    "Other",
  ];

  const notDamagedReasons = [
    "Wrong Item",
    "Customer Changed Mind",
    "Duplicate Order",
    "No Longer Needed",
    "Other",
  ];

  // Get appropriate reasons based on condition
  const getReasonsForCondition = (condition) => {
    return condition === "damaged" ? damagedReasons : notDamagedReasons;
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      (inv.customer?.name || "")
        .toLowerCase()
        .includes(searchInvoice.toLowerCase())
  );

  return (
    <Layout>
      <PageHeader
        title="Return"
        description="Process customer returns and issue credits"
        actions={[
          formData.selectedInvoice && (
            <button
              key="clear"
              onClick={clearDraft}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Draft
            </button>
          ),
          <button
            key="save"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Save Return"}
          </button>,
        ].filter(Boolean)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Select Invoice
            </h2>
            {formData.selectedInvoice ? (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Invoice: {formData.selectedInvoice.invoiceNo}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date:{" "}
                      {new Date(
                        formData.selectedInvoice.createdAt
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Amount: ₹{formData.selectedInvoice.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFormData({
                        selectedInvoice: null,
                        customer: null,
                        items: [],
                        refundMethod: "credit",
                        notes: "",
                      })
                    }
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
              >
                Click to select invoice
              </button>
            )}
          </div>

          {/* Customer Info */}
          {formData.customer && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Customer</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">
                  {formData.customer.name}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.customer.phone}
                </p>
                {formData.customer.email && (
                  <p className="text-sm text-gray-600">
                    {formData.customer.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Return Items */}
          {formData.items.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Return Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Original Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Already Returned
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Remaining
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Return Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Condition
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.originalQty}
                        </td>
                        <td className="px-4 py-3 text-orange-600 font-medium">
                          {item.alreadyReturned || 0}
                        </td>
                        <td className="px-4 py-3 text-green-600 font-medium">
                          {item.remainingQty}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.returnedQty}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "returnedQty",
                                Math.min(
                                  parseFloat(e.target.value) || 0,
                                  item.remainingQty
                                )
                              )
                            }
                            className="w-20 px-2 py-1 border rounded"
                            min="0"
                            max={item.remainingQty}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          ₹{item.rate.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.condition}
                            onChange={(e) => {
                              const newCondition = e.target.value;
                              updateItem(index, "condition", newCondition);
                              // Clear reason when condition changes to prevent invalid combinations
                              updateItem(index, "reason", "");
                            }}
                            className="w-32 px-2 py-1 border rounded"
                          >
                            <option value="not_damaged">Not Damaged</option>
                            <option value="damaged">Damaged</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.reason}
                            onChange={(e) =>
                              updateItem(index, "reason", e.target.value)
                            }
                            className="w-40 px-2 py-1 border rounded"
                          >
                            <option value="">Select reason</option>
                            {getReasonsForCondition(item.condition).map(
                              (reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              )
                            )}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Refund Details */}
          {formData.items.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Refund Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Method <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["credit", "cash", "bank", "original_payment"].map(
                      (method) => (
                        <button
                          key={method}
                          onClick={() =>
                            setFormData({ ...formData, refundMethod: method })
                          }
                          className={`p-3 border-2 rounded-lg transition ${
                            formData.refundMethod === method
                              ? "border-indigo-600 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {method.replace("_", " ")}
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows="3"
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Add notes about the return..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Return Summary
            </h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  ₹{calculateSubtotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">
                  ₹{calculateTax().toFixed(2)}
                </span>
              </div>
            </div>
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Refund Amount:</span>
                <span className="text-2xl font-bold text-red-600">
                  ₹{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> This amount will be credited to the
                customer's account or refunded via the selected method.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
              >
                {loading ? "Processing..." : "Save Return"}
              </button>
              <button
                onClick={() => navigate("/sales/returned-items")}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                View Returned Items
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Selection Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Select Invoice
                </h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                placeholder="Search by invoice number or customer name..."
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="overflow-y-auto max-h-96 p-6">
              {filteredInvoices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No invoices found
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredInvoices.map((invoice) => (
                    <div
                      key={invoice._id}
                      onClick={() => handleInvoiceSelect(invoice)}
                      className="p-4 border rounded-lg hover:bg-indigo-50 hover:border-indigo-500 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {invoice.invoiceNo}
                          </p>
                          <p className="text-sm text-gray-600">
                            {invoice.customer?.name || "Walk-in Customer"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(invoice.createdAt).toLocaleDateString(
                              "en-IN"
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₹{invoice.totalAmount.toFixed(2)}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              invoice.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : invoice.paymentStatus === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {invoice.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Return;
