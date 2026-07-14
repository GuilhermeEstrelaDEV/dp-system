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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
