import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestWithContext } from '../../common/http/request-context';
import { AuthorizationService } from './authorization.service';
import { AuditWriterService } from './audit-writer.service';
import { CapabilityCatalogService } from './capability-catalog.service';
import { ROUTE_ACCESS_POLICY, type RouteAccessPolicy } from './route-access-policy';

@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
    private readonly audit: AuditWriterService,
    private readonly catalog: CapabilityCatalogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<RouteAccessPolicy>(ROUTE_ACCESS_POLICY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const required = policy?.requiredCapabilities;
    if (policy?.classification !== 'CAPABILITY_PROTECTED' || !required?.length) return false;
    const principal = context.switchToHttp().getRequest<RequestWithContext>().principal;
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
    for (const grant of principal.accessGrants) {
      const used = required.filter((capability) => grant.capabilities.includes(capability));
      if (used.length) {
        await this.audit.append({
          principal,
          action: 'ACCESS_GRANT_USED',
          entityType: grant.type === 'SUBSTITUTION' ? 'TemporarySubstitution' : 'EmergencyAccess',
          entityId: grant.id,
          metadata: { capabilities: used, grantType: grant.type },
        });
      }
    }
    return true;
  }
}
