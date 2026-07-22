import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AuditWriterService } from '../auth/audit-writer.service';
import type { AuthorizationService } from '../auth/authorization.service';
import { PayrollReviewsService } from './payroll-reviews.service';

const principal: AuthenticatedPrincipal = {
  actorId: '11111111-1111-4111-8111-111111111111',
  activeCompanyId: '22222222-2222-4222-8222-222222222222',
  permissions: [
    'payroll.review.view',
    'payroll.review.create',
    'payroll.review.finding.create',
    'payroll.review.finding.resolve',
    'payroll.review.finding.reopen',
    'payroll.review.submit',
    'payroll.review.approve',
    'payroll.review.reject',
    'payroll.review.close',
    'payroll.review.reopen',
  ],
  traceId: 'trace-1',
  sessionId: 'session-1',
  ipAddress: '127.0.0.1',
  userAgent: 'jest',
  accessGrants: [],
};
const cycle = {
  id: '33333333-3333-4333-8333-333333333333',
  companyId: principal.activeCompanyId!,
  payrollRunId: '44444444-4444-4444-8444-444444444444',
  status: 'OPEN' as const,
  createdBy: principal.actorId,
  traceId: principal.traceId,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  submissionNumber: 0,
  currentApprovalStage: 0,
  reviewRound: 1,
};

function finding(status: 'OPEN' | 'RESOLVED' = 'OPEN') {
  const baseEvent = {
    id: '66666666-6666-4666-8666-666666666666',
    companyId: cycle.companyId,
    reviewCycleId: cycle.id,
    findingId: '55555555-5555-4555-8555-555555555555',
    actorId: principal.actorId,
    traceId: principal.traceId,
    eventType: 'FINDING_OPENED' as const,
    reason: null,
    previousState: null,
    nextState: { status: 'OPEN' },
    occurredAt: new Date('2026-01-01T00:00:00Z'),
    metadata: null,
  };
  return {
    id: baseEvent.findingId,
    reviewCycleId: cycle.id,
    companyId: cycle.companyId,
    payrollRunId: cycle.payrollRunId,
    payrollCalculationItemId: null,
    employmentContractId: null,
    severity: 'BLOCKING' as const,
    status,
    code: 'TECH',
    title: 'Technical',
    description: 'Review result',
    createdBy: principal.actorId,
    createdAt: baseEvent.occurredAt,
    resolvedBy: status === 'RESOLVED' ? principal.actorId : null,
    resolvedAt: status === 'RESOLVED' ? new Date('2026-01-01T00:01:00Z') : null,
    resolutionReason: status === 'RESOLVED' ? 'Checked' : null,
    traceId: principal.traceId,
    events: [
      baseEvent,
      ...(status === 'RESOLVED'
        ? [
            {
              ...baseEvent,
              id: '77777777-7777-4777-8777-777777777777',
              eventType: 'FINDING_RESOLVED' as const,
              reason: 'Checked',
              occurredAt: new Date('2026-01-01T00:01:00Z'),
            },
          ]
        : []),
    ],
    reviewCycle: { status: 'OPEN' as const },
  };
}

