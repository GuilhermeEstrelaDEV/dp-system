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
import { ApiClientError, apiRequest, configureApiSession } from '@/lib/api';
import {
  sanitizeStoredSession,
  type AuthenticatedUser,
  type AvailableCompany,
  type StoredSession,
} from './authSession';

export type { AuthenticatedUser, AvailableCompany } from './authSession';
type TokenResponse = { accessToken: string; tokenType: 'Bearer' };
type AuthContextValue = {
  token: string | null;
  user: AuthenticatedUser | null;
  activeCompanyId: string | null;
  companies: AvailableCompany[];
  capabilities: readonly string[];
  isLoading: boolean;
  isInitializing: boolean;
  sessionError: string | null;
  login(email: string, password: string): Promise<void>;
  selectCompany(companyId: string): Promise<void>;
  logout(): Promise<void>;
  hasCapability(capability: string): boolean;
};

const storageKey = 'dp-system.session.v1';
const shouldRevalidateStoredSession = import.meta.env.MODE !== 'test';
const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): StoredSession | null {
  try {
    const value = sessionStorage.getItem(storageKey);
    return value ? sanitizeStoredSession(JSON.parse(value) as unknown) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<StoredSession | null>(() => readSession());
  const [isLoading, setLoading] = useState(false);
  const [isInitializing, setInitializing] = useState(
    () => session !== null && shouldRevalidateStoredSession,
  );
  const [sessionError, setSessionError] = useState<string | null>(null);
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    configureApiSession({ token: session?.token ?? null, onUnauthorized: clearSession });
    if (session) sessionStorage.setItem(storageKey, JSON.stringify(session));
  }, [clearSession, session]);

  const loadContext = useCallback(async (token: string) => {
    configureApiSession({ token });
    const [user, companies] = await Promise.all([
      apiRequest<AuthenticatedUser>('/auth/me'),
      apiRequest<AvailableCompany[]>('/auth/companies'),
    ]);
    if (
      !user ||
      typeof user !== 'object' ||
      typeof user.actorId !== 'string' ||
      !Array.isArray(user.permissions) ||
      !Array.isArray(companies)
    ) {
      throw new Error('Resposta de sessão inválida.');
    }
    const next = sanitizeStoredSession({ token, user, companies });
    if (!next) throw new Error('Resposta de sessÃ£o invÃ¡lida.');
    return next;
  }, []);

  useEffect(() => {
    if (!shouldRevalidateStoredSession) return;
    if (!session?.token) {
      setInitializing(false);
      return;
    }
    let active = true;
    loadContext(session.token)
      .then((next) => {
        if (active) setSession(next);
      })
      .catch((error: unknown) => {
        if (active && !(error instanceof ApiClientError && error.kind === 'unauthorized'))
          setSessionError(
            'A API local está indisponível. A sessão foi preservada para nova tentativa.',
          );
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
    // The stored session is revalidated once at startup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setSessionError(null);
      try {
        const token = await apiRequest<TokenResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        const next = await loadContext(token.accessToken);
        if (next.companies.length === 0) throw new Error('Usuário sem vínculo empresarial ativo.');
        setSession(next);
      } catch (error: unknown) {
        const message =
          error instanceof ApiClientError && error.kind === 'unauthorized'
            ? 'E-mail ou senha inválidos.'
            : error instanceof ApiClientError && error.kind === 'network'
              ? 'A API local está indisponível. Verifique pnpm demo:status.'
              : error instanceof Error
                ? error.message
                : 'Falha ao carregar a sessão.';
        setSessionError(message);
        configureApiSession({ token: null });
        throw new Error(message);
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
        setSession(await loadContext(token.accessToken));
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

  const logout = useCallback(async () => {
    try {
      if (session?.token)
        await apiRequest<{ revoked: boolean }>('/auth/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  }, [clearSession, session?.token]);
  const value = useMemo<AuthContextValue>(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      activeCompanyId: session?.user.activeCompanyId ?? null,
      companies: session?.companies ?? [],
      capabilities: session?.user.permissions ?? [],
      isLoading,
      isInitializing,
      sessionError,
      login,
      selectCompany,
      logout,
      hasCapability: (capability) => session?.user.permissions.includes(capability) ?? false,
    }),
    [isInitializing, isLoading, login, logout, selectCompany, session, sessionError],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}

// Runtime routes always use AuthProvider; isolated feature tests may render a page without it.
// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalAuth() {
  return useContext(AuthContext);
}
