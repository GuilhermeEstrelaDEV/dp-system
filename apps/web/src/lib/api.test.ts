import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, ApiClientError, configureApiSession } from './api';

const meta = { correlationId: 'trace-error', timestamp: new Date(0).toISOString(), path: '/test' };

describe('typed API client', () => {
  afterEach(() => configureApiSession({ token: null }));

  it.each([
    [400, 'validation'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [500, 'server'],
  ] as const)('normalizes HTTP %s', async (status, kind) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: 'ERROR', message: 'Falha controlada' }, meta }),
        { status },
      ),
    );
    const error = await apiRequest('/test').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ status, kind, traceId: 'trace-error' });
  });

  it('expires the local session on 401 and sends bearer and correlation headers', async () => {
    const expired = vi.fn();
    configureApiSession({ token: 'secret-token', onUnauthorized: expired });
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Token expirado' }, meta }),
          { status: 401 },
        ),
      );
    await expect(apiRequest('/test')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(expired).toHaveBeenCalledOnce();
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get('authorization')).toBe('Bearer secret-token');
    expect(headers.get('x-correlation-id')).toBeTruthy();
  });
});
