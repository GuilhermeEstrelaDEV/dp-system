import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { PasswordHasherService } from './password-hasher.service';

describe('AuthService', () => {
  const userFindUnique = jest.fn();
  const assignmentsFindMany = jest.fn();
  const signAsync = jest.fn().mockResolvedValue('token');
  const verify = jest.fn();
  const service = new AuthService(
    {
      user: { findUnique: userFindUnique },
      userCompanyRole: { findMany: assignmentsFindMany },
    } as unknown as PrismaService,
    { signAsync } as unknown as JwtService,
    { verify } as unknown as PasswordHasherService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('logs in an active user with a valid password', async () => {
    userFindUnique.mockResolvedValue({ id: 'user-1', status: 'ACTIVE', passwordHash: 'hash' });
    verify.mockResolvedValue(true);
    await expect(service.login('USER@example.com', 'correct-password')).resolves.toEqual({
      accessToken: 'token',
      tokenType: 'Bearer',
      actorId: 'user-1',
      sessionId: expect.any(String),
    });
    expect(userFindUnique).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
  });

  it.each([
    ['unknown user', null],
    ['inactive user', { id: 'user-1', status: 'INACTIVE', passwordHash: 'hash' }],
  ])('rejects %s', async (_case, user) => {
    userFindUnique.mockResolvedValue(user);
    await expect(service.login('user@example.com', 'correct-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an incorrect password', async () => {
    userFindUnique.mockResolvedValue({ id: 'user-1', status: 'ACTIVE', passwordHash: 'hash' });
    verify.mockResolvedValue(false);
    await expect(service.login('user@example.com', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('deduplicates accessible companies from active assignments', async () => {
    const company = { id: 'company-a', legalName: 'A', tradeName: 'A' };
    assignmentsFindMany.mockResolvedValue([{ company }, { company }]);
    await expect(service.listCompanies('user-1')).resolves.toEqual([company]);
  });

  it('selects only an accessible company and keeps the session', async () => {
    assignmentsFindMany.mockResolvedValue([
      { company: { id: 'company-a', legalName: 'A', tradeName: 'A' } },
    ]);
    await service.selectCompany(
      {
        actorId: 'user-1',
        activeCompanyId: null,
        permissions: [],
        traceId: 'trace',
        sessionId: 'session-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        accessGrants: [],
      },
      'company-a',
    );
    expect(signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user-1', activeCompanyId: 'company-a', sid: 'session-1' }),
    );
  });

  it('hides an unlinked or inactive company as not found', async () => {
    assignmentsFindMany.mockResolvedValue([]);
    await expect(
      service.selectCompany(
        {
          actorId: 'user-1',
          activeCompanyId: null,
          permissions: [],
          traceId: 'trace',
          sessionId: 'session-1',
          ipAddress: '127.0.0.1',
          userAgent: 'test',
          accessGrants: [],
        },
        'company-b',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
