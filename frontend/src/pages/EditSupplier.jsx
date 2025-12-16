import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getSupplierById, updateSupplier, reset } from '../redux/slices/supplierSlice';
import Layout from '../components/Layout';

const EditSupplier = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { supplier, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.suppliers
  );

  const [formData, setFormData] = useState({
    businessName: '',
    contactPersonName: '',
    contactNo: '',
    email: '',
    physicalAddress: '',
    gstNo: '',
    supplierType: 'manufacturer',
    openingBalance: 0,
    balanceType: 'payable',
    creditPeriod: 0,
    status: 'active',
  });

  const [shouldNavigate, setShouldNavigate] = useState(false);

  const { businessName, contactPersonName, contactNo, email, physicalAddress, gstNo, supplierType, openingBalance, balanceType, creditPeriod, status } = formData;

  useEffect(() => {
    dispatch(getSupplierById(id));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (supplier) {
      setFormData({
        businessName: supplier.businessName || '',
        contactPersonName: supplier.contactPersonName || '',
        contactNo: supplier.contactNo || '',
        email: supplier.email || '',
        physicalAddress: supplier.physicalAddress || '',
        gstNo: supplier.gstNo || '',
        supplierType: supplier.supplierType || 'manufacturer',
        openingBalance: supplier.openingBalance || 0,
        balanceType: supplier.balanceType || 'payable',
        creditPeriod: supplier.creditPeriod || 0,
        status: supplier.status || 'active',
      });
    }
  }, [supplier]);

  useEffect(() => {
    if (shouldNavigate && isSuccess) {
      navigate('/suppliers');
      dispatch(reset());
    }
  }, [shouldNavigate, isSuccess, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setShouldNavigate(true);
    await dispatch(updateSupplier({ id, supplierData: formData }));
  };

  if (isLoading && !supplier) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
            <p className="text-gray-500 text-lg">Supplier not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/suppliers')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Supplier</h1>
          <p className="text-gray-600">Update supplier information</p>
        </div>

        {/* Error Message */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{message}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Business Name Input */}
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={businessName}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="ABC Suppliers Pvt Ltd"
              />
            </div>

            {/* Contact Person Name Input */}
            <div>
              <label
                htmlFor="contactPersonName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contactPersonName"
                name="contactPersonName"
                value={contactPersonName}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Contact No. Input */}
            <div>
              <label
                htmlFor="contactNo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="contactNo"
                name="contactNo"
                value={contactNo}
                onChange={onChange}
                required
                pattern="[0-9]{10}"
                maxLength={10}
                title="Please enter a valid 10-digit mobile number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+91 9876543210"
              />
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="supplier@example.com"
              />
            </div>

            {/* Physical Address Input */}
            <div>
              <label
                htmlFor="physicalAddress"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Physical Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="physicalAddress"
                name="physicalAddress"
                value={physicalAddress}
                onChange={onChange}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Street address, City, State, PIN"
              />
            </div>

            {/* GST No. Input */}
            <div>
              <label
                htmlFor="gstNo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                GST Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="gstNo"
                name="gstNo"
                value={gstNo}
                onChange={onChange}
                required
                pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                maxLength={15}
                title="Please enter a valid 15-character GST number (e.g., 22AAAAA0000A1Z5)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            {/* Supplier Type Input */}
            <div>
              <label
                htmlFor="supplierType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Supplier Type <span className="text-red-500">*</span>
              </label>
              <select
                id="supplierType"
                name="supplierType"
                value={supplierType}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>

            {/* Opening Balance Input */}
            <div>
              <label
                htmlFor="openingBalance"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Opening Balance
              </label>
              <input
                type="number"
                id="openingBalance"
                name="openingBalance"
                value={openingBalance}
                onChange={onChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Balance Type Input */}
            <div>
              <label
                htmlFor="balanceType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Balance Type
              </label>
              <select
                id="balanceType"
                name="balanceType"
                value={balanceType}
                onChange={onChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="payable">Payable</option>
                <option value="receivable">Receivable</option>
              </select>
            </div>

            {/* Credit Period Input */}
            <div>
              <label
                htmlFor="creditPeriod"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Credit Period (in days)
              </label>
              <input
                type="number"
                id="creditPeriod"
                name="creditPeriod"
                value={creditPeriod}
                onChange={onChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="30"
              />
            </div>

            {/* Status Input */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/suppliers')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
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
                    Updating Supplier...
                  </span>
                ) : (
                  'Update Supplier'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditSupplier;