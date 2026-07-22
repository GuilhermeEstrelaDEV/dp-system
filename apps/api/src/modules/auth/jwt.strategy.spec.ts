import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

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

  it.each(['invalid', 'expired'])('rejects an %s token', async () => {
    verifyAsync.mockRejectedValue(new Error('JWT detail'));
    await expect(strategy.authenticate('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
