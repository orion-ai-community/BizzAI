import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';

const Backup = () => {
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupDestination, setBackupDestination] = useState('local');
    const [scheduleTime, setScheduleTime] = useState('02:00');

    const backupHistory = [
        { id: 1, date: '2024-01-25 02:00', size: '45.2 MB', location: 'Local Storage', status: 'completed' },
        { id: 2, date: '2024-01-24 02:00', size: '44.8 MB', location: 'Google Drive', status: 'completed' },
        { id: 3, date: '2024-01-23 02:00', size: '44.5 MB', location: 'Local Storage', status: 'completed' },
        { id: 4, date: '2024-01-22 02:00', size: '44.1 MB', location: 'Local Storage', status: 'failed' },
        { id: 5, date: '2024-01-21 02:00', size: '43.9 MB', location: 'Google Drive', status: 'completed' }
    ];

    const storageUsage = {
        used: 220,
        total: 500,
        percentage: 44
    };

    const lastBackup = {
        date: '2024-01-25',
        time: '02:00 AM',
        size: '45.2 MB',
        status: 'Success'
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const columns = [
        { key: 'date', label: 'Date & Time', sortable: true },
        { key: 'size', label: 'Size', sortable: true },
        { key: 'location', label: 'Location', sortable: true },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(val)}`}>
                    {val}
                </span>
            )
        }
    ];

    return (
        <Layout>
            <PageHeader
                title="Backup"
                description="Protect your business data with automatic backups"
                actions={[
                    <button
                        key="manual"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Create Backup Now
                    </button>
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Backup Settings */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Backup Settings</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">Automatic Backup</p>
                                    <p className="text-sm text-gray-600">Enable daily automatic backups</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoBackup}
                                        onChange={(e) => setAutoBackup(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Backup Destination</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setBackupDestination('local')}
                                        className={`p-4 border-2 rounded-lg transition ${backupDestination === 'local' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                                            }`}
                                    >
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                        </svg>
                                        <p className="font-medium text-gray-900">Local Storage</p>
                                    </button>
                                    <button
                                        onClick={() => setBackupDestination('drive')}
                                        className={`p-4 border-2 rounded-lg transition ${backupDestination === 'drive' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                                            }`}
                                    >
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                        </svg>
                                        <p className="font-medium text-gray-900">Google Drive</p>
                                    </button>
                                </div>
                            </div>

                            <FormInput
                                label="Schedule Backup Time"
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                            />

                            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                Save Settings
                            </button>
                        </div>
                    </div>

                    {/* Backup History */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Backup History</h2>
                        <DataTable columns={columns} data={backupHistory} emptyMessage="No backup history" />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Last Backup Summary */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Last Backup</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Date</span>
                                <span className="font-medium text-gray-900">{lastBackup.date}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Time</span>
                                <span className="font-medium text-gray-900">{lastBackup.time}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Size</span>
                                <span className="font-medium text-gray-900">{lastBackup.size}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Status</span>
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                    {lastBackup.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Storage Usage */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Storage Usage</h2>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Used: {storageUsage.used} MB</span>
                                <span className="text-gray-600">Total: {storageUsage.total} MB</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-indigo-600 h-3 rounded-full transition-all"
                                    style={{ width: `${storageUsage.percentage}%` }}
                                />
                            </div>
                            <p className="text-center text-2xl font-bold text-indigo-600 mt-2">
                                {storageUsage.percentage}%
                            </p>
                        </div>
                        <p className="text-sm text-gray-600">
                            {storageUsage.total - storageUsage.used} MB available
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                                Download Latest Backup
                            </button>
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                                View All Backups
                            </button>
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                                Clean Old Backups
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Backup;
