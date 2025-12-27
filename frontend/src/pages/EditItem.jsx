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
        sku: item.sku || '',
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
    setShouldNavigate(true);

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
      </div>
    </Layout>
  );
};

export default EditItem;