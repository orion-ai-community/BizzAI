import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';

const WhatsAppMarketing = () => {
    const [showBroadcastForm, setShowBroadcastForm] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [messagePreview, setMessagePreview] = useState('');

    const [formData, setFormData] = useState({
        message: '',
        scheduleDate: '',
        scheduleTime: '',
        attachments: []
    });

    const templates = [
        { id: 1, name: 'Welcome Message', content: 'Welcome to {business_name}! We\'re excited to serve you.' },
        { id: 2, name: 'Order Confirmation', content: 'Your order #{order_id} has been confirmed. Thank you!' },
        { id: 3, name: 'Payment Reminder', content: 'Reminder: Your payment of ₹{amount} is due on {date}.' },
        { id: 4, name: 'Promotional Offer', content: 'Special offer! Get {discount}% off on your next purchase.' }
    ];

    const customerGroups = [
        { id: 1, name: 'All Customers', count: 1250, selected: false },
        { id: 2, name: 'Premium Customers', count: 85, selected: false },
        { id: 3, name: 'New Customers', count: 156, selected: false },
        { id: 4, name: 'Inactive Customers', count: 45, selected: false }
    ];

    const campaigns = [
        { id: 1, name: 'New Year Sale', sent: 1200, delivered: 1180, read: 950, date: '2024-01-01', status: 'completed' },
        { id: 2, name: 'Product Launch', sent: 850, delivered: 840, read: 720, date: '2024-01-15', status: 'completed' },
        { id: 3, name: 'Payment Reminders', sent: 450, delivered: 445, read: 380, date: '2024-01-20', status: 'completed' }
    ];

    const deliveryStats = {
        sent: 2500,
        delivered: 2465,
        read: 2050,
        failed: 35
    };

    const columns = [
        { key: 'name', label: 'Campaign Name', sortable: true, render: (val) => <span className="font-medium text-gray-900">{val}</span> },
        { key: 'date', label: 'Date', sortable: true },
        { key: 'sent', label: 'Sent', sortable: true },
        { key: 'delivered', label: 'Delivered', sortable: true },
        { key: 'read', label: 'Read', sortable: true },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${val === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {val}
                </span>
            )
        }
    ];

    const toggleGroup = (groupId) => {
        setSelectedGroups(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    return (
        <Layout>
            <PageHeader
                title="WhatsApp Marketing"
                description="Send broadcast messages to your customers"
                actions={[
                    <button
                        key="broadcast"
                        onClick={() => setShowBroadcastForm(!showBroadcastForm)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        + New Broadcast
                    </button>
                ]}
            />

            {/* WhatsApp API Status */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">WhatsApp Business API</p>
                            <p className="text-sm text-gray-600">Connected & Active</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Connected
                    </span>
                </div>
            </div>

            {/* Delivery Report Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatsCard
                    title="Messages Sent"
                    value={deliveryStats.sent}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Delivered"
                    value={deliveryStats.delivered}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Read"
                    value={deliveryStats.read}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Failed"
                    value={deliveryStats.failed}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-red-100"
                    iconColor="text-red-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Broadcast Form */}
                    {showBroadcastForm && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Create Broadcast Message</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => {
                                            setSelectedTemplate(e.target.value);
                                            const template = templates.find(t => t.id === parseInt(e.target.value));
                                            setMessagePreview(template?.content || '');
                                        }}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="">Choose a template</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea
                                        value={formData.message || messagePreview}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        rows="4"
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="Type your message..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Groups</label>
                                    <div className="space-y-2">
                                        {customerGroups.map(group => (
                                            <label key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGroups.includes(group.id)}
                                                    onChange={() => toggleGroup(group.id)}
                                                    className="w-4 h-4 text-indigo-600 rounded"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{group.name}</p>
                                                    <p className="text-sm text-gray-600">{group.count} customers</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Attachment</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <svg className="mx-auto w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        <p className="text-sm text-gray-600">Upload Image or PDF</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        label="Schedule Date"
                                        type="date"
                                        value={formData.scheduleDate}
                                        onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                                    />
                                    <FormInput
                                        label="Schedule Time"
                                        type="time"
                                        value={formData.scheduleTime}
                                        onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        Send Now
                                    </button>
                                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        Schedule
                                    </button>
                                    <button
                                        onClick={() => setShowBroadcastForm(false)}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Campaign History */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Campaigns</h2>
                        <DataTable columns={columns} data={campaigns} emptyMessage="No campaigns yet" />
                    </div>
                </div>

                {/* Sidebar - Message Preview */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Message Preview</h2>
                        <div className="border-2 border-gray-200 rounded-lg p-4 mb-4 min-h-[200px] bg-gray-50">
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                    {formData.message || messagePreview || 'Your message will appear here...'}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p className="mb-2">
                                <strong>Recipients:</strong> {selectedGroups.length > 0
                                    ? customerGroups.filter(g => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.count, 0)
                                    : 0} customers
                            </p>
                            <p>
                                <strong>Estimated Cost:</strong> ₹{(selectedGroups.length > 0
                                    ? customerGroups.filter(g => selectedGroups.includes(g.id)).reduce((sum, g) => sum + g.count, 0) * 0.25
                                    : 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default WhatsAppMarketing;
