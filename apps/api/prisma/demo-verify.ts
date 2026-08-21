import { PrismaClient } from '@prisma/client';
import {
  DEMO_ACCESS_CAPABILITIES,
  DEMO_ACCESS_DURATION_MS,
  DEMO_ACCESS_ROLE,
  DEMO_ACCESS_SOURCE_ID,
} from '../src/demo-access/demo-access-tool';
import {
  DEMO_CLOSURE_FIXTURE,
  validateDemoClosureFixture,
} from '../src/demo-access/demo-closure-fixture';

const prisma = new PrismaClient();
const companyIds = [
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
] as const;

function assertDemoEnvironment() {
  if (
    process.env.DEMO_ENV !== 'local-demo' ||
    process.env.DEMO_MODE !== 'true' ||
    process.env.NODE_ENV === 'production' ||
    !process.env.DATABASE_URL
  ) {
    throw new Error('Verificação recusada: ambiente local demo não confirmado');
  }
  const database = new URL(process.env.DATABASE_URL);
  if (
    !['localhost', '127.0.0.1'].includes(database.hostname) ||
    database.pathname !== '/dp_system_demo'
  ) {
    throw new Error('Verificação recusada: banco local dp_system_demo não confirmado');
  }
}

function exact(label: string, actual: number, expected: number) {
  if (actual !== expected) throw new Error(`${label}: esperado ${expected}, encontrado ${actual}`);
}

function metadataRound(metadata: unknown): number | null {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) return null;
  const round = Reflect.get(metadata, 'round');
  return typeof round === 'number' ? round : null;
}

