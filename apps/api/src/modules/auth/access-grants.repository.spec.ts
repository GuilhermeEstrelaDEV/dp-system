import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { AccessGrantsRepository } from './access-grants.repository';
import { createActiveCompanyContext } from './active-company-context';
import { EnterpriseScopeFactory } from './enterprise-scope';
import type { AuthenticatedPrincipal } from './identity-context';

describe('AccessGrantsRepository', () => {
  const substitutionList = jest.fn();
  const substitutionFind = jest.fn();
  const substitutionUpdateMany = jest.fn();
  const emergencyFind = jest.fn();
  const emergencyUpdateMany = jest.fn();
  const memberships = jest.fn();
  const permissionCount = jest.fn();
  const prisma = {
    temporarySubstitution: { findMany: substitutionList },
    emergencyAccess: { findMany: jest.fn() },
  } as unknown as PrismaService;
  const tx = {
    temporarySubstitution: {
      findFirst: substitutionFind,
      findMany: substitutionList,
      updateMany: substitutionUpdateMany,
    },
    emergencyAccess: {
      findFirst: emergencyFind,
      findMany: jest.fn(),
      updateMany: emergencyUpdateMany,
    },
    userCompanyRole: { findMany: memberships },
    permission: { count: permissionCount },
  } as unknown as Prisma.TransactionClient;
  const repository = new AccessGrantsRepository(prisma);
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor-a',
    activeCompanyId: 'company-a',
    permissions: [],
    traceId: 'trace-a',
    sessionId: 'session-a',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    accessGrants: [],
  };
  const scope = new EnterpriseScopeFactory().create(
    createActiveCompanyContext({
      userId: principal.actorId,
      companyId: principal.activeCompanyId!,
      assignmentIds: ['assignment-a'],
      selectionSource: 'SESSION_TOKEN',
      resolvedAt: '2026-08-03T00:00:00.000Z',
    }),
    principal,
  );

  beforeEach(() => jest.clearAllMocks());

  it('scopes lists at the first database access', async () => {
    substitutionList.mockResolvedValue([]);
    await repository.listSubstitutions(scope);
    expect(substitutionList).toHaveBeenCalledWith({
      where: { companyId: 'company-a' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('uses id and company in the same detail predicate', async () => {
    substitutionFind.mockResolvedValue(null);
    await expect(repository.findActiveSubstitution(scope, 'grant-b', tx)).resolves.toBeNull();
    expect(substitutionFind).toHaveBeenCalledWith({
      where: { id: 'grant-b', companyId: 'company-a', status: 'ACTIVE' },
    });
  });

  it('retains company and active status in state changes and treats zero rows as absent', async () => {
    substitutionUpdateMany.mockResolvedValue({ count: 0 });
    await expect(
      repository.revokeSubstitution(scope, 'grant-b', { status: 'REVOKED' }, tx),
    ).resolves.toBeNull();
    expect(substitutionUpdateMany).toHaveBeenCalledWith({
      where: { id: 'grant-b', companyId: 'company-a', status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    });
    expect(substitutionFind).not.toHaveBeenCalled();
  });

  it('resolves memberships and capabilities only inside the active company and time window', async () => {
    memberships
      .mockResolvedValueOnce([{ userId: 'holder-a' }])
      .mockResolvedValueOnce([
        { role: { permissions: [{ permission: { code: 'payroll.review.view' } }] } },
      ]);
    const now = new Date('2026-08-03T12:00:00.000Z');
    await expect(
      repository.activeMembershipUserIds(scope, ['holder-a', 'user-b'], now, tx),
    ).resolves.toEqual(new Set(['holder-a']));
    await expect(repository.resolveUserCapabilities(scope, 'holder-a', now, tx)).resolves.toEqual(
      new Set(['payroll.review.view']),
    );
    expect(memberships).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-a' }),
      }),
    );
    expect(memberships).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-a', userId: 'holder-a' }),
      }),
    );
  });

  it('counts only active company capabilities', async () => {
    permissionCount.mockResolvedValue(1);
    await repository.countActiveCompanyCapabilities(['payroll.review.view'], tx);
    expect(permissionCount).toHaveBeenCalledWith({
      where: {
        code: { in: ['payroll.review.view'] },
        status: 'ACTIVE',
        scope: 'COMPANY',
      },
    });
  });
});
