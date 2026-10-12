import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  const location = useLocation();

  // On small screens, auto-close sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMenuOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-1 h-screen w-screen overflow-hidden bg-[#faf9fc] dark:bg-[#0f0e17] text-gray-900 dark:text-gray-100 transition-colors duration-300 relative">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Toggle Sidebar Button when closed */}
        {!isMenuOpen && (
          <div className="absolute top-3 left-3 z-30">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="
                flex items-center gap-2 p-2.5 px-3 rounded-xl
                bg-white/80 dark:bg-[#1a1727]/80 backdrop-blur-md
                border border-purple-200/70 dark:border-purple-900/50
                text-gray-700 dark:text-gray-200
                hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300
                shadow-md shadow-purple-500/5 hover:shadow-purple-500/15
                transition-all duration-200 active:scale-95 cursor-pointer
              "
              title="Open Sidebar"
              aria-label="Open Sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m14 15 3-3-3-3" />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Sidebar</span>
            </button>
          </div>
        )}

        <Outlet context={{ isMenuOpen, setIsMenuOpen }} />
      </main>
    </div>
  );
}

export default Layout;
