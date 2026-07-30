import { type FormEvent, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '@/components/brand/Brand';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Spinner,
} from '@/components/common/Primitives';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  if (auth.token)
    return <Navigate to={auth.activeCompanyId ? '/' : '/selecionar-empresa'} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (auth.isLoading) return;
    setError(undefined);
    try {
      await auth.login(email.trim().toLowerCase(), password);
      navigate('/selecionar-empresa', { replace: true, state: location.state });
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível entrar.');
    } finally {
      setPassword('');
    }
  }

  const message = error ?? auth.sessionError;
  return (
    <main className="auth-layout">
      <section className="auth-layout__intro" aria-label="Apresentação do DP-System">
        <Brand inverse />
        <div>
          <p className="auth-layout__eyebrow">
            {isDemoMode ? 'Ambiente local de demonstração' : 'Gestão de Departamento Pessoal'}
          </p>
          <h1>Departamento Pessoal com contexto, segurança e rastreabilidade.</h1>
          <p>
            Uma experiência integrada para apoiar as rotinas do DP sem ocultar os limites atuais do
            protótipo.
          </p>
        </div>
        {isDemoMode && <small>Dados fictícios · Data-base 01/07/2026</small>}
      </section>
      <section className="auth-layout__form" aria-labelledby="login-title">
        <div className="auth-layout__mobile-brand">
          <Brand />
        </div>
        <p className="auth-layout__eyebrow">Acesso seguro</p>
        <h2 id="login-title">Entrar no DP-System</h2>
        <p>Use suas credenciais existentes para acessar as empresas autorizadas.</p>
        <form className="auth-form" onSubmit={submit} noValidate>
          <label htmlFor="login-email">E-mail</label>
          <Input
            aria-describedby={message ? 'login-error' : undefined}
            autoComplete="username"
            id="login-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <label htmlFor="login-password">Senha</label>
          <Input
            aria-describedby={message ? 'login-error' : undefined}
            autoComplete="current-password"
            id="login-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <Button disabled={auth.isLoading} type="submit">
            {auth.isLoading ? <Spinner label="Entrando" /> : 'Entrar'}
          </Button>
          {message && (
            <div id="login-error">
              <Alert tone="danger">{message}</Alert>
            </div>
          )}
          {isDemoMode && (
            <Card>
              <Badge tone="warning">Ambiente de demonstração</Badge>
              <strong>Conta demonstrativa</strong>
              <p>Administrador Demo · uso fictício e exclusivamente local.</p>
              <Button
                onClick={() => setEmail('admin.demo@dp-system.local')}
                type="button"
                variant="ghost"
              >
                Preencher e-mail demo
              </Button>
            </Card>
          )}
        </form>
      </section>
    </main>
  );
}

export function CompanySelectionPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/';
  const [error, setError] = useState<string>();
  if (!auth.token) return <Navigate to="/login" replace />;
  return (
    <main className="selection-page">
      <div className="selection-page__header">
        <Brand />
        <Button onClick={() => void auth.logout()} variant="ghost">
          Encerrar sessão local
        </Button>
      </div>
      <section aria-labelledby="company-selection-title" className="selection-page__content">
        <p className="auth-layout__eyebrow">Contexto empresarial</p>
        <h1 id="company-selection-title">Selecionar empresa</h1>
        <p>Escolha a empresa em que você deseja atuar nesta sessão.</p>
        <ul aria-label="Empresas disponíveis" className="company-grid">
          {auth.companies.map((company) => (
            <li key={company.id}>
              <Card>
                <span aria-hidden="true" className="company-card__symbol">
                  {company.tradeName.slice(0, 2).toUpperCase()}
                </span>
                <strong>{company.tradeName}</strong>
                <p>{company.legalName}</p>
                {company.id === auth.activeCompanyId && <p>Empresa ativa</p>}
                <Button
                  disabled={auth.isLoading}
                  onClick={async () => {
                    try {
                      await auth.selectCompany(company.id);
                      navigate(returnTo, { replace: true });
                    } catch (caught: unknown) {
                      setError(
                        caught instanceof Error ? caught.message : 'Falha ao selecionar empresa.',
                      );
                    }
                  }}
                >
                  Acessar empresa
                </Button>
              </Card>
            </li>
          ))}
        </ul>
        {auth.companies.length === 0 && (
          <Alert tone="warning">Nenhuma empresa ativa está vinculada a esta identidade.</Alert>
        )}
        {error && <Alert tone="danger">{error}</Alert>}
      </section>
    </main>
  );
}

export function AuthenticatedRoute() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.isInitializing) return <Spinner label="Validando sessão" />;
  if (!auth.token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!auth.activeCompanyId) return <Navigate to="/selecionar-empresa" replace />;
  return <Outlet />;
}

export function CapabilityRoute({ capability }: { readonly capability: string }) {
  const auth = useAuth();
  if (!auth.hasCapability(capability))
    return (
      <section aria-label="Acesso restrito">
        <h1 className="sr-only">Acesso restrito</h1>
        <EmptyState
          title="Recurso não disponível"
          description="Sua identidade está autenticada, mas o contexto atual não possui acesso a este recurso. Nenhum dado foi carregado."
          action={
            <nav aria-label="Alternativas seguras" className="flex flex-wrap justify-center gap-2">
              <Link className="ui-button ui-button--primary" to="/">
                Voltar ao dashboard
              </Link>
              {auth.companies.length > 1 && (
                <Link className="ui-button ui-button--secondary" to="/selecionar-empresa">
                  Trocar empresa
                </Link>
              )}
            </nav>
          }
        />
      </section>
    );
  return <Outlet />;
}
