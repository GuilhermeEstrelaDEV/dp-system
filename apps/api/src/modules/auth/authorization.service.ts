import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../common/http/request-context';

@Injectable()
export class AuthorizationService {
  requireCapability(principal: AuthenticatedPrincipal, capability: string): void {
    if (!principal.activeCompanyId || !principal.permissions.includes(capability)) {
      throw new ForbiddenException('Acesso negado');
    }
  }

  assertCompanyScope(principal: AuthenticatedPrincipal, resourceCompanyId: string): void {
    if (!principal.activeCompanyId || principal.activeCompanyId !== resourceCompanyId) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }
}
