import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenPayload } from './auth.service';

export interface JwtIdentity {
  actorId: string;
  activeCompanyId: string | null;
  sessionId: string;
}

@Injectable()
export class JwtStrategy {
  constructor(private readonly jwt: JwtService) {}

  async authenticate(token: string): Promise<JwtIdentity> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      if (!payload.sub || !payload.sid) throw new UnauthorizedException('Token inválido');
      return {
        actorId: payload.sub,
        activeCompanyId: payload.activeCompanyId ?? null,
        sessionId: payload.sid,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token inválido');
    }
  }
}
