import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { RequestWithContext } from '../../common/http/request-context';
import { ApplicationContextService } from './application-context.service';
import { JwtStrategy } from './jwt.strategy';
import { ActiveCompanyResolverService } from './active-company-resolver.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly strategy: JwtStrategy,
    private readonly contexts: ApplicationContextService,
    private readonly activeCompanies: ActiveCompanyResolverService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const authorization = request.header('authorization');
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Token ausente');
    const identity = await this.strategy.authenticate(token);
    if (identity.activeCompanyId) {
      request.activeCompanyContext = await this.activeCompanies.resolve(
        { actorId: identity.actorId },
        [{ source: 'SESSION_TOKEN', value: identity.activeCompanyId }],
      );
    }
    request.principal = await this.contexts.resolve(
      identity,
      request.correlationId ?? 'missing-trace-id',
      request.ip || request.socket.remoteAddress || 'unknown',
      request.header('user-agent') ?? null,
    );
    return true;
  }
}
