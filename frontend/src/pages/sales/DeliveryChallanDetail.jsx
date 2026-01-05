import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import { getDeliveryChallanById, convertToInvoice, reset } from '../../redux/slices/deliveryChallanSlice';

const DeliveryChallanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { challan, isLoading, isError, message } = useSelector(state => state.deliveryChallan);
    const [convertConfirm, setConvertConfirm] = useState(false);

    useEffect(() => {
        dispatch(getDeliveryChallanById(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
        return () => {
            dispatch(reset());
        };
    }, [isError, message, dispatch]);

    const handlePrint = () => {
        window.print();
    };

    const handleConvert = async () => {
        const result = await dispatch(convertToInvoice(id));
        setConvertConfirm(false);

        if (result.type.includes('fulfilled')) {
            toast.success('Converted to Invoice successfully!');
            navigate(`/sales/invoice/${result.payload.invoice._id}`);
        }
    };

    if (isLoading || !challan) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    const totalQuantity = challan.items.reduce((sum, item) => sum + item.deliveredQty, 0);

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header - Hidden on print */}
                <div className="mb-8 print:hidden">
                    <button
                        onClick={() => navigate('/sales/delivery-challan-list')}
                        className="flex items-center text-secondary hover:text-primary mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Challan List
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-main mb-2">Delivery Challan</h1>
                            <p className="text-secondary font-medium">View and print delivery challan</p>
                        </div>
                        <div className="flex gap-2">
                            {challan.status !== 'Converted' && (
                                <button
                                    className="flex items-center space-x-2 px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                    onClick={() => setConvertConfirm(true)}
                                >
                                    <span>Convert to Invoice</span>
                                </button>
                            )}
                            <button
                                className="flex items-center space-x-2 px-4 py-1 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                                onClick={handlePrint}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span>Print</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Challan Container */}
                <div className="bg-white rounded-lg shadow-lg p-0 print:shadow-none print:p-0">
                    {/* Header Section */}
                    <div className="px-8 py-6 border-b-2 border-gray-300">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <h2 className="text-4xl font-bold text-blue-600 mb-1">DELIVERY CHALLAN</h2>
                                <div className="text-base font-mono font-semibold text-gray-900">
                                    Challan #: {challan.challanNumber}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-xs font-semibold text-gray-800 uppercase mb-1">Challan Date</div>
                                <div className="font-bold text-base text-gray-900">
                                    {new Date(challan.challanDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                                {challan.deliveryDate && (
                                    <>
                                        <div className="text-xs font-semibold text-gray-800 uppercase mb-1 mt-2">Delivery Date</div>
                                        <div className="font-bold text-base text-gray-900">
                                            {new Date(challan.deliveryDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Customer and Status Section */}
                    <div className="grid grid-cols-2 gap-6 px-8 py-6">
                        <div>
                            <h3 className="text-xs font-bold text-gray-900 uppercase mb-3 pb-2 border-b border-gray-300">
                                Delivered To
                            </h3>
                            <div className="space-y-2">
                                <div className="font-bold text-lg text-gray-900">{challan.customer.name}</div>
                                <div className="text-sm text-gray-800 flex items-center">
                                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {challan.customer.phone}
                                </div>
                                {challan.customer.email && (
                                    <div className="text-sm text-gray-900 flex items-center">
                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {challan.customer.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-right">
                            <h3 className="text-xs font-bold text-gray-900 uppercase mb-3 pb-2 border-b border-gray-300">
                                Status
                            </h3>
                            <div className="space-y-2">
                                <div>
                                    <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${challan.status === 'Converted' ? 'bg-green-100 text-green-800' :
                                            challan.status === 'Delivered' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {challan.status}
                                    </span>
                                </div>
                                {challan.convertedToInvoice && (
                                    <div className="text-sm text-gray-600 mt-2">
                                        Converted to Invoice: {challan.convertedToInvoice.invoiceNo}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="px-8 py-6 border-t border-gray-300">
                        <h3 className="text-xs font-bold text-gray-600 uppercase mb-4">Items Delivered</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-gray-300">
                                        <th className="text-left py-2 px-2 font-bold text-gray-900">#</th>
                                        <th className="text-left py-2 px-2 font-bold text-gray-900">Item Name</th>
                                        <th className="text-center py-2 px-2 font-bold text-gray-900">Quantity</th>
                                        <th className="text-center py-2 px-2 font-bold text-gray-900">Unit</th>
                                        <th className="text-left py-2 px-2 font-bold text-gray-900">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {challan.items.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-200">
                                            <td className="py-2 px-2 text-gray-900">{index + 1}</td>
                                            <td className="py-2 px-2 text-gray-900 font-medium">
                                                {item.item?.name || 'N/A'}
                                                {item.item?.sku && <div className="text-xs text-gray-600">{item.item.sku}</div>}
                                            </td>
                                            <td className="py-2 px-2 text-center text-gray-900 font-semibold">{item.deliveredQty}</td>
                                            <td className="py-2 px-2 text-center text-gray-900">{item.unit}</td>
                                            <td className="py-2 px-2 text-gray-900">{item.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Transport Details */}
                    {(challan.vehicleNo || challan.driverName || challan.transportMode) && (
                        <div className="px-8 py-6 border-t border-gray-300">
                            <h3 className="text-xs font-bold text-gray-600 uppercase mb-4">Transport Details</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                {challan.transportMode && (
                                    <div>
                                        <div className="text-gray-600 mb-1">Transport Mode</div>
                                        <div className="font-medium text-gray-900 capitalize">{challan.transportMode}</div>
                                    </div>
                                )}
                                {challan.vehicleNo && (
                                    <div>
                                        <div className="text-gray-600 mb-1">Vehicle Number</div>
                                        <div className="font-medium text-gray-900">{challan.vehicleNo}</div>
                                    </div>
                                )}
                                {challan.driverName && (
                                    <div>
                                        <div className="text-gray-600 mb-1">Driver Name</div>
                                        <div className="font-medium text-gray-900">{challan.driverName}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-center">
                            <div className="w-full md:w-96">
                                <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex justify-between py-2 text-base">
                                        <span className="text-gray-900">Total Items:</span>
                                        <span className="font-bold text-gray-900">{challan.items.length}</span>
                                    </div>
                                    <div className="flex justify-between py-2 text-base border-t border-gray-200">
                                        <span className="text-gray-900">Total Quantity:</span>
                                        <span className="font-bold text-gray-900">{totalQuantity}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {challan.notes && (
                        <div className="px-8 py-6 border-t border-gray-300">
                            <h3 className="text-xs font-bold text-gray-600 uppercase mb-3 pb-2 border-b border-gray-300">
                                Notes
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">{challan.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-gray-300 text-center">
                        <p className="text-sm text-gray-900 font-medium">Thank you for your business!</p>
                        <p className="text-xs text-gray-500 mt-2">This is a computer-generated delivery challan.</p>
                        {challan.createdAt && (
                            <p className="text-xs text-gray-500 mt-2">
                                Created on {new Date(challan.createdAt).toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Convert Confirmation Modal */}
            {convertConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-main mb-4">Convert to Invoice</h3>
                        <p className="text-secondary mb-6">
                            Are you sure you want to convert this challan to an invoice? This action cannot be undone.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setConvertConfirm(false)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-surface"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConvert}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Convert
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                }
            `}</style>
        </Layout>
    );
};

export default DeliveryChallanDetail;
