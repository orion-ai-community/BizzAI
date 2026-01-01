import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
            <div className="max-w-4xl mx-auto">
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
                            <p className="text-secondary">View and print payment receipt</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span>Print Receipt</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Receipt Card */}
                <div className="bg-card rounded-xl shadow-sm p-8 print:shadow-none print:bg-white border border-default">
                    {/* Receipt Header */}
                    <div className="border-b-2 border-default pb-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-4xl font-bold text-green-600 dark:text-green-500 mb-2">PAYMENT RECEIPT</h2>
                                <div className="text-lg font-semibold text-main">{payment.receiptNumber}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-semibold text-muted uppercase mb-2">Receipt Date</div>
                                <div className="font-bold text-main text-lg">
                                    {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                                <div className="text-sm text-muted mt-1">
                                    {new Date(payment.paymentDate).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-surface p-4 rounded-lg border border-default">
                            <h3 className="text-sm font-bold text-muted uppercase mb-3 border-b border-default pb-2">Received From</h3>
                            <div>
                                <div className="font-bold text-main text-xl mb-2">{payment.customer.name}</div>
                                <div className="text-secondary mt-1 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {payment.customer.phone}
                                </div>
                                {payment.customer.email && (
                                    <div className="text-secondary mt-1 flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {payment.customer.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-surface p-4 rounded-lg text-right border border-default">
                            <h3 className="text-sm font-bold text-muted uppercase mb-3 border-b border-default pb-2">Payment Summary</h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-secondary block mb-1">Amount Received</span>
                                    <span className="font-bold text-green-600 dark:text-green-400 text-3xl">₹{payment.totalAmount.toFixed(2)}</span>
                                </div>
                                {payment.creditApplied > 0 && (
                                    <div className="mt-3 pt-3 border-t border-default">
                                        <span className="text-xs text-secondary block mb-1">+ Credit Applied</span>
                                        <span className="font-semibold text-orange-600 dark:text-orange-400 text-lg">₹{payment.creditApplied.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-muted uppercase mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Payment Method(s)
                        </h3>
                        <div className="bg-surface rounded-lg p-5 border border-default">
                            <div className="space-y-3">
                                {payment.paymentMethods.map((pm, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-3 px-4 bg-card rounded-lg shadow-sm border border-default">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-primary-soft rounded-full flex items-center justify-center mr-3">
                                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {pm.method === 'cash' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}
                                                    {pm.method === 'card' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}
                                                    {pm.method === 'upi' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />}
                                                    {pm.method === 'cheque' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                                                    {!['cash', 'card', 'upi', 'cheque'].includes(pm.method) && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />}
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="font-bold text-main capitalize text-lg">{pm.method}</span>
                                                {pm.reference && <span className="text-sm text-secondary ml-2">• Ref: {pm.reference}</span>}
                                                {pm.chequeNumber && (
                                                    <div className="text-xs text-secondary mt-1">
                                                        Cheque #{pm.chequeNumber}
                                                        {pm.chequeDate && ` • Date: ${new Date(pm.chequeDate).toLocaleDateString('en-IN')}`}
                                                        {pm.chequeBank && ` • Bank: ${pm.chequeBank}`}
                                                    </div>
                                                )}
                                                {pm.cardType && <span className="text-xs text-secondary ml-2">({pm.cardType})</span>}
                                            </div>
                                        </div>
                                        <span className="font-bold text-primary text-xl">₹{pm.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Allocated Invoices */}
                    {payment.allocatedInvoices && payment.allocatedInvoices.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-sm font-semibold text-muted uppercase mb-3">Payment Allocated To</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-default">
                                            <th className="text-left py-3 px-2 font-semibold text-secondary">#</th>
                                            <th className="text-left py-3 px-2 font-semibold text-secondary">Invoice No</th>
                                            <th className="text-right py-3 px-2 font-semibold text-secondary">Invoice Total</th>
                                            <th className="text-right py-3 px-2 font-semibold text-secondary">Amount Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payment.allocatedInvoices.map((allocation, index) => (
                                            <tr key={index} className="border-b border-default">
                                                <td className="py-3 px-2 text-secondary">{index + 1}</td>
                                                <td className="py-3 px-2 text-main font-medium">
                                                    {allocation.invoice?.invoiceNo || 'N/A'}
                                                </td>
                                                <td className="py-3 px-2 text-right text-main">
                                                    ₹{allocation.invoice?.totalAmount?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-green-600 dark:text-green-500">
                                                    ₹{allocation.allocatedAmount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="flex justify-end mb-8">
                        <div className="w-full md:w-80">
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 text-base border-b border-default md:border-none">
                                    <span className="text-secondary">Total Payment Received:</span>
                                    <span className="font-semibold text-main">₹{payment.totalAmount.toFixed(2)}</span>
                                </div>

                                {payment.creditApplied > 0 && (
                                    <div className="flex justify-between py-2 text-base border-b border-default md:border-none">
                                        <span className="text-secondary">Customer Credit Applied:</span>
                                        <span className="font-semibold text-orange-600">₹{payment.creditApplied.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between py-2 border-t-2 border-default text-base">
                                    <span className="font-medium text-secondary">Effective Payment:</span>
                                    <span className="font-bold text-main">
                                        ₹{(payment.totalAmount + payment.creditApplied).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between py-2 text-base">
                                    <span className="text-secondary">Allocated to Invoices:</span>
                                    <span className="font-semibold text-green-600 dark:text-green-500">
                                        ₹{payment.allocatedInvoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0).toFixed(2)}
                                    </span>
                                </div>

                                {/* Scenario Messages */}
                                {(() => {
                                    const currentDues = payment.customerCurrentDues || 0;
                                    const effectivePayment = payment.totalAmount + payment.creditApplied;
                                    const duesBeforePayment = currentDues + effectivePayment;

                                    // Base styles for scenario boxes
                                    const boxClass = "mt-4 p-4 border-2 rounded-lg";

                                    if (effectivePayment > duesBeforePayment && duesBeforePayment > 0) {
                                        const excessAmount = effectivePayment - duesBeforePayment;
                                        return (
                                            <div className={`${boxClass} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-1">
                                                            <svg className="w-5 h-5 text-green-600 dark:text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="font-bold text-green-800 dark:text-green-400">Excess Amount Added as Credit</span>
                                                        </div>
                                                        <p className="text-xs text-green-700 dark:text-green-500/80 leading-relaxed ml-7">
                                                            Payment exceeds pending dues. Excess amount of ₹{excessAmount.toFixed(2)} credited to customer profile.
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-green-600 dark:text-green-400 text-lg ml-4">+₹{excessAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (Math.abs(effectivePayment - duesBeforePayment) < 0.01 && duesBeforePayment > 0) {
                                        return (
                                            <div className="mt-4 p-4 border-2 rounded-lg bg-white dark:bg-blue-900/20 border-gray-300 dark:border-blue-800/50">
                                                <div className="flex items-start">
                                                    <svg className="w-5 h-5 text-green-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-gray-800 dark:text-blue-400 mb-1">Dues Repaid - All Dues Cleared</div>
                                                        <p className="text-xs text-gray-600 dark:text-blue-500/80 leading-relaxed">
                                                            Payment has cleared all pending dues. Customer account is fully settled.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (effectivePayment < duesBeforePayment && duesBeforePayment > 0) {
                                        const remainingDues = duesBeforePayment - effectivePayment;
                                        return (
                                            <div className={`${boxClass} bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50`}>
                                                <div className="flex items-start">
                                                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-amber-800 dark:text-amber-500 mb-1">Deducted from Pending Dues</div>
                                                        <p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed">
                                                            Remaining balance: ₹{remainingDues.toFixed(2)}. Not credited as advance.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (duesBeforePayment <= 0) {
                                        return (
                                            <div className={`${boxClass} bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-1">
                                                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="font-bold text-purple-800 dark:text-purple-400">Advance Payment</span>
                                                        </div>
                                                        <p className="text-xs text-purple-700 dark:text-purple-500/80 leading-relaxed ml-7">
                                                            No pending dues. ₹{effectivePayment.toFixed(2)} credited for future use.
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-purple-600 dark:text-purple-400 text-lg ml-4">+₹{effectivePayment.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {payment.notes && (
                        <div className="mt-8 p-4 bg-surface rounded-lg border border-default">
                            <h3 className="text-sm font-semibold text-muted uppercase mb-2">Notes</h3>
                            <p className="text-secondary">{payment.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t border-default text-center text-muted text-sm print:text-black">
                        <p>Thank you for your payment!</p>
                        <p className="mt-2">This is a computer-generated receipt.</p>
                    </div>
                </div>

                {/* Additional Info - Hidden on print */}
                <div className="mt-6 bg-surface border border-default rounded-lg p-4 print:hidden">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-primary mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <h4 className="text-main font-medium mb-1">Receipt Information</h4>
                            <p className="text-secondary text-sm">
                                Created on {new Date(payment.createdAt).toLocaleString('en-IN')}
                            </p>
                            <p className="text-secondary text-sm mt-1">
                                Deposited to: {payment.depositAccount === 'cash' ? 'Cash in Hand' : 'Bank Account'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                  body { background: white !important; }
                  nav, aside, button, .print\\:hidden { display: none !important; }
                  .print\\:shadow-none { 
                    box-shadow: none !important; 
                    border: 1px solid #e5e7eb !important;
                    position: static !important;
                  }
                  * { color: black !important; visibility: visible !important; }
                  .bg-card { background: white !important; }
                  .text-main, .text-secondary, .text-muted { color: black !important; }
                }
            `}</style>
        </Layout>
    );
};

export default PaymentReceiptDetail;