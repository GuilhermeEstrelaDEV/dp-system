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
