import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize expandedMenus from localStorage
  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarExpandedMenus');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist expandedMenus to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('sidebarExpandedMenus', JSON.stringify(expandedMenus));
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  }, [expandedMenus]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        expandedMenus={expandedMenus}
        setExpandedMenus={setExpandedMenus}
      />
      <div className={`flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-sm lg:hidden print:hidden sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-semibold text-gray-900">BizzAI</span>
          <div className="w-10" aria-hidden="true" />
        </header>

        <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;