async function main() {
  assertDemoEnvironment();
  const [
    companies,
    users,
    companyRoles,
    rolePermissions,
    permissions,
    branches,
    departments,
    positions,
    costCenters,
    employees,
    contacts,
    contracts,
    admissions,
    periods,
    runs,
    cycles,
    findings,
    events,
    parameters,
    rubrics,
    targetRun,
    targetPeriod,
    migrations,
  ] = await Promise.all([
    prisma.company.findMany({ where: { id: { in: [...companyIds] } }, orderBy: { id: 'asc' } }),
    prisma.user.findMany({
      where: { email: { in: ['admin.demo@dp-system.local', 'rh.demo@dp-system.local'] } },
      select: { id: true, email: true, passwordHash: true },
    }),
    prisma.userCompanyRole.count({
      where: { companyId: { in: [...companyIds] }, status: 'ACTIVE' },
    }),
    prisma.rolePermission.findMany({
      include: {
        role: { select: { code: true } },
        permission: { select: { code: true } },
      },
    }),
    prisma.permission.count(),
    prisma.branch.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.department.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.position.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.costCenter.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.employee.count({
      where: { employmentContracts: { some: { companyId: { in: [...companyIds] } } } },
    }),
    prisma.employeeContact.count({
      where: {
        employee: { employmentContracts: { some: { companyId: { in: [...companyIds] } } } },
      },
    }),
    prisma.employmentContract.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.admissionProcess.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.payrollPeriod.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.payrollRun.count({ where: { payrollPeriod: { companyId: { in: [...companyIds] } } } }),
    prisma.payrollReviewCycle.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.payrollReviewFinding.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.payrollReviewEvent.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.payrollParameter.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.payrollRubric.count({ where: { companyId: { in: [...companyIds] } } }),
    prisma.payrollRun.findFirstOrThrow({
      where: {
        id: DEMO_CLOSURE_FIXTURE.payrollRunId,
        payrollPeriod: { companyId: DEMO_CLOSURE_FIXTURE.companyId },
      },
      select: {
        status: true,
        employees: {
          select: {
            status: true,
            employmentContract: { select: { companyId: true } },
          },
        },
        reviewCycles: {
          where: { id: DEMO_CLOSURE_FIXTURE.reviewCycleId },
          select: {
            status: true,
            approvalStages: { select: { id: true } },
            decisions: {
              select: {
                decision: true,
                submissionNumber: true,
                reviewRound: true,
                invalidation: { select: { id: true } },
              },
            },
            findings: { select: { severity: true, status: true } },
            events: {
              select: { eventType: true, occurredAt: true, metadata: true },
              orderBy: { occurredAt: 'asc' },
            },
          },
        },
      },
    }),
    prisma.payrollPeriod.findFirstOrThrow({
      where: {
        id: DEMO_CLOSURE_FIXTURE.payrollPeriodId,
        companyId: DEMO_CLOSURE_FIXTURE.companyId,
      },
      select: {
        status: true,
        closureVersions: {
          orderBy: { version: 'asc' },
          select: {
            version: true,
            status: true,
            supersededAt: true,
            manifests: { select: { id: true } },
            events: { select: { eventType: true } },
          },
        },
      },
    }),
    prisma.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL`,
  ]);

  exact('empresas', companies.length, 2);
  exact('usuários', users.length, 2);
  exact('vínculos', companyRoles, 3);
  exact('catálogo homologado', permissions, 37);
  exact('filiais', branches, 2);
  exact('departamentos', departments, 8);
  exact('cargos', positions, 13);
  exact('centros de custo', costCenters, 5);
  exact('colaboradores', employees, 26);
  exact('contatos', contacts, 26);
  exact('contratos', contracts, 26);
  exact('admissões', admissions, 6);
  exact('competências', periods, 10);
  exact('execuções', runs, 10);
  exact('conferências', cycles, 8);
  exact('achados', findings, 8);
  exact('eventos', events, 28);
  exact('parâmetros', parameters, 4);
  exact('rubricas', rubrics, 4);
  exact('migrations', Number(migrations[0]?.count ?? 0), 16);

  const now = new Date();
  const activeDemoGrants = rolePermissions.filter(
    ({ status, sourceId, validFrom, validTo, revokedAt }) =>
      status === 'ACTIVE' &&
      sourceId === DEMO_ACCESS_SOURCE_ID &&
      validFrom <= now &&
      validTo !== null &&
      validTo > now &&
      revokedAt === null,
  );
  if (![0, 24].includes(activeDemoGrants.length)) {
    throw new Error(`grants demo ativos: esperado 0 ou 24, encontrado ${activeDemoGrants.length}`);
  }
  const approvedCodes = new Set<string>(DEMO_ACCESS_CAPABILITIES);
  if (
    rolePermissions.some(
      ({ sourceId, sourceType, role, permission, validFrom, validTo }) =>
        sourceId !== DEMO_ACCESS_SOURCE_ID ||
        sourceType !== 'MANUAL' ||
        role.code !== DEMO_ACCESS_ROLE ||
        !approvedCodes.has(permission.code) ||
        validTo === null ||
        validTo.getTime() - validFrom.getTime() > DEMO_ACCESS_DURATION_MS,
    )
  ) {
    throw new Error('RolePermission fora da política local-demo explícita detectado');
  }

  const review = targetRun.reviewCycles[0];
  if (!review) throw new Error('Conferência do fixture canônico ausente');
  if (
    targetRun.employees.some(
      ({ status, employmentContract }) =>
        status !== 'COMPLETED' || employmentContract.companyId !== DEMO_CLOSURE_FIXTURE.companyId,
    )
  ) {
    throw new Error('Participante do fixture canônico fora da empresa ou não concluído');
  }
  const closedEvent = [...review.events]
    .reverse()
    .find(({ eventType }) => eventType === 'REVIEW_CLOSED');
  const fixtureLifecycle = validateDemoClosureFixture({
    periodStatus: targetPeriod.status,
    payrollRunStatus: targetRun.status,
    employeeCount: targetRun.employees.length,
    reviewStatus: review.status,
    approvalStageCount: review.approvalStages.length,
    approvedDecisionCount: review.decisions.filter(
      ({ decision, submissionNumber, reviewRound }) =>
        decision === 'APPROVED' &&
        submissionNumber === DEMO_CLOSURE_FIXTURE.submissionNumber &&
        reviewRound === DEMO_CLOSURE_FIXTURE.reviewRound,
    ).length,
    invalidatedDecisionCount: review.decisions.filter(({ invalidation }) => invalidation !== null)
      .length,
    openBlockingFindingCount: review.findings.filter(
      ({ severity, status }) => severity === 'BLOCKING' && status === 'OPEN',
    ).length,
    closedEventRound: closedEvent ? metadataRound(closedEvent.metadata) : null,
    hasLaterReviewReopenedEvent: review.events.some(
      ({ eventType, occurredAt }) =>
        eventType === 'REVIEW_REOPENED' &&
        closedEvent !== undefined &&
        occurredAt > closedEvent.occurredAt,
    ),
    closureVersions: targetPeriod.closureVersions.map((version) => ({
      version: version.version,
      status: version.status,
      superseded: version.supersededAt !== null,
      manifestCount: version.manifests.length,
      eventTypes: version.events.map(({ eventType }) => eventType),
    })),
  });
  if (
    activeDemoGrants.length === 24 &&
    new Set(activeDemoGrants.map(({ permission }) => permission.code)).size !== 24
  ) {
    throw new Error('grants demo ativos não correspondem às capabilities aprovadas');
  }

  if (users.some(({ passwordHash }) => !passwordHash?.startsWith('scrypt$'))) {
    throw new Error('Hash demonstrativo ausente ou incompatível');
  }
  if (
    users.some(({ passwordHash }) =>
      ['DemoAdmin#2026!', 'DemoRh#2026!'].includes(passwordHash ?? ''),
    )
  ) {
    throw new Error('Senha em texto puro detectada');
  }

  const dashboard = await Promise.all(
    companyIds.map(async (companyId) => ({
      companyId,
      cycles: await prisma.payrollReviewCycle.count({ where: { companyId } }),
      openFindings: await prisma.payrollReviewFinding.count({
        where: { companyId, status: 'OPEN' },
      }),
      periods: await prisma.payrollPeriod.count({ where: { companyId } }),
      timelineMonths: (
        await prisma.payrollReviewEvent.findMany({
          where: { companyId },
          select: { occurredAt: true },
        })
      ).reduce(
        (months, event) => months.add(event.occurredAt.toISOString().slice(0, 7)),
        new Set<string>(),
      ).size,
    })),
  );
  if (
    dashboard[0]!.cycles === dashboard[1]!.cycles ||
    dashboard.some(({ timelineMonths }) => timelineMonths < 3)
  ) {
    throw new Error('Dashboard não possui diferenças empresariais ou timeline suficiente');
  }

  console.log(
    JSON.stringify(
      {
        status: 'OK',
        fixtureLifecycle,
        referenceDate: '2026-07-01',
        dashboard,
        counts: {
          companies: 2,
          users: 2,
          companyRoles,
          rolePermissions: rolePermissions.length,
          activeDemoGrants: activeDemoGrants.length,
          permissions,
          branches,
          departments,
          positions,
          costCenters,
          employees,
          contacts,
          contracts,
          admissions,
          periods,
          runs,
          cycles,
          findings,
          events,
          fixtureRunEmployees: targetRun.employees.length,
          fixtureApprovalDecisions: review.decisions.length,
          fixtureClosureVersions: targetPeriod.closureVersions.length,
          migrations: Number(migrations[0]?.count ?? 0),
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Verificação do dataset falhou');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
