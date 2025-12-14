import { useState } from 'react';
import Layout from '../../components/Layout';

const ImportItems = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [mappingData, setMappingData] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [showPreview, setShowPreview] = useState(false);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Simulate file preview data
            setMappingData([
                { row: 1, name: 'Rice Bag 25kg', sku: 'RICE-001', category: 'Grocery', costPrice: '450', sellingPrice: '500', stock: '100', status: 'valid' },
                { row: 2, name: 'Wheat Flour 10kg', sku: 'WHEAT-001', category: 'Grocery', costPrice: '280', sellingPrice: '320', stock: '150', status: 'valid' },
                { row: 3, name: 'Sugar 1kg', sku: '', category: 'Grocery', costPrice: '45', sellingPrice: '50', stock: '200', status: 'warning' },
                { row: 4, name: '', sku: 'INVALID', category: 'Grocery', costPrice: '-10', sellingPrice: '50', stock: '50', status: 'error' },
            ]);
            setShowPreview(true);
        }
    };

    const validRows = mappingData.filter(row => row.status === 'valid').length;
    const warningRows = mappingData.filter(row => row.status === 'warning').length;
    const errorRows = mappingData.filter(row => row.status === 'error').length;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Items</h1>
                    <p className="text-gray-600">Import multiple items from CSV or Excel files</p>
                </div>

                {/* Instructions Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start">
                        <div className="p-2 bg-blue-100 rounded-lg mr-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-blue-900 font-semibold mb-2">How to Format Your File</h3>
                            <ul className="text-blue-800 text-sm space-y-1">
                                <li>• Include headers: Name, SKU, Category, Cost Price, Selling Price, Stock Quantity, Unit</li>
                                <li>• Use CSV or Excel (.xlsx) format</li>
                                <li>• Ensure all required fields (Name, Cost Price, Selling Price) are filled</li>
                                <li>• Prices should be numeric values without currency symbols</li>
                                <li>• Download our sample file below for reference</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* File Upload Section */}
                <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
                        <button
                            type="button"
                            className="flex items-center space-x-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Download Sample File</span>
                        </button>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-500 transition">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="text-gray-700 font-medium mb-2">
                                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-gray-500 text-sm">CSV or Excel files (MAX. 5MB)</p>
                        </label>
                    </div>
                </div>

                {/* Summary Panel */}
                {showPreview && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Total Rows</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{mappingData.length}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Valid Rows</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{validRows}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Warnings</p>
                                    <p className="text-3xl font-bold text-yellow-600 mt-2">{warningRows}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Invalid Rows</p>
                                    <p className="text-3xl font-bold text-red-600 mt-2">{errorRows}</p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-lg">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Column Mapping */}
                {showPreview && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Column Mapping</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {['Name', 'SKU', 'Category', 'Cost Price', 'Selling Price', 'Stock Quantity'].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {field} {['Name', 'Cost Price', 'Selling Price'].includes(field) && <span className="text-red-500">*</span>}
                                    </label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                        <option value="">Select column...</option>
                                        <option value={field.toLowerCase().replace(' ', '_')} selected>{field}</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Preview Table */}
                {showPreview && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {mappingData.map((row) => (
                                        <tr key={row.row} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{row.row}</td>
                                            <td className="px-6 py-4">
                                                {row.status === 'valid' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center w-fit">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Valid
                                                    </span>
                                                )}
                                                {row.status === 'warning' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded flex items-center w-fit">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                                        </svg>
                                                        Warning
                                                    </span>
                                                )}
                                                {row.status === 'error' && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded flex items-center w-fit">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{row.name || <span className="text-red-500">Missing</span>}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{row.sku || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{row.category}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">₹{row.costPrice}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">₹{row.sellingPrice}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{row.stock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Error List */}
                {showPreview && errorRows > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                        <h3 className="text-red-900 font-semibold mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Validation Errors
                        </h3>
                        <ul className="space-y-2 text-sm text-red-800">
                            <li>• Row 4: Item name is required</li>
                            <li>• Row 4: Cost price must be greater than 0</li>
                        </ul>
                    </div>
                )}

                {/* Action Buttons */}
                {showPreview && (
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowPreview(false);
                                setSelectedFile(null);
                                setMappingData([]);
                            }}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                        >
                            Clear / Reset
                        </button>
                        <button
                            type="button"
                            disabled={errorRows > 0}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Import {validRows} Items
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ImportItems;
