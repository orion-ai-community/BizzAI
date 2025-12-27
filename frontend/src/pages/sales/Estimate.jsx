import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllItems } from "../../redux/slices/inventorySlice";
import { getAllCustomers } from "../../redux/slices/customerSlice";
import Layout from "../../components/Layout";
import axios from "axios";
import { toast } from "react-toastify";
import EstimateTemplate from "../../components/EstimateTemplate";

const Estimate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.inventory);
  const { customers } = useSelector((state) => state.customers);

  // State
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllItems());
    dispatch(getAllCustomers());
  }, [dispatch]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      c.phone.includes(customerSearchTerm)
  );

  // Cart management (READ-ONLY for inventory)
  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.itemId === item._id);

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.itemId === item._id
            ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
              total: (cartItem.quantity + 1) * cartItem.price,
            }
            : cartItem
        )
      );
    } else {
      setCart([
        ...cart,
        {
          itemId: item._id,
          name: item.name,
          quantity: 1,
          price: item.sellingPrice,
          total: item.sellingPrice,
        },
      ]);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(
      cart.map((cartItem) =>
        cartItem.itemId === itemId
          ? {
            ...cartItem,
            quantity: newQuantity,
            total: newQuantity * cartItem.price,
          }
          : cartItem
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((cartItem) => cartItem.itemId !== itemId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  const selectCustomer = (c) => {
    setCustomer(c);
    setShowCustomerSelect(false);
    setCustomerSearchTerm("");
  };

  const handleSaveEstimate = async () => {
    if (!customer) {
      toast.warning(
        "Please select a registered customer to save the estimate."
      );
      setShowCustomerSelect(true);
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    setIsLoading(true);

    try {
      // Get token from Redux state (same pattern as other slices)
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        toast.error("Please login again");
        return;
      }

      const estimateData = {
        customerId: customer?._id || null,
        items: cart,
        subtotal: calculateSubtotal(),
        discount,
        totalAmount: calculateTotal(),
        notes,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/estimates`,
        estimateData,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      toast.success("Estimate created successfully!");

      // Navigate to estimate detail page
      navigate(`/sales/estimate/${response.data.estimate._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create estimate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (cart.length > 0 && confirm("Clear cart?")) {
      setCart([]);
      setDiscount(0);
    }
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  const getPreviewData = () => ({
    estimateNo: "PREVIEW",
    createdAt: new Date(),
    customer: customer,
    items: cart,
    subtotal: subtotal,
    discount: discount,
    totalAmount: total,
    notes: notes,
    status: "Draft",
  });

  // 2. Handle Print Preview
  const handlePrintPreview = () => {
    if (cart.length === 0) {
      toast.error("Add items to cart before printing");
      return;
    }
    window.print();
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="print:hidden">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-maindark:text-[rgb(var(--color-text))] mb-2">
                Create Estimate / Proforma
              </h1>
              <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                Price approximation for customers
              </p>
            </div>
            <button
              onClick={() => navigate("/sales/estimates")}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <svg
                className="w-5 h-5"
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
              <span>View Estimates</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Products */}
            <div className="lg:col-span-2 space-y-4">
              {/* Customer Selection */}
              <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-[rgb(var(--color-text-secondary))] mb-2">
                  Customer
                </label>

                {customer ? (
                  <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div>
                      <div className="font-medium text-maindark:text-[rgb(var(--color-text))]">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                        {customer.phone}
                      </div>
                    </div>
                    <button
                      onClick={() => setCustomer(null)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
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
                ) : (
                  <button
                    onClick={() => setShowCustomerSelect(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-[rgb(var(--color-border))] rounded-lg text-gray-600 dark:text-[rgb(var(--color-text-secondary))] hover:border-indigo-500 hover:text-indigo-600 transition"
                  >
                    Walk-in Customer (Click to select)
                  </button>
                )}
              </div>

              {/* Product Search */}
              <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-4">
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-maindark:text-[rgb(var(--color-text))] rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-muted dark:text-[rgb(var(--color-text-muted))]"
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

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {filteredItems.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => addToCart(item)}
                      className="p-4 border-2 border-default rounded-lg text-left transition hover:border-indigo-500 hover:shadow-md"
                    >
                      <div className="font-medium text-maindark:text-[rgb(var(--color-text))] mb-1 truncate">
                        {item.name}
                      </div>
                      <div className="text-lg font-bold text-indigo-600 dark:text-[rgb(var(--color-primary))]">
                        ₹{item.sellingPrice}
                      </div>
                      <div className="text-xs text-muted dark:text-[rgb(var(--color-text-secondary))] mt-1">
                        Stock: {item.stockQty} {item.unit}
                      </div>
                      {item.sku && (
                        <div className="text-xs text-muted dark:text-[rgb(var(--color-text-muted))] mt-1">
                          SKU: {item.sku}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Cart & Total */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6 sticky top-4">
                <h2 className="text-xl font-bold text-maindark:text-[rgb(var(--color-text))] mb-4">
                  Estimate Cart
                </h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-muted dark:text-[rgb(var(--color-text-secondary))] text-center py-8">
                      Cart is empty
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[rgb(var(--color-input))] rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-maindark:text-[rgb(var(--color-text))] text-sm">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted dark:text-[rgb(var(--color-text-secondary))]">
                            ₹{item.price} each
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.itemId, item.quantity - 1)
                            }
                            className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium text-maindark:text-[rgb(var(--color-text))]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.itemId, item.quantity + 1)
                            }
                            className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.itemId)}
                            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800"
                          >
                            <svg
                              className="w-5 h-5"
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
                        <div className="ml-3 font-bold text-maindark:text-[rgb(var(--color-text))] w-20 text-right">
                          ₹{item.total.toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Discount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[rgb(var(--color-text-secondary))] mb-2">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-maindark:text-[rgb(var(--color-text))] rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-[rgb(var(--color-text-secondary))] mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-maindark:text-[rgb(var(--color-text))] rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Totals */}
                <div className="border-t border-default dark:border-[rgb(var(--color-border))] pt-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                      Subtotal:
                    </span>
                    <span className="font-medium text-maindark:text-[rgb(var(--color-text))]">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                      Discount:
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -₹{discount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-default dark:border-[rgb(var(--color-border))] pt-2">
                    <span className="text-maindark:text-[rgb(var(--color-text))]">
                      Estimated Total:
                    </span>
                    <span className="text-indigo-600 dark:text-[rgb(var(--color-primary))]">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handlePrintPreview}
                    disabled={cart.length === 0}
                    className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print Preview
                  </button>
                  <button
                    onClick={handleSaveEstimate}
                    disabled={isLoading || cart.length === 0 || !customer}
                    className="w-full py-3 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Saving..." : "Save Estimate"}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={cart.length === 0}
                    className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Selection Modal */}
          {showCustomerSelect && (
            <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-2xl border dark:border-[rgb(var(--color-border))] max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-default dark:border-[rgb(var(--color-border))]">
                  <h3 className="text-xl font-bold text-maindark:text-[rgb(var(--color-text))]">
                    Select Customer
                  </h3>
                  <button
                    onClick={() => setShowCustomerSelect(false)}
                    className="text-muted dark:text-[rgb(var(--color-text-muted))] hover:text-gray-600 dark:hover:text-[rgb(var(--color-text))]"
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

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-maindark:text-[rgb(var(--color-text))] rounded-lg mb-4 focus:ring-2 focus:ring-primary dark:focus:ring-[rgb(var(--color-primary))]"
                  />

                  <div className="space-y-2">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => selectCustomer(c)}
                        className="w-full p-4 border border-default dark:border-[rgb(var(--color-border))] rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition"
                      >
                        <div className="font-medium text-maindark:text-[rgb(var(--color-text))]">
                          {c.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                          {c.phone}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-50">
        <EstimateTemplate estimate={getPreviewData()} />
      </div>
      <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print\\:block, .print\\:block * { visibility: visible; }
                    .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
    </Layout>
  );
};

export default Estimate;
