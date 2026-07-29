import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roles = [
  ['ADMINISTRATOR', 'Administrador'],
  ['HR', 'RH'],
  ['PERSONNEL_DEPARTMENT', 'Departamento Pessoal'],
  ['FINANCE', 'Financeiro'],
  ['MANAGER', 'Gestor'],
  ['DIRECTOR', 'Diretor'],
  ['READ_ONLY', 'Somente Leitura'],
] as const;

const permissions = [
  [
    'platform.read',
    'View platform resources',
    'platform',
    'read',
    'PLATFORM',
    'MEDIUM',
    'SENSITIVE',
  ],
  [
    'platform.manage',
    'Manage platform resources',
    'platform',
    'manage',
    'PLATFORM',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'delegation.manage',
    'Manage temporary substitutions',
    'delegation',
    'manage',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'emergency_access.manage',
    'Manage audited emergency access',
    'emergency_access',
    'manage',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.review.view',
    'View payroll review cycles and findings',
    'payroll.review',
    'view',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.review.create',
    'Open payroll review cycles',
    'payroll.review',
    'create',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.finding.create',
    'Create payroll review findings',
    'payroll.review.finding',
    'create',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.finding.resolve',
    'Resolve payroll review findings',
    'payroll.review.finding',
    'resolve',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.finding.reopen',
    'Reopen payroll review findings',
    'payroll.review.finding',
    'reopen',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.submit',
    'Submit payroll review cycles',
    'payroll.review',
    'submit',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.approve',
    'Approve configured payroll review stages',
    'payroll.review',
    'approve',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.review.reject',
    'Reject submitted payroll review cycles',
    'payroll.review',
    'reject',
    'COMPANY',
    'HIGH',
    'RESTRICTED',
  ],
  [
    'payroll.review.close',
    'Close approved payroll review cycles',
    'payroll.review',
    'close',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.review.reopen',
    'Reopen approved or closed payroll review cycles',
    'payroll.review',
    'reopen',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.view',
    'View payroll period closure summary',
    'payroll.period.close',
    'view',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.readiness',
    'Evaluate payroll period closure readiness',
    'payroll.period.close',
    'readiness',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.execute',
    'Execute payroll period closure',
    'payroll.period.close',
    'execute',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.reopen',
    'Reopen a closed payroll period',
    'payroll.period.close',
    'reopen',
    'COMPANY',
    'CRITICAL',
    'RESTRICTED',
  ],
  [
    'payroll.period.close.history',
    'View payroll period closure history',
    'payroll.period.close',
    'history',
    'COMPANY',
    'MEDIUM',
    'RESTRICTED',
  ],
] as const;

async function main() {
  await Promise.all(
    roles.map(([code, name]) =>
      prisma.role.upsert({
        where: { code },
        update: { name },
        create: { code, name },
      }),
    ),
  );

  await Promise.all(
    permissions.map(([code, description, resource, action, scope, riskLevel, sensitivity]) =>
      prisma.permission.upsert({
        where: { code },
        update: {
          name: code,
          description,
          resource,
          action,
          scope,
          riskLevel,
          sensitivity,
          status: 'ACTIVE',
        },
        create: {
          code,
          name: code,
          description,
          resource,
          action,
          scope,
          riskLevel,
          sensitivity,
        },
      }),
    ),
  );

  const company = await prisma.company.upsert({
    where: { taxId: '00.000.000/0001-00' },
    update: {},
    create: {
      legalName: 'Empresa Fictícia de Demonstração Ltda.',
      tradeName: 'Empresa Demonstração',
      taxId: '00.000.000/0001-00',
    },
  });

  await prisma.branch.upsert({
    where: { companyId_code: { companyId: company.id, code: 'MATRIZ-DEMO' } },
    update: {},
    create: {
      companyId: company.id,
      code: 'MATRIZ-DEMO',
      name: 'Filial Matriz Demonstrativa',
      address: { city: 'Cidade Fictícia', state: 'DF' },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
