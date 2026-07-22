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
  ['platform.read', 'View platform resources'],
  ['platform.manage', 'Manage platform resources'],
  ['delegation.manage', 'Manage temporary substitutions'],
  ['emergency_access.manage', 'Manage audited emergency access'],
  ['payroll.review.view', 'View payroll review cycles and findings'],
  ['payroll.review.create', 'Open payroll review cycles'],
  ['payroll.review.finding.create', 'Create payroll review findings'],
  ['payroll.review.finding.resolve', 'Resolve payroll review findings'],
  ['payroll.review.finding.reopen', 'Reopen payroll review findings'],
  ['payroll.review.submit', 'Submit payroll review cycles'],
  ['payroll.review.approve', 'Approve configured payroll review stages'],
  ['payroll.review.reject', 'Reject submitted payroll review cycles'],
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
    permissions.map(([code, description]) =>
      prisma.permission.upsert({
        where: { code },
        update: { description },
        create: { code, description },
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
