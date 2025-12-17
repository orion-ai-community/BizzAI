import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import StatsCard from '../../components/StatsCard';

const GoogleProfile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [showHoursEditor, setShowHoursEditor] = useState(false);
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);

    const [profileData, setProfileData] = useState({
        businessName: 'BizzAI Billing Solutions',
        address: '123 Business Street, Mumbai, Maharashtra 400001',
        phone: '+91 98765 43210',
        email: 'contact@bizzai.com',
        website: 'www.bizzai.com',
        category: 'Software Company',
        description: 'Complete billing and inventory management solution for businesses',
        verified: true
    });

    const [hours, setHours] = useState({
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '14:00', closed: false },
        sunday: { open: '', close: '', closed: true }
    });

    const insights = {
        views: 1250,
        calls: 45,
        directions: 89,
        websiteClicks: 156
    };

    const completeness = 85; // Profile completeness percentage

    const photos = [
        { id: 1, url: 'https://via.placeholder.com/150', type: 'logo' },
        { id: 2, url: 'https://via.placeholder.com/150', type: 'cover' },
        { id: 3, url: 'https://via.placeholder.com/150', type: 'interior' }
    ];

    return (
        <Layout>
            <PageHeader
                title="Google Profile Manager"
                description="Manage your Google Business Profile"
                actions={[
                    <button
                        key="sync"
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Sync with Google
                    </button>
                ]}
            />

            {/* Profile Completeness */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">Profile Completeness</h3>
                    <span className="text-2xl font-bold text-indigo-600">{completeness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-indigo-600 h-3 rounded-full transition-all"
                        style={{ width: `${completeness}%` }}
                    />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    Complete your profile to improve visibility in Google Search and Maps
                </p>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatsCard
                    title="Profile Views"
                    value={insights.views}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Phone Calls"
                    value={insights.calls}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Direction Requests"
                    value={insights.directions}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Website Clicks"
                    value={insights.websiteClicks}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
                    iconBgColor="bg-orange-100"
                    iconColor="text-orange-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Business Profile */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <h2 className="text-lg font-bold text-gray-900">Business Profile</h2>
                                {profileData.verified && (
                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Verified
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                            >
                                {isEditing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <FormInput
                                    label="Business Name"
                                    value={profileData.businessName}
                                    onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                                />
                                <FormInput
                                    label="Address"
                                    value={profileData.address}
                                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        label="Phone"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    />
                                    <FormInput
                                        label="Email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        label="Website"
                                        value={profileData.website}
                                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                                    />
                                    <FormInput
                                        label="Category"
                                        value={profileData.category}
                                        onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={profileData.description}
                                        onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    Save Changes
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Business Name</p>
                                    <p className="font-medium text-gray-900">{profileData.businessName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="font-medium text-gray-900">{profileData.address}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-medium text-gray-900">{profileData.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium text-gray-900">{profileData.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Website</p>
                                        <p className="font-medium text-indigo-600">{profileData.website}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Category</p>
                                        <p className="font-medium text-gray-900">{profileData.category}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Description</p>
                                    <p className="font-medium text-gray-900">{profileData.description}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hours of Operation */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Hours of Operation</h2>
                            <button
                                onClick={() => setShowHoursEditor(!showHoursEditor)}
                                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                            >
                                {showHoursEditor ? 'Cancel' : 'Edit'}
                            </button>
                        </div>
                        {showHoursEditor ? (
                            <div className="space-y-3">
                                {Object.entries(hours).map(([day, time]) => (
                                    <div key={day} className="flex items-center space-x-4">
                                        <div className="w-24">
                                            <p className="font-medium text-gray-900 capitalize">{day}</p>
                                        </div>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={time.closed}
                                                onChange={(e) => setHours({
                                                    ...hours,
                                                    [day]: { ...time, closed: e.target.checked }
                                                })}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">Closed</span>
                                        </label>
                                        {!time.closed && (
                                            <>
                                                <input
                                                    type="time"
                                                    value={time.open}
                                                    onChange={(e) => setHours({
                                                        ...hours,
                                                        [day]: { ...time, open: e.target.value }
                                                    })}
                                                    className="px-3 py-2 border rounded-lg"
                                                />
                                                <span className="text-gray-500">to</span>
                                                <input
                                                    type="time"
                                                    value={time.close}
                                                    onChange={(e) => setHours({
                                                        ...hours,
                                                        [day]: { ...time, close: e.target.value }
                                                    })}
                                                    className="px-3 py-2 border rounded-lg"
                                                />
                                            </>
                                        )}
                                    </div>
                                ))}
                                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    Save Hours
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(hours).map(([day, time]) => (
                                    <div key={day} className="flex justify-between">
                                        <span className="font-medium text-gray-900 capitalize">{day}</span>
                                        <span className="text-gray-600">
                                            {time.closed ? 'Closed' : `${time.open} - ${time.close}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Photos & Media */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Photos & Media</h2>
                            <button
                                onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                            >
                                + Upload Photo
                            </button>
                        </div>
                        {showPhotoUpload && (
                            <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                <svg className="mx-auto w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-4">
                            {photos.map((photo) => (
                                <div key={photo.id} className="relative group">
                                    <img src={photo.url} alt={photo.type} className="w-full h-32 object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                                        <button className="text-white text-sm">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    {/* Post to Google */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Post to Google</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">What's new?</label>
                            <textarea
                                rows="4"
                                className="w-full px-4 py-2 border rounded-lg mb-3"
                                placeholder="Share updates with your customers..."
                            />
                        </div>
                        <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            Publish Post
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                                View on Google
                            </button>
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                                Share Profile Link
                            </button>
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                                Download QR Code
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GoogleProfile;
