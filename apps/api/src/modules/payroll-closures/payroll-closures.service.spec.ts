import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PayrollClosuresService } from './payroll-closures.service';

describe('PayrollClosuresService compatibility adapter', () => {
  const principal: AuthenticatedPrincipal = {
    actorId: '11111111-1111-4111-8111-111111111111',
    activeCompanyId: '22222222-2222-4222-8222-222222222222',
    sessionId: '33333333-3333-4333-8333-333333333333',
    permissions: [
      'payroll.period.close.history',
      'payroll.period.close.execute',
      'payroll.period.close.reopen',
    ],
    traceId: 'trace-p0',
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    accessGrants: [],
  };
  const version = (value: number) => ({
    id: `00000000-0000-4000-8000-00000000000${value}`,
    version: value,
    status: 'CLOSED',
    isActive: value === 2,
    openedAt: new Date(0).toISOString(),
    closedAt: new Date(0).toISOString(),
    reopenedAt: null,
    supersededAt: null,
    payrollRun: null,
    review: null,
    predecessor: null,
    successor: null,
    manifest: null,
    events: [],
  });
  const history = {
    list: jest.fn(),
    findByClosureId: jest.fn(),
  };
  const operational = { close: jest.fn() };
  const reopening = { reopen: jest.fn() };
  const telemetry = {
    observe: jest.fn((_context: unknown, operation: () => Promise<unknown>) => operation()),
  };
  const service = new PayrollClosuresService(
    history as never,
    operational as never,
    reopening as never,
    telemetry as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('paginates only canonical company-scoped history', async () => {
    history.list.mockResolvedValue({
      payrollPeriodId: 'period',
      versions: [version(1), version(2)],
    });
    await expect(
      service.list({ payrollPeriodId: 'period', page: 1, pageSize: 1 }, principal),
    ).resolves.toEqual({
      items: [version(2)],
      pagination: { page: 1, pageSize: 1, totalItems: 2, totalPages: 2 },
    });
    expect(history.list).toHaveBeenCalledWith('period', principal);
  });

  it('maps a legacy closure ID only through canonical history', async () => {
    history.findByClosureId.mockResolvedValue(version(1));
    await expect(service.find(version(1).id, principal)).resolves.toEqual(version(1));
    expect(history.findByClosureId).toHaveBeenCalledWith(version(1).id, principal);
  });

  it('delegates close exactly once and maps legacy reason only to canonical note', async () => {
    operational.close.mockResolvedValue({ status: 'CLOSED', idempotentReplay: false });
    const dto = {
      payrollPeriodId: 'period',
      payrollRunId: 'run',
      expectedConsistencyToken: '2026-08-10T00:00:00.000Z',
      warningAcknowledgements: [],
      expectedClosureVersion: 1,
      reason: 'Legacy contractual note',
    };
    await service.close(dto, 'idempotency-key', principal);
    expect(operational.close).toHaveBeenCalledTimes(1);
    expect(operational.close).toHaveBeenCalledWith(
      'period',
      {
        payrollRunId: 'run',
        expectedConsistencyToken: dto.expectedConsistencyToken,
        warningAcknowledgements: [],
        expectedClosureVersion: 1,
        note: 'Legacy contractual note',
      },
      'idempotency-key',
      principal,
    );
  });

  it('delegates reopen exactly once with the complete canonical command', async () => {
    reopening.reopen.mockResolvedValue({ status: 'OPEN', idempotentReplay: false });
    const dto = {
      reason: 'Controlled correction',
      expectedConsistencyToken: '2026-08-10T00:00:00.000Z',
      expectedClosureVersion: 2,
    };
    await service.reopen('period', dto, 'idempotency-key', principal);
    expect(reopening.reopen).toHaveBeenCalledTimes(1);
    expect(reopening.reopen).toHaveBeenCalledWith('period', dto, 'idempotency-key', principal);
  });

  it('propagates canonical errors without fallback', async () => {
    operational.close.mockRejectedValue(new NotFoundException('Competência não encontrada'));
    const command = {
      payrollPeriodId: 'period',
      payrollRunId: 'run',
      expectedConsistencyToken: '2026-08-10T00:00:00.000Z',
      warningAcknowledgements: [],
    };
    await expect(service.close(command, 'idempotency-key', principal)).rejects.toThrow(
      'Competência não encontrada',
    );
    expect(operational.close).toHaveBeenCalledTimes(1);
    expect(reopening.reopen).not.toHaveBeenCalled();
    expect(history.list).not.toHaveBeenCalled();
  });
});
