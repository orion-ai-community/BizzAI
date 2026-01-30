import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';

const ApprovalSettings = () => {
    const [settings, setSettings] = useState({
        purchaseReturnThreshold: 10000,
        purchaseThreshold: 50000,
        saleThreshold: 100000,
        paymentThreshold: 25000,
        requireApprovalForAllReturns: false,
        autoApproveUnderThreshold: true,
        escalationTimeHours: 24,
        notifyApprovers: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/api/approvals/settings');
            if (response.data) {
                setSettings(response.data);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await api.put('/api/approvals/settings', settings);
            toast.success('Approval settings saved successfully');
        } catch (err) {
            console.error('Error saving settings:', err);
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <Layout>
            <PageHeader
                title="Approval Settings"
                subtitle="Configure approval workflows and thresholds"
            />

            <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-6">
                    {/* Threshold Settings */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Thresholds</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Purchase Return Threshold (₹)
                                </label>
                                <input
                                    type="number"
                                    value={settings.purchaseReturnThreshold}
                                    onChange={(e) => handleChange('purchaseReturnThreshold', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Returns above this amount require approval
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Purchase Threshold (₹)
                                </label>
                                <input
                                    type="number"
                                    value={settings.purchaseThreshold}
                                    onChange={(e) => handleChange('purchaseThreshold', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sale Threshold (₹)
                                </label>
                                <input
                                    type="number"
                                    value={settings.saleThreshold}
                                    onChange={(e) => handleChange('saleThreshold', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Threshold (₹)
                                </label>
                                <input
                                    type="number"
                                    value={settings.paymentThreshold}
                                    onChange={(e) => handleChange('paymentThreshold', parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Workflow Settings */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="requireAll"
                                    checked={settings.requireApprovalForAllReturns}
                                    onChange={(e) => handleChange('requireApprovalForAllReturns', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="requireAll" className="ml-2 text-sm text-gray-700">
                                    Require approval for all purchase returns (regardless of amount)
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="autoApprove"
                                    checked={settings.autoApproveUnderThreshold}
                                    onChange={(e) => handleChange('autoApproveUnderThreshold', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="autoApprove" className="ml-2 text-sm text-gray-700">
                                    Auto-approve returns under threshold
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="notify"
                                    checked={settings.notifyApprovers}
                                    onChange={(e) => handleChange('notifyApprovers', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="notify" className="ml-2 text-sm text-gray-700">
                                    Send email notifications to approvers
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Escalation Time (hours)
                                </label>
                                <input
                                    type="number"
                                    value={settings.escalationTimeHours}
                                    onChange={(e) => handleChange('escalationTimeHours', parseInt(e.target.value))}
                                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Auto-escalate to next level if not approved within this time
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ApprovalSettings;
