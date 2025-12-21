import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';

const EstimateDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [estimate, setEstimate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchEstimate();
    }, [id]);

    const fetchEstimate = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/estimates/${id}`,
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            setEstimate(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch estimate');
            navigate('/sales/estimates');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (isLoading || !estimate) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-[rgb(var(--color-primary))]"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {/* Header - Hidden on print */}
                <div className="mb-8 print:hidden">
                    <button
                        onClick={() => navigate('/sales/estimates')}
                        className="flex items-center text-gray-600 dark:text-[rgb(var(--color-text-secondary))] hover:text-gray-900 dark:hover:text-[rgb(var(--color-text))] mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Estimates
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-2">Estimate Details</h1>
                            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">View and print estimate</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 dark:bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-primary-hover))]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span>Print</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estimate Card */}
                <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-sm dark:shadow-lg border dark:border-[rgb(var(--color-border))] p-8 print:shadow-none">
                    {/* Estimate Header */}
                    <div className="border-b dark:border-[rgb(var(--color-border))] pb-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold text-indigo-600 dark:text-[rgb(var(--color-primary))] mb-2">ESTIMATE</h2>
                                <div className="text-lg font-semibold text-gray-900 dark:text-[rgb(var(--color-text))]">{estimate.estimateNo}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-600 dark:text-[rgb(var(--color-text-secondary))] mb-1">Estimate Date</div>
                                <div className="font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">
                                    {new Date(estimate.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase mb-2">Estimate For</h3>
                            {estimate.customer ? (
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-[rgb(var(--color-text))] text-lg">{estimate.customer.name}</div>
                                    <div className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] mt-1">{estimate.customer.phone}</div>
                                    {estimate.customer.email && (
                                        <div className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">{estimate.customer.email}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">Walk-in Customer</div>
                            )}
                        </div>

                        <div className="text-right">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase mb-2">Status</h3>
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${estimate.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                    estimate.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                                        estimate.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}>
                                {estimate.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-300 dark:border-[rgb(var(--color-border))]">
                                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">#</th>
                                    <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">Item</th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">Quantity</th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">Price</th>
                                    <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estimate.items.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-[rgb(var(--color-border))]">
                                        <td className="py-3 px-2 text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">{index + 1}</td>
                                        <td className="py-3 px-2 text-gray-900 dark:text-[rgb(var(--color-text))]">{item.name}</td>
                                        <td className="py-3 px-2 text-right text-gray-900 dark:text-[rgb(var(--color-text))]">{item.quantity}</td>
                                        <td className="py-3 px-2 text-right text-gray-900 dark:text-[rgb(var(--color-text))]">₹{item.price.toFixed(2)}</td>
                                        <td className="py-3 px-2 text-right font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">
                                            ₹{item.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64">
                            <div className="flex justify-between py-2 border-b dark:border-[rgb(var(--color-border))]">
                                <span className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">Subtotal:</span>
                                <span className="font-medium text-gray-900 dark:text-[rgb(var(--color-text))]">₹{estimate.subtotal.toFixed(2)}</span>
                            </div>
                            {estimate.discount > 0 && (
                                <div className="flex justify-between py-2 border-b dark:border-[rgb(var(--color-border))]">
                                    <span className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))]">Discount:</span>
                                    <span className="font-medium text-red-600 dark:text-red-400">-₹{estimate.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-b-2 border-gray-300 dark:border-[rgb(var(--color-border))]">
                                <span className="text-lg font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">Estimated Total:</span>
                                <span className="text-lg font-bold text-indigo-600 dark:text-[rgb(var(--color-primary))]">
                                    ₹{estimate.totalAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {estimate.notes && (
                        <div className="mt-8 pt-6 border-t dark:border-[rgb(var(--color-border))]">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-[rgb(var(--color-text-secondary))] uppercase mb-2">Notes</h4>
                            <p className="text-gray-700 dark:text-[rgb(var(--color-text-secondary))]">{estimate.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t dark:border-[rgb(var(--color-border))] text-center text-gray-500 dark:text-[rgb(var(--color-text-secondary))] text-sm">
                        <p>This is an estimate and not a final invoice.</p>
                        <p className="mt-2">Valid for 30 days from the date of issue.</p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
        </Layout>
    );
};

export default EstimateDetail;
