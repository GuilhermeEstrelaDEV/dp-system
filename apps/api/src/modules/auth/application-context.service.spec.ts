import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { ApplicationContextService } from './application-context.service';

describe('ApplicationContextService', () => {
  const findFirst = jest.fn();
  const service = new ApplicationContextService({
    user: { findFirst },
  } as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('propagates actor, company, session, trace and effective permissions', async () => {
    findFirst.mockResolvedValue({
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
    });
  });

  it('rejects inactive users', async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      service.resolve({ actorId: 'actor', activeCompanyId: null, sessionId: 'session' }, 'trace'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('hides a company when its active assignment cannot be resolved', async () => {
    findFirst.mockResolvedValue({ roles: [], companyRoles: [] });
    await expect(
      service.resolve(
        { actorId: 'actor', activeCompanyId: 'company-b', sessionId: 'session' },
        'trace',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
