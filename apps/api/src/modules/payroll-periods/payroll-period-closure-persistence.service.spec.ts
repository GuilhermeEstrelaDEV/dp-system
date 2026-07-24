import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { AuditWriterService } from '../auth/audit-writer.service';
import { AuthorizationService } from '../auth/authorization.service';
import { PayrollPeriodClosurePersistenceService } from './payroll-period-closure-persistence.service';
import type { PayrollPeriodClosureRepository } from './payroll-period-closure.repository';

const principal: AuthenticatedPrincipal = {
  actorId: '10000000-0000-4000-8000-000000000001',
  activeCompanyId: '20000000-0000-4000-8000-000000000001',
  permissions: ['payroll.period.close.execute', 'payroll.period.close.reopen'],
  accessGrants: [],
  traceId: 'trace-1',
  sessionId: 'session-1',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

const foundationInput = {
  payrollPeriodId: '30000000-0000-4000-8000-000000000001',
  selectedPayrollRunId: '40000000-0000-4000-8000-000000000001',
  linkedReviewCycleId: '50000000-0000-4000-8000-000000000001',
  linkedReviewRound: 1,
  consistencyToken: '2026-07-22T12:00:00.000Z',
  manifest: {
    payrollRunSequence: 1,
    validDecisionReferences: ['decision-1'],
    relevantFindingReferences: [],
    consolidatedTotals: { gross: '100.00', net: '80.00' },
    safeEmployeeReferences: ['contract-1'],
    previousStatus: 'OPEN',
    intendedStatus: 'CLOSED',
    variablePayWarnings: ['VARIABLE_PAY_PENDING'],
    warningAcknowledgements: ['VARIABLE_PAY_PENDING'],
    evaluatedAt: '2026-07-22T12:00:00.000Z',
    generatedAt: '2026-07-22T12:01:00.000Z',
  },
  warningAcknowledgements: [{ code: 'VARIABLE_PAY_PENDING', payload: { acknowledged: true } }],
} as const;

describe('PayrollPeriodClosurePersistenceService', () => {
  const build = () => {
    const tx = {
      payrollPeriod: { findFirst: jest.fn() },
      payrollPeriodClosureIdempotency: { findUniqueOrThrow: jest.fn() },
    };
    const repository = {
      createVersion: jest.fn(),
      appendManifest: jest.fn(),
      appendEvent: jest.fn(),
      appendWarningAcknowledgement: jest.fn(),
      reserveIdempotency: jest.fn(),
      completeIdempotency: jest.fn(),
      failIdempotency: jest.fn(),
      updateOptimistically: jest.fn(),
    };
    const audit = {
      transaction: jest.fn((work: (client: Prisma.TransactionClient) => Promise<unknown>) =>
        work(tx as unknown as Prisma.TransactionClient),
      ),
      append: jest.fn(),
    };
    const service = new PayrollPeriodClosurePersistenceService(
      repository as unknown as PayrollPeriodClosureRepository,
      audit as unknown as AuditWriterService,
      new AuthorizationService(),
    );
    return { service, tx, repository, audit };
  };

  it('persists version, manifest, event, acknowledgement and audit in one transaction', async () => {
    const { service, tx, repository, audit } = build();
    tx.payrollPeriod.findFirst.mockResolvedValue({
      id: foundationInput.payrollPeriodId,
      companyId: principal.activeCompanyId,
      updatedAt: new Date(foundationInput.consistencyToken),
      runs: [
        {
          id: foundationInput.selectedPayrollRunId,
          reviewCycles: [{ id: foundationInput.linkedReviewCycleId, reviewRound: 1 }],
        },
      ],
    });
    repository.createVersion.mockResolvedValue({ id: 'closure-1', version: 1, status: 'OPEN' });

    await expect(service.createFoundationVersion(foundationInput, principal)).resolves.toEqual({
      id: 'closure-1',
      version: 1,
      status: 'OPEN',
    });
    expect(audit.transaction).toHaveBeenCalledTimes(1);
    expect(repository.appendManifest).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        payrollPeriodClosureId: 'closure-1',
        payloadHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    );
    expect(repository.appendEvent).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ eventType: 'PERIOD_READINESS_EVALUATED' }),
    );
    expect(repository.appendWarningAcknowledgement).toHaveBeenCalledTimes(1);
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'PayrollPeriodClosureVersion' }),
      tx,
    );
  });

  it('is deny-by-default and does not touch persistence without capability', async () => {
    const { service, tx, repository } = build();
    await expect(
      service.createFoundationVersion(foundationInput, { ...principal, permissions: [] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.payrollPeriod.findFirst).not.toHaveBeenCalled();
    expect(repository.createVersion).not.toHaveBeenCalled();
  });

  it('returns 404 for evidence outside the active company', async () => {
    const { service, tx, repository } = build();
    tx.payrollPeriod.findFirst.mockResolvedValue(null);
    await expect(
      service.createFoundationVersion(foundationInput, principal),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createVersion).not.toHaveBeenCalled();
  });

  it('rejects stale consistency and optimistic versions', async () => {
    const { service, tx, repository } = build();
    tx.payrollPeriod.findFirst.mockResolvedValue({
      id: foundationInput.payrollPeriodId,
      companyId: principal.activeCompanyId,
      updatedAt: new Date('2026-07-22T12:02:00.000Z'),
      runs: [
        {
          id: foundationInput.selectedPayrollRunId,
          reviewCycles: [{ id: foundationInput.linkedReviewCycleId, reviewRound: 1 }],
        },
      ],
    });
    await expect(
      service.createFoundationVersion(foundationInput, principal),
    ).rejects.toBeInstanceOf(ConflictException);
    repository.updateOptimistically.mockResolvedValue({ count: 0 });
    await expect(
      service.updateOptimistically(
        'closure-1',
        principal.activeCompanyId!,
        1,
        { status: 'CLOSING' },
        tx as unknown as Prisma.TransactionClient,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('propagates event or audit failures so the transaction can roll back all writes', async () => {
    const { service, tx, repository, audit } = build();
    tx.payrollPeriod.findFirst.mockResolvedValue({
      id: foundationInput.payrollPeriodId,
      companyId: principal.activeCompanyId,
      updatedAt: new Date(foundationInput.consistencyToken),
      runs: [
        {
          id: foundationInput.selectedPayrollRunId,
          reviewCycles: [{ id: foundationInput.linkedReviewCycleId, reviewRound: 1 }],
        },
      ],
    });
    repository.createVersion.mockResolvedValue({ id: 'closure-1', version: 1, status: 'OPEN' });
    repository.appendEvent.mockRejectedValueOnce(new Error('event failure'));
    await expect(service.createFoundationVersion(foundationInput, principal)).rejects.toThrow(
      'event failure',
    );

    repository.appendEvent.mockResolvedValueOnce({ id: 'event-1' });
    audit.append.mockRejectedValueOnce(new Error('audit failure'));
    await expect(service.createFoundationVersion(foundationInput, principal)).rejects.toThrow(
      'audit failure',
    );
  });
});
