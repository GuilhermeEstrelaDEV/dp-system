import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { RequestWithContext } from '../../common/http/request-context';
import { ActiveCompanyResolverService } from './active-company-resolver.service';
import { EnterpriseScopeFactory } from './enterprise-scope';

@Injectable()
export class ActiveCompanyGuard implements CanActivate {
  constructor(
    private readonly companies: ActiveCompanyResolverService,
    private readonly scopes: EnterpriseScopeFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const principal = request.principal;
    if (!principal?.activeCompanyId) {
      throw new ForbiddenException({
        code: 'ACTIVE_COMPANY_REQUIRED',
        message: 'Empresa ativa obrigatória',
      });
    }
    request.activeCompanyContext = await this.companies.resolve(principal, [
      { source: 'SESSION_TOKEN', value: principal.activeCompanyId },
    ]);
    request.enterpriseScope = this.scopes.create(request.activeCompanyContext, principal);
    return true;
  }
}
