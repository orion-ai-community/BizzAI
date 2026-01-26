import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import CustomerSelectionModal from '../../components/CustomerSelectionModal';
import ItemSelectionModal from '../../components/ItemSelectionModal';
import SalesOrderSelectionModal from '../../components/SalesOrderSelectionModal';
import { createDeliveryChallan, reset } from '../../redux/slices/deliveryChallanSlice';

const DeliveryChallan = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoading, isSuccess, isError, message, challan } = useSelector(state => state.deliveryChallan);

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showSalesOrderModal, setShowSalesOrderModal] = useState(false);
    const [formData, setFormData] = useState({
        challanNo: 'DC-' + Date.now(),
        challanDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        customer: null,
        salesOrder: null,
        items: [],
        vehicleNo: '',
        driverName: '',
        transportMode: 'road',
        notes: ''
    });

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }

        if (isSuccess && challan) {
            toast.success('Delivery Challan created successfully!');

            // Reset Redux state BEFORE navigation
            dispatch(reset());

            // Reset form state
            setFormData({
                challanNo: 'DC-' + Date.now(),
                challanDate: new Date().toISOString().split('T')[0],
                deliveryDate: '',
                customer: null,
                salesOrder: null,
                items: [],
                vehicleNo: '',
                driverName: '',
                transportMode: 'road',
                notes: ''
            });

            // Navigate to detail page
            navigate(`/sales/delivery-challan/${challan._id}`);
        }
    }, [isError, isSuccess, message, challan, navigate, dispatch]);

    const handleSalesOrderSelect = (order) => {
        // Auto-populate customer and items from sales order
        const orderItems = order.items.map(item => ({
            item: item.item._id || item.item,
            name: item.item.name || 'Unknown',
            sku: item.item.sku || '',
            quantity: item.quantity,
            deliveredQty: item.quantity - (item.deliveredQty || 0), // Remaining quantity
            unit: item.item.unit || 'pcs',
            description: '',
            availableStock: item.item.stock || 0,
            sellingPrice: item.rate
        }));

        setFormData({
            ...formData,
            customer: order.customer,
            salesOrder: order._id,
            items: orderItems,
            deliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : ''
        });

        toast.success(`Loaded ${orderItems.length} items from Sales Order ${order.orderNumber}`);
    };

    const handleItemSelect = (item) => {
        const newItem = {
            item: item._id,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            deliveredQty: item.quantity,
            unit: item.unit || 'pcs',
            description: '',
            availableStock: item.stockQty - (item.reservedStock || 0),
            sellingPrice: item.sellingPrice
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Validate deliveredQty doesn't exceed available stock
        if (field === 'deliveredQty') {
            const maxQty = newItems[index].availableStock;
            if (value > maxQty) {
                toast.warning(`Cannot deliver more than available stock (${maxQty})`);
                newItems[index][field] = maxQty;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSave = () => {
        // Validation
        if (!formData.customer) {
            toast.error('Please select a customer');
            return;
        }

        if (formData.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        // Check all items have deliveredQty > 0
        const invalidItems = formData.items.filter(item => !item.deliveredQty || item.deliveredQty <= 0);
        if (invalidItems.length > 0) {
            toast.error('All items must have a delivered quantity greater than 0');
            return;
        }

        // Prepare data for API
        const challanData = {
            customerId: formData.customer._id,
            challanDate: formData.challanDate,
            deliveryDate: formData.deliveryDate || undefined,
            salesOrderId: formData.salesOrder || undefined,
            items: formData.items.map(item => ({
                item: item.item,
                quantity: item.quantity,
                deliveredQty: item.deliveredQty,
                unit: item.unit,
                description: item.description
            })),
            vehicleNo: formData.vehicleNo,
            driverName: formData.driverName,
            transportMode: formData.transportMode,
            notes: formData.notes
        };

        dispatch(createDeliveryChallan(challanData));
    };

    const totalItems = formData.items.length;
    const totalQuantity = formData.items.reduce((sum, item) => sum + (item.deliveredQty || 0), 0);

    return (
        <Layout>
            <PageHeader
                title="Delivery Challan"
                description="Create delivery notes for goods dispatch"
                actions={[
                    <button
                        key="list"
                        onClick={() => navigate('/sales/delivery-challan-list')}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        View All Delivery Challans
                    </button>,
                    <button
                        key="save"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Challan'}
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Challan Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Challan Number"
                                value={formData.challanNo}
                                onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })}
                                required
                                disabled
                            />
                            <FormInput
                                label="Challan Date"
                                type="date"
                                value={formData.challanDate}
                                onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })}
                                required
                            />
                            <FormInput
                                label="Delivery Date"
                                type="date"
                                value={formData.deliveryDate}
                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-main">Customer</h2>
                            {!formData.customer && (
                                <button
                                    onClick={() => setShowSalesOrderModal(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Select from Sales Order
                                </button>
                            )}
                        </div>
                        {formData.customer ? (
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-main">{formData.customer.name}</p>
                                        <p className="text-sm text-secondary">{formData.customer.phone}</p>
                                        {formData.customer.email && (
                                            <p className="text-sm text-secondary">{formData.customer.email}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, customer: null })}
                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCustomerModal(true)}
                                className="w-full px-4 py-3 border-2 border-dashed border-default rounded-lg text-secondary hover:border-indigo-500 hover:text-indigo-600 transition flex flex-col items-center justify-center gap-2"
                            >
                                <span className="font-medium">Click to select customer</span>
                                <span className="text-sm text-muted">Search by name, phone or email</span>
                            </button>
                        )}
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-main">Items</h2>
                            <button
                                onClick={() => setShowItemModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                + Add Item
                            </button>
                        </div>
                        {formData.items.length === 0 ? (
                            <div className="text-center py-8 text-secondary">
                                No items added. Click "Add Item" to select from inventory.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Item</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Available</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Delivered Qty</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Unit</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Description</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {formData.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="font-medium text-main">{item.name}</div>
                                                        {item.sku && <div className="text-xs text-muted">{item.sku}</div>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-secondary">{item.availableStock}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={item.deliveredQty}
                                                        onChange={(e) => updateItem(index, 'deliveredQty', parseFloat(e.target.value) || 0)}
                                                        className="w-24 px-2 py-1 border rounded"
                                                        min="0"
                                                        max={item.availableStock}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-secondary">{item.unit}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                        className="w-full px-2 py-1 border rounded"
                                                        placeholder="Optional"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Transport Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Transport Mode</label>
                                <select
                                    value={formData.transportMode}
                                    onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    <option value="road">Road</option>
                                    <option value="rail">Rail</option>
                                    <option value="air">Air</option>
                                    <option value="ship">Ship</option>
                                    <option value="courier">Courier</option>
                                </select>
                            </div>
                            <FormInput
                                label="Vehicle Number"
                                value={formData.vehicleNo}
                                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                                placeholder="e.g., MH01AB1234"
                            />
                            <FormInput
                                label="Driver Name"
                                value={formData.driverName}
                                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-card rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-main mb-4">Notes</h2>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Add delivery notes..."
                        />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-main mb-4">Delivery Summary</h2>
                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <span className="font-medium text-blue-900 dark:text-blue-300">Total Items</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium text-green-900 dark:text-green-300">Total Quantity</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">{totalQuantity}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Challan'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CustomerSelectionModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(customer) => {
                    setFormData({ ...formData, customer });
                    setShowCustomerModal(false);
                }}
            />

            <ItemSelectionModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                onSelect={handleItemSelect}
            />

            <SalesOrderSelectionModal
                isOpen={showSalesOrderModal}
                onClose={() => setShowSalesOrderModal(false)}
                onSelect={handleSalesOrderSelect}
            />
        </Layout>
    );
};

export default DeliveryChallan;
