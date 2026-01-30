import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PurchaseReturnFormNew from './PurchaseReturnFormNew';

const PurchaseReturn = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            {/* Header with button */}
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Purchase Return</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Return purchased items to supplier</p>
                    </div>
                    <button
                        onClick={() => navigate('/purchase/returns/list')}
                        className="px-4 py-2 bg-gray-700 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                        View All Returns
                    </button>
                </div>
            </div>

            <PurchaseReturnFormNew />
        </Layout>
    );
};

export default PurchaseReturn;
