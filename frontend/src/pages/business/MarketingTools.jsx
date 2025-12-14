import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const MarketingTools = () => {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [customMessage, setCustomMessage] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('blue');

    const templates = [
        { id: 1, name: 'Sale Announcement', category: 'Flyer', thumbnail: '🎉', description: 'Announce special sales and offers' },
        { id: 2, name: 'New Product Launch', category: 'Banner', thumbnail: '🚀', description: 'Promote new products' },
        { id: 3, name: 'Discount Offer', category: 'Offer', thumbnail: '💰', description: 'Share discount deals' },
        { id: 4, name: 'Festival Greetings', category: 'Flyer', thumbnail: '🎊', description: 'Festival wishes with branding' },
        { id: 5, name: 'Social Media Post', category: 'Social', thumbnail: '📱', description: 'Ready-to-share social posts' },
        { id: 6, name: 'Email Campaign', category: 'Email', thumbnail: '📧', description: 'Professional email templates' }
    ];

    const themes = [
        { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-500' },
        { id: 'red', name: 'Bold Red', color: 'bg-red-500' },
        { id: 'green', name: 'Fresh Green', color: 'bg-green-500' },
        { id: 'purple', name: 'Royal Purple', color: 'bg-purple-500' },
        { id: 'orange', name: 'Vibrant Orange', color: 'bg-orange-500' }
    ];

    const suggestions = [
        'Add customer testimonials to build trust',
        'Use high-quality product images',
        'Include clear call-to-action buttons',
        'Optimize for mobile viewing',
        'A/B test different headlines'
    ];

    return (
        <Layout>
            <PageHeader
                title="Marketing Tools"
                description="Create professional marketing materials"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Template Gallery */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Template Gallery</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => setSelectedTemplate(template)}
                                    className={`border-2 rounded-xl p-4 cursor-pointer transition hover:border-indigo-300 ${selectedTemplate?.id === template.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="text-4xl mb-3 text-center">{template.thumbnail}</div>
                                    <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                        {template.category}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Social Media Post Creator */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Social Media Post Creator</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message</label>
                                <textarea
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    rows="4"
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="Write your message here..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <svg className="mx-auto w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Theme Selector</label>
                                <div className="flex space-x-3">
                                    {themes.map((theme) => (
                                        <button
                                            key={theme.id}
                                            onClick={() => setSelectedTheme(theme.id)}
                                            className={`flex flex-col items-center space-y-2 p-3 border-2 rounded-lg transition ${selectedTheme === theme.id ? 'border-indigo-600' : 'border-gray-200'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${theme.color}`} />
                                            <span className="text-xs text-gray-700">{theme.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Preview Panel */}
                    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Preview</h2>
                        <div className="border-2 border-gray-200 rounded-lg p-6 mb-4 min-h-[300px] flex items-center justify-center bg-gray-50">
                            {selectedTemplate ? (
                                <div className="text-center">
                                    <div className="text-6xl mb-4">{selectedTemplate.thumbnail}</div>
                                    <p className="font-bold text-gray-900">{selectedTemplate.name}</p>
                                    <p className="text-sm text-gray-600 mt-2">{customMessage || 'Your message will appear here'}</p>
                                </div>
                            ) : (
                                <p className="text-gray-400">Select a template to preview</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                Download
                            </button>
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Share
                            </button>
                            <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                Preview
                            </button>
                        </div>
                    </div>

                    {/* Performance Suggestions */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Tips</h2>
                        <div className="space-y-3">
                            {suggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-gray-700">{suggestion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MarketingTools;
