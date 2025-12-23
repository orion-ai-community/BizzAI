import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    getAllCustomers,
    reset,
} from "../redux/slices/customerSlice";
import Layout from "../components/Layout";

const CustomersWithDues = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { customers, isLoading, isError, message } = useSelector(
        (state) => state.customers
    );

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        dispatch(getAllCustomers());
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    // Filter customers with outstanding dues (dues > 0)
    const customersWithDues = customers.filter((c) => c.dues > 0);

    const filteredCustomers = customersWithDues.filter(
        (customer) =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            (customer.email &&
                customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalOutstandingDues = customersWithDues.reduce(
        (sum, c) => sum + c.dues,
        0
    );

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate("/customers")}
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
                        Back to All Customers
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-2">
                        Customers With Outstanding Dues
                    </h1>
                    <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">
                        Manage customers with pending payments
                    </p>
                </div>

                {/* Error Message */}
                {isError && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-4 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[rgb(var(--color-border))] bg-white dark:bg-[rgb(var(--color-input))] text-gray-900 dark:text-[rgb(var(--color-text))] placeholder:text-gray-400 dark:placeholder:text-[rgb(var(--color-placeholder))] rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-[rgb(var(--color-primary))] focus:border-transparent"
                        />
                        <svg
                            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-[rgb(var(--color-text-muted))]"
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
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm font-medium mb-1">
                                Total Outstanding Dues
                            </p>
                            <p className="text-4xl font-bold">
                                ₹{totalOutstandingDues.toFixed(2)}
                            </p>
                            <p className="text-red-100 text-sm mt-2">
                                From {customersWithDues.length} customer
                                {customersWithDues.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div className="p-4 bg-white/20 rounded-lg">
                            <svg
                                className="w-12 h-12"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] overflow-hidden">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))]"></div>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="w-16 h-16 text-gray-400 dark:text-[rgb(var(--color-text-muted))] mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-lg">
                                {searchTerm
                                    ? "No customers found matching your search"
                                    : "No customers with outstanding dues"}
                            </p>
                            <p className="text-gray-400 dark:text-[rgb(var(--color-text-muted))] text-sm mt-2">
                                {!searchTerm && "All customers have cleared their dues!"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-[rgb(var(--color-table-header))] border-b border-gray-200 dark:border-[rgb(var(--color-border))]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Address
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Outstanding Dues
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-[rgb(var(--color-table-row))] divide-y divide-gray-200 dark:divide-[rgb(var(--color-border))]">
                                    {filteredCustomers.map((customer) => (
                                        <tr
                                            key={customer._id}
                                            className="hover:bg-gray-50 dark:hover:bg-[rgb(var(--color-input))]"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] rounded-full flex items-center justify-center">
                                                        <span className="text-white font-bold">
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">
                                                            {customer.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-[rgb(var(--color-text))]">
                                                    {customer.phone}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">
                                                    {customer.email || "No email"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-[rgb(var(--color-text))]">
                                                    {customer.address || "No address"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    ₹{customer.dues.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/customers/${customer._id}`)}
                                                    className="text-indigo-600 dark:text-[rgb(var(--color-primary))] hover:text-indigo-900 dark:hover:text-[rgb(var(--color-primary-hover))] mr-4"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(`/customers/adjust-due/${customer._id}`)
                                                    }
                                                    className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-500"
                                                >
                                                    Adjust Due
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default CustomersWithDues;
