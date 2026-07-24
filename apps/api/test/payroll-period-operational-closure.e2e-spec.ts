import { Prisma, PrismaClient } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../src/common/http/request-context';
import type { AuditWriterService } from '../src/modules/auth/audit-writer.service';
import { AuthorizationService } from '../src/modules/auth/authorization.service';
import { PayrollPeriodClosureRepository } from '../src/modules/payroll-periods/payroll-period-closure.repository';
import { PayrollPeriodOperationalClosureService } from '../src/modules/payroll-periods/payroll-period-operational-closure.service';
import { PayrollPeriodReadinessService } from '../src/modules/payroll-periods/payroll-period-readiness.service';

const databaseUrl = process.env.PAYROLL_CLOSURE_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('payroll period operational closure on PostgreSQL', () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const repository = new PayrollPeriodClosureRepository();
  const authorization = new AuthorizationService();
  const ids = {
    company: '11000000-0000-4000-8000-000000000001',
    otherCompany: '11000000-0000-4000-8000-000000000002',
    actor: '21000000-0000-4000-8000-000000000001',
    calendar: '31000000-0000-4000-8000-000000000001',
    otherCalendar: '31000000-0000-4000-8000-000000000002',
    position: '41000000-0000-4000-8000-000000000001',
    employee: '51000000-0000-4000-8000-000000000001',
    contract: '61000000-0000-4000-8000-000000000001',
  } as const;

  const principal: AuthenticatedPrincipal = {
    actorId: ids.actor,
    activeCompanyId: ids.company,
    permissions: ['payroll.period.close.execute'],
    traceId: 'trace-operational-db',
    sessionId: 'session-operational-db',
    ipAddress: '127.0.0.1',
    userAgent: 'jest-postgresql',
    accessGrants: [],
  };

  const audit = {
    transaction: <T>(
      work: (tx: Prisma.TransactionClient) => Promise<T>,
      options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
      },
    ) => prisma.$transaction(work, options),
    append: async (
      event: {
        principal: AuthenticatedPrincipal;
        action: string;
        entityType: string;
        entityId: string;
        previousState?: Prisma.InputJsonValue;
        nextState?: Prisma.InputJsonValue;
        reason?: string;
        metadata?: Prisma.InputJsonObject;
      },
      tx: Prisma.TransactionClient,
    ) => {
      await tx.auditLog.create({
        data: {
          actorUserId: event.principal.actorId,
          companyId: event.principal.activeCompanyId,
          sessionId: event.principal.sessionId,
          traceId: event.principal.traceId,
          ipAddress: event.principal.ipAddress,
          userAgent: event.principal.userAgent,
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          previousState: event.previousState,
          nextState: event.nextState,
          reason: event.reason,
          metadata: event.metadata,
        },
      });
    },
  };
  const readiness = new PayrollPeriodReadinessService(prisma as never, authorization);
  const service = new PayrollPeriodOperationalClosureService(
    repository,
    readiness,
    audit as unknown as AuditWriterService,
    authorization,
  );

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.company.createMany({
      data: [
        { id: ids.company, legalName: 'Operational One', tradeName: 'One', taxId: '110000000001' },
        {
          id: ids.otherCompany,
          legalName: 'Operational Two',
          tradeName: 'Two',
          taxId: '110000000002',
        },
      ],
    });
    await prisma.user.create({
      data: { id: ids.actor, email: 'operational@example.test', displayName: 'Operational Actor' },
    });
    await prisma.payrollCalendar.createMany({
      data: [
        { id: ids.calendar, companyId: ids.company, name: 'Operational Calendar' },
        { id: ids.otherCalendar, companyId: ids.otherCompany, name: 'Other Calendar' },
      ],
    });
    await prisma.position.create({
      data: { id: ids.position, companyId: ids.company, code: 'OP', name: 'Operational' },
    });
    await prisma.employee.create({ data: { id: ids.employee, legalName: 'Safe Employee' } });
    await prisma.employmentContract.create({
      data: {
        id: ids.contract,
        employeeId: ids.employee,
        companyId: ids.company,
        positionId: ids.position,
        registrationNumber: 'OP-1',
        contractType: 'EMPLOYEE',
        employmentRegime: 'STANDARD',
        startDate: new Date('2026-01-01'),
        weeklyHours: 40,
      },
    });
  });

  afterAll(async () => prisma.$disconnect());

  async function fixture(sequence: number) {
    const suffix = sequence.toString().padStart(12, '0');
    const periodId = `71000000-0000-4000-8000-${suffix}`;
    const runId = `72000000-0000-4000-8000-${suffix}`;
    const runEmployeeId = `73000000-0000-4000-8000-${suffix}`;
    const reviewId = `74000000-0000-4000-8000-${suffix}`;
    const stageOne = `75000000-0000-4000-8000-${suffix}`;
    const stageTwo = `76000000-0000-4000-8000-${suffix}`;
    const decisionOne = `77000000-0000-4000-8000-${suffix}`;
    const decisionTwo = `78000000-0000-4000-8000-${suffix}`;
    const closeEvent = `79000000-0000-4000-8000-${suffix}`;
    const period = await prisma.payrollPeriod.create({
      data: {
        id: periodId,
        companyId: ids.company,
        payrollCalendarId: ids.calendar,
        referenceDate: new Date(Date.UTC(2027, sequence - 1, 1)),
      },
    });
    await prisma.payrollRun.create({
      data: {
        id: runId,
        payrollPeriodId: periodId,
        sequence: 1,
        status: 'COMPLETED',
        engineVersion: 'engine-v1',
        parameterVersion: 'params-v1',
        completedAt: new Date(),
      },
    });
    await prisma.payrollRunEmployee.create({
      data: {
        id: runEmployeeId,
        payrollRunId: runId,
        employmentContractId: ids.contract,
        status: 'COMPLETED',
        grossAmount: new Prisma.Decimal('1000.00'),
        netAmount: new Prisma.Decimal('900.00'),
      },
    });
    await prisma.payrollReviewCycle.create({
      data: {
        id: reviewId,
        companyId: ids.company,
        payrollRunId: runId,
        status: 'CLOSED',
        createdBy: ids.actor,
        traceId: 'trace-review',
        submissionNumber: 1,
        currentApprovalStage: 2,
        reviewRound: 1,
      },
    });
    await prisma.payrollReviewApprovalStage.createMany({
      data: [
        {
          id: stageOne,
          reviewCycleId: reviewId,
          sequence: 1,
          code: 'STAGE_1',
          requiredCapability: 'payroll.review.approve',
        },
        {
          id: stageTwo,
          reviewCycleId: reviewId,
          sequence: 2,
          code: 'STAGE_2',
          requiredCapability: 'payroll.review.approve',
        },
      ],
    });
    await prisma.payrollReviewDecision.createMany({
      data: [
        {
          id: decisionOne,
          companyId: ids.company,
          reviewCycleId: reviewId,
          approvalStageId: stageOne,
          submissionNumber: 1,
          reviewRound: 1,
          decision: 'APPROVED',
          actorId: ids.actor,
          traceId: 'trace-decision-1',
        },
        {
          id: decisionTwo,
          companyId: ids.company,
          reviewCycleId: reviewId,
          approvalStageId: stageTwo,
          submissionNumber: 1,
          reviewRound: 1,
          decision: 'APPROVED',
          actorId: ids.actor,
          traceId: 'trace-decision-2',
        },
      ],
    });
    await prisma.payrollReviewEvent.create({
      data: {
        id: closeEvent,
        companyId: ids.company,
        reviewCycleId: reviewId,
        eventType: 'REVIEW_CLOSED',
        actorId: ids.actor,
        previousState: 'APPROVED',
        nextState: 'CLOSED',
        metadata: { round: 1 },
        traceId: 'trace-review-close',
      },
    });
    return { periodId, runId, token: period.updatedAt.toISOString() };
  }

  const command = (runId: string, token: string) => ({
    payrollRunId: runId,
    expectedConsistencyToken: token,
    warningAcknowledgements: [],
  });

  it('commits CLOSED, one manifest, events, idempotency and AuditLog atomically', async () => {
    const item = await fixture(1);
    const result = await service.close(
      item.periodId,
      command(item.runId, item.token),
      '11111111-1111-4111-8111-111111111111',
      principal,
    );
    expect(result).toMatchObject({ status: 'CLOSED', idempotentReplay: false });
    const [period, closure, manifests, events, audits, idempotencies] = await Promise.all([
      prisma.payrollPeriod.findUniqueOrThrow({ where: { id: item.periodId } }),
      prisma.payrollPeriodClosureVersion.findUniqueOrThrow({ where: { id: result.closureId } }),
      prisma.payrollPeriodClosureManifest.count({
        where: { payrollPeriodClosureId: result.closureId },
      }),
      prisma.payrollPeriodClosureEvent.findMany({
        where: { payrollPeriodClosureId: result.closureId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.auditLog.count({
        where: {
          entityType: 'PayrollPeriod',
          entityId: item.periodId,
          action: 'PAYROLL_PERIOD_CLOSED',
        },
      }),
      prisma.payrollPeriodClosureIdempotency.findMany({
        where: { payrollPeriodId: item.periodId },
      }),
    ]);
    expect(period.status).toBe('CLOSED');
    expect(closure).toMatchObject({ status: 'CLOSED', optimisticVersion: 3 });
    expect(manifests).toBe(1);
    expect(events.map((event) => event.eventType)).toEqual([
      'PERIOD_CLOSURE_STARTED',
      'PERIOD_CLOSED',
    ]);
    expect(audits).toBe(1);
    expect(idempotencies).toEqual([
      expect.objectContaining({ status: 'COMPLETED', responseReference: result.closureId }),
    ]);
  });

  it('serializes same-key requests into one close and one replay', async () => {
    const item = await fixture(2);
    const key = '22222222-2222-4222-8222-222222222222';
    const results = await Promise.all([
      service.close(item.periodId, command(item.runId, item.token), key, principal),
      service.close(item.periodId, command(item.runId, item.token), key, principal),
    ]);
    expect(new Set(results.map((result) => result.closureId)).size).toBe(1);
    expect(results.map((result) => result.idempotentReplay).sort()).toEqual([false, true]);
    await expect(
      prisma.payrollPeriodClosureVersion.count({ where: { payrollPeriodId: item.periodId } }),
    ).resolves.toBe(1);
    await expect(
      prisma.payrollPeriodClosureManifest.count({
        where: { payrollPeriodClosure: { payrollPeriodId: item.periodId } },
      }),
    ).resolves.toBe(1);
  });

  it('allows only one winner for concurrent different keys and leaves no CLOSING residue', async () => {
    const item = await fixture(3);
    const results = await Promise.allSettled([
      service.close(
        item.periodId,
        command(item.runId, item.token),
        '33333333-3333-4333-8333-333333333333',
        principal,
      ),
      service.close(
        item.periodId,
        command(item.runId, item.token),
        '44444444-4444-4444-8444-444444444444',
        principal,
      ),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    await expect(
      prisma.payrollPeriodClosureVersion.count({
        where: { payrollPeriodId: item.periodId, status: 'CLOSING' },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.payrollPeriodClosureVersion.count({
        where: { payrollPeriodId: item.periodId, status: 'CLOSED' },
      }),
    ).resolves.toBe(1);
  });

  it('returns 404 across companies before acquiring the aggregate lock', async () => {
    const item = await fixture(4);
    await expect(
      service.close(
        item.periodId,
        command(item.runId, item.token),
        '55555555-5555-4555-8555-555555555555',
        { ...principal, activeCompanyId: ids.otherCompany },
      ),
    ).rejects.toThrow('Competência não encontrada');
  });

  it('keeps manifests, events and acknowledgements append-only', async () => {
    const item = await fixture(5);
    const result = await service.close(
      item.periodId,
      command(item.runId, item.token),
      '66666666-6666-4666-8666-666666666666',
      principal,
    );
    await expect(
      prisma.$executeRaw`UPDATE "payroll_period_closure_manifests" SET "payload" = '{}' WHERE "id" = ${result.manifestId}::uuid`,
    ).rejects.toThrow('append-only');
    const event = await prisma.payrollPeriodClosureEvent.findFirstOrThrow({
      where: { payrollPeriodClosureId: result.closureId },
    });
    await expect(
      prisma.$executeRaw`DELETE FROM "payroll_period_closure_events" WHERE "id" = ${event.id}::uuid`,
    ).rejects.toThrow('append-only');
  });
});
