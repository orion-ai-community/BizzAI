import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PaymentReceiptDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPaymentDetail();
    }, [id]);

    const fetchPaymentDetail = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/payment-in/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayment(response.data);
        } catch (error) {
            console.error('Error fetching payment:', error);
            toast.error('Failed to fetch payment details');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading || !payment) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header - Hidden on print */}
                <div className="mb-8 print:hidden">
                    <button
                        onClick={() => navigate('/sales/payment-in-list')}
                        className="flex items-center text-secondary hover:text-primary mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Payment List
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-main mb-2">Payment Receipt</h1>
                            <p className="text-gray-900 dark:text-gray-400 font-medium">View and print payment receipt</p>
                        </div>
                        <button
                            className="flex items-center space-x-2 px-4 py-1 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                            onClick={handlePrint}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Print Receipt</span>
                        </button>
                    </div>
                </div>

                {/* Receipt Container - Optimized for Print */}
                <div className="bg-white rounded-lg shadow-lg p-0 print:shadow-none print:p-0 print:rounded-none">
                    {/* Receipt Header Section */}
                    <div className="px-8 py-6 border-b-2 border-gray-300 print:px-6 print:py-4">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <h2 className="text-4xl font-bold text-green-100 dark:text-green-300 mb-1 print:text-green-700">
                                    PAYMENT RECEIPT
                                </h2>
                                <div className="text-base font-mono font-semibold text-gray-900 dark:text-gray-900 print:text-black">
                                    Receipt #: {payment.receiptNumber}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-xs font-semibold text-gray-800 dark:text-gray-800 print:text-gray-900 uppercase mb-1">
                                    Receipt Date & Time
                                </div>
                                <div className="font-bold text-base text-gray-900 dark:text-gray-900 font-semibold print:text-black">
                                    {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-600 print:text-gray-700">
                                    {new Date(payment.paymentDate).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer and Payment Summary Section */}
                    <div className="grid grid-cols-2 gap-6 px-8 py-6 print:grid-cols-2 print:gap-4 print:px-6 print:py-4">
                        {/* Customer Info */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-900 print:text-gray-900 uppercase mb-3 pb-2 border-b border-gray-300">
                                Received From
                            </h3>
                            <div className="space-y-2">
                                <div className="font-bold text-lg text-gray-900 dark:text-gray-900 print:text-black">
                                    {payment.customer.name}
                                </div>
                                <div className="text-sm text-gray-800 dark:text-gray-800 print:text-gray-900 flex items-center">
                                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {payment.customer.phone}
                                </div>
                                {payment.customer.email && (
                                    <div className="text-sm text-gray-900 dark:text-gray-900 print:text-gray-900 flex items-center">
                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {payment.customer.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="text-right">
                            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-900 print:text-gray-900 uppercase mb-3 pb-2 border-b border-gray-300">
                                Payment Summary
                            </h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs text-gray-900 dark:text-gray-900 print:text-gray-900 mb-1">Amount Received</div>
                                    <div className="font-bold text-2xl text-green-600 dark:text-green-500 print:text-green-700">
                                        ₹{payment.totalAmount.toFixed(2)}
                                    </div>
                                </div>
                                {payment.creditApplied > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <div className="text-xs text-gray-900 dark:text-gray-900 print:text-gray-700 mb-1">+ Credit Applied</div>
                                        <div className="font-semibold text-lg text-orange-600 dark:text-orange-500 print:text-orange-700">
                                            ₹{payment.creditApplied.toFixed(2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods Section */}
                    <div className="px-8 py-6 border-t border-gray-300 print:px-6 print:py-4">
                        <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 print:text-gray-700 uppercase mb-4 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Payment Method(s)
                        </h3>
                        <div className="space-y-2">
                            {payment.paymentMethods.map((pm, idx) => (
                                <div key={idx} className="flex justify-between items-start py-3 px-4 bg-white dark:bg-white print:bg-white print:border print:border-gray-300 rounded border border-gray-200 dark=:border-gray-200">
                                    <div className="flex items-start flex-1">
                                        <div className="w-8 h-8 bg-white dark:bg-white print:bg-white rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 print:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {pm.method === 'cash' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}
                                                {pm.method === 'card' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}
                                                {pm.method === 'upi' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />}
                                                {pm.method === 'cheque' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                                                {!['cash', 'card', 'upi', 'cheque'].includes(pm.method) && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-black dark:text-gray-600 font-bold print:text-black capitalize">
                                                {pm.method}
                                            </div>
                                            {pm.reference && (
                                                <div className="text-xs text-gray-600 dark:text-gray-400 print:text-gray-700 mt-0.5">
                                                    Ref: {pm.reference}
                                                </div>
                                            )}
                                            {pm.chequeNumber && (
                                                <div className="text-xs text-gray-600 dark:text-gray-400 print:text-gray-700 mt-1 space-y-0.5">
                                                    <div>Cheque #{pm.chequeNumber}</div>
                                                    {pm.chequeDate && <div>Date: {new Date(pm.chequeDate).toLocaleDateString('en-IN')}</div>}
                                                    {pm.chequeBank && <div>Bank: {pm.chequeBank}</div>}
                                                </div>
                                            )}
                                            {pm.cardType && (
                                                <div className="text-xs text-gray-600 dark:text-gray-400 print:text-gray-700 mt-0.5">
                                                    {pm.cardType}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-700 text-base ml-4 flex-shrink-0">
                                        ₹{pm.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Allocated Invoices */}
                    {payment.allocatedInvoices && payment.allocatedInvoices.length > 0 && (
                        <div className="px-8 py-6 border-t border-gray-300 print:px-6 print:py-4">
                            <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 print:text-gray-700 uppercase mb-4">
                                Payment Allocated To
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-gray-300">
                                            <th className="text-left py-2 px-2 font-bold text-gray-900 dark:text-gray-900 print:text-black">#</th>
                                            <th className="text-left py-2 px-2 font-bold text-gray-900 dark:text-gray-900 print:text-black">Invoice No</th>
                                            <th className="text-right py-2 px-2 font-bold text-gray-900 dark:text-gray-900 print:text-black">Invoice Total</th>
                                            <th className="text-right py-2 px-2 font-bold text-gray-900 dark:text-gray-900 print:text-black">Amount Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payment.allocatedInvoices.map((allocation, index) => (
                                            <tr key={index} className="border-b border-gray-200 dark:border-gray-700 print:border-gray-300">
                                                <td className="py-2 px-2 text-gray-900 dark:text-gray-900 print:text-gray-900">{index + 1}</td>
                                                <td className="py-2 px-2 text-gray-900 dark:text-gray-900 print:text-black font-medium">
                                                    {allocation.invoice?.invoiceNo || 'N/A'}
                                                </td>
                                                <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-200 print:text-black">
                                                    ₹{allocation.invoice?.totalAmount?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="py-2 px-2 text-right font-bold text-green-100 dark:text-green-100 print:text-green-700">
                                                    ₹{allocation.allocatedAmount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Summary and Status Section */}
                     <div className="px-8 py-6 border-t border-gray-200 bg-white dark:bg-white print:px-6 print:py-4 print:bg-white print:border-gray-300">
                         <div className="flex justify-center">
                              <div className="w-full md:w-144">
                                 <div className="space-y-6 bg-white dark:bg-white print:bg-white p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-200 print:border print:border-gray-300 text-xl">
                                    <div className="flex justify-between py-3 text-base">
                                        <span className="text-gray-900 dark:text-gray-900 print:text-black">Total Payment Received:</span>
                                        <span className="font-bold text-gray-900 dark:text-gray-900 print:text-black">₹{payment.totalAmount.toFixed(2)}</span>
                                    </div>
                                    
                                    {/* <div className="flex justify-between py-2 text-sm">
                                        <span className="text-gray-900 dark:text-gray-900 print:text-black">Allocated to Invoices:</span>
                                        <span className="font-bold text-gray-900 dark:text-gray-200 print:text-black">
                                            ₹{(payment.allocatedInvoices?.reduce((sum, inv) => sum + inv.allocatedAmount, 0) || 0).toFixed(2)}
                                        </span>
                                    </div> */}

                                    {payment.creditApplied > 0 && (
                                        <div className="flex justify-between py-2 text-sm border-b border-gray-200 dark:border-slate-600">
                                            <span className="text-black dark:text-black print:text-black">Customer Credit Applied:</span>
                                            <span className="font-bold text-black dark:text-black print:text-black">₹{payment.creditApplied.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between py-0 text-sm border-t-1 border-gray-200 dark:border-slate-600 pt-2">
                                        <span className="text-black dark:text-black print:text-black">Effective Payment:</span>
                                        <span className="font-bold text-black dark:text-black print:text-black">
                                            ₹{(payment.totalAmount + payment.creditApplied).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between -mt-1 text-sm">
                                        <span className="text-black dark:text-black print:text-black">Allocated to Invoices:</span>
                                        <span className="font-bold text-black dark:text-black print:text-black">
                                            ₹{payment.allocatedInvoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Status Box */}
                                    {(() => {
                                        const currentDues = payment.customerCurrentDues || 0;
                                        const effectivePayment = payment.totalAmount + payment.creditApplied;
                                        const duesBeforePayment = currentDues + effectivePayment;

                                        if (effectivePayment > duesBeforePayment && duesBeforePayment > 0) {
                                            const excessAmount = effectivePayment - duesBeforePayment;
                                            return (
                                                <div className="mt-4 p-3 bg-white dark:bg-white border border-emerald-200 dark:border-emerald-200 print:border-emerald-600 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 print:text-emerald-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-emerald-900 dark:text-emerald-300 print:text-emerald-900 text-sm mb-1">Excess Amount Credited</div>
                                                            <p className="text-xs text-emerald-700 dark:text-emerald-400 print:text-emerald-800 leading-relaxed">
                                                                ₹{excessAmount.toFixed(2)} added to customer credit
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (Math.abs(effectivePayment - duesBeforePayment) < 0.01 && duesBeforePayment > 0) {
                                            return (
                                                <div className="mt-4 p-3 bg-white dark:bg-white border border-teal-200 dark:border-teal-200 print:border-teal-600 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-5 h-5 text-teal-600 dark:text-teal-400 print:text-teal-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-teal-900 dark:text-teal-300 print:text-teal-900 text-sm mb-1">Dues Fully Repaid</div>
                                                            <p className="text-xs text-teal-700 dark:text-teal-400 print:text-teal-800 leading-relaxed">
                                                                All pending dues have been cleared
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (effectivePayment < duesBeforePayment && duesBeforePayment > 0) {
                                            const remainingDues = duesBeforePayment - effectivePayment;
                                            return (
                                                <div className="mt-4 p-3 bg-white border border-amber-200 dark:border-amber-800/50 print:border-amber-600 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 print:text-amber-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-amber-900 dark:text-amber-300 print:text-amber-900 text-sm mb-1">Partial Payment</div>
                                                            <p className="text-xs text-amber-700 dark:text-amber-400 print:text-amber-800 leading-relaxed">
                                                                Remaining balance: ₹{remainingDues.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (duesBeforePayment <= 0) {
                                            return (
                                                <div className="mt-4 p-3 bg-white dark:bg-white border border-indigo-200 dark:border-indigo-200 print:border-indigo-600 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 print:text-indigo-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 3.062v6.018a1 1 0 01-.999 1H3.455a1 1 0 01-.999-1V6.517a3.066 3.066 0 012.812-3.062p" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-indigo-900 dark:text-indigo-300 print:text-indigo-900 text-sm mb-1">Advance Payment</div>
                                                            <p className="text-xs text-indigo-700 dark:text-indigo-400 print:text-indigo-800 leading-relaxed">
                                                                ₹{(payment.totalAmount + payment.creditApplied).toFixed(2)} credited for future invoices
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {payment.notes && (
                        <div className="px-8 py-6 border-t border-gray-300 print:px-6 print:py-4 print:border-gray-300">
                            <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 print:text-gray-700 uppercase mb-3 pb-2 border-b border-gray-300">
                                Notes
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 print:text-gray-800 leading-relaxed">
                                {payment.notes}
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-gray-300 print:px-6 print:py-4 print:border-gray-300 text-center">
                        <p className="text-sm text-gray-900 dark:text-gray-900 print:text-gray-900 font-medium">
                            Thank you for your payment!
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 print:text-gray-700 mt-2">
                            This is a computer-generated receipt.
                        </p>
                        {payment.createdAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 print:text-gray-700 mt-2">
                                Created on {new Date(payment.createdAt).toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Additional Info - Hidden on print */}
                <div className="mt-6 bg-white dark:bg-white border border-gray-200 dark:border-gray-200 rounded-lg p-4 print:hidden">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-800 mb-1">Receipt Information</h4>
                            <p className="text-sm text-gray-700 dark:text-gray-500">
                                Deposited to: {payment.depositAccount === 'cash' ? 'Cash in Hand' : 'Bank Account'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    nav, aside, .print\\:hidden, button:not(.print\\:block) {
                        display: none !important;
                    }
                    
                    .max-w-5xl {
                        max-width: 100% !important;
                    }
                    
                    .bg-white {
                        background: white !important;
                        box-shadow: none !important;
                    }
                    
                    .border-gray-300 {
                        border-color: #d1d5db !important;
                    }
                    
                    .text-green-600,
                    .text-green-700,
                    .dark\\:text-green-500 {
                        color: #16a34a !important;
                    }
                    
                    .text-gray-800,
                    .text-gray-900,
                    .dark\\:text-gray-200,
                    .dark\\:text-gray-300 {
                        color: #000 !important;
                    }
                    
                    .text-gray-600,
                    .text-gray-700 {
                        color: #374151 !important;
                    }
                    
                    table {
                        width: 100% !important;
                    }
                    
                    th, td {
                        border-color: #d1d5db !important;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default PaymentReceiptDetail;