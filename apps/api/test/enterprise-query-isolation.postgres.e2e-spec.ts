import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { PrismaClient, type Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { PrismaService } from '../src/prisma/prisma.service';
import { AccessGrantsRepository } from '../src/modules/auth/access-grants.repository';
import { AccessGrantsService } from '../src/modules/auth/access-grants.service';
import { createActiveCompanyContext } from '../src/modules/auth/active-company-context';
import { AuditWriterService } from '../src/modules/auth/audit-writer.service';
import { AuthorizationService } from '../src/modules/auth/authorization.service';
import { EnterpriseScopeFactory } from '../src/modules/auth/enterprise-scope';
import type { AuthenticatedPrincipal } from '../src/modules/auth/identity-context';
import { DashboardRepository } from '../src/modules/dashboard/dashboard.repository';

const databaseDescribe = process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

databaseDescribe('ETP-015.5 enterprise query isolation on PostgreSQL', () => {
  const prisma = new PrismaClient({ datasourceUrl: process.env.ETP0155_DATABASE_URL });
  const prismaService = prisma as unknown as PrismaService;
  const sourceId = `etp-015-5-${randomUUID()}`;
  const ids = {
    companyA: randomUUID(),
    companyB: randomUUID(),
    actor: randomUUID(),
    holderA: randomUUID(),
    substituteA: randomUUID(),
    externalB: randomUUID(),
    roleA: randomUUID(),
    roleB: randomUUID(),
  };
  const now = new Date('2026-08-03T12:00:00.000Z');
  const principal = (companyId: string): AuthenticatedPrincipal => ({
    actorId: ids.actor,
    activeCompanyId: companyId,
    permissions: ['delegation.manage', 'emergency_access.manage'],
    traceId: `trace-${companyId}`,
    sessionId: `session-${companyId}`,
    ipAddress: '127.0.0.1',
    userAgent: 'etp-015-5-postgres',
    accessGrants: [],
  });
  const scope = (companyId: string) => {
    const actor = principal(companyId);
    return new EnterpriseScopeFactory().create(
      createActiveCompanyContext({
        userId: actor.actorId,
        companyId,
        assignmentIds: [`assignment-${companyId}`],
        selectionSource: 'SESSION_TOKEN',
        resolvedAt: now.toISOString(),
      }),
      actor,
    );
  };
  const assignment = (userId: string, companyId: string, roleId: string) => ({
    userId,
    companyId,
    roleId,
    sourceType: 'ADMINISTRATION' as const,
    sourceId,
    reason: 'ETP-015.5 PostgreSQL isolation fixture',
    correlationId: sourceId,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
  });

  beforeAll(async () => {
    await prisma.company.createMany({
      data: [
        {
          id: ids.companyA,
          legalName: 'Horizonte ETP-015.5',
          tradeName: 'Horizonte',
          taxId: `A${sourceId}`.slice(0, 20),
        },
        {
          id: ids.companyB,
          legalName: 'Atlas ETP-015.5',
          tradeName: 'Atlas',
          taxId: `B${sourceId}`.slice(0, 20),
        },
      ],
    });
    await prisma.user.createMany({
      data: [ids.actor, ids.holderA, ids.substituteA, ids.externalB].map((id, index) => ({
        id,
        email: `${index}-${sourceId}@etp-015-5.test`,
        displayName: `ETP-015.5 user ${index}`,
      })),
    });
    await prisma.role.createMany({
      data: [
        { id: ids.roleA, code: `ETP15A_${sourceId.slice(0, 43)}`, name: 'ETP-015.5 A' },
        { id: ids.roleB, code: `ETP15B_${sourceId.slice(0, 43)}`, name: 'ETP-015.5 B' },
      ],
    });
    const permission = await prisma.permission.findUniqueOrThrow({
      where: { code: 'payroll.review.view' },
    });
    await prisma.rolePermission.create({
      data: {
        roleId: ids.roleA,
        permissionId: permission.id,
        sourceType: 'ADMINISTRATION',
        sourceId,
        reason: 'ETP-015.5 controlled test grant',
        correlationId: sourceId,
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    await prisma.userCompanyRole.createMany({
      data: [
        assignment(ids.actor, ids.companyA, ids.roleA),
        assignment(ids.actor, ids.companyB, ids.roleB),
        assignment(ids.holderA, ids.companyA, ids.roleA),
        assignment(ids.substituteA, ids.companyA, ids.roleB),
        assignment(ids.externalB, ids.companyB, ids.roleB),
      ],
    });
    const [calendarA, calendarB] = await Promise.all([
      prisma.payrollCalendar.create({ data: { companyId: ids.companyA, name: sourceId } }),
      prisma.payrollCalendar.create({ data: { companyId: ids.companyB, name: sourceId } }),
    ]);
    await prisma.payrollPeriod.createMany({
      data: [
        {
          companyId: ids.companyA,
          payrollCalendarId: calendarA.id,
          referenceDate: new Date('2026-01-01T00:00:00.000Z'),
          status: 'OPEN',
        },
        {
          companyId: ids.companyA,
          payrollCalendarId: calendarA.id,
          referenceDate: new Date('2026-02-01T00:00:00.000Z'),
          status: 'CLOSED',
        },
        {
          companyId: ids.companyB,
          payrollCalendarId: calendarB.id,
          referenceDate: new Date('2026-01-01T00:00:00.000Z'),
          status: 'OPEN',
        },
        {
          companyId: ids.companyB,
          payrollCalendarId: calendarB.id,
          referenceDate: new Date('2026-02-01T00:00:00.000Z'),
          status: 'OPEN',
        },
        {
          companyId: ids.companyB,
          payrollCalendarId: calendarB.id,
          referenceDate: new Date('2026-03-01T00:00:00.000Z'),
          status: 'OPEN',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { traceId: { startsWith: 'trace-' } } });
    await prisma.temporarySubstitution.deleteMany({
      where: { companyId: { in: [ids.companyA, ids.companyB] } },
    });
    await prisma.emergencyAccess.deleteMany({
      where: { companyId: { in: [ids.companyA, ids.companyB] } },
    });
    await prisma.payrollPeriod.deleteMany({
      where: { companyId: { in: [ids.companyA, ids.companyB] } },
    });
    await prisma.payrollCalendar.deleteMany({
      where: { companyId: { in: [ids.companyA, ids.companyB] } },
    });
    await prisma.userCompanyRole.deleteMany({ where: { sourceId } });
    await prisma.rolePermission.deleteMany({ where: { sourceId } });
    await prisma.role.deleteMany({ where: { id: { in: [ids.roleA, ids.roleB] } } });
    await prisma.company.deleteMany({ where: { id: { in: [ids.companyA, ids.companyB] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [ids.actor, ids.holderA, ids.substituteA, ids.externalB] } },
    });
    await prisma.$disconnect();
  });

  it('keeps dashboard counts and aggregation isolated between Horizonte and Atlas', async () => {
    const repository = new DashboardRepository(prismaService);
    const countsA = await repository.payrollPeriodStatusCounts(scope(ids.companyA));
    const countsB = await repository.payrollPeriodStatusCounts(scope(ids.companyB));
    expect(countsA.reduce((total, row) => total + row._count._all, 0)).toBe(2);
    expect(countsB.reduce((total, row) => total + row._count._all, 0)).toBe(3);
    expect(countsA.find(({ status }) => status === 'OPEN')?._count._all).toBe(1);
    expect(countsB.find(({ status }) => status === 'OPEN')?._count._all).toBe(3);
  });

  it('derives the company on create and keeps grant lists isolated', async () => {
    const repository = new AccessGrantsRepository(prismaService);
    const service = new AccessGrantsService(
      repository,
      new AuditWriterService(prismaService),
      new AuthorizationService(),
      { getOrThrow: () => 8 } as unknown as ConfigService,
    );
    const created = await service.createSubstitution(scope(ids.companyA), principal(ids.companyA), {
      holderUserId: ids.holderA,
      substituteUserId: ids.substituteA,
      capabilities: ['payroll.review.view'],
      startsAt: now,
      expiresAt: new Date('2026-08-04T12:00:00.000Z'),
      reason: 'company-derived fixture',
    });

    expect(created).not.toHaveProperty('companyId');
    await expect(
      prisma.temporarySubstitution.findUniqueOrThrow({ where: { id: created.id } }),
    ).resolves.toMatchObject({ companyId: ids.companyA });
    const companyAList = await repository.listSubstitutions(scope(ids.companyA));
    expect(companyAList).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.id })]),
    );
    expect(companyAList.find(({ id }) => id === created.id)).not.toHaveProperty('companyId');
    await expect(repository.listSubstitutions(scope(ids.companyB))).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.id })]),
    );
  });

  it('returns no detail and changes no row for another company or an unknown ID', async () => {
    const repository = new AccessGrantsRepository(prismaService);
    const external = await prisma.temporarySubstitution.create({
      data: {
        companyId: ids.companyB,
        holderUserId: ids.actor,
        substituteUserId: ids.externalB,
        grantedByUserId: ids.actor,
        capabilities: ['payroll.review.view'],
        startsAt: now,
        expiresAt: new Date('2026-08-04T12:00:00.000Z'),
        reason: 'Atlas-only fixture',
      },
    });
    const tx = prisma as unknown as Prisma.TransactionClient;
    await expect(
      repository.findActiveSubstitution(scope(ids.companyA), external.id, tx),
    ).resolves.toBeNull();
    await expect(
      repository.findActiveSubstitution(scope(ids.companyA), randomUUID(), tx),
    ).resolves.toBeNull();
    await expect(
      repository.revokeSubstitution(scope(ids.companyA), external.id, { status: 'REVOKED' }, tx),
    ).resolves.toBeNull();
    await expect(
      prisma.temporarySubstitution.findUniqueOrThrow({ where: { id: external.id } }),
    ).resolves.toMatchObject({ companyId: ids.companyB, status: 'ACTIVE' });
  });

  it('blocks cross-company nested relations before a grant is inserted', async () => {
    const repository = new AccessGrantsRepository(prismaService);
    const service = new AccessGrantsService(
      repository,
      new AuditWriterService(prismaService),
      new AuthorizationService(),
      { getOrThrow: () => 8 } as unknown as ConfigService,
    );
    await expect(
      service.createSubstitution(scope(ids.companyA), principal(ids.companyA), {
        holderUserId: ids.holderA,
        substituteUserId: ids.externalB,
        capabilities: ['payroll.review.view'],
        startsAt: now,
        expiresAt: new Date('2026-08-04T12:00:00.000Z'),
        reason: 'must fail across companies',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      await prisma.temporarySubstitution.count({
        where: { companyId: ids.companyA, reason: 'must fail across companies' },
      }),
    ).toBe(0);
  });

  it('rolls back an enterprise write when transactional audit fails', async () => {
    const repository = new AccessGrantsRepository(prismaService);
    const failingAudit = {
      transaction: <T>(work: (client: Prisma.TransactionClient) => Promise<T>) =>
        prisma.$transaction(work),
      append: () => Promise.reject(new Error('audit unavailable')),
    } as unknown as AuditWriterService;
    const service = new AccessGrantsService(repository, failingAudit, new AuthorizationService(), {
      getOrThrow: () => 8,
    } as unknown as ConfigService);
    await expect(
      service.createSubstitution(scope(ids.companyA), principal(ids.companyA), {
        holderUserId: ids.holderA,
        substituteUserId: ids.substituteA,
        capabilities: ['payroll.review.view'],
        startsAt: now,
        expiresAt: new Date('2026-08-04T12:00:00.000Z'),
        reason: 'must roll back with audit',
      }),
    ).rejects.toThrow('audit unavailable');
    expect(
      await prisma.temporarySubstitution.count({
        where: { companyId: ids.companyA, reason: 'must roll back with audit' },
      }),
    ).toBe(0);
  });
});
