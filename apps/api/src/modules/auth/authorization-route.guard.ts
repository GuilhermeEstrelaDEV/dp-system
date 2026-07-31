import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { ActiveCompanyGuard } from './active-company.guard';
import { CapabilitiesGuard } from './capabilities.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  isRouteAccessPolicy,
  ROUTE_ACCESS_POLICY,
  type RouteAccessPolicy,
} from './route-access-policy';
import {
  LEGACY_DEFERRED_HANDLER_ALLOWLIST,
  PUBLIC_ROUTE_HANDLER_ALLOWLIST,
  routeHandlerId,
} from './route-compatibility.manifest';

@Injectable()
export class AuthorizationRouteGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identity: JwtAuthGuard,
    private readonly activeCompany: ActiveCompanyGuard,
    private readonly capabilities: CapabilitiesGuard,
    private readonly logger: AppLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const id = routeHandlerId(context.getClass(), context.getHandler());
    const policy = this.reflector.getAllAndOverride<unknown>(ROUTE_ACCESS_POLICY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (policy === undefined) {
      if (LEGACY_DEFERRED_HANDLER_ALLOWLIST.has(id)) return true;
      this.logger.warn('Unclassified route denied', 'AuthorizationRouteGuard', {
        handler: id,
        classification: 'BLOCKED_UNCLASSIFIED',
      });
      throw new ForbiddenException({
        code: 'ROUTE_ACCESS_DENIED',
        message: 'Acesso negado',
      });
    }

    if (!isRouteAccessPolicy(policy)) {
      this.logger.error('Invalid route access policy', undefined, { handler: id });
      throw new InternalServerErrorException({
        code: 'AUTHORIZATION_POLICY_INVALID',
        message: 'Authorization policy is invalid',
      });
    }

    this.assertPolicyConsistency(id, policy);
    if (policy.classification === 'PUBLIC_EXPLICIT') return true;

    await this.identity.canActivate(context);
    if (policy.requireActiveCompany) await this.activeCompany.canActivate(context);
    if (policy.classification === 'CAPABILITY_PROTECTED') {
      await this.capabilities.canActivate(context);
    }
    return true;
  }

  private assertPolicyConsistency(id: string, policy: RouteAccessPolicy): void {
    if (
      policy.classification === 'PUBLIC_EXPLICIT' &&
      (!PUBLIC_ROUTE_HANDLER_ALLOWLIST.has(id) ||
        policy.requireActiveCompany ||
        policy.requiredCapabilities.length > 0)
    ) {
      throw new InternalServerErrorException({
        code: 'PUBLIC_ROUTE_NOT_ALLOWLISTED',
        message: 'Authorization policy is invalid',
      });
    }
    if (
      policy.classification === 'CAPABILITY_PROTECTED' &&
      (!policy.requireActiveCompany || policy.requiredCapabilities.length === 0)
    ) {
      throw new InternalServerErrorException({
        code: 'CAPABILITY_POLICY_INVALID',
        message: 'Authorization policy is invalid',
      });
    }
    if (
      policy.classification !== 'CAPABILITY_PROTECTED' &&
      policy.requiredCapabilities.length > 0
    ) {
      throw new InternalServerErrorException({
        code: 'AUTHORIZATION_POLICY_CONFLICT',
        message: 'Authorization policy is invalid',
      });
    }
  }
}
