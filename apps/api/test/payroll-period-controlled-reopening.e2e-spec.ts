import { PrismaClient } from '@prisma/client';
import type { AuthenticatedPrincipal } from '../src/common/http/request-context';
import { AuditWriterService } from '../src/modules/auth/audit-writer.service';
import { AuthorizationService } from '../src/modules/auth/authorization.service';
import { PayrollPeriodClosureRepository } from '../src/modules/payroll-periods/payroll-period-closure.repository';
import { PayrollPeriodControlledReopeningService } from '../src/modules/payroll-periods/payroll-period-controlled-reopening.service';
import type { PrismaService } from '../src/prisma/prisma.service';

const databaseUrl = process.env.PAYROLL_CLOSURE_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('controlled reopening on PostgreSQL', () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const service = new PayrollPeriodControlledReopeningService(
    new PayrollPeriodClosureRepository(),
    new AuditWriterService(prisma as unknown as PrismaService),
    new AuthorizationService(),
  );

  async function fixture(referenceDate: Date) {
    const company = await prisma.company.findFirstOrThrow();
    const actor = await prisma.user.upsert({
      where: { email: 'phase5-postgresql@dp-system.test' },
      update: {},
      create: { email: 'phase5-postgresql@dp-system.test', displayName: 'Phase 5 PostgreSQL' },
    });
    const calendar = await prisma.payrollCalendar.upsert({
      where: { companyId_name: { companyId: company.id, name: 'Phase 5 PostgreSQL' } },
      update: {},
      create: { companyId: company.id, name: 'Phase 5 PostgreSQL' },
    });
    const period = await prisma.payrollPeriod.create({
      data: {
        companyId: company.id,
        payrollCalendarId: calendar.id,
        referenceDate,
        type: 'MONTHLY',
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
    const closure = await prisma.payrollPeriodClosureVersion.create({
      data: {
        companyId: company.id,
        payrollPeriodId: period.id,
        version: 1,
        status: 'CLOSED',
        consistencyToken: period.updatedAt.toISOString(),
        optimisticVersion: 3,
        createdBy: actor.id,
        closedAt: new Date(),
      },
    });
    const manifest = await prisma.payrollPeriodClosureManifest.create({
      data: {
        companyId: company.id,
        payrollPeriodClosureId: closure.id,
        manifestVersion: 1,
        payload: { fixture: true },
        payloadHash: 'a'.repeat(64),
        hashAlgorithmVersion: 'sha256-canonical-json-v1',
        createdBy: actor.id,
        traceId: 'fixture-trace',
      },
    });
    await prisma.payrollPeriodClosureEvent.create({
      data: {
        companyId: company.id,
        payrollPeriodClosureId: closure.id,
        eventType: 'PERIOD_CLOSED',
        payload: { fixture: true },
        actorUserId: actor.id,
        traceId: 'fixture-trace',
      },
    });
    const principal: AuthenticatedPrincipal = {
      actorId: actor.id,
      activeCompanyId: company.id,
      permissions: ['payroll.period.close.reopen'],
      traceId: `trace-${period.id}`,
      sessionId: 'postgres-session',
      ipAddress: '127.0.0.1',
      userAgent: 'jest-postgresql',
      accessGrants: [],
    };
    return { period, closure, manifest, principal };
  }

  afterAll(async () => prisma.$disconnect());

  it('commits evidence invalidation, successor, audit and idempotent replay atomically', async () => {
    const data = await fixture(new Date('2099-01-01'));
    const key = '11111111-1111-4111-8111-111111111111';
    const command = {
      reason: 'Correção controlada',
      expectedConsistencyToken: data.period.updatedAt.toISOString(),
      expectedClosureVersion: 1,
    };
    const [first, replay] = await Promise.all([
      service.reopen(data.period.id, command, key, data.principal),
      service.reopen(data.period.id, command, key, data.principal),
    ]);
    expect(new Set([first.newClosureId, replay.newClosureId]).size).toBe(1);
    expect([first.idempotentReplay, replay.idempotentReplay].sort()).toEqual([false, true]);
    const versions = await prisma.payrollPeriodClosureVersion.findMany({
      where: { payrollPeriodId: data.period.id },
      orderBy: { version: 'asc' },
    });
    expect(versions).toHaveLength(2);
    expect(versions[0]).toMatchObject({ id: data.closure.id, status: 'CLOSED' });
    expect(versions[0]!.supersededAt).not.toBeNull();
    expect(versions[1]).toMatchObject({
      version: 2,
      status: 'OPEN',
      previousClosureVersionId: data.closure.id,
      selectedPayrollRunId: null,
      linkedReviewCycleId: null,
    });
    expect(
      await prisma.payrollPeriodClosureManifest.count({ where: { id: data.manifest.id } }),
    ).toBe(1);
    expect(
      await prisma.payrollPeriodClosureEvent.count({
        where: { payrollPeriodClosureId: { in: versions.map((item) => item.id) } },
      }),
    ).toBe(4);
    expect(
      await prisma.auditLog.count({
        where: { entityId: data.period.id, action: 'PAYROLL_PERIOD_REOPENED' },
      }),
    ).toBe(1);
  });

  it('serializes different keys and leaves no REOPENING state after the losing request', async () => {
    const data = await fixture(new Date('2100-02-01'));
    const command = {
      reason: 'Concorrência',
      expectedConsistencyToken: data.period.updatedAt.toISOString(),
      expectedClosureVersion: 1,
    };
    const results = await Promise.allSettled([
      service.reopen(
        data.period.id,
        command,
        '22222222-2222-4222-8222-222222222222',
        data.principal,
      ),
      service.reopen(
        data.period.id,
        command,
        '33333333-3333-4333-8333-333333333333',
        data.principal,
      ),
    ]);
    expect(results.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(
      await prisma.payrollPeriodClosureVersion.count({
        where: { payrollPeriodId: data.period.id, status: 'REOPENING' },
      }),
    ).toBe(0);
    expect(
      await prisma.payrollPeriodClosureVersion.count({
        where: { payrollPeriodId: data.period.id },
      }),
    ).toBe(2);
  });
});
