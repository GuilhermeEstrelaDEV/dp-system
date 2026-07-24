import { ForbiddenException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma, type PayrollPeriodClosureEventType } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import { PayrollPeriodClosureHttpException } from './payroll-period-closure.errors';
import type { PayrollPeriodClosureRepository } from './payroll-period-closure.repository';
import type { ClosePayrollPeriodCommandDto } from './payroll-period-operational-closure.dto';
import { PayrollPeriodOperationalClosureService } from './payroll-period-operational-closure.service';
import type { PayrollPeriodReadinessService } from './payroll-period-readiness.service';

const ids = {
  company: '10000000-0000-4000-8000-000000000001',
  actor: '20000000-0000-4000-8000-000000000001',
  period: '30000000-0000-4000-8000-000000000001',
  run: '40000000-0000-4000-8000-000000000001',
  review: '50000000-0000-4000-8000-000000000001',
  closure: '60000000-0000-4000-8000-000000000001',
  manifest: '70000000-0000-4000-8000-000000000001',
} as const;

const principal: AuthenticatedPrincipal = {
  actorId: ids.actor,
  activeCompanyId: ids.company,
  permissions: ['payroll.period.close.execute'],
  traceId: 'trace-close',
  sessionId: 'session-close',
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
  accessGrants: [],
};

const token = '2026-07-24T10:00:00.000Z';
const dto = (warnings: ClosePayrollPeriodCommandDto['warningAcknowledgements'] = []) => ({
  payrollRunId: ids.run,
  expectedConsistencyToken: token,
  warningAcknowledgements: warnings,
});

function ready(warning = false) {
  return {
    payrollPeriodId: ids.period,
    companyId: ids.company,
    referenceDate: '2026-07-01',
    currentStatus: 'OPEN',
    isReady: true,
    evaluatedAt: '2026-07-24T10:01:00.000Z',
    selectedPayrollRun: {
      id: ids.run,
      sequence: 1,
      status: 'COMPLETED',
      completedAt: '2026-07-24T09:00:00.000Z',
      engineVersion: 'engine-v1',
      parameterVersion: 'params-v1',
    },
    linkedReviewCycle: {
      id: ids.review,
      status: 'CLOSED',
      reviewRound: 1,
      submissionNumber: 1,
    },
    blockers: [],
    warnings: warning
      ? [
          {
            code: 'VARIABLE_PAY_PENDING' as const,
            category: 'VARIABLE_PAY' as const,
            message: 'pending',
            acknowledgementRequired: true,
            source: 'VARIABLE_COMPENSATION' as const,
          },
        ]
      : [],
    acknowledgementsRequired: warning ? (['VARIABLE_PAY_PENDING'] as const) : [],
    consistencyToken: token,
    traceId: principal.traceId,
    unavailableWarningChecks: ['EXTERNAL_INTEGRATIONS_PENDING' as const],
  };
}

