import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import type { AuditWriterService } from './audit-writer.service';
import { AssignmentGovernanceService } from './assignment-governance.service';

describe('AssignmentGovernanceService', () => {
  const rolePermissionCreate = jest.fn();
  const rolePermissionFindFirst = jest.fn();
  const rolePermissionUpdate = jest.fn();
  const userCompanyRoleCreate = jest.fn();
  const userCompanyRoleFindFirst = jest.fn();
  const userCompanyRoleUpdate = jest.fn();
  const append = jest.fn();
  const tx = {
    rolePermission: {
      create: rolePermissionCreate,
      findFirst: rolePermissionFindFirst,
      update: rolePermissionUpdate,
    },
    userCompanyRole: {
      create: userCompanyRoleCreate,
      findFirst: userCompanyRoleFindFirst,
      update: userCompanyRoleUpdate,
    },
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
    correlationId: 'trace',
    validFrom: new Date('2026-07-29T12:00:00.000Z'),
  };

  beforeEach(() => jest.clearAllMocks());

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
        roleId: 'role',
        permissionId: 'permission',
        assignedByUserId: 'actor',
      },
    });
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ROLE_PERMISSION_ASSIGNED', entityId: 'assignment' }),
      tx,
    );
  });

  it('creates an enterprise assignment without deriving grants or roles', async () => {
    const assignment = { id: 'assignment', companyId: 'company' };
    userCompanyRoleCreate.mockResolvedValue(assignment);
    await expect(
      service.createUserCompanyRole(
        { ...provenance, userId: 'user', companyId: 'company', roleId: 'role' },
        principal,
      ),
    ).resolves.toBe(assignment);
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_COMPANY_ROLE_ASSIGNED', entityId: 'assignment' }),
      tx,
    );
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
      service.revokeUserCompanyRole('missing', 'reason', principal),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(userCompanyRoleUpdate).not.toHaveBeenCalled();
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
