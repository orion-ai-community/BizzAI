import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Layout from '../components/Layout';
import { getAllExpenses } from '../redux/slices/expenseSlice';
import { getAllBills } from '../redux/slices/billSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { expenses } = useSelector((state) => state.expense);
  const { bills } = useSelector((state) => state.bill);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      dispatch(getAllExpenses());
      dispatch(getAllBills());
      // Trigger fade-in animation
      setTimeout(() => setFadeIn(true), 50);
    }
  }, [user, navigate, dispatch]);

  if (!user) {
    return null;
  }

  // Calculate expense metrics
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses.filter(exp => {
    const expenseDate = new Date(exp.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate bill metrics
  const totalBillsAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalOutstanding = bills.filter(bill => bill.status === 'unpaid').reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <Layout>
      <div className={`transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-[rgb(var(--color-primary))] dark:to-[rgb(var(--color-primary-hover))] rounded-2xl p-8 mb-8 text-white flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="text-indigo-100 dark:text-white/80">
              Here's your account overview and business insights
            </p>
          </div>
          <button
            onClick={() => navigate('/profile-settings')}
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-100 dark:bg-white/10 dark:hover:bg-white/20 text-indigo-600 dark:text-white rounded-lg transition-colors duration-150 font-medium whitespace-nowrap"
            title="Edit your Profile"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>Edit your Profile</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-xl shadow-md dark:shadow-lg p-5 mb-6 border border-gray-100 dark:border-[rgb(var(--color-border))]">
          <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-[rgb(var(--color-border))]">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-[rgb(var(--color-primary))] dark:to-[rgb(var(--color-primary-hover))] rounded-full flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">{user.name}</h3>
              <p className="text-sm text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            {/* Email */}
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200/50 dark:border-blue-700/50">
              <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg shadow-sm">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">Email</p>
                <p className="text-gray-900 dark:text-[rgb(var(--color-text))] font-medium">
                  {user.email || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-700/50">
              <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-lg shadow-sm">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Phone</p>
                <p className="text-gray-900 dark:text-[rgb(var(--color-text))] font-semibold text-sm truncate">
                  {user.phone || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200/50 dark:border-yellow-700/50">
              <div className="p-2 bg-yellow-600 dark:bg-yellow-500 rounded-lg shadow-sm">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">Role</p>
                <p className="text-gray-900 dark:text-[rgb(var(--color-text))] font-semibold text-sm capitalize truncate">
                  {user.role || 'Owner'}
                </p>
              </div>
            </div>

            {/* Shop Name */}
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 border border-green-200/50 dark:border-green-700/50">
              <div className="p-2 bg-green-600 dark:bg-green-500 rounded-lg shadow-sm">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5.5m-9.5 0H3m2 0h5.5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-[rgb(var(--color-text-secondary))]">Shop Name</p>
                <p className="text-gray-900 dark:text-[rgb(var(--color-text))] font-medium">
                  {user.shopName || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Total Invoices */}
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-lg shadow-md dark:shadow-lg p-4 border border-gray-100 dark:border-[rgb(var(--color-border))] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] text-xs font-semibold uppercase tracking-wide mb-1.5">Total Invoices</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">0</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-lg shadow-md dark:shadow-lg p-4 border border-gray-100 dark:border-[rgb(var(--color-border))] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] text-xs font-semibold uppercase tracking-wide mb-1.5">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">₹0.00</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-lg shadow-md dark:shadow-lg p-4 border border-gray-100 dark:border-[rgb(var(--color-border))] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] text-xs font-semibold uppercase tracking-wide mb-1.5">Total Expenses</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">₹{totalExpenses.toFixed(0)}</p>
          </div>

          {/* This Month Expenses */}
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-lg shadow-md dark:shadow-lg p-4 border border-gray-100 dark:border-[rgb(var(--color-border))] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 dark:from-[rgb(var(--color-primary))] dark:to-[rgb(var(--color-primary-hover))] rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] text-xs font-semibold uppercase tracking-wide mb-1.5">This Month Expenses</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">₹{thisMonthExpenses.toFixed(0)}</p>
          </div>

          {/* Total Bills Amount */}
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-lg shadow-md dark:shadow-lg p-4 border border-gray-100 dark:border-[rgb(var(--color-border))] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] text-xs font-semibold uppercase tracking-wide mb-1.5">Total Bills Amount</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">₹{totalBillsAmount.toFixed(0)}</p>
          </div>

          {/* Outstanding Bills */}
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-lg shadow-md dark:shadow-lg p-4 border border-gray-100 dark:border-[rgb(var(--color-border))] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] text-xs font-semibold uppercase tracking-wide mb-1.5">Outstanding Bills</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">₹{totalOutstanding.toFixed(0)}</p>
          </div>

          {/* Pending Payments */}
          <div className="bg-white dark:bg-[rgb(var(--color-card))] rounded-lg shadow-md dark:shadow-lg p-4 border border-gray-100 dark:border-[rgb(var(--color-border))] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 rounded-lg shadow-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] text-xs font-semibold uppercase tracking-wide mb-1.5">
              Pending Payments
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))]">0</p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-[rgb(var(--color-card))] dark:to-[rgb(var(--color-card))] rounded-xl shadow-md dark:shadow-lg p-8 text-center border border-indigo-100 dark:border-[rgb(var(--color-border))]">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-[rgb(var(--color-primary))] dark:to-[rgb(var(--color-primary-hover))] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-[rgb(var(--color-text))] mb-2">
              More Features Coming Soon!
            </h3>
            <p className="text-gray-600 dark:text-[rgb(var(--color-text-secondary))] text-sm">
              We're working on adding invoices, customers, products, and
              reports to make your billing experience seamless.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard