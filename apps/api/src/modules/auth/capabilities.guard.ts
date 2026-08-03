import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestWithContext } from '../../common/http/request-context';
import { AuthorizationService } from './authorization.service';
import { CapabilityCatalogService } from './capability-catalog.service';
import { ROUTE_ACCESS_POLICY, type RouteAccessPolicy } from './route-access-policy';

@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
    private readonly catalog: CapabilityCatalogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<RouteAccessPolicy>(ROUTE_ACCESS_POLICY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const required = policy?.requiredCapabilities;
    if (policy?.classification !== 'CAPABILITY_PROTECTED' || !required?.length) return false;
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const principal = request.principal;
    if (!principal) return false;
    for (const capability of required) {
      let catalogEntry;
      try {
        catalogEntry = await this.catalog.requireActive(capability);
      } catch {
        throw new InternalServerErrorException({
          code: 'CAPABILITY_NOT_IN_CATALOG',
          message: 'Authorization policy is invalid',
        });
      }
      if (catalogEntry.scope !== 'COMPANY') {
        throw new InternalServerErrorException({
          code: 'CAPABILITY_SCOPE_INVALID',
          message: 'Authorization policy is invalid',
        });
      }
      this.authorization.requireCapability(principal, capability);
    }
    request.authorizationDecision = this.authorization.requireCapabilities(principal, required);
    return true;
  }
}