describe('PayrollReviewsService', () => {
  const tx = {
    payrollRun: { findFirst: jest.fn() },
    payrollReviewCycle: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    payrollReviewApprovalStage: { createMany: jest.fn() },
    payrollReviewDecision: { create: jest.fn() },
    payrollReviewDecisionInvalidation: { createMany: jest.fn() },
    payrollReviewFinding: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    payrollReviewEvent: { create: jest.fn() },
    payrollRunEmployee: { findFirst: jest.fn() },
    payrollCalculationItem: { findFirst: jest.fn() },
  };
  const prisma = {
    payrollRun: { findFirst: jest.fn() },
    payrollReviewCycle: { findMany: jest.fn(), findFirst: jest.fn() },
    payrollReviewFinding: { findMany: jest.fn() },
  };
  const audit = { transaction: jest.fn(), append: jest.fn() };
  const authorization = {
    requireCapability: jest.fn((current: AuthenticatedPrincipal, capability: string) => {
      if (!current.activeCompanyId || !current.permissions.includes(capability))
        throw new ForbiddenException();
    }),
  };
  const service = new PayrollReviewsService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditWriterService,
    authorization as unknown as AuthorizationService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    audit.transaction.mockImplementation((work: (client: typeof tx) => Promise<unknown>) =>
      work(tx),
    );
    audit.append.mockResolvedValue(undefined);
  });

  it('opens cycle, event and audit atomically with actor, company and trace', async () => {
    tx.payrollRun.findFirst.mockResolvedValue({
      id: cycle.payrollRunId,
      status: 'COMPLETED',
      payrollPeriod: { companyId: cycle.companyId },
    });
    tx.payrollReviewCycle.create.mockResolvedValue(cycle);
    tx.payrollReviewEvent.create.mockResolvedValue({});
    await expect(service.openCycle(cycle.payrollRunId, principal)).resolves.toEqual(cycle);
    expect(tx.payrollReviewCycle.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: cycle.companyId,
        createdBy: principal.actorId,
        traceId: principal.traceId,
      }),
    });
    expect(tx.payrollReviewEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: 'REVIEW_CYCLE_OPENED',
        actorId: principal.actorId,
      }),
    });
    expect(audit.append).toHaveBeenCalledWith(expect.objectContaining({ principal }), tx);
  });

  it('rejects missing or incomplete payroll runs', async () => {
    tx.payrollRun.findFirst.mockResolvedValueOnce(null);
    await expect(service.openCycle(cycle.payrollRunId, principal)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    tx.payrollRun.findFirst.mockResolvedValueOnce({
      id: cycle.payrollRunId,
      status: 'FAILED',
      payrollPeriod: { companyId: cycle.companyId },
    });
    await expect(service.openCycle(cycle.payrollRunId, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects a second active cycle and missing capability', async () => {
    tx.payrollRun.findFirst.mockResolvedValue({
      id: cycle.payrollRunId,
      status: 'COMPLETED',
      payrollPeriod: { companyId: cycle.companyId },
    });
    tx.payrollReviewCycle.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.19.0',
      }),
    );
    await expect(service.openCycle(cycle.payrollRunId, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(
      service.openCycle(cycle.payrollRunId, { ...principal, permissions: [] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each(['INFORMATIONAL', 'BLOCKING'] as const)(
    'creates an %s finding with event and audit',
    async (severity) => {
      tx.payrollReviewCycle.findFirst.mockResolvedValue(cycle);
      tx.payrollReviewFinding.create.mockImplementation(({ data }: { data: object }) => ({
        ...data,
        status: 'OPEN',
      }));
      tx.payrollReviewEvent.create.mockResolvedValue({});
      await expect(
        service.createFinding(
          cycle.id,
          { severity, code: 'TECH', title: 'Technical', description: 'Description' },
          principal,
        ),
      ).resolves.toEqual(expect.objectContaining({ severity, status: 'OPEN' }));
      expect(tx.payrollReviewEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ eventType: 'FINDING_OPENED' }),
      });
      expect(audit.append).toHaveBeenCalledWith(expect.any(Object), tx);
    },
  );

  it('rejects contract and item references outside the company or run', async () => {
    tx.payrollReviewCycle.findFirst.mockResolvedValue(cycle);
    tx.payrollRunEmployee.findFirst.mockResolvedValue(null);
    await expect(
      service.createFinding(
        cycle.id,
        {
          severity: 'BLOCKING',
          code: 'TECH',
          title: 'Technical',
          description: 'Description',
          employmentContractId: '88888888-8888-4888-8888-888888888888',
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    tx.payrollCalculationItem.findFirst.mockResolvedValue(null);
    await expect(
      service.createFinding(
        cycle.id,
        {
          severity: 'BLOCKING',
          code: 'TECH',
          title: 'Technical',
          description: 'Description',
          payrollCalculationItemId: '99999999-9999-4999-8999-999999999999',
        },
        principal,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resolves and reopens only valid states with corresponding events', async () => {
    tx.payrollReviewFinding.findFirst
      .mockResolvedValueOnce(finding('OPEN'))
      .mockResolvedValueOnce(finding('RESOLVED'));
    tx.payrollReviewFinding.update.mockImplementation(({ data }: { data: object }) => ({
      ...finding(),
      ...data,
    }));
    tx.payrollReviewEvent.create.mockResolvedValue({});
    await expect(
      service.resolveFinding('finding', { reason: 'Reviewed' }, principal),
    ).resolves.toEqual(expect.objectContaining({ status: 'RESOLVED' }));
    await expect(
      service.reopenFinding('finding', { reason: 'New evidence' }, principal),
    ).resolves.toEqual(expect.objectContaining({ status: 'OPEN' }));
    expect(tx.payrollReviewEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ eventType: 'FINDING_RESOLVED', reason: 'Reviewed' }),
    });
    expect(tx.payrollReviewEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ eventType: 'FINDING_REOPENED', reason: 'New evidence' }),
    });
  });

  it('rejects resolving resolved and reopening open findings', async () => {
    tx.payrollReviewFinding.findFirst
      .mockResolvedValueOnce(finding('RESOLVED'))
      .mockResolvedValueOnce(finding('OPEN'));
    await expect(
      service.resolveFinding('finding', { reason: 'Again' }, principal),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.reopenFinding('finding', { reason: 'Again' }, principal),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns 404 outside the active company and propagates rollback', async () => {
    prisma.payrollReviewCycle.findFirst.mockResolvedValue(null);
    await expect(service.findCycle(cycle.id, principal)).rejects.toBeInstanceOf(NotFoundException);
    const rollback = new Error('transaction rolled back');
    audit.transaction.mockRejectedValue(rollback);
    await expect(service.openCycle(cycle.payrollRunId, principal)).rejects.toBe(rollback);
  });

  it('starts and submits only without open blocking findings', async () => {
    tx.payrollReviewCycle.findFirst
      .mockResolvedValueOnce(cycle)
      .mockResolvedValueOnce({ ...cycle, status: 'IN_REVIEW' });
    tx.payrollReviewFinding.count.mockResolvedValue(0);
    tx.payrollReviewCycle.update.mockImplementation(({ data }: { data: object }) => ({
      ...cycle,
      ...data,
    }));
    tx.payrollReviewEvent.create.mockResolvedValue({});
    await expect(service.startReview(cycle.id, principal)).resolves.toEqual(
      expect.objectContaining({ status: 'IN_REVIEW' }),
    );
    await expect(service.submitReview(cycle.id, principal)).resolves.toEqual(
      expect.objectContaining({ status: 'SUBMITTED', submissionNumber: 1 }),
    );
    expect(audit.append).toHaveBeenCalledTimes(2);

    tx.payrollReviewCycle.findFirst.mockResolvedValue({ ...cycle, status: 'IN_REVIEW' });
    tx.payrollReviewFinding.count.mockResolvedValue(1);
    await expect(service.submitReview(cycle.id, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('completes two approval stages with distinct non-preparer actors', async () => {
    const stages = [
      { id: 'stage-1', sequence: 1, requiredCapability: 'payroll.review.approve' },
      { id: 'stage-2', sequence: 2, requiredCapability: 'payroll.review.approve' },
    ];
    const first = { ...principal, actorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
    const second = { ...principal, actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' };
    tx.payrollReviewCycle.findFirst
      .mockResolvedValueOnce({
        ...cycle,
        status: 'SUBMITTED',
        submissionNumber: 1,
        approvalStages: stages,
        decisions: [],
      })
      .mockResolvedValueOnce({
        ...cycle,
        status: 'SUBMITTED',
        submissionNumber: 1,
        currentApprovalStage: 1,
        approvalStages: stages,
        decisions: [{ submissionNumber: 1, decision: 'APPROVED', actorId: first.actorId }],
      });
    tx.payrollReviewDecision.create.mockResolvedValue({});
    tx.payrollReviewEvent.create.mockResolvedValue({});
    tx.payrollReviewCycle.update.mockImplementation(({ data }: { data: object }) => ({
      ...cycle,
      ...data,
    }));
    await expect(service.approveReview(cycle.id, {}, first)).resolves.toEqual(
      expect.objectContaining({ status: 'SUBMITTED', currentApprovalStage: 1 }),
    );
    await expect(service.approveReview(cycle.id, {}, second)).resolves.toEqual(
      expect.objectContaining({ status: 'APPROVED', currentApprovalStage: 2 }),
    );
    expect(tx.payrollReviewDecision.create).toHaveBeenCalledTimes(2);
    expect(audit.append).toHaveBeenCalledTimes(2);
  });

  it('rejects duplicate approval, preparer approval and rejection without reason', async () => {
    const stage = { id: 'stage-1', sequence: 1, requiredCapability: 'payroll.review.approve' };
    tx.payrollReviewCycle.findFirst.mockResolvedValueOnce({
      ...cycle,
      status: 'SUBMITTED',
      submissionNumber: 1,
      approvalStages: [stage],
      decisions: [],
    });
    await expect(service.approveReview(cycle.id, {}, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
    tx.payrollReviewCycle.findFirst.mockResolvedValueOnce({
      ...cycle,
      status: 'APPROVED',
      approvalStages: [stage],
      decisions: [],
    });
    await expect(
      service.approveReview(cycle.id, {}, { ...principal, actorId: 'other' }),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.payrollReviewCycle.findFirst.mockResolvedValueOnce({
      ...cycle,
      status: 'SUBMITTED',
      submissionNumber: 1,
      approvalStages: [stage],
    });
    await expect(service.rejectReview(cycle.id, {}, principal)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects submitted review atomically and supports a new review round', async () => {
    const stage = { id: 'stage-1', sequence: 1, requiredCapability: 'payroll.review.approve' };
    tx.payrollReviewCycle.findFirst
      .mockResolvedValueOnce({
        ...cycle,
        status: 'SUBMITTED',
        submissionNumber: 1,
        approvalStages: [stage],
      })
      .mockResolvedValueOnce({ ...cycle, status: 'REJECTED', submissionNumber: 1 });
    tx.payrollReviewDecision.create.mockResolvedValue({});
    tx.payrollReviewEvent.create.mockResolvedValue({});
    tx.payrollReviewCycle.update.mockImplementation(({ data }: { data: object }) => ({
      ...cycle,
      ...data,
    }));
    await expect(
      service.rejectReview(cycle.id, { reason: 'Correct values' }, principal),
    ).resolves.toEqual(expect.objectContaining({ status: 'REJECTED' }));
    await expect(service.startReview(cycle.id, principal)).resolves.toEqual(
      expect.objectContaining({ status: 'IN_REVIEW' }),
    );
    expect(tx.payrollReviewDecision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ decision: 'REJECTED', reason: 'Correct values' }),
    });
  });

  it('fails closed for workflow capabilities, cross-company resources and rollback', async () => {
    await expect(
      service.submitReview(cycle.id, { ...principal, permissions: [] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    tx.payrollReviewCycle.findFirst.mockResolvedValue(null);
    await expect(service.startReview(cycle.id, principal)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    const rollback = new Error('decision transaction rolled back');
    audit.transaction.mockRejectedValue(rollback);
    await expect(
      service.approveReview(
        cycle.id,
        {},
        {
          ...principal,
          actorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        },
      ),
    ).rejects.toBe(rollback);
  });

  it('closes an approved cycle only with complete valid approvals and no blocking finding', async () => {
    tx.payrollReviewCycle.findFirst.mockResolvedValue({
      ...cycle,
      status: 'APPROVED',
      submissionNumber: 1,
      approvalStages: [{ id: 's1' }, { id: 's2' }],
      decisions: [
        { reviewRound: 1, submissionNumber: 1, decision: 'APPROVED', invalidation: null },
        { reviewRound: 1, submissionNumber: 1, decision: 'APPROVED', invalidation: null },
      ],
    });
    tx.payrollReviewFinding.count.mockResolvedValue(0);
    tx.payrollReviewCycle.update.mockImplementation(({ data }: { data: object }) => ({
      ...cycle,
      ...data,
    }));
    tx.payrollReviewEvent.create.mockResolvedValue({});
    await expect(service.closeReview(cycle.id, principal)).resolves.toEqual(
      expect.objectContaining({ status: 'CLOSED' }),
    );
    expect(audit.append).toHaveBeenCalledWith(expect.any(Object), tx);
  });

  it('reopens approved and closed cycles, invalidates approvals and starts a new round', async () => {
    for (const status of ['APPROVED', 'CLOSED'] as const) {
      jest.clearAllMocks();
      audit.transaction.mockImplementation((work: (client: typeof tx) => Promise<unknown>) =>
        work(tx),
      );
      tx.payrollReviewCycle.findFirst.mockResolvedValue({
        ...cycle,
        status,
        decisions: [{ id: 'decision-1', reviewRound: 1, invalidation: null }],
      });
      tx.payrollReviewEvent.create.mockResolvedValue({});
      tx.payrollReviewDecisionInvalidation.createMany.mockResolvedValue({ count: 1 });
      tx.payrollReviewCycle.update.mockResolvedValue({
        ...cycle,
        status: 'IN_REVIEW',
        reviewRound: 2,
      });
      await expect(
        service.reopenReview(cycle.id, { reason: 'Correction required' }, principal),
      ).resolves.toEqual(expect.objectContaining({ status: 'IN_REVIEW', reviewRound: 2 }));
      expect(tx.payrollReviewDecisionInvalidation.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ decisionId: 'decision-1', reviewRound: 1 })],
      });
      expect(tx.payrollReviewEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ eventType: 'APPROVALS_INVALIDATED' }),
      });
    }
  });
});
