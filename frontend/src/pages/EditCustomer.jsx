import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCustomerById,
  updateCustomer,
  reset,
} from "../redux/slices/customerSlice";
import Layout from "../components/Layout";
import "react-toastify/dist/ReactToastify.css";

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customer, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.customers
  );

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [duplicateField, setDuplicateField] = useState(null);

  const { name, phone, email, address } = formData;

  useEffect(() => {
    dispatch(getCustomerById(id));
    return () => {
      dispatch(reset());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
      });
    }
  }, [customer]);

  useEffect(() => {
    // Only navigate if we explicitly set the flag from this component
    if (shouldNavigate && isSuccess && !isLoading) {
      navigate("/customers");
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
    setDuplicateField(null);
    const result = await dispatch(updateCustomer({ id, customerData: formData }));
    if (result.type === 'customers/update/fulfilled') {
      toast.success("Customer updated successfully!");
      setShouldNavigate(true);
    } else if (result.type === 'customers/update/rejected') {
      const errorMsg = result.payload || "Failed to update customer";
      toast.error(errorMsg);
      
      if (errorMsg.toLowerCase().includes('phone')) {
        setDuplicateField('phone');
      } else if (errorMsg.toLowerCase().includes('email')) {
        setDuplicateField('email');
      }
    }
  };

  if (isLoading && !customer) {
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/customers")}
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
            Back to Customers
          </button>
          <h1 className="text-3xl font-bold text-main mb-2">Edit Customer</h1>
          <p className="text-secondary">Update customer information</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-xl shadow-sm p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={onChange}
                required
                className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Phone Input */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                pattern="[0-9]{10}"
                minLength={10}
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  onChange(e);
                  if (duplicateField === 'phone') setDuplicateField(null);
                }}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  duplicateField === 'phone' ? 'border-red-500 border-2' : 'border-default'
                }`}
                placeholder="+91 9876543210"
              />
              {duplicateField === 'phone' && (
                <p className="mt-1 text-sm text-red-600">This phone number already exists</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  onChange(e);
                  if (duplicateField === 'email') setDuplicateField(null);
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  duplicateField === 'email' ? 'border-red-500 border-2' : 'border-default'
                }`}
                placeholder="customer@example.com"
              />
              {duplicateField === 'email' && (
                <p className="mt-1 text-sm text-red-600">This email already exists</p>
              )}
            </div>

            {/* Address Input */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-secondary mb-2"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={address}
                onChange={onChange}
                rows={3}
                className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Street address, City, State, PIN"
              />
            </div>

            {/* Form Actions */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="flex-1 px-6 py-3 border border-default text-secondary rounded-lg hover:bg-surface font-medium transition"
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
                    Updating Customer...
                  </span>
                ) : (
                  "Update Customer"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditCustomer;
