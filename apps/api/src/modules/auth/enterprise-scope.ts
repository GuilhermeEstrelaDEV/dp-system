import { Injectable } from '@nestjs/common';
import type { ActiveCompanyContext } from './active-company-context';
import { isCanonicalActiveCompanyContext } from './active-company-context';
import type { AuthenticatedPrincipal } from './identity-context';

export class EnterpriseScope {
  private constructor(
    readonly companyId: string,
    readonly actorId: string,
    readonly sessionId: string,
    readonly traceId: string,
    readonly assignmentIds: readonly string[],
  ) {
    Object.freeze(this.assignmentIds);
    Object.freeze(this);
  }

  static fromApplicationContext(
    context: ActiveCompanyContext,
    principal: AuthenticatedPrincipal,
  ): EnterpriseScope {
    if (!isCanonicalActiveCompanyContext(context)) {
      throw new Error('Enterprise scope requires a canonical active company context');
    }
    if (
      !principal.activeCompanyId ||
      context.companyId !== principal.activeCompanyId ||
      context.userId !== principal.actorId
    ) {
      throw new Error('Enterprise scope does not match the authenticated principal');
    }
    return new EnterpriseScope(
      context.companyId,
      principal.actorId,
      principal.sessionId,
      principal.traceId,
      Object.freeze([...context.assignmentIds]),
    );
  }
}

@Injectable()
export class EnterpriseScopeFactory {
  create(context: ActiveCompanyContext, principal: AuthenticatedPrincipal): EnterpriseScope {
    return EnterpriseScope.fromApplicationContext(context, principal);
  }
}
