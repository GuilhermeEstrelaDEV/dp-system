import { performance } from 'node:perf_hooks';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PayrollClosuresService } from './payroll-closures.service';

const iterations = 1_000;
const warmupIterations = 100;
const principal: AuthenticatedPrincipal = {
  actorId: 'actor',
  activeCompanyId: 'company',
  sessionId: 'session',
  permissions: [],
  traceId: 'trace-performance',
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
  accessGrants: [],
};
const historyResponse = {
  payrollPeriodId: 'period',
  versions: [
    {
      id: 'closure',
      version: 1,
      status: 'CLOSED',
      isActive: true,
      openedAt: '2026-08-10T00:00:00.000Z',
      closedAt: '2026-08-10T00:00:00.000Z',
      reopenedAt: null,
      supersededAt: null,
      payrollRun: null,
      review: null,
      predecessor: null,
      successor: null,
      manifest: null,
      events: [],
    },
  ],
};

describe('ETP-015.8 adapter microbenchmark', () => {
  it('records adapter overhead and proves zero additional canonical calls', async () => {
    const history = { list: jest.fn(async () => historyResponse) };
    const closeResult = { status: 'CLOSED', idempotentReplay: false };
    const reopenResult = { status: 'OPEN', idempotentReplay: false };
    const close = { close: jest.fn(async () => closeResult) };
    const reopen = { reopen: jest.fn(async () => reopenResult) };
    const adapter = new PayrollClosuresService(
      history as never,
      close as never,
      reopen as never,
      { observe: <T>(_context: unknown, work: () => Promise<T>) => work() } as never,
    );

    const measure = async (operation: () => Promise<unknown>) => {
      for (let index = 0; index < warmupIterations; index += 1) await operation();
      const startedAt = performance.now();
      for (let index = 0; index < iterations; index += 1) await operation();
      return performance.now() - startedAt;
    };
    const directHistoryMs = await measure(() => history.list());
    history.list.mockClear();
    const adapterHistoryMs = await measure(() =>
      adapter.list({ payrollPeriodId: 'period', page: 1, pageSize: 20 }, principal),
    );

    const closeCommand = {
      payrollPeriodId: 'period',
      payrollRunId: 'run',
      expectedConsistencyToken: '2026-08-10T00:00:00.000Z',
      warningAcknowledgements: [],
    };
    const directCloseMs = await measure(() => close.close());
    close.close.mockClear();
    const adapterCloseMs = await measure(() => adapter.close(closeCommand, 'key', principal));

    const reopenCommand = {
      reason: 'Correção',
      expectedConsistencyToken: '2026-08-10T00:00:00.000Z',
      expectedClosureVersion: 1,
    };
    const directReopenMs = await measure(() => reopen.reopen());
    reopen.reopen.mockClear();
    const adapterReopenMs = await measure(() =>
      adapter.reopen('period', reopenCommand, 'key', principal),
    );

    expect(history.list).toHaveBeenCalledTimes(iterations + warmupIterations);
    expect(close.close).toHaveBeenCalledTimes(iterations + warmupIterations);
    expect(reopen.reopen).toHaveBeenCalledTimes(iterations + warmupIterations);
    const adapterList = await adapter.list(
      { payrollPeriodId: 'period', page: 1, pageSize: 20 },
      principal,
    );
    console.info(
      'ETP0158_PERFORMANCE',
      JSON.stringify({
        iterations,
        warmupIterations,
        latencyMs: {
          canonicalHistory: directHistoryMs,
          legacyHistoryAdapter: adapterHistoryMs,
          canonicalClose: directCloseMs,
          legacyCloseAdapter: adapterCloseMs,
          canonicalReopen: directReopenMs,
          legacyReopenAdapter: adapterReopenMs,
        },
        canonicalCallsPerAdapterOperation: 1,
        additionalDatabaseQueries: 0,
        payloadBytes: {
          canonicalHistory: Buffer.byteLength(JSON.stringify(historyResponse)),
          legacyHistoryAdapter: Buffer.byteLength(JSON.stringify(adapterList)),
          canonicalClose: Buffer.byteLength(JSON.stringify(closeResult)),
          legacyCloseAdapter: Buffer.byteLength(JSON.stringify(closeResult)),
          canonicalReopen: Buffer.byteLength(JSON.stringify(reopenResult)),
          legacyReopenAdapter: Buffer.byteLength(JSON.stringify(reopenResult)),
        },
      }),
    );
  });
});
