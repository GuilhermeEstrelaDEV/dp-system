import type { ApiErrorResponse, ApiSuccessResponse } from '@dp-system/types';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function apiRequest<TData>(path: string, init?: RequestInit): Promise<TData> {
  const response = await fetch(`${apiBaseUrl}/v1${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const payload = (await response.json()) as ApiSuccessResponse<TData> | ApiErrorResponse;
  if (!response.ok || 'error' in payload)
    throw new Error('error' in payload ? payload.error.message : 'Erro na comunicação com a API');
  return payload.data;
}
