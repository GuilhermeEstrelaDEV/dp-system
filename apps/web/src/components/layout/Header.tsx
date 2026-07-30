import type { RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, IconButton, Spinner } from '@/components/common/Primitives';
import { useAuth } from '@/features/auth/AuthContext';

interface HeaderProps {
  readonly isMobileMenuOpen: boolean;
  readonly isSidebarCollapsed: boolean;
  readonly mobileMenuTriggerRef: RefObject<HTMLButtonElement | null>;
  readonly onMobileMenuToggle: () => void;
  readonly onSidebarToggle: () => void;
}

export function Header(props: HeaderProps) {
  const {
    isMobileMenuOpen,
    isSidebarCollapsed,
    mobileMenuTriggerRef,
    onMobileMenuToggle,
    onSidebarToggle,
  } = props;
  const auth = useAuth();
  const navigate = useNavigate();
  const company = auth.companies.find((item) => item.id === auth.activeCompanyId);
  const actorLabel = auth.user?.displayName ?? 'Usuário';

  return (
    <header className="app-topbar">
      <div className="app-topbar__start">
        <IconButton
          aria-controls="mobile-navigation"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          className="lg:hidden"
          onClick={onMobileMenuToggle}
          ref={mobileMenuTriggerRef}
          type="button"
        >
          <span aria-hidden="true">☰</span>
        </IconButton>
        <IconButton
          aria-controls="desktop-sidebar"
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className="hidden lg:inline-flex"
          onClick={onSidebarToggle}
          type="button"
        >
          <span aria-hidden="true">{isSidebarCollapsed ? '»' : '«'}</span>
        </IconButton>
        <div className="app-topbar__context">
          <span className="app-topbar__eyebrow">Contexto empresarial</span>
          <button
            className="app-topbar__company"
            onClick={() => navigate('/selecionar-empresa')}
            type="button"
          >
            {company?.tradeName ?? 'Selecionar empresa'} <span aria-hidden="true">⌄</span>
          </button>
        </div>
      </div>
      <div className="app-topbar__end">
        {auth.isLoading && <Spinner label="Atualizando" />}
        <Badge tone="warning">Ambiente local · Demo</Badge>
        <div className="user-menu">
          <span aria-hidden="true" className="user-menu__avatar">
            {actorLabel.slice(-2).toUpperCase()}
          </span>
          <span className="user-menu__copy">
            <strong>{actorLabel}</strong>
            <small>{auth.user?.email}</small>
            <small>{auth.user?.roleCodes?.join(', ') || 'Sem papel ativo'}</small>
          </span>
          <Button onClick={() => void auth.logout()} type="button" variant="ghost">
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
