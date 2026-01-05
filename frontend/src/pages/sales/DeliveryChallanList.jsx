import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { getAllDeliveryChallans, deleteDeliveryChallan, convertToInvoice, reset } from '../../redux/slices/deliveryChallanSlice';

const DeliveryChallanList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { challans, isLoading, isError, message } = useSelector(state => state.deliveryChallan);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [convertConfirm, setConvertConfirm] = useState(null);

    useEffect(() => {
        dispatch(getAllDeliveryChallans());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }
        return () => {
            dispatch(reset());
        };
    }, [isError, message, dispatch]);

    const handleDelete = async (id) => {
        await dispatch(deleteDeliveryChallan(id));
        setDeleteConfirm(null);
        toast.success('Delivery Challan deleted successfully');
        dispatch(getAllDeliveryChallans());
    };

    const handleConvert = async (id) => {
        const result = await dispatch(convertToInvoice(id));
        setConvertConfirm(null);

        if (result.type.includes('fulfilled')) {
            toast.success('Converted to Invoice successfully!');
            navigate(`/sales/invoice/${result.payload.invoice._id}`);
        }
    };

    const filteredChallans = Array.isArray(challans) ? challans.filter(challan => {
        const matchesSearch = challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (challan.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || challan.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft':
                return 'bg-gray-100 text-gray-800';
            case 'Delivered':
                return 'bg-blue-100 text-blue-800';
            case 'Converted':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Layout>
            <PageHeader
                title="Delivery Challans"
                description="View and manage delivery challans"
                actions={[
                    <button
                        key="create"
                        onClick={() => {
                            dispatch(reset()); // Clear cached state before navigation
                            navigate('/sales/delivery-challan');
                        }}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        + Create Challan
                    </button>
                ]}
            />

            {/* Filters */}
            <div className="bg-card rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="w-full sm:w-96">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by challan number or customer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                            />
                            <svg
                                className="absolute left-3 top-2.5 w-5 h-5 text-muted"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border rounded-lg"
                        >
                            <option value="all">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Converted">Converted</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Challans Table */}
            <div className="bg-card rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : filteredChallans.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            className="w-16 h-16 text-muted mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-secondary text-lg">No delivery challans found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Challan No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredChallans.map((challan) => (
                                    <tr key={challan._id} className="hover:bg-surface">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-indigo-600">{challan.challanNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-main">
                                                {new Date(challan.challanDate).toLocaleDateString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-main">{challan.customer?.name || 'N/A'}</div>
                                            {challan.customer?.phone && (
                                                <div className="text-xs text-secondary">{challan.customer.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-main">{challan.items.length} items</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(challan.status)}`}>
                                                {challan.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/sales/delivery-challan/${challan._id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                View
                                            </button>
                                            {challan.status !== 'Converted' && (
                                                <>
                                                    <button
                                                        onClick={() => setConvertConfirm(challan._id)}
                                                        className="text-green-600 hover:text-green-900 mr-4"
                                                    >
                                                        Convert
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(challan._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-main mb-4">Confirm Delete</h3>
                        <p className="text-secondary mb-6">
                            Are you sure you want to delete this delivery challan? Stock will be restored.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-surface"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                onClick={() => setConvertConfirm(null)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-surface"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleConvert(convertConfirm)}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Convert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default DeliveryChallanList;
