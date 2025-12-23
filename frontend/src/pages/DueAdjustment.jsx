import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    getCustomerById,
    clearCustomer,
    reset as resetCustomer,
} from "../redux/slices/customerSlice";
import {
    createDueAdjustment,
    reset as resetDue,
} from "../redux/slices/dueSlice";
import Layout from "../components/Layout";

const DueAdjustment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { customer, isLoading: customerLoading } = useSelector(
        (state) => state.customers
    );
    const {
        isLoading: dueLoading,
        isError,
        isSuccess,
        message,
    } = useSelector((state) => state.due);

    const [formData, setFormData] = useState({
        adjustmentAmount: "",
        adjustmentMethod: "cash",
        notes: "",
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        dispatch(getCustomerById(id));
        return () => {
            dispatch(clearCustomer());
            dispatch(resetCustomer());
            dispatch(resetDue());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(resetDue());
        }

        if (isSuccess) {
            toast.success("Due adjustment created successfully!");
            dispatch(resetDue());
            navigate(`/customers/${id}`);
        }
    }, [isError, isSuccess, message, dispatch, navigate, id]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.adjustmentAmount || formData.adjustmentAmount <= 0) {
            newErrors.adjustmentAmount = "Adjustment amount must be greater than zero";
        }

        if (
            customer &&
            parseFloat(formData.adjustmentAmount) > parseFloat(customer.dues)
        ) {
            newErrors.adjustmentAmount = `Adjustment amount cannot exceed outstanding due of ₹${customer.dues.toFixed(2)}`;
        }

        if (!formData.adjustmentMethod) {
            newErrors.adjustmentMethod = "Please select an adjustment method";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const adjustmentData = {
            customerId: id,
            adjustmentAmount: parseFloat(formData.adjustmentAmount),
            adjustmentMethod: formData.adjustmentMethod,
            notes: formData.notes,
        };

        dispatch(createDueAdjustment(adjustmentData));
    };

    if (customerLoading && !customer) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))]"></div>
                </div>
            </Layout>
        );
    }

    if (!customer) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                        Customer not found
                    </p>
                    <button
                        onClick={() => navigate("/customers")}
                        className="mt-4 text-indigo-600 dark:text-[rgb(var(--color-primary))] hover:text-indigo-700 dark:hover:text-[rgb(var(--color-primary-hover))]"
                    >
                        Back to Customers
                    </button>
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
                        onClick={() => navigate(`/customers/${id}`)}
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
                        Back to Customer Details
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-2">
                        Adjust Due
                    </h1>
                    <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                        Adjust outstanding due for {customer.name}
                    </p>
                </div>

                {/* Customer Info Card */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-[rgb(var(--color-text))]">
                                {customer.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                                {customer.phone}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                                Outstanding Due
                            </p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                ₹{customer.dues.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Adjustment Form */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Adjustment Amount */}
                        <div className="mb-6">
                            <label
                                htmlFor="adjustmentAmount"
                                className="block text-sm font-medium text-gray-700 dark:text-[rgb(var(--color-text))] mb-2"
                            >
                                Adjustment Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    id="adjustmentAmount"
                                    name="adjustmentAmount"
                                    value={formData.adjustmentAmount}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    max={customer.dues}
                                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent dark:bg-[rgb(var(--color-input))] dark:border-[rgb(var(--color-border))] dark:text-[rgb(var(--color-text))] ${errors.adjustmentAmount
                                            ? "border-red-500"
                                            : "border-gray-300"
                                        }`}
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.adjustmentAmount && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.adjustmentAmount}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                                Maximum: ₹{customer.dues.toFixed(2)}
                            </p>
                        </div>

                        {/* Adjustment Method */}
                        <div className="mb-6">
                            <label
                                htmlFor="adjustmentMethod"
                                className="block text-sm font-medium text-gray-700 dark:text-[rgb(var(--color-text))] mb-2"
                            >
                                Adjustment Method <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="adjustmentMethod"
                                name="adjustmentMethod"
                                value={formData.adjustmentMethod}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent dark:bg-[rgb(var(--color-input))] dark:border-[rgb(var(--color-border))] dark:text-[rgb(var(--color-text))] ${errors.adjustmentMethod ? "border-red-500" : "border-gray-300"
                                    }`}
                            >
                                <option value="cash">Cash</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="credit">Credit</option>
                                <option value="original_payment">Original Payment Method</option>
                            </select>
                            {errors.adjustmentMethod && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.adjustmentMethod}
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label
                                htmlFor="notes"
                                className="block text-sm font-medium text-gray-700 dark:text-[rgb(var(--color-text))] mb-2"
                            >
                                Notes (Optional)
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent dark:bg-[rgb(var(--color-input))] dark:border-[rgb(var(--color-border))] dark:text-[rgb(var(--color-text))]"
                                placeholder="Add any additional notes..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(`/customers/${id}`)}
                                className="flex-1 px-6 py-3 border border-gray-300 dark:border-[rgb(var(--color-border))] text-gray-700 dark:text-[rgb(var(--color-text))] rounded-lg hover:bg-gray-50 dark:hover:bg-[rgb(var(--color-input))] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={dueLoading || customer.dues <= 0}
                                className="flex-1 px-6 py-3 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {dueLoading ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    "Submit Adjustment"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default DueAdjustment;
