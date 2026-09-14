import { PrismaClient } from '@prisma/client';
import { EXTERNAL_DEMO_ACCESS_SOURCE_ID } from '../src/demo-access/external-demo-access-profile';
import { EXTERNAL_DEMO_REVIEWER_USER_ID } from '../src/demo-access/external-demo-identities';
import {
  assertExternalDemoEnvironment,
  requireExternalReviewerCredentials,
} from '../src/demo-access/external-demo-environment';
import { PasswordHasherService } from '../src/modules/auth/password-hasher.service';

const command = process.argv[2];
const prisma = new PrismaClient();
const passwords = new PasswordHasherService();

async function provision(): Promise<void> {
  const { email, password } = requireExternalReviewerCredentials(process.env);
  await prisma.$transaction(async (tx) => {
    const [seedActor, emailOwner] = await Promise.all([
      tx.user.findUnique({ where: { id: EXTERNAL_DEMO_REVIEWER_USER_ID } }),
      tx.user.findUnique({ where: { email } }),
    ]);
    if (!seedActor) {
      throw new Error('Reviewer recusado: execute external-demo:seed antes do provisionamento');
    }
    if (emailOwner && emailOwner.id !== seedActor.id) {
      throw new Error('Reviewer recusado: e-mail já pertence a outra identidade');
    }
    const companyAssignments = await tx.userCompanyRole.count({
      where: {
        userId: seedActor.id,
        status: 'ACTIVE',
        company: { status: 'ACTIVE' },
      },
    });
    if (companyAssignments !== 2) {
      throw new Error('Reviewer recusado: vínculos fictícios esperados não foram encontrados');
    }
    await tx.user.update({
      where: { id: seedActor.id },
      data: {
        email,
        displayName: 'Reviewer da Demo Externa',
        passwordHash: await passwords.hash(password),
        status: 'ACTIVE',
      },
    });
  });
  console.log('Reviewer externo provisionado com identidade fictícia; senha não exibida.');
}

async function disable(): Promise<void> {
  const { email } = requireExternalReviewerCredentials(process.env);
  await prisma.$transaction(async (tx) => {
    const reviewer = await tx.user.findFirst({
      where: { id: EXTERNAL_DEMO_REVIEWER_USER_ID, email },
      select: { id: true, status: true },
    });
    if (!reviewer) throw new Error('Reviewer externo não encontrado');
    const activeAccess = await tx.rolePermission.count({
      where: {
        sourceId: EXTERNAL_DEMO_ACCESS_SOURCE_ID,
        status: 'ACTIVE',
        revokedAt: null,
        validFrom: { lte: new Date() },
        OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
      },
    });
    if (activeAccess > 0) {
      throw new Error('Desativação recusada: revogue primeiro os grants externos ativos');
    }
    if (reviewer.status !== 'INACTIVE') {
      await tx.user.update({ where: { id: reviewer.id }, data: { status: 'INACTIVE' } });
    }
  });
  console.log('Reviewer externo desativado; histórico preservado.');
}

async function status(): Promise<void> {
  assertExternalDemoEnvironment(process.env);
  const email = process.env.EXTERNAL_DEMO_REVIEWER_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error('Status recusado: EXTERNAL_DEMO_REVIEWER_EMAIL ausente');
  const reviewer = await prisma.user.findFirst({
    where: { id: EXTERNAL_DEMO_REVIEWER_USER_ID, email },
    select: { email: true, status: true },
  });
  console.log(
    reviewer ? `Reviewer ${reviewer.email}: ${reviewer.status}` : 'Reviewer: NOT PROVISIONED',
  );
}

async function main(): Promise<void> {
  assertExternalDemoEnvironment(process.env);
  if (command === 'provision') return provision();
  if (command === 'disable') return disable();
  if (command === 'status') return status();
  throw new Error('Comando inválido. Use provision, status ou disable.');
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Operação de reviewer externo recusada');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
