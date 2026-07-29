import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const databaseDescribe = process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

databaseDescribe('ETP-015.3 capability catalog and assignments on PostgreSQL', () => {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.ETP0153_DATABASE_URL,
  });
  const sourceId = `etp-015-3-test-${randomUUID()}`;

  afterAll(async () => {
    await prisma.rolePermission.deleteMany({ where: { sourceId } });
    await prisma.userCompanyRole.deleteMany({ where: { sourceId } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@etp-015-3.test' } } });
    await prisma.$disconnect();
  });

  it('seeds exactly the 19 approved classified capabilities and zero assignments', async () => {
    const catalog = await prisma.permission.findMany({ orderBy: { code: 'asc' } });
    expect(catalog).toHaveLength(19);
    expect(
      catalog.every(({ name, description, resource, action }) =>
        Boolean(name && description && resource && action),
      ),
    ).toBe(true);
    expect(catalog.filter(({ scope }) => scope === 'PLATFORM').map(({ code }) => code)).toEqual([
      'platform.manage',
      'platform.read',
    ]);
    expect(await prisma.rolePermission.count()).toBe(0);
    expect(await prisma.userCompanyRole.count()).toBe(0);
  });

  it('enforces half-open role assignment windows under concurrent writes', async () => {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'READ_ONLY' } });
    const permission = await prisma.permission.findUniqueOrThrow({
      where: { code: 'platform.read' },
    });
    const validFrom = new Date('2026-08-01T00:00:00.000Z');
    const data = {
      roleId: role.id,
      permissionId: permission.id,
      sourceType: 'ADMINISTRATION' as const,
      sourceId,
      reason: 'constraint integration test',
      correlationId: sourceId,
      validFrom,
    };

    const results = await Promise.allSettled([
      prisma.rolePermission.create({ data }),
      prisma.rolePermission.create({ data }),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1);

    const current = await prisma.rolePermission.findFirstOrThrow({ where: { sourceId } });
    await prisma.rolePermission.update({
      where: { id: current.id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date('2026-08-02T00:00:00.000Z'),
        revokeReason: 'integration test revocation',
      },
    });
    await expect(prisma.rolePermission.create({ data })).resolves.toMatchObject({
      status: 'ACTIVE',
    });
  });

  it('preserves enterprise assignment history and rejects overlapping active windows', async () => {
    const user = await prisma.user.create({
      data: {
        email: `${randomUUID()}@etp-015-3.test`,
        displayName: 'ETP-015.3 integration',
      },
    });
    const company = await prisma.company.findFirstOrThrow();
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'READ_ONLY' } });
    const data = {
      userId: user.id,
      companyId: company.id,
      roleId: role.id,
      sourceType: 'ADMINISTRATION' as const,
      sourceId,
      reason: 'constraint integration test',
      correlationId: sourceId,
      validFrom: new Date('2026-08-01T00:00:00.000Z'),
    };
    const current = await prisma.userCompanyRole.create({ data });
    await expect(prisma.userCompanyRole.create({ data })).rejects.toBeDefined();
    await prisma.userCompanyRole.update({
      where: { id: current.id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date('2026-08-02T00:00:00.000Z'),
        revokeReason: 'integration test revocation',
      },
    });
    await expect(prisma.userCompanyRole.create({ data })).resolves.toMatchObject({
      status: 'ACTIVE',
    });
    expect(await prisma.userCompanyRole.count({ where: { sourceId } })).toBe(2);
  });

  it('rejects invalid windows, incomplete revocation and unknown foreign keys', async () => {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'READ_ONLY' } });
    const permission = await prisma.permission.findUniqueOrThrow({
      where: { code: 'platform.manage' },
    });
    const base = {
      roleId: role.id,
      permissionId: permission.id,
      sourceType: 'ADMINISTRATION' as const,
      sourceId,
      reason: 'constraint integration test',
      correlationId: sourceId,
      validFrom: new Date('2026-09-02T00:00:00.000Z'),
      validTo: new Date('2026-09-01T00:00:00.000Z'),
    };
    await expect(prisma.rolePermission.create({ data: base })).rejects.toBeDefined();
    await expect(
      prisma.rolePermission.create({
        data: {
          ...base,
          validTo: undefined,
          status: 'REVOKED',
          revokedAt: new Date('2026-09-03T00:00:00.000Z'),
        },
      }),
    ).rejects.toBeDefined();
    await expect(
      prisma.rolePermission.create({
        data: {
          ...base,
          roleId: randomUUID(),
          validTo: undefined,
        },
      }),
    ).rejects.toBeDefined();
  });
});
