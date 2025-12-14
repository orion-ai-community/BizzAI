import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllItems } from '../redux/slices/inventorySlice';
import { getAllCustomers, addCustomer, reset as resetCustomer } from '../redux/slices/customerSlice';
import { createInvoice, reset, clearInvoice } from '../redux/slices/posSlice';
import Layout from '../components/Layout';

const POS = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.inventory);
  const { customers } = useSelector((state) => state.customers);
  const { invoice, isLoading, isSuccess, isError, message } = useSelector((state) => state.pos);

  // Tab system state - Load from localStorage on mount
  const [tabs, setTabs] = useState(() => {
    const savedTabs = localStorage.getItem('posTabs');
    return savedTabs ? JSON.parse(savedTabs) : [
      {
        id: 1,
        name: 'Tab 1',
        customer: null,
        cart: [],
        discount: 0,
        paymentMethod: 'cash',
        paidAmount: '',
        changeReturned: '',
      }
    ];
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    const savedActiveTab = localStorage.getItem('posActiveTab');
    return savedActiveTab ? parseInt(savedActiveTab) : 1;
  });
  const [nextTabId, setNextTabId] = useState(() => {
    const savedNextId = localStorage.getItem('posNextTabId');
    return savedNextId ? parseInt(savedNextId) : 2;
  });

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showHoldOrders, setShowHoldOrders] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState([
    { method: 'cash', amount: '' },
  ]);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Hold orders state - Load from localStorage
  const [holdOrders, setHoldOrders] = useState(() => {
    const saved = localStorage.getItem('posHoldOrders');
    return saved ? JSON.parse(saved) : [];
  });

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    dispatch(getAllItems());
    dispatch(getAllCustomers());
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && invoice) {
      // Remove completed tab and navigate
      const completedTab = activeTab;
      const newTabs = tabs.filter(tab => tab.id !== activeTabId);

      if (newTabs.length === 0) {
        // If no tabs left, create a fresh tab
        const freshTab = {
          id: nextTabId,
          name: 'Tab 1',
          customer: null,
          cart: [],
          discount: 0,
          paymentMethod: 'cash',
          paidAmount: '',
          changeReturned: '',
        };
        setTabs([freshTab]);
        setActiveTabId(nextTabId);
        setNextTabId(nextTabId + 1);
      } else {
        setTabs(newTabs);
        setActiveTabId(newTabs[0].id);
      }

      // Navigate to invoice detail
      navigate(`/pos/invoice/${invoice._id}`);
      dispatch(clearInvoice());
      dispatch(reset());
    }
  }, [isSuccess, invoice, navigate, dispatch]);

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('posTabs', JSON.stringify(tabs));
    localStorage.setItem('posActiveTab', activeTabId.toString());
    localStorage.setItem('posNextTabId', nextTabId.toString());
  }, [tabs, activeTabId, nextTabId]);

  // Save hold orders to localStorage
  useEffect(() => {
    localStorage.setItem('posHoldOrders', JSON.stringify(holdOrders));
  }, [holdOrders]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm)
  );

  // Barcode scanner handler
  const handleBarcodeInput = (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      const item = items.find(i => i.sku === barcodeInput.trim());
      if (item) {
        addToCart(item);
        setBarcodeInput('');
      } else {
        alert('Product not found with this barcode!');
        setBarcodeInput('');
      }
    }
  };

  // Tab management functions
  const addNewTab = () => {
    const newTab = {
      id: nextTabId,
      name: `Tab ${nextTabId}`,
      customer: null,
      cart: [],
      discount: 0,
      paymentMethod: 'cash',
      paidAmount: '',
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(nextTabId + 1);
  };

  const closeTab = (tabId) => {
    if (tabs.length === 1) return; // Don't close last tab

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const updateTabData = (updates) => {
    setTabs(tabs.map(tab =>
      tab.id === activeTabId ? { ...tab, ...updates } : tab
    ));
  };

  // Cart management
  const addToCart = (item) => {
    const existingItem = activeTab.cart.find((cartItem) => cartItem.item === item._id);

    if (existingItem) {
      if (existingItem.quantity >= item.stockQty) {
        alert(`Only ${item.stockQty} units available in stock!`);
        return;
      }

      updateTabData({
        cart: activeTab.cart.map((cartItem) =>
          cartItem.item === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1, total: (cartItem.quantity + 1) * cartItem.price }
            : cartItem
        )
      });
    } else {
      if (item.stockQty === 0) {
        alert('This item is out of stock!');
        return;
      }

      updateTabData({
        cart: [...activeTab.cart, {
          item: item._id,
          name: item.name,
          quantity: 1,
          price: item.sellingPrice,
          total: item.sellingPrice,
          availableStock: item.stockQty,
        }]
      });
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const cartItem = activeTab.cart.find((item) => item.item === itemId);
    if (cartItem && newQuantity > cartItem.availableStock) {
      alert(`Only ${cartItem.availableStock} units available!`);
      return;
    }

    updateTabData({
      cart: activeTab.cart.map((cartItem) =>
        cartItem.item === itemId
          ? { ...cartItem, quantity: newQuantity, total: newQuantity * cartItem.price }
          : cartItem
      )
    });
  };

  const removeFromCart = (itemId) => {
    updateTabData({
      cart: activeTab.cart.filter((cartItem) => cartItem.item !== itemId)
    });
  };

  const calculateSubtotal = () => {
    return activeTab.cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - activeTab.discount;
  };

  // Customer management
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const result = await dispatch(addCustomer(newCustomer));

    // Only refresh customer list if successful
    if (result.type.includes('fulfilled')) {
      await dispatch(getAllCustomers());
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setShowAddCustomer(false);
      // Immediately reset to prevent other components from reacting
      dispatch(resetCustomer());
    }
  };

  const selectCustomer = (customer) => {
    updateTabData({ customer });
    setShowCustomerSelect(false);
    setCustomerSearchTerm('');
  };

  // Hold Order Management
  const holdCurrentOrder = () => {
    if (activeTab.cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const holdOrder = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...activeTab,
      customerName: activeTab.customer?.name || 'Walk-in',
    };

    setHoldOrders([...holdOrders, holdOrder]);

    // Clear current tab
    updateTabData({
      customer: null,
      cart: [],
      discount: 0,
      paymentMethod: 'cash',
      paidAmount: '',
    });

    alert('Order parked successfully!');
  };

  const retrieveHoldOrder = (holdOrder) => {
    // Create new tab with hold order data
    const newTab = {
      id: nextTabId,
      name: `Tab ${nextTabId}`,
      customer: holdOrder.customer,
      cart: holdOrder.cart,
      discount: holdOrder.discount,
      paymentMethod: holdOrder.paymentMethod,
      paidAmount: holdOrder.paidAmount,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(nextTabId);
    setNextTabId(nextTabId + 1);

    // Remove from hold orders
    setHoldOrders(holdOrders.filter(order => order.id !== holdOrder.id));
    setShowHoldOrders(false);
  };

  const deleteHoldOrder = (orderId) => {
    if (confirm('Delete this parked order?')) {
      setHoldOrders(holdOrders.filter(order => order.id !== orderId));
    }
  };

  // Split Payment Management
  const addSplitPayment = () => {
    setSplitPayments([...splitPayments, { method: 'cash', amount: '' }]);
  };

  const removeSplitPayment = (index) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const updateSplitPayment = (index, field, value) => {
    const updated = [...splitPayments];
    updated[index][field] = value;
    setSplitPayments(updated);
  };

  const calculateSplitTotal = () => {
    return splitPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
  };

  const applySplitPayment = () => {
    const total = calculateSplitTotal();
    updateTabData({
      paidAmount: total.toString(),
      paymentMethod: 'split'
    });
    setShowSplitPayment(false);
  };

  // Print Receipt
  const printReceipt = () => {
    if (activeTab.cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const printWindow = window.open('', '', 'width=300,height=600');
    const receipt = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: monospace; width: 280px; margin: 10px; }
          h2 { text-align: center; margin: 10px 0; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>RECEIPT</h2>
        <div class="line"></div>
        <p>Date: ${new Date().toLocaleString()}</p>
        <p>Customer: ${activeTab.customer?.name || 'Walk-in'}</p>
        <div class="line"></div>
        <table>
          ${activeTab.cart.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="right">${item.quantity} x ₹${item.price}</td>
            </tr>
            <tr>
              <td colspan="2" class="right">₹${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="line"></div>
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="right">₹${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Discount:</td>
            <td class="right">-₹${activeTab.discount.toFixed(2)}</td>
          </tr>
          <tr class="bold">
            <td>Total:</td>
            <td class="right">₹${total.toFixed(2)}</td>
          </tr>
        </table>
        <div class="line"></div>
        <p style="text-align: center;">Thank You!</p>
      </body>
      </html>
    `;
    printWindow.document.write(receipt);
    printWindow.document.close();
    printWindow.print();
  };

  // Checkout
  const handleCheckout = () => {
    if (activeTab.cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const total = calculateTotal();
    const paid = parseFloat(activeTab.paidAmount) || 0;

    if (paid < 0) {
      alert('Invalid payment amount!');
      return;
    }

    // Check if walk-in customer is trying to take due
    if (!activeTab.customer && paid < total) {
      alert('Walk-in customers must pay full amount. Please add customer details to allow credit.');
      return;
    }

    const invoiceData = {
      customerId: activeTab.customer?._id || null,
      items: activeTab.cart.map(({ item, quantity, price, total }) => ({
        item,
        quantity,
        price,
        total,
      })),
      discount: parseFloat(activeTab.discount) || 0,
      paidAmount: paid,
      paymentMethod: activeTab.paymentMethod,
      changeReturned: parseFloat(activeTab.changeReturned) || 0,
    };

    dispatch(createInvoice(invoiceData));
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const paid = parseFloat(activeTab.paidAmount) || 0;
  const balance = paid - total;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Point of Sale</h1>
            <p className="text-gray-600">Multi-tab billing system with advanced features</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHoldOrders(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Hold Orders</span>
              {holdOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {holdOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/pos/invoices')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>View Invoices</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{message}</p>
          </div>
        )}

        {/* Tab System */}
        <div className="mb-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center space-x-1 p-2 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition ${activeTabId === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <button
                  onClick={() => setActiveTabId(tab.id)}
                  className="flex items-center space-x-2"
                >
                  <span className="font-medium">{tab.name}</span>
                  {tab.cart.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTabId === tab.id ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                      {tab.cart.length}
                    </span>
                  )}
                </button>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className={`ml-2 hover:bg-opacity-20 rounded p-1 ${activeTabId === tab.id ? 'hover:bg-white' : 'hover:bg-gray-300'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addNewTab}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
            >
              + New Tab
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Products */}
          <div className="lg:col-span-2 space-y-4">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customer
                </label>
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  + Add New Customer
                </button>
              </div>

              {activeTab.customer ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{activeTab.customer.name}</div>
                    <div className="text-sm text-gray-600">{activeTab.customer.phone}</div>
                  </div>
                  <button
                    onClick={() => updateTabData({ customer: null })}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerSelect(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition"
                >
                  Walk-in Customer (Click to select)
                </button>
              )}
            </div>

            {/* Product Search */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              {/* Barcode Scanner Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode Scanner
                </label>
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={handleBarcodeInput}
                  placeholder="Scan barcode or type SKU and press Enter..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredItems.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => addToCart(item)}
                    disabled={item.stockQty === 0}
                    className={`p-4 border-2 rounded-lg text-left transition ${item.stockQty === 0
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                      : 'border-gray-200 hover:border-indigo-500 hover:shadow-md'
                      }`}
                  >
                    <div className="font-medium text-gray-900 mb-1 truncate">{item.name}</div>
                    <div className="text-lg font-bold text-indigo-600">₹{item.sellingPrice}</div>
                    <div className="text-xs text-gray-500 mt-1">Stock: {item.stockQty} {item.unit}</div>
                    {item.sku && <div className="text-xs text-gray-400 mt-1">SKU: {item.sku}</div>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Cart & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cart</h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {activeTab.cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Cart is empty</p>
                ) : (
                  activeTab.cart.map((item) => (
                    <div key={item.item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">₹{item.price} each</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.item, item.quantity - 1)}
                          className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.item, item.quantity + 1)}
                          className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.item)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="ml-3 font-bold text-gray-900 w-20 text-right">₹{item.total.toFixed(2)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Discount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₹)</label>
                <input
                  type="number"
                  value={activeTab.discount}
                  onChange={(e) => updateTabData({ discount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-₹{activeTab.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-indigo-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={activeTab.paymentMethod}
                  onChange={(e) => updateTabData({ paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  {activeTab.customer && <option value="due">Credit/Due</option>}
                </select>
              </div>

              {/* Paid Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid (₹)</label>
                <input
                  type="number"
                  value={activeTab.paidAmount}
                  onChange={(e) => updateTabData({ paidAmount: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Balance */}
              {activeTab.paidAmount && (
                <div className={`mb-4 p-3 rounded-lg ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">
                      {balance >= 0 ? 'Change to Return:' : 'Balance Due:'}
                    </span>
                    <span className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.abs(balance).toFixed(2)}
                    </span>
                  </div>

                  {/* Change Returned Input - only show if customer paid MORE than total */}
                  {balance > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Change Returned:
                      </label>
                      <input
                        type="number"
                        value={activeTab.changeReturned}
                        onChange={(e) => updateTabData({ changeReturned: e.target.value })}
                        min="0"
                        max={balance}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter change returned to customer"
                      />

                      {/* Remaining Change/Credit */}
                      {activeTab.changeReturned && parseFloat(activeTab.changeReturned) < balance && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-yellow-800 font-medium">
                              {activeTab.customer ? 'Credit Due to Customer:' : 'Remaining Change (unpaid):'}
                            </span>
                            <span className="font-bold text-yellow-900">
                              ₹{(balance - parseFloat(activeTab.changeReturned || 0)).toFixed(2)}
                            </span>
                          </div>
                          {activeTab.customer && (
                            <p className="text-xs text-yellow-700 mt-1">
                              💡 This will be added as credit to customer's account
                            </p>
                          )}
                        </div>
                      )}

                      {/* Full Change Returned Confirmation */}
                      {activeTab.changeReturned && parseFloat(activeTab.changeReturned) === balance && (
                        <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded flex items-center text-sm text-green-800">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Full change returned ✓</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Walk-in Customer Warning */}
              {!activeTab.customer && paid < total && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Walk-in customers must pay full amount. Add customer for credit.
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={activeTab.cart.length === 0 || isLoading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Processing...' : 'Complete Sale'}
              </button>

              {/* Additional Actions */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={holdCurrentOrder}
                  disabled={activeTab.cart.length === 0}
                  className="py-2 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 disabled:opacity-50 text-sm"
                >
                  Hold
                </button>
                <button
                  onClick={() => setShowSplitPayment(true)}
                  disabled={activeTab.cart.length === 0}
                  className="py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50 text-sm"
                >
                  Split Pay
                </button>
                <button
                  onClick={printReceipt}
                  disabled={activeTab.cart.length === 0}
                  className="py-2 border border-gray-600 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  Print
                </button>
              </div>

              {/* Clear Cart */}
              {activeTab.cart.length > 0 && (
                <button
                  onClick={() => updateTabData({ cart: [] })}
                  className="w-full mt-2 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Customer</h3>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex space-x-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCustomer(false);
                      setNewCustomer({ name: '', phone: '', email: '', address: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Select Modal */}
        {showCustomerSelect && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Select Customer</h3>

              {/* Customer Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                {filteredCustomers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No customers found</p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <button
                      key={customer._id}
                      onClick={() => selectCustomer(customer)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-left transition"
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.phone}</div>
                      {customer.dues > 0 && (
                        <div className="text-sm text-red-600 mt-1">Outstanding: ₹{customer.dues.toFixed(2)}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  setShowCustomerSelect(false);
                  setCustomerSearchTerm('');
                }}
                className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Hold Orders Modal */}
        {showHoldOrders && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Parked Orders ({holdOrders.length})
              </h3>

              {holdOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No parked orders</p>
              ) : (
                <div className="space-y-3">
                  {holdOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{order.cart.length} items</div>
                          <div className="font-bold text-indigo-600">
                            ₹{(order.cart.reduce((sum, item) => sum + item.total, 0) - order.discount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => retrieveHoldOrder(order)}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Retrieve
                        </button>
                        <button
                          onClick={() => deleteHoldOrder(order.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowHoldOrders(false)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Split Payment Modal */}
        {showSplitPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Split Payment</h3>
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-indigo-600">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {splitPayments.map((payment, index) => (
                  <div key={index} className="flex space-x-2">
                    <select
                      value={payment.method}
                      onChange={(e) => updateSplitPayment(index, 'method', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                    </select>
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updateSplitPayment(index, 'amount', e.target.value)}
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    {splitPayments.length > 1 && (
                      <button
                        onClick={() => removeSplitPayment(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addSplitPayment}
                className="w-full mb-4 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50"
              >
                + Add Payment Method
              </button>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className={`font-bold ${calculateSplitTotal() >= total ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{calculateSplitTotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance:</span>
                  <span className={`font-bold ${calculateSplitTotal() >= total ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(total - calculateSplitTotal()).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowSplitPayment(false);
                    setSplitPayments([{ method: 'cash', amount: '' }]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applySplitPayment}
                  disabled={calculateSplitTotal() !== total}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default POS;