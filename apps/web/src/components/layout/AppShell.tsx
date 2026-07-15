import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    queueMicrotask(() => mobileMenuTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileMenu();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <div id="desktop-sidebar">
          <Sidebar collapsed={isSidebarCollapsed} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            isMobileMenuOpen={isMobileMenuOpen}
            isSidebarCollapsed={isSidebarCollapsed}
            mobileMenuTriggerRef={mobileMenuTriggerRef}
            onMobileMenuToggle={() =>
              isMobileMenuOpen ? closeMobileMenu() : setIsMobileMenuOpen(true)
            }
            onSidebarToggle={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
          />
          <main className="w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Breadcrumbs />
            <Outlet />
          </main>
        </div>
      </div>
      {isMobileMenuOpen && <MobileNavigation onClose={closeMobileMenu} />}
    </div>
  );
}
