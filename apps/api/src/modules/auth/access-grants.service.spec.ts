import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../prisma/prisma.service';
import { AccessGrantsService } from './access-grants.service';
import type { AuditWriterService } from './audit-writer.service';
import { AuthorizationService } from './authorization.service';

describe('AccessGrantsService', () => {
  const assignments = jest.fn();
  const permissionCount = jest.fn();
  const substitutionCreate = jest.fn();
  const emergencyCreate = jest.fn();
  const append = jest.fn();
  const tx = {
    temporarySubstitution: { create: substitutionCreate },
    emergencyAccess: { create: emergencyCreate },
  };
  const audit = {
    append,
    transaction: jest.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)),
  };
  const service = new AccessGrantsService(
    {
      userCompanyRole: { findMany: assignments },
      permission: { count: permissionCount },
    } as unknown as PrismaService,
    audit as unknown as AuditWriterService,
    new AuthorizationService(),
    { getOrThrow: jest.fn().mockReturnValue(8) } as unknown as ConfigService,
  );
  const principal = {
    actorId: '11111111-1111-4111-8111-111111111111',
    activeCompanyId: '22222222-2222-4222-8222-222222222222',
    permissions: ['delegation.manage', 'emergency_access.manage'],
    traceId: 'trace',
    sessionId: 'session',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    accessGrants: [],
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates a future substitution with only explicit holder capabilities and transactional audit', async () => {
    assignments.mockResolvedValue([
      { role: { permissions: [{ permission: { code: 'payroll.view' } }] } },
    ]);
    const record = {
      id: 'grant',
      capabilities: ['payroll.view'],
      startsAt: new Date(Date.now() + 1000),
      expiresAt: new Date(Date.now() + 5000),
      status: 'ACTIVE',
    };
    substitutionCreate.mockResolvedValue(record);
    await expect(
      service.createSubstitution(principal, {
        holderUserId: '33333333-3333-4333-8333-333333333333',
        substituteUserId: '44444444-4444-4444-8444-444444444444',
        capabilities: ['payroll.view'],
        startsAt: record.startsAt,
        expiresAt: record.expiresAt,
        reason: 'coverage',
      }),
    ).resolves.toEqual(record);
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SUBSTITUTION_CREATED' }),
      tx,
    );
  });

  it('propagates an audit failure so Prisma can roll back domain and audit together', async () => {
    assignments.mockResolvedValue([
      { role: { permissions: [{ permission: { code: 'payroll.view' } }] } },
    ]);
    substitutionCreate.mockResolvedValue({
      id: 'grant',
      capabilities: ['payroll.view'],
      startsAt: new Date(Date.now() + 1000),
      expiresAt: new Date(Date.now() + 5000),
      status: 'ACTIVE',
    });
    append.mockRejectedValueOnce(new Error('audit failure'));
    await expect(
      service.createSubstitution(principal, {
        holderUserId: 'holder',
        substituteUserId: 'substitute',
        capabilities: ['payroll.view'],
        startsAt: new Date(Date.now() + 1000),
        expiresAt: new Date(Date.now() + 5000),
        reason: 'coverage',
      }),
    ).rejects.toThrow('audit failure');
  });

  it('blocks self substitution and capabilities not held by the holder', async () => {
    await expect(
      service.createSubstitution(principal, {
        holderUserId: principal.actorId,
        substituteUserId: principal.actorId,
        capabilities: ['payroll.view'],
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
        reason: 'invalid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    assignments.mockResolvedValue([{ role: { permissions: [] } }]);
    await expect(
      service.createSubstitution(principal, {
        holderUserId: 'holder',
        substituteUserId: 'substitute',
        capabilities: ['payroll.approve'],
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
        reason: 'invalid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks emergency self grants, expired grants and durations beyond the configured maximum', async () => {
    await expect(
      service.grantEmergencyAccess(principal, {
        beneficiaryUserId: principal.actorId,
        capabilities: ['payroll.view'],
        expiresAt: new Date(Date.now() + 1000),
        reason: 'invalid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.grantEmergencyAccess(principal, {
        beneficiaryUserId: 'beneficiary',
        capabilities: ['payroll.view'],
        expiresAt: new Date(Date.now() - 1000),
        reason: 'invalid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.grantEmergencyAccess(principal, {
        beneficiaryUserId: 'beneficiary',
        capabilities: ['payroll.view'],
        expiresAt: new Date(Date.now() + 9 * 3_600_000),
        reason: 'invalid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fails closed when company context is absent', async () => {
    await expect(
      service.listSubstitutions({ ...principal, activeCompanyId: null }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
