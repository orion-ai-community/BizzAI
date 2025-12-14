import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const BarcodeGenerator = () => {
    const [formData, setFormData] = useState({
        itemName: '',
        sku: '',
        price: '',
        barcodeType: 'CODE128',
        quantity: 1,
        paperSize: 'A4',
        includePrice: true,
        includeName: true
    });

    const barcodeTypes = ['CODE128', 'CODE39', 'EAN13', 'UPC', 'QR Code'];
    const paperSizes = ['A4', 'Letter', 'Label 40x20mm', 'Label 50x25mm', 'Label 60x30mm'];

    return (
        <Layout>
            <PageHeader
                title="Barcode Generator"
                description="Generate and print barcodes for your products"
                actions={[
                    <button key="print" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Print Barcodes
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Barcode Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                                <input
                                    type="text"
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="Enter item name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">SKU / Barcode Number</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="Enter SKU"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode Type</label>
                                <select
                                    value={formData.barcodeType}
                                    onChange={(e) => setFormData({ ...formData, barcodeType: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    {barcodeTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                                <select
                                    value={formData.paperSize}
                                    onChange={(e) => setFormData({ ...formData, paperSize: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    {paperSizes.map(size => <option key={size} value={size}>{size}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Print Options</h2>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={formData.includeName}
                                    onChange={(e) => setFormData({ ...formData, includeName: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <span className="text-gray-700">Include Item Name</span>
                            </label>
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={formData.includePrice}
                                    onChange={(e) => setFormData({ ...formData, includePrice: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                                <span className="text-gray-700">Include Price</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Bulk Generate from Items</h2>
                        <p className="text-gray-600 mb-4">Generate barcodes for multiple items at once</p>
                        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            Select Items from Inventory
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Preview</h2>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <div className="mb-4">
                                <div className="inline-block bg-white p-4 border-2 border-gray-200 rounded-lg">
                                    <svg className="w-48 h-24 mx-auto" viewBox="0 0 200 100">
                                        <rect x="10" y="20" width="4" height="60" fill="black" />
                                        <rect x="18" y="20" width="2" height="60" fill="black" />
                                        <rect x="24" y="20" width="6" height="60" fill="black" />
                                        <rect x="34" y="20" width="2" height="60" fill="black" />
                                        <rect x="40" y="20" width="4" height="60" fill="black" />
                                        <rect x="48" y="20" width="2" height="60" fill="black" />
                                        <rect x="54" y="20" width="6" height="60" fill="black" />
                                        <rect x="64" y="20" width="4" height="60" fill="black" />
                                        <rect x="72" y="20" width="2" height="60" fill="black" />
                                        <rect x="78" y="20" width="4" height="60" fill="black" />
                                        <rect x="86" y="20" width="6" height="60" fill="black" />
                                        <rect x="96" y="20" width="2" height="60" fill="black" />
                                        <rect x="102" y="20" width="4" height="60" fill="black" />
                                        <rect x="110" y="20" width="2" height="60" fill="black" />
                                        <rect x="116" y="20" width="6" height="60" fill="black" />
                                        <rect x="126" y="20" width="4" height="60" fill="black" />
                                        <rect x="134" y="20" width="2" height="60" fill="black" />
                                        <rect x="140" y="20" width="4" height="60" fill="black" />
                                        <rect x="148" y="20" width="6" height="60" fill="black" />
                                        <rect x="158" y="20" width="2" height="60" fill="black" />
                                        <rect x="164" y="20" width="4" height="60" fill="black" />
                                        <rect x="172" y="20" width="2" height="60" fill="black" />
                                        <rect x="178" y="20" width="6" height="60" fill="black" />
                                        <text x="100" y="95" textAnchor="middle" fontSize="12" fill="black">{formData.sku || '1234567890'}</text>
                                    </svg>
                                    {formData.includeName && formData.itemName && (
                                        <p className="text-sm font-medium text-gray-900 mt-2">{formData.itemName}</p>
                                    )}
                                    {formData.includePrice && formData.price && (
                                        <p className="text-lg font-bold text-gray-900">₹{formData.price}</p>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">Barcode preview will appear here</p>
                        </div>
                        <div className="mt-6 space-y-3">
                            <button className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                                Generate Barcode
                            </button>
                            <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Download as PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BarcodeGenerator;
