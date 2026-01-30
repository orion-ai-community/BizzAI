import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getItemById, updateItem, reset } from '../redux/slices/inventorySlice';
import Layout from '../components/Layout';

const EditItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { item, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.inventory
  );

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    stockQty: '',
    lowStockLimit: '',
    unit: 'pcs',
  });

  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [updateConfirm, setUpdateConfirm] = useState(false);

  const { name, sku, category, costPrice, sellingPrice, stockQty, lowStockLimit, unit } = formData;

  useEffect(() => {
    dispatch(getItemById(id));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        sku: item.barcode || item.sku || '', // Show barcode first, fallback to sku
        category: item.category || '',
        costPrice: item.costPrice || '',
        sellingPrice: item.sellingPrice || '',
        stockQty: item.stockQty || '',
        lowStockLimit: item.lowStockLimit || '',
        unit: item.unit || 'pcs',
      });
    }
  }, [item]);

  useEffect(() => {
    // Only navigate if we explicitly set the flag from this component
    if (shouldNavigate && isSuccess && !isLoading) {
      navigate('/inventory');
      dispatch(reset());
    }
  }, [shouldNavigate, isSuccess, isLoading, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setUpdateConfirm(true); // Show confirmation dialog instead of submitting immediately
  };

  const handleConfirmUpdate = async () => {
    setShouldNavigate(true);
    setUpdateConfirm(false);

    const itemData = {
      ...formData,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      stockQty: parseInt(stockQty) || 0,
      lowStockLimit: parseInt(lowStockLimit) || 5,
    };

    await dispatch(updateItem({ id, itemData }));
  };

  if (isLoading && !item) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center  text-secondary hover: text-main mb-4"
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
            Back to Inventory
          </button>
          <h1 className="text-3xl font-bold  text-main mb-2">Edit Item</h1>
          <p className=" text-secondary">Update product information</p>
        </div>

        {/* Error Message */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{message}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-card rounded-xl shadow-sm p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-semibold  text-main mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Input */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium  text-secondary mb-2"
                  >
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={onChange}
                    required
                    className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Rice Bag 25kg"
                  />
                </div>

                {/* SKU Input */}
                <div>
                  <label
                    htmlFor="sku"
                    className="block text-sm font-medium  text-secondary mb-2"
                  >
                    SKU / Barcode
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={sku}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., RICE-001"
                  />
                </div>

                {/* Category Input */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium  text-secondary mb-2"
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={category}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Grocery"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div>
              <h3 className="text-lg font-semibold  text-main mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cost Price */}
                <div>
                  <label
                    htmlFor="costPrice"
                    className="block text-sm font-medium  text-secondary mb-2"
                  >
                    Cost Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    value={costPrice}
                    onChange={onChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-sm  text-muted">Purchase/Cost price per unit</p>
                </div>

                {/* Selling Price */}
                <div>
                  <label
                    htmlFor="sellingPrice"
                    className="block text-sm font-medium  text-secondary mb-2"
                  >
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="sellingPrice"
                    name="sellingPrice"
                    value={sellingPrice}
                    onChange={onChange}
                    required
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-sm  text-muted">Retail/Selling price per unit</p>
                </div>

                {/* Profit Margin Display */}
                {costPrice && sellingPrice && (
                  <div className="md:col-span-2 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm  text-secondary">
                      <span className="font-medium">Profit Margin:</span>{' '}
                      <span className="text-green-600 font-bold">
                        {((sellingPrice - costPrice) / costPrice * 100).toFixed(1)}%
                      </span>
                      {' '}(₹{(sellingPrice - costPrice).toFixed(2)} profit per unit)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Section */}
            <div>
              <h3 className="text-lg font-semibold  text-main mb-4">Stock Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stock Quantity */}
                <div>
                  <label
                    htmlFor="stockQty"
                    className="block text-sm font-medium  text-secondary mb-2"
                  >
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    id="stockQty"
                    name="stockQty"
                    value={stockQty}
                    onChange={onChange}
                    min="0"
                    className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Low Stock Limit */}
                <div>
                  <label
                    htmlFor="lowStockLimit"
                    className="block text-sm font-medium  text-secondary mb-2"
                  >
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    id="lowStockLimit"
                    name="lowStockLimit"
                    value={lowStockLimit}
                    onChange={onChange}
                    min="0"
                    className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="5"
                  />
                  <p className="mt-1 text-sm  text-muted">Alert when stock falls below this</p>
                </div>

                {/* Unit */}
                <div>
                  <label
                    htmlFor="unit"
                    className="block text-sm font-medium  text-secondary mb-2"
                  >
                    Unit
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={unit}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="l">Liters (l)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="flex-1 px-6 py-3 border border-default  text-secondary rounded-lg hover:bg-surface font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating Item...
                  </span>
                ) : (
                  'Update Item'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Update Confirmation Modal */}
        {updateConfirm && item && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl p-6 max-w-2xl w-full mx-4 border dark:border-[rgb(var(--color-border))] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">Confirm Update</h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-[rgb(var(--color-text-secondary))] mb-4 text-lg">
                  Are you sure you want to update this item?
                </p>

                <div className="bg-gray-50 dark:bg-[rgb(var(--color-surface))] rounded-lg p-5 space-y-4 border dark:border-[rgb(var(--color-border))]">
                  <div className="pb-3 border-b dark:border-[rgb(var(--color-border))]">
                    <p className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">{formData.name}</p>
                    {formData.sku && <p className="text-sm text-gray-500 dark:text-[rgb(var(--color-text-muted))] mt-1">SKU: {formData.sku}</p>}
                    {formData.category && <p className="text-sm text-gray-500 dark:text-[rgb(var(--color-text-muted))]">Category: {formData.category}</p>}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-[rgb(var(--color-text-secondary))] uppercase mb-2">Stock & Unit</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-[rgb(var(--color-card))] p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-[rgb(var(--color-text-muted))]">Stock Quantity</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-1">{formData.stockQty || 0} {formData.unit}</p>
                      </div>
                      <div className="bg-white dark:bg-[rgb(var(--color-card))] p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-[rgb(var(--color-text-muted))]">Low Stock Alert</p>
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">{formData.lowStockLimit || 5} {formData.unit}</p>
                      </div>
                      <div className="bg-white dark:bg-[rgb(var(--color-card))] p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-[rgb(var(--color-text-muted))]">Unit Type</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-1">{formData.unit}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-[rgb(var(--color-text-secondary))] uppercase mb-2">Pricing</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-[rgb(var(--color-card))] p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-[rgb(var(--color-text-muted))]">Cost Price</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-1">₹{parseFloat(formData.costPrice || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-white dark:bg-[rgb(var(--color-card))] p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-[rgb(var(--color-text-muted))]">Selling Price</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mt-1">₹{parseFloat(formData.sellingPrice || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-white dark:bg-[rgb(var(--color-card))] p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-[rgb(var(--color-text-muted))]">Profit Margin</p>
                        <p className={`text-lg font-bold mt-1 ${((parseFloat(formData.sellingPrice || 0) - parseFloat(formData.costPrice || 0)) / parseFloat(formData.costPrice || 1) * 100) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {((parseFloat(formData.sellingPrice || 0) - parseFloat(formData.costPrice || 0)) / parseFloat(formData.costPrice || 1) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button type="button" onClick={() => setUpdateConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-[rgb(var(--color-border))] text-gray-700 dark:text-[rgb(var(--color-text))] bg-white dark:bg-[rgb(var(--color-card))] rounded-lg hover:bg-gray-50 dark:hover:bg-[rgb(var(--color-input))] font-medium transition-colors">Cancel</button>
                <button type="button" onClick={handleConfirmUpdate} disabled={isLoading} className="flex-1 px-4 py-2.5 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))] font-medium transition-colors shadow-sm disabled:opacity-50">
                  {isLoading ? 'Updating...' : 'Yes, Update Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EditItem;