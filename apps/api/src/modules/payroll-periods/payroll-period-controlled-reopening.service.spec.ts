import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import { PayrollPeriodClosureHttpException } from './payroll-period-closure.errors';
import type { PayrollPeriodClosureRepository } from './payroll-period-closure.repository';
import { PayrollPeriodControlledReopeningService } from './payroll-period-controlled-reopening.service';

const id = {
  company: '10000000-0000-4000-8000-000000000001',
  actor: '20000000-0000-4000-8000-000000000001',
  period: '30000000-0000-4000-8000-000000000001',
  previous: '40000000-0000-4000-8000-000000000001',
  next: '50000000-0000-4000-8000-000000000001',
  manifest: '60000000-0000-4000-8000-000000000001',
} as const;
const token = '2026-07-24T10:00:00.000Z';
const principal: AuthenticatedPrincipal = {
  actorId: id.actor,
  activeCompanyId: id.company,
  permissions: ['payroll.period.close.reopen'],
  traceId: 'trace-reopen',
  sessionId: 'session',
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
  accessGrants: [],
};
const dto = {
  reason: 'Correção operacional',
  expectedConsistencyToken: token,
  expectedClosureVersion: 1,
};

describe('PayrollPeriodControlledReopeningService', () => {
  const build = () => {
    const tx = {
      payrollPeriod: { findFirst: jest.fn(), findUniqueOrThrow: jest.fn(), update: jest.fn() },
      payrollPeriodClosureIdempotency: { findUnique: jest.fn() },
      payrollPeriodClosureVersion: { findFirst: jest.fn() },
      payrollPeriodClosureEvent: { findFirst: jest.fn() },
    };
    const repository = {
      lockPeriod: jest.fn(),
      reserveIdempotency: jest.fn(),
      updateOptimistically: jest.fn(),
      appendEvent: jest.fn(),
      createVersion: jest.fn(),
      completeIdempotency: jest.fn(),
    };
    const audit = {
      transaction: jest.fn((work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(tx as unknown as Prisma.TransactionClient),
      ),
      append: jest.fn(),
    };
    const service = new PayrollPeriodControlledReopeningService(
      repository as unknown as PayrollPeriodClosureRepository,
      audit as unknown as AuditWriterService,
      new AuthorizationService(),
    );
    const previous = {
      id: id.previous,
      version: 1,
      status: 'CLOSED',
      optimisticVersion: 3,
      selectedPayrollRunId: 'run-1',
      linkedReviewCycleId: 'review-1',
      manifests: [{ id: id.manifest, payloadHash: 'a'.repeat(64) }],
      events: [{ id: 'event-closed' }],
    };
    tx.payrollPeriod.findFirst.mockResolvedValue({
      id: id.period,
      companyId: id.company,
      status: 'CLOSED',
      updatedAt: new Date(token),
    });
    tx.payrollPeriod.findUniqueOrThrow.mockResolvedValue({
      status: 'CLOSED',
      updatedAt: new Date(token),
    });
    tx.payrollPeriodClosureIdempotency.findUnique.mockResolvedValue(null);
    tx.payrollPeriodClosureVersion.findFirst.mockResolvedValue(previous);
    tx.payrollPeriod.update.mockResolvedValue({ updatedAt: new Date('2026-07-24T11:00:00.000Z') });
    repository.reserveIdempotency.mockResolvedValue({ id: 'idem' });
    repository.updateOptimistically.mockResolvedValue({ count: 1 });
    repository.createVersion.mockResolvedValue({ id: id.next, version: 2 });
    return { service, tx, repository, audit, previous };
  };

  it('reopens atomically, supersedes evidence and creates an empty successor', async () => {
    const { service, repository, audit } = build();
    const result = await service.reopen(
      id.period,
      dto,
      '11111111-1111-4111-8111-111111111111',
      principal,
    );
    expect(result).toMatchObject({
      previousClosureId: id.previous,
      newClosureId: id.next,
      newClosureVersion: 2,
      status: 'OPEN',
      requiresNewPayrollRun: true,
      requiresNewPayrollReview: true,
    });
    expect(repository.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        previousClosureVersionId: id.previous,
      }),
    );
    const successor = repository.createVersion.mock.calls[0]![1];
    expect(successor).not.toHaveProperty('selectedPayrollRunId');
    expect(successor).not.toHaveProperty('linkedReviewCycleId');
    expect(repository.appendEvent.mock.calls.map((call) => call[1].eventType)).toEqual([
      'PERIOD_REOPENING_STARTED',
      'CLOSURE_EVIDENCE_INVALIDATED',
      'PERIOD_REOPENED',
    ]);
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PAYROLL_PERIOD_REOPENED' }),
      expect.anything(),
    );
  });

  it.each([
    ['period not closed', { status: 'OPEN' }, 'PERIOD_NOT_CLOSED'],
    [
      'stale token',
      { updatedAt: new Date('2026-07-24T09:00:00.000Z') },
      'CONSISTENCY_TOKEN_MISMATCH',
    ],
  ])('rejects %s', async (_name, changed, code) => {
    const { service, tx } = build();
    tx.payrollPeriod.findUniqueOrThrow.mockResolvedValue({
      status: 'CLOSED',
      updatedAt: new Date(token),
      ...changed,
    });
    await expect(
      service.reopen(id.period, dto, '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toMatchObject({ response: expect.objectContaining({ code }) });
  });

  it('rejects wrong closure version and missing evidence', async () => {
    const first = build();
    await expect(
      first.service.reopen(
        id.period,
        { ...dto, expectedClosureVersion: 2 },
        '11111111-1111-4111-8111-111111111111',
        principal,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'EXPECTED_CLOSURE_VERSION_MISMATCH' }),
    });
    const second = build();
    second.tx.payrollPeriodClosureVersion.findFirst.mockResolvedValue({
      ...second.previous,
      manifests: [],
    });
    await expect(
      second.service.reopen(id.period, dto, '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CLOSURE_EVIDENCE_INTEGRITY_ERROR' }),
    });
  });

  it('enforces capability and company isolation before mutations', async () => {
    const { service, tx, repository } = build();
    await expect(
      service.reopen(id.period, dto, '11111111-1111-4111-8111-111111111111', {
        ...principal,
        permissions: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    tx.payrollPeriod.findFirst.mockResolvedValue(null);
    await expect(
      service.reopen(id.period, dto, '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateOptimistically).not.toHaveBeenCalled();
  });

  it('rejects missing key, conflicting fingerprint and in-progress operation', async () => {
    const missing = build();
    await expect(
      missing.service.reopen(id.period, dto, undefined, principal),
    ).rejects.toBeInstanceOf(PayrollPeriodClosureHttpException);
    for (const status of ['IN_PROGRESS', 'COMPLETED'] as const) {
      const current = build();
      current.tx.payrollPeriodClosureIdempotency.findUnique.mockResolvedValue({
        status,
        requestFingerprint: 'different',
        responseReference: null,
      });
      await expect(
        current.service.reopen(id.period, dto, '11111111-1111-4111-8111-111111111111', principal),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'IDEMPOTENCY_PAYLOAD_CONFLICT' }),
      });
    }
  });
});
