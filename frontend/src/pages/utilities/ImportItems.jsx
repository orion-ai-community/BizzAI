import { useState } from 'react';
import * as XLSX from 'xlsx';
import Layout from '../../components/Layout';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const ImportItems = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [mappingData, setMappingData] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [showPreview, setShowPreview] = useState(false);
    const [importing, setImporting] = useState(false);
    const [errors, setErrors] = useState([]);

    const validateRow = (row, rowIndex) => {
        const errors = [];
        
        // Check required fields
        if (!row.name || row.name.toString().trim() === '') {
            errors.push('Item name is required');
        }
        if (!row.costPrice || row.costPrice === '') {
            errors.push('Cost price is required');
        } else if (isNaN(row.costPrice) || parseFloat(row.costPrice) <= 0) {
            errors.push('Cost price must be a positive number');
        }
        if (!row.sellingPrice || row.sellingPrice === '') {
            errors.push('Selling price is required');
        } else if (isNaN(row.sellingPrice) || parseFloat(row.sellingPrice) <= 0) {
            errors.push('Selling price must be a positive number');
        }
        
        // Warnings
        if (!row.sku || row.sku.toString().trim() === '') {
            return { status: 'warning', errors: ['SKU is empty'] };
        }
        
        return { status: errors.length === 0 ? 'valid' : 'error', errors };
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setSelectedFile(file);
            const fileData = await file.arrayBuffer();
            const workbook = XLSX.read(fileData, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                toast.error('No data found in the file');
                return;
            }

            // Process and validate rows
            const processedData = data.map((row, index) => {
                const processedRow = {
                    row: index + 1,
                    name: row['Name'] || row['Item Name'] || row['Product Name'] || '',
                    sku: row['SKU'] || row['Product Code'] || '',
                    category: row['Category'] || '',
                    costPrice: row['Cost Price'] || row['Cost'] || '',
                    sellingPrice: row['Selling Price'] || row['Price'] || row['Unit Price'] || '',
                    stock: row['Stock Quantity'] || row['Stock'] || row['Quantity'] || '0',
                    unit: row['Unit'] || '',
                };
                
                const validation = validateRow(processedRow, index);
                processedRow.status = validation.status;
                processedRow.validationErrors = validation.errors;
                
                return processedRow;
            });

            setMappingData(processedData);
            setShowPreview(true);
            toast.success(`Loaded ${data.length} rows from file`);
        } catch (error) {
            console.error('Error reading file:', error);
            toast.error('Error reading file. Please ensure it is a valid Excel or CSV file');
        }
    };

    const handleImport = async () => {
        try {
            setImporting(true);
            const validRows = mappingData.filter(row => row.status === 'valid');
            
            if (validRows.length === 0) {
                toast.error('No valid rows to import');
                return;
            }

            // Prepare data for batch import
            const itemsToImport = validRows.map(row => ({
                name: row.name,
                sku: row.sku || undefined,
                category: row.category || undefined,
                costPrice: parseFloat(row.costPrice),
                sellingPrice: parseFloat(row.sellingPrice),
                stockQty: parseInt(row.stock) || 0,
                unit: row.unit || undefined,
            }));

            // Get token from localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.token) {
                toast.error('Please login to import items');
                return;
            }

            // Send to backend for bulk import
            const response = await axios.post(`${API_URL}/api/inventory/import`, {
                items: itemsToImport
            }, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });

            toast.success(`Successfully imported ${response.data.imported} items`);
            
            // Reset form
            setShowPreview(false);
            setSelectedFile(null);
            setMappingData([]);
            setErrors([]);
        } catch (error) {
            console.error('Import error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to import items';
            toast.error(errorMsg);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setImporting(false);
        }
    };

    const validRows = mappingData.filter(row => row.status === 'valid').length;
    const warningRows = mappingData.filter(row => row.status === 'warning').length;
    const errorRows = mappingData.filter(row => row.status === 'error').length;

    const downloadSampleFile = () => {
        const sampleData = [
            {
                'Name': 'Rice Bag 25kg',
                'SKU': 'RICE-001',
                'Category': 'Grocery',
                'Cost Price': 450,
                'Selling Price': 500,
                'Stock Quantity': 100,
                'Unit': 'Bag'
            },
            {
                'Name': 'Wheat Flour 10kg',
                'SKU': 'WHEAT-001',
                'Category': 'Grocery',
                'Cost Price': 280,
                'Selling Price': 320,
                'Stock Quantity': 150,
                'Unit': 'Kg'
            },
            {
                'Name': 'Sugar 1kg',
                'SKU': 'SUGAR-001',
                'Category': 'Grocery',
                'Cost Price': 45,
                'Selling Price': 50,
                'Stock Quantity': 200,
                'Unit': 'Kg'
            },
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
        XLSX.writeFile(workbook, 'sample_import_items.xlsx');
    };

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-main mb-2">Import Items</h1>
                    <p className="text-muted">Import multiple items from CSV or Excel files</p>
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
                <div className="bg-card rounded-xl shadow-sm p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-main">Upload File</h3>
                        <button
                            type="button"
                            onClick={downloadSampleFile}
                            className="flex items-center space-x-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Download Sample File</span>
                        </button>
                    </div>

                    <div className="border-2 border-dashed border-default rounded-lg p-12 text-center hover:border-indigo-500 transition">
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
                            <p className="text-secondary font-medium mb-2">
                                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-muted text-sm">CSV or Excel files (MAX. 5MB)</p>
                        </label>
                    </div>
                </div>

                {/* Summary Panel */}
                {showPreview && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-secondary text-sm font-medium">Total Rows</p>
                                    <p className="text-3xl font-bold text-primary mt-2">{mappingData.length}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-secondary text-sm font-medium">Valid Rows</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{validRows}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-secondary text-sm font-medium">Warnings</p>
                                    <p className="text-3xl font-bold text-yellow-600 mt-2">{warningRows}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-secondary text-sm font-medium">Invalid Rows</p>
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
                    <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-main mb-4">Column Mapping</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {['Name', 'SKU', 'Category', 'Cost Price', 'Selling Price', 'Stock Quantity'].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-secondary mb-2">
                                        {field} {['Name', 'Cost Price', 'Selling Price'].includes(field) && <span className="text-red-500">*</span>}
                                    </label>
                                    <select 
                                        className="w-full px-4 py-2 border border-default rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        defaultValue={field.toLowerCase().replace(' ', '_')}
                                    >
                                        <option value="">Select column...</option>
                                        <option value={field.toLowerCase().replace(' ', '_')}>{field}</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Preview Table */}
                {showPreview && (
                    <div className="bg-card rounded-xl shadow-sm overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-main">Data Preview</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Row</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">SKU</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Cost Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Selling Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-gray-200">
                                    {mappingData.map((row) => (
                                        <tr key={row.row} className="hover:bg-surface">
                                            <td className="px-6 py-4 text-sm text-main">{row.row}</td>
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
                                            <td className="px-6 py-4 text-sm text-main">{row.name || <span className="text-red-500">Missing</span>}</td>
                                            <td className="px-6 py-4 text-sm text-muted">{row.sku || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-muted">{row.category}</td>
                                            <td className="px-6 py-4 text-sm text-main">₹{row.costPrice}</td>
                                            <td className="px-6 py-4 text-sm text-main">₹{row.sellingPrice}</td>
                                            <td className="px-6 py-4 text-sm text-main">{row.stock}</td>
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
                            {mappingData
                                .filter(row => row.status === 'error')
                                .map(row => (
                                    <li key={row.row}>
                                        <strong>Row {row.row}:</strong>
                                        <ul className="ml-4">
                                            {row.validationErrors?.map((err, idx) => (
                                                <li key={idx}>• {err}</li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}

                {/* API Errors */}
                {errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                        <h3 className="text-red-900 font-semibold mb-3">Import Errors</h3>
                        <ul className="space-y-2 text-sm text-red-800">
                            {errors.map((err, idx) => (
                                <li key={idx}>• {err}</li>
                            ))}
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
                                setErrors([]);
                            }}
                            className="flex-1 px-6 py-3 border border-default text-secondary rounded-lg hover:bg-surface font-medium transition disabled:opacity-50"
                            disabled={importing}
                        >
                            Clear / Reset
                        </button>
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={errorRows > 0 || importing}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {importing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Importing...</span>
                                </>
                            ) : (
                                <span>Import {validRows} Item{validRows !== 1 ? 's' : ''}</span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ImportItems;
