import {
  PayrollReviewCycleStatus,
  PayrollReviewEventType,
  PayrollReviewFindingSeverity,
  PayrollReviewFindingStatus,
  PrismaClient,
} from '@prisma/client';
import { DEMO_CLOSURE_FIXTURE } from '../src/demo-access/demo-closure-fixture';
import { PasswordHasherService } from '../src/modules/auth/password-hasher.service';

const prisma = new PrismaClient();
const passwords = new PasswordHasherService();
const referenceDate = new Date('2026-07-01T00:00:00.000Z');
const validFrom = new Date('2026-01-01T00:00:00.000Z');

const ids = {
  companies: {
    horizon: '10000000-0000-4000-8000-000000000001',
    atlas: '10000000-0000-4000-8000-000000000002',
  },
  users: {
    admin: '20000000-0000-4000-8000-000000000001',
    hr: '20000000-0000-4000-8000-000000000002',
  },
} as const;

const accounts = [
  {
    id: ids.users.admin,
    email: process.env.DEMO_ADMIN_EMAIL ?? 'admin.demo@dp-system.local',
    password: process.env.DEMO_ADMIN_PASSWORD ?? 'DemoAdmin#2026!',
    displayName: 'Administrador Demo',
    roleCode: 'ADMINISTRATOR',
  },
  {
    id: ids.users.hr,
    email: process.env.DEMO_HR_EMAIL ?? 'rh.demo@dp-system.local',
    password: process.env.DEMO_HR_PASSWORD ?? 'DemoRh#2026!',
    displayName: 'Analista RH Demo',
    roleCode: 'HR',
  },
] as const;

function demoId(group: string, sequence: number) {
  return `${group}0000000-0000-4000-8000-${sequence.toString().padStart(12, '0')}`;
}

export function assertLocalDemo(environment: NodeJS.ProcessEnv = process.env) {
  if (
    environment.DEMO_ENV !== 'local-demo' ||
    environment.DEMO_MODE !== 'true' ||
    environment.DEMO_SEED_ENABLED !== 'true'
  ) {
    throw new Error('Demo seed recusado: modo local demonstrativo não confirmado');
  }
  if (environment.NODE_ENV === 'production') {
    throw new Error('Demo seed recusado: ambiente de produção');
  }
  if (!environment.DATABASE_URL) throw new Error('Demo seed recusado: DATABASE_URL ausente');
  const database = new URL(environment.DATABASE_URL);
  if (
    !['localhost', '127.0.0.1'].includes(database.hostname) ||
    database.pathname !== '/dp_system_demo'
  ) {
    throw new Error('Demo seed recusado: banco não corresponde ao alvo local dp_system_demo');
  }
  if (
    accounts.some(
      ({ email, password }) => !email.endsWith('@dp-system.local') || password.length < 12,
    )
  ) {
    throw new Error('Demo seed recusado: identidade fictícia inválida');
  }
}

async function ensureAccount(account: (typeof accounts)[number]) {
  const email = account.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { displayName: account.displayName, status: 'ACTIVE' },
    });
  }
  return prisma.user.create({
    data: {
      id: account.id,
      email,
      displayName: account.displayName,
      passwordHash: await passwords.hash(account.password),
    },
  });
}

async function assign(id: string, userId: string, companyId: string, roleId: string) {
  const existing = await prisma.userCompanyRole.findFirst({
    where: { userId, companyId, roleId, status: 'ACTIVE', validFrom },
  });
  if (existing) return;
  await prisma.userCompanyRole.create({
    data: {
      id,
      userId,
      companyId,
      roleId,
      sourceType: 'SYSTEM',
      sourceId: 'MVP-001.5-DEMO',
      reason: 'Vínculo fictício exclusivo do protótipo local demonstrativo',
      correlationId: 'demo-seed-mvp-001-5',
      approvalReference: 'MVP-001 local demo seed',
      validFrom,
    },
  });
}

