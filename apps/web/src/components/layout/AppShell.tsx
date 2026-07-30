import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
import { Sidebar } from './Sidebar';
import { Spinner } from '@/components/common/Primitives';
import { DemoPresenterHelp } from '@/components/demo/DemoPresenterHelp';
import { useAuth } from '@/features/auth/AuthContext';

export function AppShell() {
  const auth = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoHelpOpen, setIsDemoHelpOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const demoHelpTriggerRef = useRef<HTMLButtonElement>(null);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    queueMicrotask(() => mobileMenuTriggerRef.current?.focus());
  };

  const closeDemoHelp = () => {
    setIsDemoHelpOpen(false);
    queueMicrotask(() => demoHelpTriggerRef.current?.focus());
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
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <div className="app-shell__frame">
        <div id="desktop-sidebar">
          <Sidebar collapsed={isSidebarCollapsed} />
        </div>
        <div className="app-shell__workspace">
          <Header
            demoHelpTriggerRef={demoHelpTriggerRef}
            isMobileMenuOpen={isMobileMenuOpen}
            isSidebarCollapsed={isSidebarCollapsed}
            mobileMenuTriggerRef={mobileMenuTriggerRef}
            onDemoHelpOpen={() => setIsDemoHelpOpen(true)}
            onMobileMenuToggle={() =>
              isMobileMenuOpen ? closeMobileMenu() : setIsMobileMenuOpen(true)
            }
            onSidebarToggle={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
          />
          <main className="app-content" id="main-content">
            <Breadcrumbs />
            <Outlet />
          </main>
        </div>
      </div>
      {isMobileMenuOpen && <MobileNavigation onClose={closeMobileMenu} />}
      {isDemoHelpOpen && import.meta.env.VITE_DEMO_MODE === 'true' && (
        <DemoPresenterHelp onClose={closeDemoHelp} />
      )}
      {auth.isLoading && (
        <div aria-live="polite" className="global-loading">
          <Spinner label="Atualizando contexto" />
        </div>
      )}
    </div>
  );
}
