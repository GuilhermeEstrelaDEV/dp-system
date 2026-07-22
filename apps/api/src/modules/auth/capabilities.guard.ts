import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestWithContext } from '../../common/http/request-context';
import { REQUIRED_CAPABILITIES } from './auth.decorators';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<readonly string[]>(REQUIRED_CAPABILITIES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return false;
    const principal = context.switchToHttp().getRequest<RequestWithContext>().principal;
    if (!principal) return false;
    required.forEach((capability) => this.authorization.requireCapability(principal, capability));
    return true;
  }
}