async function seedOrganizations(companyId: string, companyKey: 'horizon' | 'atlas') {
  const isHorizon = companyKey === 'horizon';
  const branch = await prisma.branch.upsert({
    where: { companyId_code: { companyId, code: isHorizon ? 'MATRIZ-DEMO' : 'ATLAS-MATRIZ' } },
    update: { status: 'ACTIVE' },
    create: {
      id: demoId('3', isHorizon ? 1 : 2),
      companyId,
      code: isHorizon ? 'MATRIZ-DEMO' : 'ATLAS-MATRIZ',
      name: isHorizon ? 'Matriz Horizonte Demonstrativa' : 'Matriz Atlas Demonstrativa',
      address: { city: 'Cidade Demonstrativa', state: 'DF' },
    },
  });
  const departmentNames = isHorizon
    ? ['Recursos Humanos', 'Financeiro', 'Operações', 'Tecnologia', 'Comercial']
    : ['Recursos Humanos', 'Operações', 'Administrativo'];
  const positionNames = isHorizon
    ? [
        'Analista RH',
        'Assistente DP',
        'Analista Financeiro',
        'Analista Operacional',
        'Líder Operacional',
        'Desenvolvedor',
        'Executivo Comercial',
        'Coordenador',
      ]
    : [
        'Analista RH',
        'Assistente Administrativo',
        'Analista Operacional',
        'Líder Operacional',
        'Coordenador',
      ];
  const costCenterNames = isHorizon
    ? ['Pessoas', 'Operação', 'Corporativo']
    : ['Operação', 'Administrativo'];
  const offset = isHorizon ? 0 : 100;
  const departments = [];
  for (const [index, name] of departmentNames.entries()) {
    departments.push(
      await prisma.department.upsert({
        where: { companyId_code: { companyId, code: `DEMO-DEP-${index + 1}` } },
        update: { name, branchId: branch.id, status: 'ACTIVE' },
        create: {
          id: demoId('4', offset + index + 1),
          companyId,
          branchId: branch.id,
          code: `DEMO-DEP-${index + 1}`,
          name,
        },
      }),
    );
  }
  const positions = [];
  for (const [index, name] of positionNames.entries()) {
    positions.push(
      await prisma.position.upsert({
        where: { companyId_code: { companyId, code: `DEMO-POS-${index + 1}` } },
        update: { name, status: 'ACTIVE' },
        create: {
          id: demoId('5', offset + index + 1),
          companyId,
          code: `DEMO-POS-${index + 1}`,
          name,
          description: 'Cargo fictício do protótipo local',
        },
      }),
    );
  }
  const costCenters = [];
  for (const [index, name] of costCenterNames.entries()) {
    costCenters.push(
      await prisma.costCenter.upsert({
        where: { companyId_code: { companyId, code: `DEMO-CC-${index + 1}` } },
        update: { name, status: 'ACTIVE' },
        create: {
          id: demoId('6', offset + index + 1),
          companyId,
          code: `DEMO-CC-${index + 1}`,
          name,
        },
      }),
    );
  }
  return { branch, departments, positions, costCenters };
}

async function seedPeople(
  companyId: string,
  companyKey: 'horizon' | 'atlas',
  organization: Awaited<ReturnType<typeof seedOrganizations>>,
) {
  const isHorizon = companyKey === 'horizon';
  const count = isHorizon ? 18 : 8;
  const offset = isHorizon ? 0 : 100;
  const contracts = [];
  for (let index = 0; index < count; index += 1) {
    const sequence = offset + index + 1;
    const label = `${isHorizon ? 'H' : 'A'}${(index + 1).toString().padStart(2, '0')}`;
    const employee = await prisma.employee.upsert({
      where: { id: demoId('7', sequence) },
      update: { legalName: `Colaborador Demo ${label}` },
      create: {
        id: demoId('7', sequence),
        legalName: `Colaborador Demo ${label}`,
        preferredName: `Demo ${label}`,
      },
    });
    await prisma.employeeContact.upsert({
      where: {
        employeeId_type_value: {
          employeeId: employee.id,
          type: 'EMAIL',
          value: `colaborador.${label.toLowerCase()}@dp-system.local`,
        },
      },
      update: { status: 'ACTIVE', isPrimary: true },
      create: {
        id: demoId('7', 500 + sequence),
        employeeId: employee.id,
        type: 'EMAIL',
        value: `colaborador.${label.toLowerCase()}@dp-system.local`,
        isPrimary: true,
      },
    });
    const ended = index >= count - (isHorizon ? 2 : 1);
    contracts.push(
      await prisma.employmentContract.upsert({
        where: { id: demoId('8', sequence) },
        update: { status: ended ? 'INACTIVE' : 'ACTIVE' },
        create: {
          id: demoId('8', sequence),
          employeeId: employee.id,
          companyId,
          branchId: organization.branch.id,
          departmentId: organization.departments[index % organization.departments.length]!.id,
          positionId: organization.positions[index % organization.positions.length]!.id,
          costCenterId: organization.costCenters[index % organization.costCenters.length]!.id,
          registrationNumber: `DEMO-${label}`,
          contractType: 'EMPLOYMENT',
          employmentRegime: 'DEMONSTRATIVE',
          startDate: new Date(Date.UTC(2024 + (index % 2), index % 12, 1 + (index % 20))),
          endDate: ended ? new Date('2026-05-31T00:00:00.000Z') : null,
          weeklyHours: index % 4 === 0 ? 30 : 40,
          status: ended ? 'INACTIVE' : 'ACTIVE',
        },
      }),
    );
  }
  return contracts;
}

