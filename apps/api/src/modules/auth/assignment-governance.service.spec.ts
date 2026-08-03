import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { AuditWriterService } from './audit-writer.service';
import { AssignmentGovernanceService } from './assignment-governance.service';
import { createActiveCompanyContext } from './active-company-context';
import { EnterpriseScopeFactory } from './enterprise-scope';

describe('AssignmentGovernanceService', () => {
  const rolePermissionCreate = jest.fn();
  const rolePermissionFindFirst = jest.fn();
  const rolePermissionUpdate = jest.fn();
  const userCompanyRoleCreate = jest.fn();
  const userCompanyRoleFindFirst = jest.fn();
  const userCompanyRoleUpdateMany = jest.fn();
  const append = jest.fn();
  const roleFindUnique = jest.fn();
  const permissionFindFirst = jest.fn();
  const userFindFirst = jest.fn();
  const companyFindFirst = jest.fn();
  const tx = {
    rolePermission: {
      create: rolePermissionCreate,
      findFirst: rolePermissionFindFirst,
      update: rolePermissionUpdate,
    },
    userCompanyRole: {
      create: userCompanyRoleCreate,
      findFirst: userCompanyRoleFindFirst,
      updateMany: userCompanyRoleUpdateMany,
    },
    role: { findUnique: roleFindUnique },
    permission: { findFirst: permissionFindFirst },
    user: { findFirst: userFindFirst },
    company: { findFirst: companyFindFirst },
  };
  const audit = {
    append,
    transaction: jest.fn((work: (client: typeof tx) => Promise<unknown>) => work(tx)),
  } as unknown as AuditWriterService;
  const service = new AssignmentGovernanceService(audit);
  const principal: AuthenticatedPrincipal = {
    actorId: 'actor',
    activeCompanyId: 'company',
    permissions: [],
    traceId: 'trace',
    sessionId: 'session',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    accessGrants: [],
  };
  const provenance = {
    sourceType: 'ADMINISTRATION' as const,
    reason: 'approved request',
    validFrom: new Date('2026-07-29T12:00:00.000Z'),
  };
  const scope = new EnterpriseScopeFactory().create(
    createActiveCompanyContext({
      userId: principal.actorId,
      companyId: principal.activeCompanyId!,
      assignmentIds: ['assignment'],
      selectionSource: 'SESSION_TOKEN',
      resolvedAt: '2026-08-03T00:00:00.000Z',
    }),
    principal,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    roleFindUnique.mockResolvedValue({ id: 'role' });
    permissionFindFirst.mockResolvedValue({ id: 'permission' });
    userFindFirst.mockResolvedValue({ id: 'user' });
    companyFindFirst.mockResolvedValue({ id: 'company' });
  });

  it('creates a role assignment and audit evidence in the same transaction', async () => {
    const assignment = { id: 'assignment', roleId: 'role', permissionId: 'permission' };
    rolePermissionCreate.mockResolvedValue(assignment);
    await expect(
      service.createRolePermission(
        { ...provenance, roleId: 'role', permissionId: 'permission' },
        principal,
      ),
    ).resolves.toBe(assignment);
    expect(rolePermissionCreate).toHaveBeenCalledWith({
      data: {
        ...provenance,
        correlationId: 'trace',
        roleId: 'role',
        permissionId: 'permission',
        assignedByUserId: 'actor',
      },
    });
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ROLE_PERMISSION_ASSIGNED',
        entityId: 'assignment',
        metadata: { source: 'ADMINISTRATION' },
      }),
      tx,
    );
    expect(audit.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('creates an enterprise assignment without deriving grants or roles', async () => {
    const assignment = { id: 'assignment', companyId: 'company' };
    userCompanyRoleCreate.mockResolvedValue(assignment);
    await expect(
      service.createUserCompanyRole(
        scope,
        { ...provenance, userId: 'user', roleId: 'role' },
        principal,
      ),
    ).resolves.toBe(assignment);
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_COMPANY_ROLE_ASSIGNED', entityId: 'assignment' }),
      tx,
    );
    expect(userCompanyRoleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ companyId: 'company', userId: 'user' }),
    });
  });

  it('rejects incomplete provenance and invalid half-open windows before writing', async () => {
    expect(() =>
      service.createRolePermission(
        { ...provenance, reason: ' ', roleId: 'role', permissionId: 'permission' },
        principal,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      service.createRolePermission(
        {
          ...provenance,
          validTo: provenance.validFrom,
          roleId: 'role',
          permissionId: 'permission',
        },
        principal,
      ),
    ).toThrow(BadRequestException);
    expect(rolePermissionCreate).not.toHaveBeenCalled();
  });

  it('rejects reserved or incomplete provenance sources', () => {
    expect(() =>
      service.createRolePermission(
        { ...provenance, sourceType: 'MIGRATION', roleId: 'role', permissionId: 'permission' },
        principal,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      service.createRolePermission(
        { ...provenance, sourceType: 'IMPORT', roleId: 'role', permissionId: 'permission' },
        principal,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      service.createRolePermission(
        { ...provenance, sourceType: 'SYSTEM', roleId: 'role', permissionId: 'permission' },
        principal,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects inactive assignment targets before writing', async () => {
    permissionFindFirst.mockResolvedValue(null);
    await expect(
      service.createRolePermission(
        { ...provenance, roleId: 'role', permissionId: 'retired' },
        principal,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    userFindFirst.mockResolvedValue(null);
    await expect(
      service.createUserCompanyRole(
        scope,
        { ...provenance, userId: 'inactive', roleId: 'role' },
        principal,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(rolePermissionCreate).not.toHaveBeenCalled();
    expect(userCompanyRoleCreate).not.toHaveBeenCalled();
  });

  it('logically revokes an assignment and preserves its historical row', async () => {
    const current = { id: 'assignment', status: 'ACTIVE' };
    const revoked = { ...current, status: 'REVOKED' };
    rolePermissionFindFirst.mockResolvedValue(current);
    rolePermissionUpdate.mockResolvedValue(revoked);
    await expect(
      service.revokeRolePermission('assignment', 'revoked by governance', principal),
    ).resolves.toBe(revoked);
    expect(rolePermissionUpdate).toHaveBeenCalledWith({
      where: { id: 'assignment' },
      data: expect.objectContaining({
        status: 'REVOKED',
        revokedByUserId: 'actor',
        revokeReason: 'revoked by governance',
      }),
    });
    expect(rolePermissionCreate).not.toHaveBeenCalled();
  });

  it('does not revoke an absent or already inactive assignment', async () => {
    userCompanyRoleFindFirst.mockResolvedValue(null);
    await expect(
      service.revokeUserCompanyRole(scope, 'missing', 'reason', principal),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(userCompanyRoleUpdateMany).not.toHaveBeenCalled();
  });

  it('keeps the company predicate in enterprise assignment revocation', async () => {
    const current = { id: 'assignment', companyId: 'company', status: 'ACTIVE' };
    const revoked = { ...current, status: 'REVOKED' };
    userCompanyRoleFindFirst.mockResolvedValueOnce(current).mockResolvedValueOnce(revoked);
    userCompanyRoleUpdateMany.mockResolvedValue({ count: 1 });
    await expect(
      service.revokeUserCompanyRole(scope, 'assignment', 'revoked by governance', principal),
    ).resolves.toBe(revoked);
    expect(userCompanyRoleUpdateMany).toHaveBeenCalledWith({
      where: { id: 'assignment', companyId: 'company', status: 'ACTIVE' },
      data: expect.objectContaining({ status: 'REVOKED', revokedByUserId: 'actor' }),
    });
  });

  it('propagates audit failure so the transaction can roll back', async () => {
    rolePermissionCreate.mockResolvedValue({ id: 'assignment' });
    append.mockRejectedValue(new Error('audit unavailable'));
    await expect(
      service.createRolePermission(
        { ...provenance, roleId: 'role', permissionId: 'permission' },
        principal,
      ),
    ).rejects.toThrow('audit unavailable');
  });
});
