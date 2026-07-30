import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge, Button } from '@/components/common/Primitives';
import { useAuth } from '@/features/auth/AuthContext';

const steps = [
  {
    match: '/',
    title: 'Dashboard da empresa ativa',
    next: 'Explique o estado restrito e a segurança deny-by-default.',
  },
  {
    match: '/colaboradores',
    title: 'Limite seguro das APIs legadas',
    next: 'Mostre que nenhum dado ou ação é carregado sem acesso.',
  },
  {
    match: '/selecionar-empresa',
    title: 'Troca de contexto empresarial',
    next: 'Selecione Horizonte ou Atlas e confirme o nome no cabeçalho.',
  },
] as const;

export function DemoPresenterHelp({ onClose }: { readonly onClose: () => void }) {
  const auth = useAuth();
  const location = useLocation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const company = auth.companies.find(({ id }) => id === auth.activeCompanyId);
  const step = steps.find(({ match }) => location.pathname === match) ?? {
    title: 'Navegação segura',
    next: 'Retorne ao dashboard para continuar o roteiro recomendado.',
  };

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div aria-labelledby="demo-help-title" aria-modal="true" className="demo-help" role="dialog">
      <button
        aria-label="Fechar ajuda pelo plano de fundo"
        className="demo-help__backdrop"
        onClick={onClose}
        type="button"
      />
      <aside className="demo-help__panel">
        <div className="demo-help__header">
          <div>
            <Badge tone="warning">Ambiente de demonstração</Badge>
            <h2 id="demo-help-title">Ajuda da demonstração</h2>
          </div>
          <Button onClick={onClose} ref={closeButtonRef} type="button" variant="ghost">
            Fechar
          </Button>
        </div>
        <p>Todos os dados são fictícios. Data-base do cenário: 01/07/2026.</p>
        <dl>
          <dt>Usuário atual</dt>
          <dd>{auth.user?.displayName ?? 'Não autenticado'}</dd>
          <dt>Empresa ativa</dt>
          <dd>{company?.tradeName ?? 'Selecione uma empresa'}</dd>
          <dt>Propósito desta tela</dt>
          <dd>{step.title}</dd>
          <dt>Próxima ação sugerida</dt>
          <dd>{step.next}</dd>
        </dl>
        {auth.capabilities.length === 0 && (
          <p role="status">
            Acesso restrito é esperado para as identidades demonstrativas sem grants.
          </p>
        )}
        <Link className="ui-button ui-button--primary" onClick={onClose} to="/">
          Voltar ao dashboard
        </Link>
      </aside>
    </div>
  );
}