async function seedPayrollConfiguration(companyId: string, companyKey: 'horizon' | 'atlas') {
  const offset = companyKey === 'horizon' ? 0 : 100;
  const category = await prisma.payrollRubricCategory.upsert({
    where: { companyId_code: { companyId, code: 'DEMO-EARNING' } },
    update: { name: 'Proventos demonstrativos', nature: 'EARNING', status: 'ACTIVE' },
    create: {
      id: demoId('f', offset + 1),
      companyId,
      code: 'DEMO-EARNING',
      name: 'Proventos demonstrativos',
      nature: 'EARNING',
    },
  });
  for (let index = 0; index < 2; index += 1) {
    const code = `DEMO-RUBRIC-${index + 1}`;
    const rubric = await prisma.payrollRubric.upsert({
      where: { companyId_code: { companyId, code } },
      update: { name: `Rubrica demonstrativa ${index + 1}`, status: 'ACTIVE' },
      create: {
        id: demoId('f', offset + 10 + index),
        companyId,
        payrollRubricCategoryId: category.id,
        code,
        name: `Rubrica demonstrativa ${index + 1}`,
      },
    });
    await prisma.payrollRubricVersion.upsert({
      where: { payrollRubricId_version: { payrollRubricId: rubric.id, version: 'demo-v1' } },
      update: { status: 'ACTIVE' },
      create: {
        id: demoId('f', offset + 20 + index),
        payrollRubricId: rubric.id,
        version: 'demo-v1',
        validFrom,
        incidenceConfiguration: { mode: 'DEMONSTRATIVE_ONLY' },
        configuration: { calculation: 'NOT_HOMOLOGATED' },
      },
    });
    await prisma.payrollParameter.upsert({
      where: {
        companyId_code_validFrom: {
          companyId,
          code: `DEMO-PARAM-${index + 1}`,
          validFrom,
        },
      },
      update: { name: `Parâmetro demonstrativo ${index + 1}`, status: 'ACTIVE' },
      create: {
        id: demoId('f', offset + 30 + index),
        companyId,
        code: `DEMO-PARAM-${index + 1}`,
        name: `Parâmetro demonstrativo ${index + 1}`,
        category: 'DEMONSTRATIVE',
        version: 'demo-v1',
        validFrom,
        definition: { mode: 'DEMONSTRATIVE_ONLY' },
        sourceReference: 'MVP local fictício',
        status: 'ACTIVE',
      },
    });
  }
}

async function seedAdmissions(
  companyId: string,
  contracts: Array<{ id: string; employeeId: string }>,
  offset: number,
) {
  for (let index = 0; index < (offset === 0 ? 4 : 2); index += 1) {
    const contract = contracts[index]!;
    await prisma.admissionProcess.upsert({
      where: { id: demoId('9', 500 + offset + index + 1) },
      update: {},
      create: {
        id: demoId('9', 500 + offset + index + 1),
        employeeId: contract.employeeId,
        employmentContractId: contract.id,
        companyId,
        plannedAdmissionDate: new Date(Date.UTC(2026, index + 1, 10)),
        effectiveAdmissionDate: new Date(Date.UTC(2026, index + 1, 10)),
        status: 'COMPLETED',
        operationalOwner: 'Equipe Demo',
        notes: 'Processo fictício concluído para apresentação local',
        completedAt: new Date(Date.UTC(2026, index + 1, 10, 15)),
      },
    });
  }
}

