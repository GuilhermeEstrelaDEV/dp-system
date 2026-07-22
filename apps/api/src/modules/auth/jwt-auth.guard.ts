import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { RequestWithContext } from '../../common/http/request-context';
import { ApplicationContextService } from './application-context.service';
import { JwtStrategy } from './jwt.strategy';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly strategy: JwtStrategy,
    private readonly contexts: ApplicationContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const authorization = request.header('authorization');
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Token ausente');
    const identity = await this.strategy.authenticate(token);
    request.principal = await this.contexts.resolve(
      identity,
      request.correlationId ?? 'missing-trace-id',
      request.ip || request.socket.remoteAddress || 'unknown',
      request.header('user-agent') ?? null,
    );
    return true;
  }
}
