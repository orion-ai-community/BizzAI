import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';

const Cheques = () => {
    const [showAddCheque, setShowAddCheque] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedCheque, setSelectedCheque] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        chequeNo: '',
        partyName: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        bankName: '',
        type: 'received',
        status: 'pending',
        notes: ''
    });

    // Sample data
    const cheques = [
        { id: 1, chequeNo: 'CHQ001', partyName: 'ABC Suppliers', amount: 25000, date: '2024-01-15', bankName: 'HDFC Bank', type: 'issued', status: 'cleared', clearDate: '2024-01-20' },
        { id: 2, chequeNo: 'CHQ002', partyName: 'XYZ Customer', amount: 15000, date: '2024-01-18', bankName: 'ICICI Bank', type: 'received', status: 'pending', clearDate: null },
        { id: 3, chequeNo: 'CHQ003', partyName: 'PQR Traders', amount: 30000, date: '2024-01-20', bankName: 'SBI', type: 'received', status: 'cleared', clearDate: '2024-01-25' },
        { id: 4, chequeNo: 'CHQ004', partyName: 'LMN Distributors', amount: 12000, date: '2024-01-22', bankName: 'Axis Bank', type: 'issued', status: 'bounced', clearDate: null },
        { id: 5, chequeNo: 'CHQ005', partyName: 'DEF Enterprises', amount: 20000, date: '2024-01-25', bankName: 'HDFC Bank', type: 'received', status: 'pending', clearDate: null }
    ];

    const filteredCheques = cheques.filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesSearch = c.chequeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.partyName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'cleared': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'bounced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type) => {
        return type === 'received' ? 'text-green-600' : 'text-blue-600';
    };

    const statusCounts = {
        all: cheques.length,
        pending: cheques.filter(c => c.status === 'pending').length,
        cleared: cheques.filter(c => c.status === 'cleared').length,
        bounced: cheques.filter(c => c.status === 'bounced').length
    };

    const columns = [
        {
            key: 'chequeNo',
            label: 'Cheque No',
            sortable: true,
            render: (val) => <span className="font-medium text-indigo-600">{val}</span>
        },
        { key: 'partyName', label: 'Party Name', sortable: true },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (val) => <span className="font-bold text-gray-900">₹{val.toLocaleString()}</span>
        },
        { key: 'date', label: 'Date', sortable: true },
        { key: 'bankName', label: 'Bank', sortable: true },
        {
            key: 'type',
            label: 'Type',
            render: (val) => (
                <span className={`font-medium capitalize ${getTypeColor(val)}`}>
                    {val}
                </span>
            )
        },
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
                title="Cheques"
                description="Manage received and issued cheques"
                actions={[
                    <button
                        key="add"
                        onClick={() => setShowAddCheque(true)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        + Add Cheque
                    </button>
                ]}
            />

            {/* Status Tabs */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition ${statusFilter === 'all'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        All Cheques
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{statusCounts.all}</span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition ${statusFilter === 'pending'
                                ? 'border-b-2 border-yellow-600 text-yellow-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Pending
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">{statusCounts.pending}</span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('cleared')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition ${statusFilter === 'cleared'
                                ? 'border-b-2 border-green-600 text-green-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Cleared
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{statusCounts.cleared}</span>
                    </button>
                    <button
                        onClick={() => setStatusFilter('bounced')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition ${statusFilter === 'bounced'
                                ? 'border-b-2 border-red-600 text-red-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Bounced
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">{statusCounts.bounced}</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by cheque number or party name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Add Cheque Form */}
            {showAddCheque && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Add Cheque</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormInput
                            label="Cheque Number"
                            value={formData.chequeNo}
                            onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                            placeholder="CHQ001"
                            required
                        />
                        <FormInput
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                        <FormInput
                            label="Party Name"
                            value={formData.partyName}
                            onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                            placeholder="Enter party name"
                            required
                        />
                        <FormInput
                            label="Amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            required
                        />
                        <FormInput
                            label="Bank Name"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            placeholder="Enter bank name"
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="received">Received</option>
                                <option value="issued">Issued</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="pending">Pending</option>
                                <option value="cleared">Cleared</option>
                                <option value="bounced">Bounced</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="Add any notes..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            Add Cheque
                        </button>
                        <button
                            onClick={() => setShowAddCheque(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Cheque Details View */}
            {showDetails && selectedCheque && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Cheque Details</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-gray-600">Cheque Number</p>
                            <p className="font-bold text-gray-900">{selectedCheque.chequeNo}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="font-bold text-gray-900">{selectedCheque.date}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Party Name</p>
                            <p className="font-bold text-gray-900">{selectedCheque.partyName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Amount</p>
                            <p className="text-2xl font-bold text-indigo-600">₹{selectedCheque.amount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Bank</p>
                            <p className="font-bold text-gray-900">{selectedCheque.bankName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Type</p>
                            <p className={`font-bold capitalize ${getTypeColor(selectedCheque.type)}`}>{selectedCheque.type}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(selectedCheque.status)}`}>
                                {selectedCheque.status}
                            </span>
                        </div>
                        {selectedCheque.clearDate && (
                            <div>
                                <p className="text-sm text-gray-600">Clear Date</p>
                                <p className="font-bold text-gray-900">{selectedCheque.clearDate}</p>
                            </div>
                        )}
                    </div>
                    {selectedCheque.status === 'pending' && (
                        <div className="flex gap-3 pt-4 border-t">
                            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Mark as Cleared
                            </button>
                            <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Mark as Bounced
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowDetails(false)}
                        className="mt-4 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Cheques Table */}
            <DataTable
                columns={columns}
                data={filteredCheques}
                emptyMessage="No cheques found"
                onRowClick={(cheque) => { setSelectedCheque(cheque); setShowDetails(true); }}
            />
        </Layout>
    );
};

export default Cheques;
