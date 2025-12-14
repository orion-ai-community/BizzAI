import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';

const OnlineShop = () => {
    const features = [
        { title: 'Custom Domain', description: 'Get your own branded domain name', icon: '🌐', status: 'Available' },
        { title: 'Product Catalog', description: 'Showcase unlimited products online', icon: '📦', status: 'Available' },
        { title: 'Payment Gateway', description: 'Accept online payments securely', icon: '💳', status: 'Available' },
        { title: 'Order Management', description: 'Track and manage online orders', icon: '📋', status: 'Available' },
        { title: 'Customer Portal', description: 'Let customers track their orders', icon: '👤', status: 'Available' },
        { title: 'Mobile Responsive', description: 'Perfect on all devices', icon: '📱', status: 'Available' }
    ];

    const plans = [
        { name: 'Starter', price: '₹499/month', features: ['Up to 50 products', 'Basic theme', 'Email support'], color: 'border-blue-200 bg-blue-50' },
        { name: 'Professional', price: '₹999/month', features: ['Unlimited products', 'Premium themes', 'Priority support', 'Custom domain'], color: 'border-indigo-200 bg-indigo-50', popular: true },
        { name: 'Enterprise', price: '₹1999/month', features: ['Everything in Pro', 'Multi-store', 'API access', 'Dedicated manager'], color: 'border-purple-200 bg-purple-50' }
    ];

    return (
        <Layout>
            <PageHeader title="Take Your Shop Online" description="Launch your e-commerce store in minutes" />

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
                <div className="max-w-3xl">
                    <h2 className="text-3xl font-bold mb-4">🚀 Go Digital, Grow Faster!</h2>
                    <p className="text-indigo-100 text-lg mb-6">
                        Reach customers 24/7 with your own online store. No technical knowledge required!
                    </p>
                    <button className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition">
                        Start Free Trial
                    </button>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Features Included</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-100 hover:border-indigo-300 transition">
                            <div className="text-4xl mb-3">{feature.icon}</div>
                            <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
                            <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">{feature.status}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, idx) => (
                        <div key={idx} className={`relative border-2 rounded-xl p-6 ${plan.color} ${plan.popular ? 'ring-4 ring-indigo-300' : ''}`}>
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 bg-indigo-600 text-white text-sm font-bold rounded-full">Most Popular</span>
                                </div>
                            )}
                            <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                            <div className="text-3xl font-bold text-indigo-600 mb-6">{plan.price}</div>
                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, featureIdx) => (
                                    <li key={featureIdx} className="flex items-start">
                                        <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <button className={`w-full py-3 rounded-lg font-medium transition ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border-2 border-gray-300 text-gray-900 hover:border-indigo-600'}`}>
                                Get Started
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default OnlineShop;
