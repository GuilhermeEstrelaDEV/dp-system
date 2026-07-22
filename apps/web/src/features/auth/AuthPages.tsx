import { type FormEvent, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  if (auth.token)
    return <Navigate to={auth.activeCompanyId ? '/' : '/selecionar-empresa'} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      await auth.login(email, password);
      navigate('/selecionar-empresa', { replace: true });
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível entrar.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section
        className="w-full rounded-xl border bg-white p-6 shadow-sm"
        aria-labelledby="login-title"
      >
        <h1 id="login-title" className="text-2xl font-semibold">
          Entrar no DP-System
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Use suas credenciais para acessar as empresas autorizadas.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={submit} noValidate>
          <label className="grid gap-1">
            E-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-1">
            Senha
            <input
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            disabled={auth.isLoading}
            className="rounded bg-sky-700 px-4 py-2 font-medium text-white"
          >
            {auth.isLoading ? 'Entrando…' : 'Entrar'}
          </button>
          {(error ?? auth.sessionError) ? (
            <p role="alert" className="text-sm text-red-700">
              {error ?? auth.sessionError}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}

export function CompanySelectionPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  if (!auth.token) return <Navigate to="/login" replace />;
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Selecionar empresa</h1>
      <p className="mt-2">Escolha o contexto empresarial desta sessão.</p>
      <ul className="mt-6 grid gap-3" aria-label="Empresas disponíveis">
        {auth.companies.map((company) => (
          <li key={company.id} className="rounded border bg-white p-4">
            <strong>{company.tradeName}</strong>
            <p className="text-sm text-slate-600">{company.legalName}</p>
            <button
              className="mt-3 rounded border px-3 py-2"
              disabled={auth.isLoading}
              onClick={async () => {
                try {
                  await auth.selectCompany(company.id);
                  navigate('/', { replace: true });
                } catch (caught: unknown) {
                  setError(
                    caught instanceof Error ? caught.message : 'Falha ao selecionar empresa.',
                  );
                }
              }}
            >
              Acessar empresa
            </button>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      ) : null}
      <button className="mt-6" onClick={auth.logout}>
        Encerrar sessão local
      </button>
    </main>
  );
}

export function AuthenticatedRoute() {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!auth.activeCompanyId) return <Navigate to="/selecionar-empresa" replace />;
  return <Outlet />;
}

export function CapabilityRoute({ capability }: { readonly capability: string }) {
  const auth = useAuth();
  if (!auth.hasCapability(capability))
    return (
      <main>
        <h1>Acesso negado</h1>
        <p>Seu contexto atual não possui a capacidade necessária.</p>
      </main>
    );
  return <Outlet />;
}