async function seedPayroll(
  companyId: string,
  companyKey: 'horizon' | 'atlas',
  creatorId: string,
  contracts: Array<{ id: string }>,
) {
  const isHorizon = companyKey === 'horizon';
  const offset = isHorizon ? 0 : 100;
  const periodCount = isHorizon ? 6 : 4;
  const cycleStatuses: PayrollReviewCycleStatus[] = isHorizon
    ? ['OPEN', 'IN_REVIEW', 'SUBMITTED', 'CLOSED', 'REJECTED']
    : ['OPEN', 'IN_REVIEW', 'APPROVED'];
  const calendar = await prisma.payrollCalendar.upsert({
    where: { companyId_name: { companyId, name: 'Calendário Demonstrativo' } },
    update: { status: 'ACTIVE' },
    create: {
      id: demoId('9', offset + 1),
      companyId,
      name: 'Calendário Demonstrativo',
    },
  });
  const periods = [];
  const runs = [];
  for (let index = 0; index < periodCount; index += 1) {
    const reference = new Date(Date.UTC(2026, 6 - index, 1));
    const status = index % 3 === 0 ? 'OPEN' : index % 3 === 1 ? 'PROCESSING' : 'CLOSED';
    const period = await prisma.payrollPeriod.upsert({
      where: {
        companyId_referenceDate_type: { companyId, referenceDate: reference, type: 'REGULAR' },
      },
      update: { status },
      create: {
        id: demoId('a', offset + index + 1),
        companyId,
        payrollCalendarId: calendar.id,
        referenceDate: reference,
        status,
        engineVersion: 'demo-foundation-1',
        parameterVersion: 'demo-2026-07',
        openedAt: new Date(Date.UTC(2026, 5 - index, 20, 12)),
        closedAt: status === 'CLOSED' ? new Date(Date.UTC(2026, 6 - index, 5, 12)) : null,
      },
    });
    periods.push(period);
    runs.push(
      await prisma.payrollRun.upsert({
        where: { payrollPeriodId_sequence: { payrollPeriodId: period.id, sequence: 1 } },
        update: { status: 'COMPLETED' },
        create: {
          id: demoId('b', offset + index + 1),
          payrollPeriodId: period.id,
          sequence: 1,
          status: 'COMPLETED',
          engineVersion: 'demo-foundation-1',
          parameterVersion: 'demo-2026-07',
          startedAt: new Date(Date.UTC(2026, 6 - index, 2, 12)),
          completedAt: new Date(Date.UTC(2026, 6 - index, 2, 13)),
        },
      }),
    );
  }
  const demoRubric = await prisma.payrollRubric.findFirstOrThrow({
    where: { companyId, code: 'DEMO-RUBRIC-1' },
  });
  await prisma.payrollInput.upsert({
    where: {
      payrollPeriodId_sourceKey: {
        payrollPeriodId: periods[0]!.id,
        sourceKey: `DEMO-${companyKey.toUpperCase()}-INPUT`,
      },
    },
    update: { status: 'PENDING', amount: '125.50', quantity: '1.0000' },
    create: {
      id: demoId('e', offset + 1),
      payrollPeriodId: periods[0]!.id,
      employmentContractId: contracts[0]!.id,
      payrollRubricId: demoRubric.id,
      amount: '125.50',
      quantity: '1.0000',
      source: 'DEMO',
      sourceKey: `DEMO-${companyKey.toUpperCase()}-INPUT`,
      status: 'PENDING',
    },
  });
  const cycles = [];
  for (const [index, cycleStatus] of cycleStatuses.entries()) {
    const sequence = offset + index + 1;
    const occurredAt = new Date(Date.UTC(2026, 6 - index, 3, 14));
    const cycle = await prisma.payrollReviewCycle.upsert({
      where: { id: demoId('c', sequence) },
      update: {
        status: cycleStatus,
        submissionNumber: ['SUBMITTED', 'CLOSED', 'REJECTED'].includes(cycleStatus) ? 1 : 0,
        currentApprovalStage: cycleStatus === 'CLOSED' ? 2 : 0,
        reviewRound: 1,
      },
      create: {
        id: demoId('c', sequence),
        companyId,
        payrollRunId: runs[index % runs.length]!.id,
        status: cycleStatus,
        createdBy: creatorId,
        traceId: `demo-cycle-${companyKey}-${index + 1}`,
        createdAt: occurredAt,
        submissionNumber: ['SUBMITTED', 'CLOSED', 'REJECTED'].includes(cycleStatus) ? 1 : 0,
        currentApprovalStage: cycleStatus === 'CLOSED' ? 2 : 0,
      },
    });
    cycles.push(cycle);
    for (const stage of [1, 2]) {
      await prisma.payrollReviewApprovalStage.upsert({
        where: { reviewCycleId_sequence: { reviewCycleId: cycle.id, sequence: stage } },
        update: {},
        create: {
          id: demoId('f', sequence * 10 + stage),
          reviewCycleId: cycle.id,
          sequence: stage,
          code: `V1_STAGE_${stage}`,
          requiredCapability: 'payroll.review.approve',
        },
      });
    }
    if (cycle.id === DEMO_CLOSURE_FIXTURE.reviewCycleId) {
      await prisma.payrollReviewDecision.createMany({
        data: [1, 2].map((stage) => ({
          id: demoId('7', sequence * 10 + stage),
          companyId,
          reviewCycleId: cycle.id,
          approvalStageId: demoId('f', sequence * 10 + stage),
          submissionNumber: DEMO_CLOSURE_FIXTURE.submissionNumber,
          reviewRound: DEMO_CLOSURE_FIXTURE.reviewRound,
          decision: 'APPROVED' as const,
          actorId: creatorId,
          reason: `Aprovação fictícia da etapa ${stage} para demonstração local`,
          traceId: `demo-decision-${companyKey}-${index + 1}-${stage}`,
          occurredAt: new Date(occurredAt.getTime() + stage * 3_600_000),
        })),
        skipDuplicates: true,
      });
    }
    const transition: Partial<Record<PayrollReviewCycleStatus, PayrollReviewEventType>> = {
      IN_REVIEW: 'REVIEW_STARTED',
      SUBMITTED: 'REVIEW_SUBMITTED',
      APPROVED: 'REVIEW_APPROVED',
      REJECTED: 'REVIEW_REJECTED',
    };
    const closedEvents =
      cycle.id === DEMO_CLOSURE_FIXTURE.reviewCycleId
        ? [
            {
              id: demoId('e', sequence * 10 + 2),
              companyId,
              reviewCycleId: cycle.id,
              actorId: creatorId,
              traceId: `demo-event-${companyKey}-${index + 1}-start`,
              eventType: PayrollReviewEventType.REVIEW_STARTED,
              previousState: { status: 'OPEN' },
              nextState: { status: 'IN_REVIEW' },
              occurredAt: new Date(occurredAt.getTime() + 3_600_000),
              metadata: { source: 'MVP-essential-canonical-fixture' },
            },
            {
              id: demoId('e', sequence * 10 + 3),
              companyId,
              reviewCycleId: cycle.id,
              actorId: creatorId,
              traceId: `demo-event-${companyKey}-${index + 1}-submit`,
              eventType: PayrollReviewEventType.REVIEW_SUBMITTED,
              previousState: { status: 'IN_REVIEW' },
              nextState: { status: 'SUBMITTED', submissionNumber: 1 },
              occurredAt: new Date(occurredAt.getTime() + 2 * 3_600_000),
              metadata: { source: 'MVP-essential-canonical-fixture' },
            },
            {
              id: demoId('e', sequence * 10 + 4),
              companyId,
              reviewCycleId: cycle.id,
              actorId: creatorId,
              traceId: `demo-event-${companyKey}-${index + 1}-approve`,
              eventType: PayrollReviewEventType.REVIEW_APPROVED,
              previousState: { status: 'SUBMITTED' },
              nextState: { status: 'APPROVED', approvalStage: 2 },
              occurredAt: new Date(occurredAt.getTime() + 3 * 3_600_000),
              metadata: { source: 'MVP-essential-canonical-fixture' },
            },
            {
              id: demoId('e', sequence * 10 + 5),
              companyId,
              reviewCycleId: cycle.id,
              actorId: creatorId,
              traceId: `demo-event-${companyKey}-${index + 1}-close`,
              eventType: PayrollReviewEventType.REVIEW_CLOSED,
              previousState: { status: 'APPROVED' },
              nextState: { status: 'CLOSED' },
              occurredAt: new Date(occurredAt.getTime() + 4 * 3_600_000),
              metadata: { source: 'MVP-essential-canonical-fixture', round: 1 },
            },
          ]
        : [];
    await prisma.payrollReviewEvent.createMany({
      data: [
        {
          id: demoId('e', sequence * 10 + 1),
          companyId,
          reviewCycleId: cycle.id,
          actorId: creatorId,
          traceId: `demo-event-${companyKey}-${index + 1}-open`,
          eventType: 'REVIEW_CYCLE_OPENED',
          nextState: { status: 'OPEN' },
          occurredAt,
          metadata: { source: 'MVP-001.5-demo-seed' },
        },
        ...closedEvents,
        ...(transition[cycleStatus]
          ? [
              {
                id: demoId('e', sequence * 10 + 2),
                companyId,
                reviewCycleId: cycle.id,
                actorId: creatorId,
                traceId: `demo-event-${companyKey}-${index + 1}-transition`,
                eventType: transition[cycleStatus]!,
                previousState: { status: 'OPEN' },
                nextState: { status: cycleStatus },
                occurredAt: new Date(occurredAt.getTime() + 3_600_000),
                metadata: { source: 'MVP-001.5-demo-seed' },
              },
            ]
          : []),
      ],
      skipDuplicates: true,
    });
  }
  if (isHorizon) {
    const targetRun = runs[3];
    if (!targetRun || targetRun.id !== DEMO_CLOSURE_FIXTURE.payrollRunId) {
      throw new Error('Fixture canônico de fechamento não encontrou a execução determinística');
    }
    await prisma.payrollRunEmployee.createMany({
      data: contracts.slice(0, DEMO_CLOSURE_FIXTURE.employeeCount).map((contract, index) => ({
        id: demoId('6', 900 + index + 1),
        payrollRunId: targetRun.id,
        employmentContractId: contract.id,
        status: 'COMPLETED',
        grossAmount: index === 0 ? '7200.00' : '4850.00',
        netAmount: index === 0 ? '5832.00' : '3977.00',
        calculationMemory: {
          source: 'MVP-essential-canonical-fixture',
          fictional: true,
          grossAmount: index === 0 ? '7200.00' : '4850.00',
          netAmount: index === 0 ? '5832.00' : '3977.00',
        },
      })),
      skipDuplicates: true,
    });
  }
  const findingCount = isHorizon ? 6 : 2;
  for (let index = 0; index < findingCount; index += 1) {
    const sequence = offset + index + 1;
    const resolved = isHorizon ? index >= 4 : index >= 1;
    const cycle = cycles[index % cycles.length]!;
    const finding = await prisma.payrollReviewFinding.upsert({
      where: { id: demoId('d', sequence) },
      update: {
        status: resolved ? PayrollReviewFindingStatus.RESOLVED : PayrollReviewFindingStatus.OPEN,
      },
      create: {
        id: demoId('d', sequence),
        reviewCycleId: cycle.id,
        companyId,
        payrollRunId: cycle.payrollRunId,
        employmentContractId: contracts[index % contracts.length]!.id,
        severity:
          index % 2 === 0
            ? PayrollReviewFindingSeverity.BLOCKING
            : PayrollReviewFindingSeverity.INFORMATIONAL,
        status: resolved ? PayrollReviewFindingStatus.RESOLVED : PayrollReviewFindingStatus.OPEN,
        code: `DEMO-${companyKey.toUpperCase()}-${index + 1}`,
        title: `Achado demonstrativo ${index + 1}`,
        description: 'Achado fictício para validação visual do protótipo local',
        createdBy: creatorId,
        createdAt: new Date(Date.UTC(2026, 6 - (index % 5), 4, 10)),
        resolvedBy: resolved ? creatorId : null,
        resolvedAt: resolved ? new Date(Date.UTC(2026, 6 - (index % 5), 5, 10)) : null,
        resolutionReason: resolved ? 'Resolução fictícia do cenário demonstrativo' : null,
        traceId: `demo-finding-${companyKey}-${index + 1}`,
      },
    });
    await prisma.payrollReviewEvent.createMany({
      data: [
        {
          id: demoId('e', 5000 + sequence * 10 + 1),
          companyId,
          reviewCycleId: cycle.id,
          findingId: finding.id,
          actorId: creatorId,
          traceId: `demo-finding-event-${companyKey}-${index + 1}-open`,
          eventType: 'FINDING_OPENED',
          nextState: { status: 'OPEN' },
          occurredAt: finding.createdAt,
          metadata: { source: 'MVP-001.5-demo-seed' },
        },
        ...(resolved
          ? [
              {
                id: demoId('e', 5000 + sequence * 10 + 2),
                companyId,
                reviewCycleId: cycle.id,
                findingId: finding.id,
                actorId: creatorId,
                traceId: `demo-finding-event-${companyKey}-${index + 1}-resolved`,
                eventType: PayrollReviewEventType.FINDING_RESOLVED,
                previousState: { status: 'OPEN' },
                nextState: { status: 'RESOLVED' },
                occurredAt: finding.resolvedAt!,
                metadata: { source: 'MVP-001.5-demo-seed' },
              },
            ]
          : []),
      ],
      skipDuplicates: true,
    });
  }
}

