import type { RefObject } from 'react';

interface HeaderProps {
  readonly isMobileMenuOpen: boolean;
  readonly isSidebarCollapsed: boolean;
  readonly mobileMenuTriggerRef: RefObject<HTMLButtonElement | null>;
  readonly onMobileMenuToggle: () => void;
  readonly onSidebarToggle: () => void;
}

export function Header({
  isMobileMenuOpen,
  isSidebarCollapsed,
  mobileMenuTriggerRef,
  onMobileMenuToggle,
  onSidebarToggle,
}: HeaderProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 lg:hidden"
          onClick={onMobileMenuToggle}
          ref={mobileMenuTriggerRef}
          type="button"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ☰
          </span>
        </button>
        <button
          aria-controls="desktop-sidebar"
          aria-expanded={!isSidebarCollapsed}
          className="hidden rounded-md p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 lg:block"
          onClick={onSidebarToggle}
          type="button"
        >
          <span className="sr-only">
            {isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          </span>
          <span aria-hidden="true">{isSidebarCollapsed ? '»' : '«'}</span>
        </button>
        <span className="truncate text-sm font-medium text-slate-700">
          Portal de Departamento Pessoal
        </span>
      </div>
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
        Ambiente demonstrativo
      </span>
    </header>
  );
}
