import { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../../prisma/prisma.service';
import { ApplicationContextService } from './application-context.service';
import { IdentitySessionService } from './identity-session.service';
import { JwtStrategy } from './jwt.strategy';

describe('identity context integration', () => {
  const secret = 'identity-context-integration-secret-32-chars';
  const jwt = new JwtService({ secret, signOptions: { expiresIn: '15m' } });
  const sessionFindUnique = jest.fn();
  const userFindUnique = jest.fn();
  const sessions = new IdentitySessionService({
    refreshToken: { findUnique: sessionFindUnique },
  } as unknown as PrismaService);
  const contexts = new ApplicationContextService(
    { user: { findUnique: userFindUnique } } as unknown as PrismaService,
    sessions,
  );
  const strategy = new JwtStrategy(jwt);

  beforeEach(() => jest.clearAllMocks());

  it('resolves a valid JWT, active session and active user into one principal', async () => {
    sessionFindUnique.mockResolvedValue({
      userId: 'user-1',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    userFindUnique.mockResolvedValue({
      status: 'ACTIVE',
      roles: [],
      companyRoles: [],
      substitutionsAsSubstitute: [],
      emergencyAccesses: [],
    });
    const token = await jwt.signAsync({ sub: 'user-1', sid: 'session-1' });
    const identity = await strategy.authenticate(token);
    await expect(contexts.resolve(identity, 'trace-1')).resolves.toMatchObject({
      actorId: 'user-1',
      sessionId: 'session-1',
      traceId: 'trace-1',
    });
  });

  it('rejects a revoked session before resolving the user', async () => {
    sessionFindUnique.mockResolvedValue({
      userId: 'user-1',
      status: 'REVOKED',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });
    const token = await jwt.signAsync({ sub: 'user-1', sid: 'session-1' });
    const identity = await strategy.authenticate(token);
    await expect(contexts.resolve(identity, 'trace-1')).rejects.toMatchObject({
      response: { code: 'SESSION_REVOKED' },
    });
    expect(userFindUnique).not.toHaveBeenCalled();
  });
});
