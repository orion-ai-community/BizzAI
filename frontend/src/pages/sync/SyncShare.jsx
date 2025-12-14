import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const SyncShare = () => {
    const [devices, setDevices] = useState([
        { id: 1, name: 'Desktop - Office', type: 'Windows PC', lastSync: '2 minutes ago', status: 'active' },
        { id: 2, name: 'Laptop - Home', type: 'MacBook Pro', lastSync: '1 hour ago', status: 'active' },
        { id: 3, name: 'Mobile - iPhone', type: 'iOS App', lastSync: '5 minutes ago', status: 'active' }
    ]);

    const [syncSettings, setSyncSettings] = useState({
        autoSync: true,
        syncInterval: '5',
        syncOnWifi: true,
        syncData: {
            invoices: true,
            customers: true,
            items: true,
            reports: false
        }
    });

    const handleSyncDataChange = (key) => {
        setSyncSettings(prev => ({
            ...prev,
            syncData: {
                ...prev.syncData,
                [key]: !prev.syncData[key]
            }
        }));
    };

    return (
        <Layout>
            <PageHeader title="Sync & Share" description="Keep your data synchronized across all devices" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Connected Devices</h2>
                        <div className="space-y-4">
                            {devices.map((device) => (
                                <div key={device.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-indigo-100 rounded-lg">
                                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{device.name}</h3>
                                            <p className="text-sm text-gray-600">{device.type}</p>
                                            <p className="text-xs text-gray-500">Last synced: {device.lastSync}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                            {device.status}
                                        </span>
                                        <button className="text-red-600 hover:text-red-800">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition">
                            + Add New Device
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">What to Sync</h2>
                        <div className="space-y-3">
                            {Object.entries(syncSettings.syncData).map(([key, value]) => (
                                <label key={key} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <span className="font-medium text-gray-900 capitalize">{key}</span>
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => handleSyncDataChange(key)}
                                        className="w-5 h-5 text-indigo-600 rounded"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Sync Settings</h2>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <span className="text-gray-700">Auto Sync</span>
                                <input
                                    type="checkbox"
                                    checked={syncSettings.autoSync}
                                    onChange={(e) => setSyncSettings({ ...syncSettings, autoSync: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sync Interval</label>
                                <select
                                    value={syncSettings.syncInterval}
                                    onChange={(e) => setSyncSettings({ ...syncSettings, syncInterval: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    <option value="5">Every 5 minutes</option>
                                    <option value="15">Every 15 minutes</option>
                                    <option value="30">Every 30 minutes</option>
                                    <option value="60">Every hour</option>
                                </select>
                            </div>
                            <label className="flex items-center justify-between">
                                <span className="text-gray-700">Sync only on WiFi</span>
                                <input
                                    type="checkbox"
                                    checked={syncSettings.syncOnWifi}
                                    onChange={(e) => setSyncSettings({ ...syncSettings, syncOnWifi: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded"
                                />
                            </label>
                        </div>
                        <button className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            Sync Now
                        </button>
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Last Sync:</strong> 2 minutes ago<br />
                                <strong>Status:</strong> All devices up to date
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SyncShare;
