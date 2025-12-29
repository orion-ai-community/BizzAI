import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../redux/slices/authSlice';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = ({ isOpen = false, onClose = () => { }, isCollapsed = false, setIsCollapsed = () => { }, expandedMenus = {}, setExpandedMenus = () => { } }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
    onClose();
  };

  // Ref to preserve scroll position
  const navRef = useRef(null);
  const scrollPositionRef = useRef(0);

  // State for hover expansion (temporary)
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  // Determine effective expanded state
  const isEffectivelyExpanded = !isCollapsed || isHoverExpanded;

  // Restore scroll position from localStorage on mount
  useEffect(() => {
    if (navRef.current) {
      const savedScrollPosition = localStorage.getItem('sidebarScrollPosition');
      if (savedScrollPosition) {
        navRef.current.scrollTop = parseInt(savedScrollPosition, 10);
        scrollPositionRef.current = parseInt(savedScrollPosition, 10);
      }
    }
  }, []);

  // Preserve scroll position when state changes
  useEffect(() => {
    if (navRef.current && scrollPositionRef.current >= 0) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (navRef.current) {
          navRef.current.scrollTop = scrollPositionRef.current;
          // Save to localStorage
          localStorage.setItem('sidebarScrollPosition', scrollPositionRef.current.toString());
        }
      });
    }
  }, [expandedMenus]);

  // Hover handlers - only work when manually collapsed
  const handleMouseEnter = () => {
    if (isCollapsed) {
      setIsHoverExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      setIsHoverExpanded(false);
    }
  };

  // Toggle submenu expansion with scroll preservation
  const toggleSubmenu = (menuName) => {
    // Save current scroll position BEFORE state update
    if (navRef.current) {
      scrollPositionRef.current = navRef.current.scrollTop;
    }

    // Close all other dropdowns and toggle the clicked one
    setExpandedMenus(prev => {
      const isCurrentlyExpanded = prev[menuName];

      // If clicking an already open dropdown, just close it
      if (isCurrentlyExpanded) {
        return { ...prev, [menuName]: false };
      }

      // Otherwise, close all dropdowns and open only the clicked one
      return { [menuName]: true };
    });
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Sales',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      submenu: [
        { name: 'Sales Invoice', path: '/sales/invoice' },
        { name: 'Estimate / Proforma', path: '/sales/estimate' },
        { name: 'Payment In', path: '/sales/payment-in' },
        { name: 'Payment In List', path: '/sales/payment-in-list' },
        { name: 'Sales Order', path: '/sales/order' },
        { name: 'Delivery Challan', path: '/sales/delivery-challan' },
        { name: 'Return', path: '/sales/return' },
        { name: 'Returned Items', path: '/sales/returned-items' }
      ]
    },
    {
      name: 'Purchase',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      submenu: [
        { name: 'Purchase', path: '/purchase/entry' },
        { name: 'Bills', path: '/purchase/bills' },
        { name: 'Payment Out', path: '/purchase/payment-out' },
        { name: 'Expenses', path: '/purchase/expenses' },
        { name: 'Purchase Order', path: '/purchase/order' },
        { name: 'Purchase Return', path: '/purchase/return' }
      ]
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Suppliers',
      path: '/suppliers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Cash & Bank',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      submenu: [
        { name: 'Bank Accounts', path: '/cashbank/bank-accounts' },
        { name: 'Bank Summary', path: '/cashbank/summary' },
        { name: 'Cash/Bank Position', path: '/cashbank/position' },
        { name: 'Transfers', path: '/transfers' },
        { name: 'Cash in Hand', path: '/cashbank/cash-in-hand' },
        { name: 'Cheques', path: '/cashbank/cheques' },
        { name: 'Loan Accounts', path: '/cashbank/loan-accounts' }
      ]
    },
    {
      name: 'POS',
      path: '/pos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Grow Business',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      submenu: [
        { name: 'Online Shop', path: '/business/online-shop' },
        { name: 'Google Profile', path: '/business/google-profile' },
        { name: 'Marketing Tools', path: '/business/marketing-tools' },
        { name: 'WhatsApp Marketing', path: '/business/whatsapp-marketing' }
      ]
    },
    {
      name: 'Sync & Backup',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      submenu: [
        { name: 'Sync & Share', path: '/sync/share' },
        { name: 'Backup', path: '/sync/backup' },
        { name: 'Restore', path: '/sync/restore' }
      ]
    },
    {
      name: 'Utilities',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      submenu: [
        { name: 'Barcode Generator', path: '/utilities/barcode' },
        { name: 'Import Items', path: '/utilities/import-items' },
        { name: 'Business Setup', path: '/utilities/business-setup' },
        { name: 'Data Export', path: '/utilities/export' }
      ]
    }
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 z-40 transition-opacity duration-200 lg:hidden print:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`print:hidden fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-indigo-600 to-indigo-800 dark:from-[rgb(var(--color-card))] dark:to-[rgb(var(--color-card))] text-white dark:text-[rgb(var(--color-text))] flex flex-col shadow-2xl dark:border-r dark:border-[rgb(var(--color-border))] transition-all duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:shadow-none ${isEffectivelyExpanded ? 'w-64' : 'w-16'
          }`}
      >
        {/* Logo/Brand */}
        <div className="p-4 border-b border-indigo-500 dark:border-[rgb(var(--color-border))] flex items-center justify-between">
          {isEffectivelyExpanded ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white dark:bg-[rgb(var(--color-primary))] rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold">BizzAI</h1>
                  <p className="text-xs text-indigo-200 dark:text-[rgb(var(--color-text-secondary))]">Billing System</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-white hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white lg:hidden"
                aria-label="Close navigation menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <div className="p-1.5 bg-white dark:bg-[rgb(var(--color-primary))] rounded-lg">
                <svg className="w-5 h-5 text-indigo-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Buttons - Desktop Only */}
        <div className="hidden lg:flex items-center justify-center gap-2 p-2 border-b border-indigo-500 dark:border-[rgb(var(--color-border))]">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="p-1.5 rounded-lg text-white dark:text-[rgb(var(--color-text))] hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-input))] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-[rgb(var(--color-primary))]"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-white dark:text-[rgb(var(--color-text))] hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-input))] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white dark:focus:ring-[rgb(var(--color-primary))]"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav
          ref={navRef}
          onScroll={(e) => {
            const scrollTop = e.currentTarget.scrollTop;
            scrollPositionRef.current = scrollTop;
            // Save to localStorage immediately on scroll
            localStorage.setItem('sidebarScrollPosition', scrollTop.toString());
          }}
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden"
        >
          {menuItems.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`flex items-center w-full rounded-lg text-indigo-100 dark:text-[rgb(var(--color-text-secondary))] hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-input))] transition-all duration-150 ${isEffectivelyExpanded ? 'justify-between px-3 py-2' : 'justify-center px-2 py-2'
                      }`}
                    title={!isEffectivelyExpanded ? item.name : ''}
                  >
                    <div className={`flex items-center ${isEffectivelyExpanded ? 'space-x-2' : 'justify-center'}`}>
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                      {isEffectivelyExpanded && <span className="text-sm font-medium">{item.name}</span>}
                    </div>
                    {isEffectivelyExpanded && (
                      <svg
                        className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${expandedMenus[item.name] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  {expandedMenus[item.name] && isEffectivelyExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `block px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${isActive ? 'bg-white dark:bg-[rgb(var(--color-primary))] text-indigo-600 dark:text-white font-medium' : 'text-indigo-100 dark:text-[rgb(var(--color-text-secondary))] hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-input))]'
                            }`
                          }
                        >
                          {subItem.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg transition-all duration-150 ${isEffectivelyExpanded ? 'space-x-2 px-3 py-2' : 'justify-center px-2 py-2'
                    } ${isActive ? 'bg-white dark:bg-[rgb(var(--color-primary))] text-indigo-600 dark:text-white shadow-lg' : 'text-indigo-100 dark:text-[rgb(var(--color-text-secondary))] hover:bg-indigo-700 dark:hover:bg-[rgb(var(--color-input))]'
                    }`
                  }
                  title={!isEffectivelyExpanded ? item.name : ''}
                >
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  {isEffectivelyExpanded && <span className="text-sm font-medium">{item.name}</span>}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-indigo-500 dark:border-[rgb(var(--color-border))]">
          {isEffectivelyExpanded ? (
            <>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-indigo-400 dark:bg-[rgb(var(--color-primary))] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate">{user?.name}</p>
                  <p className="text-xs text-indigo-200 dark:text-[rgb(var(--color-text-secondary))] truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-indigo-400 dark:bg-[rgb(var(--color-primary))] rounded-full flex items-center justify-center" title={user?.name}>
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors duration-150"
                title="Logout"
                aria-label="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;