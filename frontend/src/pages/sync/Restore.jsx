import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const Restore = () => {
    const [selectedBackup, setSelectedBackup] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [restoreProgress, setRestoreProgress] = useState(0);
    const [isRestoring, setIsRestoring] = useState(false);

    const availableBackups = [
        {
            id: 1,
            date: '2024-01-25 02:00',
            size: '45.2 MB',
            location: 'Local Storage',
            compatible: true,
            dataIncluded: ['Invoices', 'Customers', 'Items', 'Reports']
        },
        {
            id: 2,
            date: '2024-01-24 02:00',
            size: '44.8 MB',
            location: 'Google Drive',
            compatible: true,
            dataIncluded: ['Invoices', 'Customers', 'Items', 'Reports']
        },
        {
            id: 3,
            date: '2024-01-23 02:00',
            size: '44.5 MB',
            location: 'Local Storage',
            compatible: true,
            dataIncluded: ['Invoices', 'Customers', 'Items']
        },
        {
            id: 4,
            date: '2024-01-20 02:00',
            size: '43.2 MB',
            location: 'Local Storage',
            compatible: false,
            dataIncluded: ['Invoices', 'Customers']
        }
    ];

    const handleRestore = () => {
        setIsRestoring(true);
        setShowConfirmation(false);
        // Simulate restore progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setRestoreProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setIsRestoring(false);
                    setRestoreProgress(0);
                    alert('Restore completed successfully!');
                }, 500);
            }
        }, 500);
    };

    return (
        <Layout>
            <PageHeader
                title="Restore"
                description="Restore your data from previous backups"
                actions={[
                    <button
                        key="upload"
                        onClick={() => setShowUpload(!showUpload)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Upload Backup File
                    </button>
                ]}
            />

            {/* Warning Banner */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                    <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <p className="font-bold text-yellow-900">Warning: Data will be overwritten</p>
                        <p className="text-sm text-yellow-800 mt-1">
                            Restoring a backup will replace all your current data. Make sure to create a backup of your current data before proceeding.
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload Backup File */}
            {showUpload && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Upload Backup File</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">Drop your backup file here</p>
                        <p className="text-sm text-gray-600 mb-4">or click to browse</p>
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            Choose File
                        </button>
                        <p className="text-xs text-gray-500 mt-4">Supported format: .backup, .zip (Max 100MB)</p>
                    </div>
                </div>
            )}

            {/* Restore Progress */}
            {isRestoring && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Restoring Data...</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-bold text-indigo-600">{restoreProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                                className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                                style={{ width: `${restoreProgress}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                            Please wait while we restore your data. Do not close this window.
                        </p>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmation && selectedBackup && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-red-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Confirm Restore</h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-800">
                                <strong>⚠️ This action cannot be undone!</strong>
                            </p>
                            <p className="text-sm text-red-700 mt-2">
                                All current data will be replaced with data from the selected backup.
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2"><strong>Backup Details:</strong></p>
                            <div className="space-y-1 text-sm">
                                <p>Date: {selectedBackup.date}</p>
                                <p>Size: {selectedBackup.size}</p>
                                <p>Location: {selectedBackup.location}</p>
                                <p>Data: {selectedBackup.dataIncluded.join(', ')}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRestore}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Yes, Restore Now
                            </button>
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Available Backups */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Available Backups</h2>
                <div className="space-y-4">
                    {availableBackups.map((backup) => (
                        <div
                            key={backup.id}
                            className={`border-2 rounded-xl p-4 transition ${selectedBackup?.id === backup.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="font-bold text-gray-900">{backup.date}</h3>
                                        {backup.compatible ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Compatible
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                                Incompatible
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Size</p>
                                            <p className="font-medium text-gray-900">{backup.size}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Location</p>
                                            <p className="font-medium text-gray-900">{backup.location}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-gray-600">Data Included</p>
                                            <p className="font-medium text-gray-900">{backup.dataIncluded.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3 border-t">
                                <button
                                    onClick={() => {
                                        setSelectedBackup(backup);
                                        setShowConfirmation(true);
                                    }}
                                    disabled={!backup.compatible}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${backup.compatible
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    Restore
                                </button>
                                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                                    View Details
                                </button>
                                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default Restore;
