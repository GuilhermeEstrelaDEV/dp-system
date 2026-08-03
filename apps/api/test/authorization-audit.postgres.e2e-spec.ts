import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { AuditWriterService } from '../src/modules/auth/audit-writer.service';
import type { PrismaService } from '../src/prisma/prisma.service';

const databaseDescribe = process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

databaseDescribe('ETP-015.7 authorization audit events on PostgreSQL', () => {
  const prisma = new PrismaClient({ datasourceUrl: process.env.ETP0157_DATABASE_URL });
  const writer = new AuditWriterService(prisma as unknown as PrismaService);

  afterAll(async () => prisma.$disconnect());

  it('persists a canonical enterprise event with actor, company, trace and immutable decision', async () => {
    const suffix = randomUUID();
    const rollback = new Error('intentional rollback');
    await expect(
      prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            legalName: `Audit integration ${suffix}`,
            tradeName: 'Audit integration',
            taxId: suffix.replaceAll('-', '').slice(0, 14),
          },
        });
        const actor = await tx.user.create({
          data: {
            email: `${suffix}@etp-015-7.test`,
            displayName: 'Audit integration actor',
          },
        });
        const principal = {
          actorId: actor.id,
          activeCompanyId: company.id,
          permissions: ['delegation.manage'],
          traceId: suffix,
          sessionId: `session-${suffix}`,
          ipAddress: '127.0.0.1',
          userAgent: 'postgres-integration',
          accessGrants: [
            {
              id: `grant-${suffix}`,
              type: 'SUBSTITUTION' as const,
              capabilities: ['delegation.manage'],
            },
          ],
        };
        await writer.append(
          {
            principal,
            scope: {
              companyId: company.id,
              actorId: actor.id,
              sessionId: principal.sessionId,
              traceId: suffix,
            },
            action: 'SUBSTITUTION_REVOKED',
            entityType: 'TemporarySubstitution',
            entityId: randomUUID(),
            previousState: { status: 'ACTIVE' },
            nextState: { status: 'REVOKED' },
            reasonCode: 'GRANT_REVOKED',
          },
          tx,
        );
        const event = await tx.auditLog.findFirstOrThrow({ where: { traceId: suffix } });
        expect(event).toMatchObject({
          actorUserId: actor.id,
          companyId: company.id,
          action: 'SUBSTITUTION_REVOKED',
          traceId: suffix,
        });
        expect(event.metadata).toMatchObject({
          eventVersion: 1,
          requiredCapabilities: ['delegation.manage'],
          effectiveGrantIds: [`grant-${suffix}`],
        });
        throw rollback;
      }),
    ).rejects.toBe(rollback);
    expect(await prisma.auditLog.count({ where: { traceId: suffix } })).toBe(0);
  });

  it('rolls back the business mutation when required audit metadata is rejected', async () => {
    const suffix = randomUUID();
    await expect(
      prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            legalName: `Audit rollback ${suffix}`,
            tradeName: 'Audit rollback',
            taxId: suffix.replaceAll('-', '').slice(0, 14),
          },
        });
        const actor = await tx.user.create({
          data: {
            email: `${suffix}@etp-015-7.test`,
            displayName: 'Audit rollback actor',
          },
        });
        await writer.append(
          {
            principal: {
              actorId: actor.id,
              activeCompanyId: company.id,
              permissions: [],
              traceId: suffix,
              sessionId: `session-${suffix}`,
              ipAddress: '127.0.0.1',
              userAgent: 'postgres-integration',
              accessGrants: [],
            },
            action: 'USER_COMPANY_ROLE_REVOKED',
            entityType: 'UserCompanyRole',
            entityId: randomUUID(),
            metadata: { source: 'not-allowlisted' },
          },
          tx,
        );
      }),
    ).rejects.toThrow('Audit metadata is not allowed');
    expect(await prisma.company.count({ where: { legalName: `Audit rollback ${suffix}` } })).toBe(
      0,
    );
    expect(await prisma.user.count({ where: { email: `${suffix}@etp-015-7.test` } })).toBe(0);
  });
});
