import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import { PayrollPeriodReadinessService } from './payroll-period-readiness.service';

const companyId = '00000000-0000-4000-8000-000000000001';
const periodId = '00000000-0000-4000-8000-000000000002';
const runId = '00000000-0000-4000-8000-000000000003';
const reviewId = '00000000-0000-4000-8000-000000000004';

const principal: AuthenticatedPrincipal = {
  actorId: '00000000-0000-4000-8000-000000000010',
  activeCompanyId: companyId,
  permissions: ['payroll.period.close.readiness'],
  traceId: 'trace-readiness',
  sessionId: 'session-readiness',
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
  accessGrants: [],
};

function periodRecord() {
  return {
    id: periodId,
    companyId,
    referenceDate: new Date('2026-07-01T00:00:00.000Z'),
    status: 'OPEN',
    updatedAt: new Date('2026-07-20T11:00:00.000Z'),
    closureVersions: [] as Array<{
      previousClosureVersion: { selectedPayrollRun: { sequence: number } | null } | null;
    }>,
    runs: [
      {
        id: runId,
        payrollPeriodId: periodId,
        sequence: 1,
        status: 'COMPLETED',
        completedAt: new Date('2026-07-20T09:00:00.000Z'),
        engineVersion: 'engine-v1',
        parameterVersion: 'parameters-v1',
        messages: [],
        employees: [
          {
            id: '00000000-0000-4000-8000-000000000020',
            grossAmount: new Prisma.Decimal('1000'),
            netAmount: new Prisma.Decimal('900'),
          },
        ],
        reviewCycles: [
          {
            id: reviewId,
            companyId,
            payrollRunId: runId,
            status: 'CLOSED',
            reviewRound: 1,
            submissionNumber: 1,
            createdAt: new Date('2026-07-20T10:00:00.000Z'),
            approvalStages: [{ id: 'stage-1' }, { id: 'stage-2' }],
            decisions: [
              {
                approvalStageId: 'stage-1',
                submissionNumber: 1,
                reviewRound: 1,
                decision: 'APPROVED',
                invalidation: null,
              },
              {
                approvalStageId: 'stage-2',
                submissionNumber: 1,
                reviewRound: 1,
                decision: 'APPROVED',
                invalidation: null,
              },
            ],
            findings: [],
            events: [
              {
                eventType: 'REVIEW_CLOSED',
                metadata: { round: 1 },
                occurredAt: new Date('2026-07-20T10:30:00.000Z'),
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('PayrollPeriodReadinessService', () => {
  const prisma = {
    payrollPeriod: { findFirst: jest.fn() },
    variableCompensationEvent: { count: jest.fn() },
    salaryAdvance: { count: jest.fn() },
    offCyclePayment: { count: jest.fn() },
  };
  const authorization = {
    requireCapability: jest.fn((current: AuthenticatedPrincipal, capability: string) => {
      if (!current.activeCompanyId || !current.permissions.includes(capability)) {
        throw new ForbiddenException('Acesso negado');
      }
    }),
  };
  const service = new PayrollPeriodReadinessService(prisma as never, authorization as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.payrollPeriod.findFirst.mockResolvedValue(periodRecord());
    prisma.variableCompensationEvent.count.mockResolvedValue(0);
    prisma.salaryAdvance.count.mockResolvedValue(0);
    prisma.offCyclePayment.count.mockResolvedValue(0);
  });

  it('returns a deterministic ready response with safe references and consistency token', async () => {
    const result = await service.evaluate(periodId, runId, principal);
    expect(result).toMatchObject({
      payrollPeriodId: periodId,
      companyId,
      currentStatus: 'OPEN',
      isReady: true,
      selectedPayrollRun: { id: runId, sequence: 1, status: 'COMPLETED' },
      linkedReviewCycle: { id: reviewId, status: 'CLOSED', reviewRound: 1 },
      blockers: [],
      warnings: [],
      acknowledgementsRequired: [],
      consistencyToken: '2026-07-20T11:00:00.000Z',
      traceId: principal.traceId,
      unavailableWarningChecks: ['EXTERNAL_INTEGRATIONS_PENDING'],
    });
    expect(result.evaluatedAt).toEqual(expect.any(String));
    expect(prisma.payrollPeriod.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: periodId, companyId } }),
    );
  });

  it('selects the unique canonical execution when payrollRunId is omitted', async () => {
    const result = await service.evaluate(periodId, undefined, principal);
    expect(result.selectedPayrollRun?.id).toBe(runId);
    expect(result.isReady).toBe(true);
  });

  it('returns 404 for missing or cross-company periods', async () => {
    prisma.payrollPeriod.findFirst.mockResolvedValue(null);
    await expect(service.evaluate(periodId, undefined, principal)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.payrollPeriod.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: periodId, companyId } }),
    );
  });

  it('denies by default before accessing persistence', async () => {
    await expect(
      service.evaluate(periodId, undefined, { ...principal, permissions: [] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.payrollPeriod.findFirst).not.toHaveBeenCalled();
  });

  it('returns variable pay warning and required acknowledgement from real counts', async () => {
    prisma.variableCompensationEvent.count.mockResolvedValue(2);
    prisma.salaryAdvance.count.mockResolvedValue(1);
    const result = await service.evaluate(periodId, undefined, principal);
    expect(result.isReady).toBe(true);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'VARIABLE_PAY_PENDING',
        acknowledgementRequired: true,
        metadata: { pendingItems: 3 },
      }),
    ]);
    expect(result.acknowledgementsRequired).toEqual(['VARIABLE_PAY_PENDING']);
  });

  it('returns operational blockers instead of throwing and never calls a write API', async () => {
    const record = periodRecord();
    record.status = 'CLOSED';
    record.runs[0]!.reviewCycles[0]!.status = 'IN_REVIEW';
    prisma.payrollPeriod.findFirst.mockResolvedValue(record);
    const result = await service.evaluate(periodId, undefined, principal);
    expect(result.isReady).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toEqual(
      expect.arrayContaining(['PERIOD_ALREADY_CLOSED', 'REVIEW_CYCLE_NOT_CLOSED']),
    );
    expect(Object.keys(prisma)).toEqual([
      'payrollPeriod',
      'variableCompensationEvent',
      'salaryAdvance',
      'offCyclePayment',
    ]);
  });

  it('does not reuse the run selected by the superseded closure after reopening', async () => {
    const record = periodRecord();
    record.closureVersions = [{ previousClosureVersion: { selectedPayrollRun: { sequence: 1 } } }];
    prisma.payrollPeriod.findFirst.mockResolvedValue(record);
    const result = await service.evaluate(periodId, undefined, principal);
    expect(result.selectedPayrollRun).toBeNull();
    expect(result.isReady).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toContain('PAYROLL_RUN_NOT_FOUND');
  });
});