async function seedP2Domains(
  companyId: string,
  companyKey: 'horizon' | 'atlas',
  contracts: Array<{ id: string }>,
) {
  const offset = companyKey === 'horizon' ? 0 : 100;
  const template = await prisma.checklistTemplate.upsert({
    where: { companyId_name: { companyId, name: 'Checklist admissional demonstrativo' } },
    update: { status: 'ACTIVE' },
    create: {
      id: demoId('3', 700 + offset),
      companyId,
      name: 'Checklist admissional demonstrativo',
      description: 'Template fictício para validação local da wave P2',
    },
  });
  const templateItem = await prisma.checklistTemplateItem.upsert({
    where: {
      checklistTemplateId_sortOrder: { checklistTemplateId: template.id, sortOrder: 1 },
    },
    update: { title: 'Validar cadastro fictício', isRequired: true },
    create: {
      id: demoId('3', 710 + offset),
      checklistTemplateId: template.id,
      title: 'Validar cadastro fictício',
      description: 'Item sem regra legal e sem documento real',
      sortOrder: 1,
      isRequired: true,
    },
  });
  const admission = await prisma.admissionProcess.findFirstOrThrow({
    where: { companyId },
    orderBy: { plannedAdmissionDate: 'asc' },
  });
  await prisma.admissionProcess.update({
    where: { id: admission.id },
    data: { checklistTemplateId: template.id },
  });
  const instance = await prisma.checklistInstance.upsert({
    where: { admissionProcessId: admission.id },
    update: { checklistTemplateId: template.id, templateName: template.name },
    create: {
      id: demoId('3', 720 + offset),
      admissionProcessId: admission.id,
      checklistTemplateId: template.id,
      templateName: template.name,
    },
  });
  await prisma.admissionChecklistItem.upsert({
    where: { checklistInstanceId_sortOrder: { checklistInstanceId: instance.id, sortOrder: 1 } },
    update: { status: 'COMPLETED', completedAt: referenceDate },
    create: {
      id: demoId('3', 730 + offset),
      checklistInstanceId: instance.id,
      title: templateItem.title,
      description: templateItem.description,
      sortOrder: 1,
      isRequired: true,
      status: 'COMPLETED',
      completedAt: referenceDate,
    },
  });
  const existingDocument = await prisma.admissionDocumentRequirement.findFirst({
    where: { admissionProcessId: admission.id, documentType: 'Documento lógico demonstrativo' },
  });
  if (!existingDocument) {
    await prisma.admissionDocumentRequirement.create({
      data: {
        id: demoId('3', 740 + offset),
        admissionProcessId: admission.id,
        documentType: 'Documento lógico demonstrativo',
        isRequired: true,
        receiptStatus: 'RECEIVED',
        reviewStatus: 'REVIEWED',
        receivedAt: referenceDate,
        reviewedAt: referenceDate,
        observation: 'Controle fictício sem arquivo armazenado',
      },
    });
  }

  const leaveType = await prisma.leaveType.upsert({
    where: { companyId_code: { companyId, code: 'DEMO-LEAVE' } },
    update: { status: 'ACTIVE' },
    create: {
      id: demoId('3', 750 + offset),
      companyId,
      code: 'DEMO-LEAVE',
      name: 'Afastamento administrativo demonstrativo',
      requiresExpectedReturn: true,
    },
  });
  await prisma.leaveCase.upsert({
    where: { id: demoId('3', 760 + offset) },
    update: {},
    create: {
      id: demoId('3', 760 + offset),
      employmentContractId: contracts[0]!.id,
      leaveTypeId: leaveType.id,
      startDate: new Date('2026-06-10T00:00:00.000Z'),
      expectedReturnDate: new Date('2026-06-15T00:00:00.000Z'),
      reason: 'Cenário fictício da wave P2',
    },
  });

  await prisma.variableCompensationEvent.upsert({
    where: { id: demoId('3', 770 + offset) },
    update: {},
    create: {
      id: demoId('3', 770 + offset),
      employmentContractId: contracts[0]!.id,
      referencePeriod: referenceDate,
      type: 'DEMONSTRATIVE_BONUS',
      amount: '125.50',
      policyReference: 'Referência fictícia sem cálculo automático',
    },
  });
  await prisma.salaryAdvance.upsert({
    where: { id: demoId('3', 780 + offset) },
    update: {},
    create: {
      id: demoId('3', 780 + offset),
      employmentContractId: contracts[0]!.id,
      referencePeriod: referenceDate,
      amount: '100.00',
    },
  });
  await prisma.offCyclePayment.upsert({
    where: { id: demoId('3', 790 + offset) },
    update: {},
    create: {
      id: demoId('3', 790 + offset),
      employmentContractId: contracts[0]!.id,
      referencePeriod: referenceDate,
      amount: '80.00',
      reason: 'Pagamento externo fictício',
    },
  });
  const run = await prisma.payrollRun.findFirstOrThrow({
    where: { payrollPeriod: { companyId } },
    orderBy: { startedAt: 'desc' },
  });
  await prisma.payrollReconciliation.upsert({
    where: { id: demoId('3', 800 + offset) },
    update: {},
    create: {
      id: demoId('3', 800 + offset),
      payrollRunId: run.id,
      type: 'DEMONSTRATIVE_COMPARISON',
      differenceAmount: '-10.00',
      notes: 'Conciliação fictícia sem decisão financeira',
    },
  });
}

