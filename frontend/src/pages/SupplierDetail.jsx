import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, reset } from '../redux/slices/supplierSlice';
import Layout from '../components/Layout';

const SupplierDetail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { supplier, isLoading, isError, message } = useSelector(
    (state) => state.suppliers
  );

  useEffect(() => {
    dispatch(getSupplierById(id));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id]);

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
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gmain mb-2">{supplier.businessName}</h1>
              <p className="text-secondary">{supplier.supplierId}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/suppliers/${supplier._id}/edit`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit Supplier
              </button>
            </div>
          </div>
        </div>

        {/* Supplier Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Basic Information */}
          <div className="bg-card rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-main mb-4">Basic Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted">Business Name</label>
                <p className="text-sm font-medium text-main">{supplier.businessName}</p>
              </div>
              <div>
                <label className="block text-sm text-muted">Contact Person</label>
                <p className="text-sm font-medium text-main">{supplier.contactPersonName}</p>
              </div>
              <div>
                <label className="block text-sm text-muted">Contact Number</label>
                <p className="text-sm font-medium text-main">{supplier.contactNo}</p>
              </div>
              <div>
                <label className="block text-sm text-muted">Email</label>
                <p className="text-sm font-medium text-main">{supplier.email}</p>
              </div>
              <div>
                <label className="block text-sm text-muted">GST Number</label>
                <p className="text-sm font-medium text-main">{supplier.gstNo}</p>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-card rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-main mb-4">Business Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted">Supplier Type</label>
                <p className="text-sm font-medium text-main capitalize">{supplier.supplierType}</p>
              </div>
              <div>
                <label className="block text-sm text-muted">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${supplier.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {supplier.status}
                </span>
              </div>
              <div>
                <label className="block text-sm text-muted">Opening Balance</label>
                <p className="text-sm font-medium text-main">₹{supplier.openingBalance?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm text-muted">Balance Type</label>
                <p className="text-sm font-medium text-main capitalize">{supplier.balanceType}</p>
              </div>
              <div>
                <label className="block text-sm text-muted">Credit Period</label>
                <p className="text-sm font-medium text-main">{supplier.creditPeriod || 0} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-main mb-4">Address</h2>
          <p className="text-secondary">{supplier.physicalAddress}</p>
        </div>

        {/* Items Supplied (Placeholder) */}
        <div className="bg-card rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-main mb-4">Items Supplied</h2>
          {supplier.itemsSupplied && supplier.itemsSupplied.length > 0 ? (
            <div className="text-sm text-secondary">
              {supplier.itemsSupplied.length} item(s) supplied
            </div>
          ) : (
            <p className="text-muted">No items supplied yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SupplierDetail;