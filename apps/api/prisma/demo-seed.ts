import { PrismaClient } from '@prisma/client';
import { PasswordHasherService } from '../src/modules/auth/password-hasher.service';

const prisma = new PrismaClient();
const passwords = new PasswordHasherService();
const validFrom = new Date('2026-01-01T00:00:00.000Z');
const accounts = [
  {
    email: process.env.DEMO_ADMIN_EMAIL ?? 'admin.demo@dp-system.local',
    password: process.env.DEMO_ADMIN_PASSWORD ?? 'DemoAdmin#2026!',
    displayName: 'Administrador Demo',
    roleCode: 'ADMINISTRATOR',
  },
  {
    email: process.env.DEMO_HR_EMAIL ?? 'rh.demo@dp-system.local',
    password: process.env.DEMO_HR_PASSWORD ?? 'DemoRh#2026!',
    displayName: 'Analista RH Demo',
    roleCode: 'HR',
  },
] as const;

function assertLocalDemo() {
  if (process.env.DEMO_ENV !== 'local-demo' || process.env.DEMO_SEED_ENABLED !== 'true')
    throw new Error('Demo seed recusado: ambiente local nao confirmado');
  if (
    accounts.some(
      ({ email, password }) => !email.endsWith('@dp-system.local') || password.length < 12,
    )
  )
    throw new Error('Demo seed recusado: identidade ficticia invalida');
}

async function assign(userId: string, companyId: string, roleId: string) {
  const existing = await prisma.userCompanyRole.findFirst({
    where: { userId, companyId, roleId, status: 'ACTIVE', validFrom },
  });
  if (existing) return;
  await prisma.userCompanyRole.create({
    data: {
      userId,
      companyId,
      roleId,
      sourceType: 'SYSTEM',
      sourceId: 'MVP-001.3-DEMO',
      reason: 'Vinculo ficticio exclusivo do prototipo local demonstrativo',
      correlationId: 'demo-seed-mvp-001-3',
      approvalReference: 'MVP-001.3 local demo seed',
      validFrom,
    },
  });
}

async function main() {
  assertLocalDemo();
  const primary = await prisma.company.findUniqueOrThrow({
    where: { taxId: '00.000.000/0001-00' },
  });
  const secondary = await prisma.company.upsert({
    where: { taxId: '11.111.111/0001-11' },
    update: { legalName: 'Horizonte Servicos Demonstrativos Ltda.', tradeName: 'Horizonte Demo' },
    create: {
      legalName: 'Horizonte Servicos Demonstrativos Ltda.',
      tradeName: 'Horizonte Demo',
      taxId: '11.111.111/0001-11',
    },
  });
  const ids = new Map<string, string>();
  for (const account of accounts) {
    const passwordHash = await passwords.hash(account.password);
    const user = await prisma.user.upsert({
      where: { email: account.email.toLowerCase() },
      update: { displayName: account.displayName, passwordHash, status: 'ACTIVE' },
      create: {
        email: account.email.toLowerCase(),
        displayName: account.displayName,
        passwordHash,
      },
    });
    ids.set(account.roleCode, user.id);
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'ADMINISTRATOR' } });
  const hrRole = await prisma.role.findUniqueOrThrow({ where: { code: 'HR' } });
  await assign(ids.get('ADMINISTRATOR')!, primary.id, adminRole.id);
  await assign(ids.get('ADMINISTRATOR')!, secondary.id, adminRole.id);
  await assign(ids.get('HR')!, primary.id, hrRole.id);
  console.log(
    'Demo seed concluido: 2 identidades ficticias, 2 empresas e zero grants automaticos.',
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Demo seed falhou');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
