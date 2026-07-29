import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { ApplicationContextService } from './application-context.service';

describe('ApplicationContextService', () => {
  const findUnique = jest.fn();
  const assertActive = jest.fn();
  const service = new ApplicationContextService(
    { user: { findUnique } } as unknown as PrismaService,
    { assertActive } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('propagates actor, company, session, trace and effective permissions', async () => {
    findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [
        {
          role: {
            permissions: [
              { permission: { code: 'platform.manage' } },
              { permission: { code: 'payroll.approve' } },
            ],
          },
        },
      ],
      companyRoles: [{ role: { permissions: [{ permission: { code: 'payroll.view' } }] } }],
      substitutionsAsSubstitute: [],
      emergencyAccesses: [],
    });
    await expect(
      service.resolve(
        { actorId: 'actor', activeCompanyId: 'company-a', sessionId: 'session' },
        'trace',
      ),
    ).resolves.toEqual({
      actorId: 'actor',
      activeCompanyId: 'company-a',
      permissions: ['payroll.view', 'platform.manage'],
      traceId: 'trace',
      sessionId: 'session',
      ipAddress: 'unknown',
      userAgent: null,
      accessGrants: [],
    });
  });

  it('rejects inactive users', async () => {
    findUnique.mockResolvedValue({
      status: 'INACTIVE',
      roles: [],
      companyRoles: [],
      substitutionsAsSubstitute: [],
      emergencyAccesses: [],
    });
    await expect(
      service.resolve({ actorId: 'actor', activeCompanyId: null, sessionId: 'session' }, 'trace'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('distinguishes a missing user', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      service.resolve({ actorId: 'missing', activeCompanyId: null, sessionId: 'session' }, 'trace'),
    ).rejects.toMatchObject({ response: { code: 'USER_NOT_FOUND' } });
  });

  it('hides a company when its active assignment cannot be resolved', async () => {
    findUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [],
      companyRoles: [],
      substitutionsAsSubstitute: [],
      emergencyAccesses: [],
    });
    await expect(
      service.resolve(
        { actorId: 'actor', activeCompanyId: 'company-b', sessionId: 'session' },
        'trace',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