async function seedP3Domains(
  companyId: string,
  companyKey: 'horizon' | 'atlas',
  contracts: Array<{ id: string }>,
) {
  const offset = companyKey === 'horizon' ? 0 : 100;
  const schedule = await prisma.workSchedule.upsert({
    where: { companyId_code: { companyId, code: 'DEMO-P3' } },
    update: { status: 'ACTIVE' },
    create: {
      id: demoId('4', 100 + offset),
      companyId,
      code: 'DEMO-P3',
      name: 'Jornada demonstrativa P3',
      weeklyMinutes: 2400,
    },
  });
  await prisma.workSchedulePeriod.upsert({
    where: {
      workScheduleId_weekday_startMinute: {
        workScheduleId: schedule.id,
        weekday: 1,
        startMinute: 480,
      },
    },
    update: { endMinute: 1020, breakMinutes: 60 },
    create: {
      id: demoId('4', 110 + offset),
      workScheduleId: schedule.id,
      weekday: 1,
      startMinute: 480,
      endMinute: 1020,
      breakMinutes: 60,
    },
  });
  await prisma.contractWorkSchedule.upsert({
    where: {
      employmentContractId_validFrom: {
        employmentContractId: contracts[0]!.id,
        validFrom,
      },
    },
    update: { workScheduleId: schedule.id },
    create: {
      id: demoId('4', 120 + offset),
      employmentContractId: contracts[0]!.id,
      workScheduleId: schedule.id,
      validFrom,
      reason: 'Vínculo fictício da wave P3',
    },
  });
  await prisma.holiday.upsert({
    where: {
      companyId_holidayDate_name: {
        companyId,
        holidayDate: new Date('2026-09-07T00:00:00.000Z'),
        name: 'Feriado demonstrativo P3',
      },
    },
    update: {},
    create: {
      id: demoId('4', 130 + offset),
      companyId,
      holidayDate: new Date('2026-09-07T00:00:00.000Z'),
      name: 'Feriado demonstrativo P3',
      scope: 'COMPANY',
    },
  });
  const timeEntry = await prisma.timeEntry.upsert({
    where: { id: demoId('4', 140 + offset) },
    update: {},
    create: {
      id: demoId('4', 140 + offset),
      employmentContractId: contracts[0]!.id,
      companyId,
      occurredOn: new Date('2026-08-03T00:00:00.000Z'),
      type: 'WORKED',
      minutes: 480,
      reason: 'Registro fictício da wave P3',
    },
  });
  await prisma.timeBalanceEntry.upsert({
    where: { id: demoId('4', 150 + offset) },
    update: {},
    create: {
      id: demoId('4', 150 + offset),
      employmentContractId: contracts[0]!.id,
      timeEntryId: timeEntry.id,
      occurredOn: timeEntry.occurredOn,
      minutes: 480,
      type: 'WORKED',
      reason: 'Movimento fictício da wave P3',
    },
  });

  const benefit = await prisma.benefit.upsert({
    where: { companyId_code: { companyId, code: 'DEMO-BENEFIT' } },
    update: { status: 'ACTIVE' },
    create: {
      id: demoId('4', 160 + offset),
      companyId,
      code: 'DEMO-BENEFIT',
      name: 'Benefício administrativo demonstrativo',
      type: 'GENERIC',
    },
  });
  const plan = await prisma.benefitPlan.upsert({
    where: {
      benefitId_name_validFrom: {
        benefitId: benefit.id,
        name: 'Plano fictício P3',
        validFrom,
      },
    },
    update: { status: 'ACTIVE' },
    create: {
      id: demoId('4', 170 + offset),
      benefitId: benefit.id,
      name: 'Plano fictício P3',
      employeeAmount: '10.00',
      companyAmount: '20.00',
      validFrom,
    },
  });
  const enrollment = await prisma.benefitEnrollment.upsert({
    where: { id: demoId('4', 180 + offset) },
    update: {},
    create: {
      id: demoId('4', 180 + offset),
      employmentContractId: contracts[0]!.id,
      benefitPlanId: plan.id,
      validFrom,
      reason: 'Adesão fictícia da wave P3',
    },
  });
  const enrollmentHistory = await prisma.benefitEnrollmentHistory.findFirst({
    where: { benefitEnrollmentId: enrollment.id, action: 'ENROLLED' },
  });
  if (!enrollmentHistory) {
    await prisma.benefitEnrollmentHistory.create({
      data: {
        id: demoId('4', 190 + offset),
        benefitEnrollmentId: enrollment.id,
        action: 'ENROLLED',
        reason: 'Histórico fictício da wave P3',
      },
    });
  }

  const period = await prisma.vacationPeriod.upsert({
    where: {
      employmentContractId_accrualStart: {
        employmentContractId: contracts[0]!.id,
        accrualStart: new Date('2025-01-01T00:00:00.000Z'),
      },
    },
    update: { status: 'OPEN' },
    create: {
      id: demoId('4', 200 + offset),
      employmentContractId: contracts[0]!.id,
      accrualStart: new Date('2025-01-01T00:00:00.000Z'),
      accrualEnd: new Date('2025-12-31T00:00:00.000Z'),
      grantStart: new Date('2026-01-01T00:00:00.000Z'),
      grantEnd: new Date('2026-12-31T00:00:00.000Z'),
      notes: 'Período fictício da wave P3',
    },
  });
  const collective = await prisma.collectiveVacation.upsert({
    where: { id: demoId('4', 210 + offset) },
    update: {},
    create: {
      id: demoId('4', 210 + offset),
      companyId,
      name: 'Férias coletivas demonstrativas P3',
      startDate: new Date('2026-12-20T00:00:00.000Z'),
      endDate: new Date('2026-12-24T00:00:00.000Z'),
      notes: 'Registro fictício sem regra legal',
    },
  });
  const request = await prisma.vacationRequest.upsert({
    where: { id: demoId('4', 220 + offset) },
    update: {},
    create: {
      id: demoId('4', 220 + offset),
      employmentContractId: contracts[0]!.id,
      vacationPeriodId: period.id,
      collectiveVacationId: collective.id,
      startDate: new Date('2026-09-14T00:00:00.000Z'),
      endDate: new Date('2026-09-18T00:00:00.000Z'),
      requestReason: 'Solicitação fictícia da wave P3',
    },
  });
  const requestHistory = await prisma.vacationRequestHistory.findFirst({
    where: { vacationRequestId: request.id, action: 'REQUESTED' },
  });
  if (!requestHistory) {
    await prisma.vacationRequestHistory.create({
      data: {
        id: demoId('4', 230 + offset),
        vacationRequestId: request.id,
        action: 'REQUESTED',
        reason: 'Histórico fictício da wave P3',
      },
    });
  }
}

