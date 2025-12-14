import { useState } from 'react';
import Layout from '../../components/Layout';

const BusinessSetup = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        ownerName: '',
        gstin: '',
        pan: '',
        email: '',
        phone: '',
        address: '',
        businessCategory: 'retail',
        currency: 'INR',
        financialYear: '2024-2025',
        gstEnabled: true,
        taxMode: 'inclusive',
    });

    const [logo, setLogo] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(URL.createObjectURL(file));
        }
    };

    const completionPercentage = () => {
        const fields = ['businessName', 'ownerName', 'email', 'phone'];
        const filled = fields.filter(field => formData[field]).length;
        return Math.round((filled / fields.length) * 100);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        // UI only - no actual submission
        alert('Business setup saved successfully!');
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Setup</h1>
                    <p className="text-gray-600">Configure your business profile and preferences</p>
                </div>

                {/* Profile Completeness Indicator */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Profile Completeness</h3>
                        <span className="text-sm font-bold text-indigo-600">{completionPercentage()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage()}%` }}
                        ></div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
                    <h3 className="text-lg font-semibold mb-3">Current Business Setup</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-indigo-200">Business Name</p>
                            <p className="font-medium">{formData.businessName || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200">GST Status</p>
                            <p className="font-medium">{formData.gstEnabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200">Financial Year</p>
                            <p className="font-medium">{formData.financialYear}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200">Currency</p>
                            <p className="font-medium">₹ {formData.currency}</p>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <form onSubmit={onSubmit}>
                    {/* Business Profile */}
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Profile</h3>

                        {/* Logo Upload */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Business Logo</label>
                            <div className="flex items-center space-x-6">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    {logo ? (
                                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer inline-block transition"
                                    >
                                        Upload Logo
                                    </label>
                                    <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 2MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Business Name */}
                            <div className="md:col-span-2">
                                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="businessName"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={onChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Enter your business name"
                                />
                            </div>

                            {/* Owner Name */}
                            <div>
                                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Owner Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ownerName"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={onChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Enter owner name"
                                />
                            </div>

                            {/* Business Category */}
                            <div>
                                <label htmlFor="businessCategory" className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Category
                                </label>
                                <select
                                    id="businessCategory"
                                    name="businessCategory"
                                    value={formData.businessCategory}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="retail">Retail</option>
                                    <option value="wholesale">Wholesale</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="services">Services</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* GSTIN */}
                            <div>
                                <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-2">
                                    GSTIN
                                </label>
                                <input
                                    type="text"
                                    id="gstin"
                                    name="gstin"
                                    value={formData.gstin}
                                    onChange={onChange}
                                    maxLength={15}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="22AAAAA0000A1Z5"
                                />
                            </div>

                            {/* PAN */}
                            <div>
                                <label htmlFor="pan" className="block text-sm font-medium text-gray-700 mb-2">
                                    PAN
                                </label>
                                <input
                                    type="text"
                                    id="pan"
                                    name="pan"
                                    value={formData.pan}
                                    onChange={onChange}
                                    maxLength={10}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="ABCDE1234F"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={onChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="business@example.com"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={onChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="+91 9876543210"
                                />
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Address
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={onChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Enter complete business address"
                                />
                            </div>

                            {/* Currency */}
                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency
                                </label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="INR">₹ INR - Indian Rupee</option>
                                    <option value="USD">$ USD - US Dollar</option>
                                    <option value="EUR">€ EUR - Euro</option>
                                    <option value="GBP">£ GBP - British Pound</option>
                                </select>
                            </div>

                            {/* Financial Year */}
                            <div>
                                <label htmlFor="financialYear" className="block text-sm font-medium text-gray-700 mb-2">
                                    Financial Year
                                </label>
                                <select
                                    id="financialYear"
                                    name="financialYear"
                                    value={formData.financialYear}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="2024-2025">2024-2025</option>
                                    <option value="2023-2024">2023-2024</option>
                                    <option value="2022-2023">2022-2023</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tax Configuration */}
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tax Configuration</h3>

                        <div className="space-y-6">
                            {/* Enable GST */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label htmlFor="gstEnabled" className="text-sm font-medium text-gray-900">
                                        Enable GST
                                    </label>
                                    <p className="text-sm text-gray-500">Apply GST to your invoices and transactions</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="gstEnabled"
                                        name="gstEnabled"
                                        checked={formData.gstEnabled}
                                        onChange={onChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* Tax Mode */}
                            {formData.gstEnabled && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Tax Mode
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.taxMode === 'inclusive' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
                                            <input
                                                type="radio"
                                                name="taxMode"
                                                value="inclusive"
                                                checked={formData.taxMode === 'inclusive'}
                                                onChange={onChange}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Tax Inclusive</p>
                                                <p className="text-xs text-gray-500">Price includes tax</p>
                                            </div>
                                        </label>
                                        <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.taxMode === 'exclusive' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
                                            <input
                                                type="radio"
                                                name="taxMode"
                                                value="exclusive"
                                                checked={formData.taxMode === 'exclusive'}
                                                onChange={onChange}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">Tax Exclusive</p>
                                                <p className="text-xs text-gray-500">Tax added separately</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                            <svg
                                className={`w-5 h-5 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showAdvanced && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-4">Additional configuration options will appear here</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-700">Invoice Prefix</p>
                                        <input
                                            type="text"
                                            placeholder="INV-"
                                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-700">Starting Invoice Number</p>
                                        <input
                                            type="number"
                                            placeholder="1"
                                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default BusinessSetup;