describe('PayrollPeriodOperationalClosureService', () => {
  const build = () => {
    const tx = {
      payrollPeriod: { findFirst: jest.fn(), update: jest.fn() },
      payrollRun: { findFirst: jest.fn() },
      payrollPeriodClosureIdempotency: { findUnique: jest.fn() },
      payrollPeriodClosureVersion: { findFirst: jest.fn() },
    };
    const repository = {
      lockPeriod: jest.fn(),
      reserveIdempotency: jest.fn(),
      getActive: jest.fn(),
      createVersion: jest.fn(),
      updateOptimistically: jest.fn(),
      appendEvent: jest.fn(),
      appendWarningAcknowledgement: jest.fn(),
      appendManifest: jest.fn(),
      completeIdempotency: jest.fn(),
    };
    const readiness = { evaluateInTransaction: jest.fn() };
    const audit = {
      transaction: jest.fn((work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(tx as unknown as Prisma.TransactionClient),
      ),
      append: jest.fn(),
    };
    const service = new PayrollPeriodOperationalClosureService(
      repository as unknown as PayrollPeriodClosureRepository,
      readiness as unknown as PayrollPeriodReadinessService,
      audit as unknown as AuditWriterService,
      new AuthorizationService(),
    );

    tx.payrollPeriod.findFirst.mockResolvedValue({ id: ids.period, companyId: ids.company });
    tx.payrollPeriodClosureIdempotency.findUnique.mockResolvedValue(null);
    repository.reserveIdempotency.mockResolvedValue({ id: 'idem-1' });
    readiness.evaluateInTransaction.mockResolvedValue(ready());
    repository.getActive.mockResolvedValue(null);
    tx.payrollRun.findFirst.mockResolvedValue({
      id: ids.run,
      sequence: 1,
      engineVersion: 'engine-v1',
      parameterVersion: 'params-v1',
      employees: [
        {
          employmentContractId: '80000000-0000-4000-8000-000000000001',
          grossAmount: new Prisma.Decimal('1000'),
          netAmount: new Prisma.Decimal('900'),
        },
      ],
      reviewCycles: [
        {
          id: ids.review,
          reviewRound: 1,
          decisions: [
            { id: 'decision-1', reviewRound: 1, submissionNumber: 1 },
            { id: 'decision-old', reviewRound: 0, submissionNumber: 1 },
          ],
          findings: [{ id: 'finding-1', severity: 'INFO', status: 'OPEN' }],
        },
      ],
    });
    repository.createVersion.mockResolvedValue({ id: ids.closure, version: 1 });
    repository.updateOptimistically.mockResolvedValue({ count: 1 });
    repository.appendManifest.mockResolvedValue({ id: ids.manifest });
    tx.payrollPeriod.update.mockResolvedValue({
      updatedAt: new Date('2026-07-24T10:02:00.000Z'),
    });
    return { service, tx, repository, readiness, audit };
  };

  it('closes a ready period atomically with manifest, events, optimistic version and audit', async () => {
    const { service, repository, audit } = build();
    const result = await service.close(
      ids.period,
      dto(),
      '11111111-1111-4111-8111-111111111111',
      principal,
    );

    expect(result).toMatchObject({
      payrollPeriodId: ids.period,
      closureId: ids.closure,
      status: 'CLOSED',
      manifestId: ids.manifest,
      hashAlgorithmVersion: 'sha256-canonical-json-v1',
      warningsAcknowledged: [],
      idempotentReplay: false,
    });
    expect(result.manifestHash).toMatch(/^[0-9a-f]{64}$/);
    expect(repository.lockPeriod).toHaveBeenCalledWith(expect.anything(), ids.company, ids.period);
    expect(repository.updateOptimistically).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      ids.closure,
      ids.company,
      1,
      { status: 'CLOSING' },
    );
    expect(repository.updateOptimistically).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      ids.closure,
      ids.company,
      2,
      expect.objectContaining({ status: 'CLOSED' }),
    );
    expect(repository.appendEvent.mock.calls.map((call) => call[1].eventType)).toEqual([
      'PERIOD_CLOSURE_STARTED',
      'PERIOD_CLOSED',
    ] satisfies PayrollPeriodClosureEventType[]);
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PAYROLL_PERIOD_CLOSED', entityId: ids.period }),
      expect.anything(),
    );
    expect(repository.completeIdempotency).toHaveBeenCalledWith(
      expect.anything(),
      'idem-1',
      ids.closure,
      expect.any(Date),
    );
  });

  it('persists an authoritative variable-pay acknowledgement and event', async () => {
    const { service, readiness, repository } = build();
    readiness.evaluateInTransaction.mockResolvedValue(ready(true));
    const result = await service.close(
      ids.period,
      dto([{ warningCode: 'VARIABLE_PAY_PENDING', acknowledged: true, reason: 'Reviewed' }]),
      '11111111-1111-4111-8111-111111111111',
      principal,
    );
    expect(result.warningsAcknowledged).toEqual(['VARIABLE_PAY_PENDING']);
    expect(repository.appendWarningAcknowledgement).toHaveBeenCalledTimes(1);
    expect(repository.appendEvent.mock.calls.map((call) => call[1].eventType)).toContain(
      'VARIABLE_PAY_WARNING_ACKNOWLEDGED',
    );
  });

  it.each([
    ['missing', dto(), 'WARNING_ACKNOWLEDGEMENT_REQUIRED'],
    [
      'unknown',
      dto([{ warningCode: 'UNKNOWN', acknowledged: true }]),
      'WARNING_ACKNOWLEDGEMENT_INVALID',
    ],
    [
      'duplicate',
      dto([
        { warningCode: 'VARIABLE_PAY_PENDING', acknowledged: true },
        { warningCode: 'VARIABLE_PAY_PENDING', acknowledged: true },
      ]),
      'WARNING_ACKNOWLEDGEMENT_INVALID',
    ],
  ])('rejects %s warning acknowledgement', async (_case, input, code) => {
    const { service, readiness, repository } = build();
    readiness.evaluateInTransaction.mockResolvedValue(ready(true));
    await expect(
      service.close(ids.period, input, '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toMatchObject({ response: expect.objectContaining({ code }), status: 422 });
    expect(repository.createVersion).not.toHaveBeenCalled();
  });

  it('returns authoritative blockers without producing closure evidence', async () => {
    const { service, readiness, repository } = build();
    readiness.evaluateInTransaction.mockResolvedValue({
      ...ready(),
      isReady: false,
      blockers: [{ code: 'REVIEW_CYCLE_NOT_CLOSED', severity: 'BLOCKING' }],
    });
    await expect(
      service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CLOSURE_READINESS_NOT_MET' }),
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    expect(repository.createVersion).not.toHaveBeenCalled();
    expect(repository.appendManifest).not.toHaveBeenCalled();
  });

  it('rejects stale consistency and unexpected closure versions', async () => {
    const first = build();
    first.readiness.evaluateInTransaction.mockResolvedValue({
      ...ready(),
      consistencyToken: '2026-07-24T11:00:00.000Z',
    });
    await expect(
      first.service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CONSISTENCY_TOKEN_MISMATCH' }),
    });

    const second = build();
    await expect(
      second.service.close(
        ids.period,
        { ...dto(), expectedClosureVersion: 1 },
        '11111111-1111-4111-8111-111111111111',
        principal,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'OPTIMISTIC_VERSION_CONFLICT' }),
    });
  });

  it('requires a valid idempotency key and denies by default before persistence', async () => {
    const { service, repository } = build();
    await expect(service.close(ids.period, dto(), undefined, principal)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'IDEMPOTENCY_KEY_REQUIRED' }),
    });
    await expect(service.close(ids.period, dto(), 'invalid', principal)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'IDEMPOTENCY_KEY_INVALID' }),
    });
    await expect(
      service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', {
        ...principal,
        permissions: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.lockPeriod).not.toHaveBeenCalled();
  });

  it('returns 404 for a period outside the active company', async () => {
    const { service, tx } = build();
    tx.payrollPeriod.findFirst.mockResolvedValue(null);
    await expect(
      service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects same idempotency key with a different payload or unfinished operation', async () => {
    const conflict = build();
    conflict.tx.payrollPeriodClosureIdempotency.findUnique.mockResolvedValue({
      requestFingerprint: 'different',
      status: 'COMPLETED',
      responseReference: ids.closure,
    });
    await expect(
      conflict.service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'IDEMPOTENCY_PAYLOAD_CONFLICT' }),
    });

    const pending = build();
    const policyFingerprint = new (
      await import('./domain/payroll-period-closure-idempotency')
    ).PayrollPeriodClosureIdempotencyPolicy().fingerprint({
      operation: 'CLOSE',
      payload: {
        payrollRunId: ids.run,
        expectedConsistencyToken: token,
        warningAcknowledgements: [],
      },
    });
    pending.tx.payrollPeriodClosureIdempotency.findUnique.mockResolvedValue({
      requestFingerprint: policyFingerprint,
      status: 'IN_PROGRESS',
      responseReference: null,
    });
    await expect(
      pending.service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'IDEMPOTENCY_OPERATION_IN_PROGRESS' }),
    });
  });

  it('propagates manifest, event and audit failures to the transaction boundary', async () => {
    for (const target of ['manifest', 'event', 'audit'] as const) {
      const { service, repository, audit } = build();
      if (target === 'manifest')
        repository.appendManifest.mockRejectedValue(new Error('manifest failure'));
      if (target === 'event') repository.appendEvent.mockRejectedValue(new Error('event failure'));
      if (target === 'audit') audit.append.mockRejectedValue(new Error('audit failure'));
      await expect(
        service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', principal),
      ).rejects.toThrow(`${target} failure`);
      expect(repository.completeIdempotency).not.toHaveBeenCalled();
    }
  });

  it('maps failed optimistic updates to a stable conflict', async () => {
    const { service, repository } = build();
    repository.updateOptimistically.mockResolvedValue({ count: 0 });
    await expect(
      service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toBeInstanceOf(PayrollPeriodClosureHttpException);
    await expect(
      service.close(ids.period, dto(), '11111111-1111-4111-8111-111111111111', principal),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'OPTIMISTIC_VERSION_CONFLICT' }),
    });
  });
});
