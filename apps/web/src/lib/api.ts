import type { ApiErrorResponse, ApiSuccessResponse } from '@dp-system/types';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export type ApiErrorKind =
  'validation' | 'unauthorized' | 'forbidden' | 'not-found' | 'conflict' | 'server' | 'network';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind: ApiErrorKind,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type ApiSession = { token: string | null; onUnauthorized?: () => void };
let apiSession: ApiSession = { token: null };

export function configureApiSession(session: ApiSession) {
  apiSession = session;
}

function errorKind(status: number): ApiErrorKind {
  if (status === 400) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  return 'server';
}

function correlationId() {
  return globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}`;
}

export async function apiRequest<TData>(path: string, init?: RequestInit): Promise<TData> {
  const headers = new Headers(init?.headers);
  headers.set('content-type', 'application/json');
  headers.set('x-correlation-id', correlationId());
  if (apiSession.token) headers.set('authorization', `Bearer ${apiSession.token}`);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/v1${path}`, { ...init, headers });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiClientError('Não foi possível conectar à API.', 0, 'network');
  }

  const payload = (await response.json().catch(() => undefined)) as
    ApiSuccessResponse<TData> | ApiErrorResponse | undefined;
  if (!response.ok || !payload || 'error' in payload) {
    if (response.status === 401) apiSession.onUnauthorized?.();
    const message =
      payload && 'error' in payload ? payload.error.message : 'Erro na comunicação com a API';
    const traceId =
      payload?.meta?.correlationId ?? response.headers.get('x-correlation-id') ?? undefined;
    throw new ApiClientError(message, response.status, errorKind(response.status), traceId);
  }
  return payload.data;
}
