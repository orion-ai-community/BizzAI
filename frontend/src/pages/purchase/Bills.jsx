import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';

const Bills = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Sample bills data
    const bills = [
        { id: 1, billNo: 'BILL-001', date: '2024-01-15', supplier: 'ABC Suppliers', total: 25000, paid: 10000, balance: 15000, status: 'partial', dueDate: '2024-02-15' },
        { id: 2, billNo: 'BILL-002', date: '2024-01-20', supplier: 'XYZ Traders', total: 15000, paid: 15000, balance: 0, status: 'paid', dueDate: '2024-02-20' },
        { id: 3, billNo: 'BILL-003', date: '2024-01-25', supplier: 'PQR Distributors', total: 30000, paid: 0, balance: 30000, status: 'unpaid', dueDate: '2024-02-25' }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'partial': return 'bg-yellow-100 text-yellow-800';
            case 'unpaid': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const columns = [
        { key: 'billNo', label: 'Bill No', sortable: true, render: (val) => <span className="font-medium text-indigo-600">{val}</span> },
        { key: 'date', label: 'Date', sortable: true },
        { key: 'supplier', label: 'Supplier', sortable: true },
        { key: 'total', label: 'Total', sortable: true, render: (val) => `₹${val.toFixed(2)}` },
        { key: 'paid', label: 'Paid', render: (val) => `₹${val.toFixed(2)}` },
        { key: 'balance', label: 'Balance', render: (val) => <span className="font-medium text-orange-600">₹{val.toFixed(2)}</span> },
        { key: 'status', label: 'Status', render: (val) => <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(val)}`}>{val}</span> },
        { key: 'dueDate', label: 'Due Date', sortable: true }
    ];

    const filteredBills = bills.filter(bill => {
        const matchesSearch = bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) || bill.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalBills = bills.reduce((sum, bill) => sum + bill.total, 0);
    const totalPaid = bills.reduce((sum, bill) => sum + bill.paid, 0);
    const totalDue = bills.reduce((sum, bill) => sum + bill.balance, 0);

    return (
        <Layout>
            <PageHeader
                title="Bills"
                description="Manage supplier bills and payments"
                actions={[
                    <button key="add" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ New Bill</button>
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatsCard
                    title="Total Bills"
                    value={bills.length}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Total Amount"
                    value={`₹${totalBills.toFixed(0)}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Amount Paid"
                    value={`₹${totalPaid.toFixed(0)}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Outstanding"
                    value={`₹${totalDue.toFixed(0)}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    iconBgColor="bg-red-100"
                    iconColor="text-red-600"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="w-full sm:w-96">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by bill number or supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>
            </div>

            <DataTable columns={columns} data={filteredBills} emptyMessage="No bills found" />
        </Layout>
    );
};

export default Bills;
