import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenPayload } from './auth.service';
import { IdentityAuthenticationException } from './identity-authentication.errors';
import type { TokenIdentity } from './identity-context';

@Injectable()
export class JwtStrategy {
  constructor(private readonly jwt: JwtService) {}

  async authenticate(token: string): Promise<TokenIdentity> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      if (!payload.sub || !payload.sid) {
        throw new IdentityAuthenticationException('TOKEN_INVALID');
      }
      return {
        actorId: payload.sub,
        activeCompanyId: payload.activeCompanyId ?? null,
        sessionId: payload.sid,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new IdentityAuthenticationException('TOKEN_EXPIRED');
      }
      throw new IdentityAuthenticationException('TOKEN_INVALID');
    }
  }
}
