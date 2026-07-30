import { PrismaClient } from '@prisma/client';

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
    prisma.rolePermission.count(),
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
    prisma.$queryRaw<
      Array<{ count: bigint }>
    >`SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL`,
  ]);

  exact('empresas', companies.length, 2);
  exact('usuários', users.length, 2);
  exact('vínculos', companyRoles, 3);
  exact('grants de papel', rolePermissions, 0);
  exact('catálogo homologado', permissions, 19);
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
  exact('eventos', events, 25);
  exact('migrations', Number(migrations[0]?.count ?? 0), 16);

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
        referenceDate: '2026-07-01',
        dashboard,
        counts: {
          companies: 2,
          users: 2,
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
