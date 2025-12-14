import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import StatsCard from '../../components/StatsCard';

const LoanAccounts = () => {
    const [showAddLoan, setShowAddLoan] = useState(false);
    const [showEMISchedule, setShowEMISchedule] = useState(false);
    const [showPayEMI, setShowPayEMI] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);

    const [formData, setFormData] = useState({
        lenderName: '',
        loanType: 'borrowed',
        loanAmount: 0,
        interestRate: 0,
        tenure: 12,
        startDate: new Date().toISOString().split('T')[0],
        emiAmount: 0,
        purpose: '',
        notes: ''
    });

    // Sample data
    const loans = [
        {
            id: 1,
            lenderName: 'HDFC Bank',
            loanType: 'borrowed',
            loanAmount: 500000,
            balanceRemaining: 350000,
            interestRate: 10.5,
            emiAmount: 15000,
            tenure: 36,
            paidEMIs: 10,
            status: 'active',
            startDate: '2023-04-01',
            nextEMIDate: '2024-02-01'
        },
        {
            id: 2,
            lenderName: 'ABC Enterprises',
            loanType: 'lent',
            loanAmount: 200000,
            balanceRemaining: 150000,
            interestRate: 12,
            emiAmount: 8000,
            tenure: 24,
            paidEMIs: 6,
            status: 'active',
            startDate: '2023-08-01',
            nextEMIDate: '2024-02-01'
        },
        {
            id: 3,
            lenderName: 'Personal Loan - Mr. Sharma',
            loanType: 'borrowed',
            loanAmount: 100000,
            balanceRemaining: 0,
            interestRate: 8,
            emiAmount: 5000,
            tenure: 20,
            paidEMIs: 20,
            status: 'closed',
            startDate: '2022-06-01',
            nextEMIDate: null
        }
    ];

    const totalBorrowed = loans.filter(l => l.loanType === 'borrowed').reduce((sum, l) => sum + l.balanceRemaining, 0);
    const totalLent = loans.filter(l => l.loanType === 'lent').reduce((sum, l) => sum + l.balanceRemaining, 0);
    const activeLoans = loans.filter(l => l.status === 'active').length;

    const getStatusColor = (status) => {
        return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    };

    const getLoanTypeColor = (type) => {
        return type === 'borrowed' ? 'text-red-600' : 'text-green-600';
    };

    // Generate EMI schedule
    const generateEMISchedule = (loan) => {
        const schedule = [];
        const monthlyRate = loan.interestRate / 12 / 100;
        let balance = loan.loanAmount;

        for (let i = 1; i <= loan.tenure; i++) {
            const interest = balance * monthlyRate;
            const principal = loan.emiAmount - interest;
            balance -= principal;

            schedule.push({
                emiNo: i,
                emiAmount: loan.emiAmount,
                principal: principal,
                interest: interest,
                balance: Math.max(0, balance),
                status: i <= loan.paidEMIs ? 'paid' : 'pending'
            });
        }
        return schedule;
    };

    return (
        <Layout>
            <PageHeader
                title="Loan Accounts"
                description="Manage borrowed and lent loans"
                actions={[
                    <button
                        key="add"
                        onClick={() => setShowAddLoan(true)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        + Add Loan Account
                    </button>
                ]}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatsCard
                    title="Total Borrowed"
                    value={`₹${totalBorrowed.toLocaleString()}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                    iconBgColor="bg-red-100"
                    iconColor="text-red-600"
                />
                <StatsCard
                    title="Total Lent"
                    value={`₹${totalLent.toLocaleString()}`}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    iconBgColor="bg-green-100"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Active Loans"
                    value={activeLoans}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                />
            </div>

            {/* Add Loan Form */}
            {showAddLoan && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Add Loan Account</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormInput
                            label="Lender/Borrower Name"
                            value={formData.lenderName}
                            onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                            placeholder="Enter name"
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type</label>
                            <select
                                value={formData.loanType}
                                onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                            >
                                <option value="borrowed">Borrowed (I owe)</option>
                                <option value="lent">Lent (They owe me)</option>
                            </select>
                        </div>
                        <FormInput
                            label="Loan Amount"
                            type="number"
                            value={formData.loanAmount}
                            onChange={(e) => setFormData({ ...formData, loanAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            required
                        />
                        <FormInput
                            label="Interest Rate (% p.a.)"
                            type="number"
                            value={formData.interestRate}
                            onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            required
                        />
                        <FormInput
                            label="Tenure (months)"
                            type="number"
                            value={formData.tenure}
                            onChange={(e) => setFormData({ ...formData, tenure: parseInt(e.target.value) || 12 })}
                            required
                        />
                        <FormInput
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                        <FormInput
                            label="EMI Amount"
                            type="number"
                            value={formData.emiAmount}
                            onChange={(e) => setFormData({ ...formData, emiAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            required
                        />
                        <FormInput
                            label="Purpose"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder="Purpose of loan"
                        />
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
                            Add Loan
                        </button>
                        <button
                            onClick={() => setShowAddLoan(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Pay EMI Form */}
            {showPayEMI && selectedLoan && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Pay EMI</h2>
                    <div className="p-4 bg-indigo-50 rounded-lg mb-4">
                        <p className="text-sm text-gray-600 mb-1">Loan Account</p>
                        <p className="font-bold text-gray-900">{selectedLoan.lenderName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">EMI Amount</p>
                            <p className="text-2xl font-bold text-indigo-600">₹{selectedLoan.emiAmount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Due Date</p>
                            <p className="font-bold text-gray-900">{selectedLoan.nextEMIDate}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormInput
                            label="Payment Date"
                            type="date"
                            value={new Date().toISOString().split('T')[0]}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                            <select className="w-full px-4 py-2 border rounded-lg">
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Cheque</option>
                                <option value="upi">UPI</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="Transaction reference"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            Pay EMI
                        </button>
                        <button
                            onClick={() => setShowPayEMI(false)}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* EMI Schedule */}
            {showEMISchedule && selectedLoan && (
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">EMI Schedule - {selectedLoan.lenderName}</h2>
                    <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Loan Amount</p>
                                <p className="font-bold">₹{selectedLoan.loanAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Interest Rate</p>
                                <p className="font-bold">{selectedLoan.interestRate}% p.a.</p>
                            </div>
                            <div>
                                <p className="text-gray-600">EMI Amount</p>
                                <p className="font-bold">₹{selectedLoan.emiAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMI No</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMI Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {generateEMISchedule(selectedLoan).map((emi) => (
                                    <tr key={emi.emiNo} className={emi.status === 'paid' ? 'bg-green-50' : ''}>
                                        <td className="px-4 py-3 font-medium">{emi.emiNo}</td>
                                        <td className="px-4 py-3">₹{emi.emiAmount.toFixed(2)}</td>
                                        <td className="px-4 py-3">₹{emi.principal.toFixed(2)}</td>
                                        <td className="px-4 py-3">₹{emi.interest.toFixed(2)}</td>
                                        <td className="px-4 py-3">₹{emi.balance.toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emi.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {emi.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        onClick={() => setShowEMISchedule(false)}
                        className="mt-4 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Loan Accounts List */}
            <div className="space-y-4">
                {loans.map((loan) => (
                    <div key={loan.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{loan.lenderName}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(loan.status)}`}>
                                        {loan.status}
                                    </span>
                                    <span className={`font-semibold capitalize ${getLoanTypeColor(loan.loanType)}`}>
                                        {loan.loanType}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">Started on {loan.startDate}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600 mb-1">Balance Remaining</p>
                                <p className="text-2xl font-bold text-indigo-600">₹{loan.balanceRemaining.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Loan Amount</p>
                                <p className="font-bold text-gray-900">₹{loan.loanAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Interest Rate</p>
                                <p className="font-bold text-gray-900">{loan.interestRate}% p.a.</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">EMI Amount</p>
                                <p className="font-bold text-gray-900">₹{loan.emiAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Tenure</p>
                                <p className="font-bold text-gray-900">{loan.tenure} months</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">EMIs Paid</p>
                                <p className="font-bold text-gray-900">{loan.paidEMIs} / {loan.tenure}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{Math.round((loan.paidEMIs / loan.tenure) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                    style={{ width: `${(loan.paidEMIs / loan.tenure) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            {loan.nextEMIDate && (
                                <p className="text-sm text-gray-600">
                                    Next EMI: <span className="font-medium text-gray-900">{loan.nextEMIDate}</span>
                                </p>
                            )}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => { setSelectedLoan(loan); setShowEMISchedule(true); }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                                >
                                    View Schedule
                                </button>
                                {loan.status === 'active' && (
                                    <button
                                        onClick={() => { setSelectedLoan(loan); setShowPayEMI(true); }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                                    >
                                        Pay EMI
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Layout>
    );
};

export default LoanAccounts;
