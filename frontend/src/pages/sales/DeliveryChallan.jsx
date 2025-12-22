import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import CustomerSelectionModal from '../../components/CustomerSelectionModal';

const DeliveryChallan = () => {
    const navigate = useNavigate();
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [formData, setFormData] = useState({
        challanNo: 'DC-' + Date.now(),
        challanDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        customer: null,
        items: [{ name: '', quantity: 1, unit: 'pcs', description: '' }],
        vehicleNo: '',
        driverName: '',
        transportMode: 'road',
        notes: ''
    });

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: '', quantity: 1, unit: 'pcs', description: '' }]
        });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    return (
        <Layout>
            <PageHeader
                title="Delivery Challan"
                description="Create delivery notes for goods dispatch"
                actions={[
                    <button key="invoice" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Convert to Invoice
                    </button>,
                    <button key="save" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Save Challan
                    </button>,
                    <button key="print" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        Print
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Challan Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Challan Number" value={formData.challanNo} onChange={(e) => setFormData({ ...formData, challanNo: e.target.value })} required />
                            <FormInput label="Challan Date" type="date" value={formData.challanDate} onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })} required />
                            <FormInput label="Delivery Date" type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Customer</h2>
                            {/* Add Customer button removed */}
                        </div>
                        {formData.customer ? (
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{formData.customer.name}</p>
                                        <p className="text-sm text-gray-600">{formData.customer.phone}</p>
                                        <p className="text-sm text-gray-600">{formData.customer.email}</p>
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
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition flex flex-col items-center justify-center gap-2"
                            >
                                <span className="font-medium">Click to select customer</span>
                                <span className="text-sm text-gray-400">Search by name, phone or email</span>
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Items</h2>
                            <button onClick={addItem} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Add Item</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <input type="text" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Item name" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <select value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} className="w-24 px-2 py-1 border rounded">
                                                    <option value="pcs">Pcs</option>
                                                    <option value="kg">Kg</option>
                                                    <option value="ltr">Ltr</option>
                                                    <option value="box">Box</option>
                                                    <option value="mtr">Mtr</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Description" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Transport Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Transport Mode</label>
                                <select value={formData.transportMode} onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                    <option value="road">Road</option>
                                    <option value="rail">Rail</option>
                                    <option value="air">Air</option>
                                    <option value="ship">Ship</option>
                                    <option value="courier">Courier</option>
                                </select>
                            </div>
                            <FormInput label="Vehicle Number" value={formData.vehicleNo} onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })} placeholder="e.g., MH01AB1234" />
                            <FormInput label="Driver Name" value={formData.driverName} onChange={(e) => setFormData({ ...formData, driverName: e.target.value })} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
                        <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="3" className="w-full px-4 py-2 border rounded-lg" placeholder="Add delivery notes..." />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Summary</h2>
                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <span className="font-medium text-blue-900">Total Items</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">{formData.items.length}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium text-green-900">Total Quantity</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">{formData.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Convert to Invoice</button>
                            <button className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save Challan</button>
                            <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Print Challan</button>
                        </div>
                    </div>
                </div>
            </div>

            <CustomerSelectionModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onSelect={(customer) => setFormData({ ...formData, customer })}
            />
        </Layout >
    );
};

export default DeliveryChallan;
