import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';
import {
  resolveEffectiveAuthorizationContext,
  type EffectiveAuthorizationContext,
} from './effective-authorization-context';

@Injectable()
export class AuthorizationService {
  requireCapability(
    principal: AuthenticatedPrincipal,
    capability: string,
  ): EffectiveAuthorizationContext {
    if (!principal.activeCompanyId || !principal.permissions.includes(capability)) {
      throw new ForbiddenException('Acesso negado');
    }
    return resolveEffectiveAuthorizationContext(principal, [capability]);
  }

  requireCapabilities(
    principal: AuthenticatedPrincipal,
    capabilities: readonly string[],
  ): EffectiveAuthorizationContext {
    return resolveEffectiveAuthorizationContext(principal, capabilities);
  }

  assertCompanyScope(principal: AuthenticatedPrincipal, resourceCompanyId: string): void {
    if (!principal.activeCompanyId || principal.activeCompanyId !== resourceCompanyId) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }
}
