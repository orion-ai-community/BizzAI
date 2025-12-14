import { useState } from 'react';
import Layout from '../../components/Layout';

const DataExport = () => {
    const [exportFormat, setExportFormat] = useState('excel');
    const [selectedModules, setSelectedModules] = useState([]);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [settings, setSettings] = useState({
        includeHeaders: true,
        compressFile: false,
        splitByMonth: false,
    });

    const modules = [
        { id: 'items', name: 'Items', icon: '📦', count: 245 },
        { id: 'parties', name: 'Parties', icon: '👥', count: 128 },
        { id: 'sales', name: 'Sales', icon: '💰', count: 1543 },
        { id: 'purchase', name: 'Purchase', icon: '🛒', count: 892 },
        { id: 'expenses', name: 'Expenses', icon: '💸', count: 456 },
        { id: 'ledger', name: 'Ledger', icon: '📊', count: 2341 },
        { id: 'gst', name: 'GST Reports', icon: '📋', count: 234 },
        { id: 'transactions', name: 'Transactions', icon: '💳', count: 3421 },
    ];

    const recentExports = [
        { id: 1, name: 'sales_data_2024.xlsx', format: 'Excel', date: '2024-12-07', size: '2.4 MB' },
        { id: 2, name: 'inventory_report.csv', format: 'CSV', date: '2024-12-06', size: '856 KB' },
        { id: 3, name: 'gst_report_nov.pdf', format: 'PDF', date: '2024-12-05', size: '1.2 MB' },
        { id: 4, name: 'customer_list.xlsx', format: 'Excel', date: '2024-12-04', size: '445 KB' },
    ];

    const toggleModule = (moduleId) => {
        setSelectedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const toggleSetting = (setting) => {
        setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    };

    const handleExport = () => {
        alert(`Exporting ${selectedModules.length} modules as ${exportFormat.toUpperCase()}`);
    };

    const storageUsed = 45.8;
    const storageTotal = 100;
    const storagePercentage = (storageUsed / storageTotal) * 100;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Export</h1>
                    <p className="text-gray-600">Export your business data in various formats</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Export Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Export Format Selector */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {['excel', 'csv', 'pdf'].map((format) => (
                                    <button
                                        key={format}
                                        type="button"
                                        onClick={() => setExportFormat(format)}
                                        className={`p-4 border-2 rounded-lg transition ${exportFormat === format
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">
                                                {format === 'excel' && '📊'}
                                                {format === 'csv' && '📄'}
                                                {format === 'pdf' && '📕'}
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 uppercase">{format}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Module Selection */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Select Modules</h3>
                                <button
                                    type="button"
                                    onClick={() => setSelectedModules(selectedModules.length === modules.length ? [] : modules.map(m => m.id))}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    {selectedModules.length === modules.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {modules.map((module) => (
                                    <label
                                        key={module.id}
                                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${selectedModules.includes(module.id)
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedModules.includes(module.id)}
                                            onChange={() => toggleModule(module.id)}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">{module.icon} {module.name}</p>
                                                <span className="text-xs text-gray-500">{module.count}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Date Range Selector */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        id="dateFrom"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        id="dateTo"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Export Settings */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Settings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Include Headers</p>
                                        <p className="text-xs text-gray-500">Add column headers to export</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.includeHeaders}
                                            onChange={() => toggleSetting('includeHeaders')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Compress File</p>
                                        <p className="text-xs text-gray-500">Create ZIP archive</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.compressFile}
                                            onChange={() => toggleSetting('compressFile')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Split by Month</p>
                                        <p className="text-xs text-gray-500">Create separate files per month</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.splitByMonth}
                                            onChange={() => toggleSetting('splitByMonth')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={selectedModules.length === 0}
                            className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Export {selectedModules.length} Module{selectedModules.length !== 1 ? 's' : ''}</span>
                        </button>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Storage Usage */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Used</span>
                                    <span className="text-sm font-medium text-gray-900">{storageUsed} MB / {storageTotal} MB</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
                                        style={{ width: `${storagePercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{(storageTotal - storageUsed).toFixed(1)} MB remaining</p>
                        </div>

                        {/* Recent Exports */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h3>
                            <div className="space-y-3">
                                {recentExports.map((exp) => (
                                    <div key={exp.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{exp.name}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                        {exp.format}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{exp.size}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="ml-2 p-1 text-indigo-600 hover:text-indigo-700"
                                                title="Download"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">{exp.date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DataExport;
