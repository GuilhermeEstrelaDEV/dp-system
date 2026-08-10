import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { AccessGrantsRepository } from './access-grants.repository';
import { AccessGrantsService } from './access-grants.service';
import { createActiveCompanyContext } from './active-company-context';
import type { AuditWriterService } from './audit-writer.service';
import { AuthorizationService } from './authorization.service';
import { EnterpriseScopeFactory } from './enterprise-scope';
import type { AuthenticatedPrincipal } from './identity-context';

describe('AccessGrantsService', () => {
  const activeMembershipUserIds = jest.fn();
  const resolveUserCapabilities = jest.fn();
  const countActiveCompanyCapabilities = jest.fn();
  const createSubstitution = jest.fn();
  const createEmergencyAccess = jest.fn();
  const findActiveSubstitution = jest.fn();
  const revokeSubstitution = jest.fn();
  const listSubstitutions = jest.fn();
  const findExpiredSubstitutions = jest.fn();
  const expireSubstitution = jest.fn();
  const append = jest.fn();
  const tx = { marker: 'transaction' };
  const repository = {
    activeMembershipUserIds,
    resolveUserCapabilities,
    countActiveCompanyCapabilities,
    createSubstitution,
    createEmergencyAccess,
    findActiveSubstitution,
    revokeSubstitution,
    listSubstitutions,
    findExpiredSubstitutions,
    expireSubstitution,
  } as unknown as AccessGrantsRepository;
  const audit = {
    append,
    transaction: jest.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)),
  } as unknown as AuditWriterService;
  const service = new AccessGrantsService(repository, audit, new AuthorizationService(), {
    getOrThrow: jest.fn().mockReturnValue(8),
  } as unknown as ConfigService);
  const principal: AuthenticatedPrincipal = {
    actorId: '11111111-1111-4111-8111-111111111111',
    activeCompanyId: '22222222-2222-4222-8222-222222222222',
    permissions: ['delegation.manage', 'emergency_access.manage'],
    traceId: 'trace',
    sessionId: 'session',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    accessGrants: [],
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
    findExpiredSubstitutions.mockResolvedValue([]);
  });

  it('creates a substitution only when holder and substitute belong to the active company', async () => {
    activeMembershipUserIds.mockResolvedValue(new Set(['holder', 'substitute']));
    resolveUserCapabilities.mockResolvedValue(new Set(['payroll.review.view']));
    const record = {
      id: 'grant',
      holderUserId: 'holder',
      substituteUserId: 'substitute',
      capabilities: ['payroll.review.view'],
      startsAt: new Date(Date.now() + 1000),
      expiresAt: new Date(Date.now() + 5000),
      status: 'ACTIVE',
      revokedAt: null,
    };
    createSubstitution.mockResolvedValue(record);
    await expect(
      service.createSubstitution(scope, principal, {
        holderUserId: 'holder',
        substituteUserId: 'substitute',
        capabilities: ['payroll.review.view'],
        startsAt: record.startsAt,
        expiresAt: record.expiresAt,
        reason: 'coverage',
      }),
    ).resolves.toEqual({
      id: 'grant',
      holderUserId: 'holder',
      substituteUserId: 'substitute',
      capabilities: ['payroll.review.view'],
      startsAt: record.startsAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      status: 'ACTIVE',
      revokedAt: null,
    });
    expect(createSubstitution).toHaveBeenCalledWith(
      scope,
      expect.not.objectContaining({ companyId: expect.anything() }),
      tx,
    );
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUBSTITUTION_CREATED' }),
      tx,
    );
  });

  it('blocks cross-company relations before creating a grant', async () => {
    activeMembershipUserIds.mockResolvedValue(new Set(['holder']));
    await expect(
      service.createSubstitution(scope, principal, {
        holderUserId: 'holder',
        substituteUserId: 'external-user',
        capabilities: ['payroll.review.view'],
        startsAt: new Date(Date.now() + 1000),
        expiresAt: new Date(Date.now() + 5000),
        reason: 'coverage',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(createSubstitution).not.toHaveBeenCalled();
  });

  it('returns the same absence for missing and cross-company grant IDs', async () => {
    findActiveSubstitution.mockResolvedValue(null);
    await expect(
      service.revokeSubstitution(scope, principal, 'external-grant', 'revoked'),
    ).rejects.toMatchObject({ response: { message: 'Concessão não encontrada' } });
    await expect(
      service.revokeSubstitution(scope, principal, 'missing-grant', 'revoked'),
    ).rejects.toMatchObject({ response: { message: 'Concessão não encontrada' } });
    expect(revokeSubstitution).not.toHaveBeenCalled();
  });

  it('fails closed when a concurrent scoped update affects no row', async () => {
    findActiveSubstitution.mockResolvedValue({ id: 'grant', status: 'ACTIVE' });
    revokeSubstitution.mockResolvedValue(null);
    await expect(
      service.revokeSubstitution(scope, principal, 'grant', 'revoked'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(append).not.toHaveBeenCalled();
  });

  it('blocks self substitution and capabilities not held by the holder', async () => {
    await expect(
      service.createSubstitution(scope, principal, {
        holderUserId: principal.actorId,
        substituteUserId: principal.actorId,
        capabilities: ['payroll.review.view'],
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
        reason: 'invalid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    activeMembershipUserIds.mockResolvedValue(new Set(['holder', 'substitute']));
    resolveUserCapabilities.mockResolvedValue(new Set());
    await expect(
      service.createSubstitution(scope, principal, {
        holderUserId: 'holder',
        substituteUserId: 'substitute',
        capabilities: ['payroll.review.approve'],
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
        reason: 'invalid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks emergency grants to a user outside the active company', async () => {
    activeMembershipUserIds.mockResolvedValue(new Set());
    await expect(
      service.grantEmergencyAccess(scope, principal, {
        beneficiaryUserId: 'external-user',
        capabilities: ['payroll.review.view'],
        expiresAt: new Date(Date.now() + 3_600_000),
        reason: 'incident',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(createEmergencyAccess).not.toHaveBeenCalled();
  });

  it('rejects a scope that does not match the authenticated principal', async () => {
    const otherPrincipal = { ...principal, activeCompanyId: 'other-company' };
    const otherScope = new EnterpriseScopeFactory().create(
      createActiveCompanyContext({
        userId: otherPrincipal.actorId,
        companyId: otherPrincipal.activeCompanyId,
        assignmentIds: ['other-assignment'],
        selectionSource: 'SESSION_TOKEN',
        resolvedAt: '2026-08-03T00:00:00.000Z',
      }),
      otherPrincipal,
    );
    await expect(service.listSubstitutions(otherScope, principal)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('projects list results and appends AR03 even when the result is empty', async () => {
    listSubstitutions.mockResolvedValue([]);

    await expect(service.listSubstitutions(scope, principal)).resolves.toEqual([]);
    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ACCESS_GRANTS_VIEWED',
        entityId: scope.companyId,
        reasonCode: 'SENSITIVE_READ_COMPLETED',
        metadata: { grantType: 'SUBSTITUTION', projectionProfile: 'MINIMAL' },
      }),
    );
  });

  it('does not return a sensitive read when AR03 persistence fails', async () => {
    listSubstitutions.mockResolvedValue([]);
    append.mockRejectedValueOnce(new Error('audit unavailable'));

    await expect(service.listSubstitutions(scope, principal)).rejects.toThrow('audit unavailable');
  });
});
