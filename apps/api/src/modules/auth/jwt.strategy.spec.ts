import type { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { IdentityAuthenticationException } from './identity-authentication.errors';

describe('JwtStrategy', () => {
  const verifyAsync = jest.fn();
  const strategy = new JwtStrategy({ verifyAsync } as unknown as JwtService);

  beforeEach(() => jest.clearAllMocks());

  it('maps valid claims to a token identity', async () => {
    verifyAsync.mockResolvedValue({ sub: 'actor', sid: 'session', activeCompanyId: 'company' });
    await expect(strategy.authenticate('valid')).resolves.toEqual({
      actorId: 'actor',
      activeCompanyId: 'company',
      sessionId: 'session',
    });
  });

  it('rejects an invalid token with a stable code', async () => {
    verifyAsync.mockRejectedValue(new Error('JWT detail'));
    await expect(strategy.authenticate('token')).rejects.toMatchObject({
      response: { code: 'TOKEN_INVALID' },
    });
  });

  it('distinguishes an expired token', async () => {
    const error = new Error('expired');
    error.name = 'TokenExpiredError';
    verifyAsync.mockRejectedValue(error);
    await expect(strategy.authenticate('token')).rejects.toMatchObject({
      response: { code: 'TOKEN_EXPIRED' },
    });
  });

  it('rejects missing required claims', async () => {
    verifyAsync.mockResolvedValue({ sub: 'actor' });
    await expect(strategy.authenticate('token')).rejects.toBeInstanceOf(
      IdentityAuthenticationException,
    );
  });
});
