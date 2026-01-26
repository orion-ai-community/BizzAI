import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, reset } from '../redux/slices/supplierSlice';
import { getAllPurchases } from '../redux/slices/purchaseSlice';
import Layout from '../components/Layout';

const SupplierDetail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { supplier, isLoading, isError, message } = useSelector(
    (state) => state.suppliers
  );
  const { purchases } = useSelector((state) => state.purchase);

  const [supplierPurchases, setSupplierPurchases] = useState([]);
  const [itemsSummary, setItemsSummary] = useState([]);

  useEffect(() => {
    dispatch(getSupplierById(id));
    dispatch(getAllPurchases({ supplier: id }));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id]);

  // Calculate items summary from purchases
  useEffect(() => {
    if (purchases && purchases.length > 0) {
      const filteredPurchases = purchases.filter(p => p.supplier?._id === id && p.status !== 'cancelled');
      setSupplierPurchases(filteredPurchases);

      // Aggregate items with detailed statistics
      const itemsMap = new Map();
      filteredPurchases.forEach(purchase => {
        purchase.items.forEach(item => {
          const itemId = item.item._id || item.item;
          const itemName = item.itemName || item.item.name;

          if (itemsMap.has(itemId)) {
            const existing = itemsMap.get(itemId);
            existing.totalQuantity += item.quantity;
            existing.purchaseCount += 1;
            existing.totalValue += item.quantity * item.purchaseRate;
            existing.rates.push(item.purchaseRate);

            if (new Date(purchase.purchaseDate) > new Date(existing.lastPurchaseDate)) {
              existing.lastPurchaseDate = purchase.purchaseDate;
              existing.lastPurchaseRate = item.purchaseRate;
              existing.lastQuantity = item.quantity;
            }

            if (new Date(purchase.purchaseDate) < new Date(existing.firstPurchaseDate)) {
              existing.firstPurchaseDate = purchase.purchaseDate;
            }
          } else {
            itemsMap.set(itemId, {
              itemId,
              itemName,
              totalQuantity: item.quantity,
              purchaseCount: 1,
              totalValue: item.quantity * item.purchaseRate,
              rates: [item.purchaseRate],
              lastPurchaseDate: purchase.purchaseDate,
              lastPurchaseRate: item.purchaseRate,
              lastQuantity: item.quantity,
              firstPurchaseDate: purchase.purchaseDate,
            });
          }
        });
      });

      // Calculate average rates
      const itemsWithAvg = Array.from(itemsMap.values()).map(item => ({
        ...item,
        avgPurchaseRate: item.totalValue / item.totalQuantity,
      }));

      setItemsSummary(itemsWithAvg);
    }
  }, [purchases, id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/suppliers')}
              className="flex items-center text-secondary hover:text-main mb-4"
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
              Back to Suppliers
            </button>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{message}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!supplier) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/suppliers')}
              className="flex items-center text-secondary hover:text-main mb-4"
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
              Back to Suppliers
            </button>
          </div>
          <div className="text-center py-12">
            <p className="text-secondary text-lg">Supplier not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/suppliers')}
            className="flex items-center text-secondary hover:text-main mb-4"
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
            Back to Suppliers
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-main mb-2">{supplier.businessName}</h1>
              <p className="text-secondary">{supplier.supplierId}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/suppliers/${supplier._id}/edit`)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
              >
                Edit Supplier
              </button>
            </div>
          </div>
        </div>

        {/* Supplier Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Basic Information */}
          <div className="bg-card rounded-xl shadow-sm p-8">
            <h2 className="text-lg font-bold text-main mb-6">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Business Name</label>
                <p className="text-base font-medium text-main">{supplier.businessName}</p>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Contact Person</label>
                <p className="text-base font-medium text-main">{supplier.contactPersonName}</p>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Contact Number</label>
                <p className="text-base font-medium text-main">{supplier.contactNo}</p>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Email</label>
                <p className="text-base font-medium text-main">{supplier.email}</p>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">GST Number</label>
                <p className="text-base font-medium text-main">{supplier.gstNo}</p>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-card rounded-xl shadow-sm p-8">
            <h2 className="text-lg font-bold text-main mb-6">Business Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Supplier Type</label>
                <p className="text-base font-medium text-main capitalize">{supplier.supplierType}</p>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${supplier.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {supplier.status}
                </span>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Opening Balance</label>
                <p className="text-base font-medium text-main">₹{supplier.openingBalance?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Balance Type</label>
                <p className="text-base font-medium text-main capitalize">{supplier.balanceType}</p>
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Credit Period</label>
                <p className="text-base font-medium text-main">{supplier.creditPeriod || 0} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-card rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-lg font-bold text-main mb-4">Address</h2>
          <p className="text-base text-secondary">{supplier.physicalAddress}</p>
        </div>

        {/* Items Supplied */}
        <div className="bg-card rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-main">Items Supplied</h2>
            <div className="text-sm text-secondary">
              {itemsSummary.length} unique item(s) | {supplierPurchases.length} purchase(s)
            </div>
          </div>
          {itemsSummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Purchase Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Total Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Avg Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Last Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      First Purchase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Last Purchase
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {itemsSummary.map((item) => (
                    <tr key={item.itemId} className="hover:bg-surface">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-main">{item.itemName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 rounded-full text-xs font-medium">
                          {item.purchaseCount} {item.purchaseCount === 1 ? 'time' : 'times'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-main">
                        {item.totalQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                        ₹{item.avgPurchaseRate.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-main">
                        ₹{item.lastPurchaseRate.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ₹{item.totalValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                        {new Date(item.firstPurchaseDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                        {new Date(item.lastPurchaseDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface border-t">
                  <tr>
                    <td className="px-6 py-4 font-bold text-main" colSpan="2">
                      Total
                    </td>
                    <td className="px-6 py-4 font-bold text-main">
                      {itemsSummary.reduce((sum, item) => sum + item.totalQuantity, 0)}
                    </td>
                    <td className="px-6 py-4" colSpan="2"></td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      ₹{itemsSummary.reduce((sum, item) => sum + item.totalValue, 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4" colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-muted">No items purchased yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SupplierDetail;