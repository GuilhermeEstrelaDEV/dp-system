import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest, configureApiSession } from '@/lib/api';

export type AuthenticatedUser = {
  actorId: string;
  permissions: string[];
  activeCompanyId: string | null;
};
export type AvailableCompany = { id: string; legalName: string; tradeName: string };
type TokenResponse = { accessToken: string; tokenType: 'Bearer' };
type StoredSession = { token: string; user: AuthenticatedUser; companies: AvailableCompany[] };

type AuthContextValue = {
  token: string | null;
  user: AuthenticatedUser | null;
  activeCompanyId: string | null;
  companies: AvailableCompany[];
  capabilities: readonly string[];
  isLoading: boolean;
  sessionError: string | null;
  login(email: string, password: string): Promise<void>;
  selectCompany(companyId: string): Promise<void>;
  logout(): void;
  hasCapability(capability: string): boolean;
};

const storageKey = 'dp-system.session.v1';
const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): StoredSession | null {
  try {
    const value = sessionStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<StoredSession | null>(() => readSession());
  const [isLoading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setSession(null);
    setSessionError(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    configureApiSession({ token: session?.token ?? null, onUnauthorized: logout });
    if (session) sessionStorage.setItem(storageKey, JSON.stringify(session));
  }, [logout, session]);

  const loadContext = useCallback(async (token: string) => {
    configureApiSession({ token });
    const [user, companies] = await Promise.all([
      apiRequest<AuthenticatedUser>('/auth/me'),
      apiRequest<AvailableCompany[]>('/auth/companies'),
    ]);
    return { token, user, companies } satisfies StoredSession;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setSessionError(null);
      try {
        const token = await apiRequest<TokenResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        const next = await loadContext(token.accessToken);
        if (next.companies.length === 0) throw new Error('Usuário sem vínculo empresarial ativo.');
        setSession(next);
      } catch (error: unknown) {
        setSessionError(error instanceof Error ? error.message : 'Falha ao carregar a sessão.');
        configureApiSession({ token: null });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadContext],
  );

  const selectCompany = useCallback(
    async (companyId: string) => {
      setLoading(true);
      setSessionError(null);
      try {
        const token = await apiRequest<TokenResponse>('/auth/context', {
          method: 'POST',
          body: JSON.stringify({ companyId }),
        });
        const next = await loadContext(token.accessToken);
        setSession(next);
        queryClient.clear();
      } catch (error: unknown) {
        setSessionError(error instanceof Error ? error.message : 'Falha ao selecionar a empresa.');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadContext, queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      activeCompanyId: session?.user.activeCompanyId ?? null,
      companies: session?.companies ?? [],
      capabilities: session?.user.permissions ?? [],
      isLoading,
      sessionError,
      login,
      selectCompany,
      logout,
      hasCapability: (capability) => session?.user.permissions.includes(capability) ?? false,
    }),
    [isLoading, login, logout, selectCompany, session, sessionError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The provider and its hook intentionally share the private context contract.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