async function main() {
  assertLocalDemo();
  const horizon = await prisma.company.findUniqueOrThrow({
    where: { taxId: '00.000.000/0001-00' },
  });
  if (horizon.id !== ids.companies.horizon) {
    throw new Error(
      'Demo seed recusado: execute demo:reset para reconstruir os IDs determinísticos',
    );
  }
  const atlas = await prisma.company.upsert({
    where: { taxId: '11.111.111/0001-11' },
    update: {
      legalName: 'Atlas Soluções Administrativas Demonstrativas Ltda.',
      tradeName: 'Atlas Demo',
      status: 'ACTIVE',
    },
    create: {
      id: ids.companies.atlas,
      legalName: 'Atlas Soluções Administrativas Demonstrativas Ltda.',
      tradeName: 'Atlas Demo',
      taxId: '11.111.111/0001-11',
    },
  });
  const users = new Map<string, string>();
  for (const account of accounts) users.set(account.roleCode, (await ensureAccount(account)).id);
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'ADMINISTRATOR' } });
  const hrRole = await prisma.role.findUniqueOrThrow({ where: { code: 'HR' } });
  await assign(demoId('2', 101), users.get('ADMINISTRATOR')!, horizon.id, adminRole.id);
  await assign(demoId('2', 102), users.get('ADMINISTRATOR')!, atlas.id, adminRole.id);
  await assign(demoId('2', 103), users.get('HR')!, horizon.id, hrRole.id);

  const horizonOrganization = await seedOrganizations(horizon.id, 'horizon');
  const atlasOrganization = await seedOrganizations(atlas.id, 'atlas');
  const horizonContracts = await seedPeople(horizon.id, 'horizon', horizonOrganization);
  const atlasContracts = await seedPeople(atlas.id, 'atlas', atlasOrganization);
  await seedPayrollConfiguration(horizon.id, 'horizon');
  await seedPayrollConfiguration(atlas.id, 'atlas');
  await seedAdmissions(horizon.id, horizonContracts, 0);
  await seedAdmissions(atlas.id, atlasContracts, 100);
  await seedPayroll(horizon.id, 'horizon', users.get('ADMINISTRATOR')!, horizonContracts);
  await seedPayroll(atlas.id, 'atlas', users.get('ADMINISTRATOR')!, atlasContracts);
  await seedP2Domains(horizon.id, 'horizon', horizonContracts);
  await seedP2Domains(atlas.id, 'atlas', atlasContracts);
  await seedP3Domains(horizon.id, 'horizon', horizonContracts);
  await seedP3Domains(atlas.id, 'atlas', atlasContracts);

  console.log(
    `Demo dataset concluído em ${referenceDate.toISOString().slice(0, 10)}: 2 empresas, 26 colaboradores, 10 competências e zero grants automáticos.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Demo seed falhou');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
