import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestWithContext } from '../../common/http/request-context';
import { REQUIRED_CAPABILITIES } from './auth.decorators';
import { AuthorizationService } from './authorization.service';
import { AuditWriterService } from './audit-writer.service';

@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
    private readonly audit: AuditWriterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<readonly string[]>(REQUIRED_CAPABILITIES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return false;
    const principal = context.switchToHttp().getRequest<RequestWithContext>().principal;
    if (!principal) return false;
    required.forEach((capability) => this.authorization.requireCapability(principal, capability));
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
