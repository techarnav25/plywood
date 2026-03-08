import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import AppHeader from './AppHeader.jsx';
import AppFooter from './AppFooter.jsx';
import { useDarkMode } from '../../hooks/useDarkMode.js';
import { useState } from 'react';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDarkMode, setIsDarkMode } = useDarkMode();

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-[1400px] px-3 pb-6 pt-3 sm:px-5 sm:pt-4 lg:px-7 lg:pt-6">
          <AppHeader
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
          <Outlet />
          <AppFooter />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
